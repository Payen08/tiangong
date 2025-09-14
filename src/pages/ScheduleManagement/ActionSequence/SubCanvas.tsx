import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  message,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  HomeOutlined,
  PlusOutlined,
  ApiOutlined,
  // BranchesOutlined,
  // ClockCircleOutlined,
  SettingOutlined,
  DeleteOutlined,
  CloseOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
// const { Option } = Select;

// 子画布视图配置接口
interface SubCanvasViewConfig {
  scale: number;
  offsetX: number;
  offsetY: number;
  gridSize: number;
  showGrid: boolean;
}

// 子流程数据接口
interface SubProcessData {
  nodes: FlowNode[];
  connections: Connection[];
  viewConfig: SubCanvasViewConfig;
  metadata: {
    name: string;
    description?: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
  settings: {
    autoLayout: boolean;
    snapToGrid: boolean;
    allowCrossConnections: boolean;
    maxNodes: number;
  };
}

// 节点类型
type NodeType = 'start' | 'end' | 'process' | 'businessProcess';

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
  demandDevicesTriggerCondition?: string; // 需求方设备触发条件
  supplyDevicesTriggerCondition?: string; // 供给方设备触发条件
  demandDevices?: string[];
  supplyDevices?: string[];
  demandDevicesNames?: string; // 需求方设备中文名称
  supplyDevicesNames?: string; // 供给方设备中文名称
  data?: any;
}

// 连接线接口
interface Connection {
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

// 节点工具接口
interface NodeTool {
  type: NodeType;
  icon: React.ReactNode;
  label: string;
  color: string;
}

// 子画布组件属性
interface SubCanvasProps {
  visible: boolean;
  onClose: () => void;
  subProcessData: SubProcessData;
  onSave: (data: SubProcessData) => void;
  parentNodeId: string;
  parentNodeName: string;
}

const SubCanvas: React.FC<SubCanvasProps> = ({
  visible,
  onClose,
  subProcessData,
  onSave,
  // parentNodeId,
  parentNodeName,
}) => {
  // 画布引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 状态管理
  const [nodes, setNodes] = useState<FlowNode[]>(subProcessData.nodes || []);
  const [connections, setConnections] = useState<Connection[]>(subProcessData.connections || []);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: subProcessData.viewConfig.offsetX || 0,
    offsetY: subProcessData.viewConfig.offsetY || 0,
    scale: subProcessData.viewConfig.scale || 1,
    isDragging: false,
    isSpacePressed: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });
  
  // 交互状态
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{nodeId: string, type: 'input' | 'output'} | null>(null);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [dragConnectionStart, setDragConnectionStart] = useState<{nodeId: string, type: 'input' | 'output', x: number, y: number} | null>(null);
  const [dragConnectionEnd, setDragConnectionEnd] = useState<{x: number, y: number} | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{visible: boolean, x: number, y: number, nodeId?: string} | null>(null);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [nodeEditForm] = Form.useForm();
  
  // 节点工具配置
  const nodeTools: NodeTool[] = [
    {
      type: 'start',
      icon: <PlayCircleOutlined />,
      label: '开始',
      color: '#52c41a'
    },
    {
      type: 'process',
      icon: <SettingOutlined />,
      label: '阶段',
      color: '#1890ff'
    },
    {
      type: 'end',
      icon: <CloseOutlined />,
      label: '结束',
      color: '#ff4d4f'
    }
  ];
  
  // 获取画布坐标
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const y = (clientY - rect.top - canvasState.offsetY) / canvasState.scale;
    
    return { x, y };
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale]);
  
  // 查找位置上的节点
  const findNodeAtPosition = useCallback((x: number, y: number) => {
    return nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );
  }, [nodes]);
  
  // 查找连接点
  const findConnectionPointAtPosition = useCallback((x: number, y: number) => {
    for (const node of nodes) {
      const { x: nodeX, y: nodeY, width, height, type } = node;
      
      if (type === 'start') {
        // 开始节点只有输出连接点
        const outputX = nodeX + width;
        const outputY = nodeY + height / 2;
        if (Math.abs(x - outputX) <= 8 && Math.abs(y - outputY) <= 8) {
          return { nodeId: node.id, type: 'output' as const, x: outputX, y: outputY };
        }
      } else if (type === 'end') {
        // 结束节点只有输入连接点
        const inputX = nodeX;
        const inputY = nodeY + height / 2;
        if (Math.abs(x - inputX) <= 8 && Math.abs(y - inputY) <= 8) {
          return { nodeId: node.id, type: 'input' as const, x: inputX, y: inputY };
        }
      } else if (type === 'process') {
        // 阶段节点有输入和输出连接点
        const inputX = nodeX;
        const inputY = nodeY + height / 2;
        const outputX = nodeX + width;
        const outputY = nodeY + height / 2;
        
        if (Math.abs(x - inputX) <= 8 && Math.abs(y - inputY) <= 8) {
          return { nodeId: node.id, type: 'input' as const, x: inputX, y: inputY };
        }
        if (Math.abs(x - outputX) <= 8 && Math.abs(y - outputY) <= 8) {
          return { nodeId: node.id, type: 'output' as const, x: outputX, y: outputY };
        }
      }
    }
    return null;
  }, [nodes]);
  
  // 查找连接线
  const findConnectionAtPosition = useCallback((x: number, y: number) => {
    for (const connection of connections) {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        const startX = sourceNode.x + sourceNode.width;
        const startY = sourceNode.y + sourceNode.height / 2;
        const endX = targetNode.x;
        const endY = targetNode.y + targetNode.height / 2;
        
        // 简单的线段距离检测
        const distance = Math.abs((endY - startY) * x - (endX - startX) * y + endX * startY - endY * startX) /
                        Math.sqrt((endY - startY) ** 2 + (endX - startX) ** 2);
        
        if (distance <= 5) {
          return connection.id;
        }
      }
    }
    return null;
  }, [connections, nodes]);
  
  // 添加节点
  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const nodeConfig = nodeTools.find(tool => tool.type === type);
    if (!nodeConfig) return;
    
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type,
      x: x - 60, // 居中放置
      y: y - 30,
      width: 120,
      height: 60,
      label: nodeConfig.label,
    };
    
    setNodes(prev => [...prev, newNode]);
    setShowNodePanel(false);
    message.success(`${nodeConfig.label}节点添加成功`);
  }, [nodeTools]);
  
  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceId !== nodeId && conn.targetId !== nodeId
    ));
    setSelectedNode(null);
    message.success('节点删除成功');
  }, []);
  
  // 删除连接线
  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    setHoveredConnection(null);
    message.success('连接线删除成功');
  }, []);
  
  // 复制节点
  const copyNode = useCallback((nodeId: string) => {
    const nodeToCopy = nodes.find(node => node.id === nodeId);
    if (!nodeToCopy) return;
    
    const newNode: FlowNode = {
      ...nodeToCopy,
      id: `node_${Date.now()}`,
      x: nodeToCopy.x + 20,
      y: nodeToCopy.y + 20,
      label: `${nodeToCopy.label}副本`
    };
    
    setNodes(prev => [...prev, newNode]);
    message.success('节点复制成功');
  }, [nodes]);
  
  // 编辑节点
  const editNode = useCallback((nodeId: string) => {
    const nodeToEdit = nodes.find(node => node.id === nodeId);
    if (!nodeToEdit) return;
    
    setEditingNode(nodeToEdit);
    nodeEditForm.setFieldsValue({
      label: nodeToEdit.label,
      customName: nodeToEdit.customName || '',
      triggerCondition: nodeToEdit.triggerCondition || ''
    });
  }, [nodes, nodeEditForm]);
  
  // 保存节点编辑
  const saveNodeEdit = useCallback((values: any) => {
    if (!editingNode) return;
    
    setNodes(prev => prev.map(node => 
      node.id === editingNode.id 
        ? { ...node, ...values }
        : node
    ));
    
    setEditingNode(null);
    nodeEditForm.resetFields();
    message.success('节点更新成功');
  }, [editingNode, nodeEditForm]);
  
  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20 * canvasState.scale;
    const offsetX = canvasState.offsetX % gridSize;
    const offsetY = canvasState.offsetY % gridSize;

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // 绘制垂直线
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [canvasState.scale, canvasState.offsetX, canvasState.offsetY]);
  
  // 绘制节点
  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: FlowNode) => {
    const { x, y, width, height, type, label } = node;
    const isSelected = selectedNode === node.id;
    
    // 获取节点配置
    const nodeConfig = nodeTools.find(tool => tool.type === type);
    const color = nodeConfig?.color || '#1890ff';
    
    // 应用画布变换
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    // 绘制节点背景
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = isSelected ? '#1890ff' : '#cccccc';
    ctx.lineWidth = isSelected ? 2 : 1;
    
    const radius = 8;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    ctx.stroke();
    
    // 绘制连接点
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    if (type === 'start') {
      // 开始节点右侧输出口
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
    } else if (type === 'end') {
      // 结束节点左侧输入口
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
    } else if (type === 'process') {
      // 阶段节点左右两侧连接点
      const inputX = x;
      const inputY = y + height / 2;
      const outputX = x + width;
      const outputY = y + height / 2;
      
      const isInputHovered = hoveredConnectionPoint && 
                            hoveredConnectionPoint.nodeId === node.id && 
                            hoveredConnectionPoint.type === 'input';
      const isOutputHovered = hoveredConnectionPoint && 
                             hoveredConnectionPoint.nodeId === node.id && 
                             hoveredConnectionPoint.type === 'output';
      
      const inputRadius = isInputHovered ? 6 : 4;
      const outputRadius = isOutputHovered ? 6 : 4;
      
      // 输入连接点
      ctx.beginPath();
      ctx.arc(inputX, inputY, inputRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // 输出连接点
      ctx.beginPath();
      ctx.arc(outputX, outputY, outputRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    // 绘制节点文本
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2);
    
    ctx.restore();
  }, [canvasState, selectedNode, hoveredConnectionPoint, nodeTools]);
  
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
        
        // 设置连线样式
        const isHovered = hoveredConnection === connection.id;
        ctx.strokeStyle = isHovered ? '#1890ff' : '#666666';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.setLineDash([]);
        
        // 绘制连线
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 绘制箭头
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
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
    
    ctx.restore();
  }, [canvasState, connections, nodes, hoveredConnection]);
  
  // 绘制拖拽中的连线
  const drawDragConnection = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDraggingConnection || !dragConnectionStart || !dragConnectionEnd) return;
    
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);
    
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(dragConnectionStart.x, dragConnectionStart.y);
    ctx.lineTo(dragConnectionEnd.x, dragConnectionEnd.y);
    ctx.stroke();
    
    ctx.restore();
  }, [isDraggingConnection, dragConnectionStart, dragConnectionEnd, canvasState]);
  
  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    if (subProcessData.viewConfig.showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }
    
    // 绘制连接线
    drawConnections(ctx);
    
    // 绘制节点
    nodes.forEach(node => drawNode(ctx, node));
    
    // 绘制拖拽中的连线
    drawDragConnection(ctx);
  }, [nodes, drawGrid, drawConnections, drawNode, drawDragConnection, subProcessData.viewConfig.showGrid]);
  
  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // 隐藏右键菜单
    setContextMenu(null);
    
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedConnectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    const clickedConnection = findConnectionAtPosition(canvasPos.x, canvasPos.y);
    
    if (clickedConnectionPoint) {
      // 开始连线拖拽
      if (clickedConnectionPoint.type === 'output') {
        setIsDraggingConnection(true);
        setDragConnectionStart({
          nodeId: clickedConnectionPoint.nodeId,
          type: clickedConnectionPoint.type,
          x: clickedConnectionPoint.x,
          y: clickedConnectionPoint.y
        });
        setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      }
    } else if (clickedNode) {
      // 选中节点
      setSelectedNode(clickedNode.id);
      
      // 开始节点拖拽
      setIsDraggingNode(true);
      setDraggedNode(clickedNode);
      setDragOffset({
        x: canvasPos.x - clickedNode.x,
        y: canvasPos.y - clickedNode.y
      });
    } else if (clickedConnection) {
      // 选中连接线
      setHoveredConnection(clickedConnection);
    } else if (canvasState.isSpacePressed) {
      // 开始画布拖拽
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else {
      // 清除选中状态
      setSelectedNode(null);
      setHoveredConnection(null);
    }
  }, [getCanvasCoordinates, findConnectionPointAtPosition, findNodeAtPosition, findConnectionAtPosition, canvasState.isSpacePressed]);
  
  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    
    if (clickedNode) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        nodeId: clickedNode.id
      });
    } else {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [getCanvasCoordinates, findNodeAtPosition]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (isDraggingConnection) {
      // 拖拽连线
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
    } else if (isDraggingNode && draggedNode) {
      // 拖拽节点
      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode.id ? { ...node, x: newX, y: newY } : node
      ));
    } else if (canvasState.isDragging && canvasState.isSpacePressed) {
      // 拖拽画布
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
      // 检测连接点悬停
      const hoveredPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnectionPoint(hoveredPoint);
      
      // 检测连线悬停
      const hoveredConnectionId = findConnectionAtPosition(canvasPos.x, canvasPos.y);
      setHoveredConnection(hoveredConnectionId);
      setMousePosition({ x: canvasPos.x, y: canvasPos.y });
    }
  }, [isDraggingConnection, isDraggingNode, draggedNode, dragOffset, canvasState.isDragging, canvasState.isSpacePressed, canvasState.lastMouseX, canvasState.lastMouseY, getCanvasCoordinates, findConnectionPointAtPosition, findConnectionAtPosition]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      // 结束连线拖拽
      const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      
      // 检查是否可以创建连接（从输出连到输入）
      if (targetPoint && 
          dragConnectionStart.type === 'output' && 
          targetPoint.type === 'input' &&
          dragConnectionStart.nodeId !== targetPoint.nodeId) {
        
        // 检查是否已存在相同连接
        const existingConnection = connections.find(conn => 
          conn.sourceId === dragConnectionStart.nodeId && 
          conn.targetId === targetPoint.nodeId
        );
        
        if (!existingConnection) {
          // 创建新连接
          const newConnection: Connection = {
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
      
      // 重置拖拽状态
      setIsDraggingConnection(false);
      setDragConnectionStart(null);
      setDragConnectionEnd(null);
    } else if (isDraggingNode) {
      // 结束节点拖拽
      setIsDraggingNode(false);
      setDraggedNode(null);
    } else if (canvasState.isDragging) {
      // 结束画布拖拽
      setCanvasState(prev => ({ ...prev, isDragging: false }));
    }
  }, [isDraggingConnection, dragConnectionStart, dragConnectionEnd, connections, isDraggingNode, canvasState.isDragging, getCanvasCoordinates, findConnectionPointAtPosition]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredConnection(null);
    setHoveredConnectionPoint(null);
    setMousePosition({ x: 0, y: 0 });
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * delta))
    }));
  }, []);
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
      } else if (e.key === 'Delete' && selectedNode) {
        deleteNode(selectedNode);
      } else if (e.key === 'Delete' && hoveredConnection) {
        deleteConnection(hoveredConnection);
      } else if (e.key === 'Escape') {
        setContextMenu(null);
        setShowNodePanel(false);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setCanvasState(prev => ({ ...prev, isSpacePressed: false, isDragging: false }));
      }
    };
    
    const handleClickOutside = (_e: MouseEvent) => {
      if (contextMenu?.visible) {
        setContextMenu(null);
      }
    };
    
    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [visible, selectedNode, hoveredConnection, deleteNode, deleteConnection, contextMenu]);
  
  // 画布重绘
  useEffect(() => {
    draw();
  }, [draw]);
  
  // 画布尺寸调整
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          draw();
        }
      }
    };
    
    if (visible) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [visible, draw]);
  
  // 保存子流程数据
  const handleSave = useCallback(() => {
    const updatedSubProcessData: SubProcessData = {
      ...subProcessData,
      nodes,
      connections,
      viewConfig: {
        ...subProcessData.viewConfig,
        scale: canvasState.scale,
        offsetX: canvasState.offsetX,
        offsetY: canvasState.offsetY,
      },
      metadata: {
        ...subProcessData.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    
    onSave(updatedSubProcessData);
    message.success('子流程保存成功');
  }, [subProcessData, nodes, connections, canvasState, onSave]);
  
  // 重置视图
  const resetView = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }));
  }, []);
  
  // 缩放控制
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
  
  return (
    <Modal
      title={`编辑子流程 - ${parentNodeName}`}
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      bodyStyle={{ height: 'calc(100vh - 200px)', padding: 0 }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
      ]}
    >
      <div className="h-full flex flex-col">
        {/* 工具栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <Tooltip title="返回主流程">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onClose}
              />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Tooltip title="撤销">
              <Button
                icon={<UndoOutlined />}
                disabled
              />
            </Tooltip>
            
            <Tooltip title="重做">
              <Button
                icon={<RedoOutlined />}
                disabled
              />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Tooltip title="放大">
              <Button
                icon={<ZoomInOutlined />}
                onClick={zoomIn}
              />
            </Tooltip>
            
            <Tooltip title="缩小">
              <Button
                icon={<ZoomOutOutlined />}
                onClick={zoomOut}
              />
            </Tooltip>
            
            <Tooltip title="重置视图">
              <Button
                icon={<HomeOutlined />}
                onClick={resetView}
              />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <span className="text-sm text-gray-600">
              缩放: {Math.round(canvasState.scale * 100)}%
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tooltip title="添加节点">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowNodePanel(true)}
              >
                添加节点
              </Button>
            </Tooltip>
            
            {selectedNode && (
              <Tooltip title="删除节点">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => selectedNode && deleteNode(selectedNode)}
                >
                  删除节点
                </Button>
              </Tooltip>
            )}
            
            {hoveredConnection && (
              <Tooltip title="删除连线">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => hoveredConnection && deleteConnection(hoveredConnection)}
                >
                  删除连线
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* 画布区域 */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
            style={{
              cursor: canvasState.isSpacePressed ? 'grab' : 
                     canvasState.isDragging ? 'grabbing' : 'crosshair'
            }}
          />
          
          {/* 节点面板 */}
          {showNodePanel && (
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '20px',
                zIndex: 1000,
                minWidth: '300px'
              }}
            >
              <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>
                选择节点类型
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 基础节点 */}
                <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#666' }}>
                  基础节点
                </div>
                {nodeTools.map(tool => (
                  <Button
                    key={tool.type}
                    type="default"
                    icon={tool.icon}
                    onClick={() => {
                      addNode(tool.type, mousePosition.x, mousePosition.y);
                      setShowNodePanel(false);
                    }}
                    style={{ textAlign: 'left', height: '40px' }}
                  >
                    {tool.label}
                  </Button>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <Button onClick={() => setShowNodePanel(false)}>
                  取消
                </Button>
              </div>
            </div>
          )}
          
          {/* 右键菜单 */}
          {contextMenu?.visible && (
            <div 
              className="absolute z-50 bg-white rounded-lg shadow-lg border py-2 min-w-32"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={() => setContextMenu(null)}
            >
              {contextMenu.nodeId ? (
                // 节点右键菜单
                <>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    onClick={() => {
                      editNode(contextMenu.nodeId!);
                      setContextMenu(null);
                    }}
                  >
                    <SettingOutlined />
                    <span>编辑节点</span>
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    onClick={() => {
                      copyNode(contextMenu.nodeId!);
                      setContextMenu(null);
                    }}
                  >
                    <ApiOutlined />
                    <span>复制节点</span>
                  </div>
                  <div className="border-t my-1" />
                  <div 
                    className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center space-x-2 text-red-600"
                    onClick={() => {
                      deleteNode(contextMenu.nodeId!);
                      setContextMenu(null);
                    }}
                  >
                    <DeleteOutlined />
                    <span>删除节点</span>
                  </div>
                </>
              ) : (
                // 画布右键菜单
                <>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    onClick={() => {
                      setShowNodePanel(true);
                      setContextMenu(null);
                    }}
                  >
                    <PlusOutlined />
                    <span>添加节点</span>
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    onClick={() => {
                      resetView();
                      setContextMenu(null);
                    }}
                  >
                    <HomeOutlined />
                    <span>重置视图</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 状态栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>节点数: {nodes.length}</span>
            <span>连接数: {connections.length}</span>
            {selectedNode && <span>已选中节点: {nodes.find(n => n.id === selectedNode)?.label}</span>}
          </div>
          
          <div className="flex items-center space-x-4">
            <span>鼠标位置: ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})</span>
            <span>按住空格键拖拽画布</span>
          </div>
        </div>
      </div>
      
      {/* 节点编辑对话框 */}
      <Modal
        title="编辑节点"
        open={!!editingNode}
        onOk={() => nodeEditForm.submit()}
        onCancel={() => {
          setEditingNode(null);
          nodeEditForm.resetFields();
        }}
        width={500}
      >
        <Form
          form={nodeEditForm}
          layout="vertical"
          onFinish={saveNodeEdit}
        >
          <Form.Item
            label="节点名称"
            name="label"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          
          <Form.Item
            label="自定义名称"
            name="customName"
          >
            <Input placeholder="请输入自定义名称（可选）" />
          </Form.Item>
          
          <Form.Item
            label="触发条件"
            name="triggerCondition"
          >
            <TextArea 
              rows={3}
              placeholder="请输入触发条件（可选）"
            />
          </Form.Item>
          
          {editingNode?.type === 'process' && (
            <>
              <Form.Item
                label="需求设备"
                name="demandDevices"
              >
                <Select
                  mode="multiple"
                  placeholder="选择需求设备"
                  options={[
                    { label: '设备A', value: 'deviceA' },
                    { label: '设备B', value: 'deviceB' },
                    { label: '设备C', value: 'deviceC' }
                  ]}
                />
              </Form.Item>
              
              <Form.Item
                label="供应设备"
                name="supplyDevices"
              >
                <Select
                  mode="multiple"
                  placeholder="选择供应设备"
                  options={[
                    { label: '设备X', value: 'deviceX' },
                    { label: '设备Y', value: 'deviceY' },
                    { label: '设备Z', value: 'deviceZ' }
                  ]}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Modal>
  );
};

export default SubCanvas;