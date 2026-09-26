import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchAdjustments,
  fetchAdjustmentById,
  createAdjustment,
  validateAdjustment,
  cancelAdjustment,
  clearCurrentAdjustment,
} from '../state/adjustmentSlice';

export function useAdjustments() {
  const dispatch = useDispatch();
  const { items, current, status, error } = useSelector((state) => state.adjustments);

  return {
    adjustments: items,
    adjustment: current,
    status,
    error,
    loadAdjustments: useCallback((filters) => dispatch(fetchAdjustments(filters)), [dispatch]),
    loadAdjustment: useCallback((id) => dispatch(fetchAdjustmentById(id)), [dispatch]),
    addAdjustment: useCallback((payload) => dispatch(createAdjustment(payload)), [dispatch]),
    validate: useCallback((id) => dispatch(validateAdjustment(id)), [dispatch]),
    cancel: useCallback((id) => dispatch(cancelAdjustment(id)), [dispatch]),
    clearCurrent: useCallback(() => dispatch(clearCurrentAdjustment()), [dispatch]),
  };
}
