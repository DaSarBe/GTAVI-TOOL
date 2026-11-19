(function () {
  var KEY = 'gta6-checklist-v1';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { state = {}; }

  var boxes = document.querySelectorAll('#checklist input[type=checkbox]');
  var hideDone = document.getElementById('cl-hide-done');

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function render() {
    var all = 0, done = 0;
    document.querySelectorAll('.cl-group').forEach(function (g) {
      var items = g.querySelectorAll('input[type=checkbox]');
      var d = 0;
      items.forEach(function (b) {
        var li = b.closest('.cl-item');
        li.classList.toggle('done', b.checked);
        li.hidden = hideDone.checked && b.checked;
        if (b.checked) d++;
      });
      all += items.length; done += d;
      g.querySelector('.cl-count').textContent = d + ' / ' + items.length;
      g.querySelector('.cl-fill').style.width = (items.length ? d / items.length * 100 : 0) + '%';
    });
    document.getElementById('cl-total').textContent =
      '總進度：' + done + ' / ' + all + (all ? '（' + Math.round(done / all * 100) + '%）' : '');
  }

  boxes.forEach(function (b) {
    b.checked = !!state[b.dataset.id];
    b.addEventListener('change', function () {
      if (b.checked) state[b.dataset.id] = 1; else delete state[b.dataset.id];
      save(); render();
    });
  });

  hideDone.addEventListener('change', render);
  document.getElementById('cl-reset').addEventListener('click', function () {
    if (!confirm('確定要清除所有勾選紀錄嗎？')) return;
    state = {}; save();
    boxes.forEach(function (b) { b.checked = false; });
    render();
  });

  render();
})();
