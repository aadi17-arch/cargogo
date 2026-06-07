import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { driverService } from '../services/driver.service';
import {
  driverStart,
  updateDriverStatusSuccess,
  driverFailure,
} from '../store/driver.slice';

const getErrMsg = (err: any, fallback: string): string => {
  return err?.response?.data?.message || fallback;
};

export const useDriverStatus = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, isLoading, error } = useSelector(
    (state: RootState) => state.driver
  );

  const isOnline = profile?.isOnline || false;
  const updateStatus = async (status: 'ONLINE' | 'OFFLINE') => {
    dispatch(driverStart());
    try {
      const response = await driverService.updateOnlineStatus(status === 'ONLINE');
      dispatch(updateDriverStatusSuccess(response));
      return response;
    } catch (err: any) {
      dispatch(driverFailure(getErrMsg(err, 'Failed to update status')));
      throw err;
    }
  };
  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const response = await driverService.updateLocation(latitude, longitude);
      return response;
    } catch (err: any) {
      dispatch(driverFailure(getErrMsg(err, 'Failed to update location')));
      throw err;
    }
  };

  return {
    profile,
    isOnline,
    isLoading,
    error,
    updateStatus,
    updateLocation,
  };
};
