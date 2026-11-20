// localStorage giữ lựa chọn. C++ cung cấp tên, giá, ưu đãi và tổng tiền.
import { api, mountShell, escapeHtml as e, money, capacity, totals, imageUrl, productUrl,
  readCart, writeCart, getPromo, setPromo, sameVariant, showError } from './shared.js';

mountShell();
const target = document.querySelector('#cart');
const announcement = document.querySelector('#cart-status');

function cartRow(line, index) {
  return `<article class="cart-row">
    <a class="cart-img" href="${productUrl(line.id)}"><img src="${imageUrl(line.image)}" alt="${e(line.name)}" width="120" height="120"></a>
    <div class="cart-text"><h2><a href="${productUrl(line.id)}">${e(line.name)}</a></h2>
      <p class="muted">${e(line.colorName)} / ${capacity(line.storage)}</p>
      <button type="button" class="text-link remove" data-line="${index}" data-delta="0" aria-label="Xóa ${e(line.name)}">Xóa</button>
    </div>
    <div class="quantity" aria-label="Số lượng ${e(line.name)}">
      <button type="button" data-line="${index}" data-delta="-1" aria-label="Giảm số lượng ${e(line.name)}" ${line.quantity <= 1 ? 'disabled' : ''}>−</button>
      <span>${line.quantity}</span>
      <button type="button" data-line="${index}" data-delta="1" aria-label="Tăng số lượng ${e(line.name)}" ${line.quantity >= 5 ? 'disabled' : ''}>+</button>
    </div>
    <strong class="line-price">${money(line.total)}</strong>
  </article>`;
}

function render(bill, promo) {
  if (!bill.items.length) {
    target.innerHTML = '<div class="empty"><h2>Giỏ hàng đang trống.</h2><a class="button" href="/dien-thoai">Khám phá điện thoại</a></div>';
    return;
  }
  target.innerHTML = `<div class="purchase-layout">
    <div>${bill.items.map(cartRow).join('')}</div>
    <aside class="summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Tóm tắt đơn hàng</h2>
      <form id="promo-form" class="form-stack">
        <label for="promo">Mã ưu đãi</label>
        <div class="search-field"><input id="promo" name="promo" maxlength="20" placeholder="FORMA5" value="${e(promo)}"><button class="button subtle" type="submit">Áp dụng</button></div>
      </form>
      <p class="feedback" id="cart-error" role="alert" hidden></p>
      ${totals(bill)}
      <a class="button checkout-link" href="/thanh-toan">Tiến hành thanh toán</a>
    </aside>
  </div>`;

  const update = async (items, nextPromo, focusSelector) => {
    const feedback = target.querySelector('#cart-error');
    const controls = [...target.querySelectorAll('input:not(:disabled), button:not(:disabled)')];
    const checkout = target.querySelector('.checkout-link');
    const checkoutUrl = checkout.getAttribute('href');
    controls.forEach(control => { control.disabled = true; });
    checkout.removeAttribute('href');
    feedback.hidden = true;
    try {
      const nextBill = await api('quote', { body: { items, promo: nextPromo } });
      writeCart(items);
      setPromo(items.length ? nextPromo : '');
      render(nextBill, nextPromo);
      announcement.textContent = `Giỏ hàng đã cập nhật. Tổng cộng ${money(nextBill.total)}.`;
      target.querySelector(focusSelector)?.focus();
    } catch (error) {
      controls.forEach(control => { control.disabled = false; });
      checkout.setAttribute('href', checkoutUrl);
      showError(feedback, error);
      target.querySelector(focusSelector)?.focus();
    }
  };

  target.querySelectorAll('[data-line]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.line);
      const delta = Number(button.dataset.delta);
      const line = bill.items[index];
      const items = readCart().flatMap(item => {
        if (!sameVariant(item, line)) return [item];
        return delta ? [{ ...item, quantity: line.quantity + delta }] : [];
      });
      const selector = delta ? `[data-line="${index}"][data-delta="${delta}"]:not(:disabled)` : '.checkout-link';
      update(items, promo, selector);
    });
  });
  target.querySelector('#promo-form').addEventListener('submit', event => {
    event.preventDefault();
    update(readCart(), event.currentTarget.elements.promo.value.trim().toUpperCase(), '#promo');
  });
}

async function loadCart() {
  const items = readCart();
  const promo = getPromo();
  try {
    render(await api('quote', { body: { items, promo } }), promo);
  } catch (error) {
    target.innerHTML = '<div class="empty"><h2>Giỏ hàng chưa tải được.</h2><p id="load-error"></p><button type="button" class="button subtle" id="retry">Thử lại</button></div>';
    showError(target.querySelector('#load-error'), error);
    target.querySelector('#retry').addEventListener('click', loadCart);
  } finally { target.setAttribute('aria-busy', 'false'); }
}

await loadCart();
