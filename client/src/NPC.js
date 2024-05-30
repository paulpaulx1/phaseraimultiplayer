import Phaser from "phaser";

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);

        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);

        this.setTexture("players", "boss_front.png").setScale(1.9, 2.1);

        // NPC chat bubble
        this.chatBubble = this.scene.add.text(this.x, this.y - 45, '', {
            fontSize: '12px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setVisible(false);
    }

    showChatMessage(message) {
        this.chatBubble.setText(message).setVisible(true);

        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                this.chatBubble.setVisible(false);
            }
        });
    }

    update() {
        if (this.chatBubble.visible) {
            this.chatBubble.setPosition(this.x, this.y - 45);
        }
    }

    destroy() {
        super.destroy();
        this.chatBubble.destroy();
    }
}