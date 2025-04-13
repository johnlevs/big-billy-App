import dgram from "dgram";
import {
  MULTICAST_TTL,
  MULTICAST_ADDRESS,
  MULTICAST_PORT,
  MULTICAST_INTERVAL,
} from "../utils/constants.js";

class MulticastServer {
  constructor(multicastAddress = MULTICAST_ADDRESS, multicastPort = MULTICAST_PORT) {
    this.multicastAddress = multicastAddress;
    this.multicastPort = multicastPort;
    this.server = dgram.createSocket("udp4");
  }

  startAdvertisement(message, interval = MULTICAST_INTERVAL) {
    this.server.bind(() => {
      this.server.setBroadcast(true);
      this.server.setMulticastTTL(MULTICAST_TTL);
      this.server.addMembership(this.multicastAddress);

      console.log(`Multicast server started on ${this.multicastAddress}:${this.multicastPort}`);
    });

    this.advertisementInterval = setInterval(() => {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.server.send(
        messageBuffer,
        0,
        messageBuffer.length,
        this.multicastPort,
        this.multicastAddress,
        (err) => {
          if (err) {
            console.error("Error sending multicast message:", err);
          } else {
            console.log("Multicast message sent:", message);
          }
        }
      );
    }, interval);
  }

  stopAdvertisement() {
    if (this.advertisementInterval) {
      clearInterval(this.advertisementInterval);
      this.advertisementInterval = null;
      console.log("Multicast advertisement stopped.");
    }
    this.server.close(() => {
      console.log("Multicast server closed.");
    });
  }
}


export { MulticastServer };
