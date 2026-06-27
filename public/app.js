const state = {
  payload: null,
  assets: {},
  strategies: [],
  editingId: "",
};

const assetLabels = {
  kospi: "KOSPI",
  mu: "MU",
  soxl: "SOXL",
  msci: "MSCI World ETF",
  sox: "SOXX",
  dram: "DRAM",
  market: "전체 시장",
};

const triggerLabels = {
  cooled: "KOSPI ≤105",
  normal: "KOSPI 105-120",
  warning: "KOSPI 120-130",
  overheated: "KOSPI ≥130",
  uptrend: "상승 추세",
  downtrend: "하락 추세",
  volatility: "변동성 확대",
  watch: "관찰",
};

const defaultStrategies = [
  {
    id: "kospi-cooled",
    asset: "kospi",
    trigger: "cooled",
    title: "KOSPI 과열해소 후 회복 후보 점검",
    stance: "분할매수",
    checklist: ["50일선 회복 여부 확인", "MU와 SOX가 동반 회복하는지 확인", "2-3회로 나눠 진입"],
    memo: "KOSPI가 105 이하로 식었을 때는 반등 확인 후 분할 접근합니다.",
  },
  {
    id: "kospi-normal",
    asset: "kospi",
    trigger: "normal",
    title: "KOSPI 정상 구간 추세 유지",
    stance: "추세추종",
    checklist: ["SOX와 MU가 50일선 위인지 확인", "SOXL은 비중 상한을 정해 운용", "신규 진입은 눌림 기준 설정"],
    memo: "정상 구간에서는 추세 지속과 리스크 관리를 같이 봅니다.",
  },
  {
    id: "kospi-warning",
    asset: "kospi",
    trigger: "warning",
    title: "KOSPI 경계 구간 속도 조절",
    stance: "비중축소",
    checklist: ["SOXL 추격매수 중단", "MU 급등분 일부 이익 실현 검토", "DRAM ETF와 SOX가 꺾이는지 확인"],
    memo: "120 이상은 상승이 이어져도 손익비가 나빠지기 쉬운 구간입니다.",
  },
  {
    id: "kospi-overheated",
    asset: "kospi",
    trigger: "overheated",
    title: "KOSPI 과열권 방어",
    stance: "현금확대",
    checklist: ["레버리지 비중 축소", "신규 매수보다 리스크 점검", "120 아래 재진입 기준 준비"],
    memo: "과열권에서는 계획 없는 추격보다 현금 확보를 우선합니다.",
  },
  {
    id: "mu-uptrend",
    asset: "mu",
    trigger: "uptrend",
    title: "MU 상승 추세 보유",
    stance: "추세추종",
    checklist: ["MU가 50일선 위인지 확인", "SOX와 DRAM ETF 동반 강세 확인", "실적 이벤트 전 비중 점검"],
    memo: "MU 단독 상승보다 메모리 ETF와 지수 확인이 더 중요합니다.",
  },
  {
    id: "soxl-volatility",
    asset: "soxl",
    trigger: "volatility",
    title: "SOXL 변동성 확대 대응",
    stance: "헤지",
    checklist: ["일간 변동률이 큰 날 신규 진입 제한", "손절 기준을 가격으로 명확히 설정", "다음 거래일 갭 리스크 고려"],
    memo: "SOXL은 3배 레버리지라 방향보다 포지션 크기가 먼저입니다.",
  },
  {
    id: "memory-uptrend",
    asset: "dram",
    trigger: "uptrend",
    title: "메모리 사이클 강세 확인",
    stance: "추세추종",
    checklist: ["DRAM ETF와 MU가 함께 상승하는지 확인", "SOX 대비 상대강도 확인", "급등 후 눌림 구간만 신규 진입"],
    memo: "메모리 테마는 MU와 DRAM ETF가 같이 움직일 때 신뢰도가 높습니다.",
  },
  {
    id: "market-downtrend",
    asset: "market",
    trigger: "downtrend",
    title: "반도체 위험 축소",
    stance: "현금확대",
    checklist: ["SOX와 MSCI가 동시에 50일선 아래인지 확인", "SOXL 비중을 우선 축소", "KOSPI 정상화 전까지 관찰"],
    memo: "시장 전체가 약하면 개별 종목 반등은 짧게 보고 대응합니다.",
  },
];

const els = {
  refreshButton: document.querySelector("#refreshButton"),
  overviewGrid: document.querySelector("#overviewGrid"),
  kospiCaption: document.querySelector("#kospiCaption"),
  kospiZone: document.querySelector("#kospiZone"),
  kospiDisparity: document.querySelector("#kospiDisparity"),
  gaugeFill: document.querySelector("#gaugeFill"),
  gaugePin: document.querySelector("#gaugePin"),
  activeStrategies: document.querySelector("#activeStrategies"),
  kospiChart: document.querySelector("#kospiChart"),
  relativeChart: document.querySelector("#relativeChart"),
  kospiChartCaption: document.querySelector("#kospiChartCaption"),
  dataSource: document.querySelector("#dataSource"),
  marketTable: document.querySelector("#marketTable"),
  strategyForm: document.querySelector("#strategyForm"),
  strategyId: document.querySelector("#strategyId"),
  strategyAsset: document.querySelector("#strategyAsset"),
  strategyTrigger: document.querySelector("#strategyTrigger"),
  strategyTitle: document.querySelector("#strategyTitle"),
  strategyStance: document.querySelector("#strategyStance"),
  strategyChecklist: document.querySelector("#strategyChecklist"),
  strategyMemo: document.querySelector("#strategyMemo"),
  newStrategy: document.querySelector("#newStrategy"),
  deleteStrategy: document.querySelector("#deleteStrategy"),
  restoreDefaults: document.querySelector("#restoreDefaults"),
  strategyList: document.querySelector("#strategyList"),
  toast: document.querySelector("#toast"),
};

function storageKey() {
  return "mu-soxl-kospi-dashboard-strategies-v1";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStrategies() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || "null");
    state.strategies = Array.isArray(saved) ? saved : clone(defaultStrategies);
  } catch {
    state.strategies = clone(defaultStrategies);
  }
}

function saveStrategies() {
  localStorage.setItem(storageKey(), JSON.stringify(state.strategies));
}

function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPct(value) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value > 0 ? "+" : ""}${formatNumber(value, 2)}%`;
}

function changeClass(value) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function setLoading(isLoading) {
  els.refreshButton.disabled = isLoading;
  els.refreshButton.classList.toggle("loading", isLoading);
}

function gaugePercent(disparity) {
  if (disparity == null) return 0;
  const clamped = Math.max(92, Math.min(140, disparity));
  return ((clamped - 92) / (140 - 92)) * 100;
}

function setZoneClass(element, zone) {
  element.classList.remove("cooled", "normal", "warning", "overheated");
  if (zone) element.classList.add(zone);
}

async function loadMarketData() {
  setLoading(true);
  try {
    const response = await fetch(`./data/market.json?t=${Date.now()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error("데이터 파일을 불러오지 못했습니다.");
    state.payload = payload;
    state.assets = payload.assets || {};
    renderAll();
  } catch (error) {
    showToast(error.message);
    els.dataSource.textContent = `데이터 연결 실패: ${error.message}`;
    drawEmpty(els.kospiChart, "데이터 연결을 확인해 주세요.");
    drawEmpty(els.relativeChart, "데이터 연결을 확인해 주세요.");
  } finally {
    setLoading(false);
  }
}

function renderOverview() {
  const order = ["kospi", "mu", "soxl", "msci", "sox", "dram"];
  els.overviewGrid.innerHTML = order
    .map((id) => {
      const asset = state.assets[id];
      const latest = asset?.latest || {};
      return `
        <article class="market-card">
          <div class="label">
            <span>${escapeHtml(asset?.displayName || assetLabels[id])}</span>
            <span class="change ${changeClass(latest.dayChangePercent)}">${formatPct(latest.dayChangePercent)}</span>
          </div>
          <div>
            <strong>${formatNumber(latest.close, asset?.currency === "KRW" ? 2 : 2)}</strong>
            <div class="date">${escapeHtml(asset?.symbol || "")} · ${latest.date || "--"}</div>
          </div>
          <div class="date">1개월 ${formatPct(asset?.returns?.month1)} · 3개월 ${formatPct(asset?.returns?.month3)}</div>
        </article>
      `;
    })
    .join("");
}

function marketSignal(asset) {
  const latest = asset?.latest;
  if (!latest) return "watch";
  const day = latest.dayChangePercent || 0;
  const month = asset.returns?.month1 || 0;
  const ma50 = latest.ma50;
  const close = latest.close;

  if (Math.abs(day) >= (asset.id === "soxl" ? 7 : 4)) return "volatility";
  if (ma50 && close > ma50 && month > 0) return "uptrend";
  if (ma50 && close < ma50 && month < 0) return "downtrend";
  return "watch";
}

function renderKospiSummary() {
  const kospi = state.assets.kospi;
  const latest = kospi?.latest;
  if (!latest) return;

  const zone = latest.zone;
  const percent = gaugePercent(latest.disparity);
  els.kospiDisparity.textContent = `${formatNumber(latest.disparity, 2)}%`;
  els.kospiZone.textContent = latest.zoneLabel || "--";
  setZoneClass(els.kospiZone, zone);
  els.gaugeFill.style.width = `${percent}%`;
  els.gaugePin.style.left = `${percent}%`;
  els.kospiCaption.textContent = `${latest.date} · KOSPI ${formatNumber(latest.close, 2)} · 50일선 ${formatNumber(latest.ma50, 2)}`;
}

function matchingStrategies() {
  const kospiZone = state.assets.kospi?.latest?.zone;
  const signals = Object.fromEntries(
    Object.entries(state.assets).map(([id, asset]) => [id, marketSignal(asset)])
  );
  const marketDown =
    ["mu", "soxl", "sox", "dram"].filter((id) => signals[id] === "downtrend").length >= 2;

  return state.strategies.filter((strategy) => {
    if (strategy.asset === "kospi") return strategy.trigger === kospiZone;
    if (strategy.asset === "market") return strategy.trigger === (marketDown ? "downtrend" : "watch");
    return signals[strategy.asset] === strategy.trigger;
  });
}

function renderActiveStrategies() {
  const active = matchingStrategies().slice(0, 4);
  const list = active.length ? active : [state.strategies.find((item) => item.id === "kospi-normal")];
  els.activeStrategies.innerHTML = list
    .filter(Boolean)
    .map(
      (strategy) => `
        <article class="active-item">
          <span>${assetLabels[strategy.asset] || strategy.asset} · ${triggerLabels[strategy.trigger] || strategy.trigger}</span>
          <h3>${escapeHtml(strategy.title)}</h3>
          <ul>${strategy.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <p>${escapeHtml(strategy.stance)} · ${escapeHtml(strategy.memo)}</p>
        </article>
      `
    )
    .join("");
}

function renderMarketTable() {
  const order = ["kospi", "mu", "soxl", "msci", "sox", "dram"];
  els.marketTable.innerHTML = order
    .map((id) => {
      const asset = state.assets[id];
      const latest = asset?.latest || {};
      const signal = marketSignal(asset);
      return `
        <tr>
          <td>${escapeHtml(asset?.displayName || assetLabels[id])}</td>
          <td>${latest.date || "--"}</td>
          <td>${formatNumber(latest.close, 2)}</td>
          <td><span class="change ${changeClass(latest.dayChangePercent)}">${formatPct(latest.dayChangePercent)}</span></td>
          <td>${formatPct(asset?.returns?.sessions5)}</td>
          <td>${formatPct(asset?.returns?.month1)}</td>
          <td>${formatPct(asset?.returns?.month3)}</td>
          <td>${triggerLabels[signal] || signal}</td>
        </tr>
      `;
    })
    .join("");
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * ratio));
  canvas.height = Math.max(260, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: canvas.width / ratio, height: canvas.height / ratio };
}

function drawEmpty(canvas, message) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#65716b";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(message, width / 2, height / 2);
}

function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

function drawGrid(ctx, plot, ticks, labels) {
  ctx.strokeStyle = "#dce3dc";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#65716b";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  ticks.forEach((tick, index) => {
    const y = plot.bottom - ((tick - plot.min) / (plot.max - plot.min)) * plot.height;
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.right, y);
    ctx.stroke();
    ctx.fillText(labels[index], plot.left - 8, y);
  });
}

function drawLine(ctx, points, plot, getValue, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  let started = false;
  points.forEach((point, index) => {
    const value = getValue(point);
    if (value == null) return;
    const x = plot.left + (index / Math.max(1, points.length - 1)) * plot.width;
    const y = plot.bottom - ((value - plot.min) / (plot.max - plot.min)) * plot.height;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function drawLegend(ctx, items, x, y) {
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let cursor = x;
  items.forEach((item) => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cursor, y);
    ctx.lineTo(cursor + 20, y);
    ctx.stroke();
    ctx.fillStyle = "#24312b";
    ctx.fillText(item.label, cursor + 26, y);
    cursor += item.width;
  });
}

function drawKospiChart() {
  const points = (state.assets.kospi?.points || []).slice(-380);
  if (!points.length) {
    drawEmpty(els.kospiChart, "KOSPI 데이터를 기다리는 중입니다.");
    return;
  }

  const { ctx, width, height } = setupCanvas(els.kospiChart);
  const plot = { left: 70, right: width - 18, top: 24, bottom: height - 38 };
  plot.width = plot.right - plot.left;
  plot.height = plot.bottom - plot.top;

  const values = points.flatMap((point) => [point.close, point.ma50]).filter(Boolean);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.12 || 100;
  plot.min = min - pad;
  plot.max = max + pad;

  ctx.clearRect(0, 0, width, height);
  const ticks = niceTicks(plot.min, plot.max);
  drawGrid(ctx, plot, ticks, ticks.map((tick) => formatNumber(tick, 0)));
  drawLine(ctx, points, plot, (point) => point.close, "#2869b8", 2.4);
  drawLine(ctx, points, plot, (point) => point.ma50, "#1f8a5b", 2);
  drawLegend(ctx, [
    { label: "KOSPI", color: "#2869b8", width: 78 },
    { label: "50일선", color: "#1f8a5b", width: 92 },
  ], plot.left, 14);

  ctx.fillStyle = "#65716b";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(points[0].date, plot.left, height - 14);
  ctx.textAlign = "right";
  ctx.fillText(points.at(-1).date, plot.right, height - 14);
  els.kospiChartCaption.textContent = `${points[0].date}부터 ${points.at(-1).date}까지`;
}

function normalize(points) {
  const clean = points.filter((point) => point.close != null);
  if (!clean.length) return [];
  const base = clean[0].close;
  return clean.map((point) => ({ date: point.date, value: (point.close / base) * 100 }));
}

function drawRelativeChart() {
  const ids = ["mu", "soxl", "sox", "dram", "msci"];
  const colors = {
    mu: "#2869b8",
    soxl: "#bd3f35",
    sox: "#6c4acb",
    dram: "#1f8a5b",
    msci: "#b97812",
  };
  const series = ids
    .map((id) => ({ id, label: assetLabels[id], points: normalize((state.assets[id]?.points || []).slice(-126)) }))
    .filter((item) => item.points.length);

  if (!series.length) {
    drawEmpty(els.relativeChart, "상대 흐름 데이터를 기다리는 중입니다.");
    return;
  }

  const { ctx, width, height } = setupCanvas(els.relativeChart);
  const plot = { left: 58, right: width - 18, top: 24, bottom: height - 38 };
  plot.width = plot.right - plot.left;
  plot.height = plot.bottom - plot.top;

  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const min = Math.min(...values, 90);
  const max = Math.max(...values, 110);
  const pad = (max - min) * 0.1 || 10;
  plot.min = min - pad;
  plot.max = max + pad;

  ctx.clearRect(0, 0, width, height);
  const ticks = niceTicks(plot.min, plot.max);
  drawGrid(ctx, plot, ticks, ticks.map((tick) => formatNumber(tick, 0)));
  series.forEach((item) => {
    drawLine(ctx, item.points, plot, (point) => point.value, colors[item.id], item.id === "soxl" ? 2.6 : 2);
  });
  drawLegend(
    ctx,
    series.map((item) => ({ label: item.label, color: colors[item.id], width: item.id === "msci" ? 132 : 86 })),
    plot.left,
    14
  );

  const reference = series[0].points;
  ctx.fillStyle = "#65716b";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(reference[0].date, plot.left, height - 14);
  ctx.textAlign = "right";
  ctx.fillText(reference.at(-1).date, plot.right, height - 14);
}

function renderStrategyList() {
  els.strategyList.innerHTML = state.strategies
    .map(
      (strategy) => `
        <article class="strategy-item">
          <span>${assetLabels[strategy.asset] || strategy.asset} · ${triggerLabels[strategy.trigger] || strategy.trigger}</span>
          <strong>${escapeHtml(strategy.title)}</strong>
          <p>${escapeHtml(strategy.stance)} · ${escapeHtml(strategy.checklist[0] || "")}</p>
          <button type="button" data-edit-id="${strategy.id}">수정</button>
        </article>
      `
    )
    .join("");
}

function fillStrategyForm(strategy) {
  const item = strategy || {
    id: "",
    asset: "kospi",
    trigger: "normal",
    title: "",
    stance: "관찰",
    checklist: [],
    memo: "",
  };
  state.editingId = item.id;
  els.strategyId.value = item.id;
  els.strategyAsset.value = item.asset;
  els.strategyTrigger.value = item.trigger;
  els.strategyTitle.value = item.title;
  els.strategyStance.value = item.stance;
  els.strategyChecklist.value = item.checklist.join("\n");
  els.strategyMemo.value = item.memo;
  els.deleteStrategy.disabled = !item.id;
}

function submitStrategy(event) {
  event.preventDefault();
  const id = els.strategyId.value || `custom-${Date.now()}`;
  const checklist = els.strategyChecklist.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const strategy = {
    id,
    asset: els.strategyAsset.value,
    trigger: els.strategyTrigger.value,
    title: els.strategyTitle.value.trim() || "새 전략",
    stance: els.strategyStance.value,
    checklist: checklist.length ? checklist : ["확인할 조건을 입력하세요."],
    memo: els.strategyMemo.value.trim(),
  };

  const index = state.strategies.findIndex((item) => item.id === id);
  if (index >= 0) state.strategies[index] = strategy;
  else state.strategies.unshift(strategy);
  saveStrategies();
  fillStrategyForm(strategy);
  renderStrategyList();
  renderActiveStrategies();
  showToast("전략을 저장했습니다.");
}

function deleteCurrentStrategy() {
  const id = els.strategyId.value;
  if (!id) return;
  state.strategies = state.strategies.filter((item) => item.id !== id);
  saveStrategies();
  fillStrategyForm();
  renderStrategyList();
  renderActiveStrategies();
  showToast("전략을 삭제했습니다.");
}

function renderAll() {
  renderOverview();
  renderKospiSummary();
  renderActiveStrategies();
  renderMarketTable();
  drawKospiChart();
  drawRelativeChart();
  renderStrategyList();

  const generated = state.payload?.generatedAt
    ? new Date(state.payload.generatedAt).toLocaleString("ko-KR")
    : "--";
  els.dataSource.textContent = `${state.payload?.source || "Yahoo Finance chart API"} · 갱신 ${generated}`;
}

function bindEvents() {
  els.refreshButton.addEventListener("click", loadMarketData);
  els.strategyForm.addEventListener("submit", submitStrategy);
  els.newStrategy.addEventListener("click", () => fillStrategyForm());
  els.deleteStrategy.addEventListener("click", deleteCurrentStrategy);
  els.restoreDefaults.addEventListener("click", () => {
    state.strategies = clone(defaultStrategies);
    saveStrategies();
    fillStrategyForm(state.strategies[0]);
    renderStrategyList();
    renderActiveStrategies();
    showToast("기본 전략으로 복원했습니다.");
  });
  els.strategyList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-id]");
    if (!button) return;
    const strategy = state.strategies.find((item) => item.id === button.dataset.editId);
    fillStrategyForm(strategy);
    document.querySelector(".strategy-editor").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  window.addEventListener("resize", () => {
    window.clearTimeout(bindEvents.resizeTimer);
    bindEvents.resizeTimer = window.setTimeout(() => {
      drawKospiChart();
      drawRelativeChart();
    }, 140);
  });
}

loadStrategies();
fillStrategyForm(state.strategies[0]);
bindEvents();
loadMarketData();
