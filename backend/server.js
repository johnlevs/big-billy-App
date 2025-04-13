import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { MulticastServer } from "./multicast.js";
import { bbb_params } from "../utils/params.js";

import { networkInterfaces } from "os";

const IPV4 = () => {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        return net.address; // Return the first IPv4 address found
      }
    }
  }
};

const APP_PORT = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(json());

// Store parameters
let params = bbb_params.params();

// API endpoint to get parameters
app.get("/params", (req, res) => {
  res.json(params);
});

// API endpoint to update parameters
app.post("/params", (req, res) => {
  const { key, value } = req.body;
  if (params[key] !== undefined) {
    params[key] = value;
    io.emit("paramUpdate", { key, value }); // Notify clients of the update
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid parameter key" });
  }
});

io.on("connection", (socket) => {
  console.log("A client connected");

  // Listen for parameter changes from the client
  socket.on("paramChange", ({ key, value }) => {
    if (params[key] !== undefined) {
      bbb_params.set_from_percent(key, value); // Update the parameter in the bbb_params object
      socket.broadcast.emit("paramUpdate", { key, value });
    //   console.log({ success: true });
    //   console.debug(`Parameter ${key} updated to ${bbb_params.get(key).value}`);
    } else {
      console.error({ success: false, error: "Invalid parameter key: " + key });
    }
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

let mcast_server = new MulticastServer();
mcast_server.startAdvertisement(
  {
    type: "bbb_server",
    ip: IPV4(),
    port: APP_PORT,
  },
  5000
);

// Start the server
server.listen(APP_PORT, () => {
  console.log(`Server is running on ${IPV4()}:${APP_PORT}`);
});
