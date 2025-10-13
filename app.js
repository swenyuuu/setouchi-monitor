// === app.js (跨月自動支援版) ===
const sitesEl = document.getElementById("sites");
const lastRunEl = document.getElementById("lastRun");
const btnToggle = document.getElementById("btnToggle");
const btnNotify = document.getElementById("btnNotify");
const beep = document.getElementById("beep");

const INTERVAL_MS = 2 * 60 * 1000; // 每2分鐘檢查一次
let timer = null;
let lastNotified = {};

function ymdToKey(y, m, d) {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

// stock_status：1=○ 可預約、2=△ 少量、3=× 額滿
function statusTextFromDay(dayObj) {
  if (!dayObj) return "? 無資料";
  if (dayObj.is_close_date) return "× Closed";
  const s = Number(dayObj.stock_status);
  if (s === 1) return "○ 可預約";
  if (s === 2) return "△ 少量";
  return "× 額滿";
}
function statusClassFromText(t) {
  if (t.startsWith("○")) return "ok";
  if (t.startsWith("△")) return "warn";
  return "bad";
}

function ensureNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") Notification.requestPermission();
}

function notifyOnce(siteName, date, text) {
  const key = `${siteName}_${date}`;
  const now = Date.now();
  if (lastNotified[key] && now - lastNotified[key] < 15 * 60 * 1000) return; // 15分鐘內不重複通知
  lastNotified[key] = now;
  try { beep && beep.play(); } catch (_) {}
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`【${siteName}】${date} 開放！`, { body: text });
  } else {
    alert(`【${siteName}】${date} 開放！\n${text}`);
  }
}

function initUI() {
  sitesEl.innerHTML = "";
  SITES.forEach((s, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "site";
    wrap.innerHTML = `
      <div class="row" style="border-bottom:none">
        <div><b>${s.name}</b></div>
        <a href="${s.bookingUrl}" target="_blank" class="small">打開預約頁</a>
      </div>
      <div id="grid-${idx}" class="grid"></div>
    `;
    sitesEl.appendChild(wrap);
  });
}

async function fetchCalendarJson(facilityId, year, month) {
  const api = calendarApi(facilityId, year, month);
  const url = `${WORKER_BASE}/?url=${encodeURIComponent(api)}`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  const txt = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error("JSON parse error: " + txt.slice(0, 200));
  }
}

async function checkOnce() {
  for (let i = 0; i < SITES.length; i++) {
    const s = SITES[i];
    const grid = document.getElementById(`grid-${i}`);

    if (!s.facilityId && s.facilityId !== 0) {
      grid.innerHTML = `<div class="row"><div>請在 config.js 填入 facilityId</div><div class="status bad">—</div></div>`;
      continue;
    }

    grid.innerHTML = `<div class="row"><div>讀取中...</div><div class="status">…</div></div>`;

    try {
      // 🔹 自動分組日期 → 每個月份打一次 API
      const datesByMonth = {};
      TARGET_DATES.forEach((dateStr) => {
        const [y, m] = dateStr.split("-").map(Number);
        const key = `${y}-${m}`;
        if (!datesByMonth[key]) datesByMonth[key] = [];
        datesByMonth[key].push(dateStr);
      });

      // 🔹 一次打多個月份 API
      const allData = new Map();
      for (const key of Object.keys(datesByMonth)) {
        const [year, month] = key.split("-").map(Number);
        const data = await fetchCalendarJson(s.facilityId, year, month);
        (data.data || []).forEach((d) => {
          const k = ymdToKey(year, month, d.day);
          allData.set(k, d);
        });
      }

      // 🔹 組結果表
      grid.innerHTML = "";
      TARGET_DATES.forEach((dateKey) => {
        const d = allData.get(dateKey);
        const label = statusTextFromDay(d);
        const cls = statusClassFromText(label);
        grid.insertAdjacentHTML(
          "beforeend",
          `<div class="row"><div>${dateKey}</div><div class="status ${cls}">${label}</div></div>`
        );
        if (label.startsWith("○") || label.startsWith("△")) {
          notifyOnce(s.name, dateKey, label);
        }
      });
    } catch (e) {
      grid.innerHTML = `<div class="row"><div>抓取失敗：${e.message}</div><div class="status bad">ERR</div></div>`;
      console.error("fetch error", s.name, e);
    }
  }
  lastRunEl.textContent = `最後檢查：${new Date().toLocaleTimeString()}`;
}

// === 事件區 ===
btnNotify.addEventListener("click", () => {
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

// === 初始化 ===
initUI();
ensureNotificationPermission();

