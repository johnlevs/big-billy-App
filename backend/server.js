import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { MulticastServer } from "./multicast.js";
import { bbb_params } from "../utils/params.js";

import { networkInterfaces } from "os";
import { REST_PARAMS, WEBSOCK_PARAM_UPDATE, WEBSOCK_FFT_DATA } from "../utils/constants.js";

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
app.get(REST_PARAMS, (req, res) => {
  res.json(params);
});

// API endpoint to update parameters
app.post(REST_PARAMS, (req, res) => {
  const { key, value } = req.body;
  if (params[key] !== undefined) {
    params[key] = value;
    io.emit(WEBSOCK_PARAM_UPDATE, { key, value }); // Notify clients of the update
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid parameter key" });
  }
});

let playbackInterval = null;

io.on("connection", (socket) => {
  console.log("A client connected");

  // Listen for parameter changes from the client
  socket.on(WEBSOCK_PARAM_UPDATE, ({ key, value }) => {
    if (params[key] !== undefined) {
      bbb_params.set_from_percent(key, value); // Update the parameter in the bbb_params object
      socket.broadcast.emit(WEBSOCK_PARAM_UPDATE, { key, value });
    } else {
      console.error({ success: false, error: "Invalid parameter key: " + key });
    }
  });

  socket.on(WEBSOCK_FFT_DATA, (data) => {
    // Handle the received RMS data here
    console.log("Received FFT data request:", data);
    decodeAudio(data); // Call the sendData function to read and send the MP3 file
  });

  socket.on("disconnect", () => {
    // if (playbackInterval) clearInterval(playbackInterval); // Clear the interval if it exists

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

// testing code
// const fs = require("fs");
import fs from "fs";
// const decode = require("audio-decode");
import decode from "audio-decode";
const decodeAudio = () => {
  // Read a file into a buffer
  const buffer = fs.readFileSync("Skrillex & Habstrakt - Chicken Soup.mp3");

  // Decode the buffer
  decode(buffer)
    .then((audioBuffer) => {
      console.log("Number of channels:", audioBuffer.numberOfChannels);
      console.log("Sample rate:", audioBuffer.sampleRate);
      console.log("Duration (seconds):", audioBuffer.duration);

      const pcm16Data = new Int16Array(audioBuffer.getChannelData(0).length);
      let max = 0;
      for (let i = 0; i < pcm16Data.length; i++) {
        if (Math.abs(audioBuffer.getChannelData(0)[i]) > max)
          max = Math.abs(audioBuffer.getChannelData(0)[i]);
      }
      for (let i = 0; i < pcm16Data.length; i++)
        pcm16Data[i] = Math.floor((audioBuffer.getChannelData(0)[i] / max) * 32767);

      const chunkSize = 2048 / 4;

      let currentIndex = 0;

      playbackInterval = setInterval(() => {
        if (currentIndex >= pcm16Data.length) {
          clearInterval(playbackInterval);
          console.log("Finished playback");
          return;
        }

        // Extract the current chunk
        const chunk = pcm16Data.slice(currentIndex, currentIndex + chunkSize);

        // Emit the chunk to the client
        io.emit(WEBSOCK_FFT_DATA, {
          segment: Array.from(chunk),
          sampleRate: audioBuffer.sampleRate,
        });

        currentIndex += chunkSize; // Move to the next chunk
      }, (chunkSize / audioBuffer.sampleRate) * 1000); // Convert to milliseconds
    })
    .catch((err) => {
      console.error("Failed to decode audio:", err);
    });
};
