// Thành phần chung, giao tiếp API và giỏ nháp của trình duyệt.
const moneyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const cartKey = 'forma-cart-v1';
const promoKey = 'forma-promo-v1';
const htmlCharacters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const symbols = {
  search: '<circle cx="10.6" cy="10.6" r="5.6"/><path d="m15 15 4.6 4.6"/>',
  user: '<circle cx="12" cy="8" r="3.3"/><path d="M5 20v-1.6c0-2.9 3.1-4.5 7-4.5s7 1.6 7 4.5V20"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name]}</svg>`;
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => htmlCharacters[character]);
export const money = value => moneyFormat.format(value);
export const capacity = gb => gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
export const imageUrl = image => `/media/${encodeURIComponent(image)}.webp`;
export const productUrl = id => `/san-pham?id=${encodeURIComponent(id)}`;

export async function api(action, { query, body, signal } = {}) {
  const params = new URLSearchParams(query);
  params.set('action', action);
  const reply = await fetch(`/api/store?${params}`, {
    signal,
    ...(body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
  });
  const result = await reply.json().catch(() => ({}));
  if (!reply.ok) {
    const error = new Error(result.error || 'Không thể kết nối với cửa hàng.');
    error.status = reply.status;
    throw error;
  }
  return result;
}

export function showError(target, error) {
  target.textContent = error?.message === 'Failed to fetch'
    ? 'Mất kết nối với cửa hàng. Hãy tải lại và thử lại.' : error.message;
  target.hidden = false;
}

export function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' &&
      typeof item.color === 'string' && Number.isInteger(item.storage) &&
      Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 5) : [];
  } catch { return []; }
}

export function writeCart(items) {
  localStorage.setItem(cartKey, JSON.stringify(items));
  updateCartCount();
}

export const getPromo = () => localStorage.getItem(promoKey) || '';
export const setPromo = value => localStorage.setItem(promoKey, value);
export const sameVariant = (a, b) => a.id === b.id && a.color === b.color && a.storage === b.storage;

function updateCartCount() {
  const total = readCart().reduce((count, line) => count + line.quantity, 0);
  const counter = document.querySelector('#cart-count');
  if (counter) {
    counter.hidden = total === 0;
    counter.textContent = total;
  }
}

const nav = [
  ['Điện thoại', '/dien-thoai', ''],
  ['iPhone', '/dien-thoai?brand=Apple', 'Apple'],
  ['Galaxy', '/dien-thoai?brand=Samsung', 'Samsung'],
  ['Pixel', '/dien-thoai?brand=Google', 'Google']
];
const logo = '<a class="wordmark" href="/" aria-label="Forma, trang chủ">forma<span>.</span></a>';

export function mountShell() {
  const page = location.pathname.replace(/\.html$|\/$/g, '');
  const brand = new URLSearchParams(location.search).get('brand') || '';
  const navHtml = nav.map(([name, url, filter]) => `<a href="${url}"${page === '/dien-thoai' && brand === filter ? ' aria-current="page"' : ''}>${name}</a>`).join('');
  const header = document.querySelector('#site-header');
  header.innerHTML = `
    <a class="skip-link" href="#main">Đến nội dung</a>
    <div class="shell header-row">
      ${logo}
      <nav class="main-nav" aria-label="Điều hướng chính">${navHtml}</nav>
      <div class="header-actions">
        <button id="search-open" type="button" class="icon-button" aria-label="Tìm điện thoại" aria-haspopup="dialog">${icon('search')}</button>
        <a class="icon-button" href="/tai-khoan" aria-label="Tài khoản">${icon('user')}</a>
        <a class="icon-button bag-link" href="/gio-hang" aria-label="Giỏ hàng">${icon('bag')}<span id="cart-count" hidden></span></a>
      </div>
    </div>
    <dialog id="header-search" class="search-dialog" aria-labelledby="search-title">
      <div class="dialog-bar"><h2 id="search-title">Tìm điện thoại</h2><form method="dialog"><button class="icon-button" aria-label="Đóng tìm kiếm">×</button></form></div>
      <form action="/dien-thoai" class="search-field">
        <label for="global-query" class="sr-only">Tên điện thoại</label>
        <input id="global-query" name="q" type="search" maxlength="80" placeholder="Ví dụ iPhone, Galaxy…" required>
        <button class="button" type="submit">Tìm</button>
      </form>
    </dialog>`;
  const footer = document.querySelector('#site-footer');
  footer.innerHTML = `<div class="shell footer-wrap">
    <div class="footer-top">
      <div>${logo}<p>Cửa hàng điện thoại demo.</p></div>
      <nav aria-label="Liên kết cuối trang"><a href="/dien-thoai">Điện thoại</a><a href="/tai-khoan">Tài khoản</a><a href="/#ho-tro">Cách mua hàng</a></nav>
    </div>
    <p class="footer-credit">Hình ảnh và video từ
      <a href="https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/">Apple</a>,
      <a href="https://www.samsung.com/vn/smartphones/galaxy-s25-ultra/">Samsung</a> và
      <a href="https://blog.google/products-and-platforms/devices/pixel/google-pixel-9-pro-xl/">Google</a>.
    </p>
  </div>`;
  const dialog = document.querySelector('#header-search');
  document.querySelector('#search-open').addEventListener('click', () => {
    dialog.showModal();
    document.querySelector('#global-query').focus();
  });
  updateCartCount();
  window.addEventListener('storage', updateCartCount);
}

export function tile(product) {
  const { name, tagline, price, colors, image, id } = product;
  const palette = colors.map(color => `<span title="${escapeHtml(color.name)}" style="--swatch:${escapeHtml(color.hex)}"></span>`).join('');
  return `<article class="product-tile">
    <a href="${productUrl(id)}" class="tile-art" aria-label="Xem ${escapeHtml(name)}">
      <img src="${imageUrl(image)}" width="620" height="620" alt="${escapeHtml(name)}" loading="lazy">
    </a>
    <div class="swatches" aria-label="${colors.length} màu">${palette}</div>
    <h3><a href="${productUrl(id)}">${escapeHtml(name)}</a></h3>
    <p>${escapeHtml(tagline)}</p>
    <p class="tile-price">Từ ${money(price)}</p>
  </article>`;
}

export function totals(bill) {
  return `<dl class="totals">
    <div><dt>Tạm tính</dt><dd>${money(bill.subtotal)}</dd></div>
    <div><dt>Giao hàng</dt><dd>${bill.shipping ? money(bill.shipping) : 'Miễn phí'}</dd></div>
    ${bill.discount ? `<div><dt>Ưu đãi</dt><dd>−${money(bill.discount)}</dd></div>` : ''}
    <div class="total"><dt>Tổng cộng</dt><dd>${money(bill.total)}</dd></div>
  </dl>`;
}

export function setBusy(button, busy, label = 'Đang xử lý…') {
  if (busy) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? label : button.dataset.label;
}
