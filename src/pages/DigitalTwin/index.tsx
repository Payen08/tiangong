import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 1. 在这里导入
import {
  Button,
  Typography,
  message,
  Spin,
  Space,
} from 'antd';


import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  EyeOutlined,
  BuildOutlined,
  RobotOutlined,
  ScheduleOutlined,
  EyeInvisibleOutlined,
  CarOutlined,
  AndroidOutlined,
  VerticalAlignTopOutlined,
  BorderOutlined,
  EditOutlined,
} from '@ant-design/icons';
import ThreeScene, { ThreeSceneRef } from '@/components/ThreeScene';
import FloorSelector from '@/components/FloorSelector';

const { Text } = Typography;

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
  const navigate = useNavigate(); // 👈 2. 在这里初始化
  const [loading, setLoading] = useState(true); // 页面加载状态
  const [selectedFloor, setSelectedFloor] = useState<string | null>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // ThreeScene组件引用
  const threeSceneRef = React.useRef<ThreeSceneRef>(null);

  // 模拟加载延迟
  useEffect(() => {
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









  // 返回全场景视图（重置视图）
  const handleBackToOverview = () => {
    console.log('handleBackToOverview 被调用');
    console.log('threeSceneRef.current:', threeSceneRef.current);
    
    // 重置视图时设置为全部楼层
    setSelectedFloor('all');
    if (threeSceneRef.current) {
      console.log('ThreeScene 引用存在，开始调用方法');
      
      // 先显示所有楼层
      if (threeSceneRef.current.setAllFloorsView) {
        console.log('调用 setAllFloorsView');
        threeSceneRef.current.setAllFloorsView();
      } else {
        console.error('setAllFloorsView 方法不存在');
      }
      
      // 然后重置相机到初始位置
      if (threeSceneRef.current.resetView) {
        console.log('调用 resetView');
        threeSceneRef.current.resetView();
      } else {
        console.error('resetView 方法不存在');
      }
    } else {
      console.error('threeSceneRef.current 为空');
    }
    message.success('已重置到初始3D视图视角');
  };

  // 新增面板控制函数
  const toggleLeftPanel = () => setLeftPanelVisible(!leftPanelVisible);
  const toggleRightPanel = () => setRightPanelVisible(!rightPanelVisible);
  const toggleAllPanels = () => {
    const newVisible = !(leftPanelVisible && rightPanelVisible);
    setLeftPanelVisible(newVisible);
    setRightPanelVisible(newVisible);
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
        <Spin size="large" tip="正在加载3D数字孪生场景...">
          <div style={{ width: '200px', height: '100px' }} />
        </Spin>
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
      _                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getRobotTypeIcon(type)}
                        <Text style={{ fontSize: '13px', color: '#e8f4fd' }}>{type}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                _           width: '60px',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
nd                       background: type === 'AGV' ? '#1890ff' : type === 'MCR' ? '#52c41a' : '#fa8c16',
                            borderRadius: '2px'
                          }} />
                        </div>
A                     <Text style={{ fontSize: '12px', color: '#b8d4f0', minWidth: '30px' }}>{count}台</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
e         </div>
            
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
D             </div>
                
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
ar             </div>
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

        {/* 中间悬浮控制栏 - 楼层选择器始终居中显示 */}
        <div className="digital-twin-page" style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
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
D       }}>
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
              icon={<ReloadOutlined />}s 
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
s         </Button>
            
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
s         </Button>
            
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
g             size="small"
              type="text"
              onClick={handleFrontView}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
              title="正视图"
s           >
              <span style={{ color: '#e8f4fd' }}>正视图</span>
            </Button>
            
            <Button
              icon={<EditOutlined />}
s             size="small"
              type="text"
              onClick={() => {
                // 跳转到编辑页面
                // window.location.href = '/digital-twin/editor'; // 👈 3. 这是错误行
                navigate('/digital-twin/editor'); // 👈 3. 修改为此行
              }}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
              nbsp; borderRadius: '4px'
              }}
              title="编辑模式"
            >
              <span style={{ color: '#e8f4fd' }}>编辑</span>
            </Button>

          </Space>
        </div>
      </div>

    </div>
  );
};

export default DigitalTwin;
