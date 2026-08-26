# Security

## Reporting a vulnerability

Email **security@dzbuild.com** with what you found and how to reproduce it.
Please do not open a public issue for a vulnerability, and please do not test
against the live API in a way that degrades it for other people — one proof of
concept is enough.

We answer within a few days and will tell you when a fix is out. If you want
credit, say so and we will name you here.

## What the hosted API does with your data

- **Courier credentials are used for the call you sent and nothing else.** They
  are not stored, not logged, and not written to any database. There are no
  accounts, so there is nothing to store them in.
- **Requests are traced** — timestamp, IP, country, path, status, latency, and
  the courier key — to keep the service running and to spot abuse. Order calls
  also record the wilaya, the COD amount, the product line, and the recipient
  phone **masked** (`055*****67`) with a salted hash for counting repeats. The
  full number is never written down.
- **Traces expire**: request rows after 30 days, order rows after 180.

## What the API will not do for you

The API only ever connects to addresses that couriers own. `options.baseUrl`
accepts a tenant of a platform we support — nothing else — and every redirect
hop is re-checked against the same rule. If you point it somewhere else you get
`400 EGRESS_BLOCKED`, and no connection is made.

Error messages never contain the address the server connected to, or the IP
behind it. That is deliberate: an API that echoes its outbound targets is a
network scanner for whoever asks it nicely.

## Using the API safely in your own app

- **Call it from a server.** Courier credentials in browser JavaScript are
  public credentials — anyone with the page can create parcels on your account.
- **Send your own `reference`** on every order and check it before resending.
  A creation call is never retried automatically, precisely because a retried
  create is a duplicate parcel.
- **Rotate a courier token** you have ever pasted into a shared tool, including
  this one, if you are not sure where it went.
