import React, { useState } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  Typography,
  InputNumber,
  message,
  Tooltip,
  Badge
} from 'antd';
import {
  CloseOutlined,
  SettingOutlined,
  CompassOutlined,
  NodeIndexOutlined,
  CheckOutlined,
  ReloadOutlined,
  PictureOutlined,
  ApartmentOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface BatchSettingsPanelProps {
  visible: boolean;
  selectedPoints: Array<{
    id: string;
    name: string;
    direction: number;
    type: string;
    baseMapId?: string;
  }>;
  onClose: () => void;
  onUpdate: (updates: BatchUpdateData) => void;
}

interface BatchUpdateData {
  direction?: number;
  type?: string;
  baseMapId?: string;
  routeNetworkGroupId?: string;
}

// 黑白底图数据接口
interface BaseMapData {
  id: string;
  name: string;
  url: string;
  description?: string;
}

// 区域数据接口
interface AreaData {
  id: string;
  name: string;
  description?: string;
}

// 路网组数据接口
interface RouteNetworkGroup {
  id: string;
  name: string;
  areaId: string;
  description?: string;
}

const BatchSettingsPanel: React.FC<BatchSettingsPanelProps> = ({
  visible,
  selectedPoints,
  onClose,
  onUpdate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>(undefined);

  // 模拟黑白底图数据
  const mockBaseMapData: BaseMapData[] = [
    {
      id: 'basemap-1',
      name: '标准建筑底图',
      url: '/src/assets/base-map.svg',
      description: '标准建筑平面图底图'
    },
    {
      id: 'basemap-2', 
      name: '简化建筑底图',
      url: '/src/assets/base-map-simple.svg',
      description: '简化版建筑平面图底图'
    },
    {
      id: 'basemap-3',
      name: '详细建筑底图', 
      url: '/src/assets/base-map-detailed.svg',
      description: '详细版建筑平面图底图'
    },
    {
      id: 'basemap-4',
      name: '黑白线条底图',
      url: '/src/assets/base-map-bw.svg',
      description: '黑白线条风格底图'
    },
    {
      id: 'basemap-5',
      name: '极简底图',
      url: '/src/assets/base-map-minimal.svg',
      description: '极简风格底图'
    }
  ];

  // 模拟区域数据
  const mockAreaData: AreaData[] = [
    {
      id: 'area-1',
      name: '生产区域',
      description: '主要生产车间区域'
    },
    {
      id: 'area-2',
      name: '仓储区域',
      description: '物料仓储区域'
    },
    {
      id: 'area-3',
      name: '办公区域',
      description: '办公楼区域'
    },
    {
      id: 'area-4',
      name: '物流区域',
      description: '物流运输区域'
    }
  ];

  // 模拟路网组数据
  const mockRouteNetworkGroups: RouteNetworkGroup[] = [
    // 生产区域的路网组
    {
      id: 'rng-1-1',
      name: '生产线A路网组',
      areaId: 'area-1',
      description: '生产线A的路网组'
    },
    {
      id: 'rng-1-2',
      name: '生产线B路网组',
      areaId: 'area-1',
      description: '生产线B的路网组'
    },
    {
      id: 'rng-1-3',
      name: '质检区路网组',
      areaId: 'area-1',
      description: '质检区域的路网组'
    },
    // 仓储区域的路网组
    {
      id: 'rng-2-1',
      name: '入库区路网组',
      areaId: 'area-2',
      description: '入库区域的路网组'
    },
    {
      id: 'rng-2-2',
      name: '出库区路网组',
      areaId: 'area-2',
      description: '出库区域的路网组'
    },
    {
      id: 'rng-2-3',
      name: '存储区路网组',
      areaId: 'area-2',
      description: '存储区域的路网组'
    },
    // 办公区域的路网组
    {
      id: 'rng-3-1',
      name: '办公楼主路网组',
      areaId: 'area-3',
      description: '办公楼主要路网组'
    },
    {
      id: 'rng-3-2',
      name: '会议区路网组',
      areaId: 'area-3',
      description: '会议区域的路网组'
    },
    // 物流区域的路网组
    {
      id: 'rng-4-1',
      name: '装卸区路网组',
      areaId: 'area-4',
      description: '装卸区域的路网组'
    },
    {
      id: 'rng-4-2',
      name: '运输通道路网组',
      areaId: 'area-4',
      description: '运输通道的路网组'
    }
  ];

  // 根据选中的区域过滤路网组
  const getFilteredRouteNetworkGroups = (areaId?: string): RouteNetworkGroup[] => {
    if (!areaId) return [];
    return mockRouteNetworkGroups.filter(group => group.areaId === areaId);
  };

  // 分析选中点的当前状态
  const analyzeSelectedPoints = () => {
    if (selectedPoints.length === 0) return { directions: [], types: [], baseMapIds: [], routeNetworkGroupIds: [] };
    
    const directions = selectedPoints.map((point: any) => point.direction || 0);
    const types = selectedPoints.map((point: any) => point.type || 'normal');
    const baseMapIds = selectedPoints.map((point: any) => point.baseMapId || '');
    const routeNetworkGroupIds = selectedPoints.map((point: any) => point.routeNetworkGroupId || '');
    
    return { directions, types, baseMapIds, routeNetworkGroupIds };
  };

  const { directions, types, baseMapIds, routeNetworkGroupIds } = analyzeSelectedPoints();

  // 检查是否所有点的属性都相同
  const hasUniformDirection = directions.length > 0 && directions.every((dir: any) => dir === directions[0]);
  const hasUniformType = types.length > 0 && types.every((type: any) => type === types[0]);
  const hasUniformBaseMap = baseMapIds.length > 0 && baseMapIds.every((id: any) => id === baseMapIds[0]);
  const hasUniformRouteNetworkGroup = routeNetworkGroupIds.length > 0 && routeNetworkGroupIds.every((id: any) => id === routeNetworkGroupIds[0]);

  // 设置表单初始值
  React.useEffect(() => {
    if (visible && selectedPoints.length > 0) {
      const initialValues: any = {};
      
      if (hasUniformDirection) {
        initialValues.direction = directions[0];
      }
      
      if (hasUniformType) {
        initialValues.type = types[0];
      }
      
      if (hasUniformBaseMap) {
        initialValues.baseMapId = baseMapIds[0];
      }
      
      if (hasUniformRouteNetworkGroup && routeNetworkGroupIds[0]) {
        // 根据路网组ID找到对应的区域ID
        const routeNetworkGroup = mockRouteNetworkGroups.find(group => group.id === routeNetworkGroupIds[0]);
        if (routeNetworkGroup) {
          initialValues.areaId = routeNetworkGroup.areaId;
          initialValues.routeNetworkGroupId = routeNetworkGroupIds[0];
          setSelectedAreaId(routeNetworkGroup.areaId);
        }
      }
      
      form.setFieldsValue(initialValues);
    }
  }, [visible, selectedPoints, form, hasUniformDirection, hasUniformType, hasUniformBaseMap, hasUniformRouteNetworkGroup, directions, types, baseMapIds, routeNetworkGroupIds]);

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setSelectedAreaId(undefined);
  };

  // 处理批量更新
  const handleBatchUpdate = async (values: any) => {
    setLoading(true);
    try {
      const updateData: BatchUpdateData = {};
      
      if (values.direction !== undefined) {
        updateData.direction = values.direction;
      }
      
      if (values.type !== undefined) {
        updateData.type = values.type;
      }
      
      if (values.baseMapId !== undefined) {
        updateData.baseMapId = values.baseMapId;
      }
      
      if (values.routeNetworkGroupId !== undefined) {
        updateData.routeNetworkGroupId = values.routeNetworkGroupId;
      }

      await onUpdate(updateData);
      message.success(`成功更新 ${selectedPoints.length} 个点的设置`);
    } catch (error) {
      message.error('批量更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 面板样式
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: visible ? '0' : '-260px', // 直接覆盖右侧固定面板
    width: '260px',
    height: '100vh',
    background: '#fff',
    borderLeft: '1px solid #e8e8e8',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
    zIndex: 1001, // 比右侧工具面板稍高
    transition: 'right 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 12px 12px 12px',
    borderBottom: '1px solid #e8e8e8',
    background: '#fafafa'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '16px 12px',
    overflow: 'auto'
  };

  const footerStyle: React.CSSProperties = {
    padding: '12px',
    borderTop: '1px solid #e8e8e8',
    background: '#fafafa'
  };

  return (
    <div style={panelStyle}>
      {/* 头部 */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              批量设置
            </Title>
          </div>
          <Tooltip title="关闭面板">
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              size="small"
              style={{ color: '#666' }}
            />
          </Tooltip>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Badge count={selectedPoints.length} style={{ backgroundColor: '#1890ff' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              已选中点数
            </Text>
          </Badge>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={contentStyle}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBatchUpdate}
          initialValues={{
            direction: hasUniformDirection ? directions[0] : undefined,
            type: hasUniformType ? types[0] : undefined,
            baseMapId: hasUniformBaseMap ? baseMapIds[0] : undefined
          }}
        >
          {/* 点方向设置 */}
          <Card 
            size="small" 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CompassOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                <span>点方向设置</span>
              </div>
            }
            style={{ marginBottom: '16px' }}
          >
            <Form.Item
              name="direction"
              label={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>方向角度</span>
                  {!hasUniformDirection && (
                    <Text type="warning" style={{ fontSize: '11px' }}>
                      当前选中点方向不一致
                    </Text>
                  )}
                </div>
              }
            >
              <div>
                <InputNumber
                  min={-180}
                  max={180}
                  step={15}
                  placeholder="设置方向角度"
                  style={{ width: '100%', marginBottom: '8px' }}
                  addonAfter="°"
                />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[0, 45, 90, 135, 180, -135, -90, -45].map(angle => (
                    <Button
                      key={angle}
                      size="small"
                      type="text"
                      onClick={() => form.setFieldsValue({ direction: angle })}
                      style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    >
                      {angle}°
                    </Button>
                  ))}
                </div>
              </div>
            </Form.Item>
          </Card>

          {/* 点类型设置 */}
          <Card 
            size="small" 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <NodeIndexOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                <span>点类型设置</span>
              </div>
            }
            style={{ marginBottom: '16px' }}
          >
            <Form.Item
              name="type"
              label={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>点类型</span>
                  {!hasUniformType && (
                    <Text type="warning" style={{ fontSize: '11px' }}>
                      当前选中点类型不一致
                    </Text>
                  )}
                </div>
              }
            >
              <Select placeholder="请选择点类型" style={{ width: '100%' }}>
                <Option value="节点">节点</Option>
                <Option value="站点">站点</Option>
                <Option value="充电点">充电点</Option>
                <Option value="停靠点">停靠点</Option>
                <Option value="临停点">临停点</Option>
                <Option value="归位点">归位点</Option>
                <Option value="电梯点">电梯点</Option>
                <Option value="自动门">自动门</Option>
                <Option value="切换点">切换点</Option>
              </Select>
            </Form.Item>
          </Card>

          {/* 所属黑白底图设置 */}
          <Card 
            size="small" 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PictureOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                <span>所属黑白底图设置</span>
              </div>
            }
            style={{ marginBottom: '16px' }}
          >
            <Form.Item
              name="baseMapId"
              label={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>黑白底图</span>
                  {!hasUniformBaseMap && (
                    <Text type="warning" style={{ fontSize: '11px' }}>
                      当前选中点底图不一致
                    </Text>
                  )}
                </div>
              }
            >
              <Select 
                placeholder="请选择黑白底图" 
                style={{ width: '100%' }}
                allowClear
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {mockBaseMapData.map(baseMap => (
                  <Option key={baseMap.id} value={baseMap.id} title={baseMap.description}>
                    {baseMap.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              <Text type="secondary">
                选择后将为所有选中的点设置相同的黑白底图
              </Text>
            </div>
          </Card>

          {/* 所属路网组设置 */}
           <Card 
             size="small" 
             title={
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <ApartmentOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                 <span>加入到路网组设置</span>
               </div>
             }
             style={{ marginBottom: '16px' }}
           >
            <Form.Item
               name="areaId"
               label="选择区域"
             >
               <Select 
                 placeholder="请选择区域" 
                 style={{ width: '100%' }}
                 allowClear
                 showSearch
                 value={selectedAreaId}
                 onChange={(value: string | undefined) => {
                   setSelectedAreaId(value);
                   form.setFieldsValue({ routeNetworkGroupId: undefined });
                 }}
                 filterOption={(input: string, option: any) =>
                   (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                 }
               >
                 {mockAreaData.map(area => (
                   <Option key={area.id} value={area.id} title={area.description}>
                     {area.name}
                   </Option>
                 ))}
               </Select>
             </Form.Item>
            
            <Form.Item
               name="routeNetworkGroupId"
               label={
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <span>选择路网组</span>
                   {!hasUniformRouteNetworkGroup && selectedPoints.length > 0 && (
                     <Text type="warning" style={{ fontSize: '11px' }}>
                       当前选中点路网组不一致
                     </Text>
                   )}
                 </div>
               }
             >
               <Select 
                 placeholder={selectedAreaId ? "请选择路网组" : "请先选择区域"}
                 style={{ width: '100%' }}
                 allowClear
                 showSearch
                 disabled={!selectedAreaId}
                 filterOption={(input: string, option: any) =>
                   (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                 }
               >
                 {getFilteredRouteNetworkGroups(selectedAreaId).map(group => (
                   <Option key={group.id} value={group.id} title={group.description}>
                     {group.name}
                   </Option>
                 ))}
               </Select>
             </Form.Item>
            
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
               <Text type="secondary">
                 选择后将为所有选中的点设置相同的路网组
               </Text>
             </div>
          </Card>

          {/* 选中点列表 */}
          <Card 
            size="small" 
            title="选中点列表"
            style={{ marginBottom: '16px' }}
          >
            <div style={{ maxHeight: '120px', overflow: 'auto' }}>
              {selectedPoints.map((point: any, index: number) => (
                <div 
                  key={point.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    borderBottom: index < selectedPoints.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: point.type === '充电点' ? '#52c41a' : 
                                     point.type === '停靠点' ? '#faad14' :
                                     point.type === '临停点' ? '#faad14' :
                                     point.type === '归位点' ? '#faad14' :
                                     point.type === '电梯点' ? '#722ed1' :
                                     point.type === '自动门' ? '#13c2c2' :
                                     point.type === '切换点' ? '#f5222d' :
                                     point.type === '站点' ? '#52c41a' : '#1890ff',
                      marginRight: '6px'
                    }} />
                    <Text style={{ fontSize: '12px' }}>{point.name}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {point.direction || 0}°
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Form>
      </div>

      {/* 底部操作区 */}
      <div style={footerStyle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => form.submit()}
            loading={loading}
            block
          >
            应用设置
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={resetForm}
            block
            style={{ marginTop: '8px' }}
          >
            重置
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default BatchSettingsPanel;