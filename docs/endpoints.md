# API reference — every endpoint, every field

Base URL `https://freeship.dzbuild.com`. Bodies and responses are JSON. There is
no signup and no API key: you send your own courier credentials with each call
and they are used for that one call, never stored.

Call it from a server. Courier credentials in browser JavaScript are public
credentials.

Machine-readable spec: [`/openapi.json`](https://freeship.dzbuild.com/openapi.json)
(OpenAPI 3.1), mirrored in this repo at [`docs/openapi.json`](openapi.json).

**No credentials yet?** `"courier": "sandbox"` needs none. It validates exactly
what a real courier validates — phone, wilaya, commune, field limits — and
creates nothing. Swap in a real courier key when your account is ready.

| Endpoint | What it does |
|---|---|
| `POST /v1/orders` | Create a parcel on your courier account |
| `POST /v1/track` | Status + full event history for a tracking number |
| `POST /v1/rates` | Delivery and return fees for a route |
| `GET /v1/couriers` | Every supported courier, its credentials and capabilities |
| `GET /v1/wilayas` | The 58 wilayas couriers deliver to (`?all=1` for all 69) |
| `GET /v1/communes` | All 1,541 communes, filterable by wilaya |
| `GET /health` | Liveness |
| `GET /stats` | Total requests served, as one number |

## POST /v1/orders

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "yalidine",
    "credentials": { "apiId": "YOUR_ID", "apiToken": "YOUR_TOKEN" },
    "options": { "fromWilaya": 16 },
    "order": {
      "reference": "ORD-1042",
      "recipient": {
        "fullName": "Amine Bouzid",
        "phone": "0551234567",
        "wilayaCode": 16,
        "communeName": "Bab Ezzouar",
        "addressLine": "Cité 1200 logements, Bt 4"
      },
      "deliveryType": "home",
      "productList": "Sneakers Air x1",
      "codAmount": 4500
    }
  }'
```

```json
{ "trackingNumber": "yal-ABC123", "status": "created", "reference": "ORD-1042" }
```

| Field | Required | Notes |
|---|---|---|
| `courier` | yes | A key from `GET /v1/couriers` |
| `credentials` | yes | 1–8 string fields, exactly what that courier needs |
| `options.fromWilaya` | Yalidine family | Origin wilaya code |
| `options.baseUrl` | generic `ecotrack` only | Your tenant, must be a `*.ecotrack.dz` host |
| `options.timeoutMs` | no | 1000–30000 |
| `order.reference` | no | Your order id. Generated if omitted — send yours, it is your idempotency handle |
| `order.recipient.fullName` | yes | 2–120 chars |
| `order.recipient.phone` | yes | Algerian mobile: `05`, `06`, `07` |
| `order.recipient.phoneAlt` | no | Second number the courier may call |
| `order.recipient.wilayaCode` | yes | 1–58 |
| `order.recipient.communeName` | yes | French spelling from `GET /v1/communes` |
| `order.recipient.addressLine` | home delivery | Up to 255 chars |
| `order.deliveryType` | yes | `home` or `stopdesk` |
| `order.stopDeskId` | stopdesk | The courier's desk id |
| `order.productList` | yes | What is in the parcel. Truncated per courier's real limit |
| `order.codAmount` | yes | Integer DZD. `0` for a prepaid parcel |
| `order.weightKg` | no | |
| `order.declaredValue` | no | Integer DZD |
| `order.freeShipping` | no | You absorb the delivery fee |
| `order.isExchange` | no | Exchange parcel, where the courier supports it |
| `order.hasOpenPackage` | no | Customer may open before paying |
| `order.notes` | no | Up to 255 chars |

Creation is never retried automatically — a retried create is a duplicate
parcel. Send your own `reference` and check before resending.

## POST /v1/track

```bash
curl -X POST https://freeship.dzbuild.com/v1/track \
  -H 'Content-Type: application/json' \
  -d '{ "courier": "yalidine",
        "credentials": { "apiId": "…", "apiToken": "…" },
        "trackingNumber": "yal-ABC123" }'
```

Returns the canonical status plus every event the courier reports, oldest
first. Status vocabulary: [statuses.md](statuses.md).

## POST /v1/rates

```bash
curl -X POST https://freeship.dzbuild.com/v1/rates \
  -H 'Content-Type: application/json' \
  -d '{ "courier": "yalidine",
        "credentials": { "apiId": "…", "apiToken": "…" },
        "query": { "fromWilaya": 16, "toWilaya": 31,
                   "toCommune": "Oran", "deliveryType": "home" } }'
```

`query.tier` accepts `express` (default) or `economic` where the courier runs a
slower cheap lane.

## GET /v1/couriers

```bash
curl https://freeship.dzbuild.com/v1/couriers
curl 'https://freeship.dzbuild.com/v1/couriers?platform=ecotrack'
curl 'https://freeship.dzbuild.com/v1/couriers?q=rocket'
```

Each entry carries `key`, `name`, `platform`, `requiredCredentials`,
`capabilities`, and either `endpoint` (dzship knows the address) or
`requiresBaseUrl` with the host suffixes you may name.

## GET /v1/wilayas

```bash
curl https://freeship.dzbuild.com/v1/wilayas          # the 58 you can ship to
curl https://freeship.dzbuild.com/v1/wilayas?16       # one wilaya
curl 'https://freeship.dzbuild.com/v1/wilayas?code=16'
curl 'https://freeship.dzbuild.com/v1/wilayas?q=oran' # search, FR or AR
curl 'https://freeship.dzbuild.com/v1/wilayas?all=1'  # all 69, 2026 division
```

```json
{ "code": 16, "nameAr": "الجزائر", "nameFr": "Alger", "isDeepSouth": false,
  "communeCount": 57, "courierSupported": true }
```

A wilaya created in 2026 answers `courierSupported: false` and adds `shipAs` —
the code couriers still expect for that territory. Why:
[wilayas-and-communes.md](wilayas-and-communes.md).

## GET /v1/communes

```bash
curl https://freeship.dzbuild.com/v1/communes            # all 1,541
curl https://freeship.dzbuild.com/v1/communes?16         # one wilaya
curl 'https://freeship.dzbuild.com/v1/communes?wilaya=16'
curl 'https://freeship.dzbuild.com/v1/communes?q=bab'    # search
curl 'https://freeship.dzbuild.com/v1/communes?q=el+marsa&wilaya=16'
```

```json
{ "wilayaCode": 16, "nameFr": "Bab Ezzouar", "nameAr": "باب الزوار" }
```

Search returns at most 100 rows. Ask for a new wilaya (59–69) and every commune
carries the `shipAs` code for the parcel.

## Errors

One envelope everywhere:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "order.recipient.phone": "…" } } }
```

| HTTP | `code` | What to do |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Fix the fields in `error.fields` |
| 400 | `CONFIGURATION_ERROR` | Unknown courier, or a credential is missing |
| 400 | `EGRESS_BLOCKED` | `options.baseUrl` is not one of that courier's own addresses |
| 404 | `NOT_FOUND` | No such route, wilaya or commune |
| 422 | `invalid_phone` | Not a valid Algerian mobile |
| 422 | `NOT_SUPPORTED` | That courier does not implement this operation |
| 429 | `rate_limited` | Wait `Retry-After` seconds |
| 502 | `COURIER_ERROR` | The courier rejected it — the message is theirs |
| 502 | `HTTP_ERROR` | The courier endpoint failed or timed out |
| 503 | `overloaded` | Momentary capacity guard — retry shortly |

Error messages never contain the address dzship connected to. That is
deliberate: an API that echoes its outbound URLs is a network scanner for
anyone who asks.

## Rate limits

| Limit | Value |
|---|---|
| Orders / hour / IP | 200 |
| Orders / day / IP | 1,000 |
| Orders / day / recipient phone | 10 |
| Tracking calls / minute / IP | 60 |
| Tracking calls / day / IP | 5,000 |
| Rate quotes / minute / IP | 60 |

`GET /v1/wilayas`, `/v1/communes` and `/v1/couriers` are reference data: they
ship a `Cache-Control` header, so cache them and stop asking.

Need more than the limits allow? Open an issue and say what you are building.
