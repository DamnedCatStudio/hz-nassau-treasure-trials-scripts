 import * as hz from 'horizon/core';

 class BallManager extends hz.Component<typeof BallManager> {
     static propsDefinition = {};

     ballsMaster: hz.Entity[] = [];
     ballsTemp: hz.Entity[] = [];
     colors: hz.Color[] = [
         new hz.Color(.35, 0, .35),
         new hz.Color(1, 1, 0),
         new hz.Color(1, 0, 0),
         new hz.Color(0, 0, 1),
         new hz.Color(0, 1, 0)
     ];

     preStart() {
         this.registerEvent("addBall", [hz.PropTypes.Entity], this.addBall);
         this.registerEvent("getStartingBalls", [hz.PropTypes.Entity], this.getStartingBalls);
     }

     start() { }

     addBall(ball: hz.Entity) {
         this.ballsMaster.push(ball);
         this.ballsTemp.push(ball);

         const color = this.colors[this.ballsMaster.length % this.colors.length];
         const meshEntity = ball.as(hz.MeshEntity);
         meshEntity.style.tintColor.set(color);
         meshEntity.style.tintStrength.set(1);
         meshEntity.style.brightness.set(1);
     }

     getStartingBalls(board: hz.Entity) {
         if (this.ballsTemp.length === 0) {
             console.warn("No more balls available!");
             return;
         }

         const shuffledArray = this.shuffleArray(this.ballsTemp)
         const startingBalls = shuffledArray.splice(0, 100);
         this.ballsTemp = shuffledArray

         this.sendCodeBlockEvent(board, new hz.CodeBlockEvent<[hz.Entity[]]>('readyNewBalls', ['Array<Entity>']), startingBalls);
     }

     shuffleArray<T>(array: T[]): T[] {
         for (let i = array.length - 1; i > 0; i--) {
             const j = Math.floor(Math.random() * (i + 1));
             [array[i], array[j]] = [array[j], array[i]]; // Swap elements
         }
         return array;
     }

     registerEvent(eventName: string, array: any,  handler: Function) {
         this.connectCodeBlockEvent(
             this.entity,
             new hz.CodeBlockEvent<[hz.Entity]>(eventName, array),
             handler.bind(this)
         );
     }
 }

 hz.Component.register(BallManager);
