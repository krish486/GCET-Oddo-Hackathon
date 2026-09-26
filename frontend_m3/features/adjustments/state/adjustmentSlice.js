import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adjustmentApi } from '../api/adjustmentApi';

export const fetchAdjustments = createAsyncThunk('adjustments/fetchAll', async (filters) => {
  return adjustmentApi.list(filters);
});

export const fetchAdjustmentById = createAsyncThunk('adjustments/fetchOne', async (id) => {
  return adjustmentApi.getById(id);
});

export const createAdjustment = createAsyncThunk('adjustments/create', async (payload) => {
  return adjustmentApi.create(payload);
});

export const validateAdjustment = createAsyncThunk('adjustments/validate', async (id) => {
  return adjustmentApi.validate(id);
});

export const cancelAdjustment = createAsyncThunk('adjustments/cancel', async (id) => {
  return adjustmentApi.cancel(id);
});

const adjustmentSlice = createSlice({
  name: 'adjustments',
  initialState: {
    items: [],
    current: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentAdjustment(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdjustments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdjustments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAdjustments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchAdjustmentById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createAdjustment.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addMatcher(
        (action) => [validateAdjustment.fulfilled.type, cancelAdjustment.fulfilled.type].includes(action.type),
        (state, action) => {
          const updated = action.payload;
          state.items = state.items.map((a) => (a._id === updated._id ? updated : a));
          if (state.current?._id === updated._id) state.current = updated;
        }
      );
  },
});

export const { clearCurrentAdjustment } = adjustmentSlice.actions;
export default adjustmentSlice.reducer;
