import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Steps,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

// 跨地图连接接口
interface CrossMapConnectionData {
  name: string;
  type: 'cross-floor' | 'cross-area';
  remark?: string;
}

interface AddCrossMapConnectionProps {
  onClose?: () => void;
  onConnectionCreated?: (connectionData: any) => void;
  editingConnection?: any;
}

const AddCrossMapConnection: React.FC<AddCrossMapConnectionProps> = ({ 
  onClose, 
  onConnectionCreated, 
  editingConnection 
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // 主步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  const [basicInfoData, setBasicInfoData] = useState<any>(null);
  
  // 组件卸载时清理form实例
  useEffect(() => {
    return () => {
      form.resetFields();
    };
  }, []);

  // 处理编辑模式初始化
  useEffect(() => {
    if (editingConnection) {
      form.setFieldsValue({
        name: editingConnection.name,
        type: editingConnection.type,
        remark: editingConnection.remark,
      });
      setBasicInfoData(editingConnection);
    } else {
      form.resetFields();
      setBasicInfoData(null);
      setCurrentStep(0);
    }
  }, [editingConnection, form]);

  // 主流程下一步
  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setBasicInfoData(values);
      setCurrentStep(1);
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完善跨地图连接基本信息');
    }
  };

  // 主流程上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 完成创建或编辑
  const handleFinish = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const connectionData = {
        ...basicInfoData,
        ...(editingConnection ? {
          id: editingConnection.id,
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户'
        } : {
          id: Date.now().toString(),
          createTime: new Date().toLocaleString('zh-CN'),
          createUser: '当前用户'
        })
      };
      
      // 调用父组件的回调函数来更新连接列表
      if (onConnectionCreated) {
        onConnectionCreated(connectionData);
      } else {
        message.success(editingConnection ? '跨地图连接编辑成功！' : '跨地图连接创建成功！');
        // 返回连接列表
        if (onClose) {
          onClose();
        } else {
          navigate('/scene-management/cross-map-connection');
        }
      }
      
      // 如果是新增模式，创建成功后重置所有状态
      if (!editingConnection) {
        // 重置表单
        form.resetFields();
        // 重置所有状态
        setBasicInfoData(null);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error(editingConnection ? '编辑失败:' : '创建失败:', error);
      message.error(editingConnection ? '编辑失败，请重试' : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回
  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/scene-management/cross-map-connection');
    }
  };

  // 步骤配置
  const steps = [
    {
      title: '基本信息',
    },
    {
      title: '连接配置',
    },
  ];

  // 渲染基本信息配置步骤
  const renderBasicInfo = () => (
    <Row justify="center">
      <Col xs={24} sm={23} md={20} lg={18} xl={16}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 500, 
          color: '#262626', 
          marginBottom: '16px' 
        }}>
          跨地图连接基本信息
        </div>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleNext}
          >
            <Row gutter={16}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="连接名称"
                  name="name"
                  rules={[
                    { required: true, message: '请输入连接名称' },
                    { max: 50, message: '连接名称不能超过50个字符' },
                  ]}
                >
                  <Input placeholder="请输入连接名称" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="连接类型"
                  name="type"
                  rules={[{ required: true, message: '请选择连接类型' }]}
                >
                  <Select placeholder="请选择连接类型">
                    <Option value="cross-floor">跨楼层连接</Option>
                    <Option value="cross-area">跨区域连接</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="备注"
                  name="remark"
                  rules={[{ max: 200, message: '备注不能超过200个字符' }]}
                >
                  <Input.TextArea 
                    placeholder="请输入备注信息" 
                    rows={3}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>
    </Row>
  );

  // 渲染连接配置步骤（占位符）
  const renderConnectionConfig = () => {
    return (
      <Row justify="center">
        <Col xs={24} sm={23} md={20} lg={18} xl={16}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 500, 
            color: '#262626', 
            marginBottom: '16px' 
          }}>
            连接配置
          </div>
          <Card style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#999',
              fontSize: '16px'
            }}>
              <div style={{ marginBottom: '8px' }}>🚧</div>
              <div>连接配置功能开发中...</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>此步骤为占位符，后续将添加具体配置功能</div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div className="space-y-4" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
      {/* 步骤指示器 */}
      <Row justify="center" style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Steps current={currentStep} items={steps} />
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <div className="min-h-[500px]">
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderConnectionConfig()}
      </div>

      {/* 固定在底部的操作按钮 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        zIndex: 1000
      }}>
        {currentStep === 0 && (
          <>
            <Button 
              onClick={handleBack}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleNext}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              下一步
            </Button>
          </>
        )}
        {currentStep > 0 && (
          <Button 
            onClick={handlePrev}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            上一步
          </Button>
        )}
        {currentStep === 1 && (
          <Button 
            type="primary" 
            onClick={handleFinish} 
            loading={loading}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            完成创建
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddCrossMapConnection;