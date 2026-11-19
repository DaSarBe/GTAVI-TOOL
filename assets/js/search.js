(function () {
  var script = document.currentScript;
  var input = document.getElementById('search');
  var list = document.getElementById('search-results');
  if (!input) return;
  var index = null;

  function load() {
    if (index) return Promise.resolve(index);
    return fetch(script.dataset.index).then(function (r) { return r.json(); })
      .then(function (d) { index = d; return d; });
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    if (!q) { list.innerHTML = ''; return; }
    load().then(function (data) {
      var hits = data.filter(function (p) {
        return (p.title + ' ' + p.text).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
      list.innerHTML = hits.length
        ? hits.map(function (p) { return '<li><a href="' + esc(p.url) + '">' + esc(p.title) + '</a></li>'; }).join('')
        : '<li class="empty">找不到相關攻略</li>';
    });
  });
})();
