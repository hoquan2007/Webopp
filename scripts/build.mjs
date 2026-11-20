// Biên dịch cùng một lõi C++ trên Windows và trên máy build Linux của Vercel.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const binary = process.platform === 'win32' ? 'build/forma-core.exe' : 'build/forma-core';
mkdirSync(new URL('../build/', import.meta.url), { recursive: true });

// Windows dùng thư viện tĩnh để chạy ngoài MSYS2. Linux dùng libstdc++ của hệ thống.
const linkerFlags = process.platform === 'win32' ? ['-static-libgcc', '-static-libstdc++'] : [];
const result = spawnSync(process.env.CXX || 'g++', [
  '-std=c++17', '-O2', '-Wall', '-Wextra', '-pedantic',
  '-finput-charset=UTF-8', '-fexec-charset=UTF-8',
  ...linkerFlags,
  'cpp/main.cpp', 'cpp/catalog.cpp', 'cpp/store.cpp', '-o', binary
], { cwd: root, stdio: 'inherit' });

if (result.error) console.error('Cần g++ trong PATH hoặc đặt biến CXX.', result.error.message);
process.exitCode = result.status ?? 1;
