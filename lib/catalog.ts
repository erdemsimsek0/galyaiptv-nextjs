export type PlanId = 'max' | 'sports' | 'cinema';
export type DeviceCount = 1 | 2 | 3;

export interface CouponDefinition {
  code: string;
  label: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  expiresAt?: number;
  minMonths?: number;
  allowedPlans?: PlanId[];
  allowedDevices?: DeviceCount[];
  description?: string;
}

export interface PricingConfig {
  prices: Record<PlanId, number>;
  deviceMultipliers: Record<DeviceCount, number>;
  coupons: CouponDefinition[];
  updatedAt?: number;
}

export const DEFAULT_PRICES: Record<PlanId, number> = {
  max: 229.9,
  sports: 159.9,
  cinema: 129.9,
};

export const DEFAULT_DEVICE_MULTIPLIERS: Record<DeviceCount, number> = {
  1: 1,
  2: 1.6,
  3: 2.2,
};

export const DEFAULT_COUPONS: CouponDefinition[] = [
  {
    code: 'HOSGELDIN10',
    label: 'Yeni müşteri indirimi',
    type: 'percent',
    value: 10,
    active: true,
    minMonths: 3,
    description: 'İlk alışverişe özel %10 indirim.',
  },
  {
    code: 'AILE150',
    label: 'Aile paketi indirimi',
    type: 'fixed',
    value: 150,
    active: true,
    allowedDevices: [2, 3],
    minMonths: 6,
    description: '2 veya 3 cihazlı paketlerde 150 TL indirim.',
  },
];

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  prices: DEFAULT_PRICES,
  deviceMultipliers: DEFAULT_DEVICE_MULTIPLIERS,
  coupons: DEFAULT_COUPONS,
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isCouponActive(coupon: CouponDefinition, now = Date.now()): boolean {
  return coupon.active && (!coupon.expiresAt || coupon.expiresAt > now);
}

export function calculateDiscountedMonthly(basePrice: number, durationDiscount: number) {
  return basePrice * (1 - durationDiscount / 100);
}

export function calculatePlanTotal(basePrice: number, months: number, durationDiscount: number, multiplier: number) {
  return Math.round(calculateDiscountedMonthly(basePrice, durationDiscount) * months * multiplier * 100) / 100;
}

export function applyCouponDiscount(total: number, coupon: CouponDefinition) {
  if (coupon.type === 'percent') {
    return Math.round(total * (coupon.value / 100) * 100) / 100;
  }
  return Math.min(total, Math.round(coupon.value * 100) / 100);
}

export function validateCoupon(
  coupon: CouponDefinition,
  payload: { planId: PlanId; months: number; devices: DeviceCount; now?: number },
): string | null {
  const now = payload.now ?? Date.now();
  if (!isCouponActive(coupon, now)) return 'Kupon aktif değil veya süresi dolmuş.';
  if (coupon.minMonths && payload.months < coupon.minMonths) {
    return `Bu kupon en az ${coupon.minMonths} aylık paketlerde geçerlidir.`;
  }
  if (coupon.allowedPlans && !coupon.allowedPlans.includes(payload.planId)) {
    return 'Bu kupon seçilen pakette geçerli değil.';
  }
  if (coupon.allowedDevices && !coupon.allowedDevices.includes(payload.devices)) {
    return 'Bu kupon seçilen cihaz sayısında geçerli değil.';
  }
  return null;
}
