const http = require("http");
const express = require("express");
const cors = require("cors");
const colyseus = require("colyseus");
const { monitor } = require("@colyseus/monitor");
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
gameServer
  .define("poke_world", PokeWorld)
  .on("create", (room) => console.log("room created:", room.roomId))
  .on("dispose", (room) => console.log("room disposed:", room.roomId))
  .on("join", (room, client) => console.log(client.id, "joined", room.roomId))
  .on("leave", (room, client) => console.log(client.id, "left", room.roomId));

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  try {
    const response = await handleMessage(sessionId, message);
    console.log(response);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register Colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor(gameServer));

gameServer.listen(port, () => {
  const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${port}`;
  console.log(`Listening on ${host}`);
});
