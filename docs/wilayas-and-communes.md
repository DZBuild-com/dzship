# Wilayas and communes — the complete list, and how not to get burned by it

Every Algerian courier addresses a parcel with two fields: a **wilaya**
(province) and a **commune** (municipality). Get either slightly wrong and the
parcel is silently rejected, rerouted, or created against the wrong hub. This
page ships the complete official dataset and the matching rules that keep it
working against real courier APIs.

## The data

Ready to use, in [`data/`](../data/):

| File | Contents |
|---|---|
| [`data/wilayas.json`](../data/wilayas.json) | All **58 wilayas**: code, French name, Arabic name, accent-free name, commune count |
| [`data/communes.json`](../data/communes.json) | All **1,541 communes**: wilaya code, French name, Arabic name |
| [`data/communes.csv`](../data/communes.csv) | Same communes as CSV (UTF-8 with BOM, opens clean in Excel) |

Fetch them raw, no key needed:

```
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/wilayas.json
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.json
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.csv
```

Record shapes:

```json
// wilayas.json
{ "code": 16, "name": "Alger", "nameAr": "الجزائر", "nameAscii": "Alger", "communeCount": 57 }

// communes.json
{ "wilayaCode": 16, "name": "Bab Ezzouar", "nameAr": "باب الزوار" }
```

The list reflects the **58-wilaya division in force since 2021** — 1,541
communes total. If your source still says 48 wilayas, it predates the split and
will misroute the ten new southern wilayas (codes 49–58, carved out of Adrar,
Biskra, Béchar, Tamanrasset, Ouargla, El Oued and Ghardaïa).

## Wilaya code vs wilaya name

Always store and send the **numeric code** (1–58), not the name. Codes are
stable; names come in variants (`Alger` / `Algiers` / `الجزائر`, `Béjaïa` /
`Bejaia`). Every courier accepts or resolves the code; several reject an
unexpected spelling of the name. The code is also the first two digits of the
postal code and what customers recognize from license plates.

## Commune matching: where integrations actually break

Commune is a free-text name on most courier APIs, matched against **the
courier's own internal list**. That makes it the single most common cause of
failed parcel creation:

- **Spelling drift.** The same commune appears as `Timokten`, `Timekten` or
  `Tamentit`, `Tamantit` depending on whose list you read. Couriers each froze
  their own transliteration years ago.
- **Accents and case.** Some couriers match `Sidi Bel Abbès`, some only
  `Sidi Bel Abbes`. Normalize before comparing: lowercase, strip accents,
  collapse double spaces.
- **Homonyms across wilayas.** 36 commune names in this dataset exist in more
  than one wilaya — `El Marsa` alone is a commune in Chlef, Alger *and* Skikda.
  Never match a commune by name alone — always match **within the selected
  wilaya**.
- **Arabic input.** Customers type Arabic; courier lists are mostly French.
  Use `nameAr` from this dataset to render the picker, but send `name` (the
  French form) to the courier.

The reliable pattern is a two-step picker: user selects the wilaya (by code),
then picks the commune from the list filtered to that wilaya. Free-text commune
input is how parcels get stranded.

If you ship through the hosted dzship API, commune names are sanitized and
resolved per courier for you (including Maystro's integer commune IDs) — see
the [courier guides](../docs) for what each one needs.

## Quick usage

JavaScript / Node:

```js
const communes = await fetch(
  "https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.json"
).then((r) => r.json());

const norm = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const ofWilaya = (code) => communes.filter((c) => c.wilayaCode === code);
const find = (code, name) =>
  ofWilaya(code).find((c) => norm(c.name) === norm(name));

find(16, "bab ezzouar"); // → { wilayaCode: 16, name: "Bab Ezzouar", nameAr: "باب الزوار" }
```

PHP:

```php
$communes = json_decode(file_get_contents(__DIR__.'/data/communes.json'), true);
$alger = array_values(array_filter($communes, fn($c) => $c['wilayaCode'] === 16));
```

Python:

```python
import json
communes = json.load(open("data/communes.json", encoding="utf-8"))
by_wilaya = {}
for c in communes:
    by_wilaya.setdefault(c["wilayaCode"], []).append(c)
```

## Delivery-pricing zones, briefly

Couriers price by destination wilaya, usually in bands: the north (roughly
codes 2–6, 9–10, 13–31, 34–36, 38, 41–48) is the cheap tier, the high plateaus
and pre-Sahara cost more, and the deep south (11, 33, 37, 49–50, 52–54, 56)
carries a heavy surcharge and longer delays — details and the COD angle in
[Cash on delivery](cash-on-delivery.md). When you quote shipping to a customer,
quote it from the wilaya code, never from a flat rate.

## Related

- [Choosing a courier](choosing-a-courier.md) — coverage per network; not every
  courier serves every wilaya from every origin.
- [Delivery statuses](statuses.md) — what happens after the parcel is created.
- The hosted API also exposes `GET /v1/wilayas` at
  [freeship.dzbuild.com](https://freeship.dzbuild.com) if you'd rather not
  vendor the file.
