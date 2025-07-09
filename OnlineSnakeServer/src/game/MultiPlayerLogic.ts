import DiagonalController from "./controllers/DiagonalController";
import StraightController from "./controllers/StraightController";
import MovingObstacle from "./MovingObstacle";
import EntityGenerator from "./EntityGenerator";

export type Player = {
    playerName: string,
    snakeSegments: SnakeSegment[],
    snakeDirection: string,
    controller: StraightController | DiagonalController,
    startColor: string,
    endColor: string
}
export type SnakeSegment = {x: number, y: number};
export type Food = {x: number, y: number};
export type Obstacle = {x: number, y: number};

class MultiPlayerLogic {
    private players: Map<string, Player>;   //wsId, Player
    private food: Food[];
    //"unrespawnableFood" is food that is generated if a snake dies. This food does not regenerate upon eating.
    private unrespawnableFood: Food[];  
    
    private maxAmountOfFood: number;
    public staticObstacles: Obstacle[];
    private amountOfStaticObstacles: number;
    public movingObstacles: MovingObstacle[];
    private amountOfMovingObstacles: number;

    public rows: number;
    public columns: number;
    public wallsAreDeadly: boolean;

    private entityGenerator: EntityGenerator;
    
    private diagonalMovementAllowed: boolean;
    constructor(
        rows: number,
        columns: number,
        maxAmountOfFood: number,
        amountOfStaticObstacles: number,
        amountOfMovingObstacles: number,
        wallsAreDeadly: boolean,
        diagonalMovementAllowed: boolean,
        
    ) {
        this.rows = rows;
        this.columns = columns;
        this.wallsAreDeadly = wallsAreDeadly;

        this.maxAmountOfFood = maxAmountOfFood;
        this.amountOfStaticObstacles = amountOfStaticObstacles;
        this.amountOfMovingObstacles = amountOfMovingObstacles;
        this.entityGenerator = new EntityGenerator(this);
        
        //We already refresh theese variables in the start method but we still have to initialize them in the constructor.
        this.diagonalMovementAllowed = diagonalMovementAllowed;
        this.players = new Map<string, Player>;
        this.food = [];
        this.unrespawnableFood = [];
        this.staticObstacles = [];
        this.movingObstacles = []
    }

    //----------Getter
    public getPlayers(){
        return this.players;
    }

    public getFood(){
        return this.food;
    }

    public getUnrespawnableFood(){
        return this.unrespawnableFood;
    }

    public getAmountOfMovingObstacles(): number{
        return this.amountOfMovingObstacles;
    }

    public getMaxAmountOfFood(): number{
        return this.maxAmountOfFood;
    }

    public getAmountOfStaticObstacles(): number{
        return this.amountOfStaticObstacles;
    }
    //----------

    //Initializes the game.
    public start(): void {
        // Resetting all Game-Variables
        this.food = [];
        this.staticObstacles = [];
        this.movingObstacles = [];

        this.entityGenerator.generateObstacles();
        this.entityGenerator.generateMovingObstacles();
        this.entityGenerator.generateFood();
    }

    //Each time this method is invoked, one game tick gets calculated.
    //We invoke this method every 125ms using a 
    public snakeLoop = (): void => {
        for (const [_, player] of this.players) {
            const head = {...player.snakeSegments[0]};
            if(head){
                //Move player's head
                player.controller.moveHead(head);
                //Add it to the front of the snake
                player.snakeSegments.unshift(head);
            }
        }
        
        for (const [_, player] of this.players) {
            if (this.isGoingToDie(player.snakeSegments)) {
                this.killPlayer(player);
            } else {
                const head = player.snakeSegments[0];
                if(!head) return;   //Players that just died have no snakeSegments and therefore no "head"

                //Check if the snake ate food
                let justAteFood: boolean = false;
                for (let i = 0; i < this.food.length; i++) {
                    if (head.x === this.food[i].x && head.y === this.food[i].y) {
                        justAteFood = true;
                        this.food = this.food.filter(food => !(food.x === head.x && food.y === head.y));
                        break;
                    }
                }
                //Check if the snake ate unrespawnableFood
                for(const unresFood of this.unrespawnableFood){
                    if (head.x === unresFood.x && head.y === unresFood.y) {
                        justAteFood = true;
                        this.unrespawnableFood = this.unrespawnableFood.filter(food => !(food.x === head.x && food.y === head.y));
                        break;
                    }
                }
                if (justAteFood === true) {
                    this.entityGenerator.generateFood();
                } else {
                    player.snakeSegments.pop(); // Remove the tail if no food is eaten
                }
            }
        }
    }

    public killPlayer(player: Player){
        //We will replace every third (excluding the head) snakeSegment with unrespawnableFood.
        const newUnrespawnableFood = player.snakeSegments.filter((_, idx) => idx % 3 === 0 && idx !== 0);
        newUnrespawnableFood.forEach(unresFood => this.unrespawnableFood.push(unresFood));
        player.snakeSegments = [] //Remove all snakeSegments

        //Respawn the Snake after 2 Seconds.
        setTimeout(()=>{
            console.log(`🐦‍🔥 Respawned Player '${player.playerName}'!`);
            player.snakeSegments = [{x:0, y:0}];
        }, 2000)
        console.log(`💀 Player '${player.playerName}' died...`);
    }

    //Builds a new Player Object and adds it to the player set. Also returns the new player
    public addPlayer(wsId: string, playerName: string): Player{
        const head: SnakeSegment = {x: 0, y: 0}
        let thePlayersController: StraightController | DiagonalController;
        if(this.diagonalMovementAllowed)    thePlayersController = new DiagonalController(this);
        else                                thePlayersController = new StraightController(this);
        const newPlayer: Player = {
            playerName: playerName,
            snakeSegments: [head],
            snakeDirection: "UP",
            controller: thePlayersController,
            startColor: this.getRandomHexColor(),
            endColor: this.getRandomHexColor()
        };
        thePlayersController.setPlayer(newPlayer);
        this.players.set(wsId, newPlayer);
        console.log(`👋 Welcome! Player '${newPlayer.playerName}' joined.`);
        return newPlayer;
    }

    public removePlayer(wsId: string){
        this.players.delete(wsId);
        console.log(`🚪🚶 Goodbye! Player '${this.players.get(wsId)?.playerName || "Unknown"}' left the game.`)
    }

    public getAllSnakeSegments(){
        return Array.from(this.players.values()).flatMap(player => player.snakeSegments);
    }

    //This function moves all movable obstacles by one block
    public movingObstacleLoop = (): void => {
        for(const obstacle of this.movingObstacles){
            obstacle.moveObstacle();
        }
    }
    
    // This method just checks if both SnakeSegment Arrays a and b are the same content wise.
    private segmentsEqual(a:SnakeSegment[], b: SnakeSegment[]) {
        if (a.length !== b.length) return false;
        return a.every((seg, i) => seg.x === b[i].x && seg.y === b[i].y);
    }

    //Checks if the snake is going to die (by checking if the head is going to collide with anything that is deadly).
    private isGoingToDie = (snakeSegments: SnakeSegment[]): boolean =>{
        const head = snakeSegments[0];

        // Check wall collision
        if (head.x < 0 || head.y < 0 || head.x >= this.columns || head.y >= this.rows) return true;

        // Check self collision
        for (let i = 1; i < snakeSegments.length-1; i++){
            // Skip the first segment because we don't compare the head to itself
            // Skip the last segment because it will move out of the way in the same tick.
            if (head.x === snakeSegments[i].x && head.y === snakeSegments[i].y)return true;
        }

        // Check staticObstacle collision
        for (const staticObstacle of this.staticObstacles){
            if (head.x === staticObstacle.x && head.y === staticObstacle.y) return true;
        }

        // Check movingObstacle collision
        for (const movingObstacle of this.movingObstacles){
            if (head.x === movingObstacle.position.x && head.y === movingObstacle.position.y) return true;
        }

        // Check collision with other snakes
        const snakeSegmentsWithoutTheLast = snakeSegments.slice(0, -1); // Skip the last segment of any snake because it will move out of the way in the same tick.
        const otherSnakeSegments = Array.from(this.players.values())
            .map(player => (player.snakeSegments.slice(0, -1)))         // Skip the last segment... for the same reason.
            .filter(otherSegments => !this.segmentsEqual(otherSegments, snakeSegmentsWithoutTheLast)) //We skip checking the snake against itself, because we already did that before.
            .flat();
        for (let i = 0; i < otherSnakeSegments.length; i++){
            if (head.x === otherSnakeSegments[i].x && head.y === otherSnakeSegments[i].y) return true;
        }

        return false;
    }

    private getRandomHexColor(): string {
        const hex = Math.floor(Math.random() * 0xffffff)  // Max 16777215
            .toString(16)
            .toUpperCase()
            .padStart(6, '0');  // Falls führende 0en nötig sind
        return hex;
    }
}
export default MultiPlayerLogic;
