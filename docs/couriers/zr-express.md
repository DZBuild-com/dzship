# ZR Express (Procolis) API integration guide

ZR Express, run by Procolis, is a popular choice for stores shipping from the
Algiers region. Merchants like it for the human side (reachable support,
flexible pickup); the API side is minimal but does the job: create, track,
and quote.

## What you need

From the ZR Express / Procolis dashboard:

| Credential | Field |
|---|---|
| Token | `token` |
| Key | `key` |

No other options. There's no origin-wilaya parameter and no tenant URL.

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "zrexpress",
    "credentials": { "token": "YOUR_TOKEN", "key": "YOUR_KEY" },
    "order": {
      "reference": "ORD-1002",
      "recipient": {
        "fullName": "Sara Mansouri",
        "phone": "0661234567",
        "wilayaCode": 9,
        "communeName": "Blida"
      },
      "deliveryType": "home",
      "productList": "Robe été M x1",
      "codAmount": 3200
    }
  }'
```

## ZR-specific behavior

- **Exchanges**: supported; set `order.isExchange: true` when the driver should
  swap the parcel against the customer's return.
- **Stop-desk**: supported via `deliveryType: "stopdesk"`.
- **No label endpoint**: print labels from the ZR dashboard. `labelUrl` will
  not be returned.
- **No cancel endpoint**: cancel from the dashboard or by contacting ZR.
- **Confirmation matters**: ZR's workflow assumes orders are confirmed before
  pickup. Push orders after your confirmation call, not at checkout time, or
  you'll accumulate cancelled parcels on your account stats.

## The API you're being saved from

ZR's raw API is idiosyncratic: reads happen through POST requests, and at
least one core field name is misspelled *in the API itself* and must be sent
misspelled forever. This is exactly the category of trivia dzship exists to
absorb. Send the normalized request above and it comes out right on the wire.

Full request/response reference: [dzship API
docs](https://github.com/DZBuild-com/freeship/blob/main/docs/api-reference.md).
