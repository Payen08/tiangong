import React, { useState, useRef, useEffect } from 'react';
import { List, Avatar, Tag, Button, Select, Space, Typography } from 'antd';
import {
  RobotOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ScheduleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import PropertyPanel from './PropertyPanel';

const { Title, Text } = Typography;
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
}

// 任务类型定义
interface Task {
  id: string;
  name: string;
  robotId: string | null;
  status: string;
  priority: string;
  startPoint: string;
  endPoint: string;
  progress: number;
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
    status: 'running',
    battery: 85,
    position: { x: 50, y: 100 }, // 初始化到P1点位
    currentTask: '运输任务-001',
    mapId: 'map1',
  },
  {
    id: 'MCR001',
    name: 'MCR-001',
    type: 'MCR',
    status: 'running', // 改为运行状态
    battery: 92,
    position: { x: 550, y: 150 }, // 初始化到P6点位
    currentTask: '巡检任务-001',
    mapId: 'map1',
  },
  {
    id: 'AMR001',
    name: 'AMR-001',
    type: 'AMR',
    status: 'charging',
    battery: 45,
    position: { x: 450, y: 300 },
    currentTask: null,
    mapId: 'map2',
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
    startPoint: 'A点',
    endPoint: 'B点',
    progress: 65,
  },
  {
    id: 'TASK002',
    name: '运输任务-002',
    robotId: null,
    status: 'pending',
    priority: 'medium',
    startPoint: 'C点',
    endPoint: 'D点',
    progress: 0,
  },
  {
    id: 'TASK003',
    name: '运输任务-003',
    robotId: null,
    status: 'pending',
    priority: 'low',
    startPoint: 'E点',
    endPoint: 'F点',
    progress: 0,
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
  
  // 动画定时器引用
  const animationFrameRef = useRef<number | null>(null);
  
  // 机器人路径状态
  const [robotsState, setRobotsState] = useState<Robot[]>([]);
  
  // 路径资源占用状态
  const [occupiedPaths, setOccupiedPaths] = useState<string[]>([]);
  
  // 路径点序列 - 定义机器人运动轨迹
  const pathSequence = [
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
  
  // 选中状态管理
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
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
    };
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

  // 示例数据定义
  const pathNodes: MapPoint[] = [
    { id: 'p1', name: 'P1', x: 50, y: 100, type: '站点', direction: 0 },
    { id: 'p2', name: 'P2', x: 200, y: 100, type: '节点' },
    { id: 'p3', name: 'P3', x: 200, y: 250, type: '停靠点', direction: 90 },
    { id: 'p4', name: 'P4', x: 400, y: 250, type: '充电点', direction: 180 },
    { id: 'p5', name: 'P5', x: 400, y: 150, type: '临停点', direction: -90 },
    { id: 'p6', name: 'P6', x: 550, y: 150, type: '归位点', direction: 0 },
    { id: 'p7', name: 'P7', x: 550, y: 300, type: '站点', direction: 90 },
    { id: 'p8', name: 'P8', x: 300, y: 350, type: '充电点', direction: 180 },
    { id: 'p9', name: 'P9', x: 100, y: 300, type: '停靠点', direction: -90 },
    { id: 'p10', name: 'P10', x: 50, y: 200, type: '节点' },
  ];
  
  const pathLines: MapLine[] = [
    { id: 'l1', name: 'L1', startPointId: 'p1', endPointId: 'p2', type: 'double-line', color: '#1890ff' },
    { id: 'l2', name: 'L2', startPointId: 'p2', endPointId: 'p3', type: 'double-line', color: '#1890ff' },
    { id: 'l3', name: 'L3', startPointId: 'p3', endPointId: 'p4', type: 'double-line', color: '#1890ff' },
    { id: 'l4', name: 'L4', startPointId: 'p4', endPointId: 'p5', type: 'double-line', color: '#1890ff' },
    { id: 'l5', name: 'L5', startPointId: 'p5', endPointId: 'p6', type: 'double-line', color: '#1890ff' },
    { id: 'l6', name: 'L6', startPointId: 'p6', endPointId: 'p7', type: 'double-line', color: '#1890ff' },
    { id: 'l7', name: 'L7', startPointId: 'p7', endPointId: 'p8', type: 'double-line', color: '#1890ff' },
    { id: 'l8', name: 'L8', startPointId: 'p8', endPointId: 'p9', type: 'double-line', color: '#1890ff' },
    { id: 'l9', name: 'L9', startPointId: 'p9', endPointId: 'p10', type: 'double-line', color: '#1890ff' },
    { id: 'l10', name: 'L10', startPointId: 'p10', endPointId: 'p1', type: 'double-line', color: '#1890ff' },
  ];
  
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
  const isPointSelected = (pointId: string) => selectedPoints.includes(pointId);
  const isLineSelected = (lineId: string) => selectedLines.includes(lineId);
  const isAreaSelected = (areaId: string) => selectedAreas.includes(areaId);
  
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

  // 获取当前地图的机器人
  const currentMapRobots = mockRobots.filter(robot => robot.mapId === selectedMap);

  // 居中显示选中的机器人
  const centerOnRobot = (robotId: string) => {
    const robot = currentMapRobots.find(r => r.id === robotId);
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
        
        console.log('Canvas rect:', rect);
        
        if (rect.width === 0 || rect.height === 0) {
          console.log('Canvas has zero size, skipping update');
          return;
        }
        
        // 设置Canvas的实际尺寸
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        // 设置Canvas的显示尺寸
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        console.log('Canvas size updated:', {
          width: canvas.width,
          height: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height
        });
        
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
           console.log('Immediate redraw after canvas ready');
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
        console.log('Force setting canvas ready');
        setCanvasReady(true);
        // 强制触发一次重绘
        setTimeout(() => {
          console.log('Force redraw trigger');
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
      console.log('Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context is null');
      return;
    }

    // 获取显示尺寸用于绘制计算
    const displayWidth = canvas.offsetWidth;
    const displayHeight = canvas.offsetHeight;
    
    // 如果Canvas尺寸为0或未准备好，不进行绘制
    if (displayWidth === 0 || displayHeight === 0 || !canvasReady) {
      console.log('Canvas not ready for drawing:', { displayWidth, displayHeight, canvasReady });
      return;
    }
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    console.log('Canvas drawing:', {
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
      
      // 根据占用状态设置线条颜色
      const lineColor = isPathOccupied ? '#ff4d4f' : line.color; // 占用的路径显示为红色
      const lineWidth = 3 / scale; // 统一使用3px宽度
      
      // 设置线条样式
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      
      // 绘制线条
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
    });

    // 绘制路径节点（使用新的点类型系统）
    
    pathNodes.forEach(point => {
      const pointColor = getPointColor(point.type);
      // 移除选中效果
      const pointSize = 8 / scale; // 统一大小
      
      // 绘制点的外圈
      ctx.strokeStyle = pointColor;
      ctx.lineWidth = 2 / scale; // 固定2px描边
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
      ctx.stroke();
      
      // 绘制点的内部填充（节点类型为透明，其他类型为对应颜色）
      if (point.type !== '节点') {
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize - 2 / scale, 0, 2 * Math.PI); // 减去描边宽度
        ctx.fill();
      }
      
      // 绘制方向指示器（节点类型除外）
      if (point.type !== '节点' && point.direction !== undefined) {
        const arrowSize = 6 / scale;
        const arrowDistance = pointSize + 3 / scale;
        const angle = (point.direction * Math.PI) / 180;
        
        // 计算箭头位置
        const arrowX = point.x + arrowDistance * Math.cos(angle);
        const arrowY = point.y + arrowDistance * Math.sin(angle);
        
        // 绘制箭头
        ctx.fillStyle = pointColor;
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
        ctx.lineTo(-arrowSize / 2, arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      
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
      let statusText = '空闲';
      if (robot.status === 'running') {
        robotColor = '#1890ff'; // 蓝色（运行中）
        statusText = '运行';
      }
      if (robot.status === 'charging') {
        robotColor = '#faad14'; // 橙色（充电中）
        statusText = '充电';
      }
      if (robot.status === 'error') {
        robotColor = '#ff4d4f'; // 红色（故障）
        statusText = '故障';
      }
      
      // 绘制机器人主体（透明圆角矩形，只有边框）
      ctx.strokeStyle = robotColor;
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.roundRect(x - robotWidth/2, y - robotHeight/2, robotWidth, robotHeight, cornerRadius);
      ctx.stroke();
      
      // 不再绘制内部白色背景，保持透明
      
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
  }, [selectedMap, currentMapRobots, selectedRobot, scale, offsetX, offsetY, leftPanelVisible, rightPanelVisible, canvasReady, redrawTrigger, occupiedPaths]);
  
  // 初始化机器人路径状态
  useEffect(() => {
    // 只初始化当前地图的机器人
    const mapRobots = mockRobots.filter(robot => robot.mapId === selectedMap);
    
    // 为每个机器人设置初始路径状态
    const initializedRobots = mapRobots.map(robot => {
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
        startIndex = 5; // MCR从P6开始
      }
      
      // 设置初始路径状态
      return {
        ...robot,
        pathIndex: startIndex,
        targetPointId: pathSequence[(startIndex + 1) % pathSequence.length].pointId,
        progress: 0,
        speed: robot.id === 'AGV001' ? 0.005 : 0.003, // AGV速度快一些，MCR慢一些
        status: 'running' // 确保状态为运行中
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
  
  // 释放路径资源 - 释放已走完的路径
  const releasePathResource = (robotId: string, pathId: string) => {
    setRobotsState(prevState => {
      return prevState.map(robot => {
        if (robot.id !== robotId) return robot;
        
        // 移除已走完的路径资源
        const updatedResources = robot.pathResources ? 
          robot.pathResources.filter(id => id !== pathId) : 
          [];
        
        return {
          ...robot,
          pathResources: updatedResources
        };
      });
    });
    
    // 更新全局占用状态
    setOccupiedPaths(prev => prev.filter(id => id !== pathId));
  };
  
  // 更新机器人位置 - 沿路线移动
  const updateRobotPositions = () => {
    setRobotsState(prevState => {
      return prevState.map(robot => {
        // 只更新运行状态的机器人
        if (robot.status !== 'running') return robot;
        
        // 获取当前路径点和目标路径点
        const currentPointId = pathSequence[robot.pathIndex || 0].pointId;
        const currentPoint = pathNodes.find(p => p.id === currentPointId);
        const targetPoint = pathNodes.find(p => p.id === robot.targetPointId);
        
        if (!currentPoint || !targetPoint) return robot;
        
        // 当前路径ID
        const currentPathId = pathSequence[robot.pathIndex || 0].nextLineId;
        
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
          
          // 更新全局占用状态
          setOccupiedPaths(prev => [...prev, ...resources]);
          
          // 更新机器人占用的路径资源
          return {
            ...robot,
            pathResources: resources,
            status: 'running' // 确保状态为运行中
          };
        }
        
        // 更新进度
        let newProgress = (robot.progress || 0) + (robot.speed || 0.005);
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
            
            // 更新全局占用状态
            setOccupiedPaths(prev => {
              const updated = prev.filter(id => id !== pathToRelease);
              updated.push(nextPathId);
              return updated;
            });
            
            // 更新路径索引和目标点
            newProgress = 0;
            newPathIndex = (newPathIndex + 1) % pathSequence.length;
            newTargetPointId = pathSequence[(newPathIndex + 1) % pathSequence.length].pointId;
          } else {
            // 如果下一条路径被占用，机器人停在当前位置等待
            newProgress = 1; // 保持在路径终点
            // 状态保持不变
          }
        }
        
        // 计算新位置 - 线性插值
        const newX = currentPoint.x + (targetPoint.x - currentPoint.x) * newProgress;
        const newY = currentPoint.y + (targetPoint.y - currentPoint.y) * newProgress;
        
        // 计算移动方向角度
        const direction = Math.atan2(targetPoint.y - currentPoint.y, targetPoint.x - currentPoint.x) * 180 / Math.PI;
        
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
  };

  // 动画循环 - 实现机器人移动和闪烁效果
  useEffect(() => {
    const hasRunningRobots = currentMapRobots.some(robot => robot.status === 'running');
    
    if (hasRunningRobots && canvasReady) {
      const animate = () => {
        // 更新机器人位置
        updateRobotPositions();
        
        // 触发重绘
        setRedrawTrigger(prev => prev + 1);
        
        // 继续动画循环
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // 启动动画循环
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [currentMapRobots, canvasReady]);
  
  // 组件卸载时清理动画
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
    const clickedRobot = currentMapRobots.find(robot => {
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
        setSelectedPoints(prev => 
          prev.includes(clickedPoint.id) 
            ? prev.filter(id => id !== clickedPoint.id)
            : [...prev, clickedPoint.id]
        );
      } else {
        // 单选模式
        setSelectedPoints(prev => 
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
        setSelectedPoints([]);
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
        setSelectedPoints([]);
        setSelectedLines([]);
      }
      setSelectedRobot(null);
      return;
    }
    
    // 点击空白区域，清除所有选中状态
    setSelectedRobot(null);
    setSelectedPoints([]);
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
  
  // 处理属性保存
  const handlePropertySave = (data: any) => {
    // 根据元素类型更新对应的数据
    // 注意：这里应该调用实际的API来保存数据
    console.log('保存属性数据:', data);
  };
  
  // 关闭属性面板
   const handlePropertyPanelClose = () => {
     setPropertyPanelVisible(false);
     setPropertyElementType(null);
     setPropertyElementData(null);
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
      case 'running': return 'processing';
      case 'idle': return 'default';
      case 'charging': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'idle': return '空闲';
      case 'charging': return '充电中';
      case 'error': return '故障';
      default: return '未知';
    }
  };

  // 获取任务状态颜色
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'processing';
      case 'pending': return 'default';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // 获取任务状态文本
  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'executing': return '执行中';
      case 'pending': return '待执行';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return '未知';
    }
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(24, 144, 255, 0.1)'
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
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 65px)',
            overflow: 'auto'
          }}>
            <List
              dataSource={currentMapRobots}
              renderItem={(robot: Robot) => (
                <List.Item
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: selectedRobot === robot.id ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                    border: selectedRobot === robot.id ? '1px solid #1890ff' : '1px solid transparent',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                  onClick={() => {
                    setSelectedRobot(robot.id);
                    centerOnRobot(robot.id);
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<RobotOutlined />}
                        style={{
                          backgroundColor:
                            robot.status === 'running' ? '#1890ff' :
                            robot.status === 'charging' ? '#faad14' :
                            robot.status === 'error' ? '#ff4d4f' : '#52c41a'
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{robot.name}</Text>
                        <Tag color="blue">{robot.type}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '4px' }}>
                          <Tag color={getStatusColor(robot.status)}>
                            {getStatusText(robot.status)}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: '12px' }}>电量: {robot.battery}%</Text>
                        </div>
                        {robot.currentTask && (
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            任务: {robot.currentTask}
                          </Text>
                        )}
                      </div>
                    }
                  />
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(24, 144, 255, 0.1)'
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
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 65px)',
            overflow: 'auto'
          }}>
            <List
              dataSource={mockTasks}
              renderItem={(task: Task) => (
                <List.Item style={{ 
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
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
                          <div style={{ marginBottom: '2px' }}>{task.startPoint} → {task.endPoint}</div>
                          {task.robotId && (
                            <div style={{ marginBottom: '2px' }}>执行机器人: {mockRobots.find(r => r.id === task.robotId)?.name}</div>
                          )}
                          {task.status === 'executing' && (
                            <div>进度: {task.progress}%</div>
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