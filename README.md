# 國文課文練習工具

離線、純前端的練習工具：先管理課文，再切換到練習頁以逐字或全文比對。所有資料都儲存在瀏覽器的本機端（localStorage），不會上傳網路。

## ✨ 功能亮點

- 課文管理頁（`manage.html`）
   - 新增／編輯／刪除課文。
   - 「練習」按鈕會直接帶你到練習頁，並自動選取該篇課文。
- 練習模式頁（`practice.html`）
   - 逐字比對（即時）：每輸入一個字即檢查前綴是否正確，顯示「目前正確（已輸入/總長）」或第幾個字不同；多輸入也會提醒。此模式下不需要「開始比對」按鈕（按鈕會隱藏）。
   - 一次全部比對：按「開始比對」後顯示是否完全一致，並列出差異提示。
   - 忽略標點：可選擇練習時忽略常見標點符號。
- 漢堡選單導覽（按鈕樣式）
   - 以按鈕切換兩個頁面（桌機與手機皆可用）。
- 離線使用
   - 課文儲存在瀏覽器 `localStorage`，關閉頁面後仍保留。

## 🚀 快速開始

你可以直接開啟檔案，或啟動本機伺服器。

- 方式 A：直接開啟
   - 開啟 `practice.html` 進行練習，或 `manage.html` 管理課文。
   - `index.html` 會自動導向到 `practice.html`。

- 方式 B：啟動本機伺服器（推薦）
   - 於專案資料夾啟動：

```powershell
npm start
```

   - 瀏覽器開啟 http://localhost:5173

## 🧭 使用說明

1) 在「課文管理」頁（`manage.html`）
- 輸入標題與內容後按「儲存課文」。
- 下方清單可「練習 / 編輯 / 刪除」。
- 按「練習」會前往 `practice.html?practice=<id>` 並自動選取該篇。

2) 在「練習模式」頁（`practice.html`）
- 從下拉選單選擇課文。
- 選擇模式：
   - 逐字比對：即時檢查，不用按「開始比對」。
   - 一次全部比對：輸入完成後按「開始比對」。
- 勾選「忽略標點符號」可忽略標點再比對。
- 「重置練習」可清空輸入與結果。

> 提示：逐字比對會以徽章顯示目前狀態；若多輸入超過全文，也會提示多出的字數。

## 🧪 測試

專案內含 Node.js 測試腳本，驗證核心比對與文字處理函式。

```powershell
npm test
```

## 📁 專案結構

```
index.html         # 入口（自動導向 practice.html）
manage.html        # 課文管理頁
practice.html      # 練習模式頁
styles.css         # 版面與配色
app.js             # UI 行為與本機儲存邏輯（可在兩頁共用）
text-utils.js      # 比對與文字處理的純函式（具測試）
server.js          # 簡易靜態伺服器（npm start）
tests/runTests.mjs # 測試腳本
package.json       # npm 腳本設定
README.md          # 說明文件（本檔）
```

## 🛠️ 疑難排解

- 5173 連接埠已被占用：可以改用其他連接埠。

```powershell
$env:PORT=8080; npm start
```

然後改用 http://localhost:8080 開啟。

## 🔒 隱私與資料

- 所有課文資料皆儲存在你的瀏覽器 `localStorage`。
- 若清除瀏覽資料或改用無痕模式，資料可能遺失；建議保留原始課文備份。

## 🌐 發佈到 GitHub Pages

此專案已內建 GitHub Actions 工作流程，會將靜態網站部署到 GitHub Pages。

步驟：

1. 將此專案推送到 GitHub 儲存庫（預設分支為 `main`）。
2. 到 GitHub 的儲存庫頁面，開啟 Settings → Pages：
   - Source 選擇「GitHub Actions」。
3. 推送到 `main`（或手動在 Actions 頁面觸發「Deploy to GitHub Pages」工作流程）。
4. 完成後，在儲存庫的「Environments → github-pages」可看到公開網址。

工作流程位於 `.github/workflows/pages.yml`，會將以下檔案打包到 `dist/` 後部署：

- `index.html`（導向 `practice.html`）
- `manage.html`
- `practice.html`
- `styles.css`
- `app.js`
- `text-utils.js`

若你的預設分支不是 `main`，請調整工作流程的 `on.push.branches`。
