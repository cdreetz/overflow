'use client'
import React, { useState, useRef, useEffect } from "react";
import {
  Component,
  Connection,
  ConnectingState,
  DragOffset,
  ComponentProps,
} from "./types";
import InputComponent from "../components/InputComponent";
import ChatComponent from "../components/ChatComponent";

// Main application component
const App = () => {
  // State for tracking components, connections, and interaction states
  const [components, setComponents] = useState<Component[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [nextId, setNextId] = useState(1);
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Add a new component to the canvas
  const addComponent = (type: "input" | "chat") => {
    console.log(`Adding new ${type} component...`);
    
    // Create proper data structure based on component type
    const componentData = type === "input" 
      ? { value: "" } 
      : { messages: [] };
      
    const newComponent = {
      id: `component-${nextId}`,
      type,
      position: { x: 100, y: 100 + ((nextId * 30) % 300) },
      width: type === "input" ? 300 : 350,
      height: type === "input" ? 120 : 250,
      data: componentData,
    };

    console.log(`Created new ${type} component:`, JSON.stringify(newComponent));
    
    // Use functional update to ensure we have the latest state
    setComponents(prevComponents => {
      const updated = [...prevComponents, newComponent];
      console.log("New components state:", JSON.stringify(updated));
      return updated;
    });
    
    setNextId(nextId + 1);
  };

  // Handle mouse down on a component
  const handleMouseDown = (e: React.MouseEvent, component: Component): void => {
    e.stopPropagation();
    if (!canvasRef.current) return;

    const boundingRect = canvasRef.current.getBoundingClientRect();
    setDragging(component.id);
    setDragOffset({
      x: e.clientX - boundingRect.left - component.position.x,
      y: e.clientY - boundingRect.top - component.position.y,
    });
  };

  // Handle mouse move for dragging components
  const handleMouseMove = (e: React.MouseEvent): void => {
    if (dragging && canvasRef.current) {
      const boundingRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - boundingRect.left - dragOffset.x;
      const y = e.clientY - boundingRect.top - dragOffset.y;

      setComponents(
        components.map((comp) =>
          comp.id === dragging ? { ...comp, position: { x, y } } : comp,
        ),
      );
    }

    // Update connecting line position when creating a connection
    if (connecting && connecting.source) {
      setConnecting({
        ...connecting,
        mouseX:
          e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0),
        mouseY:
          e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0),
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setDragging(null);
  };

  // Start creating a connection from a component
  const startConnection = (sourceId: string) => {
    setConnecting({ source: sourceId, target: null });
  };

  // Complete a connection to a target component
  const completeConnection = (targetId: string) => {
    if (connecting && connecting.source !== targetId) {
      console.log("Completing connection from", connecting.source, "to", targetId);
      
      // Find the source and target components
      const sourceComponent = components.find(comp => comp.id === connecting.source);
      const targetComponent = components.find(comp => comp.id === targetId);
      
      // Only connect if source is input and target is chat
      if (sourceComponent?.type !== "input" || targetComponent?.type !== "chat") {
        console.log("Invalid connection: can only connect input to chat");
        setConnecting(null);
        return;
      }
      
      // Prevent duplicate connections
      const connectionExists = connections.some(
        (conn) => conn.source === connecting.source && conn.target === targetId,
      );

      if (!connectionExists) {
        const newConnection = {
          id: `conn-${connecting.source}-${targetId}`,
          source: connecting.source,
          target: targetId,
        };
        console.log("Adding new connection:", newConnection);
        setConnections([...connections, newConnection]);
      } else {
        console.log("Connection already exists");
      }
      setConnecting(null);
    }
  };

  // Cancel connection creation
  const cancelConnection = () => {
    setConnecting(null);
  };

  // Update input component value
  const updateInputValue = (componentId: string, value: string) => {
    setComponents(
      components.map((comp) =>
        comp.id === componentId
          ? { ...comp, data: { ...comp.data, value } }
          : comp,
      ),
    );
  };

  // Submit message from input component
  const submitMessage = (sourceId: string) => {
    console.log("===== SUBMIT MESSAGE START =====");
    
    // Find the input component
    const inputComponent = components.find((comp) => comp.id === sourceId);
    if (!inputComponent || inputComponent.type !== "input" || !inputComponent.data.value.trim()) {
      console.error("Invalid input component or empty message");
      return;
    }
    
    // Find connected chat components
    const connections = sourceConnections(sourceId);
    if (connections.length === 0) {
      console.error("No connections found");
      return;
    }
    
    // Create the message
    const messageText = inputComponent.data.value;
    const newMessage = {
      id: `msg-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    
    console.log("Created message:", newMessage);
    
    // Directly modify the chat components that are connected to this input
    connections.forEach(conn => {
      const targetId = conn.target;
      
      // Force a complete component state update 
      setComponents(prev => {
        return prev.map(comp => {
          // If this is the target chat component, add the message
          if (comp.id === targetId && comp.type === "chat") {
            // Create a brand new component object
            return {
              ...comp,
              data: {
                messages: [
                  ...(Array.isArray(comp.data?.messages) ? comp.data.messages : []),
                  newMessage
                ]
              }
            };
          }
          return comp;
        });
      });
    });
    
    // Clear the input value 
    setComponents(prev => {
      return prev.map(comp => {
        if (comp.id === sourceId) {
          return {
            ...comp,
            data: {
              ...comp.data,
              value: ""
            }
          };
        }
        return comp;
      });
    });
    
    console.log("===== SUBMIT MESSAGE END =====");
  };
  
  // Helper function to find connections from a source
  const sourceConnections = (sourceId: string) => {
    return connections.filter(conn => conn.source === sourceId);
  };

  // Delete a component and its connections
  const deleteComponent = (componentId: string) => {
    console.log("Deleting component:", componentId);
    console.log("Before:", components.length, "components");

    // Make a copy of the components array without the deleted component
    const updatedComponents = components.filter(
      (comp) => comp.id !== componentId,
    );

    // Make a copy of the connections array without connections to/from the deleted component
    const updatedConnections = connections.filter(
      (conn) => conn.source !== componentId && conn.target !== componentId,
    );

    console.log("After:", updatedComponents.length, "components");

    // Update state with the new arrays
    setComponents(updatedComponents);
    setConnections(updatedConnections);

    // If we're currently connecting from/to this component, cancel the connection
    if (
      connecting &&
      (connecting.source === componentId || connecting.target === componentId)
    ) {
      setConnecting(null);
    }

    // If we're currently dragging this component, stop dragging
    if (dragging === componentId) {
      setDragging(null);
    }
  };

  // Calculate connection paths
  const getConnectionPath = (source: string, target: string): string => {
    const sourceComponent = components.find((comp) => comp.id === source);
    const targetComponent = components.find((comp) => comp.id === target);

    if (!sourceComponent || !targetComponent) return "";

    const sourceX = sourceComponent.position.x + sourceComponent.width - 3;
    const sourceY = sourceComponent.position.y + 50;
    const targetX = targetComponent.position.x;
    const targetY = targetComponent.position.y + 50;

    const controlPointX = (sourceX + targetX) / 2;

    return `M ${sourceX} ${sourceY} C ${controlPointX} ${sourceY}, ${controlPointX} ${targetY}, ${targetX} ${targetY}`;
  };

  // Component wrappers for the UI

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-100 p-3 border-b">
        <h2 className="text-xl font-bold mb-2">Flow Canvas</h2>
        <div className="flex space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => addComponent("input")}
          >
            Add Input
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => addComponent("chat")}
          >
            Add Chat
          </button>
          {connecting && (
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={cancelConnection}
            >
              Cancel Connection
            </button>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-grow bg-gray-50 relative overflow-auto"
        style={{ height: "calc(100vh - 120px)" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute w-full h-full">
          {connections.map((connection) => (
            <path
              key={connection.id}
              d={getConnectionPath(connection.source, connection.target)}
              stroke="#6366f1"
              strokeWidth="3"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="cursor-pointer"
              onDoubleClick={() => {
                // Remove this connection on double click
                setConnections(connections.filter(conn => conn.id !== connection.id));
              }}
            />
          ))}

          {connecting && connecting.mouseX && connecting.mouseY && (
            <path
              d={`M ${
                components.find((comp) => comp.id === connecting.source)
                  ?.position.x +
                (components.find((comp) => comp.id === connecting.source)
                  ?.width || 0) -
                3
              } ${
                components.find((comp) => comp.id === connecting.source)
                  ?.position.y + 50
              } L ${connecting.mouseX} ${connecting.mouseY}`}
              stroke="#6366f1"
              strokeWidth="3"
              strokeDasharray="5,5"
              fill="none"
            />
          )}

          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>
        </svg>

        {components.map((component) =>
          component.type === "input" ? (
            <InputComponent
              key={component.id}
              component={component}
              handleMouseDown={handleMouseDown}
              updateInputValue={updateInputValue}
              submitMessage={submitMessage}
              startConnection={startConnection}
              deleteComponent={deleteComponent}
            />
          ) : (
            <ChatComponent
              key={component.id}
              component={component}
              handleMouseDown={handleMouseDown}
              completeConnection={completeConnection}
              connecting={connecting}
              deleteComponent={deleteComponent}
            />
          ),
        )}
      </div>

      <div className="bg-gray-100 p-2 border-t text-sm">Version 0.1.0</div>

    </div>
  );
};

export default App;
