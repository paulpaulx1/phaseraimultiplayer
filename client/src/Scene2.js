import Phaser from "phaser";
import { onlinePlayers, room } from "./SocketServer";
import OnlinePlayer from "./OnlinePlayer";
import Player from "./Player";
import NPC from "./NPC";
import { sendAIMessage } from "./chat";

let roomSessionId;
let cursors, socketKey;
let npc;

const chatToggle = document.getElementById("chat-toggle");

export class Scene2 extends Phaser.Scene {
  constructor() {
    super("playGame");
    this.npcs = {};
  }

  init(data) {
    // Map data
    this.mapName = data.map;

    // Player Texture starter position
    this.playerTexturePosition = data.playerTexturePosition;

    // Set container
    this.container = [];
  }

  create() {
    room.then((roomInstance) => {
      roomInstance.onMessage("CURRENT_PLAYERS", (data) => {
        console.log("CURRENT_PLAYERS", data);
        roomSessionId = roomInstance.sessionId;

        Object.keys(data.players).forEach((playerId) => {
          let player = data.players[playerId];

          if (playerId !== roomInstance.sessionId) {
            onlinePlayers[player.sessionId] = new OnlinePlayer({
              scene: this,
              playerId: player.sessionId,
              key: "players",
              map: player.map,
              x: player.x,
              y: player.y,
            });
          }
        });
      });

      roomInstance.onMessage("PLAYER_JOINED", (data) => {
        console.log("PLAYER_JOINED", data);

        if (!onlinePlayers[data.sessionId]) {
          onlinePlayers[data.sessionId] = new OnlinePlayer({
            scene: this,
            playerId: data.sessionId,
            key: "players",
            map: data.map,
            x: data.x,
            y: data.y,
          });
        }
      });

      roomInstance.onMessage("PLAYER_LEFT", (data) => {
        console.log("PLAYER_LEFT", data);

        if (onlinePlayers[data.sessionId]) {
          onlinePlayers[data.sessionId].destroy();
          delete onlinePlayers[data.sessionId];
        }
        console.log("onlinePlayers after player left", onlinePlayers);
      });

      roomInstance.onMessage("PLAYER_MOVED", (data) => {
        // console.log('PLAYER_MOVED', data);

        // If player is in same map
        if (this.mapName === onlinePlayers[data.sessionId].map) {
          // If player isn't registered in this scene (map changing bug..)
          if (!onlinePlayers[data.sessionId].scene) {
            onlinePlayers[data.sessionId] = new OnlinePlayer({
              scene: this,
              playerId: data.sessionId,
              key: "players",
              map: data.map,
              x: data.x,
              y: data.y,
            });
          }
          // Start animation and set sprite position
          onlinePlayers[data.sessionId].isWalking(
            data.position,
            data.x,
            data.y
          );
        }
      });

      roomInstance.onMessage("PLAYER_MOVEMENT_ENDED", (data) => {
        // If player is in same map
        if (this.mapName === onlinePlayers[data.sessionId].map) {
          // If player isn't registered in this scene (map changing bug..)
          if (!onlinePlayers[data.sessionId].scene) {
            onlinePlayers[data.sessionId] = new OnlinePlayer({
              scene: this,
              playerId: data.sessionId,
              key: "players",
              map: data.map,
              x: data.x,
              y: data.y,
            });
          }
          // Stop animation & set sprite texture
          onlinePlayers[data.sessionId].stopWalking(data.position);
        }
      });

      roomInstance.onMessage("PLAYER_CHANGED_MAP", (data) => {
        console.log("PLAYER_CHANGED_MAP", data);

        if (onlinePlayers[data.sessionId]) {
          onlinePlayers[data.sessionId].destroy();

          if (
            data.map === this.mapName &&
            !onlinePlayers[data.sessionId].scene
          ) {
            onlinePlayers[data.sessionId] = new OnlinePlayer({
              scene: this,
              playerId: data.sessionId,
              key: "players",
              map: data.map,
              x: data.x,
              y: data.y,
            });
          }
        }
      });

      // Handle chat messages
      roomInstance.onMessage("PLAYER_CHAT", (data) => {
        if (data.sessionId === roomInstance.sessionId) {
          this.player.showChatMessage(data.message);
        } else if (onlinePlayers[data.sessionId]) {
          onlinePlayers[data.sessionId].showChatMessage(data.message);
        }
      });

      roomInstance.onMessage("NPC_CHAT", (data) => {
        console.log("NPC_CHAT received", data); // Debug log
        const { response }= data;
        console.log('response message', response);
        this.npc.showChatMessage(response);
      });
    });

    this.map = this.make.tilemap({ key: this.mapName });

    console.log("this.mapName", this.mapName);
    console.log("this.map", this.map);

    // Set current map Bounds
    this.scene.scene.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = this.map.addTilesetImage(
      "tuxmon-sample-32px-extruded",
      "TilesTown"
    );

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    this.belowLayer = this.map.createLayer("Below Player", tileset, 0, 0);
    this.worldLayer = this.map.createLayer("World", tileset, 0, 0);
    this.grassLayer = this.map.createLayer("Grass", tileset, 0, 0);
    this.aboveLayer = this.map.createLayer("Above Player", tileset, 0, 0);

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    this.aboveLayer.setDepth(10);

    // Get spawn point from tiled map
    const spawnPoint = this.map.findObject(
      "SpawnPoints",
      (obj) => obj.name === "Spawn Point"
    );

    // Set player
    this.player = new Player({
      scene: this,
      worldLayer: this.worldLayer,
      key: "player",
      x: spawnPoint.x,
      y: spawnPoint.y,
    });

    const camera = this.cameras.main;
    camera.startFollow(this.player);
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    cursors = this.input.keyboard.createCursorKeys();

    this.debugGraphics();

    this.movementTimer();

    // Add NPC to the game
    this.npc = new NPC({
      scene: this,
      key: "player", // This should be the key for the NPC's sprite
      x: spawnPoint.x + 100, // Set the desired x position
      y: spawnPoint.y - 220, // Set the desired y position
    });

    this.npcs[this.npc.id] = this.npc;

    // Add interaction with NPC
    this.physics.add.overlap(
      this.player,
      this.npc,
      this.handleNPCOverlap,
      null,
      this
    );

    // Add event listener for chat input
    const chatInput = document.getElementById("chatInput");
    chatInput.addEventListener("keydown", (event) => {
      if (event.keyCode === 32) {
        chatInput.value += " ";
      }
      if (
        event.key === "Enter" &&
        document.getElementById("chat-toggle").checked
      ) {
        event.preventDefault();
        const message = chatInput.value;
        this.handleNPCInteraction(message);
        chatInput.value = "";
        this.sendMessage(message);
      }
      if (event.key === "Enter" && !document.getElementById("chat-toggle").checked) {
        this.sendMessage(chatInput.value);
        chatInput.value = "";
      }
    });
  }

  sendMessage(message) {
    this.player.showChatMessage(message);

    room.then((roomInstance) => {
      roomInstance.send("PLAYER_CHAT", {
        message: message,
      });
    });
  }

  handleNPCOverlap() {
    if (!this.npcInteracted) {
      this.npc.showChatMessage("Howdy there! How the heck are ya?");
      this.npcInteracted = true; // Set the flag to true after interaction
    }
  }

  handleNPCInteraction(message) {
    console.log('NPC ID', this.npc.id);
    if (chatToggle.checked) {
      sendAIMessage(roomSessionId, message).then((response) => {
        this.npc.showChatMessage(response);


        room.then((roomInstance) => {
          try {
            roomInstance.send("NPC_CHAT", {
              npcId: this.npc.id, // Ensure the NPC has an id if required
              message: response,
            });
          } catch (error) {
            console.log(error);
          }
          console.log("NPC_CHAT sent", message);
        });


      });
    }
  }

  update(time, delta) {
    // Loop the player update method
    this.player.update(time, delta);
    this.npc.update(); // Update the NPC

    // Horizontal movement
    if (cursors.left.isDown) {
      if (socketKey) {
        if (this.player.isMoved()) {
          room.then((roomInstance) =>
            roomInstance.send("PLAYER_MOVED", {
              position: "left",
              x: this.player.x,
              y: this.player.y,
            })
          );
        }
        socketKey = false;
      }
    } else if (cursors.right.isDown) {
      if (socketKey) {
        if (this.player.isMoved()) {
          room.then((roomInstance) =>
            roomInstance.send("PLAYER_MOVED", {
              position: "right",
              x: this.player.x,
              y: this.player.y,
            })
          );
        }
        socketKey = false;
      }
    }

    // Vertical movement
    if (cursors.up.isDown) {
      if (socketKey) {
        if (this.player.isMoved()) {
          room.then((roomInstance) =>
            roomInstance.send("PLAYER_MOVED", {
              position: "back",
              x: this.player.x,
              y: this.player.y,
            })
          );
        }
        socketKey = false;
      }
    } else if (cursors.down.isDown) {
      if (socketKey) {
        if (this.player.isMoved()) {
          room.then((roomInstance) =>
            roomInstance.send("PLAYER_MOVED", {
              position: "front",
              x: this.player.x,
              y: this.player.y,
            })
          );
        }
        socketKey = false;
      }
    }

    // Horizontal movement ended
    if (Phaser.Input.Keyboard.JustUp(cursors.left) === true) {
      room.then((roomInstance) =>
        roomInstance.send("PLAYER_MOVEMENT_ENDED", { position: "left" })
      );
    } else if (Phaser.Input.Keyboard.JustUp(cursors.right) === true) {
      room.then((roomInstance) =>
        roomInstance.send("PLAYER_MOVEMENT_ENDED", { position: "right" })
      );
    }

    // Vertical movement ended
    if (Phaser.Input.Keyboard.JustUp(cursors.up) === true) {
      room.then((roomInstance) =>
        roomInstance.send("PLAYER_MOVEMENT_ENDED", { position: "back" })
      );
    } else if (Phaser.Input.Keyboard.JustUp(cursors.down) === true) {
      room.then((roomInstance) =>
        roomInstance.send("PLAYER_MOVEMENT_ENDED", { position: "front" })
      );
    }
  }

  movementTimer() {
    setInterval(() => {
      socketKey = true;
    }, 50);
  }

  getNPCById(npcId) {
    return this.npcs[npcId];
  }

  debugGraphics() {
    // Debug graphics
    this.input.keyboard.once("keydown_D", (event) => {
      // Turn on physics debugging to show player's hitbox
      this.physics.world.createDebugGraphic();

      // Create worldLayer collision graphic above the player, but below the help text
      const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
      this.worldLayer.renderDebug(graphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
      });
    });
  }
}