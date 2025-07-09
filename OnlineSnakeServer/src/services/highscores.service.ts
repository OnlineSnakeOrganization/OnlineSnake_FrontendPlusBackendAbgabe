import { db } from "../db/connection";
import { highscores } from "../db/schema";

export const getAllHighscores = async (limit = 20) => {
    return await db.query.highscores.findMany({
        orderBy: (highscores, { desc }) => [desc(highscores.score)],
        limit,
    });
};

export const addHighscore = async (newHighscore: Omit<typeof highscores.$inferInsert, 'createdAt'>) => {
    const result = await db.insert(highscores).values(newHighscore).returning();
    return result[0];
};
