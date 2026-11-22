# dzship

**The shipping SDK for Algeria: one API for 101 delivery couriers.** Create a
parcel, track it, print its label, cancel it, quote the fee and list stop desks
with the same code for Yalidine, ZR Express, Maystro, NOEST, Osen Express and
96 more.

*SDK et API de livraison pour l'Algérie : un seul code pour Yalidine, ZR Express,
Maystro, NOEST, Osen Express, DHD et tous les transporteurs Ecotrack.*

[![npm](https://img.shields.io/npm/v/dzship)](https://www.npmjs.com/package/dzship) [![requests served](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Ffreeship.dzbuild.com%2Fstats&query=%24.totalRequests&label=requests%20served&color=0a7d33)](https://freeship.dzbuild.com) [![couriers](https://img.shields.io/badge/couriers-101-0a7d33)](data/couriers.json) [![license](https://img.shields.io/badge/license-MIT-666)](LICENSE)

**[Documentation](https://freeship.dzbuild.com/docs)** · **[API reference](docs/endpoints.md)** · **[MCP server](#use-it-from-an-ai-assistant)** · **[Couriers](#couriers)** · **[Wilaya dataset](#wilaya-and-commune-dataset)** · **[FAQ](#faq)**

## Install

```bash
npm install dzship                                           # Node 18+, types included, no dependencies
composer require dzbuild/dzship                              # PHP 7.2+, ext-curl only
pip install git+https://github.com/DZBuild-com/dzship.git    # Python 3.8+, standard library only
```

Ruby is one file to copy: [`clients/ruby/dzship.rb`](clients/ruby/dzship.rb).
So are the PHP and Python clients, if you would rather not use a package
manager. Any other language talks to the same [HTTP API](docs/endpoints.md).

## Send your first parcel

You do not need a courier account to start. The `sandbox` courier takes no
credentials, checks your order the way a real courier does, and creates
nothing.

```ts
import dzship from 'dzship';

const shipping = dzship('sandbox');

const { trackingNumber } = await shipping.createOrder({
  recipient: {
    fullName: 'Amine Bouzid',
    phone: '0551234567',
    wilayaCode: 16,
    communeName: 'Bab Ezzouar',
  },
  deliveryType: 'home',
  productList: 'Sneakers x1',
  codAmount: 4500,
});

const { status, events } = await shipping.track(trackingNumber);
```

When your courier account is ready, one line changes:

```ts
const shipping = dzship('yalidine', { apiId: '…', apiToken: '…' });
// dzship('zrexpressnew', { apiKey: '…', tenantId: '…' })
// dzship('osenexpress', { token: '…' })
// dzship('dhd', { token: '…' })
```

The order, the tracking result and the status names keep the same shape for
every courier, so moving a store from one courier to another is that one line.

<details>
<summary>PHP</summary>

```php
require __DIR__ . '/vendor/autoload.php';

$shipping = new Dzship('yalidine', ['apiId' => '…', 'apiToken' => '…']);

$parcel = $shipping->createOrder([
    'recipient' => [
        'fullName' => 'Amine Bouzid', 'phone' => '0551234567',
        'wilayaCode' => 16, 'communeName' => 'Bab Ezzouar',
    ],
    'deliveryType' => 'home', 'productList' => 'Sneakers x1', 'codAmount' => 4500,
]);

echo $shipping->track($parcel['trackingNumber'])['status'];
```

Works in plain PHP, Laravel and WooCommerce. Examples for each are in the
[integration guide](docs/integrating.md#php).
</details>

<details>
<summary>Python</summary>

```python
from dzship import Dzship

shipping = Dzship("yalidine", {"apiId": "…", "apiToken": "…"})

parcel = shipping.create_order({
    "recipient": {"fullName": "Amine Bouzid", "phone": "0551234567",
                  "wilayaCode": 16, "communeName": "Bab Ezzouar"},
    "deliveryType": "home", "productList": "Sneakers x1", "codAmount": 4500,
})

print(shipping.track(parcel["trackingNumber"])["status"])
```
</details>

<details>
<summary>curl</summary>

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
</details>

## What the clients do

| | Node | PHP | Python | HTTP |
|---|---|---|---|---|
| Create a parcel | `createOrder(order)` | `createOrder($order)` | `create_order(order)` | `POST /v1/orders` |
| Track it | `track(trackingNumber)` | `track($trackingNumber)` | `track(tracking_number)` | `POST /v1/track` |
| Quote the delivery fee | `rates(query)` | `rates($query)` | `rates(query)` | `POST /v1/rates` |
| List a courier's stop desks | `desks(wilayaCode)` | `desks($wilayaCode)` | `desks(wilaya_code)` | `POST /v1/desks` |
| Print the label | `label(trackingNumber)` | `label($trackingNumber)` | `label(tracking_number)` | `POST /v1/label` |
| Cancel a parcel | `cancel(trackingNumber)` | `cancel($trackingNumber)` | `cancel(tracking_number)` | `POST /v1/cancel` |
| List couriers | `dzship.couriers()` | `Dzship::couriers()` | `dzship.couriers()` | `GET /v1/couriers` |
| List wilayas | `dzship.wilayas()` | `Dzship::wilayas()` | `dzship.wilayas()` | `GET /v1/wilayas` |
| List communes | `dzship.communes(16)` | `Dzship::communes(16)` | `dzship.communes(16)` | `GET /v1/communes` |

No signup and no API key. You bring your own courier credentials on each call.

## TypeScript knows your courier

`courier` completes to every courier key in your editor, and the credentials are
checked against that courier:

```ts
dzship('noest', { apiToken: '…' });
//              ~~~~~~~~~~~~~~~~~~ Property 'guid' is missing

dzship('yalidine', { token: '…' });
//                   ~~~~~ 'token' does not exist in type '{ apiId: string; apiToken: string }'
```

A courier chosen at runtime, from a settings form for example, still works: pass
the string and any credential map.

## Use it from an AI assistant

dzship is also an MCP server. Claude Code, Cursor, VS Code and any other MCP
client can find a courier, create a parcel, track it, quote its fee and cancel
it, with no login:

```bash
claude mcp add --transport http dzship https://freeship.dzbuild.com/mcp
```

```json
{ "mcpServers": { "dzship": { "url": "https://freeship.dzbuild.com/mcp" } } }
```

The first line is for Claude Code, the second is `.cursor/mcp.json`. Ask for a
sandbox parcel to try it. For a real courier, keep your credentials in an
`X-Courier-Credentials` header of the connection so they never pass through the
conversation: the [MCP guide](https://freeship.dzbuild.com/docs/mcp) shows how.
The server is in the official MCP registry as `com.dzbuild/dzship`.

## Couriers

```bash
curl 'https://freeship.dzbuild.com/v1/couriers?q=rocket'
```

| Family | `courier` keys | Credentials |
|---|---|---|
| Yalidine | `yalidine` `yalitec` `guepex` `easyandspeed` `economiqua` `wecan` | `apiId`, `apiToken` |
| ZR Express (Procolis) | `zrexpress`, which also answers to `abexexpress`, `leopardexpress`, `colilog`, `flashdelivery` | `token`, `key` |
| ZR Express (new platform) | `zrexpressnew` | `apiKey`, `tenantId` |
| Maystro | `maystro` | `apiKey` |
| NOEST | `noest` | `apiToken`, `guid` |
| Osen Express | `osenexpress` | `token` |
| Terminal Delivery | `terminaldelivery` | `token` |
| Ecotrack (82 couriers) | `dhd` `conexlog` `msmgo` `rocketdelivery` `worldexpress` `andersondelivery` … | `token` |
| Zimou Express | `zimou` | `token` |
| Colivraison | `colivraison` | `publicKey`, `token` |
| Ecom Delivery | `ecomdelivery` | `apiKey`, `apiToken` |
| Elogistia | `elogistia` | `apiKey` |
| Near Delivery | `neardelivery` | `apiKey`, `apiSecret` |
| MDM Express | `mdm` | `apiKey` |
| Test courier | `sandbox` | none |

Every key, with its credential fields and what it supports, is in
[`data/couriers.json`](data/couriers.json). You name the courier and dzship does
the rest: there is no URL to find and nothing to configure.

Is yours missing? [Open an issue](https://github.com/DZBuild-com/dzship/issues/new/choose)
with its name.

### What each courier supports

Couriers do not all offer the same calls. A label or a cancel that a courier has
no call for answers `NOT_SUPPORTED`, and you do it from that courier's dashboard.

<!-- couriers:start -->
| Courier | Create | Track | Rates | Stop desks | Label | Cancel |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Yalidine, Yalitec, Guepex, Easy & Speed, Economiqua, We Can | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ZR Express (Procolis) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ZR Express (new platform) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Maystro | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NOEST | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DHD, Conexlog, MSM Go and every other Ecotrack courier | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Zimou Express | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Colivraison | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ecom Delivery | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Elogistia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Near Delivery | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| MDM Express | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Osen Express | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Terminal Delivery | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Sandbox (test courier) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
<!-- couriers:end -->

The table is written from the live courier list by `scripts/sync-couriers.mjs`.
`GET /v1/couriers` gives the same answer per courier at run time.

```ts
const label = await shipping.label(trackingNumber);
if (label.format === 'pdf') await writeFile('label.pdf', Buffer.from(label.data, 'base64'));
else console.log(label.url); // some couriers hand out a link instead of a file

await shipping.cancel(trackingNumber); // only before the courier collects the parcel
```

## What dzship handles for you

Each Algerian courier has its own auth, field names and status words, and most
of the failures are quiet ones. These are the ones dzship absorbs:

- NOEST and Osen Express ignore a parcel until a second call validates it.
  `createOrder` makes both calls.
- Maystro, MDM, Osen and Terminal address parcels by their own commune ids. You
  send a commune name.
- Statuses arrive in French, in Arabic or as bare numbers. You get one
  [status vocabulary](docs/statuses.md), with labels ready for a French or Arabic UI.
- A commune spelled differently from the courier's list strands a parcel. The
  [dataset](#wilaya-and-commune-dataset) uses the spellings couriers accept.
- Algeria has 69 wilayas in law since April 2026 and couriers still accept 58.
  Every new wilaya tells you which code to ship with.

The courier guides list what each one does that the others do not:
[Yalidine](docs/couriers/yalidine.md) ·
[ZR Express](docs/couriers/zr-express.md) ·
[Maystro](docs/couriers/maystro.md) ·
[NOEST](docs/couriers/noest.md) ·
[Osen Express](docs/couriers/osen-express.md) ·
[Terminal Delivery](docs/couriers/terminal-delivery.md) ·
[Ecotrack couriers](docs/couriers/ecotrack.md)

## When a courier refuses a parcel

The clients throw one error type with a machine code and the courier's own
reason:

```ts
import dzship, { DzshipError } from 'dzship';

try {
  await shipping.createOrder(order);
} catch (e) {
  if (e instanceof DzshipError && e.code === 'COURIER_ERROR') {
    console.log(e.message); // "[osenexpress] the token was refused (HTTP 401): check the API token (osn_...)"
  }
}
```

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | A field is wrong. `fields` says which |
| 422 | `invalid_phone` | Not an Algerian mobile number |
| 424 | `COURIER_ERROR` | The courier refused: rejected credentials, unknown commune, duplicate order |
| 429 | `rate_limited` | Wait `retryAfter` seconds |

A create is never retried for you, because a retried create is a second parcel.
The full table is in the [API reference](docs/endpoints.md#errors).

## Wilaya and commune dataset

Most Algerian projects rebuild this list by hand. It is in [`data/`](data/) as
JSON and CSV, with French and Arabic names and numeric codes, free to use with
no attribution:

| File | Contents |
|---|---|
| [`wilayas.json`](data/wilayas.json) | The 58 wilayas couriers deliver to |
| [`communes.json`](data/communes.json) · [`.csv`](data/communes.csv) | All 1,541 communes |
| [`couriers.json`](data/couriers.json) | Every courier key with its credential fields |
| [`wilayas-2026.json`](data/wilayas-2026.json) | All 69 wilayas of the 2026 division, each with `courierSupported` and `shipAs` |
| [`new-wilayas-2026.json`](data/new-wilayas-2026.json) | The 11 new wilayas with the 108 communes transferred into them |
| [`communes-moved-2026.csv`](data/communes-moved-2026.csv) | Old code to new code, as a flat join |

```js
const communes = await dzship.communes(16); // or fetch the raw file:
// https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.json
```

Send `wilayaCode: 60` to a courier today and the parcel is rejected, because the
parent wilayas still run the new territories. Ask for a new wilaya and you get
the code to use instead:

```bash
curl https://freeship.dzbuild.com/v1/wilayas?68
# { "code": 68, "nameFr": "Bou Saâda", "courierSupported": false, "shipAs": 28, … }
```

The [wilayas and communes guide](docs/wilayas-and-communes.md) has the gazette
references and the spelling traps.

## Guides

| Guide | What it answers |
|---|---|
| [Integrating dzship](docs/integrating.md) | Laravel, WooCommerce, Django, Rails, Google Sheets and raw HTTP, copy-paste ready |
| [API reference](docs/endpoints.md) | Every endpoint and field, errors, rate limits |
| [MCP server](https://freeship.dzbuild.com/docs/mcp) | Connecting an assistant, the eight tools, where credentials go |
| [Choosing a courier](docs/choosing-a-courier.md) | Coverage, stop desks, exchanges and API quality per courier |
| [Delivery statuses](docs/statuses.md) | One status vocabulary, with French and Arabic labels |
| [Cash on delivery](docs/cash-on-delivery.md) | Fees, returns, the deep-south surcharge, confirmation calls |
| [Wilayas and communes](docs/wilayas-and-communes.md) | The dataset, and why codes above 58 must not reach a courier yet |

The same guides, with search and a browsable API reference, are on
[freeship.dzbuild.com/docs](https://freeship.dzbuild.com/docs).

## Where your courier credentials go

They travel inside the request that needs them, go to that courier, and are not
stored. That also means anyone who holds them can create parcels on your
account, so call dzship from your server and never from browser JavaScript.

The hosted API is free: 200 orders an hour per IP, 60 tracking calls a minute,
and reference data you should cache. The limits are in the
[API reference](docs/endpoints.md#rate-limits).

## FAQ

**How do I use the Yalidine API in Node.js or PHP?**
`dzship('yalidine', { apiId, apiToken })` in Node, `new Dzship('yalidine', [...])`
in PHP. The [Yalidine guide](docs/couriers/yalidine.md) covers the origin wilaya
and stop desks. Guepex, Yalitec and the other Yalidine networks use the same
call with their own key.

**Comment intégrer l'API ZR Express dans mon site e-commerce ?**
Installez `dzship` (npm) ou `dzbuild/dzship` (Composer), puis créez un client
`zrexpress` avec votre `token` et votre `key`, ou `zrexpressnew` avec `apiKey`
et `tenantId` si votre compte est sur la nouvelle plateforme. Voir le
[guide ZR Express](docs/couriers/zr-express.md).

**Does it work with DHD and the other Ecotrack couriers?**
Yes. Each of the 82 has its own key (`dhd`, `conexlog`, `rocketdelivery`, …) and
takes the token from that courier's dashboard. The
[Ecotrack guide](docs/couriers/ecotrack.md) lists them.

**Est-ce que ça marche avec Laravel, WooCommerce ou Django ?**
Oui. Le client PHP fonctionne dans tout projet Composer, et le
[guide d'intégration](docs/integrating.md) donne un exemple pour chacun.

**Is dzship an SDK or an API?**
Both. The API is hosted and free, and the SDKs are thin typed clients for it:
`npm install dzship`, `composer require dzbuild/dzship`, or one file for Python
and Ruby. You write no courier integration yourself, and there is nothing to
host.

**Can I switch couriers without rewriting my code?**
Yes, for creating, tracking, quoting and listing desks. The courier key and the
credentials change, the rest of your code stays. Labels and cancels depend on
the courier: the [support table](#what-each-courier-supports) says which.

**Is there an MCP server for Algerian couriers?**
Yes: `https://freeship.dzbuild.com/mcp`, over Streamable HTTP and with no
login. Its tools are the API's own calls, so it covers the same 101 couriers.

**Is there a test mode?**
The `sandbox` courier. No account, no credentials, nothing created.

## Building a whole store?

If shipping is one part of a store you are building for a merchant, look at
[DZBuild](https://dzbuild.com) before writing more code: Arabic and French
storefronts, landing pages, COD order management with confirmation workflows,
100+ couriers already connected, stock and analytics. dzship stays useful for
the custom pieces.

## Contributing

A missing courier, a misspelled commune or a status mapped wrong is the most
useful issue you can open. See [CONTRIBUTING.md](CONTRIBUTING.md). Security
reports go to [SECURITY.md](SECURITY.md).

---

© DZBuild. The guides, clients and datasets here are [MIT licensed](LICENSE),
and the datasets are public domain on top of that. The hosted service is
proprietary and is not in this repository; see [NOTICE.md](NOTICE.md).
