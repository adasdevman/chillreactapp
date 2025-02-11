export enum CategoryIds {
  CHILL = 1,
  PLACE_TO_BE = 2,
  EVENT = 3
}

export const CategoryNames = {
  [CategoryIds.CHILL]: 'CHILL',
  [CategoryIds.PLACE_TO_BE]: 'PLACE TO BE',
  [CategoryIds.EVENT]: 'EVENT'
} as const; 