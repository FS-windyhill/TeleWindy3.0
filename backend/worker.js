const DEFAULT_JOB_TTL_HOURS = 6;
const MIN_JOB_TTL_HOURS = 0.25;
const MAX_JOB_TTL_HOURS = 24;
// ★ 上游模型请求超时：
// 视觉模型和主聊天模型各自最多等待 200 秒，避免某个服务商连接挂住后 job 永远卡在 running。
const UPSTREAM_TIMEOUT_MS = 200 * 1000;
// ★ 后台识图会把本次图片 base64 一起交给 Worker：
// 1. base64 会比原图大约膨胀 1/3；
// 2. Queue 版会把本次 payload 临时写进 KV，KV 单值上限是 25MiB；
// 3. 所以这里把“单次 job 请求体”限制在 20MiB，给 JSON 包装和事件字段留余量。
const MAX_BODY_BYTES = 20 * 1024 * 1024;
// ★ payload 里可能临时包含 client_key 模式传来的模型 Key。
// 正常执行结束会立刻删除；如果 consumer 被平台中断，最多也只保留 1 小时。
const MAX_PAYLOAD_TTL_SECONDS = 60 * 60;
const CUSTOM_PROVIDER_SLOTS = ["CUSTOM1", "CUSTOM2", "CUSTOM3"];

export class ChatJobObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/init") {
      const body = await request.json();
      const job = body.job && typeof body.job === "object" ? body.job : {};
      await this.state.storage.put("job", job);
      await this.setExpiryAlarm(job.ttlSeconds);
      return Response.json(job);
    }

    if (request.method === "GET" && url.pathname === "/job") {
      const job = await this.state.storage.get("job");
      return job ? Response.json(job) : Response.json({ error: "not_found" }, { status: 404 });
    }

    if (request.method === "POST" && url.pathname === "/patch") {
      const body = await request.json();
      const current = await this.state.storage.get("job") || {};
      const events = Array.isArray(current.events) ? current.events.slice(-39) : [];
      const nextJob = body.nextJob && typeof body.nextJob === "object" ? body.nextJob : {};
      const event = body.event && typeof body.event === "object" ? body.event : null;
      const job = {
        ...current,
        ...nextJob,
        events: event ? [...events, event] : events
      };
      await this.state.storage.put("job", job);
      await this.setExpiryAlarm(job.ttlSeconds);
      return Response.json(job);
    }

    if (request.method === "POST" && url.pathname === "/delete") {
      await this.state.storage.delete("job");
      await this.state.storage.deleteAlarm();
      return Response.json({ ok: true });
    }

    return Response.json({ error: "not_found" }, { status: 404 });
  }

  async alarm() {
    await this.state.storage.delete("job");
  }

  async setExpiryAlarm(ttlSeconds) {
    const seconds = Number(ttlSeconds || 0);
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    await this.state.storage.setAlarm(Date.now() + seconds * 1000);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      console.log("cors_preflight", {
        origin: request.headers.get("origin") || ""
      });
      return withCors(new Response(null, { status: 204 }), request, env);
    }

    if (!isAllowedOrigin(request, env)) {
      console.warn("forbidden_origin", {
        origin: request.headers.get("origin") || "",
        path: url.pathname
      });
      return json({ error: "forbidden_origin" }, 403, request, env);
    }

    if (!isAuthorized(request, env)) {
      console.warn("unauthorized_request", {
        method: request.method,
        path: url.pathname
      });
      return json({ error: "unauthorized" }, 401, request, env);
    }

    try {
      if (request.method === "POST" && url.pathname === "/jobs") {
        return await createJob(request, env);
      }

      const jobMatch = url.pathname.match(/^\/jobs\/([a-f0-9-]{36})$/i);
      if (jobMatch && request.method === "GET") {
        return await getJob(jobMatch[1], request, env);
      }

      if (jobMatch && request.method === "DELETE") {
        return await deleteJob(jobMatch[1], request, env);
      }

      return json({ error: "not_found" }, 404, request, env);
    } catch (error) {
      console.error("worker_internal_error", {
        method: request.method,
        path: url.pathname,
        error: error?.message || String(error)
      });
      return json({ error: "internal_error" }, 500, request, env);
    }
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      await consumeQueuedJob(message, env);
      message.ack?.();
    }
  }
};

async function createJob(request, env) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    console.warn("job_request_too_large", {
      contentLength,
      maxBodyBytes: MAX_BODY_BYTES
    });
    return json({
      error: "request_too_large",
      content_length: contentLength,
      max_body_bytes: MAX_BODY_BYTES
    }, 413, request, env);
  }

  const payload = await request.json();
  const authMode = sanitizeAuthMode(payload.auth_mode);
  const upstream = resolveUpstream(payload.api_url, payload.api_key, authMode, env);
  if (!upstream.ok) {
    console.warn("job_upstream_not_configured", {
      apiUrl: sanitizeLogText(payload.api_url),
      authMode,
      providerId: upstream.providerId || "",
      reason: upstream.error
    });
    return json({
      error: upstream.error,
      provider: upstream.providerId || null
    }, 400, request, env);
  }

  const model = sanitizeModel(payload.model || env.DEFAULT_MODEL);
  const allowedModels = getAllowedModels(env);
  if (allowedModels && !allowedModels.has(model)) {
    console.warn("job_model_not_allowed", { model });
    return json({ error: "model_not_allowed" }, 400, request, env);
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    console.warn("job_messages_required", {
      messagesType: typeof payload.messages
    });
    return json({ error: "messages_required" }, 400, request, env);
  }

  const messages = sanitizeMessages(payload.messages);
  const requestBodyExtra = sanitizeRequestBodyExtra(payload.request_body_extra);
  const vision = sanitizeVisionPayload(payload.vision, authMode);
  const agent = sanitizeAgentPayload(payload.agent, authMode);
  const agentModelForAllowList = agent?.todoManager ? sanitizeModel(agent.todoManager.model || env.DEFAULT_MODEL) : "";
  if (allowedModels && agentModelForAllowList && !allowedModels.has(agentModelForAllowList)) {
    console.warn("job_agent_model_not_allowed", { model: agentModelForAllowList });
    return json({ error: "agent_model_not_allowed" }, 400, request, env);
  }
  if (requestBodyExtra === null) {
    console.warn("job_request_body_extra_invalid", {
      extraType: typeof payload.request_body_extra
    });
    return json({ error: "request_body_extra_invalid" }, 400, request, env);
  }

  const ttlSeconds = sanitizeTtlSeconds(payload.ttl_hours);
  const jobId = crypto.randomUUID();
  console.log("job_create", {
    jobId: shortJobId(jobId),
    provider: upstream.provider.id,
    authMode,
    model,
    messageCount: messages.length,
    hasVision: !!vision,
    requestBodyExtraKeys: Object.keys(requestBodyExtra),
    hasAgent: !!agent?.todoManager,
    ttlSeconds,
    contentLength
  });

  const createEvent = buildJobEvent("job_create", {
    provider: upstream.provider.id,
    authMode,
    model,
    messageCount: messages.length,
    hasVision: !!vision,
    requestBodyExtraKeys: Object.keys(requestBodyExtra),
    hasAgent: !!agent?.todoManager,
    ttlSeconds,
    contentLength
  });

  await initJobState(jobId, env, {
    status: "running",
    agent_status: agent?.todoManager ? "pending" : "disabled",
    agent_actions: [],
    agent_prompt: "",
    agent_error: "",
    createdAt: Date.now(),
    ttlSeconds,
    events: [createEvent]
  });

  const jobPayload = {
    upstream: upstream.provider,
    messages,
    model,
    temperature: clampNumber(payload.temperature, 0, 2, 1),
    max_tokens: clampInteger(payload.max_tokens, 1, 8192, 2048),
    request_body_extra: requestBodyExtra,
    vision,
    agent,
    dynamicContextInsertMode: sanitizeDynamicContextInsertMode(payload.dynamic_context_insert_mode),
    requestUserMessageIndex: clampInteger(payload.request_user_message_index, -1, 100000, -1),
    ttlSeconds
  };

  const payloadTtlSeconds = getPayloadTtlSeconds(ttlSeconds);
  await env.CHAT_JOBS.put(payloadKey(jobId), JSON.stringify(jobPayload), {
    expirationTtl: payloadTtlSeconds
  });
  await appendJobEvent(jobId, env, "job_payload_store", {
    payloadTtlSeconds
  }, ttlSeconds);

  try {
    if (!env.CHAT_JOB_QUEUE || typeof env.CHAT_JOB_QUEUE.send !== "function") {
      throw new Error("chat_job_queue_missing");
    }
    await env.CHAT_JOB_QUEUE.send({ jobId });
    await appendJobEvent(jobId, env, "job_enqueue", {}, ttlSeconds);
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("job_queue_send_error", {
      jobId: shortJobId(jobId),
      error: errorMessage
    });
    const job = await buildJobWithEvent(jobId, env, {
      status: "failed",
      error: "job_queue_send_error",
      finishedAt: Date.now()
    }, "job_queue_send_error", {
      error: sanitizeLogText(errorMessage)
    });
    await deleteJobPayload(jobId, env, ttlSeconds);
    return json({ error: "job_queue_send_error", jobId }, 500, request, env);
  }

  const job = await readJobState(jobId, env);
  return json({ jobId, status: "running", ttlSeconds, events: job?.events || [createEvent] }, 202, request, env);
}

async function getJob(jobId, request, env) {
  const job = await readJobState(jobId, env);
  if (!job) {
    console.log("job_get_not_found", { jobId: shortJobId(jobId) });
    return json({ error: "not_found" }, 404, request, env);
  }

  console.log("job_get", {
    jobId: shortJobId(jobId),
    status: job.status
  });
  return json(job, 200, request, env);
}

async function deleteJob(jobId, request, env) {
  await deleteJobState(jobId, env);
  await env.CHAT_JOBS.delete(payloadKey(jobId));
  console.log("job_delete", { jobId: shortJobId(jobId) });
  return json({ ok: true }, 200, request, env);
}

// ★★★★★ Queue 后台长任务 START ★★★★★
// Queue 消息只保存 jobId，完整请求体临时放在 job_payload:<jobId>。
// 这样可以绕开 waitUntil() 的 30 秒后台续跑限制，同时避开 Queue 128KB 消息体上限。
// 无论模型成功还是失败，finally 都会尽量删除 payload，减少 client_key 模式下模型 Key 的停留时间。
async function consumeQueuedJob(message, env) {
  const jobId = message?.body?.jobId;
  if (!jobId) {
    console.warn("job_consume_error", {
      error: "job_id_missing"
    });
    return;
  }

  console.log("job_consume_start", { jobId: shortJobId(jobId) });
  let ttlSeconds = DEFAULT_JOB_TTL_HOURS * 3600;

  try {
    const currentJob = await readJobState(jobId, env);
    ttlSeconds = Number(currentJob?.ttlSeconds || ttlSeconds);
    await appendJobEvent(jobId, env, "job_consume_start", {}, ttlSeconds);

    const payload = await env.CHAT_JOBS.get(payloadKey(jobId), "json");
    if (!payload) {
      console.warn("job_payload_missing", { jobId: shortJobId(jobId) });
      const job = await buildJobWithEvent(jobId, env, {
        status: "failed",
        error: "job_payload_missing",
        finishedAt: Date.now()
      }, "job_payload_missing", {});
      return;
    }

    await runJob(jobId, payload, env);
    const afterRunJob = await readJobState(jobId, env);
    await appendJobEvent(jobId, env, "job_consume_done", {
      status: afterRunJob?.status || ""
    }, ttlSeconds);
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("job_consume_error", {
      jobId: shortJobId(jobId),
      error: errorMessage
    });
    const job = await buildJobWithEvent(jobId, env, {
      status: "failed",
      error: "job_consume_error",
      finishedAt: Date.now()
    }, "job_consume_error", {
      error: sanitizeLogText(errorMessage)
    });
  } finally {
    await deleteJobPayload(jobId, env, ttlSeconds);
  }
}
// ★★★★★ Queue 后台长任务 END ★★★★★

async function runJob(jobId, body, env) {
  try {
    await appendJobEvent(jobId, env, "job_run_start", {
      provider: body.upstream.id,
      authMode: body.upstream.authMode,
      model: body.model,
      messageCount: body.messages.length,
      hasVision: !!body.vision,
      requestBodyExtraKeys: Object.keys(body.request_body_extra || {}),
      ttlSeconds: body.ttlSeconds
    }, body.ttlSeconds);

    console.log("job_run_start", {
      jobId: shortJobId(jobId),
      provider: body.upstream.id,
      authMode: body.upstream.authMode,
      model: body.model,
      messageCount: body.messages.length,
      hasVision: !!body.vision,
      requestBodyExtraKeys: Object.keys(body.request_body_extra || {}),
      ttlSeconds: body.ttlSeconds
    });

    let imageDescription = null;
    let agentActions = [];
    let agentPrompt = "";
    let agentStatus = body.agent?.todoManager ? "pending" : "disabled";
    let messagesForChat = body.messages;
    if (body.vision) {
      imageDescription = await analyzeVisionImage(body.vision, env, jobId, body.ttlSeconds);
      messagesForChat = injectImageDescription(body.messages, imageDescription);
    }

    if (body.agent?.todoManager) {
      // ★ 后台 Agent 分段状态：
      // TODO 管理跑完后先把 action 写进 job，让前端不用等主模型回复就能同步执行。
      await buildJobWithEvent(jobId, env, {
        agent_status: "running",
        agent_actions: [],
        agent_startedAt: Date.now()
      }, "agent_todo_stage_start", {
        model: body.agent.todoManager.model || ""
      });

      const agentResult = await runTodoManagerAgent(body.agent.todoManager, env, jobId, body.ttlSeconds);
      agentPrompt = agentResult.prompt || "";
      if (agentResult.prompt) {
        messagesForChat = injectVolatilePrompt(
          messagesForChat,
          agentResult.prompt,
          body.dynamicContextInsertMode,
          body.requestUserMessageIndex
        );
      }
      agentActions = agentResult.actions || [];
      agentStatus = agentResult.failed ? "failed" : "done";

      await buildJobWithEvent(jobId, env, {
        agent_status: agentStatus,
        agent_actions: agentActions,
        agent_prompt: agentPrompt,
        agent_error: agentResult.failed ? sanitizeLogText(agentResult.error || "") : "",
        agent_finishedAt: Date.now()
      }, agentResult.failed ? "agent_todo_stage_failed" : "agent_todo_stage_done", {
        intent: agentResult.intent || "",
        actionCount: agentActions.length,
        hasPrompt: !!agentResult.prompt,
        error: agentResult.failed ? sanitizeLogText(agentResult.error || "") : ""
      });
    }

    const upstreamBody = {
      model: body.model,
      messages: messagesForChat,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      ...(body.request_body_extra || {}),
      stream: false
    };

    const response = await fetchWithTimeout(body.upstream.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${body.upstream.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(upstreamBody)
    }, UPSTREAM_TIMEOUT_MS, "chat_upstream");

    if (!response.ok) {
      // ★★★★★ 上游错误原文回传 START ★★★★★
      // 前端需要看到一小段真实错误，才能判断是不是“后置 system 不兼容”，并提示切换 user 兼容模式。
      const upstreamErrorText = sanitizeLogText(await response.text());
      const upstreamError = upstreamErrorText
        ? `upstream_${response.status}: ${upstreamErrorText}`
        : `upstream_${response.status}`;
      console.warn("job_upstream_failed", {
        jobId: shortJobId(jobId),
        provider: body.upstream.id,
        status: response.status,
        error: upstreamErrorText
      });
      const job = await buildJobWithEvent(jobId, env, {
        status: "failed",
        error: upstreamError,
        finishedAt: Date.now()
      }, "job_upstream_failed", {
        provider: body.upstream.id,
        status: response.status,
        error: upstreamErrorText
      });
      // ★★★★★ 上游错误原文回传 END ★★★★★
      return;
    }

    const data = await response.json();
    const content = extractAssistantContent(data);
    console.log("job_run_done", {
      jobId: shortJobId(jobId),
      resultLength: content.trim().length,
      hasUsage: !!data.usage
    });

    const job = await buildJobWithEvent(jobId, env, {
      status: "done",
      result: content.trim(),
      image_description: imageDescription,
      agent_status: agentStatus,
      agent_actions: agentActions,
      agent_prompt: agentPrompt,
      usage: data.usage || null,
      finishedAt: Date.now()
    }, "job_run_done", {
      resultLength: content.trim().length,
      hasUsage: !!data.usage
    });
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("job_run_error", {
      jobId: shortJobId(jobId),
      error: errorMessage
    });
    const job = await buildJobWithEvent(jobId, env, {
      status: "failed",
      error: errorMessage.includes("chat_upstream_timeout")
        ? "chat_upstream_timeout"
        : "network_or_worker_error",
      finishedAt: Date.now()
    }, "job_run_error", {
      error: sanitizeLogText(errorMessage)
    });
  }
}

// ★★★★★ 后台识图 START ★★★★★
// 这一组函数只负责“先看图，再把图片描述塞回聊天上下文”：
// 1. 原图 base64 只在本次 Worker 运行里临时使用；
// 2. 视觉 Key 也只临时使用，不写入 KV；
// 3. KV 最终只保存 image_description 文本，方便前端补回历史记录。
async function analyzeVisionImage(vision, env, jobId, ttlSeconds) {
  try {
    if (!vision.url) throw new Error("vision_url_missing");
    if (!vision.model) throw new Error("vision_model_missing");

    const upstream = resolveUpstream(vision.url, vision.key, vision.authMode, env);
    if (!upstream.ok) {
      throw new Error(upstream.error || "vision_upstream_not_configured");
    }

    const payload = {
      model: vision.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: vision.prompt || "描述这张图片" },
            { type: "image_url", image_url: { url: vision.image } }
          ]
        }
      ],
      max_tokens: 8190,
      stream: false
    };

    const response = await fetchWithTimeout(upstream.provider.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${upstream.provider.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }, UPSTREAM_TIMEOUT_MS, "vision_upstream");

    if (!response.ok) {
      throw new Error(`vision_upstream_${response.status}`);
    }

    const data = await response.json();
    const description = String(data?.choices?.[0]?.message?.content || "").trim();
    if (!description) throw new Error("vision_empty_description");
    return description;
  } catch (error) {
    console.warn("vision_analyze_failed", {
      error: error?.message || String(error),
      model: vision.model || "",
      authMode: vision.authMode || ""
    });
    if (jobId) {
      await appendJobEvent(jobId, env, "vision_analyze_failed", {
        error: sanitizeLogText(error?.message || String(error)),
        model: vision.model || "",
        authMode: vision.authMode || ""
      }, ttlSeconds);
    }
    return visionFallbackDescription();
  }
}

function injectImageDescription(messages, description) {
  const nextMessages = messages.map((message) => ({ ...message }));
  for (let i = nextMessages.length - 1; i >= 0; i--) {
    if (nextMessages[i].role === "user") {
      nextMessages[i].content = `${nextMessages[i].content || ""}\n\n[System Info: 对方发送了一张图片，图片内容描述: ${description}]`;
      break;
    }
  }
  return nextMessages;
}

function sanitizeVisionPayload(vision, defaultAuthMode) {
  if (!vision || typeof vision !== "object" || Array.isArray(vision)) return null;
  const image = String(vision.image || "").trim();
  if (!image) return null;

  const authMode = sanitizeAuthMode(vision.auth_mode || defaultAuthMode);
  return {
    image,
    url: normalizeUrl(vision.url),
    key: authMode === "server_secret" ? "" : String(vision.key || ""),
    authMode,
    model: sanitizeModel(vision.model || ""),
    prompt: String(vision.prompt || "描述这张图片").slice(0, 4000)
  };
}

function sanitizeDynamicContextInsertMode(value) {
  return ["auto", "system", "user"].includes(value) ? value : "auto";
}

function visionFallbackDescription() {
  return "（系统提示：用户发送了一张图片，但由于未配置视觉模型或网络错误，无法提供图片内容的文本描述。请根据用户的文字上下文进行回复，如果需要，可以礼貌地询问图片内容。）";
}
// ★★★★★ 后台识图 END ★★★★★

// ★★★★★ 后台 Agent：TODO 管理 START ★★★★★
async function runTodoManagerAgent(agent, env, jobId, ttlSeconds) {
  try {
    const model = sanitizeModel(agent.model || env.DEFAULT_MODEL);
    const upstream = resolveUpstream(agent.apiUrl, agent.apiKey, agent.authMode, env);
    if (!upstream.ok) throw new Error(upstream.error || "agent_upstream_not_configured");

    await appendJobEvent(jobId, env, "agent_todo_start", {
      model,
      todoCount: agent.todoSnapshot.length
    }, ttlSeconds);

    // ★★★★★ 后台 Agent：总路由先判定 START ★★★★★
    // Worker 路径也先只发送轻量路由 prompt；NONE 时直接跳过 TODO executor。
    const routerResponse = await fetchWithTimeout(upstream.provider.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${upstream.provider.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: buildAgentRouterMessages(agent),
        ...(agent.requestBodyExtra || {}),
        temperature: 0,
        max_tokens: Math.min(agent.maxTokens || 1200, 180),
        stream: false
      })
    }, UPSTREAM_TIMEOUT_MS, "agent_router_upstream");

    if (!routerResponse.ok) throw new Error(`agent_router_upstream_${routerResponse.status}`);

    const routerData = await routerResponse.json();
    const rawRouteText = extractAssistantContent(routerData);
    const agentRoute = parseAgentRouterResult(rawRouteText);
    if (agentRoute.intent === "NONE" || agentRoute.intent === "ASK_CONFIRMATION") {
      await appendJobEvent(jobId, env, "agent_todo_done", {
        intent: agentRoute.intent,
        actionCount: 0
      }, ttlSeconds);
      return { prompt: "", actions: [], intent: agentRoute.intent };
    }
    if (agentRoute.agent !== "todo_manager") throw new Error(`agent_unknown_route:${agentRoute.agent || "empty"}`);
    // ★★★★★ 后台 Agent：总路由先判定 END ★★★★★

    // ★★★★★ 后台 Agent：TODO 专用执行 START ★★★★★
    // 命中 TODO 后才发送 TODO 详细规则和 TODO 快照，保持多 Agent 扩展时的成本可控。
    const response = await fetchWithTimeout(upstream.provider.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${upstream.provider.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: buildTodoAgentMessages(agent),
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        ...(agent.requestBodyExtra || {}),
        stream: false
      })
    }, UPSTREAM_TIMEOUT_MS, "agent_todo_upstream");

    if (!response.ok) throw new Error(`agent_todo_upstream_${response.status}`);

    const data = await response.json();
    const rawText = extractAssistantContent(data);
    const routerResult = parseTodoAgentResult(rawText);
    const execution = executeTodoAgentResult(routerResult, agent.todoSnapshot);
    execution.intent = routerResult.intent || "";
    // ★★★★★ 后台 Agent：TODO 专用执行 END ★★★★★

    await appendJobEvent(jobId, env, "agent_todo_done", {
      intent: routerResult.intent,
      actionCount: execution.actions.length
    }, ttlSeconds);

    return execution;
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.warn("agent_todo_failed", {
      error: errorMessage
    });
    await appendJobEvent(jobId, env, "agent_todo_failed", {
      error: sanitizeLogText(errorMessage)
    }, ttlSeconds);
    return { prompt: "", actions: [], failed: true, error: errorMessage };
  }
}

function buildAgentRouterMessages(agent) {
  const systemPrompt = [
    "你是 TeleWindy 的 Agent 总路由，只判断用户这句话是否需要调用某个 Agent。",
    "你只做选择，不执行任务，不解析任务字段，不输出 Markdown，不解释，只输出 JSON。",
    "",
    "intent 只能选择：NONE、USE_AGENT、ASK_CONFIRMATION。",
    "",
    "可用 Agent：",
    "- todo_manager：用户明确要求记录、提醒、安排 TODO；或明确表示某个 TODO 完成、延期、修改、取消、不需要、删除。",
    "",
    "规则：",
    "- 普通聊天、情绪表达、角色互动、闲聊陪伴，选 NONE。",
    "- 只有用户明确要求操作某个能力时，才选 USE_AGENT。",
    "- 用户只是提到一件事，但没有要求记录/提醒/安排，不要调用 TODO。",
    "- 如果看起来需要 Agent，但无法判断应该调用哪个 Agent，选 ASK_CONFIRMATION。",
    "- 不要编造用户没有说的任务、日期、目标或 Agent。",
    "",
    "JSON 格式：",
    "{\"intent\":\"USE_AGENT\",\"agent\":\"todo_manager\",\"confirmation\":{\"message\":\"\"}}",
    "",
    "字段说明：",
    "- NONE 时 agent 留空字符串。",
    "- USE_AGENT 时 agent 必须是可用 Agent 之一。",
    "- ASK_CONFIRMATION 时 confirmation.message 写给前端提示用的一句话。"
  ].join("\n");

  // ★★★★★ 后台 Agent：总路由 prompt START ★★★★★
  // 固定路由表放 system，本轮角色和用户原话放 user；这里不携带 TODO 快照。
  const userPrompt = [
    "【当前角色】",
    agent.contactName || "未命名角色",
    "",
    "【用户当前消息】",
    agent.userText || ""
  ].join("\n");
  // ★★★★★ 后台 Agent：总路由 prompt END ★★★★★

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
}

function parseAgentRouterResult(rawText) {
  const data = extractJsonObject(rawText);
  const intent = String(data.intent || "").trim().toUpperCase();
  if (!["NONE", "USE_AGENT", "ASK_CONFIRMATION"].includes(intent)) {
    throw new Error(`agent_router_unknown_intent:${intent || "empty"}`);
  }

  const selectedAgent = String(data.agent || "").trim();
  if (intent === "USE_AGENT" && selectedAgent !== "todo_manager") {
    throw new Error(`agent_router_unknown_agent:${selectedAgent || "empty"}`);
  }

  return {
    intent,
    agent: intent === "USE_AGENT" ? selectedAgent : "",
    confirmation: data.confirmation && typeof data.confirmation === "object" ? data.confirmation : {}
  };
}

function buildTodoAgentMessages(agent) {
  const todayKey = getDateKey(new Date());
  const tomorrowKey = addDays(todayKey, 1);
  const systemPrompt = [
    "你是 TeleWindy 的 TODO 管理 Agent，只判断用户这句话是否需要操作 TODO。",
    "你只能从 intent 枚举中选择：NONE、CREATE_TODO、UPDATE_TODO、ASK_CONFIRMATION。",
    "不要打分，不要输出 Markdown，不要解释，只输出 JSON。",
    "",
    "规则：",
    "- 普通聊天、情绪表达、角色互动，选 NONE。",
    "- 只有用户明确要求记录、提醒、安排任务时，才选 CREATE_TODO。",
    "- 只有用户明确表示某个 TODO 完成、延期、修改、取消、不需要、删除时，才选 UPDATE_TODO。",
    "- 用户说删除、取消、不需要某个 TODO 时，不要真正删除，统一输出 UPDATE_TODO 且 status=cancelled。",
    "- 找不到唯一目标、信息不足或高风险覆盖操作，选 ASK_CONFIRMATION。",
    "- 不要编造用户没有说的日期、任务或目标。",
    "",
    "JSON 格式：",
    "{\"intent\":\"CREATE_TODO\",\"todos\":[{\"text\":\"继续写论文\",\"dateKey\":\"2026-06-10\",\"startTime\":\"\",\"endTime\":\"\"}],\"todo\":{\"text\":\"\",\"dateKey\":\"\",\"startTime\":\"\",\"endTime\":\"\"},\"update\":{\"matchText\":\"\",\"dateKey\":\"\",\"newText\":\"\",\"newDateKey\":\"\",\"status\":\"\",\"startTime\":\"\",\"endTime\":\"\"},\"confirmation\":{\"message\":\"\"}}",
    "",
    "字段说明：",
    "- CREATE_TODO 时优先填写 todos 数组；只有一条时也可以填写 todo.text 和 todo.dateKey。",
    "- 用户一次说了多件要记录的事，就拆成多个 todos，不要合并成一条。",
    "- UPDATE_TODO 时填写 update.matchText；完成用 status=done，取消/删除/不需要用 status=cancelled，延期/改日期用 newDateKey，改内容用 newText。",
    "- ASK_CONFIRMATION 时 confirmation.message 写给前端确认/提示用的一句话。",
    "- 不需要的对象字段留空字符串。"
  ].join("\n");

  // ★ 缓存友好：固定规则放 system，日期/TODO 快照/用户原话放 user，尽量提高前缀缓存命中。
  const userPrompt = [
    `今天日期：${todayKey}`,
    `明天日期：${tomorrowKey}`,
    "",
    "【当前角色】",
    agent.contactName || "未命名角色",
    "",
    "【现有 TODO】",
    JSON.stringify(agent.todoSnapshot, null, 2),
    "",
    "【用户当前消息】",
    agent.userText || ""
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
}

function parseTodoAgentResult(rawText) {
  const data = extractJsonObject(rawText);
  const intent = String(data.intent || "").trim().toUpperCase();
  if (!["NONE", "CREATE_TODO", "UPDATE_TODO", "ASK_CONFIRMATION"].includes(intent)) {
    throw new Error(`agent_unknown_intent:${intent || "empty"}`);
  }
  return {
    intent,
    todo: data.todo && typeof data.todo === "object" ? data.todo : {},
    todos: Array.isArray(data.todos) ? data.todos.filter(item => item && typeof item === "object") : [],
    update: data.update && typeof data.update === "object" ? data.update : {},
    confirmation: data.confirmation && typeof data.confirmation === "object" ? data.confirmation : {}
  };
}

function executeTodoAgentResult(result, todoSnapshot) {
  if (!result || result.intent === "NONE" || result.intent === "ASK_CONFIRMATION") {
    return { prompt: "", actions: [] };
  }

  if (result.intent === "CREATE_TODO") {
    const items = normalizeTodoAgentCreates(result, todoSnapshot);
    if (!items.length) return { prompt: "", actions: [] };
    const createdLines = items.map(item => {
      const timeText = item.startTime && item.endTime ? `，时间 ${item.startTime}-${item.endTime}` : "";
      return `- ${item.text}：${item.dateKey}${timeText}`;
    });
    return {
      prompt: [
        `你已经为用户添加了 ${items.length} 项 TODO。`,
        ...createdLines,
        "请自然回应，不要提到系统、工具或 JSON。"
      ].join("\n"),
      actions: [{
        id: crypto.randomUUID(),
        type: items.length === 1 ? "todo.create" : "todo.create_many",
        ...(items.length === 1 ? { item: items[0] } : { items }),
        notice: items.length === 1 ? `添加了 TODO：${items[0].text}` : `添加了 ${items.length} 个 TODO`
      }]
    };
  }

  const candidates = findTodoAgentCandidates(result, todoSnapshot);
  if (candidates.length !== 1) return { prompt: "", actions: [] };

  const item = candidates[0];
  const update = result.update || {};
  const status = String(update.status || update.action || "").trim().toLowerCase();
  const patch = {};
  let actionText = "更新了 TODO";

  if (["cancelled", "canceled", "cancel", "deleted", "delete", "removed", "remove"].includes(status)) {
    patch.cancelled = true;
    patch.done = false;
    actionText = "取消了 TODO";
  } else if (status === "done" || status === "completed") {
    patch.done = true;
    patch.cancelled = false;
    actionText = "完成了 TODO";
  } else if (status === "active" || status === "undone") {
    patch.done = false;
    patch.cancelled = false;
    actionText = "恢复了 TODO";
  }

  const newText = cleanAgentText(update.newText || "", 120);
  if (newText) patch.text = newText;
  if (isDateKey(update.newDateKey)) {
    patch.dateKey = update.newDateKey;
    if (actionText === "更新了 TODO") actionText = "调整了 TODO 日期";
  }
  if (isTimeValue(update.startTime) && isTimeValue(update.endTime) && update.startTime < update.endTime) {
    patch.startTime = update.startTime;
    patch.endTime = update.endTime;
    if (actionText === "更新了 TODO") actionText = "调整了 TODO 时间";
  }
  if (!Object.keys(patch).length) return { prompt: "", actions: [] };

  const after = { ...item, ...patch };
  return {
    prompt: [
      `你已经为用户${actionText}。`,
      `原内容：${formatTodoAgentLabel(item)}`,
      `现在：${formatTodoAgentLabel(after)}${after.done ? "，状态为已完成" : ""}${after.cancelled ? "，状态为已取消" : ""}。`,
      "请自然回应，不要提到系统、工具或 JSON。"
    ].join("\n"),
    actions: [{
      id: crypto.randomUUID(),
      type: "todo.update",
      todoId: item.id,
      patch,
      notice: `${actionText}：${after.text || item.text}`
    }]
  };
}

function findTodoAgentCandidates(result, todoSnapshot) {
  const update = result?.update || {};
  const matchId = cleanAgentText(update.id || update.todoId || "", 80);
  const matchText = cleanAgentText(update.matchText || update.text || update.oldText || "", 80).toLowerCase();
  const dateKey = isDateKey(update.dateKey) ? update.dateKey : "";
  let items = Array.isArray(todoSnapshot) ? todoSnapshot.filter(item => item && item.text) : [];
  if (matchId) items = items.filter(item => item.id === matchId);
  if (dateKey) items = items.filter(item => item.dateKey === dateKey);
  if (matchText) items = items.filter(item => String(item.text || "").toLowerCase().includes(matchText));
  if (!matchId && !matchText && !dateKey) return [];
  return items;
}

function normalizeTodoAgentCreates(result, todoSnapshot = []) {
  const rawTodos = Array.isArray(result?.todos) && result.todos.length
    ? result.todos
    : [result?.todo || {}];
  const seenKeys = new Set((Array.isArray(todoSnapshot) ? todoSnapshot : [])
    .filter(item => item && item.text && item.dateKey)
    .map(item => buildTodoDuplicateKey(item.text, item.dateKey)));

  return rawTodos.map((todo, index) => {
    const text = cleanAgentText(todo.text || todo.title || "", 120);
    if (!text) return null;
    const dateKey = isDateKey(todo.dateKey) ? todo.dateKey : getDateKey(new Date());
    const duplicateKey = buildTodoDuplicateKey(text, dateKey);
    if (seenKeys.has(duplicateKey)) return null;
    seenKeys.add(duplicateKey);
    const startTime = isTimeValue(todo.startTime) ? todo.startTime : "";
    const endTime = isTimeValue(todo.endTime) ? todo.endTime : "";
    const item = {
      id: `todo_${Date.now()}_${index}_${crypto.randomUUID().slice(0, 8)}`,
      text,
      dateKey,
      done: false,
      cancelled: false,
      createdAt: Date.now()
    };
    if (startTime && endTime && startTime < endTime) {
      item.startTime = startTime;
      item.endTime = endTime;
    }
    return item;
  }).filter(Boolean).slice(0, 10);
}

function buildTodoDuplicateKey(text, dateKey) {
  return `${dateKey}::${String(text || "").replace(/\s+/g, " ").trim().toLowerCase()}`;
}

function injectVolatilePrompt(messages, prompt, insertMode, userMessageIndex) {
  const cleanPrompt = String(prompt || "").trim();
  if (!cleanPrompt) return messages;
  if (insertMode === "system") {
    return [...messages, { role: "system", content: ["=== 本轮背景资料 ===", "", cleanPrompt].join("\n\n") }];
  }

  const nextMessages = messages.map(message => ({ ...message }));
  const index = Number.isInteger(userMessageIndex) && userMessageIndex >= 0
    ? userMessageIndex
    : nextMessages.map(message => message.role).lastIndexOf("user");
  if (insertMode === "user" || insertMode === "auto") {
    if (index >= 0 && nextMessages[index]?.role === "user") {
      nextMessages[index].content = [
        "【系统信息补充】",
        cleanPrompt,
        "",
        "【用户当前消息】",
        nextMessages[index].content || ""
      ].join("\n\n");
      return nextMessages;
    }
  }
  return [...nextMessages, { role: "system", content: ["=== 本轮背景资料 ===", "", cleanPrompt].join("\n\n") }];
}

function sanitizeAgentPayload(agent, defaultAuthMode) {
  if (!agent || typeof agent !== "object" || Array.isArray(agent)) return null;
  const todo = agent.todo_manager && typeof agent.todo_manager === "object" ? agent.todo_manager : null;
  if (!todo || todo.enabled !== true) return null;
  const authMode = sanitizeAuthMode(todo.auth_mode || defaultAuthMode);
  const requestBodyExtra = sanitizeRequestBodyExtra(todo.request_body_extra);
  return {
    todoManager: {
      userText: cleanAgentText(todo.user_text || "", 1000),
      contactName: cleanAgentText(todo.contact_name || "", 120),
      todoSnapshot: sanitizeTodoSnapshot(todo.todo_snapshot),
      apiUrl: normalizeUrl(todo.api_url),
      apiKey: authMode === "server_secret" ? "" : String(todo.api_key || ""),
      authMode,
      model: sanitizeModel(todo.model || ""),
      temperature: clampNumber(todo.temperature, 0, 2, 0.1),
      maxTokens: clampInteger(todo.max_tokens, 1, 4096, 1200),
      requestBodyExtra: requestBodyExtra && typeof requestBodyExtra === "object" ? requestBodyExtra : {}
    }
  };
}

function sanitizeTodoSnapshot(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 100).map(item => ({
    id: cleanAgentText(item?.id || "", 80),
    text: cleanAgentText(item?.text || "", 120),
    dateKey: isDateKey(item?.dateKey) ? item.dateKey : getDateKey(new Date()),
    done: item?.done === true,
    cancelled: item?.cancelled === true,
    startTime: isTimeValue(item?.startTime) ? item.startTime : "",
    endTime: isTimeValue(item?.endTime) ? item.endTime : ""
  })).filter(item => item.id && item.text);
}

function extractJsonObject(rawText) {
  const text = String(rawText || "").trim();
  if (!text) throw new Error("agent_empty_json");
  try {
    return JSON.parse(text);
  } catch (error) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1].trim());
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw error;
  }
}

function cleanAgentText(value, maxLength = 120) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function formatTodoAgentLabel(item) {
  const timeText = item.startTime && item.endTime ? ` ${item.startTime}-${item.endTime}` : "";
  return `${item.dateKey || getDateKey(new Date())}${timeText}：${item.text}`;
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isTimeValue(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(dateKey, days) {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  const date = new Date(year || 1970, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  return getDateKey(date);
}
// ★★★★★ 后台 Agent：TODO 管理 END ★★★★★

async function fetchWithTimeout(url, options, timeoutMs, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(`${label}_timeout`), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError" || String(error?.message || error).includes("timeout")) {
      throw new Error(`${label}_timeout`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ★★★★★ 后台 Key 模式 + 多 Provider 路由 START ★★★★★
// 这里专门决定“这个后台 job 应该用哪个 URL 和哪个模型 Key”：
// 1. client_key：跟随前端 API 预设。Key 只在这次 Worker 运行里临时使用，不写入 KV；
// 2. server_secret：前端不传模型 Key，Worker 根据 API_URL 去匹配 Cloudflare secret；
// 3. 两种模式都不会把模型 Key 写进日志、任务状态或最终返回结果。
function resolveUpstream(apiUrl, apiKey, authMode, env) {
  const targetUrl = normalizeUrl(apiUrl);
  const targetSafety = validateUpstreamUrl(targetUrl);
  if (!targetSafety.ok) {
    return {
      ok: false,
      error: targetSafety.error,
      providerId: authMode === "server_secret" ? "server_secret" : "client_key"
    };
  }

  if (authMode === "client_key") {
    if (!targetUrl) {
      return {
        ok: false,
        error: "client_api_url_missing",
        providerId: "client_key"
      };
    }

    if (!apiKey) {
      return {
        ok: false,
        error: "client_api_key_missing",
        providerId: "client_key"
      };
    }

    return {
      ok: true,
      provider: {
        id: "client_key",
        authMode,
        url: targetUrl,
        apiKey
      }
    };
  }

  const providers = buildProviderConfigs(env);
  const fallback = providers.find((provider) => provider.id === "default");

  if (targetUrl) {
    const matched = providers.find((provider) => provider.matches(targetUrl));
    if (matched) {
      // 旧部署只配 UPSTREAM_* 时，如果它和前端 API_URL 正好一致，就继续走旧 Key。
      // 这样升级 Worker 后不用立刻把所有新 Provider secret 都补齐。
      if ((!matched.apiKey || !matched.url) && fallback?.url && fallback?.apiKey && fallback.matches(targetUrl)) {
        return {
          ok: true,
          provider: publicProviderConfig(fallback, authMode)
        };
      }

      if (!matched.apiKey) {
        return {
          ok: false,
          error: "upstream_provider_key_missing",
          providerId: matched.id
        };
      }
      if (!matched.url) {
        return {
          ok: false,
          error: "upstream_provider_url_missing",
          providerId: matched.id
        };
      }
      return {
        ok: true,
        provider: publicProviderConfig(matched, authMode)
      };
    }
  }

  // 兼容旧版：没有匹配到多 Provider 时，继续使用最早的单上游配置。
  // 这样只配置 UPSTREAM_CHAT_URL / UPSTREAM_API_KEY 的旧 Worker 还能照常工作。
  if (fallback?.url && fallback?.apiKey) {
    return {
      ok: true,
      provider: publicProviderConfig(fallback, authMode)
    };
  }

  return {
    ok: false,
    error: "upstream_provider_not_configured",
    providerId: ""
  };
}

function buildProviderConfigs(env) {
  const providers = [
    createProviderConfig({
      id: "deepseek",
      url: env.DEEPSEEK_CHAT_URL || "https://api.deepseek.com/v1/chat/completions",
      apiKey: env.DEEPSEEK_API_KEY,
      matchHosts: ["api.deepseek.com"]
    }),
    createProviderConfig({
      id: "siliconflow",
      url: env.SILICONFLOW_CHAT_URL || "https://api.siliconflow.cn/v1/chat/completions",
      apiKey: env.SILICONFLOW_API_KEY,
      matchHosts: ["api.siliconflow.cn"]
    }),
    createProviderConfig({
      id: "openai",
      url: env.OPENAI_CHAT_URL || "https://api.openai.com/v1/chat/completions",
      apiKey: env.OPENAI_API_KEY,
      matchHosts: ["api.openai.com"]
    }),
    createProviderConfig({
      id: "glm",
      url: env.GLM_CHAT_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      apiKey: env.GLM_API_KEY,
      matchHosts: ["open.bigmodel.cn"]
    }),
    createProviderConfig({
      id: "default",
      url: env.UPSTREAM_CHAT_URL,
      apiKey: env.UPSTREAM_API_KEY,
      matchUrls: [env.UPSTREAM_CHAT_URL]
    })
  ];

  // ★ 自定义中转站槽位：
  // 如果你有自己的 OpenAI 兼容中转站，就配置 CUSTOM1_CHAT_URL + CUSTOM1_API_KEY。
  // 前端当前 API_URL 和 CUSTOM1_CHAT_URL 完全一致时，Worker 才会走这个槽位。
  for (const slot of CUSTOM_PROVIDER_SLOTS) {
    providers.push(createProviderConfig({
      id: slot.toLowerCase(),
      url: env[`${slot}_CHAT_URL`],
      apiKey: env[`${slot}_API_KEY`],
      matchUrls: [env[`${slot}_CHAT_URL`]],
      matchHosts: splitCsv(env[`${slot}_MATCH_HOSTS`])
    }));
  }

  return providers;
}

function createProviderConfig(config) {
  const matchUrls = (config.matchUrls || [])
    .map(normalizeUrl)
    .filter(Boolean);
  const matchHosts = (config.matchHosts || [])
    .map((host) => String(host || "").trim().toLowerCase())
    .filter(Boolean);

  return {
    id: config.id,
    url: normalizeUrl(config.url),
    apiKey: config.apiKey || "",
    matches(targetUrl) {
      const target = normalizeUrl(targetUrl);
      if (!target) return false;
      const targetHost = getUrlHost(target);
      return matchUrls.includes(target) || (targetHost && matchHosts.includes(targetHost));
    }
  };
}

function publicProviderConfig(provider, authMode = "server_secret") {
  return {
    id: provider.id,
    authMode,
    url: provider.url,
    apiKey: provider.apiKey
  };
}

function sanitizeAuthMode(mode) {
  return mode === "server_secret" ? "server_secret" : "client_key";
}

function normalizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

// ★ 自定义中转站仍然放行，但明显危险的地址先挡掉：
// 1. localhost / 私网 / 保留地址没有必要让公开 Worker 去请求；
// 2. 只允许 http/https，避免奇怪协议绕到不可预期的行为。
function validateUpstreamUrl(url) {
  if (!url) return { ok: true };
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "upstream_url_invalid" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "upstream_url_protocol_blocked" };
  }

  const host = parsed.hostname.toLowerCase();
  if (isBlockedHost(host)) {
    return { ok: false, error: "upstream_url_host_blocked" };
  }

  return { ok: true };
}

function isBlockedHost(host) {
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0") return true;

  const ipv4 = parseIpv4(host);
  if (ipv4) return isBlockedIpv4(ipv4);

  const normalizedIpv6 = host.replace(/^\[|\]$/g, "");
  if (normalizedIpv6 === "::1" || normalizedIpv6 === "0:0:0:0:0:0:0:1") return true;
  if (normalizedIpv6.startsWith("fe80:") || normalizedIpv6.startsWith("fc") || normalizedIpv6.startsWith("fd")) return true;

  return false;
}

function parseIpv4(host) {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((num, index) => !Number.isInteger(num) || num < 0 || num > 255 || String(num) !== parts[index])) {
    return null;
  }
  return nums;
}

function isBlockedIpv4(parts) {
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;
  return false;
}

function getUrlHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeLogText(value) {
  return String(value || "").slice(0, 300);
}
// ★★★★★ 后台 Key 模式 + 多 Provider 路由 END ★★★★★

function extractAssistantContent(data) {
  const message = data?.choices?.[0]?.message || {};
  let content = String(message.content || "");

  // ★★★★★ 推理模型思考链兼容 START ★★★★★
  // 前端直连 API 时已经把 reasoning_content 包成 <think>...</think>，
  // 后台接收也必须做同样处理，不然 Worker 存进 KV 的 result 只剩正文。
  const reasoningContent = message.reasoning_content || message.reasoningContent;
  if (reasoningContent) {
    content = `<think>\n${String(reasoningContent).trim()}\n</think>\n\n${content}`;
  }
  // ★★★★★ 推理模型思考链兼容 END ★★★★★

  return content;
}

function sanitizeMessages(messages) {
  return messages.slice(-80).map((message) => ({
    role: sanitizeRole(message.role),
    content: String(message.content || "").slice(0, 20000)
  }));
}

function sanitizeRole(role) {
  if (role === "system" || role === "assistant" || role === "user") {
    return role;
  }
  return "user";
}

function sanitizeModel(model) {
  return String(model || "").trim();
}

function sanitizeTtlSeconds(ttlHours) {
  const hours = clampNumber(ttlHours, MIN_JOB_TTL_HOURS, MAX_JOB_TTL_HOURS, DEFAULT_JOB_TTL_HOURS);
  return Math.round(hours * 60 * 60);
}

function sanitizeRequestBodyExtra(extra) {
  if (extra === undefined || extra === null) return {};
  if (typeof extra !== "object" || Array.isArray(extra)) return null;

  // 后台任务最终用 response.json() 取完整结果，所以这里兜底禁止流式返回。
  return {
    ...extra,
    stream: false
  };
}

function getAllowedModels(env) {
  const configured = String(env.ALLOWED_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  if (!configured.length || configured.includes("*")) return null;
  return new Set(configured);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampInteger(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function isAuthorized(request, env) {
  const token = request.headers.get("Authorization");
  return token === `Bearer ${env.APP_TOKEN}`;
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  if (isWildcardOrigin(env)) return true;
  return getAllowedOrigins(env).includes(origin);
}

function withCors(response, request, env) {
  const origin = request.headers.get("Origin");
  if (origin && (isWildcardOrigin(env) || getAllowedOrigins(env).includes(origin))) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function json(data, status, request, env) {
  return withCors(Response.json(data, { status }), request, env);
}

function buildJobEvent(code, detail = {}) {
  return {
    code,
    ts: Date.now(),
    detail: sanitizeJobEventDetail(detail)
  };
}

async function buildJobWithEvent(jobId, env, nextJob, code, detail = {}) {
  return await patchJobState(jobId, env, nextJob, buildJobEvent(code, detail));
}

async function appendJobEvent(jobId, env, code, detail = {}, ttlSeconds = DEFAULT_JOB_TTL_HOURS * 3600) {
  return await patchJobState(jobId, env, { ttlSeconds }, buildJobEvent(code, detail));
}

async function deleteJobPayload(jobId, env, ttlSeconds = DEFAULT_JOB_TTL_HOURS * 3600) {
  try {
    await env.CHAT_JOBS.delete(payloadKey(jobId));
    await appendJobEvent(jobId, env, "job_payload_delete", {}, ttlSeconds);
  } catch (error) {
    console.warn("job_payload_delete_error", {
      jobId: shortJobId(jobId),
      error: error?.message || String(error)
    });
  }
}

function sanitizeJobEventDetail(detail) {
  const safe = {};
  for (const [key, value] of Object.entries(detail || {})) {
    if (Array.isArray(value)) {
      safe[key] = value.map(item => sanitizeLogText(item)).slice(0, 20);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      safe[key] = value;
    } else {
      safe[key] = sanitizeLogText(value);
    }
  }
  return safe;
}

function jobObjectStub(jobId, env) {
  const id = env.CHAT_JOB_OBJECT.idFromName(String(jobId || ""));
  return env.CHAT_JOB_OBJECT.get(id);
}

async function initJobState(jobId, env, job) {
  const response = await jobObjectStub(jobId, env).fetch("https://job.local/init", {
    method: "POST",
    body: JSON.stringify({ job })
  });
  return await response.json();
}

async function readJobState(jobId, env) {
  const response = await jobObjectStub(jobId, env).fetch("https://job.local/job");
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`job_state_read_${response.status}`);
  return await response.json();
}

async function patchJobState(jobId, env, nextJob = {}, event = null) {
  const response = await jobObjectStub(jobId, env).fetch("https://job.local/patch", {
    method: "POST",
    body: JSON.stringify({ nextJob, event })
  });
  if (!response.ok) throw new Error(`job_state_patch_${response.status}`);
  return await response.json();
}

async function deleteJobState(jobId, env) {
  const response = await jobObjectStub(jobId, env).fetch("https://job.local/delete", {
    method: "POST"
  });
  if (!response.ok) throw new Error(`job_state_delete_${response.status}`);
  return await response.json();
}

function payloadKey(jobId) {
  return `job_payload:${jobId}`;
}

function getPayloadTtlSeconds(ttlSeconds) {
  const seconds = Number(ttlSeconds || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return MAX_PAYLOAD_TTL_SECONDS;
  return Math.max(60, Math.min(seconds, MAX_PAYLOAD_TTL_SECONDS));
}

function shortJobId(jobId) {
  return String(jobId || "").slice(0, 8);
}

function getAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isWildcardOrigin(env) {
  return getAllowedOrigins(env).includes("*");
}
