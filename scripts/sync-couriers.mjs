#!/usr/bin/env node
// Rebuilds data/couriers.json, clients/node/couriers.d.ts and the support table in
// README.md from the live courier list.
// Run it when a courier is added: node scripts/sync-couriers.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GATEWAY = process.env.DZSHIP_GATEWAY || 'https://freeship.dzbuild.com';
const root = fileURLToPath(new URL('..', import.meta.url));

const res = await fetch(`${GATEWAY}/v1/couriers`);
if (!res.ok) throw new Error(`GET /v1/couriers answered HTTP ${res.status}`);
const live = await res.json();
if (!Array.isArray(live) || live.length < 100) throw new Error('courier list looks truncated');

const couriers = live.map((c) => ({
  key: c.key,
  name: c.name,
  platform: c.platform,
  ...(c.aliases?.length ? { aliases: c.aliases } : {}),
  credentials: c.requiredCredentials,
  create: c.capabilities.createShipment,
  track: c.capabilities.track,
  rates: c.capabilities.rates,
  desks: c.capabilities.listStopDesks,
  label: c.capabilities.label,
  cancel: c.capabilities.cancelShipment,
  ...(c.requiresBaseUrl ? { requiresBaseUrl: true } : {}),
}));

const json = '[\n' + couriers.map((c) => '  ' + JSON.stringify(c)).join(',\n') + '\n]\n';
writeFileSync(root + 'data/couriers.json', json);

const fields = (c) =>
  c.credentials.length ? `{ ${c.credentials.map((f) => `${f}: string`).join('; ')} }` : 'Record<string, never>';
const dts = `// Written by scripts/sync-couriers.mjs from GET /v1/couriers. Do not edit by hand.

/** Every courier key, with the credential fields that courier asks for. */
export interface CourierCredentials {
${couriers.map((c) => `  /** ${c.name} */\n  ${/^[a-z_$][\w$]*$/i.test(c.key) ? c.key : `'${c.key}'`}: ${fields(c)};`).join('\n')}
}

export type CourierKey = keyof CourierCredentials;
`;
writeFileSync(root + 'clients/node/couriers.d.ts', dts);

// One README row per platform: couriers on the same platform support the same calls.
const FAMILY_NAMES = {
  yalidine: 'Yalidine, Yalitec, Guepex, Easy & Speed, Economiqua, We Can',
  procolis: 'ZR Express (Procolis)',
  zrexpressapp: 'ZR Express (new platform)',
  ecotrack: 'DHD, Conexlog, MSM Go and every other Ecotrack courier',
};
const CALLS = ['create', 'track', 'rates', 'desks', 'label', 'cancel'];
const families = new Map();
for (const c of couriers) families.set(c.platform, [...(families.get(c.platform) ?? []), c]);
const rows = [...families].map(([platform, members]) => {
  const cells = CALLS.map((call) => {
    const answers = new Set(members.map((m) => m[call]));
    if (answers.size > 1) throw new Error(`couriers on ${platform} disagree about "${call}"`);
    return members[0][call] ? '✅' : '❌';
  });
  return `| ${FAMILY_NAMES[platform] ?? members[0].name} | ${cells.join(' | ')} |`;
});
const table = [
  '| Courier | Create | Track | Rates | Stop desks | Label | Cancel |',
  '|---|:-:|:-:|:-:|:-:|:-:|:-:|',
  ...rows,
].join('\n');
const START = '<!-- couriers:start -->';
const END = '<!-- couriers:end -->';
const readme = readFileSync(root + 'README.md', 'utf8');
const [before, rest] = readme.split(START);
if (rest === undefined || !rest.includes(END)) throw new Error('README.md lost its couriers markers');
writeFileSync(root + 'README.md', `${before}${START}\n${table}\n${END}${rest.split(END)[1]}`);

console.log(`${couriers.length} couriers written to data/couriers.json, clients/node/couriers.d.ts and README.md`);
