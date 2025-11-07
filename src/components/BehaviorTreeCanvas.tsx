import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button, message, Modal } from 'antd';
import { 
  ClockCircleOutlined,
  SettingOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  SwapOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import BehaviorTreeNodePropertyPanel from '../pages/ScheduleManagement/BehaviorTree/BehaviorTreeNodePropertyPanel';

// 统一的节点类型定义（与AddBehaviorTree.tsx保持一致）
type NodeType = 'start' | 'end' | 'stage' | 'businessProcess' | 'sequence' | 'parallel' | 'condition' | 'inverter' | 'repeat';

// 连接点接口
interface ConnectionPoint {
  id: string;
  type: 'input' | 'output';
  position: { x: number; y: number };
  connected: boolean;
  label?: string;
  nodeId?: string;
  x?: number;
  y?: number;
  index?: number; // 用于条件节点的多个输出端点索引
}

// 流程节点接口
interface FlowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  customName?: string;
  triggerCondition?: string;
  demandDevicesTriggerCondition?: string;
  supplyDevicesTriggerCondition?: string;
  demandDevices?: string[];
  supplyDevices?: string[];
  demandDevicesNames?: string;
  supplyDevicesNames?: string;
  data?: any;
  // 行为树节点特有属性
  behaviorTreeData?: {
    status?: 'success' | 'failure' | 'running' | 'idle';
    conditionExpression?: string;
    repeatCount?: number;
    maxRetries?: number;
    timeout?: number;
    inputs?: ConnectionPoint[];
    outputs?: ConnectionPoint[];
    description?: string;
    priority?: number;
    conditionGroups?: Array<{
      id: string;
      name: string;
      conditions: Array<{
        id: string;
        field: string;
        operator: string;
        value: any;
      }>;
    }>;
  };
}

// 统一的连接线接口（与AddBehaviorTree.tsx保持一致）
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  sourceType?: 'node' | 'stage' | 'subcanvas' | 'businessProcess' | 'sequence' | 'parallel' | 'condition' | 'inverter' | 'repeat';
  targetType?: 'node' | 'stage' | 'subcanvas' | 'businessProcess' | 'sequence' | 'parallel' | 'condition' | 'inverter' | 'repeat';
  sourceOutputIndex?: number; // 用于条件节点的多个输出端点
}

// 画布状态接口
interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  isDragging: boolean;
  isSpacePressed: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

// 历史状态接口
interface HistoryState {
  nodes: FlowNode[];
  connections: Connection[];
  canvasState: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
}

// 组件属性接口
interface BehaviorTreeCanvasProps {
  nodes: FlowNode[];
  connections?: Connection[];
  onNodesChange?: (nodes: FlowNode[]) => void;
  onConnectionsChange?: (connections: Connection[]) => void;
  onNodeSelect?: (node: FlowNode | null) => void;
  readonly?: boolean;
  width?: number;
  height?: number;
}

interface BehaviorTreeCanvasRef {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetCanvas: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleAutoSort: () => void;
  handleAutoSortHorizontal: () => void;
}

const BehaviorTreeCanvas = forwardRef<BehaviorTreeCanvasRef, BehaviorTreeCanvasProps>(({
  nodes: initialNodes,
  connections: initialConnections = [],
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  readonly = false,
  width: _width = 800,
  height = 600
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 创建固定的开始和结束节点
  const createFixedNodes = useCallback((): FlowNode[] => {
    const startNode: FlowNode = {
      id: 'start-node',
      type: 'start',
      x: 100,
      y: 200,
      width: 100,
      height: 50,
      label: '开始',
      behaviorTreeData: {
        status: 'idle'
      }
    };

    const endNode: FlowNode = {
      id: 'end-node',
      type: 'end',
      x: 500,
      y: 200,
      width: 100,
      height: 50,
      label: '结束',
      behaviorTreeData: {
        status: 'idle'
      }
    };

    return [startNode, endNode];
  }, []);

  // 创建固定的连接线
  const createFixedConnection = useCallback((): Connection => {
    return {
      id: 'start-to-end',
      sourceId: 'start-node',
      targetId: 'end-node',
      sourcePoint: { x: 200, y: 225 }, // 开始节点右侧输出点 (x: 100+100, y: 200+25)
      targetPoint: { x: 500, y: 225 }, // 结束节点左侧输入点 (x: 500, y: 200+25)
      sourceType: 'node',
      targetType: 'node'
    };
  }, []);

  // 合并固定节点和传入的节点
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    const fixedNodes = createFixedNodes();
    return [...fixedNodes, ...initialNodes];
  });
  
  // 合并固定连接线和传入的连接线
  const [connections, setConnections] = useState<Connection[]>(() => {
    const fixedConnection = createFixedConnection();
    return [fixedConnection, ...initialConnections];
  });
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    isDragging: false,
    isSpacePressed: false,
    lastMouseX: 0,
    lastMouseY: 0
  });
  
  // 拖拽相关状态
  const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 连线相关状态
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [dragConnectionStart, setDragConnectionStart] = useState<{nodeId: string, type: 'input' | 'output', x: number, y: number, index?: number} | null>(null);
  const [dragConnectionEnd, setDragConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{nodeId: string, type: 'input' | 'output', index?: number} | null>(null);
  
  // 选择状态
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  
  // 节点面板相关状态
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [insertingConnectionId, setInsertingConnectionId] = useState<string | null>(null);
  const [nodeAddPosition, setNodeAddPosition] = useState<{ x: number; y: number } | null>(null);
  
  // 异常详情显示状态
  const [errorDetailVisible, setErrorDetailVisible] = useState(false);
  const [errorDetailNode, setErrorDetailNode] = useState<FlowNode | null>(null);
  
  // 画布内属性面板状态
  const [showCanvasPropertyPanel, setShowCanvasPropertyPanel] = useState(false);
  const [selectedNodeForProperty, setSelectedNodeForProperty] = useState<FlowNode | null>(null);
  
  // 历史记录
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 固定连接状态
  const [shouldShowFixedConnection, setShouldShowFixedConnection] = useState(true);

  // 复制粘贴相关状态
  const [copiedNodeData, setCopiedNodeData] = useState<{
    node: FlowNode;
    childNodes: FlowNode[];
    childConnections: Connection[];
  } | null>(null);
  const [hoveredNodeForCopy, setHoveredNodeForCopy] = useState<string | null>(null);

  // 使用ref来存储上一次的props值，避免循环依赖
  const prevInitialNodesRef = useRef<FlowNode[]>([]);
  const prevInitialConnectionsRef = useRef<Connection[]>([]);

  // 同步props变化 - 避免循环依赖，同时保持固定节点的当前位置
  useEffect(() => {
    if (initialNodes) {
      // 检查是否真的需要更新
      const nodesChanged = JSON.stringify(prevInitialNodesRef.current) !== JSON.stringify(initialNodes);
      if (nodesChanged) {
        setNodes(prevNodes => {
          // 保持现有的开始和结束节点位置
          const existingStartNode = prevNodes.find(n => n.id === 'start-node');
          const existingEndNode = prevNodes.find(n => n.id === 'end-node');
          
          // 如果已存在开始和结束节点，保持它们的位置
          const fixedNodes = createFixedNodes().map(newNode => {
            if (newNode.id === 'start-node' && existingStartNode) {
              return { ...newNode, x: existingStartNode.x, y: existingStartNode.y };
            }
            if (newNode.id === 'end-node' && existingEndNode) {
              return { ...newNode, x: existingEndNode.x, y: existingEndNode.y };
            }
            return newNode;
          });
          
          return [...fixedNodes, ...initialNodes];
        });
        prevInitialNodesRef.current = initialNodes;
      }
    }
  }, [initialNodes, createFixedNodes]);

  useEffect(() => {
    if (initialConnections && initialConnections.length >= 0) {
      // 检查是否真的需要更新
      const connectionsChanged = JSON.stringify(prevInitialConnectionsRef.current) !== JSON.stringify(initialConnections);
      if (connectionsChanged) {
        if (shouldShowFixedConnection) {
          const fixedConnection = createFixedConnection();
          setConnections([fixedConnection, ...initialConnections]);
        } else {
          setConnections([...initialConnections]);
        }
        prevInitialConnectionsRef.current = initialConnections;
      }
    }
  }, [initialConnections, createFixedConnection, shouldShowFixedConnection]);

  // 节点状态颜色映射
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return '#52c41a';
      case 'failure': return '#ff4d4f';
      case 'running': return '#1890ff';
      case 'idle': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  // 获取节点颜色（移植排程管理的颜色配置）
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start':
      case 'end':
        return '#1890ff'; // 蓝色
      case 'stage':
        return '#722ed1'; // 紫色
      case 'businessProcess':
        return '#52c41a'; // 绿色
      case 'sequence':
        return '#1890ff'; // 蓝色
      case 'parallel':
        return '#52c41a'; // 绿色
      case 'condition':
        return '#fa8c16'; // 橙色
      case 'inverter':
        return '#722ed1'; // 紫色
      case 'repeat':
        return '#f5222d'; // 红色
      default:
        return '#1890ff'; // 默认蓝色
    }
  };

  // 坐标转换函数
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const y = (clientY - rect.top - canvasState.offsetY) / canvasState.scale;
    
    return { x, y };
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale]);

  // 查找指定位置的节点
  const findNodeAtPosition = useCallback((x: number, y: number): FlowNode | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (x >= node.x && x <= node.x + node.width && 
          y >= node.y && y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }, [nodes]);

  // 查找指定位置的节点（包括复制粘贴图标区域）
  const findNodeAtPositionWithIcons = useCallback((x: number, y: number): FlowNode | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      
      // 计算复制粘贴图标的区域
      const iconSize = 14;
      const iconSpacing = 6;
      const iconY = node.y - iconSize - 8;
      
      // 计算两个图标的总宽度
      const totalIconsWidth = iconSize * 2 + iconSpacing;
      
      // 复制图标位置 - 在节点右上角，两个图标居中对齐
      const copyIconX = node.x + node.width - totalIconsWidth - 4;
      
      // 粘贴图标位置 - 在复制图标右侧
      const pasteIconX = copyIconX + iconSize + iconSpacing;
      
      // 扩展的检测区域：节点本身 + 图标区域
      const extendedMinX = Math.min(node.x, copyIconX - 4);
      const extendedMaxX = Math.max(node.x + node.width, pasteIconX + iconSize + 4);
      const extendedMinY = Math.min(node.y, iconY - 4);
      const extendedMaxY = node.y + node.height;
      
      if (x >= extendedMinX && x <= extendedMaxX && 
          y >= extendedMinY && y <= extendedMaxY) {
        return node;
      }
    }
    return null;
  }, [nodes]);

  // 查找指定位置的连接点
  const findConnectionPointAtPosition = useCallback((x: number, y: number): {nodeId: string, type: 'input' | 'output', index?: number} | null => {
    for (const node of nodes) {
      // 检查输入连接点（左侧）
      const inputX = node.x;
      const inputY = node.y + node.height / 2;
      const inputDistance = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2);
      if (inputDistance <= 8) {
        return { nodeId: node.id, type: 'input' };
      }
      
      // 检查输出连接点（右侧）
      if (node.type === 'condition') {
        // 条件节点：检查多个输出端点
        const conditionGroups = node.behaviorTreeData?.conditionGroups || [];
        const outputCount = Math.max(1, conditionGroups.length);
        
        for (let i = 0; i < outputCount; i++) {
          const outputX = node.x + node.width;
          const outputY = outputCount === 1 
            ? node.y + node.height / 2 
            : node.y + (node.height / (outputCount + 1)) * (i + 1);
          
          const outputDistance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
          if (outputDistance <= 8) {
            return { nodeId: node.id, type: 'output', index: i };
          }
        }
      } else {
        // 其他节点：单个输出端点
        const outputX = node.x + node.width;
        const outputY = node.y + node.height / 2;
        const outputDistance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
        if (outputDistance <= 8) {
          return { nodeId: node.id, type: 'output' };
        }
      }
    }
    return null;
  }, [nodes]);

  // 查找指定位置的连接线
  const findConnectionAtPosition = useCallback((x: number, y: number): string | null => {
    for (const connection of connections) {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        // 动态计算连接点位置，确保节点移动后连线正确
        let startX, startY, endX, endY;
        
        // 计算源节点的输出连接点
        if (sourceNode.type === 'condition' && connection.sourceOutputIndex !== undefined) {
          // 条件节点的多个输出端点
          const conditionGroups = sourceNode.behaviorTreeData?.conditionGroups || [];
          const outputCount = Math.max(1, conditionGroups.length);
          startX = sourceNode.x + sourceNode.width;
          startY = outputCount === 1 
            ? sourceNode.y + sourceNode.height / 2 
            : sourceNode.y + (sourceNode.height / (outputCount + 1)) * (connection.sourceOutputIndex + 1);
        } else {
          // 其他节点的单个输出端点（右侧中心）
          startX = sourceNode.x + sourceNode.width;
          startY = sourceNode.y + sourceNode.height / 2;
        }
        
        // 计算目标节点的输入连接点（左侧中心）
        endX = targetNode.x;
        endY = targetNode.y + targetNode.height / 2;
        
        // 简化的线段距离检测
        const distance = Math.abs((endY - startY) * x - (endX - startX) * y + endX * startY - endY * startX) / 
                        Math.sqrt((endY - startY) ** 2 + (endX - startX) ** 2);
        
        if (distance <= 5 && x >= Math.min(startX, endX) && x <= Math.max(startX, endX)) {
          return connection.id;
        }
      }
    }
    return null;
  }, [connections, nodes]);

  // 检测加号图标点击
  const findAddButtonAtPosition = useCallback((x: number, y: number): string | null => {
    for (const connection of connections) {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        // 动态计算连接点位置，确保节点移动后连线正确
        let startX, startY, endX, endY;
        
        // 计算源节点的输出连接点
        if (sourceNode.type === 'condition' && connection.sourceOutputIndex !== undefined) {
          // 条件节点的多个输出端点
          const conditionGroups = sourceNode.behaviorTreeData?.conditionGroups || [];
          const outputCount = Math.max(1, conditionGroups.length);
          startX = sourceNode.x + sourceNode.width;
          startY = outputCount === 1 
            ? sourceNode.y + sourceNode.height / 2 
            : sourceNode.y + (sourceNode.height / (outputCount + 1)) * (connection.sourceOutputIndex + 1);
        } else {
          // 其他节点的单个输出端点（右侧中心）
          startX = sourceNode.x + sourceNode.width;
          startY = sourceNode.y + sourceNode.height / 2;
        }
        
        // 计算目标节点的输入连接点（左侧中心）
        endX = targetNode.x;
        endY = targetNode.y + targetNode.height / 2;
        
        // 计算连线中点（加号图标位置）
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // 检测点击是否在加号图标区域内（半径12px）
        const distance = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
        if (distance <= 12) {
          return connection.id;
        }
      }
    }
    return null;
  }, [connections, nodes]);

  // 获取节点的所有子节点（递归）
  const getAllChildNodes = useCallback((nodeId: string): FlowNode[] => {
    const childNodes: FlowNode[] = [];
    const visited = new Set<string>();
    
    const findChildren = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      
      // 查找所有以当前节点为源的连接
      const childConnections = connections.filter(conn => conn.sourceId === currentNodeId);
      
      for (const connection of childConnections) {
        const childNode = nodes.find(n => n.id === connection.targetId);
        if (childNode && !childNodes.find(n => n.id === childNode.id)) {
          childNodes.push(childNode);
          // 递归查找子节点的子节点
          findChildren(childNode.id);
        }
      }
    };
    
    findChildren(nodeId);
    return childNodes;
  }, [nodes, connections]);

  // 获取节点及其子节点相关的连接
  const getNodeConnections = useCallback((nodeIds: string[]): Connection[] => {
    return connections.filter(conn => 
      nodeIds.includes(conn.sourceId) && nodeIds.includes(conn.targetId)
    );
  }, [connections]);

  // 生成新的唯一ID
  const generateNewId = useCallback(() => {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 复制节点功能
  const handleCopyNode = useCallback((nodeId: string) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode || targetNode.type === 'start' || targetNode.type === 'end') {
      message.warning('无法复制开始或结束节点');
      return;
    }

    const childNodes = getAllChildNodes(nodeId);
    const allNodeIds = [nodeId, ...childNodes.map(n => n.id)];
    const childConnections = getNodeConnections(allNodeIds);

    setCopiedNodeData({
      node: targetNode,
      childNodes,
      childConnections
    });

    message.success(`已复制节点"${targetNode.customName || targetNode.label}"${childNodes.length > 0 ? `及其${childNodes.length}个子节点` : ''}`);
  }, [nodes, getAllChildNodes, getNodeConnections]);

  // 粘贴节点功能
  const handlePasteNode = useCallback((targetNodeId: string) => {
    if (!copiedNodeData) {
      message.warning('没有可粘贴的节点');
      return;
    }

    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) {
      message.error('目标节点不存在');
      return;
    }

    // 生成新的ID映射
    const idMapping = new Map<string, string>();
    const newMainNodeId = generateNewId();
    idMapping.set(copiedNodeData.node.id, newMainNodeId);
    
    copiedNodeData.childNodes.forEach(childNode => {
      idMapping.set(childNode.id, generateNewId());
    });

    // 计算粘贴位置（在目标节点下方）
    const pasteX = targetNode.x;
    const pasteY = targetNode.y + targetNode.height + 50;

    // 创建新的主节点
    const newMainNode: FlowNode = {
      ...copiedNodeData.node,
      id: newMainNodeId,
      x: pasteX,
      y: pasteY
    };

    // 创建新的子节点（保持相对位置）
    const offsetX = pasteX - copiedNodeData.node.x;
    const offsetY = pasteY - copiedNodeData.node.y;
    
    const newChildNodes: FlowNode[] = copiedNodeData.childNodes.map(childNode => ({
      ...childNode,
      id: idMapping.get(childNode.id)!,
      x: childNode.x + offsetX,
      y: childNode.y + offsetY
    }));

    // 创建新的连接（更新ID）
    const newConnections: Connection[] = copiedNodeData.childConnections.map(conn => ({
      ...conn,
      id: generateNewId(),
      sourceId: idMapping.get(conn.sourceId)!,
      targetId: idMapping.get(conn.targetId)!,
      sourcePoint: {
        x: conn.sourcePoint.x + offsetX,
        y: conn.sourcePoint.y + offsetY
      },
      targetPoint: {
        x: conn.targetPoint.x + offsetX,
        y: conn.targetPoint.y + offsetY
      }
    }));

    // 创建从目标节点到新主节点的连接
    const getConnectionType = (nodeType: NodeType) => {
      if (nodeType === 'start' || nodeType === 'end') return 'node';
      return nodeType;
    };

    const targetToNewConnection: Connection = {
      id: generateNewId(),
      sourceId: targetNodeId,
      targetId: newMainNodeId,
      sourcePoint: {
        x: targetNode.x + targetNode.width,
        y: targetNode.y + targetNode.height / 2
      },
      targetPoint: {
        x: newMainNode.x,
        y: newMainNode.y + newMainNode.height / 2
      },
      sourceType: getConnectionType(targetNode.type),
      targetType: getConnectionType(newMainNode.type)
    };

    // 更新节点和连接
    const updatedNodes = [...nodes, newMainNode, ...newChildNodes];
    const updatedConnections = [...connections, ...newConnections, targetToNewConnection];

    setNodes(updatedNodes);
    setConnections(updatedConnections);
    onNodesChange?.(updatedNodes.filter(n => n.type !== 'start' && n.type !== 'end'));
    onConnectionsChange?.(updatedConnections);

    // 保存历史记录
    saveToHistory();

    message.success(`已粘贴节点"${copiedNodeData.node.customName || copiedNodeData.node.label}"${copiedNodeData.childNodes.length > 0 ? `及其${copiedNodeData.childNodes.length}个子节点` : ''}`);
  }, [copiedNodeData, nodes, connections, generateNewId, onNodesChange, onConnectionsChange]);

  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20 * canvasState.scale;
    const offsetX = canvasState.offsetX % gridSize;
    const offsetY = canvasState.offsetY % gridSize;
    
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // 绘制垂直线
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // 绘制水平线
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  }, [canvasState.scale, canvasState.offsetX, canvasState.offsetY]);

  // 绘制节点（移植排程管理的完整绘制逻辑）
  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: FlowNode) => {
    const { x, y, width, height, type, label } = node;
    const isSelected = selectedNode === node.id;
    const isInvalid = false; // 可以根据需要添加验证逻辑
    const color = getNodeColor(type);
    
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    if (type === 'start' || type === 'end') {
      // 绘制阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 开始和结束节点绘制为圆角矩形 - 白色背景
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isInvalid ? '#ff4d4f' : (isSelected ? '#1890ff' : '#cccccc');
      ctx.lineWidth = isInvalid ? 2 : (isSelected ? 1 : 0.5);
      
      const radius = 25; // 调整倒角半径适应新尺寸
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      
      // 清除阴影设置
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 始终绘制描边
      ctx.stroke();
      
      // 绘制连接口小圆圈 - 蓝色
      if (!readonly) {
        ctx.fillStyle = '#1890ff';
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
        
        if (type === 'start') {
          // 开始节点右侧输出口
          const outputX = x + width;
          const outputY = y + height / 2;
          
          // 检查是否悬停在此连接点上
          const isHovered = hoveredConnectionPoint && 
                           hoveredConnectionPoint.nodeId === node.id && 
                           hoveredConnectionPoint.type === 'output';
          
          const radius = isHovered ? 6 : 4; // 悬停时放大
          ctx.beginPath();
          ctx.arc(outputX, outputY, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else if (type === 'end') {
          // 结束节点左侧输入口
          const inputX = x;
          const inputY = y + height / 2;
          
          // 检查是否悬停在此连接点上
          const isHovered = hoveredConnectionPoint && 
                           hoveredConnectionPoint.nodeId === node.id && 
                           hoveredConnectionPoint.type === 'input';
          
          const radius = isHovered ? 6 : 4; // 悬停时放大
          ctx.beginPath();
          ctx.arc(inputX, inputY, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }

    } else if (type === 'stage') {
      // 阶段节点绘制
      // 绘制阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 绘制白色背景圆角矩形
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isInvalid ? '#ff4d4f' : (isSelected ? '#722ed1' : '#cccccc');
      ctx.lineWidth = isInvalid ? 2 : (isSelected ? 1 : 0.5);
      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      
      // 清除阴影设置
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 绘制边框
      ctx.stroke();
      
      // 绘制连接口小圆圈 - 紫色
      if (!readonly) {
        ctx.fillStyle = '#722ed1';
        ctx.strokeStyle = '#722ed1';
        ctx.lineWidth = 2;
        
        // 左侧输入口
        const inputX = x;
        const inputY = y + height / 2;
        const isInputHovered = hoveredConnectionPoint && 
                             hoveredConnectionPoint.nodeId === node.id && 
                             hoveredConnectionPoint.type === 'input';
        const inputRadius = isInputHovered ? 6 : 4;
        ctx.beginPath();
        ctx.arc(inputX, inputY, inputRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 右侧输出口
        if (node.type === 'condition') {
          // 条件节点：绘制多个输出端点
          const conditionGroups = node.behaviorTreeData?.conditionGroups || [];
          const outputCount = Math.max(1, conditionGroups.length);
          
          for (let i = 0; i < outputCount; i++) {
            const outputX = x + width;
            const outputY = outputCount === 1 
              ? y + height / 2 
              : y + (height / (outputCount + 1)) * (i + 1);
            
            const isOutputHovered = hoveredConnectionPoint && 
                                  hoveredConnectionPoint.nodeId === node.id && 
                                  hoveredConnectionPoint.type === 'output' &&
                                  hoveredConnectionPoint.index === i;
            const outputRadius = isOutputHovered ? 6 : 4;
            ctx.beginPath();
            ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // 其他节点：单个输出端点
          const outputX = x + width;
          const outputY = y + height / 2;
          const isOutputHovered = hoveredConnectionPoint && 
                                hoveredConnectionPoint.nodeId === node.id && 
                                hoveredConnectionPoint.type === 'output';
          const outputRadius = isOutputHovered ? 6 : 4;
          ctx.beginPath();
          ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
      
    } else if (type === 'businessProcess') {
      // 业务流程节点绘制
      // 绘制轻微阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.02)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // 绘制白色背景圆角矩形
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isSelected ? '#52c41a' : '#d9d9d9';
      ctx.lineWidth = 1;
      const radius = 6;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      
      // 清除阴影设置
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 绘制边框
      ctx.stroke();
      
      // 绘制连接口小圆圈 - 绿色统一风格
      if (!readonly) {
        ctx.fillStyle = '#52c41a';
        ctx.strokeStyle = '#52c41a';
        ctx.lineWidth = 2;
        
        // 左侧输入口
        const inputX = x;
        const inputY = y + height / 2;
        const isInputHovered = hoveredConnectionPoint && 
                             hoveredConnectionPoint.nodeId === node.id && 
                             hoveredConnectionPoint.type === 'input';
        const inputRadius = isInputHovered ? 6 : 4;
        ctx.beginPath();
        ctx.arc(inputX, inputY, inputRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 右侧输出口
        const outputX = x + width;
        const outputY = y + height / 2;
        const isOutputHovered = hoveredConnectionPoint && 
                              hoveredConnectionPoint.nodeId === node.id && 
                              hoveredConnectionPoint.type === 'output';
        const outputRadius = isOutputHovered ? 6 : 4;
        ctx.beginPath();
        ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      
    } else if (type === 'sequence' || type === 'parallel' || type === 'condition' || type === 'inverter' || type === 'repeat') {
      // 行为树控制节点绘制 - 卡片样式
      // 绘制轻微阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.02)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // 绘制白色背景圆角矩形
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isSelected ? color : '#d9d9d9';
      ctx.lineWidth = 1;
      const radius = 6;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      
      // 清除阴影设置
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 绘制边框
      ctx.stroke();
      
      // 绘制连接口小圆圈
      if (!readonly) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        // 左侧输入口
        const inputX = x;
        const inputY = y + height / 2;
        const isInputHovered = hoveredConnectionPoint && 
                             hoveredConnectionPoint.nodeId === node.id && 
                             hoveredConnectionPoint.type === 'input';
        const inputRadius = isInputHovered ? 6 : 4;
        ctx.beginPath();
        ctx.arc(inputX, inputY, inputRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 右侧输出口处理
        if (type === 'condition') {
          // 条件节点：根据conditionGroups数量动态显示输出端口
          const conditionGroups = node.behaviorTreeData?.conditionGroups || [];
          const outputCount = Math.max(1, conditionGroups.length); // 至少显示一个输出端口
          
          // 定义输出端口颜色
          const outputColors = ['#52c41a', '#1890ff', '#faad14', '#f5222d', '#722ed1', '#eb2f96'];
          
          for (let i = 0; i < outputCount; i++) {
            const outputX = x + width;
            // 如果只有一个输出端口，居中显示；多个端口时均匀分布
            const outputY = outputCount === 1 
              ? y + height / 2 
              : y + (height / (outputCount + 1)) * (i + 1);
            
            // 使用不同颜色区分不同的输出端口
            const outputColor = outputColors[i % outputColors.length];
            ctx.fillStyle = outputColor;
            ctx.strokeStyle = outputColor;
            
            const isOutputHovered = hoveredConnectionPoint && 
                                  hoveredConnectionPoint.nodeId === node.id && 
                                  hoveredConnectionPoint.type === 'output' &&
                                  hoveredConnectionPoint.index === i;
            const outputRadius = isOutputHovered ? 6 : 4;
            
            ctx.beginPath();
            ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // 绘制输出端口标签 - 添加"组X"标识
            if (outputCount > 1) {
              // 保存当前绘图状态
              ctx.save();
              
              ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              
              const labelText = `组${i + 1}`;
              const labelX = outputX + 10; // 端口右侧10px处，增加间距
              const labelY = outputY; // 使用端口的Y坐标
              
              // 计算标签尺寸
              const labelWidth = ctx.measureText(labelText).width;
              const labelHeight = 16; // 增加高度
              const labelBgX = labelX - 3;
              const labelBgY = labelY - labelHeight / 2;
              
              // 绘制标签背景 - 使用更明显的背景
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(labelBgX, labelBgY, labelWidth + 6, labelHeight);
              
              // 绘制标签边框
              ctx.strokeStyle = outputColor;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(labelBgX, labelBgY, labelWidth + 6, labelHeight);
              
              // 绘制标签文字
              ctx.fillStyle = outputColor;
              ctx.fillText(labelText, labelX, labelY);
              
              // 恢复绘图状态
              ctx.restore();
            }
          }
          
          // 恢复原始颜色
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
        } else if (type === 'parallel') {
          // 并行节点：单个蓝色输出口
          const outputX = x + width;
          const outputY = y + height / 2;
          ctx.fillStyle = '#1890ff';
          ctx.strokeStyle = '#1890ff';
          ctx.beginPath();
          ctx.arc(outputX, outputY, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else {
          // 其他节点：单个输出口
          const outputX = x + width;
          const outputY = y + height / 2;
          ctx.beginPath();
          ctx.arc(outputX, outputY, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
      
      // 卡片内容绘制
      const padding = 12;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - 2 * padding;
      
      // 第一行：图标和名称水平排列
      const iconSize = 18;
      const iconY = contentY + 8;
      
      // 根据节点类型绘制不同的图标
      if (type === 'sequence') {
        // 顺序节点图标（蓝色主题）
        ctx.fillStyle = '#e6f7ff';
        ctx.beginPath();
        ctx.roundRect(contentX, iconY, iconSize, iconSize, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 绘制图标内部顺序符号
        ctx.fillStyle = '#1890ff';
        ctx.fillRect(contentX + 3, iconY + 3, 2, 8);
        ctx.fillRect(contentX + 7, iconY + 5, 2, 6);
        ctx.fillRect(contentX + 11, iconY + 7, 2, 4);
        
      } else if (type === 'parallel') {
        // 并行节点图标（绿色主题）
        ctx.fillStyle = '#f6ffed';
        ctx.beginPath();
        ctx.roundRect(contentX, iconY, iconSize, iconSize, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#52c41a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 绘制图标内部并行符号
        ctx.fillStyle = '#52c41a';
        ctx.fillRect(contentX + 3, iconY + 4, 12, 2);
        ctx.fillRect(contentX + 3, iconY + 8, 12, 2);
        ctx.fillRect(contentX + 3, iconY + 12, 12, 2);
        
      } else if (type === 'condition') {
        // 条件节点图标（黄色主题）
        ctx.fillStyle = '#fffbe6';
        ctx.beginPath();
        ctx.roundRect(contentX, iconY, iconSize, iconSize, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#faad14';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 绘制图标内部问号符号
        ctx.fillStyle = '#faad14';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', contentX + iconSize / 2, iconY + iconSize / 2);
        
      } else if (type === 'inverter') {
        // 逆变节点图标（紫色主题）
        ctx.fillStyle = '#f9f0ff';
        ctx.beginPath();
        ctx.roundRect(contentX, iconY, iconSize, iconSize, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#722ed1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 绘制图标内部交换箭头符号
        ctx.strokeStyle = '#722ed1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const arrowCenterX = contentX + iconSize / 2;
        const arrowCenterY = iconY + iconSize / 2;
        ctx.moveTo(arrowCenterX - 3, arrowCenterY - 3);
        ctx.lineTo(arrowCenterX, arrowCenterY - 6);
        ctx.lineTo(arrowCenterX + 3, arrowCenterY - 3);
        ctx.moveTo(arrowCenterX - 3, arrowCenterY + 3);
        ctx.lineTo(arrowCenterX, arrowCenterY + 6);
        ctx.lineTo(arrowCenterX + 3, arrowCenterY + 3);
        ctx.stroke();
        
      } else if (type === 'repeat') {
        // 重复节点图标（橙色主题）
        ctx.fillStyle = '#fff7e6';
        ctx.beginPath();
        ctx.roundRect(contentX, iconY, iconSize, iconSize, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#fa8c16';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 绘制图标内部重复符号
        ctx.strokeStyle = '#fa8c16';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(contentX + iconSize / 2, iconY + iconSize / 2, 6, 0, 1.5 * Math.PI);
        ctx.stroke();
        
        // 绘制箭头
        ctx.fillStyle = '#fa8c16';
        ctx.beginPath();
        ctx.moveTo(contentX + iconSize / 2 + 4, iconY + 4);
        ctx.lineTo(contentX + iconSize / 2 + 2, iconY + 2);
        ctx.lineTo(contentX + iconSize / 2 + 6, iconY + 2);
        ctx.closePath();
        ctx.fill();
      }
      
      // 绘制节点名称
      ctx.fillStyle = '#262626';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const nodeText = node.customName || label;
      ctx.fillText(nodeText, contentX + iconSize + 8, iconY + iconSize / 2);
      
      // 第二行开始：纵向排列的字段
      let currentY = iconY + iconSize + 22;
      const lineHeight = 20;
      
      // 设置字段文本样式
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#666666';
      
      // 节点类型字段
      ctx.fillStyle = '#666666';
      ctx.fillText('节点类型: ', contentX, currentY);
      
      const labelWidth = ctx.measureText('节点类型: ').width;
      let typeText = '';
      switch (type) {
        case 'sequence':
          typeText = '顺序执行';
          break;
        case 'parallel':
          typeText = '并行执行';
          break;
        case 'condition':
          typeText = '条件判断';
          break;
        case 'inverter':
          typeText = '逆变器';
          break;
        case 'repeat':
          typeText = '重复执行';
          break;
      }
      
      const typeValueX = contentX + labelWidth;
      const typeValueY = currentY;
      const typeValueWidth = ctx.measureText(typeText).width;
      
      // 绘制字段值的灰色背景矩形
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(typeValueX - 4, typeValueY - 10, typeValueWidth + 8, 20);
      
      // 绘制字段值文字
      ctx.fillStyle = '#333333';
      ctx.fillText(typeText, typeValueX, typeValueY);
      
      currentY += lineHeight + 4;
      
      // 状态显示
      if (node.behaviorTreeData?.status) {
        ctx.fillStyle = '#666666';
        ctx.fillText('状态: ', contentX, currentY);
        
        const statusLabelWidth = ctx.measureText('状态: ').width;
        const statusText = node.behaviorTreeData.status === 'success' ? '成功' : 
                          node.behaviorTreeData.status === 'failure' ? '失败' : 
                          node.behaviorTreeData.status === 'running' ? '运行中' : '空闲';
        const statusValueX = contentX + statusLabelWidth;
        const statusValueY = currentY;
        const statusValueWidth = ctx.measureText(statusText).width;
        
        // 绘制状态背景
        const statusColor = node.behaviorTreeData.status === 'success' ? '#f6ffed' : 
                           node.behaviorTreeData.status === 'failure' ? '#fff2f0' : 
                           node.behaviorTreeData.status === 'running' ? '#e6f7ff' : '#f5f5f5';
        ctx.fillStyle = statusColor;
        ctx.fillRect(statusValueX - 4, statusValueY - 10, statusValueWidth + 8, 20);
        
        // 绘制状态文字
        const statusTextColor = node.behaviorTreeData.status === 'success' ? '#52c41a' : 
                                node.behaviorTreeData.status === 'failure' ? '#ff4d4f' : 
                                node.behaviorTreeData.status === 'running' ? '#1890ff' : '#333333';
        ctx.fillStyle = statusTextColor;
        ctx.fillText(statusText, statusValueX, statusValueY);
      }
      
      // 条件节点特殊处理：显示条件表达式
      if (type === 'condition' && node.behaviorTreeData?.conditionExpression) {
        currentY += lineHeight + 4;
        
        ctx.fillStyle = '#666666';
        ctx.fillText('条件: ', contentX, currentY);
        
        const conditionLabelWidth = ctx.measureText('条件: ').width;
        const conditionText = node.behaviorTreeData.conditionExpression;
        const maxConditionWidth = contentWidth - conditionLabelWidth - 16;
        
        // 处理文本溢出
        let conditionDisplayText = conditionText;
        let conditionValueWidth = ctx.measureText(conditionText).width;
        if (conditionValueWidth > maxConditionWidth) {
          while (conditionValueWidth > maxConditionWidth - ctx.measureText('...').width && conditionDisplayText.length > 0) {
            conditionDisplayText = conditionDisplayText.slice(0, -1);
            conditionValueWidth = ctx.measureText(conditionDisplayText + '...').width;
          }
          conditionDisplayText += '...';
          conditionValueWidth = ctx.measureText(conditionDisplayText).width;
        }
        
        const conditionValueX = contentX + conditionLabelWidth;
        const conditionValueY = currentY;
        
        // 绘制条件背景
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(conditionValueX - 4, conditionValueY - 10, conditionValueWidth + 8, 20);
        
        // 绘制条件文字
        ctx.fillStyle = '#333333';
        ctx.fillText(conditionDisplayText, conditionValueX, conditionValueY);
      }
      
      // 重复节点特殊处理：显示重复次数
      if (type === 'repeat' && node.behaviorTreeData?.repeatCount) {
        currentY += lineHeight + 4;
        
        ctx.fillStyle = '#666666';
        ctx.fillText('重复次数: ', contentX, currentY);
        
        const repeatLabelWidth = ctx.measureText('重复次数: ').width;
        const repeatText = node.behaviorTreeData.repeatCount.toString();
        const repeatValueX = contentX + repeatLabelWidth;
        const repeatValueY = currentY;
        const repeatValueWidth = ctx.measureText(repeatText).width;
        
        // 绘制重复次数背景
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(repeatValueX - 4, repeatValueY - 10, repeatValueWidth + 8, 20);
        
        // 绘制重复次数文字
        ctx.fillStyle = '#333333';
        ctx.fillText(repeatText, repeatValueX, repeatValueY);
      }
      
      // 绘制节点状态指示器（如果有behaviorTreeData.status）
      if (node.behaviorTreeData?.status) {
        const status = node.behaviorTreeData.status;
        let statusColor = '#d9d9d9'; // 默认灰色
        
        switch (status) {
          case 'success':
            statusColor = '#52c41a'; // 绿色
            break;
          case 'failure':
            statusColor = '#f5222d'; // 红色
            break;
          case 'running':
            statusColor = '#1890ff'; // 蓝色
            break;
          case 'idle':
            statusColor = '#d9d9d9'; // 灰色
            break;
        }
        
        // 在节点右上角绘制状态指示器
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(x + width - 8, y + 8, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      
    } else {
      // 其他节点绘制为圆角矩形
      ctx.fillStyle = isSelected ? color : '#ffffff';
      ctx.strokeStyle = isInvalid ? '#ff4d4f' : (isSelected ? color : '#cccccc');
      ctx.lineWidth = isInvalid ? 2 : (isSelected ? 1 : 0.5);
      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      ctx.stroke();
      
      // 绘制连接口小圆圈
      if (!readonly) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        // 左侧输入口
        const inputX = x;
        const inputY = y + height / 2;
        const isInputHovered = hoveredConnectionPoint && 
                             hoveredConnectionPoint.nodeId === node.id && 
                             hoveredConnectionPoint.type === 'input';
        const inputRadius = isInputHovered ? 6 : 4;
        ctx.beginPath();
        ctx.arc(inputX, inputY, inputRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 右侧输出口
        const outputX = x + width;
        const outputY = y + height / 2;
        const isOutputHovered = hoveredConnectionPoint && 
                              hoveredConnectionPoint.nodeId === node.id && 
                              hoveredConnectionPoint.type === 'output';
        const outputRadius = isOutputHovered ? 6 : 4;
        ctx.beginPath();
        ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
    
    // 绘制图标和文字
    if (type === 'start' || type === 'end') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 绘制图标 - 蓝色
      ctx.fillStyle = '#1890ff';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      
      if (type === 'start') {
        // 绘制开始图标 - 简洁线条播放按钮
        const iconCenterX = x + width / 2 - 18;
        const iconCenterY = y + height / 2;
        
        // 绘制图标背景圆角矩形
        ctx.fillStyle = '#e6f7ff';
        ctx.beginPath();
        ctx.roundRect(iconCenterX - 16, iconCenterY - 16, 32, 32, 8);
        ctx.fill();
        
        // 绘制圆形边框
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, 10, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 绘制播放三角形 - 线条样式
        ctx.fillStyle = '#1890ff';
        ctx.beginPath();
        ctx.moveTo(iconCenterX - 3, iconCenterY - 5);
        ctx.lineTo(iconCenterX - 3, iconCenterY + 5);
        ctx.lineTo(iconCenterX + 5, iconCenterY);
        ctx.closePath();
        ctx.fill();
      } else if (type === 'end') {
        // 绘制结束图标 - 简洁线条停止按钮
        const iconCenterX = x + width / 2 - 18;
        const iconCenterY = y + height / 2;
        
        // 绘制图标背景圆角矩形
        ctx.fillStyle = '#f6ffed';
        ctx.beginPath();
        ctx.roundRect(iconCenterX - 16, iconCenterY - 16, 32, 32, 8);
        ctx.fill();
        
        // 绘制圆形边框
        ctx.strokeStyle = '#95de64';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(iconCenterX, iconCenterY, 10, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 绘制停止方块 - 线条样式
        ctx.fillStyle = '#95de64';
        ctx.fillRect(iconCenterX - 4, iconCenterY - 4, 8, 8);
      }
      
      // 绘制文字 - 与调试运行按钮一致的颜色
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.fillText(label, x + width / 2 + 18, y + height / 2);

    } else if (type === 'stage') {
      // 阶段节点文字绘制
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 处理文字溢出
      const maxWidth = width - 20;
      let displayText = label;
      const textWidth = ctx.measureText(displayText).width;
      if (textWidth > maxWidth) {
        // 截断文字并添加省略号
        while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
      
      ctx.fillText(displayText, x + width / 2, y + height / 2);
      
    } else if (type === 'businessProcess') {
      // 业务流程节点文字绘制
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 处理文字溢出
      const maxWidth = width - 20;
      let displayText = label;
      const textWidth = ctx.measureText(displayText).width;
      if (textWidth > maxWidth) {
        // 截断文字并添加省略号
        while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
      
      ctx.fillText(displayText, x + width / 2, y + height / 2);
      
    } else {
      // 行为树控制节点已经在卡片绘制中处理了文字，这里不需要重复绘制
      // 其他节点类型如果需要可以在这里添加特殊处理
    }
    
    // 绘制复制粘贴图标（当鼠标悬停时，排除开始和结束节点）
    if (!readonly && hoveredNodeForCopy === node.id && node.type !== 'start' && node.type !== 'end') {
      const iconSize = 14; // 图标尺寸
      const iconSpacing = 6; // 间距
      const iconY = y - iconSize - 8; // 与节点的距离
      
      // 计算两个图标的总宽度
      const totalIconsWidth = iconSize * 2 + iconSpacing;
      
      // 复制图标位置 - 在节点右上角，两个图标居中对齐
      const copyIconX = x + width - totalIconsWidth - 4;
      
      // 粘贴图标位置 - 在复制图标右侧
      const pasteIconX = copyIconX + iconSize + iconSpacing;
      
      // 绘制复制图标背景（方形背景，现代风格）
      ctx.fillStyle = 'rgba(255, 107, 129, 0.15)';
      ctx.strokeStyle = '#ff6b81';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(copyIconX, iconY, iconSize, iconSize, 3);
      ctx.fill();
      ctx.stroke();
      
      // 绘制复制图标（双层方块图标）
      ctx.strokeStyle = '#ff6b81';
      ctx.fillStyle = 'rgba(255, 107, 129, 0.3)';
      ctx.lineWidth = 1.2;
      
      // 后层方块
      const blockSize = iconSize * 0.4;
      const blockX = copyIconX + (iconSize - blockSize) / 2 + 1;
      const blockY = iconY + (iconSize - blockSize) / 2 + 1;
      
      ctx.beginPath();
      ctx.roundRect(blockX, blockY, blockSize, blockSize, 1);
      ctx.fill();
      ctx.stroke();
      
      // 前层方块（偏移）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.roundRect(blockX - 2, blockY - 2, blockSize, blockSize, 1);
      ctx.fill();
      ctx.stroke();
      
      // 添加小点表示内容
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.arc(blockX - 1, blockY, 0.8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(blockX + 1, blockY + 1, 0.8, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制粘贴图标背景（方形背景，现代风格）
      const pasteEnabled = !!copiedNodeData;
      const pasteColor = pasteEnabled ? '#74b9ff' : '#ddd';
      const pasteBgColor = pasteEnabled ? 'rgba(116, 185, 255, 0.15)' : 'rgba(221, 221, 221, 0.15)';
      
      ctx.fillStyle = pasteBgColor;
      ctx.strokeStyle = pasteColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pasteIconX, iconY, iconSize, iconSize, 3);
      ctx.fill();
      ctx.stroke();
      
      // 绘制粘贴图标（现代箭头下载图标）
      ctx.strokeStyle = pasteColor;
      ctx.fillStyle = pasteColor;
      ctx.lineWidth = 1.5;
      
      // 垂直线（箭头主体）
      const centerX = pasteIconX + iconSize / 2;
      const centerY = iconY + iconSize / 2;
      const lineLength = iconSize * 0.4;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - lineLength / 2);
      ctx.lineTo(centerX, centerY + lineLength / 2);
      ctx.stroke();
      
      // 箭头头部（向下的三角形）
      const arrowSize = iconSize * 0.15;
      ctx.fillStyle = pasteColor;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + lineLength / 2);
      ctx.lineTo(centerX - arrowSize, centerY + lineLength / 2 - arrowSize);
      ctx.lineTo(centerX + arrowSize, centerY + lineLength / 2 - arrowSize);
      ctx.closePath();
      ctx.fill();
      
      // 底部横线（表示目标位置）
      ctx.strokeStyle = pasteColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX - iconSize * 0.25, centerY + lineLength / 2 + 2);
      ctx.lineTo(centerX + iconSize * 0.25, centerY + lineLength / 2 + 2);
      ctx.stroke();
      
      // 添加小装饰点（仅在启用时显示）
      if (pasteEnabled) {
        ctx.fillStyle = pasteColor;
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY - lineLength / 2 - 1, 0.8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY - lineLength / 2 - 1, 0.8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, [canvasState, selectedNode, hoveredConnectionPoint, readonly, getStatusColor, getNodeColor, hoveredNodeForCopy, copiedNodeData]);

  // 绘制连接线
  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    connections.forEach(connection => {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        // 动态计算连接点位置
        let startX = connection.sourcePoint.x;
        let startY = connection.sourcePoint.y;
        const endX = connection.targetPoint.x;
        const endY = connection.targetPoint.y;
        
        // 如果是条件节点且有sourceOutputIndex，重新计算输出端口位置
        if (sourceNode.type === 'condition' && connection.sourceOutputIndex !== undefined) {
          const conditionGroups = sourceNode.behaviorTreeData?.conditionGroups || [];
          const outputCount = Math.max(conditionGroups.length, 1);
          
          if (outputCount > 1) {
            // 计算多个输出端口的位置
            const spacing = sourceNode.height / (outputCount + 1);
            const outputY = sourceNode.y + spacing * (connection.sourceOutputIndex + 1);
            startX = sourceNode.x + sourceNode.width;
            startY = outputY;
          } else {
            // 单个输出端口，使用节点右侧中心
            startX = sourceNode.x + sourceNode.width;
            startY = sourceNode.y + sourceNode.height / 2;
          }
        }
        
        const isSelected = selectedConnection === connection.id;
        const isHovered = hoveredConnection === connection.id;
        
        // 统一使用蓝色，与排程管理保持一致
        const strokeColor = '#1890ff';
        ctx.strokeStyle = isHovered ? '#13c2c2' : strokeColor;
        ctx.lineWidth = (isSelected || isHovered) ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // 绘制贝塞尔曲线
        const controlPointOffset = Math.abs(endX - startX) * 0.5;
        const cp1x = startX + controlPointOffset;
        const cp1y = startY;
        const cp2x = endX - controlPointOffset;
        const cp2y = endY;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();
        
        // 绘制箭头
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        const angle = Math.atan2(endY - cp2y, endX - cp2x);
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle - arrowAngle),
          endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle + arrowAngle),
          endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
        
        // 绘制加号图标（当鼠标悬停时）
        if (isHovered && !readonly) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          
          // 绘制圆形背景
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          // 绘制加号
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          // 水平线
          ctx.moveTo(midX - 6, midY);
          ctx.lineTo(midX + 6, midY);
          // 垂直线
          ctx.moveTo(midX, midY - 6);
          ctx.lineTo(midX, midY + 6);
          ctx.stroke();
        }
      }
    });
    
    // 绘制正在拖拽的连接线
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(dragConnectionStart.x, dragConnectionStart.y);
      ctx.lineTo(dragConnectionEnd.x, dragConnectionEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }, [canvasState, connections, nodes, selectedConnection, hoveredConnection, isDraggingConnection, dragConnectionStart, dragConnectionEnd]);

  // 保存历史状态
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      nodes: [...nodes],
      connections: [...connections],
      canvasState: {
        offsetX: canvasState.offsetX,
        offsetY: canvasState.offsetY,
        scale: canvasState.scale
      }
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // 限制历史记录数量
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [nodes, connections, canvasState, history, historyIndex]);

  // 画布内属性面板处理函数
  const handleCanvasPropertyPanelClose = useCallback(() => {
    setShowCanvasPropertyPanel(false);
    setSelectedNodeForProperty(null);
  }, []);

  const handleCanvasPropertyPanelSave = useCallback((updatedNode: FlowNode) => {
    const updatedNodes = nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    );
    setNodes(updatedNodes);
    onNodesChange?.(updatedNodes);
    setShowCanvasPropertyPanel(false);
    setSelectedNodeForProperty(null);
    message.success('节点属性已更新');
  }, [nodes, onNodesChange]);

  // 渲染画布内属性面板
  const renderPropertyPanel = useCallback(() => {
    if (!showCanvasPropertyPanel || !selectedNodeForProperty) {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          width: '300px',
          height: 'calc(100% - 40px)',
          minHeight: '500px',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
        }}
      >
        <BehaviorTreeNodePropertyPanel
          visible={true}
          behaviorTreeNode={selectedNodeForProperty as any}
          onClose={handleCanvasPropertyPanelClose}
          onSave={handleCanvasPropertyPanelSave as any}
          readonly={readonly}
        />
      </div>
    );
  }, [showCanvasPropertyPanel, selectedNodeForProperty, handleCanvasPropertyPanelClose, handleCanvasPropertyPanelSave]);

  // 自动排序函数
  const handleAutoSort = useCallback(() => {
    if (readonly) {
      message.warning('只读模式下无法进行自动排序');
      return;
    }

    if (nodes.length <= 2) {
      message.info('节点数量太少，无需排序');
      return;
    }

    try {
      // 构建邻接表
      const adjacencyList: { [key: string]: string[] } = {};
      const inDegree: { [key: string]: number } = {};
      
      // 初始化
      nodes.forEach(node => {
        adjacencyList[node.id] = [];
        inDegree[node.id] = 0;
      });

      // 构建图
      connections.forEach(connection => {
        adjacencyList[connection.sourceId].push(connection.targetId);
        inDegree[connection.targetId]++;
      });

      // 拓扑排序
      const queue: string[] = [];
      const levels: { [key: string]: number } = {};
      
      // 找到所有入度为0的节点（通常是开始节点）
      nodes.forEach(node => {
        if (inDegree[node.id] === 0) {
          queue.push(node.id);
          levels[node.id] = 0;
        }
      });

      // BFS遍历确定层级
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levels[currentId];
        
        adjacencyList[currentId].forEach(neighborId => {
          inDegree[neighborId]--;
          if (inDegree[neighborId] === 0) {
            queue.push(neighborId);
            levels[neighborId] = currentLevel + 1;
          }
        });
      }

      // 按层级分组节点
      const levelGroups: { [level: number]: FlowNode[] } = {};
      nodes.forEach(node => {
        const level = levels[node.id] ?? 0;
        if (!levelGroups[level]) {
          levelGroups[level] = [];
        }
        levelGroups[level].push(node);
      });

      // 计算布局参数
      const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
      const baseSpacing = 200; // 基础间距
      const levelSpacing = 250; // 层级间距
      const startX = 100; // 起始X坐标
      const startY = 100; // 起始Y坐标

      // 重新排列节点
      const sortedNodes = [...nodes];
      Object.keys(levelGroups).forEach(levelStr => {
        const level = parseInt(levelStr);
        const nodesInLevel = levelGroups[level];
        const levelY = startY + level * levelSpacing;
        
        // 计算该层级的总宽度和起始X位置
        const totalWidth = (nodesInLevel.length - 1) * baseSpacing;
        const levelStartX = startX + (maxLevel > 0 ? (800 - totalWidth) / 2 : 0);
        
        nodesInLevel.forEach((node, index) => {
          const nodeIndex = sortedNodes.findIndex(n => n.id === node.id);
          if (nodeIndex !== -1) {
            sortedNodes[nodeIndex] = {
              ...sortedNodes[nodeIndex],
              x: levelStartX + index * baseSpacing,
              y: levelY
            };
          }
        });
      });

      // 更新连线的连接点
      const updatedConnections = connections.map(connection => {
        const sourceNode = sortedNodes.find(n => n.id === connection.sourceId);
        const targetNode = sortedNodes.find(n => n.id === connection.targetId);
        
        if (sourceNode && targetNode) {
          return {
            ...connection,
            sourcePoint: {
              x: sourceNode.x + sourceNode.width,
              y: sourceNode.y + sourceNode.height / 2
            },
            targetPoint: {
              x: targetNode.x,
              y: targetNode.y + targetNode.height / 2
            }
          };
        }
        return connection;
      });

      // 更新状态
      setNodes(sortedNodes);
      onNodesChange?.(sortedNodes);
      onConnectionsChange?.(updatedConnections);
      
      // 保存到历史记录
      saveToHistory();
      
      message.success('自动排序完成');
    } catch (error) {
      console.error('自动排序失败:', error);
      message.error('自动排序失败，请检查节点连接关系');
    }
  }, [nodes, connections, onNodesChange, onConnectionsChange, saveToHistory, readonly]);

  // 横向自动排序函数
  const handleAutoSortHorizontal = useCallback(() => {
    if (readonly) {
      message.warning('只读模式下无法进行自动排序');
      return;
    }

    if (nodes.length < 2) {
      message.warning('节点数量不足，无法进行自动排序');
      return;
    }

    try {
      // 构建邻接表
      const adjacencyList: { [key: string]: string[] } = {};
      const inDegree: { [key: string]: number } = {};
      
      // 初始化
      nodes.forEach(node => {
        adjacencyList[node.id] = [];
        inDegree[node.id] = 0;
      });

      // 构建图
      connections.forEach(connection => {
        adjacencyList[connection.sourceId].push(connection.targetId);
        inDegree[connection.targetId]++;
      });

      // 拓扑排序
      const queue: string[] = [];
      const levels: string[][] = [];
      
      // 找到所有入度为0的节点（起始节点）
      Object.keys(inDegree).forEach(nodeId => {
        if (inDegree[nodeId] === 0) {
          queue.push(nodeId);
        }
      });

      // 按层级进行拓扑排序
      while (queue.length > 0) {
        const currentLevel: string[] = [];
        const levelSize = queue.length;
        
        for (let i = 0; i < levelSize; i++) {
          const nodeId = queue.shift()!;
          currentLevel.push(nodeId);
          
          // 处理相邻节点
          adjacencyList[nodeId].forEach(neighborId => {
            inDegree[neighborId]--;
            if (inDegree[neighborId] === 0) {
              queue.push(neighborId);
            }
          });
        }
        
        if (currentLevel.length > 0) {
          levels.push(currentLevel);
        }
      }

      // 检查是否有环
      if (levels.flat().length !== nodes.length) {
        message.error('检测到循环依赖，无法进行自动排序');
        return;
      }

      // 横向布局：计算新的位置
      const sortedNodes = [...nodes];
      
      // 动态计算布局参数
      const levelSpacing = 280; // 层级间距（横向）
      const baseNodeSpacing = 120; // 基础节点间距
      const minNodeSpacing = 80;   // 最小节点间距
      const maxNodeSpacing = 180;  // 最大节点间距
      const startX = 100;          // 起始X坐标
      const canvasHeight = height || 600; // 使用实际画布高度
      const marginY = 80;          // 上下边距
      
      levels.forEach((level, levelIndex) => {
        const x = startX + levelIndex * levelSpacing;
        
        // 根据节点数量动态调整间距
        const availableHeight = canvasHeight - 2 * marginY;
        let nodeSpacing = baseNodeSpacing;
        
        if (level.length > 1) {
          const calculatedSpacing = availableHeight / (level.length - 1);
          nodeSpacing = Math.max(minNodeSpacing, Math.min(maxNodeSpacing, calculatedSpacing));
        }
        
        // 计算该层级节点的垂直居中位置
        const totalNodesHeight = (level.length - 1) * nodeSpacing;
        const startY = marginY + (availableHeight - totalNodesHeight) / 2;
        
        level.forEach((nodeId, nodeIndex) => {
          const nodeIndex_in_sortedNodes = sortedNodes.findIndex(n => n.id === nodeId);
          if (nodeIndex_in_sortedNodes !== -1) {
            // 计算Y坐标，确保节点不会超出画布边界
            const y = Math.max(marginY, Math.min(canvasHeight - marginY - 60, startY + nodeIndex * nodeSpacing));
            
            sortedNodes[nodeIndex_in_sortedNodes] = {
              ...sortedNodes[nodeIndex_in_sortedNodes],
              x: x,
              y: y
            };
          }
        });
      });

      // 更新连线的连接点
      const updatedConnections = connections.map(connection => {
        const sourceNode = sortedNodes.find(n => n.id === connection.sourceId);
        const targetNode = sortedNodes.find(n => n.id === connection.targetId);
        
        if (sourceNode && targetNode) {
          return {
            ...connection,
            sourcePoint: {
              x: sourceNode.x + sourceNode.width,
              y: sourceNode.y + sourceNode.height / 2
            },
            targetPoint: {
              x: targetNode.x,
              y: targetNode.y + targetNode.height / 2
            }
          };
        }
        return connection;
      });

      // 更新状态
      setNodes(sortedNodes);
      onNodesChange?.(sortedNodes);
      onConnectionsChange?.(updatedConnections);
      
      // 保存到历史记录
      saveToHistory();
      
      message.success('横向自动排序完成');
    } catch (error) {
      console.error('横向自动排序失败:', error);
      message.error('横向自动排序失败，请检查节点连接关系');
    }
  }, [nodes, connections, onNodesChange, onConnectionsChange, saveToHistory, readonly]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    // 检查加号图标点击
    if (!readonly) {
      const clickedAddButton = findAddButtonAtPosition(canvasPos.x, canvasPos.y);
      if (clickedAddButton) {
        // 计算加号图标位置作为节点添加位置
        const connection = connections.find(c => c.id === clickedAddButton);
        if (connection) {
          const sourceNode = nodes.find(n => n.id === connection.sourceId);
          const targetNode = nodes.find(n => n.id === connection.targetId);
          if (sourceNode && targetNode) {
            const startX = sourceNode.x + sourceNode.width;
            const startY = sourceNode.y + sourceNode.height / 2;
            const endX = targetNode.x;
            const endY = targetNode.y + targetNode.height / 2;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            setInsertingConnectionId(clickedAddButton);
            setNodeAddPosition({ x: midX, y: midY });
            setShowNodePanel(true);
          }
        }
        return;
      }
    }
    
    // 检查连接点
    const clickedConnectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
    if (clickedConnectionPoint && !readonly) {
      const sourceNode = nodes.find(n => n.id === clickedConnectionPoint.nodeId);
      if (sourceNode) {
        let pointX, pointY;
        
        if (clickedConnectionPoint.type === 'input') {
          pointX = sourceNode.x;
          pointY = sourceNode.y + sourceNode.height / 2;
        } else {
          // 输出端点
          pointX = sourceNode.x + sourceNode.width;
          
          if (sourceNode.type === 'condition' && clickedConnectionPoint.index !== undefined) {
            // 条件节点的多个输出端点
            const conditionGroups = sourceNode.behaviorTreeData?.conditionGroups || [];
            const outputCount = Math.max(1, conditionGroups.length);
            pointY = outputCount === 1 
              ? sourceNode.y + sourceNode.height / 2 
              : sourceNode.y + (sourceNode.height / (outputCount + 1)) * (clickedConnectionPoint.index + 1);
          } else {
            // 其他节点的单个输出端点
            pointY = sourceNode.y + sourceNode.height / 2;
          }
        }
        
        setIsDraggingConnection(true);
        setDragConnectionStart({
          nodeId: clickedConnectionPoint.nodeId,
          type: clickedConnectionPoint.type,
          x: pointX,
          y: pointY,
          index: clickedConnectionPoint.index
        });
        setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
        setSelectedNode(null);
        setSelectedConnection(null);
        onNodeSelect?.(null);
      }
      return;
    }
    
    // 检查复制粘贴图标点击
    if (!readonly && hoveredNodeForCopy) {
      const hoveredNode = nodes.find(n => n.id === hoveredNodeForCopy);
      if (hoveredNode) {
        const iconSize = 14;
        const iconSpacing = 6;
        const iconY = hoveredNode.y - iconSize - 8;
        
        // 计算两个图标的总宽度
        const totalIconsWidth = iconSize * 2 + iconSpacing;
        
        // 复制图标位置 - 在节点右上角，两个图标居中对齐
        const copyIconX = hoveredNode.x + hoveredNode.width - totalIconsWidth - 4;
        const copyIconBounds = {
          x: copyIconX - 2,
          y: iconY - 2,
          width: iconSize + 4,
          height: iconSize + 4
        };
        
        // 粘贴图标位置 - 在复制图标右侧
        const pasteIconX = copyIconX + iconSize + iconSpacing;
        const pasteIconBounds = {
          x: pasteIconX - 2,
          y: iconY - 2,
          width: iconSize + 4,
          height: iconSize + 4
        };
        
        // 检查是否点击了复制图标
        if (canvasPos.x >= copyIconBounds.x && canvasPos.x <= copyIconBounds.x + copyIconBounds.width &&
            canvasPos.y >= copyIconBounds.y && canvasPos.y <= copyIconBounds.y + copyIconBounds.height) {
          handleCopyNode(hoveredNode.id);
          return;
        }
        
        // 检查是否点击了粘贴图标（始终响应点击，但只有在有复制数据时才执行粘贴）
        if (canvasPos.x >= pasteIconBounds.x && canvasPos.x <= pasteIconBounds.x + pasteIconBounds.width &&
            canvasPos.y >= pasteIconBounds.y && canvasPos.y <= pasteIconBounds.y + pasteIconBounds.height) {
          if (copiedNodeData) {
            handlePasteNode(hoveredNode.id);
          } else {
            message.warning('请先复制一个节点');
          }
          return;
        }
      }
    }

    // 检查节点
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      setSelectedConnection(null);
      onNodeSelect?.(clickedNode);
      
      // 只有非开始和结束节点才显示属性面板
      if (clickedNode.type !== 'start' && clickedNode.type !== 'end') {
        // 显示画布内属性面板（只读模式下也可以显示，但不允许编辑）
        setSelectedNodeForProperty(clickedNode);
        setShowCanvasPropertyPanel(true);
      }
      
      // 只有在非只读模式下才允许拖拽节点
      if (!readonly) {
        setDraggedNode(clickedNode);
        setIsDraggingNode(true);
        setDragOffset({
          x: canvasPos.x - clickedNode.x,
          y: canvasPos.y - clickedNode.y
        });
      }
      return;
    }
    
    // 检查连接线
    const clickedConnection = findConnectionAtPosition(canvasPos.x, canvasPos.y);
    if (clickedConnection) {
      setSelectedConnection(clickedConnection);
      setSelectedNode(null);
      onNodeSelect?.(null);
      return;
    }
    
    // 空白区域 - 开始拖拽画布
    if (e.button === 0) {
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
      setSelectedNode(null);
      setSelectedConnection(null);
      onNodeSelect?.(null);
      
      // 隐藏画布内属性面板
      setShowCanvasPropertyPanel(false);
      setSelectedNodeForProperty(null);
    }
  }, [getCanvasCoordinates, findAddButtonAtPosition, findConnectionPointAtPosition, findNodeAtPosition, findConnectionAtPosition, nodes, connections, readonly, hoveredNodeForCopy, copiedNodeData, handleCopyNode, handlePasteNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (isDraggingConnection) {
      // 拖拽连线 - 参考排程管理的连线拖拽逻辑
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      
      // 检测目标连接点
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnectionPoint(targetPoint);
    } else if (isDraggingNode && draggedNode && !readonly) {
      // 拖拽节点 - 参考排程管理的节点拖拽逻辑
      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;
      
      const updatedNodes = nodes.map(node =>
        node.id === draggedNode.id ? { ...node, x: newX, y: newY } : node
      );
      
      // 更新相关连线的连接点坐标 - 参考排程管理的连线更新逻辑
      const updatedNode = updatedNodes.find(n => n.id === draggedNode.id);
      if (updatedNode) {
        const updatedConnections = connections.map(connection => {
          let updatedConnection = { ...connection };
          
          // 如果这个节点是连线的源节点，更新源连接点
          if (connection.sourceId === draggedNode.id) {
            let sourcePointY;
            
            // 条件节点需要根据输出端口索引计算正确的Y坐标
            if (updatedNode.type === 'condition' && connection.sourceOutputIndex !== undefined) {
              const conditionGroups = updatedNode.behaviorTreeData?.conditionGroups || [];
              const outputCount = Math.max(1, conditionGroups.length);
              sourcePointY = outputCount === 1 
                ? updatedNode.y + updatedNode.height / 2 
                : updatedNode.y + (updatedNode.height / (outputCount + 1)) * (connection.sourceOutputIndex + 1);
            } else {
              // 其他节点使用中心位置
              sourcePointY = updatedNode.y + updatedNode.height / 2;
            }
            
            updatedConnection.sourcePoint = {
              x: updatedNode.x + updatedNode.width,
              y: sourcePointY
            };
          }
          
          // 如果这个节点是连线的目标节点，更新目标连接点
          if (connection.targetId === draggedNode.id) {
            updatedConnection.targetPoint = {
              x: updatedNode.x,
              y: updatedNode.y + updatedNode.height / 2
            };
          }
          
          return updatedConnection;
        });
        
        setConnections(updatedConnections);
        onConnectionsChange?.(updatedConnections);
      }
      
      setNodes(updatedNodes);
      onNodesChange?.(updatedNodes.filter(n => n.type !== 'start' && n.type !== 'end'));
    } else if (canvasState.isDragging) {
      // 拖拽画布 - 参考排程管理的画布拖拽逻辑
      const deltaX = e.clientX - canvasState.lastMouseX;
      const deltaY = e.clientY - canvasState.lastMouseY;
      
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else if (!readonly) {
      // 更新悬停状态（仅在编辑模式下）- 参考排程管理的悬停检测逻辑
      const hoveredConnectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnectionPoint(hoveredConnectionPoint);
      
      const hoveredConnectionId = findConnectionAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnection(hoveredConnectionId);
      
      // 检测鼠标悬停在节点上（用于显示复制粘贴图标，包括图标区域）
      const hoveredNode = findNodeAtPositionWithIcons(canvasPos.x, canvasPos.y);
      setHoveredNodeForCopy(hoveredNode?.id || null);
    }
  }, [isDraggingConnection, isDraggingNode, draggedNode, dragOffset, canvasState.isDragging, canvasState.lastMouseX, canvasState.lastMouseY, getCanvasCoordinates, findConnectionPointAtPosition, findConnectionAtPosition, findNodeAtPositionWithIcons, nodes, connections, onNodesChange, onConnectionsChange, readonly]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      // 连接拖拽结束 - 参考排程管理的连接创建逻辑
      const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      
      if (targetPoint && targetPoint.nodeId !== dragConnectionStart.nodeId) {
        // 验证连接的有效性 - 参考排程管理的连接验证逻辑
        const isValidConnection = dragConnectionStart.type === 'output' && targetPoint.type === 'input';
        
        if (isValidConnection) {
          // 检查是否已存在相同的连接
          const existingConnection = connections.find(conn => 
            conn.sourceId === dragConnectionStart.nodeId && conn.targetId === targetPoint.nodeId
          );
          
          if (!existingConnection) {
            // 创建新连接
            const sourceNode = nodes.find(n => n.id === dragConnectionStart.nodeId);
            const targetNode = nodes.find(n => n.id === targetPoint.nodeId);
            
            if (sourceNode && targetNode) {
              // 计算源节点的输出端点位置
              let sourcePointY;
              if (sourceNode.type === 'condition' && dragConnectionStart.index !== undefined) {
                // 条件节点的多个输出端点
                const conditionGroups = sourceNode.behaviorTreeData?.conditionGroups || [];
                const outputCount = Math.max(1, conditionGroups.length);
                sourcePointY = outputCount === 1 
                  ? sourceNode.y + sourceNode.height / 2 
                  : sourceNode.y + (sourceNode.height / (outputCount + 1)) * (dragConnectionStart.index + 1);
              } else {
                // 其他节点的单个输出端点
                sourcePointY = sourceNode.y + sourceNode.height / 2;
              }
              
              const newConnection: Connection = {
                id: `connection_${Date.now()}`,
                sourceId: dragConnectionStart.nodeId,
                targetId: targetPoint.nodeId,
                sourcePoint: { 
                  x: sourceNode.x + sourceNode.width, 
                  y: sourcePointY
                },
                targetPoint: { 
                  x: targetNode.x, 
                  y: targetNode.y + targetNode.height / 2 
                },
                sourceOutputIndex: dragConnectionStart.index
              };
              
              const updatedConnections = [...connections, newConnection];
              setConnections(updatedConnections);
              onConnectionsChange?.(updatedConnections);
              saveToHistory();
            }
          }
        }
      } else if (!targetPoint && dragConnectionStart.type === 'output' && !readonly) {
        // 拖拽连线到空白处，弹出添加节点面板 - 参考排程管理的实现
        console.log('🔗 [拖拽连线] 拖拽到空白处，弹出添加节点面板');
        setNodeAddPosition({ x: canvasPos.x, y: canvasPos.y });
        setShowNodePanel(true);
        message.info('请选择要添加的节点类型');
        
        // 注意：不重置dragConnectionStart，保持连线状态直到用户选择节点或取消
        setIsDraggingConnection(false);
        setDragConnectionEnd(null);
        return; // 提前返回，避免重置dragConnectionStart
      }
      
      setIsDraggingConnection(false);
      setDragConnectionStart(null);
      setDragConnectionEnd(null);
    } else if (isDraggingNode && !readonly) {
      // 节点拖拽结束 - 参考排程管理的节点拖拽结束逻辑
      setIsDraggingNode(false);
      setDraggedNode(null);
      saveToHistory();
    } else if (canvasState.isDragging) {
      // 画布拖拽结束
      setCanvasState(prev => ({ ...prev, isDragging: false }));
    }
  }, [isDraggingConnection, isDraggingNode, canvasState.isDragging, dragConnectionStart, dragConnectionEnd, getCanvasCoordinates, findConnectionPointAtPosition, nodes, connections, onConnectionsChange, saveToHistory, readonly]);

  const handleMouseLeave = useCallback(() => {
    setCanvasState(prev => ({ ...prev, isDragging: false }));
    setIsDraggingConnection(false);
    setIsDraggingNode(false);
    setDraggedNode(null);
    
    // 如果正在显示节点面板，不重置dragConnectionStart，保持连线状态
    if (!showNodePanel) {
      setDragConnectionStart(null);
    }
    
    setDragConnectionEnd(null);
    setHoveredConnectionPoint(null);
    setHoveredConnection(null);
  }, [showNodePanel]);

  // 当readonly状态变化时，清除悬停状态和节点添加面板
  useEffect(() => {
    if (readonly) {
      setHoveredConnectionPoint(null);
      setHoveredConnection(null);
      setShowNodePanel(false);
      setNodeAddPosition(null);
      setInsertingConnectionId(null);
    }
  }, [readonly]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !readonly) {
        e.preventDefault();
        
        // 删除选中的连线
        if (selectedConnection) {
          const updatedConnections = connections.filter(conn => conn.id !== selectedConnection);
          setConnections(updatedConnections);
          onConnectionsChange?.(updatedConnections);
          setSelectedConnection(null);
          saveToHistory();
          message.success('连线已删除');
        }
        // 删除选中的节点（排除开始和结束节点）
        else if (selectedNode) {
          const nodeToDelete = nodes.find(node => node.id === selectedNode);
          if (nodeToDelete) {
            // 检查是否为开始或结束节点
            if (nodeToDelete.type === 'start' || nodeToDelete.type === 'end') {
              message.warning('开始节点和结束节点不能删除');
              return;
            }
            
            // 删除节点
            const updatedNodes = nodes.filter(node => node.id !== selectedNode);
            setNodes(updatedNodes);
            onNodesChange?.(updatedNodes);
            
            // 删除与该节点相关的所有连线
            const updatedConnections = connections.filter(conn => 
              conn.sourceId !== selectedNode && conn.targetId !== selectedNode
            );
            setConnections(updatedConnections);
            onConnectionsChange?.(updatedConnections);
            
            // 清除选中状态
            setSelectedNode(null);
            setSelectedNodeForProperty(null);
            onNodeSelect?.(null);
            
            saveToHistory();
            message.success(`节点"${nodeToDelete.label}"已删除`);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setCanvasState(prev => ({ ...prev, isSpacePressed: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedConnection, selectedNode, connections, nodes, onConnectionsChange, onNodesChange, onNodeSelect, saveToHistory, readonly]);

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.3)
    }));
  }, []);

  const handleResetCanvas = useCallback(() => {
    setCanvasState({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      isDragging: false,
      isSpacePressed: false,
      lastMouseX: 0,
      lastMouseY: 0
    });
  }, []);

  // 撤销操作
  const handleUndo = useCallback(() => {
    if (readonly) return; // 只读模式下禁用撤销
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      setCanvasState(prev => ({
        ...prev,
        ...state.canvasState
      }));
      setHistoryIndex(newIndex);
      
      onNodesChange?.(state.nodes.filter(n => n.type !== 'start' && n.type !== 'end'));
      onConnectionsChange?.(state.connections);
    }
  }, [historyIndex, history, onNodesChange, onConnectionsChange, readonly]);

  // 重做操作
  const handleRedo = useCallback(() => {
    if (readonly) return; // 只读模式下禁用重做
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      setCanvasState(prev => ({
        ...prev,
        ...state.canvasState
      }));
      setHistoryIndex(newIndex);
      
      onNodesChange?.(state.nodes.filter(n => n.type !== 'start' && n.type !== 'end'));
      onConnectionsChange?.(state.connections);
    }
  }, [historyIndex, history, onNodesChange, onConnectionsChange, readonly]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleZoomIn,
    handleZoomOut,
    handleResetCanvas,
    handleUndo,
    handleRedo,
    handleAutoSort,
    handleAutoSortHorizontal
  }), [handleZoomIn, handleZoomOut, handleResetCanvas, handleUndo, handleRedo, handleAutoSort, handleAutoSortHorizontal]);

  // 监听容器大小变化并调整canvas尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      console.log('📐 ResizeObserver触发，entries数量:', entries.length);
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        console.log('📏 ResizeObserver检测到尺寸变化:', width, 'x', height);
        
        // 跳过尺寸为0的情况
        if (width <= 0 || height <= 0) {
          console.log('⚠️ ResizeObserver: 尺寸为0，跳过绘制');
          continue;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.log('❌ ResizeObserver: Canvas上下文获取失败');
          return;
        }

        // 设置canvas尺寸 - 支持高DPI显示
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        ctx.scale(dpr, dpr);
        
        // 优化文字渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 重新绘制网格
        console.log('🔲 ResizeObserver: 重新绘制网格');
        drawGrid(ctx, width, height);
        
        // 重新绘制连接线
        console.log('🔗 ResizeObserver: 重新绘制连接线');
        drawConnections(ctx);
        
        // 重新绘制节点
        console.log('🔵 ResizeObserver: 重新绘制节点，节点数量:', nodes.length);
        nodes.forEach(node => {
          drawNode(ctx, node);
        });
        
        console.log('✅ ResizeObserver: 重绘完成');
      }
    });
    
    resizeObserver.observe(canvas);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [nodes, connections, drawGrid, drawConnections, drawNode]);

  // 组件挂载时的初始绘制
  useEffect(() => {
    console.log('🎨 Canvas初始绘制useEffect触发');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas元素不存在');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas上下文获取失败');
      return;
    }

    // 延迟绘制函数，等待Canvas获取正确尺寸
    const tryDraw = (attempt = 0) => {
      const rect = canvas.getBoundingClientRect();
      console.log(`📏 Canvas尺寸检查 (尝试${attempt + 1}):`, rect.width, 'x', rect.height);
      
      if (rect.width > 0 && rect.height > 0) {
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        ctx.scale(dpr, dpr);
        
        // 优化文字渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制网格
        console.log('🔲 开始绘制网格');
        drawGrid(ctx, rect.width, rect.height);
        
        // 绘制连接线
        console.log('🔗 开始绘制连接线');
        drawConnections(ctx);
        
        // 绘制节点
        console.log('🔵 开始绘制节点，节点数量:', nodes.length);
        nodes.forEach(node => {
          drawNode(ctx, node);
        });
        
        console.log('✅ Canvas初始绘制完成');
      } else if (attempt < 10) {
        // 最多重试10次，每次间隔递增
        const delay = Math.min(50 * (attempt + 1), 500);
        console.log(`⏳ Canvas尺寸为0，${delay}ms后重试 (${attempt + 1}/10)`);
        setTimeout(() => tryDraw(attempt + 1), delay);
      } else {
        console.log('❌ Canvas尺寸获取失败，已达到最大重试次数');
      }
    };

    // 立即尝试绘制
    tryDraw();
  }, []);

  // Canvas绘制逻辑
  useEffect(() => {
    console.log('🎯 主绘制useEffect触发，依赖项变化');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ 主绘制: Canvas元素不存在');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ 主绘制: Canvas上下文获取失败');
      return;
    }

    // 设置canvas尺寸 - 支持高DPI显示
    const rect = canvas.getBoundingClientRect();
    console.log('📏 主绘制: Canvas尺寸:', rect.width, 'x', rect.height);
    
    // 跳过尺寸为0的情况
    if (rect.width <= 0 || rect.height <= 0) {
      console.log('⚠️ 主绘制: Canvas尺寸为0，跳过绘制');
      return;
    }
    
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    ctx.scale(dpr, dpr);
    
    // 优化文字渲染
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    console.log('🔲 主绘制: 绘制网格');
    drawGrid(ctx, rect.width, rect.height);
    
    // 绘制连接线
    console.log('🔗 主绘制: 绘制连接线');
    drawConnections(ctx);
    
    // 绘制节点
    console.log('🔵 主绘制: 绘制节点，节点数量:', nodes.length);
    nodes.forEach(node => {
      drawNode(ctx, node);
    });
    
    console.log('✅ 主绘制: 绘制完成');

  }, [nodes, connections, drawGrid, drawConnections, drawNode]);

  // 处理从节点面板添加节点 - 参考排程管理实现
  const handleAddNodeFromPanel = useCallback((nodeType: NodeType) => {
    if (!nodeAddPosition) return;
    
    console.log('🔗 [节点面板] 添加节点:', {
      nodeType,
      nodeAddPosition,
      insertingConnectionId,
      dragConnectionStart,
      dragConnectionStartType: dragConnectionStart?.type
    });
    
    // 参考排程管理的节点添加逻辑
    if (insertingConnectionId) {
      // 在连线中间插入节点
      console.log('🔗 [节点面板] 执行路径: 连线中间插入节点');
      addNodeToCanvas(nodeType, nodeAddPosition.x, nodeAddPosition.y, insertingConnectionId);
    } else if (dragConnectionStart && dragConnectionStart.type === 'output') {
      // 从输出端点拖拽到空白处添加节点，需要创建连接
      console.log('🔗 [节点面板] 执行路径: 从输出端点拖拽添加节点并创建连接');
      addNodeToCanvasWithConnection(nodeType, nodeAddPosition.x, nodeAddPosition.y, dragConnectionStart);
    } else {
      // 普通添加节点
      console.log('🔗 [节点面板] 执行路径: 普通添加节点');
      addNodeToCanvas(nodeType, nodeAddPosition.x, nodeAddPosition.y);
    }
    
    setShowNodePanel(false);
    setNodeAddPosition(null);
    setInsertingConnectionId(null);
    // 重置拖拽连接状态
    setIsDraggingConnection(false);
    setDragConnectionStart(null);
    setDragConnectionEnd(null);
  }, [nodeAddPosition, insertingConnectionId, dragConnectionStart]);

  // 添加节点到画布 - 参考排程管理的addNodeToCanvas实现
  const addNodeToCanvas = useCallback((nodeType: NodeType, x: number, y: number, insertingConnectionId?: string) => {
    const nodeId = `node_${Date.now()}`;
    
    // 根据节点类型设置默认属性 - 参考排程管理的节点类型配置
    let defaultWidth = 120;
    let defaultHeight = 60;
    let defaultAttributes: any = {};
    
    switch (nodeType) {
      case 'stage':
        defaultWidth = 150;
        defaultHeight = 80;
        defaultAttributes = {
          customName: '新阶段',
          label: '阶段节点',
          behaviorTreeData: {
            status: 'idle',
            description: '',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'businessProcess':
        defaultWidth = 160;
        defaultHeight = 90;
        defaultAttributes = {
          customName: '新业务流程',
          label: '业务流程节点',
          behaviorTreeData: {
            status: 'idle',
            description: '',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'sequence':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '顺序执行',
          label: '顺序节点',
          behaviorTreeData: {
            status: 'idle',
            description: '按顺序执行所有子节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'parallel':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '并行执行',
          label: '并行节点',
          behaviorTreeData: {
            status: 'idle',
            description: '并行执行所有子节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'condition':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '条件判断',
          label: '条件节点',
          behaviorTreeData: {
            status: 'idle',
            description: '条件判断节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'inverter':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '反转器',
          label: '逆变节点',
          behaviorTreeData: {
            status: 'idle',
            description: '反转子节点的执行结果',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'repeat':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '重复执行',
          label: '重复节点',
          behaviorTreeData: {
            status: 'idle',
            description: '重复执行子节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      default:
        defaultAttributes = {
          customName: '新节点',
          label: getNodeLabel(nodeType),
          behaviorTreeData: {
            status: 'idle',
            description: '',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
    }
    
    const newNode: FlowNode = {
      id: nodeId,
      type: nodeType,
      x: x - defaultWidth / 2,
      y: y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      ...defaultAttributes
    };
    
    let updatedNodes = [...nodes, newNode];
    let updatedConnections = [...connections];
    
    // 如果是在连线中间插入节点 - 参考排程管理的连线插入逻辑
    if (insertingConnectionId) {
      const connectionToSplit = connections.find(c => c.id === insertingConnectionId);
      if (connectionToSplit) {
        // 删除原连线
        updatedConnections = updatedConnections.filter(c => c.id !== insertingConnectionId);
        
        // 如果删除的是固定连接，设置标志为false
        if (insertingConnectionId === 'start-to-end') {
          setShouldShowFixedConnection(false);
        }
        
        // 创建两条新连线：源节点 -> 新节点 -> 目标节点
        const sourceToNewConnection: Connection = {
          id: `connection_${Date.now()}_1`,
          sourceId: connectionToSplit.sourceId,
          targetId: nodeId,
          sourcePoint: connectionToSplit.sourcePoint,
          targetPoint: { x: newNode.x, y: newNode.y + newNode.height / 2 }
        };
        
        const newToTargetConnection: Connection = {
          id: `connection_${Date.now()}_2`,
          sourceId: nodeId,
          targetId: connectionToSplit.targetId,
          sourcePoint: { x: newNode.x + newNode.width, y: newNode.y + newNode.height / 2 },
          targetPoint: connectionToSplit.targetPoint
        };
        
        updatedConnections.push(sourceToNewConnection, newToTargetConnection);
      }
    }
    
    setNodes(updatedNodes);
    setConnections(updatedConnections);
    
    // 通知父组件
    onNodesChange?.(updatedNodes.filter(n => n.type !== 'start' && n.type !== 'end'));
    onConnectionsChange?.(updatedConnections.filter(c => c.id !== 'start-to-end'));
    
    saveToHistory();
  }, [nodes, connections, onNodesChange, onConnectionsChange, saveToHistory]);

  // 获取节点标签
  const getNodeLabel = (nodeType: NodeType): string => {
    switch (nodeType) {
      case 'stage': return '阶段节点';
      case 'businessProcess': return '业务流程节点';
      case 'sequence': return '顺序节点';
      case 'parallel': return '并行节点';
      case 'condition': return '条件节点';
      case 'inverter': return '逆变节点';
      case 'repeat': return '重复节点';
      default: return '未知节点';
    }
  };

  // 添加节点到画布并创建连接 - 用于从输出端点拖拽到空白处的情况
  const addNodeToCanvasWithConnection = useCallback((nodeType: NodeType, x: number, y: number, sourceConnectionPoint: any) => {
    console.log('🔗 [连接创建] 开始创建节点和连接:', {
      nodeType,
      position: { x, y },
      sourceConnectionPoint
    });
    const nodeId = `node_${Date.now()}`;
    
    // 根据节点类型设置默认属性
    let defaultWidth = 120;
    let defaultHeight = 60;
    let defaultAttributes: any = {};
    
    switch (nodeType) {
      case 'stage':
        defaultWidth = 150;
        defaultHeight = 80;
        defaultAttributes = {
          customName: '新阶段',
          label: '阶段节点',
          behaviorTreeData: {
            status: 'idle',
            description: '',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'businessProcess':
        defaultWidth = 160;
        defaultHeight = 90;
        defaultAttributes = {
          customName: '新业务流程',
          label: '业务流程节点',
          behaviorTreeData: {
            status: 'idle',
            description: '',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'sequence':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '顺序执行',
          label: '顺序节点',
          behaviorTreeData: {
            status: 'idle',
            description: '按顺序执行所有子节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'parallel':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '并行执行',
          label: '并行节点',
          behaviorTreeData: {
            status: 'idle',
            description: '并行执行所有子节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'condition':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '条件判断',
          label: '条件节点',
          behaviorTreeData: {
            status: 'idle',
            description: '条件判断节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'inverter':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '反转器',
          label: '逆变节点',
          behaviorTreeData: {
            status: 'idle',
            description: '反转子节点的执行结果',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      case 'repeat':
        defaultWidth = 200;
        defaultHeight = 110;
        defaultAttributes = {
          customName: '重复执行',
          label: '重复节点',
          behaviorTreeData: {
            status: 'idle',
            description: '重复执行子节点',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
        break;
      default:
        defaultAttributes = {
          customName: '新节点',
          label: getNodeLabel(nodeType),
          behaviorTreeData: {
            status: 'idle',
            description: '',
            priority: 1,
            inputs: [],
            outputs: []
          }
        };
    }
    
    const newNode: FlowNode = {
      id: nodeId,
      type: nodeType,
      x: x - defaultWidth / 2,
      y: y - defaultHeight / 2,
      width: defaultWidth,
      height: defaultHeight,
      ...defaultAttributes
    };
    
    let updatedNodes = [...nodes, newNode];
    let updatedConnections = [...connections];
    
    // 创建从源节点到新节点的连接
    const newConnection: Connection = {
      id: `connection_${Date.now()}`,
      sourceId: sourceConnectionPoint.nodeId,
      targetId: nodeId,
      sourcePoint: { x: sourceConnectionPoint.x, y: sourceConnectionPoint.y },
      targetPoint: { x: newNode.x, y: newNode.y + newNode.height / 2 } // 连接到新节点的左侧中点（输入端点）
    };
    
    console.log('🔗 [连接创建] 新节点信息:', newNode);
    console.log('🔗 [连接创建] 新连接信息:', newConnection);
    console.log('🔗 [连接创建] 更新前连接数量:', connections.length);
    
    updatedConnections.push(newConnection);
    
    console.log('🔗 [连接创建] 更新后连接数量:', updatedConnections.length);
    
    setNodes(updatedNodes);
    setConnections(updatedConnections);
    
    // 通知父组件
    onNodesChange?.(updatedNodes.filter(n => n.type !== 'start' && n.type !== 'end'));
    onConnectionsChange?.(updatedConnections.filter(c => c.id !== 'start-to-end'));
    
    saveToHistory();
  }, [nodes, connections, onNodesChange, onConnectionsChange, saveToHistory]);
  
  // 关闭节点面板
  const handleCloseNodePanel = useCallback(() => {
    setShowNodePanel(false);
    setInsertingConnectionId(null);
    setNodeAddPosition(null);
  }, []);

  // 双击节点显示错误详情
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    
    if (clickedNode && clickedNode.behaviorTreeData?.status === 'failure' && clickedNode.data?.error) {
      setErrorDetailNode(clickedNode);
      setErrorDetailVisible(true);
    }
  }, [getCanvasCoordinates, findNodeAtPosition]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: isDraggingConnection ? 'crosshair' : 
                 (hoveredConnectionPoint ? 'crosshair' : 
                 (isDraggingNode ? 'grabbing' : 
                 (canvasState.isSpacePressed ? 'grab' : 'default'))),
          backgroundColor: '#f5f7fa'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* 错误详情模态框 */}
      <Modal
        title="节点异常详情"
        open={errorDetailVisible}
        onCancel={() => setErrorDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setErrorDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {errorDetailNode && (
          <div>
            <div style={{ 
              marginBottom: '12px',
              padding: '8px 12px',
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '6px'
            }}>
              <strong>节点名称:</strong> {errorDetailNode.label}
            </div>
            <div style={{ 
              backgroundColor: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '12px',
              marginTop: '8px'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {errorDetailNode.data?.error || '未知异常'}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* 节点面板 */}
      {showNodePanel && !readonly && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleCloseNodePanel}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '600px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>选择节点类型</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: '#666' }}>基础节点</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <Button
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleAddNodeFromPanel('stage')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  阶段节点
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => handleAddNodeFromPanel('businessProcess')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  业务流程节点
                </Button>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: '#666' }}>行为树控制节点</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <Button
                  icon={<OrderedListOutlined />}
                  onClick={() => handleAddNodeFromPanel('sequence')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  顺序节点
                </Button>
                <Button
                  icon={<AppstoreOutlined />}
                  onClick={() => handleAddNodeFromPanel('parallel')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  并行节点
                </Button>
                <Button
                  icon={<QuestionCircleOutlined />}
                  onClick={() => handleAddNodeFromPanel('condition')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  条件节点
                </Button>
                <Button
                  icon={<SwapOutlined />}
                  onClick={() => handleAddNodeFromPanel('inverter')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  逆变节点
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => handleAddNodeFromPanel('repeat')}
                  style={{ height: '40px', textAlign: 'left' }}
                >
                  重复节点
                </Button>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <Button onClick={handleCloseNodePanel}>取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* 画布内属性面板 */}
      {renderPropertyPanel()}
    </div>
  );
});

BehaviorTreeCanvas.displayName = 'BehaviorTreeCanvas';

export default BehaviorTreeCanvas;
export type { FlowNode, Connection, ConnectionPoint, NodeType, BehaviorTreeCanvasRef };