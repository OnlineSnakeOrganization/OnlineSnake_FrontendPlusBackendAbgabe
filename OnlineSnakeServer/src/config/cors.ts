import { cors } from "@elysiajs/cors";

export const corsConfig = cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
});