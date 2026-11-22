/** dzship — typed client for the free Algerian shipping API at freeship.dzbuild.com */

import type { CourierCredentials, CourierKey } from './couriers';

export type { CourierCredentials, CourierKey };

export interface Recipient {
  fullName: string;
  phone: string;
  phoneAlt?: string;
  wilayaCode: number;
  communeName: string;
  addressLine?: string;
}

export interface Order {
  reference?: string;
  recipient: Recipient;
  deliveryType: 'home' | 'stopdesk';
  stopDeskId?: string;
  productList: string;
  codAmount: number;
  weightKg?: number;
  declaredValue?: number;
  freeShipping?: boolean;
  isExchange?: boolean;
  hasOpenPackage?: boolean;
  notes?: string;
}

export interface AdapterOptions {
  /** Your tenant URL, for the generic `ecotrack` key only. A named courier takes none. */
  baseUrl?: string;
  /** Origin wilaya code (1-58) */
  fromWilaya?: number;
  timeoutMs?: number;
}

export interface RatesQuery {
  fromWilaya?: number;
  toWilaya: number;
  toCommune?: string;
  deliveryType: 'home' | 'stopdesk';
  tier?: 'express' | 'economic';
  codAmount?: number;
}

export interface CreateOrderResult {
  trackingNumber: string;
  /** A second id some couriers return, such as the number printed on the slip. */
  courierReference?: string;
  /** Your order reference, or the one dzship generated. */
  reference?: string;
  status: string;
  [k: string]: unknown;
}

export interface TrackingEvent {
  status: string;
  rawStatus: string;
  description?: string;
  timestamp: string;
}

export interface TrackResult {
  status: string;
  events: TrackingEvent[];
  [k: string]: unknown;
}

export interface RatesResult {
  deliveryFee: number;
  returnFee?: number;
  total: number;
  currency: string;
  [k: string]: unknown;
}

/** A stop desk. Ship to it with `stopDeskId: id` and, when present, `communeName`. */
export interface StopDesk {
  id: string;
  name: string;
  wilayaCode: number;
  communeName?: string;
  address?: string;
}

/** A parcel's waybill. `pdf` and `zpl` carry the file in `data` as base64; `url` carries a link. */
export interface Label {
  trackingNumber: string;
  format: 'pdf' | 'zpl' | 'url';
  data: string;
  url?: string;
}

export interface CancelResult {
  trackingNumber: string;
  cancelled: true;
}

export interface CourierInfo {
  key: string;
  name: string;
  platform?: string;
  aliases?: string[];
  requiredCredentials: string[];
  capabilities: Record<string, boolean>;
  /** True for the generic Ecotrack key: you name the tenant yourself. */
  requiresBaseUrl?: boolean;
  baseUrlSuffixes?: string[];
  [k: string]: unknown;
}

export interface Wilaya {
  code: number;
  nameFr: string;
  nameAr: string;
  isDeepSouth: boolean;
  communeCount: number;
  /** False for a wilaya that exists in law but that couriers do not accept yet. */
  courierSupported: boolean;
  /** For an unsupported wilaya: the code to send to the courier instead. */
  shipAs?: number;
  [k: string]: unknown;
}

export interface Commune {
  wilayaCode: number;
  nameFr: string;
  nameAr: string;
  /** The Journal Officiel spelling, when couriers use a different one. */
  gazetteName?: string;
  /** Present on communes of a 2026 wilaya: the code to ship with. */
  shipAs?: number;
}

export interface RequestOptions {
  gateway?: string;
  timeoutMs?: number;
}

export type WilayaQuery = number | string | { code?: number; q?: string; all?: boolean };
export type CommuneQuery = number | string | { wilaya?: number; q?: string };
export type CourierQuery = string | { platform?: string; q?: string };

export declare class DzshipError extends Error {
  status: number;
  code: string;
  fields?: Record<string, unknown>;
  retryAfter?: number;
}

export interface Client {
  createOrder(order: Order): Promise<CreateOrderResult>;
  track(trackingNumber: string): Promise<TrackResult>;
  rates(query: RatesQuery): Promise<RatesResult>;
  desks(wilayaCode: number): Promise<StopDesk[]>;
  /** The courier's label for a parcel. Couriers without one reject with code `NOT_SUPPORTED`. */
  label(trackingNumber: string): Promise<Label>;
  /** Cancel a parcel the courier has not collected yet. */
  cancel(trackingNumber: string): Promise<CancelResult>;
  wilayas(query?: WilayaQuery): Promise<Wilaya[] | Wilaya>;
  communes(query?: CommuneQuery): Promise<Commune[]>;
  couriers(query?: CourierQuery): Promise<CourierInfo[]>;
}

/** A courier key, or any name the API resolves ("osen express", "procolis"). */
export type CourierName = CourierKey | (string & {});

/** The credential fields of one courier; a free-form map when the name is only known at runtime. */
export type CredentialsOf<K extends string> = K extends CourierKey
  ? CourierCredentials[K]
  : Record<string, string>;

export type ClientConfig<K extends string = string> = {
  courier: K;
  options?: AdapterOptions;
  gateway?: string;
  timeoutMs?: number;
} & (K extends 'sandbox'
  ? { credentials?: Record<string, never> }
  : { credentials: CredentialsOf<K> });

declare function dzship<K extends CourierName>(config: ClientConfig<K>): Client;
declare function dzship<K extends CourierName>(
  courier: K,
  ...rest: K extends 'sandbox'
    ? [credentials?: Record<string, never>, options?: AdapterOptions]
    : [credentials: CredentialsOf<K>, options?: AdapterOptions]
): Client;

declare namespace dzship {
  function couriers(query?: CourierQuery, opts?: RequestOptions): Promise<CourierInfo[]>;
  function wilayas(query?: WilayaQuery, opts?: RequestOptions): Promise<Wilaya[] | Wilaya>;
  function communes(query?: CommuneQuery, opts?: RequestOptions): Promise<Commune[]>;
  function health(opts?: RequestOptions): Promise<{ status: string }>;
  const GATEWAY: string;
  export { DzshipError };
}

export default dzship;
