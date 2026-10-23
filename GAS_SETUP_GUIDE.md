# AURA Master 1000 | Google Apps Script (GAS) 後端資料庫設定指南

本指南手把手帶您將 **Google 試算表 (Google Sheets)** 作為網站的後端資料庫，並透過 **Google Apps Script (GAS)** 實現：
1. **即時訂單記錄**（信用卡結帳後，自動將 20 項完整欄位寫入試算表）。
2. **自動發送官方確認信**（透過您的 Gmail 自動寄送精美的訂單明細 HTML 信件給買家）。
3. **評價即時同步與動態讀取**（前台即時抓取試算表評價，買家發布評價即時同步存檔）。

---

## 步驟一：建立全新的 Google 試算表

1. 開啟瀏覽器，登入您的 Google 帳號。
2. 在網址列輸入 **`https://sheets.new`** 並按下 Enter，即可極速建立一份空白試算表。
3. 將試算表標題命名為：`AURA Master 1000 官方資料庫`。

---

## 步驟二：開啟 Apps Script 編輯器並貼上程式碼

1. 在試算表上方工具列，點選 **「擴充功能」 (Extensions)** > **「Apps Script」**。
2. 進入編輯器後，您會看到預設的 `Code.gs` 檔案。
3. 請**全選並清空**編輯器中的預設內容。
4. 打開本專案中的 [backend/Code.gs](file:///c:/Users/User/OneDrive/文件/Antigravity/耳機/backend/Code.gs) 檔案，**將裡面的全部程式碼複製並貼上**到 Apps Script 編輯器中。
5. 按下鍵盤快捷鍵 `Ctrl + S`（或點選上方的「儲存」磁碟圖示）完成存檔。

---

## 步驟三：執行一鍵初始化 `setupDatabase`

1. 在 Apps Script 編輯器頂部工具列，找到函式下拉選單（預設可能顯示 `myFunction`）。
2. 將其切換為 **`setupDatabase`**。
3. 點選左側的 **「執行」 (Run)** 按鈕。
4. **授權驗證（僅需一次）**：
   - 系統會跳出「需要授權」提示，點選 **「審查權限」**。
   - 選擇您的 Google 帳號。
   - 若出現「Google 尚未驗證這個應用程式」，請點選左下角的 **「進階」 (Advanced)**，然後點選 **「前往「未命名專案」(不安全)」**。
   - 點選 **「允許」 (Allow)**。
5. 執行完成後，返回您的 Google 試算表分頁，您會發現系統已經自動建立了兩張格式精美、帶有深色質感標題列的工作表：
   - **`Orders`**（訂單表，含訂單編號、Email、末四碼等 20 項標準化欄位）。
   - **`Reviews`**（評價表，已預先置入 3 則示範好評）。

---

## 步驟四：部署為網頁應用程式 (Web App)

1. 在 Apps Script 編輯器右上角，點選藍色的 **「部署」 (Deploy)** 按鈕 > **「新建部署作業」 (New deployment)**。
2. 點選左上角的齒輪圖示 ⚙️，選擇 **「網頁應用程式」 (Web app)**。
3. 設定以下三個參數（**非常重要！**）：
   - **說明**：`AURA API v1`（可自由填寫）
   - **執行身分 (Execute as)**：選擇 **「我」 (Me - 您的 Google 帳號)**
   - **誰可以存取 (Who has access)**：選擇 **「任何人」 (Anyone)** *(如此訪客在前台下單才無需登入 Google 帳號)*
4. 點選右下角 **「部署」 (Deploy)**。
5. 部署成功後，畫面會顯示 **網頁應用程式網址 (Web app URL)**，格式類似：
   ```text
   https://script.google.com/macros/s/AKfycbx_XXXXX-YYYYY/exec
   ```
6. 點選 **「複製」** 此網址。

---

## 步驟五：將網址貼入前端 `app.js`

1. 打開本專案的 [app.js](file:///c:/Users/User/OneDrive/文件/Antigravity/耳機/app.js) 檔案。
2. 在第 10 行附近找到：
   ```javascript
   const GAS_ENDPOINT_URL = '';
   ```
3. 將您剛剛複製的網址貼入單引號中，例如：
   ```javascript
   const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx_XXXXX-YYYYY/exec';
   ```
4. 存檔即可！

---

## 步驟六：實測體驗

1. 在瀏覽器中重新整理 [index.html](file:///c:/Users/User/OneDrive/文件/Antigravity/耳機/index.html)（或您的 GitHub Pages 線上網址）。
2. **測試評價讀取**：網頁載入時會自動出現提示 `✨ 已自 Google 試算表資料庫即時載入最新評價！`。
3. **測試信用卡下單**：
   - 點擊「立即訂購」，點選「🧪 一鍵填入安全展示卡號」。
   - 確認姓名、電話、**電子信箱 (Email)**、地址與卡號齊全。
   - 點選「確認刷卡支付」。
   - 打開您的 Google 試算表 `Orders` 分頁，您將看到剛剛建立的訂單已被自動寫入，並且您填寫的 Email 信箱將同步收到一封精美的官方確認信！

---

## 步驟七：設定 LINE 即時訂單推播通知（老闆專屬）

每當顧客於前台完成訂購，系統除了寫入 Google 試算表、自動寄出顧客 Email 確認信之外，還會**即時推播訂單明細到您的 LINE 手機上**！

我們推薦使用官方長期穩定的 **LINE Messaging API (LINE 機器人推播)**，設定流程非常簡單（完全免費）：

### 1. 取得 LINE Messaging API 憑證 (推薦，5 分鐘完成)

1. 開啟 [LINE Developers Console 控制台](https://developers.line.biz/console/)，使用您平常的 LINE 帳號登入。
2. 點選 **「Create a new provider」**（建立提供者），名稱可自訂（如：`AURA Official`）。
3. 點選 **「Create a Messaging API channel」**：
   - **Channel name**：`AURA 訂單通知秘書`
   - **Channel description**：`即時訂單成立推播通知`
   - **Category**：選擇任何類別（如：`E-Commerce`）
   - 勾選同意條款後，點擊 **「Create」** 建立。
4. **取得您的 LINE User ID**：
   - 點選切換到 **「Basic settings」** 分頁。
   - 滑動到最底部，複製 **「Your user ID」**（開頭為 `U`，長度約 33 碼）。
5. **取得 Channel Access Token**：
   - 點選切換到 **「Messaging API」** 分頁。
   - 滑動至下方 **Channel access token (long-lived)** 區塊，點選 **「Issue」**（發行）並複製整段 Token。
6. **加入機器人為好友（務必執行！）**：
   - 在 **「Messaging API」** 分頁上方會看到一個 **QR Code**。
   - 用您手機的 LINE 掃描該 QR Code，將您的專屬機器人 **加為好友**（如此它才能傳訊息給您）。

---

### 2. 將金鑰貼入 Apps Script 的 `Code.gs`

1. 回到 Google 試算表的 **Apps Script** 編輯器。
2. 在 [Code.gs](file:///c:/Users/User/OneDrive/文件/Antigravity/耳機/backend/Code.gs) 最上方的第 26~27 行：
   ```javascript
   const LINE_CHANNEL_ACCESS_TOKEN = '貼上剛才發行的 Channel access token';
   const LINE_USER_ID = '貼上剛才複製的 User ID (U開頭)';
   ```
3. 按下 `Ctrl + S` 儲存。

---

### 3. 一鍵測試 LINE 推播

1. 在 Apps Script 上方工具列的函式下拉選單中，選擇 **`testLineNotification`**。
2. 點擊 **「執行」 (Run)**。
3. 您的手機 LINE 將立刻跳出格式精美的 AURA 訂單測試通知！包含訂單編號、顧客姓名、方案、金額、配送地址等資訊。

---

### 4. 關鍵步驟：重新發布 Web App 新版本

> [!IMPORTANT]
> **每次修改 `Code.gs` 後，必須「重新發布新版本」**，否則線上結帳頁面呼叫的依然是舊版後端，不會觸發 LINE 通知！

1. 在 Apps Script 編輯器右上角，點選 **「部署」 (Deploy)** > **「管理部署作業」 (Manage deployments)**。
2. 在左側清單點選您已部署的作業，點選右上角的 **鉛筆圖示 ✏️ (編輯)**。
3. 在「版本」下拉選單中，選擇 **「新版本」 (New version)**。
4. 點選右下角 **「部署」 (Deploy)** > **「完成」**。
5. 現在回到您的銷售網站進行真實/測試下單，您的 LINE 就會隨時收到即時推播通知囉！
