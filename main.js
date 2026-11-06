/**
 * ============================================================================
 * PHÂN HỆ 1: ĐỒNG BỘ VÀ ĐỔI TÊN NHÃN (LABELS) TRÊN BLOGGER (Bytecode t[0] -> t[6])
 * Yêu cầu biến toàn cục `labelMap` (Object ánh xạ tên nhãn cũ -> tên nhãn hiển thị)
 * ============================================================================
 */
function updateLabels() {
  // 1.1. Cập nhật nhãn trong danh sách bài viết (.pLbls) - Bytecode t[0]
  document.querySelectorAll('.pLbls').forEach((el) => {
    if (el.classList.contains('ready')) return;

    const target = el.querySelector(
      "span[itemprop='name'],span[data-text],a[data-text],a[aria-label]"
    );
    if (!target) return;

    const rawKey = (
      target.getAttribute('data-text') ||
      target.getAttribute('aria-label') ||
      target.textContent ||
      ''
    )
      .trim()
      .toLowerCase();

    if (labelMap[rawKey]) {
      el.innerHTML = '<span class="ready">' + labelMap[rawKey] + '</span>';
      el.classList.add('ready');
    }
  });

  // 1.2. Cập nhật nhãn ở widget danh sách nhãn (.lbL a[data-label]) - Bytecode t[1]
  document.querySelectorAll('.lbL a[data-label]').forEach((el) => {
    if (el.classList.contains('ready')) return;

    const rawKey = el.getAttribute('data-label').trim().toLowerCase();
    if (labelMap[rawKey]) {
      el.setAttribute('data-label', labelMap[rawKey]);
      el.setAttribute('aria-label', labelMap[rawKey]);
      el.classList.add('ready');
    }
  });

  // 1.3. Cập nhật nhãn trên thanh điều hướng Breadcrumb - Bytecode t[2]
  document.querySelectorAll(".brdCmb span[itemprop='name']").forEach((el) => {
    if (el.dataset.ready) return;

    const rawKey = el.textContent.trim().toLowerCase();
    if (labelMap[rawKey]) {
      el.textContent = labelMap[rawKey];
      el.dataset.ready = '1';
    }
  });

  // 1.4. Cập nhật tiêu đề nhãn tại khối .ldI .ldH - Bytecode t[3]
  document.querySelectorAll('.ldI .ldH').forEach((el) => {
    if (el.dataset.ready) return;

    const rawKey = el.textContent.trim().toLowerCase();
    if (labelMap[rawKey]) {
      el.textContent = labelMap[rawKey];
      el.dataset.ready = '1';
    }
  });

  // 1.5. Cập nhật tiêu đề trang và thanh tìm kiếm khi đang ở trang lọc Label - Bytecode t[4], t[5]
  if (location.pathname.includes('/search/label/')) {
    (() => {
      const currentLabel = decodeURIComponent(
        location.pathname.split('/search/label/')[1] || ''
      ).toLowerCase();

      if (!labelMap[currentLabel]) return;

      if (!document.body.dataset.labelTitleReady) {
        document.title = document.title.replace(
          new RegExp('\\b' + currentLabel + '\\b', 'gi'),
          labelMap[currentLabel]
        );
        document.body.dataset.labelTitleReady = '1';
      }

      document.querySelectorAll('.VozT .t.srch').forEach((el) => {
        if (el.dataset.ready) return;

        const homeIcon = el.querySelector('.hm');
        el.innerHTML = '';
        if (homeIcon) el.appendChild(homeIcon);
        el.insertAdjacentText('beforeend', labelMap[currentLabel]);
        el.dataset.ready = '1';
      });
    })();
  }
}

// Gắn sự kiện chạy updateLabels khi tải trang và khi DOM thay đổi
document.addEventListener('DOMContentLoaded', updateLabels);
new MutationObserver(updateLabels).observe(document.body, {
  childList: true,
  subtree: true,
});

/**
 * ============================================================================
 * PHÂN HỆ 2: WIDGET BÀI VIẾT LIÊN QUAN NGẪU NHIÊN (RANDOM RELATED POST)
 * (Bytecode t[7] -> t[20])
 * ============================================================================
 */
(function () {
  // Hàm trộn mảng ngẫu nhiên (Fisher-Yates Shuffle) - Bytecode t[7]
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Hàm gọi dữ liệu Blogger Feed qua JSONP - Bytecode t[8], t[9]
  function fetchJsonp(url, callback) {
    const cbName = 'jsonp_cb_' + Math.random().toString(36).substring(2);
    window[cbName] = function (data) {
      delete window[cbName];
      document.body.removeChild(script);
      callback(data);
    };

    const script = document.createElement('script');
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName;
    document.body.appendChild(script);
  }

  // Hàm tạo HTML và hiển thị bài viết ngẫu nhiên - Bytecode t[10], t[11]
  function renderPost(entry) {
    let title = entry.title.$t;
    let link = entry.link.find((l) => l.rel === 'alternate')?.href;
    let rawThumb =
      entry.media$thumbnail?.url ||
      (entry.content?.$t.match(/<img.*?src=['"](.*?)['"]/i) || [])[1];
    let thumbUrl = rawThumb
      ? rawThumb.replace('/s72-c/', '/s300-c/')
      : 'https://1.bp.blogspot.com/-7U9A0O6Cw4s/Ww5LZk8thRI/AAAAAAAAAeo/placeholder.png';

    let snippet =
      (entry.content?.$t || entry.summary?.$t || '')
        .replace(/<br\s*\/?>|<\/?[^>]+>/gi, '')
        .substring(0, 90) + '...';

    let html =
      '<a href="' +
      link +
      '" class="rrp-item" title="' +
      title +
      '">' +
      '<div class="rrp-thumb"><img src="' +
      thumbUrl +
      '" alt="' +
      title +
      '" loading="lazy"></div>' +
      '<div class="rrp-info"><div class="rrp-title2">' +
      title +
      '</div></div>' +
      '</a>';

    if (container) {
      container.innerHTML = html;
    }
  }

  // Hàm lấy bài viết ngẫu nhiên từ nguồn cấp mặc định (Fallback) - Bytecode t[12] -> t[15]
  function loadFallbackFeed() {
    let feedUrl = '/feeds/posts/default?alt=json-in-script&max-results=20';
    fetchJsonp(feedUrl, (data) => {
      let entries = data.feed.entry || [];
      let filtered = entries.filter((entry) => {
        let link = entry.link.find((l) => l.rel === 'alternate')?.href || '';
        return link ? link !== currentUrl : false;
      });

      if (filtered.length) {
        let randomPost = shuffleArray(filtered)[0];
        renderPost(randomPost);
      } else {
        container.innerHTML =
          '<div class="rrp-none">Không có bài viết nào để hiển thị!</div>';
      }
    });
  }

  // Logic khởi chạy chính của RRP - Bytecode t[16] -> t[20]
  const container = document.getElementById('rrp-container');
  let breadcrumbLinks = document.querySelectorAll('#breadcrumb a');
  const currentUrl = location.href.split('?')[0].split('#')[0];

  if (breadcrumbLinks.length) {
    const labels = Array.from(breadcrumbLinks)
      .map((a) => a.textContent.trim())
      .filter(Boolean);
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    const labelFeedUrl =
      '/feeds/posts/default/-/' +
      encodeURIComponent(randomLabel) +
      '?alt=json-in-script&max-results=10';

    fetchJsonp(labelFeedUrl, (data) => {
      let entries = data.feed.entry || [];
      let filtered = entries.filter((entry) => {
        let link = entry.link.find((l) => l.rel === 'alternate')?.href || '';
        return link ? link !== currentUrl : false;
      });

      if (filtered.length) {
        let randomPost = shuffleArray(filtered)[0];
        renderPost(randomPost);
      } else {
        loadFallbackFeed();
      }
    });
  } else {
    loadFallbackFeed();
  }
})();

/**
 * ============================================================================
 * PHÂN HỆ 3: ĐỒNG BỘ DỮ LIỆU THẺ SẢN PHẨM / THEME WIDGET
 * (Bytecode t[21] -> t[25])
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', function () {
  const sourceCard = document.querySelector('.mobile-product.widget-cart');
  const themeWidget = document.getElementById('theme-widget');

  if (!sourceCard || !themeWidget) return;

  // Lấy text nhưng loại bỏ phần nhãn nằm trong thẻ <span> con - Bytecode t[21]
  const getInfoValue = (selector) => {
    let el = sourceCard.querySelector(selector);
    if (!el) return '';
    let span = el.querySelector('span');
    return span
      ? el.textContent.replace(span.textContent, '').trim()
      : el.textContent.trim();
  };

  // Lấy text thuần - Bytecode t[22]
  const getText = (selector) => {
    let el = sourceCard.querySelector(selector);
    return el ? el.textContent.trim() : '';
  };

  // Lấy thuộc tính href - Bytecode t[23]
  const getHref = (selector) => {
    let el = sourceCard.querySelector(selector);
    return el ? el.href : '#';
  };

  let downloadBtn = sourceCard.querySelector(".card-download a[title='Download']");
  let buyBtn = sourceCard.querySelector(".card-download a[title='Buy Now']");

  const productData = {
    name: getInfoValue('.card-info div:nth-child(1)'),
    version: getInfoValue('.card-info div:nth-child(2)'),
    created: getInfoValue('.card-info div:nth-child(3)'),
    updated: getInfoValue('.card-info div:nth-child(4)'),
    type: getText('.card-tipe'),
    price: getText('.card-price').replace(/\s*\/.*$/, ''),
    demo: getHref('.card-header a'),
    download: downloadBtn ? downloadBtn.href : '',
    buy: buyBtn ? buyBtn.href : '',
    termsHtml: sourceCard.querySelector('.card-terms')?.innerHTML || '',
  };

  // Đổ dữ liệu sang #theme-widget
  document.getElementById('theme-name').textContent = productData.name;
  document.getElementById('theme-version').textContent = productData.version;
  document.getElementById('theme-created').textContent = productData.created;
  document.getElementById('theme-updated').textContent = productData.updated;
  document.getElementById('theme-type').textContent = productData.type;
  document.getElementById('theme-price').textContent = productData.price;
  document.getElementById('theme-demo').href = productData.demo;

  let themeDownloadBtn = document.getElementById('theme-download');
  if (productData.download && themeDownloadBtn) {
    themeDownloadBtn.href = productData.download;
  }

  let themeBuyBtn = document.getElementById('theme-buy');
  if (productData.buy && themeBuyBtn) {
    themeBuyBtn.href = productData.buy;
    themeBuyBtn.style.display = 'inline-block';
  }

  // Chèn danh sách điều khoản (terms) nếu có - Bytecode t[24]
  if (productData.termsHtml) {
    (() => {
      let termsDiv = document.createElement('div');
      termsDiv.className = 'card-terms';
      termsDiv.innerHTML = '<ul>' + productData.termsHtml + '</ul>';
      let targetDownloadBox = themeWidget.querySelector('.card-download');
      themeWidget
        .querySelector('.card-content')
        .insertBefore(termsDiv, targetDownloadBox);
    })();
  }

  themeWidget.style.display = 'block';
});

/**
 * ============================================================================
 * PHÂN HỆ 4: KHÓA TÊN MIỀN BẢN QUYỀN (DOMAIN LOCK) & CHỐNG DEVTOOLS
 * (Bytecode t[26] -> t[34])
 * ============================================================================
 */
(function () {
  let allowedDomains = ['vozwiki.com', 'vozwikivn.blogspot.com'];
  let isAuthorized = allowedDomains.some(
    (domain) =>
      location.hostname === domain || location.hostname.endsWith('.' + domain)
  );

  if (!isAuthorized) {
    // Chặn phím tắt mở DevTools & Xem nguồn trang (F12, Ctrl+Shift+I/J, Ctrl+U) - Bytecode t[27]
    document.addEventListener('keydown', function (e) {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        alert('🚫 Không được mở DevTools nhé!');
      }
    });

    // Chặn chuột phải - Bytecode t[28]
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      alert('🚫 Chuột phải bị khóa!');
    });

    // Xóa console và in cảnh báo bản quyền - Bytecode t[29]
    setTimeout(() => {
      console.clear();
      console.warn(
        '%c⛔ Script thuộc bản quyền VOZWIKI. Không được sao chép hoặc sử dụng trái phép!',
        'color: red; font-size: 20px; font-weight: bold;'
      );
    }, 100);

    // Xóa trắng body và hiện màn hình cảnh báo vi phạm bản quyền
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.95);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    `;
    overlay.innerHTML = `
      <h1 style="font-size:32px;color:red;">⛔ VI PHẠM BẢN QUYỀN ⛔</h1>
      <img src="https://blogger.googleusercontent.com/img/a/AVvXsEgl6t5URLFacHtVboK6UY6QH5Hueu-D0_9qsw6LRHEih3qQdpegNDpVLcGa06K9m_Wd9Lw8mbFOwipd2Lj0quZwqkl1ZCqZ7Pa_Yf_D7IYXbsCR8LZoBmBByraaXnsagxL-ArDid6jEb4yAWTNueC_01HtSRmw8TDfUJdbeMpCnL-PCduPIvbrVAhLMU81H=s320"
        height="180" style="margin:20px 0;">
      <p style="font-size:18px;max-width:600px;">
        Script này thuộc bản quyền
        <a href="https://vozwiki.com" target="_blank" style="color:#fff;font-weight:bold;">VOZWIKI</a>.
        Vui lòng không sao chép hoặc sử dụng trái phép.
      </p>
      <p style="font-size:16px;">
        Tự động chuyển trang sau <span id="timer">15</span> giây…
      </p>
    `;

    document.body.innerHTML = '';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Bộ đếm ngược 15 giây tự động chuyển hướng về vozwiki.com - Bytecode t[30] -> t[33]
    let countdown = 15;
    let intervalId;

    function startTimer() {
      intervalId = setInterval(() => {
        countdown--;
        let timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(intervalId);
          window.location.href = 'https://vozwiki.com';
        }
      }, 1000);
    }

    function stopTimer() {
      clearInterval(intervalId);
    }

    // Tạm dừng đếm ngược nếu người dùng chuyển sang tab khác
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    });

    startTimer();
    throw new Error('❌ Script không được phép chạy ngoài hệ thống của VOZWIKI');
  } else {
    console.log(
      '%c✔ Script hợp lệ trên hệ thống VOZWIKI',
      'color: #00c853; font-weight: bold;'
    );
  }
})();
