(() => {
  'use strict';
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('tms-driver-sw.js').catch(() => {});
  }
})();
