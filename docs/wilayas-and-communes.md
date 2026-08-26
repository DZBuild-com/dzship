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
| [`data/wilayas-2026.json`](../data/wilayas-2026.json) | All **69 wilayas** of the 2026 division, each flagged `courierSupported` with the code to `shipAs` |
| [`data/new-wilayas-2026.json`](../data/new-wilayas-2026.json) | The **11 new wilayas** (59–69) with the 108 communes transferred into them |
| [`data/communes-moved-2026.csv`](../data/communes-moved-2026.csv) | The same 108 communes as a flat old-code → new-code join |

Fetch them raw, no key needed:

```
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/wilayas.json
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.json
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.csv
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/wilayas-2026.json
https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/new-wilayas-2026.json
```

Record shapes:

```json
// wilayas.json
{ "code": 16, "name": "Alger", "nameAr": "الجزائر", "nameAscii": "Alger", "communeCount": 57 }

// communes.json
{ "wilayaCode": 16, "name": "Bab Ezzouar", "nameAr": "باب الزوار" }
```

`wilayas.json` holds the **58 wilayas couriers actually deliver to**. If your
source still says 48, it predates the 2019 split and will misroute the ten
southern wilayas (codes 49–58, carved out of Adrar, Biskra, Béchar,
Tamanrasset, Ouargla, El Oued and Ghardaïa). If your source says 69, read the
next section before you use it.

## 2026: Algeria has 69 wilayas. Ship to 58 anyway.

On 4 April 2026, [loi n° 26-06](https://www.joradp.dz/FTP/jo-francais/2026/F2026025.pdf)
(JO n° 25) redrew the map: *« le nouveau découpage territorial du pays comprend
soixante-neuf (69) wilayas et mille cinq cent quarante-et-une (1541)
communes »*. Eleven administrative districts became full wilayas, and
[décret présidentiel n° 26-206](https://www.joradp.dz/FTP/jo-francais/2026/F2026040.pdf)
(JO n° 40, 3 June 2026) gave them the codes 59 to 69.

**No courier accepts a code above 58.** Not one — Yalidine, ZR Express, Maystro,
NOEST and every Ecotrack tenant still sync 58 wilayas months after the law. The
same law explains why: article 54 keeps the *wilayas mères* running the new
territories until the handover completes, with a deadline of 31 December 2026.
Send `wilayaCode: 60` today and the parcel is rejected.

So the split in this repo is deliberate:

| You want | Use |
|---|---|
| A wilaya list your checkout can ship from | `data/wilayas.json` — the 58 |
| The current administrative division | `data/wilayas-2026.json` — all 69, each with `courierSupported` and `shipAs` |
| Which communes moved where | `data/new-wilayas-2026.json` or the CSV |

The new wilayas, their parents, and how many communes moved:

| Code | Wilaya | الولاية | Carved from | Communes |
|---:|---|---|---|---:|
| 59 | Aflou | أفلو | 3 Laghouat | 12 |
| 60 | Barika | بريكة | 5 Batna | 8 |
| 61 | El Kantara | القنطرة | 7 Biskra | 5 |
| 62 | Bir El Ater | بئر العاتر | 12 Tébessa | 4 |
| 63 | El Aricha | العريشة | 13 Tlemcen | 4 |
| 64 | Ksar Chellala | قصر الشلالة | 14 Tiaret | 6 |
| 65 | Aïn Ouessara | عين وسارة | 17 Djelfa | 10 |
| 66 | Messaad | مسعد | 17 Djelfa | 8 |
| 67 | Ksar El Boukhari | قصر البخاري | 26 Médéa | 21 |
| 68 | Bou Saâda | بوسعادة | 28 M'Sila | 23 |
| 69 | El Abiodh Sidi Cheikh | الأبيض سيدي الشيخ | 32 El Bayadh | 7 |

108 communes changed wilaya. The national total did not change: still 1,541.

If you want to show the new names in your address form — customers in Bou Saâda
now say they live in Bou Saâda, not M'Sila — show the new wilaya and send its
`shipAs` code to the courier:

```js
const w = await fetch("https://freeship.dzbuild.com/v1/wilayas?68").then(r => r.json());
// { code: 68, nameFr: "Bou Saâda", courierSupported: false, shipAs: 28, communeCount: 23 }

order.recipient.wilayaCode = w.courierSupported ? w.code : w.shipAs; // 28
```

One more trap: the *Journal Officiel* spells some communes differently from the
courier lists (`Aïn Ouessara` in the gazette, `Ain Oussera` in every courier's
database; `Boughezoul` vs `Boughzoul`). The dataset carries the courier spelling
in `name` and the gazette spelling in `gazetteName` — send `name`.

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
- The hosted API serves the same data if you'd rather not vendor the files:
  `GET /v1/wilayas` (the 58), `?all=1` (all 69), `?16` (one), `?q=oran`
  (search), and `GET /v1/communes?16` (the communes of a wilaya) at
  [freeship.dzbuild.com](https://freeship.dzbuild.com). All of it is cacheable
  and needs no key.
