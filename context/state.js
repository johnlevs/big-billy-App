import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Platform, Alert } from "react-native";

import { ParamController } from "@/utils/params.js";
import { MulticastListener } from "@/utils/multicast_listener.js";
import {
  MULTICAST_ADDRESS,
  MULTICAST_PORT,
  WEBSOCK_PARAM_UPDATE,
  REST_PARAMS,
  WEBSOCK_FFT_DATA,
  DISPLAY_BUFFER_SIZE,
} from "@/utils/constants.js";
import { format_fft_data, runFFT } from "@/utils/signalProcessing/fft.js";

const AppStateContext = createContext();
const SOCKET_OPTIONS = {};

export const AppStateProvider = ({ children }) => {
  const [bbbParams, setParams] = useState(new ParamController());
  const [serverAddr, setServerAddr] = useState("http://10.0.0.13:3000");
  const [socket, setSocket] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(new Int16Array(DISPLAY_BUFFER_SIZE).fill(0));
  const [FFTAvg, updateFFTAvg] = useState(new Int16Array(DISPLAY_BUFFER_SIZE).fill(0)); // Initialize with 0
  const [FFTData, setFFTDataForDisplay] = useState([{ x: 0, y: 0 }]); // Initialize with an empty array
  const [fetchTrigger, setFetchTrigger] = useState(false); // New state variable

  const animationFrameRef = useRef(null); // Ref to store the animation frame ID
  const latestBufferRef = useRef(null); // Ref to store the latest buffer

  [isConnected, setIsConnected] = useState(false);

  const multicastListener = new MulticastListener(MULTICAST_ADDRESS, MULTICAST_PORT);

  // function to set params
  const updateParams = (key, value) => {
    setParams((prevParams) => {
      const newParams = new ParamController();
      newParams.copyFrom(prevParams);
      newParams.set_from_percent(key, value);
      return newParams;
    });
  };

  // Function to manually trigger the fetch
  const triggerFetch = () => {
    setFetchTrigger((prev) => !prev); // Toggle the state to trigger useEffect
  };

  // emits param change to server
  const updateClientAndServerParams = (key, value) => {
    // update local params
    updateParams(key, value);

    // update server side params
    if (socket) {
      socket.emit(WEBSOCK_PARAM_UPDATE, { key, value });
    } else {
      console.error("Socket not initialized");
    }
  };

  // updates FFT data
  const updateFftData = (data) => {
    // cast data to signed 16 bit int
    const pcm = new Int16Array(data.segment);

    // console.log("FFT data received:", fftBuff);
    setAudioBuffer((prev = new Int16Array(DISPLAY_BUFFER_SIZE).fill(0)) => {
      const updatedBuffer = new Int16Array(DISPLAY_BUFFER_SIZE);
      const remainingSpace = Math.max(DISPLAY_BUFFER_SIZE - pcm.length, 0);
      updatedBuffer.set(prev.slice(remainingSpace), 0); // Shift the previous buffer to the left
      updatedBuffer.set(pcm, remainingSpace); // Add the new data to the end

      updateFFTAvg((prev) => {
        const alpha = 0.8; // Smoothing factor for averaging
        const updatedAvg = new Int16Array(DISPLAY_BUFFER_SIZE);
        const fftData = runFFT(updatedBuffer); // Run FFT on the updated buffer
        for (let i = 0; i < DISPLAY_BUFFER_SIZE; i++)
          updatedAvg[i] = prev[i] * (1 - alpha) + fftData[i] * alpha; // Average the values

        // Store the latest buffer in a ref
        latestBufferRef.current = updatedBuffer;

        // If no animation frame is pending, schedule one
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(() => {
            setFFTDataForDisplay(format_fft_data(updatedAvg)); // Update the FFT data for display
            animationFrameRef.current = null; // Reset the animation frame ref
          });
        }

        return updatedAvg;
      });

      // Run FFT on the updated buffer
      return updatedBuffer;
    });
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const sendPlay = () => {
    if (socket) {
      socket.emit(WEBSOCK_FFT_DATA);
    } else {
      console.error("Socket not initialized");
    }
  };

  // trigger fetch if addr changes
  useEffect(() => {
    console.debug("Address changed, fetching params...");
    // change to false without triggering useEffect
    setIsConnected(false);

    setFFTDataForDisplay({ x: 0, y: 0 }); // Reset FFT data for display

    // fetch params from server
    fetch(`${serverAddr}${REST_PARAMS}`, {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) console.log("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        const newParams = new ParamController();
        for (const key in data) {
          newParams.add_param(
            key,
            data[key].value,
            data[key].min,
            data[key].max,
            data[key].units,
            data[key].p_type
          );
        }
        setParams(newParams);
        setIsConnected(true);
        console.debug("Valid server detected, params fetched:", data);
      })
      .catch((error) => {
        console.error("Error fetching params:", error);
        Alert.alert({
          title: "Error",
          message: "Unable to connect to server. Please check the address.",
          buttons: [{ text: "OK" }],
        });
      });
  }, [serverAddr, fetchTrigger]);

  // once connected, set up web socket connection, and all socket events
  useEffect(() => {
    if (isConnected) {
      multicastListener.stopListening();

      console.debug("attempting to set up web socket connection to ", serverAddr);
      const newSocket = io(serverAddr, SOCKET_OPTIONS);

      newSocket.on("connect", () => {
        console.log("Socket connected to:", serverAddr);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        newSocket.disconnect();
        setIsConnected(false);
      });

      // param event
      newSocket.on(WEBSOCK_PARAM_UPDATE, (data) => {
        updateParams(data.key, data.value);
      });

      // audio data event
      newSocket.on(WEBSOCK_FFT_DATA, (data) => {
        // this data is received as a byte array of mono audio data
        updateFftData(data);
      });

      setSocket(newSocket);

      console.debug("Web Socket initialized:", serverAddr);
    } else {
      if (Platform.OS !== "web") {
        // start multicast listener
        multicastListener.startListening((message, remoteInfo) => {
          console.log("Received multicast message:", message.toString());
          const addr = message.toString().trim();
          setServerAddr(addr);
        });
      }
    }
    return () => {
      setIsConnected(false);
      if (socket) socket.disconnect();
    };
  }, [isConnected]);

  return (
    <AppStateContext.Provider
      value={{
        serverAddr,
        setServerAddr,
        updateClientAndServerParams,
        updateParams,
        bbbParams,
        FFTData,
        sendPlay,
        triggerFetch,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};
