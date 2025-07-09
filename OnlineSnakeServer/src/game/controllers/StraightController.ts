import { ControllerInterface } from "./ControllerInterface";
import MultiPlayerLogic, { Player, SnakeSegment } from "../MultiPlayerLogic";

class StraightController //implements ControllerInterface
{
    private player: Player | undefined; //The Player this controller belongs to.
    public logic: MultiPlayerLogic;
    public inputsHeld: string[];

    constructor(logic: MultiPlayerLogic) {
        this.player = undefined;
        this.logic = logic;
        this.inputsHeld = [];
    }

    public setPlayer(player: Player){
        this.player = player;
    }

    public moveHead(head: SnakeSegment) {
        if(!this.player) return;

        this.setSnakeDirectionToLatestInputIfPossible();

        const snakeDirection = this.player.snakeDirection;
        if (snakeDirection === 'UP') head.y -= 1;
        if (snakeDirection === 'DOWN') head.y += 1;
        if (snakeDirection === 'LEFT') head.x -= 1;
        if (snakeDirection === 'RIGHT') head.x += 1;

        if(!this.logic.wallsAreDeadly){
            //This makes the head appear on the other side of the map if it creeps into a wall.
            head.x = (head.x + this.logic.columns) % this.logic.columns;
            head.y = (head.y + this.logic.rows) % this.logic.rows;
        }
    }

    private setSnakeDirectionToLatestInputIfPossible(){
        if(!this.player) return;

        const newDirection: string | undefined = this.inputsHeld[0];
        if(newDirection){
            switch(this.player.snakeDirection){
                case "UP":
                    if(newDirection !== "DOWN"){
                        this.player.snakeDirection = newDirection;
                    }
                    break;
                case "DOWN":
                    if(newDirection !== "UP"){
                        this.player.snakeDirection = newDirection;
                    }
                    break;
                case "LEFT":
                    if(newDirection !== "RIGHT"){
                        this.player.snakeDirection = newDirection;
                    }
                    break;
                case "RIGHT":
                    if(newDirection !== "LEFT"){
                        this.player.snakeDirection = newDirection;
                    }
                    break;
            }
        }
    }

}

export default StraightController;