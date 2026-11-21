import { trackEvent } from './analytics-core';

export interface ProductViewParams {
  productId: string;
  productName: string;
  price: number;
  category: string;
}

export interface CartAddParams {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export const shopAnalytics = {
  productViewed: (params: ProductViewParams) => {
    trackEvent('shop_product_viewed', {
      product_id: params.productId,
      product_name: params.productName,
      price: params.price,
      category: params.category,
    });
  },
  cartAdded: (params: CartAddParams) => {
    trackEvent('shop_cart_added', {
      product_id: params.productId,
      product_name: params.productName,
      price: params.price,
      quantity: params.quantity,
    });
  },
  cartRemoved: (productId: string, productName: string) => {
    trackEvent('shop_cart_removed', { product_id: productId, product_name: productName });
  },
  checkoutStarted: (cartValue: number, itemCount: number) => {
    trackEvent('shop_checkout_started', { cart_value: cartValue, item_count: itemCount });
  },
  orderCompleted: (orderId: string, totalValue: number, itemCount: number) => {
    trackEvent('shop_order_completed', {
      order_id: orderId,
      total_value: totalValue,
      item_count: itemCount,
    });
  },
};

export const loyaltyAnalytics = {
  pointsEarned: (points: number, reason: string, balanceAfter: number) => {
    trackEvent('loyalty_points_earned', { points, reason, balance_after: balanceAfter });
  },
  tierUpgraded: (tierName: string, totalSpend: number) => {
    trackEvent('loyalty_tier_upgraded', { tier_name: tierName, total_spend: totalSpend });
  },
  rewardUnlocked: (rewardId: string, rewardName: string, pointsCost: number) => {
    trackEvent('loyalty_reward_unlocked', {
      reward_id: rewardId,
      reward_name: rewardName,
      points_cost: pointsCost,
    });
  },
};
