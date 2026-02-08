import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Baby } from '../../types';
import { api } from '../../services/api';

interface BabiesState {
  babies: Baby[];
  selectedBaby: Baby | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BabiesState = {
  babies: [],
  selectedBaby: null,
  isLoading: false,
  error: null,
};

export const fetchBabies = createAsyncThunk('babies/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await api.getBabies();
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Error loading babies');
  }
});

export const createBaby = createAsyncThunk('babies/create', async (data: any, { rejectWithValue }) => {
  try {
    return await api.createBaby(data);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Error creating baby');
  }
});

export const fetchBabyDetail = createAsyncThunk(
  'babies/fetchDetail',
  async (babyId: string, { rejectWithValue }) => {
    try {
      return await api.getBaby(babyId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error loading baby details');
    }
  },
);

const babiesSlice = createSlice({
  name: 'babies',
  initialState,
  reducers: {
    setSelectedBaby: (state, action: PayloadAction<Baby>) => {
      state.selectedBaby = action.payload;
    },
    clearSelectedBaby: (state) => {
      state.selectedBaby = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBabies.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchBabies.fulfilled, (state, action: PayloadAction<Baby[]>) => {
      state.isLoading = false;
      state.babies = action.payload;
      if (!state.selectedBaby && action.payload.length > 0) {
        state.selectedBaby = action.payload[0];
      }
    });
    builder.addCase(fetchBabies.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(createBaby.fulfilled, (state, action: PayloadAction<Baby>) => {
      state.babies.push(action.payload);
      state.selectedBaby = action.payload;
    });

    builder.addCase(fetchBabyDetail.fulfilled, (state, action: PayloadAction<Baby>) => {
      state.selectedBaby = action.payload;
    });
  },
});

export const { setSelectedBaby, clearSelectedBaby } = babiesSlice.actions;
export default babiesSlice.reducer;
