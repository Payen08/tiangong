import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  message,
  Spin,
  Card,
  List,
  Input,
  Tooltip,
  Space,
  Avatar,
  Tag,
  Select,
} from 'antd';


import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  EyeOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  BuildOutlined,
  RobotOutlined,
  ScheduleOutlined,
  EyeInvisibleOutlined,
  CarOutlined,
  AndroidOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  HomeOutlined,
  VerticalAlignTopOutlined,
  BorderOutlined,
} from '@ant-design/icons';
import ThreeScene, { ThreeSceneRef } from '@/components/ThreeScene';
import FloorSelector from '@/components/FloorSelector';

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
  isOnline: boolean;
}

// 任务类型定义
interface Task {
  id: string;
  name: string;
  robotId: string | null;
  status: 'pending' | 'executing' | 'paused' | 'completed' | 'cancelled' | 'error';
  priority: string;
  startPoint: string;
  endPoint: string;
  progress: number;
  targetDevice?: string;
}



// 楼层数据接口
interface FloorData {
  id: string;
  name: string;
  level: number;
  mapId: string;
  mapName: string;
  thumbnail: string;
  status: 'active' | 'inactive';
  deviceCount: number;
  robotCount: number;
}

// 视图模式类型
type ViewMode = 'overview' | 'floor';

// 模拟机器人数据
const mockRobots: Robot[] = [
  {
    id: 'AGV001',
    name: 'AGV-001',
    type: 'AGV',
    status: 'running',
    battery: 85,
    position: { x: 80, y: 120 },
    currentTask: '运输任务-001',
    mapId: 'map1',
    isOnline: true,
  },
  {
    id: 'MCR001',
    name: 'MCR-001',
    type: 'MCR',
    status: 'running',
    battery: 92,
    position: { x: 720, y: 200 },
    currentTask: '运输任务-002',
    mapId: 'map1',
    isOnline: true,
  },
  {
    id: 'AMR001',
    name: 'AMR-001',
    type: 'AMR',
    status: 'running',
    battery: 45,
    position: { x: 50, y: 100 },
    currentTask: '巡检任务-001',
    mapId: 'map2',
    isOnline: true,
  },
  {
    id: 'AGV002',
    name: 'AGV-002',
    type: 'AGV',
    status: 'running',
    battery: 78,
    position: { x: 280, y: 260 },
    currentTask: '运输任务-003',
    mapId: 'map1',
    isOnline: true,
  },
  {
    id: 'MCR002',
    name: 'MCR-002',
    type: 'MCR',
    status: 'running',
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
    status: 'move_stopped',
    battery: 67,
    position: { x: 400, y: 400 },
    currentTask: '巡检任务-002',
    mapId: 'map3',
    isOnline: true,
  },
  {
    id: 'AGV003',
    name: 'AGV-003',
    type: 'AGV',
    status: 'error',
    battery: 15,
    position: { x: 150, y: 180 },
    currentTask: null,
    mapId: 'map1',
    isOnline: false,
  },
  {
    id: 'MCR003',
    name: 'MCR-003',
    type: 'MCR',
    status: 'idle',
    battery: 88,
    position: { x: 500, y: 350 },
    currentTask: null,
    mapId: 'map2',
    isOnline: false,
  },
];

// 模拟任务数据
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
  {
    id: 'TASK005',
    name: '运输任务-005',
    robotId: null,
    status: 'pending',
    priority: 'medium',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-005',
    progress: 0,
  },
  {
    id: 'TASK006',
    name: '巡检任务-003',
    robotId: null,
    status: 'pending',
    priority: 'low',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-006',
    progress: 0,
  },
  {
    id: 'TASK007',
    name: '运输任务-006',
    robotId: 'MCR001',
    status: 'completed',
    priority: 'high',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-007',
    progress: 100,
  },
  {
    id: 'TASK008',
    name: '运输任务-007',
    robotId: 'AGV002',
    status: 'completed',
    priority: 'medium',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-008',
    progress: 100,
  },
  {
    id: 'TASK009',
    name: '运输任务-008',
    robotId: null,
    status: 'cancelled',
    priority: 'low',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-009',
    progress: 0,
  },
  {
    id: 'TASK010',
    name: '运输任务-009',
    robotId: 'AMR001',
    status: 'executing',
    priority: 'high',
    startPoint: '',
    endPoint: '',
    targetDevice: 'CNC-010',
    progress: 80,
  },
];

// 模拟地图数据


const DigitalTwin: React.FC = () => {
  const [loading, setLoading] = useState(true); // 页面加载状态
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedFloor, setSelectedFloor] = useState<string | null>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // 机器人和任务相关状态
  const [robots] = useState<Robot[]>(mockRobots);
  const [tasks] = useState<Task[]>(mockTasks);

  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  
  // ThreeScene组件引用
  const threeSceneRef = React.useRef<ThreeSceneRef>(null);

  // 模拟楼层数据
  useEffect(() => {
    const mockFloors: FloorData[] = [
      {
        id: 'floor_1',
        name: '一楼大厅',
        level: 1,
        mapId: '1',
        mapName: '一楼平面图',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        deviceCount: 15,
        robotCount: 3,
      },
      {
        id: 'floor_2',
        name: '二楼办公区',
        level: 2,
        mapId: '2',
        mapName: '二楼平面图',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        deviceCount: 12,
        robotCount: 2,
      },
      {
        id: 'floor_3',
        name: '三楼生产区',
        level: 3,
        mapId: '3',
        mapName: '三楼平面图',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        deviceCount: 18,
        robotCount: 4,
      },
    ];
    
    setFloors(mockFloors);
    
    // 模拟加载延迟
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // 控制导航栏显示
      const header = document.querySelector('.ant-layout-header');
      if (header) {
        (header as HTMLElement).style.display = isCurrentlyFullscreen ? 'none' : 'flex';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 初始化3D场景到1楼视图
  useEffect(() => {
    if (!loading && threeSceneRef.current && selectedFloor === 'floor1') {
      // 延迟一点时间确保3D场景完全加载
      const timer = setTimeout(() => {
        threeSceneRef.current?.setFloorView(1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, selectedFloor]);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
      // 隐藏导航栏
      const header = document.querySelector('.ant-layout-header');
      if (header) {
        (header as HTMLElement).style.display = 'none';
      }
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
      // 显示导航栏
      const header = document.querySelector('.ant-layout-header');
      if (header) {
        (header as HTMLElement).style.display = 'flex';
      }
    }
  };

  // 切换到楼层视图
  const handleFloorChange = (floorId: string) => {
    setSelectedFloor(floorId);
    setViewMode('floor');
  };

  // 工具函数
  const getRobotTypeIcon = (type: string) => {
    switch (type) {
      case 'AGV': return <CarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />; // 蓝色
      case 'MCR': return <AndroidOutlined style={{ color: '#52c41a', fontSize: '16px' }} />; // 绿色
      case 'AMR': return <RobotOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />; // 橙色
      default: return <RobotOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />; // 灰色
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green';
      case 'idle': return 'blue';
      case 'charging': return 'orange';
      case 'error': return 'red';
      case 'offline': return 'gray';
      case 'move_stopped': return 'volcano';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'idle': return '空闲';
      case 'charging': return '充电中';
      case 'error': return '故障';
      case 'offline': return '离线';
      case 'move_stopped': return '移动停止';
      default: return '未知';
    }
  };

  const getStatusAvatarColor = (status: string) => {
    switch (status) {
      case 'running': return '#52c41a';
      case 'idle': return '#1890ff';
      case 'charging': return '#fa8c16';
      case 'error': return '#ff4d4f';
      case 'offline': return '#8c8c8c';
      case 'move_stopped': return '#fa541c';
      default: return '#d9d9d9';
    }
  };

  const getOnlineStatusColor = (isOnline: boolean) => {
    return isOnline ? 'green' : 'red';
  };

  const getOnlineStatusText = (isOnline: boolean) => {
    return isOnline ? '在线' : '离线';
  };



  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'blue';
      case 'pending': return 'orange';
      case 'paused': return 'volcano';
      case 'completed': return 'green';
      case 'cancelled': return 'gray';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'executing': return '执行中';
      case 'pending': return '待执行';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };



  const handleRobotClick = (robot: Robot) => {
    setSelectedRobot(robot.id);
    message.info(`选中机器人: ${robot.name}`);
  };

  const getTaskActions = (task: Task) => {
    const actions = [];
    
    if (task.status === 'pending') {
      actions.push(
        <Button 
          key="start" 
          size="small" 
          icon={<PlayCircleOutlined />}
          style={{
            backgroundColor: 'rgba(82, 196, 26, 0.15)',
            color: 'rgba(82, 196, 26, 0.9)',
            border: '1px solid rgba(82, 196, 26, 0.3)',
            borderRadius: '4px'
          }}
        >
          开始
        </Button>
      );
    }
    
    if (task.status === 'executing') {
      actions.push(
        <Button 
          key="pause" 
          size="small" 
          icon={<PauseCircleOutlined />}
          style={{
            backgroundColor: 'rgba(255, 193, 7, 0.15)',
            color: 'rgba(255, 193, 7, 0.9)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '4px'
          }}
        >
          暂停
        </Button>
      );
    }
    
    if (task.status === 'paused') {
      actions.push(
        <Button 
          key="resume" 
          size="small" 
          icon={<PlayCircleOutlined />}
          style={{
            backgroundColor: 'rgba(24, 144, 255, 0.15)',
            color: 'rgba(24, 144, 255, 0.9)',
            border: '1px solid rgba(24, 144, 255, 0.3)',
            borderRadius: '4px'
          }}
        >
          继续
        </Button>
      );
    }
    
    if (['pending', 'executing', 'paused'].includes(task.status)) {
       actions.push(
         <Button 
           key="cancel" 
           size="small" 
           icon={<StopOutlined />}
           style={{
             backgroundColor: 'rgba(255, 77, 79, 0.15)',
             color: 'rgba(255, 77, 79, 0.9)',
             border: '1px solid rgba(255, 77, 79, 0.3)',
             borderRadius: '4px'
           }}
         >
           取消
         </Button>
       );
     }
    
    return actions;
  };



  // 返回全场景视图（重置视图）
  const handleBackToOverview = () => {
    setViewMode('overview');
    // 重置视图时设置为全部楼层
    setSelectedFloor('all');
    if (threeSceneRef.current && threeSceneRef.current.setAllFloorsView) {
      threeSceneRef.current.setAllFloorsView();
    }
    message.success('已重置到初始3D视图视角');
  };

  // 刷新3D视图
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('3D视图已刷新');
    }, 1000);
  };

  // 新增面板控制函数
  const toggleLeftPanel = () => setLeftPanelVisible(!leftPanelVisible);
  const toggleRightPanel = () => setRightPanelVisible(!rightPanelVisible);
  const toggleAllPanels = () => {
    const newVisible = !(leftPanelVisible && rightPanelVisible);
    setLeftPanelVisible(newVisible);
    setRightPanelVisible(newVisible);
  };
  
  // 视图控制函数
  const handleResetView = () => {
    if (threeSceneRef.current && threeSceneRef.current.resetView) {
      threeSceneRef.current.resetView();
      message.success('已重置到初始3D视角');
    }
  };
  
  const handleTopView = () => {
    if (threeSceneRef.current && threeSceneRef.current.setTopView) {
      threeSceneRef.current.setTopView();
      message.success('已切换到顶视图');
    }
  };
  
  const handleFrontView = () => {
    if (threeSceneRef.current && threeSceneRef.current.setFrontView) {
      threeSceneRef.current.setFrontView();
      message.success('已切换到正视图');
    }
  };

  const allPanelsVisible = leftPanelVisible && rightPanelVisible;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 112px)'
      }}>
        <Spin size="large" tip="正在加载3D数字孪生场景..." />
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed',
      top: isFullscreen ? '0' : '64px',
      left: 0,
      width: '100vw',
      height: isFullscreen ? '100vh' : 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #60a5fa 50%, #3b82f6 75%, #1e3a8a 100%)',
      overflow: 'hidden',
      zIndex: 1
    }}>
      {/* 左侧机器人列表面板 - 悬浮显示 */}
      {leftPanelVisible && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '320px',
          maxHeight: 'calc(100% - 40px)',
          background: 'rgba(4, 3, 28, 0.01)',
          backdropFilter: 'blur(5px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '8px'
          }}>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontWeight: 'bold', color: '#e8f4fd', fontSize: '14px' }}>机器人统计</Text>
            <div style={{ marginLeft: 'auto' }}>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleLeftPanel}
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 57px)',
            overflow: 'auto'
          }}>
            {/* 机器人群组概览 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <Text style={{ fontSize: '14px', fontWeight: 500, color: '#e8f4fd' }}>机器人群组概览</Text>
                <Text style={{ fontSize: '12px', color: '#b8d4f0' }}>今日数据</Text>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{
                  background: 'rgba(24, 144, 255, 0.15)',
                  border: '1px solid rgba(24, 144, 255, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#1890ff', marginBottom: '4px' }}>
                    {mockRobots.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>总机器人</div>
                </div>
                
                <div style={{
                  background: 'rgba(82, 196, 26, 0.15)',
                  border: '1px solid rgba(82, 196, 26, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#52c41a', marginBottom: '4px' }}>
                    {mockRobots.filter(r => r.isOnline).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>在线机器人</div>
                </div>
                
                <div style={{
                  background: 'rgba(255, 77, 79, 0.15)',
                  border: '1px solid rgba(255, 77, 79, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#ff4d4f', marginBottom: '4px' }}>
                    {mockRobots.filter(r => !r.isOnline).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>离线机器人</div>
                </div>
                
                <div style={{
                  background: 'rgba(250, 173, 20, 0.15)',
                  border: '1px solid rgba(250, 173, 20, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#faad14', marginBottom: '4px' }}>
                    {mockRobots.filter(r => r.status === 'error' || r.status === 'move_stopped').length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>故障设备</div>
                </div>
                
                <div style={{
                  background: 'rgba(135, 208, 104, 0.15)',
                  border: '1px solid rgba(135, 208, 104, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#87d068', marginBottom: '4px' }}>
                    {mockRobots.filter(r => r.status === 'running').length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>运行中</div>
                </div>
                
                <div style={{
                  background: 'rgba(114, 46, 209, 0.15)',
                  border: '1px solid rgba(114, 46, 209, 0.3)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#722ed1', marginBottom: '4px' }}>
                    {Math.round((mockRobots.filter(r => r.status === 'error' || r.status === 'move_stopped').length / mockRobots.length) * 100)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>故障率</div>
                </div>
              </div>
            </div>
            
            {/* 机器人类型分布 */}
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#e8f4fd', marginBottom: '12px', display: 'block' }}>机器人类型分布</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['AGV', 'MCR', 'AMR'].map(type => {
                  const count = mockRobots.filter(r => r.type === type).length;
                  const percentage = Math.round((count / mockRobots.length) * 100);
                  return (
                    <div key={type} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getRobotTypeIcon(type)}
                        <Text style={{ fontSize: '13px', color: '#e8f4fd' }}>{type}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '60px',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: type === 'AGV' ? '#1890ff' : type === 'MCR' ? '#52c41a' : '#fa8c16',
                            borderRadius: '2px'
                          }} />
                        </div>
                        <Text style={{ fontSize: '12px', color: '#b8d4f0', minWidth: '30px' }}>{count}台</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 设备性能统计 */}
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#e8f4fd', marginBottom: '12px', display: 'block' }}>设备性能统计</Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#1890ff', marginBottom: '4px' }}>
                    {Math.round(mockRobots.reduce((sum, r) => sum + r.battery, 0) / mockRobots.length)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>平均电量</div>
                </div>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#52c41a', marginBottom: '4px' }}>
                    {Math.round((mockRobots.filter(r => r.isOnline && r.status === 'running').length / mockRobots.length) * 100)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8d4f0' }}>设备利用率</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 中间内容区 */}
      <div style={{ 
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        overflow: 'hidden'
      }}>
        <div style={{ width: '100%', height: '100%' }}>
          <ThreeScene ref={threeSceneRef} />
        </div>

        {/* 中间悬浮控制栏 */}
        <div className="digital-twin-page" style={{
          position: 'absolute',
          top: '20px',
          left: leftPanelVisible && rightPanelVisible ? 'calc(240px + (100vw - 480px) / 2)' :
                leftPanelVisible ? 'calc(240px + (100vw - 240px) / 2)' :
                rightPanelVisible ? 'calc((100vw - 240px) / 2)' : '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(4, 3, 28, 0.2)',
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px'
        }}>
          <Space>

            {/* 楼层切换下拉选择器 */}
            <FloorSelector
              selectedFloor={selectedFloor}
              onFloorChange={handleFloorChange}
              threeSceneRef={threeSceneRef}
              style={{
                width: 120,
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            />
            <Button 
              icon={<ReloadOutlined />} 
              size="small"
              type="text"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              <span style={{ color: '#e8f4fd' }}>刷新</span>
            </Button>
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              type="text"
              onClick={handleBackToOverview}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              <span style={{ color: '#e8f4fd' }}>重置视图</span>
            </Button>

            <Button 
              icon={allPanelsVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              size="small"
              type="text"
              onClick={toggleAllPanels}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              <span style={{ color: '#e8f4fd' }}>{allPanelsVisible ? '隐藏全部' : '显示全部'}</span>
            </Button>
            
            {/* 全屏按钮 - 紧邻隐藏全部按钮 */}
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              size="small"
              type="text"
              onClick={toggleFullscreen}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              <span style={{ color: '#e8f4fd' }}>{isFullscreen ? '退出全屏' : '全屏'}</span>
            </Button>
            
            <Button
              icon={<VerticalAlignTopOutlined />}
              size="small"
              type="text"
              onClick={handleTopView}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
              title="顶视图"
            >
              <span style={{ color: '#e8f4fd' }}>顶视图</span>
            </Button>
            
            <Button
              icon={<BorderOutlined />}
              size="small"
              type="text"
              onClick={handleFrontView}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
              title="正视图"
            >
              <span style={{ color: '#e8f4fd' }}>正视图</span>
            </Button>

          </Space>
        </div>
      </div>

      {/* 右侧运单任务面板 - 悬浮显示 */}
      {rightPanelVisible && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '320px',
          maxHeight: 'calc(100% - 40px)',
          background: 'rgba(4, 3, 28, 0.01)',
          backdropFilter: 'blur(5px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '8px'
          }}>
            <BuildOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontWeight: 'bold', color: '#e8f4fd', fontSize: '14px' }}>业务统计</Text>
            <div style={{ marginLeft: 'auto' }}>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleRightPanel}
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          {/* 任务执行统计概览 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#e8f4fd' }}>任务执行统计</Text>
              <Text style={{ fontSize: '12px', color: '#b8d4f0' }}>实时数据</Text>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                background: 'rgba(24, 144, 255, 0.15)',
                border: '1px solid rgba(24, 144, 255, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#1890ff', marginBottom: '4px' }}>
                  {mockTasks.filter(t => t.status === 'executing').length}
                </div>
                <div style={{ fontSize: '12px', color: '#b8d4f0' }}>正在执行</div>
              </div>
              
              <div style={{
                background: 'rgba(250, 173, 20, 0.15)',
                border: '1px solid rgba(250, 173, 20, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#faad14', marginBottom: '4px' }}>
                  {mockTasks.filter(t => t.status === 'pending').length}
                </div>
                <div style={{ fontSize: '12px', color: '#b8d4f0' }}>待执行</div>
              </div>
              
              <div style={{
                background: 'rgba(250, 173, 20, 0.15)',
                border: '1px solid rgba(250, 173, 20, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#faad14', marginBottom: '4px' }}>
                  {mockTasks.filter(t => t.status === 'paused').length}
                </div>
                <div style={{ fontSize: '12px', color: '#b8d4f0' }}>已挂起</div>
              </div>
              
              <div style={{
                background: 'rgba(114, 46, 209, 0.15)',
                border: '1px solid rgba(114, 46, 209, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#722ed1', marginBottom: '4px' }}>
                  {mockTasks.filter(t => t.robotId === null).length}
                </div>
                <div style={{ fontSize: '12px', color: '#b8d4f0' }}>待分配</div>
              </div>
            </div>
          </div>

          {/* 业务效能指标 */}
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ fontSize: '14px', fontWeight: 500, color: '#e8f4fd', marginBottom: '12px', display: 'block' }}>业务效能指标</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: '任务完成率', value: `${Math.round((mockTasks.filter(t => t.status === 'completed').length / mockTasks.length) * 100)}%`, color: '#52c41a' },
                { label: '平均响应时间', value: '3.2min', color: '#1890ff' },
                { label: '平均任务完成时间', value: '12.5min', color: '#13c2c2' },
                { label: '异常任务率', value: `${Math.round((mockTasks.filter(t => t.status === 'error').length / mockTasks.length) * 100)}%`, color: '#ff4d4f' },
                { label: '今日订单量', value: '156', color: '#722ed1' },
                { label: '今日完成订单量', value: `${mockTasks.filter(t => t.status === 'completed').length}`, color: '#52c41a' }
              ].map((item, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: '13px', color: '#e8f4fd' }}>{item.label}</Text>
                  <Text style={{ fontSize: '14px', fontWeight: 600, color: item.color }}>{item.value}</Text>
                </div>
              ))}
            </div>
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
            background: 'rgba(4, 3, 28, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(20px)',
            color: '#e8f4fd',
            borderRadius: '8px'
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
            background: 'rgba(4, 3, 28, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(20px)',
            color: '#e8f4fd',
            borderRadius: '8px'
          }}
          onClick={toggleRightPanel}
        />
      )}


    </div>
  );
};

export default DigitalTwin;