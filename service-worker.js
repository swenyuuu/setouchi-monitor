self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => self.clients.claim());
// 先不用處理 push，之後要做真正 Web Push 我再幫你加
