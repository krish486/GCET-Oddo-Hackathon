import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchDeliveries,
  fetchDeliveryById,
  createDelivery,
  validateDelivery,
  cancelDelivery,
  clearCurrentDelivery,
} from '../state/deliverySlice';

export function useDeliveries() {
  const dispatch = useDispatch();
  const { items, current, status, error } = useSelector((state) => state.deliveries);

  return {
    deliveries: items,
    delivery: current,
    status,
    error,
    loadDeliveries: useCallback((filters) => dispatch(fetchDeliveries(filters)), [dispatch]),
    loadDelivery: useCallback((id) => dispatch(fetchDeliveryById(id)), [dispatch]),
    addDelivery: useCallback((payload) => dispatch(createDelivery(payload)), [dispatch]),
    validate: useCallback((id) => dispatch(validateDelivery(id)), [dispatch]),
    cancel: useCallback((id) => dispatch(cancelDelivery(id)), [dispatch]),
    clearCurrent: useCallback(() => dispatch(clearCurrentDelivery()), [dispatch]),
  };
}
