#!/usr/bin/env node
// Rebuilds data/couriers.json and clients/node/couriers.d.ts from the live courier list.
// Run it when a courier is added: node scripts/sync-couriers.mjs

import { writeFileSync } from 'node:fs';
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

console.log(`${couriers.length} couriers written to data/couriers.json and clients/node/couriers.d.ts`);
