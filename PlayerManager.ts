import * as hz from 'horizon/core';

class PlayerManager extends hz.Component<typeof PlayerManager> {
    static propsDefinition = {
        spawnPoint: { type: hz.PropTypes.Entity },
        respawnTrigger: { type: hz.PropTypes.Entity },
        dockTrigger: { type: hz.PropTypes.Entity },
        gameManager: { type: hz.PropTypes.Entity },
        playerIndex: { type: hz.PropTypes.Number, default: 0 }
    };

    activePlayer: hz.Player | undefined
    currentPoints: number = 0
    activeGun: hz.Entity | undefined
    gameRunning: boolean = false;
    isAFK: boolean = false;
    boardSpawnPoint: hz.Entity | undefined
    boardManager: hz.Entity | undefined


    preStart() {
        this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, this.playerEnterWorld.bind(this))
    }

    start() { }

    playerEnterWorld(player: hz.Player) {
        if (player.index.get() == this.props.playerIndex) {
            this.activePlayer = player;
            this.connectCodeBlockEvent(this.props.respawnTrigger!, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.respawnPlayer.bind(this))
            this.connectCodeBlockEvent(this.props.dockTrigger!, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.respawnPlayer.bind(this))
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, this.playerExitWorld.bind(this))
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterAFK, this.playerEnterAFK.bind(this))
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitAFK, this.playerExitAFK.bind(this))
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('respawnPlayer', [hz.PropTypes.Player]), this.respawnPlayer.bind(this))
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('startGame', [hz.PropTypes.Entity, hz.PropTypes.Entity, hz.PropTypes.Entity]), this.startGame.bind(this))
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('endGame', []), this.endGame.bind(this))
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('quitGame', []), this.quitGame.bind(this))
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('setPoints', [hz.PropTypes.Number]), this.setPoints.bind(this))
        }
    }

    playerExitWorld(player: hz.Player) {
        if (player == this.activePlayer) {
            this.activePlayer = this.world.getServerPlayer()
            this.connectCodeBlockEvent(this.props.respawnTrigger!, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.respawnPlayer.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.props.dockTrigger!, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.respawnPlayer.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, this.playerExitWorld.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterAFK, this.playerEnterAFK.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitAFK, this.playerExitAFK.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('respawnPlayer', [hz.PropTypes.Player]), this.respawnPlayer.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('startGame', [hz.PropTypes.Entity, hz.PropTypes.Entity, hz.PropTypes.Entity]), this.startGame.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('endGame', []), this.endGame.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('quitGame', []), this.quitGame.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.activePlayer, new hz.CodeBlockEvent('setPoints', [hz.PropTypes.Number]), this.setPoints.bind(this)).disconnect()
        }
    }

    startGame(gun: hz.Entity, spawnPoint: hz.Entity, bm: hz.Entity) {
        this.gameRunning = true
        this.activeGun = gun
        this.boardSpawnPoint = spawnPoint
        this.boardManager = bm
    }

    setPoints(points: number) {
        this.currentPoints += points
    }

    endGame() {
        console.log("endGame")
        var playerPoints = this.world.persistentStorage.getPlayerVariable(this.activePlayer!, 'pirate_cove:playerPoints')
        var sessionPoints = this.world.persistentStorage.getPlayerVariable(this.activePlayer!, 'pirate_cove:sessionPoints')

        playerPoints += this.currentPoints

        this.world.persistentStorage.setPlayerVariable(this.activePlayer!, 'pirate_cove:playerPoints', playerPoints)
        this.world.leaderboards.setScoreForPlayer("PlayerPoints", this.activePlayer!, playerPoints, false)

        if (this.currentPoints > sessionPoints) {
            this.world.persistentStorage.setPlayerVariable(this.activePlayer!, 'pirate_cove:sessionPoints', this.currentPoints)
            this.world.leaderboards.setScoreForPlayer("SessionPoint", this.activePlayer!, this.currentPoints, false)
        }

        this.quitGame()
    }

    playerEnterAFK(player: hz.Player) {
        if (player == this.activePlayer) {
            this.isAFK = true
            this.async.setTimeout(() => { this.sendCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[]>('afk', [])) }, 5.0 * 1000)
        }
    }

    playerExitAFK(player: hz.Player) {
        this.isAFK = false
    }

    afk() {
        if (this.isAFK) this.quitGame()
    }

    respawnPlayer(player: hz.Player) {
        if (this.gameRunning) { this.boardSpawnPoint!.as(hz.SpawnPointGizmo).teleportPlayer(player) }
        else { this.props.spawnPoint?.as(hz.SpawnPointGizmo)?.teleportPlayer(player) }
    }

    quitGame() {
        console.log("quitGame")
        this.activeGun!.as(hz.GrabbableEntity).forceRelease()
        this.gameRunning = false
        this.props.spawnPoint?.as(hz.SpawnPointGizmo).teleportPlayer(this.activePlayer!)
        this.currentPoints == 0
        this.sendCodeBlockEvent(this.props.gameManager!, new hz.CodeBlockEvent<[hz.Entity]>('playerQuit', ['Entity']), this.boardManager!)
    }
}
hz.Component.register(PlayerManager);