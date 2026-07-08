# Ecotrack couriers integration guide (DHD, Conexlog, MSM Go & 30+ more)

Ecotrack isn't a courier; it's the platform a large slice of Algeria's regional
couriers run on. DHD, Conexlog, MSM Go, World Express and dozens of others are
each independent delivery companies with their own fleets and pricing, all
exposing the same Ecotrack API on their own domain.

That's good news for you: one integration, 30+ couriers. Pick the regional
courier your customers trust, and the code doesn't change.

## What you need

Two things:

| | Field | Example |
|---|---|---|
| API token (from that courier's dashboard) | `credentials.token` | `eyJ0…` |
| The courier's tenant URL | `options.baseUrl` | `https://app.mycourier.ecotrack.dz` |

Most tenants live at `https://<name>.ecotrack.dz`. Some run custom domains:
DHD is `https://platform.dhd-dz.com`, Conexlog is
`https://app.conexlog-dz.com`. Your courier's dashboard URL is usually the
tenant URL.

## Create a parcel

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "ecotrack",
    "credentials": { "token": "YOUR_TOKEN" },
    "options": { "baseUrl": "https://platform.dhd-dz.com" },
    "order": {
      "reference": "ORD-1005",
      "recipient": {
        "fullName": "Nassim Merabet",
        "phone": "0561234567",
        "wilayaCode": 6,
        "communeName": "Bejaia"
      },
      "deliveryType": "home",
      "productList": "Cafetière italienne x1",
      "codAmount": 5200
    }
  }'
```

## Ecotrack-specific behavior

- **Labels come back as PDF**: the label endpoint returns raw PDF bytes rather
  than a URL. freeship handles the difference; if you get a `labelUrl`, it's
  printable.
- **Status wording drifts per tenant**: each courier can customize status
  labels, so tenant A's "En livraison" can be tenant B's "Sorti en livraison".
  The known vocabulary maps to the [canonical statuses](../statuses.md); an
  unrecognized label comes through as `unknown` with `rawStatus` carrying the
  original text, so nothing is silently mislabeled.
- **Tracking lookups need care**: the underlying Ecotrack tracking API answers
  list-style queries, and a lazy "take the first row" client can attach the
  wrong parcel's status to your order. The freeship integration matches the
  exact tracking number. Worth knowing if you ever debug against the raw API.
- **No cancel endpoint**: cancel from the courier's dashboard.

## Which Ecotrack courier should I pick?

The platform is identical; the companies aren't. Delivered rate, pickup
punctuality and COD remittance speed vary by company and by region. Treat it
like the general [choosing-a-courier](../choosing-a-courier.md) question:
short-list couriers your target wilayas trust, run a small volume through each,
compare outcomes. Switching later is a `baseUrl` change.

Full request/response reference: [freeship API
docs](https://github.com/DZBuild-com/freeship/blob/main/docs/api-reference.md).
