import * as hz from 'horizon/core';

class BallProjectile extends hz.Component<typeof BallProjectile> {
    static propsDefinition = {
        boardManager: { type: hz.PropTypes.Entity }
    };

    start() {
        const isServerPlayer = this.entity.owner.get() === this.world.getServerPlayer();

        // **Revised connection logic**: Now only one connection call for both cases
        this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnEntityCollision, this.onEntityCollision.bind(this));

        if (isServerPlayer) {
            // **Disconnect events only for server players** (as per the original logic)
            this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnEntityCollision, this.onEntityCollision.bind(this)).disconnect();
        }

        // **Consolidated visual state changes** into a single method call
        this.updateVisuals();
    }

    async onEntityCollision(collidedWith: hz.Entity, collisionAt: hz.Vec3, normal: hz.Vec3, relativeVelocity: hz.Vec3, localColliderName: string, OtherColliderName: string) {
        this.handleCollision();
        const color1: hz.Color = this.entity.as(hz.MeshEntity).style.tintColor.get()
        const color2: hz.Color = collidedWith.as(hz.MeshEntity).style.tintColor.get()

        if (color1.toString() === color2.toString()) {
            this.sendCodeBlockEvent(this.props.boardManager!, new hz.CodeBlockEvent<[hz.Entity]>('checkProjectile', ['Entity']), collidedWith)
        }
        else {
            this.sendCodeBlockEvent(this.props.boardManager!, new hz.CodeBlockEvent<[]>('getRandomBall', []));
        }        
    }

    handleCollision() {
        this.entity.collidable.set(false);
        this.entity.visible.set(false);
        this.entity.position.set(new hz.Vec3(0, -100, 0));
        this.entity.as(hz.PhysicalEntity).zeroVelocity();
    }

    // **Grouped visual property updates into a method for clarity**
    updateVisuals() {
        this.entity.as(hz.MeshEntity).style.tintStrength.set(1);
        this.entity.as(hz.MeshEntity).style.brightness.set(1);
    }
}

hz.Component.register(BallProjectile);

// import * as hz from 'horizon/core';

// class BallProjectile extends hz.Component<typeof BallProjectile> {
//     static propsDefinition = {
//         boardManager: { type: hz.PropTypes.Entity }
//     };

//     ball: hz.Entity | undefined;
//     speed: number = 15
//     dir: hz.Vec3 | undefined;
//     launched: boolean = false

//     start() {
//         if (this.entity.owner.get() != this.world.getServerPlayer()) {
//             this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnEntityCollision, this.onEntityCollision.bind(this))
//             this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity]>("setData", [hz.PropTypes.Entity]), this.setData.bind(this))
//         }
//         else {
//             this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnEntityCollision, this.onEntityCollision.bind(this)).disconnect()
//             this.connectCodeBlockEvent(this.entity, new hz.CodeBlockEvent<[hz.Entity]>("setData", [hz.PropTypes.Entity]), this.setData.bind(this)).disconnect()
//         }
//         this.entity.as(hz.MeshEntity).style.tintStrength.set(1)
//         this.entity.as(hz.MeshEntity).style.brightness.set(1)
//     }

//     onEntityCollision(collidedWith: hz.Entity, collisionAt: hz.Vec3, normal: hz.Vec3, relativeVelocity: hz.Vec3, localColliderName: string, OtherColliderName: string) {
//         this.entity.collidable.set(false)
//         this.entity.visible.set(false)
//         this.entity.position.set(new hz.Vec3(0, -100, 0))
//         this.entity.as(hz.PhysicalEntity).zeroVelocity()

//         var color1: hz.Color = this.entity.as(hz.MeshEntity).style.tintColor.get()
//         var color2: hz.Color = collidedWith.as(hz.MeshEntity).style.tintColor.get()

//         if (color1.toString() != color2.toString()) {
//             this.sendCodeBlockEvent(this.props.boardManager!, new hz.CodeBlockEvent<[]>('getRandomBall', []),)
//         }
//     }

//     setData(b: hz.Entity) {
//         this.ball = b
//         this.entity.visible.set(true)
//     }
// }
// hz.Component.register(BallProjectile);