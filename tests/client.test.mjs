// Offline checks of the Node client: node --test tests/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import dzship, { DzshipError } from '../clients/node/index.mjs';

function stubFetch(status, body) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  };
  return calls;
}

const order = {
  recipient: { fullName: 'Amine Bouzid', phone: '0551234567', wilayaCode: 16, communeName: 'Bab Ezzouar' },
  deliveryType: 'home',
  productList: 'Sneakers x1',
  codAmount: 4500,
};

test('courier and credentials can be passed as arguments', async () => {
  const calls = stubFetch(200, { trackingNumber: 'OSEN-PAB12CD', status: 'created' });
  const client = dzship('osenexpress', { token: 'osn_x' }, { fromWilaya: 16 });
  await client.createOrder(order);
  assert.equal(calls[0].url, 'https://freeship.dzbuild.com/v1/orders');
  assert.deepEqual(calls[0].body, {
    courier: 'osenexpress',
    credentials: { token: 'osn_x' },
    options: { fromWilaya: 16 },
    order,
  });
});

test('the object form still works, and the sandbox needs no credentials', async () => {
  const calls = stubFetch(200, { status: 'created' });
  await dzship({ courier: 'sandbox' }).track('DZTEST-1');
  await dzship('sandbox').track('DZTEST-2');
  assert.deepEqual(calls[0].body, { courier: 'sandbox', trackingNumber: 'DZTEST-1' });
  assert.deepEqual(calls[1].body, { courier: 'sandbox', trackingNumber: 'DZTEST-2' });
});

test('a courier refusal carries the courier message and its code', async () => {
  stubFetch(424, { error: { code: 'COURIER_ERROR', message: '[osenexpress] the token was refused' } });
  await assert.rejects(dzship('osenexpress', { token: 'bad' }).track('X'), (err) => {
    assert.ok(err instanceof DzshipError);
    assert.equal(err.status, 424);
    assert.equal(err.code, 'COURIER_ERROR');
    assert.match(err.message, /token was refused/);
    return true;
  });
});

test('label and cancel send the tracking number to their own routes', async () => {
  const calls = stubFetch(200, { trackingNumber: 'DZTEST-1', format: 'pdf', data: 'JVBERi0=' });
  const client = dzship('sandbox');
  const label = await client.label('DZTEST-1');
  await client.cancel('DZTEST-1');
  assert.equal(label.format, 'pdf');
  assert.deepEqual(
    calls.map((c) => [c.url, c.body]),
    [
      ['https://freeship.dzbuild.com/v1/label', { courier: 'sandbox', trackingNumber: 'DZTEST-1' }],
      ['https://freeship.dzbuild.com/v1/cancel', { courier: 'sandbox', trackingNumber: 'DZTEST-1' }],
    ],
  );
});

test('a courier is required', () => {
  assert.throws(() => dzship({}), TypeError);
  assert.throws(() => dzship(''), TypeError);
});
