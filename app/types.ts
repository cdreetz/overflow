// Component interfaces
interface Position {
  x: number;
  y: number;
}

interface BaseComponent {
  id: string;
  type: "input" | "chat";
  position: Position;
  width: number;
  height: number;
}

interface InputComponentData {
  value: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "system" | "assistant";
  timestamp: string;
}

interface ChatComponentData {
  messages: ChatMessage[];
}

interface InputComponent extends BaseComponent {
  type: "input";
  data: InputComponentData;
}

interface ChatComponent extends BaseComponent {
  type: "chat";
  data: ChatComponentData;
}

// Union type for all component types
export type Component = InputComponent | ChatComponent;

// Connection interface
export interface Connection {
  id: string;
  source: string; // Component ID
  target: string; // Component ID
}

// State for connection creation
export interface ConnectingState {
  source: string; // Component ID
  target: string | null;
  mouseX?: number;
  mouseY?: number;
}

// Props for component sub-components
export interface ComponentProps {
  component: Component;
}

// Drag offset state
export interface DragOffset {
  x: number;
  y: number;
}

// Main component props/state
interface FlowCanvasState {
  components: Component[];
  connections: Connection[];
  nextId: number;
  connecting: ConnectingState | null;
  dragging: string | null; // Component ID or null
  dragOffset: DragOffset;
}
