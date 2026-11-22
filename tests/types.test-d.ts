// Type checks for the Node client. Nothing here runs:
//   npx -p typescript tsc --noEmit --strict --module nodenext --moduleResolution nodenext tests/types.test-d.ts
import dzship, { type CourierKey, type CourierCredentials } from '../clients/node/index.js';

dzship({ courier: 'yalidine', credentials: { apiId: 'a', apiToken: 'b' } });
dzship('osenexpress', { token: 't' });
dzship('terminaldelivery', { token: 't' }, { fromWilaya: 16 });
dzship('sandbox');
dzship({ courier: 'sandbox' });

// A courier typed at runtime (a setting, a form field) takes any credential map.
const fromSettings: string = 'osen express';
dzship({ courier: fromSettings, credentials: { token: 't' } });
dzship(fromSettings, { token: 't' });

// @ts-expect-error Yalidine takes apiId and apiToken, not token
dzship({ courier: 'yalidine', credentials: { token: 't' } });
// @ts-expect-error NOEST needs guid too
dzship('noest', { apiToken: 't' });
// @ts-expect-error a real courier needs credentials
dzship({ courier: 'maystro' });

const key: CourierKey = 'rocketdelivery';
const creds: CourierCredentials['zrexpressnew'] = { apiKey: 'k', tenantId: 't' };
void key;
void creds;

async function shapes() {
  const client = dzship('sandbox');
  const created = await client.createOrder({
    recipient: { fullName: 'A', phone: '0551234567', wilayaCode: 16, communeName: 'Bab Ezzouar' },
    deliveryType: 'home',
    productList: 'x',
    codAmount: 4500,
  });
  const reference: string | undefined = created.courierReference;
  const label = await client.label(created.trackingNumber);
  const file: string = label.format === 'url' ? (label.url ?? label.data) : label.data;
  const { cancelled } = await client.cancel(created.trackingNumber);
  // @ts-expect-error a label has three formats
  if (label.format === 'png') void 0;
  void reference;
  void file;
  void cancelled;
}
void shapes;
