const mobilePacks = {
  courage: {
    emotion: "鼓励",
    tone: "校园",
    length: "小卡片",
    accent: "#62d5c4",
    rgb: "98, 213, 196",
    palette: ["#62d5c4", "#ffd166", "#ff7a66", "#6b8cff"],
  },
  thanks: {
    emotion: "感谢",
    tone: "真诚",
    length: "完整信件",
    accent: "#ff7a66",
    rgb: "255, 122, 102",
    palette: ["#ff7a66", "#ffd166", "#62d5c4", "#6b8cff"],
  },
  company: {
    emotion: "陪伴",
    tone: "诗意",
    length: "小卡片",
    accent: "#8e7dff",
    rgb: "142, 125, 255",
    palette: ["#8e7dff", "#62d5c4", "#ffd166", "#ff7a66"],
  },
  heartbeat: {
    emotion: "喜欢",
    tone: "程序员",
    length: "短句",
    accent: "#ff5f8f",
    rgb: "255, 95, 143",
    palette: ["#ff5f8f", "#ffd166", "#62d5c4", "#6b8cff"],
  },
};

const state = {
  view: "intro",
  pack: "courage",
  audience: "给自己",
};

const els = {
  views: [...document.querySelectorAll(".mobile-view")],
  apiStatus: document.querySelector("#apiStatus"),
  startBtn: document.querySelector("#startBtn"),
  quickOpenBtn: document.querySelector("#quickOpenBtn"),
  packCarousel: document.querySelector("#packCarousel"),
  form: document.querySelector("#mobileForm"),
  recipientName: document.querySelector("#recipientName"),
  memory: document.querySelector("#memory"),
  ritualPack: document.querySelector("#ritualPack"),
  ritualCount: document.querySelector("#ritualCount"),
  ritualText: document.querySelector("#ritualText"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMessage: document.querySelector("#resultMessage"),
  codeLine: document.querySelector("#codeLine"),
  sourceTag: document.querySelector("#sourceTag"),
  timeTag: document.querySelector("#timeTag"),
  againBtn: document.querySelector("#againBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  confettiLayer: document.querySelector("#confettiLayer"),
  toast: document.querySelector("#toast"),
};

let latestText = "";
let isGenerating = false;

function setView(nextView) {
  state.view = nextView;
  els.views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === nextView);
  });
}

function setPack(packKey) {
  const pack = mobilePacks[packKey] || mobilePacks.courage;
  state.pack = packKey;
  document.documentElement.style.setProperty("--accent", pack.accent);
  document.documentElement.style.setProperty("--accent-rgb", pack.rgb);
  els.packCarousel.querySelectorAll("[data-pack]").forEach((button) => {
    button.classList.toggle("active", button.dataset.pack === packKey);
  });
}

function bindEvents() {
  els.startBtn.addEventListener("click", () => setView("setup"));
  els.quickOpenBtn.addEventListener("click", () => {
    randomizeInput();
    generateBlessing();
  });
  els.againBtn.addEventListener("click", () => {
    if (!isGenerating) generateBlessing();
  });
  els.copyBtn.addEventListener("click", copyResult);

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.go));
  });

  els.packCarousel.addEventListener("click", (event) => {
    const packButton = event.target.closest("[data-pack]");
    if (packButton) {
      setPack(packButton.dataset.pack);
    }
  });

  document.querySelectorAll("[data-choice-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) return;
      state[group.dataset.choiceGroup] = button.dataset.value;
      group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateBlessing();
  });
}

async function checkApiStatus() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    if (data.deepseekConfigured) {
      els.apiStatus.textContent = "DeepSeek";
      els.apiStatus.classList.add("ready");
      return;
    }

    els.apiStatus.textContent = "本地模式";
  } catch (error) {
    els.apiStatus.textContent = "预览模式";
  }
}

function payloadFromForm() {
  const pack = mobilePacks[state.pack];
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

  const pack = mobilePacks[state.pack];
  isGenerating = true;
  latestText = "";
  setView("ritual");
  resetRitual();

  try {
    const [data] = await Promise.all([requestBlessing(payloadFromForm()), runRitual(pack)]);
    paintResult({
      ...data,
      palette: data.palette || pack.palette,
    });
  } catch (error) {
    await fallbackPause(pack);
    paintResult({
      source: "local",
      kicker: "离线盲盒",
      title: "备用温柔已送达",
      message:
        "今天的生成服务暂时没有接通，但这份心意已经被好好接住。\n愿你被温柔照亮，也愿你想认真对待的人能收到这份明亮。",
      codeLine: 'heart.keep({ mode: "soft", for: "you" });',
      palette: pack.palette,
    });
  } finally {
    isGenerating = false;
    setView("result");
    popConfetti(pack.palette, 42);
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
    ["OPEN", "温柔已掉落"],
  ];

  return new Promise((resolve) => {
    steps.forEach(([count, text], index) => {
      window.setTimeout(() => {
        els.ritualCount.textContent = count;
        els.ritualText.textContent = text;
        els.ritualPack.classList.toggle("opening", index >= 2);
        popConfetti(pack.palette, index === 3 ? 24 : 10);
      }, index * 620);
    });
    window.setTimeout(resolve, steps.length * 620 + 240);
  });
}

function fallbackPause(pack) {
  els.ritualCount.textContent = "OK";
  els.ritualText.textContent = "备用盲盒已接住心意";
  popConfetti(pack.palette, 20);
  return new Promise((resolve) => window.setTimeout(resolve, 620));
}

function resetRitual() {
  els.ritualCount.textContent = "3";
  els.ritualText.textContent = "正在封存心意";
  els.ritualPack.classList.remove("opening");
}

function paintResult(data) {
  const title = data.title || "一份刚刚拆开的温柔";
  const message = data.message || "愿你今天也有一点被认真照顾的好运。";
  const codeLine = data.codeLine || 'warmth.send({ to: "you" })';
  const source = data.source === "deepseek" ? "DeepSeek" : "本地模板";

  els.resultKicker.textContent = data.kicker || "今日盲盒";
  els.resultTitle.textContent = title;
  els.resultMessage.textContent = message;
  els.codeLine.textContent = codeLine;
  els.sourceTag.textContent = source;
  els.timeTag.textContent = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  latestText = `${title}\n\n${message}\n\n${codeLine}`;
}

function popConfetti(palette = ["#62d5c4", "#ffd166", "#ff7a66", "#6b8cff"], count = 28) {
  els.confettiLayer.innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("i");
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
    const distance = 84 + Math.random() * 190;
    piece.className = "confetti";
    piece.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--y", `${Math.sin(angle) * distance - 30}px`);
    piece.style.setProperty("--size", `${5 + Math.random() * 8}px`);
    piece.style.setProperty("--color", palette[index % palette.length]);
    piece.style.animationDelay = `${Math.random() * 100}ms`;
    els.confettiLayer.appendChild(piece);
  }

  window.setTimeout(() => {
    els.confettiLayer.innerHTML = "";
  }, 1100);
}

function randomizeInput() {
  const packKeys = Object.keys(mobilePacks);
  const audiences = ["给自己", "给朋友", "给老师", "给家人", "给暗恋的人", "给劳动者"];
  const memories = [
    "谢谢你一直把日子过亮。",
    "愿每一份努力都被认真看见。",
    "希望疲惫的时候，也有人替你留一盏灯。",
    "今天也请把一点温柔留给自己。",
  ];

  setPack(packKeys[Math.floor(Math.random() * packKeys.length)]);
  state.audience = audiences[Math.floor(Math.random() * audiences.length)];
  els.recipientName.value = "";
  els.memory.value = memories[Math.floor(Math.random() * memories.length)];
  document.querySelectorAll('[data-choice-group="audience"] button').forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.audience);
  });
}

async function copyResult() {
  if (!latestText) {
    showToast("先开一只盲盒");
    return;
  }

  try {
    await navigator.clipboard.writeText(latestText);
    showToast("已复制");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = latestText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    showToast("已复制");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1700);
}

setPack(state.pack);
bindEvents();
checkApiStatus();
