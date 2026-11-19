# 罪城生存指南｜GTA6 中文攻略

繁體中文 GTA VI 攻略網站，用 Jekyll 製作，透過 GitHub Pages 免費架站。

## 常改的地方

| 想做什麼 | 改哪個檔案 |
|---|---|
| 改網站名稱 | `_config.yml` 的 `title`（全名）、`short_title`（短名）、`tagline`（副標） |
| 新增攻略文章 | 複製 `_drafts/文章範本.md` 到 `_posts/`，檔名格式 `YYYY-MM-DD-英文網址.md` |
| 新增清單項目 | `_data/checklist.yml`（id 上線後不要改） |
| 放截圖 | `assets/img/` |

## 本機預覽

```bash
gem install jekyll
jekyll serve
# 開 http://127.0.0.1:4000/GTAVI-TOOL/
```
