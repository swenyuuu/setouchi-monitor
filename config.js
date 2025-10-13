// 將你的 Worker URL 填進來（末尾不要斜線）
const WORKER_BASE = "https://<你的workers子網域>.workers.dev";

const WATCH_SITES = [
  {
    name: "Page A",
    url: "https://benesse-artsite.eventos.tokyo/web/portal/797/event/8483/module/booth/239565/176695?language=eng"
  },
  {
    name: "Page B",
    url: "https://benesse-artsite.eventos.tokyo/web/portal/797/event/8483/module/booth/239565/185773?language=eng"
  },
  {
    name: "Page C",
    url: "https://benesse-artsite.eventos.tokyo/web/portal/797/event/8483/module/booth/239565/185772?language=eng"
  },
];

// 你要看的日期（字串比對，多樣式避免網站顯示差異）
const TARGET_DATES = [
  "10/29", "10/30", "10/31",      // mm/dd
  "Oct 29", "Oct 30", "Oct 31",   // 英文月名
  "2025-10-29", "2025-10-30", "2025-10-31",
  "2025/10/29", "2025/10/30", "2025/10/31"
];

// 狀態符號與關鍵字
const OK_MARKS   = ["○", "〇", "Available", "空きあり", "予約可能", "Open"];
const WARN_MARKS = ["△", "Few", "Limited"];
const BAD_MARKS  = ["×", "Sold out", "Unavailable", "満席", "受付終了"];
