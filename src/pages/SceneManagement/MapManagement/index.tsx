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
} from 'antd';
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
  
  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               onClick={() => localImportForm.submit()} 
               type="primary" 
               loading={loading}
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
                   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
        title="新增地图文件"
        placement="right"
        width="100vw"
        open={addMapFileDrawerVisible}
        onClose={handleCloseAddMapFileDrawer}
        destroyOnClose
        styles={{
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' }
        }}
        extra={
          <Space>
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
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                alignItems: 'center', 
                justifyContent: 'center',
                height: '400px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '2px dashed #d9d9d9'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <EditOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <div style={{ fontSize: '18px', color: '#999', marginBottom: '8px' }}>
                    地图编辑器
                  </div>
                  <div style={{ fontSize: '14px', color: '#bbb' }}>
                    此处将集成地图编辑功能
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default MapManagement;