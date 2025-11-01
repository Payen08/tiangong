import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Tooltip,
  Radio,
  Input,
  message,
  Popover,
  Switch,
  Tabs,
  Collapse,
  Badge,
  Modal,
  List,
  Typography,
  Row,
  Col,
  Cascader,
  Slider,
  Table,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { ChangeEvent } from 'react';
import {
  DragOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
  AppstoreOutlined,


  EyeInvisibleOutlined,
  EnvironmentOutlined,
  CarOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  LineOutlined,
  BgColorsOutlined,
  BorderOutlined,
  StopOutlined,
  SettingOutlined,
  DotChartOutlined,
  ApartmentOutlined,

  DeleteOutlined,

  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  UpOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  AimOutlined,
  SendOutlined,
  LoadingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RadarChartOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { isDev } from '@/lib/utils';

// 地图点数据类型
interface MapPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  type: '站点' | '停靠点' | '充电点' | '临停点';
  color: string;
  direction?: number;
  isDisabled?: boolean;
  noUturn?: boolean;
  baseMapId?: string;
  routeNetworkGroupId?: string;
}

// 地图线条数据类型
interface MapLine {
  id: string;
  name: string;
  startPointId: string;
  endPointId: string;
  type: '直线' | '曲线' | '双向直线' | '双向曲线';
  color: string;
  width: number;
  direction?: number;
  speed?: number;
  isDisabled?: boolean;
  controlPoints?: {
    cp1?: { x: number; y: number };
    cp2?: { x: number; y: number };
  };
}

// 地图区域数据类型
interface MapArea {
  id: string;
  name: string;
  type: '工作区域' | '禁行区域' | '调速区域' | '多路网区';
  points: { x: number; y: number }[];
  color: string;
  fillOpacity: number;
  fillColor?: string;
  strokeColor?: string;
  speed?: number;
}

// 地图列表数据类型
interface MapListItem {
  id: string;
  name: string;
  fileCount: number;
  description: string;
  createTime: string;
}

// 地图文件数据类型
interface MapFileItem {
  id: string;
  name: string;
  size: string;
  lastModified: string;
}

// 任务相关接口定义
interface Task {
  id: string;
  name: string;
  type: 'navigation' | 'patrol' | 'cleaning' | 'delivery';
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  description: string;
  targetPoint?: string;
  route?: string[];
  errorMessage?: string;
}

// 设备任务接口定义 - 用于任务标签页


// 雷达相关接口定义
interface RadarObstacle {
  id: string;
  x: number;
  y: number;
  distance: number;
  angle: number;
  intensity: number;
  timestamp: number;
}

interface RadarScanData {
  centerX: number;
  centerY: number;
  direction: number;
  scanRadius: number;
  scanAngle: number;
  obstacles: RadarObstacle[];
  timestamp: number;
}

// 组件属性接口
interface DeviceMapEditorProps {
  deviceId: string;
  deviceName: string;
  currentPosition?: { x: number; y: number };
  mapName?: string;
}

const DeviceMapEditor: React.FC<DeviceMapEditorProps> = ({
  // @ts-ignore - deviceId is required by interface but not used in current implementation
  deviceId,
  deviceName,
  currentPosition,
  mapName = '设备地图'
}) => {
  // 工具选择状态 - 扩展更多工具类型
  const [selectedTool, setSelectedTool] = useState<string>('select');
  
  // 右侧面板标签页状态
  const [activeTabKey, setActiveTabKey] = useState<string>('tools');
  
  // 地图类型状态
  const [mapType, setMapType] = useState<'color' | 'blackwhite'>('color');
  
  // 当前模式状态 - 默认为阅览模式
  const [currentMode, setCurrentMode] = useState<string>('view');
  
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [mapLines, setMapLines] = useState<MapLine[]>([]);
  const [mapAreas, setMapAreas] = useState<MapArea[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  // @ts-ignore - selectedAreas is used in setSelectedAreas but not read directly
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  // 画布拖动和缩放相关状态
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [dragTool, setDragTool] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // 鼠标位置状态
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  
  // 显示控制状态
  const [hideAllPoints, setHideAllPoints] = useState(false);
  const [hideAllPaths, setHideAllPaths] = useState(false);
  const [hideAllPointNames, setHideAllPointNames] = useState(false);
  const [hideAllPathNames, setHideAllPathNames] = useState(false);

  
  // 地图元素显示控制状态

  
  // 元素隐藏控制状态
  const [hideStationNames, setHideStationNames] = useState(false);
  
  // 窗口高度状态，用于面板高度自适应
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  // 画布容器高度状态
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  // 面板显示隐藏状态
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [hideDockNames, setHideDockNames] = useState(false);
  const [hideChargeNames, setHideChargeNames] = useState(false);
  const [hideTempNames, setHideTempNames] = useState(false);
  const [hidePathNames, setHidePathNames] = useState(false);
  const [hideAreaNames, setHideAreaNames] = useState(false);
  const [hideDeviceNames, setHideDeviceNames] = useState(false);
  
  // 搜索相关状态
  const [searchType, setSearchType] = useState<'line' | 'point'>('point');
  const [searchValue, setSearchValue] = useState('');

  // 任务相关状态
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [taskDiagnosisVisible, setTaskDiagnosisVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);



  // 撤销重做相关状态
  const [history, setHistory] = useState<{
    mapPoints: MapPoint[];
    mapLines: MapLine[];
    mapAreas: MapArea[];
  }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 地图管理弹窗状态
  const [mapManagementVisible, setMapManagementVisible] = useState(false);
  const [selectedMapList, setSelectedMapList] = useState<string | null>(null);

  // 地图切换状态
  const [currentMapSelection, setCurrentMapSelection] = useState<string[]>([]);

  // 框选相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 地图管理数据
  const [mapLists, setMapLists] = useState<MapListItem[]>([
    {
      id: '1',
      name: '一楼地图组',
      description: '一楼所有区域地图',
      fileCount: 3,
      createTime: '2024-01-15 09:30:00'
    },
    {
      id: '2', 
      name: '二楼地图组',
      description: '二楼所有区域地图',
      fileCount: 2,
      createTime: '2024-01-16 10:15:00'
    },
    {
      id: '3',
      name: '仓库地图组', 
      description: '仓库区域地图',
      fileCount: 4,
      createTime: '2024-01-17 08:45:00'
    }
  ]);

  const [mapFiles, setMapFiles] = useState<{[key: string]: MapFileItem[]}>({
    '1': [
      { id: 'f1', name: '一楼-A区域.map', size: '2.3MB', lastModified: '2024-01-15 10:35:00' },
      { id: 'f2', name: '一楼-B区域.map', size: '1.8MB', lastModified: '2024-01-15 11:20:00' },
      { id: 'f3', name: '一楼-C区域.map', size: '3.1MB', lastModified: '2024-01-15 15:45:00' }
    ],
    '2': [
      { id: 'f4', name: '二楼-东区.map', size: '2.7MB', lastModified: '2024-01-16 14:25:00' },
      { id: 'f5', name: '二楼-西区.map', size: '2.2MB', lastModified: '2024-01-16 16:10:00' }
    ],
    '3': [
      { id: 'f6', name: '仓库-入口区.map', size: '1.5MB', lastModified: '2024-01-17 09:20:00' },
      { id: 'f7', name: '仓库-存储区.map', size: '4.2MB', lastModified: '2024-01-17 10:30:00' },
      { id: 'f8', name: '仓库-出货区.map', size: '2.8MB', lastModified: '2024-01-17 11:45:00' },
      { id: 'f9', name: '仓库-办公区.map', size: '1.9MB', lastModified: '2024-01-17 14:20:00' }
    ]
  });

  // 创建级联选择器的数据结构
  const cascaderOptions = mapLists.map(mapList => ({
    value: mapList.id,
    label: mapList.name,
    children: mapFiles[mapList.id]?.map(file => ({
      value: file.id,
      label: file.name,
    })) || []
  }));

  // 地图切换处理函数
  const handleMapChange = (value: string[], selectedOptions?: any[]) => {
    setCurrentMapSelection(value);
    if (selectedOptions && selectedOptions.length === 2) {
      const mapName = selectedOptions[0].label;
      const fileName = selectedOptions[1].label;
      message.success(`已切换到地图: ${mapName} - ${fileName}`);
    }
  };
  
  // 地图元素展开状态管理
  // 地图元素展开状态
  const [mapElementActiveKey, setMapElementActiveKey] = useState<string | string[]>([]);

  // 机器人控制相关状态
  const [isManualControlEnabled, setIsManualControlEnabled] = useState(false);
  const [controlSpeed, setControlSpeed] = useState(50); // 控制速度 0-100
  const [isMoving, setIsMoving] = useState(false);
  const [currentDirection, setCurrentDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  
  // 添加定时器引用用于长按控制
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 扫图功能相关状态
  const [isScanEnabled, setIsScanEnabled] = useState(false); // 扫图模式开关
  const [scanSpeed, setScanSpeed] = useState(50); // 扫图速度 0-100
  const [isScanMoving, setIsScanMoving] = useState(false); // 是否正在扫图移动
  const [scanDirection, setScanDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null); // 扫图移动方向

  // 站点采样功能相关状态
  const [isSampleEnabled, setIsSampleEnabled] = useState(false); // 站点采样模式开关
  const [sampleSpeed, setSampleSpeed] = useState(50); // 采样移动速度 0-100
  const [isSampleMoving, setIsSampleMoving] = useState(false); // 是否正在采样移动
  const [sampleDirection, setSampleDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null); // 采样移动方向

  // 定位功能相关状态
  const [isPositioningEnabled, setIsPositioningEnabled] = useState(false); // 定位模式开关
  const [positioningMode, setPositioningMode] = useState<'manual' | 'auto'>('manual'); // 定位模式：手动/自动
  const [isManualPositioning, setIsManualPositioning] = useState(false); // 是否正在手动定位
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null); // 拖动起始点
  const [dragCurrentPoint, setDragCurrentPoint] = useState<{ x: number; y: number } | null>(null); // 拖动当前点
  const [isPositioning, setIsPositioning] = useState(false); // 是否正在定位中

  // 雷达时图相关状态
  const [isRadarEnabled, setIsRadarEnabled] = useState(false); // 雷达时图开关
  const [radarScanData, setRadarScanData] = useState<RadarScanData | null>(null); // 雷达扫描数据
  const [radarUpdateInterval, setRadarUpdateInterval] = useState<NodeJS.Timeout | null>(null); // 雷达更新定时器
  
  // 车载跟随相关状态
  const [isVehicleFollowEnabled, setIsVehicleFollowEnabled] = useState(false);
  const [lastFollowPosition, setLastFollowPosition] = useState<{ x: number; y: number } | null>(null);
  
  // AGV动态移动模拟状态
  const [simulatedPosition, setSimulatedPosition] = useState<{ x: number; y: number } | null>(null);
  const [agvDirection, setAgvDirection] = useState(0); // AGV朝向角度（度）
  const [agvSpeed, setAgvSpeed] = useState(2); // AGV移动速度（像素/帧）
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null); // 模拟定时器引用
  
  // 手动控制状态
  const [isManualControlActive, setIsManualControlActive] = useState(false);
  
  // 地图偏移状态 - 用于车载跟随时移动地图而非画布
  const [mapOffset, setMapOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // 画布引用
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 计数器
  const [pointCounter, setPointCounter] = useState(1);

  // 监听窗口大小变化，用于面板高度自适应
  useEffect(() => {
    const updateDimensions = () => {
      setWindowHeight(window.innerHeight);
      
      // 计算画布容器的实际尺寸
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasHeight(rect.height);
        setCanvasWidth(rect.width);
      }
    };

    // 初始化时计算一次
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 监听画布容器的变化，确保面板高度正确计算
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasHeight(rect.height);
        setCanvasWidth(rect.width);
      }
    };

    // 使用 ResizeObserver 监听画布容器大小变化
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    // 延迟计算，确保DOM完全渲染
    const timer = setTimeout(updateCanvasSize, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
    };
  }, []);

  // 初始化模拟数据
  useEffect(() => {
    const mockPoints: MapPoint[] = [
      {
        id: '1',
        name: '站点1',
        x: 100,
        y: 100,
        type: '站点',
        color: '#1890ff',
        direction: 0,
        isDisabled: false,
        noUturn: false,
        baseMapId: 'map1',
        routeNetworkGroupId: 'group1'
      },
      {
        id: '2',
        name: '充电点1',
        x: 300,
        y: 150,
        type: '充电点',
        color: '#52c41a',
        direction: 0,
        isDisabled: false,
        noUturn: false,
        baseMapId: 'map1',
        routeNetworkGroupId: 'group1'
      },
      {
        id: '3',
        name: '停靠点1',
        x: 200,
        y: 250,
        type: '停靠点',
        color: '#faad14',
        direction: 0,
        isDisabled: false,
        noUturn: false,
        baseMapId: 'map1',
        routeNetworkGroupId: 'group1'
      }
    ];

    const mockLines: MapLine[] = [
      {
        id: '1',
        name: '路径1',
        startPointId: '1',
        endPointId: '2',
        type: '直线',
        color: '#1890ff',
        width: 2,
        direction: 0,
        speed: 1.0,
        isDisabled: false
      },
      {
        id: '2',
        name: '路径2',
        startPointId: '2',
        endPointId: '3',
        type: '直线',
        color: '#1890ff',
        width: 2,
        direction: 0,
        speed: 1.0,
        isDisabled: false
      }
    ];

    // 模拟任务数据
    const mockActiveTasks: Task[] = [
      {
        id: '1',
        name: '导航任务-前往充电点',
        type: 'navigation',
        status: 'running',
        progress: 65,
        startTime: '2024-01-20 14:30:00',
        description: '设备正在前往充电点1进行充电',
        targetPoint: '充电点1',
        route: ['站点1', '停靠点1', '充电点1']
      },
      {
        id: '2',
        name: '巡检任务-区域A',
        type: 'patrol',
        status: 'paused',
        progress: 30,
        startTime: '2024-01-20 13:15:00',
        description: '区域A的定期巡检任务，已暂停',
        route: ['站点1', '停靠点1', '站点2']
      }
    ];

    const mockTaskHistory: Task[] = [
      {
        id: '3',
        name: '清洁任务-办公区',
        type: 'cleaning',
        status: 'completed',
        progress: 100,
        startTime: '2024-01-20 10:00:00',
        endTime: '2024-01-20 12:30:00',
        description: '办公区域清洁任务已完成',
        targetPoint: '办公区'
      },
      {
        id: '4',
        name: '配送任务-文件传递',
        type: 'delivery',
        status: 'failed',
        progress: 45,
        startTime: '2024-01-20 09:00:00',
        endTime: '2024-01-20 09:30:00',
        description: '文件配送任务执行失败',
        targetPoint: '接收点B',
        errorMessage: '目标点不可达：路径被阻塞，传感器检测到障碍物无法绕行'
      },
      {
        id: '5',
        name: '导航任务-返回基站',
        type: 'navigation',
        status: 'cancelled',
        progress: 20,
        startTime: '2024-01-19 17:45:00',
        endTime: '2024-01-19 17:50:00',
        description: '返回基站任务被用户取消',
        targetPoint: '基站'
      }
    ];

    setMapPoints(mockPoints);
    setMapLines(mockLines);
    setActiveTasks(mockActiveTasks);
    setTaskHistory(mockTaskHistory);
    setPointCounter(mockPoints.length + 1);
  }, []);

  // 快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 只在没有输入框聚焦时处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // 处理撤销重做快捷键
      if ((e.ctrlKey || e.metaKey) && currentMode === 'edit') {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if ((e.key.toLowerCase() === 'y') || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
          return;
        }
      }
      
      switch (e.key.toLowerCase()) {
        case 'q':
          setSelectedTool('select');
          break;
        case 'w':
          setSelectedTool('station');
          break;
        case 'e':
          setSelectedTool('dock');
          break;
        case 'h':
          setSelectedTool('charge');
          break;
        case 'm':
          setSelectedTool('temp');
          break;
        case 'd':
          setSelectedTool('doubleStraight');
          break;
        case 's':
          setSelectedTool('singleStraight');
          break;
        case 'b':
          setSelectedTool('doubleCurve');
          break;
        case 'c':
          setSelectedTool('singleCurve');
          break;
        case 'a':
          setSelectedTool('speedArea');
          break;
        case 'f':
          setSelectedTool('forbiddenArea');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 绘制网格
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas || !canvasRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = canvasRef.current.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseGridSize = 20;
    let gridSize = baseGridSize * canvasScale;

    if (gridSize < 10) {
      gridSize = baseGridSize * canvasScale * 5;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const offsetX = (centerX + canvasOffset.x) % gridSize;
    const offsetY = (centerY + canvasOffset.y) % gridSize;

    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = offsetX - gridSize; x < canvas.width + gridSize; x += gridSize) {
      if (x >= 0 && x <= canvas.width) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
    }

    for (let y = offsetY - gridSize; y < canvas.height + gridSize; y += gridSize) {
      if (y >= 0 && y <= canvas.height) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
    }

    ctx.stroke();
  }, [canvasScale, canvasOffset]);

  // 监听画布状态变化，重新绘制网格
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // 监听面板显示状态变化，重新绘制网格
  useEffect(() => {
    const timer = setTimeout(() => {
      drawGrid();
    }, 100); // 延迟一点时间确保DOM更新完成
    return () => clearTimeout(timer);
  }, [showLeftPanel, showRightPanel, drawGrid]);

  // 屏幕坐标转画布坐标
  const screenToCanvasCoordinates = (screenX: number, screenY: number, canvasElement: HTMLDivElement) => {
    const rect = canvasElement.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;

    const canvasX = relativeX / canvasScale - canvasOffset.x;
    const canvasY = relativeY / canvasScale - canvasOffset.y;

    return { x: canvasX, y: canvasY };
  };

  // 画布拖动处理
  const handleCanvasDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragTool && !isSpacePressed) return;

    setIsDragging(true);

    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = { ...canvasOffset };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setCanvasOffset({
        x: startOffset.x + deltaX,
        y: startOffset.y + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 画布缩放处理
  const handleCanvasZoom = (delta: number) => {
    const newScale = Math.max(0.1, Math.min(3, canvasScale + delta));
    setCanvasScale(newScale);
  };

  const handleZoomIn = () => {
    handleCanvasZoom(0.1);
  };

  const handleZoomOut = () => {
    handleCanvasZoom(-0.1);
  };

  const handleResetCanvas = () => {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  // 面板显示隐藏切换函数
  const toggleLeftPanel = () => {
    setShowLeftPanel(!showLeftPanel);
  };

  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  const toggleBothPanels = () => {
    const newState = !(showLeftPanel && showRightPanel);
    setShowLeftPanel(newState);
    setShowRightPanel(newState);
  };

  // 保存历史记录
  const saveToHistory = useCallback(() => {
    const currentState = {
      mapPoints: [...mapPoints],
      mapLines: [...mapLines],
      mapAreas: [...mapAreas]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // 限制历史记录数量，避免内存过多占用
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [mapPoints, mapLines, mapAreas, history, historyIndex]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      setMapPoints(previousState.mapPoints);
      setMapLines(previousState.mapLines);
      setMapAreas(previousState.mapAreas);
      setHistoryIndex(newIndex);
      
      message.success('已撤销上一步操作');
    }
  }, [history, historyIndex]);

  // 重做操作
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      setMapPoints(nextState.mapPoints);
      setMapLines(nextState.mapLines);
      setMapAreas(nextState.mapAreas);
      setHistoryIndex(newIndex);
      
      message.success('已重做操作');
    }
  }, [history, historyIndex]);

  // 画布点击处理
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragTool || isSpacePressed) return;

    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);

    // 在黑白底图模式下，除了选择工具外，其他工具都被禁用
    if (mapType === 'blackwhite' && selectedTool !== 'select') {
      message.warning('黑白底图模式下，绘图工具被禁用');
      return;
    }

    switch (selectedTool) {
      case 'station': {
        const newStation: MapPoint = {
          id: Date.now().toString(),
          name: `站点${pointCounter}`,
          x,
          y,
          type: '站点',
          color: '#1890ff',
          direction: 0,
          isDisabled: false,
          noUturn: false,
          baseMapId: 'map1',
          routeNetworkGroupId: 'group1'
        };
        setMapPoints(prev => [...prev, newStation]);
        setPointCounter(prev => prev + 1);
        // 保存到历史记录
        setTimeout(() => saveToHistory(), 0);
        break;
      }

      case 'dock': {
        const newDock: MapPoint = {
          id: Date.now().toString(),
          name: `停靠点${pointCounter}`,
          x,
          y,
          type: '停靠点',
          color: '#faad14',
          direction: 0,
          isDisabled: false,
          noUturn: false,
          baseMapId: 'map1',
          routeNetworkGroupId: 'group1'
        };
        setMapPoints(prev => [...prev, newDock]);
        setPointCounter(prev => prev + 1);
        // 保存到历史记录
        setTimeout(() => saveToHistory(), 0);
        break;
      }

      case 'charge': {
        const newCharge: MapPoint = {
          id: Date.now().toString(),
          name: `充电点${pointCounter}`,
          x,
          y,
          type: '充电点',
          color: '#52c41a',
          direction: 0,
          isDisabled: false,
          noUturn: false,
          baseMapId: 'map1',
          routeNetworkGroupId: 'group1'
        };
        setMapPoints(prev => [...prev, newCharge]);
        setPointCounter(prev => prev + 1);
        // 保存到历史记录
        setTimeout(() => saveToHistory(), 0);
        break;
      }

      case 'temp': {
        const newTemp: MapPoint = {
          id: Date.now().toString(),
          name: `临停点${pointCounter}`,
          x,
          y,
          type: '临停点',
          color: '#ff4d4f',
          direction: 0,
          isDisabled: false,
          noUturn: false,
          baseMapId: 'map1',
          routeNetworkGroupId: 'group1'
        };
        setMapPoints(prev => [...prev, newTemp]);
        setPointCounter(prev => prev + 1);
        // 保存到历史记录
        setTimeout(() => saveToHistory(), 0);
        break;
      }

      case 'doubleStraight':
      case 'singleStraight':
      case 'doubleCurve':
      case 'singleCurve':
        // 线条绘制需要两个点，这里可以添加线条绘制逻辑
        message.info('请先选择起点，然后选择终点来绘制线条');
        break;

      case 'speedArea':
      case 'forbiddenArea':
        // 区域绘制需要多个点，这里可以添加区域绘制逻辑
        message.info('请点击多个点来绘制区域，右键完成绘制');
        break;

      case 'select':
        // 选择工具的处理逻辑
        break;

      default:
        break;
    }
  };

  // 画布鼠标移动处理
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    // 更新鼠标位置显示
    setMousePosition({ x, y });

    // 处理框选移动
    if (isSelecting && selectedTool === 'select' && currentMode === 'edit') {
      handleSelectionMove(event);
    }
  };

  // 画布鼠标离开处理
  const handleCanvasMouseLeave = () => {
    setMousePosition(null);
  };

  // 搜索功能
  const handleSearch = (value: string) => {
    if (!value.trim()) {
      message.info('请输入搜索内容');
      return;
    }

    if (searchType === 'point') {
      const foundPoint = mapPoints.find(point => 
        point.name.toLowerCase().includes(value.toLowerCase())
      );
      if (foundPoint) {
        setSelectedPoints([foundPoint.id]);
        message.success(`找到点: ${foundPoint.name}`);
      } else {
        message.warning('未找到匹配的点');
      }
    } else {
      const foundLine = mapLines.find(line => 
        line.name.toLowerCase().includes(value.toLowerCase())
      );
      if (foundLine) {
        setSelectedLines([foundLine.id]);
        message.success(`找到路径: ${foundLine.name}`);
      } else {
        message.warning('未找到匹配的路径');
      }
    }
  };

  // 处理节点列表点击 - 定位到地图上
  const handleNodeListClick = (pointId: string) => {
    const point = mapPoints.find(p => p.id === pointId);
    if (point) {
      setSelectedPoints([pointId]);
      // 可以添加画布自动居中到该点的逻辑
      message.success(`已定位到节点: ${point.name}`);
    }
  };

  // 拖动工具切换
  const toggleDragTool = () => {
    setDragTool(!dragTool);
  };

  // 生成模拟雷达数据
  const generateRadarData = useCallback((): RadarScanData | null => {
    // 优先使用simulatedPosition，如果不存在则使用currentPosition
    const position = simulatedPosition || currentPosition;
    if (!position) return null;

    const now = Date.now();
    const scanRadius = 150; // 雷达扫描半径（像素）
    const scanAngle = 120; // 雷达扫描角度（度）
    
    // 模拟雷达方向（随时间缓慢旋转）
    const direction = (now / 50) % 360;
    
    // 生成随机障碍物
    const obstacles: RadarObstacle[] = [];
    const obstacleCount = Math.floor(Math.random() * 8) + 2; // 2-10个障碍物
    
    for (let i = 0; i < obstacleCount; i++) {
      // 在扫描角度范围内生成障碍物
      const obstacleAngle = direction + (Math.random() - 0.5) * scanAngle;
      const distance = Math.random() * scanRadius * 0.8 + scanRadius * 0.2; // 20%-100%的扫描范围
      const intensity = Math.random() * 100 + 50; // 50-150的强度
      
      const obstacleX = position.x + distance * Math.cos(obstacleAngle * Math.PI / 180);
      const obstacleY = position.y + distance * Math.sin(obstacleAngle * Math.PI / 180);
      
      obstacles.push({
        id: `obstacle_${i}_${now}`,
        x: obstacleX,
        y: obstacleY,
        distance,
        angle: obstacleAngle,
        intensity,
        timestamp: now
      });
    }

    return {
      centerX: position.x,
      centerY: position.y,
      direction,
      scanRadius,
      scanAngle,
      obstacles,
      timestamp: now
    };
  }, [currentPosition, simulatedPosition]);

  // 启动雷达数据更新
  const startRadarUpdate = useCallback(() => {
    if (radarUpdateInterval) {
      clearInterval(radarUpdateInterval);
    }

    const interval = setInterval(() => {
      const newRadarData = generateRadarData();
      if (newRadarData) {
        setRadarScanData(newRadarData);
      }
    }, 100); // 每100ms更新一次

    setRadarUpdateInterval(interval);
  }, [generateRadarData, radarUpdateInterval]);

  // 停止雷达数据更新
  const stopRadarUpdate = useCallback(() => {
    if (radarUpdateInterval) {
      clearInterval(radarUpdateInterval);
      setRadarUpdateInterval(null);
    }
    setRadarScanData(null);
  }, [radarUpdateInterval]);

  // 雷达开关状态变化时的处理
  useEffect(() => {
    if (isRadarEnabled && currentPosition) {
      startRadarUpdate();
    } else {
      stopRadarUpdate();
    }

    // 清理函数
    return () => {
      if (radarUpdateInterval) {
        clearInterval(radarUpdateInterval);
      }
    };
  }, [isRadarEnabled, currentPosition, startRadarUpdate, stopRadarUpdate]);

  // 监听canvasOffset变化
  useEffect(() => {
    console.log('🚗 [canvasOffset变化] 新值:', canvasOffset);
  }, [canvasOffset]);

  // AGV动态移动模拟
  const startAgvSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    // 初始化模拟位置为当前位置
    const initialPos = simulatedPosition || currentPosition || { x: 500, y: 400 };
    setSimulatedPosition(initialPos);

    console.log('🚗 [AGV模拟] 开始模拟，初始位置:', initialPos);

    simulationIntervalRef.current = setInterval(() => {
      setSimulatedPosition(prevPos => {
        if (!prevPos) return initialPos;

        // 根据方向和速度计算新位置
        const radians = (agvDirection * Math.PI) / 180;
        const newX = prevPos.x + Math.cos(radians) * agvSpeed;
        const newY = prevPos.y + Math.sin(radians) * agvSpeed;

        const newPos = { x: newX, y: newY };
        console.log('🚗 [AGV模拟] 位置更新:', {
          旧位置: prevPos,
          新位置: newPos,
          方向: agvDirection,
          速度: agvSpeed
        });

        return newPos;
      });
    }, 50); // 每50ms更新一次位置，实现平滑移动
  }, [agvDirection, agvSpeed, simulatedPosition, currentPosition]);

  const stopAgvSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      console.log('🚗 [AGV模拟] 停止模拟');
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // AGV动态移动模拟
  useEffect(() => {
    if (isVehicleFollowEnabled) {
      // 初始化模拟位置
      if (!simulatedPosition) {
        const initialPos = currentPosition || { x: 500, y: 400 };
        setSimulatedPosition(initialPos);
        console.log('🚗 [AGV模拟] 初始化位置:', initialPos);
      }
      
      // 启动移动模拟
      simulationIntervalRef.current = setInterval(() => {
        setSimulatedPosition(prevPos => {
          if (!prevPos) return null;
          
          // 根据方向和速度计算新位置
          const radians = (agvDirection * Math.PI) / 180;
          const newX = prevPos.x + Math.cos(radians) * agvSpeed;
          const newY = prevPos.y + Math.sin(radians) * agvSpeed;
          
          const newPos = { x: newX, y: newY };
          console.log('🚗 [AGV模拟] 位置更新:', {
            旧位置: prevPos,
            新位置: newPos,
            方向: agvDirection,
            速度: agvSpeed
          });
          
          return newPos;
        });
      }, 50); // 20fps更新频率
      
      console.log('🚗 [AGV模拟] 启动动态移动');
    } else {
      // 停止移动模拟
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
        console.log('🚗 [AGV模拟] 停止动态移动');
      }
      // 只有在非手动控制模式下才重置simulatedPosition
      if (!isManualControlActive) {
        console.log('🔄 [AGV模拟] 重置simulatedPosition，手动控制状态:', isManualControlActive);
        setSimulatedPosition(null);
      } else {
        console.log('🔒 [AGV模拟] 保护simulatedPosition，手动控制状态:', isManualControlActive);
      }
    }
    
    // 清理函数
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, [isVehicleFollowEnabled, agvDirection, agvSpeed, currentPosition]);

  // 车载跟随功能 - 当AGV位置变化时自动调整地图偏移
  useEffect(() => {
    // 使用模拟位置或实际位置
    const effectivePosition = simulatedPosition || currentPosition;
    
    console.log('🚗 [车载跟随useEffect] 触发:', {
      isVehicleFollowEnabled,
      effectivePosition,
      simulatedPosition,
      currentPosition,
      lastFollowPosition,
      canvasRef: !!canvasRef.current
    });
    
    if (isVehicleFollowEnabled && effectivePosition && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // 计算画布中心点
      const canvasCenterX = rect.width / 2;
      const canvasCenterY = rect.height / 2;
      
      // 计算地图偏移：地图需要向相反方向移动，使AGV看起来固定在中心
      const mapOffsetX = canvasCenterX - effectivePosition.x;
      const mapOffsetY = canvasCenterY - effectivePosition.y;
      
      console.log('🚗 [车载跟随useEffect] 计算地图偏移:', {
        canvasSize: { width: rect.width, height: rect.height },
        canvasCenter: { x: canvasCenterX, y: canvasCenterY },
        effectivePosition,
        mapOffset: { x: mapOffsetX, y: mapOffsetY }
      });
      
      // 当AGV位置发生变化时调整地图偏移
      if (!lastFollowPosition || 
          Math.abs(effectivePosition.x - lastFollowPosition.x) > 0.1 || 
          Math.abs(effectivePosition.y - lastFollowPosition.y) > 0.1) {
        
        console.log('🚗 [车载跟随useEffect] AGV位置变化，更新地图偏移');
        
        setMapOffset({
          x: mapOffsetX,
          y: mapOffsetY
        });
        
        setLastFollowPosition(effectivePosition);
      }
    } else {
      console.log('🚗 [车载跟随useEffect] 条件不满足，跳过处理');
    }
  }, [isVehicleFollowEnabled, simulatedPosition, currentPosition, lastFollowPosition]);

  // 空格键拖动功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        if (isDev) console.log('🚀 [空格键拖动] 空格键按下，启用拖动模式');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(false);
        if (isDev) console.log('🛑 [空格键拖动] 空格键释放，禁用拖动模式');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // 滚轮缩放功能
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasScale * scaleFactor));
    setCanvasScale(newScale);
    if (isDev) console.log('🔍 [滚轮缩放] 缩放比例:', newScale);
  }, [canvasScale]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    canvasElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvasElement.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // 处理路径列表点击 - 定位到地图上
  const handleLineListClick = (lineId: string) => {
    const line = mapLines.find(l => l.id === lineId);
    if (line) {
      setSelectedLines([lineId]);
      message.success(`已定位到路径: ${line.name}`);
    }
  };

  // 处理区域列表点击 - 定位到地图上
  const handleAreaListClick = (areaId: string) => {
    const area = mapAreas.find(a => a.id === areaId);
    if (area) {
      setSelectedAreas([areaId]);
      message.success(`已定位到区域: ${area.name}`);
    }
  };

  // 删除地图点
  const handleRemoveMapPoint = (pointId: string) => {
    const pointToRemove = mapPoints.find(p => p.id === pointId);
    if (pointToRemove) {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除节点 "${pointToRemove.name}" 吗？删除后无法恢复。`,
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          setMapPoints(prev => prev.filter(p => p.id !== pointId));
          setSelectedPoints(prev => prev.filter(id => id !== pointId));
          message.success(`节点 "${pointToRemove.name}" 已删除`);
          // 保存到历史记录
          setTimeout(() => saveToHistory(), 0);
        }
      });
    }
  };

  // 删除地图区域
  const handleDeleteArea = (areaId: string) => {
    const areaToDelete = mapAreas.find(a => a.id === areaId);
    if (areaToDelete) {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除区域 "${areaToDelete.name}" 吗？删除后无法恢复。`,
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          setMapAreas(prev => prev.filter(a => a.id !== areaId));
          setSelectedAreas(prev => prev.filter(id => id !== areaId));
          message.success(`区域 "${areaToDelete.name}" 已删除`);
        }
      });
    }
  };

  // 地图管理相关处理函数
  const handleDeleteMapList = (listId: string) => {
    const listToDelete = mapLists.find(list => list.id === listId);
    if (listToDelete) {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除地图列表 "${listToDelete.name}" 吗？这将同时删除该列表下的所有地图文件，删除后无法恢复。`,
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          setMapLists(prev => prev.filter(list => list.id !== listId));
          setMapFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[listId];
            return newFiles;
          });
          if (selectedMapList === listId) {
            setSelectedMapList(null);
          }
          message.success(`地图列表 "${listToDelete.name}" 已删除`);
        }
      });
    }
  };

  const handleDeleteMapFile = (listId: string, fileId: string) => {
    const fileToDelete = mapFiles[listId]?.find(file => file.id === fileId);
    if (fileToDelete) {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除地图文件 "${fileToDelete.name}" 吗？删除后无法恢复。`,
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          setMapFiles(prev => ({
            ...prev,
            [listId]: prev[listId].filter(file => file.id !== fileId)
          }));
          setMapLists(prev => prev.map(list => 
            list.id === listId 
              ? { ...list, fileCount: list.fileCount - 1 }
              : list
          ));
          message.success(`地图文件 "${fileToDelete.name}" 已删除`);
        }
      });
    }
  };

  const handleSelectMapList = (listId: string) => {
    setSelectedMapList(listId);
  };

  // 机器人控制处理函数
  const handleRobotMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isManualControlEnabled) {
      return;
    }
    
    // 如果已经在移动相同方向，不重复处理
    if (isMoving && currentDirection === direction) {
      return;
    }
    
    // 首先调整车头方向与移动方向一致
    adjustVehicleDirection(direction);
    
    // 清除之前的定时器
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
    
    setCurrentDirection(direction);
    setIsMoving(true);
    setIsManualControlActive(true);
    console.log('🎮 [手动控制] 激活状态:', true);
    
    // 立即执行第一次移动
    updateRobotPosition(direction);
    
    // 设置定时器，每200ms执行一次移动，实现持续控制
    console.log(`🔄 [长按] 开始持续移动: ${direction}`);
    moveIntervalRef.current = setInterval(() => {
      console.log(`⏰ [长按] 定时器执行移动: ${direction}`);
      updateRobotPosition(direction);
    }, 200);
  };

  // 更新机器人位置的函数
  const updateRobotPosition = (direction: 'up' | 'down' | 'left' | 'right') => {
    // 计算移动距离，基于控制速度 - 增加基础移动距离让移动更明显
    const moveDistance = (controlSpeed / 100) * 15; // 基础移动距离改为15像素
    
    // 获取当前AGV位置
    const currentPos = simulatedPosition || currentPosition || { x: 500, y: 400 };
    
    // 根据方向计算新位置
    let newX = currentPos.x;
    let newY = currentPos.y;
    
    switch (direction) {
      case 'up':
        newY -= moveDistance;
        break;
      case 'down':
        newY += moveDistance;
        break;
      case 'left':
        newX -= moveDistance;
        break;
      case 'right':
        newX += moveDistance;
        break;
    }
    
    const newPosition = { x: newX, y: newY };
    
    // 更新模拟位置（这会触发AGV在画布上的重新渲染）
    setSimulatedPosition(newPosition);
    
    console.log('🚗 [手动控制] 位置更新:', {
      方向: direction,
      旧位置: `x:${currentPos.x}, y:${currentPos.y}`,
      新位置: `x:${newPosition.x}, y:${newPosition.y}`,
      移动距离: moveDistance,
      '更新前simulatedPosition': simulatedPosition ? `x:${simulatedPosition.x}, y:${simulatedPosition.y}` : 'null',
      '即将设置的simulatedPosition': `x:${newPosition.x}, y:${newPosition.y}`
    });
  };

  const handleRobotStop = () => {
    // 清除定时器
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
      console.log('🛑 [长按] 停止持续移动');
    }
    
    setIsMoving(false);
    setCurrentDirection(null);
    
    // 延迟清除手动控制状态，给simulatedPosition一些时间保持
    setTimeout(() => {
      setIsManualControlActive(false);
      console.log('🎮 [手动控制] 激活状态:', false);
    }, 100);
  };

  const handleManualControlToggle = (enabled: boolean) => {
    setIsManualControlEnabled(enabled);
    if (!enabled) {
      handleRobotStop();
    }
    message.success(enabled ? '手动控制模式已开启' : '手动控制模式已关闭');
  };

  const handleSpeedChange = (value: number) => {
    setControlSpeed(value);
  };

  // 扫图功能处理函数
  const handleScanToggle = (enabled: boolean) => {
    setIsScanEnabled(enabled);
    if (!enabled) {
      handleScanStop();
    }
  };

  // 根据移动方向调整车头方向
  const adjustVehicleDirection = (moveDirection: 'up' | 'down' | 'left' | 'right') => {
    const directionMap = {
      'up': 0,      // 向上：0度
      'right': 90,  // 向右：90度
      'down': 180,  // 向下：180度
      'left': 270   // 向左：270度
    };
    
    const targetDirection = directionMap[moveDirection];
    
    // 如果当前方向与目标方向不同，则调整车头方向
    if (agvDirection !== targetDirection) {
      setAgvDirection(targetDirection);
      console.log(`🔄 [方向调整] 车头方向从 ${agvDirection}° 调整为 ${targetDirection}° (${moveDirection})`);
    }
  };

  const handleScanMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isScanEnabled) return;
    
    // 首先调整车头方向与移动方向一致
    adjustVehicleDirection(direction);
    
    setScanDirection(direction);
    setIsScanMoving(true);
    
    // 激活手动控制状态，防止simulatedPosition被重置
    setIsManualControlActive(true);
    
    // 实际移动AGV - 复用手动控制逻辑
    const currentPos = simulatedPosition || currentPosition || { x: 400, y: 300 };
    const moveDistance = Math.max(5, (scanSpeed / 100) * 20); // 根据扫图速度调整移动距离
    
    let newPosition = { ...currentPos };
    
    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, currentPos.y - moveDistance);
        break;
      case 'down':
        newPosition.y = Math.min(canvasHeight, currentPos.y + moveDistance);
        break;
      case 'left':
        newPosition.x = Math.max(0, currentPos.x - moveDistance);
        break;
      case 'right':
        newPosition.x = Math.min(canvasWidth, currentPos.x + moveDistance);
        break;
    }
    
    // 更新模拟位置
    setSimulatedPosition(newPosition);
    
    console.log(`🚗 [扫图移动] ${direction}, 速度: ${scanSpeed}%, 位置: x:${newPosition.x.toFixed(1)}, y:${newPosition.y.toFixed(1)}`);
    
    // 模拟移动持续时间
    setTimeout(() => {
      setIsScanMoving(false);
      setScanDirection(null);
    }, 200);
  };

  const handleScanStop = () => {
    setIsScanMoving(false);
    setScanDirection(null);
    
    // 延迟清除手动控制状态，防止simulatedPosition被立即重置
    setTimeout(() => {
      setIsManualControlActive(false);
      console.log('🛑 [扫图停止] 手动控制状态已清除');
    }, 100);
    
    console.log('🛑 [扫图停止]');
  };

  const handleScanSpeedChange = (value: number) => {
    setScanSpeed(value);
  };

  // 站点采样功能处理函数
  const handleSampleToggle = (enabled: boolean) => {
    setIsSampleEnabled(enabled);
    if (!enabled) {
      handleSampleStop();
    }
  };

  const handleSampleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isSampleEnabled) return;
    
    // 首先调整车头方向与移动方向一致
    adjustVehicleDirection(direction);
    
    setSampleDirection(direction);
    setIsSampleMoving(true);
    
    // 激活手动控制状态，防止simulatedPosition被重置
    setIsManualControlActive(true);
    
    // 实际移动AGV - 复用手动控制逻辑
    const currentPos = simulatedPosition || currentPosition || { x: 400, y: 300 };
    const moveDistance = Math.max(5, (sampleSpeed / 100) * 20); // 根据采样速度调整移动距离
    
    let newPosition = { ...currentPos };
    
    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, currentPos.y - moveDistance);
        break;
      case 'down':
        newPosition.y = Math.min(canvasHeight, currentPos.y + moveDistance);
        break;
      case 'left':
        newPosition.x = Math.max(0, currentPos.x - moveDistance);
        break;
      case 'right':
        newPosition.x = Math.min(canvasWidth, currentPos.x + moveDistance);
        break;
    }
    
    // 更新模拟位置
    setSimulatedPosition(newPosition);
    
    console.log(`🚗 [采样移动] ${direction}, 速度: ${sampleSpeed}%, 位置: x:${newPosition.x.toFixed(1)}, y:${newPosition.y.toFixed(1)}`);
    
    // 模拟移动持续时间
    setTimeout(() => {
      setIsSampleMoving(false);
      setSampleDirection(null);
    }, 200);
  };

  const handleSampleStop = () => {
    setIsSampleMoving(false);
    setSampleDirection(null);
    
    // 延迟清除手动控制状态，防止simulatedPosition被立即重置
    setTimeout(() => {
      setIsManualControlActive(false);
      console.log('🛑 [采样停止] 手动控制状态已清除');
    }, 100);
    
    console.log('🛑 [采样停止]');
  };

  const handleSampleSpeedChange = (value: number) => {
    setSampleSpeed(value);
  };

  // 站点采样：以车辆中心点生成站点
  const handleSampleStation = () => {
    // 在黑白底图或阅览模式下禁止采样（与绘制站点一致）
    if (mapType === 'blackwhite' || currentMode === 'view') {
      message.warning('当前模式不支持采样');
      return;
    }

    // 优先使用模拟位置（用户移动后的位置），其次使用实际当前位置；都没有则使用画布中心换算到画布坐标
    let stationX: number | null = null;
    let stationY: number | null = null;

    if (simulatedPosition) {
      stationX = simulatedPosition.x;
      stationY = simulatedPosition.y;
    } else if (currentPosition) {
      stationX = currentPosition.x;
      stationY = currentPosition.y;
    } else if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenCenterX = rect.left + rect.width / 2;
      const screenCenterY = rect.top + rect.height / 2;
      const { x, y } = screenToCanvasCoordinates(screenCenterX, screenCenterY, canvasRef.current);
      stationX = x;
      stationY = y;
    }

    if (stationX == null || stationY == null) {
      message.error('无法获取车辆位置，采样失败');
      return;
    }

    const newStation: MapPoint = {
      id: Date.now().toString(),
      name: `站点${pointCounter}`,
      x: stationX,
      y: stationY,
      type: '站点',
      color: '#1890ff',
      direction: 0,
      isDisabled: false,
      noUturn: false,
      baseMapId: 'map1',
      routeNetworkGroupId: 'group1'
    };

    setMapPoints(prev => [...prev, newStation]);
    setPointCounter(prev => prev + 1);
    message.success(`已在车辆中心采样，新增 ${newStation.name}`);
    setTimeout(() => saveToHistory(), 0);
  };

  // 定位功能处理函数
  const handlePositioningToggle = (enabled: boolean) => {
    setIsPositioningEnabled(enabled);
    if (!enabled) {
      setIsManualPositioning(false);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
    }
    message.success(enabled ? '定位模式已开启' : '定位模式已关闭');
  };

  const handlePositioningModeChange = (mode: 'manual' | 'auto') => {
    setPositioningMode(mode);
    setIsManualPositioning(false);
    setDragStartPoint(null);
    setDragCurrentPoint(null);
    message.success(mode === 'manual' ? '已切换到手动定位' : '已切换到自动定位');
  };

  const handleManualPositioningStart = () => {
    if (positioningMode === 'manual') {
      setIsManualPositioning(true);
      message.info('请在画布上拖动鼠标进行定位');
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isManualPositioning) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDragStartPoint({ x, y });
        setDragCurrentPoint({ x, y });
      }
    }

    // 处理框选开始
    if (selectedTool === 'select' && currentMode === 'edit' && !isManualPositioning) {
      handleSelectionStart(e);
    }
  };

  const handlePositioningMouseMove = (e: React.MouseEvent) => {
    if (isManualPositioning && dragStartPoint) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDragCurrentPoint({ x, y });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isManualPositioning && dragStartPoint && dragCurrentPoint) {
      setIsManualPositioning(false);
      setIsPositioning(true);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
      
      message.loading('定位中...', 0);
      
      // 模拟定位过程
      setTimeout(() => {
        message.destroy();
        setIsPositioning(false);
        message.success('定位完成');
      }, 2000);
    }

    // 处理框选结束
    if (isSelecting && selectionStart) {
      handleSelectionEnd();
    }
  };

  // 框选开始处理函数
  const handleSelectionStart = (e: React.MouseEvent) => {
    if (selectedTool !== 'select' || currentMode !== 'edit') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // 转换为画布坐标
      const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      
      setIsSelecting(true);
      setSelectionStart({ x: canvasX, y: canvasY });
      setSelectionEnd({ x: canvasX, y: canvasY });
      setSelectionBox({
        x: canvasX,
        y: canvasY,
        width: 0,
        height: 0
      });
    }
  };

  // 框选移动处理函数
  const handleSelectionMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // 转换为画布坐标
      const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      
      setSelectionEnd({ x: canvasX, y: canvasY });
      
      // 计算选择框的位置和大小
      const minX = Math.min(selectionStart.x, canvasX);
      const minY = Math.min(selectionStart.y, canvasY);
      const maxX = Math.max(selectionStart.x, canvasX);
      const maxY = Math.max(selectionStart.y, canvasY);
      
      setSelectionBox({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      });
    }
  };

  // 取消框选处理函数
  const handleSelectionCancel = () => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionBox(null);
  };

  // 框选结束处理函数
  const handleSelectionEnd = () => {
    if (!selectionBox || selectionBox.width < 5 || selectionBox.height < 5) {
      // 如果选择框太小，清除选择
      handleSelectionCancel();
      return;
    }

    // 查找框选区域内的地图点
    const selectedPointIds: string[] = [];
    mapPoints.forEach(point => {
      if (point.x >= selectionBox.x && 
          point.x <= selectionBox.x + selectionBox.width &&
          point.y >= selectionBox.y && 
          point.y <= selectionBox.y + selectionBox.height) {
        selectedPointIds.push(point.id);
      }
    });

    // 查找框选区域内的地图线
    const selectedLineIds: string[] = [];
    mapLines.forEach(line => {
      const startPoint = mapPoints.find(p => p.id === line.startPointId);
      const endPoint = mapPoints.find(p => p.id === line.endPointId);
      
      if (startPoint && endPoint) {
        // 检查线的起点和终点是否在选择框内
        const startInBox = startPoint.x >= selectionBox.x && 
                          startPoint.x <= selectionBox.x + selectionBox.width &&
                          startPoint.y >= selectionBox.y && 
                          startPoint.y <= selectionBox.y + selectionBox.height;
        
        const endInBox = endPoint.x >= selectionBox.x && 
                        endPoint.x <= selectionBox.x + selectionBox.width &&
                        endPoint.y >= selectionBox.y && 
                        endPoint.y <= selectionBox.y + selectionBox.height;
        
        // 如果起点或终点在框内，则选中该线
        if (startInBox || endInBox) {
          selectedLineIds.push(line.id);
        }
      }
    });

    // 更新选择状态
    setSelectedPoints(selectedPointIds);
    setSelectedLines(selectedLineIds);

    // 清除框选状态
    handleSelectionCancel();

    // 显示选择结果
    if (selectedPointIds.length > 0 || selectedLineIds.length > 0) {
      message.success(`已选择 ${selectedPointIds.length} 个地图点和 ${selectedLineIds.length} 条地图线`);
    }
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelecting) {
        handleSelectionCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelecting]);

  const handleAutoPositioning = () => {
    if (positioningMode === 'auto') {
      setIsPositioning(true);
      message.loading('自动定位中...', 0);
      
      // 模拟自动定位过程
      setTimeout(() => {
        message.destroy();
        setIsPositioning(false);
        message.success('自动定位完成');
      }, 3000);
    }
  };

  // 任务操作处理函数
  const handleTaskPause = (taskId: string) => {
    setActiveTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'paused' as const } : task
    ));
    message.success('任务已暂停');
  };

  const handleTaskResume = (taskId: string) => {
    setActiveTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'running' as const } : task
    ));
    message.success('任务已继续');
  };

  const handleTaskCancel = (taskId: string) => {
    const task = activeTasks.find(t => t.id === taskId);
    if (task) {
      // 将任务移到历史记录
      const cancelledTask = {
        ...task,
        status: 'cancelled' as const,
        endTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      };
      
      setTaskHistory(prev => [cancelledTask, ...prev]);
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      message.success('任务已取消');
    }
  };

  const handleTaskDiagnosis = (task: Task) => {
    setSelectedTask(task);
    setTaskDiagnosisVisible(true);
  };

  // 获取画布光标样式
  const getCanvasCursor = () => {
    if (isManualPositioning) return 'crosshair';
    if (dragTool || isSpacePressed) return 'grab';
    if (isDragging) return 'grabbing';
    if (selectedTool === 'select') return 'default';
    return 'crosshair';
  };

  // 渲染地图点
  const renderMapPoints = () => {
    if (hideAllPoints) return null;

    return mapPoints.map(point => {
      const isSelected = selectedPoints.includes(point.id);
      const pointSize = 16;

      // 在车载跟随模式下应用地图偏移
      const pointX = isVehicleFollowEnabled ? point.x + mapOffset.x : point.x;
      const pointY = isVehicleFollowEnabled ? point.y + mapOffset.y : point.y;

      return (
        <div
          key={point.id}
          style={{
            position: 'absolute',
            left: pointX - pointSize / 2,
            top: pointY - pointSize / 2,
            width: pointSize,
            height: pointSize,
            backgroundColor: point.color,
            border: isSelected ? '2px solid #ff4d4f' : '2px solid #fff',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (selectedTool === 'select') {
              setSelectedPoints([point.id]);
            }
          }}
        >
          {!hideAllPointNames && (
            <div
              style={{
                position: 'absolute',
                top: pointSize + 4,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: `${Math.max(10, 12 / canvasScale)}px`,
                color: '#333',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 4px',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              {point.name}
            </div>
          )}
        </div>
      );
    });
  };

  // 渲染连线
  const renderMapLines = () => {
    if (hideAllPaths) return null;

    return mapLines.map(line => {
      const startPoint = mapPoints.find(p => p.id === line.startPointId);
      const endPoint = mapPoints.find(p => p.id === line.endPointId);
      
      if (!startPoint || !endPoint) return null;

      const isSelected = selectedLines.includes(line.id);

      // 在车载跟随模式下应用地图偏移
      const startX = isVehicleFollowEnabled ? startPoint.x + mapOffset.x : startPoint.x;
      const startY = isVehicleFollowEnabled ? startPoint.y + mapOffset.y : startPoint.y;
      const endX = isVehicleFollowEnabled ? endPoint.x + mapOffset.x : endPoint.x;
      const endY = isVehicleFollowEnabled ? endPoint.y + mapOffset.y : endPoint.y;

      return (
        <g key={line.id}>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={isSelected ? '#ff4d4f' : line.color}
            strokeWidth={line.width}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'select') {
                setSelectedLines([line.id]);
              }
            }}
          />
          {!hideAllPathNames && (
            <text
              x={(startX + endX) / 2}
              y={(startY + endY) / 2}
              fill="#333"
              fontSize={Math.max(10, 12 / canvasScale)}
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              {line.name}
            </text>
          )}
        </g>
      );
    });
  };

  // 渲染设备当前位置
  const renderDevicePosition = () => {
    // 使用模拟位置或实际位置
    const effectivePosition = simulatedPosition || currentPosition;
    if (!effectivePosition) return null;

    // AGV朝向角度：当雷达启用时跟随雷达方向，否则使用默认方向
    const deviceDirection = isRadarEnabled && radarScanData ? radarScanData.direction : 0; // 度数，0度为向右，90度为向下

    // 在车载跟随模式下，AGV固定在画布中心；否则使用实际位置
    const agvPosition = isVehicleFollowEnabled 
      ? { x: canvasWidth / 2 - 20, y: canvasHeight / 2 - 15 }  // 画布中心位置
      : { x: effectivePosition.x - 20, y: effectivePosition.y - 15 };  // 实际位置或模拟位置

    console.log('🎯 [AGV渲染] 位置计算:', {
      isVehicleFollowEnabled,
      simulatedPosition: simulatedPosition ? `x:${simulatedPosition.x}, y:${simulatedPosition.y}` : 'null',
      currentPosition: currentPosition ? `x:${currentPosition.x}, y:${currentPosition.y}` : 'null',
      effectivePosition: effectivePosition ? `x:${effectivePosition.x}, y:${effectivePosition.y}` : 'null',
      agvPosition: `x:${agvPosition.x}, y:${agvPosition.y}`,
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      '位置来源': simulatedPosition ? '模拟位置' : '实际位置'
    });

    // 生成唯一key确保React重新渲染
    const renderKey = `agv-${agvPosition.x}-${agvPosition.y}-${Date.now()}`;

    return (
      <div
        key={renderKey}
        style={{
          position: 'absolute',
          left: agvPosition.x,
          top: agvPosition.y,
          zIndex: 20,
        }}
      >
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `}
        </style>
        
        {/* AGV旋转容器 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `rotate(${deviceDirection}deg)`,
            transformOrigin: 'center',
            transition: isRadarEnabled ? 'transform 0.1s ease-out' : 'none' // 雷达启用时平滑旋转
          }}
        >
          {/* AGV主体 - 绿色圆角矩形 */}
          <div
            style={{
              width: 40,
              height: 30,
              backgroundColor: '#52c41a',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(82, 196, 26, 0.4)',
              animation: 'pulse 2s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
          {/* 中心点指示器 */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '4px',
              backgroundColor: '#ff4444',
              borderRadius: '50%',
              zIndex: 10
            }}
          />
          
          {/* 车头方向指示器 - 白色半圆形，位于中心 */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(90deg)`, // 相对于AGV主体向前指向
              transformOrigin: 'center',
              width: '16px',
              height: '16px'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                borderRadius: '50%',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)', // 切出上半圆
                transform: 'translate(-50%, -50%)',
                position: 'absolute',
                top: '50%',
                left: '50%'
              }}
            />
          </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      background: '#f5f5f5'
    }}>
      {/* 左侧绘图工具面板 - 完整版本 */}
      <div style={{
        position: 'absolute',
        left: '16px',
        top: '16px',
        width: '240px',
        height: canvasHeight > 0 ? `${canvasHeight - 32}px` : `${windowHeight - 120}px`,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        overflowY: 'auto',
        display: showLeftPanel ? 'flex' : 'none',
        flexDirection: 'column',
        transition: 'all 0.3s ease'
      }}>
        {/* 当前模式 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            当前模式
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              padding: '8px 12px',
              background: currentMode === 'edit' ? '#f6ffed' : '#f5f5f5',
              border: currentMode === 'edit' ? '1px solid #b7eb8f' : '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '13px',
              color: currentMode === 'edit' ? '#52c41a' : '#666',
              textAlign: 'center',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{currentMode === 'edit' ? '编辑模式' : '阅览模式'}</span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={currentMode === 'edit' ? '#52c41a' : '#666'} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {currentMode === 'edit' ? (
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                ) : (
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                )}
                {currentMode === 'edit' ? (
                  <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                ) : (
                  <circle cx="12" cy="12" r="3"/>
                )}
              </svg>
            </div>
            
            <Button 
              type={currentMode === 'edit' ? 'default' : 'primary'}
              onClick={() => setCurrentMode(currentMode === 'edit' ? 'view' : 'edit')}
              style={{
                height: '32px',
                fontSize: '12px',
                borderRadius: '6px'
              }}
            >
              {currentMode === 'edit' ? '进入阅览模式' : '进入编辑模式'}
            </Button>
          </div>
        </div>

        {/* 地图类型切换 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            地图类型
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button 
              type={mapType === 'color' ? 'primary' : 'text'}
              onClick={() => setMapType('color')}
              style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: mapType === 'color' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '6px',
                background: mapType === 'color' ? '#e6f7ff' : '#fff',
                fontSize: '13px',
                color: mapType === 'color' ? '#1890ff' : '#666'
              }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#1890ff" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}
              >
                <circle cx="12" cy="12" r="3"/>
                <circle cx="6" cy="6" r="2"/>
                <circle cx="18" cy="6" r="2"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="18" cy="18" r="2"/>
                <path d="m9 9 6 6"/>
                <path d="m15 9-6 6"/>
                <path d="m8 6 4 6"/>
                <path d="m16 6-4 6"/>
                <path d="m8 18 4-6"/>
                <path d="m16 18-4-6"/>
              </svg>
              拓扑地图
            </Button>
            
            <Button 
              type={mapType === 'blackwhite' ? 'primary' : 'text'}
              onClick={() => setMapType('blackwhite')}
              style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: mapType === 'blackwhite' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '6px',
                background: mapType === 'blackwhite' ? '#e6f7ff' : '#fff',
                fontSize: '13px',
                color: mapType === 'blackwhite' ? '#1890ff' : '#666'
              }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#666" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              黑白底图
            </Button>
          </div>
        </div>

        {/* 地图信息 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            地图信息
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>地图名称</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '4px 11px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                color: '#666'
              }}>
                {mapName}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>文件名</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '4px 11px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                color: '#666'
              }}>
                {mapName}.pgm
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>尺寸 (像素)</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '4px 11px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                color: '#666'
              }}>
                2000 × 2000
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>分辨率 (m/pixel)</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '4px 11px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                color: '#666'
              }}>
                0.05
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>实际大小 (m)</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  textAlign: 'center',
                  minWidth: '60px'
                }}>
                  长: 100m
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  textAlign: 'center',
                  minWidth: '60px'
                }}>
                  宽: 100m
                </div>
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>比例尺</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                padding: '4px 11px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                textAlign: 'center'
              }}>
                1:20 (5cm/pixel)
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px', textAlign: 'center' }}>
                1像素对应实际距离的比例
              </div>
            </div>

          </div>
        </div>


      </div>

      {/* 顶部搜索功能 - 调整位置以适应更宽的左侧工具栏 */}
      <div style={{
        position: 'absolute',
        left: '276px', // 240px + 16px + 20px
        top: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000
      }}>
        <Radio.Group 
          value={searchType} 
          onChange={(e: RadioChangeEvent) => setSearchType(e.target.value)}
          style={{ height: 32 }}
        >
          <Radio.Button value="line">线名称</Radio.Button>
          <Radio.Button value="point">点名称</Radio.Button>
        </Radio.Group>
        <Input.Search
          placeholder={`搜索${searchType === 'line' ? '线名称' : '点名称'}...`}
          value={searchValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 180, height: 32 }}
        />
        <Cascader
          options={cascaderOptions}
          onChange={handleMapChange}
          value={currentMapSelection}
          placeholder="选择地图"
          style={{ width: 280, height: 32 }}
          showSearch
          expandTrigger="hover"
          displayRender={(labels) => {
            if (labels.length === 2) {
              return `${labels[0]} - ${labels[1]}`;
            }
            return labels.join(' / ');
          }}
        />
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => setMapManagementVisible(true)}
          style={{ height: 32 }}
        >
          地图管理
        </Button>
      </div>

      {/* 右侧面板 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '260px',
        height: canvasHeight > 0 ? `${canvasHeight - 32}px` : `${windowHeight - 120}px`,
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        display: showRightPanel ? 'flex' : 'none',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}>
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          size="small"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          tabBarStyle={{ 
            margin: '0 12px',
            borderBottom: '1px solid #e8e8e8',
            paddingTop: '12px'
          }}
          items={[
            {
              key: 'tools',
              label: currentMode === 'view' ? '任务信息' : '绘图工具',
              children: currentMode === 'view' ? (
                // 任务信息页签内容
                <div style={{ padding: '12px', flex: 1, overflow: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {/* 正在执行的任务 */}
                    <div style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <PlayCircleOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
                        正在执行的任务
                      </div>
                      {activeTasks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeTasks.map(task => (
                            <div key={task.id} style={{
                              padding: '8px',
                              background: '#fff',
                              borderRadius: '4px',
                              border: '1px solid #e8e8e8'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '4px'
                              }}>
                                <span style={{ fontSize: '12px', fontWeight: 500 }}>{task.name}</span>
                                <span style={{ 
                                  fontSize: '10px', 
                                  color: task.status === 'running' ? '#52c41a' : '#faad14',
                                  background: task.status === 'running' ? '#f6ffed' : '#fffbe6',
                                  padding: '2px 6px',
                                  borderRadius: '2px'
                                }}>
                                  {task.status === 'running' ? '运行中' : '已暂停'}
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
                                {task.description}
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                marginBottom: '6px'
                              }}>
                                <div style={{ 
                                  flex: 1, 
                                  height: '4px', 
                                  background: '#f0f0f0', 
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${task.progress}%`,
                                    height: '100%',
                                    background: task.status === 'running' ? '#1890ff' : '#faad14',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <span style={{ fontSize: '10px', color: '#666' }}>{task.progress}%</span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {task.status === 'running' ? (
                                  <Button 
                                    size="small" 
                                    icon={<PauseCircleOutlined />}
                                    onClick={() => handleTaskPause(task.id)}
                                    style={{ fontSize: '10px', height: '24px' }}
                                  >
                                    暂停
                                  </Button>
                                ) : (
                                  <Button 
                                    size="small" 
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    onClick={() => handleTaskResume(task.id)}
                                    style={{ fontSize: '10px', height: '24px' }}
                                  >
                                    继续
                                  </Button>
                                )}
                                <Button 
                                  size="small" 
                                  danger
                                  icon={<StopOutlined />}
                                  onClick={() => handleTaskCancel(task.id)}
                                  style={{ fontSize: '10px', height: '24px' }}
                                >
                                  取消
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#999', 
                          padding: '20px',
                          fontSize: '12px'
                        }}>
                          暂无正在执行的任务
                        </div>
                      )}
                    </div>

                    {/* 任务历史 */}
                    <div style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <ClockCircleOutlined style={{ fontSize: '12px', color: '#666' }} />
                        任务历史
                      </div>
                      {taskHistory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {taskHistory.map(task => (
                            <div key={task.id} style={{
                              padding: '8px',
                              background: '#fff',
                              borderRadius: '4px',
                              border: '1px solid #e8e8e8'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '4px'
                              }}>
                                <span style={{ fontSize: '12px', fontWeight: 500 }}>{task.name}</span>
                                <span style={{ 
                                  fontSize: '10px', 
                                  color: task.status === 'completed' ? '#52c41a' : 
                                        task.status === 'failed' ? '#ff4d4f' : '#faad14',
                                  background: task.status === 'completed' ? '#f6ffed' : 
                                            task.status === 'failed' ? '#fff2f0' : '#fffbe6',
                                  padding: '2px 6px',
                                  borderRadius: '2px'
                                }}>
                                  {task.status === 'completed' ? '已完成' : 
                                   task.status === 'failed' ? '失败' : '已取消'}
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
                                {task.description}
                              </div>
                              <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
                                开始时间: {task.startTime}
                              </div>
                              {task.endTime && (
                                <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>
                                  结束时间: {task.endTime}
                                </div>
                              )}
                              {task.status === 'failed' && (
                                <Button 
                                  size="small" 
                                  type="link"
                                  icon={<SettingOutlined />}
                                  onClick={() => handleTaskDiagnosis(task)}
                                  style={{ fontSize: '10px', height: '24px', padding: '0' }}
                                >
                                  诊断
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#999', 
                          padding: '20px',
                          fontSize: '12px'
                        }}>
                          暂无任务历史
                        </div>
                      )}
                    </div>
                  </Space>
                </div>
              ) : (
                // 绘图工具页签内容
                <div style={{ padding: '12px', flex: 1, overflow: 'auto' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">


                    {/* 选择工具 */}
                    <Button
                      type={selectedTool === 'select' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('select')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: currentMode === 'view' ? 0.5 : 1
                      }}
                      icon={<DragOutlined />}
                      disabled={currentMode === 'view'}
                    >
                      <span>选择工具</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>Q</span>
                    </Button>

                    {/* 站点工具 */}
                    <Button
                      type={selectedTool === 'station' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('station')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<EnvironmentOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制站点</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>W</span>
                    </Button>

                    {/* 停靠点工具 */}
                    <Button
                      type={selectedTool === 'dock' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('dock')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<CarOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制停靠点</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>E</span>
                    </Button>

                    {/* 充电点工具 */}
                    <Button
                      type={selectedTool === 'charge' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('charge')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<ThunderboltOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制充电点</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>H</span>
                    </Button>

                    {/* 临停点工具 */}
                    <Button
                      type={selectedTool === 'temp' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('temp')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<ClockCircleOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制临停点</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>M</span>
                    </Button>

                    {/* 双向直线工具 */}
                    <Button
                      type={selectedTool === 'doubleStraight' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('doubleStraight')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<LineOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制双向直线</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>D</span>
                    </Button>

                    {/* 单向直线工具 */}
                    <Button
                      type={selectedTool === 'singleStraight' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('singleStraight')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<ShareAltOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制单向直线</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>S</span>
                    </Button>

                    {/* 双向贝塞尔曲线工具 */}
                    <Button
                      type={selectedTool === 'doubleCurve' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('doubleCurve')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<BgColorsOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制双向贝塞尔曲线</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>B</span>
                    </Button>

                    {/* 单向贝塞尔曲线工具 */}
                    <Button
                      type={selectedTool === 'singleCurve' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('singleCurve')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<NodeIndexOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制单向贝塞尔曲线</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>C</span>
                    </Button>

                    {/* 调速区域工具 */}
                    <Button
                      type={selectedTool === 'speedArea' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('speedArea')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<BorderOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制调速区域</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>A</span>
                    </Button>

                    {/* 禁行区域工具 */}
                    <Button
                      type={selectedTool === 'forbiddenArea' ? 'primary' : 'default'}
                      onClick={() => setSelectedTool('forbiddenArea')}
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: (mapType === 'blackwhite' || currentMode === 'view') ? 0.5 : 1
                      }}
                      icon={<StopOutlined />}
                      disabled={mapType === 'blackwhite' || currentMode === 'view'}
                    >
                      <span>绘制禁行区域</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>F</span>
                    </Button>
                  </Space>
                </div>
              )
            },
            {
              key: 'elements',
              label: '地图元素',
              children: (
                <div style={{ padding: '12px', flex: 1, overflow: 'auto' }}>
                  <Collapse
                    activeKey={mapElementActiveKey}
                    onChange={setMapElementActiveKey}
                    size="small"
                    ghost
                    items={[
                      {
                        key: 'nodes',
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DotChartOutlined style={{ color: '#1890ff' }} />
                            <span>节点</span>
                            <Badge 
                              count={mapPoints.length} 
                              style={{ backgroundColor: '#1890ff' }}
                              size="small"
                            />
                          </div>
                        ),
                        children: (
                          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                            {mapPoints.map((point) => (
                              <div
                                key={point.id}
                                style={{
                                  padding: '8px 12px',
                                  border: '1px solid #f0f0f0',
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: '#fafafa',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleNodeListClick(point.id)}
                                 onMouseEnter={() => {
                                   // 高亮显示节点
                                 }}
                                 onMouseLeave={() => {
                                   // 取消高亮
                                 }}
                               >
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <div
                                     style={{
                                       width: '8px',
                                       height: '8px',
                                       borderRadius: '50%',
                                       backgroundColor: point.color
                                     }}
                                   />
                                   <span>{point.name}</span>
                                   <span style={{ color: '#999' }}>({point.type})</span>
                                 </div>
                                 {currentMode === 'edit' && (
                                   <Button
                                     type="text"
                                     size="small"
                                     icon={<DeleteOutlined />}
                                     onClick={(e: React.MouseEvent) => {
                                       e.stopPropagation();
                                       handleRemoveMapPoint(point.id);
                                     }}
                                     style={{ color: '#ff4d4f' }}
                                   />
                                 )}
                              </div>
                            ))}
                            {mapPoints.length === 0 && (
                              <div style={{ 
                                textAlign: 'center', 
                                color: '#999', 
                                padding: '20px',
                                fontSize: '12px'
                              }}>
                                暂无节点数据
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'paths',
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ApartmentOutlined style={{ color: '#52c41a' }} />
                            <span>路径</span>
                            <Badge 
                              count={mapLines.length} 
                              style={{ backgroundColor: '#52c41a' }}
                              size="small"
                            />
                          </div>
                        ),
                        children: (
                          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                            {mapLines.map((line) => {
                              const startPoint = mapPoints.find(p => p.id === line.startPointId);
                              const endPoint = mapPoints.find(p => p.id === line.endPointId);
                              const isDoubleDirection = line.type.includes('double');
                              
                              return (
                                <div
                                  key={line.id}
                                  style={{
                                    padding: '8px 12px',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '4px',
                                    marginBottom: '4px',
                                    cursor: 'pointer',
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '12px'
                                  }}
                                  onClick={() => handleLineListClick(line.id)}
                                   onMouseEnter={() => {
                                     // 高亮显示路径
                                   }}
                                   onMouseLeave={() => {
                                     // 取消高亮
                                   }}
                                 >
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <div
                                       style={{
                                         width: '8px',
                                         height: '2px',
                                         backgroundColor: line.color
                                       }}
                                     />
                                     <span>{startPoint?.name || '未知'}</span>
                                     <span style={{ color: '#999' }}>
                                       {isDoubleDirection ? '↔' : '→'}
                                     </span>
                                     <span>{endPoint?.name || '未知'}</span>
                                   </div>
                                   {currentMode === 'edit' && (
                                     <Button
                                       type="text"
                                       size="small"
                                       icon={<DeleteOutlined />}
                                       onClick={(e: React.MouseEvent) => {
                                         e.stopPropagation();
                                         // 删除路径逻辑
                                         Modal.confirm({
                                           title: '确认删除',
                                           content: `确定要删除路径 "${startPoint?.name} → ${endPoint?.name}" 吗？`,
                                           onOk: () => {
                                             setMapLines(prev => prev.filter(l => l.id !== line.id));
                                             message.success('路径删除成功');
                                           }
                                         });
                                       }}
                                       style={{ color: '#ff4d4f' }}
                                     />
                                   )}
                                </div>
                              );
                            })}
                            {mapLines.length === 0 && (
                              <div style={{ 
                                textAlign: 'center', 
                                color: '#999', 
                                padding: '20px',
                                fontSize: '12px'
                              }}>
                                暂无路径数据
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'areas',
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BorderOutlined style={{ color: '#fa8c16' }} />
                            <span>功能区</span>
                            <Badge 
                              count={mapAreas.length} 
                              style={{ backgroundColor: '#fa8c16' }}
                              size="small"
                            />
                          </div>
                        ),
                        children: (
                          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                            {mapAreas.map((area) => (
                              <div
                                key={area.id}
                                style={{
                                  padding: '8px 12px',
                                  border: '1px solid #f0f0f0',
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: '#fafafa',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleAreaListClick(area.id)}
                                 onMouseEnter={() => {
                                   // 高亮显示区域
                                 }}
                                 onMouseLeave={() => {
                                   // 取消高亮
                                 }}
                               >
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <div
                                     style={{
                                       width: '8px',
                                       height: '8px',
                                       backgroundColor: area.color,
                                       border: `1px solid ${area.strokeColor || area.color}`
                                     }}
                                   />
                                   <span>{area.name}</span>
                                   <span style={{ color: '#999' }}>({area.type})</span>
                                 </div>
                                 {currentMode === 'edit' && (
                                   <Button
                                     type="text"
                                     size="small"
                                     icon={<DeleteOutlined />}
                                     onClick={(e: React.MouseEvent) => {
                                       e.stopPropagation();
                                       handleDeleteArea(area.id);
                                     }}
                                     style={{ color: '#ff4d4f' }}
                                   />
                                 )}
                              </div>
                            ))}
                            {mapAreas.length === 0 && (
                              <div style={{ 
                                textAlign: 'center', 
                                color: '#999', 
                                padding: '20px',
                                fontSize: '12px'
                              }}>
                                暂无功能区数据
                              </div>
                            )}
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'hide',
              label: '元素隐藏',
              children: (
                <div style={{ padding: '12px', flex: 1, overflow: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* 快速隐藏 */}
                    <div style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <EyeInvisibleOutlined style={{ fontSize: '12px' }} />
                        快速隐藏
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>隐藏所有点</span>
                          <Switch 
                            size="small" 
                            checked={hideAllPoints} 
                            onChange={setHideAllPoints} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>隐藏所有路径</span>
                          <Switch 
                            size="small" 
                            checked={hideAllPaths} 
                            onChange={setHideAllPaths} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* 名称隐藏 */}
                    <div style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <SettingOutlined style={{ fontSize: '12px' }} />
                        名称隐藏
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>站点名称</span>
                          <Switch 
                            size="small" 
                            checked={hideStationNames}
                            onChange={setHideStationNames}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>停靠点名称</span>
                          <Switch 
                            size="small" 
                            checked={hideDockNames}
                            onChange={setHideDockNames}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>充电点名称</span>
                          <Switch 
                            size="small" 
                            checked={hideChargeNames}
                            onChange={setHideChargeNames}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>临停点名称</span>
                          <Switch 
                            size="small" 
                            checked={hideTempNames}
                            onChange={setHideTempNames}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>路径名称</span>
                          <Switch 
                            size="small" 
                            checked={hidePathNames}
                            onChange={setHidePathNames}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>区域名称</span>
                          <Switch 
                            size="small" 
                            checked={hideAreaNames}
                            onChange={setHideAreaNames}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>设备名称</span>
                          <Switch 
                            size="small" 
                            checked={hideDeviceNames}
                            onChange={setHideDeviceNames}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 全局名称控制 */}
                    <div style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '8px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <AppstoreOutlined style={{ fontSize: '12px' }} />
                        全局控制
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>隐藏点名称</span>
                          <Switch 
                            size="small" 
                            checked={hideAllPointNames} 
                            onChange={setHideAllPointNames} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>隐藏路径名称</span>
                          <Switch 
                            size="small" 
                            checked={hideAllPathNames} 
                            onChange={setHideAllPathNames} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* 画布主体 */}
      <div 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: getCanvasCursor(),
          userSelect: 'none'
        }}
        onClick={handleCanvasClick}
        onMouseDown={(e) => {
          handleCanvasMouseDown(e);
          handleCanvasDrag(e);
        }}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e);
          handlePositioningMouseMove(e);
        }}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
      >
        {/* 动态网格背景 */}
        <canvas
          ref={gridCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        
        {/* 画布变换容器 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}>
          {/* 连线SVG层 */}
          <svg
            ref={svgRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'auto',
              zIndex: 5
            }}
          >
            {renderMapLines()}
            
            {/* 地图区域 */}
            {mapAreas.map((area) => {
              const offsetX = isVehicleFollowEnabled ? mapOffset.x : 0;
              const offsetY = isVehicleFollowEnabled ? mapOffset.y : 0;
              
              const pathData = area.points.map((point, index) => {
                const x = point.x + offsetX;
                const y = point.y + offsetY;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ') + ' Z';
              
              return (
                <polygon
                  key={area.id}
                  points={area.points.map(point => `${point.x + offsetX},${point.y + offsetY}`).join(' ')}
                  fill={area.fillColor || area.color}
                  fillOpacity={area.fillOpacity}
                  stroke={area.strokeColor || area.color}
                  strokeWidth={2}
                  style={{
                    cursor: currentMode === 'edit' ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (currentMode === 'edit') {
                      // 处理区域点击事件
                    }
                  }}
                />
              );
            })}
            
            {/* 定位虚线 */}
            {isManualPositioning && dragStartPoint && dragCurrentPoint && (
              <line
                x1={dragStartPoint.x / canvasScale - canvasOffset.x / canvasScale}
                y1={dragStartPoint.y / canvasScale - canvasOffset.y / canvasScale}
                x2={dragCurrentPoint.x / canvasScale - canvasOffset.x / canvasScale}
                y2={dragCurrentPoint.y / canvasScale - canvasOffset.y / canvasScale}
                stroke="#1890ff"
                strokeWidth={2}
                strokeDasharray="5,5"
                opacity={0.8}
              />
            )}

            {/* 框选框 */}
            {isSelecting && selectionBox && (
              <rect
                x={selectionBox.x}
                y={selectionBox.y}
                width={selectionBox.width}
                height={selectionBox.height}
                fill="rgba(24, 144, 255, 0.1)"
                stroke="#1890ff"
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.8}
                pointerEvents="none"
              />
            )}

            {/* 雷达扫描区域 */}
            {isRadarEnabled && radarScanData && simulatedPosition && (
              <g>
                {/* 雷达扫描扇形区域 */}
                <path
                  d={(() => {
                    // 使用simulatedPosition坐标，使雷达跟随车辆移动
                    const centerX = simulatedPosition.x;
                    const centerY = simulatedPosition.y;
                    const radius = radarScanData.scanRadius;
                    const startAngle = (radarScanData.direction - radarScanData.scanAngle / 2) * Math.PI / 180;
                    const endAngle = (radarScanData.direction + radarScanData.scanAngle / 2) * Math.PI / 180;
                    
                    const x1 = centerX + radius * Math.cos(startAngle);
                    const y1 = centerY + radius * Math.sin(startAngle);
                    const x2 = centerX + radius * Math.cos(endAngle);
                    const y2 = centerY + radius * Math.sin(endAngle);
                    
                    const largeArcFlag = radarScanData.scanAngle > 180 ? 1 : 0;
                    
                    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                  })()}
                  fill="rgba(24, 144, 255, 0.15)"
                  stroke="#1890ff"
                  strokeWidth={2}
                  opacity={0.6}
                  pointerEvents="none"
                />
                
                {/* 雷达扫描线 */}
                <line
                  x1={simulatedPosition.x}
                  y1={simulatedPosition.y}
                  x2={simulatedPosition.x + radarScanData.scanRadius * Math.cos(radarScanData.direction * Math.PI / 180)}
                  y2={simulatedPosition.y + radarScanData.scanRadius * Math.sin(radarScanData.direction * Math.PI / 180)}
                  stroke="#1890ff"
                  strokeWidth={2}
                  opacity={0.8}
                  pointerEvents="none"
                />
                
                {/* 障碍物检测点 */}
                {radarScanData.obstacles.map((obstacle) => (
                  <circle
                    key={obstacle.id}
                    cx={obstacle.x}
                    cy={obstacle.y}
                    r={Math.max(3, obstacle.intensity / 20)}
                    fill="#ff4d4f"
                    stroke="#ff7875"
                    strokeWidth={1}
                    opacity={0.8}
                    pointerEvents="none"
                  />
                ))}
              </g>
            )}
          </svg>

          {/* 地图点层 */}
          {renderMapPoints()}

          {/* 设备当前位置 */}
          {renderDevicePosition()}
        </div>
      </div>

      {/* 画布提示内容 */}
      {mapPoints.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#999',
          fontSize: '16px',
          pointerEvents: 'none',
          zIndex: 100
        }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>设备地图编辑器</div>
          <div style={{ fontSize: '14px' }}>选择绘图工具开始编辑地图</div>
        </div>
      )}

      {/* 鼠标位置显示 */}
      {mousePosition && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          画布坐标: ({mousePosition.x.toFixed(0)}, {mousePosition.y.toFixed(0)})
        </div>
      )}

      {/* 悬浮操作工具栏 */}
      <div style={{
        position: 'absolute',
        right: showRightPanel ? '280px' : '20px', // 根据右侧面板状态动态调整位置
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e8e8e8',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 100,
        transition: 'right 0.3s ease' // 添加平滑过渡动画
      }}>
        {/* 拖动画布工具 */}
        <Button
          type={dragTool ? "primary" : "text"}
          icon={<DragOutlined />}
          size="small"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: dragTool ? '#1890ff' : 'transparent',
            color: dragTool ? '#fff' : 'inherit'
          }}
          title="拖动画布"
          onClick={toggleDragTool}
        />
        
        {/* 放大画布工具 */}
        <Button
          type="text"
          icon={<ZoomInOutlined />}
          size="small"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
          }}
          title="放大画布"
          onClick={handleZoomIn}
        />
        
        {/* 缩小画布工具 */}
        <Button
          type="text"
          icon={<ZoomOutOutlined />}
          size="small"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
          }}
          title="缩小画布"
          onClick={handleZoomOut}
        />
        
        {/* 分隔线 */}
        <div style={{
          height: '1px',
          background: '#e8e8e8',
          margin: '4px 0'
        }} />
        
        {/* 撤销工具 - 仅在编辑模式下显示 */}
        {currentMode === 'edit' && (
          <Button
            type="text"
            icon={<UndoOutlined />}
            size="small"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              color: historyIndex <= 0 ? '#d9d9d9' : '#1890ff'
            }}
            title="撤销 (Ctrl+Z / Cmd+Z)"
          />
        )}
        
        {/* 重做工具 - 仅在编辑模式下显示 */}
        {currentMode === 'edit' && (
          <Button
            type="text"
            icon={<RedoOutlined />}
            size="small"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              color: historyIndex >= history.length - 1 ? '#d9d9d9' : '#1890ff'
            }}
            title="重做 (Ctrl+Y / Cmd+Y)"
          />
        )}
        
        {/* 分隔线 */}
        <div style={{
          height: '1px',
          background: '#e8e8e8',
          margin: '4px 0'
        }} />
        
        {/* 旋转画布工具 */}
        <Button
          type="text"
          icon={<RotateLeftOutlined />}
          size="small"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
          }}
          title="旋转画布"
        />
        
        {/* 回到初始画布工具 */}
        <Button
          type="text"
          icon={<HomeOutlined />}
          size="small"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
          }}
          title="回到初始画布"
          onClick={handleResetCanvas}
        />


      </div>



      {/* 缩放比例显示 */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        缩放: {(canvasScale * 100).toFixed(0)}%
      </div>

      {/* 定位和控制功能区 - 仅在阅览模式下显示 */}
      {currentMode === 'view' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)', // 水平居中
          display: 'flex',
          flexDirection: 'row',
          gap: '8px', // 减小间距从16px到8px
          zIndex: 1000
        }}>
          {/* 车载跟随功能区 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '12px'
          }}>
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '48px'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CompassOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>车载跟随</span>
                <Switch 
                  size="small" 
                  checked={isVehicleFollowEnabled}
                  onChange={(checked) => {
                    console.log('🚗 [车载跟随] 开关状态变化:', checked);
                    console.log('🚗 [车载跟随] currentPosition:', currentPosition);
                    console.log('🚗 [车载跟随] canvasRef.current:', canvasRef.current);
                    console.log('🚗 [车载跟随] canvasScale:', canvasScale);
                    
                    setIsVehicleFollowEnabled(checked);
                    if (checked) {
                      message.success('车载跟随已开启，AGV开始移动');
                      // 开启车载跟随时，启动AGV模拟
                      startAgvSimulation();
                      
                      // 使用当前位置或模拟位置作为初始位置
                      const initialPosition = simulatedPosition || currentPosition;
                      
                      // 计算地图偏移，使AGV固定在画布中心
                      if (initialPosition && canvasRef.current) {
                        const canvas = canvasRef.current;
                        const rect = canvas.getBoundingClientRect();
                        const canvasCenterX = rect.width / 2;
                        const canvasCenterY = rect.height / 2;
                        
                        // 计算地图偏移：地图需要向相反方向移动，使AGV看起来固定在中心
                        const mapOffsetX = canvasCenterX - initialPosition.x;
                        const mapOffsetY = canvasCenterY - initialPosition.y;
                        
                        console.log('🚗 [车载跟随] 地图偏移计算:', {
                          canvasWidth: rect.width,
                          canvasHeight: rect.height,
                          canvasCenterX,
                          canvasCenterY,
                          initialPosition,
                          mapOffsetX,
                          mapOffsetY
                        });
                        
                        const newMapOffset = {
                          x: mapOffsetX,
                          y: mapOffsetY
                        };
                        
                        console.log('🚗 [车载跟随] 设置地图偏移:', newMapOffset);
                        
                        setMapOffset(newMapOffset);
                        setLastFollowPosition(initialPosition);
                        
                        console.log('🚗 [车载跟随] 地图偏移已设置');
                      } else {
                        console.log('🚗 [车载跟随] 无法调整地图偏移 - initialPosition或canvasRef为空');
                      }
                    } else {
                      message.info('车载跟随已关闭，AGV停止移动');
                      // 关闭车载跟随时，停止AGV模拟
                      stopAgvSimulation();
                      setLastFollowPosition(null);
                    }
                  }}
                />
              </div>
            </Card>

            {/* AGV控制面板 - 仅在车载跟随开启时显示 */}
            {isVehicleFollowEnabled && (
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CompassOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>AGV控制</span>
                  </div>
                  
                  {/* 方向控制 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>移动方向</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Slider
                        min={0}
                        max={360}
                        value={agvDirection}
                        onChange={(value) => setAgvDirection(value)}
                        style={{ flex: 1 }}
                        tooltip={{ formatter: (value) => `${value}°` }}
                      />
                      <span style={{ fontSize: '11px', minWidth: '35px', textAlign: 'right' }}>
                        {agvDirection}°
                      </span>
                    </div>
                  </div>
                  
                  {/* 速度控制 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>移动速度</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Slider
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={agvSpeed}
                        onChange={(value) => setAgvSpeed(value)}
                        style={{ flex: 1 }}
                        tooltip={{ formatter: (value) => `${value} px/frame` }}
                      />
                      <span style={{ fontSize: '11px', minWidth: '45px', textAlign: 'right' }}>
                        {agvSpeed.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {/* 快捷方向按钮 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>快捷方向</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      <Button size="small" onClick={() => setAgvDirection(315)} style={{ fontSize: '10px' }}>↖</Button>
                      <Button size="small" onClick={() => setAgvDirection(0)} style={{ fontSize: '10px' }}>↑</Button>
                      <Button size="small" onClick={() => setAgvDirection(45)} style={{ fontSize: '10px' }}>↗</Button>
                      <Button size="small" onClick={() => setAgvDirection(270)} style={{ fontSize: '10px' }}>←</Button>
                      <Button size="small" onClick={() => setAgvSpeed(0)} danger style={{ fontSize: '10px' }}>停</Button>
                      <Button size="small" onClick={() => setAgvDirection(90)} style={{ fontSize: '10px' }}>→</Button>
                      <Button size="small" onClick={() => setAgvDirection(225)} style={{ fontSize: '10px' }}>↙</Button>
                      <Button size="small" onClick={() => setAgvDirection(180)} style={{ fontSize: '10px' }}>↓</Button>
                      <Button size="small" onClick={() => setAgvDirection(135)} style={{ fontSize: '10px' }}>↘</Button>
                    </div>
                  </div>
                  
                  {/* 当前状态显示 */}
                  {simulatedPosition && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#666', 
                      padding: '4px 8px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}>
                      位置: ({simulatedPosition.x.toFixed(1)}, {simulatedPosition.y.toFixed(1)})
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* 雷达时图功能区 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '12px'
          }}>
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '48px'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RadarChartOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>雷达时图</span>
                <Switch 
                  size="small" 
                  checked={isRadarEnabled}
                  onChange={(checked) => {
                    setIsRadarEnabled(checked);
                  }}
                />
              </div>
            </Card>
          </div>

          {/* 定位功能区 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '12px'
          }}>
            {/* 定位模式开关 */}
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '48px'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AimOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>定位功能</span>
                <Switch 
                  size="small" 
                  checked={isPositioningEnabled}
                  onChange={handlePositioningToggle}
                />
              </div>
              
              {/* 定位模式选择 */}
              {isPositioningEnabled && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                    定位模式
                  </div>
                  <Radio.Group 
                    size="small" 
                    value={positioningMode} 
                    onChange={(e) => handlePositioningModeChange(e.target.value)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                  >
                    <Radio value="manual" style={{ fontSize: '11px' }}>手动定位</Radio>
                    <Radio value="auto" style={{ fontSize: '11px' }}>自动定位</Radio>
                  </Radio.Group>
                </div>
              )}
            </Card>

            {/* 定位操作按钮 */}
            {isPositioningEnabled && (
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                {positioningMode === 'manual' ? (
                  <Button
                    type={isManualPositioning ? 'primary' : 'default'}
                    icon={isManualPositioning ? <LoadingOutlined /> : <AimOutlined />}
                    size="small"
                    onClick={handleManualPositioningStart}
                    disabled={isPositioning}
                    style={{
                      width: '100%',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px'
                    }}
                  >
                    {isManualPositioning ? '拖动定位' : '手动定位'}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={isPositioning ? <LoadingOutlined /> : <SendOutlined />}
                    size="small"
                    onClick={handleAutoPositioning}
                    disabled={isPositioning}
                    style={{
                      width: '100%',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px'
                    }}
                  >
                    {isPositioning ? '定位中...' : '自动定位'}
                  </Button>
                )}
              </Card>
            )}
          </div>

          {/* 机器人控制功能区 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '12px'
          }}>
          {/* 手动控制模式开关 */}
          <Card 
            size="small" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minHeight: '48px'
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CarOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>手动控制</span>
              <Switch 
                size="small" 
                checked={isManualControlEnabled}
                onChange={handleManualControlToggle}
              />
            </div>
            
            {/* 速度控制滑条 */}
            {isManualControlEnabled && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                  速度: {controlSpeed}%
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={10}
                  value={controlSpeed}
                  onChange={handleSpeedChange}
                  style={{ margin: 0 }}
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
              </div>
            )}
          </Card>

          {/* 方向控制手柄 */}
          {isManualControlEnabled && (
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 40px 40px',
                gridTemplateRows: '40px 40px 40px',
                gap: '4px',
                justifyContent: 'center'
              }}>
                {/* 第一行 - 上 */}
                <div></div>
                <Button
                  type={currentDirection === 'up' && isMoving ? 'primary' : 'default'}
                  icon={<UpOutlined />}
                  size="small"
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: currentDirection === 'up' && isMoving ? '#1890ff' : '#f5f5f5',
                    border: 'none',
                    color: currentDirection === 'up' && isMoving ? '#fff' : '#666'
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleRobotMove('up');
                  }}
                  onMouseUp={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleRobotStop();
                  }}
                />
                <div></div>

                {/* 第二行 - 左、停止、右 */}
                <Button
                  type={currentDirection === 'left' && isMoving ? 'primary' : 'default'}
                  icon={<LeftOutlined />}
                  size="small"
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: currentDirection === 'left' && isMoving ? '#1890ff' : '#f5f5f5',
                    border: 'none',
                    color: currentDirection === 'left' && isMoving ? '#fff' : '#666'
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleRobotMove('left');
                  }}
                  onMouseUp={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleRobotStop();
                  }}
                />
                <Button
                  icon={<StopOutlined />}
                  size="small"
                  danger
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                  }}
                  onClick={handleRobotStop}
                />
                <Button
                  type={currentDirection === 'right' && isMoving ? 'primary' : 'default'}
                  icon={<RightOutlined />}
                  size="small"
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: currentDirection === 'right' && isMoving ? '#1890ff' : '#f5f5f5',
                    border: 'none',
                    color: currentDirection === 'right' && isMoving ? '#fff' : '#666'
                  }}
                  onMouseDown={() => handleRobotMove('right')}
                  onMouseUp={handleRobotStop}
                />

                {/* 第三行 - 下 */}
                <div></div>
                <Button
                  type={currentDirection === 'down' && isMoving ? 'primary' : 'default'}
                  icon={<DownOutlined />}
                  size="small"
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: currentDirection === 'down' && isMoving ? '#1890ff' : '#f5f5f5',
                    border: 'none',
                    color: currentDirection === 'down' && isMoving ? '#fff' : '#666'
                  }}
                  onMouseDown={() => handleRobotMove('down')}
                  onMouseUp={handleRobotStop}
                />
                <div></div>
              </div>
            </Card>
          )}


        </div>
      </div>
      )}

      {/* 编辑模式下的功能控制面板 - 底部中间位置 */}
      {currentMode === 'edit' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          zIndex: 1000,
          alignItems: 'flex-end'
        }}>
          {/* 雷达时图功能 */}
          <Card 
            size="small" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minHeight: '48px'
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RadarChartOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>雷达时图</span>
              <Switch 
                size="small" 
                checked={isRadarEnabled}
                onChange={(checked) => {
                  setIsRadarEnabled(checked);
                }}
              />
            </div>
          </Card>

          {/* 扫图功能区 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {/* 扫图方向控制手柄 */}
            {isScanEnabled && (
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  width: '152px'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 40px 40px',
                  gridTemplateRows: '40px 40px 40px',
                  gap: '4px',
                  justifyContent: 'center'
                }}>
                  {/* 第一行 - 上 */}
                  <div></div>
                  <Button
                    type={scanDirection === 'up' && isScanMoving ? 'primary' : 'default'}
                    icon={<UpOutlined />}
                    size="small"
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      background: scanDirection === 'up' && isScanMoving ? '#1890ff' : '#f5f5f5',
                      border: 'none',
                      color: scanDirection === 'up' && isScanMoving ? '#fff' : '#666'
                    }}
                    onMouseDown={() => handleScanMove('up')}
                    onMouseUp={handleScanStop}
                    onMouseLeave={handleScanStop}
                  />
                  <div></div>

                  {/* 第二行 - 左、停止、右 */}
                  <Button
                    type={scanDirection === 'left' && isScanMoving ? 'primary' : 'default'}
                    icon={<LeftOutlined />}
                    size="small"
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      background: scanDirection === 'left' && isScanMoving ? '#1890ff' : '#f5f5f5',
                      border: 'none',
                      color: scanDirection === 'left' && isScanMoving ? '#fff' : '#666'
                    }}
                    onMouseDown={() => handleScanMove('left')}
                    onMouseUp={handleScanStop}
                    onMouseLeave={handleScanStop}
                  />
                  <Button
                    icon={<StopOutlined />}
                    size="small"
                    danger
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px'
                    }}
                    onClick={handleScanStop}
                  />
                  <Button
                    type={scanDirection === 'right' && isScanMoving ? 'primary' : 'default'}
                    icon={<RightOutlined />}
                    size="small"
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      background: scanDirection === 'right' && isScanMoving ? '#1890ff' : '#f5f5f5',
                      border: 'none',
                      color: scanDirection === 'right' && isScanMoving ? '#fff' : '#666'
                    }}
                    onMouseDown={() => handleScanMove('right')}
                    onMouseUp={handleScanStop}
                    onMouseLeave={handleScanStop}
                  />

                  {/* 第三行 - 下 */}
                  <div></div>
                  <Button
                    type={scanDirection === 'down' && isScanMoving ? 'primary' : 'default'}
                    icon={<DownOutlined />}
                    size="small"
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      background: scanDirection === 'down' && isScanMoving ? '#1890ff' : '#f5f5f5',
                      border: 'none',
                      color: scanDirection === 'down' && isScanMoving ? '#fff' : '#666'
                    }}
                    onMouseDown={() => handleScanMove('down')}
                    onMouseUp={handleScanStop}
                    onMouseLeave={handleScanStop}
                  />
                  <div></div>
                </div>
              </Card>
            )}

            {/* 扫图功能开关和速度控制 */}
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '48px',
                width: isScanEnabled ? '152px' : '136px'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AimOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>扫图功能</span>
                <Switch 
                  size="small" 
                  checked={isScanEnabled}
                  onChange={handleScanToggle}
                />
              </div>
              
              {/* 扫图速度控制滑条 */}
              {isScanEnabled && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                    速度: {scanSpeed}%
                  </div>
                  <Slider
                    min={10}
                    max={100}
                    step={10}
                    value={scanSpeed}
                    onChange={handleScanSpeedChange}
                    style={{ margin: 0 }}
                    tooltip={{ formatter: (value) => `${value}%` }}
                  />
                </div>
              )}
            </Card>
          </div>

          {/* 站点采样功能区 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {/* 站点采样方向控制手柄 */}
            {isSampleEnabled && (
              <>
                <Card 
                  size="small" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    width: '152px'
                  }}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 40px 40px',
                    gridTemplateRows: '40px 40px 40px',
                    gap: '4px',
                    justifyContent: 'center'
                  }}>
                    {/* 第一行 - 上 */}
                    <div></div>
                    <Button
                      type={sampleDirection === 'up' && isSampleMoving ? 'primary' : 'default'}
                      icon={<UpOutlined />}
                      size="small"
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: sampleDirection === 'up' && isSampleMoving ? '#1890ff' : '#f5f5f5',
                        border: 'none',
                        color: sampleDirection === 'up' && isSampleMoving ? '#fff' : '#666'
                      }}
                      onMouseDown={() => handleSampleMove('up')}
                      onMouseUp={handleSampleStop}
                      onMouseLeave={handleSampleStop}
                    />
                    <div></div>

                    {/* 第二行 - 左、停止、右 */}
                    <Button
                      type={sampleDirection === 'left' && isSampleMoving ? 'primary' : 'default'}
                      icon={<LeftOutlined />}
                      size="small"
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: sampleDirection === 'left' && isSampleMoving ? '#1890ff' : '#f5f5f5',
                        border: 'none',
                        color: sampleDirection === 'left' && isSampleMoving ? '#fff' : '#666'
                      }}
                      onMouseDown={() => handleSampleMove('left')}
                      onMouseUp={handleSampleStop}
                      onMouseLeave={handleSampleStop}
                    />
                    <Button
                      icon={<StopOutlined />}
                      size="small"
                      danger
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px'
                      }}
                      onClick={handleSampleStop}
                    />
                    <Button
                      type={sampleDirection === 'right' && isSampleMoving ? 'primary' : 'default'}
                      icon={<RightOutlined />}
                      size="small"
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: sampleDirection === 'right' && isSampleMoving ? '#1890ff' : '#f5f5f5',
                        border: 'none',
                        color: sampleDirection === 'right' && isSampleMoving ? '#fff' : '#666'
                      }}
                      onMouseDown={() => handleSampleMove('right')}
                      onMouseUp={handleSampleStop}
                      onMouseLeave={handleSampleStop}
                    />

                    {/* 第三行 - 下 */}
                    <div></div>
                    <Button
                      type={sampleDirection === 'down' && isSampleMoving ? 'primary' : 'default'}
                      icon={<DownOutlined />}
                      size="small"
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: sampleDirection === 'down' && isSampleMoving ? '#1890ff' : '#f5f5f5',
                        border: 'none',
                        color: sampleDirection === 'down' && isSampleMoving ? '#fff' : '#666'
                      }}
                      onMouseDown={() => handleSampleMove('down')}
                      onMouseUp={handleSampleStop}
                      onMouseLeave={handleSampleStop}
                    />
                    <div></div>
                  </div>
                </Card>

                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={handleSampleStation}
                  style={{
                    background: '#ff8c00',
                    borderColor: '#ff8c00',
                    width: '152px',
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)'
                  }}
                >
                  采样
                </Button>
              </>
            )}

            {/* 站点采样开关和速度控制 */}
            <Card 
              size="small" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '48px',
                width: isSampleEnabled ? '152px' : '136px'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EnvironmentOutlined style={{ color: '#ff7a00' }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>站点采样</span>
                <Switch 
                  size="small" 
                  checked={isSampleEnabled}
                  onChange={handleSampleToggle}
                />
              </div>
              
              {/* 采样速度控制滑条 */}
              {isSampleEnabled && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                    速度: {sampleSpeed}%
                  </div>
                  <Slider
                    min={10}
                    max={100}
                    step={10}
                    value={sampleSpeed}
                    onChange={handleSampleSpeedChange}
                    style={{ margin: 0 }}
                    tooltip={{ formatter: (value) => `${value}%` }}
                  />
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 地图管理弹窗 */}
      <Modal
        title="地图管理"
        open={mapManagementVisible}
        onCancel={() => {
          setMapManagementVisible(false);
          setSelectedMapList(null);
        }}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <Row gutter={16} style={{ height: '600px' }}>
          {/* 左侧地图列表 */}
          <Col span={12}>
            <Card 
              title="地图列表" 
              size="small"
              style={{ height: '100%' }}
              bodyStyle={{ padding: '8px', height: 'calc(100% - 40px)', overflow: 'auto' }}
            >
              <List
                dataSource={mapLists}
                renderItem={(item: MapListItem) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedMapList === item.id ? '#e6f7ff' : 'transparent',
                      border: selectedMapList === item.id ? '1px solid #1890ff' : '1px solid transparent',
                      borderRadius: '4px',
                      margin: '4px 0',
                      padding: '8px'
                    }}
                    onClick={() => handleSelectMapList(item.id)}
                    actions={[
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteMapList(item.id);
                        }}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Typography.Text strong>{item.name}</Typography.Text>
                          <Badge count={item.fileCount} style={{ backgroundColor: '#52c41a' }} />
                        </Space>
                      }
                      description={
                        <div>
                          <div>{item.description}</div>
                          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                            创建时间: {item.createTime}
                          </Typography.Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 右侧地图文件列表 */}
          <Col span={12}>
            <Card 
              title={selectedMapList ? `地图文件 - ${mapLists.find(list => list.id === selectedMapList)?.name}` : '地图文件'}
              size="small"
              style={{ height: '100%' }}
              bodyStyle={{ padding: '8px', height: 'calc(100% - 40px)', overflow: 'auto' }}
            >
              {selectedMapList ? (
                <List
                  dataSource={mapFiles[selectedMapList] || []}
                  renderItem={(file: MapFileItem) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => selectedMapList && handleDeleteMapFile(selectedMapList, file.id)}
                        >
                          删除
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={<Typography.Text strong>{file.name}</Typography.Text>}
                        description={
                          <div>
                            <div>文件大小: {file.size}</div>
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                              修改时间: {file.lastModified}
                            </Typography.Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999'
                }}>
                  请选择左侧的地图列表查看文件
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* 任务诊断模态框 */}
      <Modal
        title="任务诊断"
        open={taskDiagnosisVisible}
        onCancel={() => {
          setTaskDiagnosisVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setTaskDiagnosisVisible(false);
            setSelectedTask(null);
          }}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedTask && (
          <div style={{ padding: '16px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 任务基本信息 */}
              <Card size="small" title="任务信息">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>任务名称：</span>
                      <span style={{ fontWeight: 500 }}>{selectedTask.name}</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>任务类型：</span>
                      <span style={{ fontWeight: 500 }}>
                        {selectedTask.type === 'navigation' ? '导航' :
                         selectedTask.type === 'patrol' ? '巡逻' :
                         selectedTask.type === 'cleaning' ? '清洁' : '配送'}
                      </span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>开始时间：</span>
                      <span>{selectedTask.startTime}</span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>结束时间：</span>
                      <span>{selectedTask.endTime || '未完成'}</span>
                    </div>
                  </Col>
                  <Col span={24}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>任务描述：</span>
                      <span>{selectedTask.description}</span>
                    </div>
                  </Col>
                  {selectedTask.targetPoint && (
                    <Col span={24}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#666', fontSize: '12px' }}>目标点：</span>
                        <span>{selectedTask.targetPoint}</span>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card>

              {/* 错误信息 */}
              {selectedTask.status === 'failed' && selectedTask.errorMessage && (
                <Card size="small" title="错误信息">
                  <div style={{
                    padding: '12px',
                    background: '#fff2f0',
                    border: '1px solid #ffccc7',
                    borderRadius: '6px',
                    color: '#ff4d4f'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                      错误原因：
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                      {selectedTask.errorMessage}
                    </div>
                  </div>
                </Card>
              )}

              {/* 路径信息 */}
              {selectedTask.route && selectedTask.route.length > 0 && (
                <Card size="small" title="执行路径">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedTask.route.map((point, index) => (
                      <div key={index} style={{
                        padding: '4px 8px',
                        background: '#f0f2f5',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ color: '#666' }}>{index + 1}.</span>
                        <span>{point}</span>
                        {index < (selectedTask.route?.length || 0) - 1 && (
                          <RightOutlined style={{ fontSize: '10px', color: '#999', marginLeft: '4px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 诊断建议 */}
              {selectedTask.status === 'failed' && (
                <Card size="small" title="诊断建议">
                  <div style={{
                    padding: '12px',
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '8px', color: '#52c41a' }}>
                      建议解决方案：
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#666' }}>
                      <li>检查目标点是否可达</li>
                      <li>确认路径上是否有障碍物</li>
                      <li>检查设备电量是否充足</li>
                      <li>验证网络连接状态</li>
                      <li>重新校准设备定位</li>
                    </ul>
                  </div>
                </Card>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeviceMapEditor;