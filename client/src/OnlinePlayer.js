import Phaser from "phaser";

export default class OnlinePlayer extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.playerId);

        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.scene.physics.add.collider(this, config.worldLayer);

        this.setTexture("players", "bob_front.png").setScale(1.9, 2.1);

        this.map = config.map;
        console.log(`Map of ${config.playerId} is ${this.map}`);

        // Player Offset
        this.body.setOffset(0, 24);

        // Chat bubble
        this.chatBubble = this.scene.add.text(this.x, this.y - 45, '', {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000'
        }).setOrigin(0.5).setVisible(false);
    }

    isWalking(position, x, y) {
        // Player
        this.anims.play(`onlinePlayer-${position}-walk`, true);
        this.setPosition(x, y);

        // PlayerId
        // this.playerNickname.setPosition(this.x, this.y - 25);
        this.chatBubble.setPosition(this.x, this.y - 45);
    }

    stopWalking(position) {
        this.anims.stop();
        this.setTexture("players", `bob_${position}.png`);
    }

    showChatMessage(message) {
        this.chatBubble.setText(message).setVisible(true);

        // Hide chat bubble after 3 seconds
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                this.chatBubble.setVisible(false);
            }
        });
    }

    destroy() {
        super.destroy();
        this.chatBubble.destroy();    }
}
