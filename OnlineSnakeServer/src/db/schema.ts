import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const highscores = pgTable("highscores", {
    id: serial("id").primaryKey(),
    playerName: text("player_name").notNull(),
    score: integer("score").notNull(),
    gameDuration: integer("game_duration").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export type Highscore = typeof highscores.$inferSelect;
export type NewHighscore = typeof highscores.$inferInsert;