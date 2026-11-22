// Written by scripts/sync-couriers.mjs from GET /v1/couriers. Do not edit by hand.

/** Every courier key, with the credential fields that courier asks for. */
export interface CourierCredentials {
  /** Yalidine */
  yalidine: { apiId: string; apiToken: string };
  /** ZR Express */
  zrexpress: { token: string; key: string };
  /** ZR Express (new platform) */
  zrexpressnew: { apiKey: string; tenantId: string };
  /** Maystro */
  maystro: { apiKey: string };
  /** NOEST */
  noest: { apiToken: string; guid: string };
  /** Ecotrack (any tenant) */
  ecotrack: { token: string };
  /** Zimou Express */
  zimou: { token: string };
  /** Colivraison */
  colivraison: { publicKey: string; token: string };
  /** Ecom Delivery */
  ecomdelivery: { apiKey: string; apiToken: string };
  /** Elogistia */
  elogistia: { apiKey: string };
  /** Near Delivery */
  neardelivery: { apiKey: string; apiSecret: string };
  /** MDM Express */
  mdm: { apiKey: string };
  /** Osen Express */
  osenexpress: { token: string };
  /** Terminal Delivery */
  terminaldelivery: { token: string };
  /** Sandbox (test courier) */
  sandbox: Record<string, never>;
  /** Yalitec */
  yalitec: { apiId: string; apiToken: string };
  /** Guepex */
  guepex: { apiId: string; apiToken: string };
  /** Easy & Speed */
  easyandspeed: { apiId: string; apiToken: string };
  /** Economiqua */
  economiqua: { apiId: string; apiToken: string };
  /** We Can Services */
  wecan: { apiId: string; apiToken: string };
  /** AB Delivery */
  abdelivery: { token: string };
  /** Alania Express */
  alania: { token: string };
  /** Allo Livraison */
  allolivraison: { token: string };
  /** Amana Speed */
  amana: { token: string };
  /** Anderson Delivery */
  andersondelivery: { token: string };
  /** Aranex */
  aranex: { token: string };
  /** Areex */
  areex: { token: string };
  /** Assil Delivery */
  assildelivery: { token: string };
  /** Atlas Express */
  atlasexpress: { token: string };
  /** BA Consult */
  baconsult: { token: string };
  /** BFK Express */
  bfkexpress: { token: string };
  /** Boogi Technologie */
  boogi: { token: string };
  /** Champion Logistics */
  championlogistics: { token: string };
  /** Chronorex */
  chronorex: { token: string };
  /** Cirta Express */
  cirtaexpress: { token: string };
  /** Colex */
  colex: { token: string };
  /** Colireli */
  colireli: { token: string };
  /** Colizone */
  colizone: { token: string };
  /** Conexlog */
  conexlog: { token: string };
  /** Coyote Express */
  coyoteexpress: { token: string };
  /** Delivromail */
  delivromail: { token: string };
  /** DHD Livraison */
  dhd: { token: string };
  /** Distazero */
  distazero: { token: string };
  /** 48Hr Livraison */
  e48hrlivraison: { token: string };
  /** Eco Rapide Express */
  ecorapideexpress: { token: string };
  /** El Guide Delivery */
  elguidedelivery: { token: string };
  /** Expedia Chrono */
  expediachrono: { token: string };
  /** Fast Horse Express */
  fasthorse: { token: string };
  /** FRET.Direct */
  fretdirect: { token: string };
  /** FZ Delivery */
  fzdelivery: { token: string };
  /** GOLIVRI */
  golivri: { token: string };
  /** GS Ecommerce */
  gsecommerce: { token: string };
  /** HHD Express */
  hhdexpress: { token: string };
  /** Imir Logistics */
  imir: { token: string };
  /** Jaguar Livraison */
  jaguar: { token: string };
  /** Jo Express */
  joexpress: { token: string };
  /** LIH LIH Express */
  lihlihexpress: { token: string };
  /** Lynx Express */
  lynx: { token: string };
  /** Majorex */
  majorex: { token: string };
  /** Mazaya Logistics */
  mazaya: { token: string };
  /** Med Express */
  medexpress: { token: string };
  /** Mono Hub */
  monohub: { token: string };
  /** MSM Go */
  msmgo: { token: string };
  /** Navex Delivery */
  navexdelivery: { token: string };
  /** Negmar Express */
  negmarexpress: { token: string };
  /** OKS Box */
  oksbox: { token: string };
  /** OM Express */
  omexpress: { token: string };
  /** One Express */
  oneexpress: { token: string };
  /** On Time Express */
  ontimeexpress: { token: string };
  /** Ovred */
  ovred: { token: string };
  /** Packers */
  packers: { token: string };
  /** PDEX */
  pdex: { token: string };
  /** Prest */
  prest: { token: string };
  /** Quick Delivery DZ */
  quickdeliverydz: { token: string };
  /** RB Livraison */
  rblivraison: { token: string };
  /** Red Ex */
  redex: { token: string };
  /** Rex Livraison */
  rexlivraison: { token: string };
  /** Rihal Express */
  rihalexpress: { token: string };
  /** RJ 360 Express */
  rj360express: { token: string };
  /** RM Express */
  rmexpress: { token: string };
  /** Rocket Delivery */
  rocketdelivery: { token: string };
  /** Royaume Delivery */
  royaumedelivery: { token: string };
  /** RS Express */
  rsexpress: { token: string };
  /** Ruta Express */
  rutaexpress: { token: string };
  /** Salva Delivery */
  salvadelivery: { token: string };
  /** Samex */
  samex: { token: string };
  /** SBL Express */
  sbl: { token: string };
  /** SI Express */
  siexpress: { token: string };
  /** Speed Delivery */
  speeddelivery: { token: string };
  /** Speed Mail */
  speedmail: { token: string };
  /** Sultan Colis Express */
  sultancolisexpress: { token: string };
  /** Swift Express */
  swiftexpress: { token: string };
  /** Tawsil Star */
  tawsilstar: { token: string };
  /** TSL Express */
  tslexpress: { token: string };
  /** Ultra Express */
  ultraexpress: { token: string };
  /** Univer Delivery */
  univerdelivery: { token: string };
  /** Vitrans */
  vitrans: { token: string };
  /** Wassim Express */
  wassimexpress: { token: string };
  /** Wee Wee Delivery */
  weeweedelivery: { token: string };
  /** Win Delivery */
  windelivery: { token: string };
  /** WorldExpress */
  worldexpress: { token: string };
  /** Zinya Tec */
  zinyatec: { token: string };
}

export type CourierKey = keyof CourierCredentials;
