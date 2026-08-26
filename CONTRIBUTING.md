# Contributing

The service implementation is private; this repository holds the guides, the
clients and the datasets. That still leaves the most valuable contributions
open, because the things that break an Algerian shipping integration are facts,
not code.

## The issues worth opening

**A courier is missing.** Tell us the courier's name and, if you know it, the
platform it runs on (its dashboard URL is usually enough — `something.ecotrack.dz`
answers the question by itself). Adding a courier that runs a platform we already
speak takes minutes.

**A commune is wrong.** Wrong spelling, missing, or attached to the wrong
wilaya. Say which courier rejected it and what spelling that courier's own list
uses — that second half is what makes the fix correct rather than a guess.

**A status maps wrong.** If a courier reports a status that comes back as
`unknown`, or one that means something different from what we mapped, send the
raw status string and what actually happened to the parcel.

**A guide is out of date.** Couriers change endpoints without telling anyone.
If a documented behaviour no longer matches reality, that is a bug in the guide.

**The API misbehaved.** Include the request you sent with credentials removed,
the response you got, and the time — the traffic is traced, so a timestamp is
enough to find it.

## Pull requests

Welcome for the guides, the clients and the datasets:

- **Guides** (`docs/`): keep the voice — direct, concrete, and about what
  actually happens. Prefer one accurate sentence to a paragraph of hedging. If
  you state a courier behaviour, say how you know.
- **Clients** (`clients/`): they are deliberately dependency-free and boring.
  Node is CJS + ESM + types, PHP is one file with ext-curl only, Python is one
  file with the standard library only. Keep it that way — they get dropped into
  shared hosting and ten-year-old stacks.
- **Datasets** (`data/`): a change needs a source. For communes, the source is
  the courier list that rejects or accepts the name. For wilayas, the source is
  the *Journal Officiel* — link the PDF and the article.

Run nothing, build nothing: there is no build step in this repository.

## What we will not merge

- A client that adds a dependency.
- A dataset change without a source.
- Anything that turns the guides into marketing.

## Security

Do not open an issue for a vulnerability — see [SECURITY.md](SECURITY.md).
