import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../store/authContext";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { View, TouchableOpacity, Text, StatusBar } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { io } from "socket.io-client";
import { SOCKET_URL, API_BASE_URL } from "../config/server";
import { RealtimeProvider } from "../context/RealtimeContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/notifications?userId=${user._id}`
      );
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.emit("join", user._id);
    socket.on("notification", (notification) => {
      fetchNotifications();
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, fetchNotifications, loading }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export default function Layout() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <NotificationProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
