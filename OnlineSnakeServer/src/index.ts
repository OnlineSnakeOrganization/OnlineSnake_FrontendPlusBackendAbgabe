import { Elysia } from "elysia";
import { corsConfig } from "./config/cors";
import { highscoresRoutes } from "./routes/highscores.route";
import { ElysiaWS } from "@elysiajs/websocket";
import MultiPlayerLogic, { Player } from "./game/MultiPlayerLogic";
import { InitResponse, MovingObstacleLoopMessage, SnakeLoopMessage, unionSchema } from "./schema/schema";
import StraightController from "./game/controllers/StraightController";

//This map consists of: ws.raw.remoteAddress, ws
let ws_map = new Map<string, ElysiaWS>;

const lobbies = new Set<MultiPlayerLogic>;
//This map consists of: ws.data.id, straightController
//(The map maps each player to its controller)
const straightControllers = new Map<string, StraightController>;

//Im pretty sure this is still optimizable
const sendUpdatesToPlayers = (updateType: "snakeLoop" | "movingObstacle") =>{
    for(let lobby of lobbies){
        const players: Map<string, Player> = lobby.getPlayers();
        let updateMessage: SnakeLoopMessage | MovingObstacleLoopMessage;
        if(updateType === "snakeLoop"){
            updateMessage = {
                    type: "snakeLoop",
                    players: Array.from(players.values()).map(player => ({
                        playerName: player.playerName,
                        snakeSegments: player.snakeSegments,
                        startColor: player.startColor,
                        endColor: player.endColor
                    })),
                    food: lobby.getFood().concat(lobby.getUnrespawnableFood())
                };
        }else{    
            updateMessage = {
                type: "movingObstacleLoop",
                movingObstacles: lobby.movingObstacles.map(obstacle => ({
                        x: obstacle.position.x,
                        y: obstacle.position.y
                    }))
            }
        }
         
        for(const [wsId, _] of players){
            let players_ws: ElysiaWS | undefined = undefined;
            for(const [_, ws] of ws_map){
                if(ws.data.id === wsId){
                    players_ws = ws;
                    break;
                }
            }
            if(players_ws){
                players_ws.send(JSON.stringify(updateMessage));
            }
        }
    }
}

const snakeInterval: NodeJS.Timeout | undefined = setInterval(()=>{
    for(let lobby of lobbies){
        lobby.snakeLoop();
    }
    sendUpdatesToPlayers("snakeLoop");
}, 125)
//This interval delay determines how fast all snakes inside all lobbies move
// 125ms means 8 times per second.

const movingObstacleInterval: NodeJS.Timeout | undefined = setInterval(()=>{
    for(let lobby of lobbies){
        lobby.movingObstacleLoop();
    }
    sendUpdatesToPlayers("movingObstacle");
}, 1000)
//This interval delay determines how fast all moving obstacles inside all lobbies move
//1000ms means once every second.

const app = new Elysia()
    .use(corsConfig)
    .use(highscoresRoutes)
    .ws('/ws', {
        open(ws){
            console.log(`-------------- Opened Connection '${ws.raw.remoteAddress}', ${ws.data.id}!`);
            const old_ws: ElysiaWS | undefined = ws_map.get(ws.raw.remoteAddress);
            if (!old_ws){
                //Add the ws to the map.
                ws_map.set(ws.raw.remoteAddress, ws);
            }else{
                //If the client is already connected (remoteAdress already exists),
                //we want to close the old connection and keep the new one.
                old_ws.close();
                ws_map.set(ws.raw.remoteAddress, ws);
            }
        },
        message(ws, message) {
            const result = unionSchema.safeParse(message);
            if(!result.success){
                //Message does not fit any of our schema
                console.log(result.error)
                return;
            }
            const msg = result.data;
            switch(msg.type){
                case "playerInitRequest":
                    //NOTE: Because we do not have a lobby system yet, we will only use the first lobby.
                    const logic: MultiPlayerLogic | undefined = lobbies.values().next().value;
                    if(logic){
                        const newPlayer = logic.addPlayer(ws.data.id, msg.playerName);
                        if(newPlayer.controller instanceof StraightController){
                            straightControllers.set(ws.data.id, newPlayer.controller);
                        }
                        const players: Player[] = Array.from(logic.getPlayers().values());
                        const responseMessage: InitResponse = {
                            type: "playerInitResponse",
                            rows: logic.rows,
                            columns: logic.columns,
                            players: players.map(player => ({
                                    playerName: player.playerName,
                                    snakeSegments: player.snakeSegments,
                                    startColor: "FF1900",
                                    endColor: "FF9100"
                                })),
                            foodPositions: logic.getFood(),
                            staticObstaclePositions: logic.staticObstacles,
                            movingObstaclePositions: logic.movingObstacles.map(obstacle => obstacle.position)
                        }
                        ws.send(JSON.stringify(responseMessage));
                    }
                    break;
                case "straightControllerMovementInputsHeld":
                    const controller: StraightController | undefined = straightControllers.get(ws.data.id);
                    if(controller){
                        controller.inputsHeld = msg.movementInputsHeld;
                    }
                    break;
                default:
                    console.error("I am not prepared to handle messages of type: ", msg.type)
            }
        },
        close(ws){
            console.log(`-------------- Connection with '${ws.raw.remoteAddress}' has been closed!`);
            const old_wso: ElysiaWS | undefined = ws_map.get(ws.raw.remoteAddress);
            if (old_wso){
                for(let lobby of lobbies){
                    const webSocketIds = Array.from(lobby.getPlayers().keys());
                    for(const wsId of webSocketIds){
                        if(wsId === ws.data.id){
                            const player: Player | undefined = lobby.getPlayers().get(wsId);
                            if(player) lobby.killPlayer(player);
                            lobby.removePlayer(wsId);
                            ws_map.delete(ws.raw.remoteAddress);
                            return;
                        }
                    }
                }
            }     
        }
    })
    .get('/', () => 'Hello World! I am the API for Snake Game Highscores!')
    .listen(3000, ({ hostname, port }) => {
        console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
    });

//NOTE: Because we do not have a lobby system yet, we will only use this lobby.
const logic = new MultiPlayerLogic(25, 30, 7, 10, 7, false, false)
lobbies.add(logic)
logic.start();

export type App = typeof app;