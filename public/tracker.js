(function () {
  'use strict';
  try {
    var p = window.location.pathname,
      r = document.referrer || null,
      d = JSON.stringify({ path: p, referrer: r }),
      u = '/api/analytics/view';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(u, new Blob([d], { type: 'application/json' }));
    } else {
      fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: d,
        keepalive: true,
      }).catch(function () {});
    }
    window.trackProjectClick = function (id, t) {
      if (!id || !t) return;
      var cd = JSON.stringify({ projectId: id, clickType: t }),
        cu = '/api/analytics/click';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(cu, new Blob([cd], { type: 'application/json' }));
      } else {
        fetch(cu, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: cd,
          keepalive: true,
        }).catch(function () {});
      }
    };
  } catch (e) {}
})();
