import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../lib/supabase';
import { MatchGame, Profile } from '@kicklink/shared';

export const api = createApi({
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Games', 'Profile'],
  endpoints: (builder) => ({
    getNearbyGames: builder.query<MatchGame[], { lat: number; lon: number; radius: number }>({
      queryFn: async ({ lat, lon, radius }) => {
        const { data, error } = await supabase
          .rpc('list_nearby_games', { lat, lon, radius_km: radius });

        if (error) return { error };
        return { data };
      },
      providesTags: ['Games'],
    }),
    getProfile: builder.query<Profile, string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) return { error };
        return { data };
      },
      providesTags: ['Profile'],
    }),
  }),
});