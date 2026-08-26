/** dzship — typed client for the free Algerian shipping API at freeship.dzbuild.com */

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
  /**
   * Tenant URL for the generic `ecotrack` courier, e.g. https://courier.ecotrack.dz.
   * Every other courier has its own key and needs no URL.
   */
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
  status: string;
  [k: string]: unknown;
}

export interface TrackingEvent {
  status: string;
  rawStatus: string;
  timestamp: string;
}

export interface TrackResult {
  status: string;
  events: TrackingEvent[];
  [k: string]: unknown;
}

export interface RatesResult {
  deliveryFee: number;
  returnFee: number;
  total: number;
  currency: string;
  [k: string]: unknown;
}

export interface CourierInfo {
  key: string;
  name: string;
  platform?: string;
  aliases?: string[];
  requiredCredentials: string[];
  capabilities: Record<string, boolean>;
  /** The endpoint dzship uses for this courier, when it is fixed. */
  endpoint?: string;
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
  wilayas(query?: WilayaQuery): Promise<Wilaya[] | Wilaya>;
  communes(query?: CommuneQuery): Promise<Commune[]>;
  couriers(query?: CourierQuery): Promise<CourierInfo[]>;
}

export interface ClientConfig {
  courier: string;
  /** That courier's own fields. Omit for the sandbox courier, which needs none. */
  credentials?: Record<string, string>;
  options?: AdapterOptions;
  gateway?: string;
  timeoutMs?: number;
}

declare function dzship(config: ClientConfig): Client;

declare namespace dzship {
  function couriers(query?: CourierQuery, opts?: RequestOptions): Promise<CourierInfo[]>;
  function wilayas(query?: WilayaQuery, opts?: RequestOptions): Promise<Wilaya[] | Wilaya>;
  function communes(query?: CommuneQuery, opts?: RequestOptions): Promise<Commune[]>;
  function health(opts?: RequestOptions): Promise<{ status: string }>;
  const GATEWAY: string;
  export { DzshipError };
}

export default dzship;
