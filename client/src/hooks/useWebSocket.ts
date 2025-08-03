import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          handler(message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          // Recreate connection
          ws.current = new WebSocket(wsUrl);
        }
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  const addMessageHandler = (type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
  };

  const removeMessageHandler = (type: string) => {
    messageHandlers.current.delete(type);
  };

  const joinLab = (labId: string) => {
    sendMessage({ type: "join_lab", labId });
  };

  const joinStandup = (standupId: string) => {
    sendMessage({ type: "join_standup", standupId });
  };

  return {
    isConnected,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    joinLab,
    joinStandup,
  };
}
