import React, { useState, useEffect } from 'react';
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
  functionCode?: string; // 功能码（modbus-tcp协议时使用）
  modbusDataType?: string; // Modbus数据类型（modbus-tcp协议时使用）
  byteOrder?: 'big-endian' | 'little-endian' | ''; // 字节序（modbus-tcp协议时使用）
  registerType?: 'coil' | 'discrete-input' | 'input-register' | 'holding-register'; // 寄存器类型（modbus-tcp协议时使用）
}

interface AddFunctionProps {
  visible: boolean;
  onClose: () => void;
  onSave: (functionData: FunctionConfig) => void;
  productProtocol?: string; // 产品的通信协议
  editingFunction?: FunctionConfig; // 编辑的功能数据
  isEdit?: boolean; // 是否为编辑模式
}

const AddFunction: React.FC<AddFunctionProps> = ({ visible, onClose, onSave, productProtocol = 'modbus_tcp', editingFunction, isEdit = false }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataType, setDataType] = useState<string>('text');
  const [valueConfigItems, setValueConfigItems] = useState<ValueConfigItem[]>([]);
  
  // 配置映射相关状态
  const [isComposite, setIsComposite] = useState(false);
  const [registerAddress, setRegisterAddress] = useState('');
  const [functionCode, setFunctionCode] = useState(''); // 去掉默认值
  const [modbusDataType, setModbusDataType] = useState<string>('uint16');
  const [byteOrder, setByteOrder] = useState<'big-endian' | 'little-endian' | ''>(''); // 去掉默认值
  const [registerType, setRegisterType] = useState<'coil' | 'discrete-input' | 'input-register' | 'holding-register'>('holding-register');
  const [functionName, setFunctionName] = useState(''); // 用于存储第一步的功能名称

  // 初始化时确保默认值的联动
  useEffect(() => {
    // 确保初始的寄存器类型和功能码匹配
    const availableFunctionCodes = getFunctionCodeOptions(registerType);
    if (!availableFunctionCodes.some(option => option.value === functionCode)) {
      const defaultFunctionCode = availableFunctionCodes[0]?.value || '03';
      setFunctionCode(defaultFunctionCode);
    }
  }, []); // 只在组件挂载时执行一次

  // 当抽屉打开时重置表单或填充编辑数据
  useEffect(() => {
    if (visible) {
      if (isEdit && editingFunction) {
        // 编辑模式：填充现有数据
        form.setFieldsValue({
          name: editingFunction.name,
          identifier: editingFunction.identifier,
          functionType: editingFunction.functionType,
          readWriteMode: editingFunction.readWriteMode,
          dataType: editingFunction.dataType,
          functionCode: editingFunction.functionCode,
          byteOrder: editingFunction.byteOrder,
          mappingFunctionName: editingFunction.name,
        });
        // 设置状态
        setCurrentStep(0);
        setDataType(editingFunction.dataType);
        setValueConfigItems(editingFunction.valueConfig || []);
        setIsComposite(editingFunction.isComposite || false);
        setRegisterAddress(editingFunction.registerAddress || '');
        setFunctionCode(editingFunction.functionCode || '');
        setModbusDataType(editingFunction.modbusDataType || 'uint16');
        setByteOrder(editingFunction.byteOrder || '');
        setRegisterType(editingFunction.registerType || 'holding-register');
        setFunctionName(editingFunction.name);
        
        // 同步表单字段值，确保受控组件正确显示
        setTimeout(() => {
          form.setFieldsValue({
            registerAddress: editingFunction.registerAddress || '',
            registerType: editingFunction.registerType || 'holding-register',
            functionCode: editingFunction.functionCode || '',
            modbusDataType: editingFunction.modbusDataType || 'uint16',
            byteOrder: editingFunction.byteOrder || '',
            isComposite: editingFunction.isComposite || false,
          });
        }, 0);
      } else {
        // 新增模式：重置表单并设置初始值
        form.resetFields();
        form.setFieldsValue({
          name: '',
          identifier: '',
          functionType: '属性（静态）',
          readWriteMode: '读写',
          dataType: 'text',
          functionCode: undefined, // 设置为undefined以显示placeholder
          byteOrder: undefined, // 设置为undefined以显示placeholder
        });
        // 重置所有状态
        setCurrentStep(0);
        setDataType('text');
        setValueConfigItems([]);
        setIsComposite(false);
        setRegisterAddress('');
        setFunctionCode(''); // 清空功能码，显示placeholder
        setModbusDataType('uint16');
        setByteOrder(''); // 清空字节序，显示placeholder
        setRegisterType('holding-register');
        setFunctionName('');
      }
    }
  }, [visible, form, isEdit, editingFunction]);

  // 监听步骤变化，确保映射功能名称字段正确显示
  useEffect(() => {
    if (currentStep === 1 && functionName) {
      // 当进入第二步且有功能名称时，设置映射功能名称
      form.setFieldsValue({
        mappingFunctionName: functionName
      });
      console.log('设置映射功能名称:', functionName);
    }
  }, [currentStep, functionName, form]);

  // 根据寄存器类型获取可用的功能码选项
  const getFunctionCodeOptions = (registerType: 'coil' | 'discrete-input' | 'input-register' | 'holding-register') => {
    switch (registerType) {
      case 'coil':
        return [
          { value: '01', label: '01 - 读线圈' },
          { value: '05', label: '05 - 写单个线圈' },
          { value: '0F', label: '0F - 写多个线圈' },
        ];
      case 'discrete-input':
        return [
          { value: '02', label: '02 - 读离散量输入' },
        ];
      case 'input-register':
        return [
          { value: '04', label: '04 - 读输入寄存器' },
        ];
      case 'holding-register':
        return [
          { value: '03', label: '03 - 读保持寄存器' },
          { value: '06', label: '06 - 写单个寄存器' },
          { value: '10', label: '10 - 写多个寄存器' },
        ];
      default:
        return [
          { value: '03', label: '03 - 读保持寄存器' },
        ];
    }
  };

  // 获取Modbus数据类型选项
  const getModbusDataTypeOptions = () => {
    return [
      { value: 'bit', label: 'Bit（位）' },
      { value: 'uint16', label: 'UInt16（无符号16位整数）' },
      { value: 'int16', label: 'Int16（有符号16位整数）' },
      { value: 'uint32', label: 'UInt32（无符号32位整数）' },
      { value: 'int32', label: 'Int32（有符号32位整数）' },
      { value: 'float32', label: 'Float32（32位浮点数）' },
      { value: 'uint64', label: 'UInt64（无符号64位整数）' },
      { value: 'int64', label: 'Int64（有符号64位整数）' },
      { value: 'float64', label: 'Float64（64位浮点数）' },
      { value: 'string', label: 'String（字符串）' },
      { value: 'bytes', label: 'Bytes（字节数组）' },
    ];
  };

  // 根据寄存器类型自动设置功能码
  const handleRegisterTypeChange = (value: 'coil' | 'discrete-input' | 'input-register' | 'holding-register') => {
    setRegisterType(value);
    // 清空功能码，让用户手动选择，显示placeholder
    setFunctionCode('');
    form.setFieldsValue({ functionCode: undefined });
    
    // 根据寄存器类型自动设置默认数据类型
    if (value === 'coil' || value === 'discrete-input') {
      setModbusDataType('bit');
      // 线圈和离散量输入不需要字节序，清空字节序设置
      setByteOrder(''); // 清空字节序，显示placeholder
      form.setFieldsValue({ byteOrder: undefined });
    } else {
      setModbusDataType('uint16');
      // 清空字节序，让用户手动选择，显示placeholder
      setByteOrder('');
      form.setFieldsValue({ byteOrder: undefined });
    }
  };

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
      console.log('handleNext - 表单验证通过，获取的值:', values);
      setFunctionName(values.name || ''); // 保存功能名称
      
      // 恢复第二步的表单数据（如果之前有填写过）
      const allValues = form.getFieldsValue();
      form.setFieldsValue({
        // 保持第一步的数据
        name: values.name,
        identifier: values.identifier,
        functionType: values.functionType,
        readWriteMode: values.readWriteMode,
        dataType: values.dataType,
        // 设置第二步的数据
        mappingFunctionName: values.name || '',
        registerAddress: allValues.registerAddress || registerAddress,
        functionCode: allValues.functionCode || functionCode || undefined,
        modbusDataType: allValues.modbusDataType || modbusDataType,
        byteOrder: allValues.byteOrder || byteOrder || undefined,
        registerType: allValues.registerType || registerType,
        isComposite: allValues.isComposite !== undefined ? allValues.isComposite : isComposite
      });
      
      console.log('handleNext - 设置映射功能名称:', values.name);
      console.log('handleNext - 保存第一步数据到隐藏字段:', {
        name: values.name,
        identifier: values.identifier,
        functionType: values.functionType,
        readWriteMode: values.readWriteMode,
        dataType: values.dataType
      });
      console.log('handleNext - 恢复第二步数据:', {
        registerAddress: allValues.registerAddress || registerAddress,
        functionCode: allValues.functionCode || functionCode,
        modbusDataType: allValues.modbusDataType || modbusDataType,
        byteOrder: allValues.byteOrder || byteOrder,
        registerType: allValues.registerType || registerType,
        isComposite: allValues.isComposite !== undefined ? allValues.isComposite : isComposite
      });
      
      setCurrentStep(1);
      console.log('handleNext - 切换到步骤1');
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完善基本信息');
    }
  };

  // 上一步
  const handlePrev = () => {
    // 从第二步返回第一步时，确保表单数据正确显示
    const allValues = form.getFieldsValue();
    console.log('handlePrev - 当前表单所有值:', allValues);
    
    // 确保第一步的数据正确显示（从隐藏字段恢复）
    const firstStepData = {
      name: allValues.name || functionName,
      identifier: allValues.identifier,
      functionType: allValues.functionType,
      readWriteMode: allValues.readWriteMode,
      dataType: allValues.dataType
    };
    
    // 保存第二步的状态数据到表单中，确保数据不丢失
    form.setFieldsValue({
      ...firstStepData,
      registerAddress: registerAddress,
      functionCode: functionCode || undefined,
      modbusDataType: modbusDataType,
      byteOrder: byteOrder || undefined,
      registerType: registerType,
      isComposite: isComposite
    });
    
    console.log('handlePrev - 恢复第一步数据:', firstStepData);
    console.log('handlePrev - 保存第二步状态数据:', {
      registerAddress,
      functionCode,
      modbusDataType,
      byteOrder,
      registerType,
      isComposite
    });
    
    setCurrentStep(0);
  };

  // 保存功能
  const handleSave = async () => {
    setLoading(true);
    try {
      // 获取表单的所有字段值，包括未渲染的字段
      const allValues = form.getFieldsValue();
      console.log('表单所有字段值:', allValues); // 添加调试日志
      
      // 验证必填字段 - 优先使用functionName状态，其次使用表单值
      const finalName = functionName || allValues.name;
      if (!finalName || !finalName.trim()) {
        message.error('请输入功能名称');
        setLoading(false);
        return;
      }
      if (!allValues.identifier || !allValues.identifier.trim()) {
        message.error('请输入标识符');
        setLoading(false);
        return;
      }
      if (!allValues.functionType) {
        message.error('请选择功能类型');
        setLoading(false);
        return;
      }
      if (!allValues.readWriteMode) {
        message.error('请选择读写方式');
        setLoading(false);
        return;
      }
      if (!allValues.dataType) {
        message.error('请选择数据类型');
        setLoading(false);
        return;
      }
      
      // 验证第二步的必填字段（非组合模式下的modbus_tcp协议）
      if (!isComposite && productProtocol === 'modbus_tcp') {
        if (!registerAddress || !registerAddress.trim()) {
          message.error('请输入寄存器地址');
          setLoading(false);
          return;
        }
        if (!functionCode) {
          message.error('请选择功能码');
          setLoading(false);
          return;
        }
        // 对于非线圈和非离散量输入类型，字节序是必填的
        if (registerType !== 'coil' && registerType !== 'discrete-input' && !byteOrder) {
          message.error('请选择字节序');
          setLoading(false);
          return;
        }
      }
      
      const functionData: FunctionConfig = {
        name: finalName,
        identifier: allValues.identifier,
        functionType: allValues.functionType,
        readWriteMode: allValues.readWriteMode,
        dataType: allValues.dataType,
        valueConfig: valueConfigItems.filter(item => item.value || item.description),
        // 配置映射数据
        isComposite: isComposite,
        protocol: productProtocol,
        registerAddress: !isComposite && productProtocol === 'modbus_tcp' ? registerAddress : undefined,
        functionCode: !isComposite && productProtocol === 'modbus_tcp' && functionCode ? functionCode : undefined,
        modbusDataType: !isComposite && productProtocol === 'modbus_tcp' ? modbusDataType : undefined,
        byteOrder: !isComposite && productProtocol === 'modbus_tcp' && byteOrder ? byteOrder : undefined,
        registerType: !isComposite && productProtocol === 'modbus_tcp' ? registerType : undefined,
      };
      
      console.log('准备保存功能数据:', functionData); // 添加调试日志
      onSave(functionData);
      console.log('onSave回调已调用'); // 添加调试日志
      
      // 延迟关闭抽屉，确保父组件有时间处理数据
      setTimeout(() => {
        message.success('功能保存成功');
        handleClose();
      }, 100);
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 关闭抽屉
  const handleClose = () => {
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
                <Col xs={8} sm={6} md={6} lg={6} xl={6}>
                  <Input value={item.value} disabled />
                </Col>
                <Col xs={16} sm={18} md={18} lg={18} xl={18}>
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
                <Col xs={8} sm={6} md={5} lg={5} xl={5}>
                  <Input
                    placeholder="枚举值"
                    value={item.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateValueConfigItem(item.id, 'value', e.target.value)}
                  />
                </Col>
                <Col xs={12} sm={15} md={17} lg={17} xl={17}>
                  <Input
                    placeholder="请输入值描述"
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateValueConfigItem(item.id, 'description', e.target.value)}
                  />
                </Col>
                <Col xs={4} sm={3} md={2} lg={2} xl={2}>
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
        name: '',
        identifier: '',
        functionType: '属性（静态）',
        readWriteMode: '读写',
        dataType: 'text',
      }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Form.Item
            label="功能名称"
            name="name"
            rules={[{ required: true, message: '请输入功能名称' }]}
          >
            <Input 
              placeholder="请输入功能名称" 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newName = e.target.value;
                console.log('功能名称输入变化:', newName);
                setFunctionName(newName);
                // 实时更新映射功能名称字段
                form.setFieldsValue({
                  mappingFunctionName: newName
                });
                console.log('设置映射功能名称字段:', newName);
                console.log('当前表单字段值:', form.getFieldsValue());
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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

  // 渲染只读值配置（用于配置映射页面）
  const renderReadOnlyValueConfig = () => {
    if (dataType === 'bool') {
      return (
        <Form.Item label="值配置">
          <div>
            {valueConfigItems.map((item, index) => (
              <Row key={item.id} gutter={16} style={{ marginBottom: 8 }}>
                <Col span={8}>
                  <Input value={item.value} disabled style={{ backgroundColor: '#f5f5f5' }} />
                </Col>
                <Col span={16}>
                  <Input
                    value={item.description}
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </Col>
              </Row>
            ))}
          </div>
        </Form.Item>
      );
    }

    if (dataType === 'enum') {
      return (
        <Form.Item label="值配置">
          <div>
            {valueConfigItems.map((item, index) => (
              <Row key={item.id} gutter={16} style={{ marginBottom: 8 }}>
                <Col span={8}>
                  <Input
                    value={item.value}
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </Col>
                <Col span={16}>
                  <Input
                    value={item.description}
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </Col>
              </Row>
            ))}
          </div>
        </Form.Item>
      );
    }

    // 其他数据类型的值配置
    if (['int', 'float', 'double', 'text', 'date', 'struct', 'array'].includes(dataType)) {
      const getDefaultValue = () => {
        const formValues = form.getFieldsValue();
        return formValues.defaultValue || '';
      };

      return (
        <Form.Item label="值配置">
          <Input 
            value={getDefaultValue()}
            disabled
            style={{ backgroundColor: '#f5f5f5' }}
            placeholder="无默认值配置"
          />
        </Form.Item>
      );
    }

    return (
      <Form.Item label="值配置">
        <Input 
          value=""
          disabled
          style={{ backgroundColor: '#f5f5f5' }}
          placeholder="无值配置"
        />
      </Form.Item>
    );
  };

  // 渲染配置映射步骤
  const renderConfigMapping = () => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        isComposite: false,
        protocol: productProtocol,
        registerAddress: '',
        registerType: 'holding-register',
        functionCode: undefined, // 设置为undefined以显示placeholder
        modbusDataType: 'uint16',
        byteOrder: undefined // 设置为undefined以显示placeholder
      }}
    >
      {/* 隐藏字段保存第一步的数据 */}
      <Form.Item name="name" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name="identifier" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name="functionType" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name="readWriteMode" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name="dataType" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
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
      
      {!isComposite && productProtocol === 'modbus_tcp' && (
        <>
          <Divider orientation="left" style={{ margin: '16px 0' }}>地址映射</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="映射功能名称"
                name="mappingFunctionName"
              >
                <Input 
                  disabled
                  placeholder="功能名称"
                  style={{ backgroundColor: '#f5f5f5' }}
                  value={functionName}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="寄存器地址"
                name="registerAddress"
                rules={[{ required: true, message: '请输入寄存器地址' }]}
              >
                <Input 
                  placeholder="请输入寄存器地址（如：0x0000）"
                  value={registerAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterAddress(e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
              {renderReadOnlyValueConfig()}
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="寄存器类型"
                name="registerType"
                rules={[{ required: true, message: '请选择寄存器类型' }]}
              >
                <Select 
                  value={registerType}
                  onChange={handleRegisterTypeChange}
                  placeholder="请选择寄存器类型"
                >
                  <Option value="coil">线圈（Coil）</Option>
                  <Option value="discrete-input">离散量输入（Discrete Input）</Option>
                  <Option value="input-register">输入寄存器（Input Register）</Option>
                  <Option value="holding-register">保持寄存器（Holding Register）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="功能码"
                name="functionCode"
                rules={[{ required: true, message: '请选择功能码' }]}
              >
                <Select 
                  value={functionCode}
                  onChange={(value: string) => setFunctionCode(value)}
                  placeholder="请选择功能码"
                >
                  {getFunctionCodeOptions(registerType).map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} sm={24} md={registerType === 'coil' || registerType === 'discrete-input' ? 24 : 12} lg={registerType === 'coil' || registerType === 'discrete-input' ? 24 : 12} xl={registerType === 'coil' || registerType === 'discrete-input' ? 24 : 12}>
              <Form.Item
                label="数据类型"
                name="modbusDataType"
                rules={[{ required: true, message: '请选择数据类型' }]}
              >
                <Select 
                  value={modbusDataType}
                  onChange={(value: string) => setModbusDataType(value)}
                  placeholder="请选择数据类型"
                  disabled={registerType === 'coil' || registerType === 'discrete-input'}
                >
                  {registerType === 'coil' || registerType === 'discrete-input' ? (
                    <Option value="bit">Bit（位）</Option>
                  ) : (
                    getModbusDataTypeOptions().filter(option => option.value !== 'bit').map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))
                  )}
                </Select>
              </Form.Item>
            </Col>
            {registerType !== 'coil' && registerType !== 'discrete-input' && (
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="字节序"
                  name="byteOrder"
                  rules={[{ required: true, message: '请选择字节序' }]}
                >
                  <Select 
                    value={byteOrder}
                    onChange={(value: 'big-endian' | 'little-endian') => setByteOrder(value)}
                    placeholder="请选择字节序"
                  >
                    <Option value="big-endian">大端序（Big Endian）</Option>
                    <Option value="little-endian">小端序（Little Endian）</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
          
          {/* 数据处理相关字段 */}

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
      title={isEdit ? "编辑功能" : "添加功能"}
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