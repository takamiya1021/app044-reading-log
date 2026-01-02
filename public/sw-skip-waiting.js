// SKIP_WAITINGメッセージを受け取ってService Workerを即座に有効化
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
