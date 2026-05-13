const state = {
  audience: "给自己",
  emotion: "鼓励",
  tone: "真诚",
  length: "小卡片",
};

const presets = {
  audience: ["给自己", "给朋友", "给老师", "给家人", "给暗恋的人", "给劳动者"],
  emotion: ["鼓励", "感谢", "陪伴", "勇气", "喜欢", "祝福", "想念"],
  tone: ["真诚", "校园", "诗意", "程序员"],
  length: ["短句", "小卡片", "完整信件"],
};

const els = {
  apiStatus: document.querySelector("#apiStatus"),
  recipientName: document.querySelector("#recipientName"),
  memory: document.querySelector("#memory"),
  generateBtn: document.querySelector("#generateBtn"),
  randomBtn: document.querySelector("#randomBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  giftBox: document.querySelector("#giftBox"),
  sparkField: document.querySelector("#sparkField"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMessage: document.querySelector("#resultMessage"),
  codeLine: document.querySelector("#codeLine"),
  sourceTag: document.querySelector("#sourceTag"),
  timeTag: document.querySelector("#timeTag"),
  toast: document.querySelector("#toast"),
};

let latestText = "";

function bindChoiceButtons() {
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
  return {
    recipientName: els.recipientName.value.trim(),
    audience: state.audience,
    emotion: state.emotion,
    tone: state.tone,
    length: state.length,
    memory: els.memory.value.trim(),
  };
}

async function generateBlessing() {
  const payload = payloadFromForm();
  setLoading(true);
  openGift(false);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    openGift(true);
    paintResult(data);
    burstSparks(data.palette);
  } catch (error) {
    openGift(true);
    paintResult({
      source: "local",
      title: "备用温柔已送达",
      kicker: "离线盲盒",
      message:
        "今天的生成服务开了一个小差，但你的心意没有掉线。\n愿这份祝福像一盏灯，照亮正在努力的你，也照亮你想认真对待的人。",
      codeLine: 'if (world.isNoisy()) { heart.keep("soft"); }',
    });
    burstSparks();
    showToast("生成服务暂时不可用，已切换本地文案");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  els.generateBtn.disabled = isLoading;
  els.generateBtn.innerHTML = isLoading
    ? '<span aria-hidden="true">✦</span> 正在开盒'
    : '<span aria-hidden="true">✦</span> 开启盲盒';
  els.giftBox.classList.toggle("loading", isLoading);
}

function openGift(isOpened) {
  els.giftBox.classList.toggle("opened", isOpened);
}

function paintResult(data) {
  const title = data.title || "一份刚刚拆开的温柔";
  const message = data.message || "";
  const codeLine = data.codeLine || 'warmth.send({ to: "you" })';
  const sourceName = data.source === "deepseek" ? "DeepSeek 生成" : "本地模板";

  els.resultKicker.textContent = data.kicker || "今日盲盒";
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

function burstSparks(palette = ["#ff7d67", "#f4c95d", "#47b88c", "#6ba9d6"]) {
  els.sparkField.innerHTML = "";
  const count = 34;

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement("i");
    const angle = (Math.PI * 2 * index) / count;
    const distance = 72 + Math.random() * 150;
    const x = `${Math.cos(angle) * distance}px`;
    const y = `${Math.sin(angle) * distance - 36}px`;
    const color = palette[index % palette.length];

    spark.className = "spark";
    spark.style.setProperty("--x", x);
    spark.style.setProperty("--y", y);
    spark.style.setProperty("--size", `${6 + Math.random() * 8}px`);
    spark.style.setProperty("--color", color);
    spark.style.animationDelay = `${Math.random() * 120}ms`;
    els.sparkField.appendChild(spark);
  }

  window.setTimeout(() => {
    els.sparkField.innerHTML = "";
  }, 1100);
}

function randomizeChoices() {
  Object.entries(presets).forEach(([key, values]) => {
    const value = values[Math.floor(Math.random() * values.length)];
    state[key] = value;
    const group = document.querySelector(`[data-choice-group="${key}"]`);
    group.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === value);
    });
  });

  const memories = [
    "谢谢你把普通的一天过得很认真。",
    "希望疲惫的时候，也有人替你把灯留着。",
    "我们都在慢慢长大，也都值得被温柔拥抱。",
    "愿每一份努力，都能在某天开出亮亮的花。",
  ];
  els.memory.value = memories[Math.floor(Math.random() * memories.length)];
  showToast("已随机装入一份心意");
}

async function copyResult() {
  if (!latestText) {
    showToast("先开启一次盲盒，再复制结果");
    return;
  }

  try {
    await navigator.clipboard.writeText(latestText);
    showToast("已复制到剪贴板");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = latestText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    showToast("已复制到剪贴板");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1900);
}

bindChoiceButtons();
checkApiStatus();
els.generateBtn.addEventListener("click", generateBlessing);
els.randomBtn.addEventListener("click", randomizeChoices);
els.copyBtn.addEventListener("click", copyResult);
