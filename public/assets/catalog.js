// Tìm kiếm, lọc và sắp xếp qua API, giữ lại truy vấn trong URL.
import { api, mountShell, tile, showError } from './shared.js';

mountShell();
const filters = document.querySelector('#brand-filters');
const form = document.querySelector('#catalog-tools');
const results = document.querySelector('#catalog-results');
const count = document.querySelector('#result-count');
const params = new URLSearchParams(location.search);
for (const name of ['brand', 'q', 'sort']) form.elements[name].value = params.get(name) || '';

for (const link of filters.querySelectorAll('a')) {
  const query = new URLSearchParams(params);
  query.delete('brand');
  if (link.dataset.brand) query.set('brand', link.dataset.brand);
  link.href = query.size ? `/dien-thoai?${query}` : '/dien-thoai';
  if (link.dataset.brand === form.elements.brand.value) link.setAttribute('aria-current', 'page');
}
form.elements.sort.addEventListener('change', () => form.requestSubmit());
try {
  const { products } = await api('catalog', { query: params });
  count.textContent = `${products.length} mẫu điện thoại`;
  results.innerHTML = products.length ? products.map(tile).join('') : `
    <div class="empty"><h2>Chưa tìm thấy mẫu phù hợp.</h2><a class="text-link" href="/dien-thoai">Xem tất cả điện thoại</a></div>`;
} catch (error) {
  showError(results, error);
} finally {
  results.setAttribute('aria-busy', 'false');
}
