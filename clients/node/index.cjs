'use strict';

/**
 * dzship — Node client for the free Algerian shipping API at freeship.dzbuild.com.
 *
 * Zero dependencies (uses the global fetch available in Node 18+).
 * Docs: https://freeship.dzbuild.com · guides: https://github.com/DZBuild-com/dzship
 */

const GATEWAY = 'https://freeship.dzbuild.com';

class DzshipError extends Error {
  /**
   * @param {number} status HTTP status (400, 422, 429, 502, 503…)
   * @param {string} code machine code: invalid_input, invalid_phone, courier_error, rate_limited, overloaded…
   * @param {string} message human-readable explanation
   * @param {object|undefined} fields per-field validation errors (on invalid_input)
   * @param {number|undefined} retryAfter seconds to wait (on rate_limited / overloaded)
   */
  constructor(status, code, message, fields, retryAfter) {
    super(message);
    this.name = 'DzshipError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

async function request(path, { method = 'GET', body, gateway = GATEWAY, timeoutMs = 30000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(gateway + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new DzshipError(0, 'network_error', `Could not reach ${gateway}: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const err = data.error || {};
    const retryAfter = res.headers.get('retry-after');
    throw new DzshipError(
      res.status,
      err.code || 'http_' + res.status,
      err.message || `Request failed with HTTP ${res.status}`,
      err.fields,
      retryAfter ? Number(retryAfter) : undefined
    );
  }
  return data;
}

/**
 * Create a client bound to one courier account.
 *
 * const client = dzship({
 *   courier: 'yalidine',
 *   credentials: { apiId: '…', apiToken: '…' },
 *   options: { fromWilaya: 16 },          // optional adapter tuning
 * });
 * await client.createOrder({ recipient: {…}, deliveryType: 'home', productList: '…', codAmount: 4500 });
 * await client.track('yal-ABC123');
 * await client.rates({ toWilaya: 31, deliveryType: 'home' });
 */
function dzship({ courier, credentials, options, gateway = GATEWAY, timeoutMs } = {}) {
  if (!courier || !credentials) {
    throw new TypeError('dzship({ courier, credentials }) — both are required');
  }
  const base = { courier, credentials, ...(options ? { options } : {}) };
  const opts = { gateway, ...(timeoutMs ? { timeoutMs } : {}) };
  return {
    createOrder: (order) => request('/v1/orders', { ...opts, method: 'POST', body: { ...base, order } }),
    track: (trackingNumber) => request('/v1/track', { ...opts, method: 'POST', body: { ...base, trackingNumber } }),
    rates: (query) => request('/v1/rates', { ...opts, method: 'POST', body: { ...base, query } }),
  };
}

/** All supported couriers with their required credential fields. No credentials needed. */
dzship.couriers = (opts) => request('/v1/couriers', opts);
/** The 58 wilayas (code + FR/AR names). No credentials needed. Cache it — it never changes. */
dzship.wilayas = (opts) => request('/v1/wilayas', opts);
/** Gateway liveness probe. */
dzship.health = (opts) => request('/health', opts);

dzship.DzshipError = DzshipError;
dzship.GATEWAY = GATEWAY;

module.exports = dzship;
module.exports.default = dzship;
