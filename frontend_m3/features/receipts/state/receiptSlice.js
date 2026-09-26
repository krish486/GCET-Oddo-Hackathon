import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { receiptApi } from '../api/receiptApi';

export const fetchReceipts = createAsyncThunk('receipts/fetchAll', async (filters) => {
  return receiptApi.list(filters);
});

export const fetchReceiptById = createAsyncThunk('receipts/fetchOne', async (id) => {
  return receiptApi.getById(id);
});

export const createReceipt = createAsyncThunk('receipts/create', async (payload) => {
  return receiptApi.create(payload);
});

export const validateReceipt = createAsyncThunk('receipts/validate', async (id) => {
  return receiptApi.validate(id);
});

export const cancelReceipt = createAsyncThunk('receipts/cancel', async (id) => {
  return receiptApi.cancel(id);
});

const receiptSlice = createSlice({
  name: 'receipts',
  initialState: {
    items: [],
    current: null,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearCurrentReceipt(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReceipts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchReceiptById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createReceipt.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addMatcher(
        (action) => [validateReceipt.fulfilled.type, cancelReceipt.fulfilled.type].includes(action.type),
        (state, action) => {
          const updated = action.payload;
          state.items = state.items.map((r) => (r._id === updated._id ? updated : r));
          if (state.current?._id === updated._id) state.current = updated;
        }
      );
  },
});

export const { clearCurrentReceipt } = receiptSlice.actions;
export default receiptSlice.reducer;
