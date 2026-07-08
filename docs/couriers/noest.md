# NOEST Express API integration guide

NOEST offers competitive rates and solid coverage, and its API is reasonably
complete: create, track, rates, cancel, labels, stop-desk. It also has the
single most damaging integration trap of any Algerian courier, which is why
this guide exists.

## The trap: created ≠ visible

On NOEST, creating an order through the API puts it in a draft state. Until a
**separate validation step** runs, logistics never sees it: no pickup is
scheduled, nothing moves, and no error is returned. The order just sits there
looking fine in your database while the customer waits.

Integrations that only call the creation endpoint strand every single parcel
this way. If you've ever heard "we integrated NOEST but pickups don't happen",
this is almost always the cause.

The freeship integration performs the validation as part of order creation, so
a `created` response means a real, pickup-ready parcel. Nothing for you to do;
just know the trap exists if you ever compare against a homegrown integration.

## What you need

From the NOEST dashboard:

| Credential | Field |
|---|---|
| API token | `apiToken` |
| GUID | `guid` |

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "noest",
    "credentials": { "apiToken": "YOUR_TOKEN", "guid": "YOUR_GUID" },
    "order": {
      "reference": "ORD-1004",
      "recipient": {
        "fullName": "Yasmine Belkacem",
        "phone": "0551112233",
        "wilayaCode": 19,
        "communeName": "Setif"
      },
      "deliveryType": "stopdesk",
      "stopDeskId": "19A",
      "productList": "Coffret parfum x1",
      "codAmount": 5400
    }
  }'
```

## NOEST-specific behavior

- **Stop-desk station codes**: NOEST identifies pickup stations by codes like
  `16A`, `19A` (wilaya number + letter), not numeric IDs. Pass that code as
  `order.stopDeskId`.
- **Open package**: NOEST supports letting the customer open the parcel before
  paying. Set `order.hasOpenPackage: true`. Merchants report it lifts the
  delivered rate on higher-priced items.
- **Exchanges**: supported via `order.isExchange`.
- **Tracking vocabulary**: NOEST events use their own slugs (including some
  historical spellings) and also emit payment/finance events that are not
  delivery statuses. The mapping to the [canonical vocabulary](../statuses.md)
  filters this correctly; if you build on raw NOEST events instead, don't
  surface payment events as parcel movement.

Full request/response reference: [freeship API
docs](https://github.com/DZBuild-com/freeship/blob/main/docs/api-reference.md).
