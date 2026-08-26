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
 * Build the query string for a reference lookup.
 *
 * Accepts what you would naturally type: nothing, a wilaya code, a search term,
 * or an object. `dzship.wilayas(16)` becomes `?16` — the shorthand the API takes.
 */
function referenceQuery(arg) {
  if (arg === undefined || arg === null || arg === '') return '';
  if (typeof arg === 'number') return '?' + arg;
  if (typeof arg === 'string') return '?q=' + encodeURIComponent(arg);
  const parts = [];
  if (arg.code !== undefined) parts.push('code=' + encodeURIComponent(arg.code));
  if (arg.wilaya !== undefined) parts.push('wilaya=' + encodeURIComponent(arg.wilaya));
  if (arg.q) parts.push('q=' + encodeURIComponent(arg.q));
  if (arg.platform) parts.push('platform=' + encodeURIComponent(arg.platform));
  if (arg.all) parts.push('all=1');
  return parts.length ? '?' + parts.join('&') : '';
}

/**
 * The reference helpers used to take request options as their only argument, so a
 * first argument that carries nothing but `gateway` / `timeoutMs` still means that.
 */
function splitArgs(first, second) {
  const isOpts =
    first &&
    typeof first === 'object' &&
    Object.keys(first).every((k) => k === 'gateway' || k === 'timeoutMs');
  return isOpts ? { query: undefined, opts: first } : { query: first, opts: second };
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
  if (!courier) {
    throw new TypeError('dzship({ courier }) — courier is required');
  }
  // The sandbox courier takes no credentials; every other one will say which it needs.
  const hasCredentials = credentials && Object.keys(credentials).length > 0;
  const base = { courier, ...(hasCredentials ? { credentials } : {}), ...(options ? { options } : {}) };
  const opts = { gateway, ...(timeoutMs ? { timeoutMs } : {}) };
  return {
    createOrder: (order) => request('/v1/orders', { ...opts, method: 'POST', body: { ...base, order } }),
    track: (trackingNumber) => request('/v1/track', { ...opts, method: 'POST', body: { ...base, trackingNumber } }),
    rates: (query) => request('/v1/rates', { ...opts, method: 'POST', body: { ...base, query } }),
    // Reference data, for building the address form next to the order call.
    wilayas: (query) => dzship.wilayas(query, opts),
    communes: (query) => dzship.communes(query, opts),
    couriers: (query) => dzship.couriers(query, opts),
  };
}

/**
 * Every supported courier with its required credential fields. No credentials needed.
 *   dzship.couriers()                      every courier
 *   dzship.couriers({ platform: 'ecotrack' })
 *   dzship.couriers({ q: 'rocket' })       search key, name and known aliases
 */
dzship.couriers = (query, opts) => {
  const a = splitArgs(query, opts);
  return request('/v1/couriers' + referenceQuery(a.query), a.opts);
};

/**
 * Wilayas. No credentials needed — and cacheable, so cache it.
 *   dzship.wilayas()              the 58 wilayas couriers deliver to
 *   dzship.wilayas(16)            one wilaya
 *   dzship.wilayas('oran')        search, French or Arabic
 *   dzship.wilayas({ all: true }) all 69 of the 2026 division, each with shipAs
 */
dzship.wilayas = (query, opts) => {
  const a = splitArgs(query, opts);
  return request('/v1/wilayas' + referenceQuery(a.query), a.opts);
};

/**
 * Communes, in the spelling courier APIs expect.
 *   dzship.communes()             all 1,541
 *   dzship.communes(16)           the communes of one wilaya
 *   dzship.communes({ q: 'bab', wilaya: 16 })
 */
dzship.communes = (query, opts) => {
  const a = splitArgs(query, opts);
  return request('/v1/communes' + referenceQuery(a.query), a.opts);
};

/** Gateway liveness probe. */
dzship.health = (opts) => request('/health', opts);

dzship.DzshipError = DzshipError;
dzship.GATEWAY = GATEWAY;

module.exports = dzship;
module.exports.default = dzship;
