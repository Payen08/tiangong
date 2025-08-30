import React, { useState, useEffect, useRef } from 'react';
import { businessProcessData, type BusinessProcessRecord } from '../../../data/businessProcessData';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Divider,
  message,
  Tooltip,
  List,
  Avatar,
  Modal
} from 'antd';
import {
  CloseOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined
} from '@ant-design/icons';

const { Option } = Select;

interface FlowNode {
  id: string;
  type: 'start' | 'end' | 'stage' | 'businessProcess';
  label: string;
  customName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: {
    processKey?: string;
    updateTime?: string;
    selectedProcessId?: string;
  };
}

// 使用共享的 BusinessProcessRecord 类型

interface BusinessProcessPropertyPanelProps {
  visible: boolean;
  businessProcessNode: FlowNode | null;
  onClose: () => void;
  onSave: (updatedNode: FlowNode) => void;
}

const BusinessProcessPropertyPanel: React.FC<BusinessProcessPropertyPanelProps> = ({
  visible,
  businessProcessNode,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [selectedProcess, setSelectedProcess] = useState<BusinessProcessRecord | null>(null);
  const [canvasModalVisible, setCanvasModalVisible] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 使用共享业务流程数据，每次渲染时获取最新数据
  const [businessProcesses, setBusinessProcesses] = useState<BusinessProcessRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 监听面板显示状态，每次打开时刷新数据
  useEffect(() => {
    if (visible) {
      const latestData = [...businessProcessData];
      setBusinessProcesses(latestData);
    }
  }, [visible, refreshKey]);

  // 添加定时刷新机制，确保数据同步
  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        const currentLength = businessProcesses.length;
        const actualLength = businessProcessData.length;
        
        if (currentLength !== actualLength) {
          setRefreshKey(prev => prev + 1);
        }
      }, 1000); // 每秒检查一次
      
      return () => clearInterval(interval);
    }
  }, [visible, businessProcesses.length]);

  // 初始化表单数据
  useEffect(() => {
    if (visible && businessProcessNode) {
      form.setFieldsValue({
        id: businessProcessNode.id,
        name: businessProcessNode.customName || businessProcessNode.label,
        selectedProcessId: businessProcessNode.data?.selectedProcessId || ''
      });
      
      // 如果已经选择了业务流程，设置选中状态
      if (businessProcessNode.data?.selectedProcessId) {
        const process = businessProcesses.find(p => p.id === businessProcessNode.data?.selectedProcessId);
        setSelectedProcess(process || null);
      } else {
        setSelectedProcess(null);
      }
    }
  }, [visible, businessProcessNode, form, businessProcesses]);

  // 处理业务流程选择
  const handleProcessSelect = (processId: string) => {
    const process = businessProcesses.find(p => p.id === processId);
    if (process) {
      setSelectedProcess(process);
      form.setFieldsValue({
        selectedProcessId: processId
      });
    }
  };

  // 保存节点属性
  const handleSave = () => {
    form.validateFields().then((values: any) => {
      if (!businessProcessNode) return;
      
      const updatedNode: FlowNode = {
        ...businessProcessNode,
        customName: values.name,
        data: {
          ...businessProcessNode.data,
          selectedProcessId: values.selectedProcessId,
          processKey: selectedProcess?.identifier || '',
          updateTime: selectedProcess?.updateTime || ''
        }
      };
      
      onSave(updatedNode);
      message.success('业务流程节点属性已保存');
      onClose();
    }).catch((error: any) => {
      console.error('表单验证失败:', error);
      message.error('请检查表单输入');
    });
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return '#52c41a';
      case 'disabled': return '#faad14';
      case 'obsolete': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'enabled': return '启用';
      case 'disabled': return '停用';
      case 'obsolete': return '废弃';
      default: return '未知';
    }
  };

  // 画布操作函数
  const handleCanvasZoomIn = () => {
    setCanvasScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleCanvasZoomOut = () => {
    setCanvasScale(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleCanvasReset = () => {
    setCanvasScale(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - canvasPosition.x,
      y: e.clientY - canvasPosition.y
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCanvasPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // 显示流程详情画布
  const showProcessCanvas = () => {
    setCanvasModalVisible(true);
    setCanvasScale(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  // 渲染画布节点
  const renderCanvasNode = (node: any) => {
    const getNodeStyle = (type: string) => {
      switch (type) {
        case 'start':
          return {
            backgroundColor: '#52c41a',
            color: 'white',
            borderRadius: '20px'
          };
        case 'end':
          return {
            backgroundColor: '#ff4d4f',
            color: 'white',
            borderRadius: '20px'
          };
        case 'stage':
          return {
            backgroundColor: '#1890ff',
            color: 'white',
            borderRadius: '8px'
          };
        default:
          return {
            backgroundColor: '#d9d9d9',
            color: '#333',
            borderRadius: '8px'
          };
      }
    };

    return (
      <div
        key={node.id}
        style={{
          position: 'absolute',
          left: (node.position?.x || node.x || 0),
          top: (node.position?.y || node.y || 0),
          width: node.width || 120,
          height: node.height || 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '2px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          ...getNodeStyle(node.type)
        }}
      >
        {node.customName || node.label}
      </div>
    );
  };

  // 渲染画布连接线
  const renderCanvasConnection = (connection: any, nodes: any[]) => {
    const fromNode = nodes.find(n => n.id === (connection.source || connection.from));
    const toNode = nodes.find(n => n.id === (connection.target || connection.to));
    
    if (!fromNode || !toNode) return null;

    const fromX = (fromNode.position?.x || fromNode.x || 0) + (fromNode.width || 120);
    const fromY = (fromNode.position?.y || fromNode.y || 0) + (fromNode.height || 60) / 2;
    const toX = (toNode.position?.x || toNode.x || 0);
    const toY = (toNode.position?.y || toNode.y || 0) + (toNode.height || 60) / 2;

    return (
      <line
        key={connection.id}
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#1890ff"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  };

  // 如果不可见或没有选中的业务流程节点，不渲染任何内容
  if (!visible || !businessProcessNode) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        background: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '0',
        zIndex: 1000,
        width: '320px',
        height: 'calc(100vh - 32px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 标题栏 */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontSize: '16px', fontWeight: 500 }}>业务流程</span>
        </div>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>
      
      {/* 内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        <Form form={form} layout="vertical">
          {/* 基本信息 */}
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              label="节点名称"
              name="name"
              rules={[{ required: true, message: '请输入节点名称' }]}
            >
              <Input placeholder="请输入节点名称" />
            </Form.Item>
            
            <Form.Item label="节点ID" name="id">
              <Input disabled />
            </Form.Item>
          </Card>

          {/* 业务流程选择 */}
          <Card title="业务流程选择" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              label="选择业务流程"
              name="selectedProcessId"
              rules={[{ required: true, message: '请选择业务流程' }]}
            >
              <Select
                placeholder="请选择业务流程"
                onChange={handleProcessSelect}
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {businessProcesses.map(process => (
                  <Option key={process.id} value={process.id}>
                    {process.businessName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          {/* 选中的业务流程详情 */}
          {selectedProcess && (
            <Card title="流程详情" size="small" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={[
                  {
                    label: '流程名称',
                    value: selectedProcess.businessName,
                    icon: <PlayCircleOutlined style={{ color: '#52c41a' }} />
                  },
                  {
                    label: '流程标识',
                    value: selectedProcess.identifier,
                    icon: <SettingOutlined style={{ color: '#1890ff' }} />
                  },
                  {
                    label: '更新时间',
                    value: selectedProcess.updateTime,
                    icon: <ClockCircleOutlined style={{ color: '#faad14' }} />
                  },
                  {
                    label: '更新人',
                    value: selectedProcess.updatedBy,
                    icon: <Avatar size={16} style={{ backgroundColor: '#f56a00' }}>U</Avatar>
                  },
                  {
                    label: '状态',
                    value: getStatusText(selectedProcess.status),
                    icon: <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: getStatusColor(selectedProcess.status) 
                    }} />
                  }
                ]}
                renderItem={(item: any) => (
                  <List.Item>
                    <Space>
                      {item.icon}
                      <span style={{ color: '#666', minWidth: 80 }}>{item.label}:</span>
                      <span style={{ fontWeight: 500 }}>{item.value}</span>
                    </Space>
                  </List.Item>
                )}
              />
              
              {selectedProcess.remark && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <span style={{ color: '#666' }}>备注:</span>
                    <div style={{ 
                      marginTop: 8, 
                      padding: 12, 
                      backgroundColor: '#f9f9f9', 
                      borderRadius: 6,
                      fontSize: 14,
                      lineHeight: 1.5
                    }}>
                      {selectedProcess.remark}
                    </div>
                  </div>
                </>
              )}
              
              {/* 查看流程详情按钮 */}
              {selectedProcess.canvasData && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={showProcessCanvas}
                    block
                    style={{ marginTop: 8 }}
                  >
                    查看流程详情
                  </Button>
                </>
              )}
            </Card>
          )}
        </Form>
      </div>


      
      {/* 流程详情画布模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <ExpandOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              {selectedProcess?.businessName} - 流程详情
            </span>
            <Space>
              <Tooltip title="放大">
                <Button
                  type="text"
                  icon={<ZoomInOutlined />}
                  onClick={handleCanvasZoomIn}
                  disabled={canvasScale >= 3}
                />
              </Tooltip>
              <Tooltip title="缩小">
                <Button
                  type="text"
                  icon={<ZoomOutOutlined />}
                  onClick={handleCanvasZoomOut}
                  disabled={canvasScale <= 0.3}
                />
              </Tooltip>
              <Tooltip title="重置">
                <Button
                  type="text"
                  onClick={handleCanvasReset}
                >
                  重置
                </Button>
              </Tooltip>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {Math.round(canvasScale * 100)}%
              </span>
            </Space>
          </div>
        }
        open={canvasModalVisible}
        onCancel={() => setCanvasModalVisible(false)}
        width={1000}
        footer={null}
        centered
        bodyStyle={{ padding: 0, height: '600px', overflow: 'hidden' }}
      >
        <div
          style={{
            width: '100%',
            height: '600px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {selectedProcess?.canvasData && (
            <div
              ref={canvasRef}
              style={{
                position: 'relative',
                transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasScale})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                width: '1000px',
                height: '400px'
              }}
            >
              {/* SVG 用于绘制连接线 */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#1890ff"
                    />
                  </marker>
                </defs>
                {selectedProcess.canvasData.connections.map(connection =>
                  renderCanvasConnection(connection, selectedProcess.canvasData!.nodes)
                )}
              </svg>
              
              {/* 渲染节点 */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                {selectedProcess.canvasData.nodes.map(node => renderCanvasNode(node))}
              </div>
            </div>
          )}
          
          {/* 操作提示 */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 4,
              fontSize: '12px',
              zIndex: 10
            }}
          >
            拖动画布移动视图 | 使用工具栏缩放
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BusinessProcessPropertyPanel;