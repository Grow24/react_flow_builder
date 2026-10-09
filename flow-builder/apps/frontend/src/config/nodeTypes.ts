import { StartNode } from '../components/nodes/StartNode';
import { DecisionNode } from '../components/nodes/DecisionNode';
import { ActionNode } from '../components/nodes/ActionNode';
import { EndNode } from '../components/nodes/EndNode';
import { ProcessNode } from '../components/nodes/ProcessNode';
import { ConnectorNode } from '../components/nodes/ConnectorNode';
import { DocumentNode } from '../components/nodes/DocumentNode';
import { DatabaseNode } from '../components/nodes/DatabaseNode';
import { InputOutputNode } from '../components/nodes/InputOutputNode';
import { AnnotationNode } from '../components/nodes/AnnotationNode';
import { GroupNode } from '../components/nodes/GroupNode';
import { TextNode } from '../components/nodes/TextNode';
import { CalloutNode } from '../components/nodes/CalloutNode';
import { ImageNode } from '../components/nodes/ImageNode';
import { ActivityNode } from '../components/nodes/ActivityNode';
import { StickyNoteNode } from '../components/nodes/StickyNoteNode';
import { TableNode as TableNodeComponent } from '../components/nodes/TableNodeEnhanced';
import { DisplayNode, FilterNode, ImportTableNode, JoinNode } from '../components/nodes/DataFlowNodes';
import React from 'react';

// Wrapper to pass id prop
const TableNode = (props: any) => React.createElement(TableNodeComponent, { id: props.id, ...props });

export const nodeTypes = {
  start: StartNode,
  decision: DecisionNode,
  action: ActionNode,
  activity: ActivityNode,
  end: EndNode,
  process: ProcessNode,
  connector: ConnectorNode,
  document: DocumentNode,
  database: DatabaseNode,
  inputoutput: InputOutputNode,
  annotation: AnnotationNode,
  group: GroupNode,
  text: TextNode,
  callout: CalloutNode,
  image: ImageNode,
  stickynote: StickyNoteNode,
  table: TableNode,
  importtable: ImportTableNode,
  filter: FilterNode,
  join: JoinNode,
  display: DisplayNode,
};