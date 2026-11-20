// Xác nhận đơn thử bằng phiên đăng nhập và báo giá mới nhất từ C++.
import { api, mountShell, escapeHtml as e, money, totals, capacity, imageUrl, readCart, writeCart, getPromo, setPromo,
  showError, setBusy } from './shared.js';

mountShell();
const layout = document.querySelector('#checkout-layout');
const form = document.querySelector('#checkout-form');
const status = document.querySelector('#checkout-status');
const errorBox = document.querySelector('#checkout-error');
const result = document.querySelector('#order-result');
const loginLink = '/tai-khoan?next=thanh-toan';
const items = readCart();
const promo = getPromo();
const requestId = crypto.randomUUID();
let quote;

function requireLogin() {
  layout.hidden = true;
  status.innerHTML = `<div class="empty"><h2>Đăng nhập để tiếp tục.</h2><a class="button" href="${loginLink}">Đăng nhập</a></div>`;
}

try {
  status.textContent = 'Đang kiểm tra đơn hàng…';
  if (!items.length) {
    status.innerHTML = '<div class="empty"><h2>Giỏ hàng đang trống.</h2><a class="button" href="/dien-thoai">Chọn điện thoại</a></div>';
  } else {
    const { account } = await api('session');
    if (!account) requireLogin();
    else {
      quote = await api('quote', { body: { items, promo } });
      document.querySelector('#buyer-email').textContent = account.email;
      document.querySelector('#checkout-summary').innerHTML = `
        <h2>Đơn hàng của bạn</h2>
        <ul class="order-items">${quote.items.map(line => `
          <li><img src="${imageUrl(line.image)}" width="64" height="64" alt="">
              <span><strong>${e(line.name)}</strong><small>${e(line.colorName)} / ${capacity(line.storage)} × ${line.quantity}</small></span>
          </li>`).join('')}</ul>
        ${totals(quote)}`;
      status.textContent = '';
      layout.hidden = false;
    }
  }
} catch (error) { showError(status, error); }

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const { payment, ...delivery } = Object.fromEntries(new FormData(form));
  setBusy(button, true);
  errorBox.hidden = true;
  try {
    const order = await api('checkout', { body: { items, promo, delivery, payment, requestId, expectedTotal: quote.total } });
    writeCart([]);
    setPromo('');
    layout.hidden = true;
    result.innerHTML = `
      <span class="confirmation-mark" aria-hidden="true"></span>
      <h2>Đơn demo đã được xác nhận.</h2>
      <p>Mã đơn <strong>${e(order.id)}</strong></p>
      <p>${e(order.payment.status)} · ${money(order.quote.total)}</p>
      <a class="button" href="/dien-thoai">Tiếp tục khám phá</a>`;
    result.hidden = false;
    result.tabIndex = -1;
    result.focus();
  } catch (error) {
    if (error.status === 401) requireLogin();
    else showError(errorBox, error);
  } finally { setBusy(button, false); }
});
