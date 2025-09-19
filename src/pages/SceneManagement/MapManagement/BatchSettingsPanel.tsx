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
  ReloadOutlined
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
  }>;
  onClose: () => void;
  onUpdate: (updates: BatchUpdateData) => void;
}

interface BatchUpdateData {
  direction?: number;
  type?: string;
}

const BatchSettingsPanel: React.FC<BatchSettingsPanelProps> = ({
  visible,
  selectedPoints,
  onClose,
  onUpdate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 分析选中点的当前状态
  const analyzeSelectedPoints = () => {
    if (selectedPoints.length === 0) return { directions: [], types: [] };
    
    const directions = selectedPoints.map((point: any) => point.direction || 0);
    const types = selectedPoints.map((point: any) => point.type || 'normal');
    
    return { directions, types };
  };

  const { directions, types } = analyzeSelectedPoints();

  // 检查是否所有点的方向都相同
  const hasUniformDirection = directions.length > 0 && directions.every((dir: any) => dir === directions[0]);
  const hasUniformType = types.length > 0 && types.every((type: any) => type === types[0]);

  // 重置表单
  const resetForm = () => {
    form.resetFields();
  };

  // 处理批量更新
  const handleBatchUpdate = async (values: any) => {
    setLoading(true);
    try {
      const updateData: BatchUpdateData = {
        ...values
      };

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
            type: hasUniformType ? types[0] : undefined
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