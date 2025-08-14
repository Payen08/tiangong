import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  Checkbox,
  Progress,
  Alert,
  List,
  Collapse,
  Select,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { ChangeEvent } from 'react';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  ExportOutlined,
  EyeOutlined,
  FileImageOutlined,
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  ImportOutlined,
  CloudDownloadOutlined,
  FolderOpenOutlined,
  RobotOutlined,
  WifiOutlined,
  DisconnectOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  DragOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  HomeOutlined,
  SaveOutlined,
  CheckOutlined,
  SearchOutlined,
  SendOutlined,
  CloseOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
  AppstoreOutlined,
  GroupOutlined,
  EnvironmentOutlined,
  LineOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

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

// 地图文件数据类型
interface MapFile {
  id: string;
  name: string;
  thumbnail: string;
  status: 'active' | 'inactive';
  format: string;
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
  success: boolean;
  errorMessage?: string;
  duration: number;
}

const MapManagement: React.FC = () => {
  const navigate = useNavigate();
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
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [allSyncCompleted, setAllSyncCompleted] = useState(false);
  
  // 地图名称搜索相关状态
  const [searchMapName, setSearchMapName] = useState<string>('');
  const [searchedMapFiles, setSearchedMapFiles] = useState<MapFile[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // 新增地图文件相关状态
  const [addMapFileDrawerVisible, setAddMapFileDrawerVisible] = useState(false);
  const [addMapFileStep, setAddMapFileStep] = useState(1); // 1: 基本信息, 2: 地图编辑
  const [addMapFileForm] = Form.useForm();
  const [mapFileUploadedImage, setMapFileUploadedImage] = useState<any>(null);
  const [addMapFileLoading, setAddMapFileLoading] = useState(false);
  const [currentMapFileName, setCurrentMapFileName] = useState<string>(''); // 当前地图文件名称
  
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
  
  // 连线数据类型
  interface MapLine {
    id: string;
    name: string; // 线名称，从e1开始
    startPointId: string;
    endPointId: string;
    type: 'double-line' | 'single-line' | 'double-bezier' | 'single-bezier';
    color?: string;
    length?: number; // 线长度（像素）
    pairedLineId?: string; // 配对线的ID（仅用于double-line类型的两条独立线）
    direction?: 'forward' | 'backward'; // 线的方向（仅用于double-line类型）
  }

  // 地图编辑器状态
  const [selectedTool, setSelectedTool] = useState<string>('select'); // 当前选中的工具，默认选中选择工具
  const [mapType, setMapType] = useState<'topology' | 'grayscale'>('topology'); // 地图类型：拓扑地图或黑白底图
  const [currentMode, setCurrentMode] = useState<'edit' | 'view'>('edit'); // 当前模式：编辑模式或阅览模式
  const [exitEditModalVisible, setExitEditModalVisible] = useState(false); // 退出编辑模式确认弹窗
  // 预设节点数据 - 已清空测试数据
  const defaultMapPoints: any[] = [];
  
  // 默认路径数据 - 已清空测试数据
  const defaultMapLines: MapLine[] = [];

  const [mapPoints, setMapPoints] = useState<any[]>(defaultMapPoints); // 地图上的点
  const [mapLines, setMapLines] = useState<MapLine[]>(defaultMapLines); // 地图上的连线
  const [pointCounter, setPointCounter] = useState(1); // 点名称计数器
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]); // 选中的点ID列表
  const [selectedLines, setSelectedLines] = useState<string[]>([]); // 选中的线ID列表
  const [isSelecting, setIsSelecting] = useState(false); // 是否正在框选
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null); // 框选起始点
  const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null); // 框选结束点
  const [editingPoint, setEditingPoint] = useState<any | null>(null); // 正在编辑的点
  const [pointEditModalVisible, setPointEditModalVisible] = useState(false); // 点编辑弹窗显示状态
  const [pointEditForm] = Form.useForm(); // 点编辑表单
  
  // 连线相关状态
  const [isConnecting, setIsConnecting] = useState(false); // 是否正在连线
  const [connectingStartPoint, setConnectingStartPoint] = useState<string | null>(null); // 连线起始点ID
  const [lineCounter, setLineCounter] = useState(1); // 线名称计数器
  const [editingLine, setEditingLine] = useState<MapLine | null>(null); // 正在编辑的线
  const [lineEditModalVisible, setLineEditModalVisible] = useState(false); // 线编辑弹窗显示状态
  const [lineEditForm] = Form.useForm(); // 线编辑表单
  const [doubleLineClickCount, setDoubleLineClickCount] = useState<Record<string, number>>({}); // 双向直线的双击计数
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null); // 鼠标悬停的点ID
  const [continuousConnecting, setContinuousConnecting] = useState(false); // 连续连线模式
  const [lastConnectedPoint, setLastConnectedPoint] = useState<string | null>(null); // 上一个连接的点ID
  
  // 画布拖动和缩放相关状态
  const [canvasScale, setCanvasScale] = useState(1); // 画布缩放比例
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 }); // 画布偏移量
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖动画布
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // 拖动起始位置
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
  interface NetworkNode {
    id: string;
    name: string;
    description: string;
  }

  interface NetworkPath {
    id: string;
    name: string;
    description: string;
  }

  interface NetworkGroup {
    id: string;
    name: string;
    nodes: NetworkNode[];
    paths: NetworkPath[];
  }

  // 路径组数据结构
  interface PathGroupPath {
    id: string;
    name: string;
    description: string;
  }

  interface PathGroup {
    id: string;
    name: string;
    paths: PathGroupPath[];
  }

  // 路网组状态管理
  const [networkGroups, setNetworkGroups] = useState<NetworkGroup[]>([
    {
      id: 'network-group1',
      name: '路网组1',
      nodes: [
        { id: 'n1', name: 'n1', description: '站点' },
        { id: 'n2', name: 'n2', description: '电梯' },
        { id: 'n3', name: 'n3', description: '站点' },
        { id: 'n4', name: 'n4', description: '充电桩' },
        { id: 'n5', name: 'n5', description: '停靠点' }
      ],
      paths: [
        { id: 'e1', name: 'e1', description: 'n1→n2' },
        { id: 'e2', name: 'e2', description: 'n3→n4' },
        { id: 'e3', name: 'e3', description: 'n2→n5' },
        { id: 'e4', name: 'e4', description: 'n1→n3' }
      ]
    },
    {
      id: 'network-group2',
      name: '路网组2',
      nodes: [
        { id: 'n1_g2', name: 'n1', description: '站点1' },
        { id: 'n3_g2', name: 'n3', description: '站点' }
      ],
      paths: [
        { id: 'e1_g2', name: 'e1', description: 'n1→n2' }
      ]
    }
  ]);

  // 路径组管理状态
  const [isPathGroupModalVisible, setIsPathGroupModalVisible] = useState(false);
  const [editingPathGroup, setEditingPathGroup] = useState<PathGroup | null>(null);
  const [pathGroupForm] = Form.useForm();

  // 路径组状态管理
  const [pathGroups, setPathGroups] = useState<PathGroup[]>([
    {
      id: 'path-group1',
      name: '路径组1',
      paths: [
        { id: 'e1', name: 'e1', description: 'n1→n2' },
        { id: 'e2', name: 'e2', description: 'n3→n4' }
      ]
    },
    {
      id: 'path-group2',
      name: '路径组2',
      paths: [
        { id: 'e1_pg2', name: 'e1', description: 'n1→n2' },
        { id: 'e2_pg2', name: 'e2', description: 'n3→n4' }
      ]
    }
  ]);

  // 移除节点函数
  const removeNodeFromGroup = (groupId: string, nodeId: string) => {
    setNetworkGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          nodes: group.nodes.filter(node => node.id !== nodeId)
        };
      }
      return group;
    }));
    message.success('节点已移除');
  };

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

  // 设为默认显示
  const handleSetDefaultNetworkGroup = (groupId: string) => {
    setDefaultNetworkGroup(groupId);
    message.success('已设为默认显示路网组');
  };

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
      console.error('保存失败:', error);
    }
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
      console.error('保存失败:', error);
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

  // 退出连线模式函数
  const exitConnectingMode = () => {
    setIsConnecting(false);
    setContinuousConnecting(false);
    setConnectingStartPoint(null);
    setLastConnectedPoint(null);
  };

  // 框选状态引用
  const wasJustSelecting = React.useRef(false);
  
  // 防抖引用 - 防止React.StrictMode导致的重复点击
  const lastClickTime = React.useRef(0);

  // 屏幕坐标转画布坐标函数
  const screenToCanvasCoordinates = (screenX: number, screenY: number, canvasElement: HTMLDivElement) => {
    const rect = canvasElement.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;
    
    // CSS transform: scale(canvasScale) translate(canvasOffset.x, canvasOffset.y)
    // 变换顺序：先缩放，再平移
    // 逆变换：先减去平移，再除以缩放
    // 但是CSS中的translate是在缩放后的坐标系中，所以需要先除以缩放，再减去偏移
    const canvasX = (relativeX / canvasScale) - canvasOffset.x;
    const canvasY = (relativeY / canvasScale) - canvasOffset.y;
    
    // 调试日志
    console.log('🔍 [坐标转换调试] screenToCanvasCoordinates (修复后):', {
      输入: { screenX, screenY },
      画布边界: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      相对坐标: { relativeX, relativeY },
      画布状态: { canvasScale, canvasOffset },
      计算过程: {
        step1_除以缩放: { x: relativeX / canvasScale, y: relativeY / canvasScale },
        step2_减去偏移: { x: (relativeX / canvasScale) - canvasOffset.x, y: (relativeY / canvasScale) - canvasOffset.y }
      },
      最终结果: { canvasX, canvasY }
    });
    
    return { x: canvasX, y: canvasY };
  };

  // 专门的坐标转换验证函数
  const debugCoordinateTransformation = (screenX: number, screenY: number, canvasElement: HTMLDivElement) => {
    const rect = canvasElement.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;
    
    // 修复后的转换逻辑
    const canvasX = (relativeX / canvasScale) - canvasOffset.x;
    const canvasY = (relativeY / canvasScale) - canvasOffset.y;
    
    // 反向验证：画布坐标转回屏幕坐标
    const backToRelativeX = (canvasX + canvasOffset.x) * canvasScale;
    const backToRelativeY = (canvasY + canvasOffset.y) * canvasScale;
    const backToScreenX = backToRelativeX + rect.left;
    const backToScreenY = backToRelativeY + rect.top;
    
    console.log('🔍 [坐标转换验证] 详细分析 (修复后):', {
      '1_输入屏幕坐标': `{x: ${screenX}, y: ${screenY}}`,
      '2_画布边界信息': {
        left: rect.left.toFixed(2),
        top: rect.top.toFixed(2),
        width: rect.width.toFixed(2),
        height: rect.height.toFixed(2)
      },
      '3_相对画布坐标': `{x: ${relativeX.toFixed(2)}, y: ${relativeY.toFixed(2)}}`,
      '4_当前画布状态': {
        canvasScale: canvasScale.toFixed(3),
        canvasOffset: `{x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}`
      },
      '5_转换后画布坐标': `{x: ${canvasX.toFixed(2)}, y: ${canvasY.toFixed(2)}}`,
      '6_反向验证': {
        backToRelative: `{x: ${backToRelativeX.toFixed(2)}, y: ${backToRelativeY.toFixed(2)}}`,
        backToScreen: `{x: ${backToScreenX.toFixed(2)}, y: ${backToScreenY.toFixed(2)}}`
      },
      '7_坐标转换误差': {
        x_error: Math.abs(screenX - backToScreenX).toFixed(2),
        y_error: Math.abs(screenY - backToScreenY).toFixed(2)
      }
    });
    
    return { canvasX, canvasY, backToScreenX, backToScreenY };
  };

  // 画布坐标转屏幕坐标函数
  const canvasToScreenCoordinates = (canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // 正确的逆变换：这是 screenToCanvasCoordinates 的完全逆变换
    // screenToCanvasCoordinates: canvasX = (relativeX / canvasScale) - canvasOffset.x
    // 其中 relativeX = screenX - rect.left
    // 所以：canvasX = ((screenX - rect.left) / canvasScale) - canvasOffset.x
    // 逆变换：screenX = (canvasX + canvasOffset.x) * canvasScale + rect.left
    
    const screenX = (canvasX + canvasOffset.x) * canvasScale + rect.left;
    const screenY = (canvasY + canvasOffset.y) * canvasScale + rect.top;
    
    // 调试日志（减少频繁输出）
    if (Math.random() < 0.02) {
      console.log('🔄 [坐标转换调试] canvasToScreenCoordinates (修复后):', {
        输入: { canvasX: canvasX.toFixed(2), canvasY: canvasY.toFixed(2) },
        画布边界: { left: rect.left.toFixed(2), top: rect.top.toFixed(2) },
        画布状态: { canvasScale: canvasScale.toFixed(3), canvasOffset: `{x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}` },
        计算公式: {
          X轴: `(${canvasX.toFixed(2)} + ${canvasOffset.x.toFixed(2)}) * ${canvasScale.toFixed(3)} + ${rect.left.toFixed(2)} = ${screenX.toFixed(2)}`,
          Y轴: `(${canvasY.toFixed(2)} + ${canvasOffset.y.toFixed(2)}) * ${canvasScale.toFixed(3)} + ${rect.top.toFixed(2)} = ${screenY.toFixed(2)}`
        },
        最终结果: { screenX: screenX.toFixed(2), screenY: screenY.toFixed(2) }
      });
    }
    
    return { x: screenX, y: screenY };
  };

  // 根据ID获取点数据
  const getPointById = (pointId: string) => {
    return mapPoints.find(point => point.id === pointId);
  };

  // 监听ESC键处理逻辑
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // 阻止默认的ESC键行为（防止关闭抽屉）
        event.preventDefault();
        event.stopPropagation();
        
        // 如果在地图编辑模式下
        if (addMapFileDrawerVisible) {
          // 如果正在连线模式，退出连线模式
          if (isConnecting || continuousConnecting) {
            exitConnectingMode();
          }
          // 切换到选择工具
          console.log('⌨️ [工具切换] 检测到ESC键，切换到选择工具');
          setSelectedTool('select');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // 使用捕获阶段
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isConnecting, continuousConnecting, addMapFileDrawerVisible]);

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
  const adjustColumnWidths = (columns: ColumnsType<MapData>, mobile: boolean) => {
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
        console.error('解析localStorage数据失败:', error);
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

  // 根据地图名称获取地图文件数据
  const getMapFilesByName = (mapName: string): MapFile[] => {
    // 首先根据地图名称找到对应的地图数据
    const targetMap = mapData.find(map => map.name === mapName);
    if (!targetMap) {
      console.warn(`未找到名称为 "${mapName}" 的地图`);
      return [];
    }
    
    // 根据地图ID获取地图文件
    return getMapFiles(targetMap.id);
  };

  // 加载地图文件数据（根据地图名称）
  const loadMapFilesByName = async (mapName: string): Promise<MapFile[]> => {
    try {
      setLoading(true);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 获取地图文件数据
      const files = getMapFilesByName(mapName);
      
      if (files.length === 0) {
        message.info(`地图 "${mapName}" 暂无文件数据`);
      } else {
        message.success(`成功加载地图 "${mapName}" 的 ${files.length} 个文件`);
      }
      
      return files;
    } catch (error) {
      console.error('加载地图文件失败:', error);
      message.error('加载地图文件失败，请重试');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 处理地图名称搜索
  const handleSearchMapFiles = async () => {
    if (!searchMapName.trim()) {
      message.warning('请输入地图名称');
      return;
    }
    
    const files = await loadMapFilesByName(searchMapName.trim());
    setSearchedMapFiles(files);
    setIsSearchMode(true);
  };

  // 清除搜索结果
  const handleClearSearch = () => {
    setSearchMapName('');
    setSearchedMapFiles([]);
    setIsSearchMode(false);
  };

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
                key: 'sync',
                icon: <SyncOutlined />,
                label: '同步',
                onClick: () => handleMapSync(record),
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
                        key: 'sync',
                        icon: <SyncOutlined />,
                        label: '同步',
                        onClick: () => handleMapSync(record),
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
  const desktopColumns = adjustColumnWidths(filteredColumns, isMobile);

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
    console.log('地图设置:', record);
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
    setShowSyncProgress(true);
    
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
    setSyncResults([]);
    setAllSyncCompleted(false);
    
    // 开始同步过程
    await performSync(initialStatuses);
  };
  
  // 执行同步过程
  const performSync = async (statuses: SyncStatus[]) => {
    const results: SyncResult[] = [];
    
    // 模拟并发同步
    const syncPromises = statuses.map(async (status, index) => {
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
          results.push({ robotId: status.robotId, success: true, duration });
        } else {
          const errorMessage = '网络连接超时，请检查机器人连接状态';
          setSyncStatuses(prev => prev.map(s => 
            s.robotId === status.robotId 
              ? { ...s, status: 'failed', errorMessage, endTime }
              : s
          ));
          results.push({ robotId: status.robotId, success: false, errorMessage, duration });
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
        results.push({ robotId: status.robotId, success: false, errorMessage, duration });
      }
    });
    
    // 等待所有同步完成
    await Promise.all(syncPromises);
    
    // 设置同步结果
    setSyncResults(results);
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
    setShowSyncProgress(false);
    setSyncStatuses([]);
    setSyncResults([]);
    setAllSyncCompleted(false);
    
    // 重置同步相关状态
    setSyncingMap(null);
    setSelectedSyncRobots([]);
    setSelectedSyncMapFiles([]);
  };

  const handleEnable = (record: MapData) => {
    console.log('启用地图:', record);
  };

  const handleSync = (record: MapData) => {
    console.log('同步地图:', record);
  };

  const handleExport = (record: MapData) => {
    console.log('导出地图:', record);
  };

  const handleDownload = (file: MapFile) => {
    console.log('下载文件:', file);
  };

  const handleDeleteFile = (file: MapFile) => {
    console.log('删除文件:', file);
  };

  const handleDetail = (file: MapFile) => {
    console.log('查看文件详情:', file);
  };

  const handleEnableFile = (file: MapFile, mapId: string) => {
    console.log('启用文件:', file);
    
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

  const handleSyncFile = (file: MapFile) => {
    console.log('同步文件:', file);
  };

  const handleViewDetails = (file: MapFile) => {
    console.log('查看详情:', file);
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

  const handleAddMapFileNext = async () => {
    try {
      await addMapFileForm.validateFields();
      setAddMapFileStep(2);
    } catch (error) {
      console.log('表单验证失败:', error);
    }
  };

  const handleAddMapFilePrev = () => {
    setAddMapFileStep(1);
  };

  const handleAddMapFileSubmit = async (values: any) => {
    try {
      setAddMapFileLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      const newMapFile: MapFile = {
        id: `file_${Date.now()}`,
        name: values.mapFileName,
        thumbnail: mapFileUploadedImage?.url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
        status: 'inactive',
        format: 'PNG',
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
      
      setAddMapFileDrawerVisible(false);
      addMapFileForm.resetFields();
      setMapFileUploadedImage(null);
      setAddMapFileStep(1);
      message.success('地图文件添加成功！');
    } catch (error) {
      message.error('添加失败，请重试');
    } finally {
      setAddMapFileLoading(false);
    }
  };

  const handleMapFileImageUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // 模拟上传成功
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setMapFileUploadedImage({
          url: reader.result,
          name: info.file.name
        });
      });
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const handleCloseAddMapFileDrawer = () => {
    setAddMapFileDrawerVisible(false);
    addMapFileForm.resetFields();
    setMapFileUploadedImage(null);
    setAddMapFileStep(1);
    setCurrentMapFileName(''); // 重置地图文件名称
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
  };
  
  // 新的顶部工具栏处理函数
  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消',
      content: '取消后将丢失所有未保存的修改，确定要取消吗？',
      onOk: () => {
        handleCloseAddMapFileDrawer();
        message.info('已取消编辑');
      }
    });
  };
  
  const handleSave = () => {
    // 保存当前地图编辑状态
    message.success('地图已保存');
    console.log('保存地图数据:', { mapPoints, mapLines });
  };
  
  const handleSubmit = () => {
    // 提交地图数据
    message.success('地图已提交');
    console.log('提交地图数据:', { mapPoints, mapLines });
  };
  
  const handleSubmitAndExit = () => {
    // 提交并退出
    message.success('地图已提交，正在退出编辑器');
    console.log('提交并退出:', { mapPoints, mapLines });
    setTimeout(() => {
      handleCloseAddMapFileDrawer();
    }, 1000);
  };

  // 模式切换处理函数
  const handleExitEditMode = () => {
    setExitEditModalVisible(true);
  };

  const handleEnterEditMode = () => {
    setCurrentMode('edit');
    message.success('已进入编辑模式');
  };

  const handleConfirmExitEdit = () => {
    // 这里可以添加提交地图编辑数据的逻辑
    setCurrentMode('view');
    setExitEditModalVisible(false);
    message.success('已退出编辑模式，地图数据已提交');
  };

  const handleCancelExitEdit = () => {
    setExitEditModalVisible(false);
  };

  // 搜索处理函数
  const handleSearch = (value: string) => {
    setSearchValue(value);
    console.log(`搜索${searchType === 'line' ? '线' : '点'}:`, value);
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
    console.log('🔥 [触摸事件] TouchStart被触发!', {
      touchCount: event.touches.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    console.log('🔍 [触摸调试] TouchStart事件触发', {
      touchCount: event.touches.length,
      isCanvasClicked,
      isSpacePressed,
      canAllowZoom: event.touches.length === 2 && isCanvasClicked && isSpacePressed
    });
    
    // 只有在画布被点击过且空格键按下时才允许双指缩放
    if (event.touches.length === 2 && isCanvasClicked && isSpacePressed) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      setLastTouchDistance(distance);
      console.log('👆 [双指缩放] 开始双指操作，初始距离:', distance);
    }
  };
  
  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    // 基础触摸事件调试 - 无条件触发
    console.log('🔥 [触摸事件] TouchMove被触发!', {
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
        console.log('🔍 [双指缩放] 缩放中，当前比例:', newScale);
      }
    }
  };
  
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    // 基础触摸事件调试 - 无条件触发
    console.log('🔥 [触摸事件] TouchEnd被触发!', {
      touchCount: event.touches.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (event.touches.length < 2) {
      setLastTouchDistance(null);
      console.log('✋ [双指缩放] 结束双指操作');
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    // 鼠标滚轮缩放 - 作为触摸缩放的替代方案
    console.log('🖱️ [滚轮缩放] 滚轮事件触发', {
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
      console.log('🔍 [滚轮缩放] 缩放比例:', newScale);
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
  const handleToolSelect = (toolType: string) => {    // 检查是否是连线工具
    const isLineToolSelected = ['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(toolType);    setSelectedTool(toolType);
    
    // 切换工具时关闭拖动模式
    if (dragTool) {
      setDragTool(false);
    }
    
    // 切换工具时清除选择状态
    if (toolType !== 'select') {      setSelectedPoints([]);
      setSelectedLines([]);  // 添加清除线的选中状态
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);    } else {    }
    
    // 如果选择了连线工具，重置连线状态
    if (isLineToolSelected) {      // 重置连线相关状态
      setIsConnecting(false);
      setConnectingStartPoint(null);
      setContinuousConnecting(false);
      setLastConnectedPoint(null);    } else if (isConnecting || continuousConnecting) {
      // 如果当前处于连线模式但选择了非连线工具，退出连线模式      exitConnectingMode();
    }
  };
  
  // 画布点击处理
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // 设置画布被点击状态，用于启用双指缩放功能
    setIsCanvasClicked(true);
    
    // 防抖逻辑 - 防止React.StrictMode导致的重复点击
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current < 100) { // 100ms内的重复点击将被忽略
      console.log('🚫 [防抖] 检测到重复点击，忽略此次点击', {
        时间间隔: currentTime - lastClickTime.current,
        上次点击时间: lastClickTime.current,
        当前点击时间: currentTime
      });
      return;
    }
    lastClickTime.current = currentTime;
    
    // 如果点击的是地图点，不处理画布点击
    if ((event.target as Element).closest('.map-point')) {
      return;
    }
    
    // 如果是选择工具且刚刚完成了框选操作，需要特殊处理
    if (selectedTool === 'select' && wasJustSelecting.current) {
      wasJustSelecting.current = false;
      
      // 即使刚完成框选，也要清除线的选中状态（如果有的话）
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
      return;
    }
    
    if (selectedTool === 'point') {
      const canvasElement = event.currentTarget;
      
      // 详细的坐标转换调试
      console.log('🎯 [完整坐标流程] handleCanvasClick开始', {
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
      
      console.log('🎯 [完整坐标流程] 坐标转换完成', {
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
        type: '站点', // 默认类型
        x: x,
        y: y,
        direction: 0 // 默认方向
      };
      
      setMapPoints(prev => [...prev, newPoint]);
      setPointCounter(prev => prev + 1);
    } else if (selectedTool === 'select') {
      // 选择工具：只有在非框选状态且没有选中点时才清除选择状态
      if (!isSelecting && selectedPoints.length === 0) {
        // 清除线的选中状态
        if (selectedLines.length > 0) {
          setSelectedLines([]);
        }
        
        setSelectionStart(null);
        setSelectionEnd(null);
      } else if (!isSelecting && selectedPoints.length > 0) {
        // 只清除线的选中状态，保留点的选中状态和框选坐标
        if (selectedLines.length > 0) {
          setSelectedLines([]);
        }
      }
      // 框选进行中时不做任何处理
    } else {
      // 其他工具模式：清除线的选中状态
      if (selectedLines.length > 0) {
        setSelectedLines([]);
      }
    }
  };
  
  // 点击点元素处理
  const handlePointClick = (event: React.MouseEvent, pointId: string) => {
    const clickedPoint = mapPoints.find(p => p.id === pointId);    event.stopPropagation();
    
    // 连线工具模式处理
    if (['double-line', 'single-line', 'double-bezier', 'single-bezier'].includes(selectedTool)) {      handlePointConnection(pointId);
      return;
    }
    
    if (selectedTool === 'select') {      let newSelectedPoints: string[];
      
      if (event.ctrlKey || event.metaKey) {        // Ctrl/Cmd + 点击：多选
        const wasSelected = selectedPoints.includes(pointId);
        newSelectedPoints = wasSelected
          ? selectedPoints.filter(id => id !== pointId)
          : [...selectedPoints, pointId];      } else {        // 普通点击：单选
        newSelectedPoints = [pointId];      }      setSelectedPoints(newSelectedPoints);
      
      // 清除线的选中状态（点和线不能同时选中）
      if (selectedLines.length > 0) {        setSelectedLines([]);
      }
      
      // 更新框选矩形以围绕选中的点
       if (newSelectedPoints.length > 0) {         const selectedPointsData = mapPoints.filter(point => newSelectedPoints.includes(point.id));         // 考虑点的实际大小（半径8px）和选中时的缩放（1.2倍）
         const pointRadius = 8 * 1.2; // 选中时点会放大到1.2倍
         const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
         const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
         const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
         const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
         
         // 添加一些边距使框选框更明显
         const padding = 15;
         const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
         const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
         
         console.log('🎯 [选中点框选] 设置框选坐标', {
           选中点数量: newSelectedPoints.length,
           画布坐标范围: { pointMinX, pointMaxX, pointMinY, pointMaxY },
           框选起始坐标: newSelectionStart,
           框选结束坐标: newSelectionEnd
         });
         
         setSelectionStart(newSelectionStart);
         setSelectionEnd(newSelectionEnd);
      } else {        // 没有选中点时清除框选
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    } else {    }
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
      setContinuousConnecting(true);
      setConnectingStartPoint(pointId);
      setLastConnectedPoint(pointId);
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

        // 创建新的连线
        if (selectedTool === 'double-line') {
          // 双向线：创建两条独立的单向线
          const forwardLineId = `line_${Date.now()}_forward`;
          const backwardLineId = `line_${Date.now()}_backward`;
          
          const forwardLine: MapLine = {
            id: forwardLineId,
            name: `e${lineCounter}`,
            startPointId: startPoint,
            endPointId: pointId,
            type: 'double-line',
            color: '#87CEEB',
            length: Math.round(lineLength),
            pairedLineId: backwardLineId,
            direction: 'forward'
          };
          
          const backwardLine: MapLine = {
            id: backwardLineId,
            name: `e${lineCounter + 1}`,
            startPointId: pointId,
            endPointId: startPoint,
            type: 'double-line',
            color: '#87CEEB',
            length: Math.round(lineLength),
            pairedLineId: forwardLineId,
            direction: 'backward'
          };
          
          // 更新线计数器（双向线占用两个名称）
          setLineCounter(prev => prev + 2);
          
          // 更新连线数据
          setMapLines(prev => {
            const newLines = [...prev, forwardLine, backwardLine];
            return newLines;
          });
          
          message.success(`成功创建双向线条：${forwardLine.name} 和 ${backwardLine.name}`);
        } else {
          // 单向线：创建一条线
          const newLine: MapLine = {
            id: `line_${Date.now()}`,
            name: `e${lineCounter}`,
            startPointId: startPoint,
            endPointId: pointId,
            type: selectedTool as 'single-line' | 'double-bezier' | 'single-bezier',
            color: '#87CEEB',
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
    event.stopPropagation();
    
    if (selectedTool === 'select') {
      setEditingPoint(point);
      pointEditForm.setFieldsValue({
        name: point.name,
        type: point.type,
        direction: point.direction
      });
      setPointEditModalVisible(true);
    }
  };

  // 框选开始处理

  // 框选开始处理
  const handleSelectionStart = (event: React.MouseEvent<HTMLDivElement>) => {
    // 只有在选择工具激活且没有点击到地图点且是左键点击时才开始框选
    if (selectedTool === 'select' && !(event.target as Element).closest('.map-point') && event.button === 0) {
      // 阻止默认行为和事件冒泡
      event.preventDefault();
      event.stopPropagation();
      
      const canvasElement = event.currentTarget;
      
      // 使用坐标转换函数将屏幕坐标转换为画布坐标
      const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);
      
      // 调试日志 - 框选开始
       console.log('📦 [框选调试] handleSelectionStart 详细数据 (修复后):', {
          '1_鼠标屏幕坐标': `{clientX: ${event.clientX}, clientY: ${event.clientY}}`,
          '2_转换后画布坐标': `{x: ${x.toFixed(2)}, y: ${y.toFixed(2)}}`,
          '3_画布状态': `{scale: ${canvasScale.toFixed(3)}, offset: {x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}}`
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
            if (Math.random() < 0.05) { // 只输出5%的调用
              console.log('📦 [框选调试] handleGlobalMouseMove 详细数据 (修复后):', {
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
  const handleSelectionMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // 这个函数现在由全局事件监听处理，保留以防需要
  };
  
  // 框选结束处理（带状态参数）
  const handleSelectionEndWithState = (wasSelecting: boolean, startPos: {x: number, y: number} | null, endPos: {x: number, y: number} | null) => {
    if (wasSelecting && startPos && endPos) {
      // startPos和endPos已经是画布坐标，直接使用即可
      // 计算框选区域（画布坐标）
      const minX = Math.min(startPos.x, endPos.x);
      const maxX = Math.max(startPos.x, endPos.x);
      const minY = Math.min(startPos.y, endPos.y);
      const maxY = Math.max(startPos.y, endPos.y);
      
      // 检查框选区域是否足够大（避免误触）
      const width = maxX - minX;
      const height = maxY - minY;
      const minSelectionSize = 3; // 降低最小框选尺寸
      
      console.log('🎯 [框选调试] 框选结束处理:', {
        '画布坐标': { startPos, endPos },
        '框选区域': { minX: minX.toFixed(2), maxX: maxX.toFixed(2), minY: minY.toFixed(2), maxY: maxY.toFixed(2) },
        '区域大小': { width: width.toFixed(2), height: height.toFixed(2) }
      });
      
      if (width > minSelectionSize || height > minSelectionSize) {
        // 找出在框选区域内的点（使用画布坐标判断）
        const selectedPointIds = mapPoints
          .filter(point => {
            const inSelection = point.x >= minX && point.x <= maxX && 
                               point.y >= minY && point.y <= maxY;
            return inSelection;
          })
          .map(point => point.id);
        
        setSelectedPoints(selectedPointIds);
        
        // 如果有选中的点，保持框选状态但更新框选区域为选中点的边界
        if (selectedPointIds.length > 0) {
          const selectedPointsData = mapPoints.filter(point => selectedPointIds.includes(point.id));
          // 考虑点的实际大小（半径8px）和选中时的缩放（1.2倍）
          const pointRadius = 8 * 1.2; // 选中时点会放大到1.2倍
          const pointMinX = Math.min(...selectedPointsData.map(p => p.x - pointRadius));
          const pointMaxX = Math.max(...selectedPointsData.map(p => p.x + pointRadius));
          const pointMinY = Math.min(...selectedPointsData.map(p => p.y - pointRadius));
          const pointMaxY = Math.max(...selectedPointsData.map(p => p.y + pointRadius));
          
          // 添加一些边距使框选框更明显
          const padding = 15;
          const newSelectionStart = { x: pointMinX - padding, y: pointMinY - padding };
          const newSelectionEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
          
          setSelectionStart(newSelectionStart);
          setSelectionEnd(newSelectionEnd);
          setIsSelecting(false); // 结束拖拽状态但保持框选显示
        } else {
          // 没有选中点时清除框选
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else {
        // 框选区域太小，清除框选
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    } else {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };
  
  // 框选结束处理（兼容旧接口）
  const handleSelectionEnd = () => {
    handleSelectionEndWithState(isSelecting, selectionStart, selectionEnd);
  };

  // 保存点编辑
  const handleSavePointEdit = (values: any) => {
    if (editingPoint) {
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

  // 删除选中的点
  const handleDeleteSelectedPoints = () => {
    if (selectedPoints.length === 0) {
      return;
    }
    
    setMapPoints(prev => 
      prev.filter(point => !selectedPoints.includes(point.id))
    );
    setSelectedPoints([]);
    // 清除框选框显示
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    message.success(`已删除 ${selectedPoints.length} 个点`);
  };

  // 删除选中的线
  const handleDeleteSelectedLines = () => {
    if (selectedLines.length === 0) {
      return;
    }
    
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

  // 键盘事件处理
  const handleKeyDown = (event: KeyboardEvent) => {
    // 处理空格键拖动 - 移除addMapFileDrawerVisible限制，允许在任何时候使用空格键
    if (event.code === 'Space' && !isSpacePressed) {
      event.preventDefault();
      setIsSpacePressed(true);
      console.log('🔍 [状态调试] 空格键按下，isSpacePressed设置为true');
      console.log('🚀 [空格键拖动] 空格键按下，启用拖动模式');
      return;
    }
    
    // 只在地图编辑模式下且选择工具激活时处理键盘事件
    if (addMapFileDrawerVisible && selectedTool === 'select') {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();        // 优先删除选中的点，如果没有选中的点则删除选中的线
        if (selectedPoints.length > 0) {          handleDeleteSelectedPoints();
        } else if (selectedLines.length > 0) {          handleDeleteSelectedLines();
        } else {        }
      }
    }
  };
  
  // 处理键盘释放事件
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space' && isSpacePressed) {
      event.preventDefault();
      setIsSpacePressed(false);
      setIsCanvasClicked(false); // 重置画布点击状态，需要重新点击画布才能使用双指缩放
      console.log('🔍 [状态调试] 空格键释放，isSpacePressed和isCanvasClicked都设置为false');
      console.log('🛑 [空格键拖动] 空格键释放，禁用拖动模式和双指缩放');
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
  }, [addMapFileDrawerVisible, selectedTool, selectedPoints, selectedLines, isSpacePressed]);
  
  // 测试代码已删除 - 不再自动添加测试点
  
  // 获取点类型对应的颜色
  const getPointColor = (type: string) => {
    const colorMap: Record<string, string> = {
      '站点': '#1890ff',      // 蓝色
      '充电点': '#52c41a',    // 绿色
      '停靠点': '#faad14',    // 黄色
      '电梯点': '#13c2c2',    // 青色
      '自动门': '#b37feb',    // 浅紫色
      '其他': '#8c8c8c'
    };
    return colorMap[type] || '#8c8c8c';
  };

  // 获取更深的颜色用于描边
  const getDarkerColor = (color: string) => {
    // 将十六进制颜色转换为RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 将RGB值减少30%使颜色更深
    const darkerR = Math.floor(r * 0.7);
    const darkerG = Math.floor(g * 0.7);
    const darkerB = Math.floor(b * 0.7);
    
    // 转换回十六进制
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(darkerR)}${toHex(darkerG)}${toHex(darkerB)}`;
  };
  
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
  const getPointCursor = (pointId: string) => {
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
    console.log('🏹 renderArrow called:', { x, y, angle, color, key });
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
    
    console.log('🏹 Arrow points:', { originalX: x, originalY: y, arrowX, arrowY, x1, y1, x2, y2 });
    
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

  const renderLine = (line: MapLine) => {
    console.log('🔗 renderLine called:', line);
    const startPoint = getPointById(line.startPointId);
    const endPoint = getPointById(line.endPointId);
    console.log('🔗 Points found:', { startPoint, endPoint });
    
    if (!startPoint || !endPoint) {
      console.warn('连线渲染失败：找不到起始点或结束点', { line, startPoint, endPoint });
      return null;
    }

    // 直接使用画布坐标，避免双重变换
    const startCoords = { x: startPoint.x, y: startPoint.y };
    const endCoords = { x: endPoint.x, y: endPoint.y };
    
    console.log('🔗 [连线坐标] 详细数据:', {
      '1_起始点画布坐标': `{x: ${startCoords.x.toFixed(2)}, y: ${startCoords.y.toFixed(2)}}`,
      '2_结束点画布坐标': `{x: ${endCoords.x.toFixed(2)}, y: ${endCoords.y.toFixed(2)}}`,
      '3_当前画布状态': {
        canvasScale: canvasScale.toFixed(3),
        canvasOffset: `{x: ${canvasOffset.x.toFixed(2)}, y: ${canvasOffset.y.toFixed(2)}}`
      }
    });

    const lineColor = line.color || '#87CEEB';
    const dx = endCoords.x - startCoords.x;
    const dy = endCoords.y - startCoords.y;
    const angle = Math.atan2(dy, dx);
    
    switch (line.type) {
      case 'double-line':
        // 双向直线：每条线独立渲染，通过pairedLineId关联
        const isSelected = isLineSelected(line.id);
        const selectedStroke = isSelected ? '#1890ff' : lineColor;
        const selectedStrokeWidth = isSelected ? '4' : '2';
        
        // 为backward方向的线添加透明度以显示重叠效果
        const opacity = line.direction === 'backward' ? 0.7 : 1;
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            {/* 当前线 */}
            <line
              x1={startCoords.x}
              y1={startCoords.y}
              x2={endCoords.x}
              y2={endCoords.y}
              stroke={selectedStroke}
              strokeWidth={selectedStrokeWidth}
              style={{ 
                filter: isSelected ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none',
                opacity: opacity
              }}
            />
            {/* 箭头指向终点 */}
            {renderArrow(endCoords.x, endCoords.y, angle, selectedStroke, `${line.id}-arrow`)}
          </g>
        );
        
      case 'single-line':
        // 单向直线，单向箭头指向终点
        const isSelectedSingle = isLineSelected(line.id);
        const selectedStrokeSingle = isSelectedSingle ? '#1890ff' : lineColor;
        const selectedStrokeWidthSingle = isSelectedSingle ? '4' : '2';
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)} 
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
        
      case 'double-bezier':
        // 双向贝塞尔曲线，双向箭头
        const midX = (startCoords.x + endCoords.x) / 2;
        const midY = (startCoords.y + endCoords.y) / 2;
        const controlOffset = 50 * canvasScale; // 控制点偏移也需要根据缩放调整
        const isSelectedDoubleBezier = isLineSelected(line.id);
        const selectedStrokeDoubleBezier = isSelectedDoubleBezier ? '#1890ff' : lineColor;
        const selectedStrokeWidthDoubleBezier = isSelectedDoubleBezier ? '4' : '2';
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <path
              d={`M ${startCoords.x} ${startCoords.y} Q ${midX} ${midY - controlOffset} ${endCoords.x} ${endCoords.y}`}
              stroke={selectedStrokeDoubleBezier}
              strokeWidth={selectedStrokeWidthDoubleBezier}
              fill="none"
              style={{ filter: isSelectedDoubleBezier ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none' }}
            />
            <path
              d={`M ${startCoords.x} ${startCoords.y} Q ${midX} ${midY + controlOffset} ${endCoords.x} ${endCoords.y}`}
              stroke={selectedStrokeDoubleBezier}
              strokeWidth={selectedStrokeWidthDoubleBezier}
              fill="none"
              style={{ filter: isSelectedDoubleBezier ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none' }}
            />
            {/* 双向箭头 */}
            {renderArrow(endCoords.x, endCoords.y, angle, selectedStrokeDoubleBezier, `${line.id}-end-arrow`)}
            {renderArrow(startCoords.x, startCoords.y, angle + Math.PI, selectedStrokeDoubleBezier, `${line.id}-start-arrow`)}
          </g>
        );
        
      case 'single-bezier':
        // 单向贝塞尔曲线，单向箭头指向终点
        const controlX = (startCoords.x + endCoords.x) / 2;
        const controlY = (startCoords.y + endCoords.y) / 2 - 30 * canvasScale; // 控制点偏移也需要根据缩放调整
        const isSelectedSingleBezier = isLineSelected(line.id);
        const selectedStrokeSingleBezier = isSelectedSingleBezier ? '#1890ff' : lineColor;
        const selectedStrokeWidthSingleBezier = isSelectedSingleBezier ? '4' : '2';
        
        return (
          <g 
            key={line.id} 
            onClick={(e) => handleLineClick(e, line.id)}
            onDoubleClick={() => handleLineDoubleClick(line)} 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <path
              d={`M ${startCoords.x} ${startCoords.y} Q ${controlX} ${controlY} ${endCoords.x} ${endCoords.y}`}
              stroke={selectedStrokeSingleBezier}
              strokeWidth={selectedStrokeWidthSingleBezier}
              fill="none"
              style={{ filter: isSelectedSingleBezier ? 'drop-shadow(0 0 8px rgba(24, 144, 255, 0.6))' : 'none' }}
            />
            {/* 单向箭头指向终点 */}
            {renderArrow(endCoords.x, endCoords.y, angle, selectedStrokeSingleBezier, `${line.id}-arrow`)}
          </g>
        );
        
      default:
        return null;
    }
  };
  
  // 线双击事件处理
  const handleLineDoubleClick = (line: MapLine) => {
    // 如果是双向直线，实现双击切换功能
    if (line.type === 'double-line' && line.pairedLineId) {
      // 获取当前双击计数（基于配对线组）
      const pairKey = [line.id, line.pairedLineId].sort().join('_');
      const currentCount = doubleLineClickCount[pairKey] || 0;
      const newCount = currentCount + 1;
      
      // 更新双击计数
      setDoubleLineClickCount(prev => ({
        ...prev,
        [pairKey]: newCount
      }));
      
      // 确定要编辑的线：奇数次编辑forward线，偶数次编辑backward线
      let targetLine: MapLine;
      if (newCount % 2 === 1) {
        // 第一次双击：编辑forward线
        targetLine = line.direction === 'forward' ? line : mapLines.find(l => l.id === line.pairedLineId) || line;
      } else {
        // 第二次双击：编辑backward线
        targetLine = line.direction === 'backward' ? line : mapLines.find(l => l.id === line.pairedLineId) || line;
      }
      
      setEditingLine(targetLine);
      
      // 根据方向设置表单
      const directionText = targetLine.direction === 'forward' ? '第一条线（A→B）' : '第二条线（B→A）';
      
      lineEditForm.setFieldsValue({
        name: targetLine.name,
        type: 'execution',
        direction: directionText
      });
      
      message.info(`正在编辑双向直线的${directionText}`);
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
          type: 'execution',
          direction: `第${lineNumber}条线（共${totalLines}条重叠线）`
        });
        
        message.info(`正在编辑第${lineNumber}条重叠线（共${totalLines}条）`);
      } else {
        // 没有重叠线，正常编辑
        setEditingLine(line);
        lineEditForm.setFieldsValue({
          name: line.name,
          type: 'execution'
        });
      }
    } else {
       // 贝塞尔曲线的原有逻辑
       setEditingLine(line);
       lineEditForm.setFieldsValue({
           name: line.name,
           type: 'bezier'
         });
     }
    
    setLineEditModalVisible(true);
  };

  // 保存线编辑
  const handleSaveLineEdit = async (values: any) => {
    if (!editingLine) return;
    
    try {
      // 根据线类型更新线的type字段
      const newType = values.type === 'execution' ? 
        (editingLine.type.includes('double') ? 'double-line' : 'single-line') :
        (editingLine.type.includes('double') ? 'double-bezier' : 'single-bezier');
      
      // 更新线数据
      setMapLines(prev => prev.map(line => 
        line.id === editingLine.id ? {
          ...line,
          name: values.name,
          type: newType
        } : line
      ));
      
      message.success('线属性保存成功');
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
      console.error('❌ [线点击埋点] 未找到对应的线数据', { lineId, availableLines: mapLines.map(l => l.id) });
      return;
    }    event.stopPropagation();
    
    if (selectedTool === 'select') {      let newSelectedLines: string[];
      
      if (event.ctrlKey || event.metaKey) {        // Ctrl/Cmd + 点击：多选
        const wasSelected = selectedLines.includes(lineId);
        newSelectedLines = wasSelected
          ? selectedLines.filter(id => id !== lineId)
          : [...selectedLines, lineId];      } else {        // 普通点击：单选
        newSelectedLines = [lineId];      }      setSelectedLines(newSelectedLines);
      
      // 清除点的选中状态（线和点不能同时选中）
      if (selectedPoints.length > 0) {        setSelectedPoints([]);
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
        
        // 添加边距
        const padding = 15;
        const dynamicStart = { x: pointMinX - padding, y: pointMinY - padding };
        const dynamicEnd = { x: pointMaxX + padding, y: pointMaxY + padding };
        
        const minX = Math.min(dynamicStart.x, dynamicEnd.x);
        const minY = Math.min(dynamicStart.y, dynamicEnd.y);
        const width = Math.abs(dynamicEnd.x - dynamicStart.x);
        const height = Math.abs(dynamicEnd.y - dynamicStart.y);
        
        // 将画布坐标转换为屏幕坐标
        const screenStart = canvasToScreenCoordinates(minX, minY);
        const screenWidth = width * canvasScale;
        const screenHeight = height * canvasScale;
        
        const style = {
          position: 'absolute' as const,
          left: screenStart.x,
          top: screenStart.y,
          width: Math.max(screenWidth, 1),
          height: Math.max(screenHeight, 1),
          border: '2px dashed #1890ff',
          background: 'rgba(24, 144, 255, 0.1)',
          pointerEvents: 'none' as const,
          zIndex: 5,
          boxSizing: 'border-box' as const
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
    
    // 调试日志 - 框选框样式计算（减少频繁输出）
    if (Math.random() < 0.1) { // 只输出10%的调用
      console.log('🎨 [框选调试] getSelectionBoxStyle 详细数据 (最终修复):', {
        '1_画布坐标': { 
          selectionStart: selectionStart ? `{x: ${selectionStart.x.toFixed(2)}, y: ${selectionStart.y.toFixed(2)}}` : null,
          selectionEnd: selectionEnd ? `{x: ${selectionEnd.x.toFixed(2)}, y: ${selectionEnd.y.toFixed(2)}}` : null
        },
        '2_直接计算结果': { 
          minX: minX.toFixed(2), 
          minY: minY.toFixed(2), 
          width: width.toFixed(2), 
          height: height.toFixed(2) 
        },
        '3_最终样式': { 
          left: minX.toFixed(2), 
          top: minY.toFixed(2), 
          width: finalWidth.toFixed(2), 
          height: finalHeight.toFixed(2) 
        },
        '4_说明': '框选框在transform容器内，直接使用画布坐标'
      });
    }
    
    const style = {
      position: 'absolute' as const,
      left: minX,
      top: minY,
      width: finalWidth,
      height: finalHeight,
      border: '2px dashed #1890ff',  // 蓝色虚线边框
      background: 'rgba(24, 144, 255, 0.1)',  // 半透明背景
      pointerEvents: 'none' as const,
      zIndex: 5,
      boxSizing: 'border-box' as const
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
                  <img
                    alt={file.name}
                    src={file.thumbnail}
                    style={{
                      height: 120,
                      objectFit: 'cover',
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                }
                actions={[

                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDeleteFile(file)}
                    title="删除"
                  />,

                  <EyeOutlined
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
        description: values.description || '',
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
        bodyStyle={{ 
          padding: 16, 
          height: isSmallScreen ? 'auto' : 'calc(100% - 57px)'
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
                bodyStyle={{ 
                  padding: 0, 
                  flex: isSmallScreen ? 'none' : 1, 
                  overflow: isSmallScreen ? 'visible' : 'auto',
                  display: 'flex',
                  flexDirection: 'column'
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

              {(selectedMap || isSearchMode) ? (
        <Card 
          title={isSearchMode ? `搜索结果 - ${searchMapName}` : `地图文件 - ${selectedMap?.name}`}
          style={{ marginBottom: 16 }}
        >
          {(isSearchMode ? searchedMapFiles : getMapFiles(selectedMap?.id || '')).length > 0 ? (
            <Row gutter={[16, 16]}>
              {(isSearchMode ? searchedMapFiles : getMapFiles(selectedMap?.id || '')).map((file) => (
                <Col xs={12} sm={8} md={6} lg={8} xl={6} key={file.id}>
                  <Card
                    size="small"
                            hoverable
                            cover={
                              <img
                                alt={file.name}
                                src={file.thumbnail}
                                style={{
                                  height: 120,
                                  objectFit: 'cover',
                                  backgroundColor: '#f5f5f5',
                                }}
                              />
                            }
                            actions={[
                              <DeleteOutlined
                                key="delete"
                                onClick={() => handleDeleteFile(file)}
                                title="删除"
                              />,
                              <EyeOutlined
                                key="detail"
                                onClick={() => handleDetail(file)}
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
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                    <Switch
                                      size="small"
                                      checked={file.status === 'active'}
                                      disabled={isSearchMode}
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
                   bodyStyle={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     flex: 1,
                     minHeight: '200px'
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
         bodyStyle={{ paddingBottom: 80 }}
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
         bodyStyle={{ paddingBottom: 80 }}
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
         bodyStyle={{ padding: '24px' }}
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
                         bodyStyle={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}
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
                             onClick={(e) => {
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
                           bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
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
                               onClick={(e) => {
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
         bodyStyle={{ paddingBottom: 80 }}
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
         bodyStyle={{ padding: '24px' }}
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
                           bodyStyle={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}
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

      {/* 新增地图文件侧滑抽屉 */}
      <Drawer
        title={`新增地图文件${currentMapFileName ? ` - ${currentMapFileName}` : (selectedMap?.name ? ` - ${selectedMap.name}` : '')}`}
        placement="right"
        width="100vw"
        open={addMapFileDrawerVisible}
        onClose={handleCloseAddMapFileDrawer}
        destroyOnClose
        keyboard={false} // 禁用ESC键关闭抽屉
        styles={{
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' }
        }}
        extra={
          <Space>
            <Button onClick={handleCloseAddMapFileDrawer}>
              取消
            </Button>
            {addMapFileStep === 2 && (
              <Button onClick={handleAddMapFilePrev}>
                上一步
              </Button>
            )}
            {addMapFileStep === 1 ? (
              <Button type="primary" onClick={handleAddMapFileNext}>
                下一步
              </Button>
            ) : (
              <Button 
                type="primary" 
                loading={addMapFileLoading}
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
                onFinish={handleAddMapFileSubmit}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentMapFileName(e.target.value)}
                  />
                </Form.Item>

                <Form.Item
                  label="上传PNG图片"
                  name="mapImage"
                  rules={[
                    { required: true, message: '请上传地图图片' }
                  ]}
                >
                  <Upload.Dragger
                    name="file"
                    multiple={false}
                    accept=".png,.jpg,.jpeg"
                    beforeUpload={() => false}
                    onChange={handleMapFileImageUpload}
                    showUploadList={false}
                    style={{ background: '#fafafa' }}
                  >
                    {mapFileUploadedImage ? (
                      <div style={{ padding: '20px' }}>
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
                        <div style={{ marginTop: '8px', color: '#1890ff' }}>
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
                          支持 PNG、JPG、JPEG 格式，文件大小不超过 10MB
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
                          <EyeOutlined style={{ marginRight: '6px' }} />
                          阅览模式
                        </div>
                        <Button 
                          type="primary"
                          onClick={handleEnterEditMode}
                          disabled={true}
                          style={{
                            height: '32px',
                            fontSize: '12px',
                            backgroundColor: '#f5f5f5',
                            borderColor: '#d9d9d9',
                            color: '#bfbfbf',
                            cursor: 'not-allowed'
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
                      onClick={() => setMapType('topology')}
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
                      onClick={() => setMapType('grayscale')}
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
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>地图原点 (X, Y坐标)</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Input 
                          value={mapInfo.originX}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapInfo({...mapInfo, originX: Number(e.target.value) || 0})}
                          placeholder="X坐标"
                          size="small"
                          type="number"
                          style={{ flex: 1 }}
                        />
                        <Input 
                          value={mapInfo.originY}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapInfo({...mapInfo, originY: Number(e.target.value) || 0})}
                          placeholder="Y坐标"
                          size="small"
                          type="number"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    
                    <div>
                       <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>地图方向</div>
                       <Input 
                         value={mapInfo.direction}
                         onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapInfo({...mapInfo, direction: Number(e.target.value) || 0})}
                         placeholder="请输入地图方向（-180到180）"
                         size="small"
                         type="number"
                         min="-180"
                         max="180"
                         addonAfter="°"
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
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>分辨率 (m/pixel)</div>
                      <Input 
                        value={mapInfo.resolution}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMapInfo({...mapInfo, resolution: Number(e.target.value) || 0})}
                        placeholder="请输入分辨率"
                        size="small"
                        type="number"
                        step="0.001"
                        min="0"
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
                        onClick={handleCancel}
                        style={{ borderColor: '#d9d9d9', color: '#8c8c8c', background: '#f5f5f5', minWidth: '80px', height: '36px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        取消
                      </Button>
                      <Button 
                        type="primary" 
                        onClick={handleSave}
                        style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: '80px', height: '36px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        保存
                      </Button>
                      <Button 
                        type="primary" 
                        onClick={handleSubmit}
                        style={{ background: '#1890ff', borderColor: '#1890ff', minWidth: '80px', height: '36px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        提交
                      </Button>
                      <Button 
                        type="primary" 
                        onClick={handleSubmitAndExit}
                        style={{ background: '#1890ff', borderColor: '#1890ff', minWidth: '100px', height: '36px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        提交并退出
                      </Button>
                    </div>
                  </div>
                  
                  {/* 画布主体 */}
                  <div 
                    ref={canvasRef}
                    style={{
                      flex: 1,
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#fff',
                      cursor: (dragTool || isSpacePressed) ? 'grab' : (isDragging ? 'grabbing' : getCanvasCursor()),
                      userSelect: 'none'  // 防止文本选择
                    }}
                    onClick={(dragTool || isSpacePressed) ? undefined : handleCanvasClick}
                    onMouseDown={(dragTool || isSpacePressed) ? handleCanvasDrag : handleSelectionStart}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                  >
                    {/* 固定网格背景 - 铺满整个画布，不随拖动消失 */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `
                        linear-gradient(to right, #e8e8e8 1px, transparent 1px),
                        linear-gradient(to bottom, #e8e8e8 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                      opacity: 0.5,
                      pointerEvents: 'none'  // 确保网格不会阻挡鼠标事件
                    }}></div>
                    
                    {/* 画布变换容器 */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transform: `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.2s ease'
                    }}>
                    
                    {/* 框选区域 */}
                    <div style={getSelectionBoxStyle()}></div>
                    
                    {/* 连线SVG层 */}
                    <svg
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
                        // 只有点击SVG空白区域时才触发画布点击
                        if (e.target === e.currentTarget) {
                          const parentElement = e.currentTarget.parentElement as HTMLDivElement;
                          const syntheticEvent = {
                            ...e,
                            currentTarget: parentElement,
                            target: parentElement
                          } as unknown as React.MouseEvent<HTMLDivElement>;
                          handleCanvasClick(syntheticEvent);
                        }
                      }}
                      onMouseDown={(e) => {
                        // 只有在SVG空白区域的鼠标按下事件才传递给框选处理
                        if (e.target === e.currentTarget) {
                          const parentElement = e.currentTarget.parentElement as HTMLDivElement;
                          const syntheticEvent = {
                            ...e,
                            currentTarget: parentElement,
                            target: parentElement
                          } as unknown as React.MouseEvent<HTMLDivElement>;
                          handleSelectionStart(syntheticEvent);
                        }
                      }}
                    >
                      {(() => {
                        console.log('📊 mapLines data:', mapLines);
                        return mapLines.map(line => renderLine(line));
                      })()}
                    </svg>
                    
                    {/* 绘制的点 */}
                    {mapPoints.map((point) => {
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
                            background: getPointColor(point.type),
                            border: isPointSelected(point.id) ? '3px solid #1890ff' : `2px solid ${getDarkerColor(getPointColor(point.type))}`,
                            boxShadow: isPointSelected(point.id) ? '0 0 8px rgba(24, 144, 255, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                            cursor: getPointCursor(point.id),
                            zIndex: 10,
                            transform: isPointSelected(point.id) ? 'scale(1.2)' : 'scale(1)',
                            transition: 'all 0.2s ease'
                          }}
                          title={`${point.name} (${point.type})`}
                          onClick={(e) => handlePointClick(e, point.id)}
                          onDoubleClick={(e) => handlePointDoubleClick(e, point)}
                          onMouseEnter={() => setHoveredPoint(point.id)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          {/* 方向指示器 - 圆形内包含箭头 */}
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
                            {/* 箭头 */}
                            <div
                              style={{
                                width: '0',
                                height: '0',
                                borderLeft: '2px solid transparent',
                                borderRight: '2px solid transparent',
                                borderBottom: '3px solid #ffffff',
                                transform: `rotate(${(point.direction || 0)}deg)`,
                                transformOrigin: '50% 66%'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* 画布提示内容 */}
                    {mapPoints.length === 0 && (
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
                  
                  {/* 撤销工具 */}
                  <Button
                    type="text"
                    icon={<UndoOutlined />}
                    size="small"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none'
                    }}
                    title="撤销"
                  />
                  
                  {/* 重做工具 */}
                  <Button
                    type="text"
                    icon={<RedoOutlined />}
                    size="small"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none'
                    }}
                    title="重做"
                  />
                  
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
                        label: '绘图工具',
                        children: (
                          <div style={{ padding: '12px 12px 12px 12px', flex: 1, overflow: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <Button 
                                type={selectedTool === 'select' ? 'primary' : 'text'}
                                onClick={() => handleToolSelect('select')}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '0 12px',
                                  border: selectedTool === 'select' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  background: selectedTool === 'select' ? '#e6f7ff' : '#fff',
                                  color: selectedTool === 'select' ? '#1890ff' : '#666'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                  <rect x="2" y="2" width="10" height="10" fill="none" stroke="#1890ff" strokeWidth="1.5" rx="1"/>
                                  <polygon points="12,6 15,9 12,12" fill="#1890ff"/>
                                </svg>
                                选择工具
                              </Button>
                              
                              <Button 
                                type={selectedTool === 'point' ? 'primary' : 'text'}
                                onClick={() => handleToolSelect('point')}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '0 12px',
                                  border: selectedTool === 'point' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  background: selectedTool === 'point' ? '#e6f7ff' : '#fff',
                                  color: selectedTool === 'point' ? '#1890ff' : '#666'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                  <circle cx="8" cy="8" r="6" fill="none" stroke="#1890ff" strokeWidth="1.5"/>
                                  <circle cx="8" cy="8" r="2" fill="#1890ff"/>
                                </svg>
                                绘制节点
                              </Button>
                              
                              <Button 
                                type={selectedTool === 'double-line' ? 'primary' : 'text'}
                                onClick={() => handleToolSelect('double-line')}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '0 12px',
                                  border: selectedTool === 'double-line' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  background: selectedTool === 'double-line' ? '#e6f7ff' : '#fff',
                                  color: selectedTool === 'double-line' ? '#1890ff' : '#666'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                  <line x1="2" y1="8" x2="14" y2="8" stroke="#1890ff" strokeWidth="1.5"/>
                                  <polygon points="1,8 4,6 4,10" fill="#1890ff"/>
                                  <polygon points="15,8 12,6 12,10" fill="#1890ff"/>
                                </svg>
                                双向直线
                              </Button>
                              
                              <Button 
                                type={selectedTool === 'single-line' ? 'primary' : 'text'}
                                onClick={() => handleToolSelect('single-line')}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '0 12px',
                                  border: selectedTool === 'single-line' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  background: selectedTool === 'single-line' ? '#e6f7ff' : '#fff',
                                  color: selectedTool === 'single-line' ? '#1890ff' : '#666'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                  <line x1="2" y1="8" x2="14" y2="8" stroke="#1890ff" strokeWidth="1.5"/>
                                  <polygon points="15,8 12,6 12,10" fill="#1890ff"/>
                                </svg>
                                单向直线
                              </Button>
                              
                              <Button 
                                type={selectedTool === 'double-bezier' ? 'primary' : 'text'}
                                onClick={() => handleToolSelect('double-bezier')}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '0 12px',
                                  border: selectedTool === 'double-bezier' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  background: selectedTool === 'double-bezier' ? '#e6f7ff' : '#fff',
                                  color: selectedTool === 'double-bezier' ? '#1890ff' : '#666'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                  <path d="M2 8 Q5 4 8 8 Q11 12 14 8" stroke="#1890ff" strokeWidth="1.5" fill="none"/>
                                  <polygon points="1,8 4,6 4,10" fill="#1890ff"/>
                                  <polygon points="15,8 12,6 12,10" fill="#1890ff"/>
                                </svg>
                                双向贝塞尔曲线
                              </Button>
                              
                              <Button 
                                type={selectedTool === 'single-bezier' ? 'primary' : 'text'}
                                onClick={() => handleToolSelect('single-bezier')}
                                style={{
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '0 12px',
                                  border: selectedTool === 'single-bezier' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                  borderRadius: '6px',
                                  background: selectedTool === 'single-bezier' ? '#e6f7ff' : '#fff',
                                  color: selectedTool === 'single-bezier' ? '#1890ff' : '#666'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                                  <path d="M2 8 Q5 4 8 8 Q11 12 14 8" stroke="#1890ff" strokeWidth="1.5" fill="none"/>
                                  <polygon points="15,8 12,6 12,10" fill="#1890ff"/>
                                </svg>
                                单向贝塞尔曲线
                              </Button>
                            </div>
                          </div>
                        )
                      },
                      {
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
                                            transition: 'background-color 0.2s'
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
                                        >
                                          <span>{point.name} ({point.description || point.type})</span>
                                          {!point.isPreset && (
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
                                            >
                                              移除
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
                                      {mapLines.map((line, index) => {
                                        const startPoint = mapPoints.find(p => p.id === line.startPointId);
                                        const endPoint = mapPoints.find(p => p.id === line.endPointId);
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
                                              transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                          >
                                            <span>{line.name} ({startPoint?.name} → {endPoint?.name})</span>
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
                                {
                                  key: 'functional-areas',
                                  label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <AppstoreOutlined style={{ color: '#fa541c' }} />
                                      <span>功能区</span>
                                      <Badge count={2} size="small" style={{ backgroundColor: '#fa541c' }} />
                                    </div>
                                  ),
                                  children: (
                                    <div style={{ paddingLeft: '8px' }}>
                                      <Collapse
                                        size="small"
                                        ghost
                                        items={[
                                          {
                                            key: 'area1',
                                            label: (
                                              <div 
                                                style={{ 
                                                  display: 'flex', 
                                                  justifyContent: 'space-between', 
                                                  alignItems: 'center',
                                                  width: '100%'
                                                }}
                                                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                  const addBtn = e.currentTarget.querySelector('.area-add-btn') as HTMLElement;
                                                  if (addBtn) addBtn.style.opacity = '1';
                                                }}
                                                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                  const addBtn = e.currentTarget.querySelector('.area-add-btn') as HTMLElement;
                                                  if (addBtn) addBtn.style.opacity = '0';
                                                }}
                                              >
                                                <span>区域1</span>
                                                <Button 
                                                  className="area-add-btn"
                                                  type="text" 
                                                  size="small" 
                                                  icon={<PlusOutlined />}
                                                  style={{ 
                                                    opacity: 0, 
                                                    transition: 'opacity 0.2s',
                                                    fontSize: '12px',
                                                    height: '20px',
                                                    padding: '0 4px'
                                                  }}
                                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.stopPropagation();
                                                    handleAddNetworkGroup();
                                                  }}
                                                >
                                                  新增
                                                </Button>
                                              </div>
                                            ),
                                            children: (
                                              <div style={{ paddingLeft: '4px' }}>
                                                <Collapse
                                                  size="small"
                                                  ghost
                                                  items={[
                                                    {
                                                      key: 'network-group1',
                                                      label: (
                                                        <div 
                                                          style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center',
                                                            width: '100%'
                                                          }}
                                                          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                            const actionBtns = e.currentTarget.querySelector('.network-group-actions') as HTMLElement;
                                                            if (actionBtns) actionBtns.style.opacity = '1';
                                                          }}
                                                          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                            const actionBtns = e.currentTarget.querySelector('.network-group-actions') as HTMLElement;
                                                            if (actionBtns) actionBtns.style.opacity = '0';
                                                          }}
                                                        >
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>路网组1</span>
                                                            {defaultNetworkGroup === 'network-group1' && (
                                                              <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#52c41a',
                                                                display: 'inline-block'
                                                              }} />
                                                            )}
                                                          </div>
                                                          <div 
                                                            className="network-group-actions"
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
                                                              onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                const group = networkGroups.find(g => g.id === 'network-group1');
                                                                if (group) handleEditNetworkGroup(group);
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
                                                              onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handleDeleteNetworkGroup('network-group1');
                                                              }}
                                                            />
                                                            {defaultNetworkGroup !== 'network-group1' && (
                                                              <Button 
                                                                type="text" 
                                                                size="small" 
                                                                icon={<CheckCircleOutlined />}
                                                                style={{ 
                                                                  fontSize: '12px',
                                                                  height: '20px',
                                                                  padding: '0 4px',
                                                                  color: '#52c41a'
                                                                }}
                                                                onClick={(e: React.MouseEvent) => {
                                                                  e.stopPropagation();
                                                                  handleSetDefaultNetworkGroup('network-group1');
                                                                }}
                                                              />
                                                            )}
                                                          </div>
                                                        </div>
                                                      ),
                                                      children: (
                                                        <div style={{ paddingLeft: '16px' }}>
                                                          {/* 节点列表 */}
                                                          <div style={{ marginBottom: '8px' }}>
                                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>节点:</div>
                                                            {networkGroups.find(g => g.id === 'network-group1')?.nodes.map(node => (
                                                              <div 
                                                                key={node.id}
                                                                style={{ 
                                                                  fontSize: '12px', 
                                                                  lineHeight: '1.6',
                                                                  display: 'flex',
                                                                  justifyContent: 'space-between',
                                                                  alignItems: 'center',
                                                                  padding: '2px 4px',
                                                                  borderRadius: '4px',
                                                                  transition: 'background-color 0.2s'
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
                                                              >
                                                                <span>{node.name} ({node.description})</span>
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
                                                                  onClick={() => removeNodeFromGroup('network-group1', node.id)}
                                                                >
                                                                  移除
                                                                </Button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                          {/* 路径列表 */}
                                                          <div>
                                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>路径:</div>
                                                            {networkGroups.find(g => g.id === 'network-group1')?.paths.map(path => (
                                                              <div 
                                                                key={path.id}
                                                                style={{ 
                                                                  fontSize: '12px', 
                                                                  lineHeight: '1.6',
                                                                  display: 'flex',
                                                                  justifyContent: 'space-between',
                                                                  alignItems: 'center',
                                                                  padding: '2px 4px',
                                                                  borderRadius: '4px',
                                                                  transition: 'background-color 0.2s'
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
                                                              >
                                                                <span>{path.name} ({path.description})</span>
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
                                                                  onClick={() => removePathFromGroup('network-group1', path.id)}
                                                                >
                                                                  移除
                                                                </Button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )
                                                    },
                                                    {
                                                      key: 'network-group2',
                                                      label: (
                                                        <div 
                                                          style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center',
                                                            width: '100%'
                                                          }}
                                                          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                                            const actionBtns = e.currentTarget.querySelector('.network-group-actions') as HTMLElement;
                                                            if (actionBtns) actionBtns.style.opacity = '1';
                                                          }}
                                                          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                                                            const actionBtns = e.currentTarget.querySelector('.network-group-actions') as HTMLElement;
                                                            if (actionBtns) actionBtns.style.opacity = '0';
                                                          }}
                                                        >
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>路网组2</span>
                                                            {defaultNetworkGroup === 'network-group2' && (
                                                              <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#52c41a',
                                                                display: 'inline-block'
                                                              }} />
                                                            )}
                                                          </div>
                                                          <div 
                                                            className="network-group-actions"
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
                                                              onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                const group = networkGroups.find(g => g.id === 'network-group2');
                                                                if (group) handleEditNetworkGroup(group);
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
                                                              onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handleDeleteNetworkGroup('network-group2');
                                                              }}
                                                            />
                                                            {defaultNetworkGroup !== 'network-group2' && (
                                                              <Button 
                                                                type="text" 
                                                                size="small" 
                                                                icon={<CheckCircleOutlined />}
                                                                style={{ 
                                                                  fontSize: '12px',
                                                                  height: '20px',
                                                                  padding: '0 4px',
                                                                  color: '#52c41a'
                                                                }}
                                                                onClick={(e: React.MouseEvent) => {
                                                                  e.stopPropagation();
                                                                  handleSetDefaultNetworkGroup('network-group2');
                                                                }}
                                                              />
                                                            )}
                                                          </div>
                                                        </div>
                                                      ),
                                                      children: (
                                                        <div style={{ paddingLeft: '16px' }}>
                                                          {/* 节点列表 */}
                                                          <div style={{ marginBottom: '8px' }}>
                                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>节点:</div>
                                                            {networkGroups.find(g => g.id === 'network-group2')?.nodes.map(node => (
                                                              <div 
                                                                key={node.id}
                                                                style={{ 
                                                                  fontSize: '12px', 
                                                                  lineHeight: '1.6',
                                                                  display: 'flex',
                                                                  justifyContent: 'space-between',
                                                                  alignItems: 'center',
                                                                  padding: '2px 4px',
                                                                  borderRadius: '4px',
                                                                  transition: 'background-color 0.2s'
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
                                                              >
                                                                <span>{node.name} ({node.description})</span>
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
                                                                  onClick={() => removeNodeFromGroup('network-group2', node.id)}
                                                                >
                                                                  移除
                                                                </Button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                          {/* 路径列表 */}
                                                          <div>
                                                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>路径:</div>
                                                            {networkGroups.find(g => g.id === 'network-group2')?.paths.map(path => (
                                                              <div 
                                                                key={path.id}
                                                                style={{ 
                                                                  fontSize: '12px', 
                                                                  lineHeight: '1.6',
                                                                  display: 'flex',
                                                                  justifyContent: 'space-between',
                                                                  alignItems: 'center',
                                                                  padding: '2px 4px',
                                                                  borderRadius: '4px',
                                                                  transition: 'background-color 0.2s'
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
                                                              >
                                                                <span>{path.name} ({path.description})</span>
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
                                                                  onClick={() => removePathFromGroup('network-group2', path.id)}
                                                                >
                                                                  移除
                                                                </Button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        </div>
                                                      )
                                                    }
                                                  ]}
                                                />
                                              </div>
                                            )
                                          }
                                        ]}
                                      />
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
                      }
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
        title="编辑点属性"
        open={pointEditModalVisible}
        onCancel={() => {
          setPointEditModalVisible(false);
          setEditingPoint(null);
          pointEditForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPointEditModalVisible(false);
            setEditingPoint(null);
            pointEditForm.resetFields();
          }}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => pointEditForm.submit()}>
            保存
          </Button>
        ]}
        width={500}
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
            <Input placeholder="请输入点名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="点类型"
            rules={[{ required: true, message: '请选择点类型' }]}
            style={{ marginBottom: 16 }}
          >
            <Radio.Group>
              <Radio value="站点">站点</Radio>
              <Radio value="充电点">充电点</Radio>
              <Radio value="停靠点">停靠点</Radio>
              <Radio value="电梯点">电梯点</Radio>
              <Radio value="自动门">自动门</Radio>
            </Radio.Group>
          </Form.Item>
          
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
             />
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
      
      {/* 线属性编辑弹窗 */}
      <Modal
        title={
          editingLine?.type === 'double-line' && editingLine?.direction
            ? `双向直线属性 - ${editingLine.direction === 'forward' ? '第一条线（A→B）' : '第二条线（B→A）'}`
            : '线属性'
        }
        open={lineEditModalVisible}
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
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => lineEditForm.submit()}>
            保存
          </Button>
        ]}
        width={600}
      >
        {/* 线编辑切换提示 */}
        {editingLine?.type === 'double-line' && (
          <Alert
            message="双向直线编辑提示"
            description="双击双向直线可以在第一条线（A→B）和第二条线（B→A）之间切换编辑。当前正在编辑的方向已在下方显示。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {editingLine?.type === 'single-line' && lineEditForm.getFieldValue('direction')?.includes('重叠线') && (
          <Alert
            message="重叠线编辑提示"
            description="双击重叠的线可以在多条重叠线之间切换编辑。当前正在编辑的线信息已在下方显示。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Form
          form={lineEditForm}
          layout="vertical"
          onFinish={handleSaveLineEdit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="线ID"
                style={{ marginBottom: 16 }}
              >
                <Input value={editingLine?.id} disabled style={{ color: '#666' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="线名称"
                rules={[
                  { required: true, message: '请输入线名称' },
                  { max: 20, message: '线名称不能超过20个字符' },
                  {
                     validator: async (_: any, value: string) => {
                       if (value && editingLine) {
                         const existingLine = mapLines.find(line => 
                           line.name === value && line.id !== editingLine.id
                         );
                         if (existingLine) {
                           throw new Error('线名称不能重复');
                         }
                       }
                     }
                   }
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="请输入线名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="线类型"
                rules={[{ required: true, message: '请选择线类型' }]}
                style={{ marginBottom: 16 }}
              >
                <Radio.Group>
                  <Radio value="execution">执行</Radio>
                  <Radio value="bezier">贝塞尔曲线</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          
          {/* 方向显示（双向直线或重叠单向线） */}
          {(editingLine?.type === 'double-line' || 
            (editingLine?.type === 'single-line' && lineEditForm.getFieldValue('direction'))) && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="direction"
                  label="当前编辑方向"
                  style={{ marginBottom: 16 }}
                >
                  <Input 
                    disabled 
                    style={{ 
                      color: '#1890ff', 
                      fontWeight: 'bold',
                      background: '#f0f8ff',
                      border: '1px solid #1890ff'
                    }} 
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="线长度"
                style={{ marginBottom: 16 }}
              >
                <Input value={`${editingLine?.length || 0} 像素`} disabled style={{ color: '#666' }} />
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
                <div><strong>起始点:</strong> {getPointById(editingLine?.startPointId || '')?.name || '未知'}</div>
                <div style={{ marginTop: '4px' }}><strong>起始坐标:</strong> 
                  ({getPointById(editingLine?.startPointId || '')?.x}, {getPointById(editingLine?.startPointId || '')?.y})
                </div>
              </Col>
              <Col span={12}>
                <div><strong>结束点:</strong> {getPointById(editingLine?.endPointId || '')?.name || '未知'}</div>
                <div style={{ marginTop: '4px' }}><strong>结束坐标:</strong> 
                  ({getPointById(editingLine?.endPointId || '')?.x}, {getPointById(editingLine?.endPointId || '')?.y})
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
           networkGroupForm.validateFields().then((values: any) => {
             handleSaveNetworkGroup();
           }).catch((info: any) => {
             console.log('Validate Failed:', info);
           });
        }}
        onCancel={() => {
          setIsNetworkGroupModalVisible(false);
          setEditingNetworkGroup(null);
          networkGroupForm.resetFields();
        }}
        width={400}
        destroyOnClose
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
        </Form>
      </Modal>

      {/* 新增/编辑路径组模态框 */}
      <Modal
        title={editingPathGroup ? '编辑路径组' : '新增路径组'}
        open={isPathGroupModalVisible}
        onOk={() => {
           pathGroupForm.validateFields().then((values: any) => {
             handleSavePathGroup();
           }).catch((info: any) => {
             console.log('Validate Failed:', info);
           });
        }}
        onCancel={() => {
          setIsPathGroupModalVisible(false);
          setEditingPathGroup(null);
          pathGroupForm.resetFields();
        }}
        width={400}
        destroyOnClose
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
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MapManagement;