// Vercel nhận HTTP ở đây. Node.js quản lý cookie và chuyển nghiệp vụ sang C++.
import { spawn } from 'node:child_process';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const binary = fileURLToPath(new URL(
  process.platform === 'win32' ? '../build/forma-core.exe' : '../build/forma-core', import.meta.url
));
const cookieName = 'forma_session';
const lifetime = 8 * 60 * 60;
const demo = !process.env.FORMA_ACCOUNT_EMAIL && !process.env.FORMA_ACCOUNT_PASSWORD;
const accountEmail = process.env.FORMA_ACCOUNT_EMAIL?.trim().toLowerCase() || 'demo@forma.vn';
const accountPassword = process.env.FORMA_ACCOUNT_PASSWORD ?? (demo ? 'FormaDemo2026' : '');
const configuredSecret = process.env.FORMA_SESSION_SECRET;
const sessionKey = configuredSecret?.length >= 32 ? configuredSecret
  : !process.env.VERCEL && !configuredSecret ? randomBytes(32) : null;
const salt = randomBytes(16);
const deriveKey = promisify(scrypt);
const expectedKey = deriveKey(accountPassword, salt, 32);
const getActions = ['catalog', 'product', 'session'];
const postActions = ['login', 'logout', 'quote', 'checkout'];

function runCore(input) {
  return new Promise((resolve, reject) => {
    // Mọi dữ liệu của khách vào stdin. Không dựng lệnh shell từ dữ liệu HTTP.
    const child = spawn(binary, [], { stdio: ['pipe', 'pipe', 'ignore'], timeout: 3500, windowsHide: true });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => { output += chunk; });
    child.stdin.on('error', reject);
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error('C++ worker stopped'));
      try { resolve(JSON.parse(output)); }
      catch (error) { reject(error); }
    });
    child.stdin.end(JSON.stringify(input), 'utf8');
  });
}

function response(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function coreResponse(result, headers) {
  return response(result.body, result.status, headers);
}

function signature(value) {
  return createHmac('sha256', sessionKey).update(value).digest('base64url');
}

function sessionCookie(value, maxAge, url) {
  const secure = process.env.VERCEL || url.protocol === 'https:' ? '; Secure' : '';
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function readSession(request) {
  if (!sessionKey) return null;
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)forma_session=([\w.-]{1,800})(?:;|$)/)?.[1];
  if (!token) return null;
  const [value, mac, extra] = token.split('.');
  if (!mac || extra !== undefined) return null;
  const supplied = Buffer.from(mac);
  const expected = Buffer.from(signature(value));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    return payload.exp > Date.now() && payload.account.email === accountEmail ? payload.account : null;
  } catch {
    return null;
  }
}

async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 16_384) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch { return null; }
}

async function signIn(body, url) {
  if (!sessionKey || !accountPassword || (!demo && !process.env.FORMA_ACCOUNT_EMAIL)) {
    return response({ error: 'Máy chủ chưa cấu hình tài khoản hoặc khóa phiên.' }, 503);
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (typeof body.password !== 'string' || body.password.length > 256 || email.length > 254) {
    return response({ error: 'Email hoặc mật khẩu chưa đúng.' }, 401);
  }
  const actualKey = await deriveKey(body.password, salt, 32);
  const result = await runCore({
    action: 'login', email, allowedEmail: accountEmail,
    passwordVerified: timingSafeEqual(actualKey, await expectedKey)
  });
  if (result.status !== 200) return coreResponse(result);

  const payload = Buffer.from(JSON.stringify({
    account: result.body, exp: Date.now() + lifetime * 1000
  })).toString('base64url');
  return coreResponse(result, { 'Set-Cookie': sessionCookie(`${payload}.${signature(payload)}`, lifetime, url) });
}

export async function handleStore(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const account = readSession(request);
  if (![...getActions, ...postActions].includes(action)) {
    return response({ error: 'Yêu cầu không tồn tại.' }, 404);
  }
  const method = getActions.includes(action) ? 'GET' : 'POST';
  if (request.method !== method) return response({ error: 'Phương thức không hợp lệ.' }, 405, { Allow: method });

  try {
    if (method === 'GET') {
      if (action === 'session') return response({ account, demo });
      if (action === 'catalog') {
        const { brand = '', q = '', sort = '' } = Object.fromEntries(url.searchParams);
        return coreResponse(await runCore({ action, brand, q, sort }));
      }
      return coreResponse(await runCore({ action, id: url.searchParams.get('id') || '' }));
    }

    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return response({ error: 'Nguồn yêu cầu không hợp lệ.' }, 403);
    const body = await readBody(request);
    if (!body) return response({ error: 'Hãy gửi một đối tượng JSON hợp lệ.' }, 400);
    if (action === 'login') return await signIn(body, url);
    if (action === 'logout') return response({ account: null }, 200, { 'Set-Cookie': sessionCookie('', 0, url) });
    if (action === 'quote') return coreResponse(await runCore({ ...body, action }));
    if (!account) return response({ error: 'Hãy đăng nhập để đặt hàng.' }, 401);

    // Mã xác nhận ổn định khi khách thử gửi lại cùng một yêu cầu.
    if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)) {
      return response({ error: 'Mã yêu cầu đặt hàng không hợp lệ.' }, 400);
    }
    const orderKey = JSON.stringify([account.email, body.requestId, body.items, body.promo,
      body.delivery, body.payment, body.expectedTotal]);
    const orderId = 'FM-' + signature(orderKey).slice(0, 12);
    return coreResponse(await runCore({ ...body, action, buyerEmail: account.email, orderId }));
  } catch (error) {
    console.error('Forma API:', error.name);
    return response({ error: 'Cửa hàng tạm thời không phản hồi. Hãy thử lại.' }, 503);
  }
}

export default { fetch: handleStore };
