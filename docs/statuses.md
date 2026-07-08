# Delivery statuses in Algeria: one vocabulary for every courier

Each courier reports parcel status in its own dialect: French sentences,
Arabic labels, English-ish slugs, or bare numbers. If you build your order
screen against one courier's wording, adding a second courier means rewriting
it.

The fix is to map everything onto one closed set once, and build your UI
against that. This is the vocabulary the [dzship
API](https://freeship.dzbuild.com) returns for every courier:

```
created → pending_pickup → picked_up → in_transit → at_hub → out_for_delivery
        → delivery_attempted → delivered
        → on_hold | returned | return_in_transit | cancelled | lost | unknown
```

`delivered`, `returned`, `cancelled` and `lost` are terminal. Everything else
can still move.

## UI labels, ready to paste

Algerian stores are Arabic-first with French common in back offices. These are
the labels DZBuild uses in production dashboards:

| Status | Français | العربية | Suggested tone |
|---|---|---|---|
| `created` | Enregistré | تم التسجيل | neutral |
| `pending_pickup` | En attente de ramassage | في انتظار الاستلام | neutral |
| `picked_up` | Ramassé | تم الاستلام من المتجر | info |
| `in_transit` | En transit | قيد النقل | info |
| `at_hub` | Au centre de tri | في مركز الفرز | info |
| `out_for_delivery` | En cours de livraison | خرج للتوصيل | active |
| `delivery_attempted` | Tentative de livraison | محاولة تسليم | warning |
| `delivered` | Livré | تم التسليم | success |
| `on_hold` | En attente | معلّق | warning |
| `return_in_transit` | Retour en cours | الإرجاع قيد النقل | warning |
| `returned` | Retourné | تم الإرجاع | danger |
| `cancelled` | Annulé | ملغى | danger |
| `lost` | Perdu | مفقود | danger |
| `unknown` | Statut inconnu | حالة غير معروفة | neutral |

Tips for the table above:

- Render Arabic labels in an RTL context (`dir="rtl"`), or punctuation will
  jump to the wrong side.
- Keep `rawStatus` visible somewhere (tooltip, detail view). When a status maps
  to `unknown`, the raw courier wording is the only thing support can act on.

## Statuses that deserve special handling

**`delivery_attempted`** is your money status. The courier tried, the customer
didn't pick up. Stores that call the customer within the hour recover a large
share of these; stores that wait for the courier's second attempt mostly get
returns. If you automate one notification, automate this one.

**`on_hold`** usually means the courier is waiting on something: customer
unreachable, wrong commune, refused fee. It resolves either way within days;
surface it to your ops instead of hiding it under "in progress".

**`unknown`** means the courier emitted wording outside the known vocabulary
(it happens; tenants customize labels). Show `rawStatus`, keep polling, and the
next event usually maps cleanly again.

## Per-courier notes

- **Maystro** reports numeric codes with unintuitive numbering; see the
  [Maystro guide](couriers/maystro.md) before trusting any homegrown mapping.
- **NOEST** mixes payment/finance events into the tracking feed; those are not
  parcel movement. See the [NOEST guide](couriers/noest.md).
- **Ecotrack** tenants customize status labels; expect drift between couriers
  on the same platform. See the [Ecotrack guide](couriers/ecotrack.md).
