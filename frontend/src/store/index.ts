import { configureStore } from "@reduxjs/toolkit";
import authReducer from './auth.slice';
import bookingReducer from './booking.slice';
import driverReducer from './driver.slice';
import mapReducer from './map.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    driver: driverReducer,
    map: mapReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
