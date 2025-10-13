// === config.js ===
// 1) 把下面換成你的 Cloudflare Worker 網址（末尾不要加斜線）
const WORKER_BASE = "https://setouchi-monitor.cwyu0722.workers.dev";  // TODO: 改成你的

// 2) 你要監測的日期（YYYY-MM-DD）
const TARGET_DATES = [ "2025-10-29", "2025-10-30", "2025-10-31"];

// 3) 要監看的場館（facilityId 來自 Network → XHR：/facility-calendar-ticket/{id}）
//    下面先放好 Chichu（id=3）。Page B / Page C 請把 facilityId 補上數字即可。
const SITES = [
  {
    name: "Chichu Art Museum",
    bookingUrl:
      "https://benesse-artsite.eventos.tokyo/web/portal/797/event/8483/module/booth/239565/176695?language=eng",
    facilityId: 3, // ✅ 已確定
  },
  {
    name: "Page B",
    bookingUrl:
      "https://benesse-artsite.eventos.tokyo/web/portal/797/event/8483/module/booth/239565/185773?language=eng",
    facilityId: 5, // TODO: 在 Network 找 /facility-calendar-ticket/{id} 把 id 貼過來（數字）
  },
  {
    name: "Page C",
    bookingUrl:
      "https://benesse-artsite.eventos.tokyo/web/portal/797/event/8483/module/booth/239565/185772?language=eng",
    facilityId: null, // TODO: 同上
  },
];

// 4) 目標年月（API 需要 year / month）
const TARGET_YEAR = 2025;
const TARGET_MONTH = 10;

// 5) 後端 JSON 端點（固定樣式）
function calendarApi(facilityId, year, month) {
  return `https://web.admin-benesse-artsite.com/api/v1/facility-calendar-ticket/${facilityId}?year=${year}&month=${month}`;
}
