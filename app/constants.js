// constants/pricing.ts
export const MEAL_PRICES = {
  500: 53,
  600: 56,
  700: 60,
  800: 63,
};

export const SNACK_PRICE = 12;
export const BAG_FEE_PER_DAY = 0.6;
// constants/pricing.js
export const PRICING_CONFIG = {
  // Pricing based on calorie tier
  meals: {
    400: 50.00,
    500: 53.00,
    600: 56.00,
    700: 60.00,
    800: 63.00,
  },
  // Discount per meal slot
  discounts: {
    meal1: 0,      // 0%
    meal2: 0.20,   // 20%
    meal3: 0.30,   // 30%
    meal4: 0.30,   // 30%
    meal5: 0.30,   // 30%
  },
  snackPrice: 12.00,
  bagFeePerDay: 0.60
};
export const LOOKUP_TABLE = {
  // Prices from Column F
  mealPrices: {
    200: 12.00,
    400: 49.00,
    500: 53.00,
    600: 56.00,
    700: 60.00,
    800: 63.00,
  },
  // Discount Meals (%) from Column G
  mealDiscounts: [0, 20, 30, 60, 60], 
  // Days Discount values from Column I
  dayDiscounts: { 5: 0, 6: 60, 7: 60 },
  // Week disc value from Column K
  weekDiscounts: { 1: 0, 2: 0, 4: 7.5 },
  // Snack Disc % from Column M
  snackDiscounts: { 1: 20, 2: 30, 3: 40, 4: 40, 5: 40 },
  bagFee: 0.60 // Column F
};