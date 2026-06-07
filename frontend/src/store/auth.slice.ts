import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getStoredToken = () => {
  const token = localStorage.getItem('token');
  return (token && token !== 'undefined') ? token : null;
};

const initialToken = getStoredToken();

const initialState: AuthState = {
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
    },
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearAuthError(state) {
      state.error = null;
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    }
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  logout,
  clearAuthError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
