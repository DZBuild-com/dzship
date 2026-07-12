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
  /** Ecotrack tenant URL, e.g. https://courier.ecotrack.dz */
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
  requiredCredentials: string[];
  capabilities: Record<string, boolean>;
  [k: string]: unknown;
}

export interface Wilaya {
  code: number;
  [k: string]: unknown;
}

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
}

export interface ClientConfig {
  courier: string;
  credentials: Record<string, string>;
  options?: AdapterOptions;
  gateway?: string;
  timeoutMs?: number;
}

declare function dzship(config: ClientConfig): Client;

declare namespace dzship {
  function couriers(): Promise<CourierInfo[]>;
  function wilayas(): Promise<Wilaya[]>;
  function health(): Promise<{ status: string }>;
  const GATEWAY: string;
  export { DzshipError };
}

export default dzship;
