const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

loadDotEnv();

const root = __dirname;
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const deepseekKey = process.env.DEEPSEEK_API_KEY || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      deepseekConfigured: Boolean(deepseekKey),
      model: deepseekModel,
      baseUrl: deepseekBaseUrl,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/generate") {
    const payload = await readJson(request);
    const result = await generateBlessing(payload);
    sendJson(response, 200, result);
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  serveStatic(url.pathname, response);
});

server.listen(port, host, () => {
  const mode = deepseekKey ? `DeepSeek: ${deepseekModel}` : "local template fallback";
  console.log(`温柔盲盒生成器 running at http://${host}:${port}`);
  console.log(`Generation mode: ${mode}`);
});

async function generateBlessing(input) {
  const payload = normalizeInput(input);
  if (!deepseekKey) {
    return localBlessing(payload);
  }

  try {
    const aiResult = await requestDeepSeek(payload);
    return {
      ...localBlessing(payload),
      ...aiResult,
      source: "deepseek",
    };
  } catch (error) {
    console.warn("DeepSeek request failed, using local fallback:", error.message);
    return {
      ...localBlessing(payload),
      source: "local",
      fallbackReason: "DeepSeek request failed",
    };
  }
}

async function requestDeepSeek(payload) {
  const systemPrompt = [
    "你是「温柔盲盒生成器」的中文文案引擎，作品用于校园代码表白大赛。",
    "你的任务是把用户选择的盲盒对象、心意关键词、语气和小细节，生成一份适合开盲盒揭晓页展示的温柔文案。",
    "输出必须是合法 JSON 字符串，不要 Markdown，不要代码块，不要解释，不要在 JSON 外输出任何文字。",
    "JSON 字段必须且只能包含：kicker、title、message、codeLine、palette。",
    "kicker：8-18 个中文字符，像盲盒票根标签，例如「给朋友的陪伴盲盒」。",
    "title：8-18 个中文字符，有记忆点，不要空泛。",
    "message：按 length 控制长度；短句 1 句，小卡片 3 句左右，完整信件 4-6 句。句子要自然、真诚、适合公开展示。",
    "codeLine：一行代码式情话，必须短、可读、有程序感，优先使用 JS 风格。",
    "palette：4 个十六进制颜色，适合盲盒动画，必须是 #RRGGBB。",
    "内容要求积极健康、原创、温暖；不要低俗、PUA、过度暧昧、煽情过头、消极丧气或泄露隐私。",
    "如果对象是老师或劳动者，要突出感谢与尊重；如果对象是暗恋的人，要克制、真诚、不制造压力。",
    "不要提到 AI、模型、提示词、JSON、接口、用户输入这些幕后信息。",
  ].join("\n");

  const userPrompt = {
    task: "请根据下面参数生成 json 结果。",
    recipientName: payload.recipientName || "未填写",
    audience: payload.audience,
    emotion: payload.emotion,
    tone: payload.tone,
    length: payload.length,
    memory: payload.memory || "没有额外细节",
    styleGuide: {
      真诚: "像手写卡片，直白但不尴尬",
      校园: "带一点青春、课堂、操场、晚风的感觉",
      诗意: "画面感强，但不要堆砌辞藻",
      程序员: "可以有变量、函数、编译、debug 等轻量程序梗",
    },
    jsonExample: {
      kicker: "给朋友的温柔盲盒",
      title: "愿你一路有光",
      message:
        "谢谢你把普通的日子也过得很亮。愿你疲惫时有人替你留灯，也愿你开心时有人认真听你分享。我们继续一起往前走，把每一天都编译成值得记住的版本。",
      codeLine: 'await heart.send({ to: "朋友", gift: "陪伴" });',
      palette: ["#ff7d67", "#f4c95d", "#47b88c", "#6ba9d6"],
    },
  };

  const response = await fetch(`${deepseekBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPrompt, null, 2) },
      ],
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      max_tokens: 1100,
      temperature: 0.78,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned empty content");
  }

  return sanitizeAiResult(parseDeepSeekJson(content));
}

function sanitizeAiResult(result) {
  return {
    kicker: trimText(result.kicker, 30) || "今日盲盒",
    title: trimText(result.title, 36) || "愿你被温柔照亮",
    message: trimText(result.message, 560) || "愿你今天也有一点被认真照顾的好运。",
    codeLine:
      trimText(result.codeLine, 140) || 'heart.send({ type: "warmth", to: "you" });',
    palette: sanitizePalette(result.palette),
  };
}

function parseDeepSeekJson(content) {
  const cleanContent = String(content || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleanContent);
}

function localBlessing(payload) {
  const recipient = payload.recipientName || payload.audience.replace("给", "");
  const toneMap = {
    真诚: "认真而明亮",
    校园: "像下课铃后的风",
    诗意: "像月光落在信纸上",
    程序员: "像一段终于跑通的程序",
  };
  const lengthMap = {
    短句: 1,
    小卡片: 3,
    完整信件: 5,
  };
  const lines = [
    `${recipient}，这份盲盒里装着${payload.emotion}，也装着一句${toneMap[payload.tone]}的话。`,
    payload.memory
      ? `我把“${payload.memory}”悄悄写进变量里，希望它每次运行都能抵达你身边。`
      : "愿你在普通的日子里，也能遇见刚刚好的光和刚刚好的勇气。",
    "如果今天很忙，请记得把温柔留给自己一点；如果今天顺利，就把这份好运继续分享给别人。",
    "世界偶尔会有噪声，但你的认真、善意和热爱，都值得被看见。",
    "愿每一次点击、每一行代码、每一份努力，最后都编译成属于你的春天。",
  ];

  return {
    source: "local",
    kicker: `${payload.audience}的${payload.emotion}盲盒`,
    title: titleFor(payload),
    message: lines.slice(0, lengthMap[payload.length] || 3).join("\n"),
    codeLine: codeLineFor(payload, recipient),
    palette: ["#ff7d67", "#f4c95d", "#47b88c", "#6ba9d6"],
  };
}

function titleFor(payload) {
  const titleMap = {
    鼓励: "愿你继续发光",
    感谢: "谢谢你把温柔留在人间",
    陪伴: "我们一起把日子过亮",
    勇气: "把勇敢悄悄放进口袋",
    喜欢: "把心动写进今天",
    祝福: "愿好运准时抵达",
    想念: "想念也会发出微光",
  };
  return titleMap[payload.emotion] || "一份刚刚拆开的温柔";
}

function codeLineFor(payload, recipient) {
  const safeName = recipient.replace(/[^\u4e00-\u9fa5\w-]/g, "").slice(0, 12) || "you";
  if (payload.tone === "程序员") {
    return `await heart.send({ to: "${safeName}", gift: "${payload.emotion}", forever: true });`;
  }
  return `warmth.box("${safeName}").open("${payload.emotion}");`;
}

function normalizeInput(input = {}) {
  const allowed = {
    audience: ["给自己", "给朋友", "给老师", "给家人", "给暗恋的人", "给劳动者"],
    emotion: ["鼓励", "感谢", "陪伴", "勇气", "喜欢", "祝福", "想念"],
    tone: ["真诚", "校园", "诗意", "程序员"],
    length: ["短句", "小卡片", "完整信件"],
  };

  return {
    recipientName: trimText(input.recipientName, 16),
    audience: allowed.audience.includes(input.audience) ? input.audience : "给自己",
    emotion: allowed.emotion.includes(input.emotion) ? input.emotion : "鼓励",
    tone: allowed.tone.includes(input.tone) ? input.tone : "真诚",
    length: allowed.length.includes(input.length) ? input.length : "小卡片",
    memory: trimText(input.memory, 120),
  };
}

function serveStatic(pathname, response) {
  const cleanPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = path.normalize(path.join(root, cleanPath));

  if (!filePath.startsWith(root)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
}

function readJson(request) {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        resolve({});
      }
    });
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function trimText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function sanitizePalette(palette) {
  if (!Array.isArray(palette)) {
    return ["#ff7d67", "#f4c95d", "#47b88c", "#6ba9d6"];
  }

  const colors = palette.filter((color) => /^#[0-9a-fA-F]{6}$/.test(color)).slice(0, 4);
  return colors.length >= 3 ? colors : ["#ff7d67", "#f4c95d", "#47b88c", "#6ba9d6"];
}

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
