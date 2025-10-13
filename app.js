const sitesEl = document.getElementById("sites");
const lastRunEl = document.getElementById("lastRun");
const btnToggle = document.getElementById("btnToggle");
const btnNotify = document.getElementById("btnNotify");
const beep = document.getElementById("beep");

// 檢查頻率（毫秒）
const INTERVAL_MS = 2 * 60 * 1000; // 2 分鐘
let timer = null;
let lastNotified = {}; // 避免重複通知: { siteName_date: timestamp }

function statusClass(s) {
  if (s === "OK") return "ok";
  if (s === "WARN") return "warn";
  return "bad";
}

function initUI() {
  sitesEl.innerHTML = "";
  WATCH_SITES.forEach((s, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "site";
    wrap.innerHTML = `
      <div class="row" style="border-bottom:none">
        <div><b>${s.name}</b></div>
        <a href="${s.url}" target="_blank" class="small">打開預約頁</a>
      </div>
      <div id="grid-${idx}" class="grid"></div>
    `;
    sitesEl.appendChild(wrap);
  });
}

function ensureNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function notifyOnce(siteName, date, text) {
  const key = `${siteName}_${date}`;
  const now = Date.now();
  // 15 分鐘內不重覆
  if (lastNotified[key] && now - lastNotified[key] < 15 * 60 * 1000) return;
  lastNotified[key] = now;

  try { beep && beep.play(); } catch(e) {}
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`【${siteName}】${date} 開放！`, { body: text });
  } else {
    alert(`【${siteName}】${date} 開放！\n${text}`);
  }
}

function classifyStatus(chunk) {
  const has = (arr) => arr.some(k => chunk.includes(k));
  if (has(OK_MARKS)) return "OK";
  if (has(WARN_MARKS)) return "WARN";
  if (has(BAD_MARKS)) return "BAD";
  // 若都沒有，嘗試根據符號推測
  if (/[○〇]/.test(chunk)) return "OK";
  if (/△/.test(chunk)) return "WARN";
  if (/×/.test(chunk)) return "BAD";
  return "BAD";
}

function extractForDates(html) {
  // 先壓縮空白
  const text = html.replace(/\s+/g, " ");
  const result = [];

  TARGET_DATES.forEach(dateKey => {
    // 找到日期附近 200 字做判定
    const idx = text.indexOf(dateKey);
    if (idx !== -1) {
      const around = text.slice(Math.max(0, idx - 150), idx + 200);
      const status = classifyStatus(around);
      result.push({ date: dateKey, raw: around, status });
    }
  });

  // 若完全找不到日期，回傳空陣列
  return result;
}

async function checkOnce() {
  for (let i = 0; i < WATCH_SITES.length; i++) {
    const s = WATCH_SITES[i];
    const grid = document.getElementById(`grid-${i}`);
    try {
      const resp = await fetch(`${WORKER_BASE}/?url=${encodeURIComponent(s.url)}`, {
        headers: { "Accept": "text/html" },
      });
      const html = await resp.text();

      const rows = extractForDates(html);
      if (rows.length === 0) {
        grid.innerHTML = `<div class="row"><div>找不到 10/29–10/31 的日期元素</div><div class="status bad">?</div></div>`;
        continue;
      }

      grid.innerHTML = "";
      rows.forEach(r => {
        const lc = statusClass(r.status);
        grid.insertAdjacentHTML("beforeend", `
          <div class="row">
            <div>${r.date}</div>
            <div class="status ${lc}">${r.status === "OK" ? "○ 可預約" : r.status === "WARN" ? "△ 少量" : "× 額滿"}</div>
          </div>
        `);
        // 當 ○ / △ 就通知
        if (r.status === "OK" || r.status === "WARN") {
          notifyOnce(s.name, r.date, r.raw.slice(0, 120));
        }
      });

    } catch (e) {
      grid.innerHTML = `<div class="row"><div>抓取失敗</div><div class="status bad">ERR</div></div>`;
      console.error("fetch error", s.name, e);
    }
  }
  lastRunEl.textContent = `最後檢查：${new Date().toLocaleTimeString()}`;
}

btnNotify.addEventListener("click", async () => {
  ensureNotificationPermission();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("通知測試", { body: "可以收到通知囉！" });
  } else {
    alert("通知權限未開啟，請允許瀏覽器通知。");
  }
});

btnToggle.addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    btnToggle.textContent = "開始監測";
  } else {
    checkOnce();
    timer = setInterval(checkOnce, INTERVAL_MS);
    btnToggle.textContent = "停止監測";
  }
});

initUI();
ensureNotificationPermission();
