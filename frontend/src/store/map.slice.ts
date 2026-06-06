import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLng } from '../types/map.types';

interface MapState {
  pickup: LatLng | null;
  pickupAddress: string;
  dropoff: LatLng | null;
  dropoffAddress: string;
  nearbyDrivers: Array<{ id: string; lat: number; lng: number; vehicleType: string }>;
  routeCoordinates: LatLng[];
  distanceKm: number;
  durationMinutes: number;
}

const initialState: MapState = {
  pickup: null,
  pickupAddress: '',
  dropoff: null,
  dropoffAddress: '',
  nearbyDrivers: [],
  routeCoordinates: [],
  distanceKm: 0,
  durationMinutes: 0,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setPickup(state, action: PayloadAction<{ position: LatLng; address: string }>) {
      state.pickup = action.payload.position;
      state.pickupAddress = action.payload.address;
    },
    setDropoff(state, action: PayloadAction<{ position: LatLng; address: string }>) {
      state.dropoff = action.payload.position;
      state.dropoffAddress = action.payload.address;
    },
    setNearbyDrivers(
      state,
      action: PayloadAction<Array<{ id: string; lat: number; lng: number; vehicleType: string }>>
    ) {
      state.nearbyDrivers = action.payload;
    },
    setRouteInfo(
      state,
      action: PayloadAction<{ coordinates: LatLng[]; distanceKm: number; durationMinutes?: number }>
    ) {
      state.routeCoordinates = action.payload.coordinates;
      state.distanceKm = action.payload.distanceKm;
      state.durationMinutes = action.payload.durationMinutes || 0;
    },
    clearMapState(state) {
      state.pickup = null;
      state.pickupAddress = '';
      state.dropoff = null;
      state.dropoffAddress = '';
      state.nearbyDrivers = [];
      state.routeCoordinates = [];
      state.distanceKm = 0;
      state.durationMinutes = 0;
    },
  },
});

export const {
  setPickup,
  setDropoff,
  setNearbyDrivers,
  setRouteInfo,
  clearMapState,
} = mapSlice.actions;

export default mapSlice.reducer;
