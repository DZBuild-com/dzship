# dzship — Algerian shipping, explained for developers

[![npm](https://img.shields.io/npm/v/dzship)](https://www.npmjs.com/package/dzship)

Everything you need to integrate delivery couriers in Algeria: how Yalidine,
ZR Express, Maystro, NOEST and the Ecotrack couriers actually behave, which one
to pick for a given project, and working code to create and track COD parcels
in minutes.

The code examples run against **dzship**, the free hosted API at
**[freeship.dzbuild.com](https://freeship.dzbuild.com)** that talks to all of
these couriers through one request shape.
No signup, no API key. You bring your own courier account credentials per call
and they are never stored.

Maintained by [DZBuild](https://dzbuild.com), the e-commerce platform that moves
real COD orders across all 58 wilayas every day. These guides are the field notes
from that shipping engine.

## Start here

| Guide | What it answers |
|---|---|
| [Integrating dzship](docs/integrating.md) | Ready-made clients (Node, PHP, Python) and copy-paste snippets for every stack |
| [Choosing a courier](docs/choosing-a-courier.md) | Which delivery company fits your project: coverage, stop-desk, exchanges, API quality |
| [Wilayas & communes](docs/wilayas-and-communes.md) | The complete official dataset (58 wilayas, 1,541 communes, FR + AR) and the matching rules couriers expect |
| [Yalidine](docs/couriers/yalidine.md) | The biggest network. Also covers Yalitec, Guepex, Easy & Speed |
| [ZR Express](docs/couriers/zr-express.md) | Procolis. Strong in the center, simple credential model |
| [Maystro](docs/couriers/maystro.md) | Fulfillment-style courier with a strict duplicate policy |
| [NOEST](docs/couriers/noest.md) | Why parcels get stranded if you skip the validation step |
| [Ecotrack couriers](docs/couriers/ecotrack.md) | DHD, Conexlog, MSM Go, World Express and 30+ tenants on one platform |
| [Delivery statuses](docs/statuses.md) | One status vocabulary for all couriers, with French and Arabic UI labels |
| [Cash on delivery](docs/cash-on-delivery.md) | COD mechanics: fees, returns, the deep-south surcharge, confirmation calls |

## Create a parcel in 60 seconds

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "yalidine",
    "credentials": { "apiId": "YOUR_API_ID", "apiToken": "YOUR_API_TOKEN" },
    "options": { "fromWilaya": 16 },
    "order": {
      "recipient": {
        "fullName": "Amine Bouzid",
        "phone": "0551234567",
        "wilayaCode": 16,
        "communeName": "Bab Ezzouar"
      },
      "deliveryType": "home",
      "productList": "Sneakers Air x1",
      "codAmount": 4500
    }
  }'
```

Swap `"courier"` and `"credentials"` to ship with any other supported courier.
The request shape stays the same. Full endpoint reference, error codes and
limits live at [freeship.dzbuild.com](https://freeship.dzbuild.com).

## Or skip the raw HTTP — ready-made clients

The [`clients/`](clients/) directory has MIT-licensed clients that wrap the
same three calls, with typed errors and retry-after handling built in:

- **Node.js** — [`npm install dzship`](https://www.npmjs.com/package/dzship)
  (zero dependencies, TypeScript types included):

  ```js
  import dzship from 'dzship';

  const client = dzship({ courier: 'yalidine', credentials: { apiId: '…', apiToken: '…' } });
  const { trackingNumber } = await client.createOrder({ /* recipient, productList, codAmount… */ });
  ```

- **PHP** — copy the single file [`clients/php/Dzship.php`](clients/php/Dzship.php)
  (ext-curl only, shared-hosting friendly).
- **Python** — copy the single file [`clients/python/dzship.py`](clients/python/dzship.py)
  (standard library only, 3.8+).

The [integration guide](docs/integrating.md) has full examples for Laravel,
WooCommerce, Django, Google Sheets and raw HTTP in any language.

## Free dataset: all 58 wilayas and 1,541 communes

Most Algerian projects rebuild this list by hand, badly. It's in
[`data/`](data/) as JSON and CSV — French + Arabic names, numeric wilaya codes,
current 58-wilaya division:

```js
const wilayas = await fetch(
  "https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/wilayas.json"
).then((r) => r.json());
```

Free to use in any project, no attribution needed. The
[wilayas & communes guide](docs/wilayas-and-communes.md) explains the traps:
commune spelling drift between couriers, homonym communes in different wilayas,
and why you should always store the wilaya code, never the name.

## Why couriers are the hard part

Every Algerian courier ships its own API: different auth, different field names,
statuses in French, Arabic, or bare numbers, and documentation that ranges from
thin to wrong. The failure modes are quiet ones. A commune spelled differently
than the courier's list, a validation step the docs never mention, a status code
that looks inverted. Your integration works in the demo and strands parcels in
production.

These guides exist so you don't relearn each trap the expensive way. Where a
trap is already handled by the dzship API, the guide says so and you can stop
worrying about it.

## Building a whole store?

If the shipping integration is part of a bigger build for a merchant, look at
[DZBuild](https://dzbuild.com) before writing more code: Arabic/French
storefronts, landing pages, COD order management with confirmation workflows,
80+ couriers pre-wired, stock and analytics. You keep dzship for the custom
pieces.

---

© DZBuild. The guides in this repository are free to read, quote and use.
The dzship service implementation is proprietary. See [LICENSE](LICENSE).
