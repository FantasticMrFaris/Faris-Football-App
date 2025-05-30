import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '@kicklink/shared';

interface AuthState {
  session: any | null;
  profile: Profile | null;
  loading: boolean;
}

const initialState: AuthState = {
  session: null,
  profile: null,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<any>) => {
      state.session = action.payload;
    },
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.session = null;
      state.profile = null;
    },
  },
});

export const { setSession, setProfile, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;