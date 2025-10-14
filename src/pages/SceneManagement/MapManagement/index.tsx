import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Dropdown,
  Tag,
  Row,
  Col,
  Avatar,
  Typography,
  Divider,
  Badge,
  Switch,
  Pagination,
  Drawer,
  Form,
  Input,
  Upload,
  message,
  Tabs,
  Modal,
  Popover,
  Radio,
  Select,
  Slider,
  Checkbox,
  Progress,
  Alert,
  List,
  Collapse,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { ChangeEvent } from 'react';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined,
  SyncOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileImageOutlined,
  PlusOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  ImportOutlined,
  FolderOpenOutlined,
  RobotOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  DragOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
  AppstoreOutlined,
  GroupOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import BatchSettingsPanel from './BatchSettingsPanel';
import { isDev } from '@/lib/utils';

// 添加CSS样式
const thumbnailHoverStyle = `
  .thumbnail-overlay:hover {
    opacity: 1 !important;
  }
  .network-group-label:hover .network-group-actions {
    opacity: 1 !important;
  }
`;

// 将样式注入到页面中
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = thumbnailHoverStyle;
  document.head.appendChild(styleElement);
}

const { Title } = Typography;

// 地图数据类型
interface MapData {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive';
  thumbnail: string;
  description: string;
  createTime: string;
  updateTime: string;
  updateUser: string;
}

// 地图线条数据类型
interface MapLine {
  id: string;
  name: string;
  startPointId: string;
  endPointId: string;
  type: 'straight' | 'curve' | 'doubleStraight' | 'doubleCurve' | 'single-bezier' | 'double-bezier' | 'single-line' | 'double-line';
  color: string;
  width: number;
  cp1?: { x: number; y: number }; // 贝塞尔曲线控制点1
  cp2?: { x: number; y: number }; // 贝塞尔曲线控制点2
  controlPoints?: {
    cp1?: { x: number; y: number };
    cp2?: { x: number; y: number };
  };
  length?: number; // 线的长度
  // 新增的12个字段
  weight?: number; // 权重
  vehicleExpansionSize?: number; // 车身膨胀大小（单位：m）
  isDisabled?: boolean; // 是否禁用（默认启用）
  isReverse?: boolean; // 是否倒车
  drivingAngle?: number; // 行驶持夹角（度数，正负180度）
  maxLinearVelocity?: number; // 最大线速度（单位：m/s）
  maxLinearAcceleration?: number; // 最大线加速度（单位：m/s²）
  maxLinearDeceleration?: number; // 最大线减速度（单位：m/s²）
  maxAngularVelocity?: number; // 最大角速度（单位：rad/s）
  maxAngularAcceleration?: number; // 最大角加速度（单位：rad/s²）
  arrivalDistancePrecision?: number; // 到点距离精度（单位：m）
  arrivalAnglePrecision?: number; // 到点角度精度（单位：度）
}

// 地图区域数据类型
interface MapArea {
  id: string;
  name: string;
  type: '工作区域' | '禁行区域' | '调速区域' | '多路网区' | 'forbidden' | 'cleaning' | 'virtual_wall' | 'slow_cleaning';
  points: { x: number; y: number }[];
  color: string;
  fillOpacity: number;
  fillColor?: string; // 填充颜色
  strokeColor?: string; // 边框颜色
  opacity?: number; // 透明度
  speed?: number; // 调速区域的速度值
  networkGroupId?: string; // 关联的路网组ID
  robotId?: string; // 关联的机器人ID
}

// 地图文件数据类型
interface MapFile {
  id: string;
  name: string;
  thumbnail: string;
  status: 'active' | 'inactive';
  format: string;
  description?: string;
  topologyData?: {
    points?: any[];
    lines?: MapLine[];
    areas?: MapArea[];
    strokes?: any[];
  };
  grayscaleData?: string; // base64 图片数据
  mapInfo?: {
    mapName?: string;
    originX?: number;
    originY?: number;
    direction?: number;
    width?: number;
    height?: number;
    resolution?: number;
  };
}

// 机器人设备类型
interface RobotDevice {
  id: string;
  deviceName: string;
  deviceKey: string;
  deviceType: string;
  productName: string;
  isEnabled: boolean;
  currentStatus: string;
  isOnline: boolean;
  relatedMap: string;
  mapPosition: string;
  ipAddress: string;
  port: string;
  batteryLevel: number;
  updateTime: string;
  updatedBy: string;
  lastConnectTime: string;
}

// 路网节点接口
interface NetworkNode {
  id: string;
  name: string;
  description: string;
}

// 路网路径接口
interface NetworkPath {
  id: string;
  name: string;
  description: string;
}

// 路网组接口
interface NetworkGroup {
  id: string;
  name: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  areaId?: string; // 关联的区域ID，用于区域隔离
  visible?: boolean; // 控制路网组数据的显示/隐藏
  nodes: NetworkNode[];
  paths: NetworkPath[];
}



// 同步状态接口
interface SyncStatus {
  robotId: string;
  robotName: string;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  progress: number;
  errorMessage?: string;
  startTime?: string;
  endTime?: string;
}

// 同步结果接口
interface SyncResult {
  robotId: string;
  robotName: string;
  success: boolean;
  status: 'success' | 'failed';
  errorMessage?: string;
  duration: number;
}

const MapManagement: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapFiles, setMapFiles] = useState<Record<string, MapFile[]>>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingMap, setEditingMap] = useState<MapData | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [editUploadedFile, setEditUploadedFile] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'front' | 'top' | 'side'>('front');
  
  // 导入功能相关状态
  const [importPopoverVisible, setImportPopoverVisible] = useState(false);
  const [robotDrawerVisible, setRobotDrawerVisible] = useState(false);
  const [localImportDrawerVisible, setLocalImportDrawerVisible] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [robotDevices, setRobotDevices] = useState<RobotDevice[]>([]);
  const [robotMaps, setRobotMaps] = useState<string[]>([]);
  const [selectedRobotMaps, setSelectedRobotMaps] = useState<string[]>([]);
  const [selectedRobotMapFiles, setSelectedRobotMapFiles] = useState<Record<string, MapFile[]>>({});
  const [selectedMapFiles, setSelectedMapFiles] = useState<string[]>([]); // 地图文件多选状态
  const [localImportForm] = Form.useForm();
  const [localImportFile, setLocalImportFile] = useState<any>(null);
  const [robotSearchText, setRobotSearchText] = useState<string>('');
  
  // 机器人卡片滑动相关状态
  const [robotSlideIndex, setRobotSlideIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const robotCardsPerPage = 8; // 每页显示8个卡片（2行，每行4个）
  
  // 地图同步相关状态
  const [mapSyncDrawerVisible, setMapSyncDrawerVisible] = useState(false);
  const [syncingMap, setSyncingMap] = useState<MapData | null>(null);
  const [selectedSyncRobots, setSelectedSyncRobots] = useState<string[]>([]);
  const [selectedSyncMapFiles, setSelectedSyncMapFiles] = useState<string[]>([]);
  
  // 同步进度相关状态
  const [syncProgressModalVisible, setSyncProgressModalVisible] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [allSyncCompleted, setAllSyncCompleted] = useState(false);
  
  // 切图相关状态
  const [mapSliceDrawerVisible, setMapSliceDrawerVisible] = useState(false);
  const [slicingMapFile, setSlicingMapFile] = useState<MapFile | null>(null);
  const [selectedSliceRobots, setSelectedSliceRobots] = useState<string[]>([]);
  const [selectedSliceMapFiles, setSelectedSliceMapFiles] = useState<string[]>([]);
  
  // 切图进度相关状态
  const [sliceProgressModalVisible, setSliceProgressModalVisible] = useState(false);
  const [sliceStatuses, setSliceStatuses] = useState<SyncStatus[]>([]);
  const [allSliceCompleted, setAllSliceCompleted] = useState(false);
  
  // 地图名称搜索相关状态已移除
  
  // 新增地图文件相关状态
  const [addMapFileDrawerVisible, setAddMapFileDrawerVisible] = useState(false);
  const [addMapFileStep, setAddMapFileStep] = useState(1); // 1: 基本信息, 2: 地图编辑
  const [addMapFileForm] = Form.useForm();
  const [mapFileUploadedImage, setMapFileUploadedImage] = useState<any>(null);
  const [submitAndNextLoading, setSubmitAndNextLoading] = useState(false);
  const [submitAndExitLoading, setSubmitAndExitLoading] = useState(false);
  const [currentEditFile, setCurrentEditFile] = useState<MapFile | null>(null); // 当前编辑的地图文件

  // Modal容器获取函数
  const getModalContainer = () => {
    // 如果在地图编辑器模式下，返回地图编辑器画布容器
    if (addMapFileStep === 2) {
      const canvasContainer = document.getElementById('map-editor-canvas');
      if (canvasContainer) {
        return canvasContainer;
      }
    }
    // 否则返回默认的document.body
    return document.body;
  };

  
  // 地图信息相关状态
  const [mapInfo, setMapInfo] = useState({
    mapName: '新建地图文件',
    originX: 0,
    originY: 0,
    direction: 0, // -180 到 180
    width: 100, // 单位：米
    height: 100, // 单位：米
    resolution: 0.05 // 分辨率
  });
  

  
  // 计算机器人扫图范围
  const calculateScanArea = () => {
    return (mapInfo.width * mapInfo.height).toFixed(2);
  };

  // 根据分辨率计算比例换算
  const calculateScale = () => {
    // 分辨率单位为m/pixel，转换为cm/pixel后计算比例
    const cmPerPixel = mapInfo.resolution * 100;
    const ratio = Math.round(cmPerPixel);
    return `1:${ratio}`;
  };
  
  // 删除重复的接口定义，这些接口已在文件其他地方定义

  // 根据区域类型和速度获取颜色
  const getAreaColors = (area: MapArea) => {
    if (area.type === '禁行区域') {
      return {
        fillColor: '#ffaaa8',
        strokeColor: '#ff7875'
      };
    } else if (area.type === '调速区域') {
      const speed = area.speed || 0.8;
      if (speed < 0.8) {
        // 低速：浅紫色
        return {
          fillColor: '#b37feb',
          strokeColor: '#9254de'
        };
      } else if (speed >= 0.8 && speed <= 1.0) {
        // 中速：浅绿色
        return {
          fillColor: '#95de64',
          strokeColor: '#73d13d'
        };
      } else {
        // 高速：浅橙色
        return {
          fillColor: '#ffb875',
          strokeColor: '#ff9c6e'
        };
      }
    } else if (area.type === '多路网区') {
      // 多路网区：青色
      return {
        fillColor: '#87e8de',
        strokeColor: '#36cfc9'
      };
    }
    // 默认颜色（调速区域）
    return {
      fillColor: '#95de64',
      strokeColor: '#73d13d'
    };
  };

  // 地图编辑器状态
  const [selectedTool, setSelectedTool] = useState<string>('select'); // 当前选中的工具，默认选中选择工具
  const [mapType, setMapType] = useState<'topology' | 'grayscale'>('topology'); // 地图类型：拓扑地图或黑白底图
  const [currentMode, setCurrentMode] = useState<'edit' | 'view'>('edit'); // 当前模式：编辑模式或阅览模式

  // 预设节点数据 - 已清空测试数据
  const defaultMapPoints: any[] = [];
  
  // 默认路径数据 - 已清空测试数据
  const defaultMapLines: MapLine[] = [];

  const [mapPoints, setMapPoints] = useState<any[]>(defaultMapPoints); // 地图上的点
  const [mapLines, setMapLines] = useState<MapLine[]>(defaultMapLines); // 地图上的连线
  const [mapAreas, setMapAreas] = useState<MapArea[]>([]); // 地图上的区域
  const [pointCounter, setPointCounter] = useState(1); // 点名称计数器
  const [areaCounter, setAreaCounter] = useState(1); // 区域名称计数器
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]); // 选中的点ID列表
  const [selectedLines, setSelectedLines] = useState<string[]>([]); // 选中的线ID列表
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]); // 选中的区域ID列表
  const [selectedVertices, setSelectedVertices] = useState<{areaId: string, vertexIndex: number}[]>([]); // 选中的区域顶点列表
  const [isSelecting, setIsSelecting] = useState(false); // 是否正在框选
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null); // 框选起始点
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null); // 框选结束点
  
  // 批量设置面板状态
  const [batchSettingsPanelVisible, setBatchSettingsPanelVisible] = useState(false); // 批量设置面板显示状态
  
  // 复制粘贴相关状态
  const [copiedElements, setCopiedElements] = useState<{
    points: any[];
    lines: MapLine[];
    areas: MapArea[];
  } | null>(null); // 复制的元素数据
  const [lastClickPosition, setLastClickPosition] = useState<{x: number, y: number} | null>(null); // 最后点击的位置，用于粘贴定位
  const [editingPoint, setEditingPoint] = useState<any | null>(null); // 正在编辑的点
  const [pointEditModalVisible, setPointEditModalVisible] = useState(false); // 点编辑弹窗显示状态
  const [pointEditForm] = Form.useForm(); // 点编辑表单
  
  // 区域绘制相关状态
  const [isDrawingArea, setIsDrawingArea] = useState(false); // 是否正在绘制区域
  const [currentAreaPoints, setCurrentAreaPoints] = useState<{x: number, y: number}[]>([]); // 当前正在绘制的区域点
  const [isCompletingArea, setIsCompletingArea] = useState(false); // 是否正在完成区域创建（防止状态重置）
  const [currentAreaType, setCurrentAreaType] = useState<'工作区域' | '禁行区域' | '调速区域' | '多路网区' | 'forbidden' | 'cleaning' | 'virtual_wall' | 'slow_cleaning'>('调速区域'); // 当前绘制的区域类型
  const [editingArea, setEditingArea] = useState<MapArea | null>(null); // 正在编辑的区域
  const [areaEditModalVisible, setAreaEditModalVisible] = useState(false); // 区域编辑弹窗显示状态
  const [areaEditForm] = Form.useForm(); // 区域编辑表单
  const [networkConfigs, setNetworkConfigs] = useState<Array<{id: string, networkGroupId?: string, associatedRobots?: string[], priority?: number}>>([{id: '1'}]); // 动态路网配置
  
  // 路网组相关状态
  // 路网组列表状态已在下方定义
  
  // 连线相关状态
  const [isConnecting, setIsConnecting] = useState(false); // 是否正在连线
  const [connectingStartPoint, setConnectingStartPoint] = useState<string | null>(null); // 连线起始点ID
  const [lineCounter, setLineCounter] = useState(1); // 线名称计数器
  const [editingLine, setEditingLine] = useState<MapLine | null>(null); // 正在编辑的线
  const [lineEditModalVisible, setLineEditModalVisible] = useState(false); // 线编辑弹窗显示状态
  const [lineEditForm] = Form.useForm(); // 线编辑表单
  const [doubleLineClickCount, setDoubleLineClickCount] = useState<Record<string, number>>({}); // 双向直线的双击计数
  
  // 贝塞尔曲线控制手柄相关状态
  const [selectedControlHandle, setSelectedControlHandle] = useState<{
    lineId: string;
    handleType: 'cp1' | 'cp2';
  } | null>(null); // 选中的控制手柄
  const [isDraggingControlHandle, setIsDraggingControlHandle] = useState(false); // 是否正在拖拽控制手柄
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null); // 拖拽开始位置

  // 元素隐藏相关状态
  const [hideMapNodes, setHideMapNodes] = useState(false); // 隐藏地图节点
  const [hideAllPoints, setHideAllPoints] = useState(false); // 隐藏所有点
  const [hideAllPaths, setHideAllPaths] = useState(false); // 隐藏所有路径
  const [hideVehicleModels, setHideVehicleModels] = useState(true); // 隐藏车体模型，默认开启
  
  // 点拖拽相关状态
  const [isDraggingPoint, setIsDraggingPoint] = useState(false); // 是否正在拖拽点
  
  // 鼠标位置状态
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null); // 鼠标在画布上的位置
  const mousePositionRef = useRef<{x: number, y: number} | null>(null); // 实时鼠标位置引用
  // 强制重新渲染计数器已移除
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null); // 正在拖拽的点ID
  const [pointDragStart, setPointDragStart] = useState<{x: number, y: number} | null>(null); // 点拖拽开始位置
  const [pointsInitialPositions, setPointsInitialPositions] = useState<Record<string, {x: number, y: number}>>({});  // 存储拖拽开始时所有选中点的初始位置

  const [isDraggingSelection, setIsDraggingSelection] = useState(false); // 是否正在拖拽选中的元素组
  const [selectionDragStart, setSelectionDragStart] = useState<{x: number, y: number} | null>(null); // 选中元素组拖拽开始位置
  const [dragAccumulatedOffset, setDragAccumulatedOffset] = useState<{x: number, y: number}>({x: 0, y: 0}); // 拖拽累积偏移量
  
  // 画笔绘制相关状态
  const [isDrawing, setIsDrawing] = useState(false); // 是否正在绘制
  const [isErasing, setIsErasing] = useState(false); // 是否正在擦除
  const [currentStroke, setCurrentStroke] = useState<{x: number, y: number}[]>([]); // 当前正在绘制的笔画
  const [currentEraserStroke, setCurrentEraserStroke] = useState<{x: number, y: number}[]>([]); // 当前正在绘制的橡皮擦笔画
  // 统一的笔画数据结构，支持按时间顺序渲染
  const [allStrokes, setAllStrokes] = useState<{
    id: string;
    points: {x: number, y: number}[];
    type: 'brush' | 'eraser';
    timestamp: number;
    size: number;
  }[]>([]);
  
  // 撤销重做功能相关状态
  const [strokeHistory, setStrokeHistory] = useState<{
    id: string;
    points: {x: number, y: number}[];
    type: 'brush' | 'eraser';
    timestamp: number;
    size: number;
  }[][]>([[]]); // 历史记录数组，每个元素是一个完整的笔画状态
  const [strokeHistoryIndex, setStrokeHistoryIndex] = useState(0); // 当前笔画历史记录索引
  
  // 撤销重做功能函数
  const saveStrokeToHistory = (newStrokes: typeof allStrokes) => {
    setStrokeHistory(prev => {
      const newHistory = prev.slice(0, strokeHistoryIndex + 1);
      newHistory.push([...newStrokes]);
      return newHistory;
    });
    setStrokeHistoryIndex(prev => prev + 1);
  };
  
  const undoStroke = () => {
    if (strokeHistoryIndex > 0) {
      const previousState = strokeHistory[strokeHistoryIndex - 1];
      setAllStrokes([...previousState]);
      setStrokeHistoryIndex(prev => prev - 1);
    }
  };
  
  const redoStroke = () => {
    if (strokeHistoryIndex < strokeHistory.length - 1) {
      const nextState = strokeHistory[strokeHistoryIndex + 1];
      setAllStrokes([...nextState]);
      setStrokeHistoryIndex(prev => prev + 1);
    }
  };
  
  // 保持原有的分离数组用于兼容性（从统一数组中过滤）
  // const brushStrokes = allStrokes.filter(stroke => stroke.type === 'brush');
  // const eraserStrokes = allStrokes.filter(stroke => stroke.type === 'eraser');
  // const [brushSize, setBrushSize] = useState(6); // 画笔大小
  // const [eraserSize, setEraserSize] = useState(6); // 橡皮擦大小
  
  // PNG图片擦除相关状态
  const pngCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null); // 新增网格Canvas引用
  // const [erasedPixels, setErasedPixels] = useState<{x: number, y: number}[]>([]); // 存储被擦除的像素位置
  
  // 控制手柄事件处理函数
  const handleControlHandleMouseDown = (e: React.MouseEvent, lineId: string, handleType: 'cp1' | 'cp2') => {
    e.stopPropagation();
    const rect = (e.currentTarget.closest('svg') as SVGElement)?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 转换为画布坐标
    const canvasX = (mouseX - canvasOffset.x) / canvasScale;
    const canvasY = (mouseY - canvasOffset.y) / canvasScale;
    
    setSelectedControlHandle({ lineId, handleType });
    setIsDraggingControlHandle(true);
    setDragStartPosition({ x: canvasX, y: canvasY });
    
    if (isDev) console.log('🎯 Control handle mouse down:', { lineId, handleType, canvasX, canvasY });
  };

  // 控制手柄拖拽事件
  const handleControlHandleDrag = (e: React.MouseEvent) => {
    if (!isDraggingControlHandle || !selectedControlHandle || !dragStartPosition) return;
    
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 转换为画布坐标
    const canvasX = (mouseX - canvasOffset.x) / canvasScale;
    const canvasY = (mouseY - canvasOffset.y) / canvasScale;
    
    // 更新控制点位置
    setMapLines(prevLines => 
      prevLines.map(line => {
        if (line.id === selectedControlHandle.lineId) {
          const updatedLine = { ...line };
          if (!updatedLine.controlPoints) {
            updatedLine.controlPoints = {};
          }
          
          if (selectedControlHandle.handleType === 'cp1') {
            updatedLine.controlPoints.cp1 = { x: canvasX, y: canvasY };
          } else {
            updatedLine.controlPoints.cp2 = { x: canvasX, y: canvasY };
          }
          
          return updatedLine;
        }
        return line;
      })
    );
  };

  // 控制手柄拖拽结束事件
  const handleControlHandleDragEnd = () => {
    setIsDraggingControlHandle(false);
    setSelectedControlHandle(null);
    setDragStartPosition(null);
    if (isDev) console.log('🎯 Control handle drag end');
  };
  
  // 点拖拽开始事件
  const handlePointMouseDown = (e: React.MouseEvent, pointId: string) => {
    // 只有在选择工具模式下才允许拖拽
    if (selectedTool !== 'select') return;
    
    // 不要阻止事件冒泡，让SVG画布能接收到鼠标移动事件
    // e.stopPropagation();
    
    const rect = (e.currentTarget.closest('.canvas-container') as HTMLElement)?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 转换为画布坐标
    const canvasX = (mouseX - canvasOffset.x) / canvasScale;
    const canvasY = (mouseY - canvasOffset.y) / canvasScale;
    
    // 如果点击的点不在选中列表中，则选中它
    let currentSelectedPoints = selectedPoints;
    if (!selectedPoints.includes(pointId)) {
      currentSelectedPoints = [pointId];
      setSelectedPoints(currentSelectedPoints);
    }
    
    // 存储所有选中点的初始位置
    const initialPositions: Record<string, {x: number, y: number}> = {};
    currentSelectedPoints.forEach(id => {
      const point = mapPoints.find((p: any) => p.id === id);
      if (point) {
        initialPositions[id] = { x: point.x, y: point.y };
      }
    });
    setPointsInitialPositions(initialPositions);
    
    // 保存选中框的初始位置
    if (selectionStart && selectionEnd) {
      // 记录选中框的初始位置（用于拖拽计算）
    }
    
    setIsDraggingPoint(true);
    setDraggingPointId(pointId);
    setPointDragStart({ x: canvasX, y: canvasY });
    
    if (isDev) console.log('🎯 Point drag start:', { pointId, canvasX, canvasY });
  };
  
  // 点拖拽移动事件
  const handlePointDrag = (e: React.MouseEvent) => {
    if (!isDraggingPoint || !draggingPointId || !pointDragStart || Object.keys(pointsInitialPositions).length === 0) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 转换为画布坐标
    const canvasX = (mouseX - canvasOffset.x) / canvasScale;
    const canvasY = (mouseY - canvasOffset.y) / canvasScale;
    
    // 计算从拖拽开始位置的总移动距离
    const deltaX = canvasX - pointDragStart.x;
    const deltaY = canvasY - pointDragStart.y;
    
    // 更新所有选中点的位置（基于初始位置计算新位置）
    setMapPoints(prevPoints => 
      prevPoints.map(point => {
        if (selectedPoints.includes(point.id) && pointsInitialPositions[point.id]) {
          const initialPos = pointsInitialPositions[point.id];
          return {
            ...point,
            x: initialPos.x + deltaX,
            y: initialPos.y + deltaY
          };
        }
        return point;
      })
    );
    
    // 更新连接到移动点的线条
    setMapLines(prevLines => 
      prevLines.map(line => {
        let needsUpdate = false;
        let updatedLine = { ...line };
        
        // 检查线的起点或终点是否是被移动的点
        if (selectedPoints.includes(line.startPointId) || selectedPoints.includes(line.endPointId)) {
          needsUpdate = true;
          
          // 如果是贝塞尔曲线，需要同时更新控制点
          if ((line.type === 'single-bezier' || line.type === 'double-bezier') && line.controlPoints) {
            updatedLine.controlPoints = {
              ...line.controlPoints,
              cp1: line.controlPoints.cp1 ? {
                x: line.controlPoints.cp1.x + deltaX,
                y: line.controlPoints.cp1.y + deltaY
              } : line.controlPoints.cp1,
              cp2: line.controlPoints.cp2 ? {
                x: line.controlPoints.cp2.x + deltaX,
                y: line.controlPoints.cp2.y + deltaY
              } : line.controlPoints.cp2
            };
          }
        }
        
        return needsUpdate ? updatedLine : line;
      })
    );
    
    // 更新选中框位置 - 直接基于拖拽距离更新，避免依赖异步状态
    if (selectedPoints.length > 0 && selectionStart && selectionEnd) {
      // 直接基于当前选中框位置和拖拽距离计算新位置
      setSelectionStart({
        x: selectionStart.x + deltaX,
        y: selectionStart.y + deltaY
      });
      setSelectionEnd({
        x: selectionEnd.x + deltaX,
        y: selectionEnd.y + deltaY
      });
    }
  };
  
  // 点拖拽结束事件
  const handlePointDragEnd = () => {
    setIsDraggingPoint(false);
    setDraggingPointId(null);
    setPointDragStart(null);
    setPointsInitialPositions({});

    if (isDev) console.log('🎯 Point drag end');
  };

  // 处理框选区域拖拽开始
  const handleSelectionMouseDown = (event: React.MouseEvent) => {
    if (selectedTool !== 'select' || selectedPoints.length === 0 || !canvasRef.current) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const canvasCoords = screenToCanvasCoordinates(event.clientX, event.clientY, canvasRef.current);
    setIsDraggingSelection(true);
    setSelectionDragStart(canvasCoords);
    setDragAccumulatedOffset({x: 0, y: 0}); // 重置累积偏移量
    
    // 添加全局mouseup监听器，确保拖拽结束事件能正确触发
    const handleGlobalSelectionMouseUp = () => {
      handleSelectionDragEnd();
      document.removeEventListener('mouseup', handleGlobalSelectionMouseUp);
    };
    
    document.addEventListener('mouseup', handleGlobalSelectionMouseUp);
    
    if (isDev) console.log('🎯 Selection drag start:', canvasCoords);
  };

  // 处理框选区域拖拽移动 - 基于键盘移动逻辑重新实现
  const handleSelectionDrag = (event: React.MouseEvent) => {
    if (!isDraggingSelection || !selectionDragStart || selectedPoints.length === 0 || !canvasRef.current) {
      return;
    }
    
    const currentCanvasCoords = screenToCanvasCoordinates(event.clientX, event.clientY, canvasRef.current);
    
    // 计算从拖拽开始到现在的总偏移量
    const totalDeltaX = currentCanvasCoords.x - selectionDragStart.x;
    const totalDeltaY = currentCanvasCoords.y - selectionDragStart.y;
    
    // 计算相对于上次移动的增量偏移
    const incrementalDeltaX = totalDeltaX - dragAccumulatedOffset.x;
    const incrementalDeltaY = totalDeltaY - dragAccumulatedOffset.y;
    
    // 只有当增量不为0时才移动
    if (incrementalDeltaX !== 0 || incrementalDeltaY !== 0) {
      // 复用键盘移动的逻辑，直接调用移动函数
      moveSelectedElementsByDelta(incrementalDeltaX, incrementalDeltaY);
      
      // 更新累积偏移量
      setDragAccumulatedOffset({x: totalDeltaX, y: totalDeltaY});
    }
  };

  // 处理框选区域拖拽结束
  const handleSelectionDragEnd = () => {
    setIsDraggingSelection(false);
    setSelectionDragStart(null);
    setDragAccumulatedOffset({x: 0, y: 0}); // 重置累积偏移量
    if (isDev) console.log('🎯 Selection drag end');
  };
  
  // 通用的移动选中元素函数
  const moveSelectedElementsByDelta = (deltaX: number, deltaY: number) => {
    // 移动选中的顶点（优先级最高）
    if (selectedVertices.length > 0) {
      setMapAreas(prevAreas => 
        prevAreas.map(area => {
          // 检查这个区域是否有选中的顶点
          const hasSelectedVertices = selectedVertices.some(vertex => vertex.areaId === area.id);
          
          if (hasSelectedVertices) {
            const updatedArea = {
              ...area,
              points: area.points.map((point, index) => {
                // 检查当前顶点是否被选中
                const isVertexSelected = selectedVertices.some(
                  vertex => vertex.areaId === area.id && vertex.vertexIndex === index
                );
                
                if (isVertexSelected) {
                  const newPoint = {
                    x: point.x + deltaX,
                    y: point.y + deltaY
                  };
                  
                  return newPoint;
                }
                return point;
              })
            };
            
            return updatedArea;
          }
          return area;
        })
      );
      
      // 保存到历史记录
      saveToHistory();
    }
    // 移动选中的点
    else if (selectedPoints.length > 0) {
      // 同时更新连接到这些点的线
      setMapLines(prevLines => 
        prevLines.map(line => {
          const isStartPointSelected = selectedPoints.includes(line.startPointId);
          const isEndPointSelected = selectedPoints.includes(line.endPointId);
          
          if (isStartPointSelected || isEndPointSelected) {
            let updatedLine = { ...line };
            
            // 如果是贝塞尔曲线，同步更新控制点
            if ((line.type === 'single-bezier' || line.type === 'double-bezier') && line.controlPoints) {
              updatedLine.controlPoints = {
                ...line.controlPoints,
                ...(line.controlPoints.cp1 && {
                  cp1: {
                    x: line.controlPoints.cp1.x + deltaX,
                    y: line.controlPoints.cp1.y + deltaY
                  }
                }),
                ...(line.controlPoints.cp2 && {
                  cp2: {
                    x: line.controlPoints.cp2.x + deltaX,
                    y: line.controlPoints.cp2.y + deltaY
                  }
                })
              };
            }
            
            return updatedLine;
          }
          return line;
        })
      );
      
      // 🔧 修复：使用setMapPoints的回调函数获取最新的点数据
       setMapPoints(prevPoints => {
         const updatedPoints = prevPoints.map(point => {
           if (selectedPoints.includes(point.id)) {
             const newPoint = {
               ...point,
               x: point.x + deltaX,
               y: point.y + deltaY
             };

             return newPoint;
           }
           return point;
         });
        
        // 在状态更新后立即重新计算选中框位置
        setTimeout(() => {
          if (selectedPoints.length > 0) {
            const selectedPointsData = updatedPoints.filter(point => selectedPoints.includes(point.id));
            if (selectedPointsData.length > 0) {
              const pointRadius = 8;
              const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
              const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
              const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
              const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
              
              setSelectionStart({ x: pointMinX, y: pointMinY });
              setSelectionEnd({ x: pointMaxX, y: pointMaxY });
            }
          }
        }, 0);
        
        return updatedPoints;
      });
      
      // 保存到历史记录
       saveToHistory();
     }
     // 移动选中的区域（优先级最低）
     else if (selectedAreas.length > 0) {
       setMapAreas(prevAreas => 
         prevAreas.map(area => {
           if (selectedAreas.includes(area.id)) {
             const updatedArea = {
               ...area,
               points: area.points.map(point => ({
                 x: point.x + deltaX,
                 y: point.y + deltaY
               }))
             };
             
             return updatedArea;
           }
           return area;
         })
       );
       
       // 保存到历史记录
       saveToHistory();
     }
   };

  // 处理方向键移动选中元素
  const handleArrowKeyMove = (key: string) => {
    const moveDistance = 5; // 每次移动的像素距离
    let deltaX = 0;
    let deltaY = 0;
    
    switch (key) {
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
    
    // 调用通用移动函数
    moveSelectedElementsByDelta(deltaX, deltaY);
  };

  // 处理点位移动控制按钮
  const handlePointMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const moveDistance = 10; // 每次移动的像素距离
    let deltaX = 0;
    let deltaY = 0;
    
    switch (direction) {
      case 'up':
        deltaY = -moveDistance;
        break;
      case 'down':
        deltaY = moveDistance;
        break;
      case 'left':
        deltaX = -moveDistance;
        break;
      case 'right':
        deltaX = moveDistance;
        break;
    }
    
    if (selectedPoints.length > 0) {
      // 更新连接到这些点的线
      setMapLines(prevLines => 
        prevLines.map(line => {
          const isStartPointSelected = selectedPoints.includes(line.startPointId);
          const isEndPointSelected = selectedPoints.includes(line.endPointId);
          
          if (isStartPointSelected || isEndPointSelected) {
            let updatedLine = { ...line };
            
            // 如果是贝塞尔曲线，同步更新控制点
            if ((line.type === 'single-bezier' || line.type === 'double-bezier') && line.controlPoints) {
              updatedLine.controlPoints = {
                ...line.controlPoints,
                ...(line.controlPoints.cp1 && {
                  cp1: {
                    x: line.controlPoints.cp1.x + deltaX,
                    y: line.controlPoints.cp1.y + deltaY
                  }
                }),
                ...(line.controlPoints.cp2 && {
                  cp2: {
                    x: line.controlPoints.cp2.x + deltaX,
                    y: line.controlPoints.cp2.y + deltaY
                  }
                })
              };
            }
            
            return updatedLine;
          }
          return line;
        })
      );
      
      // 更新点位置
      setMapPoints(prevPoints => {
        const updatedPoints = prevPoints.map(point => {
          if (selectedPoints.includes(point.id)) {
            return {
              ...point,
              x: point.x + deltaX,
              y: point.y + deltaY
            };
          }
          return point;
        });
        
        // 更新选中框位置，确保选中框跟随点移动
        setTimeout(() => {
          if (selectedPoints.length > 0) {
            const selectedPointsData = updatedPoints.filter(point => selectedPoints.includes(point.id));
            if (selectedPointsData.length > 0) {
              // 考虑点的实际大小（半径8px）和选中时的缩放（1.2倍）
              const pointRadius = 8 * 1.2;
              const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
              const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
              const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
              const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
              
              // 添加少量边距让框选框紧贴圆圈边缘
              const padding = 3;
              const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
              const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
              
              setSelectionStart(newSelectionStart);
              setSelectionEnd(newSelectionEnd);
            }
          }
        }, 0);
        
        return updatedPoints;
      });
      
      // 保存到历史记录
      saveToHistory();
    }
  };

  // 处理点位旋转90度
  const handlePointRotate = () => {
    if (isDev) console.log('🔄 [旋转调试] 顺时针旋转函数被调用');
    if (isDev) console.log('🔄 [旋转调试] 当前选中点数量:', selectedPoints.length);
    if (isDev) console.log('🔄 [旋转调试] 选中点ID列表:', selectedPoints);
    
    if (selectedPoints.length === 0) {
      if (isDev) console.log('🔄 [旋转调试] 没有选中点，退出旋转');
      return;
    }
    
    // 计算选中点的中心点
    const selectedPointsData = mapPoints.filter(point => selectedPoints.includes(point.id));
    if (isDev) console.log('🔄 [旋转调试] 选中点数据:', selectedPointsData);
    
    if (selectedPointsData.length === 0) {
      if (isDev) console.log('🔄 [旋转调试] 没有找到选中点数据，退出旋转');
      return;
    }
    
    const centerX = selectedPointsData.reduce((sum, point) => sum + point.x, 0) / selectedPointsData.length;
    const centerY = selectedPointsData.reduce((sum, point) => sum + point.y, 0) / selectedPointsData.length;
    
    if (isDev) console.log('🔄 [旋转调试] 旋转中心点:', { centerX, centerY });
    
    // 更新点位置（绕中心点顺时针旋转90度）
    setMapPoints(prevPoints => {
      const updatedPoints = prevPoints.map(point => {
        if (selectedPoints.includes(point.id)) {
          // 计算相对于中心点的坐标
          const relativeX = point.x - centerX;
          const relativeY = point.y - centerY;
          
          // 顺时针旋转90度：(x, y) -> (y, -x)
          const newRelativeX = relativeY;
          const newRelativeY = -relativeX;
          
          // 更新点的方向角度（顺时针旋转90度）
          const currentDirection = point.direction || 0;
          let newDirection = currentDirection + 90;
          
          // 确保角度在 -180 到 180 范围内
          if (newDirection > 180) {
            newDirection -= 360;
          }
          
          const newPoint = {
            ...point,
            x: centerX + newRelativeX,
            y: centerY + newRelativeY,
            direction: newDirection
          };
          
          if (isDev) console.log('🔄 [旋转调试] 点旋转:', {
            pointId: point.id,
            原坐标: { x: point.x, y: point.y },
            新坐标: { x: newPoint.x, y: newPoint.y },
            原方向: currentDirection,
            新方向: newDirection
          });
          
          return newPoint;
        }
        return point;
      });
      
      if (isDev) console.log('🔄 [旋转调试] 旋转完成，更新选中框位置');
      
      // 更新选中框位置
      setTimeout(() => {
        if (selectedPoints.length > 0) {
          const rotatedSelectedPoints = updatedPoints.filter(point => selectedPoints.includes(point.id));
          if (rotatedSelectedPoints.length > 0) {
            const pointRadius = 8;
            const pointMinX = Math.min(...rotatedSelectedPoints.map(p => p.x - pointRadius));
            const pointMaxX = Math.max(...rotatedSelectedPoints.map(p => p.x + pointRadius));
            const pointMinY = Math.min(...rotatedSelectedPoints.map(p => p.y - pointRadius));
            const pointMaxY = Math.max(...rotatedSelectedPoints.map(p => p.y + pointRadius));
            
            const padding = 3;
            const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
            const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
            
            if (isDev) console.log('🔄 [旋转调试] 新选中框位置:', { newSelectionStart, newSelectionEnd });
            
            setSelectionStart(newSelectionStart);
            setSelectionEnd(newSelectionEnd);
          }
        }
      }, 0);
      
      return updatedPoints;
    });
    
    // 更新连接到这些点的线
    setMapLines(prevLines => 
      prevLines.map(line => {
        const isStartPointSelected = selectedPoints.includes(line.startPointId);
        const isEndPointSelected = selectedPoints.includes(line.endPointId);
        
        if (isStartPointSelected || isEndPointSelected) {
          let updatedLine = { ...line };
          
          // 如果是贝塞尔曲线，同步旋转控制点
          if ((line.type === 'single-bezier' || line.type === 'double-bezier') && line.controlPoints) {
            updatedLine.controlPoints = {
              ...line.controlPoints,
              ...(line.controlPoints.cp1 && {
                cp1: (() => {
                  const relativeX = line.controlPoints.cp1.x - centerX;
                  const relativeY = line.controlPoints.cp1.y - centerY;
                  const newRelativeX = relativeY;
                  const newRelativeY = -relativeX;
                  return {
                    x: centerX + newRelativeX,
                    y: centerY + newRelativeY
                  };
                })()
              }),
              ...(line.controlPoints.cp2 && {
                cp2: (() => {
                  const relativeX = line.controlPoints.cp2.x - centerX;
                  const relativeY = line.controlPoints.cp2.y - centerY;
                  const newRelativeX = relativeY;
                  const newRelativeY = -relativeX;
                  return {
                    x: centerX + newRelativeX,
                    y: centerY + newRelativeY
                  };
                })()
              })
            };
          }
          
          return updatedLine;
        }
        return line;
      })
    );
    
    // 保存到历史记录
    saveToHistory();
  };

  // 逆时针旋转90度
  const handlePointRotateCounterClockwise = () => {
    if (isDev) console.log('🔄 [旋转调试] 逆时针旋转函数被调用');
    if (isDev) console.log('🔄 [旋转调试] 当前选中点数量:', selectedPoints.length);
    if (isDev) console.log('🔄 [旋转调试] 选中点ID列表:', selectedPoints);
    
    if (selectedPoints.length === 0) {
      if (isDev) console.log('🔄 [旋转调试] 没有选中点，退出旋转');
      return;
    }
    
    // 计算选中点的中心点
    const selectedPointsData = mapPoints.filter(point => selectedPoints.includes(point.id));
    if (isDev) console.log('🔄 [旋转调试] 选中点数据:', selectedPointsData);
    
    if (selectedPointsData.length === 0) {
      if (isDev) console.log('🔄 [旋转调试] 没有找到选中点数据，退出旋转');
      return;
    }
    
    const centerX = selectedPointsData.reduce((sum, point) => sum + point.x, 0) / selectedPointsData.length;
    const centerY = selectedPointsData.reduce((sum, point) => sum + point.y, 0) / selectedPointsData.length;
    
    if (isDev) console.log('🔄 [旋转调试] 旋转中心点:', { centerX, centerY });
    
    // 更新点的位置（逆时针旋转90度）
    setMapPoints(prevPoints => {
      const updatedPoints = prevPoints.map(point => {
        if (selectedPoints.includes(point.id)) {
          // 计算相对于中心点的位置
          const relativeX = point.x - centerX;
          const relativeY = point.y - centerY;
          
          // 逆时针旋转90度：(x, y) -> (-y, x)
          const newRelativeX = -relativeY;
          const newRelativeY = relativeX;
          
          // 更新direction字段：逆时针旋转90度，当前方向减90度
          const currentDirection = point.direction || 0;
          let newDirection = currentDirection - 90;
          
          // 确保角度在-180到180范围内
          if (newDirection < -180) {
            newDirection += 360;
          }
          
          const newPoint = {
            ...point,
            x: centerX + newRelativeX,
            y: centerY + newRelativeY,
            direction: newDirection
          };
          
          if (isDev) console.log('🔄 [旋转调试] 点坐标变换:', {
            pointId: point.id,
            原坐标: { x: point.x, y: point.y },
            新坐标: { x: newPoint.x, y: newPoint.y },
            原始方向: currentDirection,
            新方向: newDirection
          });
          
          return newPoint;
        }
        return point;
      });
      
      // 更新选中框位置
      setTimeout(() => {
        if (isDev) console.log('🔄 [旋转调试] 逆时针旋转完成，更新选中框位置');
        if (selectedPoints.length > 0) {
          const rotatedSelectedPoints = updatedPoints.filter(point => selectedPoints.includes(point.id));
          if (rotatedSelectedPoints.length > 0) {
            const pointRadius = 8;
            const pointMinX = Math.min(...rotatedSelectedPoints.map(p => p.x - pointRadius));
            const pointMaxX = Math.max(...rotatedSelectedPoints.map(p => p.x + pointRadius));
            const pointMinY = Math.min(...rotatedSelectedPoints.map(p => p.y - pointRadius));
            const pointMaxY = Math.max(...rotatedSelectedPoints.map(p => p.y + pointRadius));
            
            const padding = 3;
            const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
            const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
            
            if (isDev) console.log('🔄 [旋转调试] 新选中框位置:', {
              start: newSelectionStart,
              end: newSelectionEnd
            });
            
            setSelectionStart(newSelectionStart);
            setSelectionEnd(newSelectionEnd);
          }
        }
      }, 0);
      
      return updatedPoints;
    });
    
    // 更新连接到这些点的线
    setMapLines(prevLines => 
      prevLines.map(line => {
        const isStartPointSelected = selectedPoints.includes(line.startPointId);
        const isEndPointSelected = selectedPoints.includes(line.endPointId);
        
        if (isStartPointSelected || isEndPointSelected) {
          let updatedLine = { ...line };
          
          // 如果是贝塞尔曲线，同步旋转控制点
          if ((line.type === 'single-bezier' || line.type === 'double-bezier') && line.controlPoints) {
            updatedLine.controlPoints = {
              ...line.controlPoints,
              ...(line.controlPoints.cp1 && {
                cp1: (() => {
                  const relativeX = line.controlPoints.cp1.x - centerX;
                  const relativeY = line.controlPoints.cp1.y - centerY;
                  const newRelativeX = -relativeY;
                  const newRelativeY = relativeX;
                  return {
                    x: centerX + newRelativeX,
                    y: centerY + newRelativeY
                  };
                })()
              }),
              ...(line.controlPoints.cp2 && {
                cp2: (() => {
                  const relativeX = line.controlPoints.cp2.x - centerX;
                  const relativeY = line.controlPoints.cp2.y - centerY;
                  const newRelativeX = -relativeY;
                  const newRelativeY = relativeX;
                  return {
                    x: centerX + newRelativeX,
                    y: centerY + newRelativeY
                  };
                })()
              })
            };
          }
          
          return updatedLine;
        }
        return line;
      })
    );
    
    // 保存到历史记录
    saveToHistory();
  };
  
  const [, setHoveredPoint] = useState<string | null>(null); // 鼠标悬停的点ID
  const [continuousConnecting, setContinuousConnecting] = useState(false); // 连续连线模式
  const [lastConnectedPoint, setLastConnectedPoint] = useState<string | null>(null); // 上一个连接的点ID
  
  // 防抖处理鼠标位置更新
  const mouseUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 优化的鼠标位置更新函数
  const updateMousePositionOptimized = useCallback((x: number, y: number) => {
    // 立即更新ref，用于虚线渲染
    mousePositionRef.current = { x, y };
    
    // 防抖更新状态，减少重新渲染频率
    if (mouseUpdateTimeoutRef.current) {
      clearTimeout(mouseUpdateTimeoutRef.current);
    }
    
    mouseUpdateTimeoutRef.current = setTimeout(() => {
      setMousePosition({ x, y });
    }, 16); // 约60fps的更新频率
  }, []);
  
  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (mouseUpdateTimeoutRef.current) {
        clearTimeout(mouseUpdateTimeoutRef.current);
      }
    };
  }, []);
  
  // 撤销重做相关状态
  interface HistoryState {
    mapPoints: any[];
    mapLines: MapLine[];
    pointCounter: number;
    lineCounter: number;
  }
  
  const [history, setHistory] = useState<HistoryState[]>([]); // 历史记录栈
  const [historyIndex, setHistoryIndex] = useState(-1); // 当前历史记录索引
  const [maxHistorySize] = useState(50); // 最大历史记录数量
  
  // 画布拖动和缩放相关状态
  const [canvasScale, setCanvasScale] = useState(1); // 画布缩放比例
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 }); // 画布偏移量
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖动画布
  // 拖动起始位置 - 已移除未使用的变量
  const [dragTool, setDragTool] = useState(false); // 是否激活拖动工具
  const [isSpacePressed, setIsSpacePressed] = useState(false); // 是否按住空格键
  const [isCanvasClicked, setIsCanvasClicked] = useState(false); // 画布是否被点击过
  
  // 画布引用
  const canvasRef = React.useRef<HTMLDivElement>(null);
  
  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 右侧信息面板标签页状态
  const [activeTabKey, setActiveTabKey] = useState('tools'); // 默认选中绘图工具Tab

  // 地图原点坐标编辑相关状态
  const [originEditVisible, setOriginEditVisible] = useState(false); // 原点编辑气泡显示状态
  const [tempOriginX, setTempOriginX] = useState<number>(0); // 临时X坐标
  const [tempOriginY, setTempOriginY] = useState<number>(0); // 临时Y坐标

  // 地图方向编辑相关状态
  const [directionEditVisible, setDirectionEditVisible] = useState(false); // 方向编辑气泡显示状态
  const [tempDirection, setTempDirection] = useState<number>(0); // 临时方向值

  // 分辨率编辑相关状态
  const [resolutionEditVisible, setResolutionEditVisible] = useState(false); // 分辨率编辑气泡显示状态
  const [tempResolution, setTempResolution] = useState<number>(0.05); // 临时分辨率值

  // 搜索功能状态
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'line' | 'point'>('line');
  
  // 地图元素展开状态管理
  const [mapElementActiveKey, setMapElementActiveKey] = useState<string | string[]>([]);
  
  // 路网组管理状态
  const [isNetworkGroupModalVisible, setIsNetworkGroupModalVisible] = useState(false);
  const [editingNetworkGroup, setEditingNetworkGroup] = useState<NetworkGroup | null>(null);
  const [networkGroupForm] = Form.useForm();
  const [defaultNetworkGroup, setDefaultNetworkGroup] = useState<string>('network-group1'); // 默认显示的路网组

  // 路网组数据结构
  // interface NetworkNode {
  //   id: string;
  //   name: string;
  //   description: string;
  // }

  // interface NetworkPath {
  //   id: string;
  //   name: string;
  //   description: string;
  // }

  // 路径组数据结构
  interface PathGroupPath {
    id: string;
    name: string;
    description: string;
    startNode: string;  // 起始节点名称
    endNode: string;    // 结束节点名称
  }

  interface PathGroup {
    id: string;
    name: string;
    paths: PathGroupPath[];
  }

  // 路网组状态管理
  const [networkGroups, setNetworkGroups] = useState<NetworkGroup[]>([]);

  // 路径组管理状态
  const [isPathGroupModalVisible, setIsPathGroupModalVisible] = useState(false);
  const [editingPathGroup, setEditingPathGroup] = useState<PathGroup | null>(null);
  const [pathGroupForm] = Form.useForm();

  // 路径组状态管理
  const [pathGroups, setPathGroups] = useState<PathGroup[]>([]);

  // 线条右键菜单相关状态
  const [lineContextMenuVisible, setLineContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuLineIds, setContextMenuLineIds] = useState<string[]>([]);
  
  // 框选区域右键菜单相关状态
  const [selectionContextMenuVisible, setSelectionContextMenuVisible] = useState(false);
  const [selectionContextMenuPosition, setSelectionContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // 路径组选择弹窗相关状态
  const [pathGroupSelectModalVisible, setPathGroupSelectModalVisible] = useState(false);
  const [pathGroupSelectForm] = Form.useForm();

  // 新增路径组气泡相关状态
  const [addPathGroupPopoverVisible, setAddPathGroupPopoverVisible] = useState(false);
  const [newPathGroupName, setNewPathGroupName] = useState('');

  // 路网组选择弹窗相关状态
  const [networkGroupSelectModalVisible, setNetworkGroupSelectModalVisible] = useState(false);
  const [networkGroupSelectForm] = Form.useForm();

  // 新增路网组气泡相关状态
  const [addNetworkGroupPopoverVisible, setAddNetworkGroupPopoverVisible] = useState(false);
  const [newNetworkGroupName, setNewNetworkGroupName] = useState('');
  const [addNetworkGroupLoading, setAddNetworkGroupLoading] = useState(false);



  // 移除节点函数
  // const removeNodeFromGroup = (groupId: string, nodeId: string) => {
  //   setNetworkGroups(prev => prev.map(group => {
  //     if (group.id === groupId) {
  //       return {
  //         ...group,
  //         nodes: group.nodes.filter(node => node.id !== nodeId)
  //       };
  //     }
  //     return group;
  //   }));
  //   message.success('节点已移除');
  // };

  // 移除路径函数
  const removePathFromGroup = (groupId: string, pathId: string) => {
    setNetworkGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          paths: group.paths.filter(path => path.id !== pathId)
        };
      }
      return group;
    }));
    message.success('路径已移除');
  };

  // 新增路网组
  const handleAddNetworkGroup = () => {
    setEditingNetworkGroup(null);
    networkGroupForm.resetFields();
    setIsNetworkGroupModalVisible(true);
  };

  // 编辑路网组
  const handleEditNetworkGroup = (group: NetworkGroup) => {
    setEditingNetworkGroup(group);
    networkGroupForm.setFieldsValue({ name: group.name });
    setIsNetworkGroupModalVisible(true);
  };

  // 删除路网组
  const handleDeleteNetworkGroup = (groupId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个路网组吗？删除后无法恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        // 如果删除的是默认路网组，需要设置新的默认路网组
        if (defaultNetworkGroup === groupId) {
          const remainingGroups = networkGroups.filter(g => g.id !== groupId);
          if (remainingGroups.length > 0) {
            setDefaultNetworkGroup(remainingGroups[0].id);
          }
        }
        setNetworkGroups(prev => prev.filter(group => group.id !== groupId));
        message.success('路网组已删除');
      }
    });
  };

  // 切换路网组可见性
  const handleToggleNetworkGroupVisibility = (groupId: string) => {
    setNetworkGroups(prev => {
      const updatedGroups = prev.map(group => 
        group.id === groupId 
          ? { ...group, visible: !group.visible }
          : group
      );
      
      // 调试信息
      const targetGroup = updatedGroups.find(g => g.id === groupId);
      if (isDev) console.log(`路网组可见性切换:`, {
        groupId,
        groupName: targetGroup?.name,
        newVisible: targetGroup?.visible,
        paths: targetGroup?.paths
      });
      
      return updatedGroups;
    });
  };

  // 设为默认显示
  // const handleSetDefaultNetworkGroup = (groupId: string) => {
  //   setDefaultNetworkGroup(groupId);
  //   message.success('已设为默认显示路网组');
  // };

  // 保存路网组
  const handleSaveNetworkGroup = async () => {
    try {
      const values = await networkGroupForm.validateFields();
      
      if (editingNetworkGroup) {
        // 编辑模式
        setNetworkGroups(prev => prev.map(group => 
          group.id === editingNetworkGroup.id 
            ? { ...group, name: values.name }
            : group
        ));
        message.success('路网组已更新');
      } else {
        // 新增模式
        const newGroup: NetworkGroup = {
          id: `network-group${Date.now()}`,
          name: values.name,
          areaId: editingArea?.id, // 关联到当前编辑区域
          visible: true, // 默认显示
          nodes: [],
          paths: []
        };
        setNetworkGroups(prev => [...prev, newGroup]);
        
        // 如果是第一个路网组，设为默认
        if (networkGroups.length === 0) {
          setDefaultNetworkGroup(newGroup.id);
        }
        
        message.success('路网组已创建');
      }
      
      setIsNetworkGroupModalVisible(false);
      networkGroupForm.resetFields();
      setEditingNetworkGroup(null);
    } catch (error) {
      if (isDev) console.error('保存失败:', error);
    }
  };

  // 处理创建新路网组
  const handleCreateNewNetworkGroup = async () => {
    if (!newNetworkGroupName.trim()) {
      message.warning('请输入路网组名称');
      return;
    }

    // 获取当前选择的区域ID
    const selectedAreaId = networkGroupSelectForm.getFieldValue('areaId');
    if (!selectedAreaId) {
      message.warning('请先选择区域');
      return;
    }

    setAddNetworkGroupLoading(true);
    try {
      // 创建新的路网组
      const newGroup: NetworkGroup = {
        id: `network-group${Date.now()}`,
        name: newNetworkGroupName.trim(),
        areaId: selectedAreaId,
        visible: true, // 默认显示
        nodes: [],
        paths: []
      };
      
      setNetworkGroups(prev => [...prev, newGroup]);
      
      // 自动选择新创建的路网组
      networkGroupSelectForm.setFieldsValue({ networkGroupId: newGroup.id });
      
      // 重置状态
      setNewNetworkGroupName('');
      setAddNetworkGroupPopoverVisible(false);
      
      message.success('路网组创建成功');
    } catch (error) {
      if (isDev) console.error('创建路网组失败:', error);
      message.error('创建路网组失败');
    } finally {
      setAddNetworkGroupLoading(false);
    }
  };

  // 取消创建新路网组
  const handleCancelCreateNetworkGroup = () => {
    setNewNetworkGroupName('');
    setAddNetworkGroupPopoverVisible(false);
  };

  // 新增路径组
  const handleAddPathGroup = () => {
    setEditingPathGroup(null);
    pathGroupForm.resetFields();
    setIsPathGroupModalVisible(true);
  };

  // 编辑路径组
  const handleEditPathGroup = (group: PathGroup) => {
    setEditingPathGroup(group);
    pathGroupForm.setFieldsValue({ name: group.name });
    setIsPathGroupModalVisible(true);
  };

  // 删除路径组
  const handleDeletePathGroup = (groupId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个路径组吗？删除后无法恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        setPathGroups(prev => prev.filter(group => group.id !== groupId));
        message.success('路径组已删除');
      }
    });
  };

  // 删除区域
  const handleDeleteArea = (areaId: string) => {
    const area = mapAreas.find(a => a.id === areaId);
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除区域 "${area?.name}" 吗？删除后无法恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        // 从区域列表中删除
        setMapAreas(prev => prev.filter(area => area.id !== areaId));
        
        // 如果该区域当前被选中，清除选中状态
        if (selectedAreas.includes(areaId)) {
          setSelectedAreas(prev => prev.filter(id => id !== areaId));
        }
        
        message.success('区域已删除');
      }
    });
  };

  // 保存路径组
  const handleSavePathGroup = async () => {
    try {
      const values = await pathGroupForm.validateFields();
      
      if (editingPathGroup) {
        // 编辑模式
        setPathGroups(prev => prev.map(group => 
          group.id === editingPathGroup.id 
            ? { ...group, name: values.name }
            : group
        ));
        message.success('路径组已更新');
      } else {
        // 新增模式
        const newGroup: PathGroup = {
          id: `path-group${Date.now()}`,
          name: values.name,
          paths: []
        };
        setPathGroups(prev => [...prev, newGroup]);
        message.success('路径组已创建');
      }
      
      setIsPathGroupModalVisible(false);
      pathGroupForm.resetFields();
      setEditingPathGroup(null);
    } catch (error) {
      if (isDev) console.error('保存失败:', error);
    }
  };

  // 移除路径组中路径的函数
  const removePathFromPathGroup = (groupId: string, pathId: string) => {
    setPathGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          paths: group.paths.filter(path => path.id !== pathId)
        };
      }
      return group;
    }));
    message.success('路径已从路径组移除');
  };

  // 处理线条右键菜单
  const handleLineContextMenu = (e: React.MouseEvent, lineId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 如果右键的线条没有被选中，则只选中这一条线
    if (!selectedLines.includes(lineId)) {
      setSelectedLines([lineId]);
      setContextMenuLineIds([lineId]);
    } else {
      // 如果右键的线条已被选中，则对所有选中的线条显示菜单
      setContextMenuLineIds(selectedLines);
    }
    
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setLineContextMenuVisible(true);
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setLineContextMenuVisible(false);
    setContextMenuLineIds([]);
  };

  // 处理框选区域右键菜单
  // 完成区域绘制
  const completeAreaDrawing = () => {
    if (currentAreaPoints.length >= 3) {
      // 创建新区域
      const newArea: MapArea = {
        id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `区域${areaCounter}`,
        type: 'forbidden',
        points: [...currentAreaPoints],
        color: '#1890ff',
        fillOpacity: 0.3,
        fillColor: '#1890ff', // 蓝色填充
        strokeColor: '#1890ff', // 蓝色描边
        opacity: 0.3
      };
      
      if (isDev) console.log('🎯 [区域绘制] 完成区域绘制', {
        区域ID: newArea.id,
        区域名称: newArea.name,
        点数: newArea.points.length,
        点坐标: newArea.points
      });
      
      // 保存历史记录
      saveToHistory();
      
      // 添加到区域列表
      setMapAreas(prev => [...prev, newArea]);
      setAreaCounter(prev => prev + 1);
      
      // 重置绘制状态
      setIsDrawingArea(false);
      setCurrentAreaPoints([]);
      
      message.success(`区域 "${newArea.name}" 创建成功`);
    } else {
      message.warning('区域至少需要3个点才能完成绘制');
    }
  };

  const handleSelectionContextMenu = (e: React.MouseEvent) => {
    // 如果正在绘制区域且有足够的点，右键完成绘制
    if ((selectedTool === 'area' || selectedTool === 'forbidden-area' || selectedTool === 'multi-network-area') && isDrawingArea && currentAreaPoints.length >= 3) {
      e.preventDefault();
      e.stopPropagation();
      completeAreaDrawing();
      return;
    }
    
    // 如果正在连线模式（包括连续连线），右键取消连续绘制状态
    if (['single-line', 'double-line', 'single-bezier', 'double-bezier'].includes(selectedTool) && (isConnecting || continuousConnecting)) {
      e.preventDefault();
      e.stopPropagation();
      exitConnectingMode();
      return;
    }
    
    // 只有在有选中元素且在框选区域内时才显示右键菜单
    if (selectedPoints.length > 0 && selectionStart && selectionEnd) {
      e.preventDefault();
      e.stopPropagation();
      
      // 获取框选区域内的线（路径）
      const selectedLinesInSelection = getSelectedLinesInSelection();
      
      // 只有当框选区域内有线（路径）时才显示菜单
      if (selectedLinesInSelection.length > 0) {
        setSelectionContextMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectionContextMenuVisible(true);
      }
    }
  };

  // 关闭框选区域右键菜单
  const handleCloseSelectionContextMenu = () => {
    setSelectionContextMenuVisible(false);
  };

  // 处理画布双击事件
  const handleCanvasDoubleClick = (_e: React.MouseEvent) => {
    // 如果正在绘制区域且有足够的点，双击完成绘制
    if ((selectedTool === 'area' || selectedTool === 'forbidden-area' || selectedTool === 'multi-network-area') && isDrawingArea && currentAreaPoints.length >= 3) {
      completeAreaDrawing();
      return;
    }
    
    // 如果正在连线模式（包括连续连线），双击取消连续绘制状态
    if (['single-line', 'double-line', 'single-bezier', 'double-bezier'].includes(selectedTool) && (isConnecting || continuousConnecting)) {
      exitConnectingMode();
      return;
    }
  };

  // 获取框选区域内的线（路径）
  const getSelectedLinesInSelection = (): string[] => {
    if (!selectionStart || !selectionEnd || selectedPoints.length === 0) {
      return [];
    }

    // 获取框选区域内的点ID
    const selectedPointIds = new Set(selectedPoints);
    
    // 找出连接框选区域内点的线
    const linesInSelection = mapLines.filter(line => {
      return selectedPointIds.has(line.startPointId) && selectedPointIds.has(line.endPointId);
    });
    
    return linesInSelection.map(line => line.id);
  };

  // 处理框选区域内线条加入路径组
  const handleAddSelectionToPathGroup = () => {
    const selectedLinesInSelection = getSelectedLinesInSelection();
    
    if (selectedLinesInSelection.length > 0) {
      // 设置要加入路径组的线条ID
      setContextMenuLineIds(selectedLinesInSelection);
      setSelectionContextMenuVisible(false);
      setPathGroupSelectModalVisible(true);
      pathGroupSelectForm.resetFields();
    } else {
      message.warning('框选区域内没有可加入路径组的线条');
    }
  };

  // 处理框选区域内线条加入路网组
  const handleAddSelectionToNetworkGroup = () => {
    const selectedLinesInSelection = getSelectedLinesInSelection();
    
    if (selectedLinesInSelection.length > 0) {
      // 设置要加入路网组的线条ID
      setContextMenuLineIds(selectedLinesInSelection);
      setSelectionContextMenuVisible(false);
      setNetworkGroupSelectModalVisible(true);
      networkGroupSelectForm.resetFields();
    } else {
      message.warning('框选区域内没有可加入路网组的线条');
    }
  };

  // 打开路径组选择弹窗
  const handleOpenPathGroupSelect = () => {
    setLineContextMenuVisible(false);
    setPathGroupSelectModalVisible(true);
    pathGroupSelectForm.resetFields();
  };

  // 关闭路径组选择弹窗
  const handleClosePathGroupSelect = () => {
    setPathGroupSelectModalVisible(false);
    pathGroupSelectForm.resetFields();
  };

  // 打开路网组选择弹窗
  const handleOpenNetworkGroupSelect = () => {
    setLineContextMenuVisible(false);
    setNetworkGroupSelectModalVisible(true);
    networkGroupSelectForm.resetFields();
  };

  // 关闭路网组选择弹窗
  const handleCloseNetworkGroupSelect = () => {
    setNetworkGroupSelectModalVisible(false);
    networkGroupSelectForm.resetFields();
  };

  // 处理新增路径组气泡确认
  const handleCreateNewPathGroup = () => {
    if (!newPathGroupName.trim()) {
      message.error('请输入路径组名称');
      return;
    }
    if (newPathGroupName.length > 6) {
      message.error('路径组名称不能超过6个字符');
      return;
    }
    
    const newGroup: PathGroup = {
      id: `path-group-${Date.now()}`,
      name: newPathGroupName.trim(),
      paths: []
    };
    setPathGroups(prev => [...prev, newGroup]);
    message.success('新路径组已创建');
    
    // 重置状态
    setNewPathGroupName('');
    setAddPathGroupPopoverVisible(false);
  };

  // 取消新增路径组
  const handleCancelCreatePathGroup = () => {
    setNewPathGroupName('');
    setAddPathGroupPopoverVisible(false);
  };



  // 将选中线条加入路径组
  const handleAddLinesToPathGroup = async () => {
    try {
      const values = await pathGroupSelectForm.validateFields();
      const { pathGroupId } = values;
      
      if (pathGroupId) {
        // 检查线条是否已经在其他路径组中
        const allExistingPathIds = pathGroups.flatMap(group => group.paths.map(p => p.id));
        const duplicateLines = contextMenuLineIds.filter(lineId => allExistingPathIds.includes(lineId));
        
        if (duplicateLines.length > 0) {
          message.warning(`选中的线条中有 ${duplicateLines.length} 条已存在于其他路径组中，将跳过重复的线条`);
        }
        
        // 过滤掉已存在的线条
        const validLineIds = contextMenuLineIds.filter(lineId => !allExistingPathIds.includes(lineId));
        
        if (validLineIds.length === 0) {
          message.warning('所有选中的线条都已存在于路径组中');
          handleClosePathGroupSelect();
          return;
        }
        
        // 将选中的线条加入到路径组
        const linesToAdd = validLineIds.map(lineId => {
          const line = mapLines.find(l => l.id === lineId);
          // 获取线条的起始和结束节点名称
          const startPoint = getPointById(line?.startPointId || '');
          const endPoint = getPointById(line?.endPointId || '');
          const startNode = startPoint?.name || 'n1';
          const endNode = endPoint?.name || 'n2';
          const lineName = line?.name || lineId;
          
          // 根据线条类型决定箭头格式
          let arrow = '-->';
          if (line?.type === 'double-line') {
            arrow = '<-->';
          }
          
          return {
            id: lineId,
            name: lineName,
            description: `${startNode}${arrow}${endNode}`,
            startNode,
            endNode
          };
        });
        
        setPathGroups(prev => prev.map(group => {
          if (group.id === pathGroupId) {
            return {
              ...group,
              paths: [...group.paths, ...linesToAdd]
            };
          }
          return group;
        }));
        
        const groupName = pathGroups.find(g => g.id === pathGroupId)?.name || '路径组';
        message.success(`已将 ${validLineIds.length} 条线加入到 ${groupName}`);
      }
      
      handleClosePathGroupSelect();
    } catch (error) {
      if (isDev) console.error('加入路径组失败:', error);
    }
  };

  // 处理将选中的线条加入到路网组
  const handleAddLinesToNetworkGroup = async () => {
    try {
      const values = await networkGroupSelectForm.validateFields();
      const { networkGroupId } = values;
      
      if (networkGroupId) {
        // 路网组允许重复路径，所以不需要检查重复
        const validLineIds = contextMenuLineIds.filter(lineId => 
          mapLines.some(line => line.id === lineId)
        );
        
        if (validLineIds.length === 0) {
          message.warning('选中的线条不存在');
          handleCloseNetworkGroupSelect();
          return;
        }
        
        // 将选中的线条加入到路网组
        const linesToAdd = validLineIds.map(lineId => {
          const line = mapLines.find(l => l.id === lineId);
          // 获取线条的起始和结束节点名称
          const startPoint = getPointById(line?.startPointId || '');
          const endPoint = getPointById(line?.endPointId || '');
          const startNode = startPoint?.name || 'n1';
          const endNode = endPoint?.name || 'n2';
          const lineName = line?.name || lineId;
          
          // 根据线条类型决定箭头格式
          let arrow = '-->';
          if (line?.type === 'double-line') {
            arrow = '<-->';
          }
          
          return {
            id: lineId,
            name: lineName,
            description: `${startNode}${arrow}${endNode}`,
            startNode,
            endNode
          };
        });
        
        setNetworkGroups(prev => prev.map(group => {
          if (group.id === networkGroupId) {
            return {
              ...group,
              paths: [...group.paths, ...linesToAdd]
            };
          }
          return group;
        }));
        
        const groupName = networkGroups.find(g => g.id === networkGroupId)?.name || '路网组';
        message.success(`已将 ${validLineIds.length} 条线加入到 ${groupName}`);
      }
      
      handleCloseNetworkGroupSelect();
    } catch (error) {
      if (isDev) console.error('加入路网组失败:', error);
    }
  };

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
      setIsSmallScreen(width < 992);
      
      // 根据屏幕大小设置默认每页大小
      const defaultPageSize = width < 768 ? 5 : width >= 1600 ? 15 : 10;
      setPageSize(defaultPageSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 组件初始化时保存初始状态到历史记录
  useEffect(() => {
    const initialState: HistoryState = {
      mapPoints: [],
      mapLines: [],
      pointCounter: 0,
      lineCounter: 0
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  // 退出连线模式函数
  const exitConnectingMode = () => {
    setIsConnecting(false);
    setContinuousConnecting(false);
    setConnectingStartPoint(null);
    setLastConnectedPoint(null);
    setMousePosition(null); // 清除鼠标位置，隐藏临时线条
    mousePositionRef.current = null; // 同时清除ref
  };

  // 框选状态引用
  const wasJustSelecting = React.useRef(false);
  
  // 防抖引用 - 防止React.StrictMode导致的重复点击
  const lastClickTime = React.useRef(0); // 防抖用的时间戳
  const areaClickedFlag = React.useRef(false); // 区域点击标记，用于阻止SVG事件
  const svgRef = React.useRef<SVGSVGElement>(null); // SVG元素引用

  // 屏幕坐标转画布坐标函数
  // 新增：绘制动态网格的函数
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas || !canvasRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 获取画布容器尺寸
    const containerRect = canvasRef.current.getBoundingClientRect();
    
    // 确保容器有有效的尺寸，否则延迟绘制
    if (containerRect.width === 0 || containerRect.height === 0) {
      if (isDev) console.log('🔍 [网格绘制] 容器尺寸为0，延迟绘制网格');
      // 延迟重试绘制
      setTimeout(() => drawGrid(), 50);
      return;
    }
    
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    
    if (isDev) console.log('🎨 [网格绘制] 开始绘制网格:', {
      '容器尺寸': { width: containerRect.width, height: containerRect.height },
      '画布缩放': canvasScale,
      '画布偏移': canvasOffset
    });

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置网格样式
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    // 基础网格大小
    const baseGridSize = 20;
    
    // 根据缩放比例调整网格大小
    let gridSize = baseGridSize * canvasScale;
    
    // 当网格太密时，使用更大的网格
    while (gridSize < 10) {
      gridSize *= 2;
    }
    
    // 当网格太稀疏时，使用更小的网格
    while (gridSize > 100) {
      gridSize /= 2;
    }

    // 计算画布中心点
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 修复网格偏移量计算 - 网格Canvas不受画布变换影响，使用简单的固定网格
    // 根据画布偏移计算网格起始位置，确保网格与画布内容对齐
    const offsetX = (centerX + canvasOffset.x) % gridSize;
    const offsetY = (centerY + canvasOffset.y) % gridSize;

    // 绘制垂直线
    for (let x = offsetX - gridSize; x < canvas.width + gridSize; x += gridSize) {
      if (x >= 0 && x <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }

    // 绘制水平线
    for (let y = offsetY - gridSize; y < canvas.height + gridSize; y += gridSize) {
      if (y >= 0 && y <= canvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  }, [canvasScale, canvasOffset]);

  // 组件挂载时初始化网格显示
  useEffect(() => {
    // 延迟执行确保DOM元素已经渲染完成
    const timer = setTimeout(() => {
      if (isDev) console.log('🚀 [网格初始化] 组件挂载后初始化网格显示');
      drawGrid();
    }, 200); // 增加延迟时间确保DOM完全渲染
    
    return () => clearTimeout(timer);
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 监听画布状态变化，重新绘制网格
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // 监听窗口大小变化，重新绘制网格
  useEffect(() => {
    const handleResize = () => {
      drawGrid();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGrid]);

  // 监听编辑模式变化，重新绘制网格
  useEffect(() => {
    // 当进入编辑模式、编辑地图变化或新增地图进入编辑器时，延迟重绘网格确保DOM已更新
    const timer = setTimeout(() => {
      if (isDev) console.log('🔄 [网格重绘] 编辑模式变化，重新绘制网格:', {
        '当前模式': currentMode,
        '编辑地图': editingMap?.name || '无',
        '新增地图步骤': addMapFileStep
      });
      drawGrid();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentMode, editingMap, addMapFileStep, drawGrid]);

  const screenToCanvasCoordinates = (screenX: number, screenY: number, canvasElement: HTMLDivElement) => {
    const rect = canvasElement.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;
    
    if (isDev) console.log('🔄 [坐标转换] screenToCanvasCoordinates 输入参数:', {
      '1_屏幕坐标': { screenX, screenY },
      '2_画布元素rect': { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      '3_相对坐标': { relativeX, relativeY },
      '4_画布状态': { canvasScale, canvasOffset }
    });
    
    // 修复后的坐标转换实现，匹配新的变换顺序：translate -> scale
    // 变换顺序：translate(offsetX, offsetY) scale(scale)
    // 逆变换：先除以缩放，再减去偏移
    const canvasX = relativeX / canvasScale - canvasOffset.x;
    const canvasY = relativeY / canvasScale - canvasOffset.y;
    
    if (isDev) console.log('🎯 [坐标转换] screenToCanvasCoordinates 转换结果:', {
      '1_计算过程': {
        'relativeX': relativeX,
        'canvasScale': canvasScale,
        'relativeX / canvasScale': relativeX / canvasScale,
        'canvasOffset.x': canvasOffset.x,
        '最终 canvasX': canvasX,
        'relativeY': relativeY,
        'relativeY / canvasScale': relativeY / canvasScale,
        'canvasOffset.y': canvasOffset.y,
        '最终 canvasY': canvasY
      },
      '2_输出画布坐标': { x: canvasX, y: canvasY }
    });
    
    return { x: canvasX, y: canvasY };
  };

  // 专门的坐标转换验证函数
  // 调试坐标转换函数已移除

  // 画布坐标转屏幕坐标函数
  // const canvasToScreenCoordinates = (canvasX: number, canvasY: number) => {
  //   if (!canvasRef.current) return { x: 0, y: 0 };
  //   
  //   const rect = canvasRef.current.getBoundingClientRect();
  //   
  //   if (isDev) console.log('🔄 [坐标转换] canvasToScreenCoordinates 输入参数:', {
  //     '1_画布坐标': { canvasX, canvasY },
  //     '2_画布元素rect': { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
  //     '3_画布状态': { canvasScale, canvasOffset }
  //   });
  //   
  //   // 正向变换：screenCoord = (canvasCoord * canvasScale) + (canvasOffset * canvasScale)
  //   // 然后加上画布在页面中的偏移
  //   const screenX = (canvasX * canvasScale) + (canvasOffset.x * canvasScale) + rect.left;
  //   const screenY = (canvasY * canvasScale) + (canvasOffset.y * canvasScale) + rect.top;
  //   
  //   if (isDev) console.log('🎯 [坐标转换] canvasToScreenCoordinates 转换结果:', {
  //     '1_计算过程': {
  //       'canvasX * canvasScale': canvasX * canvasScale,
  //       'canvasOffset.x * canvasScale': canvasOffset.x * canvasScale,
  //       'rect.left': rect.left,
  //       '最终 screenX': screenX,
  //       'canvasY * canvasScale': canvasY * canvasScale,
  //       'canvasOffset.y * canvasScale': canvasOffset.y * canvasScale,
  //       'rect.top': rect.top,
  //       '最终 screenY': screenY
  //     },
  //     '2_输出屏幕坐标': { x: screenX, y: screenY }
  //   });
  //   
  //   return { x: screenX, y: screenY };
  // };

  // 根据ID获取点数据
  const getPointById = (pointId: string) => {
    if (isDev) console.log('🔍 [getPointById] 查找点数据', {
      searchingForId: pointId,
      mapPointsLength: mapPoints.length,
      mapPointsIds: mapPoints.map(p => p.id),
      mapPointsData: mapPoints.map(p => ({ id: p.id, name: p.name, x: p.x, y: p.y })),
      timestamp: new Date().toISOString()
    });
    
    const foundPoint = mapPoints.find(point => point.id === pointId);
    
    if (isDev) console.log('🎯 [getPointById] 查找结果', {
      searchingForId: pointId,
      foundPoint: foundPoint ? { id: foundPoint.id, name: foundPoint.name, x: foundPoint.x, y: foundPoint.y } : null,
      found: !!foundPoint
    });
    
    return foundPoint;
  };

  // 监听ESC键处理逻辑 - 已合并到统一的键盘事件监听器中

  // 初始化机器人设备数据
  useEffect(() => {
    const mockRobotDevices: RobotDevice[] = [
      {
        id: 'robot_001',
        deviceName: 'AGV-001',
        deviceKey: 'agv_001_key',
        deviceType: '机器人设备',
        productName: 'AGV自动导引车',
        isEnabled: true,
        currentStatus: '空闲',
        isOnline: true,
        relatedMap: '一楼平面图',
        mapPosition: '仓库A区',
        ipAddress: '192.168.1.101',
        port: '8080',
        batteryLevel: 85,
        updateTime: '2024-01-15 14:30:25',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 14:28:15'
      },
      {
        id: 'robot_002',
        deviceName: 'AMR-002',
        deviceKey: 'amr_002_key',
        deviceType: '机器人设备',
        productName: 'AMR移动机器人',
        isEnabled: true,
        currentStatus: '执行中',
        isOnline: true,
        relatedMap: '二楼平面图',
        mapPosition: '生产线B',
        ipAddress: '192.168.1.102',
        port: '8080',
        batteryLevel: 72,
        updateTime: '2024-01-15 15:20:10',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 15:18:05'
      },
      {
        id: 'robot_003',
        deviceName: 'MCR-003',
        deviceKey: 'mcr_003_key',
        deviceType: '机器人设备',
        productName: 'MCR清洁机器人',
        isEnabled: true,
        currentStatus: '充电中',
        isOnline: true,
        relatedMap: '三楼平面图',
        mapPosition: '办公区C',
        ipAddress: '192.168.1.103',
        port: '8080',
        batteryLevel: 45,
        updateTime: '2024-01-15 16:10:30',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 16:08:20'
      },
      {
        id: 'robot_004',
        deviceName: 'AGV-004',
        deviceKey: 'agv_004_key',
        deviceType: '机器人设备',
        productName: 'AGV自动导引车',
        isEnabled: false,
        currentStatus: '异常',
        isOnline: false,
        relatedMap: '一楼平面图',
        mapPosition: '维修区',
        ipAddress: '192.168.1.104',
        port: '8080',
        batteryLevel: 15,
        updateTime: '2024-01-15 12:45:15',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 11:30:45'
      },
      {
        id: 'robot_005',
        deviceName: 'RGV-005',
        deviceKey: 'rgv_005_key',
        deviceType: '机器人设备',
        productName: 'RGV轨道机器人',
        isEnabled: true,
        currentStatus: '空闲',
        isOnline: true,
        relatedMap: '四楼平面图',
        mapPosition: '自动化仓库',
        ipAddress: '192.168.1.105',
        port: '8080',
        batteryLevel: 92,
        updateTime: '2024-01-15 17:15:40',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 17:13:30'
      },
      {
        id: 'robot_006',
        deviceName: 'AGV-006',
        deviceKey: 'agv_006_key',
        deviceType: '机器人设备',
        productName: 'AGV自动导引车',
        isEnabled: true,
        currentStatus: '执行中',
        isOnline: true,
        relatedMap: '一楼平面图',
        mapPosition: '装配区D',
        ipAddress: '192.168.1.106',
        port: '8080',
        batteryLevel: 68,
        updateTime: '2024-01-15 18:05:15',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 18:03:10'
      },
      {
        id: 'robot_007',
        deviceName: 'AMR-007',
        deviceKey: 'amr_007_key',
        deviceType: '机器人设备',
        productName: 'AMR移动机器人',
        isEnabled: true,
        currentStatus: '待机',
        isOnline: true,
        relatedMap: '二楼平面图',
        mapPosition: '质检区E',
        ipAddress: '192.168.1.107',
        port: '8080',
        batteryLevel: 78,
        updateTime: '2024-01-15 18:20:35',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 18:18:25'
      },
      {
        id: 'robot_008',
        deviceName: 'SCR-008',
        deviceKey: 'scr_008_key',
        deviceType: '机器人设备',
        productName: 'SCR安防机器人',
        isEnabled: true,
        currentStatus: '巡检中',
        isOnline: true,
        relatedMap: '五楼平面图',
        mapPosition: '安防巡逻区',
        ipAddress: '192.168.1.108',
        port: '8080',
        batteryLevel: 55,
        updateTime: '2024-01-15 18:45:20',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 18:43:15'
      },
      {
        id: 'robot_009',
        deviceName: 'AGV-009',
        deviceKey: 'agv_009_key',
        deviceType: '机器人设备',
        productName: 'AGV自动导引车',
        isEnabled: true,
        currentStatus: '充电中',
        isOnline: true,
        relatedMap: '一楼平面图',
        mapPosition: '充电站F',
        ipAddress: '192.168.1.109',
        port: '8080',
        batteryLevel: 35,
        updateTime: '2024-01-15 19:10:45',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 19:08:40'
      },
      {
        id: 'robot_010',
        deviceName: 'MCR-010',
        deviceKey: 'mcr_010_key',
        deviceType: '机器人设备',
        productName: 'MCR清洁机器人',
        isEnabled: false,
        currentStatus: '维护中',
        isOnline: false,
        relatedMap: '三楼平面图',
        mapPosition: '维修车间',
        ipAddress: '192.168.1.110',
        port: '8080',
        batteryLevel: 8,
        updateTime: '2024-01-15 10:30:15',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 09:45:30'
      },
      {
        id: 'robot_011',
        deviceName: 'AMR-011',
        deviceKey: 'amr_011_key',
        deviceType: '机器人设备',
        productName: 'AMR移动机器人',
        isEnabled: true,
        currentStatus: '空闲',
        isOnline: true,
        relatedMap: '二楼平面图',
        mapPosition: '包装区G',
        ipAddress: '192.168.1.111',
        port: '8080',
        batteryLevel: 89,
        updateTime: '2024-01-15 19:35:50',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 19:33:45'
      },
      {
        id: 'robot_012',
        deviceName: 'RGV-012',
        deviceKey: 'rgv_012_key',
        deviceType: '机器人设备',
        productName: 'RGV轨道机器人',
        isEnabled: true,
        currentStatus: '执行中',
        isOnline: true,
        relatedMap: '四楼平面图',
        mapPosition: '立体仓库H',
        ipAddress: '192.168.1.112',
        port: '8080',
        batteryLevel: 76,
        updateTime: '2024-01-15 20:00:25',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 19:58:20'
      },
      // 电梯设备
      {
        id: 'elevator_001',
        deviceName: 'ELEV-001',
        deviceKey: 'elev_001_key',
        deviceType: '电梯设备',
        productName: '货运电梯A',
        isEnabled: true,
        currentStatus: '空闲',
        isOnline: true,
        relatedMap: '物流中心',
        mapPosition: '1F-3F',
        ipAddress: '192.168.1.201',
        port: '8080',
        batteryLevel: 0,
        updateTime: '2024-01-15 18:00:10',
        updatedBy: '设备管理员',
        lastConnectTime: '2024-01-15 17:58:05'
      },
      {
        id: 'elevator_002',
        deviceName: 'ELEV-002',
        deviceKey: 'elev_002_key',
        deviceType: '电梯设备',
        productName: '客运电梯B',
        isEnabled: true,
        currentStatus: '执行中',
        isOnline: true,
        relatedMap: '办公大楼',
        mapPosition: '1F-10F',
        ipAddress: '192.168.1.202',
        port: '8080',
        batteryLevel: 0,
        updateTime: '2024-01-15 17:45:30',
        updatedBy: '维保人员',
        lastConnectTime: '2024-01-15 17:43:25'
      },
      {
        id: 'elevator_003',
        deviceName: 'ELEV-003',
        deviceKey: 'elev_003_key',
        deviceType: '电梯设备',
        productName: '载货升降机',
        isEnabled: false,
        currentStatus: '异常',
        isOnline: false,
        relatedMap: '仓储区域',
        mapPosition: '地下1F-2F',
        ipAddress: '192.168.1.203',
        port: '8080',
        batteryLevel: 0,
        updateTime: '2024-01-15 08:20:45',
        updatedBy: '安全检查员',
        lastConnectTime: '2024-01-15 07:15:30'
      },
      // 自动门设备
      {
        id: 'autodoor_001',
        deviceName: 'DOOR-001',
        deviceKey: 'autodoor_001_key',
        deviceType: '自动门设备',
        productName: '感应式自动门A',
        isEnabled: true,
        currentStatus: '正常',
        isOnline: true,
        relatedMap: '办公大楼',
        mapPosition: '1F入口',
        ipAddress: '192.168.1.211',
        port: '8080',
        batteryLevel: 0,
        updateTime: '2024-01-15 18:30:15',
        updatedBy: '设备管理员',
        lastConnectTime: '2024-01-15 18:28:10'
      },
      {
        id: 'autodoor_002',
        deviceName: 'DOOR-002',
        deviceKey: 'autodoor_002_key',
        deviceType: '自动门设备',
        productName: '旋转门控制器',
        isEnabled: true,
        currentStatus: '正常',
        isOnline: true,
        relatedMap: '物流中心',
        mapPosition: '主入口',
        ipAddress: '192.168.1.212',
        port: '8080',
        batteryLevel: 0,
        updateTime: '2024-01-15 17:20:30',
        updatedBy: '维保人员',
        lastConnectTime: '2024-01-15 17:18:25'
      },
      {
        id: 'autodoor_003',
        deviceName: 'DOOR-003',
        deviceKey: 'autodoor_003_key',
        deviceType: '自动门设备',
        productName: '平移式自动门',
        isEnabled: false,
        currentStatus: '维护中',
        isOnline: false,
        relatedMap: '仓储区域',
        mapPosition: '货物通道',
        ipAddress: '192.168.1.213',
        port: '8080',
        batteryLevel: 0,
        updateTime: '2024-01-15 09:45:20',
        updatedBy: '安全检查员',
        lastConnectTime: '2024-01-15 08:30:15'
      }
    ];
    setRobotDevices(mockRobotDevices);
    // 默认选中第一台在线机器人
    const onlineRobots = mockRobotDevices.filter(robot => robot.isOnline && robot.isEnabled);
    if (onlineRobots.length > 0) {
      setSelectedRobot(onlineRobots[0].id);
    }
  }, []);

  // 生成机器人地图文件数据
  const generateRobotMapFiles = (mapName: string): MapFile[] => {
    const fileTypes = ['dwg', 'pdf', 'jpg', 'svg', 'png'];
    const fileCount = Math.floor(Math.random() * 3) + 2; // 2-4个文件
    
    return Array.from({ length: fileCount }, (_, index) => {
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      return {
        id: `robot_file_${mapName}_${index}`,
        name: `${mapName}_${index + 1}.${fileType}`,
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
        status: index === 0 ? 'active' : 'inactive',
        format: fileType.toUpperCase(),
      };
    });
  };

  // 监听选中机器人变化，获取机器人地图列表
  useEffect(() => {
    if (selectedRobot) {
      // 根据不同机器人配置不同的地图列表
      const robotMapConfig: Record<string, string[]> = {
        'robot_001': [
          '仓库A区地图_v1.3',
          '仓库A区导航图_v2.1',
          '一楼物流通道_v1.0',
          '货架布局图_v1.8'
        ],
        'robot_002': [
          '生产线B区地图_v2.2',
          '二楼作业区_v1.5',
          '设备布局图_v1.9',
          '安全通道图_v1.1',
          '质检区域图_v1.0'
        ],
        'robot_003': [
          '办公区C清洁路径_v1.7',
          '三楼办公区_v2.0',
          '会议室布局_v1.3',
          '休息区地图_v1.2'
        ],
        'robot_004': [
          '维修区域图_v1.0',
          '一楼维护通道_v1.4',
          '设备检修图_v2.1'
        ],
        'robot_005': [
          '自动化仓库地图_v1.5',
          '四楼轨道布局_v2.3',
          'RGV运行路径_v1.9',
          '立体货架图_v1.6'
        ],
        'robot_006': [
          '装配区D地图_v1.4',
          '一楼装配线_v2.0',
          '工位布局图_v1.7',
          '物料配送路径_v1.2'
        ],
        'robot_007': [
          '质检区E地图_v1.8',
          '二楼质检线_v2.1',
          '检测设备布局_v1.5',
          '样品传输路径_v1.3'
        ],
        'robot_008': [
          '安防巡逻区地图_v1.6',
          '五楼安防路径_v2.2',
          '监控点位图_v1.4',
          '应急通道图_v1.1'
        ],
        'robot_009': [
          '充电站F地图_v1.3',
          '一楼充电区_v1.9',
          '电力设施图_v1.5',
          '维护通道图_v1.2'
        ],
        'robot_010': [
          '维修车间地图_v1.7',
          '三楼维修区_v2.0',
          '设备维护图_v1.8',
          '工具存放图_v1.4'
        ],
        'robot_011': [
          '包装区G地图_v1.5',
          '二楼包装线_v2.1',
          '包装设备布局_v1.6',
          '成品存储图_v1.3'
        ],
        'robot_012': [
          '立体仓库H地图_v1.9',
          '四楼存储区_v2.4',
          'RGV作业路径_v1.7',
          '货位管理图_v1.8'
        ]
      };
      
      const maps = robotMapConfig[selectedRobot] || [];
      setRobotMaps(maps);
      
      // 生成每个地图对应的文件列表
      const mapFilesData: Record<string, MapFile[]> = {};
      maps.forEach(mapName => {
        mapFilesData[mapName] = generateRobotMapFiles(mapName);
      });
      setSelectedRobotMapFiles(mapFilesData);
    } else {
      setRobotMaps([]);
      setSelectedRobotMapFiles({});
    }
  }, [selectedRobot]);

  // 监听搜索文本变化，重置滑动索引
  useEffect(() => {
    setRobotSlideIndex(0);
  }, [robotSearchText]);

  // 处理机器人卡片滑动
  const handleRobotSlide = (direction: 'left' | 'right') => {
    if (isSliding) return; // 防止重复点击
    
    const filteredRobots = robotDevices.filter(robot => 
      robot.isOnline && 
      robot.isEnabled && 
      robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
    );
    
    const maxIndex = Math.ceil(filteredRobots.length / robotCardsPerPage) - 1;
    
    let newIndex = robotSlideIndex;
    if (direction === 'left' && robotSlideIndex > 0) {
      newIndex = robotSlideIndex - 1;
    } else if (direction === 'right' && robotSlideIndex < maxIndex) {
      newIndex = robotSlideIndex + 1;
    } else {
      return; // 无需切换
    }
    
    setIsSliding(true);
    setSlideDirection(direction);
    
    // 先让当前内容滑出
    setTimeout(() => {
      setRobotSlideIndex(newIndex);
      // 然后让新内容滑入
      setTimeout(() => {
        setIsSliding(false);
      }, 400); // 增加动画持续时间
    }, 100);
  };

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number): number => {
    if (isMobile) return Math.max(baseWidth * 0.8, 80);
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 表格配置函数
  const getTableConfig = (mobile: boolean, large: boolean, columnCount: number) => {
    if (mobile) {
      return {
        scroll: { x: Math.max(columnCount * 120, 600) },
        size: 'small' as const,
      };
    }
    return {
      scroll: large ? { x: 'max-content' } : undefined,
      size: 'middle' as const,
    };
  };

  // 列宽调整函数
  const adjustColumnWidths = (columns: ColumnsType<MapData>) => {
    return columns.map((col: any) => ({
      ...col,
      width: col.width ? getColumnWidth(col.width as number) : undefined,
    }));
  };

  // 地图数据状态
  const [mapData, setMapData] = useState<MapData[]>([]);

  // 初始化地图数据
  useEffect(() => {
    const defaultMapData: MapData[] = [
      {
        id: '1',
        name: '一楼平面图',
        version: 'v1.2.3',
        status: 'active',
        thumbnail: '/api/placeholder/300/200',
        description: '办公楼一楼的详细平面图，包含所有房间和设施信息',
        createTime: '2024-01-15',
        updateTime: '2024-03-20 14:30:25',
        updateUser: '张三',
      },
      {
        id: '2',
        name: '二楼平面图',
        version: 'v1.1.0',
        status: 'inactive',
        thumbnail: '/api/placeholder/300/200',
        description: '办公楼二楼的详细平面图，包含会议室和办公区域',
        createTime: '2024-01-10',
        updateTime: '2024-03-15 09:15:42',
        updateUser: '李四',
      },
      {
        id: '3',
        name: '地下停车场',
        version: 'v2.0.1',
        status: 'active',
        thumbnail: '/api/placeholder/300/200',
        description: '地下停车场布局图，包含车位分配和通道信息',
        createTime: '2024-02-01',
        updateTime: '2024-03-25 16:45:18',
        updateUser: '王五',
      },
    ];

    // 从localStorage读取数据，如果没有则使用默认数据
    const savedMapData = localStorage.getItem('mapData');
    if (savedMapData) {
      try {
        const parsedData = JSON.parse(savedMapData);
        setMapData(parsedData);
        if (parsedData.length > 0) {
          setSelectedMap(parsedData[0]);
        }
      } catch (error) {
        if (isDev) console.error('解析localStorage数据失败:', error);
        setMapData(defaultMapData);
        setSelectedMap(defaultMapData[0]);
        localStorage.setItem('mapData', JSON.stringify(defaultMapData));
      }
    } else {
      setMapData(defaultMapData);
      setSelectedMap(defaultMapData[0]);
      localStorage.setItem('mapData', JSON.stringify(defaultMapData));
    }
  }, []);

  // 初始化地图文件数据
  useEffect(() => {
    const initialFileSets: Record<string, MapFile[]> = {
      '1': [
        {
          id: 'f1-1',
          name: '一楼平面图.dwg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
        },
        {
          id: 'f1-2',
          name: '一楼布局图.pdf',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'PDF',
        },
        {
          id: 'f1-3',
          name: '一楼设备图.jpg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'JPG',
        },
        {
          id: 'f1-4',
          name: '一楼导航图.svg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'SVG',
        },
      ],
      '2': [
        {
          id: 'f2-1',
          name: '二楼平面图.dwg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
        },
        {
          id: 'f2-2',
          name: '二楼会议室布局.pdf',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'PDF',
        },
      ],
      '3': [
        {
          id: 'f3-1',
          name: '停车场布局图.dwg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
        },
      ],
    };
    setMapFiles(initialFileSets);
  }, []);

  // 获取地图文件数据（根据地图ID）
  const getMapFiles = (mapId: string): MapFile[] => {
    return mapFiles[mapId] || [];
  };

  // 根据地图名称获取地图文件数据 - 已移除未使用的函数

  // 加载地图文件数据函数已移除

  // 处理地图名称搜索
  // 搜索和清除搜索函数已移除

  // 基础表格列配置
  const baseColumns: ColumnsType<MapData> = [
    {
      title: '地图名称',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(150),
      align: 'left',
      fixed: 'left',
      ellipsis: true,
      render: (text: string, record: MapData) => (
        <div style={{ textAlign: 'left' }}>
          <div 
            style={{ 
              color: 'rgba(0, 0, 0, 0.88)', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={text}
          >{text}</div>
          <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500, marginTop: 4 }}>{record.version}</div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(160),
      align: 'left',
      sorter: (a: MapData, b: MapData) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
      render: (updateTime: string) => {
        const [date, time] = updateTime.split(' ');
        return (
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.88)' }}>{date}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>{time}</div>
          </div>
        );
      },
    },
    {
      title: '更新人',
      dataIndex: 'updateUser',
      key: 'updateUser',
      width: getColumnWidth(100),
      align: 'left',
      ellipsis: true,
      render: (updateUser: string) => (
        <span style={{ color: 'rgba(0, 0, 0, 0.88)' }}>{updateUser}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(80),
      align: 'center',
      fixed: 'right',
      render: (_: any, record: MapData) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: '编辑',
                onClick: () => handleEdit(record),
              },
              {
                key: 'settings',
                icon: <SettingOutlined />,
                label: '设置',
                onClick: () => handleSettings(record),
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: '删除',
                danger: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="link"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            size="small"
            style={{ padding: '0 4px', fontSize: '12px' }}
          >
            更多
          </Button>
        </Dropdown>
      ),
    },
  ];

  // 移动端简化列配置
   const mobileColumns: ColumnsType<MapData> = [
     {
       title: '',  // 小屏不显示表头
       key: 'mapInfo',
       render: (_: any, record: MapData) => {
        const [date, time] = record.updateTime.split(' ');
        return (
          <div style={{ padding: '12px 8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 8 
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: 'rgba(0, 0, 0, 0.88)', 
                  fontWeight: 500, 
                  fontSize: '14px',
                  marginBottom: 4,
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {record.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#1890ff', 
                  fontWeight: 500,
                  marginBottom: 8
                }}>
                  版本: {record.version}
                </div>

              </div>
              <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'edit',
                        icon: <EditOutlined />,
                        label: '编辑',
                        onClick: () => handleEdit(record),
                      },
                      {
                        key: 'settings',
                        icon: <SettingOutlined />,
                        label: '设置',
                        onClick: () => handleSettings(record),
                      },
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: '删除',
                        danger: true,
                        onClick: () => handleDelete(record),
                      },
                    ],
                  }}
                trigger={['click']}
              >
                <Button
                  type="link"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  size="small"
                  icon={<MoreOutlined />}
                />
              </Dropdown>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#666',
              lineHeight: '1.4'
            }}>
              <div style={{ marginBottom: 2 }}>
                更新时间: {date} {time}
              </div>
              <div>
                更新人: {record.updateUser}
              </div>
            </div>
          </div>
        );
      },
    },
  ].filter((col: any) => col);

  // 根据屏幕大小选择列配置
  const filteredColumns = isMobile ? mobileColumns : baseColumns;
  
  // 应用动态列宽调整
  const desktopColumns = adjustColumnWidths(filteredColumns);

  // 获取表格配置
  const tableConfig = getTableConfig(isMobile, isLargeScreen, desktopColumns.length);

  // 处理行点击
  const handleRowClick = (record: MapData) => {
    setSelectedMap(record);
  };

  // 操作处理函数
  const handleEdit = (record: MapData) => {
    setEditingMap(record);
    editForm.setFieldsValue({
      mapName: record.name,
      description: record.description,
    });
    setEditUploadedFile(null);
    setEditDrawerVisible(true);
  };

  const handleDelete = (record: MapData) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除地图 <strong>{record.name}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            删除后，该地图下的所有文件数据也将被删除，此操作不可恢复。
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          // 模拟删除API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 从mapData中删除该地图
          const updatedMapData = mapData.filter(map => map.id !== record.id);
          setMapData(updatedMapData);
          
          // 删除对应的地图文件数据
          const updatedMapFiles = { ...mapFiles };
          delete updatedMapFiles[record.id];
          setMapFiles(updatedMapFiles);
          
          // 更新localStorage
          localStorage.setItem('mapData', JSON.stringify(updatedMapData));
          
          // 如果删除的是当前选中的地图，重新选择第一个
          if (selectedMap?.id === record.id) {
            setSelectedMap(updatedMapData.length > 0 ? updatedMapData[0] : null);
          }
          
          message.success('地图删除成功！');
        } catch (error) {
          message.error('删除失败，请重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSettings = (record: MapData) => {
    if (isDev) console.log('地图设置:', record);
  };

  const handleMapSync = (record: MapData) => {
    setSyncingMap(record);
    setSelectedSyncRobots([]);
    // 默认选择当前使用的地图文件
    const currentMapFiles = getMapFiles(record.id);
    const activeFiles = currentMapFiles.filter(file => file.status === 'active').map(file => file.id);
    setSelectedSyncMapFiles(activeFiles);
    setMapSyncDrawerVisible(true);
  };

  const handleConfirmSync = async () => {
    if (!syncingMap || selectedSyncRobots.length === 0 || selectedSyncMapFiles.length === 0) {
      message.warning('请选择机器人和地图文件');
      return;
    }

    // 关闭同步选择抽屉，打开同步进度弹窗
    setMapSyncDrawerVisible(false);
    setSyncProgressModalVisible(true);
    
    // 初始化同步状态
    const initialStatuses: SyncStatus[] = selectedSyncRobots.map(robotId => {
      const robot = robotDevices.find(r => r.id === robotId);
      return {
        robotId,
        robotName: robot?.deviceName || `机器人-${robotId}`,
        status: 'pending',
        progress: 0
      };
    });
    
    setSyncStatuses(initialStatuses);
    setAllSyncCompleted(false);
    
    // 开始同步过程
    await performSync(initialStatuses);
  };
  
  // 执行同步过程
  const performSync = async (statuses: SyncStatus[]) => {
    const results: SyncResult[] = [];
    
    // 模拟并发同步
    const syncPromises = statuses.map(async (status) => {
      // 设置开始时间和状态
      const startTime = new Date().toLocaleTimeString();
      setSyncStatuses(prev => prev.map(s => 
        s.robotId === status.robotId 
          ? { ...s, status: 'syncing', startTime, progress: 0 }
          : s
      ));
      
      const syncStartTime = Date.now();
      
      try {
        // 模拟同步进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
          setSyncStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, progress }
              : s
          ));
        }
        
        // 模拟成功/失败（90%成功率）
        const isSuccess = Math.random() > 0.1;
        const endTime = new Date().toLocaleTimeString();
        const duration = Date.now() - syncStartTime;
        
        if (isSuccess) {
          setSyncStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, status: 'success', progress: 100, endTime }
              : s
          ));
          results.push({ 
            robotId: status.robotId, 
            robotName: status.robotName,
            success: true, 
            status: 'success',
            duration 
          });
        } else {
          const errorMessage = '网络连接超时，请检查机器人连接状态';
          setSyncStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, status: 'failed', errorMessage, endTime }
              : s
          ));
          results.push({ 
            robotId: status.robotId, 
            robotName: status.robotName,
            success: false, 
            status: 'failed',
            errorMessage, 
            duration 
          });
        }
      } catch (error) {
        const endTime = new Date().toLocaleTimeString();
        const duration = Date.now() - syncStartTime;
        const errorMessage = '同步过程中发生未知错误';
        setSyncStatuses(prev => prev.map(s => 
          s.robotId === status.robotId 
            ? { ...s, status: 'failed', errorMessage, endTime }
            : s
        ));
        results.push({ 
          robotId: status.robotId, 
          robotName: status.robotName,
          success: false, 
          status: 'failed',
          errorMessage, 
          duration 
        });
      }
    });
    
    // 等待所有同步完成
    await Promise.all(syncPromises);
    
    // 设置同步结果
    setAllSyncCompleted(true);
    
    // 显示汇总消息
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    if (failedCount === 0) {
      message.success(`同步完成！成功同步到 ${successCount} 个机器人`);
    } else if (successCount === 0) {
      message.error(`同步失败！${failedCount} 个机器人同步失败`);
    } else {
      message.warning(`同步完成！${successCount} 个成功，${failedCount} 个失败`);
    }
  };
  
  // 重试失败的同步任务
  const handleRetryFailedSync = async () => {
    const failedStatuses = syncStatuses.filter(s => s.status === 'failed');
    if (failedStatuses.length === 0) return;
    
    // 重置失败的状态
    setSyncStatuses(prev => prev.map(s => 
      s.status === 'failed' 
        ? { ...s, status: 'pending', progress: 0, errorMessage: undefined }
        : s
    ));
    
    // 重新执行失败的同步
    await performSync(failedStatuses);
  };
  
  // 关闭同步进度弹窗
  const handleCloseSyncProgress = () => {
    setSyncProgressModalVisible(false);
    setSyncStatuses([]);
    setAllSyncCompleted(false);
    
    // 重置同步相关状态
    setSyncingMap(null);
    setSelectedSyncRobots([]);
    setSelectedSyncMapFiles([]);
  };

  // 关闭切图进度弹窗
  const handleCloseSliceProgress = () => {
    setSliceProgressModalVisible(false);
    setSliceStatuses([]);
    setAllSliceCompleted(false);
    
    // 重置切图相关状态
    setSlicingMapFile(null);
    setSelectedSliceRobots([]);
    setSelectedSliceMapFiles([]);
  };

  // handleEnable函数已移除

  // 同步、导出、下载函数已移除

  const handleDeleteFile = (file: MapFile) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除地图文件 "${file.name}" 吗？此操作不可撤销。`,
      icon: <ExclamationCircleOutlined />,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        // 执行删除操作
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            updatedFiles[selectedMap.id] = currentMapFiles.filter(f => f.id !== file.id);
            return updatedFiles;
          });
          message.success('地图文件删除成功');
        }
      },
    });
  };

  const handleDetail = (file: MapFile) => {
    if (isDev) console.log('🔧 [地图文件编辑标识] 开始编辑地图文件:', {
      '文件ID': file.id,
      '文件名称': file.name,
      '文件状态': file.status,
      '缩略图': file.thumbnail
    });
    
    // 设置当前编辑的地图文件
    setCurrentEditFile(file);
    if (isDev) console.log('🔧 [地图文件编辑标识] 设置currentEditFile完成:', file);
    
    setMapFileUploadedImage({
      url: file.thumbnail,
      name: file.name
    });
    if (isDev) console.log('🔧 [地图文件编辑标识] 设置mapFileUploadedImage完成:', {
      url: file.thumbnail,
      name: file.name
    });
    
    // 预加载拓扑路网数据（为后续进入地图编辑器做准备）
    if (file.topologyData) {
      // 加载点数据
      if (file.topologyData.points) {
        setMapPoints(file.topologyData.points);
        // 更新点计数器
        const maxPointNumber = file.topologyData.points.reduce((max: number, point: any) => {
          const pointNumber = parseInt(point.name.replace('p', ''));
          return pointNumber > max ? pointNumber : max;
        }, 0);
        setPointCounter(maxPointNumber + 1);
      }
      
      // 加载线数据
      if (file.topologyData.lines) {
        setMapLines(file.topologyData.lines);
        // 更新线计数器
        const maxLineNumber = file.topologyData.lines.reduce((max: number, line: MapLine) => {
          const lineNumber = parseInt(line.name.replace('e', ''));
          return lineNumber > max ? lineNumber : max;
        }, 0);
        setLineCounter(maxLineNumber + 1);
      }
      
      // 加载区域数据
      if (file.topologyData.areas) {
        if (isDev) console.log('🔄 [编辑模式] 预加载区域数据:', file.topologyData.areas);
        setMapAreas(file.topologyData.areas);
        // 更新区域计数器
        const maxAreaNumber = file.topologyData.areas.reduce((max: number, area: MapArea) => {
          const areaNumber = parseInt(area.name.replace('a', ''));
          return areaNumber > max ? areaNumber : max;
        }, 0);
        setAreaCounter(maxAreaNumber + 1);
      } else {
        if (isDev) console.log('⚠️ [编辑模式] 没有区域数据');
        setMapAreas([]);
      }
      
      // 加载笔画数据
      if (file.topologyData.strokes && pngCanvasRef.current) {
        const canvas = pngCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 清空画布
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 重绘所有笔画
          file.topologyData.strokes.forEach((stroke: any) => {
            if (stroke.points && stroke.points.length > 0) {
              ctx.beginPath();
              ctx.strokeStyle = stroke.color || '#000000';
              ctx.lineWidth = stroke.lineWidth || 2;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
              }
              ctx.stroke();
            }
          });
        }
      }
    } else {
      if (isDev) console.log('⚠️ [编辑模式] 没有拓扑数据');
      setMapPoints([]);
      setMapLines([]);
      setMapAreas([]);
    }
    
    // 加载黑白地图数据到PNG画布
    if (file.grayscaleData && pngCanvasRef.current) {
      const canvas = pngCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // 设置画布尺寸为图片尺寸
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 绘制黑白底图
          ctx.drawImage(img, 0, 0);
          
          // 如果有笔画数据，在底图上重绘
          if (file.topologyData?.strokes) {
            file.topologyData.strokes.forEach((stroke: any) => {
              if (stroke.points && stroke.points.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = stroke.color || '#000000';
                ctx.lineWidth = stroke.lineWidth || 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                  ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
                ctx.stroke();
              }
            });
          }
        };
        img.src = file.grayscaleData;
      }
    }
    
    // 设置地图基本信息
    setMapInfo({
      mapName: file.name,
      originX: file.mapInfo?.originX || 0,
      originY: file.mapInfo?.originY || 0,
      direction: file.mapInfo?.direction || 0,
      width: file.mapInfo?.width || 100,
      height: file.mapInfo?.height || 100,
      resolution: file.mapInfo?.resolution || 0.05
    });
    
    // 填充表单数据
    addMapFileForm.setFieldsValue({
      mapFileName: file.name,
      originX: file.mapInfo?.originX || 0,
      originY: file.mapInfo?.originY || 0,
      direction: file.mapInfo?.direction || 0,
      width: file.mapInfo?.width || 100,
      height: file.mapInfo?.height || 100,
      resolution: file.mapInfo?.resolution || 0.05
    });
    
    // 先进入地图文件基本信息编辑页面（步骤1）
    setAddMapFileStep(1);
    setAddMapFileDrawerVisible(true);
    
    message.info('进入地图文件编辑模式');
  };

  const handleEnableFile = (file: MapFile, mapId: string) => {
    if (isDev) console.log('启用文件:', file);
    
    // 更新地图文件状态，确保只有一个文件启用
    setMapFiles(prev => {
      const updatedFiles = { ...prev };
      const currentMapFiles = updatedFiles[mapId] || [];
      
      // 将当前地图的所有文件设为禁用
      const newFiles = currentMapFiles.map(f => ({
        ...f,
        status: f.id === file.id ? 'active' : 'inactive'
      })) as MapFile[];
      
      updatedFiles[mapId] = newFiles;
      return updatedFiles;
    });
  };

  // 同步文件函数已移除

  const handleViewDetails = (file: MapFile) => {
    // 进入地图文件编辑页面
    setAddMapFileStep(2); // 直接进入地图编辑步骤
    setAddMapFileDrawerVisible(true);
    
    // 设置编辑模式的地图信息
    setMapInfo({
      mapName: file.name,
      originX: 0,
      originY: 0,
      direction: 0,
      width: 100,
      height: 100,
      resolution: 0.05
    });
    
    // 设置上传的图片
    setMapFileUploadedImage({
      url: file.thumbnail,
      name: file.name
    });
    
    message.info('进入地图编辑模式');
  };

  // 处理地图文件图片点击事件
  const handleImageClick = (file: MapFile) => {
    // 设置当前编辑的地图文件
    setMapFileUploadedImage({
      url: file.thumbnail,
      name: file.name
    });
    
    // 加载拓扑路网数据
    if (file.topologyData) {
      // 加载点数据
      if (file.topologyData.points) {
        setMapPoints(file.topologyData.points);
        // 更新点计数器
        const maxPointNumber = file.topologyData.points.reduce((max: number, point: any) => {
          const pointNumber = parseInt(point.name.replace('p', ''));
          return pointNumber > max ? pointNumber : max;
        }, 0);
        setPointCounter(maxPointNumber + 1);
      }
      
      // 加载线数据
      if (file.topologyData.lines) {
        setMapLines(file.topologyData.lines);
        // 更新线计数器
        const maxLineNumber = file.topologyData.lines.reduce((max: number, line: MapLine) => {
          const lineNumber = parseInt(line.name.replace('e', ''));
          return lineNumber > max ? lineNumber : max;
        }, 0);
        setLineCounter(maxLineNumber + 1);
      }
      
      // 加载区域数据
      if (file.topologyData.areas) {
        setMapAreas(file.topologyData.areas);
        // 更新区域计数器
        const maxAreaNumber = file.topologyData.areas.reduce((max: number, area: MapArea) => {
          const areaNumber = parseInt(area.name.replace('a', ''));
          return areaNumber > max ? areaNumber : max;
        }, 0);
        setAreaCounter(maxAreaNumber + 1);
      }
      
      // 加载笔画数据
      if (file.topologyData.strokes && pngCanvasRef.current) {
        const canvas = pngCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 清空画布
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 重绘所有笔画
          file.topologyData.strokes.forEach((stroke: any) => {
            if (stroke.points && stroke.points.length > 0) {
              ctx.beginPath();
              ctx.strokeStyle = stroke.color || '#000000';
              ctx.lineWidth = stroke.lineWidth || 2;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
              }
              ctx.stroke();
            }
          });
        }
      }
    }
    
    // 加载黑白地图数据到PNG画布
    if (file.grayscaleData && pngCanvasRef.current) {
      const canvas = pngCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          // 设置画布尺寸为图片尺寸
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 绘制黑白底图
          ctx.drawImage(img, 0, 0);
          
          // 如果有笔画数据，在底图上重绘
          if (file.topologyData?.strokes) {
            file.topologyData.strokes.forEach((stroke: any) => {
              if (stroke.points && stroke.points.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = stroke.color || '#000000';
                ctx.lineWidth = stroke.lineWidth || 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                  ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
                ctx.stroke();
              }
            });
          }
        };
        img.src = file.grayscaleData;
      }
    }
    
    // 设置地图编辑器的初始状态
    setMapInfo({
      mapName: file.name,
      originX: file.mapInfo?.originX || 0,
      originY: file.mapInfo?.originY || 0,
      direction: file.mapInfo?.direction || 0,
      width: file.mapInfo?.width || 100,
      height: file.mapInfo?.height || 100,
      resolution: file.mapInfo?.resolution || 0.05
    });
    
    // 设置为阅览模式
    setCurrentMode('view');
    // setIsReadOnlyMode(true); // 已移除isReadOnlyMode状态
    
    // 进入地图编辑步骤并显示侧滑抽屉
    setAddMapFileStep(2);
    setAddMapFileDrawerVisible(true);
    
    message.info('进入拓扑地图阅览模式');
   };

  // 处理切图功能
  const handleSliceMap = (file: MapFile) => {
    if (isDev) console.log('切图地图文件:', file);
    
    // 设置切图的地图文件
    setSlicingMapFile(file);
    
    // 重置选中的机器人和地图文件
    setSelectedSliceRobots([]);
    setSelectedSliceMapFiles([file.id]);
    
    // 打开切图抽屉
    setMapSliceDrawerVisible(true);
    
    message.info(`开始切图地图文件: ${file.name}`);
  };

  // 确认切图
  const handleConfirmSlice = async () => {
    if (selectedSliceRobots.length === 0) {
      message.warning('请至少选择一个机器人');
      return;
    }
    
    if (selectedSliceMapFiles.length === 0) {
      message.warning('请至少选择一个地图文件');
      return;
    }
    
    // 关闭切图抽屉，打开切图进度弹窗
    setMapSliceDrawerVisible(false);
    setSliceProgressModalVisible(true);
    
    // 初始化切图状态
    const initialStatuses: SyncStatus[] = selectedSliceRobots.map(robotId => {
      const robot = robotDevices.find(r => r.id === robotId);
      return {
        robotId,
        robotName: robot?.deviceName || `机器人-${robotId}`,
        status: 'pending',
        progress: 0
      };
    });
    
    setSliceStatuses(initialStatuses);
    setAllSliceCompleted(false);
    
    // 执行切图
    await performSlice(initialStatuses);
  };

  // 执行切图操作
  const performSlice = async (statuses: SyncStatus[]) => {
    const results: SyncResult[] = [];
    
    // 模拟并发切图
    const slicePromises = statuses.map(async (status) => {
      // 设置开始时间和状态
      const startTime = new Date().toLocaleTimeString();
      setSliceStatuses(prev => prev.map(s => 
        s.robotId === status.robotId 
          ? { ...s, status: 'syncing', startTime, progress: 0 }
          : s
      ));
      
      const sliceStartTime = Date.now();
      
      try {
        // 模拟切图进度
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
          setSliceStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, progress }
              : s
          ));
        }
        
        // 模拟成功/失败（90%成功率）
        const isSuccess = Math.random() > 0.1;
        const endTime = new Date().toLocaleTimeString();
        const duration = Date.now() - sliceStartTime;
        
        if (isSuccess) {
          setSliceStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, status: 'success', progress: 100, endTime }
              : s
          ));
          results.push({ 
            robotId: status.robotId, 
            robotName: status.robotName,
            success: true, 
            status: 'success',
            duration 
          });
          
          // 切图成功后自动启用对应的地图文件
          if (slicingMapFile && selectedMap) {
            handleEnableFile(slicingMapFile, selectedMap.id);
          }
        } else {
          const errorMessage = '切图失败：网络连接超时，请检查机器人连接状态';
          setSliceStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, status: 'failed', errorMessage, endTime }
              : s
          ));
          results.push({ 
            robotId: status.robotId, 
            robotName: status.robotName,
            success: false, 
            status: 'failed',
            errorMessage, 
            duration 
          });
        }
      } catch (error) {
        const endTime = new Date().toLocaleTimeString();
        const duration = Date.now() - sliceStartTime;
        const errorMessage = '切图过程中发生未知错误';
        setSliceStatuses(prev => prev.map(s => 
          s.robotId === status.robotId 
            ? { ...s, status: 'failed', errorMessage, endTime }
            : s
        ));
        results.push({ 
          robotId: status.robotId, 
          robotName: status.robotName,
          success: false, 
          status: 'failed',
          errorMessage, 
          duration 
        });
      }
    });
    
    // 等待所有切图完成
    await Promise.all(slicePromises);
    
    // 设置切图结果
    setAllSliceCompleted(true);
    
    // 显示汇总消息
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    if (failedCount === 0) {
      message.success(`切图完成！成功切图到 ${successCount} 个机器人`);
    } else if (successCount === 0) {
      message.error(`切图失败！${failedCount} 个机器人切图失败`);
    } else {
      message.warning(`切图完成！${successCount} 个成功，${failedCount} 个失败`);
    }
  };

  // 新增地图文件相关处理函数
  const handleAddMapFile = () => {
    if (!selectedMap) {
      message.warning('请先选择一个地图');
      return;
    }
    setAddMapFileStep(1);
    setAddMapFileDrawerVisible(true);
    addMapFileForm.resetFields();
    setMapFileUploadedImage(null);
  };

  // handleAddMapFileNext函数已移除

  const handleAddMapFilePrev = () => {
    setAddMapFileStep(1);
  };

  // 生成包含拓扑数据的缩略图
  const generateThumbnailWithTopology = () => {
    return mapFileUploadedImage?.url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center';
  };
  


  const handleAddMapFileSubmit = async (values: any) => {
    if (isDev) console.log('🔧 [地图文件重复] 进入 handleAddMapFileSubmit 函数', {
      currentEditFile,
      values,
      selectedMap
    });
    try {
      setSubmitAndNextLoading(true);
      
      if (currentEditFile) {
        if (isDev) console.log('🔧 [地图文件重复] 编辑模式下更新文件', currentEditFile);
        // 编辑模式：直接保存并退出
        const updatedMapFile: MapFile = {
          ...currentEditFile,
          name: values.mapFileName,
          description: values.description,
          // 保持原有的其他数据
          topologyData: currentEditFile.topologyData,
          grayscaleData: currentEditFile.grayscaleData,
          mapInfo: {
            ...currentEditFile.mapInfo
          }
        };
        
        // 更新地图文件列表中的对应文件
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            
            // 检查是否有同名文件（除了当前编辑的文件）
            const existingSameNameFileIndex = currentMapFiles.findIndex(
              f => f.name === values.mapFileName && f.id !== currentEditFile.id
            );
            
            if (existingSameNameFileIndex !== -1) {
              // 如果存在同名文件，覆盖同名文件
              currentMapFiles.splice(existingSameNameFileIndex, 1);
            }
            
            // 更新当前编辑的文件
            const fileIndex = currentMapFiles.findIndex(f => f.id === currentEditFile.id);
            if (fileIndex !== -1) {
              currentMapFiles[fileIndex] = updatedMapFile;
            }
            
            updatedFiles[selectedMap.id] = [...currentMapFiles];
            return updatedFiles;
          });
        }
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        message.success('地图文件更新成功！');
        
        // 重置状态并退出
        if (isDev) console.log('🔧 [地图文件重复] 编辑模式保存成功，重置状态');
        setAddMapFileDrawerVisible(false);
        addMapFileForm.resetFields();
        setMapFileUploadedImage(null);
        setAddMapFileStep(1);
        setCurrentEditFile(null);
      } else {
        if (isDev) console.log('🔧 [地图文件重复] 新增模式下创建文件');
        // 新增模式：检查唯一性并进入下一步
        if (selectedMap) {
          const currentMapFiles = mapFiles[selectedMap.id] || [];
          const existingSameNameFile = currentMapFiles.find(f => f.name === values.mapFileName);
          
          if (existingSameNameFile) {
            message.error(`地图文件名称 "${values.mapFileName}" 已存在，请使用其他名称`);
            return;
          }
        }
        
        // 更新地图基本信息
        setMapInfo(prev => ({
          ...prev,
          mapName: values.mapFileName
        }));
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (isDev) console.log('📝 [基本信息提交] 地图文件基本信息已保存:', {
          '地图文件名': values.mapFileName,
          '描述': values.description
        });
        
        // 进入下一步（地图编辑器）
        setAddMapFileStep(2);
        message.success('基本信息保存成功，请继续编辑地图');
      }
      
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setSubmitAndNextLoading(false);
    }
  };

  // 提交并下一步：创建地图文件并进入地图编辑器
  const handleSubmitAndNext = async () => {
    if (isDev) console.log('🚀 [地图文件编辑] handleSubmitAndNext 函数被调用');
    if (isDev) console.log('📝 [地图文件编辑] 当前编辑文件:', currentEditFile);
    if (isDev) console.log('📝 [地图文件编辑] 是否为编辑模式:', !!currentEditFile);
    
    try {
      const values = await addMapFileForm.validateFields();
      if (isDev) console.log('📝 [地图文件编辑] 表单验证通过，获取到的值:', values);
      
      // 检查地图文件名称唯一性
      if (selectedMap) {
        const currentMapFiles = mapFiles[selectedMap.id] || [];
        const isDuplicateName = currentMapFiles.some(file => 
          file.name === values.mapFileName && (!currentEditFile || file.id !== currentEditFile.id)
        );
        
        if (isDuplicateName) {
          message.error('地图文件名称已存在，请使用其他名称');
          return;
        }
      }
      
      setSubmitAndNextLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成包含拓扑数据的缩略图
      const thumbnailData = generateThumbnailWithTopology();
      
      if (currentEditFile) {
        // 编辑模式：更新现有地图文件
        if (isDev) console.log('✏️ [地图文件编辑] 编辑模式：更新现有地图文件');
        const updatedMapFile: MapFile = {
          ...currentEditFile,
          name: values.mapFileName,
          thumbnail: thumbnailData,
          topologyData: {
            points: mapPoints,
            lines: mapLines,
            areas: mapAreas
          }
        };
        
        // 更新地图文件列表中的对应文件
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            const fileIndex = currentMapFiles.findIndex(file => file.id === currentEditFile.id);
            if (fileIndex !== -1) {
              updatedFiles[selectedMap.id] = [
                ...currentMapFiles.slice(0, fileIndex),
                updatedMapFile,
                ...currentMapFiles.slice(fileIndex + 1)
              ];
            }
            return updatedFiles;
          });
        }
        
        message.success('地图文件更新成功');
      } else {
        // 新增模式：创建新地图文件
        if (isDev) console.log('➕ [地图文件编辑] 新增模式：创建新地图文件');
        const newMapFile: MapFile = {
          id: `file_${Date.now()}`,
          name: values.mapFileName,
          thumbnail: thumbnailData,
          status: 'inactive',
          format: 'PNG',
          topologyData: {
            points: mapPoints,
            lines: mapLines,
            areas: mapAreas
          },
          grayscaleData: ''
        };
        
        // 将新地图文件添加到对应地图的文件列表中
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            updatedFiles[selectedMap.id] = [newMapFile, ...currentMapFiles];
            return updatedFiles;
          });
        }
        
        message.success('地图文件创建成功');
      }
      
      // 进入地图编辑器（下一步）
      setAddMapFileStep(2);
      // 设置地图初始状态
      setInitialMapState({
        points: [],
        lines: []
      });
      // 将地图文件名称传递给地图编辑器
      setMapInfo(prev => ({
        ...prev,
        mapName: values.mapFileName
      }));
      setHasUnsavedChanges(false);
      
      // 设置地图编辑器默认状态：编辑模式、拓扑地图类型、选择工具
      setCurrentMode('edit'); // 默认编辑模式
      setMapType('topology'); // 默认拓扑地图类型
      setSelectedTool('select'); // 默认选中选择工具
      // 设置为编辑模式
      
      // 根据模式显示不同的成功消息
      if (currentEditFile) {
        if (isDev) console.log('✅ [地图文件编辑] 编辑模式：地图文件更新成功，进入编辑器');
      } else {
        if (isDev) console.log('✅ [地图文件编辑] 新增模式：地图文件创建成功，进入编辑器');
      }
    } catch (error) {
      message.error('创建失败，请重试');
    } finally {
      setSubmitAndNextLoading(false);
    }
  };

  // 提交并退出到地图列表：创建地图文件并退出
  const handleCreateAndExit = async () => {
    if (isDev) console.log('🚀 [地图文件编辑] handleCreateAndExit 函数被调用');
    try {
      const values = await addMapFileForm.validateFields();
      if (isDev) console.log('📝 [地图文件编辑] 表单验证通过，获取到的值:', values);
      if (isDev) console.log('🔍 [地图文件编辑] 当前编辑文件状态:', currentEditFile);
      
      // 检查地图文件名称唯一性
      if (selectedMap) {
        const currentMapFiles = mapFiles[selectedMap.id] || [];
        const isDuplicateName = currentMapFiles.some(file => 
          file.name === values.mapFileName && (!currentEditFile || file.id !== currentEditFile.id)
        );
        
        if (isDuplicateName) {
          message.error('地图文件名称已存在，请使用其他名称');
          return;
        }
      }
      
      setSubmitAndExitLoading(true);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成包含拓扑数据的缩略图
      const thumbnailData = generateThumbnailWithTopology();
      
      if (currentEditFile) {
        // 编辑模式：更新现有文件
        if (isDev) console.log('✏️ [地图文件编辑] 编辑模式：更新现有文件');
        const updatedMapFile: MapFile = {
          ...currentEditFile,
          name: values.mapFileName,
          thumbnail: thumbnailData,
          topologyData: {
            points: mapPoints,
            lines: mapLines,
            areas: mapAreas
          },
          mapInfo: {
            originX: mapInfo.originX,
            originY: mapInfo.originY,
            direction: mapInfo.direction,
            width: mapInfo.width,
            height: mapInfo.height,
            resolution: mapInfo.resolution
          }
        };
        
        // 更新地图文件列表中的对应文件
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            const fileIndex = currentMapFiles.findIndex(file => file.id === currentEditFile.id);
            if (fileIndex !== -1) {
              currentMapFiles[fileIndex] = updatedMapFile;
              updatedFiles[selectedMap.id] = [...currentMapFiles];
            }
            return updatedFiles;
          });
        }
        
        message.success('地图文件更新成功！');
      } else {
        // 新增模式：创建新文件
        if (isDev) console.log('➕ [地图文件编辑] 新增模式：创建新文件');
        const newMapFile: MapFile = {
          id: `file_${Date.now()}`,
          name: values.mapFileName,
          thumbnail: thumbnailData,
          status: 'inactive',
          format: 'PNG',
          topologyData: {
            points: mapPoints,
            lines: mapLines,
            areas: mapAreas
          },
          grayscaleData: '',
          mapInfo: {
            originX: mapInfo.originX,
            originY: mapInfo.originY,
            direction: mapInfo.direction,
            width: mapInfo.width,
            height: mapInfo.height,
            resolution: mapInfo.resolution
          }
        };
        
        // 将新地图文件添加到对应地图的文件列表中
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            updatedFiles[selectedMap.id] = [newMapFile, ...currentMapFiles];
            return updatedFiles;
          });
        }
        
        message.success('地图文件创建成功！');
      }
      
      // 退出到地图列表
      setAddMapFileDrawerVisible(false);
      addMapFileForm.resetFields();
      setMapFileUploadedImage(null);
      setAddMapFileStep(1);
      setCurrentEditFile(null); // 清空编辑状态
      
    } catch (error) {
      message.error(currentEditFile ? '更新失败，请重试' : '创建失败，请重试');
    } finally {
      setSubmitAndExitLoading(false);
    }
  };

  // handleMapFileImageUpload函数已移除

  const handleCloseAddMapFileDrawer = () => {
    setAddMapFileDrawerVisible(false);
    addMapFileForm.resetFields();
    setMapFileUploadedImage(null);
    setAddMapFileStep(1);
    // 重置地图文件名称
    // 重置地图编辑器状态
    setSelectedTool('select'); // 重置为默认的选择工具
    setMapType('topology'); // 重置为默认的拓扑地图
    setCurrentMode('edit'); // 重置为编辑模式
    setMapPoints(defaultMapPoints);
    setPointCounter(1);
    setSelectedPoints([]);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setEditingPoint(null);
    setPointEditModalVisible(false);
    pointEditForm.resetFields();
    setActiveTabKey('tools'); // 重置为默认的绘图工具Tab
    
    // 重置线条相关状态
    setMapLines(defaultMapLines);
    setLineCounter(1);
    
    // 重置区域相关状态
    setMapAreas([]);
    setAreaCounter(1);
    setSelectedAreas([]);
    setIsDrawingArea(false);
    setCurrentAreaPoints([]);
    setMousePosition(null); // 清除鼠标位置，隐藏虚线
    setEditingArea(null);
    setAreaEditModalVisible(false);
    areaEditForm.resetFields();
    
    // 重置所有笔画绘制状态
    setAllStrokes([]);
    
    // 清除PNG画布内容
    if (pngCanvasRef.current) {
      const canvas = pngCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    // 重置地图信息
    setMapInfo({
      mapName: '',
      originX: 0,
      originY: 0,
      direction: 0,
      width: 0,
      height: 0,
      resolution: 0.05
    });
    
    // 重置编辑状态
    setCurrentEditFile(null);

  };
  
  // 地图编辑状态跟踪
  const [, setHasUnsavedChanges] = useState(false);
  const [initialMapState, setInitialMapState] = useState<{points: any[], lines: MapLine[], areas?: MapArea[]}>({points: [], lines: [], areas: []});
  
  // 检查是否有未保存的修改
  const checkForUnsavedChanges = () => {
    const currentState = { points: mapPoints, lines: mapLines };
    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(initialMapState);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };
  
  // 监听地图编辑状态变化
  useEffect(() => {
    checkForUnsavedChanges();
  }, [mapPoints, mapLines, initialMapState]);
  
  // 新的顶部工具栏处理函数
  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消',
      content: '取消后将丢失所有未保存的修改，确定要取消吗？',
      onOk: () => {
        if (isDev) console.log('🚫 [地图文件编辑] handleCancel 被调用', {
          '当前编辑文件': currentEditFile,
          '是否为编辑模式': currentEditFile !== null,
          '当前步骤': addMapFileStep
        });
        
        // 关闭批量设置面板
        setBatchSettingsPanelVisible(false);
        
        if (addMapFileStep === 2) {
          // 在地图编辑器（步骤2）中取消：直接退出到地图管理页面
          if (isDev) console.log('🔄 [地图文件编辑] 地图编辑器中取消：直接退出到地图管理页面');
          handleCloseAddMapFileDrawer();
          message.info('已取消编辑');
        } else {
          // 在步骤1中取消：也直接退出到地图管理页面
          if (isDev) console.log('🔄 [地图文件编辑] 基本信息步骤中取消：退出到地图管理页面');
          handleCloseAddMapFileDrawer();
          message.info('已取消编辑');
        }
      }
    });
  };
  

  
  const handleSave = () => {
    // 保存当前地图编辑状态（不提交到后台），包括区域数据
    const currentState = { points: mapPoints, lines: mapLines, areas: mapAreas };
    setInitialMapState(currentState);
    setHasUnsavedChanges(false);
    
    // 获取PNG画布数据
    let pngImageData = null;
    if (pngCanvasRef.current) {
      try {
        // 将Canvas内容转换为Base64格式的PNG数据
        pngImageData = pngCanvasRef.current.toDataURL('image/png');
        if (isDev) console.log('PNG画布数据已获取:', pngImageData ? '数据长度: ' + pngImageData.length : '无数据');
      } catch (error) {
        if (isDev) console.error('获取PNG画布数据失败:', error);
        message.warning('PNG画布数据获取失败，但其他数据已保存');
      }
    }
    
    message.success('地图已保存');
    if (isDev) console.log('保存地图数据:', { 
      mapPoints, 
      mapLines, 
      mapAreas,  // 添加区域数据到日志
      pngImageData: pngImageData ? '已获取PNG数据' : '无PNG数据',
      allStrokes: allStrokes.length + '个笔画'
      // erasedPixels: erasedPixels.length + '个擦除点' // 已移除
    });
  };

  // 复制选中的元素
  const handleCopyElements = () => {
    const selectedPointsData = mapPoints.filter(point => selectedPoints.includes(point.id));
    const selectedLinesData = mapLines.filter(line => selectedLines.includes(line.id));
    const selectedAreasData = mapAreas.filter(area => selectedAreas.includes(area.id));
    
    if (selectedPointsData.length === 0 && selectedLinesData.length === 0 && selectedAreasData.length === 0) {
      message.warning('请先选择要复制的元素');
      return;
    }
    
    setCopiedElements({
      points: selectedPointsData,
      lines: selectedLinesData,
      areas: selectedAreasData
    });
    
    const totalCount = selectedPointsData.length + selectedLinesData.length + selectedAreasData.length;
    message.success(`已复制 ${totalCount} 个元素`);
    if (isDev) console.log('复制元素:', { points: selectedPointsData.length, lines: selectedLinesData.length, areas: selectedAreasData.length });
  };

  // 粘贴复制的元素
  const handlePasteElements = () => {
    if (!copiedElements || (copiedElements.points.length === 0 && copiedElements.lines.length === 0 && copiedElements.areas.length === 0)) {
      message.warning('没有可粘贴的元素');
      return;
    }
    
    // 如果没有记录鼠标点击位置，使用默认偏移
    if (!lastClickPosition) {
      message.warning('请先在画布上点击确定粘贴位置');
      return;
    }
    
    const newPoints: any[] = [];
    const newLines: MapLine[] = [];
    const newAreas: MapArea[] = [];
    const pointIdMap: Record<string, string> = {}; // 旧ID到新ID的映射
    
    // 计算复制元素的中心点
    let centerX = 0, centerY = 0, totalElements = 0;
    
    // 计算点的中心
    copiedElements.points.forEach(point => {
      centerX += point.x;
      centerY += point.y;
      totalElements++;
    });
    
    // 计算区域的中心
    copiedElements.areas.forEach(area => {
      area.points.forEach(point => {
        centerX += point.x;
        centerY += point.y;
        totalElements++;
      });
    });
    
    if (totalElements > 0) {
      centerX /= totalElements;
      centerY /= totalElements;
    }
    
    // 计算偏移量：从中心点到鼠标点击位置
    const offsetX = lastClickPosition.x - centerX;
    const offsetY = lastClickPosition.y - centerY;
    
    // 复制点
    copiedElements.points.forEach(point => {
      const newId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      pointIdMap[point.id] = newId;
      
      const newPoint = {
        ...point,
        id: newId,
        name: `${point.name}_副本`,
        x: point.x + offsetX,
        y: point.y + offsetY
      };
      newPoints.push(newPoint);
    });
    
    // 复制线（需要更新点ID引用）
    copiedElements.lines.forEach(line => {
      const newId = `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 只有当起始点和结束点都在复制的点中时，才复制这条线
      if (pointIdMap[line.startPointId] && pointIdMap[line.endPointId]) {
        const newLine: MapLine = {
          ...line,
          id: newId,
          name: `${line.name}_副本`,
          startPointId: pointIdMap[line.startPointId],
          endPointId: pointIdMap[line.endPointId]
        };
        newLines.push(newLine);
      }
    });
    
    // 复制区域
    copiedElements.areas.forEach(area => {
      const newId = `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newArea: MapArea = {
        ...area,
        id: newId,
        name: `${area.name}_副本`,
        points: area.points.map(point => ({
          x: point.x + offsetX,
          y: point.y + offsetY
        }))
      };
      newAreas.push(newArea);
    });
    
    // 更新状态
    setMapPoints(prev => [...prev, ...newPoints]);
    setMapLines(prev => [...prev, ...newLines]);
    setMapAreas(prev => [...prev, ...newAreas]);
    
    // 选中新粘贴的元素
    setSelectedPoints(newPoints.map(p => p.id));
    setSelectedLines(newLines.map(l => l.id));
    setSelectedAreas(newAreas.map(a => a.id));
    
    const totalCount = newPoints.length + newLines.length + newAreas.length;
    message.success(`已粘贴 ${totalCount} 个元素`);
    if (isDev) console.log('粘贴元素:', { points: newPoints.length, lines: newLines.length, areas: newAreas.length });
  };
  
  // handleSubmit函数已移除
  
  const handleSubmitAndExit = async () => {
    try {
      if (isDev) console.log('地图文件重复：进入 handleSubmitAndExit 函数', {
        '当前编辑文件': currentEditFile,
        '表单数据': addMapFileForm.getFieldsValue(),
        '选中地图': selectedMap,
        'mapInfo': mapInfo
      });
      
      // 关闭批量设置面板
      setBatchSettingsPanelVisible(false);
      
      setSubmitAndExitLoading(true);
      
      // 获取地图文件名称：优先从mapInfo中获取，如果没有则从表单中获取
      let mapFileName = mapInfo.mapName;
      if (!mapFileName || mapFileName === '新建地图文件') {
        try {
          const values = await addMapFileForm.validateFields();
          mapFileName = values.mapFileName;
        } catch (error) {
          if (isDev) console.error('❌ [地图文件保存] 表单验证失败:', error);
          message.error('请填写地图文件名称');
          setSubmitAndExitLoading(false);
          return;
        }
      }
      
      if (isDev) console.log('📝 [地图文件保存] 获取到的地图文件名称:', {
        '从mapInfo获取': mapInfo.mapName,
        '最终使用': mapFileName
      });
      
      // 获取PNG画布数据
      let pngImageData = null;
      try {
        if (pngCanvasRef.current) {
          pngImageData = pngCanvasRef.current.toDataURL('image/png');
          if (isDev) console.log('📸 [PNG数据获取] 成功获取PNG画布数据:', {
            '数据长度': pngImageData.length,
            '数据前缀': pngImageData.substring(0, 50) + '...'
          });
        } else {
          if (isDev) console.warn('⚠️ [PNG数据获取] PNG画布引用不存在');
        }
      } catch (pngError) {
        if (isDev) console.error('❌ [PNG数据获取] 获取PNG数据失败:', pngError);
      }
      
      // 生成包含拓扑数据的缩略图
      const thumbnailWithTopology = await generateThumbnailWithTopology();
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isDev) console.log('💾 [地图文件保存] 保存数据:', {
        '地图文件名': mapFileName,
        'PNG数据': pngImageData ? '已获取' : '未获取',
        '笔画数据': allStrokes.length + ' 条笔画',
        // '擦除点数据': erasedPixels.length + ' 个擦除点', // 已移除
        '拓扑数据': `${mapPoints.length}个点, ${mapLines.length}条线, ${mapAreas.length}个区域`
      });
      
      if (currentEditFile) {
        if (isDev) console.log('地图文件重复：编辑模式下更新文件', {
          '编辑文件ID': currentEditFile.id,
          '新文件名': mapFileName,
          '原文件名': currentEditFile.name
        });
        // 编辑模式：更新现有文件
        const updatedMapFile: MapFile = {
          ...currentEditFile,
          name: mapFileName,
          thumbnail: thumbnailWithTopology,
          // 保存地图编辑器中的数据
          topologyData: {
            points: mapPoints,
            lines: mapLines,
            areas: mapAreas,
            strokes: allStrokes
          },
          grayscaleData: pngImageData || currentEditFile.grayscaleData,
          mapInfo: {
            ...mapInfo,
            mapName: mapFileName
          }
        };
        
        // 更新地图文件列表中的对应文件
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            
            // 检查是否有同名文件（除了当前编辑的文件）
            const existingSameNameFileIndex = currentMapFiles.findIndex(
              f => f.name === mapFileName && f.id !== currentEditFile.id
            );
            
            if (existingSameNameFileIndex !== -1) {
              // 如果存在同名文件，覆盖同名文件
              currentMapFiles.splice(existingSameNameFileIndex, 1);
            }
            
            // 更新当前编辑的文件
        const fileIndex = currentMapFiles.findIndex(f => f.id === currentEditFile.id);
        if (isDev) console.log('🗺️ [地图文件编辑] 更新现有文件索引查找', {
          '文件ID': currentEditFile.id,
          '找到的索引': fileIndex,
          '当前文件列表长度': currentMapFiles.length
        });
        
        if (fileIndex !== -1) {
          currentMapFiles[fileIndex] = updatedMapFile;
          if (isDev) console.log('🗺️ [地图文件编辑] 文件更新完成', {
            '更新的文件': updatedMapFile,
            '文件名称': updatedMapFile.name,
            'mapInfo中的mapName': updatedMapFile.mapInfo?.mapName
          });
        }
        
        updatedFiles[selectedMap.id] = [...currentMapFiles];
        return updatedFiles;
      });
    }
    
    message.success('地图文件更新成功！');
      } else {
        if (isDev) console.log('地图文件重复：新增模式下创建文件', {
          '新文件名': mapFileName,
          '选中地图ID': selectedMap?.id
        });
        // 新增模式：创建新文件或覆盖同名文件
        if (isDev) console.log('🗺️ [地图文件编辑] 创建新文件对象', {
          '表单文件名': mapFileName,
          '当前mapInfo': mapInfo,
          '即将设置的mapName': mapFileName
        });
        
        const newMapFile: MapFile = {
          id: `file_${Date.now()}`,
          name: mapFileName,
          thumbnail: thumbnailWithTopology,
          status: 'inactive',
          format: 'PNG',
          // 保存地图编辑器中的数据
          topologyData: {
            points: mapPoints,
            lines: mapLines,
            areas: mapAreas,
            strokes: allStrokes
          },
          grayscaleData: pngImageData || undefined,
          mapInfo: {
            ...mapInfo,
            mapName: mapFileName
          }
        };
        
        if (isDev) console.log('🗺️ [地图文件编辑] 新文件对象创建完成', {
          '新文件': newMapFile,
          '文件名称': newMapFile.name,
          'mapInfo中的mapName': newMapFile.mapInfo?.mapName
        });
        
        // 将新地图文件添加到对应地图的文件列表中
        if (selectedMap) {
          setMapFiles(prev => {
            const updatedFiles = { ...prev };
            const currentMapFiles = updatedFiles[selectedMap.id] || [];
            
            // 检查是否有同名文件
            const existingSameNameFileIndex = currentMapFiles.findIndex(
              f => f.name === mapFileName
            );
            
            if (existingSameNameFileIndex !== -1) {
              // 如果存在同名文件，覆盖它
              currentMapFiles[existingSameNameFileIndex] = newMapFile;
              message.success('地图文件已覆盖更新！');
            } else {
              // 如果不存在同名文件，添加新文件
              currentMapFiles.unshift(newMapFile);
              message.success('地图文件创建成功！');
            }
            
            updatedFiles[selectedMap.id] = [...currentMapFiles];
            return updatedFiles;
          });
        }
      }
      
      if (isDev) console.log('地图文件重复：保存成功，准备重置状态', {
        '编辑模式': !!currentEditFile,
        '当前编辑文件': currentEditFile
      });
      
      // 重置状态并退出编辑器
      setTimeout(() => {
        // 关闭抽屉但保持编辑状态（如果是编辑模式）
        setAddMapFileDrawerVisible(false);
        addMapFileForm.resetFields();
        setMapFileUploadedImage(null);
        setAddMapFileStep(1);
        
        // 重置地图编辑器状态
        setSelectedTool('select');
        setMapType('topology');
        setCurrentMode('edit');
        setMapPoints(defaultMapPoints);
        setPointCounter(1);
        setSelectedPoints([]);
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setEditingPoint(null);
        setPointEditModalVisible(false);
        pointEditForm.resetFields();
        setActiveTabKey('tools');
        
        // 重置线条相关状态
        setMapLines(defaultMapLines);
        setLineCounter(1);
        
        // 重置区域相关状态
        setMapAreas([]);
        setAreaCounter(1);
        setSelectedAreas([]);
        setIsDrawingArea(false);
        setCurrentAreaPoints([]);
        setMousePosition(null);
        setEditingArea(null);
        setAreaEditModalVisible(false);
        areaEditForm.resetFields();
        
        // 重置所有笔画绘制状态
        setAllStrokes([]);
        
        // 清除PNG画布内容
        if (pngCanvasRef.current) {
          const canvas = pngCanvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        
        // 保存当前编辑文件的名称（在重置currentEditFile之前）
        const currentFileName = currentEditFile ? currentEditFile.name : '';
        
        // 重置编辑状态
        if (isDev) console.log('地图文件重复：重置编辑状态，设置 currentEditFile 为 null');
        setCurrentEditFile(null);
        
        // 重置地图信息（保留当前地图文件名称）
        if (isDev) console.log('🗺️ [地图文件编辑] 重置mapInfo状态', {
          '当前文件名': currentFileName,
          '是否编辑模式': !!currentEditFile,
          '重置前mapInfo': mapInfo
        });
        
        setMapInfo(prev => {
          const newMapInfo = {
            ...prev,
            // 如果是编辑模式，保留当前地图文件名称；如果是新增模式，重置为空
            mapName: currentFileName,
            originX: 0,
            originY: 0,
            direction: 0,
            width: 0,
            height: 0,
            resolution: 0.05
          };
          
          if (isDev) console.log('🗺️ [地图文件编辑] mapInfo重置完成', {
            '新mapInfo': newMapInfo,
            '新mapName': newMapInfo.mapName
          });
          
          return newMapInfo;
        });
      }, 1000);
      
    } catch (error) {
      if (isDev) console.error('保存失败:', error);
      message.error(currentEditFile ? '更新失败，请重试' : '创建失败，请重试');
    } finally {
      setSubmitAndExitLoading(false);
    }
  };

  // 模式切换处理函数
  const handleExitEditMode = () => {
    // 检查是否有未保存的编辑记录
    const hasChanges = checkForUnsavedChanges();
    
    if (hasChanges) {
      // 有编辑记录，弹出二次确认弹窗
      Modal.confirm({
        title: '退出编辑模式',
        content: '检测到您有未保存的编辑记录，请选择操作：',
        okText: '保存并退出',
        cancelText: '直接退出',
        onOk: () => {
          // 保存并退出编辑模式
          handleSave();
          setCurrentMode('view');
          // 切换到阅览模式时强制选择工具为select
          setSelectedTool('select');
          message.success('已保存修改并退出编辑模式');
        },
        onCancel: () => {
          // 直接退出编辑模式，不保存
          Modal.confirm({
            title: '确认直接退出',
            content: '直接退出将丢失所有未保存的修改，确定要继续吗？',
            okText: '确定退出',
            cancelText: '取消',
            okType: 'danger',
            onOk: () => {
              setCurrentMode('view');
              // 切换到阅览模式时强制选择工具为select
              setSelectedTool('select');
              message.info('已退出编辑模式，未保存的修改已丢失');
            }
          });
        }
      });
    } else {
      // 没有编辑记录，直接退出编辑模式
      setCurrentMode('view');
      // 切换到阅览模式时强制选择工具为select
      setSelectedTool('select');
      message.success('已退出编辑模式');
    }
  };

  const handleEnterEditMode = () => {
    setCurrentMode('edit');
    message.success('已进入编辑模式');
  };

  // handleConfirmExitEdit函数已移除

  // 取消退出编辑函数 - 已移除未使用的函数

  // 搜索处理函数
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (isDev) console.log(`搜索${searchType === 'line' ? '线' : '点'}:`, value);
    // 这里可以添加实际的搜索逻辑
  };
  
  // 画布拖动和缩放处理函数
  const handleCanvasDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    // 支持拖动工具或空格键拖动
    if (!dragTool && !isSpacePressed && !isDragging) return;
    
    // 设置画布被点击状态，用于启用双指缩放功能
    setIsCanvasClicked(true);
    
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDragging) {
      // 开始拖动
      setIsDragging(true);
      const startX = event.clientX;
      const startY = event.clientY;
      const startOffset = { ...canvasOffset };
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // 设置拖动灵敏度为1:1
        const sensitivity = 1.0;
        
        setCanvasOffset({
          x: startOffset.x + deltaX * sensitivity,
          y: startOffset.y + deltaY * sensitivity
        });
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
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

  // 画布居中显示指定节点
  const centerCanvasOnPoint = (pointId: string) => {
    const point = mapPoints.find(p => p.id === pointId);
    if (!point || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // 计算画布中心点
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // 计算需要的偏移量，使节点位于画布中心
    // 由于transform的顺序是scale然后translate，所以偏移量不需要乘以缩放比例
    const newOffsetX = (centerX / canvasScale) - point.x;
    const newOffsetY = (centerY / canvasScale) - point.y;

    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  };

  // 处理节点列表点击事件
  const handleNodeListClick = (pointId: string) => {
    // 选中该节点
    setSelectedPoints([pointId]);
    
    // 清除其他选中状态
    if (selectedLines.length > 0) {
      setSelectedLines([]);
    }
    if (selectedAreas.length > 0) {
      setSelectedAreas([]);
    }
    
    // 居中显示该节点
    centerCanvasOnPoint(pointId);
    
    // 切换到选择工具
    setSelectedTool('select');
  };

  // 处理路径列表点击事件
  const handleLineListClick = (lineId: string) => {
    // 选中该路径
    setSelectedLines([lineId]);
    
    // 清除其他选中状态
    if (selectedPoints.length > 0) {
      setSelectedPoints([]);
    }
    if (selectedAreas.length > 0) {
      setSelectedAreas([]);
    }
    
    // 计算路径中心点并居中显示
    const line = mapLines.find(l => l.id === lineId);
    if (line) {
      const startPoint = getPointById(line.startPointId);
      const endPoint = getPointById(line.endPointId);
      if (startPoint && endPoint) {
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        
        // 创建虚拟点用于居中显示
        const virtualPoint = { x: centerX, y: centerY };
        
        // 计算画布中心
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          const canvasCenterX = canvasRect.width / 2;
          const canvasCenterY = canvasRect.height / 2;
          
          // 计算新的偏移量
          const newOffsetX = (canvasCenterX / canvasScale) - virtualPoint.x;
          const newOffsetY = (canvasCenterY / canvasScale) - virtualPoint.y;
          
          setCanvasOffset({ x: newOffsetX, y: newOffsetY });
        }
      }
    }
    
    // 切换到选择工具
    setSelectedTool('select');
  };

  // 处理区域列表点击事件
  const handleAreaListClick = (areaId: string) => {
    // 选中该区域
    setSelectedAreas([areaId]);
    
    // 清除其他选中状态
    if (selectedPoints.length > 0) {
      setSelectedPoints([]);
    }
    if (selectedLines.length > 0) {
      setSelectedLines([]);
    }
    
    // 计算区域中心点并居中显示
    const area = mapAreas.find(a => a.id === areaId);
    if (area && area.points.length > 0) {
      // 计算区域所有顶点的中心点
      const sumX = area.points.reduce((sum, point) => sum + point.x, 0);
      const sumY = area.points.reduce((sum, point) => sum + point.y, 0);
      const centerX = sumX / area.points.length;
      const centerY = sumY / area.points.length;
      
      // 创建虚拟点用于居中显示
      const virtualPoint = { x: centerX, y: centerY };
      
      // 计算画布中心
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const canvasCenterX = canvasRect.width / 2;
        const canvasCenterY = canvasRect.height / 2;
        
        // 计算新的偏移量
        const newOffsetX = (canvasCenterX / canvasScale) - virtualPoint.x;
        const newOffsetY = (canvasCenterY / canvasScale) - virtualPoint.y;
        
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
      }
    }
    
    // 切换到选择工具
    setSelectedTool('select');
  };
  
  // 触摸事件处理 - 双指缩放
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };
  
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    // 基础触摸事件调试 - 无条件触发

    
    // 只有在画布被点击过且空格键按下时才允许双指缩放
    if (event.touches.length === 2 && isCanvasClicked && isSpacePressed) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      setLastTouchDistance(distance);
      if (isDev) console.log('👆 [双指缩放] 开始双指操作，初始距离:', distance);
    }
  };
  
  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    // 基础触摸事件调试 - 无条件触发
    if (isDev) console.log('🔥 [触摸事件] TouchMove被触发!', {
      touchCount: event.touches.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // 只有在画布被点击过且空格键按下时才允许双指缩放
    if (event.touches.length === 2 && lastTouchDistance !== null && isCanvasClicked && isSpacePressed) {
      event.preventDefault();
      const currentDistance = getTouchDistance(event.touches);
      if (currentDistance !== null) {
        const scale = currentDistance / lastTouchDistance;
        const newScale = Math.max(0.1, Math.min(3, canvasScale * scale));
        setCanvasScale(newScale);
        setLastTouchDistance(currentDistance);
        if (isDev) console.log('🔍 [双指缩放] 缩放中，当前比例:', newScale);
      }
    }
  };
  
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    // 基础触摸事件调试 - 无条件触发
    if (isDev) console.log('🔥 [触摸事件] TouchEnd被触发!', {
      touchCount: event.touches.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (event.touches.length < 2) {
      setLastTouchDistance(null);
      if (isDev) console.log('✋ [双指缩放] 结束双指操作');
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    // 鼠标滚轮缩放 - 作为触摸缩放的替代方案
    if (isDev) console.log('🖱️ [滚轮缩放] 滚轮事件触发', {
      deltaY: event.deltaY,
      isCanvasClicked,
      isSpacePressed,
      canAllowZoom: isCanvasClicked && isSpacePressed
    });
    
    // 只有在画布被点击过且空格键按下时才允许滚轮缩放
    if (isCanvasClicked && isSpacePressed) {
      event.preventDefault();
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, canvasScale * scaleFactor));
      setCanvasScale(newScale);
      if (isDev) console.log('🔍 [滚轮缩放] 缩放比例:', newScale);
    }
  };
  
  const toggleDragTool = () => {
    setDragTool(!dragTool);
    if (!dragTool) {
      // 激活拖动工具时，切换到拖动模式
      setSelectedTool('');
    }
  };

  // 工具选择处理
  const handleToolSelect = (toolType: string) => {
    console.log('🔧 [工具选择] 选择工具:', toolType);
    if (isDev) console.log('🔧 [工具选择] 选择工具:', toolType);
    
    // 在黑白底图模式下，只允许选择特定工具
    if (mapType === 'grayscale') {
      const allowedTools = ['select', 'brush', 'eraser'];
      if (!allowedTools.includes(toolType)) {
        if (isDev) console.log('🚫 [工具限制] 黑白底图模式下不允许使用工具:', toolType);
        return; // 阻止选择不允许的工具
      }
    }
    
    // 检查是否是连线工具
    const isLineToolSelected = ['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(toolType);
    setSelectedTool(toolType);
    
    // 切换工具时关闭拖动模式
    if (dragTool) {
      setDragTool(false);
    }
    
    // 切换工具时清除选择状态
    if (toolType !== 'select') {
      setSelectedPoints([]);
      setSelectedLines([]);  // 添加清除线的选中状态
      setSelectedAreas([]);  // 添加清除区域的选中状态
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
    
    // 如果选择了连线工具，重置连线状态
    if (isLineToolSelected) {
      // 重置连线相关状态
      setIsConnecting(false);
      setConnectingStartPoint(null);
      setContinuousConnecting(false);
      setLastConnectedPoint(null);
    } else if (isConnecting || continuousConnecting) {
      // 如果当前处于连线模式但选择了非连线工具，退出连线模式
      exitConnectingMode();
    }
    
    // 如果选择了区域工具，重置区域绘制状态
    if (toolType === 'area') {
      // 重置区域绘制相关状态
      setIsDrawingArea(false);
      setCurrentAreaPoints([]);
      setCurrentAreaType('调速区域'); // 设置为调速区域类型
    } else if (toolType === 'forbidden-area') {
      // 禁行区域工具复用区域绘制逻辑，但设置不同的区域类型
      setIsDrawingArea(false);
      setCurrentAreaPoints([]);
      setCurrentAreaType('禁行区域'); // 设置为禁行区域类型
    } else if (toolType === 'multi-network-area') {
      // 多路网区域工具复用区域绘制逻辑，但设置不同的区域类型
      setIsDrawingArea(false);
      setCurrentAreaPoints([]);
      setCurrentAreaType('多路网区'); // 设置为多路网区域类型
    } else if (isDrawingArea && !isCompletingArea) {
      // 如果当前处于区域绘制模式但选择了非区域工具，且不在完成区域过程中，退出区域绘制模式

      setIsDrawingArea(false);

      setCurrentAreaPoints([]);

    } else if (isCompletingArea) {
      // 正在完成区域创建，跳过状态重置
    } else if (isDrawingArea) {
      // 意外情况：isDrawingArea为true但isCompletingArea也为true
    }

  };
  
  // 画布鼠标移动处理
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvasElement = event.currentTarget;
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 只在区域绘制模式下更新鼠标位置
    if ((selectedTool === 'area' || selectedTool === 'forbidden-area' || selectedTool === 'multi-network-area') && isDrawingArea) {
      setMousePosition({ x, y });
    } else {
      // 清除鼠标位置，隐藏虚线
      setMousePosition(null);
    }
  };
  
  // 画布点击处理
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDev) console.log('🎯 [区域调试-画布点击调试] handleCanvasClick函数被调用', {
      当前工具: selectedTool,
      选中的区域数量: selectedAreas.length,
      选中的区域列表: selectedAreas,
      选中的点数量: selectedPoints.length,
      选中的线数量: selectedLines.length,
      是否正在框选: isSelecting,
      区域点击标记: areaClickedFlag.current,
      点击目标: (event.target as Element).tagName,
      时间戳: new Date().toISOString()
    });
    
    // 记录鼠标点击位置，用于粘贴功能
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    setLastClickPosition({ x, y });
    
    // 设置画布被点击状态，用于启用双指缩放功能
    setIsCanvasClicked(true);
    
    // 防抖逻辑 - 防止React.StrictMode导致的重复点击
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current < 100) { // 100ms内的重复点击将被忽略
      if (isDev) console.log('🚫 [防抖] 检测到重复点击，忽略此次点击', {
        时间间隔: currentTime - lastClickTime.current,
        上次点击时间: lastClickTime.current,
        当前点击时间: currentTime
      });
      return;
    }
    lastClickTime.current = currentTime;
    
    // 如果点击的是地图点或区域，不处理画布点击
    const clickedElement = event.target as Element;
    if (isDev) console.log('🔍 [画布点击调试] 检查点击目标', {
      目标元素: clickedElement.tagName,
      目标类名: clickedElement.className,
      是否为地图点: !!clickedElement.closest('.map-point'),
      是否为polygon: clickedElement.tagName === 'polygon',
      时间戳: new Date().toISOString()
    });
    
    if (clickedElement.closest('.map-point')) {
      if (isDev) console.log('🔍 [画布点击调试] 点击了地图点，忽略画布点击');
      return;
    }
    
    // 如果点击的是控制手柄按钮，不处理画布点击
    if (clickedElement.closest('.control-handle') || clickedElement.closest('.control-button')) {
      if (isDev) console.log('🔍 [画布点击调试] 点击了控制手柄，忽略画布点击');
      return;
    }
    
    // 如果点击的是区域polygon，不处理画布点击
    if (clickedElement.tagName === 'polygon') {
      if (isDev) console.log('🔍 [画布点击调试] 点击了区域polygon，忽略画布点击');
      return;
    }
    
    // 如果是选择工具且刚刚完成了框选操作，需要特殊处理
    if (isDev) console.log('🎯 [区域调试-框选检查] 检查是否刚完成框选', {
      当前工具: selectedTool,
      是否为选择工具: selectedTool === 'select',
      wasJustSelecting状态: wasJustSelecting.current,
      条件判断结果: selectedTool === 'select' && wasJustSelecting.current ? '将提前返回' : '继续执行'
    });
    
    if (selectedTool === 'select' && wasJustSelecting.current) {
      if (isDev) console.log('🎯 [区域调试-框选检查] 刚完成框选，重置标记并返回');
      wasJustSelecting.current = false;
      
      // 即使刚完成框选，也要清除线的选中状态（如果有的话）
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 即使刚完成框选，也要清除区域的选中状态（如果有的话）
      if (selectedAreas.length > 0) {
        setSelectedAreas([]);
      }
      
      if (isDev) console.log('🎯 [区域调试-框选检查] 框选完成处理结束，保留点的选中状态');
      return; // 直接返回，不执行后续的清除逻辑
    }
    
    if (selectedTool === 'point') {
      const canvasElement = event.currentTarget;
      
      // 详细的坐标转换调试
      if (isDev) console.log('🎯 [完整坐标流程] handleCanvasClick开始', {
        原始事件坐标: { 
          clientX: event.clientX, 
          clientY: event.clientY,
          offsetX: (event as any).offsetX,
          offsetY: (event as any).offsetY
        },
        画布元素信息: {
          tagName: canvasElement.tagName,
          className: canvasElement.className,
          rect: canvasElement.getBoundingClientRect()
        },
        当前画布状态: {
          canvasScale: canvasScale,
          canvasOffset: canvasOffset
        },
        timestamp: new Date().toISOString()
      });
      
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [完整坐标流程] 坐标转换完成', {
        输入屏幕坐标: { clientX: event.clientX, clientY: event.clientY },
        输出画布坐标: { x, y },
        即将创建点的位置: { x, y },
        timestamp: new Date().toISOString()
      });
      
      // 清除线的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 创建新点
      const newPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `n${pointCounter}`,
        type: '节点', // 默认类型
        x: x,
        y: y,
        direction: 0, // 默认方向
        isDisabled: false, // 默认启用
        noUturn: false // 默认不禁止掉头
      };
      
      // 保存历史记录（添加点之前）
      saveToHistory();
      
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
    } else if (selectedTool === 'station') {
      const canvasElement = event.currentTarget;
      
      // 详细的坐标转换调试
      if (isDev) console.log('🎯 [完整坐标流程] handleCanvasClick开始 - 绘制站点', {
        原始事件坐标: { 
          clientX: event.clientX, 
          clientY: event.clientY,
          offsetX: (event as any).offsetX,
          offsetY: (event as any).offsetY
        },
        画布元素信息: {
          tagName: canvasElement.tagName,
          className: canvasElement.className,
          rect: canvasElement.getBoundingClientRect()
        },
        当前画布状态: {
          canvasScale: canvasScale,
          canvasOffset: canvasOffset
        },
        timestamp: new Date().toISOString()
      });
      
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [完整坐标流程] 坐标转换完成 - 绘制站点', {
        输入屏幕坐标: { clientX: event.clientX, clientY: event.clientY },
        输出画布坐标: { x, y },
        即将创建站点的位置: { x, y },
        timestamp: new Date().toISOString()
      });
      
      // 清除线的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 创建新站点
      const newPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `s${pointCounter}`,
        type: '站点', // 默认类型为站点
        x: x,
        y: y,
        direction: 0, // 默认方向
        isDisabled: false, // 默认启用
        noUturn: false // 默认不禁止掉头
      };
      
      // 保存历史记录（添加点之前）
      saveToHistory();
      
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
    } else if (selectedTool === 'dock') {
      const canvasElement = event.currentTarget;
      
      // 详细的坐标转换调试
      if (isDev) console.log('🎯 [完整坐标流程] handleCanvasClick开始 - 绘制停靠点', {
        原始事件坐标: { 
          clientX: event.clientX, 
          clientY: event.clientY,
          offsetX: (event as any).offsetX,
          offsetY: (event as any).offsetY
        },
        画布元素信息: {
          tagName: canvasElement.tagName,
          className: canvasElement.className,
          rect: canvasElement.getBoundingClientRect()
        },
        当前画布状态: {
          canvasScale: canvasScale,
          canvasOffset: canvasOffset
        },
        timestamp: new Date().toISOString()
      });
      
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [完整坐标流程] 坐标转换完成 - 绘制停靠点', {
        输入屏幕坐标: { clientX: event.clientX, clientY: event.clientY },
        输出画布坐标: { x, y },
        即将创建停靠点的位置: { x, y },
        timestamp: new Date().toISOString()
      });
      
      // 清除线的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 创建新停靠点
      const newPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `d${pointCounter}`,
        type: '停靠点', // 默认类型为停靠点
        x: x,
        y: y,
        direction: 0, // 默认方向
        isDisabled: false, // 默认启用
        noUturn: false // 默认不禁止掉头
      };
      
      // 保存历史记录（添加点之前）
      saveToHistory();
      
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
    } else if (selectedTool === 'charge') {
      const canvasElement = event.currentTarget;
      
      // 详细的坐标转换调试
      if (isDev) console.log('🎯 [完整坐标流程] handleCanvasClick开始 - 绘制充电点', {
        原始事件坐标: { 
          clientX: event.clientX, 
          clientY: event.clientY,
          offsetX: (event as any).offsetX,
          offsetY: (event as any).offsetY
        },
        画布元素信息: {
          tagName: canvasElement.tagName,
          className: canvasElement.className,
          rect: canvasElement.getBoundingClientRect()
        },
        当前画布状态: {
          canvasScale: canvasScale,
          canvasOffset: canvasOffset
        },
        timestamp: new Date().toISOString()
      });
      
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [完整坐标流程] 坐标转换完成 - 绘制充电点', {
        输入屏幕坐标: { clientX: event.clientX, clientY: event.clientY },
        输出画布坐标: { x, y },
        即将创建充电点的位置: { x, y },
        timestamp: new Date().toISOString()
      });
      
      // 清除线的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 创建新充电点
      const newPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `c${pointCounter}`,
        type: '充电点', // 默认类型为充电点
        x: x,
        y: y,
        direction: 0, // 默认方向
        isDisabled: false, // 默认启用
        noUturn: false // 默认不禁止掉头
      };
      
      // 保存历史记录（添加点之前）
      saveToHistory();
      
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
    } else if (selectedTool === 'temp') {
      const canvasElement = event.currentTarget;
      
      // 详细的坐标转换调试
      if (isDev) console.log('🎯 [完整坐标流程] handleCanvasClick开始 - 绘制临停点', {
        原始事件坐标: { 
          clientX: event.clientX, 
          clientY: event.clientY,
          offsetX: (event as any).offsetX,
          offsetY: (event as any).offsetY
        },
        画布元素信息: {
          tagName: canvasElement.tagName,
          className: canvasElement.className,
          rect: canvasElement.getBoundingClientRect()
        },
        当前画布状态: {
          canvasScale: canvasScale,
          canvasOffset: canvasOffset
        },
        timestamp: new Date().toISOString()
      });
      
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [完整坐标流程] 坐标转换完成 - 绘制临停点', {
        输入屏幕坐标: { clientX: event.clientX, clientY: event.clientY },
        输出画布坐标: { x, y },
        即将创建临停点的位置: { x, y },
        timestamp: new Date().toISOString()
      });
      
      // 清除线的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 创建新临停点
      const newPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `m${pointCounter}`,
        type: '临停点', // 默认类型为临停点
        x: x,
        y: y,
        direction: 0, // 默认方向
        isDisabled: false, // 默认启用
        noUturn: false // 默认不禁止掉头
      };
      
      // 保存历史记录（添加点之前）
      saveToHistory();
      
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
    } else if (selectedTool === 'area' || selectedTool === 'forbidden-area' || selectedTool === 'multi-network-area') {
      // 区域绘制工具
      const canvasElement = event.currentTarget;
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [区域绘制] 添加点', {
        画布坐标: { x, y },
        当前区域点数: currentAreaPoints.length,
        是否正在绘制: isDrawingArea
      });
      
      // 清除其他选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      if (selectedPoints.length > 0) {
        setSelectedPoints([]);
      }
      
      // 添加点到当前区域
      const newAreaPoint = { x, y };
      const updatedAreaPoints = [...currentAreaPoints, newAreaPoint];
      setCurrentAreaPoints(updatedAreaPoints);
      
      // 如果是第一个点，开始绘制模式
      if (!isDrawingArea) {
        setIsDrawingArea(true);
      }
      
      // 如果已有3个或更多点，可以完成区域绘制（双击或右键完成）
      if (updatedAreaPoints.length >= 3) {
        if (isDev) console.log('🎯 [区域绘制] 已有足够点数，可以完成区域绘制', {
          点数: updatedAreaPoints.length,
          提示: '双击或右键完成区域绘制'
        });
      }
    } else if (['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(selectedTool)) {
      // 线工具模式：自动创建点并开始连线
      const canvasElement = event.currentTarget;
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      if (isDev) console.log('🎯 [线工具-自动创建点] 开始处理', {
        工具类型: selectedTool,
        点击坐标: { x, y },
        是否正在连线: isConnecting,
        连续连线状态: continuousConnecting,
        起始点: connectingStartPoint,
        最后连接点: lastConnectedPoint
      });
      
      // 清除其他选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      if (selectedAreas.length > 0) {
        setSelectedAreas([]);
      }
      
      // 创建新点
      const newPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `n${pointCounter}`,
        type: '节点',
        x: x,
        y: y,
        direction: 0,
        isDisabled: false, // 默认启用
        noUturn: false // 默认不禁止掉头
      };
      
      if (isDev) console.log('🎯 [线工具-自动创建点] 创建新点', {
        新点信息: newPoint,
        当前点计数器: pointCounter
      });
      
      // 保存历史记录（添加点之前）
      saveToHistory();
      
      // 添加新点到地图
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
      
      // 自动开始连线逻辑
      setTimeout(() => {
        if (isDev) console.log('🎯 [线工具-自动创建点] 开始连线逻辑', {
          新点ID: newPoint.id,
          当前连线状态: {
            isConnecting,
            continuousConnecting,
            connectingStartPoint,
            lastConnectedPoint
          }
        });
        
        handlePointConnection(newPoint.id);
      }, 10); // 短暂延迟确保状态更新完成
      
    } else if (selectedTool === 'select') {
      if (isDev) console.log('🎯 [区域调试-选择工具调试] 进入选择工具处理逻辑', {
        是否正在框选: isSelecting,
        选中点数量: selectedPoints.length,
        选中线数量: selectedLines.length,
        选中区域数量: selectedAreas.length,
        选中区域列表: selectedAreas,
        区域点击标记: areaClickedFlag.current
      });
      
      // 选择工具：在非框选状态下，点击空白区域清除所有选中状态
      if (isDev) console.log('🎯 [区域调试-选择工具调试] 检查是否进入清除逻辑', {
        isSelecting值: isSelecting,
        取反后: !isSelecting,
        条件判断结果: !isSelecting ? '将进入清除逻辑' : '不会进入清除逻辑'
      });
      
      if (!isSelecting) {
        if (isDev) console.log('🎯 [区域调试-选择工具调试] 非框选状态，点击空白区域清除所有选中状态', {
          当前选中区域数量: selectedAreas.length,
          当前选中区域列表: selectedAreas,
          即将执行清除操作: true
        });
        
        // 清除点的选中状态
        if (selectedPoints.length > 0) {
          if (isDev) console.log('🎯 [区域调试-选择工具调试] 清除点的选中状态');
          setSelectedPoints([]);
        }
        
        // 清除线的选中状态
        if (selectedLines.length > 0) {
          if (isDev) console.log('🎯 [区域调试-选择工具调试] 清除线的选中状态');
          setSelectedLines([]);
        }
        
        // 清除区域的选中状态
        if (selectedAreas.length > 0) {
          if (isDev) console.log('🎯 [区域调试-选择工具调试] 清除区域的选中状态', {
            清除前区域数量: selectedAreas.length,
            清除前区域列表: selectedAreas,
            执行setSelectedAreas: '[]'
          });
          setSelectedAreas([]);
          if (isDev) console.log('🎯 [区域调试-选择工具调试] 区域选中状态已清除');
        } else {
          if (isDev) console.log('🎯 [区域调试-选择工具调试] 没有选中的区域需要清除', {
            当前区域数量: selectedAreas.length
          });
        }
        
        // 清除顶点的选中状态
        if (selectedVertices.length > 0) {
          if (isDev) console.log('🎯 [区域调试-选择工具调试] 清除顶点的选中状态');
          setSelectedVertices([]);
        }
        
        setSelectionStart(null);
        setSelectionEnd(null);
      } else {
        if (isDev) console.log('🎯 [区域调试-选择工具调试] 框选进行中，不做处理');
      }
      // 框选进行中时不做任何处理
    } else {
      // 其他工具模式：清除线和区域的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      if (selectedAreas.length > 0) {
        setSelectedAreas([]);
      }
    }
  };
  
  // 点击点元素处理
  const handlePointClick = (event: React.MouseEvent, pointId: string) => {
    event.stopPropagation();
    
    // 记录点击位置用于粘贴
    const canvasElement = event.currentTarget.closest('.canvas-container') as HTMLDivElement;
    if (canvasElement) {
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      setLastClickPosition({ x, y });
      if (isDev) console.log('🎯 [点击调试] handlePointClick 记录位置:', { x: x.toFixed(2), y: y.toFixed(2) });
    }
    
    // 连线工具模式处理
    if (['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(selectedTool)) {
      handlePointConnection(pointId);
      return;
    }
    
    if (selectedTool === 'select') {
      let newSelectedPoints: string[];
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + 点击：多选
        const wasSelected = selectedPoints.includes(pointId);
        newSelectedPoints = wasSelected
          ? selectedPoints.filter(id => id !== pointId)
          : [...selectedPoints, pointId];
      } else {
        // 普通点击：单选
        newSelectedPoints = [pointId];
      }
      setSelectedPoints(newSelectedPoints);
      
      // 清除线的选中状态（点和线不能同时选中）
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      
      // 注意：不清除区域的选中状态，允许顶点选择和区域选择同时存在
      
      // 更新框选矩形以围绕选中的点
       if (newSelectedPoints.length > 0) {
         const selectedPointsData = mapPoints.filter(point => newSelectedPoints.includes(point.id));
         // 考虑点的实际大小（半径8px）和选中时的缩放（1.2倍）
         const pointRadius = 8 * 1.2; // 选中时点会放大到1.2倍
         const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
         const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
         const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
         const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
         
         // 添加少量边距让框选框紧贴圆圈边缘
         const padding = 3;
         const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
         const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
         
         if (isDev) console.log('🎯 [选中点框选] 设置框选坐标', {
           选中点数量: newSelectedPoints.length,
           画布坐标范围: { pointMinX, pointMaxX, pointMinY, pointMaxY },
           框选起始坐标: newSelectionStart,
           框选结束坐标: newSelectionEnd
         });
         
         setSelectionStart(newSelectionStart);
         setSelectionEnd(newSelectionEnd);
      } else {
        // 没有选中点时清除框选
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    }
  };

  // 处理点连接逻辑
  // 检查是否存在重复线条的函数
  const checkDuplicateLine = (startPointId: string, endPointId: string, lineType: string): boolean => {
    return mapLines.some(line => {
      if (lineType === 'double-line') {
        // 对于双向线，检查是否已存在任意方向的连线
        return (line.startPointId === startPointId && line.endPointId === endPointId) ||
               (line.startPointId === endPointId && line.endPointId === startPointId);
      } else {
        // 对于单向线，只检查相同方向的连线
        return line.startPointId === startPointId && line.endPointId === endPointId;
      }
    });
  };

  const handlePointConnection = (pointId: string) => {
    if (!isConnecting && !continuousConnecting) {
      // 开始连线模式
      setIsConnecting(true);
      setConnectingStartPoint(pointId);
      // 清除之前的鼠标位置，确保虚线渲染状态正确
      setMousePosition(null);
      mousePositionRef.current = null; // 同时清除ref

      // 第一次点击时不设置continuousConnecting和lastConnectedPoint，保持为null以便虚线正确显示
    } else if (continuousConnecting || (isConnecting && connectingStartPoint)) {
      // 连续连线模式
      // 优先使用lastConnectedPoint，如果没有则使用connectingStartPoint
      const startPoint = lastConnectedPoint || connectingStartPoint;
      if (startPoint && startPoint !== pointId) {
        // 检查是否存在重复线条
        if (checkDuplicateLine(startPoint, pointId, selectedTool)) {
          message.warning(`从点 ${getPointById(startPoint)?.name || startPoint} 到点 ${getPointById(pointId)?.name || pointId} 的线条已存在，无法重复绘制！`);
          return;
        }

        // 计算线长度
        const startPointData = getPointById(startPoint);
        const endPointData = getPointById(pointId);
        const lineLength = startPointData && endPointData ? 
          Math.sqrt(Math.pow(endPointData.x - startPointData.x, 2) + Math.pow(endPointData.y - startPointData.y, 2)) : 0;

        // 保存历史记录（创建线条之前）
        saveToHistory();
        
        // 创建新的连线
        if (selectedTool === 'double-line') {
          
          // 双向线：创建一条双向线
          const newLine: MapLine = {
            id: `line_${Date.now()}`,
            name: `e${lineCounter}`,
            startPointId: startPoint,
            endPointId: pointId,
            type: 'double-line',
            color: '#87CEEB',
            width: 2,
            length: Math.round(lineLength)
          };
          
          // 更新线计数器
          setLineCounter(prev => prev + 1);
          
          // 更新连线数据
          setMapLines(prev => [...prev, newLine]);
          
          message.success(`成功创建双向线条：${newLine.name}`);
        } else {
          // 单向线：创建一条线
          const newLine: MapLine = {
            id: `line_${Date.now()}`,
            name: `e${lineCounter}`,
            startPointId: startPoint,
            endPointId: pointId,
            type: selectedTool as 'single-line' | 'double-bezier' | 'single-bezier',
            color: '#87CEEB',
            width: 2,
            length: Math.round(lineLength)
          };
          
          // 更新线计数器
          setLineCounter(prev => prev + 1);
          
          // 更新连线数据
          setMapLines(prev => {
            const newLines = [...prev, newLine];
            return newLines;
          });
          
          message.success(`成功创建线条：${newLine.name}`);
        }
        
        // 更新最后连接的点，为下一次连线做准备
        setLastConnectedPoint(pointId);
        // 启用连续连线模式
        setContinuousConnecting(true);
      } else {
        // 起始点和结束点相同，不创建连线
        if (startPoint === pointId) {
          message.warning('不能在同一个点上创建线条！');
        }
      }
    } else {
      // 其他情况
    }
  };

  // 双击点元素处理
  const handlePointDoubleClick = (event: React.MouseEvent, point: any) => {
    console.log('🔍 [双击调试] 双击点事件触发', {
      点ID: point.id,
      点名称: point.name,
      当前工具: selectedTool,
      是否为选择工具: selectedTool === 'select'
    });
    
    event.stopPropagation();
    
    if (selectedTool === 'select') {
      console.log('🔍 [双击调试] 工具检查通过，准备打开属性面板');
      // 打开编辑弹窗
      setEditingPoint(point);
      pointEditForm.setFieldsValue({
        name: point.name,
        type: point.type,
        direction: point.direction,
        isDisabled: point.isDisabled || false, // 是否禁用，默认启用
        noUturn: point.noUturn || false // 是否禁止掉头，默认否
      });
      setPointEditModalVisible(true);
      console.log('🔍 [双击调试] 属性面板已设置为显示');
    } else {
      console.log('🔍 [双击调试] 当前工具不是选择工具，无法打开属性面板');
    }
  };

  // 区域双击编辑处理
  const handleAreaDoubleClick = (event: React.MouseEvent, area: any) => {
    event.stopPropagation();
    
    if (selectedTool === 'select') {
      // 打开区域编辑弹窗
      setEditingArea(area);
      
      // 设置基本表单字段
      areaEditForm.setFieldsValue({
        name: area.name,
        type: area.type,
        speed: area.speed,
        description: area.description
      });
      
      // 如果是多路网区，需要设置networkConfigs数据
      if (area.type === '多路网区' && area.networkGroupId && area.robotId) {
        const networkConfig = {
          id: '1',
          networkGroupId: area.networkGroupId,
          associatedRobots: [area.robotId]
        };
        setNetworkConfigs([networkConfig]);
        
        // 设置表单字段值
        areaEditForm.setFieldsValue({
          [`networkGroupId_${networkConfig.id}`]: area.networkGroupId,
          [`associatedRobots_${networkConfig.id}`]: [area.robotId]
        });
      } else {
        // 重置为默认配置
        setNetworkConfigs([{id: '1'}]);
      }
      
      setAreaEditModalVisible(true);
    }
  };

  // 框选结束处理函数
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

  const handleSelectionEndWithState = (isSelecting: boolean, selectionStart: {x: number, y: number} | null, selectionEnd: {x: number, y: number} | null) => {
    if (isSelecting && selectionStart && selectionEnd) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);
      
      // 检查框选区域大小（至少5像素）
      if (Math.abs(maxX - minX) > 5 && Math.abs(maxY - minY) > 5) {
        // 查找框选区域内的点
        const pointsInSelection = mapPoints.filter(point => {
          return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
        });
        
        // 设置选中的点
        setSelectedPoints(pointsInSelection.map(p => p.id));
        
        // 如果选中了多个点，显示批量设置面板
        if (pointsInSelection.length > 1) {
          setBatchSettingsPanelVisible(true);
        } else {
          setBatchSettingsPanelVisible(false);
        }
        
        // 查找框选区域内的线条（包括与框选区域相交的线条）
        const selectedPointIds = new Set(pointsInSelection.map(p => p.id));
        const linesInSelection = mapLines.filter(line => {
          // 如果线的两个端点都在框选区域内，直接选中
          if (selectedPointIds.has(line.startPointId) && selectedPointIds.has(line.endPointId)) {
            return true;
          }
          
          // 检查线段是否与框选矩形相交
          const startPoint = mapPoints.find(p => p.id === line.startPointId);
          const endPoint = mapPoints.find(p => p.id === line.endPointId);
          
          if (!startPoint || !endPoint) return false;
          
          // 使用线段与矩形相交算法
          return lineIntersectsRect(
            startPoint.x, startPoint.y,
            endPoint.x, endPoint.y,
            minX, minY, maxX, maxY
          );
        });
        
        // 设置选中的线条
        setSelectedLines(linesInSelection.map(line => line.id));
        
        // 调试日志
        if (isDev) console.log('📦 [框选调试] 选中结果:', {
          '选中点数量': pointsInSelection.length,
          '选中线数量': linesInSelection.length,
          '选中点ID': pointsInSelection.map(p => p.id),
          '选中线ID': linesInSelection.map(l => l.id)
        });
        
        if (pointsInSelection.length > 0) {
          // 有选中的点，计算选中点的边界
          const selectedPointsData = pointsInSelection;
          const pointRadius = 8; // 点的半径
          const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
          const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
          const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
          const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
          
          // 更新框选区域为选中点的边界
          setSelectionStart({ x: pointMinX, y: pointMinY });
          setSelectionEnd({ x: pointMaxX, y: pointMaxY });
        } else {
          // 没有选中任何点，清除框选状态
          setSelectedLines([]);
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
          setBatchSettingsPanelVisible(false);
        }
      } else {
        // 框选区域太小，清除选择
        setSelectedPoints([]);
        setSelectedLines([]);
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setBatchSettingsPanelVisible(false);
      }
    } else {
      // 没有有效的框选，清除状态
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setBatchSettingsPanelVisible(false);
    }
  };

  // 框选开始处理
  const handleSelectionStart = (event: React.MouseEvent<HTMLDivElement>) => {
    // 只有在编辑模式下且选择工具激活且没有点击到地图点且是左键点击时才开始框选
    if (currentMode === 'edit' && selectedTool === 'select' && !(event.target as Element).closest('.map-point') && event.button === 0) {
      // 阻止默认行为和事件冒泡
      event.preventDefault();
      event.stopPropagation();
      
      const canvasElement = event.currentTarget;
      
      // 使用坐标转换函数将屏幕坐标转换为画布坐标
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      // 调试日志 - 框选开始
      if (isDev) console.log('📦 [框选调试] handleSelectionStart 详细数据:', {
        '1_鼠标屏幕坐标': `{clientX: ${event.clientX}, clientY: ${event.clientY}}`,
        '2_转换后画布坐标': `{x: ${x.toFixed(2)}, y: ${y.toFixed(2)}}`,
        '3_画布状态': `{scale: ${canvasScale.toFixed(3)}, offset: {x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}}`,
        '4_当前工具': selectedTool,
        '5_事件目标': event.target
      });
      
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      
      // 清除之前选中的点
      setSelectedPoints([]);
      
      // 立即捕获当前状态值（使用闭包）
      const capturedIsSelecting = true; // 框选刚开始，肯定是true
      const capturedSelectionStart = { x, y }; // 框选起始点
      let capturedSelectionEnd = { x, y }; // 框选结束点，会在移动中更新
      
      // 添加全局事件监听
      const handleGlobalMouseMove = (e: MouseEvent) => {
         if (canvasRef.current) {
           // 使用坐标转换函数将屏幕坐标转换为画布坐标
           const { x: newX, y: newY } = screenToCanvasCoordinates(e.clientX, e.clientY, canvasRef.current);
           
           // 调试日志 - 框选移动（减少频繁输出）
           if (Math.random() < 0.1) { // 只输出10%的调用
             if (isDev) console.log('📦 [框选调试] handleGlobalMouseMove 详细数据:', {
               '1_鼠标屏幕坐标': `{clientX: ${e.clientX}, clientY: ${e.clientY}}`,
               '2_转换后画布坐标': `{x: ${newX.toFixed(2)}, y: ${newY.toFixed(2)}}`,
               '3_框选起始点': `{x: ${capturedSelectionStart.x.toFixed(2)}, y: ${capturedSelectionStart.y.toFixed(2)}}`,
               '4_画布状态': `{scale: ${canvasScale.toFixed(3)}, offset: {x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}}`
             });
           }
           
           // 更新UI状态
           setSelectionEnd({ x: newX, y: newY });
           // 同时更新闭包中的状态
           capturedSelectionEnd = { x: newX, y: newY };
         }
       };
      
      const handleGlobalMouseUp = () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        
        // 标记刚完成框选操作
        wasJustSelecting.current = true;
        
        // 使用闭包捕获的状态值
        handleSelectionEndWithState(capturedIsSelecting, capturedSelectionStart, capturedSelectionEnd);
        
        // 延迟重置标志，避免立即被点击事件清除
        setTimeout(() => {
          wasJustSelecting.current = false;
        }, 50);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
  };
  
  // 框选移动处理（现在由全局事件处理，这个函数保留但不使用）
  // 框选移动处理函数 - 已移除未使用的函数


  // 保存点编辑
  const handleSavePointEdit = (values: any) => {
    if (editingPoint) {
      // 保存历史记录（编辑点之前）
      saveToHistory();
      
      setMapPoints(prev => 
        prev.map(point => 
          point.id === editingPoint.id 
            ? { ...point, ...values }
            : point
        )
      );
      setPointEditModalVisible(false);
      setEditingPoint(null);
      pointEditForm.resetFields();
    }
  };



  // 保存区域编辑
  const handleSaveAreaEdit = (values: any) => {
    if (editingArea) {
      // 保存历史记录（编辑区域之前）
      saveToHistory();
      
      // 根据新的类型和速度获取颜色
      const updatedArea = { ...editingArea, ...values };
      const colors = getAreaColors(updatedArea);
      
      // 处理多路网区的数据
      let areaUpdateData = { ...values };
      if (values.type === '多路网区' && networkConfigs.length > 0) {
        // 获取第一个配置的数据（目前只支持一个配置）
        const firstConfig = networkConfigs[0];
        if (firstConfig.networkGroupId && firstConfig.associatedRobots && firstConfig.associatedRobots.length > 0) {
          areaUpdateData.networkGroupId = firstConfig.networkGroupId;
          areaUpdateData.robotId = firstConfig.associatedRobots[0]; // 取第一个机器人
        }
      }
      
      setMapAreas(prev => 
        prev.map(area => 
          area.id === editingArea.id 
            ? { 
                ...area, 
                ...areaUpdateData, 
                fillColor: colors.fillColor,
                strokeColor: colors.strokeColor
              }
            : area
        )
      );
      setAreaEditModalVisible(false);
      setEditingArea(null);
      areaEditForm.resetFields();
      // 重置networkConfigs
      setNetworkConfigs([{id: '1'}]);
      message.success('区域编辑成功');
    }
  };

  // 删除选中的点
  const handleDeleteSelectedPoints = () => {
    if (selectedPoints.length === 0) {
      return;
    }
    
    // 保存历史记录（删除点之前）
    saveToHistory();
    
    const deletedCount = selectedPoints.length;
    
    setMapPoints(prev => 
      prev.filter(point => !selectedPoints.includes(point.id))
    );
    setSelectedPoints([]);
    // 清除框选框显示
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    
    // 关闭批量设置面板
    setBatchSettingsPanelVisible(false);
    
    message.success(`已删除 ${deletedCount} 个点`);
  };

  // 从地图元素列表中移除节点
  const handleRemoveMapPoint = (pointId: string) => {
    const pointToRemove = mapPoints.find(p => p.id === pointId);
    if (pointToRemove) {
      setMapPoints(prev => prev.filter(point => point.id !== pointId));
      message.success(`节点 "${pointToRemove.name}" 已从地图元素列表中移除`);
    }
  };

  // 删除选中的线
  const handleDeleteSelectedLines = () => {
    if (selectedLines.length === 0) {
      return;
    }
    
    // 保存历史记录（删除线之前）
    saveToHistory();
    
    setMapLines(prev => 
      prev.filter(line => !selectedLines.includes(line.id))
    );
    
    const deletedCount = selectedLines.length;
    setSelectedLines([]);
    // 清除框选框显示
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    message.success(`已删除 ${deletedCount} 条线`);
  };

  // 删除选中的区域
  const handleDeleteSelectedAreas = () => {
    if (selectedAreas.length === 0) {
      return;
    }
    
    // 保存历史记录（删除区域之前）
    saveToHistory();
    
    setMapAreas(prev => 
      prev.filter(area => !selectedAreas.includes(area.id))
    );
    
    const deletedCount = selectedAreas.length;
    setSelectedAreas([]);
    // 清除框选框显示
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    message.success(`已删除 ${deletedCount} 个区域`);
  };

  // 对齐功能实现
  const handleAlignPoints = (alignType: 'top' | 'bottom' | 'left' | 'right') => {
    if (selectedPoints.length < 2) {
      message.warning('请至少选择两个点进行对齐');
      return;
    }

    // 获取选中的点
    const selectedPointsData = mapPoints.filter(point => selectedPoints.includes(point.id));
    
    if (selectedPointsData.length < 2) {
      message.warning('选中的点数据不足');
      return;
    }

    // 保存历史记录
    saveToHistory();

    // 计算基准值
    let referenceValue: number;
    switch (alignType) {
      case 'top':
        referenceValue = Math.min(...selectedPointsData.map(p => p.y));
        break;
      case 'bottom':
        referenceValue = Math.max(...selectedPointsData.map(p => p.y));
        break;
      case 'left':
        referenceValue = Math.min(...selectedPointsData.map(p => p.x));
        break;
      case 'right':
        referenceValue = Math.max(...selectedPointsData.map(p => p.x));
        break;
      default:
        return;
    }

    // 更新点的位置
    const updatedPoints = mapPoints.map(point => {
      if (selectedPoints.includes(point.id)) {
        return {
          ...point,
          x: alignType === 'left' || alignType === 'right' ? referenceValue : point.x,
          y: alignType === 'top' || alignType === 'bottom' ? referenceValue : point.y
        };
      }
      return point;
    });

    setMapPoints(updatedPoints);
    
    // 🔧 修复：对齐后重新计算选中框位置
    setTimeout(() => {
      if (selectedPoints.length > 0) {
        const alignedPointsData = updatedPoints.filter(point => selectedPoints.includes(point.id));
        if (alignedPointsData.length > 0) {
          const pointRadius = 8;
          const pointMinX = Math.min(...alignedPointsData.map(p => p.x - pointRadius));
          const pointMaxX = Math.max(...alignedPointsData.map(p => p.x + pointRadius));
          const pointMinY = Math.min(...alignedPointsData.map(p => p.y - pointRadius));
          const pointMaxY = Math.max(...alignedPointsData.map(p => p.y + pointRadius));
          
          const padding = 3;
          const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
          const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
          
          setSelectionStart(newSelectionStart);
          setSelectionEnd(newSelectionEnd);
        }
      }
    }, 0);
    
    const alignTypeMap = {
      'top': '上对齐',
      'bottom': '下对齐', 
      'left': '左对齐',
      'right': '右对齐'
    };
    
    message.success(`${alignTypeMap[alignType]}完成`);
  };

  // 撤销重做核心逻辑函数
  // 保存当前状态到历史记录
  const saveToHistory = () => {
    const currentState: HistoryState = {
      mapPoints: [...mapPoints],
      mapLines: [...mapLines],
      pointCounter,
      lineCounter
    };

    let newHistory: HistoryState[];
    let newIndex: number;

    // 如果当前不在历史记录的末尾，删除后面的记录
    if (historyIndex < history.length - 1) {
      newHistory = [...history.slice(0, historyIndex + 1), currentState];
      newIndex = historyIndex + 1;
    } else {
      // 如果历史记录超过最大限制，删除最早的记录
      if (history.length >= maxHistorySize) {
        newHistory = [...history.slice(1), currentState];
        newIndex = maxHistorySize - 1;
      } else {
        newHistory = [...history, currentState];
        newIndex = history.length;
      }
    }

    setHistory(newHistory);
    setHistoryIndex(newIndex);
  };

  // 撤销操作
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setMapPoints(previousState.mapPoints);
      setMapLines(previousState.mapLines);
      setPointCounter(previousState.pointCounter);
      setLineCounter(previousState.lineCounter);
      setHistoryIndex(historyIndex - 1);
      
      // 清除选中状态
      setSelectedPoints([]);
      setSelectedLines([]);
      
      message.success('已撤销上一步操作');
    } else {
      message.info('没有可撤销的操作');
    }
  };

  // 重做操作
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setMapPoints(nextState.mapPoints);
      setMapLines(nextState.mapLines);
      setPointCounter(nextState.pointCounter);
      setLineCounter(nextState.lineCounter);
      setHistoryIndex(historyIndex + 1);
      
      // 清除选中状态
      setSelectedPoints([]);
      setSelectedLines([]);
      
      message.success('已重做操作');
    } else {
      message.info('没有可重做的操作');
    }
  };

  // 判断当前选中的地图是否为黑白底图模式
  const isGrayscaleMode = () => {
    return mapType === 'grayscale';
  };

  // 画笔绘制事件处理函数
  const handleBrushStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== 'brush') return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };
  
  const handleBrushMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || selectedTool !== 'brush') return;
    
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    setCurrentStroke(prev => [...prev, { x, y }]);
  };
  
  const handleBrushEnd = () => {
    if (!isDrawing || selectedTool !== 'brush') return;
    
    if (currentStroke.length > 0) {
      const newStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        points: [...currentStroke],
        type: 'brush' as const,
        timestamp: Date.now(),
        size: 6 // brushSize
      };
      const newStrokes = [...allStrokes, newStroke];
      setAllStrokes(newStrokes);
      saveStrokeToHistory(newStrokes);
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  };
  
  const handleBrushClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== 'brush') return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    // 创建一个点（小圆圈）
    const newStroke = {
      id: `dot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: [{ x, y }],
      type: 'brush' as const,
      timestamp: Date.now(),
      size: 6 // 固定画笔大小
    };
    const newStrokes = [...allStrokes, newStroke];
    setAllStrokes(newStrokes);
    saveStrokeToHistory(newStrokes);
  };

  // 橡皮擦绘制事件处理函数（按照画笔方式实现，但绘制白色）
  const handleEraserStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== 'eraser') return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    setIsErasing(true);
    setCurrentEraserStroke([{ x, y }]);
  };
  
  const handleEraserMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isErasing || selectedTool !== 'eraser') return;
    
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    setCurrentEraserStroke(prev => [...prev, { x, y }]);
  };
  
  const handleEraserEnd = () => {
    if (!isErasing || selectedTool !== 'eraser') return;
    
    if (currentEraserStroke.length > 0) {
      const newStroke = {
        id: `eraser_stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        points: [...currentEraserStroke],
        type: 'eraser' as const,
        timestamp: Date.now(),
        size: 6 // eraserSize
      };
      const newStrokes = [...allStrokes, newStroke];
      setAllStrokes(newStrokes);
      saveStrokeToHistory(newStrokes);
    }
    
    setIsErasing(false);
    setCurrentEraserStroke([]);
  };
  
  const handleEraserClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== 'eraser') return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
    
    // 创建一个白色点（小圆圈）
    const newStroke = {
      id: `eraser_dot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: [{ x, y }],
      type: 'eraser' as const,
      timestamp: Date.now(),
      size: 6 // 固定橡皮擦大小
    };
    const newStrokes = [...allStrokes, newStroke];
    setAllStrokes(newStrokes);
    saveStrokeToHistory(newStrokes);
  };



  // 键盘事件处理
  const handleKeyDown = (event: KeyboardEvent) => {
    // 添加基础键盘事件调试日志
    if (isDev) console.log('🎹 [键盘事件] 按键触发', {
      按键: event.key,
      当前工具: selectedTool,
      是否正在绘制区域: isDrawingArea,
      区域点数: currentAreaPoints.length,
      是否正在完成区域: isCompletingArea,
      时间戳: new Date().toISOString()
    });
    
    // 处理ESC键
    if (event.key === 'Escape') {
      // 阻止默认的ESC键行为（防止关闭抽屉）
      event.preventDefault();
      event.stopPropagation();
      
      // 如果在地图编辑模式下且为编辑模式
      if (addMapFileDrawerVisible && currentMode === 'edit') {
        // 如果正在绘制区域，完成或取消区域绘制
        if (isDrawingArea) {

          
          // 如果有足够的点（至少2个），创建区域
          if (currentAreaPoints.length >= 2) {

            

            
            // 设置正在完成区域标志，防止工具切换时重置状态
            setIsCompletingArea(true);
            
    
            
            const newArea: MapArea = {
              id: `area_${Date.now()}`,
              name: `a${mapAreas.length + 1}`,
              points: [...currentAreaPoints],
              type: currentAreaType,
              speed: currentAreaType === '调速区域' ? 0.8 : undefined,
              color: getAreaColors({ type: currentAreaType, speed: currentAreaType === '调速区域' ? 0.8 : undefined } as MapArea).strokeColor,
              fillOpacity: 0.3,
              fillColor: getAreaColors({ type: currentAreaType, speed: currentAreaType === '调速区域' ? 0.8 : undefined } as MapArea).fillColor,
              strokeColor: getAreaColors({ type: currentAreaType, speed: currentAreaType === '调速区域' ? 0.8 : undefined } as MapArea).strokeColor,
              opacity: 0.3
            };
            

            
            // 立即更新所有状态
            setMapAreas(prev => {
              const newAreas = [...prev, newArea];

              return newAreas;
            });
            
    
            setIsDrawingArea(false);
    
            
            setCurrentAreaPoints([]);
    
            
            setMousePosition(null);
    
            
            // 添加到历史记录
    
            saveToHistory();
    
            
            message.success(`区域 "${newArea.name}" 创建成功`);
            
            // 延迟切换工具和重置完成标志，确保状态更新完成

            setTimeout(() => {

              

              setSelectedTool('select');

              

              setIsCompletingArea(false);

              

            }, 10); // 增加延迟时间到10ms
          } else {

            
            // 点数不够，直接取消绘制
            setIsDrawingArea(false);
            setCurrentAreaPoints([]);
            setMousePosition(null);
            setSelectedTool('select');
            

            
            message.info('已取消区域绘制');
          }
          return;
        }
        // 如果正在连线模式，退出连线模式
        if (isConnecting || continuousConnecting) {
          exitConnectingMode();
        }
        // 切换到选择工具
        if (isDev) console.log('⌨️ [工具切换] 检测到ESC键，切换到选择工具');
        setSelectedTool('select');
      }
      return;
    }
    
    // 处理Enter键
    if (event.key === 'Enter') {
      // 如果在地图编辑模式下且为编辑模式且正在绘制区域
      if (addMapFileDrawerVisible && currentMode === 'edit' && isDrawingArea && currentAreaPoints.length >= 3) {
        event.preventDefault();
        if (isDev) console.log('⌨️ [区域绘制] 检测到Enter键，完成区域绘制');
        
        // 完成区域绘制
         const newArea: MapArea = {
           id: `area_${Date.now()}`,
           name: `a${mapAreas.length + 1}`,
           type: currentAreaType,
           points: [...currentAreaPoints],
           color: getAreaColors({ type: currentAreaType, speed: currentAreaType === '调速区域' ? 50 : undefined } as MapArea).strokeColor,
           fillOpacity: 0.3,
           fillColor: getAreaColors({ type: currentAreaType, speed: currentAreaType === '调速区域' ? 50 : undefined } as MapArea).fillColor,
           strokeColor: getAreaColors({ type: currentAreaType, speed: currentAreaType === '调速区域' ? 50 : undefined } as MapArea).strokeColor,
           opacity: 0.3,
           speed: currentAreaType === '调速区域' ? 50 : undefined
         };
         
         setMapAreas(prev => [...prev, newArea]);
         setIsDrawingArea(false);
         setCurrentAreaPoints([]);
         setSelectedTool('select');
         
         // 添加到历史记录
         saveToHistory();
         
         message.success(`区域 "${newArea.name}" 创建成功`);
      }
      return;
    }
    
    // 处理撤销重做快捷键 (Ctrl+Z/Cmd+Z 撤销, Ctrl+Y/Cmd+Y 重做)
    // Mac系统使用metaKey (Command键)，Windows/Linux使用ctrlKey
    if (addMapFileDrawerVisible && currentMode === 'edit' && (event.ctrlKey || event.metaKey)) {
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        // 在黑白底图模式下使用画笔撤销重做功能
        if (mapType === 'grayscale') {
          undoStroke();
        } else {
          handleUndo();
        }
        return;
      }
      if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault();
        // 在黑白底图模式下使用画笔撤销重做功能
        if (mapType === 'grayscale') {
          redoStroke();
        } else {
          handleRedo();
        }
        return;
      }
      
      // 处理复制粘贴快捷键 (Ctrl+C/Cmd+C 复制, Ctrl+V/Cmd+V 粘贴)
      if (event.key === 'c' || event.key === 'C') {
        // 检查当前焦点是否在输入框或其他表单元素上
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox'
        );
        
        // 如果焦点在输入框上，不拦截键盘事件，让输入框正常处理
        if (!isInputFocused) {
          event.preventDefault();
          handleCopyElements();
        }
        return;
      }
      
      if (event.key === 'v' || event.key === 'V') {
        // 检查当前焦点是否在输入框或其他表单元素上
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox'
        );
        
        // 如果焦点在输入框上，不拦截键盘事件，让输入框正常处理
        if (!isInputFocused) {
          event.preventDefault();
          handlePasteElements();
        }
        return;
      }
    }
    
    // 处理空格键拖动 - 移除addMapFileDrawerVisible限制，允许在任何时候使用空格键
    if (event.code === 'Space' && !isSpacePressed) {
      event.preventDefault();
      setIsSpacePressed(true);

      if (isDev) console.log('🚀 [空格键拖动] 空格键按下，启用拖动模式');
      return;
    }
    
    // 只在地图编辑模式下且为编辑模式且选择工具激活时处理键盘事件
    if (addMapFileDrawerVisible && currentMode === 'edit' && selectedTool === 'select') {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 检查当前焦点是否在输入框或其他表单元素上
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true' ||
          activeElement.getAttribute('role') === 'textbox'
        );
        
        // 如果焦点在输入框上，不拦截键盘事件，让输入框正常处理
        if (isInputFocused) {
          return;
        }
        
        event.preventDefault();
        // 优先删除选中的点，然后是线，最后是区域
        if (selectedPoints.length > 0) {
          handleDeleteSelectedPoints();
        } else if (selectedLines.length > 0) {
          handleDeleteSelectedLines();
        } else if (selectedAreas.length > 0) {
          handleDeleteSelectedAreas();
        }
      }
    }
    
    // 处理方向键移动选中元素（包括选中的顶点）
    if (addMapFileDrawerVisible && currentMode === 'edit' && selectedTool === 'select' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      // 检查是否有任何选中的元素（点、线、区域或顶点）
      if (selectedPoints.length > 0 || selectedLines.length > 0 || selectedAreas.length > 0 || selectedVertices.length > 0) {
        event.preventDefault();
        handleArrowKeyMove(event.key);
      }
    }
    
    // 处理绘图工具快捷键
    if (addMapFileDrawerVisible && currentMode === 'edit') {
      // 检查当前焦点是否在输入框或其他表单元素上
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );
      
      // 如果焦点在输入框上，不处理工具快捷键
      if (!isInputFocused) {
        switch (event.key.toLowerCase()) {
          case 'v':
            event.preventDefault();
            if (isDev) console.log('⌨️ [工具切换] 快捷键V - 切换到选择工具');
            setSelectedTool('select');
            break;
          case 'p':
            // 在黑白底图模式下屏蔽绘制节点工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] P键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键P - 切换到绘制节点工具');
              setSelectedTool('point');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] P键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 't':
            // 在黑白底图模式下屏蔽绘制站点工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] T键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键T - 切换到绘制站点工具');
              setSelectedTool('station');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] T键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'd':
            // 在黑白底图模式下屏蔽双向直线工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] D键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键D - 切换到双向直线工具');
              setSelectedTool('double-line');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] D键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 's':
            // 在黑白底图模式下屏蔽单向直线工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] S键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键S - 切换到单向直线工具');
              setSelectedTool('single-line');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] S键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'a':
            // 在黑白底图模式下屏蔽绘制调速区域工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] A键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键A - 切换到绘制调速区域工具');
              setSelectedTool('area');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] A键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'b':
            if (isGrayscaleMode()) {
              // 在黑白底图模式下，B键切换到画笔工具
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键B - 切换到画笔工具');
              setSelectedTool('brush');
            } else {
              // 在拓扑地图模式下，B键切换到双向贝塞尔曲线工具
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键B - 切换到双向贝塞尔曲线工具');
              setSelectedTool('double-bezier');
            }
            break;
          case 'c':
            // 在黑白底图模式下屏蔽单向贝塞尔曲线工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] C键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键C - 切换到单向贝塞尔曲线工具');
              setSelectedTool('single-bezier');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] C键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'k':
            // 在黑白底图模式下屏蔽绘制停靠点工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] K键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键K - 切换到绘制停靠点工具');
              setSelectedTool('dock');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] K键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'h':
            // 在黑白底图模式下屏蔽绘制充电点工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] H键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键H - 切换到绘制充电点工具');
              setSelectedTool('charge');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] H键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'm':
            // 在黑白底图模式下屏蔽绘制临停点工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] M键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              当前工具: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键M - 切换到绘制临停点工具');
              setSelectedTool('temp');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] M键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
          case 'e':
            // 在黑白底图模式下，E键切换到橡皮擦工具
            if (isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键E - 切换到橡皮擦工具');
              setSelectedTool('eraser');
            }
            break;
          case 'f':
            // 在黑白底图模式下屏蔽绘制禁行区域工具的快捷键
            if (isDev) console.log('🔍 [快捷键调试] F键按下', {
              mapType: mapType,
              isGrayscaleMode: isGrayscaleMode(),
              currentTool: selectedTool
            });
            if (!isGrayscaleMode()) {
              event.preventDefault();
              if (isDev) console.log('⌨️ [工具切换] 快捷键F - 切换到绘制禁行区域工具');
              handleToolSelect('forbidden-area');
            } else {
              if (isDev) console.log('🚫 [快捷键屏蔽] F键在黑白底图模式下被屏蔽');
              event.preventDefault(); // 阻止默认行为但不切换工具
            }
            break;
        }
      }
    }
  };
  
  // 处理键盘释放事件
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space' && isSpacePressed) {
      event.preventDefault();
      setIsSpacePressed(false);
      setIsCanvasClicked(false); // 重置画布点击状态，需要重新点击画布才能使用双指缩放

      if (isDev) console.log('🛑 [空格键拖动] 空格键释放，禁用拖动模式和双指缩放');
    }
  };

  // 添加键盘事件监听器
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [addMapFileDrawerVisible, selectedTool, selectedPoints, selectedLines, selectedAreas, selectedVertices, isSpacePressed, isConnecting, continuousConnecting, historyIndex, history.length, isDrawingArea, currentAreaPoints, isCompletingArea]);

  // 初始化PNG Canvas用于像素级擦除
  useEffect(() => {
    if (mapFileUploadedImage && pngCanvasRef.current) {
      const canvas = pngCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 设置Canvas尺寸与图片一致
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制图片到Canvas
        ctx.drawImage(img, 0, 0);
        
        // 应用已擦除的像素（绘制白色圆形）
        ctx.fillStyle = '#FFFFFF';
        // erasedPixels.forEach(pixel => {
        //   ctx.beginPath();
        //   ctx.arc(pixel.x, pixel.y, 10, 0, 2 * Math.PI);
        //   ctx.fill();
        // });
      };
      img.src = mapFileUploadedImage.url;
    }
  }, [mapFileUploadedImage]);
  
  // 测试代码已删除 - 不再自动添加测试点
  
  // 获取点类型对应的颜色
  const getPointColor = (type: string) => {
    const colorMap: Record<string, string> = {
      '节点': '#1890ff',      // 蓝色
      '站点': '#1890ff',      // 蓝色（与连线颜色一致）
      '充电点': '#52c41a',    // 绿色
      '停靠点': '#faad14',    // 橙色
      '临停点': '#ff7875',    // 红色（带方向）
      '归位点': '#9254de',    // 紫色（带方向）
      '电梯点': '#13c2c2',    // 青色
      '自动门': '#722ed1',    // 深紫色
      '切换点': '#d4b106',    // 金黄色
      '其他': '#8c8c8c'       // 灰色
    };
    return colorMap[type] || '#8c8c8c';
  };

  // 判断是否需要显示车体模型的点位类型
  const shouldShowVehicleModel = (type: string) => {
    const vehicleModelTypes = ['站点', '停靠点', '充电点', '临停点', '电梯点', '自动门', '归位点'];
    return vehicleModelTypes.includes(type);
  };

  // 渲染车体模型组件
  const renderVehicleModel = (point: any, canvasCoords: { x: number, y: number }) => {
    if (hideVehicleModels || !shouldShowVehicleModel(point.type)) {
      return null;
    }

    const vehicleWidth = 20;  // 车体宽度
    const vehicleHeight = 40; // 车体高度
    const borderRadius = 4;   // 圆角半径
    
    // 获取点位对应的颜色
    const pointColor = getPointColor(point.type);
    
    // 将十六进制颜色转换为rgba格式，用于半透明背景
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
      <div
        key={`vehicle-${point.id}`}
        style={{
          position: 'absolute',
          left: canvasCoords.x - vehicleWidth / 2,
          top: canvasCoords.y - vehicleHeight / 2,
          width: `${vehicleWidth}px`,
          height: `${vehicleHeight}px`,
          backgroundColor: hexToRgba(pointColor, 0.1), // 使用点位颜色的半透明背景
          border: `2px solid ${pointColor}`, // 使用点位颜色的边框
          borderRadius: `${borderRadius}px`,
          zIndex: 999, // 确保在点位下方
          transform: `rotate(${(point.direction || 0)}deg)`,
          transformOrigin: 'center',
          transition: 'all 0.2s ease',
          pointerEvents: 'none', // 不阻挡点位的交互
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' // 轻微阴影
        }}
      >
        {/* 车体前端指示器 */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '50%',
            width: '6px',
            height: '6px',
            backgroundColor: pointColor, // 使用点位颜色
            borderRadius: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    );
  };

  // 获取更深的颜色用于描边
  // 颜色加深函数 - 已移除未使用的函数
  
  // 获取鼠标样式
  const getCanvasCursor = () => {
    if (selectedTool === 'point') {
      return 'crosshair';
    } else if (selectedTool === 'select') {
      return 'default';
    } else if (['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(selectedTool)) {
      return 'default'; // 连线工具默认为普通光标，在点上时会变为十字架
    }
    return 'default';
  };
  
  // 获取点的鼠标样式
  const getPointCursor = () => {
    if (selectedTool === 'select') {
      return 'pointer';
    } else if (['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(selectedTool)) {
      return 'crosshair'; // 连线工具在点上显示十字架
    }
    return 'default';
  };

  // 渲染连线的SVG路径
  // 绘制箭头的辅助函数
  const renderArrow = (x: number, y: number, angle: number, color: string, key?: string) => {
    if (isDev) console.log('🏹 renderArrow called:', { x, y, angle, color, key });
    const arrowSize = 7; // 箭头尺寸（缩小）
    const offset = 8; // 增加箭头向后偏移距离，让尖端更明显地显示在目标点前方
    
    // 计算箭头的实际位置（向后偏移）
    const arrowX = x - offset * Math.cos(angle);
    const arrowY = y - offset * Math.sin(angle);
    
    // 计算箭头的两个底边点
    const x1 = arrowX - arrowSize * Math.cos(angle - Math.PI / 6);
    const y1 = arrowY - arrowSize * Math.sin(angle - Math.PI / 6);
    const x2 = arrowX - arrowSize * Math.cos(angle + Math.PI / 6);
    const y2 = arrowY - arrowSize * Math.sin(angle + Math.PI / 6);
    
    if (isDev) console.log('🏹 Arrow points:', { originalX: x, originalY: y, arrowX, arrowY, x1, y1, x2, y2 });
    
    return (
      <polygon
        key={key || `arrow-${x}-${y}-${angle}`}
        points={`${arrowX},${arrowY} ${x1},${y1} ${x2},${y2}`}
        fill={color}
        stroke={color}
        strokeWidth="1"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  // 渲染贝塞尔曲线控制手柄
  const renderControlHandles = (line: MapLine, cp1: {x: number, y: number}, cp2?: {x: number, y: number}) => {
    const handleSize = 6;
    const lineColor = '#1890ff';
    
    return (
      <g key={`control-handles-${line.id}`}>
        {/* 控制点1的连接线和手柄 */}
        <line
          x1={line.startPointId ? getPointById(line.startPointId)?.x : 0}
          y1={line.startPointId ? getPointById(line.startPointId)?.y : 0}
          x2={cp1.x}
          y2={cp1.y}
          stroke={lineColor}
          strokeWidth="1"
          strokeDasharray="5,5"
          style={{ pointerEvents: 'none' }}
        />
        <line
          x1={line.endPointId ? getPointById(line.endPointId)?.x : 0}
          y1={line.endPointId ? getPointById(line.endPointId)?.y : 0}
          x2={cp1.x}
          y2={cp1.y}
          stroke={lineColor}
          strokeWidth="1"
          strokeDasharray="5,5"
          style={{ pointerEvents: 'none' }}
        />
        <circle
          cx={cp1.x}
          cy={cp1.y}
          r={handleSize}
          fill={selectedControlHandle?.lineId === line.id && selectedControlHandle?.handleType === 'cp1' ? '#ff4d4f' : '#1890ff'}
          stroke="#fff"
          strokeWidth="2"
          style={{ cursor: 'pointer' }}
          onMouseDown={(e) => handleControlHandleMouseDown(e, line.id, 'cp1')}
        />
        
        {/* 控制点2的连接线和手柄（仅双贝塞尔曲线） */}
        {cp2 && (
          <>
            <line
              x1={line.startPointId ? getPointById(line.startPointId)?.x : 0}
              y1={line.startPointId ? getPointById(line.startPointId)?.y : 0}
              x2={cp2.x}
              y2={cp2.y}
              stroke={lineColor}
              strokeWidth="1"
              strokeDasharray="5,5"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={line.endPointId ? getPointById(line.endPointId)?.x : 0}
              y1={line.endPointId ? getPointById(line.endPointId)?.y : 0}
              x2={cp2.x}
              y2={cp2.y}
              stroke={lineColor}
              strokeWidth="1"
              strokeDasharray="5,5"
              style={{ pointerEvents: 'none' }}
            />
            <circle
              cx={cp2.x}
              cy={cp2.y}
              r={handleSize}
              fill={selectedControlHandle?.lineId === line.id && selectedControlHandle?.handleType === 'cp2' ? '#ff4d4f' : '#1890ff'}
              stroke="#fff"
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseDown={(e) => handleControlHandleMouseDown(e, line.id, 'cp2')}
            />
          </>
        )}
      </g>
     );
   };

  const renderLine = (line: MapLine) => {
    // 检查隐藏状态，如果隐藏所有路径则不渲染
    if (hideAllPaths) {
      return null;
    }
    
    if (isDev) console.log('🔗 renderLine called:', line);
    const startPoint = getPointById(line.startPointId);
    const endPoint = getPointById(line.endPointId);
    if (isDev) console.log('🔗 Points found:', { startPoint, endPoint });
    
    if (!startPoint || !endPoint) {
      if (isDev) console.warn('连线渲染失败：找不到起始点或结束点', { line, startPoint, endPoint });
      return null;
    }

    // 直接使用画布坐标，避免双重变换
    const startCoords = { x: startPoint.x, y: startPoint.y };
    const endCoords = { x: endPoint.x, y: endPoint.y };
    
    if (isDev) console.log('🔗 [连线坐标] 详细数据:', {
      '1_起始点画布坐标': `{x: ${startCoords.x.toFixed(2)}, y: ${startCoords.y.toFixed(2)}}`,
      '2_结束点画布坐标': `{x: ${endCoords.x.toFixed(2)}, y: ${endCoords.y.toFixed(2)}}`,
      '3_当前画布状态': {
        canvasScale: canvasScale.toFixed(3),
        canvasOffset: `{x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}`
      }
    });

    const lineColor = line.color || '#1890ff';
    const dx = endCoords.x - startCoords.x;
    const dy = endCoords.y - startCoords.y;
    const angle = Math.atan2(dy, dx);
    
    switch (line.type) {
      case 'double-line': {
        // 双向直线：渲染一条带双向箭头的线
        const isSelected = isLineSelected(line.id);
        const selectedStroke = isSelected ? '#1890ff' : lineColor;
        const selectedStrokeWidth = isSelected ? '4' : '2';
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)}
            onContextMenu={(e) => handleLineContextMenu(e, line.id)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            {/* 双向线 */}
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke={selectedStroke}
              strokeWidth={selectedStrokeWidth}
              style={{ 
                filter: isSelected ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none'
              }}
            />
            {/* 双向箭头：起点和终点都有箭头 */}
            {renderArrow(endCoords.x, endCoords.y, angle, selectedStroke, `${line.id}-end-arrow`)}
            {renderArrow(startCoords.x, startCoords.y, angle + Math.PI, selectedStroke, `${line.id}-start-arrow`)}
          </g>
        );
      }
        
      case 'single-line': {
        // 单向直线，单向箭头指向终点
        const isSelectedSingle = isLineSelected(line.id);
        const selectedStrokeSingle = isSelectedSingle ? '#1890ff' : lineColor;
        const selectedStrokeWidthSingle = isSelectedSingle ? '4' : '2';
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)}
            onContextMenu={(e) => handleLineContextMenu(e, line.id)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke={selectedStrokeSingle}
              strokeWidth={selectedStrokeWidthSingle}
              style={{ filter: isSelectedSingle ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none' }}
            />
            {/* 单向箭头指向终点 */}
            {renderArrow(endCoords.x, endCoords.y, angle, selectedStrokeSingle, `${line.id}-arrow`)}
          </g>
        );
      }
        
      case 'double-bezier': {
        // 双向贝塞尔曲线，使用三次贝塞尔曲线（C命令）实现真正的S形曲线
        const controlOffset = 50 * canvasScale; // 控制点偏移也需要根据缩放调整
        const isSelectedDoubleBezier = isLineSelected(line.id);
        const selectedStrokeDoubleBezier = isSelectedDoubleBezier ? '#1890ff' : lineColor;
        const selectedStrokeWidthDoubleBezier = isSelectedDoubleBezier ? '4' : '2';
        
        // 使用存储的控制点或默认控制点
        // cp1: 起始点的控制点，cp2: 结束点的控制点
        const controlPoint1 = line.controlPoints?.cp1 || { x: startCoords.x + (endCoords.x - startCoords.x) * 0.3, y: startCoords.y - controlOffset };
        const controlPoint2 = line.controlPoints?.cp2 || { x: startCoords.x + (endCoords.x - startCoords.x) * 0.7, y: endCoords.y + controlOffset };
        
        // 计算三次贝塞尔曲线在端点的切线角度
        // 起始点切线角度：从起始点指向第一个控制点
        const startTangentAngleDouble = Math.atan2(controlPoint1.y - startCoords.y, controlPoint1.x - startCoords.x);
        // 结束点切线角度：从第二个控制点指向结束点
        const endTangentAngleDouble = Math.atan2(endCoords.y - controlPoint2.y, endCoords.x - controlPoint2.x);
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)}
            onContextMenu={(e) => handleLineContextMenu(e, line.id)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            {/* 使用三次贝塞尔曲线（C命令）绘制单条曲线 */}
            <path
              d={`M ${startCoords.x} ${startCoords.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${endCoords.x} ${endCoords.y}`}
              stroke={selectedStrokeDoubleBezier}
              strokeWidth={selectedStrokeWidthDoubleBezier}
              fill="none"
              style={{ filter: isSelectedDoubleBezier ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none' }}
            />
            {/* 控制手柄 - 仅在选中时显示 */}
            {isSelectedDoubleBezier && renderControlHandles(line, controlPoint1, controlPoint2)}
            {/* 双向箭头 - 使用曲线切线角度 */}
            {renderArrow(startCoords.x, startCoords.y, startTangentAngleDouble + Math.PI, selectedStrokeDoubleBezier, `${line.id}-start-arrow`)}
            {renderArrow(endCoords.x, endCoords.y, endTangentAngleDouble, selectedStrokeDoubleBezier, `${line.id}-end-arrow`)}
          </g>
        );
      }
        
      case 'single-bezier': {
        // 单向贝塞尔曲线，使用三次贝塞尔曲线（C命令）支持两个控制点绘制S形
        const controlOffset_single = 50 * canvasScale; // 控制点偏移也需要根据缩放调整
        const isSelectedSingleBezier = isLineSelected(line.id);
        const selectedStrokeSingleBezier = isSelectedSingleBezier ? '#1890ff' : lineColor;
        const selectedStrokeWidthSingleBezier = isSelectedSingleBezier ? '4' : '2';
        
        // 使用存储的控制点或默认控制点
        // cp1: 起始点的控制点，cp2: 结束点的控制点
        const controlPoint1_single = line.controlPoints?.cp1 || { x: startCoords.x + (endCoords.x - startCoords.x) * 0.3, y: startCoords.y - controlOffset_single };
        const controlPoint2_single = line.controlPoints?.cp2 || { x: startCoords.x + (endCoords.x - startCoords.x) * 0.7, y: endCoords.y + controlOffset_single };
        
        // 计算三次贝塞尔曲线在终点处的切线角度
        // 结束点切线角度：从第二个控制点指向结束点
        const endTangentAngleSingle = Math.atan2(endCoords.y - controlPoint2_single.y, endCoords.x - controlPoint2_single.x);
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)}
            onContextMenu={(e) => handleLineContextMenu(e, line.id)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            {/* 使用三次贝塞尔曲线（C命令）绘制单条曲线 */}
            <path
              d={`M ${startCoords.x} ${startCoords.y} C ${controlPoint1_single.x} ${controlPoint1_single.y} ${controlPoint2_single.x} ${controlPoint2_single.y} ${endCoords.x} ${endCoords.y}`}
              stroke={selectedStrokeSingleBezier}
              strokeWidth={selectedStrokeWidthSingleBezier}
              fill="none"
              style={{ filter: isSelectedSingleBezier ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none' }}
            />
            {/* 控制手柄 - 仅在选中时显示，支持两个控制点 */}
            {isSelectedSingleBezier && renderControlHandles(line, controlPoint1_single, controlPoint2_single)}
            {/* 单向箭头指向终点 - 使用曲线切线角度 */}
            {renderArrow(endCoords.x, endCoords.y, endTangentAngleSingle, selectedStrokeSingleBezier, `${line.id}-arrow`)}
          </g>
        );
      }
        
      default:
        return null;
    }
  };
  
  // 线双击事件处理
  const handleLineDoubleClick = (line: MapLine) => {
    if (selectedTool !== 'select') {
      return;
    }
    
    // 如果是双向直线，直接编辑
    if (line.type === 'double-line') {
      setEditingLine(line);
      lineEditForm.setFieldsValue({
        name: line.name,
        type: line.type, // 使用实际的路径类型值
        // 新增的12个字段
        weight: line.weight,
        vehicleExpansionSize: line.vehicleExpansionSize,
        isDisabled: line.isDisabled || false,
        isReverse: line.isReverse || false,
        drivingAngle: line.drivingAngle,
        maxLinearVelocity: line.maxLinearVelocity,
        maxLinearAcceleration: line.maxLinearAcceleration,
        maxLinearDeceleration: line.maxLinearDeceleration,
        maxAngularVelocity: line.maxAngularVelocity,
        maxAngularAcceleration: line.maxAngularAcceleration,
        arrivalDistancePrecision: line.arrivalDistancePrecision,
        arrivalAnglePrecision: line.arrivalAnglePrecision,
      });
    } else if (line.type === 'single-line') {
      // 单向直线：检查是否有重叠的其他单向线
      const overlappingLines = mapLines.filter(l => 
        l.id !== line.id && 
        l.type === 'single-line' &&
        ((l.startPointId === line.startPointId && l.endPointId === line.endPointId) ||
         (l.startPointId === line.endPointId && l.endPointId === line.startPointId))
      );
      
      if (overlappingLines.length > 0) {
        // 有重叠线，实现切换功能
        const allOverlappingLines = [line, ...overlappingLines];
        const lineIds = allOverlappingLines.map(l => l.id).sort();
        const pairKey = lineIds.join('_');
        const currentCount = doubleLineClickCount[pairKey] || 0;
        const newCount = currentCount + 1;
        
        // 更新双击计数
        setDoubleLineClickCount(prev => ({
          ...prev,
          [pairKey]: newCount
        }));
        
        // 根据双击次数选择要编辑的线
        const targetLineIndex = (newCount - 1) % allOverlappingLines.length;
        const targetLine = allOverlappingLines[targetLineIndex];
        
        setEditingLine(targetLine);
        
        // 设置表单，显示当前编辑的是第几条线
        const lineNumber = targetLineIndex + 1;
        const totalLines = allOverlappingLines.length;
        
        lineEditForm.setFieldsValue({
          name: targetLine.name,
          type: targetLine.type, // 使用实际的路径类型值
          direction: `第${lineNumber}条线（共${totalLines}条重叠线）`,
          // 新增的12个字段
          weight: targetLine.weight,
          vehicleExpansionSize: targetLine.vehicleExpansionSize,
          isDisabled: targetLine.isDisabled || false,
          isReverse: targetLine.isReverse || false,
          drivingAngle: targetLine.drivingAngle,
          maxLinearVelocity: targetLine.maxLinearVelocity,
          maxLinearAcceleration: targetLine.maxLinearAcceleration,
          maxLinearDeceleration: targetLine.maxLinearDeceleration,
          maxAngularVelocity: targetLine.maxAngularVelocity,
          maxAngularAcceleration: targetLine.maxAngularAcceleration,
          arrivalDistancePrecision: targetLine.arrivalDistancePrecision,
          arrivalAnglePrecision: targetLine.arrivalAnglePrecision,
        });
        
        message.info(`正在编辑第${lineNumber}条重叠线（共${totalLines}条）`);
      } else {
        // 没有重叠线，正常编辑
        setEditingLine(line);
        lineEditForm.setFieldsValue({
          name: line.name,
          type: line.type, // 使用实际的路径类型值
          // 新增的12个字段
          weight: line.weight,
          vehicleExpansionSize: line.vehicleExpansionSize,
          isDisabled: line.isDisabled || false,
          isReverse: line.isReverse || false,
          drivingAngle: line.drivingAngle,
          maxLinearVelocity: line.maxLinearVelocity,
          maxLinearAcceleration: line.maxLinearAcceleration,
          maxLinearDeceleration: line.maxLinearDeceleration,
          maxAngularVelocity: line.maxAngularVelocity,
          maxAngularAcceleration: line.maxAngularAcceleration,
          arrivalDistancePrecision: line.arrivalDistancePrecision,
          arrivalAnglePrecision: line.arrivalAnglePrecision,
        });
      }
    } else {
       // 贝塞尔曲线的原有逻辑
       setEditingLine(line);
       lineEditForm.setFieldsValue({
           name: line.name,
           type: line.type, // 使用实际的路径类型值
           // 新增的12个字段
           weight: line.weight,
           vehicleExpansionSize: line.vehicleExpansionSize,
           isDisabled: line.isDisabled || false,
           isReverse: line.isReverse || false,
           drivingAngle: line.drivingAngle,
           maxLinearVelocity: line.maxLinearVelocity,
           maxLinearAcceleration: line.maxLinearAcceleration,
           maxLinearDeceleration: line.maxLinearDeceleration,
           maxAngularVelocity: line.maxAngularVelocity,
           maxAngularAcceleration: line.maxAngularAcceleration,
           arrivalDistancePrecision: line.arrivalDistancePrecision,
           arrivalAnglePrecision: line.arrivalAnglePrecision,
         });
     }
    
    setLineEditModalVisible(true);
  };

  // 保存线编辑
  const handleSaveLineEdit = async (values: any) => {
    if (!editingLine) return;
    
    try {
      // 更新线数据，包含所有新增的12个字段
      setMapLines(prev => prev.map(line => 
        line.id === editingLine.id ? {
          ...line,
          name: values.name,
          type: values.type, // 直接使用选择的路径类型值
          // 新增的12个字段
          weight: values.weight ? Number(values.weight) : undefined,
          vehicleExpansionSize: values.vehicleExpansionSize ? Number(values.vehicleExpansionSize) : undefined,
          isDisabled: values.isDisabled || false, // 默认启用
          isReverse: values.isReverse || false,
          drivingAngle: values.drivingAngle ? Number(values.drivingAngle) : undefined,
          maxLinearVelocity: values.maxLinearVelocity ? Number(values.maxLinearVelocity) : undefined,
          maxLinearAcceleration: values.maxLinearAcceleration ? Number(values.maxLinearAcceleration) : undefined,
          maxLinearDeceleration: values.maxLinearDeceleration ? Number(values.maxLinearDeceleration) : undefined,
          maxAngularVelocity: values.maxAngularVelocity ? Number(values.maxAngularVelocity) : undefined,
          maxAngularAcceleration: values.maxAngularAcceleration ? Number(values.maxAngularAcceleration) : undefined,
          arrivalDistancePrecision: values.arrivalDistancePrecision ? Number(values.arrivalDistancePrecision) : undefined,
          arrivalAnglePrecision: values.arrivalAnglePrecision ? Number(values.arrivalAnglePrecision) : undefined,
        } : line
      ));
      
      message.success('路径属性保存成功');
      setLineEditModalVisible(false);
      setEditingLine(null);
      lineEditForm.resetFields();
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 检查点是否被选中
  const isPointSelected = (pointId: string) => {
    return selectedPoints.includes(pointId);
  };

  // 判断线是否被选中
  const isLineSelected = (lineId: string) => {
    return selectedLines.includes(lineId);
  };

  // 处理线的点击事件
  const handleLineClick = (event: React.MouseEvent, lineId: string) => {
    const clickedLine = mapLines.find(l => l.id === lineId);
    
    // 详细的事件调试信息    // 检查是否找到了对应的线
    if (!clickedLine) {
      if (isDev) console.error('❌ [线点击埋点] 未找到对应的线数据', { lineId, availableLines: mapLines.map(l => l.id) });
      return;
    }
    
    // 记录鼠标点击位置到lastClickPosition
    const canvasElement = event.currentTarget.closest('.map-canvas') as HTMLDivElement;
    if (canvasElement) {
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      setLastClickPosition({ x, y });
      if (isDev) console.log('📍 [线点击] 记录鼠标位置到lastClickPosition:', { x: x.toFixed(2), y: y.toFixed(2) });
    }
    
    event.stopPropagation();
    
    if (selectedTool === 'select') {
      // Shift + 点击：在线上插入节点
      if (event.shiftKey) {
        // 获取点击位置的画布坐标
        if (!canvasRef.current) {
          if (isDev) console.error('❌ [插入节点] 未找到画布元素');
          return;
        }
        
        const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasRef.current);
        
        // 获取线的起点和终点
        const startPoint = mapPoints.find(p => p.id === clickedLine.startPointId);
        const endPoint = mapPoints.find(p => p.id === clickedLine.endPointId);
        
        if (!startPoint || !endPoint) {
          if (isDev) console.error('❌ [插入节点] 未找到线的起点或终点', { startPointId: clickedLine.startPointId, endPointId: clickedLine.endPointId });
          return;
        }
        
        // 创建新节点
        const newPointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPoint = {
          id: newPointId,
          name: `P${pointCounter}`,
          x: x,
          y: y,
          type: '节点' as const,
          description: '插入的节点',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          updateUser: '当前用户',
          isDisabled: false, // 默认启用
          noUturn: false // 默认不禁止掉头
        };
        
        // 创建两条新线段
        const newLine1Id = `line_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`;
        const newLine2Id = `line_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`;
        
        const newLine1: MapLine = {
          id: newLine1Id,
          name: `${clickedLine.name}_1`,
          startPointId: clickedLine.startPointId,
          endPointId: newPointId,
          type: clickedLine.type,
          color: clickedLine.color,
          width: clickedLine.width,
          controlPoints: clickedLine.controlPoints ? {
            cp1: clickedLine.controlPoints.cp1,
            cp2: { x: (clickedLine.controlPoints.cp1!.x + x) / 2, y: (clickedLine.controlPoints.cp1!.y + y) / 2 }
          } : undefined
        };
        
        const newLine2: MapLine = {
          id: newLine2Id,
          name: `${clickedLine.name}_2`,
          startPointId: newPointId,
          endPointId: clickedLine.endPointId,
          type: clickedLine.type,
          color: clickedLine.color,
          width: clickedLine.width,
          controlPoints: clickedLine.controlPoints ? {
            cp1: { x: (x + clickedLine.controlPoints.cp2!.x) / 2, y: (y + clickedLine.controlPoints.cp2!.y) / 2 },
            cp2: clickedLine.controlPoints.cp2
          } : undefined
        };
        
        // 更新状态
        setMapPoints(prev => [...prev, newPoint]);
        setMapLines(prev => {
          // 移除原线，添加两条新线
          const filteredLines = prev.filter(line => line.id !== lineId);
          return [...filteredLines, newLine1, newLine2];
        });
        
        // 更新计数器
        setPointCounter(prev => prev + 1);
        
        // 选中新创建的节点
        setSelectedPoints([newPointId]);
        setSelectedLines([]);
        
        if (isDev) console.log('✅ [插入节点] 成功在线上插入节点', {
          originalLine: clickedLine.name,
          newPoint: newPoint.name,
          newLine1: newLine1.name,
          newLine2: newLine2.name,
          insertPosition: { x, y }
        });
        
        return;
      }
      
      let newSelectedLines: string[];
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + 点击：多选
        const wasSelected = selectedLines.includes(lineId);
        newSelectedLines = wasSelected
          ? selectedLines.filter(id => id !== lineId)
          : [...selectedLines, lineId];
      } else {
        // 普通点击：单选
        newSelectedLines = [lineId];
      }
      
      setSelectedLines(newSelectedLines);
      
      // 清除点的选中状态（线和点不能同时选中）
      if (selectedPoints.length > 0) {
        setSelectedPoints([]);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    }
  };
  
  // 获取框选区域样式
  const getSelectionBoxStyle = () => {
    // 如果有选中的点但没有框选坐标，动态计算框选区域
    if ((!selectionStart || !selectionEnd) && selectedPoints.length > 0) {
      const selectedPointsData = mapPoints.filter(point => selectedPoints.includes(point.id));
      if (selectedPointsData.length > 0) {
        // 考虑点的实际大小（半径8px）和选中时的缩放（1.2倍）
        const pointRadius = 8 * 1.2;
        const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
        const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
        const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
        const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
        
        // 添加少量边距让框选框紧贴圆圈边缘
        const padding = 3;
        const dynamicStart = { x: pointMinX - padding, y: pointMinY - padding };
        const dynamicEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
        
        const minX = Math.min(dynamicStart.x, dynamicEnd.x);
        const minY = Math.min(dynamicStart.y, dynamicEnd.y);
        const width = Math.abs(dynamicEnd.x - dynamicStart.x);
        const height = Math.abs(dynamicEnd.y - dynamicStart.y);
        
        // 🔧 关键修复：选中框位于transform容器内，直接使用画布坐标，不需要转换为屏幕坐标
        // 因为选中框的父容器已经有了transform变换，所以直接使用画布坐标即可
        
        const style = {
          position: 'absolute' as const,
          left: minX,
          top: minY,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          border: '2px dashed #1890ff',
          background: 'rgba(24, 144, 255, 0.1)',
          pointerEvents: 'auto' as const,  // 允许交互
          zIndex: 5,
          boxSizing: 'border-box' as const,
          cursor: 'move'  // 显示移动光标
        };
        return style;
      }
    }
    
    // 隐藏框选框的条件：没有框选区域坐标且没有选中点，或者既不在选择中也没有选中点
    if ((!selectionStart || !selectionEnd) && selectedPoints.length === 0) {
      return { display: 'none' };
    }
    
    // 如果没有坐标但在选择中，也隐藏（避免显示错误的框选框）
    if ((!selectionStart || !selectionEnd) && isSelecting) {
      return { display: 'none' };
    }
    
    // 确保selectionStart和selectionEnd不为null
    if (!selectionStart || !selectionEnd) {
      return { display: 'none' };
    }
    
    // 🔧 关键修复：框选框在transform容器内，直接使用画布坐标，不需要转换为屏幕坐标
    // 因为框选框的父容器已经有了transform变换，所以直接使用画布坐标即可
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    const finalWidth = Math.max(width, 1); // 确保最小尺寸
    const finalHeight = Math.max(height, 1);
    

    
    const style = {
      position: 'absolute' as const,
      left: minX,
      top: minY,
      width: finalWidth,
      height: finalHeight,
      border: isDraggingSelection ? '3px solid #1890ff' : '2px dashed #1890ff',  // 拖拽时实线边框更粗
      background: isDraggingSelection ? 'rgba(24, 144, 255, 0.2)' : 'rgba(24, 144, 255, 0.1)',  // 拖拽时背景更明显
      pointerEvents: (selectedPoints.length > 0 ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],  // 有选中点时允许交互
      zIndex: isDraggingSelection ? 10000 : 5000,  // 拖拽时提高层级，确保在所有元素之上
      boxSizing: 'border-box' as const,
      cursor: selectedPoints.length > 0 ? 'move' : 'default',  // 有选中点时显示移动光标
      boxShadow: isDraggingSelection ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 'none',  // 拖拽时添加阴影
      transition: isDraggingSelection ? 'none' : 'all 0.2s ease'  // 非拖拽时平滑过渡
    };
    return style;
  };

  // 渲染展开的地图文件内容
  const renderExpandedRow = (record: MapData) => {
    const files = getMapFiles(record.id);
    return (
      <div style={{ padding: '16px 0' }}>
        <Row gutter={[16, 16]}>
          {files.map((file) => (
            <Col xs={12} sm={8} md={6} lg={8} xl={6} key={file.id}>
              <Card
                size="small"
                hoverable
                cover={
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      alt={file.name}
                      src={file.thumbnail}
                      style={{
                        height: 120,
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5',
                        width: '100%',
                        transition: 'all 0.3s ease',
                        border: '1px solid #f0f0f0',
                                     borderRadius: '6px',
                                     boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                      }}
                      onClick={() => handleImageClick(file)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer',
                      }}
                      className="thumbnail-overlay"
                      onClick={() => handleImageClick(file)}
                    >
                      <EyeOutlined
                        style={{
                          fontSize: '24px',
                          color: 'white',
                        }}
                      />
                      <span
                        style={{
                          color: 'white',
                          marginLeft: '8px',
                          fontSize: '14px',
                        }}
                      >
                        查看详情
                      </span>
                    </div>
                  </div>
                }
                actions={[

                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDeleteFile(file)}
                    title="删除"
                  />,

                  <EditOutlined
                    key="details"
                    onClick={() => handleViewDetails(file)}
                    title="编辑"
                  />,
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      <div 
                        style={{ 
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={file.name}
                      >{file.name}</div>
                    </div>
                  }
                  description={null}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // 处理本地导入地图
  const handleLocalImport = async (values: any) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      const newMap: MapData = {
        id: `map_${Date.now()}`,
        name: values.mapName,
        version: '1.0.0',
        status: 'inactive',
        thumbnail: '/api/placeholder/150/100',
        description: values.description ?? '',
        createTime: now.toISOString().split('T')[0],
        updateTime: now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0],
        updateUser: '当前用户'
      };
      
      // 将新地图添加到地图列表中
      const updatedMapData = [newMap, ...mapData];
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      setLocalImportDrawerVisible(false);
      localImportForm.resetFields();
      setLocalImportFile(null);
      message.success('地图导入成功！');
    } catch (error) {
      message.error('导入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理机器人地图导入
  const handleRobotImport = async () => {
    if (!selectedRobot || selectedMapFiles.length === 0) {
      message.warning('请选择机器人和地图文件');
      return;
    }
    
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 根据选中的文件创建地图数据
      const selectedFiles: MapFile[] = [];
      const mapsByName: Record<string, string> = {};
      
      // 收集选中的文件并按地图分组
      selectedRobotMaps.forEach(mapName => {
        const mapFiles = selectedRobotMapFiles[mapName] || [];
        mapFiles.forEach(file => {
          if (selectedMapFiles.includes(file.id)) {
            selectedFiles.push(file);
            mapsByName[file.id] = mapName;
          }
        });
      });
      
      // 按地图名称分组创建地图数据
      const uniqueMapNames = Array.from(new Set(Object.values(mapsByName)));
      const now = new Date();
      const newMaps: MapData[] = uniqueMapNames.map((mapName, index) => ({
        id: `map_${Date.now()}_${index}`,
        name: mapName,
        version: '1.0.0',
        status: 'inactive',
        thumbnail: '/api/placeholder/150/100',
        description: `从机器人${selectedRobot}导入的地图`,
        createTime: now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0],
        updateTime: now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0],
        updateUser: '当前用户'
      }));
      
      // 将新地图添加到地图列表中
      const updatedMapData = [...newMaps, ...mapData];
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      setRobotDrawerVisible(false);
      setSelectedRobot('');
      setSelectedRobotMaps([]);
      setSelectedMapFiles([]);
      setRobotMaps([]);
      message.success(`成功导入${selectedMapFiles.length}个文件，创建了${uniqueMapNames.length}张地图！`);
    } catch (error) {
      message.error('导入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理新增地图表单提交
  const handleAddMap = async (values: any) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      const newMap: MapData = {
        id: `map_${Date.now()}`,
        name: values.mapName,
        version: '1.0.0',
        status: 'inactive',
        thumbnail: '/api/placeholder/150/100',
        description: values.description || '',
        createTime: now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0],
        updateTime: now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0],
        updateUser: '当前用户'
      };
      
      // 将新地图添加到地图列表中（添加到开头，保持按创建时间倒序）
      const updatedMapData = [newMap, ...mapData];
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      setDrawerVisible(false);
      form.resetFields();
      setUploadedFile(null);
      message.success('地图添加成功！');
    } catch (error) {
      message.error('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑地图表单提交
  const handleEditMap = async (values: any) => {
    if (!editingMap) return;

    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 更新地图数据
      const updatedMap: MapData = {
        ...editingMap,
        name: values.mapName,
        description: values.description || '',
        updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        updateUser: '当前用户'
      };

      // 更新mapData中的数据
      const updatedMapData = mapData.map((map: MapData) => 
        map.id === editingMap.id ? updatedMap : map
      );
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      // 如果编辑的是当前选中的地图，更新选中状态
      if (selectedMap?.id === editingMap.id) {
        setSelectedMap(updatedMap);
      }

      setEditDrawerVisible(false);
      editForm.resetFields();
      setEditUploadedFile(null);
      setEditingMap(null);
      message.success('地图更新成功！');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploadedFile(info.file);
      setLoading(false);
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 处理编辑文件上传
  const handleEditFileUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setEditUploadedFile(info.file);
      setLoading(false);
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 自定义上传请求
  const customRequest = (options: any) => {
    const { onSuccess, onError, file } = options;
    
    // 模拟上传过程
    setTimeout(() => {
      if (file.type.includes('model') || file.name.endsWith('.obj') || file.name.endsWith('.fbx') || file.name.endsWith('.gltf')) {
        onSuccess(file);
      } else {
        onError(new Error('请上传3D模型文件'));
      }
    }, 1000);
  };

  // 渲染3D模型预览
  const render3DPreview = () => {
    if (!uploadedFile) {
      return (
        <div style={{ 
          height: 300, 
          border: '2px dashed #d9d9d9', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#999'
        }}>
          <FileImageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>请先上传3D模型文件</div>
        </div>
      );
    }

    return (
      <div style={{ height: 300, border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
        <Tabs 
          activeKey={previewMode}
          onChange={(key) => setPreviewMode(key as 'front' | 'top' | 'side')}
          items={[
            {
              key: 'front',
              label: '正视图',
              children: (
                <div style={{ 
                  height: 250, 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileImageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>3D模型正视图预览</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>文件: {uploadedFile.name}</div>
                  </div>
                </div>
              )
            },
            {
              key: 'top',
              label: '顶视图',
              children: (
                <div style={{ 
                  height: 250, 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileImageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>3D模型顶视图预览</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>文件: {uploadedFile.name}</div>
                  </div>
                </div>
              )
            },
            {
              key: 'side',
              label: '侧视图',
              children: (
                <div style={{ 
                  height: 250, 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileImageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>3D模型侧视图预览</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>文件: {uploadedFile.name}</div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>
    );
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>地图管理</span>
          </div>
        }
        style={{ 
          height: isSmallScreen ? 'auto' : 'calc(100vh - 120px)',
          minHeight: isSmallScreen ? 'calc(100vh - 120px)' : 'auto'
        }}
        styles={{ 
          body: {
            padding: 16, 
            height: isSmallScreen ? 'auto' : 'calc(100% - 57px)'
          }
        }}
      >
        <Row gutter={16} style={{ height: isSmallScreen ? 'auto' : '100%' }}>
          {/* 左侧地图列表 */}
          <Col xs={24} lg={10} style={{ height: isSmallScreen ? 'auto' : '100%', marginBottom: isSmallScreen ? 16 : 0 }}>
            <div style={{ 
              height: isSmallScreen ? 'auto' : '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12,
                height: '32px'
              }}>
                <Title level={5} style={{ margin: 0, color: '#666', fontSize: '16px', fontWeight: 500, lineHeight: '32px' }}>地图列表</Title>
                <Space size={8}>
                  <Popover
                    content={
                      <div style={{ width: 200 }}>
                        <div 
                          style={{ 
                            padding: '8px 12px', 
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            setImportPopoverVisible(false);
                            setLocalImportDrawerVisible(true);
                          }}
                        >
                          <Space>
                            <FolderOpenOutlined style={{ color: '#1890ff' }} />
                            <span>从本地导入</span>
                          </Space>
                        </div>
                        <div 
                          style={{ 
                            padding: '8px 12px', 
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            setImportPopoverVisible(false);
                            // 打开抽屉时自动选择第一个在线机器人
                            const onlineRobots = robotDevices.filter(robot => robot.isOnline && robot.isEnabled);
                            if (onlineRobots.length > 0 && !selectedRobot) {
                              setSelectedRobot(onlineRobots[0].id);
                            }
                            setRobotDrawerVisible(true);
                          }}
                        >
                          <Space>
                            <RobotOutlined style={{ color: '#1890ff' }} />
                            <span>从机器人拉取</span>
                          </Space>
                        </div>
                      </div>
                    }
                    title="导入地图"
                    trigger="click"
                    open={importPopoverVisible}
                    onOpenChange={setImportPopoverVisible}
                    placement="bottomRight"
                  >
                    <Button 
                      size={isMobile ? 'large' : 'small'}
                      icon={<ImportOutlined />}
                      style={{ minWidth: isMobile ? 'auto' : '60px' }}
                    >
                      {isMobile ? '导入' : '导入'}
                    </Button>
                  </Popover>
                  <Button 
                    type="primary" 
                    size={isMobile ? 'large' : 'small'}
                    style={{ minWidth: isMobile ? 'auto' : '60px' }}
                    onClick={() => setDrawerVisible(true)}
                    icon={<PlusOutlined />}
                  >
                    {isMobile ? '新增' : '新增'}
                  </Button>
                </Space>
              </div>
              <Card
                size="small"
                styles={{ 
                  body: {
                    padding: 0, 
                    flex: isSmallScreen ? 'none' : 1, 
                    overflow: isSmallScreen ? 'visible' : 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                  }
                }}
                style={{ flex: isSmallScreen ? 'none' : 1, display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <Table
                    columns={isMobile ? mobileColumns : desktopColumns}
                    dataSource={mapData.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    rowKey="id"
                    showHeader={!isMobile}  // 小屏时隐藏表头
                    pagination={false}  // 禁用表格内置分页器
                    expandable={{
                      // 小屏模式下启用展开功能
                      expandedRowRender: isSmallScreen ? renderExpandedRow : undefined,
                      expandRowByClick: isSmallScreen,
                      expandedRowKeys: isSmallScreen && selectedMap ? [selectedMap.id] : [],
                      onExpand: (expanded: boolean, record: MapData) => {
                        if (isSmallScreen) {
                          setSelectedMap(expanded ? record : null);
                        }
                      },
                      showExpandColumn: isSmallScreen,
                    }}
                    onRow={(record: MapData) => ({
                      onClick: () => {
                        if (!isSmallScreen) {
                          handleRowClick(record);
                        }
                      },
                      style: {
                        cursor: 'pointer',
                        backgroundColor:
                          selectedMap?.id === record.id ? '#f0f8ff' : 'transparent',
                      },
                    })}
                    scroll={tableConfig.scroll}
                    size={tableConfig.size}
                  />
                </div>
                {/* 外部分页器 */}
                <div style={{
                  borderTop: '1px solid #f0f0f0',
                  padding: isMobile ? '12px 8px' : '16px 24px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  minHeight: isMobile ? '56px' : '64px'
                }}>
                  <Pagination
                    current={currentPage}
                    total={mapData.length}
                    pageSize={pageSize}
                    showSizeChanger={!isMobile}
                    showQuickJumper={!isMobile}
                    showTotal={isMobile ? undefined : (total: number, range: [number, number]) =>
                      `第 ${range[0]}-${range[1]} 条/共 ${total} 条`}
                    simple={isMobile}
                    size={isMobile ? 'small' : 'default'}
                    showLessItems={!isLargeScreen}
                    pageSizeOptions={isLargeScreen ? ['10', '15', '20', '50'] : ['10', '20', '50']}
                    onChange={(page: number, size?: number) => {
                       setCurrentPage(page);
                       if (size && size !== pageSize) {
                         setPageSize(size);
                         setCurrentPage(1); // 改变每页大小时重置到第一页
                       }
                     }}
                    style={{ 
                      margin: 0,
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                    className={isMobile ? 'mobile-pagination' : ''}
                  />
                </div>
              </Card>
            </div>
          </Col>

          {/* 右侧地图文件 - 大屏幕显示，小屏时也显示 */}
          <Col xs={0} lg={14} style={{ height: isSmallScreen ? 'auto' : '100%' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                height: '32px'
              }}>
                <Title level={5} style={{ margin: 0, color: '#666', fontSize: '16px', fontWeight: 500, lineHeight: '32px' }}>地图文件</Title>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    icon={<SyncOutlined />} 
                    size="small"
                    onClick={() => selectedMap && handleMapSync(selectedMap)}
                    disabled={!selectedMap}
                  >
                    同步
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    size="small"
                    onClick={handleAddMapFile}
                    disabled={!selectedMap}
                  >
                    新增
                  </Button>
                </div>
              </div>

              {selectedMap ? (
        <Card 
          title={`地图文件 - ${selectedMap?.name}`}
          style={{ marginBottom: 16 }}
        >
          {getMapFiles(selectedMap?.id || '').length > 0 ? (
            <Row gutter={[16, 16]}>
              {getMapFiles(selectedMap?.id || '').map((file: MapFile) => (
                <Col xs={12} sm={8} md={6} lg={8} xl={6} key={file.id}>
                  <Card
                    size="small"
                            hoverable
                            cover={
                              <div style={{ position: 'relative', overflow: 'hidden' }}>
                                <img
                                  alt={file.name}
                                  src={file.thumbnail}
                                  style={{
                                    height: 120,
                                    objectFit: 'cover',
                                    backgroundColor: '#f5f5f5',
                                    width: '100%',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid #f0f0f0',
                                     borderRadius: '6px',
                                     boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                                  }}
                                  onClick={() => handleImageClick(file)}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease',
                                    cursor: 'pointer',
                                  }}
                                  className="thumbnail-overlay"
                                  onClick={() => handleImageClick(file)}
                                >
                                  <EyeOutlined
                                    style={{
                                      fontSize: '24px',
                                      color: 'white',
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: 'white',
                                      marginLeft: '8px',
                                      fontSize: '14px',
                                    }}
                                  >
                                    查看详情
                                  </span>
                                </div>
                              </div>
                            }
                            actions={[
                              <DeleteOutlined
                                key="delete"
                                onClick={() => handleDeleteFile(file)}
                                title="删除"
                              />,
                              <EditOutlined
                                key="detail"
                                onClick={() => handleDetail(file)}
                                title="编辑"
                              />,
                              <ShareAltOutlined
                                key="slice"
                                onClick={() => handleSliceMap(file)}
                                title="切图"
                                style={{ color: '#1890ff' }}
                              />,
                            ]}
                          >
                            <Card.Meta
                              title={
                                <div>
                                  <div 
                                    style={{ 
                                      marginBottom: 4,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={file.name}
                                  >{file.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                    <Switch
                                      size="small"
                                      checked={file.status === 'active'}
                                      disabled={false}
                                      onChange={(checked) => {
                                        if (checked && selectedMap) {
                                          handleEnableFile(file, selectedMap.id);
                                        }
                                      }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                      当前使用
                    </span>
                                  </div>
                                </div>
                              }
                              description={null}
                            />
                          </Card>
                         </Col>
                       ))}

                     </Row>
                   ) : (
                     <div style={{
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       justifyContent: 'center',
                       minHeight: '200px',
                       color: '#999'
                     }}>
                       <FileImageOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                       <div style={{ fontSize: '14px' }}>暂无地图文件数据</div>
                       <div style={{ fontSize: '12px', marginTop: 8 }}>请上传地图文件或从机器人同步</div>
                     </div>
                   )}
                 </Card>
               ) : (
                 <Card
                   size="small"
                   styles={{
                     body: {
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       flex: 1,
                       minHeight: '200px'
                     }
                   }}
                   style={{ flex: 1 }}
                 >
                   <div style={{ textAlign: 'center' }}>
                     <FileImageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                     <div style={{ marginTop: 16, color: '#999' }}>
                       请从左侧列表选择一个地图查看文件
                     </div>
                   </div>
                 </Card>
               )}
             </div>
           </Col>
         </Row>
       </Card>
       
       {/* 新增地图侧滑弹窗 */}
       <Drawer
         title="新增地图"
         width={window.innerWidth * 2 / 3}
         onClose={() => {
           setDrawerVisible(false);
           form.resetFields();
           setUploadedFile(null);
         }}
         open={drawerVisible}
         styles={{ body: { paddingBottom: 80 } }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setDrawerVisible(false);
                 form.resetFields();
                 setUploadedFile(null);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               onClick={() => form.submit()} 
               type="primary" 
               loading={loading}
             >
               确定
             </Button>
           </div>
         }
       >
         <Form
           form={form}
           layout="vertical"
           onFinish={handleAddMap}
           requiredMark={true}
         >
           <Form.Item
             name="mapName"
             label="地图名称"
             rules={[
               { required: true, message: '请输入地图名称' },
               { max: 50, message: '地图名称不能超过50个字符' },
               { 
                  validator: (_: any, value: string) => {
                    if (value && value.trim() === '') {
                      return Promise.reject(new Error('地图名称不能为空格'));
                    }
                    return Promise.resolve();
                  }
                }
             ]}
           >
             <Input 
               placeholder="请输入地图名称" 
               size="large"
             />
           </Form.Item>

           <Form.Item
             name="description"
             label="地图描述"
             rules={[
               { max: 200, message: '描述不能超过200个字符' }
             ]}
           >
             <Input.TextArea 
               placeholder="请输入地图描述（可选）" 
               rows={3}
               size="large"
             />
           </Form.Item>

           <Form.Item
             label="场景3D模型文件"
           >
             <Upload.Dragger
               name="modelFile"
               customRequest={customRequest}
               onChange={handleFileUpload}
               showUploadList={false}
               accept=".obj,.fbx,.gltf,.glb,.3ds,.dae"
               style={{ marginBottom: 16 }}
             >
               <p className="ant-upload-drag-icon">
                 <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
               </p>
               <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                 点击或拖拽文件到此区域上传
               </p>
               <p className="ant-upload-hint" style={{ color: '#999' }}>
                 支持 .obj, .fbx, .gltf, .glb, .3ds, .dae 等3D模型格式
               </p>
               {uploadedFile && (
                 <div style={{ 
                   marginTop: 12, 
                   padding: '8px 16px', 
                   background: '#f0f9ff', 
                   border: '1px solid #91d5ff',
                   borderRadius: 6,
                   color: '#1890ff'
                 }}>
                   <FileImageOutlined style={{ marginRight: 8 }} />
                   已上传: {uploadedFile.name}
                 </div>
               )}
             </Upload.Dragger>
           </Form.Item>

           {uploadedFile && (
             <Form.Item label="3D模型预览">
               {render3DPreview()}
             </Form.Item>
           )}
         </Form>
       </Drawer>

       {/* 编辑地图弹窗 */}
       <Drawer
         title="编辑地图"
         width="66.67%"
         placement="right"
         onClose={() => {
           setEditDrawerVisible(false);
           editForm.resetFields();
           setEditUploadedFile(null);
           setEditingMap(null);
         }}
         open={editDrawerVisible}
         styles={{ body: { paddingBottom: 80 } }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setEditDrawerVisible(false);
                 editForm.resetFields();
                 setEditUploadedFile(null);
                 setEditingMap(null);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               onClick={() => editForm.submit()} 
               type="primary" 
               loading={loading}
             >
               保存修改
             </Button>
           </div>
         }
       >
         <Form
           form={editForm}
           layout="vertical"
           onFinish={handleEditMap}
           requiredMark={true}
         >
           <Form.Item
             name="mapName"
             label="地图名称"
             rules={[
               { required: true, message: '请输入地图名称' },
               { max: 50, message: '地图名称不能超过50个字符' },
               { 
                  validator: (_: any, value: string) => {
                    if (value && value.trim() === '') {
                      return Promise.reject(new Error('地图名称不能为空格'));
                    }
                    return Promise.resolve();
                  }
                }
             ]}
           >
             <Input 
               placeholder="请输入地图名称" 
               size="large"
             />
           </Form.Item>

           <Form.Item
             name="description"
             label="地图描述"
             rules={[
               { max: 200, message: '描述不能超过200个字符' }
             ]}
           >
             <Input.TextArea 
               placeholder="请输入地图描述（可选）" 
               rows={3}
               size="large"
             />
           </Form.Item>

           <Form.Item
             label="场景3D模型文件"
           >
             <Upload.Dragger
               name="modelFile"
               customRequest={customRequest}
               onChange={handleEditFileUpload}
               showUploadList={false}
               accept=".obj,.fbx,.gltf,.glb,.3ds,.dae"
               style={{ marginBottom: 16 }}
             >
               <p className="ant-upload-drag-icon">
                 <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
               </p>
               <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                 点击或拖拽文件到此区域上传
               </p>
               <p className="ant-upload-hint" style={{ color: '#999' }}>
                 支持 .obj, .fbx, .gltf, .glb, .3ds, .dae 等3D模型格式
               </p>
               {editUploadedFile && (
                 <div style={{ 
                   marginTop: 12, 
                   padding: '8px 16px', 
                   background: '#f0f9ff', 
                   border: '1px solid #91d5ff',
                   borderRadius: 6,
                   color: '#1890ff'
                 }}>
                   <FileImageOutlined style={{ marginRight: 8 }} />
                   已上传: {editUploadedFile.name}
                 </div>
               )}
             </Upload.Dragger>
           </Form.Item>

           {editUploadedFile && (
             <Form.Item label="3D模型预览">
               {render3DPreview()}
             </Form.Item>
           )}
         </Form>
       </Drawer>

       {/* 从机器人拉取地图侧滑抽屉 */}
       <Drawer
         title="从机器人拉取地图"
         width={`${Math.floor(window.innerWidth * 2 / 3)}px`}
         placement="right"
         onClose={() => {
           setRobotDrawerVisible(false);
           // 不清空选中的机器人，保持选中状态
         }}
         open={robotDrawerVisible}
         styles={{ body: { padding: '24px' } }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setRobotDrawerVisible(false);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               type="primary" 
               disabled={!selectedRobot || selectedMapFiles.length === 0}
               onClick={() => handleRobotImport()}
               loading={loading}
             >
               确认导入 ({selectedMapFiles.length} 个文件)
             </Button>
           </div>
         }
       >
         <div>
           <div style={{ marginBottom: 24 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
               <div>
                 <Title level={5} style={{ margin: 0, marginBottom: 8 }}>选择在线机器人设备</Title>
                 <div style={{ color: '#666', fontSize: '14px' }}>
                   仅显示在线且已启用的机器人设备
                 </div>
               </div>
               <Input.Search
                  placeholder="搜索机器人设备名称..."
                  value={robotSearchText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotSearchText(e.target.value)}
                  allowClear
                  style={{ width: '300px', height: '44px' }}
                />
             </div>
           </div>
           
           {/* 机器人卡片滑动区域 */}
           <div style={{ position: 'relative' }}>
             {/* 左滑动按钮 */}
             <Button
               type="text"
               icon={<LeftOutlined />}
               style={{
                 position: 'absolute',
                 left: '-20px',
                 top: '50%',
                 transform: 'translateY(-50%)',
                 zIndex: 10,
                 backgroundColor: '#fff',
                 border: '1px solid #d9d9d9',
                 borderRadius: '50%',
                 width: '32px',
                 height: '32px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                 transition: 'all 0.2s ease',
                 opacity: isSliding ? 0.6 : 1
               }}
               disabled={robotSlideIndex === 0 || isSliding}
               onClick={() => handleRobotSlide('left')}
             />
             
             {/* 右滑动按钮 */}
             <Button
               type="text"
               icon={<RightOutlined />}
               style={{
                 position: 'absolute',
                 right: '-20px',
                 top: '50%',
                 transform: 'translateY(-50%)',
                 zIndex: 10,
                 backgroundColor: '#fff',
                 border: '1px solid #d9d9d9',
                 borderRadius: '50%',
                 width: '32px',
                 height: '32px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                 transition: 'all 0.2s ease',
                 opacity: isSliding ? 0.6 : 1
               }}
               disabled={robotSlideIndex >= Math.ceil(robotDevices.filter(robot => 
                 robot.isOnline && 
                 robot.isEnabled && 
                 robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
               ).length / robotCardsPerPage) - 1 || isSliding}
               onClick={() => handleRobotSlide('right')}
             />
             
             {/* 机器人卡片网格 */}
             <div style={{ 
               overflow: 'hidden',
               paddingBottom: '8px'
             }}>
               <Row 
                 gutter={[12, 12]}
                 style={{
                   transform: isSliding ? 
                     (slideDirection === 'right' ? 'translateX(-30px)' : 'translateX(30px)') : 
                     'translateX(0)',
                   opacity: isSliding ? 0.3 : 1,
                   transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                   filter: isSliding ? 'blur(1px)' : 'blur(0px)'
                 }}
               >
                 {robotDevices
                   .filter(robot => 
                     robot.isOnline && 
                     robot.isEnabled && 
                     robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                   )
                   .slice(robotSlideIndex * robotCardsPerPage, (robotSlideIndex + 1) * robotCardsPerPage)
                   .map(robot => (
                     <Col key={robot.id} xs={24} sm={12} md={12} lg={6} xl={6}>
                       <Card 
                         size="small" 
                         style={{ 
                           width: '100%',
                           height: '110px',
                           border: selectedRobot === robot.id ? '2px solid #1890ff' : '1px solid #e8e8e8',
                           backgroundColor: selectedRobot === robot.id ? '#f0f9ff' : '#fff',
                           borderRadius: '8px',
                           cursor: 'pointer',
                           transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                           position: 'relative',
                           transform: isSliding ? 
                             `scale(0.95) translateX(${slideDirection === 'right' ? '-10px' : '10px'})` : 
                             'scale(1) translateX(0)',
                           boxShadow: isSliding ? 
                             '0 1px 4px rgba(0,0,0,0.04)' : 
                             (selectedRobot === robot.id ? '0 4px 12px rgba(24,144,255,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'),
                           filter: isSliding ? 'brightness(0.95)' : 'brightness(1)'
                         }}
                         styles={{ body: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' } }}
                         hoverable
                         onClick={() => setSelectedRobot(robot.id)}
                         onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                           if (!isSliding) {
                             e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                             e.currentTarget.style.boxShadow = selectedRobot === robot.id ? 
                               '0 8px 20px rgba(24,144,255,0.25)' : 
                               '0 8px 20px rgba(0,0,0,0.15)';
                           }
                         }}
                         onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                           if (!isSliding) {
                             e.currentTarget.style.transform = 'translateY(0) scale(1)';
                             e.currentTarget.style.boxShadow = selectedRobot === robot.id ? 
                               '0 4px 12px rgba(24,144,255,0.15)' : 
                               '0 2px 8px rgba(0,0,0,0.1)';
                           }
                         }}
                       >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                           <Avatar 
                             icon={<RobotOutlined />} 
                             style={{ 
                               backgroundColor: '#1890ff',
                               border: '2px solid #e6f7ff',
                               flexShrink: 0
                             }}
                             size={18}
                           />
                           <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                             <div style={{ 
                               fontWeight: 600, 
                               fontSize: '13px', 
                               marginBottom: '4px', 
                               color: '#262626',
                               overflow: 'hidden',
                               textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap'
                             }}>
                               {robot.deviceName}
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                               <Badge 
                                 status={robot.isOnline ? 'success' : 'error'} 
                                 text={
                                   <span style={{ fontSize: '11px', fontWeight: 500 }}>
                                     {robot.isOnline ? '在线' : '离线'}
                                   </span>
                                 }
                               />
                               <span style={{ color: '#666', fontSize: '10px' }}>
                                 {robot.ipAddress}:{robot.port}
                               </span>
                               <span style={{ 
                                 color: '#999', 
                                 fontSize: '10px',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                                 whiteSpace: 'nowrap',
                                 width: '100%'
                               }}>
                                 最近连接: {robot.lastConnectTime}
                               </span>
                             </div>
                           </div>
                           
                           {/* 选择按钮放在右侧，与图标纵向对齐 */}
                           <Radio 
                             checked={selectedRobot === robot.id}
                             style={{ 
                               flexShrink: 0
                             }}
                             onClick={(e: React.MouseEvent) => {
                               e.stopPropagation();
                               setSelectedRobot(robot.id);
                             }}
                           />
                         </div>
                       </Card>
                     </Col>
                   ))
                 }
               </Row>
             </div>
           </div>
           
           {/* 机器人地图列表 */}
           {selectedRobot && robotMaps.length > 0 && (
             <div style={{ marginTop: 32 }}>
               <div style={{ marginBottom: 16 }}>
                 <div style={{ display: 'inline-block' }}>
                   <Title level={5} style={{ margin: 0, display: 'inline-block', marginRight: 12 }}>可拉取的地图列表</Title>
                   <Space>
                     <Button 
                       size="small" 
                       onClick={() => {
                         setSelectedRobotMaps([...robotMaps]);
                       }}
                     >
                       全选
                     </Button>
                     <Button 
                       size="small" 
                       onClick={() => setSelectedRobotMaps([])}
                     >
                       清空选择
                     </Button>
                   </Space>
                 </div>
               </div>
               <div style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
                 选择要拉取的地图，支持多选。已选择 {selectedRobotMaps.length} 个地图
               </div>
               <div style={{ 
                 backgroundColor: '#fafafa', 
                 borderRadius: '8px', 
                 padding: '16px',
                 border: '1px solid #f0f0f0'
               }}>
                 <Row gutter={[8, 8]}>
                   {robotMaps.map((mapName, index) => {
                     // 模拟地图数据
                     const mapData = {
                       name: mapName,
                       size: `${(Math.random() * 50 + 10).toFixed(1)}MB`,
                       updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
                         year: 'numeric',
                         month: '2-digit',
                         day: '2-digit',
                         hour: '2-digit',
                         minute: '2-digit'
                       })
                     };
                     
                     return (
                       <Col key={index} xs={24} sm={12} md={8} lg={6} xl={6}>
                         <Card 
                           size="small"
                           style={{ 
                             borderRadius: '8px',
                             border: selectedRobotMaps.includes(mapName) ? '2px solid #1890ff' : '1px solid #e8e8e8',
                             backgroundColor: selectedRobotMaps.includes(mapName) ? '#f0f9ff' : '#fff',
                             cursor: 'pointer',
                             transition: 'all 0.3s ease',
                             position: 'relative',
                             height: '100px'
                           }}
                           styles={{ body: { padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' } }}
                           hoverable
                           onClick={() => {
                             const newSelected = selectedRobotMaps.includes(mapName)
                               ? selectedRobotMaps.filter(m => m !== mapName)
                               : [...selectedRobotMaps, mapName];
                             setSelectedRobotMaps(newSelected);
                           }}
                         >
                           <div style={{ 
                             display: 'flex', 
                             alignItems: 'center',
                             height: '100%',
                             gap: '12px'
                           }}>
                             <div style={{ 
                               flex: 1,
                               display: 'flex', 
                               flexDirection: 'column',
                               gap: '4px'
                             }}>
                               <span style={{ 
                                 fontSize: '14px', 
                                 fontWeight: 600, 
                                 color: '#262626'
                               }}>
                                 {mapData.name}
                               </span>
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '8px',
                                 flexWrap: 'wrap'
                               }}>
                                 <span style={{ 
                                   fontSize: '12px', 
                                   color: '#666'
                                 }}>
                                   大小: {mapData.size}
                                 </span>
                                 <span style={{ 
                                   fontSize: '12px', 
                                   color: '#999'
                                 }}>
                                   更新: {mapData.updateTime}
                                 </span>
                               </div>
                             </div>
                             
                             {/* 多选框放在右侧，上下居中 */}
                             <Checkbox 
                               checked={selectedRobotMaps.includes(mapName)}
                               style={{ 
                                 flexShrink: 0
                               }}
                               onClick={(e: React.MouseEvent) => {
                                 e.stopPropagation();
                                 const newSelected = selectedRobotMaps.includes(mapName)
                                   ? selectedRobotMaps.filter(m => m !== mapName)
                                   : [...selectedRobotMaps, mapName];
                                 setSelectedRobotMaps(newSelected);
                               }}
                             />
                           </div>
                         </Card>
                       </Col>
                     );
                   })}
                 </Row>
               </div>
             </div>
           )}
           
           {/* 选中地图的文件列表 */}
           {selectedRobot && (
             <div style={{ marginTop: 32 }}>
               <div style={{ marginBottom: 16 }}>
                 <div style={{ display: 'inline-block' }}>
                   <Title level={5} style={{ margin: 0, display: 'inline-block', marginRight: 12 }}>选中地图的文件列表</Title>
                   <Space>
                     <Button 
                       size="small" 
                       onClick={() => {
                         // 获取所有地图文件的ID
                         const allFileIds: string[] = [];
                         selectedRobotMaps.forEach(mapName => {
                           const mapFiles = selectedRobotMapFiles[mapName] || [];
                           mapFiles.forEach(file => allFileIds.push(file.id));
                         });
                         setSelectedMapFiles(allFileIds);
                       }}
                     >
                       全选
                     </Button>
                     <Button 
                       size="small" 
                       onClick={() => setSelectedMapFiles([])}
                     >
                       清空选择
                     </Button>
                   </Space>
                 </div>
               </div>
               <div style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
                 展示所选地图包含的文件，让您了解将要拉取的具体内容。已选择 {selectedMapFiles.length} 个文件
               </div>
               
               {selectedRobotMaps.length > 0 ? (
                 selectedRobotMaps.map((mapName, mapIndex) => {
                   const mapFiles = selectedRobotMapFiles[mapName] || [];
                   return (
                     <div key={mapIndex} style={{ marginBottom: 24 }}>
                       <div style={{ 
                         fontSize: '14px', 
                         fontWeight: 600, 
                         color: '#262626',
                         marginBottom: 12,
                         padding: '8px 12px',
                         backgroundColor: '#f0f9ff',
                         borderRadius: '6px',
                         border: '1px solid #e6f7ff'
                       }}>
                         📁 {mapName} ({mapFiles.length} 个文件)
                       </div>
                       
                       <Row gutter={[12, 12]}>
                         {mapFiles.map((file) => (
                           <Col xs={12} sm={8} md={6} lg={6} xl={4} key={file.id}>
                             <Card
                               size="small"
                               hoverable
                               cover={
                                 <img
                                   alt={file.name}
                                   src={file.thumbnail}
                                   style={{
                                     height: 80,
                                     objectFit: 'cover',
                                     backgroundColor: '#f5f5f5',
                                     border: '1px solid #f0f0f0',
                                     borderRadius: '6px',
                                     boxShadow: '0 1px 4px rgba(0,21,41,.08)'
                                   }}
                                 />
                               }
                               style={{
                                 border: '1px solid #d9d9d9',
                                 backgroundColor: '#fff',
                                 cursor: 'default'
                               }}
                             >
                               <Card.Meta
                                 title={
                                   <div style={{ position: 'relative' }}>
                                     <div 
                                       style={{ 
                                         fontSize: '12px',
                                         fontWeight: 500,
                                         overflow: 'hidden',
                                         textOverflow: 'ellipsis',
                                         whiteSpace: 'nowrap'
                                       }}
                                       title={file.name}
                                     >
                                       {file.name}
                                     </div>

                                     <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                       <Tag 
                                         size="small" 
                                         color={file.status === 'active' ? 'blue' : 'default'}
                                         style={{ fontSize: '10px' }}
                                       >
                                         {file.status === 'active' ? '当前使用' : '当前使用'}
                                       </Tag>
                                       
                                       {/* 多选复选框，与"当前使用"标签水平对齐且靠右对齐 */}
                                       <Checkbox 
                                         checked={selectedMapFiles.includes(file.id)}
                                         style={{ 
                                           flexShrink: 0
                                         }}
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           setSelectedMapFiles(prev => 
                                             prev.includes(file.id) 
                                               ? prev.filter(id => id !== file.id)
                                               : [...prev, file.id]
                                           );
                                         }}
                                       />
                                     </div>
                                   </div>
                                 }
                               />
                             </Card>
                           </Col>
                         ))}
                       </Row>
                     </div>
                   );
                 })
               ) : (
                 <div style={{
                   textAlign: 'center',
                   padding: '60px 20px',
                   color: '#999',
                   backgroundColor: '#fafafa',
                   borderRadius: '8px',
                   border: '1px dashed #d9d9d9'
                 }}>
                   <FileImageOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                   <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无地图文件数据</div>
                   <div style={{ fontSize: '14px' }}>请先选择要拉取的地图</div>
                 </div>
               )}
             </div>
           )}
           
           {robotDevices.filter(robot => robot.isOnline && robot.isEnabled).length === 0 && (
             <div style={{ 
               textAlign: 'center', 
               padding: '60px 20px',
               color: '#999',
               backgroundColor: '#fafafa',
               borderRadius: '8px',
               border: '1px dashed #d9d9d9'
             }}>
               <RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
               <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无可用的机器人设备</div>
               <div style={{ fontSize: '14px' }}>请确保机器人设备已上线并启用</div>
             </div>
           )}
         </div>
       </Drawer>

       {/* 本地导入地图侧滑弹窗 */}
       <Drawer
         title="本地导入地图"
         width={window.innerWidth * 2 / 3}
         onClose={() => {
           setLocalImportDrawerVisible(false);
           localImportForm.resetFields();
           setLocalImportFile(null);
         }}
         open={localImportDrawerVisible}
         styles={{ body: { paddingBottom: 80 } }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setLocalImportDrawerVisible(false);
                 localImportForm.resetFields();
                 setLocalImportFile(null);
               }} 
               style={{ 
                 marginRight: 8,
                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
               }}
             >
               取消
             </Button>
             <Button 
               onClick={() => localImportForm.submit()} 
               type="primary" 
               loading={loading}
               style={{
                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
               }}
             >
               确认导入
             </Button>
           </div>
         }
       >
         <Form
           form={localImportForm}
           layout="vertical"
           onFinish={handleLocalImport}
           requiredMark={true}
         >
           <Form.Item
             name="mapName"
             label="地图名称"
             rules={[
               { required: true, message: '请输入地图名称' },
               { max: 50, message: '地图名称不能超过50个字符' },
               { 
                  validator: (_: any, value: string) => {
                    if (value && value.trim() === '') {
                      return Promise.reject(new Error('地图名称不能为空格'));
                    }
                    return Promise.resolve();
                  }
                }
             ]}
           >
             <Input 
               placeholder="请输入地图名称" 
               size="large"
             />
           </Form.Item>

           <Form.Item
             name="description"
             label="地图描述"
             rules={[
               { max: 200, message: '描述不能超过200个字符' }
             ]}
           >
             <Input.TextArea 
               placeholder="请输入地图描述（可选）" 
               rows={3}
               size="large"
             />
           </Form.Item>

           <Form.Item
             label="地图文件"
             required
           >
             <Upload.Dragger
               name="mapFile"
               customRequest={({ onSuccess }) => {
                 setTimeout(() => {
                   onSuccess && onSuccess('ok');
                 }, 0);
               }}
               onChange={(info) => {
                 if (info.file.status === 'done') {
                   setLocalImportFile(info.file);
                   message.success(`${info.file.name} 文件上传成功`);
                 } else if (info.file.status === 'error') {
                   message.error(`${info.file.name} 文件上传失败`);
                 }
               }}
               showUploadList={false}
               accept=".map,.pgm,.yaml,.yml,.json"
               style={{ marginBottom: 16 }}
             >
               <p className="ant-upload-drag-icon">
                 <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
               </p>
               <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                 点击或拖拽文件到此区域上传
               </p>
               <p className="ant-upload-hint" style={{ color: '#999' }}>
                 支持 .map, .pgm, .yaml, .yml, .json 等地图格式
               </p>
               {localImportFile && (
                 <div style={{ 
                   marginTop: 12, 
                   padding: '8px 16px', 
                   background: '#f0f9ff', 
                   border: '1px solid #91d5ff',
                   borderRadius: 6,
                   color: '#1890ff'
                 }}>
                   <FileImageOutlined style={{ marginRight: 8 }} />
                   已上传: {localImportFile.name}
                 </div>
               )}
             </Upload.Dragger>
           </Form.Item>
         </Form>
       </Drawer>

       {/* 地图同步侧滑弹窗 */}
       <Drawer
         title={`地图同步 - ${syncingMap?.name || ''}`}
         width={`${Math.floor(window.innerWidth * 2 / 3)}px`}
         placement="right"
         onClose={() => {
           setMapSyncDrawerVisible(false);
           setSyncingMap(null);
           setSelectedSyncRobots([]);
           setSelectedSyncMapFiles([]);
         }}
         open={mapSyncDrawerVisible}
         styles={{ body: { padding: '24px' } }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setMapSyncDrawerVisible(false);
                 setSyncingMap(null);
                 setSelectedSyncRobots([]);
                 setSelectedSyncMapFiles([]);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               type="primary" 
               disabled={selectedSyncRobots.length === 0 || selectedSyncMapFiles.length === 0}
               onClick={() => handleConfirmSync()}
               loading={loading}
             >
               确认同步 (机器人:{selectedSyncRobots.length}, 文件:{selectedSyncMapFiles.length})
             </Button>
           </div>
         }
       >
         <div>
           {/* 选择机器人部分 */}
           <div style={{ marginBottom: 32 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
               <div>
                   <div style={{ marginBottom: 8 }}>
                     <Title level={5} style={{ margin: 0, display: 'inline-block', marginRight: 16 }}>选择在线机器人设备</Title>
                     <Space size={8}>
                       <Button 
                         size="small" 
                         onClick={() => {
                           const onlineRobots = robotDevices.filter(robot => 
                             robot.isOnline && 
                             robot.isEnabled && 
                             robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                           );
                           setSelectedSyncRobots(onlineRobots.map(robot => robot.id));
                         }}
                       >
                         全选
                       </Button>
                       <Button 
                         size="small" 
                         onClick={() => setSelectedSyncRobots([])}
                       >
                         清空选择
                       </Button>
                     </Space>
                   </div>
                   <div style={{ color: '#666', fontSize: '14px' }}>
                     仅显示在线且已启用的机器人设备，支持多选。已选择 {selectedSyncRobots.length} 个机器人
                   </div>
                 </div>
               <div style={{ width: '300px' }}>
                 <Input.Search
                    placeholder="搜索机器人设备名称..."
                    value={robotSearchText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotSearchText(e.target.value)}
                    allowClear
                    style={{ width: '100%' }}
                  />
               </div>
             </div>
           
             {/* 机器人卡片滑动区域 */}
             <div style={{ position: 'relative' }}>
               {/* 左滑动按钮 */}
               <Button
                 type="text"
                 icon={<LeftOutlined />}
                 style={{
                   position: 'absolute',
                   left: '-20px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   zIndex: 10,
                   backgroundColor: '#fff',
                   border: '1px solid #d9d9d9',
                   borderRadius: '50%',
                   width: '32px',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                   transition: 'all 0.2s ease',
                   opacity: isSliding ? 0.6 : 1
                 }}
                 disabled={robotSlideIndex === 0 || isSliding}
                 onClick={() => handleRobotSlide('left')}
               />
               
               {/* 右滑动按钮 */}
               <Button
                 type="text"
                 icon={<RightOutlined />}
                 style={{
                   position: 'absolute',
                   right: '-20px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   zIndex: 10,
                   backgroundColor: '#fff',
                   border: '1px solid #d9d9d9',
                   borderRadius: '50%',
                   width: '32px',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                   transition: 'all 0.2s ease',
                   opacity: isSliding ? 0.6 : 1
                 }}
                 disabled={robotSlideIndex >= Math.ceil(robotDevices.filter(robot => 
                   robot.isOnline && 
                   robot.isEnabled && 
                   robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                 ).length / robotCardsPerPage) - 1 || isSliding}
                 onClick={() => handleRobotSlide('right')}
               />
               
               {/* 机器人卡片网格 */}
               <div style={{ 
                 overflow: 'hidden',
                 paddingBottom: '8px'
               }}>
                 <Row 
                   gutter={[12, 12]}
                   style={{
                     transform: isSliding ? 
                       (slideDirection === 'right' ? 'translateX(-30px)' : 'translateX(30px)') : 
                       'translateX(0)',
                     opacity: isSliding ? 0.3 : 1,
                     transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                     filter: isSliding ? 'blur(1px)' : 'blur(0px)'
                   }}
                 >
                   {robotDevices
                     .filter(robot => 
                       robot.isOnline && 
                       robot.isEnabled && 
                       robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                     )
                     .slice(robotSlideIndex * robotCardsPerPage, (robotSlideIndex + 1) * robotCardsPerPage)
                     .map(robot => (
                       <Col key={robot.id} xs={24} sm={12} md={12} lg={6} xl={6}>
                         <Card 
                           size="small" 
                           style={{ 
                             width: '100%',
                             height: '110px',
                             border: selectedSyncRobots.includes(robot.id) ? '2px solid #1890ff' : '1px solid #e8e8e8',
                             backgroundColor: selectedSyncRobots.includes(robot.id) ? '#f0f9ff' : '#fff',
                             borderRadius: '8px',
                             cursor: 'pointer',
                             transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                             position: 'relative',
                             transform: isSliding ? 
                               `scale(0.95) translateX(${slideDirection === 'right' ? '-10px' : '10px'})` : 
                               'scale(1) translateX(0)',
                             boxShadow: isSliding ? 
                               '0 1px 4px rgba(0,0,0,0.04)' : 
                               (selectedSyncRobots.includes(robot.id) ? '0 4px 12px rgba(24,144,255,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'),
                             filter: isSliding ? 'brightness(0.95)' : 'brightness(1)'
                           }}
                           styles={{ body: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' } }}
                           hoverable
                           onClick={() => {
                             setSelectedSyncRobots(prev => 
                               prev.includes(robot.id) 
                                 ? prev.filter(id => id !== robot.id)
                                 : [...prev, robot.id]
                             );
                           }}
                           onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                             if (!isSliding) {
                               e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                               e.currentTarget.style.boxShadow = selectedSyncRobots.includes(robot.id) ? 
                                 '0 8px 20px rgba(24,144,255,0.25)' : 
                                 '0 8px 20px rgba(0,0,0,0.15)';
                             }
                           }}
                           onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                             if (!isSliding) {
                               e.currentTarget.style.transform = 'translateY(0) scale(1)';
                               e.currentTarget.style.boxShadow = selectedSyncRobots.includes(robot.id) ? 
                                 '0 4px 12px rgba(24,144,255,0.15)' : 
                                 '0 2px 8px rgba(0,0,0,0.1)';
                             }
                           }}
                         >
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                             <Avatar 
                               icon={<RobotOutlined />} 
                               style={{ 
                                 backgroundColor: '#1890ff',
                                 border: '2px solid #e6f7ff',
                                 flexShrink: 0
                               }}
                               size={18}
                             />
                             <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                               <div style={{ 
                                 fontWeight: 600, 
                                 fontSize: '13px', 
                                 marginBottom: '4px', 
                                 color: '#262626',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                                 whiteSpace: 'nowrap'
                               }}>
                                 {robot.deviceName}
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                 <Badge 
                                   status={robot.isOnline ? 'success' : 'error'} 
                                   text={
                                     <span style={{ fontSize: '11px', fontWeight: 500 }}>
                                       {robot.isOnline ? '在线' : '离线'}
                                     </span>
                                   }
                                 />
                                 <span style={{ color: '#666', fontSize: '10px' }}>
                                   {robot.ipAddress}:{robot.port}
                                 </span>
                                 <span style={{ 
                                   color: '#999', 
                                   fontSize: '10px',
                                   overflow: 'hidden',
                                   textOverflow: 'ellipsis',
                                   whiteSpace: 'nowrap',
                                   width: '100%'
                                 }}>
                                   最近连接: {robot.lastConnectTime}
                                 </span>
                               </div>
                             </div>
                             
                             {/* 选择按钮放在右侧，与图标纵向对齐 */}
                             <Checkbox 
                               checked={selectedSyncRobots.includes(robot.id)}
                               style={{ 
                                 flexShrink: 0
                               }}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedSyncRobots(prev => 
                                   prev.includes(robot.id) 
                                     ? prev.filter(id => id !== robot.id)
                                     : [...prev, robot.id]
                                 );
                               }}
                             />
                           </div>
                         </Card>
                         </Col>
                       ))
                     }
                   </Row>
                 </div>
               </div>
             </div>

           {/* 选择地图文件部分 */}
           {syncingMap && (
             <div>
               <div style={{ marginBottom: 16 }}>
                 <Title level={5} style={{ margin: 0, display: 'inline-block', marginRight: 16 }}>选择地图文件</Title>
                 <Space size={8}>
                   <Button 
                     size="small" 
                     onClick={() => {
                       const allMapFiles = getMapFiles(syncingMap.id);
                       setSelectedSyncMapFiles(allMapFiles.map(file => file.id));
                     }}
                   >
                     全选
                   </Button>
                   <Button 
                     size="small" 
                     onClick={() => setSelectedSyncMapFiles([])}
                   >
                     清空选择
                   </Button>
                 </Space>
               </div>
               <div style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
                 选择要同步的地图文件，支持多选，默认选择当前使用的地图文件。已选择 {selectedSyncMapFiles.length} 个文件
               </div>
               
               <Row gutter={[16, 16]}>
                 {getMapFiles(syncingMap.id).map((file) => (
                   <Col xs={12} sm={8} md={6} lg={6} xl={4} key={file.id}>
                     <Card
                       size="small"
                       hoverable
                       cover={
                         <img
                           alt={file.name}
                           src={file.thumbnail}
                           style={{
                             height: 80,
                             objectFit: 'cover',
                             backgroundColor: '#f5f5f5',
                           }}
                         />
                       }
                       style={{
                         border: selectedSyncMapFiles.includes(file.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                         backgroundColor: selectedSyncMapFiles.includes(file.id) ? '#f0f9ff' : '#fff',
                         cursor: 'pointer'
                       }}
                       onClick={() => {
                         setSelectedSyncMapFiles(prev => 
                           prev.includes(file.id) 
                             ? prev.filter(id => id !== file.id)
                             : [...prev, file.id]
                         );
                       }}
                     >
                       <Card.Meta
                         title={
                           <div style={{ position: 'relative' }}>
                             <div 
                               style={{ 
                                 fontSize: '12px',
                                 fontWeight: 500,
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                                 whiteSpace: 'nowrap'
                               }}
                               title={file.name}
                             >
                               {file.name}
                             </div>

                             <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                               <Tag 
                                 size="small" 
                                 color={file.status === 'active' ? 'blue' : 'default'}
                                 style={{ fontSize: '10px' }}
                               >
                                 {file.status === 'active' ? '当前使用' : '当前使用'}
                               </Tag>
                               <Checkbox 
                                 checked={selectedSyncMapFiles.includes(file.id)}
                                 onChange={(e) => {
                                   e.stopPropagation();
                                   setSelectedSyncMapFiles(prev => 
                                     prev.includes(file.id) 
                                       ? prev.filter(id => id !== file.id)
                                       : [...prev, file.id]
                                   );
                                 }}
                                 onClick={(e) => e.stopPropagation()}
                               />
                             </div>
                           </div>
                         }
                       />
                     </Card>
                   </Col>
                 ))}
               </Row>
             </div>
           )}
         </div>
       </Drawer>

       {/* 同步进度侧滑弹窗 */}
       <Drawer
         title="地图同步进度"
         placement="right"
         open={syncProgressModalVisible}
         onClose={handleCloseSyncProgress}
         width="66.67vw"
         maskClosable={false}
         closable={allSyncCompleted}
         footer={
            <div style={{ textAlign: 'center' }}>
              <Button 
                onClick={handleCloseSyncProgress}
                disabled={!allSyncCompleted}
                type="primary"
              >
                关闭
              </Button>
            </div>
          }
       >
         <div style={{ padding: '16px 0' }}>
           {/* 总体进度 */}
           <div style={{ marginBottom: '24px' }}>
             <div style={{ marginBottom: '8px', fontWeight: 500 }}>总体进度</div>
             <Progress 
               percent={Math.round((syncStatuses.filter(s => s.status === 'success' || s.status === 'failed').length / syncStatuses.length) * 100)}
               status={allSyncCompleted ? (syncStatuses.every(s => s.status === 'success') ? 'success' : 'exception') : 'active'}
               strokeColor={{
                 '0%': '#108ee9',
                 '100%': '#87d068',
               }}
             />
           </div>

           {/* 机器人同步状态列表 */}
           <List
              dataSource={syncStatuses}
              renderItem={(item: SyncStatus) => (
               <List.Item
                 style={{
                   padding: '12px 16px',
                   border: '1px solid #f0f0f0',
                   borderRadius: '6px',
                   marginBottom: '8px',
                   backgroundColor: item.status === 'failed' ? '#fff2f0' : '#fff'
                 }}
               >
                 <List.Item.Meta
                   avatar={
                     <div style={{ display: 'flex', alignItems: 'center' }}>
                       {item.status === 'pending' && <LoadingOutlined style={{ color: '#1890ff' }} />}
                       {item.status === 'syncing' && <LoadingOutlined spin style={{ color: '#1890ff' }} />}
                       {item.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                       {item.status === 'failed' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                     </div>
                   }
                   title={
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <span>{item.robotName}</span>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         {item.status === 'syncing' && (
                           <Progress 
                             type="circle" 
                             size={24} 
                             percent={item.progress}
                             showInfo={false}
                           />
                         )}
                         {item.status === 'failed' && (
                           <Button 
                              type="link" 
                              size="small" 
                              icon={<ReloadOutlined />}
                              onClick={() => handleRetryFailedSync()}
                            >
                              重试
                            </Button>
                         )}
                       </div>
                     </div>
                   }
                   description={
                     <div>
                       <div style={{ marginBottom: '4px' }}>
                         状态: <Tag color={
                           item.status === 'pending' ? 'default' :
                           item.status === 'syncing' ? 'processing' :
                           item.status === 'success' ? 'success' : 'error'
                         }>
                           {item.status === 'pending' ? '等待中' :
                            item.status === 'syncing' ? '同步中' :
                            item.status === 'success' ? '成功' : '失败'}
                         </Tag>
                       </div>
                       {item.status === 'syncing' && (
                         <div style={{ marginBottom: '4px' }}>进度: {item.progress}%</div>
                       )}
                       {item.errorMessage && (
                         <Alert 
                            message={item.errorMessage} 
                            type="error" 
                            style={{ marginTop: '8px' }}
                          />
                       )}
                       {item.startTime && (
                         <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                           开始时间: {item.startTime}
                           {item.endTime && ` | 结束时间: ${item.endTime}`}
                         </div>
                       )}
                     </div>
                   }
                 />
               </List.Item>
             )}
           />

           {/* 汇总信息 */}
           {allSyncCompleted && (
             <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
               <div style={{ fontWeight: 500, marginBottom: '8px' }}>同步完成汇总</div>
               <div>
                 成功: {syncStatuses.filter(s => s.status === 'success').length} 台 | 
                 失败: {syncStatuses.filter(s => s.status === 'failed').length} 台 | 
                 总计: {syncStatuses.length} 台
               </div>
             </div>
           )}
         </div>
       </Drawer>

       {/* 切图进度弹窗 */}
       <Drawer
         title="切图进度"
         width="66.67vw"
         placement="right"
         onClose={handleCloseSliceProgress}
         open={sliceProgressModalVisible}
         styles={{ body: { padding: '24px' } }}
         footer={
           allSliceCompleted ? (
             <div style={{ textAlign: 'center' }}>
               <Button type="primary" onClick={handleCloseSliceProgress}>
                 关闭
               </Button>
             </div>
           ) : null
         }
       >
         <div>
           {/* 机器人切图状态列表 */}
           <List
             dataSource={sliceStatuses}
             renderItem={(item: SyncStatus) => (
               <List.Item>
                 <List.Item.Meta
                   avatar={
                     <div style={{ display: 'flex', alignItems: 'center' }}>
                       {item.status === 'pending' && <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: '16px' }} />}
                       {item.status === 'syncing' && <SyncOutlined spin style={{ color: '#1890ff', fontSize: '16px' }} />}
                       {item.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />}
                       {item.status === 'failed' && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />}
                     </div>
                   }
                   title={
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span>{item.robotName}</span>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         {item.status === 'syncing' && (
                           <span style={{ fontSize: '12px', color: '#666' }}>
                             {item.progress}%
                           </span>
                         )}
                         {item.status === 'failed' && (
                           <Button 
                             size="small" 
                             type="link" 
                             onClick={() => {
                               // 重试失败的切图
                               const retryStatus = { ...item, status: 'pending' as const };
                               setSliceStatuses(prev => prev.map(s => 
                                 s.robotId === item.robotId ? retryStatus : s
                               ));
                               performSlice([retryStatus]);
                             }}
                           >
                             重试
                           </Button>
                         )}
                       </div>
                     </div>
                   }
                   description={
                     <div>
                       {item.status === 'failed' && item.errorMessage && (
                         <div style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '4px' }}>
                           {item.errorMessage}
                         </div>
                       )}
                       {item.status === 'syncing' && (
                         <Progress 
                           percent={item.progress} 
                           size="small" 
                           status="active"
                           style={{ marginTop: '8px' }}
                         />
                      )}
                      {item.startTime && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          开始时间: {item.startTime}
                          {item.endTime && ` | 结束时间: ${item.endTime}`}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />

          {/* 汇总信息 */}
          {allSliceCompleted && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
              <div style={{ fontWeight: 500, marginBottom: '8px' }}>切图完成汇总</div>
              <div>
                成功: {sliceStatuses.filter(s => s.status === 'success').length} 台 | 
                失败: {sliceStatuses.filter(s => s.status === 'failed').length} 台 | 
                总计: {sliceStatuses.length} 台
              </div>
            </div>
          )}
        </div>
      </Drawer>

       {/* 地图切图侧滑弹窗 */}
       <Drawer
         title={`地图切图 - ${slicingMapFile?.name || ''}`}
         width={`${Math.floor(window.innerWidth * 2 / 3)}px`}
         placement="right"
         onClose={() => {
           setMapSliceDrawerVisible(false);
           setSlicingMapFile(null);
           setSelectedSliceRobots([]);
           setSelectedSliceMapFiles([]);
         }}
         open={mapSliceDrawerVisible}
         styles={{ body: { padding: '24px' } }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setMapSliceDrawerVisible(false);
                 setSlicingMapFile(null);
                 setSelectedSliceRobots([]);
                 setSelectedSliceMapFiles([]);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               type="primary" 
               disabled={selectedSliceRobots.length === 0 || selectedSliceMapFiles.length === 0}
               onClick={() => handleConfirmSlice()}
               loading={loading}
             >
               确认切图 (机器人:{selectedSliceRobots.length}, 文件:{selectedSliceMapFiles.length})
             </Button>
           </div>
         }
       >
         <div>
           {/* 选择机器人部分 */}
           <div style={{ marginBottom: 32 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
               <div>
                   <div style={{ marginBottom: 8 }}>
                     <Title level={5} style={{ margin: 0, display: 'inline-block', marginRight: 16 }}>选择在线机器人设备</Title>
                     <Space size={8}>
                       <Button 
                         size="small" 
                         onClick={() => {
                           const onlineRobots = robotDevices.filter(robot => 
                             robot.isOnline && 
                             robot.isEnabled && 
                             robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                           );
                           setSelectedSliceRobots(onlineRobots.map(robot => robot.id));
                         }}
                       >
                         全选
                       </Button>
                       <Button 
                         size="small" 
                         onClick={() => setSelectedSliceRobots([])}
                       >
                         清空选择
                       </Button>
                     </Space>
                   </div>
                   <div style={{ color: '#666', fontSize: '14px' }}>
                     仅显示在线且已启用的机器人设备，支持多选。已选择 {selectedSliceRobots.length} 个机器人
                   </div>
                 </div>
               <div style={{ width: '300px' }}>
                 <Input.Search
                    placeholder="搜索机器人设备名称..."
                    value={robotSearchText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotSearchText(e.target.value)}
                    allowClear
                    style={{ width: '100%' }}
                  />
               </div>
             </div>
           
             {/* 机器人卡片滑动区域 */}
             <div style={{ position: 'relative' }}>
               {/* 左滑动按钮 */}
               <Button
                 type="text"
                 icon={<LeftOutlined />}
                 style={{
                   position: 'absolute',
                   left: '-20px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   zIndex: 10,
                   backgroundColor: '#fff',
                   border: '1px solid #d9d9d9',
                   borderRadius: '50%',
                   width: '32px',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                   transition: 'all 0.2s ease',
                   opacity: isSliding ? 0.6 : 1
                 }}
                 disabled={robotSlideIndex === 0 || isSliding}
                 onClick={() => handleRobotSlide('left')}
               />
               
               {/* 右滑动按钮 */}
               <Button
                 type="text"
                 icon={<RightOutlined />}
                 style={{
                   position: 'absolute',
                   right: '-20px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   zIndex: 10,
                   backgroundColor: '#fff',
                   border: '1px solid #d9d9d9',
                   borderRadius: '50%',
                   width: '32px',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                   transition: 'all 0.2s ease',
                   opacity: isSliding ? 0.6 : 1
                 }}
                 disabled={robotSlideIndex >= Math.ceil(robotDevices.filter(robot => 
                   robot.isOnline && 
                   robot.isEnabled && 
                   robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                 ).length / robotCardsPerPage) - 1 || isSliding}
                 onClick={() => handleRobotSlide('right')}
               />
               
               {/* 机器人卡片网格 */}
               <div style={{ 
                 overflow: 'hidden',
                 paddingBottom: '8px'
               }}>
                 <Row 
                   gutter={[12, 12]}
                   style={{
                     transform: isSliding ? 
                       (slideDirection === 'right' ? 'translateX(-30px)' : 'translateX(30px)') : 
                       'translateX(0)',
                     opacity: isSliding ? 0.3 : 1,
                     transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                     filter: isSliding ? 'blur(1px)' : 'blur(0px)'
                   }}
                 >
                   {robotDevices
                     .filter(robot => 
                       robot.isOnline && 
                       robot.isEnabled && 
                       robot.deviceName.toLowerCase().includes(robotSearchText.toLowerCase())
                     )
                     .slice(robotSlideIndex * robotCardsPerPage, (robotSlideIndex + 1) * robotCardsPerPage)
                     .map(robot => (
                       <Col key={robot.id} xs={24} sm={12} md={12} lg={6} xl={6}>
                         <Card 
                           size="small" 
                           style={{ 
                             width: '100%',
                             height: '110px',
                             border: selectedSliceRobots.includes(robot.id) ? '2px solid #1890ff' : '1px solid #e8e8e8',
                             backgroundColor: selectedSliceRobots.includes(robot.id) ? '#f0f9ff' : '#fff',
                             borderRadius: '8px',
                             cursor: 'pointer',
                             transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                             position: 'relative',
                             transform: isSliding ? 
                               `scale(0.95) translateX(${slideDirection === 'right' ? '-10px' : '10px'})` : 
                               'scale(1) translateX(0)',
                             boxShadow: isSliding ? 
                               '0 1px 4px rgba(0,0,0,0.04)' : 
                               (selectedSliceRobots.includes(robot.id) ? '0 4px 12px rgba(24,144,255,0.15)' : '0 2px 8px rgba(0,0,0,0.1)'),
                             filter: isSliding ? 'brightness(0.95)' : 'brightness(1)'
                           }}
                           styles={{ body: { padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' } }}
                           hoverable
                           onClick={() => {
                             setSelectedSliceRobots(prev => 
                               prev.includes(robot.id) 
                                 ? prev.filter(id => id !== robot.id)
                                 : [...prev, robot.id]
                             );
                           }}
                           onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                             if (!isSliding) {
                               e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                               e.currentTarget.style.boxShadow = selectedSliceRobots.includes(robot.id) ? 
                                 '0 8px 20px rgba(24,144,255,0.25)' : 
                                 '0 8px 20px rgba(0,0,0,0.15)';
                             }
                           }}
                           onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                             if (!isSliding) {
                               e.currentTarget.style.transform = 'translateY(0) scale(1)';
                               e.currentTarget.style.boxShadow = selectedSliceRobots.includes(robot.id) ? 
                                 '0 4px 12px rgba(24,144,255,0.15)' : 
                                 '0 2px 8px rgba(0,0,0,0.1)';
                             }
                           }}
                         >
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                             <Avatar 
                               icon={<RobotOutlined />} 
                               style={{ 
                                 backgroundColor: '#1890ff',
                                 border: '2px solid #e6f7ff',
                                 flexShrink: 0
                               }}
                               size={18}
                             />
                             <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                               <div style={{ 
                                 fontWeight: 600, 
                                 fontSize: '13px', 
                                 marginBottom: '4px', 
                                 color: '#262626',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                                 whiteSpace: 'nowrap'
                               }}>
                                 {robot.deviceName}
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                 <Badge 
                                   status={robot.isOnline ? 'success' : 'error'} 
                                   text={
                                     <span style={{ fontSize: '11px', fontWeight: 500 }}>
                                       {robot.isOnline ? '在线' : '离线'}
                                     </span>
                                   }
                                 />
                                 <span style={{ color: '#666', fontSize: '10px' }}>
                                   {robot.ipAddress}:{robot.port}
                                 </span>
                                 <span style={{ 
                                   color: '#999', 
                                   fontSize: '10px',
                                   overflow: 'hidden',
                                   textOverflow: 'ellipsis',
                                   whiteSpace: 'nowrap',
                                   width: '100%'
                                 }}>
                                   最近连接: {robot.lastConnectTime}
                                 </span>
                               </div>
                             </div>
                             
                             {/* 选择按钮放在右侧，与图标纵向对齐 */}
                             <Checkbox 
                               checked={selectedSliceRobots.includes(robot.id)}
                               style={{ 
                                 flexShrink: 0
                               }}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedSliceRobots(prev => 
                                   prev.includes(robot.id) 
                                     ? prev.filter(id => id !== robot.id)
                                     : [...prev, robot.id]
                                 );
                               }}
                             />
                           </div>
                         </Card>
                         </Col>
                       ))
                     }
                   </Row>
                 </div>
               </div>
             </div>

           {/* 选择地图文件部分 */}
           {slicingMapFile && (
             <div>
               <div style={{ marginBottom: 16 }}>
                 <Title level={5} style={{ margin: 0, display: 'inline-block', marginRight: 16 }}>选择地图文件</Title>
                 <Space size={8}>
                   <Button 
                     size="small" 
                     onClick={() => {
                       setSelectedSliceMapFiles([slicingMapFile.id]);
                     }}
                   >
                     选择当前文件
                   </Button>
                   <Button 
                     size="small" 
                     onClick={() => setSelectedSliceMapFiles([])}
                   >
                     清空选择
                   </Button>
                 </Space>
               </div>
               <div style={{ color: '#666', fontSize: '14px', marginBottom: 16 }}>
                 选择要切图的地图文件，默认选择当前文件。已选择 {selectedSliceMapFiles.length} 个文件
               </div>
               
               <Row gutter={[16, 16]}>
                 <Col xs={12} sm={8} md={6} lg={6} xl={4} key={slicingMapFile.id}>
                   <Card
                     size="small"
                     hoverable
                     cover={
                       <img
                         alt={slicingMapFile.name}
                         src={slicingMapFile.thumbnail}
                         style={{
                           height: 80,
                           objectFit: 'cover',
                           backgroundColor: '#f5f5f5',
                         }}
                       />
                     }
                     style={{
                       border: selectedSliceMapFiles.includes(slicingMapFile.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                       backgroundColor: selectedSliceMapFiles.includes(slicingMapFile.id) ? '#f0f9ff' : '#fff',
                       cursor: 'pointer'
                     }}
                     onClick={() => {
                       setSelectedSliceMapFiles(prev => 
                         prev.includes(slicingMapFile.id) 
                           ? prev.filter(id => id !== slicingMapFile.id)
                           : [...prev, slicingMapFile.id]
                       );
                     }}
                   >
                     <Card.Meta
                       title={
                         <div style={{ position: 'relative' }}>
                           <div 
                             style={{ 
                               fontSize: '12px',
                               fontWeight: 500,
                               overflow: 'hidden',
                               textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap'
                             }}
                             title={slicingMapFile.name}
                           >
                             {slicingMapFile.name}
                           </div>

                           <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                             <Tag 
                               size="small" 
                               color="blue"
                               style={{ fontSize: '10px' }}
                             >
                               切图文件
                             </Tag>
                             <Checkbox 
                               checked={selectedSliceMapFiles.includes(slicingMapFile.id)}
                               onChange={(e) => {
                                 e.stopPropagation();
                                 setSelectedSliceMapFiles(prev => 
                                   prev.includes(slicingMapFile.id) 
                                     ? prev.filter(id => id !== slicingMapFile.id)
                                     : [...prev, slicingMapFile.id]
                                 );
                               }}
                               onClick={(e) => e.stopPropagation()}
                             />
                           </div>
                         </div>
                       }
                     />
                   </Card>
                 </Col>
               </Row>
             </div>
           )}
         </div>
       </Drawer>

      {/* 新增地图文件侧滑抽屉 */}
      <Drawer
        title={mapFileUploadedImage?.url ? "编辑地图文件" : "新增地图文件"}
        placement="right"
        width="100vw"
        open={addMapFileDrawerVisible}
        onClose={handleCloseAddMapFileDrawer}
        destroyOnHidden
        keyboard={false} // 禁用ESC键关闭抽屉
        styles={{
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' }
        }}
        extra={
          <Space size={8}>
            <Button onClick={handleCloseAddMapFileDrawer}>
              取消
            </Button>
            {addMapFileStep === 2 && (
              <Button onClick={handleAddMapFilePrev}>
                上一步
              </Button>
            )}
            {addMapFileStep === 1 ? (
              <>
                <Button 
                  type="primary" 
                  loading={submitAndExitLoading}
                  onClick={handleCreateAndExit}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  提交
                </Button>
                <Button 
                   type="primary"
                   loading={submitAndNextLoading}
                   onClick={handleSubmitAndNext}
                   style={{ background: '#1890ff', borderColor: '#1890ff' }}
                 >
                   进入地图编辑
                 </Button>
              </>
            ) : (
              <Button 
                type="primary" 
                loading={submitAndExitLoading}
                onClick={() => addMapFileForm.submit()}
              >
                完成
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* 表单内容 */}
          <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            {addMapFileStep === 1 && (
              <Form
                form={addMapFileForm}
                layout="vertical"
                onFinish={addMapFileStep === 1 ? handleAddMapFileSubmit : undefined}
                style={{ maxWidth: 600, margin: '0 auto' }}
              >
                <Form.Item
                  label="地图名称"
                  name="mapFileName"
                  rules={[
                    { required: true, message: '请输入地图名称' },
                    { min: 2, message: '地图名称至少2个字符' },
                    { max: 50, message: '地图名称不能超过50个字符' }
                  ]}
                >
                  <Input 
                    placeholder="请输入地图名称" 
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="上传PNG图片"
                  name="mapImage"
                >
                  <Upload.Dragger
                    name="file"
                    multiple={false}
                    accept=".png"
                    beforeUpload={(file) => {
                      const isPNG = file.type === 'image/png';
                      if (!isPNG) {
                        message.error('只能上传PNG格式的图片！');
                        return false;
                      }
                      const isLt10M = file.size / 1024 / 1024 < 10;
                      if (!isLt10M) {
                        message.error('图片大小不能超过10MB！');
                        return false;
                      }
                      // 直接处理文件，不进行实际上传
                      const reader = new FileReader();
                      reader.addEventListener('load', () => {
                        const imageUrl = reader.result as string;
                        
                        // 创建Image对象获取图片尺寸
                        const img = new Image();
                        img.onload = () => {
                          const imageWidth = img.width;
                          const imageHeight = img.height;
                          const resolution = 0.05; // 分辨率：0.05米/像素
                          
                          // 根据图片尺寸和分辨率计算地图实际长宽
                          const mapWidth = imageWidth * resolution;
                          const mapHeight = imageHeight * resolution;
                          
                          // 更新mapInfo中的长宽数据
                          setMapInfo(prev => ({
                            ...prev,
                            width: Math.round(mapWidth * 100) / 100, // 保留2位小数
                            height: Math.round(mapHeight * 100) / 100, // 保留2位小数
                            resolution: resolution
                          }));
                          
                          setMapFileUploadedImage({
                            url: imageUrl,
                            name: file.name,
                            width: imageWidth,
                            height: imageHeight,
                            mapWidth: mapWidth,
                            mapHeight: mapHeight
                          });
                        };
                        img.src = imageUrl;
                      });
                      reader.readAsDataURL(file);
                      return false; // 阻止实际上传
                    }}
                    onChange={() => {}} // 空函数，因为我们在beforeUpload中处理
                    showUploadList={false}
                    style={{ background: '#fafafa' }}
                  >
                    {mapFileUploadedImage ? (
                      <div style={{ padding: '20px', position: 'relative' }}>
                        <img 
                          src={mapFileUploadedImage.url} 
                          alt="预览" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }} 
                        />
                        <div style={{ marginTop: '12px', color: '#666' }}>
                          {mapFileUploadedImage.name}
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                           <Button 
                             type="link" 
                             style={{ color: '#1890ff', padding: 0 }}
                             onClick={(e: React.MouseEvent) => {
                               e.stopPropagation();
                               // 创建隐藏的文件输入元素来触发文件选择
                               const input = document.createElement('input');
                               input.type = 'file';
                               input.accept = '.png';
                               input.onchange = (event: any) => {
                                 const file = event.target.files[0];
                                 if (file) {
                                   const isPNG = file.type === 'image/png';
                                   if (!isPNG) {
                                     message.error('只能上传PNG格式的图片！');
                                     return;
                                   }
                                   const isLt10M = file.size / 1024 / 1024 < 10;
                                   if (!isLt10M) {
                                     message.error('图片大小不能超过10MB！');
                                     return;
                                   }
                                   const reader = new FileReader();
                                   reader.addEventListener('load', () => {
                                     setMapFileUploadedImage({
                                       url: reader.result as string,
                                       name: file.name
                                     });
                                   });
                                   reader.readAsDataURL(file);
                                 }
                               };
                               input.click();
                             }}
                           >
                             重新上传
                           </Button>
                           <Button 
                             type="link" 
                             danger
                             style={{ padding: 0 }}
                             onClick={(e: React.MouseEvent) => {
                               e.stopPropagation();
                               setMapFileUploadedImage(null);
                               addMapFileForm.setFieldsValue({ mapImage: undefined });
                             }}
                           >
                             删除图片
                           </Button>
                         </div>
                        <div style={{ marginTop: '8px', color: '#1890ff', fontSize: '14px' }}>
                          点击或拖拽文件到此区域重新上传
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '40px 20px' }}>
                        <p className="ant-upload-drag-icon">
                          <FileImageOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                        </p>
                        <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
                          点击或拖拽文件到此区域上传
                        </p>
                        <p className="ant-upload-hint" style={{ color: '#999' }}>
                          仅支持 PNG 格式，文件大小不超过 10MB
                        </p>
                      </div>
                    )}
                  </Upload.Dragger>
                </Form.Item>
              </Form>
            )}

            {addMapFileStep === 2 && (
              <div style={{ 
                display: 'flex',
                height: '100vh',
                background: '#f8f9fa',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000
              }}>
                {/* 左侧工具栏 - 紧挨边缘 */}
                <div style={{
                  width: '180px',
                  background: '#fff',
                  borderRight: '1px solid #e8e8e8',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
                }}>
                  {/* 当前模式 */}
                  <Title level={5} style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>当前模式</Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>                    
                    {currentMode === 'edit' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          padding: '8px 12px',
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#52c41a',
                          textAlign: 'center',
                          fontWeight: 500
                        }}>
                          编辑模式
                        </div>
                        <Button 
                          type="default"
                          onClick={handleExitEditMode}
                          style={{
                            height: '32px',
                            fontSize: '12px',
                            borderColor: '#ff7875',
                            color: '#ff7875'
                          }}
                        >
                          退出编辑模式
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          padding: '8px 12px',
                          background: '#f0f5ff',
                          border: '1px solid #adc6ff',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#1890ff',
                          textAlign: 'center',
                          fontWeight: 500
                        }}>
                          阅览模式
                        </div>
                        <Button 
                          type="primary"
                          onClick={handleEnterEditMode}
                          style={{
                            height: '32px',
                            fontSize: '12px'
                          }}
                        >
                          进入编辑模式
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Divider style={{ margin: '0 0 16px 0' }} />
                  
                  {/* 地图类型切换 */}
                  <Title level={5} style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>地图类型</Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <Button 
                      type={mapType === 'topology' ? 'primary' : 'text'}
                      onClick={() => {
                        if (isDev) console.log('🔄 [地图切换] 切换到拓扑地图');
                        setMapType('topology');
                        // 从黑白底图切换到拓扑地图时，工具切换到选择工具
                        if (currentMode === 'edit') {
                          if (isDev) console.log('🔄 [工具切换] 拓扑地图模式下自动切换到选择工具');
                          setSelectedTool('select');
                        }
                      }}
                      style={{
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: mapType === 'topology' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: mapType === 'topology' ? '#e6f7ff' : '#fff',
                        fontSize: '13px',
                        color: mapType === 'topology' ? '#1890ff' : '#666'
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
                      type={mapType === 'grayscale' ? 'primary' : 'text'}
                      onClick={() => {
                        if (isDev) console.log('🔄 [地图切换] 切换到黑白底图，当前工具:', selectedTool);
                        setMapType('grayscale');
                        if (currentMode === 'edit') {
                          setActiveTabKey('tools'); // 自动切换到绘图工具tab
                          
                          // 智能工具切换逻辑
                          const topologyTools = ['point', 'double-line', 'single-line', 'area', 'double-bezier', 'single-bezier'];
                          
                          if (topologyTools.includes(selectedTool)) {
                            // 如果当前工具是拓扑绘图工具，先切换到选择工具（模拟ESC键效果）
                            if (isDev) console.log('🔄 [工具切换] 检测到拓扑绘图工具，先切换到选择工具完成连续操作');
                            setSelectedTool('select');
                            
                            // 然后切换到画笔工具
                            setTimeout(() => {
                              if (isDev) console.log('🔄 [工具切换] 黑白底图模式下自动切换到画笔工具');
                              setSelectedTool('brush');
                            }, 100);
                          } else {
                            // 如果当前工具不是拓扑绘图工具，直接切换到画笔
                            if (isDev) console.log('🔄 [工具切换] 黑白底图模式下自动切换到画笔工具');
                            setSelectedTool('brush');
                          }
                        }
                      }}
                      style={{
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: mapType === 'grayscale' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                        borderRadius: '6px',
                        background: mapType === 'grayscale' ? '#e6f7ff' : '#fff',
                        fontSize: '13px',
                        color: mapType === 'grayscale' ? '#1890ff' : '#666'
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
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <path d="M9 9h6v6H9z"/>
                        <path d="M3 9h6"/>
                        <path d="M9 3v6"/>
                        <path d="M15 3v6"/>
                        <path d="M21 9h-6"/>
                        <path d="M9 15v6"/>
                        <path d="M15 15v6"/>
                        <path d="M3 15h6"/>
                        <path d="M15 15h6"/>
                      </svg>
                      黑白底图
                    </Button>
                  </div>
                  
                  <Divider style={{ margin: '0 0 16px 0' }} />
                  
                  <Title level={5} style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>地图信息</Title>
                  
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
                         {mapInfo.mapName}
                       </div>
                     </div>
                    
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>地图原点 (X, Y坐标)</span>
                        {currentMode === 'edit' && (
                          <Popover
                            content={
                              <div style={{ width: 280, padding: '8px 0' }}>
                                <div style={{ marginBottom: 16 }}>
                                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: 8 }}>编辑地图原点坐标</div>
                                  <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>X坐标</div>
                                      <Input 
                                        value={tempOriginX}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempOriginX(Number(e.target.value) || 0)}
                                        placeholder="请输入X坐标"
                                        size="small"
                                        type="number"
                                      />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Y坐标</div>
                                      <Input 
                                        value={tempOriginY}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempOriginY(Number(e.target.value) || 0)}
                                        placeholder="请输入Y坐标"
                                        size="small"
                                        type="number"
                                      />
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <Button 
                                      size="small" 
                                      onClick={() => setOriginEditVisible(false)}
                                    >
                                      取消
                                    </Button>
                                    <Button 
                                      type="primary" 
                                      size="small"
                                      onClick={() => {
                                        setMapInfo({
                                          ...mapInfo,
                                          originX: tempOriginX,
                                          originY: tempOriginY
                                        });
                                        setOriginEditVisible(false);
                                        message.success('地图原点坐标已更新');
                                      }}
                                    >
                                      保存
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            }
                            title={null}
                            trigger="click"
                            open={originEditVisible}
                            onOpenChange={(visible) => {
                              if (visible) {
                                // 打开时初始化临时值
                                setTempOriginX(mapInfo.originX);
                                setTempOriginY(mapInfo.originY);
                              }
                              setOriginEditVisible(visible);
                            }}
                            placement="bottomRight"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              style={{
                                padding: '2px 4px',
                                height: 'auto',
                                color: '#1890ff'
                              }}
                            />
                          </Popover>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Input 
                          value={mapInfo.originX}
                          placeholder="X坐标"
                          size="small"
                          type="number"
                          style={{ 
                            flex: 1,
                            backgroundColor: '#f5f5f5',
                            color: '#999'
                          }}
                          readOnly
                        />
                        <Input 
                          value={mapInfo.originY}
                          placeholder="Y坐标"
                          size="small"
                          type="number"
                          style={{ 
                            flex: 1,
                            backgroundColor: '#f5f5f5',
                            color: '#999'
                          }}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '4px' 
                      }}>
                        地图方向
                        {currentMode === 'edit' && (
                          <Popover
                            content={
                              <div style={{ width: '200px' }}>
                                <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>
                                  编辑地图方向
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <Input 
                                    value={tempDirection}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempDirection(Number(e.target.value) || 0)}
                                    placeholder="请输入地图方向（-180到180）"
                                    size="small"
                                    type="number"
                                    min="-180"
                                    max="180"
                                    addonAfter="°"
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <Button 
                                    size="small"
                                    onClick={() => setDirectionEditVisible(false)}
                                  >
                                    取消
                                  </Button>
                                  <Button 
                                    type="primary" 
                                    size="small"
                                    onClick={() => {
                                      setMapInfo({
                                        ...mapInfo,
                                        direction: tempDirection
                                      });
                                      setDirectionEditVisible(false);
                                      message.success('地图方向已更新');
                                    }}
                                  >
                                    保存
                                  </Button>
                                </div>
                              </div>
                            }
                            title={null}
                            trigger="click"
                            open={directionEditVisible}
                            onOpenChange={(visible) => {
                              if (visible) {
                                // 打开时初始化临时值
                                setTempDirection(mapInfo.direction);
                              }
                              setDirectionEditVisible(visible);
                            }}
                            placement="bottomRight"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              style={{
                                padding: '2px 4px',
                                height: 'auto',
                                color: '#1890ff'
                              }}
                            />
                          </Popover>
                        )}
                      </div>
                      <Input 
                        value={mapInfo.direction}
                        placeholder="地图方向"
                        size="small"
                        type="number"
                        addonAfter="°"
                        style={{ 
                          backgroundColor: '#f5f5f5',
                          color: '#999'
                        }}
                        readOnly
                      />
                    </div>
                    
                    <div>
                       <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>地图长宽 (单位: m)</div>
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
                           长: {mapInfo.width}m
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
                           宽: {mapInfo.height}m
                         </div>
                       </div>
                     </div>
                     
                     <div>
                       <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>机器人扫图范围</div>
                       <div style={{ 
                         fontSize: '14px', 
                         fontWeight: 500, 
                         padding: '4px 11px',
                         border: '1px solid #d9d9d9',
                         borderRadius: '6px',
                         backgroundColor: '#e6f7ff',
                         color: '#1890ff',
                         textAlign: 'center'
                       }}>
                         {calculateScanArea()} m²
                       </div>
                     </div>
                    
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '4px' 
                      }}>
                        分辨率 (m/pixel)
                        {currentMode === 'edit' && (
                          <Popover
                            content={
                              <div style={{ width: '200px' }}>
                                <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>
                                  编辑分辨率
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <Input 
                                    value={tempResolution}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempResolution(Number(e.target.value) || 0)}
                                    placeholder="请输入分辨率"
                                    size="small"
                                    type="number"
                                    step="0.001"
                                    min="0"
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <Button 
                                    size="small"
                                    onClick={() => setResolutionEditVisible(false)}
                                  >
                                    取消
                                  </Button>
                                  <Button 
                                    type="primary" 
                                    size="small"
                                    onClick={() => {
                                      setMapInfo({
                                        ...mapInfo,
                                        resolution: tempResolution
                                      });
                                      setResolutionEditVisible(false);
                                      message.success('分辨率已更新');
                                    }}
                                  >
                                    保存
                                  </Button>
                                </div>
                              </div>
                            }
                            title={null}
                            trigger="click"
                            open={resolutionEditVisible}
                            onOpenChange={(visible) => {
                              if (visible) {
                                // 打开时初始化临时值
                                setTempResolution(mapInfo.resolution);
                              }
                              setResolutionEditVisible(visible);
                            }}
                            placement="bottomRight"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              style={{
                                padding: '2px 4px',
                                height: 'auto',
                                color: '#1890ff'
                              }}
                            />
                          </Popover>
                        )}
                      </div>
                      <Input 
                        value={mapInfo.resolution}
                        placeholder="分辨率"
                        size="small"
                        type="number"
                        style={{ 
                          backgroundColor: '#f5f5f5',
                          color: '#999'
                        }}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>比例换算</div>
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
                        {calculateScale()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px', textAlign: 'center' }}>
                        1像素对应实际距离的比例
                      </div>
                    </div>
                  </div>
                  

                </div>
                
                {/* 中间画布区域 - 最大化绘图区域 */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff'
                }}>
                  {/* 悬浮工具栏 - 重新布局 */}
                  {/* 左侧：搜索功能（放在绘图工具右边） */}
                  <div style={{
                    position: 'absolute',
                    left: '200px', // 绘图工具宽度180px + 20px间距
                    top: '16px',
                    transform: 'translateY(0)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 1000
                  }}>
                    <Radio.Group 
                       value={searchType} 
                       onChange={(e: RadioChangeEvent) => setSearchType(e.target.value)}
                       style={{ height: 36 }}
                     >
                      <Radio.Button value="line">线名称</Radio.Button>
                      <Radio.Button value="point">点名称</Radio.Button>
                    </Radio.Group>
                    <Input.Search
                      placeholder={`搜索${searchType === 'line' ? '线名称' : '点名称'}...`}
                      value={searchValue}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                      onSearch={handleSearch}
                      style={{ width: 250, height: 36 }}
                    />
                  </div>

                  {/* 右侧：操作按钮和显示地图信息（上下排列，放在地图基本信息左边） */}
                  <div style={{
                    position: 'absolute',
                    right: '280px', // 地图基本信息面板宽度260px + 20px间距
                    top: '16px',
                    transform: 'translateY(0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'flex-end',
                    zIndex: 1000
                  }}>
                    {/* 操作按钮 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Button 
                        onClick={currentMode === 'view' ? handleCloseAddMapFileDrawer : handleCancel}
                        style={{ 
                          borderColor: '#faad14', 
                          color: '#fff', 
                          background: '#faad14', 
                          minWidth: '80px', 
                          height: '36px', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                        }}
                      >
                        取消
                      </Button>
                      {/* 编辑模式下显示提交按钮 */}
                      {currentMode === 'edit' && (
                        <>
                          <Button 
                            type="primary" 
                            onClick={handleSubmitAndExit}
                            style={{ background: '#1890ff', borderColor: '#1890ff', minWidth: '80px', height: '36px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                          >
                            提交
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 画布主体 */}
                  <div 
                    id="map-editor-canvas"
                    className="map-editor-canvas"
                    ref={canvasRef}
                    style={{
                      flex: 1,
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#f5f5f5',
                      cursor: (dragTool || isSpacePressed) ? 'grab' : (isDragging ? 'grabbing' : getCanvasCursor()),
                      userSelect: 'none'  // 防止文本选择
                    }}
                    onClick={(dragTool || isSpacePressed) ? undefined : (selectedTool === 'brush' ? handleBrushClick : (selectedTool === 'eraser' ? handleEraserClick : handleCanvasClick))}
                    onDoubleClick={(dragTool || isSpacePressed) ? undefined : handleCanvasDoubleClick}
                    onMouseDown={(dragTool || isSpacePressed) ? handleCanvasDrag : (selectedTool === 'brush' ? handleBrushStart : (selectedTool === 'eraser' ? handleEraserStart : (selectedTool === 'select' ? handleSelectionStart : handleCanvasDrag)))}
                    onMouseMove={(dragTool || isSpacePressed) ? handleCanvasMouseMove : (selectedTool === 'brush' ? handleBrushMove : (selectedTool === 'eraser' ? handleEraserMove : handleCanvasMouseMove))}
                    onMouseUp={selectedTool === 'brush' ? handleBrushEnd : (selectedTool === 'eraser' ? handleEraserEnd : undefined)}
                    onContextMenu={handleSelectionContextMenu}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                  >
                    {/* 动态网格背景 - Canvas实现，自动适应缩放 */}
                    <canvas
                      ref={gridCanvasRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',  // 确保网格不会阻挡鼠标事件
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
                    
                    {/* PNG图片背景层 - 在画布变换容器内部，最底层 */}
                    {mapFileUploadedImage && (
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 0,
                        pointerEvents: 'none'
                      }}>
                        <img 
                          src={mapFileUploadedImage.url}
                          alt="地图背景"
                          style={{
                            maxWidth: '100vw', // 限制最大宽度为视口宽度
                            maxHeight: '100vh', // 限制最大高度为视口高度
                            width: 'auto', // 保持宽高比
                            height: 'auto', // 保持宽高比
                            opacity: 1.0,
                            userSelect: 'none',
                            pointerEvents: 'none'
                          }}
                        />
                        {/* Canvas覆盖层用于PNG像素擦除 */}
                        <canvas
                          ref={pngCanvasRef}
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
                      </div>
                    )}
                    
                    {/* 框选区域 */}
                    <div 
                      style={getSelectionBoxStyle()}
                      onMouseDown={handleSelectionMouseDown}
                    >
                    </div>
                    
                    {/* 选中点的中心控制手柄 - 只在选中单个点时显示 */}
                    {selectedPoints.length === 1 && currentMode === 'edit' && (() => {
                      // 计算选中点的中心位置
                      const selectedPointsData = mapPoints.filter(point => selectedPoints.includes(point.id));
                      if (selectedPointsData.length === 0) return null;
                      
                      const centerX = selectedPointsData.reduce((sum, point) => sum + point.x, 0) / selectedPointsData.length;
                      const centerY = selectedPointsData.reduce((sum, point) => sum + point.y, 0) / selectedPointsData.length;
                      
                      return (
                        <div style={{
                          position: 'absolute',
                          left: centerX,
                          top: centerY,
                          transform: 'translate(-50%, -50%)',
                          width: '120px',
                          height: '120px',
                          zIndex: 15,
                          pointerEvents: 'auto'
                        }}>
                          {/* 上移按钮 */}
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<UpOutlined />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePointMove('up');
                            }}
                            style={{
                              position: 'absolute',
                              top: '0px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '32px',
                              height: '32px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              borderColor: '#d9d9d9',
                              color: '#666',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="向上移动"
                            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                          
                          {/* 下移按钮 */}
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<DownOutlined />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePointMove('down');
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '0px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '32px',
                              height: '32px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              borderColor: '#d9d9d9',
                              color: '#666',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="向下移动"
                            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                          
                          {/* 左移按钮 */}
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<LeftOutlined />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePointMove('left');
                            }}
                            style={{
                              position: 'absolute',
                              left: '0px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '32px',
                              height: '32px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              borderColor: '#d9d9d9',
                              color: '#666',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="向左移动"
                            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                          
                          {/* 右移按钮 */}
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<RightOutlined />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePointMove('right');
                            }}
                            style={{
                              position: 'absolute',
                              right: '0px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '32px',
                              height: '32px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              borderColor: '#d9d9d9',
                              color: '#666',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="向右移动"
                            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                          
                          {/* 右下角顺时针旋转按钮 */}
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<RotateRightOutlined />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePointRotate();
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              width: '24px',
                              height: '24px',
                              background: 'rgba(255, 193, 7, 0.9)',
                              borderColor: '#ffc107',
                              color: '#fff',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px'
                            }}
                            title="顺时针旋转90度"
                            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                          
                          {/* 左下角逆时针旋转按钮 */}
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<RotateLeftOutlined />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePointRotateCounterClockwise();
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: '8px',
                              width: '24px',
                              height: '24px',
                              background: 'rgba(255, 193, 7, 0.9)',
                              borderColor: '#ffc107',
                              color: '#fff',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px'
                            }}
                            title="逆时针旋转90度"
                            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                        </div>
                      );
                    })()}
                    
                    {/* 连线SVG层 */}
                    <svg
                      ref={svgRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'auto', // 允许SVG接收事件
                        zIndex: 5
                      }}
                      onClick={(e) => {
                        // 检查区域点击标记，如果刚刚点击了区域，则跳过SVG事件处理
                        if (isDev) console.log('🔍 [SVG点击调试] 检查区域点击标记', {
                          标记状态: areaClickedFlag.current,
                          时间戳: new Date().toISOString()
                        });
                        
                        if (areaClickedFlag.current) {
                          if (isDev) console.log('🔍 [SVG点击调试] 检测到区域点击标记，跳过SVG事件处理');
                          return;
                        }
                        
                        if (isDev) console.log('🔍 [SVG点击调试] SVG onClick事件触发', {
                          目标元素: (e.target as Element).tagName,
                          目标类名: (e.target as Element).className,
                          是否为SVG本身: e.target === e.currentTarget,
                          是否为polygon: (e.target as Element).tagName === 'polygon',
                          是否为path: (e.target as Element).tagName === 'path',
                          是否为circle: (e.target as Element).tagName === 'circle',
                          时间戳: new Date().toISOString()
                        });
                        
                        // 检查点击的是否为区域、点、线等元素
                        const target = e.target as Element;
                        const isAreaElement = target.tagName === 'path' || target.tagName === 'polygon';
                        const isPointElement = target.tagName === 'circle';
                        const isLineElement = target.tagName === 'line' || target.tagName === 'polyline';
                        const isInteractiveElement = isAreaElement || isPointElement || isLineElement;
                        
                        // 只有点击SVG本身（空白区域）才触发画布点击
                        const isClickingSVGBackground = e.target === e.currentTarget;
                        
                        if (isDev) console.log('🔍 [SVG点击调试] 点击区域判断', {
                          点击目标: target.tagName,
                          是否为区域元素: isAreaElement,
                          是否为点元素: isPointElement,
                          是否为线元素: isLineElement,
                          是否为交互元素: isInteractiveElement,
                          是否点击SVG背景: isClickingSVGBackground,
                          最终是否触发画布点击: isClickingSVGBackground
                        });
                        
                        if (!isClickingSVGBackground) {
                          // 检查是否点击了区域元素且当前工具不是选择工具
                          if (isAreaElement && selectedTool !== 'select') {
                            if (isDev) console.log('🔍 [SVG点击调试] 点击了区域元素但当前工具不是选择工具，允许事件冒泡以支持在区域内绘制');
                            // 在非选择工具模式下，允许在区域内绘制点和线
                            // 不阻止事件冒泡，让事件传递到画布容器处理
                          } else {
                            if (isDev) console.log('🔍 [SVG点击调试] 点击了SVG子元素，阻止事件冒泡到画布容器');
                            // 只有在选择工具模式下点击区域，或点击其他SVG子元素时才阻止事件冒泡
                            e.stopPropagation();
                          }
                        } else {
                          if (isDev) console.log('🔍 [SVG点击调试] 点击SVG空白区域，让事件冒泡到画布容器处理');
                        }
                      }}
                      onMouseDown={(e) => {
                        // 只有在SVG空白区域的鼠标按下事件才传递给框选处理
                        if (e.target === e.currentTarget) {
                          const parentElement = e.currentTarget.parentElement as HTMLDivElement;
                          const syntheticEvent = {
                            ...e,
                            currentTarget: parentElement,
                            target: parentElement,
                            preventDefault: () => e.preventDefault(),
                            stopPropagation: () => e.stopPropagation()
                          } as unknown as React.MouseEvent<HTMLDivElement>;
                          handleSelectionStart(syntheticEvent);
                        }
                      }}
                      onMouseMove={(e) => {
                        // 计算鼠标在画布上的位置
                        const { x, y } = screenToCanvasCoordinates(e.clientX, e.clientY, canvasRef.current!);
                        
                        // 在连线模式下更新鼠标位置
                        const shouldUpdateMousePosition = (isConnecting || continuousConnecting) && (connectingStartPoint || lastConnectedPoint);

                        if (shouldUpdateMousePosition) {
                          updateMousePositionOptimized(x, y);
                        }
                        // else 分支暂时无需处理
                        
                        // 在区域绘制模式下更新鼠标位置
                        if (isDrawingArea && currentAreaPoints.length > 0) {
                          setMousePosition({ x, y });
                        }
                        
                        // 处理控制手柄拖拽
                        if (isDraggingControlHandle && selectedControlHandle) {
                          handleControlHandleDrag(e);
                        }
                        
                        // 处理点拖拽
                        if (isDraggingPoint && draggingPointId) {
                          handlePointDrag(e);
                        }
                        
                        // 处理框选区域拖拽
                        if (isDraggingSelection) {
                          handleSelectionDrag(e);
                        }
                      }}
                      onMouseEnter={(e) => {
                        // 鼠标进入SVG区域时，如果处于连线或区域绘制模式，重新设置鼠标位置
                        if (isConnecting || continuousConnecting || isDrawingArea) {
                          const canvasElement = e.currentTarget.closest('.canvas-container') as HTMLDivElement;
                          if (canvasElement) {
                            const { x, y } = screenToCanvasCoordinates(e.clientX, e.clientY, canvasElement);
                            updateMousePositionOptimized(x, y);
                          }
                        }
                      }}
                      onMouseLeave={() => {
                        // 鼠标离开SVG区域时清除鼠标位置
                        if (isConnecting || continuousConnecting || isDrawingArea) {
                          setMousePosition(null);
                        }
                      }}
                      onMouseUp={() => {
                        // 处理控制手柄拖拽结束
                        if (isDraggingControlHandle) {
                          handleControlHandleDragEnd();
                        }
                        
                        // 处理点拖拽结束
                        if (isDraggingPoint) {
                          handlePointDragEnd();
                        }
                        
                        // 处理框选区域拖拽结束
                        if (isDraggingSelection) {
                          handleSelectionDragEnd();
                        }
                      }}
                    >
                      {/* 渲染所有笔画 - 按时间戳顺序统一渲染，支持正确的叠加绘制 */}
                      {(() => {
                        // 按时间戳排序所有笔画，确保按绘制顺序渲染
                        const sortedStrokes = [...allStrokes].sort((a, b) => a.timestamp - b.timestamp);
                        
                        return (
                          <g>
                            {/* 渲染所有已完成的笔画 */}
                            {sortedStrokes.map((stroke, index) => {
                              const isEraser = stroke.type === 'eraser';
                              const strokeColor = isEraser ? '#FFFFFF' : '#000000';
                              const strokeSize = stroke.size;
                              
                              if (stroke.points.length === 1) {
                                // 单点笔画，渲染为圆圈
                                const point = stroke.points[0];
                                return (
                                  <circle
                                    key={`stroke-${stroke.id}-${index}`}
                                    cx={point.x}
                                    cy={point.y}
                                    r={strokeSize}
                                    fill={strokeColor}
                                    stroke={isEraser ? '#CCCCCC' : 'none'}
                                    strokeWidth={isEraser ? '0.5' : '0'}
                                  />
                                );
                              } else if (stroke.points.length >= 2) {
                                // 多点笔画，渲染为路径
                                const pathData = stroke.points.reduce((path, point, pointIndex) => {
                                  if (pointIndex === 0) {
                                    return `M ${point.x} ${point.y}`;
                                  } else {
                                    return `${path} L ${point.x} ${point.y}`;
                                  }
                                }, '');
                                
                                return (
                                  <path
                                    key={`stroke-${stroke.id}-${index}`}
                                    d={pathData}
                                    stroke={strokeColor}
                                    strokeWidth={strokeSize}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                );
                              }
                              return null;
                            })}
                            
                            {/* 渲染当前正在绘制的画笔笔画 */}
                            {isDrawing && currentStroke.length > 0 && (() => {
                              if (currentStroke.length === 1) {
                                // 单点，渲染为圆圈
                                const point = currentStroke[0];
                                return (
                                  <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={6 /* brushSize */}
                                    fill="#000000"
                                    stroke="none"
                                    opacity="0.7"
                                  />
                                );
                              } else {
                                // 多点，渲染为路径
                                const pathData = currentStroke.reduce((path, point, pointIndex) => {
                                  if (pointIndex === 0) {
                                    return `M ${point.x} ${point.y}`;
                                  } else {
                                    return `${path} L ${point.x} ${point.y}`;
                                  }
                                }, '');
                                
                                return (
                                  <path
                                    d={pathData}
                                    stroke="#000000"
                                    strokeWidth={6 /* brushSize */}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.7"
                                  />
                                );
                              }
                            })()}
                            
                            {/* 渲染当前正在绘制的橡皮擦笔画 */}
                            {isErasing && currentEraserStroke.length > 0 && (() => {
                              if (currentEraserStroke.length === 1) {
                                // 单点，渲染为白色圆圈
                                const point = currentEraserStroke[0];
                                return (
                                  <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={6 /* eraserSize */}
                                    fill="#FFFFFF"
                                    stroke="#CCCCCC"
                                    strokeWidth="0.5"
                                    opacity="0.7"
                                  />
                                );
                              } else {
                                // 多点，渲染为白色路径
                                const pathData = currentEraserStroke.reduce((path, point, pointIndex) => {
                                  if (pointIndex === 0) {
                                    return `M ${point.x} ${point.y}`;
                                  } else {
                                    return `${path} L ${point.x} ${point.y}`;
                                  }
                                }, '');
                                
                                return (
                                  <path
                                    d={pathData}
                                    stroke="#FFFFFF"
                                    strokeWidth={6 /* eraserSize */}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.7"
                                  />
                                );
                              }
                            })()}
                          </g>
                        );
                      })()}

                      {/* 渲染已完成的区域 - 放在黑白底图之上，仅在拓扑地图模式下显示 */}
                      {mapType === 'topology' && mapAreas.map((area) => {
                        if (area.points.length < 3) return null;
                        
                        // 构建SVG路径字符串
                        const pathData = area.points.reduce((path, point, index) => {
                          if (index === 0) {
                            return `M ${point.x} ${point.y}`;
                          } else {
                            return `${path} L ${point.x} ${point.y}`;
                          }
                        }, '') + ' Z'; // Z命令闭合路径
                        
                        const isSelected = selectedAreas.includes(area.id);
                        const areaColors = getAreaColors(area);
                        
                        // 将区域描边颜色转换为rgba格式用于阴影
                        const getShadowColor = (strokeColor: string) => {
                          // 如果是十六进制颜色，转换为rgba
                          if (strokeColor.startsWith('#')) {
                            const r = parseInt(strokeColor.slice(1, 3), 16);
                            const g = parseInt(strokeColor.slice(3, 5), 16);
                            const b = parseInt(strokeColor.slice(5, 7), 16);
                            return `rgba(${r}, ${g}, ${b}, 0.6)`;
                          }
                          // 如果已经是rgba或rgb格式，直接使用
                          return strokeColor.includes('rgba') ? strokeColor : strokeColor.replace('rgb', 'rgba').replace(')', ', 0.6)');
                        };
                        
                        return (
                          <g key={area.id}>
                            {/* 区域填充 */}
                            <path
                              d={pathData}
                              fill={areaColors.fillColor}
                              fillOpacity={area.opacity || 0.3}
                              stroke={areaColors.strokeColor}
                              strokeWidth={isSelected ? '3' : '2'}
                              strokeOpacity="0.8"
                              style={{
                                cursor: 'pointer',
                                filter: isSelected ? `drop-shadow(0 0 8px ${getShadowColor(areaColors.strokeColor)})` : 'none'
                              }}
                              onClick={(e) => {
                                if (isDev) console.log('🔍 [区域点击调试] 区域被点击', {
                                  区域ID: area.id,
                                  区域名称: area.name,
                                  当前工具: selectedTool,
                                  当前选中区域: selectedAreas,
                                  事件目标: e.target,
                                  时间戳: new Date().toISOString()
                                });
                                
                                // 只有在选择工具模式下才阻止事件传播和处理区域选择
                                if (selectedTool === 'select') {
                                  if (isDev) console.log('🔍 [区域点击调试] 选择工具模式 - 阻止事件传播');
                                  
                                  // 记录鼠标点击位置到lastClickPosition
                                  const canvasElement = e.currentTarget.closest('.map-canvas') as HTMLDivElement;
                                  if (canvasElement) {
                                    const { x, y } = screenToCanvasCoordinates(e.clientX, e.clientY, canvasElement);
                                    setLastClickPosition({ x, y });
                                    if (isDev) console.log('🔍 [区域点击调试] 记录鼠标位置:', { x, y });
                                  }
                                  
                                  // 立即设置区域点击标记，阻止SVG事件触发
                                  areaClickedFlag.current = true;
                                  if (isDev) console.log('🔍 [区域点击调试] 设置区域点击标记为true');
                                  
                                  e.stopPropagation();
                                  e.preventDefault();
                                  e.nativeEvent.stopImmediatePropagation();
                                  
                                  setSelectedAreas(prev => {
                                    const isCurrentlySelected = prev.includes(area.id);
                                    // 单选模式：点击新区域时取消之前的选择，只选中当前区域
                                    const newSelectedAreas = isCurrentlySelected 
                                      ? []  // 如果已选中，取消选中（点击已选中区域取消选择）
                                      : [area.id];  // 如果未选中，只选中当前区域（取消其他区域的选择）
                                    
                                    if (isDev) console.log('🔍 [区域选择状态调试] 区域单选状态变化', {
                                      区域ID: area.id,
                                      区域名称: area.name,
                                      之前是否选中: isCurrentlySelected,
                                      操作类型: isCurrentlySelected ? '取消选中' : '单选',
                                      变化前选中区域: prev,
                                      变化后选中区域: newSelectedAreas,
                                      时间戳: new Date().toISOString()
                                    });
                                    
                                    return newSelectedAreas;
                                  });
                                  
                                  // 短暂标记重置时间，避免影响框选功能
                                  setTimeout(() => {
                                    areaClickedFlag.current = false;
                                    if (isDev) console.log('🔍 [区域点击调试] 重置区域点击标记为false');
                                  }, 50);
                                  
                                  return;
                                } else {
                                  if (isDev) console.log('🔍 [区域点击调试] 非选择工具模式 - 允许事件传播到画布');
                                  // 在其他工具模式下，允许事件传播到画布，这样可以在区域内绘制点和线
                                  // 不调用 e.stopPropagation()，让事件继续冒泡到SVG的onClick处理
                                }
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleAreaDoubleClick(e, area);
                              }}
                            />
                            
                            {/* 区域中心点标识（选中时显示） */}
                            {isSelected && (() => {
                              // 计算区域中心点
                              const centerX = area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length;
                              const centerY = area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length;
                              const areaColors = getAreaColors(area);
                              
                              return (
                                <g>
                                  <circle
                                    cx={centerX}
                                    cy={centerY}
                                    r="6"
                                    fill={areaColors.strokeColor}
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                    opacity="0.9"
                                  />
                                  {/* 区域名称标签 */}
                                  <text
                                    x={centerX}
                                    y={centerY - 15}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill={areaColors.strokeColor}
                                    fontWeight="bold"
                                    style={{ pointerEvents: 'none' }}
                                  >
                                    {area.name}
                                  </text>
                                </g>
                              );
                            })()}
                            
                            {/* 区域顶点编辑圆圈（选中时显示） */}
                            {isSelected && area.points.map((point, index) => {
                              const isVertexSelected = selectedVertices.some(
                                v => v.areaId === area.id && v.vertexIndex === index
                              );
                              
                              // 获取区域的颜色
                              const areaColors = getAreaColors(area);
                              
                              return (
                                <circle
                                  key={`${area.id}-vertex-${index}`}
                                  cx={point.x}
                                  cy={point.y}
                                  r={isVertexSelected ? "6" : "4"}
                                  fill={isVertexSelected ? areaColors.strokeColor : "#ffffff"}
                                  stroke={areaColors.strokeColor}
                                  strokeWidth={isVertexSelected ? "3" : "2"}
                                  opacity="0.9"
                                  style={{
                                    cursor: 'pointer',
                                    filter: isVertexSelected 
                                      ? `drop-shadow(0 2px 6px ${areaColors.strokeColor}40)` 
                                      : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isDev) console.log(`🎯 [区域顶点] 点击了区域 ${area.id} 的第 ${index} 个顶点`, point);
                                    
                                    // 实现顶点选中逻辑
                                    const vertexKey = { areaId: area.id, vertexIndex: index };
                                    const isVertexSelected = selectedVertices.some(
                                      v => v.areaId === area.id && v.vertexIndex === index
                                    );
                                    
                                    if (e.ctrlKey || e.metaKey) {
                                      // Ctrl/Cmd + 点击：多选顶点
                                      if (isVertexSelected) {
                                        setSelectedVertices(prev => prev.filter(
                                          v => !(v.areaId === area.id && v.vertexIndex === index)
                                        ));
                                      } else {
                                        setSelectedVertices(prev => [...prev, vertexKey]);
                                      }
                                    } else {
                                      // 单击：切换顶点选中状态
                                      if (isVertexSelected) {
                                        // 如果顶点已选中，则取消选中
                                        setSelectedVertices(prev => prev.filter(
                                          v => !(v.areaId === area.id && v.vertexIndex === index)
                                        ));
                                      } else {
                                        // 如果顶点未选中，则选中该顶点
                                        setSelectedVertices([vertexKey]);
                                        // 清除点和线的选中状态，但保留区域选中状态
                                        setSelectedPoints([]);
                                        setSelectedLines([]);
                                      }
                                      // 注意：不清除区域选中状态，允许顶点选择和区域选择同时存在
                                    }
                                    
                                    if (isDev) console.log('🔄 [区域顶点] 顶点选中状态更新', {
                                       areaId: area.id,
                                       vertexIndex: index,
                                       isSelected: !isVertexSelected,
                                       totalSelected: selectedVertices.length
                                     });
                                   }}
                                   onMouseEnter={(e) => {
                                     const currentRadius = isVertexSelected ? '6' : '4';
                                     e.currentTarget.setAttribute('r', String(parseInt(currentRadius) + 1));
                                     if (!isVertexSelected) {
                                       e.currentTarget.setAttribute('fill', areaColors.strokeColor);
                                     }
                                   }}
                                   onMouseLeave={(e) => {
                                     const currentRadius = isVertexSelected ? '6' : '4';
                                     e.currentTarget.setAttribute('r', currentRadius);
                                     if (!isVertexSelected) {
                                       e.currentTarget.setAttribute('fill', '#ffffff');
                                     }
                                   }}
                                 />
                                );
                              })}
                            </g>
                          );
                        })}
                        
                        {/* 渲染线条 - 仅在拓扑地图模式下显示，且未隐藏所有路径时显示 */}
                        {mapType === 'topology' && !hideAllPaths && (() => {
                          // 根据路网组的visible状态过滤显示的路径
                          const visibleLines = mapLines.filter(line => {
                            // 查找包含此路径的路网组
                            const containingNetworkGroup = networkGroups.find(group => 
                              group.paths.some(path => path.id === line.id || path.name === line.name)
                            );
                            
                            // 调试信息
                            if (isDev) console.log(`路径 ${line.id} (${line.name}):`, {
                              containingNetworkGroup: containingNetworkGroup ? {
                                id: containingNetworkGroup.id,
                                name: containingNetworkGroup.name,
                                visible: containingNetworkGroup.visible
                              } : null,
                              shouldShow: containingNetworkGroup ? containingNetworkGroup.visible : true
                            });
                            
                            // 如果路径不属于任何路网组，则默认显示
                            if (!containingNetworkGroup) {
                              return true;
                            }
                            
                            // 如果路径属于某个路网组，则根据该路网组的visible状态决定是否显示
                            return containingNetworkGroup.visible;
                          });
                          
                          if (isDev) console.log('可见路径数量:', visibleLines.length, '总路径数量:', mapLines.length);
                          
                          return visibleLines.map(line => renderLine(line));
                        })()}



                      
                      {/* 临时跟随线条 - 连线模式下显示，仅在拓扑地图模式下显示 */}
                      {mapType === 'topology' && (() => {
                        // 检查虚线渲染条件
                        const hasConnectingState = isConnecting || continuousConnecting;
                        const hasStartPoint = connectingStartPoint || lastConnectedPoint;
                        const shouldRenderDashedLine = hasConnectingState && hasStartPoint;
                        

                        
                        if (!shouldRenderDashedLine) {
                    
                          return null;
                        }
                        
                        // 在连续连线模式下，优先使用lastConnectedPoint作为起点
                        const startPointId = lastConnectedPoint || connectingStartPoint;
                    
                        const startPoint = mapPoints.find(p => p.id === startPointId);
                        if (!startPoint) {
                    
                          return null;
                        }
                        
                        // 使用实时鼠标位置引用，避免React状态更新延迟
                        const currentMousePosition = mousePositionRef.current;
                        if (!currentMousePosition) {
                    
                          return null;
                        }
                        
                    
                        
                        return (
                          <line
                            x1={startPoint.x}
                            y1={startPoint.y}
                            x2={currentMousePosition.x}
                            y2={currentMousePosition.y}
                            stroke="#1890ff"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            opacity="0.7"
                            style={{ 
                              pointerEvents: 'none',
                              vectorEffect: 'non-scaling-stroke',
                              shapeRendering: 'optimizeSpeed'
                            }}
                          />
                        );
                      })()}
                      
                      {/* 区域绘制临时视觉反馈 - 仅在拓扑地图模式下显示 */}
                      {mapType === 'topology' && isDrawingArea && currentAreaPoints.length > 0 && (() => {
                        const points = currentAreaPoints;
                        
                        return (
                          <g>
                            {/* 临时填充预览 - 当有2个或以上点且鼠标位置存在时 */}
                            {points.length >= 2 && mousePosition && (() => {
                              // 构建包含鼠标位置的临时路径
                              const tempPoints = [...points, mousePosition];
                              const pathData = tempPoints.reduce((path, point, index) => {
                                if (index === 0) {
                                  return `M ${point.x} ${point.y}`;
                                } else {
                                  return `${path} L ${point.x} ${point.y}`;
                                }
                              }, '') + ' Z'; // Z命令闭合路径
                              
                              return (
                                <path
                                  d={pathData}
                                  fill="#1890ff" // 蓝色填充
                                  fillOpacity="0.2"
                                  stroke="#1890ff" // 蓝色描边
                                  strokeWidth="2"
                                  strokeDasharray="5,5"
                                  strokeOpacity="0.6"
                                  style={{ pointerEvents: 'none' }}
                                />
                              );
                            })()}
                            
                            {/* 绘制已有点之间的连线 */}
                            {points.map((point, index) => {
                              if (index === 0) return null;
                              const prevPoint = points[index - 1];
                              return (
                                <line
                                  key={`area-line-${index}`}
                                  x1={prevPoint.x}
                                  y1={prevPoint.y}
                                  x2={point.x}
                                  y2={point.y}
                                  stroke="#1890ff"
                                  strokeWidth="2"
                                  strokeDasharray="5,5"
                                  opacity="0.8"
                                  style={{ pointerEvents: 'none' }}
                                />
                              );
                            })}
                            
                            {/* 如果有3个或更多点，绘制从最后一个点到第一个点的虚线（预览闭合效果） */}
                            {points.length >= 3 && (
                              <line
                                x1={points[points.length - 1].x}
                                y1={points[points.length - 1].y}
                                x2={points[0].x}
                                y2={points[0].y}
                                stroke="#1890ff"
                                strokeWidth="2"
                                strokeDasharray="10,5"
                                opacity="0.6"
                                style={{ pointerEvents: 'none' }}
                              />
                            )}
                            
                            {/* 鼠标跟随线 - 从最后一个点到鼠标位置 */}
                            {mousePosition && points.length > 0 && (
                              <line
                                x1={points[points.length - 1].x}
                                y1={points[points.length - 1].y}
                                x2={mousePosition.x}
                                y2={mousePosition.y}
                                stroke="#1890ff"
                                strokeWidth="2"
                                strokeDasharray="3,3"
                                opacity="0.5"
                                style={{ pointerEvents: 'none' }}
                              />
                            )}
                            
                            {/* 绘制临时区域点 */}
                            {points.map((point, index) => (
                              <circle
                                key={`area-point-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="#1890ff"
                                stroke="#ffffff"
                                strokeWidth="2"
                                opacity="0.9"
                                style={{ pointerEvents: 'none' }}
                              />
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                    
                    {/* 车体模型 - 在点位下方渲染 */}
                    {mapType === 'topology' && (() => {
                      // 根据路网组可见性过滤显示的点
                      const visiblePoints = mapPoints.filter(point => {
                        // 检查是否应该隐藏该点（原有逻辑）
                        const shouldHidePoint = hideAllPoints || (hideMapNodes && point.type === '节点');
                        if (shouldHidePoint) {
                          return false;
                        }
                        
                        // 检查该点是否作为起点或终点被某个可见路径使用
                        const isPointUsedByVisiblePath = mapLines.some(line => {
                          // 检查该点是否是这条线的起点或终点
                          const isStartOrEndPoint = line.startPointId === point.id || line.endPointId === point.id;
                          if (!isStartOrEndPoint) {
                            return false;
                          }
                          
                          // 查找包含此路径的路网组
                          const containingNetworkGroup = networkGroups.find(group => 
                            group.paths.some(path => path.id === line.id || path.name === line.name)
                          );
                          
                          // 如果路径不属于任何路网组，则默认显示
                          if (!containingNetworkGroup) {
                            return true;
                          }
                          
                          // 如果路径属于某个路网组，则根据该路网组的visible状态决定是否显示
                          return containingNetworkGroup.visible;
                        });
                        
                        // 如果该点没有被任何路径使用，则默认显示
                        const isPointUsedByAnyPath = mapLines.some(line => 
                          line.startPointId === point.id || line.endPointId === point.id
                        );
                        
                        return !isPointUsedByAnyPath || isPointUsedByVisiblePath;
                      });
                      
                      return visiblePoints.map((point) => {
                        // 直接使用画布坐标，因为父容器已经应用了CSS transform
                        const canvasCoords = { x: point.x, y: point.y };
                        
                        return renderVehicleModel(point, canvasCoords);
                      });
                    })()}

                    {/* 绘制的点 - 仅在拓扑地图模式下显示，并根据隐藏状态控制显示 */}
                    {mapType === 'topology' && (() => {
                      // 根据路网组可见性过滤显示的点
                      const visiblePoints = mapPoints.filter(point => {
                        // 检查是否应该隐藏该点（原有逻辑）
                        const shouldHidePoint = hideAllPoints || (hideMapNodes && point.type === '节点');
                        if (shouldHidePoint) {
                          return false;
                        }
                        
                        // 检查该点是否作为起点或终点被某个可见路径使用
                        const isPointUsedByVisiblePath = mapLines.some(line => {
                          // 检查该点是否是这条线的起点或终点
                          const isStartOrEndPoint = line.startPointId === point.id || line.endPointId === point.id;
                          if (!isStartOrEndPoint) {
                            return false;
                          }
                          
                          // 查找包含此路径的路网组
                          const containingNetworkGroup = networkGroups.find(group => 
                            group.paths.some(path => path.id === line.id || path.name === line.name)
                          );
                          
                          // 调试信息
                          if (isDev) console.log(`点 ${point.id} 被路径 ${line.id} 使用:`, {
                            containingNetworkGroup: containingNetworkGroup ? {
                              id: containingNetworkGroup.id,
                              name: containingNetworkGroup.name,
                              visible: containingNetworkGroup.visible
                            } : null,
                            shouldShow: containingNetworkGroup ? containingNetworkGroup.visible : true
                          });
                          
                          // 如果路径不属于任何路网组，则默认显示
                          if (!containingNetworkGroup) {
                            return true;
                          }
                          
                          // 如果路径属于某个路网组，则根据该路网组的visible状态决定是否显示
                          return containingNetworkGroup.visible;
                        });
                        
                        // 如果该点没有被任何路径使用，则默认显示
                        const isPointUsedByAnyPath = mapLines.some(line => 
                          line.startPointId === point.id || line.endPointId === point.id
                        );
                        
                        return !isPointUsedByAnyPath || isPointUsedByVisiblePath;
                      });
                      
                      if (isDev) console.log('可见点数量:', visiblePoints.length, '总点数量:', mapPoints.length);
                      
                      return visiblePoints.map((point) => {
                        // 直接使用画布坐标，因为父容器已经应用了CSS transform
                        // 不需要再次转换为屏幕坐标，避免双重变换
                        const canvasCoords = { x: point.x, y: point.y };
                      
                        return (
                        <div
                          key={point.id}
                          className="map-point"
                          style={{
                            position: 'absolute',
                            left: canvasCoords.x - 8,
                            top: canvasCoords.y - 8,
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: point.type === '节点' ? 'transparent' : getPointColor(point.type),
                            border: `2px solid ${getPointColor(point.type)}`,  // 移除选中时的蓝色描边
                            boxShadow: 'none',
                            cursor: getPointCursor(),
                            zIndex: 1001,
                            transform: isPointSelected(point.id) ? 'scale(1.2)' : 'scale(1)',
                            transition: 'all 0.2s ease'
                          }}
                          title={`${point.name} (${point.type})`}
                          onClick={(e) => handlePointClick(e, point.id)}
                          onDoubleClick={(e) => handlePointDoubleClick(e, point)}
                          onMouseDown={(e) => handlePointMouseDown(e, point.id)}
                          onMouseEnter={() => setHoveredPoint(point.id)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* 方向指示器 - 圆形内包含箭头（节点类型不显示箭头） */}
                          {point.type !== '节点' && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: 'rgba(24, 144, 255, 0.2)',
                                transformOrigin: '50% 50%',
                                transform: `translate(-50%, -50%)`,
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {/* 箭头图标 */}
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                style={{
                                  transform: `rotate(${(point.direction || 0)}deg)`,
                                  transformOrigin: '50% 50%'
                                }}
                              >
                                <defs>
                                  <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#f0f0f0" stopOpacity="1" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M5 1 L8.5 4 L6.5 4 L6.5 8.5 L3.5 8.5 L3.5 4 L1.5 4 Z"
                                  fill="url(#arrowGradient)"
                                  stroke="#e0e0e0"
                                  strokeWidth="0.3"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        );
                      });
                    })()}
                    
                    {/* 画布提示内容 - 仅在编辑模式下显示 */}
                    {currentMode === 'edit' && (() => {
                      // 在拓扑地图模式下，当没有任何拓扑元素且不在绘制状态时显示提示
                      if (mapType === 'topology' && mapPoints.length === 0 && mapLines.length === 0 && mapAreas.length === 0 && !isDrawingArea) {
                        return (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            color: '#999',
                            pointerEvents: 'none'
                          }}>
                            <EditOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>地图编辑画布</div>
                            <div style={{ fontSize: '12px' }}>选择左侧工具开始绘制地图</div>
                          </div>
                        );
                      }
                      // 在黑白底图模式下，根据是否有PNG图片决定是否显示提示
                      if (mapType === 'grayscale' && !mapFileUploadedImage) {
                        return (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            color: '#999',
                            pointerEvents: 'none'
                          }}>
                            <EyeOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>黑白底图模式</div>
                            <div style={{ fontSize: '12px' }}>当前仅显示PNG图片和网格背景</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* 区域绘制状态提示 - 仅在拓扑地图模式下显示 */}
                    {mapType === 'topology' && isDrawingArea && (
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#ffffff',
                        color: '#666666',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {/* 绿色小圆点 */}
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#52c41a',
                          flexShrink: 0
                        }} />
                        <span>
                          {currentAreaPoints.length === 0 && '点击画布开始绘制调速区域'}
                          {currentAreaPoints.length === 1 && '继续点击添加第二个点'}
                          {currentAreaPoints.length === 2 && '继续点击添加第三个点'}
                          {currentAreaPoints.length >= 3 && (
                            <span>
                              已添加 {currentAreaPoints.length} 个点 • 
                              <strong>双击</strong> 或 <strong>右键</strong> 完成绘制
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
                
                {/* 悬浮操作工具栏 */}
                <div style={{
                  position: 'absolute',
                  right: '280px', // 距离右侧信息面板20px
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
                  zIndex: 100
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
                      onClick={() => {
                        if (mapType === 'grayscale') {
                          undoStroke();
                        } else {
                          handleUndo();
                        }
                      }}
                      disabled={mapType === 'grayscale' ? strokeHistoryIndex <= 0 : historyIndex <= 0}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        color: (mapType === 'grayscale' ? strokeHistoryIndex <= 0 : historyIndex <= 0) ? '#d9d9d9' : '#1890ff'
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
                      onClick={() => {
                        if (mapType === 'grayscale') {
                          redoStroke();
                        } else {
                          handleRedo();
                        }
                      }}
                      disabled={mapType === 'grayscale' ? strokeHistoryIndex >= strokeHistory.length - 1 : historyIndex >= history.length - 1}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        color: (mapType === 'grayscale' ? strokeHistoryIndex >= strokeHistory.length - 1 : historyIndex >= history.length - 1) ? '#d9d9d9' : '#1890ff'
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
                
                {/* 对齐工具栏 - 仅在选择多个点时显示 */}
                {selectedPoints.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    right: '350px', // 避免与上方工具栏重叠
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
                    zIndex: 100
                  }}>
                    {/* 上对齐 */}
                    <Button
                      type="text"
                      size="small"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none'
                      }}
                      title="上对齐"
                      onClick={() => handleAlignPoints('top')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 4h18" strokeLinecap="round" />
                        <path d="M8 6v12" strokeLinecap="round" />
                        <path d="M12 6v8" strokeLinecap="round" />
                        <path d="16 6v14" strokeLinecap="round" />
                      </svg>
                    </Button>
                    
                    {/* 下对齐 */}
                    <Button
                      type="text"
                      size="small"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none'
                      }}
                      title="下对齐"
                      onClick={() => handleAlignPoints('bottom')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 20h18" strokeLinecap="round" />
                        <path d="M8 4v14" strokeLinecap="round" />
                        <path d="M12 8v10" strokeLinecap="round" />
                        <path d="16 2v16" strokeLinecap="round" />
                      </svg>
                    </Button>
                    
                    {/* 左对齐 */}
                    <Button
                      type="text"
                      size="small"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none'
                      }}
                      title="左对齐"
                      onClick={() => handleAlignPoints('left')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 3v18" strokeLinecap="round" />
                        <path d="M6 8h12" strokeLinecap="round" />
                        <path d="M6 12h8" strokeLinecap="round" />
                        <path d="M6 16h14" strokeLinecap="round" />
                      </svg>
                    </Button>
                    
                    {/* 右对齐 */}
                    <Button
                      type="text"
                      size="small"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none'
                      }}
                      title="右对齐"
                      onClick={() => handleAlignPoints('right')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 3v18" strokeLinecap="round" />
                        <path d="M6 8h12" strokeLinecap="round" />
                        <path d="M10 12h8" strokeLinecap="round" />
                        <path d="M4 16h14" strokeLinecap="round" />
                      </svg>
                    </Button>
                  </div>
                )}
                
                {/* 右侧信息面板 - 紧挨边缘 */}
                <div style={{
                  width: '260px',
                  background: '#fff',
                  borderLeft: '1px solid #e8e8e8',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
                }}>
                  <Tabs
                    activeKey={currentMode === 'view' ? 'elements' : activeTabKey}
                    onChange={setActiveTabKey}
                    size="small"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    tabBarStyle={{ 
                      margin: '0 12px',
                      borderBottom: '1px solid #e8e8e8',
                      paddingTop: '12px'
                    }}
                    items={[
                      ...(currentMode === 'edit' ? [{
                        key: 'tools',
                        label: '绘图工具',
                        children: (
                          <div style={{ padding: '12px 12px 12px 12px', flex: 1, overflow: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* 在黑白底图模式下隐藏选择工具 */}
                              {(mapType as string) !== 'grayscale' && (
                                <Button 
                                  type={selectedTool === 'select' ? 'primary' : 'text'}
                                  onClick={() => handleToolSelect('select')}
                                  style={{
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0 12px',
                                    border: selectedTool === 'select' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    background: selectedTool === 'select' ? '#e6f7ff' : '#fff',
                                    color: selectedTool === 'select' ? '#1890ff' : '#666'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                      <rect x="2" y="2" width="10" height="10" fill="none" stroke="#1890ff" strokeWidth="1.5" rx="1"/>
                                      <path d="M12 7 L15 9 L12 11 L13 9 Z" fill="#1890ff"/>
                                    </svg>
                                    选择工具
                                  </div>
                                  <span style={{ 
                                    fontSize: '12px', 
                                    opacity: 0.7,
                                    fontWeight: 'normal',
                                    backgroundColor: selectedTool === 'select' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                  }}>V</span>
                                </Button>
                              )}
                              
                              {/* 黑白底图模式下显示画笔和橡皮擦工具 */}
                              {mapType === 'grayscale' ? (
                                <>
                                  <Button 
                                    type={selectedTool === 'brush' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('brush')}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: selectedTool === 'brush' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      background: selectedTool === 'brush' ? '#e6f7ff' : '#fff',
                                      color: selectedTool === 'brush' ? '#1890ff' : '#666'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <path d="M3 13 L13 3 L14 4 L4 14 Z" stroke="#1890ff" strokeWidth="1.5" fill="none"/>
                                        <circle cx="13.5" cy="2.5" r="1.5" fill="#1890ff"/>
                                        <circle cx="2.5" cy="13.5" r="1.5" fill="#1890ff"/>
                                      </svg>
                                      画笔工具
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'brush' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>B</span>
                                  </Button>
                                  
                                  {/* 画笔大小控制 */}
                                  {selectedTool === 'brush' && (
                                    <div style={{
                                      padding: '8px 12px',
                                      background: '#f8f9fa',
                                      borderRadius: '6px',
                                      border: '1px solid #e8e8e8'
                                    }}>
                                      <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}>
                                        <span>画笔大小</span>
                                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>10px</span>
                                      </div>
                                      <Slider
                                        min={1}
                                        max={20}
                                        value={10}
                                        onChange={(_value) => {/* setBrushSize(value) */}}
                                        style={{ width: '120px', margin: 0 }}
                                        tooltip={{ formatter: (_value) => `${_value}px` }}
                                      />
                                    </div>
                                  )}
                                  
                                  <Button 
                                    type={selectedTool === 'eraser' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('eraser')}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: selectedTool === 'eraser' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      background: selectedTool === 'eraser' ? '#e6f7ff' : '#fff',
                                      color: selectedTool === 'eraser' ? '#1890ff' : '#666'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <rect x="2" y="6" width="8" height="4" rx="1" fill="none" stroke="#1890ff" strokeWidth="1.5"/>
                                        <rect x="10" y="4" width="4" height="8" rx="1" fill="none" stroke="#1890ff" strokeWidth="1.5"/>
                                        <path d="M6 8 L10 8" stroke="#1890ff" strokeWidth="1"/>
                                      </svg>
                                      橡皮擦工具
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'eraser' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>E</span>
                                  </Button>
                                  
                                  {/* 橡皮擦大小控制 */}
                                  {selectedTool === 'eraser' && (
                                    <div style={{
                                      padding: '8px 12px',
                                      background: '#f8f9fa',
                                      borderRadius: '6px',
                                      border: '1px solid #e8e8e8'
                                    }}>
                                      <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}>
                                        <span>橡皮擦大小</span>
                                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>10px</span>
                                      </div>
                                      <Slider
                                        min={1}
                                        max={20}
                                        value={10}
                                        onChange={(_value) => {/* setEraserSize(_value) */}}
                                        style={{ width: '120px', margin: 0 }}
                                        tooltip={{ formatter: (value) => `${value}px` }}
                                      />
                                    </div>
                                  )}
                                </>
                              ) : (
                                /* 拓扑地图模式下显示原有的绘图工具 */
                                <>
                                  <Button 
                                    type={selectedTool === 'point' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('point')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'node' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'point' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'node' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <circle cx="8" cy="8" r="6" fill="none" stroke="#1890ff" strokeWidth="1.5"/>
                                        <circle cx="8" cy="8" r="2" fill="#1890ff"/>
                                      </svg>
                                      绘制节点
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'point' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>P</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'station' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('station')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'station' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'station' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'station' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <circle cx="8" cy="8" r="6" fill="none" stroke="#52c41a" strokeWidth="1.5"/>
                                        <circle cx="8" cy="8" r="2" fill="#52c41a"/>
                                      </svg>
                                      绘制站点
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'station' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>T</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'dock' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('dock')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'dock' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'dock' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'dock' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <circle cx="8" cy="8" r="6" fill="none" stroke="#722ed1" strokeWidth="1.5"/>
                                        <circle cx="8" cy="8" r="2" fill="#722ed1"/>
                                      </svg>
                                      绘制停靠点
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'dock' ? 'rgba(114, 46, 209, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>K</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'charge' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('charge')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'charge' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'charge' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'charge' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <circle cx="8" cy="8" r="6" fill="none" stroke="#fa8c16" strokeWidth="1.5"/>
                                        <circle cx="8" cy="8" r="2" fill="#fa8c16"/>
                                      </svg>
                                      绘制充电点
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'charge' ? 'rgba(250, 140, 22, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>H</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'temp' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('temp')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'temp' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'temp' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'temp' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <circle cx="8" cy="8" r="6" fill="none" stroke="#eb2f96" strokeWidth="1.5"/>
                                        <circle cx="8" cy="8" r="2" fill="#eb2f96"/>
                                      </svg>
                                      绘制临停点
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'temp' ? 'rgba(235, 47, 150, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>M</span>
                                  </Button>
                                   
                                   <Button 
                                     type={selectedTool === 'double-line' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('double-line')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'double-line' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'double-line' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'double-line' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <line x1="2" y1="8" x2="14" y2="8" stroke="#1890ff" strokeWidth="1.5"/>
                                        <path d="M1 8 L4 6.5 L3.5 8 L4 9.5 Z" fill="#1890ff"/>
                                        <path d="M15 8 L12 6.5 L12.5 8 L12 9.5 Z" fill="#1890ff"/>
                                      </svg>
                                      双向直线
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'double-line' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>D</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'single-line' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('single-line')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'single-line' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#fafafa' : (selectedTool === 'single-line' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'single-line' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <line x1="2" y1="8" x2="14" y2="8" stroke="#1890ff" strokeWidth="1.5"/>
                                        <path d="M15 8 L12 6.5 L12.5 8 L12 9.5 Z" fill="#1890ff"/>
                                      </svg>
                                      单向直线
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'single-line' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>S</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'double-bezier' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('double-bezier')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'double-bezier' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#f5f5f5' : (selectedTool === 'double-bezier' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'double-bezier' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <path d="M2 8 Q5 4 8 8 Q11 12 14 8" stroke="#1890ff" strokeWidth="1.5" fill="none"/>
                                        <path d="M1 8 L4 6.5 L3.5 8 L4 9.5 Z" fill="#1890ff"/>
                                        <path d="M15 8 L12 6.5 L12.5 8 L12 9.5 Z" fill="#1890ff"/>
                                      </svg>
                                      双向贝塞尔曲线
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'double-bezier' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>B</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'single-bezier' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('single-bezier')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'single-bezier' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#fafafa' : (selectedTool === 'single-bezier' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'single-bezier' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <path d="M2 8 Q5 4 8 8 Q11 12 14 8" stroke="#1890ff" strokeWidth="1.5" fill="none"/>
                                        <path d="M15 8 L12 6.5 L12.5 8 L12 9.5 Z" fill="#1890ff"/>
                                      </svg>
                                      单向贝塞尔曲线
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'single-bezier' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>C</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'area' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('area')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'area' ? '1px solid #1890ff' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#fafafa' : (selectedTool === 'node' ? '#e6f7ff' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'area' ? '#1890ff' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <polygon points="3,3 13,3 13,13 3,13" fill="none" stroke="#1890ff" strokeWidth="1.5"/>
                                        <polygon points="3,3 13,3 13,13 3,13" fill="#1890ff" fillOpacity="0.2"/>
                                      </svg>
                                      绘制调速区域
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'area' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>A</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'forbidden-area' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('forbidden-area')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'forbidden-area' ? '1px solid #ff4d4f' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#fafafa' : (selectedTool === 'forbidden-area' ? '#fff2f0' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'forbidden-area' ? '#ff4d4f' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <polygon points="3,3 13,3 13,13 3,13" fill="none" stroke="#ff4d4f" strokeWidth="1.5"/>
                                        <polygon points="3,3 13,3 13,13 3,13" fill="#ff4d4f" fillOpacity="0.2"/>
                                        <line x1="3" y1="3" x2="13" y2="13" stroke="#ff4d4f" strokeWidth="2"/>
                                        <line x1="13" y1="3" x2="3" y2="13" stroke="#ff4d4f" strokeWidth="2"/>
                                      </svg>
                                      绘制禁行区域
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'forbidden-area' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>F</span>
                                  </Button>
                                  
                                  <Button 
                                    type={selectedTool === 'multi-network-area' ? 'primary' : 'text'}
                                    onClick={() => handleToolSelect('multi-network-area')}
                                    disabled={(mapType as string) === 'grayscale'}
                                    style={{
                                      height: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0 12px',
                                      border: (mapType as string) === 'grayscale' ? '1px solid #f0f0f0' : (selectedTool === 'multi-network-area' ? '1px solid #52c41a' : '1px solid #d9d9d9'),
                                      borderRadius: '6px',
                                      background: (mapType as string) === 'grayscale' ? '#fafafa' : (selectedTool === 'multi-network-area' ? '#f6ffed' : '#fff'),
                                      color: (mapType as string) === 'grayscale' ? '#bfbfbf' : (selectedTool === 'multi-network-area' ? '#52c41a' : '#666'),
                                      cursor: (mapType as string) === 'grayscale' ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                        <polygon points="3,3 13,3 13,13 3,13" fill="none" stroke="#52c41a" strokeWidth="1.5"/>
                                        <polygon points="3,3 13,3 13,13 3,13" fill="#52c41a" fillOpacity="0.2"/>
                                        <circle cx="5" cy="5" r="1" fill="#52c41a"/>
                                        <circle cx="11" cy="5" r="1" fill="#52c41a"/>
                                        <circle cx="5" cy="11" r="1" fill="#52c41a"/>
                                        <circle cx="11" cy="11" r="1" fill="#52c41a"/>
                                        <line x1="5" y1="5" x2="11" y2="5" stroke="#52c41a" strokeWidth="1"/>
                                        <line x1="5" y1="11" x2="11" y2="11" stroke="#52c41a" strokeWidth="1"/>
                                        <line x1="5" y1="5" x2="5" y2="11" stroke="#52c41a" strokeWidth="1"/>
                                        <line x1="11" y1="5" x2="11" y2="11" stroke="#52c41a" strokeWidth="1"/>
                                      </svg>
                                      绘制多路网区域
                                    </div>
                                    <span style={{ 
                                      fontSize: '12px', 
                                      opacity: 0.7,
                                      fontWeight: 'normal',
                                      backgroundColor: selectedTool === 'multi-network-area' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      minWidth: '20px',
                                      textAlign: 'center'
                                    }}>M</span>
                                  </Button>

                                </>
                              )}
                            </div>
                          </div>
                        )
                      }] : []),
                      ...(!(currentMode === 'edit' && mapType === 'grayscale') ? [{
                        key: 'elements',
                        label: '地图元素',
                        children: (
                          <div style={{ padding: '12px 12px 12px 12px', flex: 1, overflow: 'auto' }}>
                            <Collapse
                              activeKey={mapElementActiveKey}
                              onChange={setMapElementActiveKey}
                              size="small"
                              ghost
                              accordion
                              items={[
                                {
                                  key: 'nodes',
                                  label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <NodeIndexOutlined style={{ color: '#1890ff' }} />
                                      <span>节点</span>
                                      <Badge count={mapPoints.length} size="small" style={{ backgroundColor: '#1890ff' }} />
                                    </div>
                                  ),
                                  children: (
                                    <div style={{ paddingLeft: '16px' }}>
                                      {mapPoints.map(point => (
                                        <div 
                                          key={point.id}
                                          style={{ 
                                            fontSize: '12px', 
                                            lineHeight: '1.6',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '2px 4px',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s',
                                            cursor: 'pointer'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                                            if (removeBtn) removeBtn.style.opacity = '1';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                                            if (removeBtn) removeBtn.style.opacity = '0';
                                          }}
                                          onClick={() => handleNodeListClick(point.id)}
                                        >
                                          <span>{point.name} ({point.description || point.type})</span>
                                          {!point.isPreset && currentMode === 'edit' && (
                                            <Button 
                                              className="remove-btn"
                                              type="text" 
                                              size="small" 
                                              danger
                                              onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                handleRemoveMapPoint(point.id);
                                              }}
                                              style={{ 
                                                opacity: 0, 
                                                transition: 'opacity 0.2s',
                                                fontSize: '10px',
                                                height: '20px',
                                                padding: '0 4px'
                                              }}
                                            >
                                              删除
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                      {mapPoints.length === 0 && (
                                        <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px 0' }}>
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
                                      <ShareAltOutlined style={{ color: '#52c41a' }} />
                                      <span>路径</span>
                                      <Badge count={mapLines.length} size="small" style={{ backgroundColor: '#52c41a' }} />
                                    </div>
                                  ),
                                  children: (
                                    <div style={{ paddingLeft: '16px' }}>
                                      {mapLines.map((line) => {
                                        const startPoint = mapPoints.find(p => p.id === line.startPointId);
                                        const endPoint = mapPoints.find(p => p.id === line.endPointId);
                                        
                                        // 根据线条类型确定方向符号
                                        let directionSymbol = '-->';
                                        if (line.type === 'double-line') {
                                          directionSymbol = '<-->';
                                        }
                                        
                                        return (
                                          <div 
                                            key={line.id} 
                                            style={{ 
                                              fontSize: '12px', 
                                              lineHeight: '1.6',
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              padding: '2px 4px',
                                              borderRadius: '4px',
                                              transition: 'background-color 0.2s',
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => handleLineListClick(line.id)}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                                              const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                              if (deleteBtn) deleteBtn.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                              const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                              if (deleteBtn) deleteBtn.style.opacity = '0';
                                            }}
                                          >
                                            <span>{line.name}({startPoint?.name}{directionSymbol}{endPoint?.name})</span>
                                            {currentMode === 'edit' && (
                                              <Button 
                                                className="delete-btn"
                                                type="text" 
                                                size="small" 
                                                danger
                                                onClick={(e: React.MouseEvent) => {
                                                  e.stopPropagation(); // 阻止事件冒泡到父元素
                                                  Modal.confirm({
                                                    title: '确认删除',
                                                    content: `确定要删除路径 "${line.name}" 吗？删除后无法恢复。`,
                                                    okText: '确认删除',
                                                    cancelText: '取消',
                                                    okType: 'danger',
                                                    onOk: () => {
                                                      setMapLines(prev => prev.filter(l => l.id !== line.id));
                                                      message.success(`路径 "${line.name}" 已删除`);
                                                    }
                                                  });
                                                }}
                                                style={{ 
                                                  opacity: 0, 
                                                  transition: 'opacity 0.2s',
                                                  fontSize: '10px',
                                                  height: '20px',
                                                  padding: '0 4px'
                                                }}
                                              >
                                                删除
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {mapLines.length === 0 && (
                                        <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px 0' }}>
                                          暂无路径数据
                                        </div>
                                      )}
                                    </div>
                                  )
                                },
                                {key: 'functional-areas',
                                  label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <AppstoreOutlined style={{ color: '#fa541c' }} />
                                      <span>功能区</span>
                                      <Badge count={mapAreas.length} size="small" style={{ backgroundColor: '#fa541c' }} />
                                    </div>
                                  ),
                                  children: (
                                    <div style={{ paddingLeft: '16px' }}>
                                      {mapAreas.map((area) => {
                                        // 获取该区域下的所有路网组信息
                                        const areaNetworkGroups = networkGroups.filter(ng => ng.areaId === area.id);
                                        
                                        return (
                                          <div key={area.id}>
                                            <div 
                                              style={{ 
                                                fontSize: '12px', 
                                                lineHeight: '1.6',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                position: 'relative'
                                              }}
                                            >
                                              <div style={{ flex: 1 }}>
                                                <div 
                                                  style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    position: 'relative'
                                                  }}
                                                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                    if (currentMode === 'edit') {
                                                      const deleteBtn = e.currentTarget.querySelector('.area-delete-btn') as HTMLElement;
                                                      if (deleteBtn) deleteBtn.style.opacity = '1';
                                                    }
                                                  }}
                                                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                    if (currentMode === 'edit') {
                                                      const deleteBtn = e.currentTarget.querySelector('.area-delete-btn') as HTMLElement;
                                                      if (deleteBtn) deleteBtn.style.opacity = '0';
                                                    }
                                                  }}
                                                >
                                                  <span 
                                                    style={{ 
                                                      cursor: 'pointer',
                                                      padding: '2px 4px',
                                                      borderRadius: '2px',
                                                      transition: 'background-color 0.2s'
                                                    }}
                                                    onClick={() => handleAreaListClick(area.id)}
                                                    onMouseEnter={(e) => {
                                                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                  >
                                                    {area.name} ({area.type || '区域'})
                                                  </span>
                                                  {currentMode === 'edit' && (
                                                    <Button
                                                      className="area-delete-btn"
                                                      type="text"
                                                      danger
                                                      size="small"
                                                      icon={<DeleteOutlined />}
                                                      onClick={(e: React.MouseEvent) => {
                                                         e.stopPropagation();
                                                         handleDeleteArea(area.id);
                                                       }}
                                                      style={{
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s',
                                                        fontSize: '10px',
                                                        height: '16px',
                                                        padding: '0 2px',
                                                        marginLeft: '4px'
                                                      }}
                                                      title="删除区域"
                                                    />
                                                  )}
                                                </div>
                                                {area.type === '多路网区' && (
                                                  <div style={{ marginTop: '4px', paddingLeft: '8px' }}>
                                                    <div style={{ 
                                                      display: 'flex', 
                                                      alignItems: 'center', 
                                                      gap: '4px',
                                                      marginBottom: '4px'
                                                    }}>
                                                      <GroupOutlined style={{ color: '#1890ff', fontSize: '10px' }} />
                                                      <span style={{ fontSize: '10px', color: '#1890ff' }}>路网组</span>
                                                      <Badge count={areaNetworkGroups.length} size="small" style={{ backgroundColor: '#1890ff' }} />
                                                      {currentMode === 'edit' && (
                                                        <Button 
                                                          type="text" 
                                                          size="small" 
                                                          icon={<PlusOutlined />}
                                                          style={{ 
                                                            fontSize: '10px',
                                                            height: '16px',
                                                            padding: '0 2px',
                                                            marginLeft: '2px'
                                                          }}
                                                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                            e.stopPropagation();
                                                            handleAddNetworkGroup();
                                                          }}
                                                        >
                                                          新增
                                                        </Button>
                                                      )}
                                                    </div>
                                                    {areaNetworkGroups.length > 0 && (
                                                      <Collapse
                                                        size="small"
                                                        ghost
                                                        items={areaNetworkGroups.map(networkGroup => ({
                                                          key: networkGroup.id,
                                                          label: (
                                                            <div 
                                                              style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '4px',
                                                                justifyContent: 'space-between',
                                                                width: '100%'
                                                              }}
                                                              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                                const actionBtns = e.currentTarget.querySelector('.network-group-actions') as HTMLElement;
                                                                if (actionBtns) actionBtns.style.opacity = '1';
                                                                const eyeIcon = e.currentTarget.querySelector('.network-group-eye-icon') as HTMLElement;
                                                                if (eyeIcon) eyeIcon.style.opacity = '1';
                                                              }}
                                                              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                                const actionBtns = e.currentTarget.querySelector('.network-group-actions') as HTMLElement;
                                                                if (actionBtns) actionBtns.style.opacity = '0';
                                                                const eyeIcon = e.currentTarget.querySelector('.network-group-eye-icon') as HTMLElement;
                                                                if (eyeIcon) eyeIcon.style.opacity = '0';
                                                              }}
                                                            >
                                                              <span style={{ 
                                                                fontSize: '11px', 
                                                                color: '#1890ff',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                              }}>
                                                                {networkGroup.name}
                                                              </span>
                                                              {currentMode === 'edit' && (
                                                                <div 
                                                                  className="network-group-actions"
                                                                  style={{ 
                                                                    opacity: 0, 
                                                                    transition: 'opacity 0.2s',
                                                                    display: 'flex',
                                                                    gap: '2px',
                                                                    alignItems: 'center'
                                                                  }}
                                                                >
                                                                  <span
                                                                    className="network-group-eye-icon"
                                                                    style={{
                                                                      cursor: 'pointer',
                                                                      color: networkGroup.visible ? '#1890ff' : '#d9d9d9',
                                                                      fontSize: '12px',
                                                                      display: 'flex',
                                                                      alignItems: 'center',
                                                                      padding: '1px',
                                                                      borderRadius: '2px',
                                                                      transition: 'all 0.2s ease'
                                                                    }}
                                                                    onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleToggleNetworkGroupVisibility(networkGroup.id);
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                      e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }}
                                                                    title={networkGroup.visible ? '隐藏路网组' : '显示路网组'}
                                                                  >
                                                                    {networkGroup.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                                  </span>
                                                                  <Button 
                                                                    type="text" 
                                                                    size="small" 
                                                                    icon={<EditOutlined />}
                                                                    style={{ 
                                                                      fontSize: '10px',
                                                                      height: '16px',
                                                                      padding: '0 2px'
                                                                    }}
                                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                                      e.stopPropagation();
                                                                      handleEditNetworkGroup(networkGroup);
                                                                    }}
                                                                  />
                                                                  <Button 
                                                                    type="text" 
                                                                    size="small" 
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    style={{ 
                                                                      fontSize: '10px',
                                                                      height: '16px',
                                                                      padding: '0 2px'
                                                                    }}
                                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                                      e.stopPropagation();
                                                                      handleDeleteNetworkGroup(networkGroup.id);
                                                                    }}
                                                                  />
                                                                </div>
                                                              )}
                                                            </div>
                                                          ),
                                                          children: (
                                                            <div style={{ paddingLeft: '8px' }}>
                                                              {networkGroup.paths.map(path => (
                                                                <div 
                                                                  key={path.id}
                                                                  style={{ 
                                                                    fontSize: '11px', 
                                                                    lineHeight: '1.4',
                                                                    color: '#666',
                                                                    marginBottom: '2px',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '1px 2px',
                                                                    borderRadius: '2px',
                                                                    transition: 'background-color 0.2s'
                                                                  }}
                                                                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                                    const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                                                                    if (removeBtn) removeBtn.style.opacity = '1';
                                                                  }}
                                                                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                                                                    if (removeBtn) removeBtn.style.opacity = '0';
                                                                  }}
                                                                >
                                                                  <span>{path.name}（{path.description}）</span>
                                                                  {currentMode === 'edit' && (
                                                                    <Button 
                                                                      className="remove-btn"
                                                                      type="text" 
                                                                      size="small" 
                                                                      danger
                                                                      style={{ 
                                                                        opacity: 0, 
                                                                        transition: 'opacity 0.2s',
                                                                        fontSize: '9px',
                                                                        height: '14px',
                                                                        padding: '0 2px'
                                                                      }}
                                                                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                                         e.stopPropagation();
                                                                         removePathFromGroup(networkGroup.id, path.id);
                                                                       }}
                                                                    >
                                                                      移除
                                                                    </Button>
                                                                  )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )
                                                        }))}
                                                      />
                                                    )}
                                                  </div>
                                                )}
                                              </div>

                                            </div>

                                          </div>
                                        );
                                      })}
                                      {mapAreas.length === 0 && (
                                        <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '16px 0' }}>
                                          暂无功能区域数据
                                        </div>
                                      )}
                                    </div>
                                  )
                                },
                                {key: 'path-groups',
                                  label: (
                                    <div 
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        position: 'relative'
                                      }}
                                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                        const addBtn = e.currentTarget.querySelector('.path-group-add-btn') as HTMLElement;
                                        if (addBtn) addBtn.style.opacity = '1';
                                      }}
                                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                        const addBtn = e.currentTarget.querySelector('.path-group-add-btn') as HTMLElement;
                                        if (addBtn) addBtn.style.opacity = '0';
                                      }}
                                    >
                                      <GroupOutlined style={{ color: '#722ed1' }} />
                                      <span>路径组</span>
                                      <Badge count={pathGroups.length} size="small" style={{ backgroundColor: '#722ed1' }} />
                                      {currentMode === 'edit' && (
                                        <Button 
                                          className="path-group-add-btn"
                                          type="text" 
                                          size="small" 
                                          icon={<PlusOutlined />}
                                          style={{ 
                                            opacity: 0, 
                                            transition: 'opacity 0.2s',
                                            fontSize: '12px',
                                            height: '20px',
                                            padding: '0 4px',
                                            marginLeft: '4px'
                                          }}
                                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            e.stopPropagation();
                                            handleAddPathGroup();
                                          }}
                                        >
                                          新增
                                        </Button>
                                      )}
                                    </div>
                                  ),
                                  children: (
                                    <div style={{ paddingLeft: '8px' }}>
                                      <Collapse
                                        size="small"
                                        ghost
                                        items={pathGroups.map(group => ({
                                          key: group.id,
                                          label: (
                                            <div 
                                              style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                justifyContent: 'space-between',
                                                width: '100%'
                                              }}
                                              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                const actionBtns = e.currentTarget.querySelector('.path-group-actions') as HTMLElement;
                                                if (actionBtns) actionBtns.style.opacity = '1';
                                              }}
                                              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                const actionBtns = e.currentTarget.querySelector('.path-group-actions') as HTMLElement;
                                                if (actionBtns) actionBtns.style.opacity = '0';
                                              }}
                                            >
                                              <span>{group.name}</span>
                                              {currentMode === 'edit' && (
                                                <div 
                                                  className="path-group-actions"
                                                  style={{ 
                                                    opacity: 0, 
                                                    transition: 'opacity 0.2s',
                                                    display: 'flex',
                                                    gap: '4px'
                                                  }}
                                                >
                                                  <Button 
                                                    type="text" 
                                                    size="small" 
                                                    icon={<EditOutlined />}
                                                    style={{ 
                                                      fontSize: '12px',
                                                      height: '20px',
                                                      padding: '0 4px'
                                                    }}
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                      e.stopPropagation();
                                                      handleEditPathGroup(group);
                                                    }}
                                                  />
                                                  <Button 
                                                    type="text" 
                                                    size="small" 
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    style={{ 
                                                      fontSize: '12px',
                                                      height: '20px',
                                                      padding: '0 4px'
                                                    }}
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                      e.stopPropagation();
                                                      handleDeletePathGroup(group.id);
                                                    }}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          ),
                                          children: (
                                            <div style={{ paddingLeft: '8px' }}>
                                              <div>
                                                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                                  {group.paths.map(path => (
                                                    <div 
                                                      key={path.id}
                                                      style={{ 
                                                        fontSize: '12px', 
                                                        lineHeight: '1.4',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '1px 4px',
                                                        borderRadius: '4px',
                                                        transition: 'background-color 0.2s'
                                                      }}
                                                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                        const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                                                        if (removeBtn) removeBtn.style.opacity = '1';
                                                      }}
                                                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                                                        if (removeBtn) removeBtn.style.opacity = '0';
                                                      }}
                                                    >
                                                      <span>{path.name} ({path.description})</span>
                                                      {currentMode === 'edit' && (
                                                        <Button 
                                                          className="remove-btn"
                                                          type="text" 
                                                          size="small" 
                                                          danger
                                                          style={{ 
                                                            opacity: 0, 
                                                            transition: 'opacity 0.2s',
                                                            fontSize: '10px',
                                                            height: '20px',
                                                            padding: '0 4px'
                                                          }}
                                                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                            e.stopPropagation();
                                                            removePathFromPathGroup(group.id, path.id);
                                                          }}
                                                        >
                                                          移除
                                                        </Button>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        }))}
                                      />
                                    </div>
                                  )
                                }
                              ]}
                            />
                          </div>
                        )
                      }] : []),
                      // 元素隐藏标签页 - 只在拓扑地图模式下显示
                      ...(mapType === 'topology' ? [{
                        key: 'elementHide',
                        label: '元素隐藏',
                        children: (
                          <div style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                                元素显示控制
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <Checkbox
                                  checked={hideMapNodes}
                                  onChange={(e) => setHideMapNodes(e.target.checked)}
                                  style={{ fontSize: '13px' }}
                                >
                                  隐藏地图节点
                                </Checkbox>
                                <Checkbox
                                  checked={hideAllPoints}
                                  onChange={(e) => setHideAllPoints(e.target.checked)}
                                  style={{ fontSize: '13px' }}
                                >
                                  隐藏所有点
                                </Checkbox>
                                <Checkbox
                                  checked={hideAllPaths}
                                  onChange={(e) => setHideAllPaths(e.target.checked)}
                                  style={{ fontSize: '13px' }}
                                >
                                  隐藏所有路径
                                </Checkbox>
                                <Checkbox
                                  checked={hideVehicleModels}
                                  onChange={(e) => setHideVehicleModels(e.target.checked)}
                                  style={{ fontSize: '13px' }}
                                >
                                  隐藏车体模型
                                </Checkbox>
                              </div>
                            </div>
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#f5f5f5', 
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#666'
                            }}>
                              <div style={{ marginBottom: '4px' }}>💡 提示：</div>
                              <div>• 可以多选，支持同时隐藏多种元素</div>
                              <div>• 隐藏的元素在地图上不会显示，但数据仍然保留</div>
                              <div>• 取消勾选即可重新显示对应元素</div>
                            </div>
                          </div>
                        )
                      }] : [])
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>
      
      {/* 点属性编辑弹窗 */}
      <Modal
        title={currentMode === 'view' ? "查看点属性" : "编辑点属性"}
        open={pointEditModalVisible}
        zIndex={2000}
        getContainer={getModalContainer}
        onCancel={() => {
          setPointEditModalVisible(false);
          setEditingPoint(null);
          // 延迟重置表单，避免闪现
          setTimeout(() => {
            pointEditForm.resetFields();
          }, 100);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPointEditModalVisible(false);
            setEditingPoint(null);
            // 延迟重置表单，避免闪现
            setTimeout(() => {
              pointEditForm.resetFields();
            }, 100);
          }}>
            {currentMode === 'view' ? '关闭' : '取消'}
          </Button>,
          ...(currentMode === 'edit' ? [
            <Button key="submit" type="primary" onClick={() => pointEditForm.submit()}>
              保存
            </Button>
          ] : [])
        ]}
        width={500}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px'
          }
        }}
      >
        <Form
          form={pointEditForm}
          layout="vertical"
          onFinish={handleSavePointEdit}
        >
          <Form.Item
            label="点ID"
            style={{ marginBottom: 16 }}
          >
            <Input value={editingPoint?.id} disabled style={{ color: '#666' }} />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="点名称"
            rules={[
              { required: true, message: '请输入点名称' },
              { max: 20, message: '点名称不能超过20个字符' }
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input 
              placeholder="请输入点名称" 
              disabled={currentMode === 'view'}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  // 阻止Delete和Backspace键事件冒泡，防止误删地图上的点
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.stopPropagation();
                  }
                }}
            />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="点类型"
            rules={[{ required: true, message: '请选择点类型' }]}
            style={{ marginBottom: 16 }}
          >
            <Select placeholder="请选择点类型" disabled={currentMode === 'view'}>
              <Select.Option value="节点">节点</Select.Option>
              <Select.Option value="站点">站点</Select.Option>
              <Select.Option value="充电点">充电点</Select.Option>
              <Select.Option value="停靠点">停靠点</Select.Option>
              <Select.Option value="临停点">临停点</Select.Option>
              <Select.Option value="归位点">归位点</Select.Option>
              <Select.Option value="电梯点">电梯点</Select.Option>
              <Select.Option value="自动门">自动门</Select.Option>
              <Select.Option value="切换点">切换点</Select.Option>
            </Select>
          </Form.Item>
          
          {/* 是否禁用字段 - 所有点类型都显示 */}
          <Form.Item
            name="isDisabled"
            label="是否禁用"
            initialValue={false}
            style={{ marginBottom: 16 }}
            tooltip="禁用后该点将不可用于路径规划"
          >
            <Select placeholder="请选择是否禁用" disabled={currentMode === 'view'}>
              <Select.Option value={false}>否</Select.Option>
              <Select.Option value={true}>是</Select.Option>
            </Select>
          </Form.Item>
          
          {/* 根据点类型显示不同的字段 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues: any, currentValues: any) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }: any) => {
              const pointType = getFieldValue('type');
              
              // 如果是节点类型，不显示任何额外字段
              if (pointType === '节点') {
                return null;
              }
              
              // 如果是站点类型或切换点类型，显示方向相关字段
              if (pointType === '站点' || pointType === '切换点') {
                return (
                  <>
                    {/* 方向角度字段 */}
                    <Form.Item
                      name="direction"
                      label="方向角度"
                      rules={[
                        { required: true, message: '请输入方向角度' },
                        { 
                          validator: (_: any, value: any) => {
                            const num = Number(value);
                            if (isNaN(num)) {
                              return Promise.reject(new Error('请输入有效的数字'));
                            }
                            if (num < -180 || num > 180) {
                              return Promise.reject(new Error('角度范围为-180到180度'));
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input
                        type="number"
                        placeholder="请输入方向角度 (-180到180度)"
                        suffix="°"
                        min={-180}
                        max={180}
                        disabled={currentMode === 'view'}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          // 阻止Delete和Backspace键事件冒泡，防止误删地图上的点
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            e.stopPropagation();
                          }
                        }}
                      />
                    </Form.Item>
                    
                    {/* 是否禁止掉头字段 */}
                    <Form.Item
                      name="noUturn"
                      label="是否禁止掉头"
                      initialValue={false}
                      style={{ marginBottom: 16 }}
                      tooltip="禁止掉头后，机器人在此点不能进行掉头操作"
                    >
                      <Select placeholder="请选择是否禁止掉头" disabled={currentMode === 'view'}>
                        <Select.Option value={false}>否</Select.Option>
                        <Select.Option value={true}>是</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                );
              }
              
              return (
                <>
                  {/* 充电点专用字段：是否可作为停靠点使用 */}
                  {pointType === '充电点' && (
                    <Form.Item
                      name="canBeUsedAsDockingPoint"
                      label="是否可作为停靠点使用"
                      initialValue={false}
                      style={{ marginBottom: 16 }}
                      tooltip="如果开启，则充电点也可以作为停靠点使用，也就是这个点可以作为停靠点又可以作为充电点"
                    >
                      <Select placeholder="请选择是否可作为停靠点使用" disabled={currentMode === 'view'}>
                        <Select.Option value={false}>否</Select.Option>
                        <Select.Option value={true}>是</Select.Option>
                      </Select>
                    </Form.Item>
                  )}
                  
                  {/* 充电点专用字段：关联机器人 */}
                  {pointType === '充电点' && (
                    <Form.Item
                      name="relatedRobots"
                      label="关联机器人"
                      style={{ marginBottom: 16 }}
                      tooltip="选择可以使用此充电点的机器人设备，支持多选"
                    >
                      <Select
                        mode="multiple"
                        placeholder="请选择关联的机器人设备"
                        allowClear
                        showSearch
                        disabled={currentMode === 'view'}
                        filterOption={(input: string, option: any) =>
                           (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                         }
                        options={robotDevices
                          .filter(robot => robot.deviceType === '机器人设备' && robot.isEnabled)
                          .map(robot => ({
                            value: robot.id,
                            label: `${robot.deviceName} (${robot.productName})`,
                            disabled: !robot.isOnline
                          }))
                        }
                        maxTagCount={3}
                        maxTagTextLength={10}
                      />
                    </Form.Item>
                  )}
                  
                  {/* 停靠点专用字段：关联机器人 */}
                  {pointType === '停靠点' && (
                    <Form.Item
                      name="relatedRobots"
                      label="关联机器人"
                      style={{ marginBottom: 16 }}
                      tooltip="选择可以使用此停靠点的机器人设备，支持多选"
                    >
                      <Select
                        mode="multiple"
                        placeholder="请选择关联的机器人设备"
                        allowClear
                        showSearch
                        disabled={currentMode === 'view'}
                        filterOption={(input: string, option: any) =>
                           (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                         }
                        options={robotDevices
                          .filter(robot => robot.deviceType === '机器人设备' && robot.isEnabled)
                          .map(robot => ({
                            value: robot.id,
                            label: `${robot.deviceName} (${robot.productName})`,
                            disabled: !robot.isOnline
                          }))
                        }
                        maxTagCount={3}
                        maxTagTextLength={10}
                      />
                    </Form.Item>
                  )}
                  
                  {/* 电梯点专用字段 */}
                  {pointType === '电梯点' && (
                    <>
                      {/* 电梯内/外字段 */}
                      <Form.Item
                        name="elevatorLocation"
                        label="电梯内/外"
                        rules={[{ required: true, message: '请选择电梯内/外' }]}
                        style={{ marginBottom: 16 }}
                      >
                        <Select placeholder="请选择电梯内/外" disabled={currentMode === 'view'}>
                          <Select.Option value="电梯内">电梯内</Select.Option>
                          <Select.Option value="电梯外">电梯外</Select.Option>
                        </Select>
                      </Form.Item>
                      
                      {/* 电梯设备字段 */}
                      <Form.Item
                        name="elevatorDevice"
                        label="电梯设备"
                        rules={[{ required: true, message: '请选择电梯设备' }]}
                        style={{ marginBottom: 16 }}
                        tooltip="选择关联的电梯设备"
                      >
                        <Select
                          placeholder="请选择电梯设备"
                          allowClear
                          showSearch
                          disabled={currentMode === 'view'}
                          filterOption={(input: string, option: any) =>
                             (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                           }
                          options={robotDevices
                            .filter(device => device.deviceType === '电梯设备' && device.isEnabled)
                            .map(device => ({
                              value: device.id,
                              label: `${device.deviceName} (${device.productName})`,
                              disabled: !device.isOnline
                            }))
                          }
                        />
                      </Form.Item>
                      
                      {/* 电梯门字段 */}
                      <Form.Item
                        name="elevatorDoor"
                        label="电梯门"
                        rules={[{ required: true, message: '请选择电梯门' }]}
                        style={{ marginBottom: 16 }}
                      >
                        <Select placeholder="请选择电梯门" disabled={currentMode === 'view'}>
                          <Select.Option value="A门">A门</Select.Option>
                          <Select.Option value="B门">B门</Select.Option>
                          <Select.Option value="C门">C门</Select.Option>
                          <Select.Option value="D门">D门</Select.Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}
                  
                  {/* 自动门专用字段 */}
                  {pointType === '自动门' && (
                    <>
                      {/* 自动门设备字段 */}
                      <Form.Item
                        name="autoDoorDevice"
                        label="自动门设备"
                        rules={[{ required: true, message: '请选择自动门设备' }]}
                        style={{ marginBottom: 16 }}
                        tooltip="选择关联的自动门设备"
                      >
                        <Select
                          placeholder="请选择自动门设备"
                          allowClear
                          showSearch
                          disabled={currentMode === 'view'}
                          filterOption={(input: string, option: any) =>
                             (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                           }
                          options={robotDevices
                            .filter(device => device.deviceType === '自动门设备' && device.isEnabled)
                            .map(device => ({
                              value: device.id,
                              label: `${device.deviceName} (${device.productName})`,
                              disabled: !device.isOnline
                            }))
                          }
                        />
                      </Form.Item>
                      
                      {/* 自动门字段 */}
                      <Form.Item
                        name="autoDoorType"
                        label="自动门"
                        rules={[{ required: true, message: '请选择自动门' }]}
                        style={{ marginBottom: 16 }}
                      >
                        <Select placeholder="请选择自动门" disabled={currentMode === 'view'}>
                          <Select.Option value="A门">A门</Select.Option>
                          <Select.Option value="B门">B门</Select.Option>
                          <Select.Option value="C门">C门</Select.Option>
                          <Select.Option value="D门">D门</Select.Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}
                  
                  {/* 方向角度字段 - 除节点外的所有类型都显示 */}
                  <Form.Item
                    name="direction"
                    label="方向角度"
                    rules={[
                      { required: true, message: '请输入方向角度' },
                      { 
                        validator: (_: any, value: any) => {
                          const num = Number(value);
                          if (isNaN(num)) {
                            return Promise.reject(new Error('请输入有效的数字'));
                          }
                          if (num < -180 || num > 180) {
                            return Promise.reject(new Error('角度范围为-180到180度'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      type="number"
                      placeholder="请输入方向角度 (-180到180度)"
                      suffix="°"
                      min={-180}
                      max={180}
                      disabled={currentMode === 'view'}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        // 阻止Delete和Backspace键事件冒泡，防止误删地图上的点
                        if (e.key === 'Delete' || e.key === 'Backspace') {
                          e.stopPropagation();
                        }
                      }}
                    />
                  </Form.Item>
                  
                  {/* 是否禁止掉头字段 - 除节点外的所有类型都显示 */}
                  <Form.Item
                    name="noUturn"
                    label="是否禁止掉头"
                    initialValue={false}
                    style={{ marginBottom: 16 }}
                    tooltip="禁止掉头后，机器人在此点不能进行掉头操作"
                  >
                    <Select placeholder="请选择是否禁止掉头" disabled={currentMode === 'view'}>
                      <Select.Option value={false}>否</Select.Option>
                      <Select.Option value={true}>是</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div><strong>坐标位置:</strong> ({editingPoint?.x}, {editingPoint?.y})</div>
            <div style={{ marginTop: '4px' }}><strong>创建时间:</strong> {new Date().toLocaleString()}</div>
          </div>
        </Form>
      </Modal>
      
      {/* 区域属性编辑弹窗 */}
      <Modal
        title={currentMode === 'view' ? '查看区域属性' : '编辑区域属性'}
        open={areaEditModalVisible}
        zIndex={2000}
        getContainer={getModalContainer}
        onCancel={() => {
          setAreaEditModalVisible(false);
          setEditingArea(null);
          // 延迟重置表单，避免闪现
          setTimeout(() => {
            areaEditForm.resetFields();
          }, 100);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setAreaEditModalVisible(false);
            setEditingArea(null);
            // 延迟重置表单，避免闪现
            setTimeout(() => {
              areaEditForm.resetFields();
            }, 100);
          }}>
            {currentMode === 'view' ? '关闭' : '取消'}
          </Button>,
          ...(currentMode === 'view' ? [] : [
            <Button key="submit" type="primary" onClick={() => areaEditForm.submit()}>
              保存
            </Button>
          ])
        ]}
        width={500}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px'
          }
        }}
      >
        <Form
          form={areaEditForm}
          layout="vertical"
          onFinish={handleSaveAreaEdit}
          initialValues={{
            type: currentAreaType,
            speed: currentAreaType === '调速区域' ? 0.8 : undefined
          }}
        >
          <Form.Item
            label="区域ID"
            style={{ marginBottom: 16 }}
          >
            <Input value={editingArea?.id} disabled style={{ color: '#666' }} />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="区域名称"
            rules={[
              { required: true, message: '请输入区域名称' },
              { max: 20, message: '区域名称不能超过20个字符' }
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input 
              placeholder="请输入区域名称" 
              disabled={currentMode === 'view'}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  // 阻止Delete和Backspace键事件冒泡，防止误删地图上的区域
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.stopPropagation();
                  }
                }}
            />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="区域类型"
            rules={[{ required: true, message: '请选择区域类型' }]}
            style={{ marginBottom: 16 }}
          >
            <Select placeholder="请选择区域类型" disabled={currentMode === 'view'}>
              <Select.Option value="禁行区域">禁行区域</Select.Option>
              <Select.Option value="调速区域">调速区域</Select.Option>
              <Select.Option value="多路网区">多路网区</Select.Option>
            </Select>
          </Form.Item>
          
          {/* 根据区域类型显示不同的字段 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues: any, currentValues: any) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }: any) => {
              const areaType = getFieldValue('type');
              
              // 调速区域显示速度设置字段
              if (areaType === '调速区域') {
                return (
                  <Form.Item
                    name="speed"
                    label="调速设置"
                    rules={[
                      { required: true, message: '请输入调速值' },
                      { 
                        validator: (_: any, value: any) => {
                          const num = Number(value);
                          if (isNaN(num)) {
                            return Promise.reject(new Error('请输入有效的数字'));
                          }
                          if (num <= 0 || num > 10) {
                            return Promise.reject(new Error('速度范围为0.1到10.0 m/s'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      type="number"
                      placeholder="请输入调速值 (0.1-10.0 m/s)"
                      suffix="m/s"
                      min={0.1}
                      max={10}
                      step={0.1}
                      disabled={currentMode === 'view'}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        // 阻止Delete和Backspace键事件冒泡，防止误删地图上的区域
                        if (e.key === 'Delete' || e.key === 'Backspace') {
                          e.stopPropagation();
                        }
                      }}
                    />
                  </Form.Item>
                );
              }
              
              // 多路网区显示路网组选择和机器人关联字段
              if (areaType === '多路网区') {
                return (
                  <>
                    {/* 路网组管理模块 */}
                    <Form.Item
                      label="路网组管理"
                      style={{ marginBottom: 16 }}
                    >
                      <div style={{ 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '6px', 
                        padding: '12px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontWeight: 500, color: '#262626' }}>
                            路网组列表
                          </span>
                          <Button 
                            type="primary" 
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddNetworkGroup()}
                            disabled={currentMode === 'view'}
                          >
                            新增路网组
                          </Button>
                        </div>
                        
                        {/* 路网组列表 */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {networkGroups.filter(group => group.areaId === editingArea?.id).length === 0 ? (
                            <div style={{ 
                              textAlign: 'center', 
                              color: '#999', 
                              padding: '20px 0',
                              fontSize: '14px'
                            }}>
                              暂无路网组，请先新增路网组
                            </div>
                          ) : (
                            networkGroups.filter(group => group.areaId === editingArea?.id).map(group => (
                              <div key={group.id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '8px 12px',
                                marginBottom: '8px',
                                backgroundColor: '#fff',
                                border: '1px solid #e8e8e8',
                                borderRadius: '4px'
                              }}>
                                <div>
                                  <span style={{ fontWeight: 500 }}>{group.name}</span>
                                  {group.description && (
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                      {group.description}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Button 
                                    type="link" 
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditNetworkGroup(group)}
                                    disabled={currentMode === 'view'}
                                    style={{ padding: '0 4px' }}
                                  >
                                    编辑
                                  </Button>
                                  <Button 
                                    type="link" 
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteNetworkGroup(group.id)}
                                    disabled={currentMode === 'view'}
                                    style={{ padding: '0 4px' }}
                                  >
                                    删除
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </Form.Item>

                    {/* 配置路网组 */}
                    <Form.Item
                      label="配置路网组"
                      style={{ marginBottom: 16 }}
                    >
                      <Button 
                        type="default" 
                        icon={<PlusOutlined />} 
                        onClick={() => {
                          const newConfig = {
                            id: Date.now().toString(),
                            networkGroupId: undefined,
                            associatedRobots: [],
                            priority: 0
                          };
                          setNetworkConfigs(prev => [...prev, newConfig]);
                        }}
                        disabled={currentMode === 'view'}
                        style={{ width: '100%' }}
                      >
                        新增
                      </Button>
                    </Form.Item>

                    {/* 动态生成的配置路网组 */}
                    {networkConfigs.map((config, index) => (
                      <div key={config.id} style={{ 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '6px', 
                        padding: '16px', 
                        marginBottom: '16px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontWeight: 500, color: '#262626' }}>
                            配置路网{index + 1}
                          </span>
                          {networkConfigs.length > 1 && (
                            <Button 
                              type="text" 
                              danger 
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                setNetworkConfigs(prev => prev.filter(c => c.id !== config.id));
                              }}
                              disabled={currentMode === 'view'}
                            >
                              删除
                            </Button>
                          )}
                        </div>
                        
                        {/* 选择路网组 */}
                        <Form.Item
                          name={`networkGroupId_${config.id}`}
                          label="选择路网组"
                          style={{ marginBottom: 16 }}
                        >
                          <Select 
                            placeholder="请选择路网组" 
                            disabled={currentMode === 'view'}
                            showSearch
                            value={config.networkGroupId}
                            onChange={(value: string) => {
                               setNetworkConfigs(prev => 
                                 prev.map(c => 
                                   c.id === config.id 
                                     ? { ...c, networkGroupId: value }
                                     : c
                                 )
                               );
                               // 同步更新表单字段值
                               areaEditForm.setFieldValue(`networkGroupId_${config.id}`, value);
                             }}
                            filterOption={(input: string, option: any) =>
                              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {networkGroups.filter(group => group.areaId === editingArea?.id).map(group => (
                              <Select.Option key={group.id} value={group.id}>
                                {group.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        {/* 关联机器人 */}
                        <Form.Item
                          name={`associatedRobots_${config.id}`}
                          label="关联机器人"
                          style={{ marginBottom: 16 }}
                        >
                          <Select 
                            mode="multiple"
                            placeholder="请选择关联机器人（可多选）" 
                            disabled={currentMode === 'view'}
                            showSearch
                            value={config.associatedRobots}
                            onChange={(value: string[]) => {
                               setNetworkConfigs(prev => 
                                 prev.map(c => 
                                   c.id === config.id 
                                     ? { ...c, associatedRobots: value }
                                     : c
                                 )
                               );
                               // 同步更新表单字段值
                               areaEditForm.setFieldValue(`associatedRobots_${config.id}`, value);
                             }}
                            filterOption={(input: string, option: any) =>
                              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {robotDevices.map(robot => (
                              <Select.Option key={robot.id} value={robot.id}>
                                {robot.deviceName}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        {/* 优先级 */}
                        <Form.Item
                          name={`priority_${config.id}`}
                          label="优先级"
                          style={{ marginBottom: 0 }}
                        >
                          <Input 
                            type="number"
                            placeholder="请输入优先级" 
                            disabled={currentMode === 'view'}
                            value={config.priority || 0}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseInt(e.target.value) || 0;
                                setNetworkConfigs(prev => 
                                  prev.map(c => 
                                    c.id === config.id 
                                      ? { ...c, priority: value }
                                      : c
                                  )
                                );
                                // 同步更新表单字段值
                                areaEditForm.setFieldValue(`priority_${config.id}`, value);
                              }}
                          />
                        </Form.Item>
                      </div>
                    ))}
                  </>
                );
              }
              
              return null;
            }}
          </Form.Item>
          
          <Form.Item
            name="description"
            label="区域描述"
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea 
              placeholder="请输入区域描述（可选）" 
              rows={3}
              maxLength={200}
              showCount
              disabled={currentMode === 'view'}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                // 阻止Delete和Backspace键事件冒泡，防止误删地图上的区域
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  e.stopPropagation();
                }
              }}
            />
          </Form.Item>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div><strong>区域点数:</strong> {editingArea?.points?.length || 0} 个点</div>
            <div style={{ marginTop: '4px' }}><strong>创建时间:</strong> {new Date().toLocaleString()}</div>
          </div>
        </Form>
      </Modal>
      
      {/* 线属性编辑弹窗 */}
      <Modal
        title={currentMode === 'view' ? '查看路径属性' : '编辑路径属性'}
        open={lineEditModalVisible}
        zIndex={2000}
        getContainer={getModalContainer}
        onCancel={() => {
          setLineEditModalVisible(false);
          setEditingLine(null);
          lineEditForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setLineEditModalVisible(false);
            setEditingLine(null);
            lineEditForm.resetFields();
          }}>
            {currentMode === 'view' ? '关闭' : '取消'}
          </Button>,
          ...(currentMode === 'view' ? [] : [
            <Button key="submit" type="primary" onClick={() => lineEditForm.submit()}>
              保存
            </Button>
          ])
        ]}
        width={500}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px'
          }
        }}
      >

        
        <Form
          form={lineEditForm}
          layout="vertical"
          onFinish={handleSaveLineEdit}
        >
          <Form.Item
            label="路径ID"
            style={{ marginBottom: 16 }}
          >
            <Input value={editingLine?.id} disabled style={{ color: '#666' }} />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="路径名称"
            rules={[
              { required: true, message: '请输入路径名称' },
              { max: 20, message: '路径名称不能超过20个字符' },
              {
                 validator: async (_: any, value: string) => {
                   if (value && editingLine) {
                     const existingLine = mapLines.find(line => 
                       line.name === value && line.id !== editingLine.id
                     );
                     if (existingLine) {
                       throw new Error('路径名称不能重复');
                     }
                   }
                 }
               }
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input 
              placeholder="请输入路径名称" 
              disabled={currentMode === 'view'}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                // 阻止Delete和Backspace键事件冒泡，防止误删地图上的点和线
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  e.stopPropagation();
                }
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="路径类型"
            rules={[{ required: true, message: '请选择路径类型' }]}
            style={{ marginBottom: 16 }}
          >
            <Select placeholder="请选择路径类型" disabled={currentMode === 'view'}>
              <Select.Option value="single-line">单向直线</Select.Option>
              <Select.Option value="double-line">双向直线</Select.Option>
              <Select.Option value="single-bezier">单向贝塞尔曲线</Select.Option>
              <Select.Option value="double-bezier">双向贝塞尔曲线</Select.Option>
            </Select>
          </Form.Item>
          

          
          <Form.Item
            label="路径长度"
            style={{ marginBottom: 16 }}
          >
            <Input 
              value={`${((editingLine?.length || 0) * 0.05).toFixed(2)} m`} 
              disabled 
              style={{ color: '#666' }} 
              addonAfter="实际距离"
            />
          </Form.Item>

          {/* 新增的12个字段 */}
          <Divider orientation="left" style={{ margin: '24px 0 16px 0', fontSize: '14px', fontWeight: 500 }}>
            路径参数配置
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="weight"
                label="权重"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="请输入权重" 
                  disabled={currentMode === 'view'}
                  type="number"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vehicleExpansionSize"
                label="车身膨胀大小"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.01"
                  addonAfter="m"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isDisabled"
                label="是否禁用"
                valuePropName="checked"
                style={{ marginBottom: 16 }}
              >
                <Switch 
                  checkedChildren="禁用" 
                  unCheckedChildren="启用" 
                  disabled={currentMode === 'view'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isReverse"
                label="是否倒车"
                valuePropName="checked"
                style={{ marginBottom: 16 }}
              >
                <Switch 
                  checkedChildren="倒车" 
                  unCheckedChildren="正向" 
                  disabled={currentMode === 'view'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="drivingAngle"
            label="行驶持夹角"
            style={{ marginBottom: 16 }}
          >
            <Input 
              placeholder="默认空值，度数（正负180度）" 
              disabled={currentMode === 'view'}
              type="number"
              min={-180}
              max={180}
              addonAfter="度"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  e.stopPropagation();
                }
              }}
            />
          </Form.Item>

          <Divider orientation="left" style={{ margin: '24px 0 16px 0', fontSize: '14px', fontWeight: 500 }}>
            速度与加速度配置
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxLinearVelocity"
                label="最大线速度"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.01"
                  min={0}
                  addonAfter="m/s"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxLinearAcceleration"
                label="最大线加速度"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.01"
                  min={0}
                  addonAfter="m/s²"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxLinearDeceleration"
                label="最大线减速度"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.01"
                  min={0}
                  addonAfter="m/s²"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxAngularVelocity"
                label="最大角速度"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.01"
                  min={0}
                  addonAfter="rad/s"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maxAngularAcceleration"
            label="最大角加速度"
            style={{ marginBottom: 16 }}
          >
            <Input 
              placeholder="默认空值" 
              disabled={currentMode === 'view'}
              type="number"
              step="0.01"
              min={0}
              addonAfter="rad/s²"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  e.stopPropagation();
                }
              }}
            />
          </Form.Item>

          <Divider orientation="left" style={{ margin: '24px 0 16px 0', fontSize: '14px', fontWeight: 500 }}>
            精度配置
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="arrivalDistancePrecision"
                label="到点距离精度"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.001"
                  min={0}
                  addonAfter="m"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="arrivalAnglePrecision"
                label="到点角度精度"
                style={{ marginBottom: 16 }}
              >
                <Input 
                  placeholder="默认空值" 
                  disabled={currentMode === 'view'}
                  type="number"
                  step="0.1"
                  min={0}
                  addonAfter="度"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.stopPropagation();
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            <Row gutter={16}>
              <Col span={12}>
                <div><strong>起始点:</strong> {editingLine?.startPointId ? getPointById(editingLine.startPointId)?.name || '未知' : '未知'}</div>
                <div style={{ marginTop: '4px' }}><strong>起始坐标:</strong> 
                  {editingLine?.startPointId ? 
                    `(${getPointById(editingLine.startPointId)?.x || 0}, ${getPointById(editingLine.startPointId)?.y || 0})` : 
                    '(0, 0)'
                  }
                </div>
              </Col>
              <Col span={12}>
                <div><strong>结束点:</strong> {editingLine?.endPointId ? getPointById(editingLine.endPointId)?.name || '未知' : '未知'}</div>
                <div style={{ marginTop: '4px' }}><strong>结束坐标:</strong> 
                  {editingLine?.endPointId ? 
                    `(${getPointById(editingLine.endPointId)?.x || 0}, ${getPointById(editingLine.endPointId)?.y || 0})` : 
                    '(0, 0)'
                  }
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: '8px' }}><strong>创建时间:</strong> {new Date().toLocaleString()}</div>
          </div>
        </Form>
      </Modal>

      {/* 新增/编辑路网组模态框 */}
      <Modal
        title={editingNetworkGroup ? '编辑路网组' : '新增路网组'}
        open={isNetworkGroupModalVisible}
        onOk={() => {
           networkGroupForm.validateFields().then(() => {
             handleSaveNetworkGroup();
           }).catch((info: any) => {
             if (isDev) console.log('Validate Failed:', info);
           });
        }}
        onCancel={() => {
          setIsNetworkGroupModalVisible(false);
          setEditingNetworkGroup(null);
          networkGroupForm.resetFields();
        }}
        width={400}
        destroyOnHidden
        style={{ top: 20 }}
        zIndex={3000}
      >
        <Form
          form={networkGroupForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="路网组名称"
            name="name"
            rules={[
              { required: true, message: '请输入路网组名称' },
              { max: 6, message: '路网组名称不能超过6个字符' }
            ]}
          >
            <Input 
              placeholder="请输入路网组名称（最多6个字符）" 
              maxLength={6}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[
              { max: 100, message: '描述不能超过100个字符' }
            ]}
          >
            <Input.TextArea 
              placeholder="请输入路网组描述（可选，最多100个字符）"
              maxLength={100}
              showCount
              rows={3}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增/编辑路径组模态框 */}
      <Modal
        title={editingPathGroup ? '编辑路径组' : '新增路径组'}
        open={isPathGroupModalVisible}
        getContainer={getModalContainer}
        onOk={() => {
           pathGroupForm.validateFields().then(() => {
             handleSavePathGroup();
           }).catch((info: any) => {
             if (isDev) console.log('Validate Failed:', info);
           });
        }}
        onCancel={() => {
          setIsPathGroupModalVisible(false);
          setEditingPathGroup(null);
          pathGroupForm.resetFields();
        }}
        width={400}
        destroyOnHidden
      >
        <Form
          form={pathGroupForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="路径组名称"
            name="name"
            rules={[
              { required: true, message: '请输入路径组名称' },
              { max: 6, message: '路径组名称不能超过6个字符' }
            ]}
          >
            <Input 
              placeholder="请输入路径组名称（最多6个字符）" 
              maxLength={6}
              showCount
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 线条右键菜单 */}
      {lineContextMenuVisible && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 9999,
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            padding: '4px 0',
            minWidth: '120px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '22px',
              color: 'rgba(0, 0, 0, 0.88)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleOpenPathGroupSelect}
          >
            加入路径组
          </div>
          <div
            style={{
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '22px',
              color: 'rgba(0, 0, 0, 0.88)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleOpenNetworkGroupSelect}
          >
            加入到路网组
          </div>
        </div>
      )}

      {/* 点击其他地方关闭右键菜单 */}
      {lineContextMenuVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998
          }}
          onClick={handleCloseContextMenu}
        />
      )}

      {/* 框选区域右键菜单 */}
      {selectionContextMenuVisible && (
        <div
          style={{
            position: 'fixed',
            left: selectionContextMenuPosition.x,
            top: selectionContextMenuPosition.y,
            zIndex: 9999,
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            padding: '4px 0',
            minWidth: '120px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '22px',
              color: 'rgba(0, 0, 0, 0.88)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleAddSelectionToPathGroup}
          >
            加入到路径组
          </div>
          <div
            style={{
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '22px',
              color: 'rgba(0, 0, 0, 0.88)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleAddSelectionToNetworkGroup}
          >
            加入到路网组
          </div>
        </div>
      )}

      {/* 点击其他地方关闭框选区域右键菜单 */}
      {selectionContextMenuVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998
          }}
          onClick={handleCloseSelectionContextMenu}
        />
      )}

      {/* 路径组选择弹窗 */}
      <Modal
        title={`将 ${contextMenuLineIds.length} 条线加入路径组`}
        open={pathGroupSelectModalVisible}
        onOk={handleAddLinesToPathGroup}
        onCancel={handleClosePathGroupSelect}
        okText="确认加入"
        cancelText="取消"
        width={500}
        getContainer={() => currentMode === 'edit' ? document.querySelector('.map-editor-container') || document.body : document.body}
        zIndex={currentMode === 'edit' ? 2000 : 1000}
      >
        <Form
          form={pathGroupSelectForm}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '16px' }}>
                <span>选择路径组</span>
                <Popover
                  title="新增路径组"
                  open={addPathGroupPopoverVisible}
                  onOpenChange={setAddPathGroupPopoverVisible}
                  content={
                    <div style={{ width: '250px' }}>
                      <Input
                         placeholder="请输入路径名称（不超过6个字符）"
                         value={newPathGroupName}
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPathGroupName(e.target.value)}
                         maxLength={6}
                         showCount
                         allowClear
                         style={{ marginBottom: '12px' }}
                       />
                      <div style={{ textAlign: 'right' }}>
                        <Space>
                          <Button size="small" onClick={handleCancelCreatePathGroup}>
                            取消
                          </Button>
                          <Button 
                            type="primary" 
                            size="small" 
                            onClick={handleCreateNewPathGroup}
                            disabled={!newPathGroupName.trim()}
                          >
                            确认
                          </Button>
                        </Space>
                      </div>
                    </div>
                  }
                  trigger="click"
                  placement="top"
                >
                  <Button 
                    type="dashed" 
                    size="small"
                    icon={<PlusOutlined />}
                  >
                    新增路径组
                  </Button>
                </Popover>
              </div>
            }
            name="pathGroupId"
            rules={[{ required: true, message: '请选择路径组' }]}
          >
            <Select
               placeholder="请选择路径组"
               style={{ width: '100%' }}
             >
               {pathGroups.map(group => (
                 <Select.Option key={group.id} value={group.id}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span>{group.name}</span>
                     <span style={{ color: '#666', fontSize: '12px' }}>({group.paths.length} 条路径)</span>
                   </div>
                 </Select.Option>
               ))}
             </Select>
          </Form.Item>
          
          {/* 显示选中路径组的路径详情 */}
          <Form.Item shouldUpdate>
             {({ getFieldValue }: { getFieldValue: (name: string) => any }) => {
              const selectedGroupId = getFieldValue('pathGroupId');
              const selectedGroup = pathGroups.find(g => g.id === selectedGroupId);
              
              if (selectedGroup && selectedGroup.paths.length > 0) {
                return (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 500, color: '#666' }}>
                      {selectedGroup.name} 中的路径：
                    </div>
                    <div style={{ 
                      maxHeight: '120px', 
                      overflowY: 'auto', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '6px', 
                      padding: '8px',
                      backgroundColor: '#fafafa'
                    }}>
                      {selectedGroup.paths.map((path, index) => (
                        <div key={path.id} style={{ 
                          padding: '4px 0', 
                          borderBottom: index < selectedGroup.paths.length - 1 ? '1px solid #f0f0f0' : 'none',
                          fontSize: '13px'
                        }}>
                          <span style={{ color: '#1890ff', fontWeight: 500 }}>{path.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>
          

        </Form>
      </Modal>

      {/* 路网组选择弹窗 */}
      <Modal
        title={`将 ${contextMenuLineIds.length} 条线加入路网组`}
        open={networkGroupSelectModalVisible}
        onOk={handleAddLinesToNetworkGroup}
        onCancel={handleCloseNetworkGroupSelect}
        okText="确认加入"
        cancelText="取消"
        width={500}
        getContainer={() => currentMode === 'edit' ? document.querySelector('.map-editor-container') || document.body : document.body}
        zIndex={currentMode === 'edit' ? 2000 : 1000}
      >
        <Form
          form={networkGroupSelectForm}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          {/* 选择区域字段 */}
          <Form.Item
            label="选择区域"
            name="areaId"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select
              placeholder="请选择多路网区"
              style={{ width: '100%' }}
              onChange={(value: string) => {
                // 当区域改变时，清空路网组选择
                networkGroupSelectForm.setFieldsValue({ networkGroupId: undefined });
                if (isDev) console.log('选择的区域ID:', value); // 使用value参数避免未使用警告
              }}
            >
              {mapAreas
                .filter(area => area.type === '多路网区') // 只显示多路网区
                .map(area => (
                <Select.Option key={area.id} value={area.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{area.name}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>多路网区</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate>
            {({ getFieldValue }: { getFieldValue: (name: string) => any }) => {
              const selectedAreaId = getFieldValue('areaId');
              return (
                <Form.Item
                  label={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>选择路网组</span>
                      <Popover
                        title="新增路网组"
                        open={addNetworkGroupPopoverVisible}
                        onOpenChange={setAddNetworkGroupPopoverVisible}
                        content={
                          <div style={{ width: '250px' }}>
                            <Input
                              placeholder="请输入路网组名称"
                              value={newNetworkGroupName}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewNetworkGroupName(e.target.value)}
                              style={{ marginBottom: '12px' }}
                              onPressEnter={() => {
                                if (newNetworkGroupName.trim()) {
                                  handleCreateNewNetworkGroup();
                                }
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <Button size="small" onClick={handleCancelCreateNetworkGroup}>
                                取消
                              </Button>
                              <Button 
                                type="primary" 
                                size="small" 
                                onClick={handleCreateNewNetworkGroup}
                                disabled={!newNetworkGroupName.trim()}
                                loading={addNetworkGroupLoading}
                              >
                                确认
                              </Button>
                            </div>
                          </div>
                        }
                        trigger="click"
                        placement="topRight"
                      >
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<PlusOutlined />}
                          disabled={!selectedAreaId}
                          style={{ padding: '0 4px', height: 'auto' }}
                        >
                          新增
                        </Button>
                      </Popover>
                    </div>
                  }
                  name="networkGroupId"
                >
                  <Select
                    placeholder="请选择路网组"
                    style={{ width: '100%' }}
                    disabled={!selectedAreaId} // 未选择区域时禁用
                  >
                    {networkGroups
                      .filter(group => group.areaId === selectedAreaId) // 根据选择的区域过滤路网组
                      .map(group => (
                      <Select.Option key={group.id} value={group.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{group.name}</span>
                          <span style={{ color: '#666', fontSize: '12px' }}>({group.paths.length} 条路径)</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>
          
          {/* 显示选中路网组的路径详情 */}
          <Form.Item shouldUpdate>
             {({ getFieldValue }: { getFieldValue: (name: string) => any }) => {
              const selectedGroupId = getFieldValue('networkGroupId');
              const selectedGroup = networkGroups.find(g => g.id === selectedGroupId);
              
              if (selectedGroup && selectedGroup.paths.length > 0) {
                return (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 500, color: '#666' }}>
                      {selectedGroup.name} 中的路径：
                    </div>
                    <div style={{ 
                      maxHeight: '120px', 
                      overflowY: 'auto', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '6px', 
                      padding: '8px',
                      backgroundColor: '#fafafa'
                    }}>
                      {selectedGroup.paths.map((path, index) => (
                        <div key={path.id} style={{ 
                          padding: '4px 0', 
                          borderBottom: index < selectedGroup.paths.length - 1 ? '1px solid #f0f0f0' : 'none',
                          fontSize: '13px'
                        }}>
                          <span style={{ color: '#1890ff', fontWeight: 500 }}>{path.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>
          

        </Form>
      </Modal>



      {/* 批量设置面板 */}
      <BatchSettingsPanel
        visible={batchSettingsPanelVisible}
        onClose={() => setBatchSettingsPanelVisible(false)}
        selectedPoints={selectedPoints.map(pointId => {
          const point = mapPoints.find(p => p.id === pointId);
          return point ? {
            id: point.id,
            name: point.name,
            direction: point.direction || 0,
            type: point.type || 'normal',
            baseMapId: point.baseMapId || ''
          } : null;
        }).filter((item): item is { id: string; name: string; direction: number; type: string; baseMapId: string } => item !== null)}
        onUpdate={(updateData) => {
          // 批量更新选中的点
          setMapPoints(prevPoints => 
            prevPoints.map(point => {
              if (selectedPoints.includes(point.id)) {
                return {
                  ...point,
                  ...(updateData.direction !== undefined && { direction: updateData.direction }),
                  ...(updateData.type !== undefined && { type: updateData.type }),
                  ...(updateData.baseMapId !== undefined && { baseMapId: updateData.baseMapId })
                };
              }
              return point;
            })
          );
          
          // 关闭面板
          setBatchSettingsPanelVisible(false);
          
          // 清除选中状态
          setSelectedPoints([]);
          
          message.success(`已批量更新 ${selectedPoints.length} 个点的设置`);
        }}
      />
    </div>
  );
};

export default MapManagement;