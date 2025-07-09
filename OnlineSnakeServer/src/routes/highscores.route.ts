import { Elysia } from "elysia";
import { createHighscore, getHighscores } from "../controllers/highscores.controller";

export const highscoresRoutes = new Elysia()
    // Removed Elysia validation, handle it in the controller
    .post('/highscores', createHighscore)
    .get('/highscores', getHighscores);