import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DriverProfile } from '../types/driver.types';
import { Vehicle } from '../types/vehicle.types';

interface DriverState {
  profile: DriverProfile | null;
  vehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  profile: null,
  vehicle: null,
  isLoading: false,
  error: null,
};

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    driverStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchDriverProfileSuccess(state, action: PayloadAction<DriverProfile>) {
      state.isLoading = false;
      state.profile = action.payload;
    },
    updateDriverStatusSuccess(state, action: PayloadAction<DriverProfile>) {
      state.isLoading = false;
      state.profile = action.payload;
    },
    fetchVehicleSuccess(state, action: PayloadAction<Vehicle>) {
      state.isLoading = false;
      state.vehicle = action.payload;
    },
    registerVehicleSuccess(state, action: PayloadAction<Vehicle>) {
      state.isLoading = false;
      state.vehicle = action.payload;
    },
    driverFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetDriverState(state) {
      state.profile = null;
      state.vehicle = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  driverStart,
  fetchDriverProfileSuccess,
  updateDriverStatusSuccess,
  fetchVehicleSuccess,
  registerVehicleSuccess,
  driverFailure,
  resetDriverState,
} = driverSlice.actions;

export default driverSlice.reducer;
