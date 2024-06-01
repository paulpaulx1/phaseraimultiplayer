import * as Colyseus from "colyseus.js";

/*================================================
| Array with current online players
*/
let onlinePlayers = {};
let npc;

/*================================================
| Colyseus connection with server
*/
const isLocal = window.location.href.indexOf('localhost') > -1;

let client;
if (isLocal) {
    client = new Colyseus.Client('ws://localhost:3000' );
} else {
    client = new Colyseus.Client('wss://'+window.location.host);
}

console.log('client', client);

//
async function joinRoom() {
    try {
        const room = await client.joinOrCreate("poke_world");
        console.log(room.sessionId, "joined", room.name);
        console.log('npc',room.npc)


        // Handle receiving current players
        room.onMessage("CURRENT_PLAYERS", message => {
            console.log("CURRENT_PLAYERS", message);
            onlinePlayers = message.players;
            updateOnlinePlayers();
        });

        // Handle new player joining
        room.onMessage("PLAYER_JOINED", message => {
            console.log("PLAYER_JOINED", message);
            onlinePlayers[message.sessionId] = message;
            addOrUpdatePlayer(message.sessionId, message);
        });

        // Handle player movement
        room.onMessage("PLAYER_MOVED", message => {
            console.log("PLAYER_MOVED", message);
            if (onlinePlayers[message.sessionId]) {
                onlinePlayers[message.sessionId].x = message.x;
                onlinePlayers[message.sessionId].y = message.y;
                updatePlayerPosition(message.sessionId, message.x, message.y);
            }
        });

        // Handle player movement ending
        room.onMessage("PLAYER_MOVEMENT_ENDED", message => {
            console.log("PLAYER_MOVEMENT_ENDED", message);
            if (onlinePlayers[message.sessionId]) {
                updatePlayerPosition(message.sessionId, message.position.x, message.position.y);
            }
        });

        // Handle player changing map
        room.onMessage("PLAYER_CHANGED_MAP", message => {
            console.log("PLAYER_CHANGED_MAP", message);
            if (onlinePlayers[message.sessionId]) {
                onlinePlayers[message.sessionId].map = message.map;
                updatePlayerMap(message.sessionId, message.map);
            }
        });

        // Handle player leaving
        room.onMessage("PLAYER_LEFT", message => {
            console.log("PLAYER_LEFT", message);
            removePlayer(message.sessionId);
            delete onlinePlayers[message.sessionId];
        });

        //handle NPC chats
        room.onMessage("NPC_CHAT", message => {
            console.log('the message the message', message);
            const { npcId, message: response } = message;
            console.log("NPC_CHATksjdsfkjjas", message);
        });
        // Handle room leave
        room.onLeave(() => {
            console.log('LEFT ROOM');
        });

        return room;

    } catch (e) {
        console.log("JOIN ERROR", e);
    }
}

const room = joinRoom();

/*================================================
| Functions to update the game state
*/
function updateOnlinePlayers() {
    for (let sessionId in onlinePlayers) {
        addOrUpdatePlayer(sessionId, onlinePlayers[sessionId]);
    }
}

function addOrUpdatePlayer(sessionId, playerData) {
    // Add or update the player in the game
    console.log(`Adding/Updating player ${sessionId}`, playerData);
    // Add your game-specific logic here to add or update the player in the game
}

function updatePlayerPosition(sessionId, x, y) {
    // Update the player's position in the game
    console.log(`Updating player ${sessionId} position to (${x}, ${y})`);
    // Add your game-specific logic here to update the player's position in the game
}

function updatePlayerMap(sessionId, map) {
    // Update the player's map in the game
    console.log(`Updating player ${sessionId} map to ${map}`);
    // Add your game-specific logic here to update the player's map in the game
}

function removePlayer(sessionId) {
    // Remove the player from the game
    console.log(`Removing player ${sessionId}`);
    if (onlinePlayers[sessionId]) {
        onlinePlayers[sessionId].destroy();
        delete onlinePlayers[sessionId];
    }
    // Add your game-specific logic here to remove the player from the game
}

function displayNPCChat(npcId, message) {
    // Add your game-specific logic here to display the NPC chat message in the game
    console.log(`Displaying chat message from NPC ${npcId}: ${message}`);
    // You will need to ensure this logic updates the NPC chat bubble in the game
}

export { onlinePlayers, room };
