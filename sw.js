// BAFC duty board service worker: shows push alerts and opens the board's Messages tab.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'BAFC', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'BAFC message', {
    body: d.body || '',
    tag: d.tag || undefined,
    icon: 'icon-192.png',
    badge: 'badge-72.png',
    requireInteraction: !!d.urgent,
    vibrate: d.urgent ? [300, 100, 300, 100, 300] : [200],
    data: { url: d.url || './#messages' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './#messages', self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (url.includes('call.html')) {               // dispatch alert: open the call page
      const any = all.find(c => c.url.startsWith(self.registration.scope));
      if (any && 'navigate' in any) { await any.navigate(url); await any.focus(); return; }
      await self.clients.openWindow(url); return;
    }
    const board = all.find(c => c.url.startsWith(self.registration.scope) && !c.url.includes('display.html') && !c.url.includes('admin.html'));
    if (board) { await board.focus(); board.postMessage('open-messages'); return; }
    await self.clients.openWindow(url);
  })());
});
