const https = require("https");
const fs = require("fs");
const path = require("path");

const ASSETS = [
  {
    id: "kospi",
    symbol: "^KS11",
    name: "KOSPI Composite Index",
    displayName: "KOSPI",
    kind: "index",
    range: "5y",
    currency: "KRW",
  },
  {
    id: "mu",
    symbol: "MU",
    name: "Micron Technology",
    displayName: "MU",
    kind: "stock",
    range: "5y",
    currency: "USD",
  },
  {
    id: "soxl",
    symbol: "SOXL",
    name: "Direxion Daily Semiconductor Bull 3X Shares",
    displayName: "SOXL",
    kind: "leveraged-etf",
    range: "5y",
    currency: "USD",
  },
  {
    id: "msci",
    symbol: "URTH",
    name: "iShares MSCI World ETF",
    displayName: "MSCI World ETF",
    kind: "msci-proxy",
    range: "5y",
    currency: "USD",
    note: "MSCI World exposure proxy via URTH",
  },
  {
    id: "sox",
    symbol: "^SOX",
    name: "PHLX Semiconductor Index",
    displayName: "SOXX",
    kind: "index",
    range: "5y",
    currency: "USD",
  },
  {
    id: "dram",
    symbol: "DRAM",
    name: "Roundhill Memory ETF",
    displayName: "DRAM",
    kind: "memory-etf",
    range: "5y",
    currency: "USD",
  },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json,text/plain,*/*",
        },
        timeout: 15000,
      },
      (response) => {
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Yahoo Finance returned ${response.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("Yahoo Finance request timed out")));
    req.on("error", reject);
  });
}

function round(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toDate(sec) {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

function getZone(disparity) {
  if (disparity == null) return "unknown";
  if (disparity >= 130) return "overheated";
  if (disparity >= 120) return "warning";
  if (disparity > 105) return "normal";
  return "cooled";
}

function getZoneLabel(zone) {
  return {
    overheated: "\uACFC\uC5F4",
    warning: "\uACBD\uACC4",
    normal: "\uC815\uC0C1",
    cooled: "\uACFC\uC5F4\uD574\uC18C",
    unknown: "\uB370\uC774\uD130 \uC900\uBE44 \uC911",
  }[zone];
}

function pct(now, before) {
  if (now == null || before == null || before === 0) return null;
  return round(((now - before) / before) * 100, 2);
}

function valueBack(points, sessions) {
  if (!points.length) return null;
  const index = Math.max(0, points.length - 1 - sessions);
  return points[index]?.close ?? null;
}

function buildAssetPayload(asset, raw) {
  const result = raw?.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${asset.symbol}`);

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const points = [];
  const maWindow = [];
  let maSum = 0;
  let prevClose = null;

  for (let index = 0; index < timestamps.length; index += 1) {
    const close = closes[index];
    if (close == null || Number.isNaN(close)) continue;

    maWindow.push(close);
    maSum += close;
    if (maWindow.length > 50) maSum -= maWindow.shift();

    const ma50 = maWindow.length === 50 ? maSum / 50 : null;
    const disparity = ma50 ? (close / ma50) * 100 : null;
    const zone = asset.id === "kospi" ? getZone(disparity) : undefined;

    points.push({
      date: toDate(timestamps[index]),
      close: round(close, 2),
      ma50: round(ma50, 2),
      disparity: round(disparity, 2),
      changePercent: prevClose ? pct(close, prevClose) : null,
      zone,
      zoneLabel: zone ? getZoneLabel(zone) : undefined,
    });
    prevClose = close;
  }

  const complete = points.filter((point) => point.close != null);
  const latest = complete.at(-1);
  const previous = complete.at(-2);
  const latestClose = latest?.close;

  return {
    ...asset,
    sourceSymbol: result.meta?.symbol || asset.symbol,
    exchangeName: result.meta?.exchangeName || null,
    fetchedAt: new Date().toISOString(),
    marketTime: result.meta?.regularMarketTime
      ? new Date(result.meta.regularMarketTime * 1000).toISOString()
      : null,
    latest: latest
      ? {
          ...latest,
          previousClose: previous?.close ?? null,
          change: previous?.close != null ? round(latestClose - previous.close, 2) : null,
          dayChangePercent: previous?.close != null ? pct(latestClose, previous.close) : null,
        }
      : null,
    returns: {
      sessions5: pct(latestClose, valueBack(complete, 5)),
      month1: pct(latestClose, valueBack(complete, 21)),
      month3: pct(latestClose, valueBack(complete, 63)),
      month6: pct(latestClose, valueBack(complete, 126)),
    },
    points: complete,
  };
}

async function fetchAsset(asset) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    asset.symbol
  )}?range=${asset.range}&interval=1d&includePrePost=false&events=history`;
  const raw = await fetchJson(url);
  return buildAssetPayload(asset, raw);
}

function readExistingPayload(outputPath) {
  if (!fs.existsSync(outputPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch {
    return null;
  }
}

function isNewerAsset(candidate, current) {
  if (!candidate?.latest?.date) return false;
  if (!current?.latest?.date) return true;
  if (candidate.latest.date !== current.latest.date) {
    return candidate.latest.date > current.latest.date;
  }
  return (candidate.fetchedAt || "") > (current.fetchedAt || "");
}

async function buildPayload(existing) {
  const fetchedAssets = {};

  for (const asset of ASSETS) {
    try {
      const fetched = await fetchAsset(asset);
      const current = existing?.assets?.[asset.id];
      fetchedAssets[asset.id] = isNewerAsset(fetched, current) ? fetched : current;
      const mode = fetchedAssets[asset.id] === fetched ? "updated" : "kept existing";
      console.log(`${mode}: ${asset.id} latest ${fetchedAssets[asset.id].latest?.date}`);
    } catch (error) {
      const current = existing?.assets?.[asset.id];
      if (current?.latest?.date) {
        fetchedAssets[asset.id] = current;
        console.warn(`fetch failed, keeping ${asset.id}: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "Yahoo Finance chart API",
    assets: fetchedAssets,
  };
}

async function main() {
  const outputPath = path.join(__dirname, "..", "public", "data", "market.json");
  const existing = readExistingPayload(outputPath);
  const payload = await buildPayload(existing);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote market data to ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
