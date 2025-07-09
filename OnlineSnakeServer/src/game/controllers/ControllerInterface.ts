import MultiPlayerLogic, { SnakeSegment } from "../MultiPlayerLogic";

export interface ControllerInterface{
    logic: MultiPlayerLogic;
    keyDownListener: (key: KeyboardEvent) => void;
    keyUpListener: (key: KeyboardEvent) => void;
    moveHead(head: SnakeSegment): void;
}