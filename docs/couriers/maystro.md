# Maystro Delivery API integration guide

Maystro runs closer to a fulfillment operation than a classic courier: tighter
process, more automation, and a stricter rulebook. That rulebook is what trips
up integrations, so read the duplicate policy below before you ship.

## What you need

One credential from the Maystro dashboard:

| Credential | Field |
|---|---|
| API key | `apiKey` |

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "maystro",
    "credentials": { "apiKey": "YOUR_API_KEY" },
    "order": {
      "reference": "ORD-1003",
      "recipient": {
        "fullName": "Karim Haddad",
        "phone": "0771234567",
        "wilayaCode": 25,
        "communeName": "Constantine"
      },
      "deliveryType": "home",
      "productList": "Montre classique x1",
      "codAmount": 6900
    }
  }'
```

## Maystro-specific behavior

- **Duplicate policy**: Maystro rejects a second order for the same customer
  name + phone on the same day. This is deliberate on their side (anti-fraud,
  anti-double-submit). You'll get a clear `courier_error` explaining it. Handle
  it in your UI rather than retrying; retries will keep failing until the next
  day.
- **Commune IDs**: Maystro's API doesn't take commune names, it takes internal
  numeric commune IDs. You still send `communeName` as a string like with every
  other courier; the resolution to Maystro's ID happens inside dzship. If the
  name doesn't resolve, you'll get a `courier_error` naming the commune, which
  almost always means a spelling mismatch with the official list.
- **Status codes**: Maystro reports status as bare numbers, and the numbering
  is not intuitive; more than one integration in the wild has shown "delivered"
  for parcels that were still waiting for pickup. The mapping to the [canonical
  vocabulary](../statuses.md) is verified against production, so `delivered`
  means delivered.
- **Cancel and labels**: both available through the API.

Full request/response reference: [dzship API
docs](https://github.com/DZBuild-com/freeship/blob/main/docs/api-reference.md).
