const colyseus = require('colyseus');

const players = {};
exports.PokeWorld = class extends colyseus.Room {
    onCreate(options) {
        console.log('ON CREATE');

        this.onMessage("PLAYER_MOVED", (player, data) => {
            players[player.sessionId].x = data.x;
            players[player.sessionId].y = data.y;

            this.broadcast("PLAYER_MOVED", {
                ...players[player.sessionId],
                position: data.position
            }, { except: player });
        });

        this.onMessage("PLAYER_MOVEMENT_ENDED", (player, data) => {
            this.broadcast("PLAYER_MOVEMENT_ENDED", {
                sessionId: player.sessionId,
                map: players[player.sessionId].map,
                position: data.position
            }, { except: player });
        });

        this.onMessage("PLAYER_CHANGED_MAP", (player, data) => {
            players[player.sessionId].map = data.map;

            player.send("CURRENT_PLAYERS", { players: players });

            this.broadcast("PLAYER_CHANGED_MAP", {
                sessionId: player.sessionId,
                map: players[player.sessionId].map,
                x: 300,
                y: 75,
                players: players
            });
        });

        this.onMessage("PLAYER_CHAT", (player, data) => {
            this.broadcast("PLAYER_CHAT", {
                sessionId: player.sessionId,
                message: data.message
            }
        );
        });

        this.onMessage("NPC_CHAT", (player, data) => {
            this.broadcast("NPC_CHAT", {
                npcId: data.npcId,
                message: data.message
            });
        });

        room.onMessage("NPC_CHAT", message => {
            console.log("NPC_CHAT", message);
            displayNPCChat(message.npcId, message.message);
        });

    }

    onJoin(player, options) {
        console.log('ON JOIN');

        console.log("PLAYERS", players);

        players[player.sessionId] = {
            sessionId: player.sessionId,
            map: 'town',
            x: 352,
            y: 1216
        };

        this.broadcast("PLAYER_JOINED", { ...players[player.sessionId] }, { except: player });
        setTimeout(() => player.send("CURRENT_PLAYERS", { players: players }), 500);

        console.log("PLAYERS", players);
    }

    onLeave(player, consented) {
        console.log('ON LEAVE');

        this.broadcast("PLAYER_LEFT", { sessionId: player.sessionId, map: players[player.sessionId].map });
        delete players[player.sessionId];
    }

    onDispose() {
        console.log('ON DISPOSE');
    }
};
