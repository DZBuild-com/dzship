# Terminal Delivery API integration guide

Terminal Delivery works like a fulfillment service: products live in a
catalogue on your account, and an order names a product from it. dzship hides
that step, but two ids come back from a create and you need both.

## What you need

One credential from the Terminal Delivery dashboard:

| Credential | Field |
|---|---|
| API token | `token` |

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "terminaldelivery",
    "credentials": { "token": "YOUR_TOKEN" },
    "order": {
      "reference": "ORD-1006",
      "recipient": {
        "fullName": "Yacine Meziane",
        "phone": "0551234567",
        "wilayaCode": 16,
        "communeName": "Bab Ezzouar",
        "addressLine": "Cité 5 Juillet, Bt 12"
      },
      "deliveryType": "home",
      "productList": "Casque audio x1",
      "codAmount": 5400
    }
  }'
```

```json
{ "trackingNumber": "822b9dd1-f01b-4ea8-a0df-1935b3ca9a7d", "courierReference": "TD-1793056067134470", "status": "created", "reference": "ORD-1006" }
```

## Terminal-specific behavior

- **Two ids, two jobs.** `trackingNumber` is the order id, and it is the only
  key `POST /v1/track` accepts for this courier. `courierReference` is the
  `TD-` number printed on the slip, the one your customer sees. Store both.
- **The label takes the `TD-` number.** `POST /v1/label` with the
  `courierReference` as `trackingNumber` returns the slip as a PDF. Sent the
  order id instead, it tells you which number it wants.
- **`codAmount` includes delivery.** Terminal refuses a total below its own
  delivery price for that commune. Quote with `POST /v1/rates` first if you
  build the total yourself.
- **The same customer twice in 24 hours is refused.** An active order with the
  same name and phone blocks a second one. You get a `COURIER_ERROR` saying so.
  Do not retry it.
- **Repeat products just work.** Terminal keeps one catalogue entry per product
  description and refuses a second entry with the same text. dzship finds the
  existing entry and reuses it, so the second order of a product goes through.
- **Communes resolve by name.** A commune spelled the way Terminal spells it
  goes out as Terminal's own id. Another spelling goes out as a name, and
  Terminal matches it or refuses it with a clear message.
- **Stop desks.** `deliveryType: "stopdesk"` sends the parcel to the desk of
  the commune on the order. `POST /v1/desks` lists the desks at the wilaya's
  main commune, each with the commune name to ship to.
- **No cancel through the API.** Cancel from the Terminal Delivery dashboard.

Statuses map to the [canonical vocabulary](../statuses.md). Full request and
response reference: [endpoints guide](../endpoints.md).
