import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  canCustomerCancelOrder,
} from '../utils/orderCancellation.js';

const customer = { id: 'customer-1', role: 'customer' };
const ownedOrder = (status) => ({ id: 'order-1', customer_id: 'customer-1', status });

test('customer can cancel an order that is still pending', () => {
  assert.equal(canCustomerCancelOrder(customer, ownedOrder('pending')), true);
});

test('customer can cancel an order accepted by a driver before trip starts', () => {
  assert.equal(canCustomerCancelOrder(customer, ownedOrder('accepted')), true);
});

test('customer cannot cancel after driver starts the trip', () => {
  for (const status of ['on_progress', 'on_the_way', 'in_progress', 'completed']) {
    assert.equal(canCustomerCancelOrder(customer, ownedOrder(status)), false, status);
  }
});

test('customer cannot cancel another customer order', () => {
  assert.equal(
    canCustomerCancelOrder(customer, { ...ownedOrder('pending'), customer_id: 'someone-else' }),
    false,
  );
});

test('driver cannot use the customer cancellation flow', () => {
  assert.equal(
    canCustomerCancelOrder({ id: 'driver-1', role: 'driver' }, ownedOrder('accepted')),
    false,
  );
});

test('cancellable statuses stay limited to pending and accepted', () => {
  assert.deepEqual(CUSTOMER_CANCELLABLE_STATUSES, ['pending', 'accepted']);
});