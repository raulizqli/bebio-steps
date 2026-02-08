import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import babiesReducer from './slices/babiesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    babies: babiesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
