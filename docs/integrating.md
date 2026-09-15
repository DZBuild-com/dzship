# Integrating dzship — every stack, copy-paste ready

dzship is a plain HTTPS + JSON API at `https://freeship.dzbuild.com`. No signup,
no API key, no SDK lock-in: anything that can send an HTTP request can ship
parcels. This page gives you the fastest path for each stack — either a
ready-made client from this repo, or a copy-paste snippet.

Full request/response reference: [docs/api — freeship.dzbuild.com](https://freeship.dzbuild.com)

## Pick your lane

| Stack | Fastest path |
|---|---|
| Node.js 18+ | `npm install dzship` → [Node client](#nodejs) |
| PHP (plain, Laravel, WooCommerce) | copy [`clients/php/Dzship.php`](../clients/php/Dzship.php) → [PHP](#php) |
| Python (Django, Flask, FastAPI, scripts) | copy [`clients/python/dzship.py`](../clients/python/dzship.py) → [Python](#python) |
| Ruby (Rails, Sinatra, scripts) | copy [`clients/ruby/dzship.rb`](../clients/ruby/dzship.rb) → [Ruby](#ruby) |
| Google Sheets / Apps Script | [Apps Script snippet](#google-sheets--apps-script) |
| Anything else | [raw curl / HTTP](#raw-http-any-language) |

Every client in this repo is a thin wrapper around the same three calls —
`POST /v1/orders`, `POST /v1/track`, `POST /v1/rates` — plus the free lookups
`GET /v1/couriers` and `GET /v1/wilayas`. They are MIT-licensed: vendor them,
edit them, ship them in commercial projects.

## The one rule: keep credentials server-side

Your courier credentials travel inside each request and are **never stored** by
the gateway — but that also means **anyone holding them can create parcels on
your account**. Never call dzship from a browser, a mobile app binary, or any
client-side code. Call it from your backend, and keep credentials in
environment variables or your framework's secret store.

## Node.js

Node 18+:

```bash
npm install dzship
```

(Installing straight from GitHub also works: `npm install DZBuild-com/dzship`.)

```js
import dzship from 'dzship';           // or: const dzship = require('dzship')

const client = dzship({
  courier: 'yalidine',
  credentials: { apiId: process.env.YAL_ID, apiToken: process.env.YAL_TOKEN },
  options: { fromWilaya: 16 },         // optional
});

// 1. quote the fee (optional)
const quote = await client.rates({ toWilaya: 31, deliveryType: 'home' });

// 2. create the parcel
const { trackingNumber } = await client.createOrder({
  recipient: {
    fullName: 'Amine Bouzid',
    phone: '0551234567',
    wilayaCode: 16,
    communeName: 'Bab Ezzouar',
  },
  deliveryType: 'home',                // or 'stopdesk' (+ stopDeskId)
  productList: 'Sneakers Air x1',
  codAmount: 4500,
});

// 3. track it later
const { status, events } = await client.track(trackingNumber);
```

Errors throw a typed `DzshipError` with `.status`, `.code`, `.fields` and
`.retryAfter`:

```js
import dzship, { DzshipError } from 'dzship';

try {
  await client.createOrder(order);
} catch (e) {
  if (e instanceof DzshipError && e.code === 'invalid_phone') {
    // ask the customer to fix the number
  } else if (e.code === 'rate_limited') {
    // wait e.retryAfter seconds
  } else {
    throw e;
  }
}
```

Free lookups (no credentials, and cacheable — cache them):

```js
const couriers = await dzship.couriers();            // every courier + its credential fields
const mine     = await dzship.couriers({ q: 'rocket' });   // find yours by name
const wilayas  = await dzship.wilayas();             // the 58 you can ship to
const alger    = await dzship.wilayas(16);           // one wilaya
const communes = await dzship.communes(16);          // its communes, courier spelling
const all69    = await dzship.wilayas({ all: true }); // 2026 division, each with shipAs
```

TypeScript types ship with the package (`Order`, `RatesQuery`, `DzshipError`…).

## PHP

Copy [`clients/php/Dzship.php`](../clients/php/Dzship.php) into your project
(one file, needs only ext-curl — works on shared hosting):

```php
require __DIR__ . '/Dzship.php';

$client = new Dzship('yalidine', [
    'apiId'    => getenv('YAL_ID'),
    'apiToken' => getenv('YAL_TOKEN'),
], ['fromWilaya' => 16]);

try {
    $res = $client->createOrder([
        'recipient' => [
            'fullName'    => 'Amine Bouzid',
            'phone'       => '0551234567',
            'wilayaCode'  => 16,
            'communeName' => 'Bab Ezzouar',
        ],
        'deliveryType' => 'home',
        'productList'  => 'Sneakers Air x1',
        'codAmount'    => 4500,
    ]);
    $trackingNumber = $res['trackingNumber'];
} catch (DzshipException $e) {
    if ($e->errorCode === 'invalid_phone') {
        // ask the customer to fix the number
    } elseif ($e->errorCode === 'rate_limited') {
        // wait $e->retryAfter seconds
    } else {
        error_log('dzship: ' . $e->getMessage());
    }
}

// later
$tracking = $client->track($trackingNumber);   // ['status' => …, 'events' => […]]
```

**Laravel**: drop the file in `app/Support/`, add it to `composer.json`
`autoload.files`, and read credentials from `config/services.php`.

**WooCommerce**: call `createOrder` from a `woocommerce_order_status_processing`
hook — the recipient maps from the order's shipping fields, and
`update_post_meta` the returned tracking number onto the order.

## Python

Copy [`clients/python/dzship.py`](../clients/python/dzship.py) into your project
(one file, standard library only, Python 3.8+):

```python
import os
from dzship import Dzship, DzshipError

client = Dzship("yalidine", {
    "apiId": os.environ["YAL_ID"],
    "apiToken": os.environ["YAL_TOKEN"],
}, options={"fromWilaya": 16})

try:
    res = client.create_order({
        "recipient": {
            "fullName": "Amine Bouzid",
            "phone": "0551234567",
            "wilayaCode": 16,
            "communeName": "Bab Ezzouar",
        },
        "deliveryType": "home",
        "productList": "Sneakers Air x1",
        "codAmount": 4500,
    })
    tracking_number = res["trackingNumber"]
except DzshipError as e:
    if e.code == "invalid_phone":
        ...  # ask the customer to fix the number
    elif e.code == "rate_limited":
        ...  # wait e.retry_after seconds
    else:
        raise

# later
tracking = client.track(tracking_number)   # {"status": …, "events": […]}
```

Works as-is inside Django views, Flask routes, FastAPI endpoints (wrap in
`run_in_threadpool` for async), Celery tasks, or Odoo server actions.

## Ruby

Copy [`clients/ruby/dzship.rb`](../clients/ruby/dzship.rb) into your project
(one file, standard library only, Ruby 3.0+):

```ruby
require_relative "dzship"

client = DzShip.new(
  courier: "yalidine",
  credentials: { apiId: ENV["YAL_ID"], apiToken: ENV["YAL_TOKEN"] },
  options: { fromWilaya: 16 }
)

begin
  res = client.create_order(
    recipient: { fullName: "Amine Bouzid", phone: "0551234567",
                 wilayaCode: 16, communeName: "Bab Ezzouar" },
    deliveryType: "home", productList: "Sneakers Air x1", codAmount: 4500
  )
  tracking_number = res["trackingNumber"]
rescue DzShip::Error => e
  if e.code == "invalid_phone"
    # ask the customer to fix the number
  elsif e.retryable?
    # wait e.retry_after seconds
  else
    raise
  end
end

# later
tracking = client.track(tracking_number)   # {"status" => …, "events" => […]}
```

Quotes, lookups and the 2026 wilaya handoff:

```ruby
client.rates(toWilaya: 31, deliveryType: "home")
DzShip.couriers                                    # every courier + its credential fields
DzShip.wilayas                                     # the 58 you can ship to
DzShip.communes(wilaya: 16)                        # its communes, courier spelling
DzShip.wilaya_ship_code(68, wilayas_all: cached69) # 59-69 must ship under their shipAs code
```

**Rails**: put the client in the `lib/` folder. Use Rails credentials to store
credentials. No extra gem needed.

## Google Sheets / Apps Script

The classic "200 COD orders in a spreadsheet" case — one function, no library:

```js
function shipRow(row) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const [name, phone, wilayaCode, commune, product, cod] =
    sheet.getRange(row, 1, 1, 6).getValues()[0];

  const res = UrlFetchApp.fetch('https://freeship.dzbuild.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      courier: 'yalidine',
      credentials: {
        apiId: PropertiesService.getScriptProperties().getProperty('YAL_ID'),
        apiToken: PropertiesService.getScriptProperties().getProperty('YAL_TOKEN'),
      },
      order: {
        recipient: { fullName: name, phone: String(phone), wilayaCode, communeName: commune },
        deliveryType: 'home',
        productList: product,
        codAmount: cod,
      },
    }),
  });

  const data = JSON.parse(res.getContentText());
  sheet.getRange(row, 7).setValue(data.trackingNumber || data.error.message);
}
```

Store credentials in **Script properties** (File → Project properties), never
in a cell. Mind the fair-use limits below if you loop over many rows — pace
order creation, don't blast 200 rows in one minute.

## Raw HTTP (any language)

Everything is one POST away — Go, Java, C#, Rust, Dart, Deno, Bun, a
Cloudflare Worker, all the same shape:

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' -d '{
    "courier":     "yalidine",
    "credentials": { "apiId": "…", "apiToken": "…" },
    "order": {
      "recipient": {
        "fullName": "Amine Bouzid", "phone": "0551234567",
        "wilayaCode": 16, "communeName": "Bab Ezzouar"
      },
      "deliveryType": "home",
      "productList":  "Sneakers Air x1",
      "codAmount":    4500
    }
  }'
# → 201 {"trackingNumber":"yal-ABC123","status":"created"}
```

Swapping courier = swapping the `courier` key and the `credentials` shape —
`GET /v1/couriers` tells you exactly which credential fields each one needs,
and the [courier field guides](../README.md#start-here) explain how each
network behaves.

## Errors and fair use

| HTTP | `error.code` | What to do |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Fix the fields listed in `error.fields` |
| 422 | `invalid_phone` | Not a valid Algerian mobile — correct the number |
| 422 / 502 | `NOT_SUPPORTED` / `COURIER_ERROR` | The courier rejected it — read `message` (bad credentials, unknown commune, missing stop desk…) |
| 429 | `rate_limited` | Wait `retry-after` seconds (exposed by all clients) |
| 503 | `overloaded` | Retry after a few seconds |

Fair-use limits (per IP): 200 orders/hour, 1,000 orders/day, 60 tracking
calls/minute, 60 rate quotes/minute. Design around them: track on page-view
rather than tight loops, cache `/v1/wilayas`, `/v1/communes` and `/v1/couriers`
(they send a `Cache-Control` header), and queue bulk imports instead of firing
them all at once. Current values: [freeship.dzbuild.com/#limits](https://freeship.dzbuild.com/#limits).

## Which courier? Which commune spelling?

That's what the rest of this repo is for:

- [Choosing a courier](choosing-a-courier.md) — coverage, stop-desks, exchanges, API quality
- [Wilayas & communes](wilayas-and-communes.md) + the [CC0 dataset](../data/) — the exact spellings couriers accept
- [Delivery statuses](statuses.md) — one vocabulary across all couriers, with FR/AR labels
- [Cash on delivery](cash-on-delivery.md) — fees, returns, the deep-south surcharge

Building a whole store instead? [DZBuild](https://dzbuild.com) has all of this
pre-wired — 80+ couriers, COD confirmation workflows, Arabic/French storefronts.
