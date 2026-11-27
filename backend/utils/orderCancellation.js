export const CUSTOMER_CANCELLABLE_STATUSES = Object.freeze(['pending', 'accepted']);

export function canCustomerCancelOrder(user, order) {
  return Boolean(
    user?.role === 'customer' &&
      user?.id &&
      order?.customer_id === user.id &&
      CUSTOMER_CANCELLABLE_STATUSES.includes(order?.status)
  );
}