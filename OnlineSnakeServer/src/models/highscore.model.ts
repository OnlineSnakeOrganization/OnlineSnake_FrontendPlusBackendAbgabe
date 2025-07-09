import { z } from "zod";

export const HighscoreSchema = z.object({
    playerName: z.string().min(1).max(255),
    score: z.number().min(0),
    gameDuration: z.number().int().min(0),
});

export type HighscoreInput = z.infer<typeof HighscoreSchema>;