# Choosing a delivery courier in Algeria

There is no single best courier. There is a best courier for a given store,
region, and product. This page is the comparison we wish existed when we
started wiring couriers into [DZBuild](https://dzbuild.com).

## The short version

- **Yalidine** if you want the largest network, stop-desk coverage in most
  wilayas, and the most complete API (labels, insurance, cancel).
- **ZR Express** if you ship mostly from and around Algiers and want a courier
  that answers the phone.
- **Maystro** if you want fulfillment-style handling and don't mind a stricter
  rulebook (their duplicate policy will reject same-name-same-phone-same-day
  orders).
- **NOEST** for competitive pricing and good east-coast coverage, as long as
  your integration validates orders correctly (see the [NOEST
  guide](couriers/noest.md); this is where naive integrations strand parcels).
- **An Ecotrack courier** (DHD, Conexlog, MSM Go, World Express, and 30+
  others) when a specific regional courier serves your customers well; they all
  share one platform, so one integration covers any of them.

Merchants rarely stay with one. Most stores we see run two or three couriers
and route by wilaya or by what the customer picked at checkout. Build for that
from day one; with [dzship](https://freeship.dzbuild.com) it's the same
request with a different `courier` value.

## Capability matrix

| | Yalidine | ZR Express | Maystro | NOEST | Ecotrack |
|---|:---:|:---:|:---:|:---:|:---:|
| Create parcel | ✓ | ✓ | ✓ | ✓ | ✓ |
| Track | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rate quote | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cancel via API | ✓ | — | ✓ | ✓ | — |
| Label via API | ✓ | — | ✓ | ✓ | ✓ (PDF) |
| Stop-desk delivery | ✓ | ✓ | ✓ | ✓ | ✓ |
| Exchange parcels | ✓ | ✓ | — | ✓ | ✓ |
| Home + économique tier | ✓ | — | — | — | varies |

Capabilities move; `GET https://freeship.dzbuild.com/v1/couriers` returns the
live list.

## What actually decides it

**Where your customers are.** Coverage quality differs a lot more than price.
Ask each courier for their delivered-rate per wilaya, not their coverage map.
Every courier "covers" all 58 wilayas on paper.

**Stop-desk vs home.** Stop-desk (customer picks up at the courier's office)
delivers faster, returns less, and costs less. If your customers accept it,
prefer couriers with dense stop-desk networks in your top wilayas: Yalidine and
NOEST are strong here.

**Return economics.** A COD return costs you the return fee plus the product
round trip. Compare return fees, not just delivery fees; the gap between
couriers is wider there. Get both from `POST /v1/rates` (`deliveryFee` and
`returnFee`).

**The deep south.** Adrar, Tamanrasset, Illizi, Tindouf, Bordj Badji Mokhtar,
In Salah, In Guezzam, Djanet and the other Grand Sud wilayas carry surcharges
and longer lead times on every courier. If you sell there, quote rates per
order rather than using a flat shipping price. Details in the
[COD guide](cash-on-delivery.md).

**API reliability.** All five integrations here are exercised in production
daily. The practical differences are documented per courier in each guide:
required extras (Yalidine needs your origin wilaya, Ecotrack needs your tenant
URL), duplicate policies (Maystro), and validation steps (NOEST).

## Try them without rewriting anything

The point of the [dzship API](https://freeship.dzbuild.com) is that switching
courier is a one-line change. Open an account with two couriers, ship a week
with each in your main wilayas, and compare delivered rate and return rate.
That experiment answers the question better than any comparison table,
including this one.
