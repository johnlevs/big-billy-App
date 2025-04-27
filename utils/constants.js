const MULTICAST_PORT = 49154;
const MULTICAST_ADDRESS = "239.255.255.250";
const MULTICAST_TTL = 2; // Time to live for multicast packets
const MULTICAST_INTERVAL = 5000; // Interval for sending multicast packets in milliseconds

const WEBSOCK_PARAM_UPDATE = "paramUpdate";
const WEBSOCK_RMS_DATA = "rmsData";
const WEBSOCK_FFT_DATA = "fftData";

const REST_PARAMS = "/params";

const DISPLAY_BUFFER_SIZE = Math.pow(2, 11); // Size of the display buffer for audio data

export {
  MULTICAST_PORT,
  MULTICAST_ADDRESS,
  MULTICAST_TTL,
  MULTICAST_INTERVAL,
  WEBSOCK_PARAM_UPDATE,
  WEBSOCK_RMS_DATA,
  WEBSOCK_FFT_DATA,
  REST_PARAMS,
  DISPLAY_BUFFER_SIZE,
};
