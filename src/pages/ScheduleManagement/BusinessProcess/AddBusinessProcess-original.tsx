import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Steps,
  message,
  Tooltip,
  Card,
  Space,
} from 'antd';
import StagePropertyPanel from './StagePropertyPanel';
import { 
  ArrowLeftOutlined, 
  UndoOutlined, 
  RedoOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  HomeOutlined,
  PlayCircleOutlined,
  StopOutlined,
  PlusOutlined,
  ApiOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  CloseOutlined,
  SearchOutlined,
  SelectOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
// SubCanvas和IndependentSubCanvas导入已移除 - 阶段节点功能已移除

const { TextArea } = Input;
const { Option } = Select;

// 业务流程接口
interface BusinessProcessData {
  businessName: string;
  identifier: string;
  status: 'enabled' | 'disabled' | 'obsolete';
  remark?: string;
}

interface AddBusinessProcessProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  isDragging: boolean;
  isSpacePressed: boolean;
  lastMouseX: number;
  lastMouseY: number;
  history?: Array<{ nodes: FlowNode[]; connections: Connection[] }>;
  historyIndex?: number;
}

// 流程节点类型
type NodeType = 'start' | 'end' | 'stage';

// 子画布视图配置
interface SubCanvasViewConfig {
  scale: number;           // 缩放比例
  offsetX: number;         // X轴偏移
  offsetY: number;         // Y轴偏移
  gridSize: number;        // 网格大小
  showGrid: boolean;       // 是否显示网格
}

// 子流程数据结构
interface SubProcessData {
  nodes: FlowNode[];                    // 子流程节点
  connections: Connection[];            // 子流程连接线
  viewConfig: SubCanvasViewConfig;      // 视图配置
  metadata: {                           // 元数据
    name: string;                       // 子流程名称
    description?: string;               // 子流程描述
    version: string;                    // 版本号
    createdAt: string;                  // 创建时间
    updatedAt: string;                  // 更新时间
    author?: string;                    // 创建者
  };
  settings: {                           // 设置
    autoLayout: boolean;                // 自动布局
    snapToGrid: boolean;                // 对齐网格
    allowCrossConnections: boolean;     // 允许交叉连接
    maxNodes: number;                   // 最大节点数
  };
}

// 子画布接口
interface SubCanvas {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  nodes: FlowNode[];
  connections: Connection[];
  parentNodeId: string; // 关联的阶段节点ID
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
  demandDevices?: string[];
  supplyDevices?: string[];
  data?: any;
  // 阶段节点的子流程数据 - 使用新的数据结构
  subProcess?: SubProcessData;
  // 关联的子画布ID（仅阶段节点使用）
  subCanvasId?: string;
  // 设置图标边界信息（用于点击检测）
  settingsIconBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 连接线接口
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  sourceType?: 'node' | 'stage' | 'subcanvas';
  targetType?: 'node' | 'stage' | 'subcanvas';
}

// 节点工具栏配置
interface NodeTool {
  type: NodeType;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const AddBusinessProcess: React.FC<AddBusinessProcessProps> = ({ 
  visible,
  onClose, 
  onSave, 
  editData 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 主步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  
  // 画布状态
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    isDragging: false,
    isSpacePressed: false,
    lastMouseX: 0,
    lastMouseY: 0,
    history: [],
    historyIndex: -1
  });
  
  // 历史记录管理
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 流程编排状态
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 点击和拖动状态跟踪

  
  // 子画布拖拽状态
  const [isDraggingSubCanvas, setIsDraggingSubCanvas] = useState(false);
  const [draggedSubCanvas, setDraggedSubCanvas] = useState<SubCanvas | null>(null);
  const [subCanvasDragOffset, setSubCanvasDragOffset] = useState({ x: 0, y: 0 });

  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [insertingConnectionId, setInsertingConnectionId] = useState<string | null>(null);
  
  // 连接点交互状态
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<{nodeId: string, type: 'input' | 'output' | 'subcanvas' | 'bottom'} | null>(null);
  const [hoveredSubCanvasLine, setHoveredSubCanvasLine] = useState<string | null>(null); // 悬停的子画布内部连线ID
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [dragConnectionStart, setDragConnectionStart] = useState<{nodeId: string, type: 'input' | 'output' | 'subcanvas' | 'bottom', x: number, y: number} | null>(null);
  const [dragConnectionEnd, setDragConnectionEnd] = useState<{x: number, y: number} | null>(null);
  
  // 子画布状态管理
  const [subCanvases, setSubCanvases] = useState<SubCanvas[]>([]);
  const [selectedSubCanvas, setSelectedSubCanvas] = useState<string | null>(null);
  
  // 子流程编辑状态
  const [editingSubProcess, setEditingSubProcess] = useState<string | null>(null); // 当前编辑的子流程节点ID
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  
  // 独立子画布窗口管理
  const [openSubCanvasWindows, setOpenSubCanvasWindows] = useState<Map<string, { nodeId: string; position: { x: number; y: number } }>>(new Map());
  
  // 添加节点面板状态
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [nodeAddPosition, setNodeAddPosition] = useState({ x: 0, y: 0 });

  // 阶段属性面板状态
  const [stagePropertyPanelVisible, setStagePropertyPanelVisible] = useState(false);
  const [selectedStageNode, setSelectedStageNode] = useState<FlowNode | null>(null);
  
  // 阶段节点悬停状态
  const [hoveredStageNode, setHoveredStageNode] = useState<string | null>(null);
  
  

  
  // 处理阶段节点点击事件
  const handleStageNodeClick = useCallback((node: FlowNode) => {
    if (node.type === 'stage') {
      setSelectedStageNode(node);
      setStagePropertyPanelVisible(true);
    }
  }, []);

  // 保存阶段节点属性
  const handleSaveStageNode = useCallback((updatedNode: FlowNode) => {
    setNodes(prev => prev.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
    setSelectedStageNode(null);
  }, []);

  // 关闭阶段属性面板
  const handleCloseStagePropertyPanel = useCallback(() => {
    setStagePropertyPanelVisible(false);
    setSelectedStageNode(null);
  }, []);
  
  // 阶段节点已移除
  const checkSubCanvasDoubleClick = useCallback((x: number, y: number, node: FlowNode): boolean => {
    return false;
  }, []);
  
  // 阶段节点已移除
  const checkOpenSubCanvasButtonClick = useCallback((x: number, y: number, node: FlowNode): boolean => {
    return false;
  }, []);

  // 创建默认子流程数据
  const createDefaultSubProcess = useCallback((stageName: string): SubProcessData => {
    const currentTime = new Date().toISOString();
    return {
      nodes: [
        {
          id: `sub_start_${Date.now()}`,
          type: 'start' as NodeType,
          x: 50,
          y: 30,
          width: 80,
          height: 40,
          label: '开始'
        },
        {
          id: `sub_end_${Date.now() + 1}`,
          type: 'end' as NodeType,
          x: 200,
          y: 30,
          width: 80,
          height: 40,
          label: '结束'
        }
      ],
      connections: [],
      viewConfig: {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        gridSize: 20,
        showGrid: true
      },
      metadata: {
        name: `${stageName}子流程`,
        description: `${stageName}的内部流程`,
        version: '1.0.0',
        createdAt: currentTime,
        updatedAt: currentTime,
        author: 'system'
      },
      settings: {
        autoLayout: true,
        snapToGrid: true,
        allowCrossConnections: true,
        maxNodes: 50
      }
    };
  }, []);
  
  // 进入子流程编辑模式 - 阶段节点已移除
  const enterSubProcessMode = useCallback((nodeId: string) => {
    return; // 阶段节点已移除
  }, []);
  
  // 退出子流程编辑模式
  const exitSubProcessMode = useCallback(() => {
    setEditingSubProcess(null);
    message.info('已退出子流程编辑模式');
  }, []);

  // 打开独立子画布窗口 - 阶段节点已移除
  const openIndependentSubCanvas = useCallback((nodeId: string) => {
    return; // 阶段节点已移除
  }, []);

  // 关闭独立子画布窗口
  const closeIndependentSubCanvas = useCallback((nodeId: string) => {
    setOpenSubCanvasWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(nodeId);
      return newMap;
    });
    message.info('子画布窗口已关闭');
  }, []);

  // 更新子流程数据
  const updateSubProcess = useCallback((nodeId: string, updatedData: SubProcessData) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, subProcess: updatedData }
        : node
    ));
  }, []);

  // 更新子流程数据（支持部分更新）
  const updateSubProcessPartial = useCallback((nodeId: string, updates: Partial<SubProcessData>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId && node.subProcess) {
          const updatedSubProcess = {
            ...node.subProcess,
            ...updates,
            metadata: {
              ...node.subProcess.metadata,
              ...updates.metadata,
              updatedAt: new Date().toISOString()
            }
          };
          
          return { 
            ...node, 
            subProcess: updatedSubProcess
          };
        }
        return node;
      })
    );
  }, []);

  // 验证子流程数据完整性
  const validateSubProcess = useCallback((subProcess: SubProcessData): boolean => {
    // 检查基本结构
    if (!subProcess.nodes || !subProcess.connections || !subProcess.viewConfig || !subProcess.metadata || !subProcess.settings) {
      return false;
    }
    
    // 检查节点数量限制
    if (subProcess.nodes.length > subProcess.settings.maxNodes) {
      return false;
    }
    
    // 检查是否有开始和结束节点
    const hasStart = subProcess.nodes.some(node => node.type === 'start');
    const hasEnd = subProcess.nodes.some(node => node.type === 'end');
    
    return hasStart && hasEnd;
  }, []);

  // 获取子流程统计信息
  const getSubProcessStats = useCallback((subProcess: SubProcessData) => {
    const nodeCount = subProcess.nodes.length;
    const connectionCount = subProcess.connections.length;
    const processNodeCount = 0; // 阶段节点已移除
    
    return {
      totalNodes: nodeCount,
      processNodes: processNodeCount,
      connections: connectionCount,
      complexity: processNodeCount > 5 ? 'high' : processNodeCount > 2 ? 'medium' : 'low'
    };
  }, []);
  
  // 自动布局算法 - 检测并解决节点重叠
  const autoLayoutNodes = useCallback((newNodes: FlowNode[]) => {
    const HORIZONTAL_SPACING = 450; // 水平间距
    const VERTICAL_SPACING = 250;   // 垂直间距
    const OVERLAP_THRESHOLD = 50;   // 重叠检测阈值
    
    // 检测两个节点是否重叠
    const isOverlapping = (node1: FlowNode, node2: FlowNode) => {
      const dx = Math.abs(node1.x - node2.x);
      const dy = Math.abs(node1.y - node2.y);
      return dx < node1.width + OVERLAP_THRESHOLD && dy < node1.height + OVERLAP_THRESHOLD;
    };
    
    // 查找合适的位置放置新节点
    const findValidPosition = (targetNode: FlowNode, existingNodes: FlowNode[]) => {
      let attempts = 0;
      const maxAttempts = 20;
      let newX = targetNode.x;
      let newY = targetNode.y;
      
      while (attempts < maxAttempts) {
        const testNode = { ...targetNode, x: newX, y: newY };
        let hasOverlap = false;
        
        for (const existingNode of existingNodes) {
          if (existingNode.id !== targetNode.id && isOverlapping(testNode, existingNode)) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          return { x: newX, y: newY };
        }
        
        // 尝试不同的位置：右侧、下方、左侧、上方
        const direction = attempts % 4;
        switch (direction) {
          case 0: // 右侧
            newX = targetNode.x + HORIZONTAL_SPACING;
            break;
          case 1: // 下方
            newX = targetNode.x;
            newY = targetNode.y + VERTICAL_SPACING;
            break;
          case 2: // 左侧
            newX = targetNode.x - HORIZONTAL_SPACING;
            newY = targetNode.y;
            break;
          case 3: // 上方
            newX = targetNode.x;
            newY = targetNode.y - VERTICAL_SPACING;
            break;
        }
        
        attempts++;
      }
      
      return { x: newX, y: newY };
    };
    
    // 对所有节点进行布局调整
    const adjustedNodes = newNodes.map((node, index) => {
      if (index === 0) return node; // 第一个节点保持原位置
      
      const existingNodes = newNodes.slice(0, index);
      const validPosition = findValidPosition(node, existingNodes);
      
      return {
        ...node,
        x: validPosition.x,
        y: validPosition.y
      };
    });
    
    return adjustedNodes;
  }, []);



  // 处理添加节点面板中的节点添加
  const handleAddNodeFromPanel = useCallback((nodeType: NodeType) => {
    console.log('🎯 [流程画布] handleAddNodeFromPanel 开始', {
      nodeType,
      dragConnectionStart,
      nodeAddPosition,
      currentNodes: nodes.length,
      currentConnections: connections.length
    });

    if (!dragConnectionStart) {
      console.log('🎯 [流程画布] 普通添加模式，无拖拽连线');
      // 普通添加到指定位置
      addNodeToCanvas(nodeType);
      setShowNodePanel(false);
      return;
    }

    console.log('🎯 [流程画布] 拖拽连线添加模式', {
      dragConnectionStart,
      nodeAddPosition
    });

    // 从连线拖拽添加节点
    const newNodeId = `node_${Date.now()}`;
    let newNode: FlowNode;

    // 根据节点类型设置默认属性
    switch (nodeType) {
      case 'start':
        newNode = {
          id: newNodeId,
          type: 'start',
          x: nodeAddPosition.x - 50,
          y: nodeAddPosition.y - 25,
          width: 100,
          height: 50,
          label: '开始'
        };
        break;
      case 'end':
        newNode = {
          id: newNodeId,
          type: 'end',
          x: nodeAddPosition.x - 50,
          y: nodeAddPosition.y - 25,
          width: 100,
          height: 50,
          label: '结束'
        };
        break;
      case 'stage':
        newNode = {
          id: newNodeId,
          type: 'stage',
          x: nodeAddPosition.x - 100,
          y: nodeAddPosition.y - 60,
          width: 200,
          height: 150,
          label: '新阶段',
          customName: 'AGV取料阶段',
          triggerCondition: '物料到位',
          demandDevices: ['AGV小车'],
          supplyDevices: ['料架']
        };
        break;
      default:
        newNode = {
          id: newNodeId,
          type: 'start',
          x: nodeAddPosition.x - 50,
          y: nodeAddPosition.y - 25,
          width: 100,
          height: 50,
          label: '新节点'
        };
    }

    console.log('🎯 [流程画布] 创建新节点', newNode);

    // 添加新节点
    setNodes(prev => {
      const newNodes = [...prev, newNode];
      console.log('🎯 [流程画布] 节点列表更新', {
        oldCount: prev.length,
        newCount: newNodes.length,
        newNodeId: newNode.id
      });
      return newNodes;
    });

    // 创建从拖拽起点到新节点的连接
    const sourceNode = nodes.find(n => n.id === dragConnectionStart.nodeId);
    const sourceSubCanvas = subCanvases.find(sc => sc.id === dragConnectionStart.nodeId);
    
    console.log('🎯 [流程画布] 查找源节点', {
      sourceNodeId: dragConnectionStart.nodeId,
      sourceNode: sourceNode ? { id: sourceNode.id, type: sourceNode.type, x: sourceNode.x, y: sourceNode.y } : null,
      sourceSubCanvas: sourceSubCanvas ? { id: sourceSubCanvas.id, x: sourceSubCanvas.x, y: sourceSubCanvas.y } : null
    });
    
    let sourceType: 'node' | 'stage' | 'subcanvas' = 'node';
    if (sourceSubCanvas) {
      sourceType = 'subcanvas';
    } else if (sourceNode && sourceNode.type === 'stage') {
      sourceType = 'stage';
    }

    // 计算目标连接点位置
    let targetPoint: { x: number; y: number };
    // 所有节点类型都连接到左侧边缘中间位置
    targetPoint = { x: newNode.x, y: newNode.y + newNode.height / 2 };

    console.log('🎯 [流程画布] 连接点计算', {
      sourceType,
      sourcePoint: { x: dragConnectionStart.x, y: dragConnectionStart.y },
      targetPoint,
      newNodeType: newNode.type,
      newNodeBounds: { x: newNode.x, y: newNode.y, width: newNode.width, height: newNode.height }
    });

    const newConnection: Connection = {
      id: `connection_${Date.now()}`,
      sourceId: dragConnectionStart.nodeId,
      targetId: newNodeId,
      sourcePoint: { x: dragConnectionStart.x, y: dragConnectionStart.y },
      targetPoint,
      sourceType,
      targetType: newNode.type === 'stage' ? 'stage' : 'node'
    };

    console.log('🎯 [流程画布] 创建新连接', newConnection);

    setConnections(prev => {
      const newConnections = [...prev, newConnection];
      console.log('🎯 [流程画布] 连接列表更新', {
        oldCount: prev.length,
        newCount: newConnections.length,
        newConnectionId: newConnection.id
      });
      return newConnections;
    });
    
    // 关闭面板并重置状态
    setShowNodePanel(false);
    setDragConnectionStart(null);
    setDragConnectionEnd(null);
    
    console.log('🎯 [流程画布] handleAddNodeFromPanel 完成');
    message.success(`${newNode.label}节点添加成功`);
  }, [nodeAddPosition, dragConnectionStart, nodes, subCanvases, connections]);

  // 关闭添加节点面板
  const handleCloseNodePanel = useCallback(() => {
    setShowNodePanel(false);
    setDragConnectionStart(null);
    setDragConnectionEnd(null);
  }, []);

  // 添加节点到画布
  const addNodeToCanvas = useCallback((nodeType: NodeType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let newNode: FlowNode;

    if (insertingConnectionId) {
      // 在连线中间插入节点
      const connection = connections.find(conn => conn.id === insertingConnectionId);
      if (!connection) return;

      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        // 计算连线中点位置
        const startX = sourceNode.x + sourceNode.width;
        const startY = sourceNode.y + sourceNode.height / 2;
        const endX = targetNode.x;
        const endY = targetNode.y + targetNode.height / 2;
        
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // 创建新节点在连线中点
        let nodeWidth, nodeHeight;
        if (nodeType === 'stage') {
          nodeWidth = 200;
        nodeHeight = 150;
        } else {
          nodeWidth = 120;
          nodeHeight = 60;
        }
        
        newNode = {
          id: `node_${Date.now()}`,
          type: nodeType,
          x: midX - nodeWidth / 2,
          y: midY - nodeHeight / 2,
          width: nodeWidth,
          height: nodeHeight,
          label: nodeTools.find(tool => tool.type === nodeType)?.label || nodeType,
          // 为阶段节点添加默认字段
          ...(nodeType === 'stage' && {
            customName: 'AGV取料阶段',
            triggerCondition: '物料到位',
            demandDevices: ['AGV小车'],
            supplyDevices: ['料架']
          })
        };

        // 删除原连线
        setConnections(prev => prev.filter(conn => conn.id !== insertingConnectionId));
        
        // 应用自动布局并添加新节点
        const updatedNodes = autoLayoutNodes([...nodes, newNode]);
        setNodes(updatedNodes);
        
        // 创建新的连接：开始节点 -> 新节点 -> 结束节点
        setTimeout(() => {
          // 计算连接点位置
          const getConnectionPoints = (sourceNode: FlowNode, targetNode: FlowNode) => {
            // 源节点输出点（右侧中间）
            const sourcePoint = {
              x: sourceNode.x + sourceNode.width,
              y: sourceNode.y + sourceNode.height / 2
            };
            
            // 目标节点输入点
            let targetPoint;
            if (targetNode.type === 'stage') {
              // 阶段节点连接到左侧输入口
              targetPoint = {
                x: targetNode.x,
                y: targetNode.y + targetNode.height / 2
              };
            } else {
              // 其他节点连接到中间位置
              targetPoint = {
                x: targetNode.x,
                y: targetNode.y + targetNode.height / 2
              };
            }
            
            return { sourcePoint, targetPoint };
          };
          
          // 获取更新后的节点位置
          const updatedNewNode = updatedNodes.find(n => n.id === newNode.id)!;
          const updatedSourceNode = updatedNodes.find(n => n.id === sourceNode.id) || sourceNode;
          const updatedTargetNode = updatedNodes.find(n => n.id === targetNode.id) || targetNode;
          
          // 创建第一条连接：源节点 -> 新节点
          const connection1Points = getConnectionPoints(updatedSourceNode, updatedNewNode);
          const newConnection1: Connection = {
            id: `connection_${Date.now()}_1`,
            sourceId: sourceNode.id,
            targetId: newNode.id,
            sourcePoint: connection1Points.sourcePoint,
            targetPoint: connection1Points.targetPoint
          };
          
          // 创建第二条连接：新节点 -> 目标节点
          const connection2Points = getConnectionPoints(updatedNewNode, updatedTargetNode);
          const newConnection2: Connection = {
            id: `connection_${Date.now()}_2`,
            sourceId: newNode.id,
            targetId: targetNode.id,
            sourcePoint: connection2Points.sourcePoint,
            targetPoint: connection2Points.targetPoint
          };
          
          setConnections(prev => [...prev, newConnection1, newConnection2]);
        }, 0);
        
        setInsertingConnectionId(null);
        message.success(`${newNode.label}节点已插入到连线中间，位置已自动调整`);
      }
    } else {
      // 正常添加到画布中心
      const rect = canvas.getBoundingClientRect();
      const centerX = (rect.width / 2 - canvasState.offsetX) / canvasState.scale;
      const centerY = (rect.height / 2 - canvasState.offsetY) / canvasState.scale;

      const nodeId = `node_${Date.now()}`;
      
      {
        // 其他节点类型：简单节点结构
        let nodeWidth, nodeHeight;
        
        if (nodeType === 'start' || nodeType === 'end') {
          nodeWidth = 120;
          nodeHeight = 60;
        } else if (nodeType === 'stage') {
          // 阶段节点使用卡片样式，需要更大的尺寸
          nodeWidth = 200;
        nodeHeight = 150;
        } else {
          nodeWidth = 200;
          nodeHeight = 60;
        }
        
        newNode = {
          id: nodeId,
          type: nodeType,
          x: centerX - nodeWidth / 2,
          y: centerY - nodeHeight / 2,
          width: nodeWidth,
          height: nodeHeight,
          label: nodeTools.find(tool => tool.type === nodeType)?.label || nodeType,
          // 为阶段节点添加默认字段
          ...(nodeType === 'stage' && {
            customName: 'AGV取料阶段',
            triggerCondition: '物料到位',
            demandDevices: ['AGV小车'],
            supplyDevices: ['料架']
          })
        };
      }

      // 应用自动布局并添加新节点
      const updatedNodes = autoLayoutNodes([...nodes, newNode]);
      setNodes(updatedNodes);
      message.success(`${newNode.label}节点已添加到画布，位置已自动调整`);
    }
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale, insertingConnectionId, connections, nodes, autoLayoutNodes]);

  // 节点工具栏配置
  const nodeTools: NodeTool[] = [
    {
      type: 'start',
      icon: <PlayCircleOutlined />,
      label: '开始',
      color: '#52c41a'
    },
    {
      type: 'stage',
      icon: <SettingOutlined />,
      label: '阶段',
      color: '#1890ff'
    },
    {
      type: 'end',
      icon: <StopOutlined />,
      label: '结束',
      color: '#ff4d4f'
    }
  ];
  
  // 处理编辑模式初始化
  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        businessName: editData.businessName,
        identifier: editData.identifier,
        status: editData.status,
        remark: editData.remark,
      });
    } else {
      form.resetFields();
      setCurrentStep(0);
    }
  }, [editData, form]);

  // 初始化历史记录
  useEffect(() => {
    if (visible && history.length === 0) {
      const initialState = {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        isDragging: false,
        isSpacePressed: false,
        lastMouseX: 0,
        lastMouseY: 0
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [visible, history.length]);
  
  // 初始化流程节点和连线
  useEffect(() => {
    if (currentStep === 1 && nodes.length === 0) {
      const startNode: FlowNode = {
        id: 'start-node',
        type: 'start',
        x: 350,
        y: 240,
        width: 120,
        height: 50,
        label: '开始',
        data: {}
      };
      
      const endNode: FlowNode = {
        id: 'end-node',
        type: 'end',
        x: 750,
        y: 240,
        width: 120,
        height: 50,
        label: '结束',
        data: {}
      };
      
      // 创建默认连线
      const defaultConnection: Connection = {
        id: 'default-connection',
        sourceId: 'start-node',
        targetId: 'end-node',
        sourcePoint: { x: startNode.x + startNode.width, y: startNode.y + startNode.height / 2 },
        targetPoint: { x: endNode.x, y: endNode.y + endNode.height / 2 }
      };
      
      setNodes([startNode, endNode]);
      setConnections([defaultConnection]);
    }
  }, [currentStep, nodes.length]);

  // 主流程下一步
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        // 验证基本信息表单
        await form.validateFields(['businessName', 'identifier', 'status']);
        setCurrentStep(1);
      }
    } catch (error) {
      message.error('请完善必填信息');
    }
  };

  // 主流程上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 回退2步
  const handleBack2Steps = () => {
    if (currentStep >= 2) {
      setCurrentStep(currentStep - 2);
    } else {
      setCurrentStep(0);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      const allValues = await form.validateFields();
      onSave(allValues);
    } catch (error) {
      message.error('请完善所有必填信息');
    }
  };

  // 保存历史记录
  const saveToHistory = useCallback((state: CanvasState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...state });
      return newHistory.slice(-50); // 限制历史记录数量
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // 智能自动排序函数
  const autoSortNodes = useCallback(() => {
    if (editingSubProcess) {
      // 子流程编辑模式：对子流程中的节点进行排序
      const parentNode = nodes.find(n => n.id === editingSubProcess);
      if (!parentNode || !parentNode.subProcess) return;

      const subNodes = parentNode.subProcess.nodes;
      const subConnections = parentNode.subProcess.connections;

      // 构建节点连接关系图
      const nodeMap = new Map(subNodes.map(node => [node.id, node]));
      const adjacencyList = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      // 初始化邻接表和入度
      subNodes.forEach(node => {
        adjacencyList.set(node.id, []);
        inDegree.set(node.id, 0);
      });

      // 构建连接关系
      subConnections.forEach(conn => {
        if (adjacencyList.has(conn.sourceId) && adjacencyList.has(conn.targetId)) {
          adjacencyList.get(conn.sourceId)!.push(conn.targetId);
          inDegree.set(conn.targetId, (inDegree.get(conn.targetId) || 0) + 1);
        }
      });

      // 拓扑排序
      const queue: string[] = [];
      const levels = new Map<string, number>();

      // 找到所有入度为0的节点（起始节点）
      inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
          queue.push(nodeId);
          levels.set(nodeId, 0);
        }
      });

      // BFS遍历确定层级
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levels.get(currentId) || 0;
        const neighbors = adjacencyList.get(currentId) || [];

        neighbors.forEach(neighborId => {
          const newDegree = (inDegree.get(neighborId) || 0) - 1;
          inDegree.set(neighborId, newDegree);

          if (newDegree === 0) {
            queue.push(neighborId);
            levels.set(neighborId, currentLevel + 1);
          }
        });
      }

      // 按层级分组节点
      const levelGroups = new Map<number, string[]>();
      levels.forEach((level, nodeId) => {
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(nodeId);
      });

      // 计算新位置 - 水平排列（优化间距）
       const LEVEL_SPACING = 300; // 层级间距（水平方向）- 增加到300px让连线更清晰
       const NODE_SPACING = 200;  // 同层节点间距（垂直方向）- 增加到200px避免重叠
       const START_X = 150;       // 起始X坐标 - 增加左边距
       const START_Y = 150;       // 起始Y坐标 - 增加上边距

       const updatedNodes = [...subNodes];
       const maxLevel = Math.max(...levels.values());

       for (let level = 0; level <= maxLevel; level++) {
         const nodesInLevel = levelGroups.get(level) || [];
         // 根据节点数量动态调整间距，节点越多间距越大
         const dynamicSpacing = Math.max(NODE_SPACING, NODE_SPACING + (nodesInLevel.length - 1) * 20);
         const totalHeight = (nodesInLevel.length - 1) * dynamicSpacing;
         const startY = START_Y - totalHeight / 2;

         nodesInLevel.forEach((nodeId, index) => {
           const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
           if (nodeIndex !== -1) {
             updatedNodes[nodeIndex] = {
               ...updatedNodes[nodeIndex],
               x: START_X + level * LEVEL_SPACING,  // 水平排列：X坐标根据层级递增
               y: startY + index * dynamicSpacing   // 垂直排列：Y坐标根据同层索引递增，使用动态间距
             };
           }
         });
       }

      // 更新连线连接点
      const updatedConnections = subConnections.map(conn => {
        const sourceNode = updatedNodes.find(n => n.id === conn.sourceId);
        const targetNode = updatedNodes.find(n => n.id === conn.targetId);

        if (sourceNode && targetNode) {
           // 计算连接点偏移，避免连线重叠
           const sourceLevel = levels.get(sourceNode.id) || 0;
           const targetLevel = levels.get(targetNode.id) || 0;
           const levelDiff = targetLevel - sourceLevel;
           
           // 根据层级差异调整连接点的垂直偏移
           const verticalOffset = levelDiff > 1 ? 10 : 0;
           
           return {
             ...conn,
             sourcePoint: {
               x: sourceNode.x + sourceNode.width + 5,  // 从右侧连出，增加5px间隙
               y: sourceNode.y + sourceNode.height / 2 + verticalOffset
             },
             targetPoint: {
               x: targetNode.x - 5,                     // 连接到左侧，增加5px间隙
               y: targetNode.y + targetNode.height / 2 - verticalOffset
             }
           };
        }
        return conn;
      });

      // 更新子流程数据
      const updatedParentNode = {
        ...parentNode,
        subProcess: {
          ...parentNode.subProcess,
          nodes: updatedNodes,
          connections: updatedConnections
        }
      };

      // 更新主流程节点
      const updatedMainNodes = nodes.map(node => 
        node.id === editingSubProcess ? updatedParentNode : node
      );

      setNodes(updatedMainNodes);
      
      // 保存到历史记录
      saveToHistory(canvasState);

    } else {
      // 主流程编辑模式：对主流程节点进行排序
      // 构建节点连接关系图
      const nodeMap = new Map(nodes.map(node => [node.id, node]));
      const adjacencyList = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      // 初始化邻接表和入度
      nodes.forEach(node => {
        adjacencyList.set(node.id, []);
        inDegree.set(node.id, 0);
      });

      // 构建连接关系
      connections.forEach(conn => {
        if (adjacencyList.has(conn.sourceId) && adjacencyList.has(conn.targetId)) {
          adjacencyList.get(conn.sourceId)!.push(conn.targetId);
          inDegree.set(conn.targetId, (inDegree.get(conn.targetId) || 0) + 1);
        }
      });

      // 拓扑排序
      const queue: string[] = [];
      const levels = new Map<string, number>();

      // 找到所有入度为0的节点（起始节点）
      inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
          queue.push(nodeId);
          levels.set(nodeId, 0);
        }
      });

      // BFS遍历确定层级
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levels.get(currentId) || 0;
        const neighbors = adjacencyList.get(currentId) || [];

        neighbors.forEach(neighborId => {
          const newDegree = (inDegree.get(neighborId) || 0) - 1;
          inDegree.set(neighborId, newDegree);

          if (newDegree === 0) {
            queue.push(neighborId);
            levels.set(neighborId, currentLevel + 1);
          }
        });
      }

      // 按层级分组节点
      const levelGroups = new Map<number, string[]>();
      levels.forEach((level, nodeId) => {
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(nodeId);
      });

      // 计算新位置 - 水平排列（优化间距）
       const LEVEL_SPACING = 300; // 层级间距（水平方向）- 增加到300px让连线更清晰
       const NODE_SPACING = 200;  // 同层节点间距（垂直方向）- 增加到200px避免重叠
       const START_X = 200;       // 起始X坐标
       const START_Y = 150;       // 起始Y坐标 - 增加上边距

       const updatedNodes = [...nodes];
       const maxLevel = Math.max(...levels.values());

       for (let level = 0; level <= maxLevel; level++) {
         const nodesInLevel = levelGroups.get(level) || [];
         // 根据节点数量动态调整间距，节点越多间距越大
         const dynamicSpacing = Math.max(NODE_SPACING, NODE_SPACING + (nodesInLevel.length - 1) * 20);
         const totalHeight = (nodesInLevel.length - 1) * dynamicSpacing;
         const startY = START_Y - totalHeight / 2;

         nodesInLevel.forEach((nodeId, index) => {
           const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
           if (nodeIndex !== -1) {
             updatedNodes[nodeIndex] = {
               ...updatedNodes[nodeIndex],
               x: START_X + level * LEVEL_SPACING,  // 水平排列：X坐标根据层级递增
               y: startY + index * dynamicSpacing   // 垂直排列：Y坐标根据同层索引递增，使用动态间距
             };
           }
         });
       }

      // 更新连线连接点
       const updatedConnections = connections.map(conn => {
         const sourceNode = updatedNodes.find(n => n.id === conn.sourceId);
         const targetNode = updatedNodes.find(n => n.id === conn.targetId);

         if (sourceNode && targetNode) {
           // 计算连接点偏移，避免连线重叠
           const sourceLevel = levels.get(sourceNode.id) || 0;
           const targetLevel = levels.get(targetNode.id) || 0;
           const levelDiff = targetLevel - sourceLevel;
           
           // 根据层级差异调整连接点的垂直偏移
           const verticalOffset = levelDiff > 1 ? 10 : 0;
           
           return {
             ...conn,
             sourcePoint: {
               x: sourceNode.x + sourceNode.width + 5,  // 从右侧连出，增加5px间隙
               y: sourceNode.y + sourceNode.height / 2 + verticalOffset
             },
             targetPoint: {
               x: targetNode.x - 5,                     // 连接到左侧，增加5px间隙
               y: targetNode.y + targetNode.height / 2 - verticalOffset
             }
           };
         }
         return conn;
       });

      // 更新状态
      setNodes(updatedNodes);
      setConnections(updatedConnections);
      
      // 保存到历史记录
      saveToHistory(canvasState);
    }

    message.success('节点自动排序完成');
  }, [nodes, connections, editingSubProcess, canvasState, saveToHistory]);

  // 撤回功能
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCanvasState(prev => ({
        ...prev,
        offsetX: prevState.offsetX,
        offsetY: prevState.offsetY,
        scale: prevState.scale
      }));
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  // 重做功能
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCanvasState(prev => ({
        ...prev,
        offsetX: nextState.offsetX,
        offsetY: nextState.offsetY,
        scale: nextState.scale
      }));
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // 放大功能
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(canvasState.scale * 1.2, 3);
    const newState = {
      ...canvasState,
      scale: newScale
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  // 缩小功能
  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(canvasState.scale / 1.2, 0.3);
    const newState = {
      ...canvasState,
      scale: newScale
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  // 回到初始位置
  const handleResetPosition = useCallback(() => {
    const newState = {
      ...canvasState,
      offsetX: 0,
      offsetY: 0,
      scale: 1
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  const steps = [
    {
      title: '基本信息',
      description: '配置业务流程基本信息'
    },
    {
      title: '流程画布',
      description: '设计业务流程图'
    }
  ];

  // 获取画布坐标
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const y = (clientY - rect.top - canvasState.offsetY) / canvasState.scale;
    return { x, y };
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale]);

  // 检测鼠标是否悬停在连线上
  const findConnectionAtPosition = useCallback((x: number, y: number) => {
    for (const connection of connections) {
      const sourceNode = nodes.find(n => n.id === connection.sourceId);
      const targetNode = nodes.find(n => n.id === connection.targetId);
      
      if (sourceNode && targetNode) {
        // 计算连接点位置 - 阶段节点使用主卡片中间位置
        const getConnectionY = (node: FlowNode) => {
          return node.y + node.height / 2; // 所有节点使用中间位置
        };
        
        const startX = sourceNode.x + sourceNode.width;
        const startY = getConnectionY(sourceNode);
        const endX = targetNode.x;
        const endY = getConnectionY(targetNode);
        
        // 计算点到线段的距离
        const A = endY - startY;
        const B = startX - endX;
        const C = endX * startY - startX * endY;
        const distance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
        
        // 检查点是否在线段范围内
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        if (distance < 8 && x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10) {
          return connection.id;
        }
      }
    }
    return null;
  }, [connections, nodes]);
  
  // 检查点是否在节点内（包括设置图标区域和连接区域）
  const isPointInNode = useCallback((x: number, y: number, node: FlowNode) => {
    // 基本节点区域检测
    const inNodeArea = x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height;
    
    // 如果是阶段节点，创建一个包含卡片和设置图标的连续悬停区域
    if (node.type === 'stage') {
      const iconSize = 24;
      const iconX = node.x + node.width - iconSize;
      const iconY = node.y - iconSize - 8; // 在卡片上方外部
      
      // 创建一个连续的矩形区域，包含卡片和设置图标
      const combinedArea = {
        left: node.x,
        right: node.x + node.width,
        top: iconY, // 从设置图标顶部开始
        bottom: node.y + node.height // 到卡片底部结束
      };
      
      const inCombinedArea = x >= combinedArea.left && x <= combinedArea.right && 
                            y >= combinedArea.top && y <= combinedArea.bottom;
      
      return inCombinedArea;
    }
    
    return inNodeArea;
  }, []);
  
  // 查找鼠标位置的节点
  const findNodeAtPosition = useCallback((x: number, y: number) => {
    if (editingSubProcess) {
      // 子流程编辑模式：检测子流程中的节点
      const parentNode = nodes.find(n => n.id === editingSubProcess);
      if (parentNode && parentNode.subProcess) {
        return parentNode.subProcess.nodes.find(node => isPointInNode(x, y, node));
      }
      return null;
    } else {
      // 主流程编辑模式：检测主流程节点
      return nodes.find(node => isPointInNode(x, y, node));
    }
  }, [nodes, isPointInNode, editingSubProcess]);
  
  // 查找鼠标位置的子画布
  const findSubCanvasAtPosition = useCallback((x: number, y: number) => {
    if (editingSubProcess) {
      // 子流程编辑模式下不检测子画布
      return null;
    }
    return subCanvases.find(subCanvas => 
      x >= subCanvas.x && x <= subCanvas.x + subCanvas.width &&
      y >= subCanvas.y && y <= subCanvas.y + subCanvas.height
    );
  }, [subCanvases, editingSubProcess]);
  
  // 检测鼠标是否在连接点上
  const findConnectionPointAtPosition = useCallback((x: number, y: number) => {
    let nodesToCheck = nodes;
    
    if (editingSubProcess) {
      // 子流程编辑模式：检测子流程中的节点连接点
      const parentNode = nodes.find(n => n.id === editingSubProcess);
      if (parentNode && parentNode.subProcess) {
        nodesToCheck = parentNode.subProcess.nodes;
      } else {
        return null;
      }
    } else {
      // 主流程编辑模式：检测子画布连接点
      for (const subCanvas of subCanvases) {
        // 子画布左侧输入连接点
        const inputX = subCanvas.x;
        const inputY = subCanvas.y + subCanvas.height / 2;
        const inputDistance = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2);
        if (inputDistance <= 12) {
          console.log('🔗 [连接点检测] 检测到子画布输入连接点', { 
            subCanvasId: subCanvas.id, 
            type: 'input', 
            position: { x: inputX, y: inputY },
            mousePos: { x, y },
            distance: inputDistance 
          });
          return { nodeId: subCanvas.id, type: 'input' as const, x: inputX, y: inputY };
        }
        
        // 子画布右侧输出连接点
        const outputX = subCanvas.x + subCanvas.width;
        const outputY = subCanvas.y + subCanvas.height / 2;
        const outputDistance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
        if (outputDistance <= 12) {
          console.log('🔗 [连接点检测] 检测到子画布输出连接点', { 
            subCanvasId: subCanvas.id, 
            type: 'output', 
            position: { x: outputX, y: outputY },
            mousePos: { x, y },
            distance: outputDistance 
          });
          return { nodeId: subCanvas.id, type: 'output' as const, x: outputX, y: outputY };
        }
      }
    }
    
    for (const node of nodesToCheck) {
      if (node.type === 'start') {
        // 开始节点右侧输出口
        const outputX = node.x + node.width;
        const outputY = node.y + node.height / 2;
        const distance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
        if (distance <= 12) { // 扩大检测范围
          console.log('🔗 [连接点检测] 检测到开始节点输出连接点', { 
            nodeId: node.id, 
            type: 'output', 
            position: { x: outputX, y: outputY },
            mousePos: { x, y },
            distance 
          });
          return { nodeId: node.id, type: 'output' as const, x: outputX, y: outputY };
        }
      } else if (node.type === 'end') {
        // 结束节点左侧输入口
        const inputX = node.x;
        const inputY = node.y + node.height / 2;
        const distance = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2);
        if (distance <= 12) { // 扩大检测范围
          console.log('🔗 [连接点检测] 检测到结束节点输入连接点', { 
            nodeId: node.id, 
            type: 'input', 
            position: { x: inputX, y: inputY },
            mousePos: { x, y },
            distance 
          });
          return { nodeId: node.id, type: 'input' as const, x: inputX, y: inputY };
        }
      } else if (node.type === 'stage') {
        // 阶段节点支持左侧输入和右侧输出
        // 左侧输入口
        const inputX = node.x;
        const inputY = node.y + node.height / 2; // 使用节点实际高度的一半
        const inputDistance = Math.sqrt((x - inputX) ** 2 + (y - inputY) ** 2);
        if (inputDistance <= 12) {
          console.log('🔗 [连接点检测] 检测到阶段节点输入连接点', { 
            nodeId: node.id, 
            type: 'input', 
            position: { x: inputX, y: inputY },
            mousePos: { x, y },
            distance: inputDistance 
          });
          return { nodeId: node.id, type: 'input' as const, x: inputX, y: inputY };
        }
        
        // 右侧输出口
        const outputX = node.x + node.width;
        const outputY = node.y + node.height / 2; // 使用节点实际高度的一半
        const outputDistance = Math.sqrt((x - outputX) ** 2 + (y - outputY) ** 2);
        if (outputDistance <= 12) {
          console.log('🔗 [连接点检测] 检测到阶段节点输出连接点', { 
            nodeId: node.id, 
            type: 'output', 
            position: { x: outputX, y: outputY },
            mousePos: { x, y },
            distance: outputDistance 
          });
          return { nodeId: node.id, type: 'output' as const, x: outputX, y: outputY };
        }
      }
    }
    
    return null;
  }, [nodes, editingSubProcess, subCanvases]);
  
  // 检测鼠标是否悬停在子画布内部连线上
  const findSubCanvasLineAtPosition = useCallback((x: number, y: number) => {
    for (const subCanvas of subCanvases) {
      // 计算子画布内部连线的起点和终点
      const leftX = subCanvas.x;
      const leftY = subCanvas.y + subCanvas.height / 2;
      const rightX = subCanvas.x + subCanvas.width;
      const rightY = subCanvas.y + subCanvas.height / 2;
      
      // 计算点到线段的距离
      const A = rightY - leftY;
      const B = leftX - rightX;
      const C = rightX * leftY - leftX * rightY;
      const distance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
      
      // 检查点是否在线段范围内
      const minX = Math.min(leftX, rightX);
      const maxX = Math.max(leftX, rightX);
      const minY = Math.min(leftY, rightY);
      const maxY = Math.max(leftY, rightY);
      
      if (distance < 8 && x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10) {
        return subCanvas.id;
      }
    }
    return null;
  }, [subCanvases]);
  
  // 检测鼠标是否点击在悬停连线的加号图标上
  const findAddButtonAtPosition = useCallback((x: number, y: number) => {
    // 检查主画布连线的加号图标
    if (hoveredConnection) {
      const connection = connections.find(conn => conn.id === hoveredConnection);
      if (connection) {
        const sourceNode = nodes.find(n => n.id === connection.sourceId);
        const targetNode = nodes.find(n => n.id === connection.targetId);
        
        if (sourceNode && targetNode) {
          const startX = sourceNode.x + sourceNode.width;
          const startY = sourceNode.y + sourceNode.height / 2;
          const endX = targetNode.x;
          const endY = targetNode.y + targetNode.height / 2;
          
          // 计算连线中点（加号图标位置）
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          
          // 检测点击是否在加号图标区域内（半径12px）
          const distance = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
          if (distance <= 12) {
            return { connectionId: connection.id, x: midX, y: midY, type: 'main' };
          }
        }
      }
    }
    
    // 检查子画布内部连线的加号图标
    if (hoveredSubCanvasLine) {
      const subCanvas = subCanvases.find(sc => sc.id === hoveredSubCanvasLine);
      if (subCanvas) {
        const leftX = subCanvas.x;
        const leftY = subCanvas.y + subCanvas.height / 2;
        const rightX = subCanvas.x + subCanvas.width;
        const rightY = subCanvas.y + subCanvas.height / 2;
        
        // 计算连线中点（加号图标位置）
        const midX = (leftX + rightX) / 2;
        const midY = (leftY + rightY) / 2;
        
        // 检测点击是否在加号图标区域内（半径12px）
        const distance = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
        if (distance <= 12) {
          return { connectionId: hoveredSubCanvasLine, x: midX, y: midY, type: 'subcanvas' };
        }
      }
    }
    
    return null;
  }, [hoveredConnection, hoveredSubCanvasLine, connections, nodes, subCanvases]);
  
  // 画布鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    console.log('🖱️ [鼠标按下] 位置信息', {
      clientPos: { x: e.clientX, y: e.clientY },
      canvasPos: { x: canvasPos.x, y: canvasPos.y },
      canvasState: { offsetX: canvasState.offsetX, offsetY: canvasState.offsetY, scale: canvasState.scale }
    });
    
    const clickedAddButton = findAddButtonAtPosition(canvasPos.x, canvasPos.y);
    const clickedConnectionPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    const clickedSubCanvas = findSubCanvasAtPosition(canvasPos.x, canvasPos.y);
    const clickedConnection = findConnectionAtPosition(canvasPos.x, canvasPos.y);
    
    console.log('🔍 [检测结果]', {
      addButton: !!clickedAddButton,
      connectionPoint: clickedConnectionPoint,
      node: clickedNode ? { id: clickedNode.id, type: clickedNode.type } : null,
      subCanvas: clickedSubCanvas ? { id: clickedSubCanvas.id } : null,
      connection: !!clickedConnection
    });
    
    if (clickedAddButton) {
      if (clickedAddButton.type === 'main') {
        // 点击了主画布连线上的加号图标，弹出添加节点面板
        setInsertingConnectionId(clickedAddButton.connectionId);
        setNodeAddPosition({ x: clickedAddButton.x, y: clickedAddButton.y });
        setShowNodePanel(true);
        message.info('请选择要添加的节点类型');
      } else if (clickedAddButton.type === 'subcanvas') {
        // 点击了子画布内部连线上的加号图标，在子画布内部添加节点
        message.info('子画布内部连线添加节点功能开发中...');
        // TODO: 实现子画布内部添加节点的逻辑
      }
      return;
    } else if (clickedConnectionPoint) {
      // 点击了连接点，开始拖拽连线
      console.log('🔗 [拖拽连线] 开始拖拽', { 
        from: clickedConnectionPoint,
        mousePos: canvasPos 
      });
      setIsDraggingConnection(true);
      setDragConnectionStart(clickedConnectionPoint);
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      setSelectedNode(null);
      setSelectedConnection(null);
    } else if (clickedNode) {
      // 如果点击的是阶段节点，显示属性面板并启动拖拽
      if (clickedNode.type === 'stage') {
        setSelectedStageNode(clickedNode);
        setStagePropertyPanelVisible(true);
      }
      
      // 选中节点并开始拖拽（包括阶段节点）
      setSelectedNode(clickedNode.id);
      setSelectedConnection(null);
      setDraggedNode(clickedNode);
      setIsDraggingNode(true);
      setDragOffset({
        x: canvasPos.x - clickedNode.x,
        y: canvasPos.y - clickedNode.y
      });
    } else if (clickedSubCanvas) {
      // 点击了子画布，开始拖拽子画布
      setSelectedNode(null);
      setSelectedConnection(null);
      setDraggedSubCanvas(clickedSubCanvas);
      setIsDraggingSubCanvas(true);
      setSubCanvasDragOffset({
        x: canvasPos.x - clickedSubCanvas.x,
        y: canvasPos.y - clickedSubCanvas.y
      });
    } else if (clickedConnection) {
      // 点击了连线
      setSelectedConnection(clickedConnection);
      setSelectedNode(null);
    } else if (e.button === 0 && canvasState.isSpacePressed) {
      // 空格键按下时拖拽画布
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else {
      // 点击空白区域，取消选择并隐藏属性面板
      setSelectedNode(null);
      setSelectedConnection(null);
      setInsertingConnectionId(null);
      setStagePropertyPanelVisible(false);
    }
  }, [canvasState.isSpacePressed, getCanvasCoordinates, findAddButtonAtPosition, findNodeAtPosition, findSubCanvasAtPosition, findConnectionAtPosition, checkOpenSubCanvasButtonClick, openIndependentSubCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (isDraggingConnection) {
      // 拖拽连线
      setDragConnectionEnd({ x: canvasPos.x, y: canvasPos.y });
      
      // 检测目标连接点
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      if (targetPoint && targetPoint.type === 'input' && dragConnectionStart && targetPoint.nodeId !== dragConnectionStart.nodeId) {
        console.log('🔗 [拖拽连线] 检测到有效目标', { target: targetPoint });
      }
    } else if (isDraggingNode && draggedNode) {
      // 拖拽节点
      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;
      
      if (editingSubProcess) {
        // 子流程编辑模式：更新子流程中的节点位置
        setNodes(prev => prev.map(node => {
          if (node.id === editingSubProcess && node.subProcess) {
            const updatedSubNodes = node.subProcess.nodes.map(subNode => 
              subNode.id === draggedNode.id ? { ...subNode, x: newX, y: newY } : subNode
            );
            
            // 更新子流程中相关连线的连接点坐标
            const updatedSubNode = updatedSubNodes.find(n => n.id === draggedNode.id);
            let updatedConnections = node.subProcess.connections;
            
            if (updatedSubNode) {
              updatedConnections = node.subProcess.connections.map(connection => {
                let updatedConnection = { ...connection };
                
                // 如果这个节点是连线的源节点，更新源连接点
                if (connection.sourceId === draggedNode.id) {
                  updatedConnection.sourcePoint = {
                    x: updatedSubNode.x + updatedSubNode.width,
                    y: updatedSubNode.y + updatedSubNode.height / 2
                  };
                }
                
                // 如果这个节点是连线的目标节点，更新目标连接点
                if (connection.targetId === draggedNode.id) {
                  updatedConnection.targetPoint = {
                    x: updatedSubNode.x,
                    y: updatedSubNode.y + updatedSubNode.height / 2
                  };
                }
                
                return updatedConnection;
              });
            }
            
            return {
              ...node,
              subProcess: {
                ...node.subProcess,
                nodes: updatedSubNodes,
                connections: updatedConnections
              }
            };
          }
          return node;
        }));
      } else {
        // 主流程编辑模式：更新主流程节点位置
        setNodes(prev => {
          const updatedNodes = prev.map(node => 
            node.id === draggedNode.id ? { ...node, x: newX, y: newY } : node
          );
          
          // 更新相关连线的连接点坐标
          const updatedNode = updatedNodes.find(n => n.id === draggedNode.id);
          if (updatedNode) {
            setConnections(prevConnections => 
              prevConnections.map(connection => {
                let updatedConnection = { ...connection };
                
                // 如果这个节点是连线的源节点，更新源连接点
                if (connection.sourceId === draggedNode.id) {
                  updatedConnection.sourcePoint = {
                    x: updatedNode.x + updatedNode.width,
                    y: updatedNode.y + updatedNode.height / 2
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
              })
            );
          }
          
          return updatedNodes;
        });
      }
    } else if (isDraggingSubCanvas && draggedSubCanvas) {
      // 拖拽子画布
      const newX = canvasPos.x - subCanvasDragOffset.x;
      const newY = canvasPos.y - subCanvasDragOffset.y;
      
      setSubCanvases(prev => prev.map(subCanvas => 
        subCanvas.id === draggedSubCanvas.id ? { ...subCanvas, x: newX, y: newY } : subCanvas
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
      
      // 检测子画布内部连线悬停
      const subCanvasLineId = findSubCanvasLineAtPosition(canvasPos.x, canvasPos.y);
      setHoveredSubCanvasLine(subCanvasLineId);
      
      // 检测阶段节点悬停
      const hoveredNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
      if (hoveredNode && hoveredNode.type === 'stage') {
        setHoveredStageNode(hoveredNode.id);
      } else {
        setHoveredStageNode(null);
      }
      
      setMousePosition({ x: canvasPos.x, y: canvasPos.y });
    }
  }, [isDraggingConnection, isDraggingNode, draggedNode, dragOffset, isDraggingSubCanvas, draggedSubCanvas, subCanvasDragOffset, canvasState.isDragging, canvasState.isSpacePressed, canvasState.lastMouseX, canvasState.lastMouseY, getCanvasCoordinates, findConnectionPointAtPosition, findConnectionAtPosition, findNodeAtPosition]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      // 结束连线拖拽
      const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
      const targetPoint = findConnectionPointAtPosition(canvasPos.x, canvasPos.y);
      
      console.log('🔗 [拖拽连线] 结束拖拽', { 
        from: dragConnectionStart,
        to: targetPoint,
        canvasPos,
        isDraggingConnection,
        dragConnectionStart,
        dragConnectionEnd
      });
      
      // 检查是否可以创建连接（从输出连到输入）
      console.log('🔗 [连接验证] 开始验证', {
        hasTargetPoint: !!targetPoint,
        sourceType: dragConnectionStart.type,
        targetType: targetPoint?.type,
        sameNode: dragConnectionStart.nodeId === targetPoint?.nodeId
      });
      
      if (targetPoint && 
          dragConnectionStart.type === 'output' && 
          targetPoint.type === 'input' &&
          dragConnectionStart.nodeId !== targetPoint.nodeId) {
        
        console.log('🔗 [连接验证] 基本验证通过，检查重复连接');
        
        // 检查是否已存在相同连接
        const existingConnection = connections.find(conn => 
          conn.sourceId === dragConnectionStart.nodeId && 
          conn.targetId === targetPoint.nodeId
        );
        
        console.log('🔗 [连接验证] 重复连接检查', { existingConnection: !!existingConnection });
        
        if (!existingConnection) {
          // 确定连接类型
          const sourceNode = nodes.find(n => n.id === dragConnectionStart.nodeId);
          const targetNode = nodes.find(n => n.id === targetPoint.nodeId);
          const sourceSubCanvas = subCanvases.find(sc => sc.id === dragConnectionStart.nodeId);
          const targetSubCanvas = subCanvases.find(sc => sc.id === targetPoint.nodeId);
          
          console.log('🔗 [连接验证] 节点查找结果', {
            sourceNode: sourceNode ? { id: sourceNode.id, type: sourceNode.type } : null,
            targetNode: targetNode ? { id: targetNode.id, type: targetNode.type } : null,
            sourceSubCanvas: sourceSubCanvas ? { id: sourceSubCanvas.id } : null,
            targetSubCanvas: targetSubCanvas ? { id: targetSubCanvas.id } : null
          });
          
          // 阶段节点相关连接验证已移除
          
          let sourceType: 'node' | 'stage' | 'subcanvas' = 'node';
          let targetType: 'node' | 'stage' | 'subcanvas' = 'node';
          
          if (sourceSubCanvas) {
            sourceType = 'subcanvas';
          } else if (sourceNode && sourceNode.type === 'stage') {
            sourceType = 'stage';
          }
          
          if (targetSubCanvas) {
            targetType = 'subcanvas';
          } else if (targetNode && targetNode.type === 'stage') {
            targetType = 'stage';
          }
          
          // 创建新连接
          const newConnection: Connection = {
            id: `connection_${Date.now()}`,
            sourceId: dragConnectionStart.nodeId,
            targetId: targetPoint.nodeId,
            sourcePoint: { x: dragConnectionStart.x, y: dragConnectionStart.y },
            targetPoint: { x: targetPoint.x, y: targetPoint.y },
            sourceType,
            targetType
          };
          
          console.log('🔗 [拖拽连线] 创建新连接', { newConnection });
          setConnections(prev => [...prev, newConnection]);
          message.success('连接创建成功');
        } else {
          console.log('🔗 [拖拽连线] 连接已存在', { existingConnection });
          message.warning('连接已存在');
        }
      } else if (!targetPoint && dragConnectionStart.type === 'output') {
        // 拖拽连线到空白处，弹出添加节点面板
        console.log('🔗 [拖拽连线] 拖拽到空白处，弹出添加节点面板');
        setNodeAddPosition({ x: canvasPos.x, y: canvasPos.y });
        setShowNodePanel(true);
        message.info('请选择要添加的节点类型');
        
        // 注意：不重置dragConnectionStart，保持连线状态直到用户选择节点或取消
        setIsDraggingConnection(false);
        setDragConnectionEnd(null);
        return; // 提前返回，避免重置dragConnectionStart
      } else {
        console.log('🔗 [拖拽连线] 无效连接', { 
          reason: !targetPoint ? '无目标点' : 
                  dragConnectionStart.type !== 'output' ? '起点非输出' :
                  targetPoint.type !== 'input' ? '终点非输入' :
                  dragConnectionStart.nodeId === targetPoint.nodeId ? '同一节点' : '未知'
        });
      }
      
      // 重置拖拽状态
      setIsDraggingConnection(false);
      setDragConnectionStart(null);
      setDragConnectionEnd(null);
    } else if (isDraggingNode) {
      // 结束节点拖拽
      setIsDraggingNode(false);
      setDraggedNode(null);
      setDragOffset({ x: 0, y: 0 });
      
      // 重置阶段节点悬停状态
      setHoveredStageNode(null);
    } else if (isDraggingSubCanvas) {
      // 结束子画布拖拽
      setIsDraggingSubCanvas(false);
      setDraggedSubCanvas(null);
      setSubCanvasDragOffset({ x: 0, y: 0 });
    } else if (canvasState.isDragging) {
      // 结束画布拖拽
      const newState = { ...canvasState, isDragging: false };
      setCanvasState(newState);
      saveToHistory(newState);
    } else {
      // 点击空白区域，取消拖拽状态
      setCanvasState(prev => ({ ...prev, isDragging: false }));
    }
  }, [isDraggingConnection, dragConnectionStart, dragConnectionEnd, connections, isDraggingNode, isDraggingSubCanvas, canvasState, saveToHistory, getCanvasCoordinates, findConnectionPointAtPosition, nodes, subCanvases]);

  const handleMouseLeave = useCallback(() => {
    setHoveredConnection(null);
    setHoveredConnectionPoint(null);
    setHoveredStageNode(null);
    setMousePosition({ x: 0, y: 0 });
  }, []);

  // 右键菜单事件处理
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
    const clickedNode = findNodeAtPosition(canvasPos.x, canvasPos.y);
    
    // 只有右键点击阶段节点时才显示菜单
    if (clickedNode && clickedNode.type === 'stage') {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        nodeId: clickedNode.id
      });
    } else {
      // 点击其他地方隐藏菜单
      setContextMenu(null);
    }
  }, [getCanvasCoordinates, findNodeAtPosition]);

  // 点击其他地方隐藏右键菜单
  const handleClickOutside = useCallback(() => {
    if (contextMenu?.visible) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newState = {
      ...canvasState,
      scale: Math.max(0.1, Math.min(3, canvasState.scale * delta))
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

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
    
    // 不在这里应用画布变换，因为变换已经在主绘制循环中应用了
    ctx.save();
    
    if (type === 'start' || type === 'end') {
      // 绘制阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 开始和结束节点绘制为圆角矩形 - 白色背景
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isSelected ? '#1890ff' : '#cccccc';
      ctx.lineWidth = isSelected ? 1 : 0.5;
      
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

    } else {
      // 阶段节点绘制
      if (type === 'stage') {
        // 绘制阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 绘制白色背景圆角矩形
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = isSelected ? '#722ed1' : '#cccccc';
        ctx.lineWidth = isSelected ? 1 : 0.5;
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
        
        // 移除底部端点
      } else {
        // 其他节点绘制为圆角矩形
        ctx.fillStyle = isSelected ? color : '#ffffff';
        ctx.strokeStyle = isSelected ? color : '#cccccc';
        ctx.lineWidth = isSelected ? 1 : 0.5;
        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fill();
        ctx.stroke();
        
        // 绘制连接口小圆圈
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
      // 阶段节点绘制 - 卡片样式
      // 检查是否悬停
      const isHovered = hoveredStageNode === node.id;
      
      // 保存当前变换状态
      ctx.save();
      
      // 如果悬停，应用缩放变换
      if (isHovered) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(1.05, 1.05); // 放大5%
        ctx.translate(-centerX, -centerY);
      }
      
      // 绘制阴影 - 悬停时增强阴影效果
      ctx.shadowColor = isHovered ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = isHovered ? 12 : 8;
      ctx.shadowOffsetX = isHovered ? 3 : 2;
      ctx.shadowOffsetY = isHovered ? 3 : 2;
      
      // 绘制白色背景圆角矩形
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isSelected ? '#1890ff' : (isHovered ? '#1890ff' : '#cccccc');
      ctx.lineWidth = isSelected ? 1 : (isHovered ? 1 : 0.5);
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
      
      // 绘制连接口小圆圈 - 蓝色统一风格
      ctx.fillStyle = '#1890ff';
      ctx.strokeStyle = '#1890ff';
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
      
      // 卡片内容绘制
      const padding = 12;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - 2 * padding;
      
      // 第一行：图标和名称水平排列
      const iconSize = 18;
      const iconY = contentY + 8;
      
      // 绘制阶段图标（改进的圆角矩形图标）
      ctx.fillStyle = '#e6f7ff';
      ctx.beginPath();
      ctx.roundRect(contentX, iconY, iconSize, iconSize, 4);
      ctx.fill();
      
      // 绘制图标边框
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // 绘制图标内部小方块
      ctx.fillStyle = '#1890ff';
      ctx.fillRect(contentX + 5, iconY + 5, 8, 8);
      
      // 绘制节点名称 - 增大字体
      ctx.fillStyle = '#262626';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const nodeText = node.customName || label;
      ctx.fillText(nodeText, contentX + iconSize + 8, iconY + iconSize / 2);
      
      // 第二行开始：纵向排列的字段
      let currentY = iconY + iconSize + 22; // 进一步增加标题与内容的间距
      const lineHeight = 20; // 增加行间距
      
      // 设置字段文本样式 - 增大字体
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#666666';
      
      // 需方设备
      if (node.demandDevices && node.demandDevices.length > 0) {
        // 绘制字段标签
        ctx.fillStyle = '#666666';
        ctx.fillText('需方设备: ', contentX, currentY);
        
        // 计算字段值的位置和尺寸
        const labelWidth = ctx.measureText('需方设备: ').width;
        const valueText = node.demandDevices.join(', ');
        const maxValueWidth = contentWidth - labelWidth - 16; // 预留右边距
        
        // 处理文本溢出
        let displayText = valueText;
        let valueWidth = ctx.measureText(valueText).width;
        if (valueWidth > maxValueWidth) {
          // 逐字符截取直到适合宽度
          while (valueWidth > maxValueWidth - ctx.measureText('...').width && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
            valueWidth = ctx.measureText(displayText + '...').width;
          }
          displayText += '...';
          valueWidth = ctx.measureText(displayText).width;
        }
        
        const valueX = contentX + labelWidth;
        const valueY = currentY;
        
        // 绘制字段值的灰色背景矩形（增加间距）
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(valueX - 4, valueY - 10, valueWidth + 8, 20);
        
        // 绘制字段值文字（加深颜色）
        ctx.fillStyle = '#333333';
        ctx.fillText(displayText, valueX, valueY);
        
        currentY += lineHeight + 4; // 增加字段间距
        
        // 需方设备下的触发条件
        if (node.triggerCondition) {
          // 绘制字段标签
          ctx.fillStyle = '#666666';
          ctx.fillText('触发条件: ', contentX, currentY);
          
          // 计算字段值的位置和尺寸
          const triggerLabelWidth = ctx.measureText('触发条件: ').width;
          const triggerValueText = node.triggerCondition;
          const maxTriggerWidth = contentWidth - triggerLabelWidth - 16;
          
          // 处理文本溢出
          let triggerDisplayText = triggerValueText;
          let triggerValueWidth = ctx.measureText(triggerValueText).width;
          if (triggerValueWidth > maxTriggerWidth) {
            while (triggerValueWidth > maxTriggerWidth - ctx.measureText('...').width && triggerDisplayText.length > 0) {
              triggerDisplayText = triggerDisplayText.slice(0, -1);
              triggerValueWidth = ctx.measureText(triggerDisplayText + '...').width;
            }
            triggerDisplayText += '...';
            triggerValueWidth = ctx.measureText(triggerDisplayText).width;
          }
          
          const triggerValueX = contentX + triggerLabelWidth;
          const triggerValueY = currentY;
          
          // 绘制字段值的灰色背景矩形（增加间距）
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(triggerValueX - 4, triggerValueY - 10, triggerValueWidth + 8, 20);
          
          // 绘制字段值文字（加深颜色）
          ctx.fillStyle = '#333333';
          ctx.fillText(triggerDisplayText, triggerValueX, triggerValueY);
          
          currentY += lineHeight + 4; // 增加字段间距
        }
      }
      
      // 供方设备
      if (node.supplyDevices && node.supplyDevices.length > 0) {
        // 绘制字段标签
        ctx.fillStyle = '#666666';
        ctx.fillText('供方设备: ', contentX, currentY);
        
        // 计算字段值的位置和尺寸
        const supplyLabelWidth = ctx.measureText('供方设备: ').width;
        const supplyValueText = node.supplyDevices.join(', ');
        const maxSupplyWidth = contentWidth - supplyLabelWidth - 16;
        
        // 处理文本溢出
        let supplyDisplayText = supplyValueText;
        let supplyValueWidth = ctx.measureText(supplyValueText).width;
        if (supplyValueWidth > maxSupplyWidth) {
          while (supplyValueWidth > maxSupplyWidth - ctx.measureText('...').width && supplyDisplayText.length > 0) {
            supplyDisplayText = supplyDisplayText.slice(0, -1);
            supplyValueWidth = ctx.measureText(supplyDisplayText + '...').width;
          }
          supplyDisplayText += '...';
          supplyValueWidth = ctx.measureText(supplyDisplayText).width;
        }
        
        const supplyValueX = contentX + supplyLabelWidth;
        const supplyValueY = currentY;
        
        // 绘制字段值的灰色背景矩形（增加间距）
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(supplyValueX - 4, supplyValueY - 10, supplyValueWidth + 8, 20);
        
        // 绘制字段值文字（加深颜色）
        ctx.fillStyle = '#333333';
        ctx.fillText(supplyDisplayText, supplyValueX, supplyValueY);
        
        currentY += lineHeight + 4; // 增加字段间距
        
        // 供方设备下的触发条件
        if (node.triggerCondition) {
          // 绘制字段标签
          ctx.fillStyle = '#666666';
          ctx.fillText('触发条件: ', contentX, currentY);
          
          // 计算字段值的位置和尺寸
          const triggerLabelWidth = ctx.measureText('触发条件: ').width;
          const triggerValueText = node.triggerCondition;
          const maxTriggerWidth = contentWidth - triggerLabelWidth - 16;
          
          // 处理文本溢出
          let triggerDisplayText = triggerValueText;
          let triggerValueWidth = ctx.measureText(triggerValueText).width;
          if (triggerValueWidth > maxTriggerWidth) {
            while (triggerValueWidth > maxTriggerWidth - ctx.measureText('...').width && triggerDisplayText.length > 0) {
              triggerDisplayText = triggerDisplayText.slice(0, -1);
              triggerValueWidth = ctx.measureText(triggerDisplayText + '...').width;
            }
            triggerDisplayText += '...';
            triggerValueWidth = ctx.measureText(triggerDisplayText).width;
          }
          
          const triggerValueX = contentX + triggerLabelWidth;
          const triggerValueY = currentY;
          
          // 绘制字段值的灰色背景矩形（增加间距）
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(triggerValueX - 4, triggerValueY - 10, triggerValueWidth + 8, 20);
          
          // 绘制字段值文字（加深颜色）
          ctx.fillStyle = '#333333';
          ctx.fillText(triggerDisplayText, triggerValueX, triggerValueY);
        }
      }
      
      // 如果悬停，在阶段卡片外上方显示设置图标
      if (isHovered) {
        const iconSize = 24;
        const iconX = x + width - iconSize;
        const iconY = y - iconSize - 8; // 在卡片上方外部
        
        // 绘制图标阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 绘制图标背景圆形 - 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d9d9d9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 清除阴影设置
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 绘制设置图标（齿轮形状）- 深色图标
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚙', iconX + iconSize / 2, iconY + iconSize / 2);
        
        // 存储图标位置信息用于点击检测
        node.settingsIconBounds = {
          x: iconX,
          y: iconY,
          width: iconSize,
          height: iconSize
        };
      }
      
    } else {
      ctx.fillStyle = isSelected ? '#ffffff' : color;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 绘制文字
      ctx.fillText(label, x + width / 2, y + height / 2);
    }
    
    ctx.restore();
  }, [canvasState, selectedNode, nodeTools]);
  
  // 绘制连接线
  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    // 不在这里应用画布变换，因为变换已经在主绘制循环中应用了
    
    connections.forEach(connection => {

      // 处理节点到节点的连接（包括普通节点和阶段节点）
      if (connection.sourceType === 'node' || connection.sourceType === 'stage' || !connection.sourceType) {
        const sourceNode = nodes.find(n => n.id === connection.sourceId);
        const targetNode = nodes.find(n => n.id === connection.targetId);
        

        
        if (sourceNode && targetNode) {
          // 连线坐标需要根据当前节点的实际位置重新计算
          // 因为画布拖动时节点坐标不变，但视觉位置改变了
          const startX = sourceNode.x + sourceNode.width;
          const startY = sourceNode.y + sourceNode.height / 2;
          const endX = targetNode.x;
          const endY = targetNode.y + targetNode.height / 2;
          

          
          // 判断是否为悬停或选中状态
          const isHovered = hoveredConnection === connection.id;
          const isSelected = selectedConnection === connection.id;
          
          // 设置连线样式 - 选中时加粗但保持蓝色
          ctx.strokeStyle = isHovered ? '#13c2c2' : '#1890ff';
          ctx.lineWidth = (isSelected || isHovered) ? 2 : 1;
          
          // 绘制贝塞尔曲线连接
          const controlPointOffset = Math.abs(endX - startX) * 0.5;
          const cp1x = startX + controlPointOffset;
          const cp1y = startY;
          const cp2x = endX - controlPointOffset;
          const cp2y = endY;
          

          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
          ctx.stroke();
          
          // 绘制箭头 - 计算曲线末端的切线角度
          const t = 0.95; // 在曲线95%位置计算切线
          const dx = 3 * (1 - t) * (1 - t) * (cp1x - startX) + 
                     6 * (1 - t) * t * (cp2x - cp1x) + 
                     3 * t * t * (endX - cp2x);
          const dy = 3 * (1 - t) * (1 - t) * (cp1y - startY) + 
                     6 * (1 - t) * t * (cp2y - cp1y) + 
                     3 * t * t * (endY - cp2y);
          const angle = Math.atan2(dy, dx);
          
          const arrowLength = 10;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          
          // 如果悬停，在连线中点绘制添加节点图标
          if (isHovered) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // 绘制圆形背景
            ctx.fillStyle = '#13c2c2';
            ctx.beginPath();
            ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // 绘制加号图标
            ctx.strokeStyle = '#ffffff';
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
      }
      
      // 处理子画布与其他节点/子画布的连接
      else if (connection.sourceType === 'subcanvas' || connection.targetType === 'subcanvas') {
        let sourceNode, targetNode, sourceSubCanvas, targetSubCanvas;
        let startX: number = 0, startY: number = 0, endX: number = 0, endY: number = 0;
        let hasValidConnection = false;
        let isStageToSubCanvas = false;
        let isSubCanvasToSubCanvas = false;
        
        // 确定源和目标
        if (connection.sourceType === 'subcanvas' && connection.targetType === 'subcanvas') {
          // 子画布到子画布的连接
          sourceSubCanvas = subCanvases.find(sc => sc.id === connection.sourceId);
          targetSubCanvas = subCanvases.find(sc => sc.id === connection.targetId);
          isSubCanvasToSubCanvas = true;
        } else if (connection.sourceType === 'subcanvas') {
          sourceSubCanvas = subCanvases.find(sc => sc.id === connection.sourceId);
          targetNode = nodes.find(n => n.id === connection.targetId);
          // 阶段节点连接检查已移除
          isStageToSubCanvas = false;
        } else {
          sourceNode = nodes.find(n => n.id === connection.sourceId);
          targetSubCanvas = subCanvases.find(sc => sc.id === connection.targetId);
          // 阶段节点连接检查已移除
          isStageToSubCanvas = false;
        }
        
        // 计算连接点位置
        if (isSubCanvasToSubCanvas && sourceSubCanvas && targetSubCanvas) {
          // 子画布到子画布：源子画布右侧输出连接点到目标子画布左侧输入连接点
          startX = sourceSubCanvas.x + sourceSubCanvas.width;
          startY = sourceSubCanvas.y + sourceSubCanvas.height / 2;
          endX = targetSubCanvas.x;
          endY = targetSubCanvas.y + targetSubCanvas.height / 2;
          hasValidConnection = true;
        } else if (sourceSubCanvas && targetNode) {
          if (isStageToSubCanvas) {
            // 子画布到阶段节点：子画布上方连接点到阶段节点下方连接点
            startX = sourceSubCanvas.x + sourceSubCanvas.width / 2;
            startY = sourceSubCanvas.y;
            endX = targetNode.x + targetNode.width / 2;
            endY = targetNode.y + targetNode.height;
          } else {
            // 子画布到普通节点：子画布右侧连接点到节点左侧
            startX = sourceSubCanvas.x + sourceSubCanvas.width;
            startY = sourceSubCanvas.y + sourceSubCanvas.height / 2;
            endX = targetNode.x;
            endY = targetNode.y + targetNode.height / 2;
          }
          hasValidConnection = true;
        } else if (sourceNode && targetSubCanvas) {
          if (isStageToSubCanvas) {
            // 阶段节点到子画布：阶段节点下方连接点到子画布上方连接点
            startX = sourceNode.x + sourceNode.width / 2;
            startY = sourceNode.y + sourceNode.height;
            endX = targetSubCanvas.x + targetSubCanvas.width / 2;
            endY = targetSubCanvas.y;
          } else {
            // 普通节点到子画布：节点右侧到子画布左侧连接点
            startX = sourceNode.x + sourceNode.width;
            startY = sourceNode.y + sourceNode.height / 2;
            endX = targetSubCanvas.x;
            endY = targetSubCanvas.y + targetSubCanvas.height / 2;
          }
          hasValidConnection = true;
        }
        
        if (hasValidConnection) {
          // 判断是否为悬停或选中状态
          const isHovered = hoveredConnection === connection.id;
          const isSelected = selectedConnection === connection.id;
          
          if (isSubCanvasToSubCanvas) {
            // 子画布到子画布连接 - 绿色实线（与开始/结束节点连线样式一致）
            ctx.strokeStyle = isHovered ? '#52c41a' : '#389e0d'; // 绿色表示子画布间连接
            ctx.lineWidth = (isSelected || isHovered) ? 2 : 1;
            ctx.setLineDash([]); // 实线样式
          } else if (isStageToSubCanvas) {
            // 阶段节点与子画布连接 - 蓝色虚线
            ctx.strokeStyle = isHovered ? '#40a9ff' : '#1890ff'; // 蓝色表示阶段与子画布连接
            ctx.lineWidth = (isSelected || isHovered) ? 2 : 1;
            ctx.setLineDash([8, 4]); // 虚线样式
          } else {
            // 普通节点与子画布连接 - 红色实线
            ctx.strokeStyle = isHovered ? '#ff7875' : '#ff4d4f'; // 红色表示普通节点与子画布连接
            ctx.lineWidth = (isSelected || isHovered) ? 2 : 1;
            ctx.setLineDash([]); // 实线样式
          }
          
          // 绘制贝塞尔曲线连接
          const controlPointOffset = Math.abs(endX - startX) * 0.5;
          const cp1x = startX + controlPointOffset;
          const cp1y = startY;
          const cp2x = endX - controlPointOffset;
          const cp2y = endY;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
          ctx.stroke();
          
          // 绘制箭头 - 计算曲线末端的切线角度
          const t = 0.95; // 在曲线95%位置计算切线
          const dx = 3 * (1 - t) * (1 - t) * (cp1x - startX) + 
                     6 * (1 - t) * t * (cp2x - cp1x) + 
                     3 * t * t * (endX - cp2x);
          const dy = 3 * (1 - t) * (1 - t) * (cp1y - startY) + 
                     6 * (1 - t) * t * (cp2y - cp1y) + 
                     3 * t * t * (endY - cp2y);
          const angle = Math.atan2(dy, dx);
          
          const arrowLength = 10;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          
          // 重置虚线样式
          ctx.setLineDash([]);
          
          // 如果悬停，在连线中点绘制添加节点图标
          if (isHovered) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // 绘制圆形背景
            ctx.fillStyle = isStageToSubCanvas ? '#40a9ff' : '#ff7875';
            ctx.beginPath();
            ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // 绘制加号图标
            ctx.strokeStyle = '#ffffff';
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
      }
    });
    
    // 绘制拖拽中的连线
    if (isDraggingConnection && dragConnectionStart && dragConnectionEnd) {
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]); // 虚线效果
      
      // 绘制贝塞尔曲线
      const startX = dragConnectionStart.x;
      const startY = dragConnectionStart.y;
      const endX = dragConnectionEnd.x;
      const endY = dragConnectionEnd.y;
      
      const controlPointOffset = Math.abs(endX - startX) * 0.5;
      const cp1x = startX + controlPointOffset;
      const cp1y = startY;
      const cp2x = endX - controlPointOffset;
      const cp2y = endY;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();
      ctx.setLineDash([]); // 重置为实线
    }
  }, [canvasState, connections, nodes, subCanvases, hoveredConnection, selectedConnection, isDraggingConnection, dragConnectionStart, dragConnectionEnd]);

  // 绘制子画布
  const drawSubCanvas = useCallback((ctx: CanvasRenderingContext2D, subCanvas: SubCanvas) => {
    // 不在这里应用画布变换，因为变换已经在主绘制循环中应用了
    ctx.save();
    
    const { x, y, width, height, title } = subCanvas;
    const isSelected = selectedSubCanvas === subCanvas.id;
    const padding = 10; // 内边距
    
    // 绘制投影（与开始节点一致）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 绘制子画布背景 - 灰色
    ctx.fillStyle = '#f8f9fa';
    
    // 绘制圆角矩形
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    ctx.fill();
    
    // 清除阴影设置
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 绘制选中状态的边框
    if (isSelected) {
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // 绘制默认边框
      ctx.strokeStyle = '#d9d9d9';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 绘制内阴影效果（线状效果）
    ctx.save();
    
    // 创建内阴影路径（极小的缩进，类似线的效果）
    const shadowInset = 0.3; // 极小的内阴影缩进距离
    const shadowRadius = radius - shadowInset;
    const shadowX = x + shadowInset;
    const shadowY = y + shadowInset;
    const shadowWidth = width - 2 * shadowInset;
    const shadowHeight = height - 2 * shadowInset;
    
    // 设置内阴影的渐变（更小的范围，类似线的效果）- 白色内描边
    const gradient = ctx.createRadialGradient(
      x + width / 2, y + height / 2, 0,
      x + width / 2, y + height / 2, Math.min(width, height) / 12 // 极小的渐变范围
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.95, 'rgba(255, 255, 255, 0)'); // 更大的透明区域
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)'); // 白色内描边效果
    
    // 绘制白色内描边
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(shadowX + shadowRadius, shadowY);
    ctx.lineTo(shadowX + shadowWidth - shadowRadius, shadowY);
    ctx.quadraticCurveTo(shadowX + shadowWidth, shadowY, shadowX + shadowWidth, shadowY + shadowRadius);
    ctx.lineTo(shadowX + shadowWidth, shadowY + shadowHeight - shadowRadius);
    ctx.quadraticCurveTo(shadowX + shadowWidth, shadowY + shadowHeight, shadowX + shadowWidth - shadowRadius, shadowY + shadowHeight);
    ctx.lineTo(shadowX + shadowRadius, shadowY + shadowHeight);
    ctx.quadraticCurveTo(shadowX, shadowY + shadowHeight, shadowX, shadowY + shadowHeight - shadowRadius);
    ctx.lineTo(shadowX, shadowY + shadowRadius);
    ctx.quadraticCurveTo(shadowX, shadowY, shadowX + shadowRadius, shadowY);
    ctx.closePath();
    
    ctx.fill();
    
    // 恢复合成模式
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    
    // 绘制子画布内部网格（考虑内边距）
    ctx.save();
    // 设置裁剪区域为子画布内部（排除边框和内边距）
    const clipRadius = radius - 1;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - 2 * padding;
    const contentHeight = height - 2 * padding;
    
    ctx.beginPath();
    ctx.moveTo(contentX + clipRadius, contentY);
    ctx.lineTo(contentX + contentWidth - clipRadius, contentY);
    ctx.quadraticCurveTo(contentX + contentWidth, contentY, contentX + contentWidth, contentY + clipRadius);
    ctx.lineTo(contentX + contentWidth, contentY + contentHeight - clipRadius);
    ctx.quadraticCurveTo(contentX + contentWidth, contentY + contentHeight, contentX + contentWidth - clipRadius, contentY + contentHeight);
    ctx.lineTo(contentX + clipRadius, contentY + contentHeight);
    ctx.quadraticCurveTo(contentX, contentY + contentHeight, contentX, contentY + contentHeight - clipRadius);
    ctx.lineTo(contentX, contentY + clipRadius);
    ctx.quadraticCurveTo(contentX, contentY, contentX + clipRadius, contentY);
    ctx.closePath();
    ctx.clip();
    
    // 绘制网格线
    const gridSize = 15; // 子画布内部网格大小
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    
    // 计算网格起始位置（基于内容区域）
    const gridStartX = Math.floor(contentX / gridSize) * gridSize;
    const gridStartY = Math.floor(contentY / gridSize) * gridSize;
    const gridEndX = contentX + contentWidth;
    const gridEndY = contentY + contentHeight;
    
    ctx.beginPath();
    // 绘制垂直网格线
    for (let gridX = gridStartX; gridX <= gridEndX; gridX += gridSize) {
      if (gridX > contentX && gridX < gridEndX) {
        ctx.moveTo(gridX, contentY);
        ctx.lineTo(gridX, gridEndY);
      }
    }
    
    // 绘制水平网格线
    for (let gridY = gridStartY; gridY <= gridEndY; gridY += gridSize) {
      if (gridY > contentY && gridY < gridEndY) {
        ctx.moveTo(contentX, gridY);
        ctx.lineTo(gridEndX, gridY);
      }
    }
    
    ctx.stroke();
    ctx.restore();
    
    // 绘制连接口小圆圈 - 蓝色
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    
    // 上方中间连接点（与阶段节点连接）
    const topX = x + width / 2;
    const topY = y;
    const isTopHovered = hoveredConnectionPoint && 
                        hoveredConnectionPoint.nodeId === subCanvas.id && 
                        hoveredConnectionPoint.type === 'subcanvas';
    const topRadius = isTopHovered ? 6 : 4;
    ctx.beginPath();
    ctx.arc(topX, topY, topRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 左边输入连接点（开始）
    const leftX = x;
    const leftY = y + height / 2;
    const isLeftHovered = hoveredConnectionPoint && 
                         hoveredConnectionPoint.nodeId === subCanvas.id && 
                         hoveredConnectionPoint.type === 'input';
    const leftRadius = isLeftHovered ? 6 : 4;
    ctx.beginPath();
    ctx.arc(leftX, leftY, leftRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 右边输出连接点（结束）
    const rightX = x + width;
    const rightY = y + height / 2;
    const isRightHovered = hoveredConnectionPoint && 
                          hoveredConnectionPoint.nodeId === subCanvas.id && 
                          hoveredConnectionPoint.type === 'output';
    const rightRadius = isRightHovered ? 6 : 4;
    ctx.beginPath();
    ctx.arc(rightX, rightY, rightRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // 绘制标题（考虑内边距）
    ctx.fillStyle = '#262626';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + width / 2, y + padding + 10);
    
    // 绘制子画布内部连线（从左侧输入端点到右侧输出端点，考虑内边距）
    const isSubCanvasLineHovered = hoveredSubCanvasLine === subCanvas.id;
    
    // 设置连线颜色：蓝色为默认，悬停时为青色
    ctx.strokeStyle = isSubCanvasLineHovered ? '#13c2c2' : '#1890ff'; // 悬停青色，默认蓝色
    ctx.lineWidth = isSubCanvasLineHovered ? 2 : 1; // 线条更细
    ctx.setLineDash([]); // 实线
    
    // 计算连线路径（内容区域内的连线）
    const startX = contentX + 10; // 左侧内边距后稍微偏移
    const startY = contentY + contentHeight / 2;
    const endX = contentX + contentWidth - 10; // 右侧内边距前稍微偏移
    const endY = contentY + contentHeight / 2;
    
    // 绘制水平直线
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 绘制箭头
    const arrowLength = 8;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(arrowAngle),
      endY - arrowLength * Math.sin(arrowAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(-arrowAngle),
      endY - arrowLength * Math.sin(-arrowAngle)
    );
    ctx.stroke();
    
    // 如果悬停，绘制中点的圆形背景和加号图标
    if (isSubCanvasLineHovered) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      // 绘制圆形背景
      ctx.fillStyle = '#13c2c2';
      ctx.beginPath();
      ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制加号图标
      ctx.strokeStyle = '#ffffff';
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

    ctx.restore();
  }, [canvasState, selectedSubCanvas, hoveredConnectionPoint, hoveredSubCanvasLine]);

  // Canvas绘制逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentStep !== 1) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    drawGrid(ctx, canvas.width, canvas.height);
    
    // 根据编辑模式绘制不同的内容
    if (editingSubProcess) {
      // 子流程编辑模式：显示子流程内容
      const parentNode = nodes.find(n => n.id === editingSubProcess);
      if (parentNode && parentNode.subProcess) {
        // 绘制子流程的连接线
        parentNode.subProcess.connections.forEach(connection => {
          const sourceNode = parentNode.subProcess!.nodes.find(n => n.id === connection.sourceId);
          const targetNode = parentNode.subProcess!.nodes.find(n => n.id === connection.targetId);
          
          if (sourceNode && targetNode) {
            ctx.save();
            ctx.translate(canvasState.offsetX, canvasState.offsetY);
            ctx.scale(canvasState.scale, canvasState.scale);
            
            const startX = sourceNode.x + sourceNode.width;
            const startY = sourceNode.y + sourceNode.height / 2;
            const endX = targetNode.x;
            const endY = targetNode.y + targetNode.height / 2;
            
            ctx.strokeStyle = '#1890ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // 绘制贝塞尔曲线
            const cp1x = startX + 50;
            const cp1y = startY;
            const cp2x = endX - 50;
            const cp2y = endY;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            ctx.stroke();
            
            // 绘制箭头
            const arrowLength = 8;
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
            
            ctx.restore();
          }
        });
        
        // 绘制子流程的节点
        parentNode.subProcess.nodes.forEach(node => drawNode(ctx, node));
      }
    } else {
      // 主流程编辑模式：显示主流程内容
      // 应用画布变换
      ctx.save();
      ctx.translate(canvasState.offsetX, canvasState.offsetY);
      ctx.scale(canvasState.scale, canvasState.scale);
      
      drawConnections(ctx);
      nodes.forEach(node => drawNode(ctx, node));
      
      // 绘制子画布
      subCanvases.forEach(subCanvas => drawSubCanvas(ctx, subCanvas));
      
      ctx.restore();
      

    }
  }, [canvasState, drawGrid, currentStep, nodes, connections, drawNode, drawConnections, editingSubProcess, subCanvases, drawSubCanvas]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      // 只在画布步骤且不在输入框中时处理键盘事件
      if (currentStep !== 1 || isInputElement) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        // 删除选中的节点或连线
        if (selectedNode && selectedNode !== 'start-node' && selectedNode !== 'end-node') {
          // 查找要删除的节点
          const nodeToDelete = nodes.find(node => node.id === selectedNode);
          
          // 阶段节点删除逻辑已移除
          message.success('节点删除成功');
          
          // 删除节点及相关连线
          setNodes(prev => prev.filter(node => node.id !== selectedNode));
          setConnections(prev => prev.filter(conn => 
            conn.sourceId !== selectedNode && conn.targetId !== selectedNode
          ));
          setSelectedNode(null);
        } else if (selectedConnection) {
          // 删除连线
          setConnections(prev => prev.filter(conn => conn.id !== selectedConnection));
          setSelectedConnection(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
      
      // 只在画布步骤且不在输入框中时处理键盘事件
      if (currentStep !== 1 || isInputElement) {
        return;
      }
      
      if (e.code === 'Space') {
        setCanvasState(prev => ({ ...prev, isSpacePressed: false, isDragging: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNode, selectedConnection, currentStep]);

  // 添加全局点击事件监听器来隐藏右键菜单
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (contextMenu?.visible) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu]);

  return (
    <Drawer
      title={editData ? '编辑业务流程' : '新增业务流程'}
      open={visible}
      onClose={onClose}
      width="100vw"
      height="100vh"
      placement="right"
      destroyOnClose
      styles={{
        body: { padding: 0 },
        header: { borderBottom: '1px solid #f0f0f0' }
      }}
    >
      <div className="h-full flex flex-col p-6">
        {/* 表单内容 */}
        <div className="flex-1 overflow-hidden" style={{ marginTop: '40px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            className="h-full"
          >
            {currentStep === 0 && (
              <Row justify="center">
                <Col xs={24} sm={23} md={20} lg={18} xl={16}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 500, 
                    color: '#262626', 
                    marginBottom: '16px' 
                  }}>
                    业务流程基本信息
                  </div>
                  <div className="space-y-6">
                    <Form.Item
                      label="业务名称"
                      name="businessName"
                      rules={[
                        { required: true, message: '请输入业务名称' },
                        { min: 2, message: '业务名称至少2个字符' },
                        { max: 50, message: '业务名称不能超过50个字符' }
                      ]}
                    >
                      <Input 
                        placeholder="请输入业务名称" 
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="标识符"
                      name="identifier"
                      rules={[
                        { required: true, message: '请输入标识符' },
                        { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '标识符必须以字母开头，只能包含字母、数字和下划线' }
                      ]}
                    >
                      <Input 
                        placeholder="请输入标识符" 
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="状态"
                      name="status"
                      rules={[{ required: true, message: '请选择状态' }]}
                      initialValue="enabled"
                    >
                      <Select placeholder="请选择状态" size="large">
                        <Option value="enabled">启用</Option>
                        <Option value="disabled">禁用</Option>
                        <Option value="obsolete">废弃</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="备注"
                      name="remark"
                      rules={[
                        { max: 200, message: '备注不能超过200个字符' }
                      ]}
                    >
                      <TextArea 
                        rows={4} 
                        placeholder="请输入备注信息（可选）" 
                        showCount 
                        maxLength={200}
                        size="large"
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            )}

            {currentStep === 1 && (
              <div className="h-full relative" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0, backgroundColor: '#f5f7fa' }}>


                
                {/* 画布区域 */}
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onContextMenu={handleContextMenu}
                    onWheel={handleWheel}
                    style={{ 
                      cursor: isDraggingConnection ? 'crosshair' : 
                             (hoveredConnectionPoint ? 'crosshair' : 
                             (isDraggingNode ? 'grabbing' : 
                             (isDraggingSubCanvas ? 'grabbing' :
                             (canvasState.isSpacePressed ? 'grab' : 
                             (hoveredStageNode ? 'default' : 'default'))))),
                      backgroundColor: '#f5f7fa'
                    }}
                  />
                  
                  {/* 右键菜单 */}
                  {contextMenu?.visible && (
                    <div 
                      className="fixed z-50 bg-white rounded-lg shadow-lg border py-2 min-w-32"
                      style={{ left: contextMenu.x, top: contextMenu.y }}
                      onClick={handleClickOutside}
                    >
                      <div 
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                        onClick={() => {
                          const node = nodes.find(n => n.id === contextMenu.nodeId);
                          if (node) {
                            handleStageNodeClick(node);
                          }
                          setContextMenu(null);
                        }}
                      >
                        <SettingOutlined />
                        <span>阶段属性</span>
                      </div>
                    </div>
                  )}
                  

                </div>
                

              </div>
            )}
          </Form>
        </div>

        {/* 底部操作栏 */}
        <div style={{
          borderTop: '1px solid #f0f0f0',
          paddingTop: '16px',
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* 画布操作按钮 - 仅在画布步骤显示 */}
          {currentStep === 1 && (
            <>
              <Tooltip title="撤回">
                 <Button
                   icon={<UndoOutlined />}
                   onClick={handleUndo}
                   disabled={historyIndex <= 0}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="重做">
                 <Button
                   icon={<RedoOutlined />}
                   onClick={handleRedo}
                   disabled={historyIndex >= history.length - 1}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="放大">
                 <Button
                   icon={<ZoomInOutlined />}
                   onClick={handleZoomIn}
                   disabled={canvasState.scale >= 3}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="缩小">
                 <Button
                   icon={<ZoomOutOutlined />}
                   onClick={handleZoomOut}
                   disabled={canvasState.scale <= 0.3}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="回到初始位置">
                 <Button
                   icon={<HomeOutlined />}
                   onClick={handleResetPosition}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
              <div style={{
                width: '1px',
                height: '24px',
                backgroundColor: '#d9d9d9',
                margin: '0 8px'
              }} />
              <Tooltip title="自动排序">
                <Button
                  icon={<SortAscendingOutlined />}
                  onClick={autoSortNodes}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
            </>
          )}
          {currentStep === 1 && (
            <>
              {/* 子流程编辑模式下显示退出按钮 */}
              {editingSubProcess ? (
                <>
                  <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={exitSubProcessMode}
                    type="primary"
                    style={{ 
                      borderRadius: '6px',
                      backgroundColor: '#ff4d4f',
                      borderColor: '#ff4d4f',
                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
                    }}
                  >
                    退出子流程编辑
                  </Button>
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    当前编辑: {nodes.find(n => n.id === editingSubProcess)?.customName || nodes.find(n => n.id === editingSubProcess)?.label || '阶段节点'}
                  </div>
                </>
              ) : (
                <>                  <Button 
                    icon={<PlayCircleOutlined />}
                    style={{ 
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    调试运行
                  </Button>
                </>
              )}
            </>
          )}
          <Button 
            onClick={onClose}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            取消
          </Button>
          {currentStep > 0 && (
            <Button 
              type="primary"
              onClick={handlePrev}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              上一步
            </Button>
          )}
          {currentStep >= 2 && (
            <Button 
              onClick={handleBack2Steps}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              回退2步
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button 
              type="primary" 
              onClick={handleNext}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              下一步
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleFinish}
              loading={loading}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {editData ? '保存' : '创建'}
            </Button>
          )}
        </div>
      </div>
      
      {/* 添加节点面板 */}
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
            <Button 
              type="default" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleAddNodeFromPanel('start')}
              style={{ textAlign: 'left', height: '40px' }}
            >
              开始节点
            </Button>
            <Button 
              type="default" 
              icon={<StopOutlined />}
              onClick={() => handleAddNodeFromPanel('end')}
              style={{ textAlign: 'left', height: '40px' }}
            >
              结束节点
            </Button>
            <Button 
              type="default" 
              icon={<ClockCircleOutlined />}
              onClick={() => handleAddNodeFromPanel('stage')}
              style={{ textAlign: 'left', height: '40px' }}
            >
              阶段节点
            </Button>
          </div>
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Button onClick={handleCloseNodePanel}>
              取消
            </Button>
          </div>
        </div>
      )}
      
      {/* 遮罩层 */}
      {showNodePanel && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999
          }}
          onClick={handleCloseNodePanel}
        />
      )}
      
      {/* 子画布组件和独立子画布窗口已移除 - 阶段节点功能已移除 */}
      
      {/* 阶段属性面板 */}
      <StagePropertyPanel
        visible={stagePropertyPanelVisible}
        stageNode={selectedStageNode}
        onSave={handleSaveStageNode}
        onClose={handleCloseStagePropertyPanel}
      />
    </Drawer>
  );
};

export default AddBusinessProcess;