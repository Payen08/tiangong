import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Divider,
  Radio,
  Input,
  message,
  Tooltip,
  Switch,
  Tabs,
  Collapse,
  Badge,
  Modal,
  List,
  Typography,
  Row,
  Col,
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
  GroupOutlined,
  EyeOutlined,
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
  GlobalOutlined,
  DeleteOutlined,
  EditOutlined,
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

// 组件属性接口
interface DeviceMapEditorProps {
  deviceId: string;
  deviceName: string;
  currentPosition?: { x: number; y: number };
  mapName?: string;
}

const DeviceMapEditor: React.FC<DeviceMapEditorProps> = ({
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
  
  // 当前模式状态
  const [currentMode, setCurrentMode] = useState<'edit' | 'view'>('edit');
  
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [mapLines, setMapLines] = useState<MapLine[]>([]);
  const [mapAreas, setMapAreas] = useState<MapArea[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  // 画布拖动和缩放相关状态
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCanvasClicked, setIsCanvasClicked] = useState(false);
  const [dragTool, setDragTool] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  // 鼠标位置状态
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  
  // 显示控制状态
  const [hideAllPoints, setHideAllPoints] = useState(false);
  const [hideAllPaths, setHideAllPaths] = useState(false);
  const [hideAllPointNames, setHideAllPointNames] = useState(false);
  const [hideAllPathNames, setHideAllPathNames] = useState(false);
  const [hideVehicleModels, setHideVehicleModels] = useState(true);
  
  // 地图元素显示控制状态
  const [showGrid, setShowGrid] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showDockPoints, setShowDockPoints] = useState(true);
  const [showChargePoints, setShowChargePoints] = useState(true);
  const [showTempPoints, setShowTempPoints] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [showAreas, setShowAreas] = useState(true);
  const [showDevices, setShowDevices] = useState(true);
  
  // 元素隐藏控制状态
  const [hideStationNames, setHideStationNames] = useState(false);
  const [hideDockNames, setHideDockNames] = useState(false);
  const [hideChargeNames, setHideChargeNames] = useState(false);
  const [hideTempNames, setHideTempNames] = useState(false);
  const [hidePathNames, setHidePathNames] = useState(false);
  const [hideAreaNames, setHideAreaNames] = useState(false);
  const [hideDeviceNames, setHideDeviceNames] = useState(false);
  
  // 搜索相关状态
  const [searchType, setSearchType] = useState<'line' | 'point'>('point');
  const [searchValue, setSearchValue] = useState('');

  // 地图管理弹窗状态
  const [mapManagementVisible, setMapManagementVisible] = useState(false);
  const [selectedMapList, setSelectedMapList] = useState<string | null>(null);

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
  
  // 地图元素展开状态管理
  const [mapElementActiveKey, setMapElementActiveKey] = useState<string | string[]>([]);
  
  // 画布引用
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 计数器
  const [pointCounter, setPointCounter] = useState(1);
  const [lineCounter, setLineCounter] = useState(1);
  const [areaCounter, setAreaCounter] = useState(1);

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

    setMapPoints(mockPoints);
    setMapLines(mockLines);
    setPointCounter(mockPoints.length + 1);
    setLineCounter(mockLines.length + 1);
  }, []);

  // 快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 只在没有输入框聚焦时处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
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

    setIsCanvasClicked(true);
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

  // 画布点击处理
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragTool || isSpacePressed) return;

    const canvasElement = event.currentTarget;
    const { x, y } = screenToCanvasCoordinates(event.clientX, event.clientY, canvasElement);

    setIsCanvasClicked(true);

    // 在黑白底图模式下，除了选择工具外，其他工具都被禁用
    if (mapType === 'blackwhite' && selectedTool !== 'select') {
      message.warning('黑白底图模式下，绘图工具被禁用');
      return;
    }

    switch (selectedTool) {
      case 'station':
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
        break;

      case 'dock':
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
        break;

      case 'charge':
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
        break;

      case 'temp':
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
        break;

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

  // 获取画布光标样式
  const getCanvasCursor = () => {
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

      return (
        <div
          key={point.id}
          style={{
            position: 'absolute',
            left: point.x - pointSize / 2,
            top: point.y - pointSize / 2,
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

      return (
        <g key={line.id}>
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
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
              x={(startPoint.x + endPoint.x) / 2}
              y={(startPoint.y + endPoint.y) / 2}
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
    if (!currentPosition) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: currentPosition.x - 12,
          top: currentPosition.y - 12,
          width: 24,
          height: 24,
          backgroundColor: '#ff4d4f',
          border: '3px solid #fff',
          borderRadius: '50%',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4)',
          animation: 'pulse 2s infinite'
        }}
      >
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          `}
        </style>
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: '#ff4d4f',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            fontWeight: 'bold'
          }}
        >
          {deviceName}
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
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 地图基本信息 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>地图名称</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  color: '#666'
                }}>
                  {mapName}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>设备名称</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  color: '#666'
                }}>
                  {deviceName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>地图尺寸</div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  color: '#666'
                }}>
                  100 × 100
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#f0f9ff',
                borderRadius: '4px',
                border: '1px solid #bae7ff'
              }}>
                <span style={{ fontSize: '11px', color: '#666' }}>点数量</span>
                <span style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500 }}>{mapPoints.length}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#f6ffed',
                borderRadius: '4px',
                border: '1px solid #b7eb8f'
              }}>
                <span style={{ fontSize: '11px', color: '#666' }}>线数量</span>
                <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: 500 }}>{mapLines.length}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#fff7e6',
                borderRadius: '4px',
                border: '1px solid #ffd591'
              }}>
                <span style={{ fontSize: '11px', color: '#666' }}>区域数量</span>
                <span style={{ fontSize: '12px', color: '#fa8c16', fontWeight: 500 }}>{mapAreas.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 显示控制 */}
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          显示控制
        </div>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
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
        </Space>
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
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => setMapManagementVisible(true)}
          style={{ height: 36 }}
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
        height: 'calc(100vh - 32px)',
        background: '#fff',
        borderLeft: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 1000
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
          width: 'calc(100% - 276px)',
          height: '100%',
          cursor: getCanvasCursor(),
          userSelect: 'none'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasDrag}
        onMouseMove={handleCanvasMouseMove}
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
    </div>
  );
};

export default DeviceMapEditor;