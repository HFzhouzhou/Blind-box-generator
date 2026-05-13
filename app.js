const packs = {
  courage: {
    emotion: "鼓励",
    tone: "校园",
    length: "小卡片",
    title: "星光鼓励款",
    accent: "#67d7c4",
    palette: ["#67d7c4", "#ffd166", "#ff6b6b", "#5d7cff"],
  },
  thanks: {
    emotion: "感谢",
    tone: "真诚",
    length: "完整信件",
    title: "花束感谢款",
    accent: "#ff8a5b",
    palette: ["#ff8a5b", "#ffd166", "#58c08f", "#6fa8ff"],
  },
  company: {
    emotion: "陪伴",
    tone: "诗意",
    length: "小卡片",
    title: "电波陪伴款",
    accent: "#8e79ff",
    palette: ["#8e79ff", "#67d7c4", "#ffd166", "#ff6b6b"],
  },
  heartbeat: {
    emotion: "喜欢",
    tone: "程序员",
    length: "短句",
    title: "心跳心意款",
    accent: "#ff5f8f",
    palette: ["#ff5f8f", "#ffd166", "#67d7c4", "#5d7cff"],
  },
};

const state = {
  screen: "home",
  pack: "courage",
  audience: "给自己",
};

const els = {
  screens: [...document.querySelectorAll(".screen")],
  apiStatus: document.querySelector("#apiStatus"),
  homeBtn: document.querySelector("#homeBtn"),
  startBtn: document.querySelector("#startBtn"),
  surpriseBtn: document.querySelector("#surpriseBtn"),
  quickForm: document.querySelector("#quickForm"),
  packShelf: document.querySelector("#packShelf"),
  recipientName: document.querySelector("#recipientName"),
  memory: document.querySelector("#memory"),
  generateBtn: document.querySelector("#generateBtn"),
  againBtn: document.querySelector("#againBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  giftBox: document.querySelector("#giftBox"),
  sparkField: document.querySelector("#sparkField"),
  countdown: document.querySelector("#countdown"),
  openingText: document.querySelector("#openingText"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMessage: document.querySelector("#resultMessage"),
  codeLine: document.querySelector("#codeLine"),
  sourceTag: document.querySelector("#sourceTag"),
  timeTag: document.querySelector("#timeTag"),
  toast: document.querySelector("#toast"),
};

let latestText = "";
let isGenerating = false;

function setScreen(nextScreen) {
  state.screen = nextScreen;
  els.screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === nextScreen);
  });
  document.body.dataset.screen = nextScreen;
}

function bindNavigation() {
  els.homeBtn.addEventListener("click", () => setScreen("home"));
  els.startBtn.addEventListener("click", () => setScreen("pick"));
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setScreen(button.dataset.go));
  });
  els.againBtn.addEventListener("click", () => {
    if (!isGenerating) generateBlessing();
  });
  els.surpriseBtn.addEventListener("click", () => {
    randomizeMinimalInput();
    generateBlessing();
  });
}

function bindChoices() {
  els.packShelf.addEventListener("click", (event) => {
    const card = event.target.closest("[data-pack]");
    if (!card) return;
    state.pack = card.dataset.pack;
    els.packShelf.querySelectorAll("[data-pack]").forEach((item) => {
      item.classList.toggle("active", item.dataset.pack === state.pack);
    });
    document.documentElement.style.setProperty("--accent", packs[state.pack].accent);
  });

  document.querySelectorAll("[data-choice-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;

      const key = group.dataset.choiceGroup;
      state[key] = button.dataset.value;
      group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

async function checkApiStatus() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    if (data.deepseekConfigured) {
      els.apiStatus.textContent = `DeepSeek 已接入 · ${data.model}`;
      els.apiStatus.classList.add("ready");
      return;
    }

    els.apiStatus.textContent = "本地模板模式";
    els.apiStatus.classList.add("local");
  } catch (error) {
    els.apiStatus.textContent = "本地预览模式";
    els.apiStatus.classList.add("local");
  }
}

function payloadFromForm() {
  const pack = packs[state.pack];
  return {
    recipientName: els.recipientName.value.trim(),
    audience: state.audience,
    emotion: pack.emotion,
    tone: pack.tone,
    length: pack.length,
    memory: els.memory.value.trim(),
  };
}

async function generateBlessing() {
  if (isGenerating) return;

  const pack = packs[state.pack];
  const payload = payloadFromForm();
  isGenerating = true;
  latestText = "";
  setScreen("opening");
  setRitualState("charge", pack);

  try {
    const [data] = await Promise.all([requestBlessing(payload), runRitual(pack)]);
    paintResult({
      ...data,
      palette: data.palette || pack.palette,
      kicker: data.kicker || pack.title,
    });
  } catch (error) {
    await runFallbackBeat(pack);
    paintResult({
      source: "local",
      kicker: "离线盲盒",
      title: "备用温柔已送达",
      message:
        "今天的生成服务开了一个小差，但你的心意没有掉线。\n愿这份祝福像一盏灯，照亮正在努力的你，也照亮你想认真对待的人。",
      codeLine: 'if (world.isNoisy()) { heart.keep("soft"); }',
      palette: pack.palette,
    });
    showToast("已切换本地文案");
  } finally {
    isGenerating = false;
    setScreen("reveal");
    burstSparks(pack.palette, 46);
  }
}

async function requestBlessing(payload) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function runRitual(pack) {
  const steps = [
    ["3", "正在校准心意频率"],
    ["2", "正在摇匀今日温柔"],
    ["1", "正在解锁隐藏款"],
    ["OPEN", "温柔即将掉落"],
  ];

  return new Promise((resolve) => {
    steps.forEach(([count, text], index) => {
      window.setTimeout(() => {
        els.countdown.textContent = count;
        els.openingText.textContent = text;
        els.giftBox.classList.toggle("unlocking", index >= 2);
        burstSparks(pack.palette, index === 3 ? 34 : 14);
      }, index * 620);
    });

    window.setTimeout(resolve, steps.length * 620 + 260);
  });
}

function runFallbackBeat(pack) {
  els.countdown.textContent = "OK";
  els.openingText.textContent = "备用盲盒已接住心意";
  burstSparks(pack.palette, 26);
  return new Promise((resolve) => window.setTimeout(resolve, 600));
}

function setRitualState(mode, pack) {
  document.documentElement.style.setProperty("--accent", pack.accent);
  els.countdown.textContent = "3";
  els.openingText.textContent = mode === "charge" ? "正在封存心意" : "准备开盒";
  els.giftBox.classList.remove("unlocking");
  els.giftBox.classList.add("charging");
}

function paintResult(data) {
  const title = data.title || "一份刚刚拆开的温柔";
  const message = data.message || "";
  const codeLine = data.codeLine || 'warmth.send({ to: "you" })';
  const sourceName = data.source === "deepseek" ? "DeepSeek 生成" : "本地模板";

  els.resultKicker.textContent = data.kicker || packs[state.pack].title;
  els.resultTitle.textContent = title;
  els.resultMessage.textContent = message;
  els.codeLine.textContent = codeLine;
  els.sourceTag.textContent = sourceName;
  els.timeTag.textContent = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  latestText = `${title}\n\n${message}\n\n${codeLine}`;
}

function burstSparks(palette = ["#ff6b6b", "#ffd166", "#67d7c4", "#5d7cff"], count = 30) {
  const field = els.sparkField;
  field.innerHTML = "";

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement("i");
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
    const distance = 72 + Math.random() * 260;
    const x = `${Math.cos(angle) * distance}px`;
    const y = `${Math.sin(angle) * distance - 40}px`;
    const color = palette[index % palette.length];

    spark.className = "spark";
    spark.style.setProperty("--x", x);
    spark.style.setProperty("--y", y);
    spark.style.setProperty("--size", `${6 + Math.random() * 11}px`);
    spark.style.setProperty("--color", color);
    spark.style.animationDelay = `${Math.random() * 120}ms`;
    field.appendChild(spark);
  }

  window.setTimeout(() => {
    field.innerHTML = "";
  }, 1200);
}

function randomizeMinimalInput() {
  const packKeys = Object.keys(packs);
  const audiences = ["给自己", "给朋友", "给老师", "给家人", "给暗恋的人", "给劳动者"];
  const memories = [
    "谢谢你把普通的一天过得很认真。",
    "愿每一份努力，都能在某天开出亮亮的花。",
    "希望疲惫的时候，也有人替你把灯留着。",
    "我们都在慢慢长大，也都值得被温柔拥抱。",
  ];

  state.pack = packKeys[Math.floor(Math.random() * packKeys.length)];
  state.audience = audiences[Math.floor(Math.random() * audiences.length)];
  els.memory.value = memories[Math.floor(Math.random() * memories.length)];
  els.recipientName.value = "";

  els.packShelf.querySelectorAll("[data-pack]").forEach((item) => {
    item.classList.toggle("active", item.dataset.pack === state.pack);
  });
  document.querySelectorAll('[data-choice-group="audience"] button').forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.audience);
  });
}

async function copyResult() {
  if (!latestText) {
    showToast("先开启一次盲盒");
    return;
  }

  try {
    await navigator.clipboard.writeText(latestText);
    showToast("结果已复制");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = latestText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    showToast("结果已复制");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1800);
}

document.documentElement.style.setProperty("--accent", packs[state.pack].accent);
bindNavigation();
bindChoices();
checkApiStatus();
els.quickForm.addEventListener("submit", (event) => {
  event.preventDefault();
  generateBlessing();
});
els.copyBtn.addEventListener("click", copyResult);
