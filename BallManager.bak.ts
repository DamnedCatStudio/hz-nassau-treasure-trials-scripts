import * as hz from 'horizon/core';

class BallManager extends hz.Component<typeof BallManager> {
    static propsDefinition = {};

    ballsMaster: hz.Entity[] = []
    ballsTemp: hz.Entity[] = []
    colors: hz.Color[] = [new hz.Color(.35, 0, .35), new hz.Color(1, 1, 0), new hz.Color(1, 0, 0), new hz.Color(0, 0, 1), new hz.Color(0, 1, 0)]

    preStart() {
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity]>("addBall", [hz.PropTypes.Entity]), this.addBall.bind(this))
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity]>("getStartingBalls", [hz.PropTypes.Entity]), this.getStartingBalls.bind(this))
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity, hz.Color]>("getRandomBall", [hz.PropTypes.Entity, hz.PropTypes.Color]), this.getRandomBall.bind(this))
    }

    start() { }

    addBall(ball: hz.Entity) {
        this.ballsMaster.push(ball)
        this.ballsTemp.push(ball)

        var color: hz.Color

        switch (this.ballsMaster.length % 5) {
            case 0:
                color = new hz.Color(.35, 0, .35)
                break
            case 1:
                color = new hz.Color(1, 1, 0)
                break
            case 2:
                color = new hz.Color(1, 0, 0)
                break
            case 3:
                color = new hz.Color(0, 0, 1)
                break
            case 4:
                color = new hz.Color(0, 1, 0)
                break
            default:
                color = new hz.Color(1, 1, 1)
                break
        }

        ball.as(hz.MeshEntity).style.tintColor.set(color)
        ball.as(hz.MeshEntity).style.tintStrength.set(1)
        ball.as(hz.MeshEntity).style.brightness.set(1)
    }    

    getStartingBalls(board: hz.Entity) {
        var startingBalls: hz.Entity[] = []

        for (var i = 0; i < 100; i++) {
            var rand = Math.floor(Math.random() * this.ballsTemp.length)
            var ball: hz.Entity = this.ballsTemp[rand]            

            startingBalls.push(ball)
            this.ballsTemp.splice(rand, 1)
        }

        this.sendCodeBlockEvent(board, new hz.CodeBlockEvent<[hz.Entity[]]>('addBallsToGrid', ['Array<Entity>']), startingBalls)
    }

    getRandomBall(gun: hz.Entity, color: hz.Color) {
        var rand = Math.floor(Math.random() * this.ballsTemp.length)
        var ball: hz.Entity = this.ballsTemp[rand]
        this.ballsTemp.splice(rand, 1)
        ball.as(hz.MeshEntity)!.style.tintColor.set(color)
        this.sendCodeBlockEvent(gun, new hz.CodeBlockEvent<[hz.Entity]>('onSetNextBall', ['Entity']), ball)
    }
}
hz.Component.register(BallManager);