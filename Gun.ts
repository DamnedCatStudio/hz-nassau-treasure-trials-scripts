import * as hz from 'horizon/core';

class Gun extends hz.Component<typeof Gun> {
    static propsDefinition = {
        projectileLaunchPosition: { type: hz.PropTypes.Entity },
        projectile: { type: hz.PropTypes.Entity },
        fireSFX: { type: hz.PropTypes.Entity },
        reloadSFX: { type: hz.PropTypes.Entity },
        dryFireSFX: { type: hz.PropTypes.Entity }
    };

    loaded : boolean = false

    preStart() {
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Player]>("onAssignPlayer", [hz.PropTypes.Player]), this.onAssignPlayer.bind(this))
        this.props.projectileLaunchPosition!.as(hz.MeshEntity).style.tintStrength.set(1)
        this.props.projectileLaunchPosition!.as(hz.MeshEntity).style.brightness.set(1)
    }

    start() {
        this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnIndexTriggerDown, this.onIndexTriggerDown.bind(this))
        this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Color]>("onSetNextBall", [hz.PropTypes.Color]), this.onSetNextBall.bind(this))
        this.props.projectile!.owner.set(this.entity.owner.get())

        if (this.entity.owner.get() == this.world.getServerPlayer()) {
            this.entity.as(hz.GrabbableEntity).forceRelease()
            this.entity.position.set(new hz.Vec3(0,0,0))
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnIndexTriggerDown, this.onIndexTriggerDown.bind(this)).disconnect()
            this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Color]>("onSetNextBall", [hz.PropTypes.Color]), this.onSetNextBall.bind(this)).disconnect()
        }
    }

    onAssignPlayer(player: hz.Player) {
        if (player != this.world.getServerPlayer()) {
            this.entity.as(hz.GrabbableEntity).forceHold(player, hz.Handedness.Right, false)
        }
    }

    onIndexTriggerDown(player: hz.Player) {
        this.loaded = false
        if (this.props.projectileLaunchPosition!.visible.get()) {
            this.props.projectileLaunchPosition!.visible.set(false)
            this.props.fireSFX!.as(hz.AudioGizmo).play()

            this.props.projectile!.collidable.set(true)
            this.props.projectile!.position.set(this.props.projectileLaunchPosition!.position.get())
            this.props.projectile!.as(hz.PhysicalEntity).zeroVelocity()
            this.props.projectile!.visible.set(true)
            this.props.projectile!.as(hz.PhysicalEntity).applyForce(this.entity.forward.get().mul(15), hz.PhysicsForceMode.Impulse)
        }
        else { this.props.dryFireSFX!.as(hz.AudioGizmo).play() }
    }

    onSetNextBall(color: hz.Color) {
        if (!this.loaded) {
            this.loaded = true
            this.props.projectileLaunchPosition!.as(hz.MeshEntity).style.tintColor.set(color)
            this.props.projectile!.as(hz.MeshEntity).style.tintColor.set(color)
            this.props.projectileLaunchPosition!.visible.set(true)
            this.props.projectile!.visible.set(true);
            this.props.reloadSFX!.as(hz.AudioGizmo).play()
        }
    }
}
hz.Component.register(Gun);