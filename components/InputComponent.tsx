import React from "react";
import { Component, ComponentProps } from "../app/types";

interface InputComponentProps extends ComponentProps {
  handleMouseDown: (e: React.MouseEvent, component: Component) => void;
  updateInputValue: (componentId: string, value: string) => void;
  submitMessage: (sourceId: string) => void;
  startConnection: (sourceId: string) => void;
  deleteComponent: (componentId: string) => void;
}

const InputComponent: React.FC<InputComponentProps> = ({
  component,
  handleMouseDown,
  updateInputValue,
  submitMessage,
  startConnection,
  deleteComponent
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage(component.id);
    }
  };

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500 absolute cursor-move flex flex-col"
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.width,
        height: component.height,
      }}
      onMouseDown={(e) => handleMouseDown(e, component)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-blue-800">Input</h3>
        <div className="flex">
          <button
            className="ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 z-10"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log("Delete button clicked for", component.id);
              deleteComponent(component.id);
            }}
          >
            X
          </button>
        </div>
      </div>

      <textarea
        className="flex-grow p-2 border rounded resize-none focus:outline-none focus:border-blue-500"
        value={component.data.value}
        onChange={(e) => updateInputValue(component.id, e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type message and press Enter to send..."
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex justify-center mt-2">
        <button
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => submitMessage(component.id)}
        >
          Send
        </button>
      </div>

      <div
        className="w-6 h-6 bg-blue-500 rounded-full absolute cursor-pointer hover:bg-blue-600 flex items-center justify-center"
        style={{ right: -10, top: 50 }}
        onClick={(e) => {
          e.stopPropagation();
          console.log("Starting connection from input:", component.id);
          startConnection(component.id);
        }}
      >
        <div className="w-4 h-0.5 bg-white absolute"></div>
        <div className="w-0.5 h-4 bg-white absolute"></div>
      </div>
    </div>
  );
};

export default InputComponent;