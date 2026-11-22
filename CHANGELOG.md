# Changelog

## 2026-11-22 (MCP server)

**New: an MCP server at `https://freeship.dzbuild.com/mcp`.** Streamable HTTP,
no login, no session. Eight tools run the API's own calls: `list_couriers`,
`list_wilayas`, `list_communes`, `create_parcel`, `track_parcel`, `get_rates`,
`list_stop_desks` and `cancel_parcel`. A client can keep courier credentials in
an `X-Courier-Credentials` header of the connection, a JSON object keyed by
courier key, so they stay out of the conversation. Labels stay on
`POST /v1/label`: a PDF is no use inside a conversation. Setup for Claude Code,
Cursor and VS Code is in the [MCP guide](https://freeship.dzbuild.com/docs/mcp).

**Listed in the official MCP registry** as `com.dzbuild/dzship`. `server.json`
is the entry.

**Clients 1.3.2**: no code change. The npm, Packagist and pip pages now carry
the MCP section.

## 2026-11-22 (1.3.1)

**New: `POST /v1/label` and `POST /v1/cancel`.** The waybill of a parcel, as a
PDF in base64 or as a link when the courier hosts it, and a cancel for a parcel
the courier has not collected yet. Both take the body of a tracking call. Not
every courier has a call for them: the [support table](README.md#what-each-courier-supports)
says which, and the rest answer `422 NOT_SUPPORTED`.

**The sandbox prints and cancels too.** `courier: "sandbox"` returns a one-page
PDF for a label and accepts a cancel for the numbers it issued, so the whole
flow runs with no account.

**Clients 1.3.1**: `label()` and `cancel()` in the Node, PHP, Python and Ruby
clients. `data/couriers.json` now says per courier whether it offers a label
and a cancel.

## 2026-11-22

**Two new couriers: Osen Express and Terminal Delivery.** `osenexpress` and
`terminaldelivery`, one token each. Osen orders are validated in the same call
that creates them, and its amounts must be multiples of 10 DZD. Terminal returns
two ids: the order id you track with, and the `TD-` number on the slip. Guides:
[Osen Express](docs/couriers/osen-express.md),
[Terminal Delivery](docs/couriers/terminal-delivery.md). That makes 101 couriers.

**A courier refusal now answers HTTP 424, and you can read why.** `COURIER_ERROR`
and `HTTP_ERROR` used to answer 502, and a 502 reached most callers as an empty
error page with no JSON. The `error.code` values are unchanged. If your code
branches on status 502, branch on `error.code` instead.

**Typed couriers in the Node client (1.3.0).** `courier` completes to every
courier key, and `credentials` is checked against that courier's fields at
compile time. There is a short form too: `dzship('yalidine', { apiId, apiToken })`.

**`composer require dzbuild/dzship`** for PHP and
`pip install git+https://github.com/DZBuild-com/dzship.git` for Python. The
single files in `clients/` still work on their own.

**`data/couriers.json`**: every courier key with its name, platform, aliases,
credential fields and what it can do. The same list `GET /v1/couriers` serves,
for a dropdown or a settings form.

## 2026-09-23

**New: `POST /v1/desks`.** The stop desks a courier runs in one wilaya, with the
same `courier` and `credentials` as an order, so a checkout can offer a list
instead of asking the customer for an id nobody knows. Ship to the chosen desk
with `deliveryType: "stopdesk"`, its `id` as `order.stopDeskId` and its
`communeName` as the recipient's commune. The sandbox courier has one desk per
wilaya, so the whole flow runs without an account.
([#3](https://github.com/DZBuild-com/dzship/issues/3))

**Ecotrack couriers quote real prices.** Rate quotes for the Ecotrack family came
back with an empty fee. They now read the account's own price list, return fee
included. Tracking history for those couriers was always empty and now carries
every event.

**NOEST desks in wilayas 1 to 9.** NOEST lists those desks as `01A` but only
accepts `1A` when you ship. The desk list returns the code NOEST accepts, and an
order sent with the padded form is corrected on the way.

**Maystro desks** show their real names and no longer include partner shops that
a stop-desk parcel never reaches.

**Clients 1.2.0**: `desks()` in the Node, PHP, Python and Ruby clients.

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
