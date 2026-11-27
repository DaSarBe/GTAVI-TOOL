(function () {
  var items = window.HIDDEN_ITEMS || [];
  var el = document.getElementById('map');
  var W = +el.dataset.width || 4000, H = +el.dataset.height || 4000;
  var bounds = [[0, 0], [H, W]];

  var map = L.map('map', {
    crs: L.CRS.Simple, minZoom: -3, maxZoom: 1, zoomSnap: 0.25,
    maxBounds: [[-H * 0.2, -W * 0.2], [H * 1.2, W * 1.2]], attributionControl: false, zoomControl: false
  });
  L.control.zoom({ position: 'bottomright' }).addTo(map);

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
      h += '<p><b>' + (it.puzzle ? '🧩 解謎／闖關流程' : '取得方式') + '：</b></p><ol>';
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

  // ===== 分區 =====
  var areas = window.MAP_AREAS || [];
  function inPoly(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  var areaById = {};
  areas.forEach(function (a) { areaById[a.id] = a; });
  items.forEach(function (it) {
    it._area = '';
    if (typeof it.x !== 'number') return;
    for (var i = 0; i < areas.length; i++) {
      if (inPoly(it.x, it.y, areas[i].polygon)) { it._area = areas[i].id; break; }
    }
    var card = document.getElementById('item-' + it.id);
    var label = card && card.querySelector('.area-name');
    if (label && it._area) label.textContent = areaById[it._area].name + ' ・ ';
  });
  function toLatLngs(poly) { return poly.map(function (p) { return [H - p[1], p[0]]; }); }
  var areaLayer = null;
  function showArea(id) {
    if (areaLayer) { areaLayer.remove(); areaLayer = null; }
    var desc = document.getElementById('f-area-desc');
    if (!id || !areaById[id]) { desc.hidden = true; map.fitBounds(bounds); return; }
    var a = areaById[id], ring = toLatLngs(a.polygon);
    var outer = [[-H, -W], [-H, 2 * W], [2 * H, 2 * W], [2 * H, -W]];
    areaLayer = L.layerGroup([
      L.polygon([outer, ring], { stroke: false, fillColor: '#05040a', fillOpacity: 0.55, interactive: false }),
      L.polygon(ring, { color: '#ffd23f', weight: 3, dashArray: '10 8', fill: false, interactive: false })
    ]).addTo(map);
    map.fitBounds(L.latLngBounds(ring), { padding: [20, 20] });
    desc.textContent = '範圍包含：' + a.desc + '（邊界為大略範圍）';
    desc.hidden = false;
  }

  var markers = {};
  items.forEach(function (it) {
    if (typeof it.x !== 'number' || typeof it.y !== 'number') return;
    var icon = L.divIcon({
      className: 'pin pin-' + it.type + (it.approx ? ' pin-approx' : ''),
      html: '<span>' + (it.type === 'weapon' ? '🔫' : '🚗') + '</span>',
      iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26]
    });
    var m = L.marker([H - it.y, it.x], { icon: icon, title: it.name })
      .bindPopup(popupHtml(it), { maxWidth: Math.min(340, el.clientWidth - 60), minWidth: Math.min(240, el.clientWidth - 60), maxHeight: Math.max(220, Math.min(440, el.clientHeight - 90)), autoPanPadding: [12, 12] });
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
    if (fRegion.value && it._area !== fRegion.value) return false;
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
  [fWeapon, fVehicle, fPuzzle].forEach(function (f) { f.addEventListener('change', apply); });
  fRegion.addEventListener('change', function () { apply(); showArea(fRegion.value); });
  apply();

  // 讓大頭針停在地圖偏下方，上方留空間給說明卡
  function focus(m) {
    var z = 0;
    var pt = map.project(m.getLatLng(), z).subtract([0, el.clientHeight * 0.3]);
    map.setView(map.unproject(pt, z), z, { animate: false });
    m.openPopup();
  }

  document.querySelectorAll('.show-on-map').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = markers[b.dataset.id];
      if (!m) return;
      if (!map.hasLayer(m)) m.addTo(map);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focus(m);
    });
  });

  // 網址帶 #item-xxx 時直接打開該大頭針
  var hash = location.hash.replace('#item-', '');
  if (hash && markers[hash]) focus(markers[hash]);
})();
