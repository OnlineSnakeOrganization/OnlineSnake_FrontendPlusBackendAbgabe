import { Context } from 'elysia';
import { HighscoreInput, HighscoreSchema } from '../models/highscore.model';
import * as highscoresService from '../services/highscores.service';
import { db } from "../db/connection";
import { highscores } from '../db/schema';
import { getTableColumns, like } from 'drizzle-orm';

export const getHighscores = async () => {
    try {
        return await highscoresService.getAllHighscores();
    } catch (error) {
        console.error('Error fetching highscores:', error);
        throw new Error('Failed to retrieve highscores');
    }
};

export const createHighscore = async ({ body, set }: Context<{ body: HighscoreInput }>) => {
    try {
        // Zod validation
        const validation = HighscoreSchema.safeParse(body);
        if (!validation.success) {
            set.status = 400;
            return {
                success: false,
                errors: validation.error.flatten().fieldErrors
            };
        }

        let responseScore;
        const old_highscore = (await db.select({...getTableColumns(highscores)}).from(highscores).where(like(highscores.playerName, validation.data.playerName)))[0]
        if(old_highscore){
            //Overwrite old highscore, if the new score is higher.
            if (old_highscore.score < validation.data.score){
                await db.update(highscores).set({score: validation.data.score, gameDuration: validation.data.gameDuration}).where(like(highscores.playerName, validation.data.playerName))
            }
            responseScore = old_highscore;
        }else{
            //If the username is new, create a new highscore.
            const newHighscore = await highscoresService.addHighscore(validation.data);
            responseScore = newHighscore;
        }

        set.status = 201;
        return {
            success: true,
            data: {
                playerName: responseScore.playerName,
                score: responseScore.score,
                gameDuration: responseScore.gameDuration,
                createdAt: responseScore.createdAt
            }
        };
    } catch (error) {
        console.error("Highscore submission error:", error);
        set.status = 500;
        return {
            success: false,
            message: "Internal server error"
        };
    }
};