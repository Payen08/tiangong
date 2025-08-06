import React, { useState } from 'react';
import {
  Drawer,
  Steps,
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  message,
  Radio,
  Switch,
  InputNumber,
  Divider,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

// 值配置项接口
interface ValueConfigItem {
  id: string;
  value: string;
  description: string;
}

// 功能配置接口
interface FunctionConfig {
  name: string;
  identifier: string;
  functionType: '属性（静态）' | '属性（动态）' | '事件' | '服务';
  readWriteMode: '读写' | '只读';
  dataType: 'int' | 'float' | 'double' | 'text' | 'date' | 'bool' | 'enum' | 'struct' | 'array';
  valueConfig: ValueConfigItem[];
  // 配置映射相关字段
  isComposite: boolean; // 是否组合
  protocol: string; // 通信协议
  registerAddress?: string; // 寄存器地址（modbus-tcp协议时使用）
}

interface AddFunctionProps {
  visible: boolean;
  onClose: () => void;
  onSave: (functionData: FunctionConfig) => void;
  productProtocol?: string; // 产品的通信协议
}

const AddFunction: React.FC<AddFunctionProps> = ({ visible, onClose, onSave, productProtocol = 'modbus-tcp' }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataType, setDataType] = useState<string>('text');
  const [valueConfigItems, setValueConfigItems] = useState<ValueConfigItem[]>([]);
  
  // 配置映射相关状态
  const [isComposite, setIsComposite] = useState(false);
  const [registerAddress, setRegisterAddress] = useState('');
  const [functionName, setFunctionName] = useState(''); // 用于存储第一步的功能名称

  // 步骤配置
  const steps = [
    {
      title: '基本信息',
    },
    {
      title: '配置映射',
    },
  ];

  // 数据类型选项
  const dataTypeOptions = [
    { label: '整数', value: 'int' },
    { label: '浮点数', value: 'float' },
    { label: '双精度', value: 'double' },
    { label: '文本', value: 'text' },
    { label: '日期', value: 'date' },
    { label: '布尔', value: 'bool' },
    { label: '枚举', value: 'enum' },
    { label: '结构体', value: 'struct' },
    { label: '数组', value: 'array' },
  ];

  // 处理数据类型变化
  const handleDataTypeChange = (value: string) => {
    setDataType(value);
    
    // 根据数据类型初始化值配置
    if (value === 'bool') {
      setValueConfigItems([
        { id: '1', value: 'true', description: '' },
        { id: '2', value: 'false', description: '' },
      ]);
    } else if (value === 'enum') {
      setValueConfigItems([
        { id: '1', value: '', description: '' },
      ]);
    } else {
      setValueConfigItems([]);
    }
  };

  // 添加值配置项（仅枚举类型）
  const addValueConfigItem = () => {
    if (dataType === 'enum') {
      const newItem: ValueConfigItem = {
        id: Date.now().toString(),
        value: '',
        description: '',
      };
      setValueConfigItems([...valueConfigItems, newItem]);
    }
  };

  // 删除值配置项（仅枚举类型）
  const removeValueConfigItem = (id: string) => {
    if (dataType === 'enum' && valueConfigItems.length > 1) {
      setValueConfigItems(valueConfigItems.filter(item => item.id !== id));
    }
  };

  // 更新值配置项
  const updateValueConfigItem = (id: string, field: 'value' | 'description', value: string) => {
    setValueConfigItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // 下一步
  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setFunctionName(values.name || ''); // 保存功能名称
      setCurrentStep(1);
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完善基本信息');
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(0);
  };

  // 保存功能
  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      
      const functionData: FunctionConfig = {
        name: values.name,
        identifier: values.identifier,
        functionType: values.functionType,
        readWriteMode: values.readWriteMode,
        dataType: values.dataType,
        valueConfig: valueConfigItems.filter(item => item.value || item.description),
        // 配置映射数据
        isComposite: isComposite,
        protocol: productProtocol,
        registerAddress: !isComposite && productProtocol === 'modbus-tcp' ? registerAddress : undefined,
      };
      
      onSave(functionData);
      message.success('功能保存成功');
      handleClose();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 关闭抽屉
  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setDataType('text');
    setValueConfigItems([]);
    onClose();
  };

  // 渲染值配置区域
  const renderValueConfig = () => {
    if (dataType === 'bool') {
      return (
        <div>
          <Text strong>值配置</Text>
          <div style={{ marginTop: 8 }}>
            {valueConfigItems.map((item, index) => (
              <Row key={item.id} gutter={16} style={{ marginBottom: 8 }}>
                <Col span={6}>
                  <Input value={item.value} disabled />
                </Col>
                <Col span={18}>
                  <Input
                    placeholder="请输入值描述"
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateValueConfigItem(item.id, 'description', e.target.value)}
                  />
                </Col>
              </Row>
            ))}
          </div>
        </div>
      );
    }

    if (dataType === 'enum') {
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Text strong style={{ marginRight: 16 }}>值配置</Text>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addValueConfigItem}
              size="small"
            >
              添加配置项
            </Button>
          </div>
          <div>
            {valueConfigItems.map((item, index) => (
              <Row key={item.id} gutter={16} style={{ marginBottom: 8 }}>
                <Col span={5}>
                  <Input
                    placeholder="枚举值"
                    value={item.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateValueConfigItem(item.id, 'value', e.target.value)}
                  />
                </Col>
                <Col span={17}>
                  <Input
                    placeholder="请输入值描述"
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateValueConfigItem(item.id, 'description', e.target.value)}
                  />
                </Col>
                <Col span={2}>
                  {valueConfigItems.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeValueConfigItem(item.id)}
                      size="small"
                    />
                  )}
                </Col>
              </Row>
            ))}
          </div>
        </div>
      );
    }

    // 其他数据类型的值配置
    if (['int', 'float', 'double', 'text', 'date', 'struct', 'array'].includes(dataType)) {
      return (
        <Form.Item
          label="值配置"
          name="defaultValue"
        >
          {dataType === 'int' && <InputNumber placeholder="请输入默认整数值" style={{ width: '100%' }} />}
          {dataType === 'float' && <InputNumber placeholder="请输入默认浮点数值" step={0.1} style={{ width: '100%' }} />}
          {dataType === 'double' && <InputNumber placeholder="请输入默认双精度值" step={0.01} style={{ width: '100%' }} />}
          {dataType === 'text' && <Input placeholder="请输入默认文本值" />}
          {dataType === 'date' && <Input placeholder="请输入默认日期格式" />}
          {dataType === 'struct' && <Input.TextArea placeholder="请输入结构体配置" rows={3} />}
          {dataType === 'array' && <Input.TextArea placeholder="请输入数组配置" rows={3} />}
        </Form.Item>
      );
    }

    return null;
  };

  // 渲染基本信息步骤
  const renderBasicInfo = () => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        functionType: '属性（静态）',
        readWriteMode: '读写',
        dataType: 'text',
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="功能名称"
            name="name"
            rules={[{ required: true, message: '请输入功能名称' }]}
          >
            <Input placeholder="请输入功能名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="标识符"
            name="identifier"
            rules={[
              { required: true, message: '请输入标识符' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '标识符必须以字母开头，只能包含字母、数字和下划线' }
            ]}
          >
            <Input placeholder="请输入标识符" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="功能类型"
            name="functionType"
            rules={[{ required: true, message: '请选择功能类型' }]}
          >
            <Select placeholder="请选择功能类型">
              <Option value="属性（静态）">属性（静态）</Option>
              <Option value="属性（动态）">属性（动态）</Option>
              <Option value="事件">事件</Option>
              <Option value="服务">服务</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="读写方式"
            name="readWriteMode"
            rules={[{ required: true, message: '请选择读写方式' }]}
          >
            <Select placeholder="请选择读写方式">
              <Option value="读写">读写</Option>
              <Option value="只读">只读</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="数据类型"
            name="dataType"
            rules={[{ required: true, message: '请选择数据类型' }]}
          >
            <Select 
              placeholder="请选择数据类型" 
              onChange={handleDataTypeChange}
              value={dataType}
            >
              {dataTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider />
      
      {renderValueConfig()}
    </Form>
  );

  // 渲染配置映射步骤
  const renderConfigMapping = () => (
    <Form
      layout="vertical"
      initialValues={{
        isComposite: false,
        protocol: productProtocol,
        registerAddress: ''
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="是否组合"
            name="isComposite"
          >
            <Select 
              value={isComposite} 
              onChange={(value: boolean) => setIsComposite(value)}
              placeholder="请选择是否组合"
              style={{ width: '100%' }}
            >
              <Option value={false}>非组合</Option>
              <Option value={true}>组合</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="通信协议"
            name="protocol"
          >
            <Input 
              value={productProtocol} 
              disabled 
              placeholder="通信协议"
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>
        </Col>
      </Row>
      
      {!isComposite && productProtocol === 'modbus-tcp' && (
        <>
          <Divider orientation="left" style={{ margin: '16px 0' }}>地址映射</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="映射功能名称"
                name="mappingFunctionName"
              >
                <Input 
                  value={functionName}
                  disabled
                  placeholder="功能名称"
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="寄存器地址"
                name="registerAddress"
                rules={[{ required: true, message: '请输入寄存器地址' }]}
              >
                <Input 
                  placeholder="请输入寄存器地址"
                  value={registerAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterAddress(e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
      
      {isComposite && (
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ 
              padding: '20px', 
              background: '#f5f5f5', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <Text type="secondary">组合模式配置功能开发中...</Text>
            </div>
          </Col>
        </Row>
      )}
    </Form>
  );

  return (
    <Drawer
      title="添加功能"
      placement="right"
      width="66.67vw" // 占用屏幕的2/3
      onClose={handleClose}
      open={visible}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 步骤指示器 */}
        <div style={{ padding: '24px 24px 0' }}>
          <Steps current={currentStep} items={steps} />
        </div>

        {/* 主要内容区域 */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          <Card>
            {currentStep === 0 && renderBasicInfo()}
            {currentStep === 1 && renderConfigMapping()}
          </Card>
        </div>

        {/* 固定在底部的操作按钮 */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Space>
            <Button onClick={handleClose}>
              取消
            </Button>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            {currentStep === 0 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}
            {currentStep === 1 && (
              <Button type="primary" onClick={handleSave} loading={loading}>
                保存
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Drawer>
  );
};

export default AddFunction;