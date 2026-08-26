// ESM entry — re-exports the CommonJS implementation.
import dzship from './index.cjs';
export default dzship;
export const { couriers, wilayas, communes, health, DzshipError, GATEWAY } = dzship;
