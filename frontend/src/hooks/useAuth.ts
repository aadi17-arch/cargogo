import { useDispatch,useSelector } from "react-redux";
import { RootState, AppDispatch } from '../store';
import { authService } from "@/services/auth.service";
import {
  authStart,
  authSuccess,
  authFailure,
  logout as logoutAction,
  clearAuthError,
} from '@/store/auth.slice';

const getErrMsg = (err: any, fallback: string): string => {
  return err?.response?.data?.message || fallback;
};

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = async (credentials: Record<string, string>) => {
    dispatch(authStart());
    try {
      const data = await authService.login(credentials);
      dispatch(authSuccess({ user: data.user, token: data.accessToken }));
      return data.user;
    } catch (e: any) {
      dispatch(authFailure(getErrMsg(e, 'Login Failed')));
      throw e;
    }
  }
  const register = async (userData: Record<string, any>) => {
    dispatch(authStart());
    try {
      const data = await authService.register(userData);
      dispatch(authSuccess({ user: data.user, token: data.accessToken }));
      return data.user;
    } catch (e: any) {
      dispatch(authFailure(getErrMsg(e, 'Registration Failed')));
      throw e;
    }
  };
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      dispatch(logoutAction());
    }
  };
  const getProfile = async () => {
    dispatch(authStart());
    try {
      const profile = await authService.getMe();
      const storedToken = localStorage.getItem('token');
      const safeToken = (storedToken && storedToken !== 'undefined') ? storedToken : '';
      dispatch(authSuccess({ user: profile, token: safeToken }));
      return profile;
    } catch (e: any) {
      dispatch(authFailure(getErrMsg(e, 'Failed to load profile')));
      throw e;
    }
  };
  const clearError = () => {
    dispatch(clearAuthError());
  };
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    getProfile,
    clearError,
  }
};
