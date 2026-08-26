# Changelog

## 2026-08-26

**92 couriers, each with its own key.** Every courier running on the Yalidine
and Ecotrack platforms is now a first-class `courier` key — `dhd`, `conexlog`,
`msmgo`, `rocketdelivery`, `yalitec`, `guepex`, `easyandspeed`, and 85 more.
No tenant URL to look up: you name the courier, dzship keeps the address.
`GET /v1/couriers?q=rocket` finds yours. The generic `ecotrack` key still works
for a tenant we do not list yet, restricted to `*.ecotrack.dz`.

**New: `GET /v1/communes`.** All 1,541 communes, or one wilaya's with `?16`, or
a search with `?q=bab`, in the spelling courier APIs expect.

**`GET /v1/wilayas` learned to answer questions**: `?16` for one wilaya,
`?q=oran` to search in French or Arabic, `?all=1` for the full 2026 division.
The default response is unchanged — the 58 wilayas couriers deliver to.

**Algeria's 2026 division, without breaking anyone.** Loi n° 26-06 of 4 April
2026 created eleven new wilayas, numbered 59–69 by décret n° 26-206. No courier
accepts a code above 58 yet, so the new wilayas are served only on request, each
carrying the `shipAs` code to actually ship with. New datasets:
`data/wilayas-2026.json`, `data/new-wilayas-2026.json`,
`data/communes-moved-2026.csv`. ([#1](https://github.com/DZBuild-com/dzship/issues/1))

**Higher limits**: 200 orders/hour/IP (was 30), 1,000/day (was 100), 60 tracking
calls/minute (was 30). Reference endpoints now send `Cache-Control` — cache them
instead of polling.

**Docs**: a full [API reference](docs/endpoints.md) in the repo, the 82 Ecotrack
couriers listed with their keys, and five dead links to a retired repository
fixed.

## 2026-07-12

Integration clients for Node, PHP and Python, a per-stack integration guide, and
`npm install dzship`. The API went worldwide — it had been Algeria-only.

## 2026-07-10

The wilaya and commune dataset: 58 wilayas, 1,541 communes, French + Arabic.

## 2026-07-08

First public release: the courier field guides and the free hosted API at
freeship.dzbuild.com.
