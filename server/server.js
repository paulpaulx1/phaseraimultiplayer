const http = require("http");
const express = require("express");
const cors = require("cors");
const colyseus = require("colyseus");
const monitor = require("@colyseus/monitor").monitor;
const { handleMessage } = require("./chatbot.js");

const PokeWorld = require("./rooms/PokeWorld").PokeWorld;

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new colyseus.Server({
  server: server,
});

// Register your room handlers
try {
  gameServer
    .define("poke_world", PokeWorld)
    .on("create", (room) => console.log("room created:", room.roomId))
    .on("dispose", (room) => console.log("room disposed:", room.roomId))
    .on("join", (room, client) => console.log(client.id, "joined", room.roomId))
    .on("leave", (room, client) => console.log(client.id, "left", room.roomId));
} catch (error) {
  console.error("Error registering room handlers:", error);
}

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  try {
    const response = await handleMessage(sessionId, message);
    console.log(`Chat response: ${response}`);
    res.json({ response });
  } catch (error) {
    console.error(`Error handling chat message: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Register Colyseus monitor AFTER registering your room handlers
try {
  app.use("/colyseus", monitor(gameServer));
} catch (error) {
  console.error("Error setting up Colyseus monitor:", error);
}

// Ensure the server is accessible
app.get('/health', (req, res) => {
  try {
    res.status(200).send('Server is running');
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).send('Server is not healthy');
  }
});

// Start the server
try {
  gameServer.listen(port, () => {
    console.log(`Listening on ws://localhost:${port}`);
  });
} catch (error) {
  console.error("Error starting the server:", error);
}
