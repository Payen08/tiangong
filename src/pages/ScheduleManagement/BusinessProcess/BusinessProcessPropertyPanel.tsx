import React, { useState, useEffect } from 'react';
import { businessProcessData, type BusinessProcessRecord } from '../../../data/businessProcessData';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message
} from 'antd';
import {
  CloseOutlined,
  SettingOutlined,
  EyeOutlined
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

          {/* 查看流程详情按钮 */}
          {selectedProcess && (
            <Card title="流程操作" size="small" style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                block
                style={{ marginTop: 8 }}
              >
                查看流程详情
              </Button>
            </Card>
          )}
        </Form>
      </div>



    </div>
  );
};

export default BusinessProcessPropertyPanel;