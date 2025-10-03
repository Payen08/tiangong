import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Select, Space, Typography, Input, List, Card, Divider, Modal, Form, message, Row, Col } from 'antd';
import {
  ReloadOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HomeOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  VerticalAlignTopOutlined,
  BorderOutlined,
  AppstoreOutlined,
  ToolOutlined,
  BuildOutlined,
  DashboardOutlined,
  ColumnHeightOutlined,
  BorderInnerOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LineOutlined,
  BgColorsOutlined,
  SelectOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

// 产品模型类型定义
interface ProductModel {
  id: string;
  name: string;
  type: 'wall' | 'door' | 'column' | 'floor' | 'equipment';
  icon: React.ReactNode;
  description: string;
}

// 绘图工具类型定义
interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'wall' | 'door' | 'column' | 'floor' | 'select';
  description: string;
  active: boolean;
  subType?: 'line' | 'bezier'; // 墙体绘制子类型
}

// 墙体数据结构
interface WallPoint {
  x: number;
  y: number;
}

// 共享端点数据结构
interface SharedPoint {
  id: string;
  x: number;
  y: number;
  connectedWalls: Array<{
    wallId: string;
    pointIndex: number;
  }>;
}

interface Wall {
  id: string;
  type: 'line' | 'bezier';
  points: WallPoint[];
  pointIds?: (string | null)[]; // 对应共享端点的ID数组，与points数组一一对应，允许null值
  controlPoints?: WallPoint[]; // 贝塞尔曲线控制点
  thickness: number; // 厚度 (Y轴，单位：m)
  color: string;
  completed: boolean;
  // 3D属性
  width?: number; // 宽度 (X轴，单位：m)
  height?: number; // 高度 (Z轴，单位：m)
  // 选中状态
  selected?: boolean;
  selectedEndpoints?: number[]; // 选中的端点索引
  selectedSegments?: number[]; // 选中的线段索引（从0开始，表示第i个点到第i+1个点的线段）
}

// 拓扑路网节点
interface TopologyNode {
  id: string;
  x: number;
  y: number;
  type: 'room' | 'corridor' | 'entrance' | 'exit' | 'elevator' | 'stairs';
  name?: string;
}

// 拓扑路网连接
interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  weight?: number;
  type: 'normal' | 'emergency' | 'restricted';
}

// 地图数据接口
interface MapData {
  id: string;
  name: string;
  type: string;
  description?: string;
  baseMapUrl?: string; // 默认底图URL
  availableBaseMaps?: string[]; // 可用底图ID列表
  topology?: {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
  };
}

// 楼层场景接口
// 底图数据接口
interface BaseMapData {
  id: string;
  name: string;
  url: string;
  description?: string;
}

interface FloorScene {
  id: string;
  name: string;
  floor: number;
  dataSource?: string; // 场景基础数据源
  baseMap?: string; // 选择的底图ID
  initializeDevices?: boolean; // 是否初始化地图关联设备
  increaseUpdate?: boolean; // 是否增量更新
}

// 模拟产品模型数据
const mockProductModels: ProductModel[] = [
  {
    id: 'wall-001',
    name: '标准墙体',
    type: 'wall',
    icon: <BuildOutlined />,
    description: '标准建筑墙体模型'
  },
  {
    id: 'door-001',
    name: '标准门',
    type: 'door',
    icon: <DashboardOutlined />,
    description: '标准建筑门模型'
  },
  {
    id: 'column-001',
    name: '标准柱子',
    type: 'column',
    icon: <ColumnHeightOutlined />,
    description: '标准建筑柱子模型'
  },
  {
    id: 'floor-001',
    name: '标准地面',
    type: 'floor',
    icon: <BorderInnerOutlined />,
    description: '标准地面模型'
  },
];

// 模拟底图数据
const mockBaseMapData: BaseMapData[] = [
  {
    id: 'basemap-1',
    name: '标准建筑底图',
    url: '/src/assets/base-map.svg',
    description: '标准建筑平面图底图'
  },
  {
    id: 'basemap-2', 
    name: '简化建筑底图',
    url: '/src/assets/base-map-simple.svg',
    description: '简化版建筑平面图底图'
  },
  {
    id: 'basemap-3',
    name: '详细建筑底图', 
    url: '/src/assets/base-map-detailed.svg',
    description: '详细版建筑平面图底图'
  }
];

// 模拟地图数据
const mockMapData: MapData[] = [
  { 
    id: 'map-1', 
    name: '建筑主体地图', 
    type: 'building', 
    description: '主要建筑结构地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-2', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'room-1', x: 210, y: 200, type: 'room', name: '办公区A' },
        { id: 'room-2', x: 420, y: 260, type: 'room', name: '中央大厅' },
        { id: 'room-3', x: 610, y: 200, type: 'room', name: '办公区B' },
        { id: 'room-4', x: 210, y: 390, type: 'room', name: '会议室' },
        { id: 'room-5', x: 610, y: 390, type: 'room', name: '设备间' },
        { id: 'elevator-1', x: 410, y: 155, type: 'elevator', name: '电梯' },
        { id: 'stairs-1', x: 370, y: 170, type: 'stairs', name: '楼梯' },
        { id: 'entrance-1', x: 420, y: 100, type: 'entrance', name: '主入口' },
      ],
      edges: [
        { id: 'edge-1', from: 'entrance-1', to: 'room-2', type: 'normal' },
        { id: 'edge-2', from: 'room-2', to: 'room-1', type: 'normal' },
        { id: 'edge-3', from: 'room-2', to: 'room-3', type: 'normal' },
        { id: 'edge-4', from: 'room-2', to: 'room-4', type: 'normal' },
        { id: 'edge-5', from: 'room-2', to: 'room-5', type: 'normal' },
        { id: 'edge-6', from: 'room-2', to: 'elevator-1', type: 'normal' },
        { id: 'edge-7', from: 'room-2', to: 'stairs-1', type: 'emergency' },
      ]
    }
  },
  { 
    id: 'map-2', 
    name: '设备分布地图', 
    type: 'equipment', 
    description: '设备位置分布地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'device-1', x: 150, y: 150, type: 'room', name: '空调设备' },
        { id: 'device-2', x: 650, y: 150, type: 'room', name: '网络设备' },
        { id: 'device-3', x: 610, y: 390, type: 'room', name: '电力设备' },
        { id: 'corridor-1', x: 420, y: 260, type: 'corridor', name: '设备通道' },
      ],
      edges: [
        { id: 'device-edge-1', from: 'corridor-1', to: 'device-1', type: 'normal' },
        { id: 'device-edge-2', from: 'corridor-1', to: 'device-2', type: 'normal' },
        { id: 'device-edge-3', from: 'corridor-1', to: 'device-3', type: 'restricted' },
      ]
    }
  },
  { 
    id: 'map-3', 
    name: '管线布局地图', 
    type: 'pipeline', 
    description: '管线系统布局地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-2', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'pipe-1', x: 200, y: 120, type: 'room', name: '供水管线' },
        { id: 'pipe-2', x: 600, y: 120, type: 'room', name: '排水管线' },
        { id: 'pipe-3', x: 400, y: 480, type: 'room', name: '燃气管线' },
        { id: 'junction-1', x: 400, y: 300, type: 'corridor', name: '管线汇聚点' },
      ],
      edges: [
        { id: 'pipe-edge-1', from: 'junction-1', to: 'pipe-1', type: 'normal' },
        { id: 'pipe-edge-2', from: 'junction-1', to: 'pipe-2', type: 'normal' },
        { id: 'pipe-edge-3', from: 'junction-1', to: 'pipe-3', type: 'normal' },
      ]
    }
  },
  { 
    id: 'map-4', 
    name: '安全区域地图', 
    type: 'safety', 
    description: '安全区域划分地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-2'],
    topology: {
      nodes: [
        { id: 'safe-1', x: 210, y: 200, type: 'room', name: '安全区域A' },
        { id: 'safe-2', x: 610, y: 200, type: 'room', name: '安全区域B' },
        { id: 'exit-1', x: 420, y: 100, type: 'exit', name: '紧急出口1' },
        { id: 'exit-2', x: 100, y: 300, type: 'exit', name: '紧急出口2' },
        { id: 'stairs-1', x: 370, y: 170, type: 'stairs', name: '疏散楼梯' },
      ],
      edges: [
        { id: 'safe-edge-1', from: 'safe-1', to: 'exit-1', type: 'emergency' },
        { id: 'safe-edge-2', from: 'safe-1', to: 'exit-2', type: 'emergency' },
        { id: 'safe-edge-3', from: 'safe-2', to: 'exit-1', type: 'emergency' },
        { id: 'safe-edge-4', from: 'safe-1', to: 'stairs-1', type: 'emergency' },
        { id: 'safe-edge-5', from: 'safe-2', to: 'stairs-1', type: 'emergency' },
      ]
    }
  },
  { 
    id: 'map-5', 
    name: '消防设施地图', 
    type: 'fire', 
    description: '消防设施分布地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'fire-1', x: 180, y: 180, type: 'room', name: '灭火器A' },
        { id: 'fire-2', x: 620, y: 180, type: 'room', name: '灭火器B' },
        { id: 'fire-3', x: 400, y: 140, type: 'room', name: '消防栓' },
        { id: 'fire-4', x: 210, y: 420, type: 'room', name: '烟感器' },
        { id: 'control-1', x: 610, y: 390, type: 'room', name: '消防控制室' },
      ],
      edges: [
        { id: 'fire-edge-1', from: 'control-1', to: 'fire-1', type: 'normal' },
        { id: 'fire-edge-2', from: 'control-1', to: 'fire-2', type: 'normal' },
        { id: 'fire-edge-3', from: 'control-1', to: 'fire-3', type: 'normal' },
        { id: 'fire-edge-4', from: 'control-1', to: 'fire-4', type: 'normal' },
      ]
    }
  },
];

// 模拟楼层场景数据
const mockFloorScenes: FloorScene[] = [
  { id: 'floor-1', name: '1楼', floor: 1, dataSource: 'map-1', baseMap: 'basemap-1', initializeDevices: true },
  { id: 'floor-2', name: '2楼', floor: 2, dataSource: 'map-2', baseMap: 'basemap-3', initializeDevices: false },
  { id: 'floor-3', name: '3楼', floor: 3, dataSource: 'map-1', baseMap: 'basemap-2', initializeDevices: true },
];

const DigitalTwinEditor: React.FC = () => {
  // 面板显示状态
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [allPanelsVisible, setAllPanelsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 画布相关状态
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);// 画布拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 获取当前激活的绘图工具
  const getActiveTool = () => {
    return drawingTools.find(tool => tool.active);
  };

  // 屏幕坐标转换为画布坐标
  const screenToCanvas = (screenX: number, screenY: number): WallPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // 转换为世界坐标
    const worldX = (canvasX - offsetX) / scale;
    const worldY = (canvasY - offsetY) / scale;

    return { x: worldX, y: worldY };
  };

  // 节流时间ref
  const lastUpdateTimeRef = useRef<number>(0);

  // 优化的鼠标位置更新函数（参考地图编辑器）
  const updateMousePositionOptimized = useCallback((x: number, y: number) => {
    // 立即更新ref，用于虚线渲染
    mousePositionRef.current = { x, y };
    
    // 使用节流更新状态，避免过度渲染
    const now = Date.now();
    if (now - lastUpdateTimeRef.current > 16) {
      setMousePosition({ x, y });
      lastUpdateTimeRef.current = now;
    }
  }, []);

  // 楼层场景状态
  const [floorScenes, setFloorScenes] = useState<FloorScene[]>(mockFloorScenes);
  const [currentFloor, setCurrentFloor] = useState<string>('floor-1');
  const [sceneListModalVisible, setSceneListModalVisible] = useState(false); // 场景列表对话框
  const [newSceneModalVisible, setNewSceneModalVisible] = useState(false); // 新增场景对话框
  const [editingScene, setEditingScene] = useState<FloorScene | null>(null);
  const [sceneForm] = Form.useForm();
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null); // 选中的地图ID
  const [availableBaseMaps, setAvailableBaseMaps] = useState<BaseMapData[]>([]); // 可用底图列表
  const [initializeDevicesValue, setInitializeDevicesValue] = useState<boolean>(true); // 是否初始化地图关联设备的值

  // 绘图工具状态
  const [drawingTools, setDrawingTools] = useState<DrawingTool[]>([
    {
      id: 'select-wall',
      name: '选择墙体',
      icon: <SelectOutlined />,
      type: 'select',
      description: '选择和编辑墙体',
      active: true  // 默认激活选择工具
    },
    {
      id: 'wall-line',
      name: '直线墙体',
      icon: <LineOutlined />,
      type: 'wall',
      subType: 'line',
      description: '点击两点绘制直线墙体',
      active: false
    },
    {
      id: 'wall-bezier',
      name: '曲线墙体',
      icon: <BgColorsOutlined />,
      type: 'wall',
      subType: 'bezier',
      description: '绘制贝塞尔曲线墙体',
      active: false
    },
    {
      id: 'door',
      name: '绘制门',
      icon: <DashboardOutlined />,
      type: 'door',
      description: '绘制建筑门',
      active: false
    },
    {
      id: 'column',
      name: '绘制柱子',
      icon: <ColumnHeightOutlined />,
      type: 'column',
      description: '绘制建筑柱子',
      active: false
    },
    {
      id: 'floor',
      name: '绘制地面',
      icon: <BorderInnerOutlined />,
      type: 'floor',
      description: '绘制地面区域',
      active: false
    }
  ]);

  // 墙体相关状态 - 添加示例墙体数据用于测试
  const [walls, setWalls] = useState<Wall[]>([
    {
      id: 'wall-demo-1',
      type: 'line',
      points: [
        { x: 200, y: 200 },
        { x: 400, y: 200 }
      ],
      thickness: 10,
      color: '#333333',
      completed: true,
      width: 10,
      height: 300
    },
    {
      id: 'wall-demo-2',
      type: 'line',
      points: [
        { x: 400, y: 200 },
        { x: 400, y: 350 }
      ],
      thickness: 10,
      color: '#333333',
      completed: true,
      width: 10,
      height: 300
    },
    {
      id: 'wall-demo-3',
      type: 'line',
      points: [
        { x: 400, y: 350 },
        { x: 200, y: 350 }
      ],
      thickness: 10,
      color: '#333333',
      completed: true,
      width: 10,
      height: 300
    },
    {
      id: 'wall-demo-bezier-1',
      type: 'bezier',
      points: [
        { x: 500, y: 200 },  // 起点
        { x: 550, y: 150 },  // 控制点1
        { x: 650, y: 150 },  // 控制点2
        { x: 700, y: 200 }   // 终点
      ],
      thickness: 10,
      color: '#ff4d4f',
      completed: true,
      width: 10,
      height: 300
    }
  ]);
  const [currentWall, setCurrentWall] = useState<Wall | null>(null);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallStyle, setWallStyle] = useState({
    thickness: 10,
    color: '#333333',
    width: 10,
    height: 300
  });
  const [mousePosition, setMousePosition] = useState<WallPoint | null>(null);
  const mousePositionRef = useRef<WallPoint | null>(null); // 实时鼠标位置引用，避免状态更新延迟

  // 共享端点状态管理
  const [sharedPoints, setSharedPoints] = useState<Map<string, SharedPoint>>(new Map());
  const sharedPointsRef = useRef<Map<string, SharedPoint>>(new Map()); // 用于实时访问

  // 连线状态管理（参考地图编辑器）
  const [isConnecting, setIsConnecting] = useState(false); // 是否正在连线
  const [continuousConnecting, setContinuousConnecting] = useState(false); // 连续连线模式
  const [connectingStartPoint, setConnectingStartPoint] = useState<WallPoint | null>(null); // 连线起始点
  const [lastConnectedPoint, setLastConnectedPoint] = useState<WallPoint | null>(null); // 最后连接的点
  
  // 连线状态的ref引用，用于解决状态更新时序问题
  const isConnectingRef = useRef(false);
  const continuousConnectingRef = useRef(false);

  // 贝塞尔曲线绘制状态（地图编辑器风格 - 两点绘制模式）
  const [bezierDrawingState, setBezierDrawingState] = useState<{
    phase: 'idle' | 'drawing'; // 简化为两个阶段：空闲和绘制中
    startPoint: WallPoint | null;
    endPoint: WallPoint | null;
    controlPoint1: WallPoint | null;
    controlPoint2: WallPoint | null;
    isDraggingControl: boolean;
    activeControlPoint: 1 | 2 | null; // 当前正在拖拽的控制点
    continuousMode: boolean; // 连续绘制模式
    lastEndPoint: WallPoint | null; // 上一条曲线的终点，用于连续绘制
  }>({
    phase: 'idle',
    startPoint: null,
    endPoint: null,
    controlPoint1: null,
    controlPoint2: null,
    isDraggingControl: false,
    activeControlPoint: null,
    continuousMode: false,
    lastEndPoint: null
  });

  // 选择相关状态
  const [selectedWalls, setSelectedWalls] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<WallPoint | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<WallPoint | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{wallId: string, pointIndex: number} | null>(null);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedWall, setLastClickedWall] = useState<string | null>(null);
  // 线段选择状态
  const [selectedSegments, setSelectedSegments] = useState<{wallId: string, segmentIndex: number}[]>([]);

  // 端点相关状态
  const [hoveredEndpoint, setHoveredEndpoint] = useState<{wallId: string, pointIndex: number} | null>(null);

  const [nearbyEndpoints, setNearbyEndpoints] = useState<{wallId: string, pointIndex: number, point: WallPoint}[]>([]); // 绘制模式下附近的端点

  // 贝塞尔曲线编辑模式状态
  const [bezierEditMode, setBezierEditMode] = useState<{
    isEditing: boolean;
    wallId: string | null;
    isDraggingControl: boolean;
    activeControlPoint: number | string | null; // 支持数字（贝塞尔曲线控制点）和字符串（直线中点）
  }>({
    isEditing: false,
    wallId: null,
    isDraggingControl: false,
    activeControlPoint: null
  });

  // 属性面板状态
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [propertiesFormData, setPropertiesFormData] = useState<{
    wallId: string;
    thickness: number;
    width: number;
    height: number;
    color: string;
  } | null>(null);
  const [propertiesForm] = Form.useForm();

  // 搜索状态
  const [modelSearchText, setModelSearchText] = useState('');

  // 同步 sharedPoints 状态和 ref
  useEffect(() => {
    sharedPointsRef.current = sharedPoints;
  }, [sharedPoints]);

  // 面板切换函数
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };

  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  const toggleAllPanels = () => {
    const newVisible = !allPanelsVisible;
    setAllPanelsVisible(newVisible);
    setLeftPanelVisible(newVisible);
    setRightPanelVisible(newVisible);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // 重置视图
  const resetView = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  // 顶视图
  const handleTopView = () => {
    // 实现顶视图逻辑
    resetView();
  };

  // 正视图
  const handleFrontView = () => {
    // 实现正视图逻辑
    resetView();
  };

  // 返回数字孪生页面
  const handleBack = () => {
    window.location.href = '/digital-twin';
  };



  // 取消贝塞尔曲线绘制
  const cancelBezierDrawing = useCallback(() => {
    setBezierDrawingState({
      phase: 'idle',
      startPoint: null,
      endPoint: null,
      controlPoint1: null,
      controlPoint2: null,
      isDraggingControl: false,
      activeControlPoint: null,
      continuousMode: false,
      lastEndPoint: null
    });
    message.info('已取消贝塞尔曲线绘制');
  }, []);

  // 完成当前墙体绘制
  const finishCurrentWall = useCallback(() => {
    if (currentWall && currentWall.points.length >= 2) {
      const completedWall = { ...currentWall, completed: true };
      setWalls(prev => [...prev, completedWall]);
    }
    setCurrentWall(null);
    setIsDrawingWall(false);
  }, [currentWall]);

  // 取消当前墙体绘制
  const cancelCurrentWall = useCallback(() => {
    setCurrentWall(null);
    setIsDrawingWall(false);
  }, []);

  // 绘图工具选择
  const selectDrawingTool = useCallback((toolId: string) => {
    // 如果正在绘制墙体，先完成当前墙体
    if (isDrawingWall) {
      finishCurrentWall();
    }
    
    setDrawingTools(prev => prev.map(tool => ({
      ...tool,
      active: tool.id === toolId ? !tool.active : false
    })));
  }, [isDrawingWall, finishCurrentWall]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    
    if (e.key === 'Enter' && isDrawingWall && currentWall) {
      // Enter键完成当前墙体绘制
      finishCurrentWall();
    } else if (e.key === 'Escape') {
      // Escape键完全重置所有编辑状态
      console.log('🔥 ESC键被按下，开始重置所有状态...');
      
      // 记录当前状态
       console.log('📊 当前状态:', {
         isDrawingWall,
         isConnecting,
         continuousConnecting,
         bezierEditMode,
         bezierDrawingState,
         activeTool: getActiveTool()?.type,
         selectedWalls: selectedWalls.length,
         walls: walls.length
       });
      
      // 退出贝塞尔曲线编辑模式
      console.log('🎯 重置贝塞尔曲线编辑模式...');
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      
      // 清除贝塞尔曲线绘制状态（包括控制点）
      console.log('🎯 重置贝塞尔曲线绘制状态...');
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: false,
        lastEndPoint: null,
      });
      
      // 取消贝塞尔曲线绘制
      if (bezierDrawingState.phase !== 'idle') {
        console.log('🎯 取消贝塞尔曲线绘制...');
        cancelBezierDrawing();
      }
      
      // 退出连线模式
      console.log('🎯 退出连线模式...');
      setIsConnecting(false);
      isConnectingRef.current = false;
      setContinuousConnecting(false);
      continuousConnectingRef.current = false;
      setConnectingStartPoint(null);
      setLastConnectedPoint(null);
      
      // 取消当前墙体绘制
      if (isDrawingWall) {
        console.log('🎯 取消当前墙体绘制...');
        cancelCurrentWall();
      }
      
      // 取消选择状态
      console.log('🎯 取消选择状态...');
      setSelectedWalls([]);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedEndpoint(null);
      setIsDraggingEndpoint(false);
      setSelectedSegments([]);
      
      // 清除端点相关状态
      console.log('🎯 清除端点相关状态...');
      setNearbyEndpoints([]);
      setHoveredEndpoint(null);
      
      // 重置鼠标位置
      console.log('🎯 重置鼠标位置...');
      setMousePosition(null);
      mousePositionRef.current = null;
      
      // 清除墙体的选中状态和端点状态
      console.log('🎯 清除墙体选中状态...');
      setWalls(prevWalls => 
        prevWalls.map(wall => ({ 
          ...wall, 
          selected: false, 
          selectedEndpoints: [] 
        }))
      );
      
      // 切换到选择工具
      console.log('🎯 切换到选择工具...');
      selectDrawingTool('select-wall');
      
      console.log('✅ ESC键重置完成');
      message.info('已退出所有编辑模式');
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedSegments.length > 0) {
        // Delete/Backspace键删除选中的线段
        deleteSelectedSegments();
      } else if (selectedWalls.length > 0) {
        // Delete/Backspace键删除选中的墙体
        // 先清理共享端点
        walls.forEach(wall => {
          if (selectedWalls.includes(wall.id) && wall.pointIds) {
            wall.pointIds.forEach((pointId, index) => {
              if (pointId) {
                removeWallFromSharedPoint(pointId, wall.id, index);
              }
            });
          }
        });
        
        setWalls(prevWalls => prevWalls.filter(wall => !selectedWalls.includes(wall.id)));
        setSelectedWalls([]);
        message.success(`已删除 ${selectedWalls.length} 个墙体`);
      }
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+A 或 Cmd+A 全选墙体
      e.preventDefault();
      const allWallIds = walls.map(wall => wall.id);
      setSelectedWalls(allWallIds);
      setWalls(prevWalls => 
        prevWalls.map(wall => ({ ...wall, selected: true }))
      );
      message.info(`已选中 ${allWallIds.length} 个墙体`);
    } else if (selectedEndpoint && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      // 方向键调整选中端点位置
      console.log('方向键处理:', e.key, '选中端点:', selectedEndpoint);
      e.preventDefault();
      const moveDistance = e.shiftKey ? 10 : 1; // Shift键加速移动
      let deltaX = 0;
      let deltaY = 0;
      
      switch (e.key) {
        case 'ArrowUp':
          deltaY = -moveDistance;
          break;
        case 'ArrowDown':
          deltaY = moveDistance;
          break;
        case 'ArrowLeft':
          deltaX = -moveDistance;
          break;
        case 'ArrowRight':
          deltaX = moveDistance;
          break;
      }
      
      // 更新端点位置
      setWalls(prev => prev.map(wall => {
        if (wall.id === selectedEndpoint.wallId) {
          const newPoints = [...wall.points];
          const oldPoint = newPoints[selectedEndpoint.pointIndex];
          newPoints[selectedEndpoint.pointIndex] = {
            x: oldPoint.x + deltaX,
            y: oldPoint.y + deltaY
          };
          console.log('端点移动:', `从(${oldPoint.x}, ${oldPoint.y})移动到(${newPoints[selectedEndpoint.pointIndex].x}, ${newPoints[selectedEndpoint.pointIndex].y})`);
          return { ...wall, points: newPoints };
        }
        return wall;
      }));
    }
  }, [
    isDrawingWall, 
    currentWall, 
    selectedWalls, 
    selectedSegments, 
    isSelecting, 
    walls, 
    selectedEndpoint, 
    bezierDrawingState, 
    bezierEditMode,
    isConnecting,
    continuousConnecting,
    cancelBezierDrawing, 
    selectDrawingTool,
    finishCurrentWall,
    cancelCurrentWall,
    setWalls,
    setSelectedWalls,
    setIsSelecting,
    setSelectionStart,
    setSelectionEnd,
    setSelectedEndpoint,
    setIsDraggingEndpoint,
    setBezierEditMode,
    setIsConnecting,
    setContinuousConnecting,
    setConnectingStartPoint,
    setLastConnectedPoint,
    setMousePosition
  ]);

  // 使用 ref 来获取最新的状态值，解决闭包问题
  const selectedEndpointRef = useRef(selectedEndpoint);
  const selectedWallsRef = useRef(selectedWalls);
  const wallsRef = useRef(walls);
  const isDrawingWallRef = useRef(isDrawingWall);
  const currentWallRef = useRef(currentWall);
  const bezierDrawingStateRef = useRef(bezierDrawingState);
  
  // 更新 ref 值
  useEffect(() => {
    selectedEndpointRef.current = selectedEndpoint;
    console.log('🔄 selectedEndpoint 状态变化:', {
      newValue: selectedEndpoint,
      refValue: selectedEndpointRef.current,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [selectedEndpoint]);
  
  useEffect(() => {
    selectedWallsRef.current = selectedWalls;
  }, [selectedWalls]);
  
  useEffect(() => {
    wallsRef.current = walls;
  }, [walls]);
  
  useEffect(() => {
    isDrawingWallRef.current = isDrawingWall;
  }, [isDrawingWall]);
  
  useEffect(() => {
    currentWallRef.current = currentWall;
  }, [currentWall]);
  
  useEffect(() => {
    bezierDrawingStateRef.current = bezierDrawingState;
  }, [bezierDrawingState]);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      
      if (e.key === 'Escape') {
        // ESC键取消所有选择
        setSelectedWalls([]);
        setSelectedSegments([]);
        setSelectedEndpoint(null);
        setIsSelecting(false);
        setIsDraggingEndpoint(false);
        setBezierEditMode({
           isEditing: false,
           wallId: null,
           isDraggingControl: false,
           activeControlPoint: null
         });
        setIsConnecting(false);
        isConnectingRef.current = false;
        setContinuousConnecting(false);
        continuousConnectingRef.current = false;
        setConnectingStartPoint(null);
        setLastConnectedPoint(null);
        
        if (isDrawingWallRef.current && currentWallRef.current) {
          cancelCurrentWall();
        }
        
        if (bezierDrawingStateRef.current.phase === 'drawing') {
           cancelBezierDrawing();
         }
         
        // 切换到选择工具
        selectDrawingTool('select-wall');
        message.info('已切换到选择工具');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // 删除选中的墙体
        if (selectedWallsRef.current.length > 0) {
          setWalls(prev => prev.filter(wall => !selectedWallsRef.current.includes(wall.id)));
          setSelectedWalls([]);
          message.success(`已删除 ${selectedWallsRef.current.length} 个墙体`);
        }
      } else if (e.ctrlKey && e.key === 'a') {
        // Ctrl+A 全选所有墙体
        e.preventDefault();
        const allWallIds = wallsRef.current.map(wall => wall.id);
        setSelectedWalls(allWallIds);
        setWalls(prevWalls => 
          prevWalls.map(wall => ({ ...wall, selected: true }))
        );
        message.info(`已选中 ${allWallIds.length} 个墙体`);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // 方向键调整选中端点位置
        console.log('🔍 键盘移动端点 - 方向键触发:', {
          key: e.key,
          selectedEndpointRef: selectedEndpointRef.current,
          selectedEndpoint: selectedEndpoint,
          shiftKey: e.shiftKey,
          wallsCount: wallsRef.current.length
        });
        
        if (selectedEndpointRef.current) {
          e.preventDefault();
          const moveDistance = e.shiftKey ? 10 : 1; // Shift键加速移动
          let deltaX = 0;
          let deltaY = 0;
          
          switch (e.key) {
            case 'ArrowUp':
              deltaY = -moveDistance;
              break;
            case 'ArrowDown':
              deltaY = moveDistance;
              break;
            case 'ArrowLeft':
              deltaX = -moveDistance;
              break;
            case 'ArrowRight':
              deltaX = moveDistance;
              break;
          }
          
          console.log('🎯 键盘移动端点 - 计算移动量:', {
            deltaX,
            deltaY,
            moveDistance,
            selectedEndpoint: selectedEndpointRef.current
          });
          
          // 更新端点位置
          const selectedWall = wallsRef.current.find(wall => wall.id === selectedEndpointRef.current!.wallId);
          if (selectedWall) {
            const pointIndex = selectedEndpointRef.current!.pointIndex;
            const oldPoint = selectedWall.points[pointIndex];
            const newPoint = {
              x: oldPoint.x + deltaX,
              y: oldPoint.y + deltaY
            };
            
            // 检查是否为共享端点
            const pointId = selectedWall.pointIds?.[pointIndex];
            
            if (pointId && sharedPointsRef.current?.has(pointId)) {
              // 如果是共享端点，使用updateSharedPoint函数来同时更新所有连接的墙体
              console.log('🔗 键盘移动端点 - 检测到共享端点，使用updateSharedPoint:', {
                pointId,
                oldPoint,
                newPoint,
                deltaX,
                deltaY
              });
              
              updateSharedPoint(pointId, newPoint.x, newPoint.y);
            } else {
              // 如果不是共享端点，只更新当前墙体
              console.log('📍 键盘移动端点 - 普通端点，只更新当前墙体:', {
                wallId: selectedWall.id,
                pointIndex,
                oldPoint,
                newPoint,
                deltaX,
                deltaY
              });
              
              setWalls(prev => {
                return prev.map(wall => {
                  if (wall.id === selectedEndpointRef.current!.wallId) {
                    const newPoints = [...wall.points];
                    newPoints[selectedEndpointRef.current!.pointIndex] = newPoint;
                    return { ...wall, points: newPoints };
                  }
                  return wall;
                });
              });
            }
          }
        } else {
          console.log('⚠️ 键盘移动端点 - 没有选中的端点');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDownEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, []); // 空依赖数组，只在组件挂载时创建事件监听器



  // 共享端点管理函数
  const createSharedPoint = useCallback((x: number, y: number): string => {
    const pointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sharedPoint: SharedPoint = {
      id: pointId,
      x,
      y,
      connectedWalls: []
    };
    
    setSharedPoints(prev => new Map(prev).set(pointId, sharedPoint));
    return pointId;
  }, []);

  const findNearbySharedPoint = useCallback((x: number, y: number, threshold: number = 5): SharedPoint | null => {
    const currentSharedPoints = sharedPointsRef.current;
    for (const [, point] of currentSharedPoints) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance <= threshold) {
        return point;
      }
    }
    return null;
  }, []);

  const updateSharedPoint = useCallback((pointId: string, x: number, y: number) => {
    // 使用 ref 获取最新的共享端点信息
    const currentPoint = sharedPointsRef.current?.get(pointId);
    
    if (currentPoint) {
      // 先更新共享端点位置
      setSharedPoints(prev => {
        const newMap = new Map(prev);
        newMap.set(pointId, { ...currentPoint, x, y });
        return newMap;
      });
      
      // 然后更新所有连接到此共享端点的墙体
      setWalls(prevWalls => {
        return prevWalls.map(wall => {
          const connection = currentPoint.connectedWalls.find(conn => conn.wallId === wall.id);
          if (connection) {
            const newPoints = [...wall.points];
            newPoints[connection.pointIndex] = { x, y };
            
            // 确保 pointIds 数组与 points 数组保持一致
            const newPointIds = wall.pointIds ? [...wall.pointIds] : new Array(wall.points.length).fill(null);
            // 确保 pointIds 数组长度与 points 数组一致
            while (newPointIds.length < newPoints.length) {
              newPointIds.push(null);
            }
            // 保持共享端点的关联关系
            newPointIds[connection.pointIndex] = pointId;
            
            return { ...wall, points: newPoints, pointIds: newPointIds };
          }
          return wall;
        });
      });
    }
  }, []);

  const addWallToSharedPoint = useCallback((pointId: string, wallId: string, pointIndex: number) => {
    setSharedPoints(prev => {
      const newMap = new Map(prev);
      const point = newMap.get(pointId);
      if (point) {
        const updatedConnections = [...point.connectedWalls];
        // 检查是否已存在相同的连接
        const existingIndex = updatedConnections.findIndex(
          conn => conn.wallId === wallId && conn.pointIndex === pointIndex
        );
        if (existingIndex === -1) {
          updatedConnections.push({ wallId, pointIndex });
          newMap.set(pointId, { ...point, connectedWalls: updatedConnections });
        }
      }
      return newMap;
    });
  }, []);

  const removeWallFromSharedPoint = useCallback((pointId: string, wallId: string, pointIndex: number) => {
    setSharedPoints(prev => {
      const newMap = new Map(prev);
      const point = newMap.get(pointId);
      if (point) {
        const updatedConnections = point.connectedWalls.filter(
          conn => !(conn.wallId === wallId && conn.pointIndex === pointIndex)
        );
        
        if (updatedConnections.length === 0) {
          // 如果没有墙体连接到此端点，删除共享端点
          newMap.delete(pointId);
        } else {
          newMap.set(pointId, { ...point, connectedWalls: updatedConnections });
        }
      }
      return newMap;
    });
  }, []);



  // 画布事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    const point = screenToCanvas(e.clientX, e.clientY);
    


    // 检查是否点击了编辑模式下的控制点或手柄
    if (bezierEditMode.isEditing && bezierEditMode.wallId) {
      const wall = walls.find(w => w.id === bezierEditMode.wallId);
      if (wall) {
        const controlRadius = 8 / scale; // 控制点点击半径
        
        if (wall.type === 'bezier' && wall.points.length >= 4) {
          // 贝塞尔曲线：检查控制点（新格式：points[1]和points[2]是控制点）
          // 检查控制点1 (points[1])
          const controlPoint1 = wall.points[1];
          if (controlPoint1) {
            const dist1 = Math.sqrt(
              Math.pow(point.x - controlPoint1.x, 2) + 
              Math.pow(point.y - controlPoint1.y, 2)
            );
            if (dist1 < controlRadius) {
              setBezierEditMode(prev => ({
                ...prev,
                isDraggingControl: true,
                activeControlPoint: 1
              }));
              return;
            }
          }
          
          // 检查控制点2 (points[2])
          const controlPoint2 = wall.points[2];
          if (controlPoint2) {
            const dist2 = Math.sqrt(
              Math.pow(point.x - controlPoint2.x, 2) + 
              Math.pow(point.y - controlPoint2.y, 2)
            );
            if (dist2 < controlRadius) {
              setBezierEditMode(prev => ({
                ...prev,
                isDraggingControl: true,
                activeControlPoint: 2
              }));
              return;
            }
          }
        }
      }
    }
    
    if (activeTool && activeTool.type === 'wall') {
      // 墙体绘制模式
      handleWallDrawing(e);
    } else if (activeTool && activeTool.type === 'select') {
      // 选择工具模式
      handleSelectionStart(e);
    } else {
      // 普通拖拽模式
      setIsDragging(true);
      setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    }
  };// 处理画布双击事件
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const activeTool = getActiveTool();
    const point = screenToCanvas(e.clientX, e.clientY);
    
    // 如果在连续连线模式下，双击结束连线
    if (continuousConnecting && activeTool?.type === 'wall' && activeTool?.subType === 'line') {
      setContinuousConnecting(false);
      continuousConnectingRef.current = false;
      setIsConnecting(false);
      isConnectingRef.current = false;
      setConnectingStartPoint(null);
      setLastConnectedPoint(null);
      setMousePosition(null);
      mousePositionRef.current = null;
      
      // 完成当前墙体
      if (currentWall && currentWall.points.length >= 2) {
        finishCurrentWall();
      }
      return;
    }
    
    // 检查是否双击了贝塞尔曲线，进入编辑模式
    if (activeTool?.id === 'select') {
      const clickedWall = walls.find(wall => {
        if (wall.type !== 'bezier' || !wall.completed) return false;
        
        // 检查是否点击了贝塞尔曲线
        const distance = getDistanceToWall(point, wall);
        return distance <= 10; // 10像素的点击容差
      });
      
      if (clickedWall) {
        // 进入贝塞尔曲线编辑模式
        setBezierEditMode({
          isEditing: true,
          wallId: clickedWall.id,
          isDraggingControl: false,
          activeControlPoint: null
        });
        
        // 清除其他选择状态
        setSelectedWalls([]);
        setSelectedSegments([]);
        
        message.info('进入贝塞尔曲线编辑模式，拖拽控制点调整曲线形状');
      }
    }
  };

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    const point = screenToCanvas(e.clientX, e.clientY);
    const canvas = canvasRef.current;
    
    // 贝塞尔曲线控制点拖拽（绘制模式）
    if (bezierDrawingState.isDraggingControl && bezierDrawingState.activeControlPoint) {
      setBezierDrawingState(prev => ({
        ...prev,
        [bezierDrawingState.activeControlPoint!]: point
      }));
      return;
    }

    // 编辑模式下的控制点拖拽
    if (bezierEditMode.isDraggingControl && bezierEditMode.activeControlPoint && bezierEditMode.wallId) {
      const wallIndex = walls.findIndex(w => w.id === bezierEditMode.wallId);
      if (wallIndex !== -1) {
        const updatedWalls = [...walls];
        const wall = updatedWalls[wallIndex];
        
        if (wall.type === 'bezier' && wall.points.length >= 4) {
          // 贝塞尔曲线：更新控制点（新格式：points[1]和points[2]是控制点）
          const controlPointIndex = bezierEditMode.activeControlPoint === 1 ? 1 : 2;
          updatedWalls[wallIndex].points[controlPointIndex] = point;
        }
        
        setWalls(updatedWalls);
      }
      return;
    }
    
    // 检查是否悬停在贝塞尔曲线编辑模式的控制点上
    if (bezierEditMode.isEditing && bezierEditMode.wallId && canvas) {
      const wall = walls.find(w => w.id === bezierEditMode.wallId);
      if (wall && wall.type === 'bezier' && wall.points.length >= 4) {
        let isHoveringControlPoint = false;
        
        // 检查两个控制点（新格式：points[1]和points[2]是控制点）
        for (let i = 1; i <= 2; i++) {
          const controlPoint = wall.points[i];
          const distance = Math.sqrt(
            Math.pow(point.x - controlPoint.x, 2) + Math.pow(point.y - controlPoint.y, 2)
          );
          
          if (distance <= 8) { // 控制点半径为8
            isHoveringControlPoint = true;
            break;
          }
        }
        
        // 设置光标样式
        canvas.style.cursor = isHoveringControlPoint ? 'pointer' : 'default';
      }
    } else if (canvas && !isDragging && !isDraggingEndpoint) {
      // 重置光标样式（仅在非拖拽状态下）
      canvas.style.cursor = 'default';
    }
    
    if (isDragging) {
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    } else if (isDraggingEndpoint && selectedEndpoint) {
      // 拖拽端点 - 支持共享端点
      // 首先检查是否有共享端点与当前拖拽的端点位置匹配
      let foundSharedPointId: string | null = null;
      
      // 遍历所有共享端点，查找与当前端点关联的共享点
      for (const [pointId, sharedPoint] of sharedPointsRef.current?.entries() || []) {
        const connection = sharedPoint.connectedWalls.find(
          conn => conn.wallId === selectedEndpoint.wallId && conn.pointIndex === selectedEndpoint.pointIndex
        );
        if (connection) {
          foundSharedPointId = pointId;
          break;
        }
      }
      
      if (foundSharedPointId) {
        // 如果是共享端点，更新共享端点位置，这会自动同步所有相关墙体
        updateSharedPoint(foundSharedPointId, point.x, point.y);
      } else {
        // 如果不是共享端点，只更新当前墙体
        setWalls(prev => prev.map(wall => {
          if (wall.id === selectedEndpoint.wallId) {
            const newPoints = [...wall.points];
            newPoints[selectedEndpoint.pointIndex] = point;
            
            // 同步更新pointIds数组，确保与points数组保持一致
            const newPointIds = wall.pointIds ? [...wall.pointIds] : new Array(newPoints.length).fill(null);
            // 确保pointIds数组长度与points数组一致
            while (newPointIds.length < newPoints.length) {
              newPointIds.push(null);
            }
            
            return { ...wall, points: newPoints, pointIds: newPointIds };
          }
          return wall;
        }));
      }
    } else if (isSelecting && selectionStart) {
      // 框选拖拽
      setSelectionEnd(point);
    } else {
      // 检测端点悬停
      let foundHoveredEndpoint = null;
      for (const wall of walls) {
        const hoveredEndpoint = checkEndpointHover(point, wall);
        if (hoveredEndpoint) {
          foundHoveredEndpoint = hoveredEndpoint;
          break;
        }
      }
      setHoveredEndpoint(foundHoveredEndpoint);
      
      // 只在实际绘制状态下查找附近端点
      // 使用ref值获取最新状态，避免状态更新时序问题
      const currentIsConnecting = isConnectingRef.current;
      const currentContinuousConnecting = continuousConnectingRef.current;
      
      console.log('🔍 鼠标移动条件判断:', {
        activeTool: activeTool?.type,
        isDrawingWall,
        isConnecting: currentIsConnecting,
        continuousConnecting: currentContinuousConnecting,
        condition: activeTool && activeTool.type === 'wall' && (isDrawingWall || currentIsConnecting || currentContinuousConnecting)
      });
      
      if (activeTool && activeTool.type === 'wall' && (isDrawingWall || currentIsConnecting || currentContinuousConnecting)) {
        const nearby = findNearbyEndpoints(point, walls);
        setNearbyEndpoints(nearby);
        console.log('🔍 设置附近端点:', { nearbyLength: nearby.length });
      } else {
        setNearbyEndpoints([]);
      }
    }
    
    // 地图编辑器风格的连线预览 - 使用优化的鼠标位置更新
    if (activeTool && activeTool.type === 'wall' && (isConnecting || continuousConnecting)) {
      updateMousePositionOptimized(point.x, point.y);
    } else if (activeTool && activeTool.type === 'wall' && isDrawingWall) {
      // 保持原有的绘制预览
      setMousePosition(point);
    } else {
      setMousePosition(null);
      // 清除连线预览
      if (mousePositionRef.current) {
        mousePositionRef.current = null;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // 结束贝塞尔曲线控制点拖拽
    if (bezierDrawingState.isDraggingControl) {
      setBezierDrawingState(prev => ({
        ...prev,
        isDraggingControl: false,
        activeControlPoint: null
      }));
    }

    // 结束贝塞尔曲线编辑模式下的控制点拖拽
    if (bezierEditMode.isDraggingControl) {
      setBezierEditMode(prev => ({
        ...prev,
        isDraggingControl: false,
        activeControlPoint: null
      }));
    }
    
    // 结束端点拖拽
    if (isDraggingEndpoint) {
      setIsDraggingEndpoint(false);
      // 保持端点选中状态，不清除 selectedEndpoint，以支持键盘移动功能
      console.log('🔚 结束端点拖拽，保持选中状态');
    }
    
    // 结束框选
    if (isSelecting && selectionStart && selectionEnd) {
      const selectedWallIds = getWallsInSelection(selectionStart, selectionEnd);
      // 框选应该选中所有被接触到的线
      setSelectedWalls(selectedWallIds);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  // 获取框选区域内的墙体
  // 检测线段与矩形是否相交的工具函数
  const lineIntersectsRect = (x1: number, y1: number, x2: number, y2: number, rectX1: number, rectY1: number, rectX2: number, rectY2: number): boolean => {
    // 检查线段端点是否在矩形内
    const pointInRect = (x: number, y: number) => {
      return x >= rectX1 && x <= rectX2 && y >= rectY1 && y <= rectY2;
    };
    
    if (pointInRect(x1, y1) || pointInRect(x2, y2)) {
      return true;
    }
    
    // 检查线段是否与矩形的四条边相交
    const lineIntersectsLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean => {
      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 1e-10) return false; // 平行线
      
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
      
      return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    };
    
    // 检查与矩形四条边的相交
    return lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY1) || // 上边
           lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY1, rectX2, rectY2) || // 右边
           lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY2, rectX1, rectY2) || // 下边
           lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY2, rectX1, rectY1);   // 左边
  };

  const getWallsInSelection = (start: WallPoint, end: WallPoint): string[] => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    return walls.filter(wall => {
      // 对于直线墙体，检查线段是否与框选矩形相交
      if (wall.type === 'line' && wall.points.length >= 2) {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i];
          const p2 = wall.points[i + 1];
          
          // 使用线段与矩形相交算法
          if (lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, minX, minY, maxX, maxY)) {
            return true;
          }
        }
      }
      
      // 对于贝塞尔曲线墙体，检查控制点或端点是否在选择区域内
      // 这里简化处理，检查所有点是否在选择区域内
      return wall.points.some(point => 
        point.x >= minX && point.x <= maxX && 
        point.y >= minY && point.y <= maxY
      );
    }).map(wall => wall.id);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  // 墙体绘制处理
  const handleWallDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    if (!activeTool || activeTool.type !== 'wall') return;

    const point = screenToCanvas(e.clientX, e.clientY);

    if (activeTool.subType === 'line') {
      handleLineWallDrawing(point);
    } else if (activeTool.subType === 'bezier') {
      handleBezierWallDrawing(point, e.shiftKey);
    }
  };

  // 直线墙体绘制（采用地图编辑器的连线逻辑，支持共享端点）
  const handleLineWallDrawing = (point: WallPoint) => {
    // 检查是否点击了附近的端点
    const clickRadius = 15 / scale; // 点击半径，考虑缩放
    const nearbyEndpoint = nearbyEndpoints.find(endpoint => {
      const distance = Math.sqrt(
        Math.pow(endpoint.point.x - point.x, 2) + 
        Math.pow(endpoint.point.y - point.y, 2)
      );
      return distance < clickRadius;
    });

    if (!isConnecting && !continuousConnecting) {
      // 开始连线模式
      setIsConnecting(true);
      
      let startPoint = point;
      // 如果点击了附近的端点，从该端点开始绘制
      if (nearbyEndpoint) {
        startPoint = nearbyEndpoint.point;
        message.info('从现有端点开始绘制直线');
      } else {
        message.info('点击第二个点完成直线绘制');
      }
      
      setConnectingStartPoint(startPoint);
      // 清除之前的鼠标位置，确保虚线渲染状态正确
      setMousePosition(null);
      mousePositionRef.current = null;
      
    } else if (continuousConnecting || (isConnecting && connectingStartPoint)) {
      // 连续连线模式或完成当前连线
      let startPoint = lastConnectedPoint || connectingStartPoint;
      
      if (startPoint && (startPoint.x !== point.x || startPoint.y !== point.y)) {
        let endPoint = point;
        
        // 如果点击了附近的端点，连接到该端点
        if (nearbyEndpoint) {
          endPoint = nearbyEndpoint.point;
          message.success('直线已连接到现有端点');
        } else {
          message.success('直线绘制完成');
        }
        
        // 创建新的墙体ID
        const newWallId = `wall-${Date.now()}`;
        
        // 处理共享端点逻辑 - 修复阈值不一致问题和位置精确匹配
        const processSharedPoint = (point: WallPoint, wallId: string, pointIndex: number): { pointId: string | null, actualPoint: WallPoint } => {
          // 统一使用15像素作为共享端点检测阈值
          const sharedPointThreshold = 15;
          
          // 首先检查是否已存在共享端点
          const existingSharedPoint = findNearbySharedPoint(point.x, point.y, sharedPointThreshold);
          if (existingSharedPoint) {
            addWallToSharedPoint(existingSharedPoint.id, wallId, pointIndex);
            // 返回共享端点的精确位置
            return { pointId: existingSharedPoint.id, actualPoint: { x: existingSharedPoint.x, y: existingSharedPoint.y } };
          }
          
          // 实时查找附近的墙体端点（不依赖nearbyEndpoints状态）
          const nearbyWallEndpoints = findNearbyEndpoints(point, walls, sharedPointThreshold).filter(ep => 
            ep.wallId !== wallId
          );
          const nearbyWallEndpoint = nearbyWallEndpoints.length > 0 ? nearbyWallEndpoints[0] : null;
          
          if (nearbyWallEndpoint) {
            // 创建共享端点并连接现有墙体和新墙体
            // 使用现有端点的精确位置作为共享端点位置
            const sharedPointId = createSharedPoint(nearbyWallEndpoint.point.x, nearbyWallEndpoint.point.y);
            addWallToSharedPoint(sharedPointId, nearbyWallEndpoint.wallId, nearbyWallEndpoint.pointIndex);
            addWallToSharedPoint(sharedPointId, wallId, pointIndex);
            // 返回共享端点的精确位置
            return { pointId: sharedPointId, actualPoint: { x: nearbyWallEndpoint.point.x, y: nearbyWallEndpoint.point.y } };
          }
          
          // 没有找到共享端点，返回原始位置
          return { pointId: null, actualPoint: point };
        };
        
        const startPointResult = processSharedPoint(startPoint, newWallId, 0);
        const endPointResult = processSharedPoint(endPoint, newWallId, 1);
        
        // 使用精确的端点位置创建墙体
        const actualStartPoint = startPointResult.actualPoint;
        const actualEndPoint = endPointResult.actualPoint;
        
        // 创建新的墙体
        const newWall: Wall = {
          id: newWallId,
          type: 'line',
          points: [actualStartPoint, actualEndPoint],
          pointIds: [startPointResult.pointId, endPointResult.pointId], // 保持与points数组一一对应，允许null值
          thickness: wallStyle.thickness,
          color: wallStyle.color,
          completed: true
        };
        
        // 添加到墙体列表
        setWalls(prev => [...prev, newWall]);
        
        // 更新最后连接的点，为下一次连线做准备 - 使用精确的端点位置
        setLastConnectedPoint(actualEndPoint);
        // 启用连续连线模式
        setContinuousConnecting(true);
        continuousConnectingRef.current = true;
        
      } else {
        // 起始点和结束点相同，不创建连线
        if (startPoint && startPoint.x === point.x && startPoint.y === point.y) {
          message.warning('不能在同一个点上创建墙体！');
        }
      }
    }
  };

  // 贝塞尔曲线墙体绘制 - 连续多点绘制模式
  const handleBezierWallDrawing = (point: WallPoint, shiftKey: boolean = false) => {
    // 如果是连续绘制模式且有上一个终点，则使用上一个终点作为起点
    const actualStartPoint = continuousConnecting && lastConnectedPoint ? lastConnectedPoint : point;
    
    if (continuousConnecting && lastConnectedPoint) {
      // 连续绘制模式：使用上一个终点作为起点，当前点作为终点
      const startPoint = lastConnectedPoint;
      const endPoint = point;
      
      // 计算默认控制点位置
      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      );
      const controlOffset = distance * 0.3;
      
      // 计算垂直于连线的方向向量
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        // 归一化方向向量
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        
        // 计算垂直向量（顺时针旋转90度）
        const perpDx = normalizedDy;
        const perpDy = -normalizedDx;
        
        // 默认控制点位置
        const defaultControlPoint1: WallPoint = {
          x: startPoint.x + normalizedDx * controlOffset + perpDx * controlOffset * 0.5,
          y: startPoint.y + normalizedDy * controlOffset + perpDy * controlOffset * 0.5
        };
        
        const defaultControlPoint2: WallPoint = {
          x: endPoint.x - normalizedDx * controlOffset + perpDx * controlOffset * 0.5,
          y: endPoint.y - normalizedDy * controlOffset + perpDy * controlOffset * 0.5
        };
        
        // 立即完成贝塞尔曲线绘制，并继续连续绘制模式
        finishBezierCurveWithPoints(startPoint, endPoint, defaultControlPoint1, defaultControlPoint2, true);
        message.info('已绘制曲线段，继续点击下一个点或按ESC结束');
      }
    } else {
      // 开始新的连续绘制序列
      setLastConnectedPoint(point);
      setContinuousConnecting(true);
      continuousConnectingRef.current = true;
      message.info('已设置起点，继续点击下一个点绘制曲线');
    }
  };

  // 完成贝塞尔曲线绘制
  // 使用指定点完成贝塞尔曲线绘制（新函数，支持两点绘制模式）
  const finishBezierCurveWithPoints = (
    startPoint: WallPoint, 
    endPoint: WallPoint, 
    controlPoint1: WallPoint, 
    controlPoint2: WallPoint,
    shiftKey: boolean = false
  ) => {
    const { continuousMode } = bezierDrawingState;

    // 创建新的贝塞尔曲线墙体
    const newWallId = `wall-${Date.now()}`;
    
    // 处理共享端点逻辑
    const processSharedPoint = (point: WallPoint, wallId: string, pointIndex: number): { pointId: string | null, actualPoint: WallPoint } => {
      const sharedPointThreshold = 15;
      
      const existingSharedPoint = findNearbySharedPoint(point.x, point.y, sharedPointThreshold);
      if (existingSharedPoint) {
        addWallToSharedPoint(existingSharedPoint.id, wallId, pointIndex);
        return { pointId: existingSharedPoint.id, actualPoint: { x: existingSharedPoint.x, y: existingSharedPoint.y } };
      }
      
      const nearbyWallEndpoints = findNearbyEndpoints(point, walls, sharedPointThreshold).filter(ep => 
        ep.wallId !== wallId
      );
      const nearbyWallEndpoint = nearbyWallEndpoints.length > 0 ? nearbyWallEndpoints[0] : null;
      
      if (nearbyWallEndpoint) {
        const sharedPointId = createSharedPoint(nearbyWallEndpoint.point.x, nearbyWallEndpoint.point.y);
        addWallToSharedPoint(sharedPointId, nearbyWallEndpoint.wallId, nearbyWallEndpoint.pointIndex);
        addWallToSharedPoint(sharedPointId, wallId, pointIndex);
        return { pointId: sharedPointId, actualPoint: { x: nearbyWallEndpoint.point.x, y: nearbyWallEndpoint.point.y } };
      }
      
      return { pointId: null, actualPoint: point };
    };

    const startPointResult = processSharedPoint(startPoint, newWallId, 0);
    const endPointResult = processSharedPoint(endPoint, newWallId, 3);

    // 创建贝塞尔曲线墙体（使用4个点的格式：起点、控制点1、控制点2、终点）
    const newWall: Wall = {
      id: newWallId,
      type: 'bezier',
      points: [startPointResult.actualPoint, controlPoint1, controlPoint2, endPointResult.actualPoint],
      pointIds: [startPointResult.pointId, null, null, endPointResult.pointId], // 只有起点和终点可能有共享端点
      thickness: wallStyle.thickness,
      color: wallStyle.color,
      completed: true
    };

    setWalls(prev => [...prev, newWall]);
    
    if (shiftKey) {
      // 连续绘制模式：启用连续连线模式，将当前终点作为下一条曲线的起点
      setContinuousConnecting(true);
      continuousConnectingRef.current = true;
      setLastConnectedPoint(endPoint);
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: false,
        lastEndPoint: null
      });
      message.success('贝塞尔曲线绘制完成！继续点击绘制下一条曲线，按ESC键退出连续绘制');
    } else {
      // 单次绘制模式：完全重置状态
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: false,
        lastEndPoint: null
      });
      message.success('贝塞尔曲线绘制完成！');
    }
  };

  const finishBezierCurve = () => {
    const { startPoint, endPoint, controlPoint1, controlPoint2 } = bezierDrawingState;
    
    if (startPoint && endPoint && controlPoint1 && controlPoint2) {
      // 创建新的贝塞尔曲线墙体
      const newWallId = `wall-${Date.now()}`;
      
      // 处理共享端点逻辑
      const processSharedPoint = (point: WallPoint, wallId: string, pointIndex: number): { pointId: string | null, actualPoint: WallPoint } => {
        const sharedPointThreshold = 15;
        
        const existingSharedPoint = findNearbySharedPoint(point.x, point.y, sharedPointThreshold);
        if (existingSharedPoint) {
          addWallToSharedPoint(existingSharedPoint.id, wallId, pointIndex);
          return { pointId: existingSharedPoint.id, actualPoint: { x: existingSharedPoint.x, y: existingSharedPoint.y } };
        }
        
        const nearbyWallEndpoints = findNearbyEndpoints(point, walls, sharedPointThreshold).filter(ep => 
          ep.wallId !== wallId
        );
        const nearbyWallEndpoint = nearbyWallEndpoints.length > 0 ? nearbyWallEndpoints[0] : null;
        
        if (nearbyWallEndpoint) {
          const sharedPointId = createSharedPoint(nearbyWallEndpoint.point.x, nearbyWallEndpoint.point.y);
          addWallToSharedPoint(sharedPointId, nearbyWallEndpoint.wallId, nearbyWallEndpoint.pointIndex);
          addWallToSharedPoint(sharedPointId, wallId, pointIndex);
          return { pointId: sharedPointId, actualPoint: { x: nearbyWallEndpoint.point.x, y: nearbyWallEndpoint.point.y } };
        }
        
        return { pointId: null, actualPoint: point };
      };

      const startPointResult = processSharedPoint(startPoint, newWallId, 0);
      const endPointResult = processSharedPoint(endPoint, newWallId, 3);

      // 创建贝塞尔曲线墙体（使用4个点的格式：起点、控制点1、控制点2、终点）
      const newWall: Wall = {
        id: newWallId,
        type: 'bezier',
        points: [startPointResult.actualPoint, controlPoint1, controlPoint2, endPointResult.actualPoint],
        pointIds: [startPointResult.pointId, null, null, endPointResult.pointId], // 只有起点和终点可能有共享端点
        thickness: wallStyle.thickness,
        color: wallStyle.color,
        completed: true
      };

      setWalls(prev => [...prev, newWall]);
      message.success('贝塞尔曲线墙体绘制完成，按住Shift键可连续绘制');
      
      // 启用连续绘制模式，保存当前终点作为下一条曲线的起点
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: true,
        lastEndPoint: endPointResult.actualPoint
      });
    } else {
      // 如果没有完整的点信息，则完全重置状态
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: false,
        lastEndPoint: null
      });
    }
  };







  // 选择工具相关函数
  const handleSelectionStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    const point = { x, y };
    
    console.log('点击事件开始:', { x, y, scale, offsetX, offsetY });

    // 检查是否点击了墙体端点 - 端点选择优先级最高
    const endpointHit = checkEndpointClick(point, walls);
    console.log('端点点击检测结果:', { endpointHit, x, y });
    if (endpointHit) {
      console.log('🎯 端点命中，设置选中状态:', endpointHit);
      setSelectedEndpoint(endpointHit);
      // 立即更新 ref，确保键盘事件能立即访问到最新的选中端点
      selectedEndpointRef.current = endpointHit;
      console.log('🔄 设置selectedEndpoint完成，当前值:', endpointHit, '，ref值:', selectedEndpointRef.current);
      setIsDraggingEndpoint(true);
      // 清除其他选择状态，但保留端点选择
      setSelectedWalls([]);
      setSelectedSegments([]);
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      console.log('✅ 端点选中处理完成，提前返回');
      return;
    }

    // 检查是否点击了线段（不提前返回，让墙体编辑模式优先）
    const segmentHit = checkSegmentHit(x, y);
    console.log('线段点击检测结果:', { segmentHit, x, y });

    // 检查是否点击了墙体
    const wallHit = checkWallHit(x, y);
    console.log('墙体点击检测结果:', { wallHit, x, y });
    
    if (wallHit) {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastClickTime;
      const clickedWall = walls.find(wall => wall.id === wallHit);
      
      console.log('找到点击的墙体:', { wallHit, clickedWall });
      
      // 检查是否为双击（300ms内点击同一墙体）
      if (timeDiff < 300 && lastClickedWall === wallHit) {
        // 双击打开属性面板
        openPropertiesPanel(wallHit);
        setLastClickTime(0);
        setLastClickedWall(null);
        return;
      }
      
      // 单击线段的选择逻辑 - 参考地图管理的实现
      if (clickedWall && clickedWall.completed) {
        console.log('点击了已完成的墙体:', {
          wallId: wallHit,
          wallType: clickedWall.type,
          currentBezierEditMode: bezierEditMode
        });
        
        // 检查是否已经在编辑这条线段
        if (bezierEditMode.isEditing && bezierEditMode.wallId === wallHit) {
          // 如果已经在编辑，则退出编辑模式
          console.log('退出贝塞尔编辑模式');
          setBezierEditMode({
            isEditing: false,
            wallId: null,
            isDraggingControl: false,
            activeControlPoint: null
          });
          // 清除选择状态
          setSelectedWalls([]);
          message.info('已退出线段编辑模式');
        } else {
          // 单击进入编辑模式 - 实现单选逻辑
          console.log('进入贝塞尔编辑模式:', wallHit);
          setBezierEditMode({
            isEditing: true,
            wallId: wallHit,
            isDraggingControl: false,
            activeControlPoint: null
          });
          
          // 单选逻辑：只选择当前点击的墙体，清除其他所有选择状态
          setSelectedWalls([wallHit]);
          setSelectedSegments([]);
          setSelectedEndpoint(null);
          
          // 调试日志
          console.log('设置编辑模式:', {
            wallId: wallHit,
            wallType: clickedWall.type,
            pointsLength: clickedWall.points ? clickedWall.points.length : 0,
            points: clickedWall.points,
            bezierEditMode: {
              isEditing: true,
              wallId: wallHit
            }
          });
          
          if (clickedWall.type === 'bezier') {
            message.info('进入贝塞尔曲线编辑模式，拖拽控制点调整曲线形状');
          } else {
            message.info('进入直线编辑模式，拖拽中点调整线段弧度');
          }
        }
        
        setLastClickTime(0);
        setLastClickedWall(null);
        return;
      }
      
      // 记录点击时间和墙体ID
      setLastClickTime(currentTime);
      setLastClickedWall(wallHit);
      return;
    }

    // 如果没有墙体被点击，但有线段被检测到，则选择线段
    if (segmentHit) {
      console.log('备用线段选择逻辑:', segmentHit);
      // 单选线段逻辑
      setSelectedSegments(prev => {
        const existingIndex = prev.findIndex(
          seg => seg.wallId === segmentHit.wallId && seg.segmentIndex === segmentHit.segmentIndex
        );
        
        if (existingIndex >= 0) {
          // 如果点击的是已选中的线段，取消选择
          return [];
        } else {
          // 单选：只选择当前点击的线段
          return [segmentHit];
        }
      });
      
      // 清空其他选择状态
      setSelectedWalls([]);
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      return;
    }

    // 点击空白区域 - 清除所有选择状态
    setSelectedWalls([]);
    setSelectedSegments([]);
    setSelectedEndpoint(null);
    setBezierEditMode({
      isEditing: false,
      wallId: null,
      isDraggingControl: false,
      activeControlPoint: null
    });
    
    // 开始框选
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
  };



  // 检查墙体点击
  const checkWallHit = (x: number, y: number): string | null => {
    const hitThreshold = 10 / scale; // 墙体点击阈值
    const clickPoint = { x, y };
    
    console.log('checkWallHit 开始检测:', { x, y, hitThreshold, wallsCount: walls.length });
    
    for (const wall of walls) {
      console.log('检查墙体:', { wallId: wall.id, type: wall.type, pointsLength: wall.points.length });
      
      if (wall.type === 'line' && wall.points.length >= 2) {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i];
          const p2 = wall.points[i + 1];
          
          // 计算点到线段的距离
          const distance = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
          console.log('直线墙体距离检测:', { wallId: wall.id, distance, hitThreshold });
          if (distance <= hitThreshold) {
            console.log('直线墙体命中:', wall.id);
            return wall.id;
          }
        }
      } else if (wall.type === 'bezier' && wall.points.length >= 4) {
        console.log('贝塞尔曲线检测:', { wallId: wall.id, points: wall.points });
        // 使用现有的getDistanceToWall函数计算点到贝塞尔曲线的距离
        const distance = getDistanceToWall(clickPoint, wall);
        console.log('贝塞尔曲线距离检测:', { wallId: wall.id, distance, hitThreshold });
        if (distance <= hitThreshold) {
          console.log('贝塞尔曲线命中:', wall.id);
          return wall.id;
        }
      }
    }
    console.log('没有墙体命中');
    return null;
  };

  // 检查线段点击 - 返回具体的线段信息（只处理直线墙体）
  const checkSegmentHit = (x: number, y: number): {wallId: string, segmentIndex: number} | null => {
    const hitThreshold = 10 / scale; // 线段点击阈值
    
    for (const wall of walls) {
      // 只处理直线墙体，贝塞尔曲线由 checkWallHit 函数专门处理
      if (wall.type === 'line' && wall.points.length >= 2) {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i];
          const p2 = wall.points[i + 1];
          
          // 计算点到线段的距离
          const distance = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
          if (distance <= hitThreshold) {
            return { wallId: wall.id, segmentIndex: i };
          }
        }
      }
      // 移除贝塞尔曲线检测逻辑，让 checkWallHit 函数专门处理贝塞尔曲线
    }
    return null;
  };

  // 计算点到墙体的距离
  const getDistanceToWall = (point: WallPoint, wall: Wall): number => {
    if (wall.type === 'line') {
      // 直线墙体：计算点到线段的距离
      if (wall.points.length >= 2) {
        const p1 = wall.points[0];
        const p2 = wall.points[1];
        return pointToLineDistance(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
      }
    } else if (wall.type === 'bezier' && wall.points.length >= 4) {
      // 贝塞尔曲线墙体：采样多个点计算最小距离
      // 新格式：points数组包含 [起点, 控制点1, 控制点2, 终点]
      const p0 = wall.points[0]; // 起点
      const p1 = wall.points[1]; // 控制点1
      const p2 = wall.points[2]; // 控制点2
      const p3 = wall.points[3]; // 终点
      
      let minDistance = Infinity;
      const samples = 20; // 采样点数量
      
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        // 三次贝塞尔曲线公式
        const x = Math.pow(1 - t, 3) * p0.x + 
                  3 * Math.pow(1 - t, 2) * t * p1.x + 
                  3 * (1 - t) * Math.pow(t, 2) * p2.x + 
                  Math.pow(t, 3) * p3.x;
        const y = Math.pow(1 - t, 3) * p0.y + 
                  3 * Math.pow(1 - t, 2) * t * p1.y + 
                  3 * (1 - t) * Math.pow(t, 2) * p2.y + 
                  Math.pow(t, 3) * p3.y;
        
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        minDistance = Math.min(minDistance, distance);
      }
      
      return minDistance;
    }
    
    return Infinity;
  };

  // 计算点到线段的距离
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    
    if (param < 0) {
      return Math.sqrt(A * A + B * B);
    } else if (param > 1) {
      const E = px - x2;
      const F = py - y2;
      return Math.sqrt(E * E + F * F);
    } else {
      const projX = x1 + param * C;
      const projY = y1 + param * D;
      const G = px - projX;
      const H = py - projY;
      return Math.sqrt(G * G + H * H);
    }
  };

  // 打开属性面板
  const openPropertiesPanel = (wallId: string) => {
    const wall = walls.find(w => w.id === wallId);
    if (wall) {
      const formData = {
        wallId: wall.id,
        thickness: wall.thickness || 0.2,
        width: wall.width || 1.0,
        height: wall.height || 3.0,
        color: wall.color || '#000000'
      };
      setPropertiesFormData(formData);
      propertiesForm.setFieldsValue(formData);
      setShowPropertiesPanel(true);
    }
  };

  // 关闭属性面板
  const closePropertiesPanel = () => {
    setShowPropertiesPanel(false);
    setPropertiesFormData(null);
    propertiesForm.resetFields();
  };

  // 更新墙体属性
  const updateWallProperties = (values: any) => {
    if (!propertiesFormData) return;
    
    setWalls(prevWalls => 
      prevWalls.map(wall => 
        wall.id === propertiesFormData.wallId 
          ? {
              ...wall,
              thickness: values.thickness,
              width: values.width,
              height: values.height,
              color: values.color
            }
          : wall
      )
    );
    
    message.success('墙体属性更新成功');
    closePropertiesPanel();
  };

  // 删除选中的墙体
  const deleteSelectedWalls = () => {
    if (selectedWalls.length === 0) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedWalls.length} 个墙体吗？`,
      onOk: () => {
        // 在删除墙体前，先清理相关的共享端点
        setWalls(prevWalls => {
          const wallsToDelete = prevWalls.filter(wall => selectedWalls.includes(wall.id));
          
          // 清理每个要删除的墙体的共享端点
          wallsToDelete.forEach(wall => {
            if (wall.pointIds) {
              wall.pointIds.forEach((pointId, index) => {
                if (pointId) {
                  removeWallFromSharedPoint(pointId, wall.id, index);
                }
              });
            }
          });
          
          // 返回过滤后的墙体数组
          return prevWalls.filter(wall => !selectedWalls.includes(wall.id));
        });
        
        setSelectedWalls([]);
        message.success(`已删除 ${selectedWalls.length} 个墙体`);
      }
    });
  };

  // 删除选中的线段
  const deleteSelectedSegments = () => {
    if (selectedSegments.length === 0) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedSegments.length} 个线段吗？`,
      onOk: () => {
        setWalls(prevWalls => {
          const newWalls = [...prevWalls];
          
          // 按墙体分组处理选中的线段
          const segmentsByWall = selectedSegments.reduce((acc, segment) => {
            if (!acc[segment.wallId]) {
              acc[segment.wallId] = [];
            }
            acc[segment.wallId].push(segment.segmentIndex);
            return acc;
          }, {} as Record<string, number[]>);
          
          // 对每个墙体处理其选中的线段
          Object.entries(segmentsByWall).forEach(([wallId, segmentIndices]) => {
            const wallIndex = newWalls.findIndex(w => w.id === wallId);
            if (wallIndex === -1) return;
            
            const wall = newWalls[wallIndex];
            if (wall.points.length <= 2) {
              // 如果墙体只有两个点（一个线段），删除整个墙体
              newWalls.splice(wallIndex, 1);
            } else {
              // 删除指定的线段（移除对应的点）
              const newPoints = [...wall.points];
              // 按降序排序，从后往前删除，避免索引变化
              segmentIndices.sort((a, b) => b - a);
              
              segmentIndices.forEach(segmentIndex => {
                if (segmentIndex < newPoints.length - 1) {
                  // 删除线段的终点（保留起点）
                  newPoints.splice(segmentIndex + 1, 1);
                }
              });
              
              // 如果删除后点数少于2个，删除整个墙体
              if (newPoints.length < 2) {
                newWalls.splice(wallIndex, 1);
              } else {
                newWalls[wallIndex] = { ...wall, points: newPoints };
              }
            }
          });
          
          return newWalls;
        });
        
        setSelectedSegments([]);
        message.success(`已删除 ${selectedSegments.length} 个线段`);
      }
    });
  };

  // 过滤产品模型
  const getFilteredModels = () => {
    return mockProductModels.filter(model =>
      model.name.toLowerCase().includes(modelSearchText.toLowerCase())
    );
  };

  // 楼层切换
  const switchFloor = (floorId: string) => {
    setCurrentFloor(floorId);
    const scene = floorScenes.find(s => s.id === floorId);
    if (scene) {
      message.success(`已切换到${scene.name}`);
    }
  };

  // 打开场景列表对话框
  const openSceneListModal = () => {
    setSceneListModalVisible(true);
  };

  // 打开新增场景对话框
  const openNewSceneModal = () => {
    setEditingScene(null);
    sceneForm.resetFields();
    setNewSceneModalVisible(true);
  };

  // 打开编辑场景对话框
  const openEditSceneModal = (scene: FloorScene) => {
    setEditingScene(scene);
    setSelectedMapId(scene.dataSource || null);
    
    // 设置可用底图列表
    if (scene.dataSource) {
      const selectedMap = mockMapData.find(map => map.id === scene.dataSource);
      if (selectedMap && selectedMap.availableBaseMaps) {
        const baseMaps = mockBaseMapData.filter(baseMap => 
          selectedMap.availableBaseMaps!.includes(baseMap.id)
        );
        setAvailableBaseMaps(baseMaps);
      }
    }
    
    // 设置initializeDevicesValue状态
    const initDevices = scene.initializeDevices ?? true;
    setInitializeDevicesValue(initDevices);
    
    sceneForm.setFieldsValue({
      name: scene.name,
      floor: scene.floor,
      dataSource: scene.dataSource,
      baseMap: scene.baseMap,
      initializeDevices: initDevices,
      increaseUpdate: scene.increaseUpdate ?? false // 默认为false
    });
    setNewSceneModalVisible(true);
  };

  // 保存场景
  const saveScene = async () => {
    try {
      const values = await sceneForm.validateFields();
      
      if (editingScene) {
        // 编辑现有场景
        setFloorScenes(prev => prev.map(scene => 
          scene.id === editingScene.id 
            ? { ...scene, ...values }
            : scene
        ));
        message.success('场景编辑成功');
      } else {
        // 新增场景
        const newScene: FloorScene = {
          id: `floor-${Date.now()}`,
          ...values
        };
        setFloorScenes(prev => [...prev, newScene]);
        message.success('场景新增成功');
      }
      
      setNewSceneModalVisible(false);
      setEditingScene(null);
      setSelectedMapId(null); // 重置地图选择状态
      setAvailableBaseMaps([]); // 重置可用底图列表
      setInitializeDevicesValue(true); // 重置初始化设备状态
      sceneForm.resetFields();
    } catch (error) {
      console.error('保存场景失败:', error);
    }
  };

  // 删除场景
  const deleteScene = (sceneId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个场景吗？',
      onOk: () => {
        setFloorScenes(prev => prev.filter(scene => scene.id !== sceneId));
        if (currentFloor === sceneId && floorScenes.length > 1) {
          const remainingScenes = floorScenes.filter(scene => scene.id !== sceneId);
          setCurrentFloor(remainingScenes[0]?.id || '');
        }
        message.success('场景删除成功');
      }
    });
  };

  // 处理地图选择变化
  const handleMapChange = (mapId: string) => {
    setSelectedMapId(mapId);
    sceneForm.setFieldValue('baseMap', undefined); // 清空表单中的底图字段
    
    // 根据选择的地图更新可用底图列表
    const selectedMap = mockMapData.find(map => map.id === mapId);
    if (selectedMap && selectedMap.availableBaseMaps) {
      const baseMaps = mockBaseMapData.filter(baseMap => 
        selectedMap.availableBaseMaps!.includes(baseMap.id)
      );
      setAvailableBaseMaps(baseMaps);
    } else {
      setAvailableBaseMaps([]);
    }
  };

  // 处理底图选择变化
  const handleBaseMapChange = () => {
    // 底图选择逻辑已移除
  };

  // 处理是否初始化地图关联设备变化
  const handleInitializeDevicesChange = (value: boolean) => {
    setInitializeDevicesValue(value);
  };

  // 端点相关辅助函数
  // 计算线段端点位置


  // 检测点击是否在端点上
  const checkEndpointClick = useCallback((mousePoint: WallPoint, wallList: Wall[]): { wallId: string; pointIndex: number } | null => {
    const endpointRadius = 8 / scale; // 端点点击半径，考虑缩放
    
    for (const wall of wallList) {
      for (let i = 0; i < wall.points.length; i++) {
        const point = wall.points[i];
        const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
        if (distance <= endpointRadius) {
          return { wallId: wall.id, pointIndex: i };
        }
      }
    }
    return null;
  }, [scale]);

  // 检测鼠标是否悬停在端点上
  const checkEndpointHover = useCallback((mousePoint: WallPoint, wall: Wall): { wallId: string; pointIndex: number } | null => {
    const hoverRadius = 12 / scale; // 悬停检测半径，比点击半径稍大
    
    for (let i = 0; i < wall.points.length; i++) {
      const point = wall.points[i];
      const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
      if (distance <= hoverRadius) {
        return { wallId: wall.id, pointIndex: i };
      }
    }
    return null;
  }, [scale]);

  // 查找附近的端点（用于绘制模式）
  const findNearbyEndpoints = useCallback((mousePoint: WallPoint, wallList: Wall[], radius: number = 15): Array<{ wallId: string; pointIndex: number; point: WallPoint }> => {
    const nearby: Array<{ wallId: string; pointIndex: number; point: WallPoint }> = [];
    const searchRadius = radius / scale; // 考虑缩放
    
    for (const wall of wallList) {
      for (let i = 0; i < wall.points.length; i++) {
        const point = wall.points[i];
        const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
        if (distance <= searchRadius) {
          nearby.push({ wallId: wall.id, pointIndex: i, point });
        }
      }
    }
    
    // 按距离排序，最近的在前
    return nearby.sort((a, b) => {
      const distA = Math.sqrt((mousePoint.x - a.point.x) ** 2 + (mousePoint.y - a.point.y) ** 2);
      const distB = Math.sqrt((mousePoint.x - b.point.x) ** 2 + (mousePoint.y - b.point.y) ** 2);
      return distA - distB;
    });
  }, [scale]);

  // 画布绘制
  // 画布绘制函数
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 获取画布的CSS显示尺寸
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 如果尺寸为0，说明DOM还没有完全渲染，延迟执行
    if (displayWidth === 0 || displayHeight === 0) {
      setTimeout(() => drawCanvas(), 10);
      return;
    }

    // 设置画布尺寸
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 绘制网格线
    const gridSize = 20;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1 / scale;

    // 计算当前视口在世界坐标系中的范围
    const viewLeft = -offsetX / scale;
    const viewTop = -offsetY / scale;
    const viewRight = (displayWidth - offsetX) / scale;
    const viewBottom = (displayHeight - offsetY) / scale;

    // 计算网格线的起始和结束位置，确保覆盖整个视口
    const startX = Math.floor(viewLeft / gridSize) * gridSize;
    const endX = Math.ceil(viewRight / gridSize) * gridSize;
    const startY = Math.floor(viewTop / gridSize) * gridSize;
    const endY = Math.ceil(viewBottom / gridSize) * gridSize;

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

    // 绘制已完成的墙体
    walls.forEach(wall => {
      if (wall.points.length >= 2) {
        ctx.strokeStyle = wall.color;
        ctx.lineWidth = wall.thickness / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (wall.type === 'line') {
          // 检查直线墙体是否有任何线段被选中
          const hasSelectedSegment = selectedSegments.some(
            seg => seg.wallId === wall.id
          );
          
          // 绘制直线墙体 - 逐段绘制以支持线段高亮
          for (let i = 0; i < wall.points.length - 1; i++) {
            const p1 = wall.points[i];
            const p2 = wall.points[i + 1];
            
            // 检查当前线段是否被选中
            const isSegmentSelected = selectedSegments.some(
              seg => seg.wallId === wall.id && seg.segmentIndex === i
            );
            
            // 设置线段样式
            if (isSegmentSelected) {
              ctx.strokeStyle = '#1890ff'; // 选中线段用蓝色高亮，与贝塞尔曲线保持一致
              ctx.lineWidth = (wall.thickness + 2) / scale; // 选中线段稍微加粗
            } else {
              ctx.strokeStyle = wall.color;
              ctx.lineWidth = wall.thickness / scale;
            }
            
            // 绘制线段
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          
          // 为选中的直线墙体绘制端点（与贝塞尔曲线保持一致的逻辑）
          if (hasSelectedSegment) {
            ctx.save();
            
            // 绘制起点和终点
            const startPoint = wall.points[0];
            const endPoint = wall.points[wall.points.length - 1];
            
            if (startPoint && endPoint) {
              // 绘制起点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与贝塞尔曲线一致
              ctx.beginPath();
              ctx.arc(startPoint.x, startPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
              
              // 绘制终点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与贝塞尔曲线一致
              ctx.beginPath();
              ctx.arc(endPoint.x, endPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
            }
            
            ctx.restore();
          }
        } else if (wall.type === 'bezier' && wall.points.length >= 4) {
          // 检查贝塞尔曲线是否被选中
          const isBezierSelected = selectedSegments.some(
            seg => seg.wallId === wall.id && seg.segmentIndex === 0
          );
          
          // 设置贝塞尔曲线样式
          if (isBezierSelected) {
            ctx.strokeStyle = '#1890ff'; // 选中曲线用蓝色高亮，与直线保持一致
            ctx.lineWidth = (wall.thickness + 2) / scale; // 选中曲线稍微加粗
          } else {
            ctx.strokeStyle = wall.color;
            ctx.lineWidth = wall.thickness / scale;
          }
          
          // 绘制贝塞尔曲线墙体
          ctx.beginPath();
          ctx.moveTo(wall.points[0].x, wall.points[0].y);
          
          // 每4个点为一组绘制贝塞尔曲线
          for (let i = 0; i < wall.points.length - 3; i += 4) {
            const p0 = wall.points[i];     // 起点
            const p1 = wall.points[i + 1]; // 控制点1
            const p2 = wall.points[i + 2]; // 控制点2
            const p3 = wall.points[i + 3]; // 终点
            
            if (p0 && p1 && p2 && p3) {
              ctx.bezierCurveTo(
                p1.x, p1.y,
                p2.x, p2.y,
                p3.x, p3.y
              );
              
              // 如果还有更多点，移动到下一段的起点
              if (i + 4 < wall.points.length) {
                ctx.moveTo(p3.x, p3.y);
              }
            }
          }
          ctx.stroke();
          
          // 为选中的贝塞尔曲线绘制端点
          if (isBezierSelected) {
            ctx.save();
            
            // 绘制起点和终点
            const startPoint = wall.points[0];
            const endPoint = wall.points[wall.points.length - 1];
            
            if (startPoint && endPoint) {
              // 绘制起点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与直线段一致
              ctx.beginPath();
              ctx.arc(startPoint.x, startPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
              
              // 绘制终点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与直线段一致
              ctx.beginPath();
              ctx.arc(endPoint.x, endPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
            }
            
            ctx.restore();
          }
        }

        // 注意：端点绘制逻辑已移到墙体循环外部，避免共享端点重复绘制
      }
    });

    // 统一绘制所有端点（避免共享端点重复绘制）
    const renderedPoints = new Set<string>(); // 记录已绘制的端点位置
    
    // 首先收集所有需要绘制的端点信息
    const endpointsToRender: Array<{
      point: WallPoint;
      wallId: string;
      pointIndex: number;
      sharedPoint?: SharedPoint;
      isSelected: boolean;
      isHovered: boolean;
      isNearby: boolean;
    }> = [];
    
    walls.forEach((wall) => {
      if (!wall.completed) return;
      
      wall.points.forEach((point, index) => {
        // 检查是否为共享端点
        let sharedPoint: SharedPoint | undefined;
        for (const sp of sharedPoints.values()) {
          const distance = Math.sqrt(
            Math.pow(sp.x - point.x, 2) + 
            Math.pow(sp.y - point.y, 2)
          );
          if (distance < 15) {
            sharedPoint = sp;
            break;
          }
        }
        
        // 检查端点状态
        const isSelected = selectedEndpoint?.wallId === wall.id && selectedEndpoint?.pointIndex === index;
        const isHovered = hoveredEndpoint?.wallId === wall.id && hoveredEndpoint?.pointIndex === index;
        const isNearby = isDrawingWall && nearbyEndpoints.some(ep => ep.wallId === wall.id && ep.pointIndex === index);
        
        endpointsToRender.push({
          point,
          wallId: wall.id,
          pointIndex: index,
          sharedPoint,
          isSelected,
          isHovered,
          isNearby
        });
      });
    });
    
    // 绘制端点，确保共享端点只绘制一次
    endpointsToRender.forEach((endpoint) => {
      const { point, wallId, sharedPoint, isSelected, isHovered, isNearby } = endpoint;
      
      // 生成端点位置的唯一标识
      const pointKey = sharedPoint ? `shared_${sharedPoint.id}` : `${point.x.toFixed(1)}_${point.y.toFixed(1)}`;
      
      // 如果已经绘制过这个位置的端点，跳过
      if (renderedPoints.has(pointKey)) {
        return;
      }
      renderedPoints.add(pointKey);
      
      // 获取墙体信息用于显示判断
      const wall = walls.find(w => w.id === wallId);
      if (!wall) return;
      
      // 只在需要显示端点时绘制
      // 修复：确保在非绘制状态下，选中墙体或选中端点时显示端点
      const isEndpointSelected = selectedEndpoint?.wallId === wall.id && selectedEndpoint?.pointIndex === endpoint.pointIndex;
      const shouldShowEndpoint = isDrawingWall ? 
        (nearbyEndpoints.length > 0) : // 绘制模式：只显示附近端点
        (wall.completed && (wall.selected || isEndpointSelected)); // 非绘制模式：选中墙体或选中端点时显示
      
      // 调试日志：端点显示条件
        if (wall.id === walls[0]?.id && endpoint.pointIndex === 0) { // 只为第一个墙体的第一个端点记录日志
          console.log('🔵 端点显示状态:', {
            shouldShowEndpoint: shouldShowEndpoint,
            wallCompleted: wall.completed,
            wallSelected: wall.selected,
            isEndpointSelected: isEndpointSelected,
            isDrawingWall: isDrawingWall,
            wallId: wall.id
          });
        }
      
      if (shouldShowEndpoint) {
        // 设置端点样式
        let pointColor = '#1890ff';
        let pointRadius = 4 / scale;
        let lineWidth = 1 / scale;
        
        if (isSelected) {
          pointColor = '#ff4d4f'; // 选中状态：红色
          pointRadius = 6 / scale;
          lineWidth = 2 / scale;
        } else if (isHovered) {
          pointColor = '#1890ff'; // 悬停状态：蓝色
          pointRadius = 5 / scale;
          lineWidth = 1 / scale;
        } else if (isNearby) {
          pointColor = '#52c41a'; // 附近端点：绿色
          pointRadius = 5 / scale;
          lineWidth = 1 / scale;
        } else if (sharedPoint && sharedPoint.connectedWalls.length > 1) {
          pointColor = '#722ed1'; // 共享端点：紫色
          pointRadius = 6 / scale;
          lineWidth = 2 / scale;
        } else {
          pointColor = wall.color; // 默认状态
          lineWidth = 0;
        }
        
        // 绘制端点
        ctx.save();
        ctx.fillStyle = pointColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制端点边框
        if (isSelected || isHovered || isNearby || (sharedPoint && sharedPoint.connectedWalls.length > 1)) {
          ctx.stroke();
        }
        
        ctx.restore();
      }
    });

    // 绘制当前正在绘制的墙体
    if (currentWall && currentWall.points.length > 0) {
      ctx.strokeStyle = currentWall.color;
      ctx.lineWidth = currentWall.thickness / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([5 / scale, 5 / scale]); // 虚线表示正在绘制

      if (currentWall.type === 'line') {
        ctx.beginPath();
        
        if (currentWall.points.length >= 2) {
          // 绘制已有的直线段
          ctx.moveTo(currentWall.points[0].x, currentWall.points[0].y);
          for (let i = 1; i < currentWall.points.length; i++) {
            ctx.lineTo(currentWall.points[i].x, currentWall.points[i].y);
          }
        }
        
        // 绘制预览线（从最后一个点到鼠标位置）
        if (currentWall.points.length >= 1 && mousePosition) {
          const lastPoint = currentWall.points[currentWall.points.length - 1];
          if (currentWall.points.length === 1) {
            // 如果只有一个点，从该点开始绘制到鼠标位置
            ctx.moveTo(lastPoint.x, lastPoint.y);
          }
          ctx.lineTo(mousePosition.x, mousePosition.y);
        }
        
        ctx.stroke();
      } else if (currentWall.type === 'bezier' && currentWall.points.length >= 4) {
        // 绘制贝塞尔曲线墙体
        ctx.beginPath();
        let startPoint = currentWall.points[0];
        ctx.moveTo(startPoint.x, startPoint.y);
        
        // 每4个点为一组绘制贝塞尔曲线
        for (let i = 0; i < currentWall.points.length - 3; i += 4) {
          const p0 = currentWall.points[i];     // 起点
          const p1 = currentWall.points[i + 1]; // 控制点1
          const p2 = currentWall.points[i + 2]; // 控制点2
          const p3 = currentWall.points[i + 3]; // 终点
          
          if (p0 && p1 && p2 && p3) {
            ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            
            // 如果还有更多点，移动到下一段的起点
            if (i + 4 < currentWall.points.length) {
              ctx.moveTo(p3.x, p3.y);
            }
          }
        }
        ctx.stroke();
        
        // 绘制未完成的贝塞尔曲线段的辅助线
        const remainingPoints = currentWall.points.length % 4;
        if (remainingPoints > 0) {
          const lastCompleteIndex = Math.floor(currentWall.points.length / 4) * 4;
          ctx.setLineDash([2 / scale, 2 / scale]); // 更细的虚线
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // 红色半透明
          
          ctx.beginPath();
          for (let i = lastCompleteIndex; i < currentWall.points.length - 1; i++) {
            const p1 = currentWall.points[i];
            const p2 = currentWall.points[i + 1];
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
          ctx.stroke();
        }
      }

      // 绘制当前墙体的端点
      ctx.setLineDash([]); // 重置虚线
      ctx.fillStyle = currentWall.color;
      currentWall.points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 为贝塞尔曲线的控制点添加不同的标记
        if (currentWall.type === 'bezier') {
          const pointType = index % 4;
          if (pointType === 1 || pointType === 2) {
            // 控制点用方形标记
            ctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; // 橙色
            ctx.fillRect(point.x - 2 / scale, point.y - 2 / scale, 4 / scale, 4 / scale);
            ctx.fillStyle = currentWall.color; // 恢复原色
          }
        }
      });
    }

    // 地图编辑器风格的虚线预览 - 连线模式下的实时预览线
    if ((isConnecting || continuousConnecting) && mousePositionRef.current) {
      const startPoint = lastConnectedPoint || connectingStartPoint;
      
      if (startPoint) {
        ctx.save();
        ctx.strokeStyle = '#1890ff'; // 蓝色虚线
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([8 / scale, 4 / scale]); // 虚线样式
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(mousePositionRef.current.x, mousePositionRef.current.y);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // 绘制选中墙体的高亮效果
    walls.forEach(wall => {
      if (wall.selected || selectedWalls.includes(wall.id)) {
        ctx.save();
        ctx.strokeStyle = '#1890ff'; // 蓝色高亮
        ctx.lineWidth = 4 / scale; // 更粗的线条
        ctx.setLineDash([]);
        
        if (wall.type === 'line') {
          // 绘制直线墙体高亮
          ctx.beginPath();
          wall.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        } else if (wall.type === 'bezier') {
          // 绘制贝塞尔曲线墙体高亮
          ctx.beginPath();
          let startPoint = wall.points[0];
          ctx.moveTo(startPoint.x, startPoint.y);
          
          for (let i = 0; i < wall.points.length - 3; i += 4) {
            const p0 = wall.points[i];
            const p1 = wall.points[i + 1];
            const p2 = wall.points[i + 2];
            const p3 = wall.points[i + 3];
            
            if (p0 && p1 && p2 && p3) {
              ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
              if (i + 4 < wall.points.length) {
                ctx.moveTo(p3.x, p3.y);
              }
            }
          }
          ctx.stroke();
        }
        
        // 绘制选中墙体的端点
        wall.points.forEach((point, index) => {
          // 检查是否是端点（直线墙体的首尾点，或贝塞尔曲线的关键点）
          const isEndpoint = wall.type === 'line' ? 
            (index === 0 || index === wall.points.length - 1) :
            (index % 4 === 0 || index % 4 === 3);
          
          if (isEndpoint) {
            ctx.fillStyle = '#1890ff';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6 / scale, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加白色边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
          }
        });
        
        // 在编辑模式下显示调整手柄
        if (bezierEditMode.isEditing && bezierEditMode.wallId === wall.id) {
          
          // 调试日志：贝塞尔曲线控制手柄显示条件
          console.log('🟡 控制手柄显示判断:', {
            wallId: wall.id,
            wallType: wall.type,
            bezierEditModeIsEditing: bezierEditMode.isEditing,
            bezierEditModeWallId: bezierEditMode.wallId,
            bezierEditModeActiveControlPoint: bezierEditMode.activeControlPoint,
            bezierEditModeIsDraggingControl: bezierEditMode.isDraggingControl,
            wallPointsLength: wall.points?.length,
            shouldShowControls: true
          });
          
          if (wall.type === 'bezier' && wall.points && wall.points.length >= 4) {
            // 贝塞尔曲线：绘制控制点和控制线（新格式：points包含[起点, 控制点1, 控制点2, 终点]）
            const p0 = wall.points[0]; // 起点
            const p1 = wall.points[1]; // 第一个控制点
            const p2 = wall.points[2]; // 第二个控制点
            const p3 = wall.points[3]; // 终点
            
            // 绘制控制线
            ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([4 / scale, 4 / scale]);
            
            // 起点到第一个控制点的线
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            
            // 终点到第二个控制点的线
            ctx.beginPath();
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            
            // 恢复实线
            ctx.setLineDash([]);
            
            // 绘制控制点
            const controlPointIndex1 = 0;
            const controlPointIndex2 = 1;
            
            // 第一个控制点
            const isActive1 = bezierEditMode.activeControlPoint === controlPointIndex1;
            const radius1 = isActive1 ? 7 / scale : 5 / scale;
            
            // 绘制阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(p1.x + 1 / scale, p1.y + 1 / scale, radius1, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制控制点主体
            ctx.fillStyle = isActive1 ? '#1890ff' : '#faad14';
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, radius1, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制白色边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
            
            // 第二个控制点
            const isActive2 = bezierEditMode.activeControlPoint === controlPointIndex2;
            const radius2 = isActive2 ? 7 / scale : 5 / scale;
            
            // 绘制阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(p2.x + 1 / scale, p2.y + 1 / scale, radius2, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制控制点主体
            ctx.fillStyle = isActive2 ? '#1890ff' : '#faad14';
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, radius2, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制白色边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
          }
        }
        
        ctx.restore();
      }
    });

    // 绘制框选区域
    if (isSelecting && selectionStart && selectionEnd) {
      ctx.save();
      ctx.strokeStyle = '#1890ff';
      ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
      ctx.lineWidth = 1 / scale;
      ctx.setLineDash([5 / scale, 5 / scale]);
      
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      ctx.restore();
    }

    ctx.restore();

    // 绘制新的贝塞尔曲线绘制状态
    if (bezierDrawingState.phase !== 'idle') {
      ctx.save();
      
      // 绘制起点
      if (bezierDrawingState.startPoint) {
        ctx.fillStyle = '#52c41a'; // 绿色起点
        ctx.beginPath();
        ctx.arc(bezierDrawingState.startPoint.x, bezierDrawingState.startPoint.y, 6 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加白色边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
      
      // 绘制终点
      if (bezierDrawingState.endPoint) {
        ctx.fillStyle = '#f5222d'; // 红色终点
        ctx.beginPath();
        ctx.arc(bezierDrawingState.endPoint.x, bezierDrawingState.endPoint.y, 6 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加白色边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
      
      // 绘制控制点
      if (bezierDrawingState.controlPoint1) {
        ctx.fillStyle = bezierDrawingState.activeControlPoint === 1 ? '#1890ff' : '#faad14'; // 蓝色（激活）或橙色（普通）
        ctx.beginPath();
        ctx.arc(bezierDrawingState.controlPoint1.x, bezierDrawingState.controlPoint1.y, 5 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制控制线
        if (bezierDrawingState.startPoint) {
          ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
          ctx.lineWidth = 1 / scale;
          ctx.setLineDash([4 / scale, 4 / scale]);
          ctx.beginPath();
          ctx.moveTo(bezierDrawingState.startPoint.x, bezierDrawingState.startPoint.y);
          ctx.lineTo(bezierDrawingState.controlPoint1.x, bezierDrawingState.controlPoint1.y);
          ctx.stroke();
        }
      }
      
      if (bezierDrawingState.controlPoint2) {
        ctx.fillStyle = bezierDrawingState.activeControlPoint === 2 ? '#1890ff' : '#faad14'; // 蓝色（激活）或橙色（普通）
        ctx.beginPath();
        ctx.arc(bezierDrawingState.controlPoint2.x, bezierDrawingState.controlPoint2.y, 5 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制控制线
        if (bezierDrawingState.endPoint) {
          ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
          ctx.lineWidth = 1 / scale;
          ctx.setLineDash([4 / scale, 4 / scale]);
          ctx.beginPath();
          ctx.moveTo(bezierDrawingState.endPoint.x, bezierDrawingState.endPoint.y);
          ctx.lineTo(bezierDrawingState.controlPoint2.x, bezierDrawingState.controlPoint2.y);
          ctx.stroke();
        }
      }
      
      // 绘制预览贝塞尔曲线
      if (bezierDrawingState.startPoint && bezierDrawingState.endPoint && 
          bezierDrawingState.controlPoint1 && bezierDrawingState.controlPoint2) {
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 3 / scale;
        ctx.setLineDash([8 / scale, 4 / scale]);
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(bezierDrawingState.startPoint.x, bezierDrawingState.startPoint.y);
        ctx.bezierCurveTo(
          bezierDrawingState.controlPoint1.x, bezierDrawingState.controlPoint1.y,
          bezierDrawingState.controlPoint2.x, bezierDrawingState.controlPoint2.y,
          bezierDrawingState.endPoint.x, bezierDrawingState.endPoint.y
        );
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // 绘制绘制状态提示（在世界坐标系外绘制）
    if (isDrawingWall || bezierDrawingState.phase !== 'idle' || bezierEditMode.isEditing) {
      const activeTool = getActiveTool();
      if (activeTool || bezierEditMode.isEditing) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵
        
        // 绘制提示背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        let bgHeight = 85;
        if (bezierDrawingState.phase !== 'idle') {
          bgHeight = 120;
        } else if (bezierEditMode.isEditing) {
          bgHeight = 100;
        }
        ctx.fillRect(10, 10, 300, bgHeight);
        
        // 绘制提示文字
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        
        if (bezierEditMode.isEditing) {
          // 贝塞尔曲线编辑模式提示
          ctx.fillText('贝塞尔曲线编辑模式', 20, 30);
          ctx.fillText('拖拽蓝色控制点调整曲线形状', 20, 50);
          ctx.fillText('双击其他曲线切换编辑对象', 20, 70);
          ctx.fillText('Escape: 退出编辑模式', 20, 90);
        } else if (activeTool) {
          ctx.fillText(`绘制模式: ${activeTool.name}`, 20, 30);
          
          // 根据工具类型显示不同的提示
          if (activeTool.subType === 'line') {
            if (currentWall && currentWall.points.length === 1) {
              ctx.fillText('点击第二个点完成直线', 20, 50);
            } else {
              ctx.fillText('点击第一个点开始绘制', 20, 50);
            }
            ctx.fillText('Escape: 取消绘制', 20, 70);
          } else if (activeTool.subType === 'bezier') {
            // 贝塞尔曲线绘制提示（两点绘制模式）
            if (bezierDrawingState.phase === 'idle') {
              ctx.fillText('点击设置起点', 20, 50);
            } else if (bezierDrawingState.phase === 'drawing') {
              if (!bezierDrawingState.startPoint) {
                ctx.fillText('点击设置起点', 20, 50);
              } else {
                ctx.fillText('点击设置终点（自动生成曲线）', 20, 50);
              }
            }
            ctx.fillText('Escape: 取消绘制', 20, 70);
          } else {
            ctx.fillText('Enter: 完成绘制', 20, 50);
            ctx.fillText('Escape: 取消绘制', 20, 70);
          }
        }
        
        ctx.restore();
      }
    }
    
    // 绘制选择模式提示
    const activeTool = getActiveTool();
    if (activeTool && activeTool.type === 'select') {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵
      
      // 绘制提示背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 90, 220, 70);
      
      // 绘制提示文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText('选择模式: 点击选择墙体', 20, 110);
      ctx.fillText('拖拽: 框选多个墙体', 20, 130);
      ctx.fillText('拖拽端点: 移动墙体端点', 20, 145);
      
      ctx.restore();
    }
  }, [scale, offsetX, offsetY, walls, currentWall, selectedWalls, selectedSegments, isSelecting, selectionStart, selectionEnd, bezierDrawingState]);

  // 画布初始化和重绘
  useEffect(() => {
    drawCanvas();
  }, [scale, offsetX, offsetY, walls, currentWall, mousePosition, selectedWalls, selectedSegments, isSelecting, selectionStart, selectionEnd, bezierDrawingState, drawCanvas]);

  // 监听窗口大小变化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      drawCanvas();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#f5f5f5',
      overflow: 'hidden',
      zIndex: 1
    }}>
      {/* 画布 */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: leftPanelVisible ? '240px' : '0',
          right: rightPanelVisible ? '240px' : '0',
          width: leftPanelVisible && rightPanelVisible ? 'calc(100% - 480px)' : 
                 leftPanelVisible || rightPanelVisible ? 'calc(100% - 240px)' : '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#f5f5f5',
          display: 'block',
          zIndex: 5
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
      />

      {/* 中间悬浮控制栏 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: leftPanelVisible && rightPanelVisible ? 'calc(240px + (100vw - 480px) / 2)' :
              leftPanelVisible ? 'calc(240px + (100vw - 240px) / 2)' :
              rightPanelVisible ? 'calc((100vw - 240px) / 2)' : '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px'
      }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            size="small"
            type="text"
            onClick={handleBack}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            返回
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            size="small"
            type="text"
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            刷新
          </Button>
          <Button 
            icon={<HomeOutlined />} 
            size="small"
            type="text"
            onClick={resetView}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            重置视图
          </Button>
          <Button 
            icon={<VerticalAlignTopOutlined />}
            size="small"
            type="text"
            onClick={handleTopView}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            顶视图
          </Button>
          <Button 
            icon={<BorderOutlined />}
            size="small"
            type="text"
            onClick={handleFrontView}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            正视图
          </Button>
          <Button 
            icon={allPanelsVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            size="small"
            type="text"
            onClick={toggleAllPanels}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {allPanelsVisible ? '隐藏全部' : '显示全部'}
          </Button>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            size="small"
            type="text"
            onClick={toggleFullscreen}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </Space>
      </div>

      {/* 左侧产品模型管理面板 */}
      {leftPanelVisible && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          bottom: '0',
          width: '240px',
          height: '100%',
          background: '#ffffff',
          borderRight: '1px solid #e8e8e8',
          zIndex: 5,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            background: 'rgba(24, 144, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <Space>
                <AppstoreOutlined style={{ color: '#1890ff' }} />
                <Text style={{ fontWeight: 'bold', color: '#1890ff' }}>产品模型管理</Text>
              </Space>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleLeftPanel}
              />
            </div>
            <Input.Search
               placeholder="搜索产品模型..."
               value={modelSearchText}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelSearchText(e.target.value)}
               size="small"
               allowClear
               style={{ width: '100%' }}
             />
          </div>
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 65px)',
            overflow: 'auto'
          }}>
            <List
              dataSource={getFilteredModels()}
              renderItem={(model: ProductModel) => (
                <List.Item
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1890ff'
                      }}>
                        {model.icon}
                      </div>
                    }
                    title={
                      <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                        {model.name}
                      </Text>
                    }
                    description={
                      <Text style={{ fontSize: '11px', color: '#666' }}>
                        {model.description}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      )}

      {/* 楼层切换和设置按钮组 */}
      {rightPanelVisible && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '260px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* 楼层切换按钮 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '8px 10px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
          }}>
            <Space direction="vertical" size={6} style={{ alignItems: 'center' }}>
              <Text style={{ 
                fontSize: '11px', 
                color: '#666', 
                fontWeight: 600,
                textAlign: 'center',
                display: 'block'
              }}>
                楼层
              </Text>
              <Space direction="vertical" size={4}>
                {floorScenes.map((scene) => (
                  <Button
                    key={scene.id}
                    type={currentFloor === scene.id ? 'primary' : 'default'}
                    size="small"
                    style={{
                      width: '36px',
                      height: '24px',
                      fontSize: '11px',
                      fontWeight: currentFloor === scene.id ? 600 : 500,
                      borderRadius: '8px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: currentFloor === scene.id ? 'none' : '1px solid #e8e8e8',
                      boxShadow: currentFloor === scene.id ? '0 1px 6px rgba(24, 144, 255, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0',
                    }}
                    onClick={() => switchFloor(scene.id)}
                    onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                      if (currentFloor !== scene.id) {
                        e.currentTarget.style.transform = 'scale(1.05) translateX(1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                      if (currentFloor !== scene.id) {
                        e.currentTarget.style.transform = 'scale(1) translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {scene.name}
                  </Button>
                ))}
              </Space>
            </Space>
          </div>

          {/* 设置按钮 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
          }}>
            <Button
              type="default"
              icon={<SettingOutlined />}
              size="small"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '24px',
                width: '36px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => openSceneListModal()}
               onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                 e.currentTarget.style.transform = 'scale(1.05) translateX(1px)';
                 e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                 e.currentTarget.style.borderColor = '#1890ff';
               }}
               onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                 e.currentTarget.style.transform = 'scale(1) translateX(0)';
                 e.currentTarget.style.boxShadow = 'none';
                 e.currentTarget.style.borderColor = '#e8e8e8';
               }}
            />
          </div>
        </div>
      )}

      {/* 右侧绘图工具面板 */}
      {rightPanelVisible && (
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          bottom: '0',
          width: '240px',
          height: '100%',
          background: '#ffffff',
          borderLeft: '1px solid #e8e8e8',
          zIndex: 5,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            background: 'rgba(24, 144, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <Space>
                <ToolOutlined style={{ color: '#1890ff' }} />
                <Text style={{ fontWeight: 'bold', color: '#1890ff' }}>绘图工具</Text>
              </Space>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleRightPanel}
              />
            </div>
          </div>
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 65px)',
            overflow: 'auto'
          }}>
            {drawingTools.map((tool) => (
              <Card
                key={tool.id}
                size="small"
                style={{
                  marginBottom: '12px',
                  cursor: 'pointer',
                  border: tool.active ? '2px solid #1890ff' : '1px solid #e8e8e8',
                  backgroundColor: tool.active ? 'rgba(24, 144, 255, 0.05)' : '#ffffff'
                }}
                onClick={() => selectDrawingTool(tool.id)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: tool.active ? '#1890ff' : 'rgba(24, 144, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tool.active ? '#ffffff' : '#1890ff'
                  }}>
                    {tool.icon}
                  </div>
                  <div>
                    <Text style={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      color: tool.active ? '#1890ff' : '#333'
                    }}>
                      {tool.name}
                    </Text>
                    <div>
                      <Text style={{ fontSize: '11px', color: '#666' }}>
                        {tool.description}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {/* 墙体样式配置区域 */}
            {getActiveTool()?.type === 'wall' && (
              <>
                <Divider style={{ margin: '16px 0 12px 0' }}>
                  <Text style={{ fontSize: '12px', color: '#666' }}>墙体样式</Text>
                </Divider>
                
                <Card size="small" style={{ marginBottom: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                      厚度 (px)
                    </Text>
                    <Input
                      type="number"
                      size="small"
                      value={wallStyle.thickness}
                      min={1}
                      max={50}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWallStyle(prev => ({
                       ...prev,
                       thickness: parseInt(e.target.value) || 1
                     }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div>
                    <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                      颜色
                    </Text>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['#333333', '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'].map(color => (
                        <div
                          key={color}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: wallStyle.color === color ? '2px solid #1890ff' : '1px solid #e8e8e8',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => setWallStyle(prev => ({
                            ...prev,
                            color: color
                          }))}
                        />
                      ))}
                    </div>
                    <Input
                      size="small"
                      value={wallStyle.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWallStyle(prev => ({
                       ...prev,
                       color: e.target.value
                     }))}
                      style={{ width: '100%', marginTop: '6px' }}
                      placeholder="自定义颜色 (#hex)"
                    />
                  </div>
                </Card>
                
                {/* 墙体操作按钮 */}
                 <Card size="small" style={{ marginBottom: '12px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>


                   </div>
                 </Card>
                 

              </>
            )}
          </div>
        </div>
      )}

      {/* 场景列表对话框 */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>场景管理</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={openNewSceneModal}
              style={{
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                fontSize: '12px'
              }}
            >
              新增场景
            </Button>
          </div>
        }
        open={sceneListModalVisible}
        onCancel={() => setSceneListModalVisible(false)}
        footer={null}
        width={600}
      >
        {/* 场景列表 */}
        <div>
          <List
            dataSource={floorScenes}
            renderItem={(scene: FloorScene) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditSceneModal(scene)}
                  >
                    编辑
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteScene(scene.id)}
                    disabled={floorScenes.length <= 1}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={scene.name}
                  description={
                    scene.dataSource 
                      ? mockMapData.find(map => map.id === scene.dataSource)?.name || `${scene.floor}楼`
                      : `${scene.floor}楼`
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>

      {/* 新增/编辑场景对话框 */}
      <Modal
        title={editingScene ? '编辑场景' : '新增场景'}
        open={newSceneModalVisible}
        onOk={saveScene}
        onCancel={() => {
          setNewSceneModalVisible(false);
          setEditingScene(null);
          setSelectedMapId(null);
          setAvailableBaseMaps([]);
          setInitializeDevicesValue(true); // 重置初始化设备状态
          sceneForm.resetFields();
        }}
        width={500}
      >
        <Form
          form={sceneForm}
          layout="vertical"
          initialValues={{
            floor: floorScenes.length + 1
          }}
        >
          <Form.Item
            label="场景名称"
            name="name"
            rules={[{ required: true, message: '请输入场景名称' }]}
          >
            <Input placeholder="例如：1楼、2楼、3楼" />
          </Form.Item>
          
          <Form.Item
            label="楼层编号"
            name="floor"
            rules={[{ required: true, message: '请输入楼层编号' }]}
          >
            <Input type="number" placeholder="请输入楼层编号" />
          </Form.Item>
          
          <Form.Item
            label="场景基础数据源"
            name="dataSource"
            rules={[{ required: true, message: '请选择场景基础数据源' }]}
          >
            <Select 
               placeholder="请选择地图数据源"
               onChange={handleMapChange}
             >
              {mockMapData.map(map => (
                <Option key={map.id} value={map.id}>
                  {map.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="底图选择"
            name="baseMap"
            rules={[{ required: true, message: '请选择底图' }]}
          >
            <Select 
               placeholder="请先选择地图数据源"
               disabled={!selectedMapId || availableBaseMaps.length === 0}
               onChange={handleBaseMapChange}
             >
              {availableBaseMaps.map(baseMap => (
                <Option key={baseMap.id} value={baseMap.id}>
                  {baseMap.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="是否初始化地图关联设备"
            name="initializeDevices"
            rules={[{ required: true, message: '请选择是否初始化地图关联设备' }]}
            initialValue={true}
          >
            <Select 
              placeholder="请选择是否初始化设备"
              onChange={handleInitializeDevicesChange}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          
          {initializeDevicesValue === false && (
            <Form.Item
              label="是否增量更新"
              name="increaseUpdate"
              rules={[{ required: true, message: '请选择是否增量更新' }]}
              initialValue={false}
            >
              <Select placeholder="请选择是否增量更新">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 墙体属性设置面板 */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>墙体属性设置</span>
          </div>
        }
        open={showPropertiesPanel}
        onCancel={closePropertiesPanel}
        footer={[
          <Button key="cancel" onClick={closePropertiesPanel}>
            取消
          </Button>,
          <Button 
            key="delete" 
            danger 
            onClick={() => {
              deleteSelectedWalls();
              closePropertiesPanel();
            }}
          >
            删除墙体
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => {
              propertiesForm.submit();
            }}
          >
            应用更改
          </Button>,
        ]}
        width={500}
      >
        <Form
           form={propertiesForm}
           layout="vertical"
           onFinish={(values: any) => {
             updateWallProperties(values);
             closePropertiesPanel();
           }}
         >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="宽度 (X轴)"
                name="width"
                rules={[{ required: true, message: '请输入宽度' }]}
              >
                <Input 
                  type="number" 
                  placeholder="单位：米" 
                  min={0.1}
                  step={0.1}
                  suffix="m"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="厚度 (Y轴)"
                name="thickness"
                rules={[{ required: true, message: '请输入厚度' }]}
              >
                <Input 
                  type="number" 
                  placeholder="单位：米" 
                  min={0.01}
                  step={0.01}
                  suffix="m"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="高度 (Z轴)"
            name="height"
            rules={[{ required: true, message: '请输入高度' }]}
          >
            <Input 
              type="number" 
              placeholder="单位：米" 
              min={0.1}
              step={0.1}
              suffix="m"
            />
          </Form.Item>
          
          <Form.Item
            label="墙体颜色"
            name="color"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#333333', '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'].map(color => (
                  <div
                    key={color}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: propertiesFormData?.color === color ? '3px solid #1890ff' : '2px solid #e8e8e8',
                       boxSizing: 'border-box',
                       transition: 'all 0.2s ease'
                     }}
                     onClick={() => {
                       setPropertiesFormData(prev => prev ? { ...prev, color } : null);
                       propertiesForm.setFieldsValue({ color });
                     }}
                  />
                ))}
              </div>
              <Input
                 placeholder="自定义颜色 (#hex)"
                 value={propertiesFormData?.color || ''}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                   const color = e.target.value;
                   setPropertiesFormData(prev => prev ? { ...prev, color } : null);
                   propertiesForm.setFieldsValue({ color });
                 }}
               />
            </div>
          </Form.Item>
          
          <Form.Item
            label="墙体类型"
            name="type"
          >
            <Select placeholder="选择墙体类型">
              <Option value="line">直线墙体</Option>
              <Option value="bezier">曲线墙体</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DigitalTwinEditor;