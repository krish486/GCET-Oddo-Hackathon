import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transferApi } from '../api/transferApi';

export const fetchTransfers = createAsyncThunk('transfers/fetchAll', async (filters) => {
  return transferApi.list(filters);
});

export const fetchTransferById = createAsyncThunk('transfers/fetchOne', async (id) => {
  return transferApi.getById(id);
});

export const createTransfer = createAsyncThunk('transfers/create', async (payload) => {
  return transferApi.create(payload);
});

export const validateTransfer = createAsyncThunk('transfers/validate', async (id) => {
  return transferApi.validate(id);
});

export const cancelTransfer = createAsyncThunk('transfers/cancel', async (id) => {
  return transferApi.cancel(id);
});

const transferSlice = createSlice({
  name: 'transfers',
  initialState: {
    items: [],
    current: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentTransfer(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransfers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransfers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTransfers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchTransferById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addMatcher(
        (action) => [validateTransfer.fulfilled.type, cancelTransfer.fulfilled.type].includes(action.type),
        (state, action) => {
          const updated = action.payload;
          state.items = state.items.map((t) => (t._id === updated._id ? updated : t));
          if (state.current?._id === updated._id) state.current = updated;
        }
      );
  },
});

export const { clearCurrentTransfer } = transferSlice.actions;
export default transferSlice.reducer;
