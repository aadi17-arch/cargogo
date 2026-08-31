import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { driverService } from '../services/driver.service';
import {
  driverStart,
  updateDriverStatusSuccess,
  driverFailure,
} from '../store/driver.slice';
import { updateUser } from '../store/auth.slice';

const getErrMsg = (err: any, fallback: string): string => {
  return err?.response?.data?.message || fallback;
};

export const useDriverStatus = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, isLoading, error } = useSelector((state: RootState) => state.driver);
  const { user } = useSelector((state: RootState) => state.auth);

  const activeProfile = profile !== null ? profile : (user as any)?.driverProfile;
  const isOnline = Boolean(activeProfile?.isOnline);

  const updateStatus = async (status: 'ONLINE' | 'OFFLINE', latitude?: number, longitude?: number) => {
    dispatch(driverStart());
    try {
      const response = await driverService.updateOnlineStatus(status === 'ONLINE', latitude || 0, longitude || 0);
      dispatch(updateDriverStatusSuccess(response));
      if (user) {
        dispatch(updateUser({ ...user, driverProfile: response } as any));
      }
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
    profile: activeProfile,
    isOnline,
    isLoading,
    error,
    updateStatus,
    updateLocation,
  };
};
