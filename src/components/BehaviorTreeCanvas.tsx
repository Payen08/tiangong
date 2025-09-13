import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, message, Modal } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  HomeOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';

// 行为树节点类型
type BehaviorNodeType = 'root' | 'sequence' | 'move' | 'action' | 'condition';

// 行为树节点接口
interface BehaviorTreeNode {
  id: string;
  type: BehaviorNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  status?: 'success' | 'failure' | 'running' | 'idle';
  inputs?: ConnectionPoint[];
  outputs?: ConnectionPoint[];
  data?: any;
}



// 连接点接口
interface ConnectionPoint {
  id: string;
  type: 'input' | 'output';
  x: number;
  y: number;
  nodeId: string;
  label?: string;
}

// 连接线接口
interface BehaviorConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
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
  nodes: BehaviorTreeNode[];
  connections: BehaviorConnection[];
  canvasState: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
}

// 组件属性接口
interface BehaviorTreeCanvasProps {
  nodes: BehaviorTreeNode[];
  connections?: BehaviorConnection[];
  onNodesChange?: (nodes: BehaviorTreeNode[]) => void;
  onConnectionsChange?: (connections: BehaviorConnection[]) => void;
  readonly?: boolean;
  width?: number;
  height?: number;
}

const BehaviorTreeCanvas: React.FC<BehaviorTreeCanvasProps> = ({
  nodes: initialNodes,
  connections: initialConnections = [],
  onNodesChange,
  onConnectionsChange,
  readonly = false,
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<BehaviorTreeNode[]>(initialNodes.length > 0 ? initialNodes : [
    { id: '1', type: 'root', label: '根节点', x: 200, y: 50, width: 120, height: 60, status: 'running' },
    { id: '2', type: 'condition', label: '检查条件', x: 200, y: 150, width: 120, height: 60, status: 'success' },
    { id: '3', type: 'action', label: '执行动作A', x: 100, y: 250, width: 120, height: 60, status: 'failure', data: { error: '网络连接超时\n错误代码: TIMEOUT_ERROR\n详细信息: 连接服务器失败，请检查网络设置' } },
    { id: '4', type: 'action', label: '执行动作B', x: 300, y: 250, width: 120, height: 60, status: 'failure', data: { error: '参数验证失败\n错误代码: VALIDATION_ERROR\n详细信息: 输入参数不符合要求，期望数字类型但收到字符串' } },
  ]);
  const [connections, setConnections] = useState<BehaviorConnection[]>(initialConnections);
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
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNode, setDraggedNode] = useState<BehaviorTreeNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 连线相关状态
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [dragConnectionStart, setDragConnectionStart] = useState<ConnectionPoint | null>(null);
  const [dragConnectionEnd, setDragConnectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<ConnectionPoint | null>(null);
  
  // 选择状态
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  
  // 异常详情显示状态
  const [errorDetailVisible, setErrorDetailVisible] = useState(false);
  const [errorDetailNode, setErrorDetailNode] = useState<BehaviorTreeNode | null>(null);
  
  // 历史记录
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  // 节点类型配置
  const getNodeConfig = (type: BehaviorNodeType) => {
    switch (type) {
      case 'root':
        return { color: '#722ed1', icon: '◉', shape: 'rect' };
      case 'sequence':
        return { color: '#1890ff', icon: '⚡', shape: 'rect' };
      case 'move':
        return { color: '#52c41a', icon: '↗', shape: 'rect' };
      case 'action':
        return { color: '#fa8c16', icon: '⚙', shape: 'rect' };
      case 'condition':
        return { color: '#eb2f96', icon: '◆', shape: 'diamond' };
      default:
        return { color: '#d9d9d9', icon: '●', shape: 'rect' };
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

  // 查找位置上的节点
  const findNodeAtPosition = useCallback((x: number, y: number): BehaviorTreeNode | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }, [nodes]);

  // 查找位置上的连接点
  const findConnectionPointAtPosition = useCallback((x: number, y: number): ConnectionPoint | null => {
    for (const node of nodes) {
      // 检查输入连接点（节点顶部中心）
      const inputX = node.x + node.width / 2;
      const inputY = node.y;
      const inputDistance = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2);
      if (inputDistance <= 8) {
        return {
          id: `${node.id}_input`,
          type: 'input',
          x: inputX,
          y: inputY,
          nodeId: node.id
        };
      }
      
      // 检查输出连接点（节点底部中心）
      const outputX = node.x + node.width / 2;
      const outputY = node.y + node.height;
      const outputDistance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
      if (outputDistance <= 8) {
        return {
          id: `${node.id}_output`,
          type: 'output',
          x: outputX,
          y: outputY,
          nodeId: node.id
        };
      }
    }
    return null;
  }, [nodes]);

  // 检测异常图标点击
  const findErrorIconAtPosition = useCallback((x: number, y: number): BehaviorTreeNode | null => {
    for (const node of nodes) {
      if (node.status === 'failure') {
        // 异常图标位置：节点右下角（与绘制位置保持一致）
        const iconX = node.x + node.width - 20;
        const iconY = node.y + node.height - 8;
        const distance = Math.sqrt((x - iconX) ** 2 + (y - iconY) ** 2);
        if (distance <= 12) { // 点击范围稍大一些，便于操作
          return node;
        }
      }
    }
    return null;
  }, [nodes]);

  // 保存历史状态
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
      canvasState: {
        offsetX: canvasState.offsetX,
        offsetY: canvasState.offsetY,
        scale: canvasState.scale
      }
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [nodes, connections, canvasState, history, historyIndex]);

  // 撤销操作
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setCanvasState(prev => ({
        ...prev,
        ...prevState.canvasState
      }));
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // 重做操作
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setCanvasState(prev => ({
        ...prev,
        ...nextState.canvasState
      }));
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // 计算内容边界
  const getContentBounds = useCallback(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: width, maxY: height };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    // 添加边距
    const margin = 100;
    return {
      minX: minX - margin,
      minY: minY - margin,
      maxX: maxX + margin,
      maxY: maxY + margin
    };
  }, [nodes, width, height]);

  // 重置画布到初始状态并适应内容
  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const bounds = getContentBounds();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // 计算内容尺寸
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    // 计算适合的缩放比例，留出一些边距
    const scaleX = (canvasWidth * 0.8) / contentWidth;
    const scaleY = (canvasHeight * 0.8) / contentHeight;
    const scale = Math.min(Math.max(0.1, Math.min(scaleX, scaleY)), 3);
    
    // 计算居中的偏移量
    const scaledContentWidth = contentWidth * scale;
    const scaledContentHeight = contentHeight * scale;
    const offsetX = (canvasWidth - scaledContentWidth) / 2 - bounds.minX * scale;
    const offsetY = (canvasHeight - scaledContentHeight) / 2 - bounds.minY * scale;
    
    setCanvasState({
      offsetX,
      offsetY,
      scale,
      isDragging: false,
      isSpacePressed: false,
      lastMouseX: 0,
      lastMouseY: 0
    });
  }, [getContentBounds]);

  // 缩放功能
  const zoomIn = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale / 1.2)
    }));
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: false, isDragging: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    // 检查异常图标点击
    const errorNode = findErrorIconAtPosition(canvasPos.x, canvasPos.y);
    if (errorNode) {
      setErrorDetailNode(errorNode);
      setErrorDetailVisible(true);
      return;
    }
    
    // 检查连接点
    const connectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
    if (connectionPoint && connectionPoint.type === 'output') {
      setIsDraggingConnection(true);
      setDragConnectionStart(connectionPoint);
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      return;
    }
    
    // 检查节点 - 禁用节点拖动功能
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      return;
    }
    
    // 空白区域 - 开始拖拽画布
    if (canvasState.isSpacePressed) {
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else {
      setSelectedNode(null);
    }
  }, [readonly, getCanvasCoordinates, findErrorIconAtPosition, findConnectionPointAtPosition, findNodeAtPosition, canvasState.isSpacePressed]);

  // 限制画布拖动范围
  const constrainOffset = useCallback((offsetX: number, offsetY: number, scale: number) => {
    const bounds = getContentBounds();
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX, offsetY };
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // 计算内容在当前缩放下的尺寸
    const contentWidth = (bounds.maxX - bounds.minX) * scale;
    const contentHeight = (bounds.maxY - bounds.minY) * scale;
    
    // 限制拖动范围，确保内容不会完全移出视野
    const maxOffsetX = Math.max(0, contentWidth - canvasWidth * 0.2);
    const minOffsetX = Math.min(0, canvasWidth - contentWidth + canvasWidth * 0.2);
    const maxOffsetY = Math.max(0, contentHeight - canvasHeight * 0.2);
    const minOffsetY = Math.min(0, canvasHeight - contentHeight + canvasHeight * 0.2);
    
    return {
      offsetX: Math.max(minOffsetX, Math.min(maxOffsetX, offsetX)),
      offsetY: Math.max(minOffsetY, Math.min(maxOffsetY, offsetY))
    };
  }, [getContentBounds]);

  // 鼠标移动事件
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (isDraggingConnection) {
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      if (targetPoint && targetPoint.type === 'input' && dragConnectionStart && targetPoint.nodeId !== dragConnectionStart.nodeId) {
        setHoveredConnectionPoint(targetPoint);
      } else {
        setHoveredConnectionPoint(null);
      }
    } else if (canvasState.isDragging && canvasState.isSpacePressed) {
      const deltaX = e.clientX - canvasState.lastMouseX;
      const deltaY = e.clientY - canvasState.lastMouseY;
      
      const newOffsetX = canvasState.offsetX + deltaX;
      const newOffsetY = canvasState.offsetY + deltaY;
      
      // 应用边界限制
      const constrainedOffset = constrainOffset(newOffsetX, newOffsetY, canvasState.scale);
      
      setCanvasState(prev => ({
        ...prev,
        offsetX: constrainedOffset.offsetX,
        offsetY: constrainedOffset.offsetY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else {
      const hoveredPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnectionPoint(hoveredPoint);
    }
  }, [isDraggingConnection, canvasState.isDragging, canvasState.isSpacePressed, canvasState.lastMouseX, canvasState.lastMouseY, canvasState.offsetX, canvasState.offsetY, canvasState.scale, getCanvasCoordinates, findConnectionPointAtPosition, dragConnectionStart, constrainOffset]);

  // 鼠标抬起事件
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      
      if (targetPoint && 
          dragConnectionStart.type === 'output' && 
          targetPoint.type === 'input' &&
          dragConnectionStart.nodeId !== targetPoint.nodeId) {
        
        const existingConnection = connections.find(conn => 
          conn.sourceId === dragConnectionStart.nodeId && 
          conn.targetId === targetPoint.nodeId
        );
        
        if (!existingConnection) {
          const newConnection: BehaviorConnection = {
            id: `connection_${Date.now()}`,
            sourceId: dragConnectionStart.nodeId,
            targetId: targetPoint.nodeId,
            sourcePoint: { x: dragConnectionStart.x, y: dragConnectionStart.y },
            targetPoint: { x: targetPoint.x, y: targetPoint.y }
          };
          
          setConnections(prev => [...prev, newConnection]);
          message.success('连接创建成功');
        } else {
          message.warning('连接已存在');
        }
      }
      
      setIsDraggingConnection(false);
      setDragConnectionStart(null);
      setDragConnectionEnd(null);
    } else if (canvasState.isDragging) {
      setCanvasState(prev => ({ ...prev, isDragging: false }));
      saveToHistory();
    }
    
    setHoveredConnectionPoint(null);
  }, [isDraggingConnection, dragConnectionStart, dragConnectionEnd, connections, canvasState.isDragging, getCanvasCoordinates, findConnectionPointAtPosition, saveToHistory]);

  // 滚轮缩放事件
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - canvasState.offsetX) / canvasState.scale;
    const worldY = (mouseY - canvasState.offsetY) / canvasState.scale;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasState.scale * delta));
    
    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;
    
    // 应用边界限制
    const constrainedOffset = constrainOffset(newOffsetX, newOffsetY, newScale);
    
    setCanvasState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: constrainedOffset.offsetX,
      offsetY: constrainedOffset.offsetY
    }));
    
    saveToHistory();
  }, [canvasState, saveToHistory, constrainOffset]);

  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const gridSize = 20;
    
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // 计算当前视口在世界坐标系中的范围
    const viewportLeft = -canvasState.offsetX / canvasState.scale;
    const viewportTop = -canvasState.offsetY / canvasState.scale;
    const viewportRight = viewportLeft + canvasWidth;
    const viewportBottom = viewportTop + canvasHeight;

    // 计算网格线的起始和结束位置，覆盖整个可视区域
    const startX = Math.floor(viewportLeft / gridSize) * gridSize;
    const endX = Math.ceil(viewportRight / gridSize) * gridSize;
    const startY = Math.floor(viewportTop / gridSize) * gridSize;
    const endY = Math.ceil(viewportBottom / gridSize) * gridSize;

    // 绘制垂直网格线
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // 绘制水平网格线
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale]);

  // 绘制贝塞尔曲线连接线
  const drawBezierConnection = useCallback((ctx: CanvasRenderingContext2D, connection: BehaviorConnection, isHovered: boolean = false) => {
    const { sourcePoint, targetPoint } = connection;
    
    ctx.save();
    ctx.strokeStyle = isHovered ? '#1890ff' : '#666666';
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.setLineDash([]);
    
    const controlOffset = Math.abs(targetPoint.y - sourcePoint.y) * 0.5;
    const cp1x = sourcePoint.x;
    const cp1y = sourcePoint.y + controlOffset;
    const cp2x = targetPoint.x;
    const cp2y = targetPoint.y - controlOffset;
    
    ctx.beginPath();
    ctx.moveTo(sourcePoint.x, sourcePoint.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, targetPoint.x, targetPoint.y);
    ctx.stroke();
    
    // 绘制箭头
    const arrowSize = 8;
    const angle = Math.atan2(cp2y - targetPoint.y, cp2x - targetPoint.x);
    
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(targetPoint.x, targetPoint.y);
    ctx.lineTo(
      targetPoint.x + arrowSize * Math.cos(angle + Math.PI * 0.8),
      targetPoint.y + arrowSize * Math.sin(angle + Math.PI * 0.8)
    );
    ctx.lineTo(
      targetPoint.x + arrowSize * Math.cos(angle - Math.PI * 0.8),
      targetPoint.y + arrowSize * Math.sin(angle - Math.PI * 0.8)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, []);

  // 绘制节点
  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: BehaviorTreeNode) => {
    const { x, y, width, height, type, label, status } = node;
    const isSelected = selectedNode === node.id;
    const config = getNodeConfig(type);
    const isError = status === 'failure';
    
    ctx.save();
    
    // 绘制阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 绘制节点背景 - 树根节点为深灰色，异常节点为浅红色背景，其他节点为白色
    if (type === 'root') {
      ctx.fillStyle = '#2c3e50';
    } else if (isError) {
      ctx.fillStyle = '#fff2f0'; // 异常节点浅红色背景
    } else {
      ctx.fillStyle = '#ffffff';
    }
    
    const radius = 8;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    // 异常节点添加红色边框
    if (isError) {
      ctx.strokeStyle = '#ff4d4f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 绘制状态指示器
    if (status) {
      ctx.fillStyle = getStatusColor(status);
      ctx.beginPath();
      ctx.arc(x + width - 8, y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制图标
    ctx.fillStyle = type === 'root' ? '#ffffff' : config.color;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(config.icon, x + 20, y + height / 2 + 6);
    
    // 绘制标签 - 树根节点文字为白色，其他节点为黑色
    ctx.fillStyle = type === 'root' ? '#ffffff' : '#333333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const maxWidth = width - 45;
    const text = label.length > 10 ? label.substring(0, 10) + '...' : label;
    ctx.fillText(text, x + 35, y + height / 2 + 5);
    
    // 异常节点绘制异常详情查看图标
    if (isError) {
      // 先绘制异常图标的圆形背景
      ctx.fillStyle = '#fff2f0';
      ctx.strokeStyle = '#ff4d4f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + width - 20, y + height - 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // 再绘制异常图标
      ctx.fillStyle = '#ff4d4f';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + width - 20, y + height - 8);
    }
    
    // 绘制连接点 - 在节点上下位置（树根节点不绘制端点）
    if (type !== 'root') {
      // 输入端点（节点顶部）
      const inputX = x + width / 2;
      const inputY = y;
      const isInputHovered = hoveredConnectionPoint?.nodeId === node.id && hoveredConnectionPoint?.type === 'input';
      
      ctx.fillStyle = isInputHovered ? '#1890ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(inputX, inputY, isInputHovered ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isInputHovered ? '#1890ff' : '#666666';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 输出端点（节点底部）
      const outputX = x + width / 2;
      const outputY = y + height;
      const isOutputHovered = hoveredConnectionPoint?.nodeId === node.id && hoveredConnectionPoint?.type === 'output';
      
      ctx.fillStyle = isOutputHovered ? '#1890ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(outputX, outputY, isOutputHovered ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isOutputHovered ? '#1890ff' : '#666666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }, [selectedNode, hoveredConnectionPoint]);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 应用变换
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    // 绘制网格
    drawGrid(ctx, canvas.width / canvasState.scale, canvas.height / canvasState.scale);
    
    // 绘制连接线
    connections.forEach(connection => {
      // 查找源节点和目标节点
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        // 计算源节点输出端点位置（底部中心）
        const sourcePoint = {
          x: sourceNode.x + sourceNode.width / 2,
          y: sourceNode.y + sourceNode.height
        };
        
        // 计算目标节点输入端点位置（顶部中心）
        const targetPoint = {
          x: targetNode.x + targetNode.width / 2,
          y: targetNode.y
        };
        
        // 更新连接线的端点位置
        const updatedConnection = {
          ...connection,
          sourcePoint,
          targetPoint
        };
        
        const isHovered = hoveredConnection === connection.id;
        drawBezierConnection(ctx, updatedConnection, isHovered);
      }
    });
    
    // 绘制正在拖拽的连接线
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const controlOffset = Math.abs(dragConnectionEnd.y - dragConnectionStart.y) * 0.5;
      const cp1x = dragConnectionStart.x;
      const cp1y = dragConnectionStart.y + controlOffset;
      const cp2x = dragConnectionEnd.x;
      const cp2y = dragConnectionEnd.y - controlOffset;
      
      ctx.beginPath();
      ctx.moveTo(dragConnectionStart.x, dragConnectionStart.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, dragConnectionEnd.x, dragConnectionEnd.y);
      ctx.stroke();
    }
    
    // 绘制节点
    nodes.forEach(node => {
      drawNode(ctx, node);
    });
    
    ctx.restore();
  }, [canvasState, nodes, connections, isDraggingConnection, dragConnectionStart, dragConnectionEnd, hoveredConnection, drawGrid, drawBezierConnection, drawNode]);

  // 监听容器大小变化并调整canvas尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect;
        
        // 设置canvas的实际尺寸
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // 重新绘制
        draw();
      }
    });
    
    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [draw]);

  // 绘制循环
  useEffect(() => {
    draw();
  }, [draw]);

  // 同步外部数据变化
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  // 通知外部数据变化
  useEffect(() => {
    onNodesChange?.(nodes);
  }, [nodes, onNodesChange]);

  useEffect(() => {
    onConnectionsChange?.(connections);
  }, [connections, onConnectionsChange]);

  return (
    <div 
      className="behavior-tree-canvas" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        background: '#fafafa',
        border: '1px solid #d9d9d9',
        borderRadius: '6px'
      }}
    >
      {/* 工具栏 */}
      <div 
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Button 
          size="small" 
          icon={<UndoOutlined />} 
          onClick={undo}
          disabled={historyIndex <= 0}
          title="撤销"
        />
        <Button 
          size="small" 
          icon={<RedoOutlined />} 
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="重做"
        />
        <Button 
          size="small" 
          icon={<ZoomInOutlined />} 
          onClick={zoomIn}
          title="放大"
        />
        <Button 
          size="small" 
          icon={<ZoomOutOutlined />} 
          onClick={zoomOut}
          title="缩小"
        />
        <Button 
          size="small" 
          icon={<HomeOutlined />} 
          onClick={resetCanvas}
          title="适应内容"
        />
      </div>
      
      {/* 画布 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: canvasState.isSpacePressed ? 'grab' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        tabIndex={0}
      />
      
      {/* 状态提示 */}
      <div 
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}
      >
        缩放: {Math.round(canvasState.scale * 100)}% | 按住空格键拖拽画布
      </div>
      
      {/* 异常详情弹窗 */}
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
            <p><strong>节点名称:</strong> {errorDetailNode.label}</p>
             <p><strong>节点类型:</strong> {errorDetailNode.type}</p>
            <p><strong>节点状态:</strong> <span style={{ color: '#ff4d4f' }}>异常</span></p>
            <p><strong>异常信息:</strong></p>
            <div style={{ 
              background: '#fff2f0', 
              border: '1px solid #ffccc7', 
              borderRadius: '4px', 
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
};

export default BehaviorTreeCanvas;
export type { BehaviorTreeNode, BehaviorConnection, ConnectionPoint, BehaviorNodeType };