import { z } from 'zod';

export type LeagueTier = 'BRONZE' | 'SILVER' | 'GOLD';

export const profileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(2).max(50),
  avatarUrl: z.string().url().optional(),
  favClub: z.string().min(2).max(50),
  skillLevel: z.number().int().min(1).max(5),
  homeCounty: z.string().min(2).max(50),
  lat: z.number().optional(),
  lon: z.number().optional(),
  expoPushToken: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const matchGameSchema = z.object({
  id: z.string().uuid(),
  organiserId: z.string().uuid(),
  title: z.string().min(5).max(100),
  venue: z.string().min(5).max(200),
  lat: z.number(),
  lon: z.number(),
  gameDate: z.string().datetime(),
  feeCents: z.number().int().min(0),
  capacity: z.number().int().min(2).max(22),
  status: z.enum(['OPEN', 'FULL', 'CANCELLED']),
  createdAt: z.string().datetime(),
});

export const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(50),
  managerId: z.string().uuid(),
  colours: z.string().min(3).max(50),
  leagueTier: z.enum(['BRONZE', 'SILVER', 'GOLD']),
  createdAt: z.string().datetime(),
});

export const chatSchema = z.object({
  id: z.string().uuid(),
  isGroup: z.boolean(),
  createdAt: z.string().datetime(),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string().min(1).max(1000),
  sentAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;
export type MatchGame = z.infer<typeof matchGameSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type Message = z.infer<typeof messageSchema>;