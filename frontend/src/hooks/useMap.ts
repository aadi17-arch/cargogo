import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from '../store';
import {
  setPickup,
  setDropoff,
  setNearbyDrivers,
  setRouteInfo,
  clearMapState,
} from '../store/map.slice';
import { LatLng } from '../types/map.types';

export const useMap = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { pickup,
    pickupAddress,
    dropoff,
    dropoffAddress,
    nearbyDrivers,
    routeCoordinates,
    distanceKm,
    durationMinutes } = useSelector((state: RootState) => state.map);

  const updatepickup = (position: LatLng, address: string) => {
    dispatch(setPickup({ position, address }));
  }
  const updateDropoff = (position: LatLng, address: string) => {
    dispatch(setDropoff({ position, address }));
  }
  const updateNearbyDrivers = (
    driver: Array<{
      id: string; lat: number; lng: number; vehicleType: string
    }>) => {
    dispatch(setNearbyDrivers(driver));
  };
  const updateRoute = (coordinates: LatLng[], distanceKm: number, durationMinutes?: number) => {
    dispatch(setRouteInfo({ coordinates, distanceKm, durationMinutes }));
  };
  const resetMap = () => {
    dispatch(clearMapState());
  };
  return {
    pickup,
    pickupAddress,
    dropoff,
    dropoffAddress,
    nearbyDrivers,
    routeCoordinates,
    distanceKm,
    durationMinutes,
    updatepickup,
    updateDropoff,
    updateNearbyDrivers,
    updateRoute,
    resetMap,
  };
};
