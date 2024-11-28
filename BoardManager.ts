import * as hz from 'horizon/core';

class BoardManager extends hz.Component<typeof BoardManager> {
    static propsDefinition = {
        ballManager: { type: hz.PropTypes.Entity },
        gun: { type: hz.PropTypes.Entity },
        boardNumber: { type: hz.PropTypes.Number },
        gameManager: { type: hz.PropTypes.Entity },
        gridTrigger: { type: hz.PropTypes.Entity },
        explosionVFX: { type: hz.PropTypes.Entity },
        spawnPoint: { type: hz.PropTypes.Entity },
        isXAxis: { type: hz.PropTypes.Boolean }
    };

    activePlayer: hz.Player | undefined
    boardArray: hz.Entity[][] = [[], [], [], [], [], [], [], [], [], []];
    vfxTime: number = 100
    initialGrid: boolean = true
    hasBall: boolean = false
    toVisit: hz.Entity[] = []
    visited: hz.Entity[] = []
    arraysToCheck: number[] = []
    newBallPool: hz.Entity[] = []
    tempBallPool: hz.Entity[] = []
    gridIndex: number = 0

    preStart() {
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Player]>("setup", [hz.PropTypes.Player]), this.setup.bind(this))
    }

    start() {
        this.activePlayer = this.entity.owner.get()
        this.entity.owner.set(this.entity.owner.get())
        this.props.explosionVFX!.owner.set(this.entity.owner.get())

        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity[]]>("readyNewBalls", [hz.PropTypes.EntityArray]), this.readyNewBalls.bind(this))
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity]>("checkProjectile", [hz.PropTypes.Entity]), this.checkProjectile.bind(this))
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[]>("getRandomBall", []), this.getRandomBall.bind(this))

        if (this.entity.owner.get() !== this.world.getServerPlayer()) {
            this.props.spawnPoint!.as(hz.SpawnPointGizmo).teleportPlayer(this.activePlayer)
            this.sendCodeBlockEvent(this.props.ballManager!, new hz.CodeBlockEvent<[hz.Entity]>('getStartingBalls', ['Entity']), this.entity)
        }
        else {
            this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity[]]>("readyNewBalls", [hz.PropTypes.EntityArray]), this.readyNewBalls.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity]>("checkProjectile", [hz.PropTypes.Entity]), this.checkProjectile.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[]>("getRandomBall", []), this.getRandomBall.bind(this)).disconnect()
        }
    }

    setup(player: hz.Player) {
        this.entity.owner.set(player)
    }

    readyNewBalls(balls: hz.Entity[]) {
        this.newBallPool = [...this.newBallPool, ...balls];
        if (this.initialGrid) {
            this.gridIndex = 0
        }
        else {
            this.gridIndex = Math.floor(Math.random() * 10);
        }
        this.addBallsToGrid(this.newBallPool)
    }

    async addBallsToGrid(balls: hz.Entity[]) {
        const yOffset = this.props.boardNumber === 4 ? 11 : 2;
        const ball = balls[0];
        let pos = new hz.Vec3(0,0,0)

        if (this.props.isXAxis) {
            pos = new hz.Vec3(
                Math.round(this.props.gridTrigger!.position.get().x),
                this.boardArray[this.gridIndex].length + yOffset,
                this.gridIndex - 5);
        }
        else {
            pos = new hz.Vec3(
                this.gridIndex - 5,
                this.boardArray[this.gridIndex].length + yOffset,
                Math.round(this.props.gridTrigger!.position.get().z));
        }

        ball.position.set(pos);
        this.boardArray[this.gridIndex].push(ball);
        await this.sleep(25)

        this.newBallPool.splice(0, 1)

        if (this.initialGrid) {
            if (this.newBallPool.length > 0) {
                this.gridIndex = (this.gridIndex + 1) % 10
                this.addBallsToGrid(this.newBallPool)
            }
            else {
                this.initialGrid = false;
                this.sendCodeBlockEvent(this.activePlayer!, new hz.CodeBlockEvent<[hz.Entity, hz.Entity, hz.Entity]>('startGame', ['Entity', 'Entity', 'Entity']), this.props.gun!, this.props.spawnPoint!, this.entity)
                this.sendCodeBlockEvent(this.props.gun!, new hz.CodeBlockEvent<[hz.Player]>('onAssignPlayer', ['Player']), this.activePlayer!)
                this.getRandomBall();
            }
        }
        else{
            if (this.newBallPool.length > 0) {
                this.gridIndex = Math.floor(Math.random() * 10);
                this.addBallsToGrid(this.newBallPool)
            }
            //else {
            //    this.getRandomBall();
            //}
        }
    }

    getRandomBall() {
        var colors: hz.Color[] = []

        for (var y = 0; y < this.boardArray.length; y++) {
            for (var z = 0; z < this.boardArray[y].length; z++) {
                if (this.boardArray[y][z] !== undefined) { colors.push(this.boardArray[y][z].as(hz.MeshEntity).style.tintColor.get()) }
            }
        }

        var rand = Math.floor(Math.random() * colors.length)
        this.sendCodeBlockEvent(this.props.gun!, new hz.CodeBlockEvent<[hz.Color]>('onSetNextBall', ['Color']), colors[rand]);
    }

    async checkProjectile(ball: hz.Entity) {
        // 1. Check for matching balls
        this.toVisit = []
        this.visited = [];
        this.tempBallPool = []
        this.toVisit.push(ball)
        this.checkIfMatchingIterative();
    }

    async explodeBalls() {
        for (var i = 0; i < this.visited.length; i++) {
            const ball = this.visited[i]
            this.props.explosionVFX!.position.set(ball.position.get())

            await this.sleep(100)
            this.props.explosionVFX!.as(hz.ParticleGizmo).play({
                fromStart: true,
                players: [this.activePlayer!],
                oneShot: true
            });
            ball.position.set(new hz.Vec3(0, 0, 0));
            await this.sleep(200)
        }

        // 3. Assign points to player
        let points = 0

        for (var i = 0; i <= this.visited.length; i++) {
            points += i + 1
        }

        points *= Math.floor(this.visited.length / 2)

        this.sendCodeBlockEvent(this.activePlayer!, new hz.CodeBlockEvent<[number]>('setPoints', ['number']), points)

        // 4. Remove matched balls from the player's grid and move above balls down
        this.UpdateGrid()
    }

    async checkIfMatchingIterative() {

        const currentBall = this.toVisit[0]

        if (!this.visited.includes(currentBall!, 0)) {
            this.visited.push(currentBall!);

            let row = 0
            let column = 0
            let color1 = currentBall!.as(hz.MeshEntity).style.tintColor.get().toString()

            for (var i = 0; i < this.boardArray.length; i++) {
                if (this.boardArray[i].find(element => element === currentBall!) !== undefined) {
                    row = this.boardArray[i].findIndex(element => element === currentBall!)
                    column = i
                }
            }

            if (row + 1 < this.boardArray[column].length && this.boardArray[column][row + 1] !== undefined) {
                let neighborTop: hz.Entity = this.boardArray[column][row + 1]
                let color2 = neighborTop.as(hz.MeshEntity).style.tintColor.get().toString()
                if (color1 === color2 && !this.visited.includes(neighborTop)) {
                    this.toVisit.push(neighborTop);
                }
            }

            if (row - 1 >= 0 && this.boardArray[column][row - 1] !== undefined) {
                let neighborBotton: hz.Entity = this.boardArray[column][row - 1]
                let color2 = neighborBotton.as(hz.MeshEntity).style.tintColor.get().toString()
                if (color1 === color2 && !this.visited.includes(neighborBotton)) {
                    this.toVisit.push(neighborBotton);
                }
            }

            if (column + 1 < 10 && this.boardArray[column + 1][row] !== undefined) {
                let neighborRight: hz.Entity = this.boardArray[column + 1][row]
                let color2 = neighborRight.as(hz.MeshEntity).style.tintColor.get().toString()
                if (color1 === color2 && !this.visited.includes(neighborRight)) {
                    this.toVisit.push(neighborRight);
                }
            }

            if (column - 1 >= 0 && this.boardArray[column - 1][row] !== undefined) {
                let neighborLeft: hz.Entity = this.boardArray[column - 1][row]
                let color2 = neighborLeft.as(hz.MeshEntity).style.tintColor.get().toString()
                if (color1 === color2 && !this.visited.includes(neighborLeft)) {
                    this.toVisit.push(neighborLeft);
                }
            }
        }
        this.toVisit.splice(0, 1)
        if (this.toVisit.length === 0) {
            this.explodeBalls()
        }
        else {
            this.checkIfMatchingIterative()
        }
    }

    async UpdateGrid() {

        const ball = this.visited[0]

        for (var i = 0; i < this.boardArray.length; i++) {
            if (this.boardArray[i].find(element => element === ball) !== undefined) {
                const index = this.boardArray[i].indexOf(ball);


                this.tempBallPool.push(ball)
                this.visited.splice(0, 1)
                this.boardArray[i].splice(index, 1)
                if (!this.arraysToCheck.includes(i)) {
                    this.arraysToCheck.push(i)
                }
                if (this.visited.length > 0) {
                    this.UpdateGrid()
                }
                else {
                    this.arraysToCheck.sort((a, b) => a - b);
                    this.moveBallsDown()
                }
                return
            }
        }
    }

    async moveBallsDown() {
        const yOffset = this.props.boardNumber === 4 ? 11 : 2;
        const index = this.arraysToCheck[0]

        for (var z = 0; z < this.boardArray[index].length; z++) {
            var pos

            if (this.props.isXAxis) {
                pos = new hz.Vec3(
                    Math.round(this.props.gridTrigger!.position.get().x),
                    z + yOffset,
                    index - 5);
            }
            else {
                pos = new hz.Vec3(
                    index - 5,
                    z + yOffset,
                    Math.round(this.props.gridTrigger!.position.get().z));
            }

            const b = this.boardArray[index][z]

            b.position.set(pos)

            await this.sleep(25)
        }

        this.arraysToCheck.splice(0, 1)

        if (this.arraysToCheck.length > 0) {
            this.moveBallsDown()
        }
        else {
            console.log("this.tempBallPool: " + this.tempBallPool.length)
            //this.readyNewBalls(this.tempBallPool)
            this.sendCodeBlockEvent(this.props.gameManager!, new hz.CodeBlockEvent<[hz.Entity, Array<hz.Entity>]>('addBalls', ['Entity', 'Array<Entity>']), this.entity, this.tempBallPool)
            this.getRandomBall();
        }
    }

    sleep(delayMS: number) {
        return new Promise((resolve) => this.async.setTimeout(resolve, delayMS))
    }
}
hz.Component.register(BoardManager);