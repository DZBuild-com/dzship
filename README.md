# dzship — Algerian shipping, explained for developers

[![npm](https://img.shields.io/npm/v/dzship)](https://www.npmjs.com/package/dzship) [![npm downloads](https://img.shields.io/npm/dm/dzship?color=0a7d33)](https://www.npmjs.com/package/dzship) [![requests served](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Ffreeship.dzbuild.com%2Fstats&query=%24.totalRequests&label=requests%20served&color=0a7d33)](https://freeship.dzbuild.com) [![couriers](https://img.shields.io/badge/couriers-99-0a7d33)](https://freeship.dzbuild.com/v1/couriers) [![license](https://img.shields.io/badge/license-MIT-666)](LICENSE)

**[API reference](docs/endpoints.md)** · **[Try it now](#try-it-now-no-account-needed)** · **[Couriers](#your-courier-is-probably-already-in-here)** · **[Wilaya dataset](#free-dataset-58-wilayas-69-wilayas-1541-communes)** · **[freeship.dzbuild.com](https://freeship.dzbuild.com)**

Create and track cash-on-delivery parcels with **99 Algerian couriers** through
one API — Yalidine, ZR Express, Maystro, NOEST, and every courier running on
Ecotrack. Plus the field notes on how each one actually behaves, and the
complete wilaya + commune dataset.

The code examples run against **dzship**, the free hosted API at
**[freeship.dzbuild.com](https://freeship.dzbuild.com)**. No signup, no API key.
You bring your own courier account credentials per call and they are never
stored.

Maintained by [DZBuild](https://dzbuild.com), the e-commerce platform that moves
real COD orders across all wilayas every day. These guides are the field notes
from that shipping engine.

## Try it now, no account needed

Every other courier needs a merchant contract before you can send one request.
This one doesn't exist, so you can start in ten seconds — it validates exactly
what a real courier validates, and creates nothing:

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "sandbox",
    "order": {
      "recipient": { "fullName": "Amine Bouzid", "phone": "0551234567",
                     "wilayaCode": 16, "communeName": "Bab Ezzouar" },
      "deliveryType": "home", "productList": "Sneakers x1", "codAmount": 4500
    }
  }'
```

```json
{ "trackingNumber": "DZTEST-1A2B3C", "status": "created", "reference": "FS-…" }
```

When your Yalidine (or DHD, or Maystro…) credentials arrive, change two fields.

## Create a real parcel in 60 seconds

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

```json
{ "trackingNumber": "yal-ABC123", "status": "created", "reference": "FS-…" }
```

Swap `"courier"` and `"credentials"` to ship with any other courier. The request
shape stays the same. Full reference: [docs/endpoints.md](docs/endpoints.md).

## Start here

| Guide | What it answers |
|---|---|
| [API reference](docs/endpoints.md) | Every endpoint and field, errors, rate limits |
| [Integrating dzship](docs/integrating.md) | Ready-made clients (Node, PHP, Python) and copy-paste snippets for every stack |
| [Choosing a courier](docs/choosing-a-courier.md) | Which delivery company fits your project: coverage, stop-desk, exchanges, API quality |
| [Wilayas & communes](docs/wilayas-and-communes.md) | The complete dataset, and why Algeria's new 69-wilaya division must not reach a courier yet |
| [Yalidine](docs/couriers/yalidine.md) | The biggest network. Also Yalitec, Guepex, Easy & Speed, Economiqua, We Can |
| [ZR Express](docs/couriers/zr-express.md) | Procolis. Strong in the center, simple credential model |
| [Maystro](docs/couriers/maystro.md) | Fulfillment-style courier with a strict duplicate policy |
| [NOEST](docs/couriers/noest.md) | Why parcels get stranded if you skip the validation step |
| [Ecotrack couriers](docs/couriers/ecotrack.md) | DHD, Conexlog, MSM Go, Rocket, World Express and 78 more — one key each |
| [Delivery statuses](docs/statuses.md) | One status vocabulary for all couriers, with French and Arabic UI labels |
| [Cash on delivery](docs/cash-on-delivery.md) | COD mechanics: fees, returns, the deep-south surcharge, confirmation calls |

## Your courier is probably already in here

```bash
curl 'https://freeship.dzbuild.com/v1/couriers?q=rocket'
```

| Family | `courier` keys | Credentials |
|---|---|---|
| Yalidine | `yalidine` `yalitec` `guepex` `easyandspeed` `economiqua` `wecan` | `apiId`, `apiToken` |
| ZR Express (Procolis) | `zrexpress` — also answers to `abexexpress`, `leopardexpress`, `colilog`, `flashdelivery` | `token`, `key` |
| ZR Express (new platform) | `zrexpressnew` | `apiKey`, `tenantId` |
| Maystro | `maystro` | `apiKey` |
| NOEST | `noest` | `apiToken`, `guid` |
| Ecotrack (82 couriers) | `dhd` `conexlog` `msmgo` `rocketdelivery` `worldexpress` `andersondelivery` … | `token` |
| Zimou Express | `zimou` | `token` |
| Colivraison | `colivraison` | `publicKey`, `token` |
| Ecom Delivery | `ecomdelivery` | `apiKey`, `apiToken` |
| Elogistia | `elogistia` | `apiKey` |
| Near Delivery | `neardelivery` | `apiKey`, `apiSecret` |
| MDM Express | `mdm` | `apiKey` |
| Test courier | `sandbox` | none |

You name the courier; dzship keeps the address. Nothing to look up, nothing to
configure — and no way for a request to point the server at somewhere a courier
does not own.

## Or skip the raw HTTP — ready-made clients

The [`clients/`](clients/) directory has MIT-licensed clients that wrap the same
calls, with typed errors and retry-after handling built in:

- **Node.js** — [`npm install dzship`](https://www.npmjs.com/package/dzship)
  (zero dependencies, TypeScript types included):

  ```js
  import dzship from 'dzship';

  const client = dzship({ courier: 'yalidine', credentials: { apiId: '…', apiToken: '…' } });
  const { trackingNumber } = await client.createOrder({ /* recipient, productList, codAmount… */ });
  const communes = await client.communes(16);
  ```

- **PHP** — copy the single file [`clients/php/Dzship.php`](clients/php/Dzship.php)
  (ext-curl only, shared-hosting friendly).
- **Python** — copy the single file [`clients/python/dzship.py`](clients/python/dzship.py)
  (standard library only, 3.8+).

The [integration guide](docs/integrating.md) has full examples for Laravel,
WooCommerce, Django, Google Sheets and raw HTTP in any language.

## Free dataset: 58 wilayas, 69 wilayas, 1,541 communes

Most Algerian projects rebuild this list by hand, badly. It is in
[`data/`](data/) as JSON and CSV — French + Arabic names, numeric codes:

| File | Contents |
|---|---|
| [`wilayas.json`](data/wilayas.json) | The 58 wilayas couriers deliver to |
| [`communes.json`](data/communes.json) · [`.csv`](data/communes.csv) | All 1,541 communes |
| [`wilayas-2026.json`](data/wilayas-2026.json) | All 69 wilayas of the 2026 division, each with `courierSupported` and `shipAs` |
| [`new-wilayas-2026.json`](data/new-wilayas-2026.json) | The 11 new wilayas with the 108 communes transferred into them |
| [`communes-moved-2026.csv`](data/communes-moved-2026.csv) | Old code → new code, as a flat join |

```js
const wilayas = await fetch(
  "https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/wilayas.json"
).then((r) => r.json());
```

Free to use in any project, no attribution needed.

**Algeria became 69 wilayas in April 2026** — and no courier accepts a code
above 58 yet, because the parent wilayas keep running the new territories until
the handover completes. Send `wilayaCode: 60` today and the parcel is rejected.
So the two lists are kept apart on purpose, and every new wilaya tells you what
to ship it as:

```bash
curl https://freeship.dzbuild.com/v1/wilayas?68
# { "code": 68, "nameFr": "Bou Saâda", "courierSupported": false, "shipAs": 28, … }
```

The [wilayas & communes guide](docs/wilayas-and-communes.md) has the gazette
references, the full table, and the spelling traps (`Aïn Ouessara` in the law,
`Ain Oussera` in every courier's database).

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

## Fair use

The hosted API is free and stays free: 200 orders/hour per IP, 60 tracking calls
per minute, and reference data you should cache rather than poll. The full table
is in [docs/endpoints.md](docs/endpoints.md#rate-limits). Call it from a server —
courier credentials in browser JavaScript are public credentials.

## Building a whole store?

If the shipping integration is part of a bigger build for a merchant, look at
[DZBuild](https://dzbuild.com) before writing more code: Arabic/French
storefronts, landing pages, COD order management with confirmation workflows,
100+ couriers pre-wired, stock and analytics. You keep dzship for the custom
pieces.

## Contributing

Courier missing, commune misspelled, status mapped wrong? That is the most
useful issue you can open — see [CONTRIBUTING.md](CONTRIBUTING.md). Security
reports go to [SECURITY.md](SECURITY.md).

---

© DZBuild. The guides, clients and datasets here are [MIT licensed](LICENSE) —
the datasets are public domain on top of that. The hosted service itself is
proprietary and is not in this repository; see [NOTICE.md](NOTICE.md).
