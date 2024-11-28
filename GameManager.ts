import * as hz from 'horizon/core';

class GameManager extends hz.Component<typeof GameManager> {
    static propsDefinition = {
        lobbyTrigger: { type: hz.PropTypes.Entity },
        boardOne: { type: hz.PropTypes.Entity },
        boardTwo: { type: hz.PropTypes.Entity },
        boardThree: { type: hz.PropTypes.Entity },
        boardFour: { type: hz.PropTypes.Entity }
    };

    boardOneInUse: Boolean = false
    boardTwoInUse: Boolean = false
    boardThreeInUse: Boolean = false
    boardFourInUse: Boolean = false
    activeBoards: hz.Entity[] = []
    playerQueue: hz.Player[] = []
    isChecking: boolean = false

    preStart() {
        this.connectCodeBlockEvent(this.props.lobbyTrigger!, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.lobbyTriggerEnter.bind(this))
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity, hz.Entity[]]>("addBalls", [hz.PropTypes.Entity, hz.PropTypes.EntityArray]), this.addBalls.bind(this))
    }

    start() {}

    lobbyTriggerEnter(player: hz.Player) {
        console.log("Enter")
        this.playerQueue.push(player)
        this.getNextBoard()
    }

    async getNextBoard() {
        if (!this.isChecking) {
            this.isChecking = true
            let player = this.playerQueue[0]

            if (!this.boardOneInUse) {
                this.boardOneInUse = true
                this.activeBoards.push(this.props.boardOne!)
                this.sendCodeBlockEvent(this.props.boardOne!, new hz.CodeBlockEvent<[hz.Player]>('setup', ['Player']), player)
            }
            else if (!this.boardTwoInUse) {
                this.boardTwoInUse = true
                this.activeBoards.push(this.props.boardTwo!)
                this.sendCodeBlockEvent(this.props.boardTwo!, new hz.CodeBlockEvent<[hz.Player]>('setup', ['Player']), player)
            }
            else if (!this.boardThreeInUse) {
                this.boardThreeInUse = true
                this.activeBoards.push(this.props.boardThree!)
                this.sendCodeBlockEvent(this.props.boardThree!, new hz.CodeBlockEvent<[hz.Player]>('setup', ['Player']), player)
            }
            else if (!this.boardFourInUse) {
                this.boardFourInUse = true
                this.activeBoards.push(this.props.boardFour!)
                this.sendCodeBlockEvent(this.props.boardFour!, new hz.CodeBlockEvent<[hz.Player]>('setup', ['Player']), player)
            }

            await this.sleep(1000)

            this.playerQueue.shift()
            this.isChecking = false

            if (this.playerQueue.length > 0) this.getNextBoard()
        }
    }

    addBalls(board: hz.Entity, balls: hz.Entity[]) {
        if (this.activeBoards.length > 1) {
            var rand = Math.floor(Math.random() * this.activeBoards.length)

            while (this.activeBoards[rand] === board) {
                rand = Math.floor(Math.random() * this.activeBoards.length)
            }

            this.sendCodeBlockEvent(this.activeBoards[rand], new hz.CodeBlockEvent<[hz.Entity[]]>('readyNewBalls', ['Array<Entity>']), balls)
        }
        else {
            for (var i = 0; i < balls.length; i++) {
                balls[i].position.set(new hz.Vec3(0,0,0))
            }
        }
    }

    playerQuit(boardManager: hz.Entity) {
        switch (boardManager) {
            case this.props.boardOne!:
                this.boardOneInUse = false
                break
            case this.props.boardTwo!:
                this.boardTwoInUse = false
                break
            case this.props.boardThree!:
                this.boardThreeInUse = false
                break
            case this.props.boardFour!:
                this.boardFourInUse = false
                break
            default:
        }
        this.activeBoards.splice(this.activeBoards.findIndex(element => element === boardManager), 1)
    }

    sleep(delayMS: number) {
        return new Promise((resolve) => this.async.setTimeout(resolve, delayMS))
    }
}
hz.Component.register(GameManager);