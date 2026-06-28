import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from './config.js';

test('uses VITE_API_URL when provided', () => {
  const env = { VITE_API_URL: 'https://example.com/api' };
  assert.equal(resolveApiBaseUrl(env, 'localhost'), 'https://example.com/api');
});

test('falls back to localhost for local development', () => {
  const env = {};
  assert.equal(resolveApiBaseUrl(env, 'localhost'), 'http://localhost:5000/api');
});

test('falls back to production backend for deployed frontend', () => {
  const env = {};
  assert.equal(resolveApiBaseUrl(env, 'taskflow-project-management-ten.vercel.app'), 'https://project-management-portal-ka8q.onrender.com/api');
});
