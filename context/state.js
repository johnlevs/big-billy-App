import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { ParamController } from "../utils/params.js";
import { Alert } from "react-native";
import { MulticastListener } from "../utils/multicast_listener.js";
import { MULTICAST_ADDRESS, MULTICAST_PORT } from "../utils/constants.js";
import { Platform } from "react-native";

const AppStateContext = createContext();
const SOCKET_OPTIONS = {};

export const AppStateProvider = ({ children }) => {
  const [bbbParams, setParams] = useState(new ParamController());
  const [serverAddr, setServerAddr] = useState("http://192.168.4.33:3000");
  const [socket, setSocket] = useState(null);

  [isConnected, setIsConnected] = useState(false);

  const multicastListener = new MulticastListener(MULTICAST_ADDRESS, MULTICAST_PORT);

  // function to set params
  const updateParams = (key, value) => {
    // update local params
    let newParams = new ParamController();
    newParams.copyFrom(bbbParams);
    newParams.set_from_percent(key, value);

    // update state
    setParams(newParams);
  };

  // emits param change to server
  const updateClientAndServerParams = (key, value) => {
    // update local params
    updateParams(key, value);

    // update server side params
    if (socket) {
      socket.emit("paramChange", { key, value });
    } else {
      console.error("Socket not initialized");
    }
  };

  // trigger fetch if addr changes
  useEffect(() => {
    console.debug("Address changed, fetching params...");
    // change to false without triggering useEffect
    setIsConnected(false);

    // fetch params from server
    fetch(`${serverAddr}/params`, {
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
        console.debug("Updating params:", newParams);
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
  }, [serverAddr]);

  // once connected, set up web socket connection, and all socket events
  useEffect(() => {
    if (isConnected) {
      if (Platform.OS !== "web") {
        // start multicast listener
        multicastListener.startListening((message, remoteInfo) => {
          console.log("Received multicast message:", message.toString());
          const addr = message.toString().trim();
          setServerAddr(addr);
        });
      }

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
      newSocket.on("paramChange", (data) => {
        updateParams(data.key, data.value);
        console.debug("Param change from server:", data.key, data.value);
      });

      // audio data event
      newSocket.on("audioData", () => {});

      setSocket(newSocket);

      console.debug("Web Socket initialized:", newSocket);
    } else {
      if (Platform.OS !== "web") {
        multicastListener.stopListening();
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
