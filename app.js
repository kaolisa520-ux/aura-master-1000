/**
 * AURA MASTER 1000 - LUXURY HEADPHONE LANDING PAGE INTERACTION CONTROLLER
 */

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initAudioSimulator();
  initPricingToggle();
  initReviewsSystem();
  initCheckoutFlow();
  initSmoothScroll();
});

/* ==========================================================================
   1. PRODUCT GALLERY & VIEW SWITCHER
   ========================================================================== */
function initGallery() {
  const mainImage = document.getElementById('gallery-main-img');
  const viewButtons = document.querySelectorAll('.view-btn');
  const viewTitle = document.getElementById('gallery-view-title');
  const viewDesc = document.getElementById('gallery-view-desc');
  const colorButtons = document.querySelectorAll('.color-dot');
  const colorLabel = document.getElementById('selected-color-label');

  const viewData = {
    'hero': {
      src: 'images/hero.jpg',
      title: '45° 典雅仰角 · 纯净极简美学',
      desc: '专为极简主义者打磨的低反射哑光机身，无缝流线型铰链结构，告别传统耳机的机械笨重感。'
    },
    'flat_case': {
      src: 'images/flat_case.jpg',
      title: '便携平折设计 · 尊荣随行硬壳盒',
      desc: '耳罩支持 90° 平折收纳，配备轻量化磁吸旅行保护盒、编织 Type-C 快充线与 3.5mm 镀金发烧音频线。'
    },
    'commute': {
      src: 'images/lifestyle_commute.jpg',
      title: '万米高空 · 差旅极静守护',
      desc: '双芯片 48dB 极静降噪，瞬间滤除机舱引擎轰鸣与高铁轨道低频，跨洋长途飞行依然轻若无物。'
    },
    'cafe': {
      src: 'images/lifestyle_cafe.jpg',
      title: '都市咖啡馆 · 深度心流专注',
      desc: '在键盘敲击与交谈嘈杂中一键开启静音结界，搭配智能佩戴侦测与通透交谈模式，无需摘下即可自如对话。'
    },
    'original': {
      src: 'images/earphone_original.jpg',
      title: '工业设计真机实拍 · 铂金米灰经典款',
      desc: '高质感天然灰调涂层，耐脏污抗指纹亲肤材质，轻量化 245g 机身带来全天无压佩戴体验。'
    }
  };

  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewKey = btn.getAttribute('data-view');
      if (!viewData[viewKey]) return;

      // Update button active state
      viewButtons.forEach(b => {
        b.classList.remove('border-[#c2a783]', 'bg-[#1e222d]');
        b.classList.add('border-transparent', 'bg-[#151821]');
      });
      btn.classList.add('border-[#c2a783]', 'bg-[#1e222d]');
      btn.classList.remove('border-transparent', 'bg-[#151821]');

      // Smooth image transition
      mainImage.style.opacity = '0.3';
      mainImage.style.transform = 'scale(0.98)';
      setTimeout(() => {
        mainImage.src = viewData[viewKey].src;
        viewTitle.textContent = viewData[viewKey].title;
        viewDesc.textContent = viewData[viewKey].desc;
        mainImage.style.opacity = '1';
        mainImage.style.transform = 'scale(1)';
      }, 180);
    });
  });

  // Color selection
  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      colorButtons.forEach(b => b.classList.remove('ring-2', 'ring-[#c2a783]', 'scale-110'));
      btn.classList.add('ring-2', 'ring-[#c2a783]', 'scale-110');
      const colorName = btn.getAttribute('data-color');
      colorLabel.textContent = colorName;
      showToast(`已切换配色：${colorName}`);
    });
  });
}

/* ==========================================================================
   2. NOISE CANCELLATION SIMULATOR (WEB AUDIO API)
   ========================================================================== */
function initAudioSimulator() {
  const toggleButtons = document.querySelectorAll('.anc-mode-btn');
  const ancStatusText = document.getElementById('anc-status-desc');
  const waveBars = document.querySelectorAll('.anc-wave-bar');
  const audioPlayBtn = document.getElementById('audio-play-toggle');
  
  let audioCtx = null;
  let noiseNode = null;
  let filterNode = null;
  let gainNode = null;
  let isPlaying = false;
  let currentMode = 'noise'; // 'noise' | 'anc' | 'ambient'

  function setupWebAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    // Create pinkish low rumble noise buffer
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.25;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(3200, audioCtx.currentTime);

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noiseNode.start(0);
  }

  function applyAudioMode(mode) {
    currentMode = mode;
    if (!audioCtx) return;

    if (mode === 'noise') {
      filterNode.frequency.linearRampToValueAtTime(3600, audioCtx.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.3);
      setWaveformIntensity(1.0);
    } else if (mode === 'anc') {
      filterNode.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0.015, audioCtx.currentTime + 0.3);
      setWaveformIntensity(0.12);
    } else if (mode === 'ambient') {
      filterNode.frequency.linearRampToValueAtTime(4500, audioCtx.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.3);
      setWaveformIntensity(0.65);
    }
  }

  function setWaveformIntensity(factor) {
    waveBars.forEach((bar, idx) => {
      const baseHeight = ((idx % 5) + 3) * 6;
      bar.style.height = `${Math.max(4, baseHeight * factor)}px`;
      bar.style.opacity = factor < 0.2 ? '0.25' : '0.85';
    });
  }

  if (audioPlayBtn) {
    audioPlayBtn.addEventListener('click', () => {
      if (!audioCtx) setupWebAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      isPlaying = !isPlaying;
      if (isPlaying) {
        gainNode.gain.setValueAtTime(currentMode === 'anc' ? 0.015 : 0.2, audioCtx.currentTime);
        audioPlayBtn.innerHTML = `
          <svg class="w-4 h-4 mr-2 text-[#c2a783]" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          暂停声音模拟
        `;
        applyAudioMode(currentMode);
      } else {
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        audioPlayBtn.innerHTML = `
          <svg class="w-4 h-4 mr-2 text-[#c2a783]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          试听声学效果
        `;
        setWaveformIntensity(0.05);
      }
    });
  }

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach(b => {
        b.classList.remove('bg-[#c2a783]', 'text-[#0b0d11]', 'font-semibold');
        b.classList.add('bg-[#1c202c]', 'text-[#9ca3af]');
      });
      btn.classList.add('bg-[#c2a783]', 'text-[#0b0d11]', 'font-semibold');
      btn.classList.remove('bg-[#1c202c]', 'text-[#9ca3af]');

      const mode = btn.getAttribute('data-mode');
      if (mode === 'noise') {
        ancStatusText.textContent = '当前模式：未开启降噪。模拟万米客舱与人声杂音（低频引擎轰鸣 85dB+）';
      } else if (mode === 'anc') {
        ancStatusText.textContent = '当前模式：开启 48dB 极静降噪。双核反向声波消除 99.8% 杂音，万籁俱寂。';
      } else {
        ancStatusText.textContent = '当前模式：环境通透模式。外置麦克风实时补偿人声频段，无须摘耳机即可对谈。';
      }

      applyAudioMode(mode);
    });
  });
}

/* ==========================================================================
   3. PRICING & PAYMENT TERMS TOGGLE
   ========================================================================== */
function initPricingToggle() {
  const termButtons = document.querySelectorAll('.payment-term-btn');
  const priceStd = document.getElementById('price-standard-val');
  const pricePro = document.getElementById('price-pro-val');
  const periodStd = document.getElementById('period-standard');
  const periodPro = document.getElementById('period-pro');
  const standardNote = document.getElementById('note-standard');
  const proNote = document.getElementById('note-pro');

  termButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      termButtons.forEach(b => {
        b.classList.remove('bg-[#c2a783]', 'text-[#0b0d11]', 'font-bold');
        b.classList.add('text-[#9ca3af]');
      });
      btn.classList.add('bg-[#c2a783]', 'text-[#0b0d11]', 'font-bold');
      btn.classList.remove('text-[#9ca3af]');

      const term = btn.getAttribute('data-term');
      if (term === 'installment') {
        priceStd.textContent = '833';
        pricePro.textContent = '1,250';
        periodStd.textContent = '/ 月 (12期0利率)';
        periodPro.textContent = '/ 月 (12期0利率)';
        standardNote.textContent = '总额 NT$ 10,000 元，支持台新/国泰/中信等主流银行';
        proNote.textContent = '总额 NT$ 15,000 元，支持台新/国泰/中信等主流银行';
      } else {
        priceStd.textContent = '10,000';
        pricePro.textContent = '15,000';
        periodStd.textContent = '元';
        periodPro.textContent = '元';
        standardNote.textContent = '原价 NT$ 12,000 · 首发早鸟直降 NT$ 2,000';
        proNote.textContent = '原价 NT$ 18,000 · 尊荣旗舰特惠现省 NT$ 3,000';
      }
    });
  });
}

/* ==========================================================================
   4. USER REVIEWS & INTERACTIVE SUBMISSION
   ========================================================================== */
function initReviewsSystem() {
  const reviewsContainer = document.getElementById('reviews-list');
  const filterButtons = document.querySelectorAll('.review-filter-btn');
  const writeReviewBtn = document.getElementById('open-write-review-btn');
  const reviewModal = document.getElementById('write-review-modal');
  const closeReviewModal = document.getElementById('close-review-modal-btn');
  const reviewForm = document.getElementById('write-review-form');
  const starInputs = document.querySelectorAll('.star-rating-input');
  let selectedRating = 5;

  // Star rating selector
  starInputs.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-val'));
      updateStarDisplay(selectedRating);
    });
  });

  function updateStarDisplay(rating) {
    starInputs.forEach(s => {
      const val = parseInt(s.getAttribute('data-val'));
      if (val <= rating) {
        s.classList.add('text-amber-400');
        s.classList.remove('text-gray-600');
      } else {
        s.classList.remove('text-amber-400');
        s.classList.add('text-gray-600');
      }
    });
  }

  // Filter reviews
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('bg-[#c2a783]', 'text-[#0b0d11]', 'font-semibold');
        b.classList.add('bg-[#1c202c]', 'text-[#9ca3af]');
      });
      btn.classList.add('bg-[#c2a783]', 'text-[#0b0d11]', 'font-semibold');
      btn.classList.remove('bg-[#1c202c]', 'text-[#9ca3af]');

      const filter = btn.getAttribute('data-filter');
      const reviewCards = reviewsContainer.querySelectorAll('.review-item-card');
      reviewCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'block';
        } else {
          const tags = card.getAttribute('data-tags') || '';
          if (tags.includes(filter)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        }
      });
    });
  });

  // Modal open/close
  if (writeReviewBtn && reviewModal) {
    writeReviewBtn.addEventListener('click', () => {
      reviewModal.classList.add('active');
    });
  }
  if (closeReviewModal && reviewModal) {
    closeReviewModal.addEventListener('click', () => {
      reviewModal.classList.remove('active');
    });
  }

  // Handle Review Submission
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const author = document.getElementById('review-author').value.trim() || '神秘发烧友';
      const version = document.getElementById('review-version').value;
      const content = document.getElementById('review-content').value.trim();

      if (!content) {
        alert('请填写您的使用心得！');
        return;
      }

      // Generate new card
      const newCard = document.createElement('div');
      newCard.className = 'review-item-card glass-card rounded-2xl p-6 border border-[#c2a783]/30 bg-[#1c202c]/90 relative';
      newCard.setAttribute('data-tags', 'sound anc comfort');

      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        starsHtml += `<svg class="w-4 h-4 ${i < selectedRating ? 'text-amber-400' : 'text-gray-600'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
      }

      newCard.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#c2a783] to-[#ebdcc8] text-[#0b0d11] font-bold flex items-center justify-center text-sm shadow">
              ${author.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-medium text-white">${author}</span>
                <span class="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">已验证买家</span>
              </div>
              <p class="text-xs text-[#9ca3af]">购买规格：${version} · 刚刚发布</p>
            </div>
          </div>
          <div class="flex">${starsHtml}</div>
        </div>
        <p class="text-sm text-gray-300 leading-relaxed">${content}</p>
        <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#9ca3af]">
          <span>实名认证评价</span>
          <button class="hover:text-[#c2a783] flex items-center space-x-1" onclick="this.innerHTML='✓ 已赞同 (1)'">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
            <span>觉得有帮助 (0)</span>
          </button>
        </div>
      `;

      reviewsContainer.insertBefore(newCard, reviewsContainer.firstChild);
      reviewModal.classList.remove('active');
      reviewForm.reset();
      showToast('🎉 感谢您的真实评价！已成功展示在网站首屏。');
    });
  }
}

/* ==========================================================================
   5. INTERACTIVE CHECKOUT & 3D CREDIT CARD FLOW
   ========================================================================== */
function initCheckoutFlow() {
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('close-checkout-btn');
  const openButtons = document.querySelectorAll('.open-checkout-btn');
  const receiptModal = document.getElementById('receipt-modal');
  const closeReceiptBtn = document.getElementById('close-receipt-btn');

  // Checkout elements
  const editionSelect = document.getElementById('order-edition-select');
  const colorSelect = document.getElementById('order-color-select');
  const engravingCheck = document.getElementById('engraving-checkbox');
  const engravingInput = document.getElementById('engraving-input-box');
  const promoInput = document.getElementById('promo-code-input');
  const promoBtn = document.getElementById('apply-promo-btn');
  const promoFeedback = document.getElementById('promo-feedback');

  // Summary elements
  const sumBasePrice = document.getElementById('sum-base-price');
  const sumDiscount = document.getElementById('sum-discount');
  const sumTotal = document.getElementById('sum-total-price');
  const checkoutPayBtnText = document.getElementById('checkout-pay-btn-text');

  // 3D Card Visual elements
  const card3D = document.getElementById('interactive-card-3d');
  const cardNumDisplay = document.getElementById('display-card-number');
  const cardHolderDisplay = document.getElementById('display-card-holder');
  const cardExpDisplay = document.getElementById('display-card-expiry');
  const cardCvvDisplay = document.getElementById('display-card-cvv');
  const cardBrandIcon = document.getElementById('card-brand-icon');

  // Form inputs
  const inputCardNum = document.getElementById('input-card-number');
  const inputCardHolder = document.getElementById('input-card-holder');
  const inputCardExp = document.getElementById('input-card-expiry');
  const inputCardCvv = document.getElementById('input-card-cvv');
  const autofillDemoBtn = document.getElementById('autofill-demo-card-btn');
  const checkoutForm = document.getElementById('checkout-payment-form');
  const processingOverlay = document.getElementById('payment-processing-spinner');

  let basePrice = 15000;
  let discountAmount = 0;

  // Open Checkout with specific edition
  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetEdition = btn.getAttribute('data-edition') || 'pro';
      if (editionSelect) {
        editionSelect.value = targetEdition;
      }
      recalcPrices();
      checkoutModal.classList.add('active');
    });
  });

  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
    });
  }

  // Edition change
  if (editionSelect) {
    editionSelect.addEventListener('change', () => {
      recalcPrices();
    });
  }

  // Engraving toggle
  if (engravingCheck && engravingInput) {
    engravingCheck.addEventListener('change', () => {
      if (engravingCheck.checked) {
        engravingInput.classList.remove('hidden');
      } else {
        engravingInput.classList.add('hidden');
      }
      recalcPrices();
    });
  }

  // Promo code
  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'SOUND1000' || code === 'AURA2026') {
        discountAmount = 1000;
        promoFeedback.innerHTML = `<span class="text-emerald-400">✓ 折扣码【${code}】已生效，现折 NT$ 1,000 元！</span>`;
      } else if (code === 'VIP88') {
        discountAmount = 1500;
        promoFeedback.innerHTML = `<span class="text-emerald-400">✓ 尊荣专属【VIP88】生效，现折 NT$ 1,500 元！</span>`;
      } else {
        discountAmount = 0;
        promoFeedback.innerHTML = `<span class="text-red-400">✕ 折扣码无效或已过首波抢兑期</span>`;
      }
      recalcPrices();
    });
  }

  function recalcPrices() {
    const isPro = editionSelect.value === 'pro';
    basePrice = isPro ? 15000 : 10000;
    
    // Engraving: free on Pro, +$500 on standard
    let engravingCost = 0;
    if (engravingCheck && engravingCheck.checked && !isPro) {
      engravingCost = 500;
    }

    const finalTotal = Math.max(0, basePrice + engravingCost - discountAmount);

    sumBasePrice.textContent = `NT$ ${basePrice.toLocaleString()}`;
    sumDiscount.textContent = discountAmount > 0 ? `- NT$ ${discountAmount.toLocaleString()}` : 'NT$ 0';
    sumTotal.textContent = `NT$ ${finalTotal.toLocaleString()}`;
    checkoutPayBtnText.textContent = `确认刷卡支付 NT$ ${finalTotal.toLocaleString()}`;
  }

  // 3D Card Real-Time Syncing
  if (inputCardNum) {
    inputCardNum.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
      e.target.value = formatted;
      cardNumDisplay.textContent = formatted || '•••• •••• •••• ••••';

      // Brand detection
      if (val.startsWith('4')) {
        cardBrandIcon.textContent = 'VISA';
      } else if (val.startsWith('5')) {
        cardBrandIcon.textContent = 'Mastercard';
      } else if (val.startsWith('35')) {
        cardBrandIcon.textContent = 'JCB';
      } else {
        cardBrandIcon.textContent = 'CARD';
      }
    });
  }

  if (inputCardHolder) {
    inputCardHolder.addEventListener('input', (e) => {
      cardHolderDisplay.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
    });
  }

  if (inputCardExp) {
    inputCardExp.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
      }
      e.target.value = val;
      cardExpDisplay.textContent = val || 'MM/YY';
    });
  }

  // 3D Flip on CVV Focus
  if (inputCardCvv) {
    inputCardCvv.addEventListener('focus', () => {
      card3D.classList.add('flipped');
    });
    inputCardCvv.addEventListener('blur', () => {
      card3D.classList.remove('flipped');
    });
    inputCardCvv.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 3);
      e.target.value = val;
      cardCvvDisplay.textContent = val ? '•'.repeat(val.length) : '•••';
    });
  }

  // Demo autofill
  if (autofillDemoBtn) {
    autofillDemoBtn.addEventListener('click', () => {
      inputCardNum.value = '4123 4567 8901 2345';
      cardNumDisplay.textContent = '4123 4567 8901 2345';
      cardBrandIcon.textContent = 'VISA';

      inputCardHolder.value = 'CHEN WEI-TING';
      cardHolderDisplay.textContent = 'CHEN WEI-TING';

      inputCardExp.value = '08/29';
      cardExpDisplay.textContent = '08/29';

      inputCardCvv.value = '888';
      cardCvvDisplay.textContent = '•••';

      document.getElementById('checkout-name').value = '陈先生';
      document.getElementById('checkout-phone').value = '0912-345-678';
      document.getElementById('checkout-address').value = '台北市信义区松仁路 100 号 18 楼';
      
      showToast('✨ 已为您自动填入安全合规演示数据！');
    });
  }

  // Form submission & payment processing animation
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      const address = document.getElementById('checkout-address').value.trim();
      const cardNum = inputCardNum.value.trim();

      if (!name || !phone || !address || cardNum.length < 15) {
        alert('请完整填写收件人信息与正确卡号！');
        return;
      }

      // Show processing overlay
      processingOverlay.classList.remove('hidden');

      setTimeout(() => {
        processingOverlay.classList.add('hidden');
        checkoutModal.classList.remove('active');

        // Populate receipt
        const randId = 'AURA-' + Math.floor(100000 + Math.random() * 900000);
        const editionName = editionSelect.value === 'pro' ? 'AURA Master 1000 旗舰版' : 'AURA Master 1000 标准版';
        const chosenColor = colorSelect.value;
        const totalPaid = sumTotal.textContent;

        document.getElementById('receipt-order-id').textContent = randId;
        document.getElementById('receipt-product-name').textContent = editionName;
        document.getElementById('receipt-color').textContent = chosenColor;
        document.getElementById('receipt-recipient').textContent = `${name} (${phone})`;
        document.getElementById('receipt-address').textContent = address;
        document.getElementById('receipt-amount').textContent = totalPaid;
        document.getElementById('receipt-date').textContent = new Date().toLocaleString('zh-TW', { hour12: false });

        receiptModal.classList.add('active');
      }, 1600);
    });
  }

  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener('click', () => {
      receiptModal.classList.remove('active');
      showToast('🎉 恭喜订购成功！我们将在 24 小时内为您出货。');
    });
  }
}

/* ==========================================================================
   6. UTILITIES: TOAST & SMOOTH SCROLL
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('aura-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aura-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 bg-[#1c202c] border border-[#c2a783]/60 text-white px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-10 opacity-0 flex items-center space-x-3 text-sm';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="text-[#c2a783] text-lg">✦</span>
    <span>${message}</span>
  `;

  toast.classList.remove('translate-y-10', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 3200);
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
