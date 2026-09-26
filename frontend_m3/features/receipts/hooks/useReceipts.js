import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  fetchReceipts,
  fetchReceiptById,
  createReceipt,
  validateReceipt,
  cancelReceipt,
  clearCurrentReceipt,
} from '../state/receiptSlice';

export function useReceipts() {
  const dispatch = useDispatch();
  const { items, current, status, error } = useSelector((state) => state.receipts);

  return {
    receipts: items,
    receipt: current,
    status,
    error,
    loadReceipts: useCallback((filters) => dispatch(fetchReceipts(filters)), [dispatch]),
    loadReceipt: useCallback((id) => dispatch(fetchReceiptById(id)), [dispatch]),
    addReceipt: useCallback((payload) => dispatch(createReceipt(payload)), [dispatch]),
    validate: useCallback((id) => dispatch(validateReceipt(id)), [dispatch]),
    cancel: useCallback((id) => dispatch(cancelReceipt(id)), [dispatch]),
    clearCurrent: useCallback(() => dispatch(clearCurrentReceipt()), [dispatch]),
  };
}
