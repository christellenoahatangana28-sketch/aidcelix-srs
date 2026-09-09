export const AIDCELIX_MARKUP = 0.02;

export function toAidcelixPrice(medindexBase: number): number {
  return Math.round(medindexBase * (1 + AIDCELIX_MARKUP) * 100) / 100;
}

export function platformFeeFromBase(medindexBase: number, quantity = 1): number {
  return Math.round((toAidcelixPrice(medindexBase) - medindexBase) * quantity * 100) / 100;
}
