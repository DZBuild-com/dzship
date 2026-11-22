# Osen Express API integration guide

Osen Express gives every merchant an API token from the dashboard and prices
each route per account. Two things in its API catch integrations: a parcel does
nothing until it is validated, and it is addressed by Osen's own commune id.
Both are handled inside dzship.

## What you need

One credential from the Osen Express dashboard:

| Credential | Field |
|---|---|
| API token (starts with `osn_`) | `token` |

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "osenexpress",
    "credentials": { "token": "osn_YOUR_TOKEN" },
    "order": {
      "reference": "ORD-1005",
      "recipient": {
        "fullName": "Sara Benali",
        "phone": "0661234567",
        "wilayaCode": 31,
        "communeName": "Oran",
        "addressLine": "Cité des Jardins, Bt 4"
      },
      "deliveryType": "home",
      "productList": "Robe d'été x1",
      "codAmount": 3900
    }
  }'
```

```json
{ "trackingNumber": "OSEN-PAB12CD", "courierReference": "…", "status": "created", "reference": "ORD-1005" }
```

## Osen-specific behavior

- **Amounts are multiples of 10 DZD.** `codAmount: 3905` is refused before
  anything is sent, with the two nearest amounts in the message. Round in your
  checkout, where the customer can see it.
- **Create and validate are one step here.** On Osen's side an order waits
  until it is validated, and the courier only collects validated orders. dzship
  validates right after creating. If validation fails twice, the order is
  deleted so a resend cannot leave two parcels behind.
- **Communes are matched in French or Arabic.** Send `communeName` as you have
  it. A name that matches none of Osen's communes in that wilaya is a
  `VALIDATION_ERROR`, never a guess.
- **Stop desks belong to communes.** Osen routes a desk parcel to the desk that
  serves the commune on the order. `POST /v1/desks` lists the desks of a
  wilaya; send the chosen `id` as `stopDeskId` with `deliveryType: "stopdesk"`.
  A commune no desk serves only takes home delivery, and the refusal says so.
- **Rates come from your own price list.** `POST /v1/rates` reads the prices
  Osen set for your account, from your store's wilaya. Pass `query.fromWilaya`
  to quote from another origin.
- **A failed attempt is not a return.** `delivery_attempted` means the driver
  will try again. `return_in_transit` follows only when Osen gives up.
- **No cancel through the API.** Cancel from the Osen Express dashboard.

Statuses map to the [canonical vocabulary](../statuses.md). Full request and
response reference: [endpoints guide](../endpoints.md).
