/**
 * Node types supported in the HBMP platform
 */
// Export metadata types
export * from './metadata';
export * from './network';

export type NodeKind = 
  | "processTask" 
  | "gateway" 
  | "event" 
  | "dataset" 
  | "report" 
  | "service" 
  | "api" 
  | "db" 
  | "queue" 
  | "widget" 
  | "lane"
  // Flow Builder node types
  | "flowStart" 
  | "flowDecision" 
  | "flowAction" 
  | "flowProcess" 
  | "flowEnd" 
  | "flowTable";

/**
 * Data structure for React Flow node data
 */
export interface RFNodeData {
  /** Display label for the node */
  label: string;
  /** Type/kind of the node */
  kind: NodeKind;
  /** Additional properties specific to node type */
  props?: Record<string, any>;
  /** Connection ports definition */
  ports?: Array<{
    id: string;
    dir: "in" | "out";
    label?: string;
  }>;
  /** Parent lane ID for swimlane layouts */
  laneId?: string;
  /** Optional rendered size for layout engines */
  width?: number;
  height?: number;
  /** Status indicator */
  status?: "ok" | "warn" | "error";
  /** Semantic metadata for the node */
  metadata?: any; // Type will be determined by NodeKind
}

/**
 * React Flow node structure
 */
export interface RFNode {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  data: RFNodeData;
  parentNode?: string;
  extent?: 'parent';
  width?: number;
  height?: number;
}

/**
 * React Flow edge structure
 */
export interface RFEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: {
    relation?: string;
    constraints?: any;
  };
  /** Waypoints for edge routing */
  points?: Array<{ x: number; y: number }>;
  /** Semantic metadata for the edge */
  metadata?: any; // EdgeMetadata type from metadata.ts
}

/**
 * Complete React Flow graph representation
 */
export interface RFGraph {
  nodes: RFNode[];
  edges: RFEdge[];
  meta?: {
    lanes?: string[];
    orientation?: "LR" | "TB" | "RL" | "BT";
  };
}

/**
 * Validation issue found in graph
 */
export interface ValidationIssue {
  /** ID of the problematic node/edge */
  id: string;
  /** Severity level */
  level: "error" | "warn" | "info";
  /** Error code for categorization */
  code: string;
  /** Human-readable message */
  message: string;
  /** Optional path to the issue */
  path?: string;
  nodeId?: string;
  edgeId?: string;
  type?: string;
}

/**
 * Request to validate a graph
 */
export interface ValidateRequest {
  graph: RFGraph;
  registryVersion: string;
}

/**
 * Response from validation
 */
export interface ValidateResponse {
  ok: boolean;
  issues: ValidationIssue[];
}

/**
 * Request to layout a graph
 */
export interface LayoutRequest {
  graph: RFGraph;
  options?: {
    laneAware?: boolean;
    orientation?: "LR" | "TB" | "RL" | "BT";
  };
}

/**
 * Response from layout operation
 */
export interface LayoutResponse {
  graph: RFGraph;
}

/**
 * Request to export a diagram
 */
export interface ExportRequest {
  diagramId: string;
  format: "svg" | "png" | "pdf";
}

/**
 * Response from export operation
 */
export interface ExportResponse {
  artifactId: string;
  contentType: string;
  size: number;
}

/**
 * Request to save a diagram
 */
export interface SaveRequest {
  projectId: string;
  diagramId?: string;
  name: string;
  kind: string;
  rf: RFGraph;
  status: "draft" | "published";
}

/**
 * Response from save operation
 */
export interface SaveResponse {
  diagramId: string;
  version: number;
}

/**
 * Response when loading a diagram
 */
export interface LoadResponse {
  rf: RFGraph;
  xml: string;
  mermaid?: string;
  meta: {
    name: string;
    version: number;
    status: string;
    kind?: string;
  };
}

/**
 * Flow execution request
 */
export interface FlowExecutionRequest {
  diagramId: string;
  inputData: Record<string, any>;
  executionMode?: "test" | "production";
}

/**
 * Flow execution response
 */
export interface FlowExecutionResponse {
  executionId: string;
  status: "running" | "completed" | "failed";
  logs: string[];
  outputData?: Record<string, any>;
  duration?: number;
}

/**
 * Audit event for tracking changes
 */
export interface AuditEventData {
  id: string;
  diagramId: string;
  actor: string;
  action: "create" | "update" | "connect" | "delete" | "validate" | "layout" | "export" | "publish" | "execute";
  payload: Record<string, any>;
  createdAt: Date;
}