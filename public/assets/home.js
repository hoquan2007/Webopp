// Dữ liệu trưng bày cập nhật hình và văn bản. Giá lấy từ danh mục C++.
import { api, mountShell, tile, showError, money, productUrl, imageUrl } from './shared.js';

mountShell();
const film = document.querySelector('#film');
const video = film.querySelector('video');
const filmButton = document.querySelector('#open-film');
filmButton.addEventListener('click', () => {
  if (!video.hasAttribute('src')) video.src = video.dataset.src;
  film.showModal();
  video.play().catch(() => {});
});
film.addEventListener('close', () => video.pause());

const panels = [
  { model: 'pro', id: 'iphone-17-pro', name: 'iPhone 17 Pro', brand: 'Apple',
    description: 'Thân nhôm liền khối, chip A19 Pro và ba camera Fusion 48 MP.',
    image: 'pro-lineup', finish: 'Ba màu hoàn thiện',
    alt: 'iPhone 17 Pro màu Xanh Đậm, Cam Vũ Trụ và Bạc' },
  { model: 'galaxy', id: 'galaxy-s25-ultra', name: 'Galaxy S25 Ultra', brand: 'Samsung',
    description: 'Khung titan, bút S Pen và camera chính 200 MP.',
    image: 'galaxy-blue', finish: 'Titan Xanh Bạc' },
  { model: 'pixel', id: 'pixel-9-pro', name: 'Pixel 9 Pro', brand: 'Google',
    description: 'Màn hình Super Actua 6,3 inch và camera tele 5×.',
    image: 'pixel-porcelain', finish: 'Trắng Sứ' }
];
const hero = document.querySelector('#showcase-panel');
const heroNav = document.querySelector('#showcase-nav');
const choices = [...heroNav.querySelectorAll('[data-slide]')];
const price = document.querySelector('#showcase-price');
let active = 0;
let products = [];

function showPrice() {
  const product = products.find(item => item.id === panels[active].id);
  price.hidden = !product;
  if (product) price.textContent = `Từ ${money(product.price)}`;
}

function selectPanel(index) {
  if (index === active) return;
  active = index;
  const { model, id, name, brand, description, image, finish, alt } = panels[index];
  hero.dataset.model = model;
  document.querySelector('#home-title').textContent = name;
  document.querySelector('#showcase-brand').textContent = brand;
  document.querySelector('#showcase-description').textContent = description;
  document.querySelector('#showcase-finish').textContent = finish;
  document.querySelector('#showcase-link').href = productUrl(id);
  const photo = document.querySelector('#showcase-image');
  photo.src = imageUrl(image);
  photo.alt = alt || `${name} màu ${finish}`;
  filmButton.hidden = model !== 'pro';
  choices.forEach((button, position) => button.setAttribute('aria-pressed', position === active));
  document.querySelector('#showcase-status').textContent = `${name}, ${finish}`;
  showPrice();
}

heroNav.hidden = false;
choices.forEach((button, index) => button.addEventListener('click', () => selectPanel(index)));
for (const button of heroNav.querySelectorAll('[data-step]')) {
  button.addEventListener('click', () => selectPanel((active + Number(button.dataset.step) + panels.length) % panels.length));
}

const featured = document.querySelector('#featured');
try {
  ({ products } = await api('catalog'));
  showPrice();
  document.querySelector('#all-phones-label').textContent = `Xem cả ${products.length} mẫu`;
  featured.innerHTML = products.filter(product => product.featured).map(tile).join('');
} catch (error) {
  showError(featured, error);
}
