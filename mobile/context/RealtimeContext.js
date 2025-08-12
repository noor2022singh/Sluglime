import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/server";
import { useAuth } from "../store/authContext";
import { ToastAndroid, Platform } from "react-native";
import {
  debounce,
  throttle,
  optimizePostUpdate,
} from "../utils/realtimeOptimizer";

const RealtimeContext = createContext();

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  const [postUpdates, setPostUpdates] = useState({});

  const connectSocket = () => {
    if (!user) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join", user._id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socket.on("post_updated", (data) => {
      setPostUpdates((prev) => ({
        ...prev,
        [data.postId]: {
          likes: data.likes,
          shares: data.shares,
          comments: data.comments,
          timestamp: Date.now(),
        },
      }));
    });

    const debouncedPostUpdate = debounce((data, updateType) => {
      setPostUpdates((prev) => {
        const currentUpdate = prev[data.postId] || {};
        const newUpdate = {
          ...currentUpdate,
          [updateType]: data[updateType],
          timestamp: Date.now(),
        };

        if (
          JSON.stringify(currentUpdate[updateType]) !==
          JSON.stringify(newUpdate[updateType])
        ) {
          return {
            ...prev,
            [data.postId]: newUpdate,
          };
        }
        return prev;
      });
    }, 100);

    socket.on("post_liked", (data) => {
      debouncedPostUpdate(data, "likes");
      debouncedPostUpdate({ liked: data.liked }, "liked");
    });

    socket.on("comment_added", (data) => {
      debouncedPostUpdate(data, "comments");
    });

    socket.on("post_shared", (data) => {
      debouncedPostUpdate(data, "shares");
    });

    const throttledSetOnlineUsers = throttle(setOnlineUsers, 500);

    socket.on("online_users", (users) => {
      throttledSetOnlineUsers(users);
    });

    socket.on("user_status_change", (data) => {
      throttledSetOnlineUsers((prev) => {
        if (data.online) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    const debouncedSetTypingUsers = debounce(setTypingUsers, 200);

    socket.on("user_typing", (data) => {
      debouncedSetTypingUsers((prev) => ({
        ...prev,
        [data.senderId]: data.isTyping,
      }));
    });

    socket.on("new_message", (message) => {
      if (Platform.OS === "android") {
        ToastAndroid.show("New message received!", ToastAndroid.SHORT);
      }
    });

    return socket;
  };

  const emitPostAction = useCallback(
    throttle((action, data) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(action, data);
      }
    }, 200),
    [isConnected]
  );

  const emitTyping = useCallback(
    debounce((receiverId, isTyping) => {
      if (socketRef.current && isConnected && user) {
        socketRef.current.emit("typing", {
          senderId: user._id,
          receiverId,
          isTyping,
        });
      }
    }, 300),
    [isConnected, user]
  );

  const getPostUpdate = useCallback(
    (postId) => {
      return optimizePostUpdate(postUpdates, postId);
    },
    [postUpdates]
  );

  const clearPostUpdate = useCallback((postId) => {
    setPostUpdates((prev) => {
      const newUpdates = { ...prev };
      delete newUpdates[postId];
      return newUpdates;
    });
  }, []);

  useEffect(() => {
    if (user) {
      const socket = connectSocket();
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [user]);

  const value = {
    isConnected,
    onlineUsers,
    typingUsers,
    emitPostAction,
    emitTyping,
    getPostUpdate,
    clearPostUpdate,
    socket: socketRef.current,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
