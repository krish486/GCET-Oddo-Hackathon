import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deliveryApi } from '../api/deliveryApi';

export const fetchDeliveries = createAsyncThunk('deliveries/fetchAll', async (filters) => {
  return deliveryApi.list(filters);
});

export const fetchDeliveryById = createAsyncThunk('deliveries/fetchOne', async (id) => {
  return deliveryApi.getById(id);
});

export const createDelivery = createAsyncThunk('deliveries/create', async (payload) => {
  return deliveryApi.create(payload);
});

export const validateDelivery = createAsyncThunk('deliveries/validate', async (id) => {
  return deliveryApi.validate(id);
});

export const cancelDelivery = createAsyncThunk('deliveries/cancel', async (id) => {
  return deliveryApi.cancel(id);
});

const deliverySlice = createSlice({
  name: 'deliveries',
  initialState: {
    items: [],
    current: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentDelivery(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveries.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDeliveries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDeliveries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchDeliveryById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createDelivery.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addMatcher(
        (action) => [validateDelivery.fulfilled.type, cancelDelivery.fulfilled.type].includes(action.type),
        (state, action) => {
          const updated = action.payload;
          state.items = state.items.map((d) => (d._id === updated._id ? updated : d));
          if (state.current?._id === updated._id) state.current = updated;
        }
      );
  },
});

export const { clearCurrentDelivery } = deliverySlice.actions;
export default deliverySlice.reducer;
