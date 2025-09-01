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
    position: { x: 150, y: 200 },
    currentTask: '运输任务-001',
    mapId: 'map1',
  },
  {
    id: 'MCR001',
    name: 'MCR-001',
    type: 'MCR',
    status: 'idle',
    battery: 92,
    position: { x: 300, y: 150 },
    currentTask: null,
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
  
  // 画布缩放和平移状态
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 获取当前地图的机器人
  const currentMapRobots = mockRobots.filter(robot => robot.mapId === selectedMap);



  // 绘制画布内容
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 保存当前状态
    ctx.save();
    
    // 应用缩放和平移变换
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 绘制浅灰背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale);

    // 绘制网格背景
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1 / scale;
    const gridSize = 30;
    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - offsetX) / scale / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - offsetY) / scale / gridSize) * gridSize;
    
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

    // 绘制拓扑路径（示例路径）
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 3 / scale;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(200, 100);
    ctx.lineTo(200, 250);
    ctx.lineTo(400, 250);
    ctx.lineTo(400, 150);
    ctx.lineTo(550, 150);
    ctx.stroke();

    // 绘制路径节点
    ctx.fillStyle = '#1890ff';
    const pathNodes = [
      { x: 50, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 250 },
      { x: 400, y: 250 },
      { x: 400, y: 150 },
      { x: 550, y: 150 },
    ];
    pathNodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 5 / scale, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 绘制机器人
    currentMapRobots.forEach(robot => {
      const { x, y } = robot.position;
      
      // 机器人外圈（根据状态显示不同颜色）
      let robotColor = '#52c41a'; // 默认绿色
      if (robot.status === 'running') robotColor = '#1890ff'; // 蓝色
      if (robot.status === 'charging') robotColor = '#faad14'; // 橙色
      if (robot.status === 'error') robotColor = '#ff4d4f'; // 红色
      
      ctx.fillStyle = robotColor;
      ctx.beginPath();
      ctx.arc(x, y, 15 / scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // 机器人内圈
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 10 / scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // 机器人标识
      ctx.fillStyle = robotColor;
      ctx.font = `${12 / scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(robot.type, x, y + 4 / scale);
      
      // 机器人名称
      ctx.fillStyle = '#000000';
      ctx.font = `${10 / scale}px Arial`;
      ctx.fillText(robot.name, x, y - 25 / scale);
      
      // 选中状态
      if (selectedRobot === robot.id) {
        ctx.strokeStyle = '#ff4d4f';
        ctx.lineWidth = 2 / scale;
        ctx.beginPath();
        ctx.arc(x, y, 20 / scale, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
    
    // 恢复状态
    ctx.restore();
  }, [selectedMap, currentMapRobots, selectedRobot, scale, offsetX, offsetY]);

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

    // 检查是否点击了机器人
    const clickedRobot = currentMapRobots.find(robot => {
      const distance = Math.sqrt(
        Math.pow(worldX - robot.position.x, 2) + Math.pow(worldY - robot.position.y, 2)
      );
      return distance <= 15;
    });

    setSelectedRobot(clickedRobot ? clickedRobot.id : null);
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
          backgroundColor: '#f5f5f5'
        }}
        onClick={handleCanvasClick}
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
                  onClick={() => setSelectedRobot(robot.id)}
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


    </div>
  );
};

export default FieldControlView;