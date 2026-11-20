// Trang chủ chỉ dựng các mẫu được đánh dấu nổi bật trong danh mục C++.
import { api, mountShell, tile, showError } from './shared.js';

mountShell();
const film = document.querySelector('#film');
const video = film.querySelector('video');
document.querySelector('#open-film').addEventListener('click', () => {
  if (!video.hasAttribute('src')) video.src = video.dataset.src;
  film.showModal();
  video.play().catch(() => {});
});
film.addEventListener('close', () => video.pause());

const featured = document.querySelector('#featured');
try {
  const { products } = await api('catalog');
  featured.innerHTML = products.filter(product => product.featured).map(tile).join('');
} catch (error) {
  showError(featured, error);
}
