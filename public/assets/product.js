// Trang chi tiết dựng cấu hình từ danh mục và gửi giỏ mới lên C++ để kiểm tra.
import { api, mountShell, escapeHtml as e, money, capacity, imageUrl, readCart, writeCart,
  sameVariant, setBusy, showError } from './shared.js';

mountShell();
const target = document.querySelector('#product');
const id = new URLSearchParams(location.search).get('id') || '';

function render(product) {
  const firstColor = product.colors[0];
  const firstStorage = product.storage[0];
  const colors = product.colors.map((option, index) => `
    <label class="color-option" title="${e(option.name)}">
      <input type="radio" name="color" value="${e(option.id)}" ${index === 0 ? 'checked' : ''} aria-label="${e(option.name)}">
      <span style="--swatch:${e(option.hex)}"></span>
    </label>`).join('');
  const capacities = product.storage.map((option, index) => `
    <label class="storage-option">
      <input type="radio" name="storage" value="${option.gb}" ${index === 0 ? 'checked' : ''}>
      <span>${capacity(option.gb)}</span>
    </label>`).join('');
  const specs = [
    ['Màn hình', product.display], ['Vi xử lý', product.chip], ['Camera', product.camera],
    ['Chất liệu', product.body], ['Hệ điều hành', product.system]
  ];
  const breadcrumb = document.querySelector('#product-crumb');
  breadcrumb.textContent = product.name;
  breadcrumb.hidden = document.querySelector('#product-crumb-divider').hidden = false;
  target.innerHTML = `
    <div class="product-layout">
      <figure class="product-figure">
        <img id="product-image" src="${imageUrl(firstColor.image)}" width="820" height="820" alt="${e(product.name)} màu ${e(firstColor.name)}">
        <figcaption id="image-finish">${e(firstColor.name)}</figcaption>
      </figure>
      <div class="product-info">
        <p class="muted product-brand">${e(product.brand)}</p>
        <h1>${e(product.name)}</h1>
        <p>${e(product.description)}</p>
        <p class="product-price" id="product-price" aria-live="polite">${money(firstStorage.price)}</p>
        <a class="text-link product-spec-link" href="#spec-title">Xem thông số <span aria-hidden="true">↓</span></a>
        <form id="configuration" class="form-stack" data-ui>
          <fieldset><legend>Màu sắc <span class="muted" id="color-name">${e(firstColor.name)}</span></legend>
            <div class="color-options">${colors}</div>
          </fieldset>
          <fieldset><legend>Dung lượng</legend><div class="storage-options">${capacities}</div></fieldset>
          <button class="button" type="submit">Thêm vào giỏ</button>
          <p id="product-error" class="feedback" role="alert" hidden></p>
          <p id="added" class="success" role="status" hidden>Đã thêm vào giỏ. <a href="/gio-hang">Xem giỏ hàng</a></p>
        </form>
        <p class="shipping-note">Xem phí giao hàng và áp dụng mã ưu đãi trong giỏ.</p>
      </div>
    </div>
    <section class="section specs" aria-labelledby="spec-title"><h2 id="spec-title">Thông số kỹ thuật</h2>
      <dl>${specs.map(([name, value]) => `<div><dt>${name}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
    </section>`;
  const form = target.querySelector('#configuration');
  const photo = target.querySelector('#product-image');
  const colorName = target.querySelector('#color-name');
  const finish = target.querySelector('#image-finish');
  const price = target.querySelector('#product-price');
  const status = target.querySelector('#added');
  const feedback = target.querySelector('#product-error');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('change', () => {
    const color = product.colors.find(option => option.id === form.elements.color.value);
    const storage = product.storage.find(option => option.gb === Number(form.elements.storage.value));
    photo.src = imageUrl(color.image);
    photo.alt = `${product.name} màu ${color.name}`;
    colorName.textContent = color.name;
    finish.textContent = color.name;
    price.textContent = money(storage.price);
    status.hidden = feedback.hidden = true;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    setBusy(button, true);
    status.hidden = feedback.hidden = true;
    try {
      const variant = { id: product.id, color: form.elements.color.value, storage: Number(form.elements.storage.value), quantity: 1 };
      const oldCart = readCart();
      const existing = oldCart.find(item => sameVariant(item, variant));
      if (existing) existing.quantity++;
      else oldCart.push(variant);
      await api('quote', { body: { items: oldCart } });
      writeCart(oldCart);
      status.hidden = false;
    } catch (error) { showError(feedback, error); }
    finally { setBusy(button, false); }
  });
}

try {
  const product = await api('product', { query: { id } });
  document.title = `${product.name} | Forma`;
  render(product);
} catch (error) {
  target.innerHTML = '<div class="empty"><h1>Sản phẩm</h1><p id="load-error"></p></div>';
  showError(target.querySelector('#load-error'), error);
} finally {
  target.setAttribute('aria-busy', 'false');
}
