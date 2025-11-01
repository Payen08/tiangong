import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button, message, Modal } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  HomeOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';

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
}

const BehaviorTreeCanvas = forwardRef<BehaviorTreeCanvasRef, BehaviorTreeCanvasProps>(({
  nodes: initialNodes,
  connections: initialConnections = [],
  onNodesChange,
  onConnectionsChange,
  readonly = false,
  width = 800,
  height = 600
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 直接使用传入的节点，不创建默认节点
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
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
  const [dragConnectionStart, setDragConnectionStart] = useState<{nodeId: string, type: 'input' | 'output', x: number, y: number} | null>(null);
  const [dragConnectionEnd, setDragConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{nodeId: string, type: 'input' | 'output'} | null>(null);
  
  // 选择状态
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  
  // 异常详情显示状态
  const [errorDetailVisible, setErrorDetailVisible] = useState(false);
  const [errorDetailNode, setErrorDetailNode] = useState<FlowNode | null>(null);
  
  // 历史记录
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 使用ref来存储上一次的props值，避免循环依赖
  const prevInitialNodesRef = useRef<FlowNode[]>([]);
  const prevInitialConnectionsRef = useRef<Connection[]>([]);

  // 同步props变化 - 避免循环依赖
  useEffect(() => {
    if (initialNodes) {
      // 检查是否真的需要更新
      const nodesChanged = JSON.stringify(prevInitialNodesRef.current) !== JSON.stringify(initialNodes);
      if (nodesChanged) {
        setNodes(initialNodes);
        prevInitialNodesRef.current = initialNodes;
      }
    }
  }, [initialNodes]);

  useEffect(() => {
    if (initialConnections && initialConnections.length >= 0) {
      // 检查是否真的需要更新
      const connectionsChanged = JSON.stringify(prevInitialConnectionsRef.current) !== JSON.stringify(initialConnections);
      if (connectionsChanged) {
        setConnections(initialConnections);
        prevInitialConnectionsRef.current = initialConnections;
      }
    }
  }, [initialConnections]);

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

  // 查找指定位置的连接点
  const findConnectionPointAtPosition = useCallback((x: number, y: number): {nodeId: string, type: 'input' | 'output'} | null => {
    for (const node of nodes) {
      // 检查输入连接点（左侧）
      const inputX = node.x;
      const inputY = node.y + node.height / 2;
      const inputDistance = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2);
      if (inputDistance <= 8) {
        return { nodeId: node.id, type: 'input' };
      }
      
      // 检查输出连接点（右侧）
      const outputX = node.x + node.width;
      const outputY = node.y + node.height / 2;
      const outputDistance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
      if (outputDistance <= 8) {
        return { nodeId: node.id, type: 'output' };
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
        const startX = sourceNode.x + sourceNode.width;
        const startY = sourceNode.y + sourceNode.height / 2;
        const endX = targetNode.x;
        const endY = targetNode.y + targetNode.height / 2;
        
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
      // 行为树控制节点绘制
      // 绘制阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 根据节点类型设置不同的背景色和边框色
      let bgColor = '#ffffff';
      let borderColor = color;
      
      if (type === 'sequence') {
        bgColor = isSelected ? '#e6f7ff' : '#ffffff';
        borderColor = isInvalid ? '#ff4d4f' : (isSelected ? '#1890ff' : '#1890ff');
      } else if (type === 'parallel') {
        bgColor = isSelected ? '#f6ffed' : '#ffffff';
        borderColor = isInvalid ? '#ff4d4f' : (isSelected ? '#52c41a' : '#52c41a');
      } else if (type === 'condition') {
        bgColor = isSelected ? '#fff7e6' : '#ffffff';
        borderColor = isInvalid ? '#ff4d4f' : (isSelected ? '#fa8c16' : '#fa8c16');
      } else if (type === 'inverter') {
        bgColor = isSelected ? '#f9f0ff' : '#ffffff';
        borderColor = isInvalid ? '#ff4d4f' : (isSelected ? '#722ed1' : '#722ed1');
      } else if (type === 'repeat') {
        bgColor = isSelected ? '#fff1f0' : '#ffffff';
        borderColor = isInvalid ? '#ff4d4f' : (isSelected ? '#f5222d' : '#f5222d');
      }
      
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isInvalid ? 2 : (isSelected ? 2 : 1);
      
      // 所有节点都绘制为圆角矩形
      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      
      // 清除阴影设置
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.stroke();
      
      // 绘制连接口小圆圈
      if (!readonly) {
        ctx.fillStyle = borderColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        
        // 所有节点的输入口都在左侧中点
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
        
        // 右侧输出口 - 根据节点类型决定是否有多个输出
        if (type === 'parallel') {
          // 并行节点只有一个蓝色输出口
          const outputX = x + width;
          const outputY = y + height / 2;
          
          const isOutputHovered = hoveredConnectionPoint && 
                                hoveredConnectionPoint.nodeId === node.id && 
                                hoveredConnectionPoint.type === 'output';
          
          const outputRadius = isOutputHovered ? 6 : 4;
          
          // 设置蓝色输出口
          ctx.fillStyle = '#1890ff';
          ctx.strokeStyle = '#1890ff';
          
          // 绘制输出口
          ctx.beginPath();
          ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else if (type === 'condition') {
          // 条件节点根据条件组数量动态显示输出端点
          const conditionGroups = node.behaviorTreeData?.conditionGroups || [];
          const outputCount = Math.max(conditionGroups.length, 1); // 至少有一个输出端点
          
          // 计算输出端点的垂直间距
          const outputSpacing = height / (outputCount + 1);
          
          // 为每个条件组绘制一个输出端点
          for (let i = 0; i < outputCount; i++) {
            const outputX = x + width;
            const outputY = y + outputSpacing * (i + 1);
            
            const isOutputHovered = hoveredConnectionPoint && 
                                    hoveredConnectionPoint.nodeId === node.id && 
                                    hoveredConnectionPoint.type === 'output';
            
            const outputRadius = isOutputHovered ? 6 : 4;
            
            // 根据索引设置不同颜色
            const colors = ['#52c41a', '#1890ff', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2'];
            const color = colors[i % colors.length];
            
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // 其他节点（sequence、inverter、repeat）单个输出口
          const outputX = x + width;
          const outputY = y + height / 2;
          const isOutputHovered = hoveredConnectionPoint && 
                                hoveredConnectionPoint.nodeId === node.id && 
                                hoveredConnectionPoint.type === 'output';
          const outputRadius = isOutputHovered ? 6 : 4;
          
          // 设置输出口颜色
          ctx.fillStyle = borderColor;
          ctx.strokeStyle = borderColor;
          
          ctx.beginPath();
          ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
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
      // 其他节点类型的文字绘制
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
    }
    
    ctx.restore();
  }, [canvasState, selectedNode, hoveredConnectionPoint, readonly, getStatusColor, getNodeColor]);

  // 绘制连接线
  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    connections.forEach(connection => {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        const startX = sourceNode.x + sourceNode.width;
        const startY = sourceNode.y + sourceNode.height / 2;
        const endX = targetNode.x;
        const endY = targetNode.y + targetNode.height / 2;
        
        const isSelected = selectedConnection === connection.id;
        const isHovered = hoveredConnection === connection.id;
        
        ctx.strokeStyle = isSelected ? '#1890ff' : (isHovered ? '#40a9ff' : '#d9d9d9');
        ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : 2);
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

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    // 检查连接点
    const clickedConnectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
    if (clickedConnectionPoint && !readonly) {
      const sourceNode = nodes.find(n => n.id === clickedConnectionPoint.nodeId);
      if (sourceNode) {
        const pointX = clickedConnectionPoint.type === 'input' ? sourceNode.x : sourceNode.x + sourceNode.width;
        const pointY = sourceNode.y + sourceNode.height / 2;
        
        setIsDraggingConnection(true);
        setDragConnectionStart({
          nodeId: clickedConnectionPoint.nodeId,
          type: clickedConnectionPoint.type,
          x: pointX,
          y: pointY
        });
        setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
        setSelectedNode(null);
        setSelectedConnection(null);
      }
      return;
    }
    
    // 检查节点
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    if (clickedNode && !readonly) {
      setSelectedNode(clickedNode.id);
      setSelectedConnection(null);
      setDraggedNode(clickedNode);
      setIsDraggingNode(true);
      setDragOffset({
        x: canvasPos.x - clickedNode.x,
        y: canvasPos.y - clickedNode.y
      });
      return;
    }
    
    // 检查连接线
    const clickedConnection = findConnectionAtPosition(canvasPos.x, canvasPos.y);
    if (clickedConnection) {
      setSelectedConnection(clickedConnection);
      setSelectedNode(null);
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
    }
  }, [getCanvasCoordinates, findConnectionPointAtPosition, findNodeAtPosition, findConnectionAtPosition, nodes, readonly]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (isDraggingConnection) {
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      
      // 检测目标连接点
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnectionPoint(targetPoint);
    } else if (isDraggingNode && draggedNode && !readonly) {
      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;
      
      const updatedNodes = nodes.map(node =>
        node.id === draggedNode.id ? { ...node, x: newX, y: newY } : node
      );
      setNodes(updatedNodes);
      onNodesChange?.(updatedNodes);
    } else if (canvasState.isDragging) {
      const deltaX = e.clientX - canvasState.lastMouseX;
      const deltaY = e.clientY - canvasState.lastMouseY;
      
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else {
      // 更新悬停状态
      const hoveredConnectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnectionPoint(hoveredConnectionPoint);
      
      const hoveredConnectionId = findConnectionAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnection(hoveredConnectionId);
    }
  }, [isDraggingConnection, isDraggingNode, draggedNode, dragOffset, canvasState.isDragging, canvasState.lastMouseX, canvasState.lastMouseY, getCanvasCoordinates, findConnectionPointAtPosition, findConnectionAtPosition, nodes, onNodesChange, readonly]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      
      if (targetPoint && targetPoint.nodeId !== dragConnectionStart.nodeId) {
        // 创建新连接
        const sourceNode = nodes.find(n => n.id === dragConnectionStart.nodeId);
        const targetNode = nodes.find(n => n.id === targetPoint.nodeId);
        
        if (sourceNode && targetNode) {
          const newConnection: Connection = {
            id: `connection_${Date.now()}`,
            sourceId: dragConnectionStart.nodeId,
            targetId: targetPoint.nodeId,
            sourcePoint: { x: dragConnectionStart.x, y: dragConnectionStart.y },
            targetPoint: { x: targetPoint.nodeId === targetNode.id ? targetNode.x : targetNode.x + targetNode.width, y: targetNode.y + targetNode.height / 2 }
          };
          
          const updatedConnections = [...connections, newConnection];
          setConnections(updatedConnections);
          onConnectionsChange?.(updatedConnections);
          saveToHistory();
        }
      }
      
      setIsDraggingConnection(false);
      setDragConnectionStart(null);
      setDragConnectionEnd(null);
    } else if (isDraggingNode && !readonly) {
      setIsDraggingNode(false);
      setDraggedNode(null);
      saveToHistory();
    } else if (canvasState.isDragging) {
      setCanvasState(prev => ({ ...prev, isDragging: false }));
    }
  }, [isDraggingConnection, isDraggingNode, canvasState.isDragging, dragConnectionStart, dragConnectionEnd, getCanvasCoordinates, findConnectionPointAtPosition, nodes, connections, onConnectionsChange, saveToHistory, readonly]);

  const handleMouseLeave = useCallback(() => {
    setCanvasState(prev => ({ ...prev, isDragging: false }));
    setIsDraggingConnection(false);
    setIsDraggingNode(false);
    setDraggedNode(null);
    setDragConnectionStart(null);
    setDragConnectionEnd(null);
    setHoveredConnectionPoint(null);
    setHoveredConnection(null);
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
      } else if (e.key === 'Delete' && selectedConnection && !readonly) {
        const updatedConnections = connections.filter(conn => conn.id !== selectedConnection);
        setConnections(updatedConnections);
        onConnectionsChange?.(updatedConnections);
        setSelectedConnection(null);
        saveToHistory();
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
  }, [selectedConnection, connections, onConnectionsChange, saveToHistory, readonly]);

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
      
      onNodesChange?.(state.nodes);
      onConnectionsChange?.(state.connections);
    }
  }, [historyIndex, history, onNodesChange, onConnectionsChange]);

  // 重做操作
  const handleRedo = useCallback(() => {
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
      
      onNodesChange?.(state.nodes);
      onConnectionsChange?.(state.connections);
    }
  }, [historyIndex, history, onNodesChange, onConnectionsChange]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleZoomIn,
    handleZoomOut,
    handleResetCanvas,
    handleUndo,
    handleRedo
  }), [handleZoomIn, handleZoomOut, handleResetCanvas, handleUndo, handleRedo]);

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

  }, [canvasState, nodes, connections, drawGrid, drawConnections, drawNode]);

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
    </div>
  );
});

BehaviorTreeCanvas.displayName = 'BehaviorTreeCanvas';

export default BehaviorTreeCanvas;
export type { FlowNode, Connection, ConnectionPoint, NodeType, BehaviorTreeCanvasRef };