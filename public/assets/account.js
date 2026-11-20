// Lấy thông tin từ cookie phiên, xử lý đăng nhập và đăng xuất qua HTTP.
import { api, mountShell, setBusy, showError } from './shared.js';

mountShell();
const form = document.querySelector('#login');
const profile = document.querySelector('#profile');
const status = document.querySelector('#account-status');
const loginError = document.querySelector('#login-error');
const next = new URLSearchParams(location.search).get('next') === 'thanh-toan' ? '/thanh-toan' : '';
const logout = document.querySelector('#logout');
let allowDemo = false;

function render(account) {
  document.querySelector('#account-intro').textContent = account ? 'Bạn đã đăng nhập vào Forma.' : 'Đăng nhập để đặt đơn hàng trên Forma.';
  form.hidden = Boolean(account);
  profile.hidden = !account;
  document.querySelector('#demo-login').hidden = !allowDemo;
  document.querySelector('#profile-email').textContent = account?.email ?? '';
  status.textContent = '';
  status.hidden = true;
}

try {
  const { account, demo } = await api('session');
  allowDemo = demo;
  if (account && next) location.replace(next);
  else render(account);
} catch (error) { showError(status, error); }

document.querySelector('#fill-demo').addEventListener('click', () => {
  form.elements.email.value = 'demo@forma.vn';
  form.elements.password.value = 'FormaDemo2026';
  form.querySelector('button[type="submit"]').focus();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  setBusy(button, true, 'Đang đăng nhập…');
  loginError.hidden = true;
  try {
    const account = await api('login', { body: Object.fromEntries(new FormData(form)) });
    form.reset();
    if (next) location.assign(next);
    else render(account);
  } catch (error) { showError(loginError, error); }
  finally { setBusy(button, false); }
});

logout.addEventListener('click', async () => {
  setBusy(logout, true);
  try {
    await api('logout', { body: {} });
    render(null);
    form.elements.email.focus();
  } catch (error) { showError(status, error); }
  finally { setBusy(logout, false); }
});
