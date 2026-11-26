(function () {
  var items = window.HIDDEN_ITEMS || [];
  var el = document.getElementById('map');
  var W = +el.dataset.width || 4000, H = +el.dataset.height || 4000;
  var bounds = [[0, 0], [H, W]];

  var map = L.map('map', {
    crs: L.CRS.Simple, minZoom: -3, maxZoom: 2, zoomSnap: 0.25,
    maxBounds: [[-H * 0.2, -W * 0.2], [H * 1.2, W * 1.2]], attributionControl: false
  });

  if (el.dataset.image) {
    L.imageOverlay(el.dataset.image, bounds).addTo(map);
  } else {
    L.rectangle(bounds, { color: '#2e2840', weight: 1, fillColor: '#1c1828', fillOpacity: 1 }).addTo(map);
    L.marker([H / 2, W / 2], {
      icon: L.divIcon({ className: 'map-placeholder', html: '地圖底圖準備中', iconSize: [200, 40], iconAnchor: [100, 20] }),
      interactive: false
    }).addTo(map);
  }
  map.fitBounds(bounds);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ytId(url) {
    if (!url) return null;
    var m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function popupHtml(it) {
    var h = '<div class="pin-popup">';
    h += '<h3>' + (it.type === 'weapon' ? '🔫 ' : '🚗 ') + esc(it.name) + (it.name_zh ? '（' + esc(it.name_zh) + '）' : '') + '</h3>';
    h += '<p class="meta">' + esc(it.region) + (it.subtype ? ' ・ ' + esc(it.subtype) : '') +
         (it.approx ? ' ・ <span class="approx">大約位置</span>' : '') + ' ・ ' + esc(it.status) + '</p>';
    h += '<p><b>位置：</b>' + esc(it.location) + '</p>';
    if (it.steps && it.steps.length) {
      h += '<p><b>' + (it.puzzle ? '🧩 解謎流程' : '取得方式') + '：</b></p><ol>';
      it.steps.forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
      h += '</ol>';
    }
    var id = ytId(it.video);
    if (id) {
      h += '<div class="yt" data-yt="' + id + '"></div><p class="meta">第三方影片，僅供參考</p>';
    } else if (it.video) {
      h += '<p><b>示範影片：</b><a href="' + esc(it.video) + '" target="_blank" rel="noopener">' + esc(it.video_title || it.video) + '</a></p>';
    }
    if (it.sources && it.sources.length) {
      h += '<p class="meta">來源：' + it.sources.map(function (s, i) {
        return '<a href="' + esc(s) + '" target="_blank" rel="noopener">[' + (i + 1) + ']</a>';
      }).join(' ') + '</p>';
    }
    return h + '</div>';
  }

  var markers = {};
  items.forEach(function (it) {
    if (typeof it.x !== 'number' || typeof it.y !== 'number') return;
    var icon = L.divIcon({
      className: 'pin pin-' + it.type + (it.approx ? ' pin-approx' : ''),
      html: '<span>' + (it.type === 'weapon' ? '🔫' : '🚗') + '</span>',
      iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30]
    });
    var m = L.marker([H - it.y, it.x], { icon: icon, title: it.name })
      .bindPopup(popupHtml(it), { maxWidth: 360, minWidth: 260 });
    m.item = it;
    markers[it.id] = m;
  });

  // 開啟大頭針時才載入 YouTube，避免一次載入太多影片
  map.on('popupopen', function (e) {
    var box = e.popup.getElement().querySelector('.yt[data-yt]');
    if (box && !box.firstChild) {
      box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + box.dataset.yt +
        '" title="示範影片" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    }
  });

  var fRegion = document.getElementById('f-region');
  var fWeapon = document.getElementById('f-weapon');
  var fVehicle = document.getElementById('f-vehicle');
  var fPuzzle = document.getElementById('f-puzzle');
  var fCount = document.getElementById('f-count');

  function visible(it) {
    if (fRegion.value && it.region !== fRegion.value) return false;
    if (it.type === 'weapon' && !fWeapon.checked) return false;
    if (it.type !== 'weapon' && !fVehicle.checked) return false;
    if (fPuzzle.checked && !it.puzzle) return false;
    return true;
  }

  function apply() {
    var n = 0;
    items.forEach(function (it) {
      var show = visible(it);
      var m = markers[it.id];
      if (m) { if (show) m.addTo(map); else m.remove(); }
      var card = document.getElementById('item-' + it.id);
      if (card) card.hidden = !show;
      if (show) n++;
    });
    fCount.textContent = '顯示 ' + n + ' / ' + items.length + ' 項';
  }
  [fRegion, fWeapon, fVehicle, fPuzzle].forEach(function (f) { f.addEventListener('change', apply); });
  apply();

  document.querySelectorAll('.show-on-map').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = markers[b.dataset.id];
      if (!m) return;
      if (!map.hasLayer(m)) m.addTo(map);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      map.setView(m.getLatLng(), 0);
      m.openPopup();
    });
  });

  // 網址帶 #item-xxx 時直接打開該大頭針
  var hash = location.hash.replace('#item-', '');
  if (hash && markers[hash]) { map.setView(markers[hash].getLatLng(), 0); markers[hash].openPopup(); }
})();
