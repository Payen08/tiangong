import React, { useState, useRef, useEffect } from 'react';
import { List, Avatar, Tag, Button, Select, Space, Typography, Modal, message, Input } from 'antd';
import {
  RobotOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HomeOutlined,
  CarOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  WarningOutlined,
  StopOutlined,
  BugOutlined,
  AndroidOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import PropertyPanel from './PropertyPanel';

const { Text } = Typography;
const { Option } = Select;

// 机器人类型定义
interface Robot {
  id: string;
  name: string;
  type: string;
  status: string;
  battery: number;
  position: { x: number; y: number };
  currentTask: string | null;
  mapId: string;
  // 添加路径动画相关属性
  pathIndex?: number; // 当前所在路径点索引
  targetPointId?: string; // 目标路径点ID
  progress?: number; // 当前路径段的进度 (0-1)
  speed?: number; // 移动速度
  direction?: number; // 移动方向角度
  // 添加路径资源占用属性
  pathResources?: string[]; // 当前占用的路径资源ID列表
  // 添加在线状态
  isOnline: boolean; // 在线状态：true-在线，false-离线
}

// 任务类型定义
interface Task {
  id: string;
  name: string;
  robotId: string | null;
  status: string; // pending: 待执行, executing: 执行中, paused: 已暂停, completed: 已完成, cancelled: 已取消
  priority: string;
  startPoint: string;
  endPoint: string;
  progress: number;
  targetDevice?: string; // 目标设备
}

// 地图类型定义
interface MapInfo {
  id: string;
  name: string;
}

// 模拟机器人数据
const mockRobots: Robot[] = [
  {
    id: 'AGV001',
    name: 'AGV-001',
    type: 'AGV',
    status: 'running', // 运行状态 - 执行运单任务，移动中
    battery: 85,
    position: { x: 80, y: 120 }, // 初始化到P1点位（更新坐标）
    currentTask: '运输任务-001',
    mapId: 'map1',
    isOnline: true,
  },
  {
    id: 'MCR001',
    name: 'MCR-001',
    type: 'MCR',
    status: 'running', // 运行状态 - 执行运单任务，移动中
    battery: 92,
    position: { x: 720, y: 200 }, // 初始化到P6点位（更新坐标）
    currentTask: '运输任务-002',
    mapId: 'map1',
    isOnline: true,
  },
  {
    id: 'AMR001',
    name: 'AMR-001',
    type: 'AMR',
    status: 'running', // 运行状态 - 执行运单任务，移动中
    battery: 45,
    position: { x: 50, y: 100 }, // 初始化到P1点位，与二楼地图路径起始点对应
    currentTask: '巡检任务-001',
    mapId: 'map2',
    isOnline: true,
  },
  {
    id: 'AGV002',
    name: 'AGV-002',
    type: 'AGV',
    status: 'running', // 运行状态 - 执行运单任务，移动中
    battery: 78,
    position: { x: 280, y: 260 }, // 更新坐标以适应新地图尺寸
    currentTask: '运输任务-003',
    mapId: 'map1',
    isOnline: true,
  },
  {
    id: 'MCR002',
    name: 'MCR-002',
    type: 'MCR',
    status: 'running', // 运行状态 - 执行运单任务，移动中
    battery: 23,
    position: { x: 300, y: 300 },
    currentTask: '运输任务-004',
    mapId: 'map2',
    isOnline: true,
  },
  {
    id: 'AMR002',
    name: 'AMR-002',
    type: 'AMR',
    status: 'move_stopped', // 移动停止状态 - 暂停运单触发
    battery: 67,
    position: { x: 400, y: 400 },
    currentTask: '巡检任务-002',
    mapId: 'map3',
    isOnline: true,
  },
];

// 模拟运单任务数据
const mockTasks: Task[] = [
  {
    id: 'TASK001',
    name: '运输任务-001',
    robotId: 'AGV001',
    status: 'executing',
    priority: 'high',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-001',
    progress: 65,
  },
  {
    id: 'TASK002',
    name: '运输任务-002',
    robotId: 'AGV001',
    status: 'error',
    priority: 'medium',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-002',
    progress: 45,
  },
  {
    id: 'TASK003',
    name: '运输任务-003',
    robotId: 'AMR002',
    status: 'paused',
    priority: 'low',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-003',
    progress: 30,
  },
  {
    id: 'TASK004',
    name: '运输任务-004',
    robotId: 'MCR002',
    status: 'error',
    priority: 'high',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-004',
    progress: 45,
  },
];

// 模拟地图数据
const mockMaps: MapInfo[] = [
  { id: 'map1', name: '一楼地图' },
  { id: 'map2', name: '二楼地图' },
  { id: 'map3', name: '三楼地图' },
];

const FieldControlView: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState('map1');
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [allPanelsVisible, setAllPanelsVisible] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [redrawTrigger, setRedrawTrigger] = useState(0);
  
  // 动画帧引用 - 用于控制动画循环
  const animationFrameRef = useRef<number>(0);
  
  // 路径颜色过渡状态 - 用于平滑颜色变化
  const pathColorTransitions = useRef<{
    [pathId: string]: {
      currentColor: string;
      targetColor: string;
      transitionProgress: number;
    }
  }>({});
  
  // 机器人路径状态
  const [robotsState, setRobotsState] = useState<Robot[]>([]);
  
  // 路径资源占用状态
  const [occupiedPaths, setOccupiedPaths] = useState<string[]>([]);
  
  // 任务状态管理
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [robots, setRobots] = useState<Robot[]>(mockRobots);
  
  // 搜索状态
  const [robotSearchText, setRobotSearchText] = useState('');
  const [taskSearchText, setTaskSearchText] = useState('');
  
  // 任务生成控制
  const [shouldGenerateTask, setShouldGenerateTask] = useState(false);
  
  // 暂停的机器人列表
  const [pausedRobots, setPausedRobots] = useState<Set<string>>(new Set());
  

  
  // 选中状态管理
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  

  
  // 获取所有机器人（使用robotsState以确保显示正确的状态和位置）
  
  // 获取地图名称的辅助函数
  const getMapName = (mapId: string) => {
    const map = mockMaps.find(m => m.id === mapId);
    return map ? map.name : mapId;
  };

  // 处理机器人点击
  const handleRobotClick = (robot: Robot) => {
    setSelectedRobot(robot.id);
    centerOnRobot(robot.id);
  };
  
  // 居中显示选中的机器人
  const centerOnRobot = (robotId: string) => {
    const robot = allRobots.find(r => r.id === robotId);
    if (!robot || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    // 计算画布中心点
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // 计算需要的偏移量，使机器人位置居中
    const newOffsetX = centerX - robot.position.x * scale;
    const newOffsetY = centerY - robot.position.y * scale;

    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };
  
  // 属性面板处理函数
  const handlePropertySave = (data: any) => {
    // 处理属性保存逻辑
    setPropertyPanelVisible(false);
  };
  
  const handlePropertyPanelClose = () => {
    setPropertyPanelVisible(false);
  };
  
  // 示例路径节点数据
  const pathNodes = [
    { id: 'p1', x: 80, y: 120, name: 'P1' },
    { id: 'p2', x: 200, y: 120, name: 'P2' },
    { id: 'p3', x: 320, y: 120, name: 'P3' },
    { id: 'p4', x: 440, y: 120, name: 'P4' },
    { id: 'p5', x: 560, y: 120, name: 'P5' },
    { id: 'p6', x: 720, y: 200, name: 'P6' },
    { id: 'p7', x: 600, y: 280, name: 'P7' },
    { id: 'p8', x: 480, y: 280, name: 'P8' },
    { id: 'p9', x: 360, y: 280, name: 'P9' },
    { id: 'p10', x: 240, y: 280, name: 'P10' }
  ];
  
  // 根据地图数据动态生成路径点序列
  const getPathSequence = (mapId: string) => {
    if (mapId === 'map1') {
      return [
        { pointId: 'p1', nextLineId: 'l1' },
        { pointId: 'p2', nextLineId: 'l2' },
        { pointId: 'p3', nextLineId: 'l3' },
        { pointId: 'p4', nextLineId: 'l4' },
        { pointId: 'p5', nextLineId: 'l5' },
        { pointId: 'p6', nextLineId: 'l6' },
        { pointId: 'p7', nextLineId: 'l7' },
        { pointId: 'p8', nextLineId: 'l8' },
        { pointId: 'p9', nextLineId: 'l9' },
        { pointId: 'p10', nextLineId: 'l10' },
      ];
    } else if (mapId === 'map2') {
      // 二楼地图路径序列（移除p5-p8节点，保留p1-p4和p9-p14）
      return [
        { pointId: 'p1', nextLineId: 'l1' },
        { pointId: 'p2', nextLineId: 'l2' },
        { pointId: 'p3', nextLineId: 'l3' },
        { pointId: 'p4', nextLineId: 'l4' },
        { pointId: 'p9', nextLineId: 'l9' },
        { pointId: 'p10', nextLineId: 'l10' },
        { pointId: 'p11', nextLineId: 'l11' },
        { pointId: 'p12', nextLineId: 'l12' },
        { pointId: 'p13', nextLineId: 'l30' },
        { pointId: 'p14', nextLineId: 'l31' },
      ];
    } else if (mapId === 'map3') {
      return [
        { pointId: 'p1', nextLineId: 'l1' },
        { pointId: 'p2', nextLineId: 'l2' },
        { pointId: 'p3', nextLineId: 'l3' },
        { pointId: 'p4', nextLineId: 'l4' },
        { pointId: 'p5', nextLineId: 'l5' },
        { pointId: 'p6', nextLineId: 'l6' },
        { pointId: 'p7', nextLineId: 'l7' },
        { pointId: 'p8', nextLineId: 'l8' },
        { pointId: 'p9', nextLineId: 'l9' },
        { pointId: 'p10', nextLineId: 'l10' },
        { pointId: 'p11', nextLineId: 'l11' },
        { pointId: 'p12', nextLineId: 'l12' },
      ];
    }
    return [];
  };

  // 获取当前地图的路径点序列
  const pathSequence = getPathSequence(selectedMap);
  
  // 属性面板状态管理
  const [propertyPanelVisible, setPropertyPanelVisible] = useState(false);
  const [propertyElementType, setPropertyElementType] = useState<'point' | 'line' | 'area' | null>(null);
  const [propertyElementData, setPropertyElementData] = useState<any>(null);

  // 点类型定义
  interface MapPoint {
    id: string;
    name: string;
    x: number;
    y: number;
    type: '节点' | '站点' | '充电点' | '停靠点' | '临停点' | '归位点' | '电梯点' | '自动门' | '切换点';
    direction?: number; // 方向角度 (-180 到 180)
    description?: string;
  }

  // 线条类型定义
  interface MapLine {
    id: string;
    name: string;
    startPointId: string;
    endPointId: string;
    type: 'single-line' | 'double-line' | 'single-bezier' | 'double-bezier';
    color: string;
    controlPoints?: {
      cp1?: { x: number; y: number };
      cp2?: { x: number; y: number };
    }
  }

  // 区域类型定义
  interface MapArea {
    id: string;
    name: string;
    type: '禁行区域' | '调速区域' | '多路网区' | 'forbidden' | 'cleaning' | 'virtual_wall' | 'slow_cleaning';
    points: { x: number; y: number }[];
    color?: string;
    fillColor?: string;
    strokeColor?: string;
    opacity?: number;
    description?: string;
    speed?: number; // 调速区域的速度值
    networkGroupId?: string; // 多路网区的网络组ID
    robotId?: string; // 关联的机器人ID
  }

  // 根据地图ID获取地图数据的函数
  const getMapData = (mapId: string) => {
    if (mapId === 'map1') {
      // 一楼地图数据（扩大地图尺寸）
      return {
        nodes: [
          { id: 'p1', name: 'P1', x: 80, y: 120, type: '站点', direction: 0 },
          { id: 'p2', name: 'P2', x: 280, y: 120, type: '节点' },
          { id: 'p3', name: 'P3', x: 280, y: 320, type: '停靠点', direction: 90 },
          { id: 'p4', name: 'P4', x: 520, y: 320, type: '充电点', direction: 180 },
          { id: 'p5', name: 'P5', x: 520, y: 200, type: '临停点', direction: -90 },
          { id: 'p6', name: 'P6', x: 720, y: 200, type: '归位点', direction: 0 },
          { id: 'p7', name: 'P7', x: 720, y: 380, type: '站点', direction: 90 },
          { id: 'p8', name: 'P8', x: 400, y: 450, type: '充电点', direction: 180 },
          { id: 'p9', name: 'P9', x: 150, y: 380, type: '停靠点', direction: -90 },
          { id: 'p10', name: 'P10', x: 80, y: 260, type: '节点' },
        ],
        lines: [
          { id: 'l1', name: 'L1', startPointId: 'p1', endPointId: 'p2', type: 'double-line', color: '#1890ff' },
          { id: 'l2', name: 'L2', startPointId: 'p2', endPointId: 'p3', type: 'double-bezier', color: '#1890ff', controlPoints: {
            cp1: { x: 280, y: 200 },
            cp2: { x: 200, y: 320 }
          }},
          { id: 'l3', name: 'L3', startPointId: 'p3', endPointId: 'p4', type: 'single-bezier', color: '#1890ff', controlPoints: {
            cp1: { x: 350, y: 380 },
            cp2: { x: 450, y: 380 }
          }},
          { id: 'l4', name: 'L4', startPointId: 'p4', endPointId: 'p5', type: 'double-line', color: '#1890ff' },
          { id: 'l5', name: 'L5', startPointId: 'p5', endPointId: 'p6', type: 'double-bezier', color: '#1890ff' },
          { id: 'l6', name: 'L6', startPointId: 'p6', endPointId: 'p7', type: 'double-line', color: '#1890ff' },
          { id: 'l7', name: 'L7', startPointId: 'p7', endPointId: 'p8', type: 'single-bezier', color: '#1890ff', controlPoints: {
            cp1: { x: 600, y: 420 },
            cp2: { x: 500, y: 480 }
          }},
          { id: 'l8', name: 'L8', startPointId: 'p8', endPointId: 'p9', type: 'double-bezier', color: '#1890ff' },
          { id: 'l9', name: 'L9', startPointId: 'p9', endPointId: 'p10', type: 'double-line', color: '#1890ff' },
          { id: 'l10', name: 'L10', startPointId: 'p10', endPointId: 'p1', type: 'single-bezier', color: '#1890ff' },
        ],
        areas: [
          {
            id: 'area1',
            name: '禁行区域1',
            type: '禁行区域',
            points: [
              { x: 200, y: 250 },
              { x: 350, y: 250 },
              { x: 350, y: 350 },
              { x: 200, y: 350 }
            ],
            opacity: 0.3
          },
          {
            id: 'area2',
            name: '调速区域1',
            type: '调速区域',
            speed: 0.6,
            points: [
              { x: 450, y: 180 },
              { x: 580, y: 180 },
              { x: 580, y: 280 },
              { x: 450, y: 280 }
            ],
            opacity: 0.3
          },
          {
            id: 'area3',
            name: '多路网区1',
            type: '多路网区',
            points: [
              { x: 600, y: 220 },
              { x: 750, y: 220 },
              { x: 750, y: 320 },
              { x: 600, y: 320 }
            ],
            opacity: 0.3
          }
        ]
      };
    } else if (mapId === 'map2') {
      // 二楼地图数据（简化布局，移除p5、p6、p7、p8节点）
      return {
        nodes: [
          // 第一行（顶部）
          { id: 'p1', name: 'P1', x: 150, y: 80, type: '节点', direction: 0 },
          { id: 'p2', name: 'P2', x: 300, y: 80, type: '节点', direction: 0 },
          { id: 'p3', name: 'P3', x: 450, y: 80, type: '节点', direction: 0 },
          { id: 'p4', name: 'P4', x: 600, y: 80, type: '节点', direction: 0 },
          
          // 第三行（底部）
          { id: 'p9', name: 'P9', x: 150, y: 240, type: '节点', direction: 0 },
          { id: 'p10', name: 'P10', x: 300, y: 240, type: '节点', direction: 0 },
          { id: 'p11', name: 'P11', x: 450, y: 240, type: '节点', direction: 0 },
          { id: 'p12', name: 'P12', x: 600, y: 240, type: '节点', direction: 0 },
          
          // 左侧特殊点位
          { id: 'p13', name: 'MCR-001', x: 50, y: 120, type: '停靠点', direction: 0 },
          { id: 'p14', name: '充电点', x: 50, y: 200, type: '充电点', direction: 0 },
        ],
        lines: [
          // 水平连接线（第一行）
          { id: 'l1', name: 'L1', startPointId: 'p1', endPointId: 'p2', type: 'double-line', color: '#1890ff' },
          { id: 'l2', name: 'L2', startPointId: 'p2', endPointId: 'p3', type: 'double-line', color: '#1890ff' },
          { id: 'l3', name: 'L3', startPointId: 'p3', endPointId: 'p4', type: 'double-line', color: '#1890ff' },
          
          // 水平连接线（第三行）
          { id: 'l4', name: 'L4', startPointId: 'p9', endPointId: 'p10', type: 'double-line', color: '#1890ff' },
          { id: 'l5', name: 'L5', startPointId: 'p10', endPointId: 'p11', type: 'double-line', color: '#1890ff' },
          { id: 'l6', name: 'L6', startPointId: 'p11', endPointId: 'p12', type: 'double-line', color: '#1890ff' },
          
          // 垂直连接线（直接连接第一行和第三行）
          { id: 'l7', name: 'L7', startPointId: 'p1', endPointId: 'p9', type: 'double-line', color: '#1890ff' },
          { id: 'l8', name: 'L8', startPointId: 'p2', endPointId: 'p10', type: 'double-line', color: '#1890ff' },
          { id: 'l9', name: 'L9', startPointId: 'p3', endPointId: 'p11', type: 'double-line', color: '#1890ff' },
          { id: 'l10', name: 'L10', startPointId: 'p4', endPointId: 'p12', type: 'double-line', color: '#1890ff' },
          
          // P9到P1-P4的连接
          { id: 'l11', name: 'L11', startPointId: 'p9', endPointId: 'p1', type: 'single-line', color: '#1890ff' },
          { id: 'l12', name: 'L12', startPointId: 'p9', endPointId: 'p2', type: 'single-line', color: '#1890ff' },
          { id: 'l13', name: 'L13', startPointId: 'p9', endPointId: 'p3', type: 'single-line', color: '#1890ff' },
          { id: 'l14', name: 'L14', startPointId: 'p9', endPointId: 'p4', type: 'single-line', color: '#1890ff' },
          
          // P10到P1-P4的连接
          { id: 'l15', name: 'L15', startPointId: 'p10', endPointId: 'p1', type: 'single-line', color: '#1890ff' },
          { id: 'l16', name: 'L16', startPointId: 'p10', endPointId: 'p2', type: 'single-line', color: '#1890ff' },
          { id: 'l17', name: 'L17', startPointId: 'p10', endPointId: 'p3', type: 'single-line', color: '#1890ff' },
          { id: 'l18', name: 'L18', startPointId: 'p10', endPointId: 'p4', type: 'single-line', color: '#1890ff' },
          
          // P11到P1-P4的连接
          { id: 'l19', name: 'L19', startPointId: 'p11', endPointId: 'p1', type: 'single-line', color: '#1890ff' },
          { id: 'l20', name: 'L20', startPointId: 'p11', endPointId: 'p2', type: 'single-line', color: '#1890ff' },
          { id: 'l21', name: 'L21', startPointId: 'p11', endPointId: 'p3', type: 'single-line', color: '#1890ff' },
          { id: 'l22', name: 'L22', startPointId: 'p11', endPointId: 'p4', type: 'single-line', color: '#1890ff' },
          
          // P12到P1-P4的连接
          { id: 'l23', name: 'L23', startPointId: 'p12', endPointId: 'p1', type: 'single-line', color: '#1890ff' },
          { id: 'l24', name: 'L24', startPointId: 'p12', endPointId: 'p2', type: 'single-line', color: '#1890ff' },
          { id: 'l25', name: 'L25', startPointId: 'p12', endPointId: 'p3', type: 'single-line', color: '#1890ff' },
          { id: 'l26', name: 'L26', startPointId: 'p12', endPointId: 'p4', type: 'single-line', color: '#1890ff' },
          
          // 左侧连接线（连接到第一行和第三行）
          { id: 'l27', name: 'L27', startPointId: 'p13', endPointId: 'p1', type: 'double-line', color: '#1890ff' },
          { id: 'l28', name: 'L28', startPointId: 'p14', endPointId: 'p9', type: 'double-line', color: '#1890ff' },
          { id: 'l29', name: 'L29', startPointId: 'p13', endPointId: 'p14', type: 'double-line', color: '#1890ff' },
        ],
        areas: [
          {
            id: 'area1',
            name: '网格中央区',
            type: '多路网区',
            points: [
              { x: 200, y: 150 },
              { x: 500, y: 150 },
              { x: 500, y: 250 },
              { x: 200, y: 250 }
            ],
            opacity: 0.2
          },
          {
            id: 'area2',
            name: '上层网格区',
            type: '调速区域',
            speed: 0.8,
            points: [
              { x: 200, y: 50 },
              { x: 500, y: 50 },
              { x: 500, y: 120 },
              { x: 200, y: 120 }
            ],
            opacity: 0.3
          },
          {
            id: 'area3',
            name: '下层网格区',
            type: '工作区域',
            points: [
              { x: 200, y: 280 },
              { x: 500, y: 280 },
              { x: 500, y: 350 },
              { x: 200, y: 350 }
            ],
            opacity: 0.25
          },
          {
            id: 'area4',
            name: '左侧停车区',
            type: '停车区域',
            points: [
              { x: 50, y: 150 },
              { x: 170, y: 150 },
              { x: 170, y: 250 },
              { x: 50, y: 250 }
            ],
            opacity: 0.3
          }
        ]
      };
    } else if (mapId === 'map3') {
      // 三楼地图数据（网格布局）
      return {
        nodes: [
          // 第一行
          { id: 'p1', name: 'P1', x: 100, y: 100, type: '站点', direction: 0 },
          { id: 'p2', name: 'P2', x: 250, y: 100, type: '节点' },
          { id: 'p3', name: 'P3', x: 400, y: 100, type: '充电点', direction: 90 },
          { id: 'p4', name: 'P4', x: 550, y: 100, type: '电梯点', direction: 180 },
          // 第二行
          { id: 'p5', name: 'P5', x: 100, y: 200, type: '停靠点', direction: 90 },
          { id: 'p6', name: 'P6', x: 250, y: 200, type: '自动门', direction: 0 },
          { id: 'p7', name: 'P7', x: 400, y: 200, type: '切换点', direction: -90 },
          { id: 'p8', name: 'P8', x: 550, y: 200, type: '归位点', direction: 180 },
          // 第三行
          { id: 'p9', name: 'P9', x: 100, y: 300, type: '临停点', direction: 0 },
          { id: 'p10', name: 'P10', x: 250, y: 300, type: '节点' },
          { id: 'p11', name: 'P11', x: 400, y: 300, type: '站点', direction: 90 },
          { id: 'p12', name: 'P12', x: 550, y: 300, type: '充电点', direction: 180 },
        ],
        lines: [
          // 水平连接线
          { id: 'l1', name: 'L1', startPointId: 'p1', endPointId: 'p2', type: 'double-line', color: '#722ed1' },
          { id: 'l2', name: 'L2', startPointId: 'p2', endPointId: 'p3', type: 'double-line', color: '#722ed1' },
          { id: 'l3', name: 'L3', startPointId: 'p3', endPointId: 'p4', type: 'double-line', color: '#722ed1' },
          { id: 'l4', name: 'L4', startPointId: 'p5', endPointId: 'p6', type: 'double-line', color: '#722ed1' },
          { id: 'l5', name: 'L5', startPointId: 'p6', endPointId: 'p7', type: 'double-line', color: '#722ed1' },
          { id: 'l6', name: 'L6', startPointId: 'p7', endPointId: 'p8', type: 'double-line', color: '#722ed1' },
          { id: 'l7', name: 'L7', startPointId: 'p9', endPointId: 'p10', type: 'double-line', color: '#722ed1' },
          { id: 'l8', name: 'L8', startPointId: 'p10', endPointId: 'p11', type: 'double-line', color: '#722ed1' },
          { id: 'l9', name: 'L9', startPointId: 'p11', endPointId: 'p12', type: 'double-line', color: '#722ed1' },
          // 垂直连接线
          { id: 'l10', name: 'L10', startPointId: 'p1', endPointId: 'p5', type: 'single-line', color: '#722ed1' },
          { id: 'l11', name: 'L11', startPointId: 'p2', endPointId: 'p6', type: 'single-line', color: '#722ed1' },
          { id: 'l12', name: 'L12', startPointId: 'p3', endPointId: 'p7', type: 'single-line', color: '#722ed1' },
          { id: 'l13', name: 'L13', startPointId: 'p4', endPointId: 'p8', type: 'single-line', color: '#722ed1' },
          { id: 'l14', name: 'L14', startPointId: 'p5', endPointId: 'p9', type: 'single-line', color: '#722ed1' },
          { id: 'l15', name: 'L15', startPointId: 'p6', endPointId: 'p10', type: 'single-line', color: '#722ed1' },
          { id: 'l16', name: 'L16', startPointId: 'p7', endPointId: 'p11', type: 'single-line', color: '#722ed1' },
          { id: 'l17', name: 'L17', startPointId: 'p8', endPointId: 'p12', type: 'single-line', color: '#722ed1' },
          // 对角连接线
          { id: 'l18', name: 'L18', startPointId: 'p2', endPointId: 'p7', type: 'single-bezier', color: '#722ed1', controlPoints: {
            cp1: { x: 300, y: 130 },
            cp2: { x: 350, y: 170 }
          }},
          { id: 'l19', name: 'L19', startPointId: 'p6', endPointId: 'p11', type: 'single-bezier', color: '#722ed1', controlPoints: {
            cp1: { x: 300, y: 230 },
            cp2: { x: 350, y: 270 }
          }},
        ],
        areas: [
          {
            id: 'area1',
            name: '西北工作区',
            type: '多路网区',
            points: [
              { x: 80, y: 80 },
              { x: 270, y: 80 },
              { x: 270, y: 220 },
              { x: 80, y: 220 }
            ],
            opacity: 0.2
          },
          {
            id: 'area2',
            name: '东北调速区',
            type: '调速区域',
            speed: 1.2,
            points: [
              { x: 380, y: 80 },
              { x: 570, y: 80 },
              { x: 570, y: 220 },
              { x: 380, y: 220 }
            ],
            opacity: 0.3
          },
          {
            id: 'area3',
            name: '南侧禁行区',
            type: '禁行区域',
            points: [
              { x: 200, y: 280 },
              { x: 450, y: 280 },
              { x: 450, y: 320 },
              { x: 200, y: 320 }
            ],
            opacity: 0.3
          },
          {
            id: 'area4',
            name: '中央缓冲区',
            type: '调速区域',
            speed: 0.5,
            points: [
              { x: 200, y: 150 },
              { x: 450, y: 150 },
              { x: 450, y: 250 },
              { x: 200, y: 250 }
            ],
            opacity: 0.2
          }
        ]
      };
    }
    
    // 默认返回一楼地图数据
    return getMapData('map1');
  };

  // 获取当前地图数据
  const currentMapData = getMapData(selectedMap);
  const pathLines = currentMapData.lines;
  const mapAreas = currentMapData.areas;

  // 获取点的颜色（与地图管理保持一致）
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

  // 选中状态检查函数

  
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

  // 绘制箭头的辅助函数（与地图管理保持一致）
  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, scale: number) => {
    const arrowSize = 7 / scale; // 箭头尺寸
    const offset = 8 / scale; // 箭头向后偏移距离
    
    // 计算箭头的实际位置（向后偏移）
    const arrowX = x - offset * Math.cos(angle);
    const arrowY = y - offset * Math.sin(angle);
    
    // 计算箭头的两个底边点
    const x1 = arrowX - arrowSize * Math.cos(angle - Math.PI / 6);
    const y1 = arrowY - arrowSize * Math.sin(angle - Math.PI / 6);
    const x2 = arrowX - arrowSize * Math.cos(angle + Math.PI / 6);
    const y2 = arrowY - arrowSize * Math.sin(angle + Math.PI / 6);
    
    // 绘制箭头
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  };
  
  // 画布缩放和平移状态
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 获取所有机器人（使用robotsState以确保显示正确的状态和位置）
  const allRobots = robotsState.length > 0 ? robotsState : robots;
  
  // 获取地图名称的辅助函数


  // 当选中机器人改变时，自动居中显示
  useEffect(() => {
    if (selectedRobot) {
      centerOnRobot(selectedRobot);
    }
  }, [selectedRobot, scale]);

  // 组件挂载时初始化视图状态
  useEffect(() => {
    // 重置视图到初始状态，确保首次进入时显示正常
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setSelectedRobot(null);
  }, [selectedMap]); // 地图切换时重置视图

  // Canvas尺寸更新
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 重置Canvas准备状态
    setCanvasReady(false);

    const updateCanvasSize = () => {
      // 等待下一帧确保DOM更新完成
      requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        
        
        if (rect.width === 0 || rect.height === 0) {
          
          return;
        }
        
        // 设置Canvas的实际尺寸
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        // 设置Canvas的显示尺寸
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        

        
        // 缩放Canvas上下文以适应设备像素比
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 重置变换矩阵，避免缩放累积
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        
        // 标记Canvas已准备好
        setCanvasReady(true);
        
        // 立即触发一次绘制，确保Canvas内容显示
         setTimeout(() => {
           
           setRedrawTrigger(prev => prev + 1);
         }, 10);
      });
    };

    // 延迟初始化Canvas尺寸，确保DOM完全渲染
    const initTimer = setTimeout(() => {
      updateCanvasSize();
    }, 50);

    // 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    resizeObserver.observe(canvas);

    return () => {
      clearTimeout(initTimer);
      resizeObserver.disconnect();
    };
  }, [leftPanelVisible, rightPanelVisible]);

  // 组件挂载后强制重绘
  useEffect(() => {
    const forceRedraw = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        
        setCanvasReady(true);
        // 强制触发一次重绘
        setTimeout(() => {
          setRedrawTrigger(prev => prev + 1);
        }, 50);
      } else {
        // 如果Canvas还没准备好，延迟重试
        setTimeout(forceRedraw, 100);
      }
    };
    
    // 延迟执行强制重绘
    const timer = setTimeout(forceRedraw, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // 绘制画布内容
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      
      return;
    }

    // 获取显示尺寸用于绘制计算
    const displayWidth = canvas.offsetWidth;
    const displayHeight = canvas.offsetHeight;
    
    // 如果Canvas尺寸为0或未准备好，不进行绘制
    if (displayWidth === 0 || displayHeight === 0 || !canvasReady) {

      return;
    }
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    console.log('Canvas debug info:', {
      displayWidth,
      displayHeight,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      devicePixelRatio,
      scale,
      offsetX,
      offsetY
    });

    // 清空画布
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    


    // 保存当前状态
    ctx.save();
    
    // 应用缩放和平移变换
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 绘制浅灰背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(-offsetX / scale, -offsetY / scale, displayWidth / scale, displayHeight / scale);

    // 绘制网格背景
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1 / scale;
    const gridSize = 30;
    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const endX = Math.ceil((displayWidth - offsetX) / scale / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endY = Math.ceil((displayHeight - offsetY) / scale / gridSize) * gridSize;
    
    for (let i = startX; i <= endX; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, startY);
      ctx.lineTo(i, endY);
      ctx.stroke();
    }
    for (let i = startY; i <= endY; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, i);
      ctx.lineTo(endX, i);
      ctx.stroke();
    }

    // 示例数据 - 区域
     const mapAreas: MapArea[] = [
       {
         id: 'area1',
         name: '禁行区域1',
         type: '禁行区域',
         points: [
           { x: 150, y: 200 },
           { x: 250, y: 200 },
           { x: 250, y: 280 },
           { x: 150, y: 280 }
         ],
         opacity: 0.3
       },
       {
         id: 'area2',
         name: '调速区域1',
         type: '调速区域',
         speed: 0.6,
         points: [
           { x: 320, y: 150 },
           { x: 420, y: 150 },
           { x: 420, y: 220 },
           { x: 320, y: 220 }
         ],
         opacity: 0.3
       },
       {
         id: 'area3',
         name: '多路网区1',
         type: '多路网区',
         points: [
           { x: 450, y: 180 },
           { x: 550, y: 180 },
           { x: 550, y: 250 },
           { x: 450, y: 250 }
         ],
         opacity: 0.3
       }
     ];
 
     // 绘制区域
     mapAreas.forEach(area => {
       if (area.points.length < 3) return;
       
       // 获取区域颜色
       const areaColors = getAreaColors(area);
       // 移除选中效果
       
       // 设置区域样式 - 进一步调淡透明度
       ctx.fillStyle = areaColors.fillColor + '20'; // 进一步降低填充透明度，使颜色更淡
       ctx.strokeStyle = areaColors.strokeColor + '40'; // 进一步降低描边透明度
       ctx.lineWidth = 2 / scale; // 统一使用2px宽度
       
       // 绘制区域
       ctx.beginPath();
       ctx.moveTo(area.points[0].x, area.points[0].y);
       for (let i = 1; i < area.points.length; i++) {
         ctx.lineTo(area.points[i].x, area.points[i].y);
       }
       ctx.closePath();
       ctx.fill();
       ctx.stroke();
       
       // 绘制区域名称
       const centerX = area.points.reduce((sum, p) => sum + p.x, 0) / area.points.length;
       const centerY = area.points.reduce((sum, p) => sum + p.y, 0) / area.points.length;
       
       ctx.fillStyle = areaColors.strokeColor;
       ctx.font = `bold ${12 / scale}px Arial`;
       ctx.textAlign = 'center';
       ctx.fillText(area.name, centerX, centerY);
     });

    // 绘制拓扑路径（使用新的线条类型系统）
    
    // 绘制线条
    pathLines.forEach(line => {
      // 查找起点和终点
      const startPoint = pathNodes.find(p => p.id === line.startPointId);
      const endPoint = pathNodes.find(p => p.id === line.endPointId);
      
      if (!startPoint || !endPoint) return;
      
      // 检查路径是否被占用
      const isPathOccupied = occupiedPaths.includes(line.id);
      
      // 添加路径颜色过渡效果
      // 使用路径ID作为键，存储颜色过渡状态
      if (!pathColorTransitions.current[line.id]) {
        pathColorTransitions.current[line.id] = {
          currentColor: line.color,
          targetColor: isPathOccupied ? '#ff4d4f' : line.color,
          transitionProgress: 0
        };
      }
      
      // 更新颜色过渡目标
      const targetColor = isPathOccupied ? '#ff4d4f' : line.color;
      if (pathColorTransitions.current[line.id].targetColor !== targetColor) {
        pathColorTransitions.current[line.id].targetColor = targetColor;
        pathColorTransitions.current[line.id].transitionProgress = 0;
      }
      
      // 计算过渡颜色
      const transition = pathColorTransitions.current[line.id];
      if (transition.transitionProgress < 1) {
        transition.transitionProgress = Math.min(transition.transitionProgress + 0.1, 1);
      }
      
      // 颜色插值函数
      const lerpColor = (color1: string, color2: string, factor: number) => {
        // 解析颜色
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        // 线性插值
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));
        
        // 转换回十六进制
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      };
      
      // 计算当前颜色
      const currentColor = lerpColor(
        transition.currentColor,
        transition.targetColor,
        transition.transitionProgress
      );
      
      // 更新当前颜色
      if (transition.transitionProgress >= 1) {
        transition.currentColor = transition.targetColor;
      }
      
      const lineColor = currentColor;
      const lineWidth = 3 / scale; // 统一使用3px宽度
      
      // 设置线条样式
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      
      // 根据线条类型绘制
      if (line.type === 'single-bezier' || line.type === 'double-bezier') {
        // 绘制贝塞尔曲线
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        
        // 确保控制点存在，如果未指定则自动计算
        const defaultCp1 = {
          x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
          y: startPoint.y
        };
        const defaultCp2 = {
          x: endPoint.x - (endPoint.x - startPoint.x) * 0.5,
          y: endPoint.y
        };
        
        // 使用默认值确保控制点始终存在
        const cp1 = line.controlPoints?.cp1 || defaultCp1;
        const cp2 = line.controlPoints?.cp2 || defaultCp2;
        
        // 绘制三次贝塞尔曲线
        ctx.bezierCurveTo(
          cp1.x,
          cp1.y,
          cp2.x,
          cp2.y,
          endPoint.x,
          endPoint.y
        );
        ctx.stroke();
        
        // 计算曲线末端的切线角度（用于箭头方向）
        const t = 0.95; // 在曲线95%位置计算切线
        const dx = 3 * (1 - t) * (1 - t) * (cp1.x - startPoint.x) + 
                   6 * (1 - t) * t * (cp2.x - cp1.x) + 
                   3 * t * t * (endPoint.x - cp2.x);
        const dy = 3 * (1 - t) * (1 - t) * (cp1.y - startPoint.y) + 
                   6 * (1 - t) * t * (cp2.y - cp1.y) + 
                   3 * t * t * (endPoint.y - cp2.y);
        const endAngle = Math.atan2(dy, dx);
        
        // 计算曲线起点的切线角度（用于起点箭头方向）
        const t2 = 0.05; // 在曲线5%位置计算切线
        const dx2 = 3 * (1 - t2) * (1 - t2) * (cp1.x - startPoint.x) + 
                    6 * (1 - t2) * t2 * (cp2.x - cp1.x) + 
                    3 * t2 * t2 * (endPoint.x - cp2.x);
        const dy2 = 3 * (1 - t2) * (1 - t2) * (cp1.y - startPoint.y) + 
                    6 * (1 - t2) * t2 * (cp2.y - cp1.y) + 
                    3 * t2 * t2 * (endPoint.y - cp2.y);
        const startAngle = Math.atan2(dy2, dx2);
        
        // 根据线条类型绘制箭头
        if (line.type === 'single-bezier') {
          // 单向贝塞尔曲线：只在终点绘制箭头
          drawArrow(ctx, endPoint.x, endPoint.y, endAngle, lineColor, scale);
        } else {
          // 双向贝塞尔曲线：在起点和终点都绘制箭头
          drawArrow(ctx, endPoint.x, endPoint.y, endAngle, lineColor, scale);
          drawArrow(ctx, startPoint.x, startPoint.y, startAngle + Math.PI, lineColor, scale);
        }
      } else {
        // 绘制直线
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
        
        // 计算线条角度
        const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
        
        // 根据线条类型绘制箭头
        if (line.type === 'single-line') {
          // 单向线条：只在终点绘制箭头
          drawArrow(ctx, endPoint.x, endPoint.y, angle, lineColor, scale);
        } else if (line.type === 'double-line') {
          // 双向线条：在起点和终点都绘制箭头
          drawArrow(ctx, endPoint.x, endPoint.y, angle, lineColor, scale);
          drawArrow(ctx, startPoint.x, startPoint.y, angle + Math.PI, lineColor, scale);
        }
      }
    });

    // 绘制路径节点（使用新的点类型系统）
    
    pathNodes.forEach(point => {
      const pointColor = '#1890ff'; // 默认蓝色
      // 移除选中效果
      const pointSize = 8 / scale; // 统一大小
      
      // 绘制点的外圈
      ctx.strokeStyle = pointColor;
      ctx.lineWidth = 2 / scale; // 固定2px描边
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
      ctx.stroke();
      
      // 绘制点的内部填充
      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize - 2 / scale, 0, 2 * Math.PI); // 减去描边宽度
      ctx.fill();
      
      // 绘制点名称
      ctx.fillStyle = '#000000';
      ctx.font = `${10 / scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(point.name, point.x, point.y - 15 / scale);
    });

    // 绘制机器人 - 使用robotsState中的数据
    robotsState.forEach(robot => {
      // 使用机器人当前位置
      const x = robot.position.x;
      const y = robot.position.y;
      
      // 机器人尺寸（增大长度）
      const robotWidth = 50 / scale;
      const robotHeight = 35 / scale;
      const cornerRadius = 6 / scale;
      
      // 机器人颜色（根据状态显示不同颜色）
      let robotColor = '#52c41a'; // 默认绿色（空闲）
      if (robot.status === 'running') {
        robotColor = '#1890ff'; // 蓝色（运行中）
      }
      if (robot.status === 'charging') {
        robotColor = '#faad14'; // 橙色（充电中）
      }
      if (robot.status === 'error') {
        robotColor = '#ff4d4f'; // 红色（故障）
      }
      if (robot.status === 'waiting') {
        robotColor = '#9254de'; // 紫色（交管中）
      }
      if (robot.status === 'move_stopped') {
        robotColor = '#ffa39e'; // 肉色（移动停止）
      }
      
      // 绘制机器人主体
      ctx.strokeStyle = robotColor;
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.roundRect(x - robotWidth/2, y - robotHeight/2, robotWidth, robotHeight, cornerRadius);
      
      // 为AGV、MCR和AMR机器人添加半透明填充色
      if (robot.type === 'AGV' || robot.type === 'MCR' || robot.type === 'AMR') {
        // 使用带透明度的填充色
        ctx.fillStyle = robotColor + '30'; // 添加30%透明度
        ctx.fill();
      }
      
      ctx.stroke();
      
      // 绘制车头方向指示器（三角形箭头）- 使用机器人的移动方向
      // 获取方向角度（使用机器人的direction属性，如果没有则默认为0度）
      const direction = robot.direction || 0;
      
      // 将角度转换为弧度
      const directionRad = (direction * Math.PI) / 180;
      
      // 箭头尺寸和位置
      const arrowSize = 12 / scale; // 增大箭头尺寸
      
      // 计算箭头位置（从中心点出发）
      const arrowX = x + (robotWidth/2 - 4/scale) * Math.cos(directionRad);
      const arrowY = y + (robotWidth/2 - 4/scale) * Math.sin(directionRad);
      
      // 计算箭头三个点的坐标
      const arrowTip = {
        x: arrowX,
        y: arrowY
      };
      
      // 计算箭头底边两点（垂直于方向）
      const perpRad = directionRad + Math.PI/2; // 垂直方向
      const arrowBase1 = {
        x: arrowX - arrowSize * Math.cos(directionRad) + (arrowSize/2) * Math.cos(perpRad),
        y: arrowY - arrowSize * Math.sin(directionRad) + (arrowSize/2) * Math.sin(perpRad)
      };
      
      const arrowBase2 = {
        x: arrowX - arrowSize * Math.cos(directionRad) - (arrowSize/2) * Math.cos(perpRad),
        y: arrowY - arrowSize * Math.sin(directionRad) - (arrowSize/2) * Math.sin(perpRad)
      };
      
      // 绘制箭头
      ctx.fillStyle = robotColor;
      ctx.beginPath();
      ctx.moveTo(arrowTip.x, arrowTip.y);
      ctx.lineTo(arrowBase1.x, arrowBase1.y);
      ctx.lineTo(arrowBase2.x, arrowBase2.y);
      ctx.closePath();
      ctx.fill();
      
      // 绘制机器人类型标识
      ctx.fillStyle = '#333333';
      ctx.font = `bold ${10 / scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(robot.type, x, y);
      
      // 绘制机器人名称
      ctx.fillStyle = '#333333';
      ctx.font = `${12 / scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(robot.name, x, y + robotHeight/2 + 6/scale);
      
      // 绘制在线状态指示点（仅在运行状态时显示）
      if (robot.status === 'running') {
        const statusDotRadius = 4 / scale;
        const statusDotX = x + robotWidth/2 - statusDotRadius - 3/scale;
        const statusDotY = y - robotHeight/2 + statusDotRadius + 3/scale;
        
        // 绘制状态点背景（白色）
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(statusDotX, statusDotY, statusDotRadius + 1/scale, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制状态点（绿色闪烁效果）
        const time = Date.now() / 1000;
        const alpha = 0.5 + 0.5 * Math.sin(time * 3); // 闪烁效果
        ctx.fillStyle = `rgba(82, 196, 26, ${alpha})`;
        ctx.beginPath();
        ctx.arc(statusDotX, statusDotY, statusDotRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制任务进度指示器
        if (robot.currentTask) {
          const progressWidth = robotWidth - 10/scale;
          const progressHeight = 4/scale;
          const progressX = x - progressWidth/2;
          const progressY = y - robotHeight/2 - progressHeight - 5/scale;
          
          // 进度条背景
          ctx.fillStyle = '#f0f0f0';
          ctx.beginPath();
          ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 2/scale);
          ctx.fill();
          
          // 进度条填充
          ctx.fillStyle = robotColor;
          ctx.beginPath();
          ctx.roundRect(progressX, progressY, progressWidth * (robot.progress || 0), progressHeight, 2/scale);
          ctx.fill();
        }
      }
      
      // 选中状态边框
      if (selectedRobot === robot.id) {
        ctx.strokeStyle = '#ff4d4f';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([4/scale, 2/scale]);
        ctx.beginPath();
        ctx.roundRect(x - robotWidth/2 - 4/scale, y - robotHeight/2 - 4/scale, 
                     robotWidth + 8/scale, robotHeight + 8/scale, cornerRadius + 2/scale);
        ctx.stroke();
        ctx.setLineDash([]); // 重置虚线
      }
    });
    
    // 恢复状态
    ctx.restore();
  }, [selectedMap, allRobots, selectedRobot, scale, offsetX, offsetY, leftPanelVisible, rightPanelVisible, canvasReady, redrawTrigger, occupiedPaths]);
  
  // 初始化机器人路径状态
  useEffect(() => {
    // 只初始化当前地图的机器人
    const mapRobots = mockRobots.filter(robot => robot.mapId === selectedMap);
    
    // 为每个机器人设置初始路径状态
    const initializedRobots = mapRobots.map(robot => {
      // 只有运行状态的机器人才设置路径相关属性
      if (robot.status !== 'running') {
        // 非运行状态的机器人保持原始状态，不设置路径属性
        return {
          ...robot,
          pathResources: [] // 确保没有路径资源
        };
      }
      
      // 找到机器人初始位置最近的路径点
      let closestPointIndex = 0;
      let minDistance = Number.MAX_VALUE;
      
      pathNodes.forEach((point, index) => {
        const distance = Math.sqrt(
          Math.pow(point.x - robot.position.x, 2) + 
          Math.pow(point.y - robot.position.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPointIndex = index;
        }
      });
      
      // 为不同机器人设置不同的起始点，避免重叠
      let startIndex = closestPointIndex;
      if (robot.id === 'AGV001') {
        startIndex = 0; // AGV从P1开始
      } else if (robot.id === 'MCR001') {
        // MCR根据地图调整起始点
        if (selectedMap === 'map1') {
          startIndex = 5; // 一楼从P6开始（索引5）
        } else if (selectedMap === 'map2') {
          startIndex = 4; // 二楼从P9开始（索引4，因为移除了p5-p8）
        } else {
          startIndex = 2; // 其他地图从索引2开始
        }
      } else if (robot.id === 'AMR001') {
        // AMR根据地图调整起始点
        if (selectedMap === 'map2') {
          startIndex = 0; // 二楼从P1开始，确保AMR-001沿着路径移动
        } else {
          startIndex = 1; // 其他地图从索引1开始
        }
      }
      
      // 申请初始路径资源
      const initialPathResources = requestPathResources(robot.id, startIndex);
      
      // 设置初始路径状态（仅运行状态的机器人）
      return {
        ...robot,
        pathIndex: startIndex,
        targetPointId: pathSequence.length > 0 ? pathSequence[(startIndex + 1) % pathSequence.length].pointId : undefined,
        progress: 0,
        speed: robot.id === 'AGV001' ? 0.005 : 0.003, // AGV速度快一些，MCR慢一些
        pathResources: initialPathResources // 运行状态的机器人申请路径资源
      };
    });
    
    setRobotsState(initializedRobots);
  }, [selectedMap]);

  // 申请路径资源 - 每次申请两条路径资源
  const requestPathResources = (robotId: string, currentIndex: number) => {
    // 获取当前和后续两条路径的ID
    const currentPathId = pathSequence[currentIndex].nextLineId;
    const nextPathId = pathSequence[(currentIndex + 1) % pathSequence.length].nextLineId;
    
    // 检查路径是否已被占用（被其他机器人占用）
    const isPathOccupied = (pathId: string, excludeRobotId: string) => {
      return robotsState.some(r => 
        r.id !== excludeRobotId && 
        r.pathResources && 
        r.pathResources.includes(pathId)
      );
    };
    
    // 如果路径已被占用，返回空数组表示申请失败
    if (isPathOccupied(currentPathId, robotId) || isPathOccupied(nextPathId, robotId)) {
      return [];
    }
    
    // 申请成功，返回路径ID数组
    return [currentPathId, nextPathId];
  };
  
  // 释放路径资源 - 释放已走完的路径（优化性能，减少闪烁）

  // 更新机器人位置 - 沿路线移动
  const updateRobotPositions = () => {
    // 收集所有需要更新的路径资源变更
    const pathUpdates: { add: string[], remove: string[] } = { add: [], remove: [] };
    
    setRobotsState(prevState => {
      return prevState.map(robot => {
        // 处理等待状态的机器人 - 更积极地检查是否可以重新申请资源
        if (robot.status === 'waiting') {
          // 获取当前路径点和目标路径点
          const currentPointId = pathSequence.length > 0 && pathSequence[robot.pathIndex || 0] ? pathSequence[robot.pathIndex || 0].pointId : undefined;
          const currentPoint = currentPointId ? pathNodes.find(p => p.id === currentPointId) : undefined;
          const targetPoint = pathNodes.find(p => p.id === robot.targetPointId);
          
          if (!currentPoint || !targetPoint) return robot;
          
          // 更频繁地尝试重新申请路径资源，提高响应速度
          const resources = requestPathResources(robot.id, robot.pathIndex || 0);
          
          // 如果申请成功，立即恢复运行状态
          if (resources.length > 0) {
            // 记录需要添加的路径资源
            pathUpdates.add.push(...resources);
            
            // 更新机器人状态为运行中，并保持当前进度
            return {
              ...robot,
              pathResources: resources,
              status: 'running', // 恢复为运行状态
              progress: robot.progress || 0 // 保持当前进度
            };
          }
          
          // 如果申请仍然失败，保持等待状态但不阻塞其他逻辑
          return robot;
        }
        
        // 只更新运行状态的机器人，跳过暂停、异常等状态的机器人
        if (robot.status !== 'running') return robot;
        
        // 检查机器人是否被暂停（通过任务点击暂停）
        if (pausedRobots.has(robot.id)) {
          return robot; // 暂停的机器人不移动
        }
        
        // 获取当前路径点和目标路径点
        const currentPointId = pathSequence.length > 0 && pathSequence[robot.pathIndex || 0] ? pathSequence[robot.pathIndex || 0].pointId : undefined;
        const currentPoint = currentPointId ? pathNodes.find(p => p.id === currentPointId) : undefined;
        const targetPoint = pathNodes.find(p => p.id === robot.targetPointId);
        
        if (!currentPoint || !targetPoint) return robot;
        
        // 当前路径ID
        const currentPathId = pathSequence.length > 0 && pathSequence[robot.pathIndex || 0] ? pathSequence[robot.pathIndex || 0].nextLineId : undefined;
        
        // 检查是否有路径资源
        if (!robot.pathResources || robot.pathResources.length < 2) {
          // 申请路径资源
          const resources = requestPathResources(robot.id, robot.pathIndex || 0);
          
          // 如果申请失败（路径被占用），机器人停止移动
          if (resources.length === 0) {
            return {
              ...robot,
              status: 'waiting' // 设置为等待状态
            };
          }
          
          // 记录需要添加的路径资源
          pathUpdates.add.push(...resources);
          
          // 更新机器人占用的路径资源
          return {
            ...robot,
            pathResources: resources,
            status: 'running' // 确保状态为运行中
          };
        }
        
        // 更新进度 - 使用优化的速度让机器人移动更平滑
        // 根据机器人类型和路径类型设置不同的速度
        const baseSpeed = 0.008; // 降低基础速度，提高平滑度
        const robotTypeSpeed = {
          'AGV': 0.015,  // 适中的AGV速度，确保平滑移动
          'AMR': 0.015,  // AMR速度与AGV保持一致
          'MCR': 0.012,  // MCR稍慢一些
          'Forklift': 0.010,
          'default': 0.012
        };
        
        // 获取当前路径信息
        const pathForSpeed = pathLines.find(line => line.id === currentPathId);
        
        // 曲线路径上的速度调整系数（优化曲线移动的平滑度）
        const curveSpeedFactor = (pathForSpeed && (pathForSpeed.type === 'single-bezier' || pathForSpeed.type === 'double-bezier')) ? 0.9 : 1.0;
        
        // 确保所有机器人都有速度，特别是AGV
        const baseRobotSpeed = robot.type === 'AGV' ? robotTypeSpeed.AGV : 
                             (robotTypeSpeed[robot.type as keyof typeof robotTypeSpeed] || robotTypeSpeed.default);
        
        // 应用曲线速度调整系数
        const speed = baseRobotSpeed * curveSpeedFactor;
        
        let newProgress = (robot.progress || 0) + (robot.speed || speed);
        let newPathIndex = robot.pathIndex || 0;
        let newTargetPointId = robot.targetPointId;
        let newPathResources = robot.pathResources || [];
        
        // 如果到达目标点，更新到下一个目标
        if (newProgress >= 1) {
          // 释放已走完的路径
          const pathToRelease = pathSequence[newPathIndex].nextLineId;
          
          // 申请下一条路径资源（当前位置+2的路径）
          const nextPathIndex = (newPathIndex + 2) % pathSequence.length;
          const nextPathId = pathSequence[nextPathIndex].nextLineId;
          
          // 检查下一条路径是否已被占用
          const isNextPathOccupied = robotsState.some(r => 
            r.id !== robot.id && 
            r.pathResources && 
            r.pathResources.includes(nextPathId)
          );
          
          // 如果下一条路径未被占用，则申请并释放当前路径
          if (!isNextPathOccupied) {
            // 更新路径资源列表：移除已走完的路径，添加新申请的路径
            newPathResources = newPathResources.filter(id => id !== pathToRelease);
            newPathResources.push(nextPathId);
            
            // 收集需要更新的路径，而不是立即更新全局状态
            // 在动画循环的最后统一批量更新，减少重绘次数
            const pathToReleaseFinal = pathToRelease;
            const nextPathIdFinal = nextPathId;
            
            // 记录需要添加的新路径资源
            if (!pathUpdates.add.includes(nextPathIdFinal)) {
              pathUpdates.add.push(nextPathIdFinal);
            }
            
            // 使用更短的延迟释放旧路径，提高移动流畅性
            // 减少延迟时间，让路径释放更及时
            setTimeout(() => {
              setOccupiedPaths(prev => {
                // 如果路径ID已经不在占用列表中，则不进行更新，避免不必要的重绘
                if (!prev.includes(pathToReleaseFinal)) return prev;
                
                // 创建新数组而不是修改原数组，避免引用问题
                const newPaths = prev.filter(id => id !== pathToReleaseFinal);
                return newPaths;
              });
            }, 150); // 减少到150ms延迟，提高路径释放效率
            
            // 更新路径索引和目标点
            newProgress = 0;
            newPathIndex = (newPathIndex + 1) % pathSequence.length;
            newTargetPointId = pathSequence.length > 0 ? pathSequence[(newPathIndex + 1) % pathSequence.length].pointId : undefined;
          } else {
            // 如果下一条路径被占用，机器人停在当前位置等待
            newProgress = 1; // 保持在路径终点
            
            // 获取当前路径信息
            const waitingPath = pathLines.find(line => line.id === currentPathId);
            
            // 计算当前位置 - 保持在路径终点，根据路径类型使用不同的计算方法
            let waitX, waitY, waitDirection;
            
            if (waitingPath && (waitingPath.type === 'single-bezier' || waitingPath.type === 'double-bezier')) {
              // 贝塞尔曲线插值
              const cp1 = waitingPath.controlPoints?.cp1 || {
                x: currentPoint.x + (targetPoint.x - currentPoint.x) * 0.5,
                y: currentPoint.y
              };
              const cp2 = waitingPath.controlPoints?.cp2 || {
                x: targetPoint.x - (targetPoint.x - currentPoint.x) * 0.5,
                y: targetPoint.y
              };
              
              // 三次贝塞尔曲线插值公式计算位置
              const t = newProgress;
              const mt = 1 - t;
              waitX = mt*mt*mt*currentPoint.x + 3*mt*mt*t*cp1.x + 3*mt*t*t*cp2.x + t*t*t*targetPoint.x;
              waitY = mt*mt*mt*currentPoint.y + 3*mt*mt*t*cp1.y + 3*mt*t*t*cp2.y + t*t*t*targetPoint.y;
              
              // 计算贝塞尔曲线在当前进度点的切线方向
              const dx = 3 * mt * mt * (cp1.x - currentPoint.x) + 
                        6 * mt * t * (cp2.x - cp1.x) + 
                        3 * t * t * (targetPoint.x - cp2.x);
              const dy = 3 * mt * mt * (cp1.y - currentPoint.y) + 
                        6 * mt * t * (cp2.y - cp1.y) + 
                        3 * t * t * (targetPoint.y - cp2.y);
              
              waitDirection = Math.atan2(dy, dx) * 180 / Math.PI;
            } else {
              // 线性插值
              waitX = currentPoint.x + (targetPoint.x - currentPoint.x) * newProgress;
              waitY = currentPoint.y + (targetPoint.y - currentPoint.y) * newProgress;
              
              // 计算方向角度
              waitDirection = Math.atan2(targetPoint.y - currentPoint.y, targetPoint.x - currentPoint.x) * 180 / Math.PI;
            }
            
            // 更新状态为等待状态
            return {
              ...robot,
              position: { x: waitX, y: waitY },
              progress: newProgress,
              direction: waitDirection,
              status: 'waiting' // 设置为等待状态
            };
          }
        }
        
        // 获取当前路径信息
        const currentPath = pathLines.find(line => line.id === currentPathId);
        
        // 计算新位置 - 根据路径类型使用不同的插值方法
        let newX, newY;
        
        if (currentPath && (currentPath.type === 'single-bezier' || currentPath.type === 'double-bezier')) {
          // 贝塞尔曲线插值
          const cp1 = currentPath.controlPoints?.cp1 || {
            x: currentPoint.x + (targetPoint.x - currentPoint.x) * 0.5,
            y: currentPoint.y
          };
          const cp2 = currentPath.controlPoints?.cp2 || {
            x: targetPoint.x - (targetPoint.x - currentPoint.x) * 0.5,
            y: targetPoint.y
          };
          
          // 三次贝塞尔曲线插值公式 B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
          const t = newProgress;
          const mt = 1 - t;
          newX = mt*mt*mt*currentPoint.x + 3*mt*mt*t*cp1.x + 3*mt*t*t*cp2.x + t*t*t*targetPoint.x;
          newY = mt*mt*mt*currentPoint.y + 3*mt*mt*t*cp1.y + 3*mt*t*t*cp2.y + t*t*t*targetPoint.y;
        } else {
          // 线性插值
          newX = currentPoint.x + (targetPoint.x - currentPoint.x) * newProgress;
          newY = currentPoint.y + (targetPoint.y - currentPoint.y) * newProgress;
        }
        
        // 计算移动方向角度 - 根据路径类型使用不同的计算方法
        let direction;
        
        if (currentPath && (currentPath.type === 'single-bezier' || currentPath.type === 'double-bezier')) {
          // 贝塞尔曲线的切线方向计算
          const cp1 = currentPath.controlPoints?.cp1 || {
            x: currentPoint.x + (targetPoint.x - currentPoint.x) * 0.5,
            y: currentPoint.y
          };
          const cp2 = currentPath.controlPoints?.cp2 || {
            x: targetPoint.x - (targetPoint.x - currentPoint.x) * 0.5,
            y: targetPoint.y
          };
          
          // 计算贝塞尔曲线在当前进度点的切线方向
          // 切线公式: B'(t) = 3(1-t)²(P₁-P₀) + 6(1-t)t(P₂-P₁) + 3t²(P₃-P₂)
          const t = newProgress;
          const mt = 1 - t;
          const dx = 3 * mt * mt * (cp1.x - currentPoint.x) + 
                    6 * mt * t * (cp2.x - cp1.x) + 
                    3 * t * t * (targetPoint.x - cp2.x);
          const dy = 3 * mt * mt * (cp1.y - currentPoint.y) + 
                    6 * mt * t * (cp2.y - cp1.y) + 
                    3 * t * t * (targetPoint.y - cp2.y);
          
          direction = Math.atan2(dy, dx) * 180 / Math.PI;
        } else {
          // 线性路径的朝向计算 - 使用起点到终点的方向
          direction = Math.atan2(targetPoint.y - currentPoint.y, targetPoint.x - currentPoint.x) * 180 / Math.PI;
        }
        
        // 更新机器人状态
        return {
          ...robot,
          position: { x: newX, y: newY },
          pathIndex: newPathIndex,
          targetPointId: newTargetPointId,
          progress: newProgress,
          direction: direction,
          pathResources: newPathResources
        };
      });
    });
    
    // 批量更新占用路径状态，避免频繁的状态更新
    if (pathUpdates.add.length > 0) {
      setOccupiedPaths(prev => {
        const newPaths = [...prev];
        pathUpdates.add.forEach(pathId => {
          if (!newPaths.includes(pathId)) {
            newPaths.push(pathId);
          }
        });
        return newPaths;
      });
    }
    
    // 更新占用路径状态 - 确保所有机器人占用的路径都显示为红色
    // 获取所有机器人当前占用的路径资源
    const allActivePathResources = robotsState
      .filter(robot => robot.status === 'running' && robot.pathResources)
      .flatMap(robot => robot.pathResources || []);
    
    // 更新占用路径列表，确保包含所有活跃的路径资源
    setOccupiedPaths(prev => {
      // 创建新的占用路径集合
      const newOccupiedPaths = [...new Set([...prev, ...allActivePathResources])];
      
      // 移除不再被任何机器人占用的路径
      const cleanedPaths = newOccupiedPaths.filter(pathId => allActivePathResources.includes(pathId));
      
      // 只有在路径数量发生变化时才更新状态，避免不必要的重绘
      return cleanedPaths.length !== prev.length || !prev.every(path => cleanedPaths.includes(path)) ? cleanedPaths : prev;
    });
  };

  // 动画循环 - 实现机器人移动和闪烁效果
  useEffect(() => {
    // 检查是否有机器人需要移动（不仅检查running状态，还要确保有机器人存在）
    const hasRobots = robotsState.length > 0;
    
    if (hasRobots && canvasReady) {
      let frameCount = 0;
      
      const animate = () => {
        frameCount++;
        
        // 更新机器人位置
        updateRobotPositions();
        
        // 每帧都触发重绘，确保移动顺畅
        // 但使用节流机制避免过度重绘
        if (frameCount % 1 === 0) { // 每帧都重绘，确保流畅度
          setRedrawTrigger(prev => prev + 1);
        }
        
        // 继续动画循环
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // 启动动画循环
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current !== 0) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
        }
      };
    }
  }, [robotsState, canvasReady]); // 依赖robotsState而不是currentMapRobots
  
  // 组件卸载时清理动画
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== 0) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    };
  }, []);

  // 切换所有面板显示状态
  const toggleAllPanels = () => {
    const newState = !allPanelsVisible;
    setAllPanelsVisible(newState);
    setLeftPanelVisible(newState);
    setRightPanelVisible(newState);
  };

  // 切换左侧面板
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };

  // 切换右侧面板
  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  // 处理画布点击
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // 转换为世界坐标
    const worldX = (canvasX - offsetX) / scale;
    const worldY = (canvasY - offsetY) / scale;

    // 使用已定义的示例数据

    // 检查是否点击了机器人
    const clickedRobot = allRobots.filter(robot => robot.mapId === selectedMap).find((robot: Robot) => {
      const distance = Math.sqrt(
        Math.pow(worldX - robot.position.x, 2) + Math.pow(worldY - robot.position.y, 2)
      );
      return distance <= 15;
    });

    if (clickedRobot) {
      setSelectedRobot(clickedRobot.id);
      centerOnRobot(clickedRobot.id);
      return;
    }
    
    // 检查是否点击了点
    
    const clickedPoint = pathNodes.find(point => {
      const distance = Math.sqrt(
        Math.pow(worldX - point.x, 2) + Math.pow(worldY - point.y, 2)
      );
      return distance <= 12; // 点击范围
    });
    
    if (clickedPoint) {
      // 切换点的选中状态
      if (event.ctrlKey || event.metaKey) {
        // 多选模式
        setSelectedLines(prev => 
          prev.includes(clickedPoint.id) 
            ? prev.filter(id => id !== clickedPoint.id)
            : [...prev, clickedPoint.id]
        );
      } else {
        // 单选模式
        setSelectedLines(prev => 
          prev.includes(clickedPoint.id) ? [] : [clickedPoint.id]
        );
        setSelectedLines([]);
        setSelectedAreas([]);
      }
      setSelectedRobot(null);
      return;
    }
    
    // 检查是否点击了线条
    
    const clickedLine = pathLines.find(line => {
      const startPoint = pathNodes.find(p => p.id === line.startPointId);
      const endPoint = pathNodes.find(p => p.id === line.endPointId);
      
      if (!startPoint || !endPoint) return false;
      
      // 计算点到线段的距离
      const A = worldX - startPoint.x;
      const B = worldY - startPoint.y;
      const C = endPoint.x - startPoint.x;
      const D = endPoint.y - startPoint.y;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return false;
      
      const param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = startPoint.x;
        yy = startPoint.y;
      } else if (param > 1) {
        xx = endPoint.x;
        yy = endPoint.y;
      } else {
        xx = startPoint.x + param * C;
        yy = startPoint.y + param * D;
      }
      
      const dx = worldX - xx;
      const dy = worldY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= 8; // 线条点击范围
    });
    
    if (clickedLine) {
      // 切换线条的选中状态
      if (event.ctrlKey || event.metaKey) {
        // 多选模式
        setSelectedLines(prev => 
          prev.includes(clickedLine.id) 
            ? prev.filter(id => id !== clickedLine.id)
            : [...prev, clickedLine.id]
        );
      } else {
        // 单选模式
        setSelectedLines(prev => 
          prev.includes(clickedLine.id) ? [] : [clickedLine.id]
        );
        setSelectedLines([]);
        setSelectedAreas([]);
      }
      setSelectedRobot(null);
      return;
    }
    
    // 检查是否点击了区域
    const clickedArea = mapAreas.find(area => {
      // 使用射线法判断点是否在多边形内
      let inside = false;
      for (let i = 0, j = area.points.length - 1; i < area.points.length; j = i++) {
        if (((area.points[i].y > worldY) !== (area.points[j].y > worldY)) &&
            (worldX < (area.points[j].x - area.points[i].x) * (worldY - area.points[i].y) / (area.points[j].y - area.points[i].y) + area.points[i].x)) {
          inside = !inside;
        }
      }
      return inside;
    });
    
    if (clickedArea) {
      // 切换区域的选中状态
      if (event.ctrlKey || event.metaKey) {
        // 多选模式
        setSelectedAreas(prev => 
          prev.includes(clickedArea.id) 
            ? prev.filter(id => id !== clickedArea.id)
            : [...prev, clickedArea.id]
        );
      } else {
        // 单选模式
        setSelectedAreas(prev => 
          prev.includes(clickedArea.id) ? [] : [clickedArea.id]
        );
        setSelectedLines([]);
        setSelectedLines([]);
      }
      setSelectedRobot(null);
      return;
    }
    
    // 点击空白区域，清除所有选中状态
    setSelectedRobot(null);
    setSelectedLines([]);
    setSelectedLines([]);
    setSelectedAreas([]);
  };
  
  // 处理鼠标滚轮缩放
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor));
    
    // 计算缩放后的偏移量，使鼠标位置保持不变
    const newOffsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
    
    setScale(newScale);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };
  
  // 处理鼠标按下
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { // 左键
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };
  
  // 处理鼠标移动
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      
      setOffsetX(offsetX + deltaX);
      setOffsetY(offsetY + deltaY);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };
  
  // 处理鼠标抬起
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 处理双击事件
  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // 转换为世界坐标
    const worldX = (canvasX - offsetX) / scale;
    const worldY = (canvasY - offsetY) / scale;

    // 检查是否双击了点
    const clickedPoint = pathNodes.find(point => {
      const distance = Math.sqrt(
        Math.pow(worldX - point.x, 2) + Math.pow(worldY - point.y, 2)
      );
      return distance <= 12; // 点击范围
    });
    
    if (clickedPoint) {
      setPropertyElementType('point');
      setPropertyElementData(clickedPoint);
      setPropertyPanelVisible(true);
      return;
    }
    
    // 检查是否双击了线条
    const clickedLine = pathLines.find(line => {
      const startPoint = pathNodes.find(p => p.id === line.startPointId);
      const endPoint = pathNodes.find(p => p.id === line.endPointId);
      
      if (!startPoint || !endPoint) return false;
      
      // 计算点到线段的距离
      const A = worldX - startPoint.x;
      const B = worldY - startPoint.y;
      const C = endPoint.x - startPoint.x;
      const D = endPoint.y - startPoint.y;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return false;
      
      const param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = startPoint.x;
        yy = startPoint.y;
      } else if (param > 1) {
        xx = endPoint.x;
        yy = endPoint.y;
      } else {
        xx = startPoint.x + param * C;
        yy = startPoint.y + param * D;
      }
      
      const dx = worldX - xx;
      const dy = worldY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= 8; // 线条点击范围
    });
    
    if (clickedLine) {
      setPropertyElementType('line');
      setPropertyElementData(clickedLine);
      setPropertyPanelVisible(true);
      return;
    }
    
    // 检查是否双击了区域
    const clickedArea = mapAreas.find(area => {
      // 使用射线法判断点是否在多边形内
      let inside = false;
      for (let i = 0, j = area.points.length - 1; i < area.points.length; j = i++) {
        if (((area.points[i].y > worldY) !== (area.points[j].y > worldY)) &&
            (worldX < (area.points[j].x - area.points[i].x) * (worldY - area.points[i].y) / (area.points[j].y - area.points[i].y) + area.points[i].x)) {
          inside = !inside;
        }
      }
      return inside;
    });
    
    if (clickedArea) {
      setPropertyElementType('area');
      setPropertyElementData(clickedArea);
      setPropertyPanelVisible(true);
      return;
    }
  };
  

  
  // 重置画布视图
  const resetView = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'success'; // 空闲中 - 绿色
      case 'running': return 'processing'; // 运行中 - 蓝色
      case 'executing': return 'processing'; // 执行中 - 蓝色
      case 'charging': return 'cyan'; // 充电中 - 青色
      case 'traffic_control': return 'purple'; // 交管中 - 紫色
      case 'move_stopped': return 'default'; // 移动停止 - 肉色（使用自定义颜色）
      case 'error': return 'error'; // 异常 - 红色
      case 'obstacle_avoidance': return 'warning'; // 避障中 - 黄色
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return '空闲中';
      case 'running': return '运行中';
      case 'executing': return '执行中';
      case 'charging': return '充电中';
      case 'traffic_control': return '交管中';
      case 'move_stopped': return '移动停止';
      case 'error': return '异常';
      case 'obstacle_avoidance': return '避障中';
      default: return '空闲中'; // 默认显示空闲状态
    }
  };

  // 获取机器人类型图标
  const getRobotTypeIcon = (type: string) => {
    switch (type) {
      case 'AGV': return <CarOutlined />; // AGV使用汽车图标
      case 'MCR': return <AndroidOutlined />; // MCR使用安卓机器人图标
      case 'AMR': return <RobotOutlined />; // AMR使用机器人图标
      default: return <RobotOutlined />;
    }
  };

  // 获取状态对应的头像背景颜色
  const getStatusAvatarColor = (status: string) => {
    switch (status) {
      case 'idle': return '#52c41a'; // 空闲中 - 绿色
      case 'running': return '#1890ff'; // 运行中 - 蓝色
      case 'executing': return '#1890ff'; // 执行中 - 蓝色
      case 'charging': return '#13c2c2'; // 充电中 - 青色
      case 'traffic_control': return '#722ed1'; // 交管中 - 紫色
      case 'move_stopped': return '#ffa39e'; // 移动停止 - 肉色
      case 'error': return '#ff4d4f'; // 异常 - 红色
      case 'obstacle_avoidance': return '#faad14'; // 避障中 - 黄色
      default: return '#d9d9d9';
    }
  };

  // 获取任务状态颜色
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'processing';
      case 'pending': return 'default';
      case 'paused': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'failed': return 'error';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // 获取任务状态文本
  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'executing': return '执行中';
      case 'pending': return '待执行';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'failed': return '失败';
      case 'error': return '已挂起';
      default: return '待执行'; // 默认显示待执行状态
    }
  };



  // 任务操作处理函数
  const handleTaskCancel = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    Modal.confirm({
      title: '确认取消任务',
      content: `确定要取消任务「${task.name}」吗？取消后任务将无法恢复。`,
      okText: '确认取消',
      cancelText: '我再想想',
      okType: 'danger',
      onOk: () => {
        // 更新任务状态为已取消
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'cancelled' } : t
        ));
        
        // 如果任务有分配的机器人，将机器人状态设为空闲
        if (task.robotId) {
          setRobots(prev => prev.map(r => 
            r.id === task.robotId ? { 
              ...r, 
              status: 'idle', 
              currentTask: null 
            } : r
          ));
        }
        
        message.success(`任务「${task.name}」已取消`);
        
        // 触发新任务生成
        setShouldGenerateTask(true);
        
        // 3秒后从列表中移除已取消的任务
        setTimeout(() => {
          setTasks(prev => prev.filter(t => t.id !== task.id));
        }, 3000);
      }
    });
  };

  const handleTaskPause = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 更新任务状态为已暂停
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'paused' } : t
    ));
    
    // 更新机器人状态为移动停止，并添加到暂停集合中
    if (task.robotId) {
      setRobots(prev => prev.map(r => 
        r.id === task.robotId ? { 
          ...r, 
          status: 'move_stopped'
        } : r
      ));
      
      // 同时更新robotsState状态，确保画布显示正确
      setRobotsState(prev => prev.map(r => 
        r.id === task.robotId ? { 
          ...r, 
          status: 'move_stopped'
        } : r
      ));
      
      // 将机器人添加到暂停集合中，确保双重保护
      setPausedRobots(prev => new Set([...prev, task.robotId!]));
    }
    
    message.info(`任务「${task.name}」已暂停`);
  };

  const handleTaskResume = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 更新任务状态为执行中
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'executing' } : t
    ));
    
    // 更新机器人状态为运行中，并从暂停集合中移除
    if (task.robotId) {
      setRobots(prev => prev.map(r => 
        r.id === task.robotId ? { 
          ...r, 
          status: 'running'
        } : r
      ));
      
      // 同时更新robotsState状态，确保画布显示正确
      setRobotsState(prev => prev.map(r => 
        r.id === task.robotId ? { 
          ...r, 
          status: 'running'
        } : r
      ));
      
      // 从暂停集合中移除机器人
      setPausedRobots(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.robotId!);
        return newSet;
      });
    }
    
    message.success(`任务「${task.name}」已恢复执行`);
  };

  const handleTaskContinue = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 更新任务状态为执行中
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'executing' } : t
    ));
    
    // 更新机器人状态为运行中，并从暂停集合中移除
    if (task.robotId) {
      setRobots(prev => prev.map(r => 
        r.id === task.robotId ? { 
          ...r, 
          status: 'running' // 从异常状态恢复为运行状态
        } : r
      ));
      
      // 同时更新robotsState状态，确保画布显示正确
      setRobotsState(prev => prev.map(r => 
        r.id === task.robotId ? { 
          ...r, 
          status: 'running' // 从异常状态恢复为运行状态
        } : r
      ));
      
      // 从暂停集合中移除机器人（如果存在）
      setPausedRobots(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.robotId!);
        return newSet;
      });
    }
    
    message.success(`任务「${task.name}」已继续执行`);
  };

  const handleTaskDiagnose = (taskId: string) => {
    
    // 这里可以添加实际的诊断任务逻辑，比如打开诊断弹窗
  };

  // 删除任务处理函数
  const handleTaskDelete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    Modal.confirm({
      title: '确认删除任务',
      content: `确定要删除任务「${task.name}」吗？删除后任务将无法恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        // 如果任务有分配的机器人，将机器人状态设为空闲
        if (task.robotId) {
          setRobots(prev => prev.map(r => 
            r.id === task.robotId ? { 
              ...r, 
              status: 'idle', 
              currentTask: null 
            } : r
          ));
          
          // 同时更新robotsState状态
          setRobotsState(prev => prev.map(r => 
            r.id === task.robotId ? { 
              ...r, 
              status: 'idle', 
              currentTask: null 
            } : r
          ));
          
          // 从暂停集合中移除机器人（如果存在）
          setPausedRobots(prev => {
            const newSet = new Set(prev);
            newSet.delete(task.robotId!);
            return newSet;
          });
        }
        
        // 从任务列表中删除任务
        setTasks(prev => prev.filter(t => t.id !== taskId));
        
        message.success(`任务「${task.name}」已删除`);
        
        // 触发新任务生成
         setShouldGenerateTask(true);
       }
     });
   };

  // 获取任务操作按钮
  const getTaskActions = (task: Task) => {
    const actions = [];
    
    if (task.status === 'pending') {
      actions.push(
        <Button
          key="cancel"
          type="text"
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => handleTaskCancel(task.id)}
          style={{ color: '#ff4d4f' }}
        >
          取消
        </Button>
      );
    }
    
    if (task.status === 'executing') {
      actions.push(
        <Button
          key="pause"
          type="text"
          size="small"
          icon={<PauseCircleOutlined />}
          onClick={() => handleTaskPause(task.id)}
          style={{ color: '#faad14' }}
        >
          暂停
        </Button>
      );
    }
    
    if (task.status === 'paused') {
      actions.push(
        <Button
          key="resume"
          type="text"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleTaskResume(task.id)}
          style={{ color: '#52c41a' }}
        >
          恢复
        </Button>
      );
      actions.push(
        <Button
          key="delete"
          type="text"
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => handleTaskDelete(task.id)}
          style={{ color: '#ff4d4f' }}
        >
          取消
        </Button>
      );
    }
    
    if (task.status === 'error') {
      actions.push(
        <Button
          key="continue"
          type="text"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleTaskContinue(task.id)}
          style={{ color: '#52c41a' }}
        >
          继续
        </Button>
      );
      actions.push(
        <Button
          key="diagnose"
          type="text"
          size="small"
          icon={<ToolOutlined />}
          onClick={() => handleTaskDiagnose(task.id)}
          style={{ color: '#1890ff' }}
        >
          诊断
        </Button>
      );
      actions.push(
        <Button
          key="delete"
          type="text"
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => handleTaskDelete(task.id)}
          style={{ color: '#ff4d4f' }}
        >
          取消
        </Button>
      );
    }
    
    return actions;
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // 获取在线状态文本
  const getOnlineStatusText = (isOnline: boolean) => {
    return isOnline ? '在线' : '离线';
  };

  // 获取在线状态颜色
  const getOnlineStatusColor = (isOnline: boolean) => {
    return isOnline ? 'success' : 'error';
  };

  // 自动分配任务给空闲机器人
  const autoAssignTasks = () => {
    const pendingTasks = tasks.filter(task => task.status === 'pending' && !task.robotId);
    const idleRobots = robots.filter(robot => robot.status === 'idle' && !robot.currentTask);
    
    if (pendingTasks.length === 0 || idleRobots.length === 0) return;
    
    // 按优先级排序任务
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
    
    // 分配任务
    const updatedTasks = [...tasks];
    const updatedRobots = [...robots];
    
    for (let i = 0; i < Math.min(sortedTasks.length, idleRobots.length); i++) {
      const task = sortedTasks[i];
      const robot = idleRobots[i];
      
      // 更新任务状态
      const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          robotId: robot.id,
          status: 'executing'
        };
      }
      
      // 更新机器人状态
      const robotIndex = updatedRobots.findIndex(r => r.id === robot.id);
      if (robotIndex !== -1) {
        updatedRobots[robotIndex] = {
          ...updatedRobots[robotIndex],
          status: 'executing',
          currentTask: task.name
        };
      }
    }
    
    setTasks(updatedTasks);
    setRobots(updatedRobots);
  };

  // 模拟任务完成
  const simulateTaskCompletion = () => {
    const executingTasks = tasks.filter(task => task.status === 'executing');
    
    executingTasks.forEach(task => {
      // 模拟任务进度增加
      if (task.progress < 100) {
        const newProgress = Math.min(task.progress + Math.random() * 5, 100);
        
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, progress: newProgress } : t
        ));
        
        // 模拟机器人异常（5%概率）
        if (Math.random() < 0.05 && task.robotId) {
          // 更新任务状态为异常
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, status: 'error' } : t
          ));
          
          // 更新机器人状态为异常
          setRobots(prev => prev.map(r => 
            r.id === task.robotId ? { 
              ...r, 
              status: 'error'
            } : r
          ));
          
          message.error(`机器人「${robots.find(r => r.id === task.robotId)?.name}」发生异常，任务「${task.name}」已暂停`);
          return;
        }
        
        // 如果任务完成（进度达到100%）
        if (newProgress >= 100) {
          setTimeout(() => {
            // 更新任务状态为已完成
            setTasks(prev => prev.map(t => 
              t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
            ));
            
            // 更新机器人状态为空闲
            if (task.robotId) {
              setRobots(prev => prev.map(r => 
                r.id === task.robotId ? { 
                  ...r, 
                  status: 'idle', 
                  currentTask: null 
                } : r
              ));
            }
            
            message.success(`任务「${task.name}」已完成！`);
            
            // 触发新任务生成
            setShouldGenerateTask(true);
            
            // 3秒后从列表中移除已完成的任务
            setTimeout(() => {
              setTasks(prev => prev.filter(t => t.id !== task.id));
            }, 3000);
          }, 500);
        }
      }
    });
  };
  
  // 过滤显示的任务（排除已完成和已取消的任务）
  const getVisibleTasks = () => {
    return tasks.filter(task => 
      task.status !== 'completed' && task.status !== 'cancelled'
    );
  };
  
  // 过滤机器人列表（根据搜索文本）
  const getFilteredRobots = () => {
    if (!robotSearchText.trim()) {
      return robots;
    }
    return robots.filter(robot => 
      robot.name.toLowerCase().includes(robotSearchText.toLowerCase())
    );
  };
  
  // 过滤任务列表（根据搜索文本）
  const getFilteredTasks = () => {
    const visibleTasks = getVisibleTasks();
    if (!taskSearchText.trim()) {
      return visibleTasks;
    }
    return visibleTasks.filter(task => 
      task.name.toLowerCase().includes(taskSearchText.toLowerCase())
    );
  };
  
  // 生成新的待执行任务
  const generateNewTasks = () => {
    // 只生成1个新任务
    const taskId = `TASK${String(Date.now()).slice(-3)}`;
    const devices = ['CNC-005', 'CNC-006', 'CNC-007', 'CNC-008', 'CNC-009'];
    const priorities = ['high', 'medium', 'low'];
    
    const newTask: Task = {
      id: taskId,
      name: `运输任务-${taskId.slice(-3)}`,
      robotId: null,
      status: 'pending',
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      startPoint: '',
      endPoint: '',
      targetDevice: devices[Math.floor(Math.random() * devices.length)],
      progress: 0
    };
    
    setTasks(prev => [...prev, newTask]);
  };
  
  // 定时器：自动分配任务和生成新任务
  useEffect(() => {
    const interval = setInterval(() => {
      autoAssignTasks();
      simulateTaskCompletion();
      
      // 检查是否需要生成新任务
      if (shouldGenerateTask) {
        generateNewTasks();
        setShouldGenerateTask(false); // 重置标志
      }
    }, 3000); // 每3秒检查一次
    
    return () => clearInterval(interval);
  }, [tasks, robots]);



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
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
          <Select
            value={selectedMap}
            onChange={setSelectedMap}
            style={{ width: 120 }}
            size="small"
            placeholder="选择地图"
          >
            {mockMaps.map(map => (
              <Option key={map.id} value={map.id}>
                {map.name}
              </Option>
            ))}
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            size="small"
            type="text"
          >
            刷新
          </Button>
          <Button 
            icon={<HomeOutlined />} 
            size="small"
            type="text"
            onClick={resetView}
          >
            重置视图
          </Button>
          <Button 
            icon={allPanelsVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            size="small"
            type="text"
            onClick={toggleAllPanels}
          >
            {allPanelsVisible ? '隐藏面板' : '显示面板'}
          </Button>
        </Space>
      </div>

      {/* 左侧机器人列表面板 */}
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
                <RobotOutlined style={{ color: '#1890ff' }} />
                <Text style={{ fontWeight: 'bold', color: '#1890ff' }}>机器人列表</Text>
              </Space>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleLeftPanel}
              />
            </div>
            <Input.Search
               placeholder="搜索机器人名称..."
               value={robotSearchText}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotSearchText(e.target.value)}
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
              dataSource={getFilteredRobots()}
              renderItem={(robot: Robot) => (
                <List.Item
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedRobot === robot.id ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                    border: selectedRobot === robot.id ? '1px solid #1890ff' : 'none',
                    borderTop: selectedRobot === robot.id ? '1px solid #1890ff' : 'none',
                    borderLeft: selectedRobot === robot.id ? '1px solid #1890ff' : 'none',
                    borderRight: selectedRobot === robot.id ? '1px solid #1890ff' : 'none',
                    borderBottom: selectedRobot === robot.id ? '1px solid #1890ff' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    opacity: robot.mapId === selectedMap ? 1 : 0.7, // 不在当前地图的机器人显示为半透明
                  }}
                  onClick={() => handleRobotClick(robot)}
                >
                  <div style={{ width: '100%' }}>
                    {/* 机器人名称和图标行 - 水平对齐 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      gap: '8px'
                    }}>
                      <Text strong style={{ fontSize: '14px', flex: 1 }}>{robot.name}</Text>
                      <Avatar
                        icon={getRobotTypeIcon(robot.type)}
                        size={20}
                        style={{
                          backgroundColor: getStatusAvatarColor(robot.status),
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    
                    {/* 地图信息 */}
                    <div style={{ marginBottom: '4px' }}>
                      <Text style={{ fontSize: '12px', color: '#000000' }}>
                        {getMapName(robot.mapId)}
                      </Text>
                    </div>
                    
                    {/* 状态和在线状态行 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '4px',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {robot.status === 'move_stopped' ? (
                        <Tag 
                          size="small"
                          style={{
                            backgroundColor: '#ffa39e',
                            color: '#ffffff',
                            border: '1px solid #ff7875'
                          }}
                        >
                          {getStatusText(robot.status)}
                        </Tag>
                      ) : (
                        <Tag color={getStatusColor(robot.status)} size="small">
                          {getStatusText(robot.status)}
                        </Tag>
                      )}
                      <Tag color={getOnlineStatusColor(robot.isOnline)} size="small">
                        {getOnlineStatusText(robot.isOnline)}
                      </Tag>
                    </div>
                    
                    {/* 电量信息独占一行，左对齐 */}
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>电量: {robot.battery}%</Text>
                    </div>
                    
                    {/* 当前任务 */}
                    {robot.currentTask && (
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        任务: {robot.currentTask}
                      </Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      )}

      {/* 右侧运单任务面板 */}
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
                <ScheduleOutlined style={{ color: '#1890ff' }} />
                <Text style={{ fontWeight: 'bold', color: '#1890ff' }}>运单任务</Text>
              </Space>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleRightPanel}
              />
            </div>
            <Input.Search
              placeholder="搜索任务名称..."
              value={taskSearchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskSearchText(e.target.value)}
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
              dataSource={getFilteredTasks()}
              renderItem={(task: Task) => (
                <List.Item 
                  style={{ 
                    padding: '12px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    marginBottom: '8px'
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{task.name}</Text>
                        <Tag color={getPriorityColor(task.priority)}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <Tag color={getTaskStatusColor(task.status)}>
                            {getTaskStatusText(task.status)}
                          </Tag>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {task.targetDevice && (
                            <div style={{ marginBottom: '2px' }}>目标设备: {task.targetDevice}</div>
                          )}
                          {task.robotId && (
                            <div style={{ marginBottom: '2px' }}>执行机器人: {robots.find(r => r.id === task.robotId)?.name}</div>
                          )}
                          {task.status === 'executing' && (
                            <div style={{ marginBottom: '6px' }}>进度: {Math.round(task.progress)}%</div>
                          )}
                          {getTaskActions(task).length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <Space size={4}>
                                {getTaskActions(task)}
                              </Space>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      )}

      {/* 左侧面板切换按钮（当面板隐藏时显示） */}
      {!leftPanelVisible && (
        <Button
          icon={<RobotOutlined />}
          style={{
            position: 'absolute',
            top: '20px',
            left: '10px',
            zIndex: 5,
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={toggleLeftPanel}
        />
      )}

      {/* 右侧面板切换按钮（当面板隐藏时显示） */}
      {!rightPanelVisible && (
        <Button
          icon={<ScheduleOutlined />}
          style={{
            position: 'absolute',
            top: '20px',
            right: '10px',
            zIndex: 5,
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={toggleRightPanel}
        />
      )}
      
      {/* 属性面板 */}
      <PropertyPanel
        visible={propertyPanelVisible}
        onClose={handlePropertyPanelClose}
        elementType={propertyElementType}
        elementData={propertyElementData}
        onSave={handlePropertySave}
      />
    </div>
  );
};

export default FieldControlView;