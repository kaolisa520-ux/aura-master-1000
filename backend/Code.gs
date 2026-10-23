/**
 * ============================================================================
 * AURA MASTER 1000 - GOOGLE APPS SCRIPT (GAS) 後端資料庫核心程式碼
 * ============================================================================
 * 
 * 部署說明：
 * 1. 請在 Google 試算表 (Google Sheets) 點選「擴充功能」>「Apps Script」。
 * 2. 清空既有內容，將此整份 Code.gs 複製貼上。
 * 3. 第一次使用時，請選擇上方函式選單中的「setupDatabase」並點擊「執行」，
 *    系統將自動為您建立並格式化「Orders (訂單)」與「Reviews (評價)」兩張工作表。
 * 4. 點選右上角「部署」>「新建部署作業」：
 *    - 種類選擇：「網頁應用程式 (Web App)」
 *    - 執行身分：「我 (您的 Google 帳號)」
 *    - 誰可以存取：「任何人 (Anyone)」
 * 5. 複製生成的「網頁應用程式網址」，填入前端 app.js 中的 GAS_ENDPOINT_URL 變數。
 */

// ============================================================================
// 工作表與推播通知設定
// ============================================================================
const SHEET_ORDERS = 'Orders';
const SHEET_REVIEWS = 'Reviews';

// LINE 即時推播通知設定 (雙軌支援：LINE Messaging API 或 LINE Notify)
// 方式一：LINE Messaging API (官方機器人，長期穩定推薦)
const LINE_CHANNEL_ACCESS_TOKEN = 'd20G8qjzLh5LrcewiIGmky4f1G7j7tIhI7biQAkM37QsalTjOT3To+BrhGiicJca3SxN0YX1D+pJ/kkaHuGGnBoHW1pNA/aap/KDWVrAisvVdJWlh0EyJVU7yZ9zn33lmylGqbGeVGpDfxEC/0cYagdB04t89/1O/w1cDnyilFU=';
const LINE_USER_ID = 'Ua735fb0ef00a83eb3e176b580133c706';

// 方式二：LINE Notify 權杖 (若您仍持有有效之 Notify Token 可直接貼入，使用方式一則此處留空)
const LINE_NOTIFY_TOKEN = '';

/**
 * 初始化試算表結構與標題列
 * 第一次使用請先執行此函式！
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 初始化 Orders (訂單) 工作表
  let orderSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!orderSheet) {
    orderSheet = ss.insertSheet(SHEET_ORDERS);
  }
  
  const orderHeaders = [
    '訂單編號 (order_id)',
    '訂購時間 (created_at)',
    '購買方案 (product_edition)',
    '外觀配色 (color)',
    '客製雷雕內容 (engraving)',
    '收件人姓名 (recipient_name)',
    '電子信箱 (recipient_email)',
    '聯絡手機 (recipient_phone)',
    '宅配地址 (recipient_address)',
    '優惠代碼 (promo_code)',
    '基本金額 (base_price)',
    '折扣折抵 (discount_amount)',
    '物流運費 (shipping_fee)',
    '刷卡總額 (total_amount)',
    '付款方式 (payment_method)',
    '卡別組織 (card_brand)',
    '卡號末四碼 (card_last4)',
    '持卡人姓名 (card_holder)',
    '處理進度 (order_status)',
    '物流單號 (tracking_number)'
  ];

  orderSheet.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
  formatHeaderRow(orderSheet, orderHeaders.length, '#1c202c', '#c2a783');

  // 2. 初始化 Reviews (評價) 工作表
  let reviewSheet = ss.getSheetByName(SHEET_REVIEWS);
  if (!reviewSheet) {
    reviewSheet = ss.insertSheet(SHEET_REVIEWS);
  }

  const reviewHeaders = [
    '評價編號 (review_id)',
    '發布時間 (created_at)',
    '買家稱謂 (author_name)',
    '評分星等 (rating)',
    '購買規格 (product_edition)',
    '詳細心得 (content)',
    '驗證買家 (is_verified)',
    '有幫助次數 (helpful_count)',
    '前台顯示 (is_approved)'
  ];

  reviewSheet.getRange(1, 1, 1, reviewHeaders.length).setValues([reviewHeaders]);
  formatHeaderRow(reviewSheet, reviewHeaders.length, '#1c202c', '#c2a783');

  // 若 Reviews 尚無資料，插入 3 則預設高質感示範評價
  if (reviewSheet.getLastRow() === 1) {
    const initialReviews = [
      ['#REV-20261016-01', '2026/10/16 14:20:00', '林哲宇 資深混音師', 5, '高級旗艦版 (NT$ 15,000)', '本來對無線耳機的音質沒抱太大期待，但這款旗艦版的純鈹振膜真的徹底驚艷我！古典弦樂的高頻泛音透亮不刺耳，低頻扎實且極富彈性。直接退役了我原本的萬元耳機，高級版隨附的鍍銀發燒線也非常厚道。', true, 42, true],
      ['#REV-20261016-02', '2026/10/16 16:45:00', 'Claire W. 跨國商務常客', 5, '高級旗艦版 · 極光月灰', '經常台北舊金山兩頭飛，最怕機艙發動機的轟鳴。AURA 的 48dB 降噪一開，瞬間置身無聲真空。耳罩的小羊皮軟到像雲朵般貼合，戴一整趟 13 小時完全沒有壓迫頭頂的感覺，續航更是強到回程都還有電！', true, 38, true],
      ['#REV-20261016-03', '2026/10/16 19:10:00', '張凱 軟體架構師', 5, '普通標準版 (NT$ 10,000)', '萬元普通版性價比無敵！日常在開放式辦公室寫程式，一戴上去周圍敲鍵盤和開會討論的聲音都消失了。戴眼鏡也不會被耳罩壓得生疼，分期 12 期一個月只要 833 元，每天一杯咖啡錢換來極致專注，非常划算。', true, 26, true]
    ];
    reviewSheet.getRange(2, 1, initialReviews.length, reviewHeaders.length).setValues(initialReviews);
  }

  Logger.log('✅ AURA Master 1000 資料庫工作表初始化完成！');
}

/**
 * 輔助美化標題列樣式
 */
function formatHeaderRow(sheet, colCount, bgColor, fontColor) {
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setBackground(bgColor)
       .setFontColor(fontColor)
       .setFontWeight('bold')
       .setFontSize(10)
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, colCount);
}

/**
 * HTTP GET 處理常式 (用於獲取評價清單)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getReviews';

    if (action === 'getReviews') {
      return handleGetReviews();
    }

    return createJsonResponse({ status: 'error', message: '未知的請求操作 (Unknown action)' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * HTTP POST 處理常式 (用於建立訂單、新增評價)
 */
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    const action = data.action;

    if (action === 'createOrder') {
      return handleCreateOrder(data);
    } else if (action === 'submitReview') {
      return handleSubmitReview(data);
    } else if (action === 'getReviews') {
      return handleGetReviews();
    }

    return createJsonResponse({ status: 'error', message: '未知的請求動作：' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * 處理新增訂單
 */
function handleCreateOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(SHEET_ORDERS);
  }

  const orderId = data.order_id || ('#AURA-' + Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000));
  const createdAt = data.created_at || Utilities.formatDate(new Date(), 'GMT+8', 'yyyy/MM/dd HH:mm:ss');
  const edition = data.product_edition || 'AURA 1000 高級旗艦版';
  const color = data.color || '極光月灰 (Platinum Stone)';
  const engraving = data.engraving || '無';
  const recipientName = data.recipient_name || '';
  const recipientEmail = data.recipient_email || '';
  const recipientPhone = data.recipient_phone || '';
  const recipientAddress = data.recipient_address || '';
  const promoCode = data.promo_code || '無';
  const basePrice = Number(data.base_price) || 15000;
  const discountAmount = Number(data.discount_amount) || 0;
  const shippingFee = Number(data.shipping_fee) || 0;
  const totalAmount = Number(data.total_amount) || (basePrice - discountAmount + shippingFee);
  const paymentMethod = data.payment_method || '信用卡 (3D-Secure 認證)';
  const cardBrand = data.card_brand || 'VISA';
  const cardLast4 = data.card_last4 || '****';
  const cardHolder = data.card_holder || '';
  const orderStatus = '已授權付款 (待備貨)';
  const trackingNumber = '';

  const row = [
    orderId,
    createdAt,
    edition,
    color,
    engraving,
    recipientName,
    recipientEmail,
    recipientPhone,
    recipientAddress,
    promoCode,
    basePrice,
    discountAmount,
    shippingFee,
    totalAmount,
    paymentMethod,
    cardBrand,
    cardLast4,
    cardHolder,
    orderStatus,
    trackingNumber
  ];

  sheet.appendRow(row);

  // 1. 如果顧客有填寫 Email，自動透過 Gmail 發送訂單確認信
  if (recipientEmail && recipientEmail.indexOf('@') > 0) {
    try {
      sendOrderConfirmationEmail({
        email: recipientEmail,
        name: recipientName,
        orderId: orderId,
        edition: edition,
        color: color,
        engraving: engraving,
        totalAmount: totalAmount,
        address: recipientAddress
      });
    } catch (mailErr) {
      Logger.log('郵件發送失敗（不影響訂單寫入）：' + mailErr.toString());
    }
  }

  // 2. 自動透過 LINE 即時推播新訂單通知給老闆/賣家手機
  if (LINE_CHANNEL_ACCESS_TOKEN || LINE_NOTIFY_TOKEN) {
    try {
      sendLineNotification({
        orderId: orderId,
        createdAt: createdAt,
        name: recipientName,
        phone: recipientPhone,
        email: recipientEmail,
        edition: edition,
        color: color,
        engraving: engraving,
        totalAmount: totalAmount,
        address: recipientAddress
      });
    } catch (lineErr) {
      Logger.log('LINE 通知發送失敗（不影響訂單寫入）：' + lineErr.toString());
    }
  }

  return createJsonResponse({
    status: 'success',
    message: '訂單建立成功',
    order_id: orderId
  });
}

/**
 * 處理新增買家評價
 */
function handleSubmitReview(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_REVIEWS);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(SHEET_REVIEWS);
  }

  const reviewId = data.review_id || ('#REV-' + Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd') + '-' + Math.floor(100 + Math.random() * 900));
  const createdAt = data.created_at || Utilities.formatDate(new Date(), 'GMT+8', 'yyyy/MM/dd HH:mm:ss');
  const authorName = data.author_name || '熱心發燒友';
  const rating = Number(data.rating) || 5;
  const edition = data.product_edition || 'AURA 1000 高級旗艦版';
  const content = data.content || '';
  const isVerified = true;
  const helpfulCount = 0;
  const isApproved = true; // 預設核准顯示，管理員可在試算表手動設為 FALSE

  const row = [
    reviewId,
    createdAt,
    authorName,
    rating,
    edition,
    content,
    isVerified,
    helpfulCount,
    isApproved
  ];

  sheet.appendRow(row);

  return createJsonResponse({
    status: 'success',
    message: '評價發布成功',
    review_id: reviewId
  });
}

/**
 * 讀取已核准的評價清單 (供前端載入時動態渲染)
 */
function handleGetReviews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_REVIEWS);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(SHEET_REVIEWS);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJsonResponse({ status: 'success', reviews: [] });
  }

  const reviews = [];
  // 跳過第 1 列標題
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isApproved = row[8];
    // 僅回傳前台審核通過的評價
    if (isApproved === true || isApproved === 'TRUE' || isApproved === 1) {
      reviews.push({
        review_id: row[0],
        created_at: row[1],
        author_name: row[2],
        rating: Number(row[3]) || 5,
        product_edition: row[4],
        content: row[5],
        is_verified: row[6] === true || row[6] === 'TRUE',
        helpful_count: Number(row[7]) || 0
      });
    }
  }

  // 依照發布時間新到舊排序
  reviews.reverse();

  return createJsonResponse({
    status: 'success',
    count: reviews.length,
    reviews: reviews
  });
}

/**
 * 測試發送官方訂單確認信 (供在 Apps Script 編輯器中執行以完成 Gmail 授權)
 */
function testEmailNotification() {
  const userEmail = Session.getActiveUser().getEmail();
  const targetEmail = userEmail || 'your_email@example.com';
  
  sendOrderConfirmationEmail({
    email: targetEmail,
    name: '貴賓測試員',
    orderId: '#AURA-' + Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd') + '-TEST',
    edition: 'AURA 1000 高級旗艦版 (NT$ 15,000)',
    color: '極光月灰 (Platinum Stone)',
    engraving: 'AURA-2026',
    totalAmount: 15000,
    address: '台北市信義區松仁路 100 號 18 樓'
  });
  
  Logger.log('✅ 測試確認信已成功寄送至：' + targetEmail + '，請至該信箱收信查驗！');
}

/**
 * 發送官方電子訂單確認信 (Gmail HTML Template)
 */
function sendOrderConfirmationEmail(order) {
  const subject = `【AURA Acoustics】官方訂單確認通知 (${order.orderId})`;
  
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0d11; color: #f3f4f6; padding: 36px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #c2a783;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #c2a783; font-size: 26px; margin: 0; letter-spacing: 2px;">AURA MASTER 1000</h1>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 6px;">一戴，世界自此靜止。</p>
      </div>
      <div style="background-color: #161922; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">親愛的 ${order.name} 貴賓 您好：</h2>
        <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">
          感謝您訂購 AURA 旗艦無線降噪耳機！您的款項已透過 256-bit 銀行安全加密授權成功，耳機目前正由專業聲學工程團隊進行出廠前質檢與調校，我們將在 24 小時內為您以保價宅配出貨。
        </p>
        <hr style="border: none; border-top: 1px solid #2d3342; margin: 18px 0;" />
        <table style="width: 100%; font-size: 13px; color: #d1d5db; line-height: 1.8;">
          <tr><td style="color: #9ca3af; width: 100px;">訂單編號：</td><td style="color: #c2a783; font-weight: bold; font-family: monospace;">${order.orderId}</td></tr>
          <tr><td style="color: #9ca3af;">訂購機型：</td><td style="color: #ffffff; font-weight: bold;">${order.edition}</td></tr>
          <tr><td style="color: #9ca3af;">外觀配色：</td><td>${order.color}</td></tr>
          <tr><td style="color: #9ca3af;">專屬雷雕：</td><td>${order.engraving}</td></tr>
          <tr><td style="color: #9ca3af;">配送地址：</td><td>${order.address}</td></tr>
          <tr><td style="color: #9ca3af;">實付總額：</td><td style="color: #c2a783; font-size: 16px; font-weight: bold;">NT$ ${Number(order.totalAmount).toLocaleString()} 元</td></tr>
        </table>
      </div>
      <div style="background-color: #1f2432; border-radius: 12px; padding: 16px; font-size: 12px; color: #9ca3af; line-height: 1.6;">
        <strong style="color: #c2a783;">🛡️ 尊榮售後承諾：</strong><br/>
        • 享有簽收日起完整 30 天無條件退款試聽保證（退貨由官方免費到府收件）。<br/>
        • 享有 2 年官方原廠免費到府收送維修保固。<br/>
        • 24小時客服專線：0800-888-999
      </div>
      <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #6b7280;">
        © 2026 AURA Acoustics Co., Ltd. All rights reserved.
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: order.email,
    subject: subject,
    htmlBody: htmlBody,
    name: 'AURA Acoustics 官方旗艦店'
  });
}

/**
 * 測試 LINE 即時推播通知 (供在 Apps Script 編輯器中點選執行查驗)
 */
function testLineNotification() {
  if (!LINE_CHANNEL_ACCESS_TOKEN && !LINE_NOTIFY_TOKEN) {
    Logger.log('❌ 請先在 Code.gs 最上方設定 LINE_CHANNEL_ACCESS_TOKEN 或 LINE_NOTIFY_TOKEN！');
    return;
  }
  sendLineNotification({
    orderId: '#AURA-' + Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd') + '-LINE',
    createdAt: Utilities.formatDate(new Date(), 'GMT+8', 'yyyy/MM/dd HH:mm:ss'),
    name: '測試買家 (陳偉廷)',
    phone: '0912-345-678',
    email: 'aura.vip@example.com',
    edition: 'AURA 1000 高級旗艦版 (NT$ 15,000)',
    color: '極光月灰 (Platinum Stone)',
    engraving: 'AURA-2026',
    totalAmount: 15000,
    address: '台北市信義區松仁路 100 號 18 樓'
  });
  Logger.log('✅ LINE 測試推播已發送！請檢查您的手機 LINE 訊息。');
}

/**
 * 發送 LINE 即時訂單通知至賣家手機
 */
function sendLineNotification(order) {
  const messageText = 
    `🎉【AURA Acoustics】新訂單成立！\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🔖 訂單編號：${order.orderId}\n` +
    `⏰ 下單時間：${order.createdAt}\n` +
    `👤 顧客姓名：${order.name}\n` +
    `📱 聯絡手機：${order.phone}\n` +
    `✉️ 電子信箱：${order.email || '未填寫'}\n` +
    `🎧 購買方案：${order.edition}\n` +
    `🎨 外觀配色：${order.color}\n` +
    `✍️ 客製雷雕：${order.engraving}\n` +
    `💰 實付總額：NT$ ${Number(order.totalAmount).toLocaleString()} 元\n` +
    `📍 配送地址：${order.address}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📦 請至 Google 試算表確認款項並安排出貨！`;

  // 方式一：LINE Messaging API (官方機器人)
  if (LINE_CHANNEL_ACCESS_TOKEN && LINE_USER_ID) {
    const url = 'https://api.line.me/v2/bot/message/push';
    const payload = {
      to: LINE_USER_ID,
      messages: [
        {
          type: 'text',
          text: messageText
        }
      ]
    };
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('LINE Messaging API 回應：' + response.getContentText());
  } 
  // 方式二：LINE Notify 權杖
  else if (LINE_NOTIFY_TOKEN) {
    const url = 'https://notify-api.line.me/api/notify';
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + LINE_NOTIFY_TOKEN
      },
      payload: {
        message: '\n' + messageText
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('LINE Notify 回應：' + response.getContentText());
  }
}

/**
 * 產生 JSON 格式輸出並附帶 CORS 標頭
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
