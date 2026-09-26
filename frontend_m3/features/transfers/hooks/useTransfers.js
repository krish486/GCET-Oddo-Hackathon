import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchTransfers,
  fetchTransferById,
  createTransfer,
  validateTransfer,
  cancelTransfer,
  clearCurrentTransfer,
} from '../state/transferSlice';

export function useTransfers() {
  const dispatch = useDispatch();
  const { items, current, status, error } = useSelector((state) => state.transfers);

  return {
    transfers: items,
    transfer: current,
    status,
    error,
    loadTransfers: useCallback((filters) => dispatch(fetchTransfers(filters)), [dispatch]),
    loadTransfer: useCallback((id) => dispatch(fetchTransferById(id)), [dispatch]),
    addTransfer: useCallback((payload) => dispatch(createTransfer(payload)), [dispatch]),
    validate: useCallback((id) => dispatch(validateTransfer(id)), [dispatch]),
    cancel: useCallback((id) => dispatch(cancelTransfer(id)), [dispatch]),
    clearCurrent: useCallback(() => dispatch(clearCurrentTransfer()), [dispatch]),
  };
}
