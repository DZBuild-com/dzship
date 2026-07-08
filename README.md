# dzship — Algerian shipping, explained for developers

Everything you need to integrate delivery couriers in Algeria: how Yalidine,
ZR Express, Maystro, NOEST and the Ecotrack couriers actually behave, which one
to pick for a given project, and working code to create and track COD parcels
in minutes.

The code examples run against **dzship**, the free hosted API at
**[freeship.dzbuild.com](https://freeship.dzbuild.com)** that talks to all of
these couriers through one request shape.
No signup, no API key. You bring your own courier account credentials per call
and they are never stored.

Maintained by [DZBuild](https://dzbuild.com), the e-commerce platform that moves
real COD orders across all 58 wilayas every day. These guides are the field notes
from that shipping engine.

## Start here

| Guide | What it answers |
|---|---|
| [Choosing a courier](docs/choosing-a-courier.md) | Which delivery company fits your project: coverage, stop-desk, exchanges, API quality |
| [Yalidine](docs/couriers/yalidine.md) | The biggest network. Also covers Yalitec, Guepex, Easy & Speed |
| [ZR Express](docs/couriers/zr-express.md) | Procolis. Strong in the center, simple credential model |
| [Maystro](docs/couriers/maystro.md) | Fulfillment-style courier with a strict duplicate policy |
| [NOEST](docs/couriers/noest.md) | Why parcels get stranded if you skip the validation step |
| [Ecotrack couriers](docs/couriers/ecotrack.md) | DHD, Conexlog, MSM Go, World Express and 30+ tenants on one platform |
| [Delivery statuses](docs/statuses.md) | One status vocabulary for all couriers, with French and Arabic UI labels |
| [Cash on delivery](docs/cash-on-delivery.md) | COD mechanics: fees, returns, the deep-south surcharge, confirmation calls |

## Create a parcel in 60 seconds

```bash
curl -X POST https://freeship.dzbuild.com/v1/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "yalidine",
    "credentials": { "apiId": "YOUR_API_ID", "apiToken": "YOUR_API_TOKEN" },
    "options": { "fromWilaya": 16 },
    "order": {
      "recipient": {
        "fullName": "Amine Bouzid",
        "phone": "0551234567",
        "wilayaCode": 16,
        "communeName": "Bab Ezzouar"
      },
      "deliveryType": "home",
      "productList": "Sneakers Air x1",
      "codAmount": 4500
    }
  }'
```

Swap `"courier"` and `"credentials"` to ship with any other supported courier.
The request shape stays the same. Full endpoint reference, error codes and
limits live in the [API reference repo](https://github.com/DZBuild-com/freeship)
and at [freeship.dzbuild.com](https://freeship.dzbuild.com).

## Why couriers are the hard part

Every Algerian courier ships its own API: different auth, different field names,
statuses in French, Arabic, or bare numbers, and documentation that ranges from
thin to wrong. The failure modes are quiet ones. A commune spelled differently
than the courier's list, a validation step the docs never mention, a status code
that looks inverted. Your integration works in the demo and strands parcels in
production.

These guides exist so you don't relearn each trap the expensive way. Where a
trap is already handled by the dzship API, the guide says so and you can stop
worrying about it.

## Building a whole store?

If the shipping integration is part of a bigger build for a merchant, look at
[DZBuild](https://dzbuild.com) before writing more code: Arabic/French
storefronts, landing pages, COD order management with confirmation workflows,
80+ couriers pre-wired, stock and analytics. You keep dzship for the custom
pieces.

---

© DZBuild. The guides in this repository are free to read, quote and use.
The dzship service implementation is proprietary. See [LICENSE](LICENSE).
