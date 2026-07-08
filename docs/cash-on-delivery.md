# Cash on delivery in Algeria: what developers need to model

Around nine of ten e-commerce orders in Algeria are paid in cash at the door.
COD is not a payment option you bolt on; it's the shape of the whole system,
and it changes what your data model and your order flow need to handle.

## The money flow

1. You create the parcel with a `codAmount` (integer DZD): what the driver
   collects.
2. The courier delivers, collects the cash, and later **remits** it to the
   merchant, minus fees, on the courier's payout schedule.
3. If the customer refuses or never shows, the parcel comes back and the
   merchant pays a **return fee** and has recovered stock to restock or
   re-ship.

Model all three outcomes. The most common modeling mistake is treating
"shipped" as "sold": a COD order isn't revenue until it's `delivered`, and a
`returned` order is negative margin (return fee + handling + sometimes a
damaged product).

## Fees: quote, don't hardcode

Delivery pricing varies by courier, by destination wilaya, sometimes by
commune, by delivery type (home vs stop-desk), and over time. Hardcoded fee
tables rot. Quote per order:

```bash
curl -X POST https://freeship.dzbuild.com/v1/rates \
  -H 'Content-Type: application/json' \
  -d '{
    "courier": "yalidine",
    "credentials": { "apiId": "…", "apiToken": "…" },
    "query": { "fromWilaya": 16, "toWilaya": 31, "deliveryType": "home" }
  }'
```

```json
{ "deliveryFee": 600, "returnFee": 250, "total": 600, "currency": "DZD" }
```

Note the `returnFee` in the response. Your unit economics per wilaya are
`margin × delivered_rate − returnFee × (1 − delivered_rate)`, and both numbers
in that formula vary by destination.

**Who pays shipping** is a per-courier detail with real consequences: Yalidine,
for instance, adds its fee to what the driver collects unless you flag the
order as free-shipping. Get it wrong and customers pay more at the door than
your checkout showed, which is how you earn refusals. See the
[Yalidine guide](couriers/yalidine.md).

## The deep-south surcharge

The Grand Sud wilayas (Adrar, Tamanrasset, Illizi, Tindouf, Bordj Badji
Mokhtar, In Salah, In Guezzam, Djanet, Timimoun, Ouled Djellal and neighbors)
cost meaningfully more to serve and take longer on every courier.
`GET /v1/wilayas` marks them with `isDeepSouth: true`. If your checkout shows a
flat national shipping price, these orders lose money quietly; either quote
live rates or price the tier separately.

## Confirmation before shipping

Because the customer commits nothing at checkout, Algerian stores confirm
orders by phone (or WhatsApp) before creating the parcel. This single step is
the strongest lever on delivered rate that exists.

For your integration this means: **checkout should not create the shipment.**
Store the order, confirm it, then call `/v1/orders`. Wiring parcel creation
directly into the checkout submit is the classic first-build mistake; you'll
ship to unconfirmed customers and eat the return fees. It also plays badly
with courier-side rules (see Maystro's same-day duplicate policy in the
[Maystro guide](couriers/maystro.md)).

## Stop-desk: the COD risk reducer

`deliveryType: "stopdesk"` sends the parcel to the courier's office and the
customer collects it there. It's cheaper, faster, and the customer showing up
is self-selection: refusal rates drop. The trade-off is coverage (not every
commune has a desk) and friction for the customer. Offer both when you can and
let the rate quote price them honestly.

## A data model that survives contact with COD

Minimum fields that earn their place, learned from running
[DZBuild](https://dzbuild.com):

- `status` using the [canonical vocabulary](statuses.md), plus the raw courier
  status for support.
- `cod_amount`, `delivery_fee`, `return_fee` captured **at creation time**
  (quotes change; your accounting shouldn't).
- `confirmed_at` and who confirmed: your delivered-rate reporting will want it.
- `delivery_attempted` timestamps: the call-back window (see
  [statuses](statuses.md)) is measured in hours.
- A terminal-state check before any restock or refund logic: only `returned`
  restocks, only `delivered` books revenue.
