import dgram from "react-native-udp";

class MulticastListener {
  constructor(multicastAddress, multicastPort) {
    this.multicastAddress = multicastAddress;
    this.multicastPort = multicastPort;
    this.server = null;
  }

  startListening(callback) {
    if (this.server) {
      console.warn("Already listening for multicast messages.");
      return;
    }
    try {
      this.server = dgram.createSocket("udp4");
    } catch (error) {
      console.warn("Error creating socket:", error);
      return;
    }
    this.server.on("listening", () => {
      try {
        this.server.addMembership(this.multicastAddress);
        const address = this.server.address();
        console.log(`Listening for multicast messages on ${this.multicastAddress}:${address.port}`);
      } catch (error) {
        console.error("Error adding membership:", error);
      }
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
    if (this.server) {
      this.server.removeAllListeners();
      this.server.close((err) => {
        if (err) {
          console.error("Error closing socket:", err);
        } else {
          console.log("Socket closed successfully.");
        }
      });
      this.server = null;
    }
  }
}

export { MulticastListener };
