import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Select,
  message,
  Spin,
  Alert,
} from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  EyeOutlined,
  BuildOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

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

// 3D视图模式
type ViewMode = 'overview' | 'floor';

const DigitalTwin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [floors, setFloors] = useState<FloorData[]>([]);

  // 模拟楼层数据（基于地图管理的数据）
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
        name: '地下停车场',
        level: -1,
        mapId: '3',
        mapName: '停车场平面图',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        deviceCount: 8,
        robotCount: 1,
      },
    ];
    
    setTimeout(() => {
      setFloors(mockFloors);
      setLoading(false);
    }, 1000);
  }, []);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // 切换到楼层视图
  const handleFloorClick = (floorId: string) => {
    setSelectedFloor(floorId);
    setViewMode('floor');
    message.success(`已切换到${floors.find(f => f.id === floorId)?.name}视图`);
  };

  // 返回全场景视图
  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedFloor(null);
    message.info('已切换到全场景视图');
  };

  // 刷新3D视图
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('3D视图已刷新');
    }, 1000);
  };

  // 获取当前楼层信息
  const getCurrentFloor = () => {
    return floors.find(f => f.id === selectedFloor);
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'transparent',
        height: 'calc(100vh - 112px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" tip="正在加载3D场景..." />
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent', height: 'calc(100vh - 112px)' }}>
      {/* 控制面板 */}
      <Card 
        style={{ 
          marginBottom: '16px',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  数字孪生 3D 视图
                </Text>
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {viewMode === 'overview' ? '全场景立体视图' : `当前楼层: ${getCurrentFloor()?.name}`}
                  </Text>
                </div>
              </div>
              
              {viewMode === 'floor' && (
                <Button 
                  type="primary" 
                  ghost 
                  icon={<EyeOutlined />}
                  onClick={handleBackToOverview}
                >
                  返回全场景
                </Button>
              )}
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Select
                placeholder="选择楼层"
                style={{ width: 150 }}
                value={selectedFloor}
                onChange={(value: string) => handleFloorClick(value)}
              >
                {floors.map(floor => (
                  <Option key={floor.id} value={floor.id}>
                    {floor.name}
                  </Option>
                ))}
              </Select>
              
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                title="刷新视图"
              />
              
              <Button 
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                title={isFullscreen ? '退出全屏' : '全屏显示'}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3D视图主体 */}
      <Card 
        style={{ 
          height: 'calc(100% - 80px)',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}
        bodyStyle={{ 
          padding: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* 3D场景容器 */}
        <div 
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {/* 模拟3D视图内容 */}
          <div style={{ textAlign: 'center', color: 'white' }}>
            <BuildOutlined style={{ fontSize: '120px', marginBottom: '24px', opacity: 0.8 }} />
            <Title level={2} style={{ color: 'white', marginBottom: '16px' }}>
              {viewMode === 'overview' ? '全场景 3D 视图' : `${getCurrentFloor()?.name} 3D 视图`}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
              {viewMode === 'overview' 
                ? `共 ${floors.length} 个楼层 • ${floors.reduce((sum, f) => sum + f.deviceCount, 0)} 个设备 • ${floors.reduce((sum, f) => sum + f.robotCount, 0)} 个机器人`
                : `${getCurrentFloor()?.deviceCount} 个设备 • ${getCurrentFloor()?.robotCount} 个机器人`
              }
            </Text>
          </div>

          {/* 楼层快速切换按钮（仅在全场景模式显示） */}
          {viewMode === 'overview' && (
            <div style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {floors.map(floor => (
                <Button
                  key={floor.id}
                  type="primary"
                  ghost
                  style={{
                    borderColor: 'rgba(255,255,255,0.6)',
                    color: 'white',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: '100px'
                  }}
                  onClick={() => handleFloorClick(floor.id)}
                >
                  {floor.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 底部信息栏 */}
        <div style={{
          padding: '12px 16px',
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          borderRadius: '0 0 8px 8px'
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  视图模式: {viewMode === 'overview' ? '全场景' : '单楼层'}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>•</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  实时更新: 已启用
                </Text>
              </Space>
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                最后更新: {new Date().toLocaleTimeString()}
              </Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* 提示信息 */}
      {viewMode === 'overview' && (
        <Alert
          message="提示"
          description="点击右侧楼层按钮或使用顶部下拉菜单可以切换到具体楼层视图。在楼层视图中可以查看该楼层的详细3D模型和设备分布。"
          type="info"
          showIcon
          style={{ 
            marginTop: '16px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f'
          }}
        />
      )}
    </div>
  );
};

export default DigitalTwin;