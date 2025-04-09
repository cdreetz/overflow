import React, { useRef, useEffect, useState } from "react";
import { Component, ComponentProps, ConnectingState } from "../app/types";
import { CoreMessage } from "ai";

interface ChatComponentProps extends ComponentProps {
  handleMouseDown: (e: React.MouseEvent, component: Component) => void;
  completeConnection: (targetId: string) => void;
  connecting: ConnectingState | null;
  deleteComponent: (componentId: string) => void;
  updateComponent?: (updatedComponent: Component) => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  component,
  handleMouseDown,
  connecting,
  completeConnection,
  deleteComponent,
  updateComponent,
}) => {
  if (component.type !== "chat") {
    console.error("Expected chat component, got:", component.type);
    return null;
  }

  // Safety check for messages
  if (!component.data) {
    console.error("Chat component has no data:", component);
    component.data = { messages: [] };
  }

  if (!Array.isArray(component.data.messages)) {
    console.error("Chat component messages is not an array:", component.data);
    component.data.messages = [];
  }

  const messagesCount = component.data.messages?.length || 0;
  console.log(
    `Rendering chat component ${component.id} with ${messagesCount} messages:`,
    JSON.stringify(component.data.messages),
  );

  // Debug
  console.log("Complete component data:", JSON.stringify(component));

  const chatRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [processingMessage, setProcessingMessage] = useState(false);

  // Add this to track which messages we've already processed
  const [processedMessages, setProcessedMessages] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    console.log("==== CHAT COMPONENT EFFECT TRIGGERED ====");
    console.log("Messages in effect:", JSON.stringify(component.data.messages));
    console.log("Messages count:", component.data.messages?.length);

    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
      console.log("Scrolled to bottom, height:", chatRef.current.scrollHeight);
    }

    // The dependency is just component - React will detect changes to the entire object
  }, [component]);

  useEffect(() => {
    // Process new user messages through AI SDK
    const processNewMessage = async () => {
      // Only process if we have messages and we can update the component
      if (
        !component.data.messages ||
        !component.data.messages.length ||
        !updateComponent ||
        processingMessage
      ) {
        return;
      }

      // Look at the last message
      const lastMessage =
        component.data.messages[component.data.messages.length - 1];
      const isUserMessage =
        lastMessage.role === "user" || lastMessage.sender === "user";

      // Create a unique ID for the message to track if we've processed it
      const messageKey = JSON.stringify(lastMessage);

      // Only process new user messages that we haven't processed yet
      if (isUserMessage && !processedMessages.has(messageKey)) {
        setProcessingMessage(true);

        try {
          // Mark this message as processed
          setProcessedMessages((prev) => {
            const newSet = new Set(prev);
            newSet.add(messageKey);
            return newSet;
          });

          // Convert messages to CoreMessage format
          const coreMessages = component.data.messages.map((msg) => ({
            role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
            content: msg.content || msg.text || "",
          }));

          // Call the API
          const response = await fetch("/api/completion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: coreMessages }),
          });

          const responseData = await response.json();
          console.log("AI API response:", responseData);

          if (responseData.text) {
            // Create an assistant message with the response
            const assistantMessage = {
              role: "assistant",
              content: responseData.text,
            };

            // Add the assistant message to the chat
            updateComponent({
              ...component,
              data: {
                ...component.data,
                messages: [...component.data.messages, assistantMessage],
              },
            });
          }
        } catch (error) {
          console.error("Error processing message with AI:", error);
        } finally {
          setProcessingMessage(false);
        }
      }
    };

    processNewMessage();
  }, [
    component.data.messages,
    updateComponent,
    processingMessage,
    processedMessages,
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing && updateComponent) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;

        const newWidth = Math.max(200, initialSize.width + dx);
        const newHeight = Math.max(150, initialSize.height + dy);

        const updatedComponent = {
          ...component,
          width: newWidth,
          height: newHeight,
        };

        updateComponent(updatedComponent);
      }
    };

    const handleMouseUp = () => {
      if (resizing) {
        setResizing(false);
      }
    };

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, resizeStart, initialSize, component, updateComponent]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: component.width, height: component.height });
  };

  const resetStyles = {
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border-2 border-blue-500 absolute cursor-move flex flex-col"
      style={{
        ...resetStyles,
        left: component.position.x,
        top: component.position.y,
        width: component.width,
        height: component.height,
      }}
      onMouseDown={(e) => handleMouseDown(e, component)}
    >
      {/* Chat Messages Container */}
      <div
        ref={chatRef}
        className="flex-grow p-4 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-blue-800 mb-3">Chat</h3>

        <div className="flex-grow flex flex-col">
          {processingMessage && (
            <div className="text-blue-500 text-center my-2">Processing...</div>
          )}

          {!component.data.messages || component.data.messages.length === 0 ? (
            <div className="text-gray-500 text-center my-auto">
              No messages yet
            </div>
          ) : (
            // Force a re-render by adding the key prop to this div
            <div key={`messages-${component.data.messages.length}`}>
              {component.data.messages.map((message, index) => {
                // Determine if message is from user or assistant
                const isUser =
                  "sender" in message
                    ? message.sender === "user"
                    : message.role === "user";

                // Get the message content
                const content =
                  "text" in message ? message.text : message.content;

                return (
                  <div
                    key={`msg-${index}`}
                    className={`p-3 rounded-lg mb-4 ${
                      isUser
                        ? "bg-blue-400 text-white ml-auto"
                        : "bg-gray-200 text-gray-800"
                    }`}
                    style={{ maxWidth: "80%" }}
                  >
                    {content || "No message content"}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-start p-4">
        <button
          className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            deleteComponent(component.id);
          }}
        >
          X
        </button>
      </div>

      {/* Connection node on left side */}
      <div
        className="w-6 h-6 bg-blue-500 rounded-full absolute cursor-pointer hover:bg-blue-600 flex items-center justify-center"
        style={{ left: -10, top: 50 }}
        onClick={(e) => {
          e.stopPropagation();
          console.log("Chat connection node clicked");
          if (connecting && connecting.source) {
            console.log("Completing connection to chat:", component.id);
            completeConnection(component.id);
          }
        }}
      >
        {connecting && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="w-6 h-6 absolute cursor-nwse-resize flex items-center justify-center"
        style={{
          right: 0,
          bottom: 0,
          background: "transparent",
        }}
        onMouseDown={handleResizeStart}
      >
        <div className="w-4 h-4 bg-blue-500 rounded-sm hover:bg-blue-600 transform rotate-45"></div>
      </div>
    </div>
  );
};

export default ChatComponent;
