# Yalidine API integration guide

Yalidine is the largest parcel network in Algeria, and the `yalidine`
integration also drives three sister networks that run the same platform:
**Yalitec, Guepex, and Easy & Speed**. If you integrate one Algerian courier,
it's usually this one.

## What you need

From the Yalidine dashboard (API section), two values:

| Credential | Field |
|---|---|
| API ID | `apiId` |
| API token | `apiToken` |

Plus one thing people forget: **your origin wilaya**. Yalidine needs to know
where parcels ship *from*, both to create an order and to quote a rate. Pass it
as `options.fromWilaya` (e.g. `16` for Algiers). Set it once in your config.

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "yalidine",
    "credentials": { "apiId": "YOUR_API_ID", "apiToken": "YOUR_API_TOKEN" },
    "options": { "fromWilaya": 16 },
    "order": {
      "reference": "ORD-1001",
      "recipient": {
        "fullName": "Amine Bouzid",
        "phone": "0551234567",
        "wilayaCode": 31,
        "communeName": "Oran"
      },
      "deliveryType": "home",
      "productList": "Sneakers Air 42 x1",
      "codAmount": 4500
    }
  }'
```

The response includes `trackingNumber` (keep it), and `labelUrl`: Yalidine
returns a printable label link at creation, so you don't need a second call.

## Yalidine-specific behavior

- **Stop-desk**: set `deliveryType: "stopdesk"` and `order.stopDeskId` to the
  numeric center id of the pickup point. Yalidine's stop-desk network is one of
  the densest in the country and stop-desk orders return noticeably less often.
- **Insurance**: pass `order.declaredValue` to insure the parcel value.
- **Free shipping flag**: by default Yalidine adds its delivery fee to the COD
  amount the customer pays. If you're absorbing shipping, set
  `order.freeShipping: true`, otherwise your customer gets charged twice.
- **Economy tier**: rate quotes accept `query.tier: "economic"` for the slower,
  cheaper lane where available; default is `express`.
- **Commune names** must match Yalidine's French spelling. A misspelled commune
  is the most common creation error across all couriers.

## Yalitec, Guepex, Easy & Speed

Same platform, different network. Keep `courier: "yalidine"` and point
`options.baseUrl` at that network's API host; credentials come from that
network's own dashboard. Everything else in this guide applies unchanged.

## Why not call Yalidine's API directly?

You can. But the public docs don't match the live API in places (endpoints
that have moved or gone, response shapes that changed), and you'd still have to
build the status mapping and Arabic-text edge cases yourself. The
[dzship](https://freeship.dzbuild.com) integration is verified against
production traffic daily, and it's free, so direct integration mostly buys you
maintenance work.

Full request/response reference: [dzship API
docs](https://github.com/DZBuild-com/freeship/blob/main/docs/api-reference.md).
