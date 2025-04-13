import dgram from "react-native-udp";

class MulticastListener {
  constructor(multicastAddress, multicastPort) {
    this.multicastAddress = multicastAddress;
    this.multicastPort = multicastPort;
    this.server = dgram.createSocket("udp4");
  }

  startListening(callback) {
    this.server.on("listening", () => {
      const address = this.server.address();
      console.log(`Listening for multicast messages on ${address.address}:${address.port}`);
      this.server.addMembership(this.multicastAddress);
    });

    this.server.on("message", (message, remoteInfo) => {
      console.log(`Received message: "${message}" from ${remoteInfo.address}:${remoteInfo.port}`);
      if (callback) {
        callback(message, remoteInfo);
      }
    });

    this.server.on("error", (err) => {
      console.error("Socket error:", err);
      this.server.close();
    });

    this.server.bind(this.multicastPort);
  }

  stopListening() {
    this.server.close(() => {
      console.log("Stopped listening for multicast messages.");
    });
  }
}

export { MulticastListener };
