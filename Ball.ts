import * as hz from 'horizon/core';

class Ball extends hz.Component<typeof Ball> {

    static propsDefinition = {
        ballManager: { type: hz.PropTypes.Entity }
    };

    start() {
        this.sendCodeBlockEvent(this.props.ballManager!, new hz.CodeBlockEvent<[hz.Entity]>('addBall', ['Entity']), this.entity)
        this.entity.as(hz.MeshEntity).style.tintStrength.set(1)
        this.entity.as(hz.MeshEntity).style.brightness.set(1)
    }
}
hz.Component.register(Ball);