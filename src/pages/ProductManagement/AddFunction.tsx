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
  // 多寄存器组合相关字段
  registerMappings?: RegisterMapping[]; // 寄存器地址映射（多寄存器组合时使用）
  // 多引脚组合相关字段
  pinMappings?: PinMapping[]; // 引脚映射（多引脚组合时使用）
}

// 寄存器映射接口（用于多寄存器组合）
interface RegisterMapping {
  id: string;
  registerAddress: string; // 寄存器地址
  registerType: 'coil' | 'discrete-input' | 'input-register' | 'holding-register'; // 寄存器类型
  functionCode?: string; // 功能码
  dataType: string; // 数据类型
  byteOrder?: 'big-endian' | 'little-endian'; // 字节序
  description?: string; // 描述
}

// 引脚映射接口（用于墨影采集卡多引脚组合）
interface PinMapping {
  id: string;
  pinType: 'input' | 'output'; // 引脚类型
  pinNumber: string; // 引脚编号
  pinValue: string; // 引脚值
  description?: string; // 描述
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
  // Modbus协议相关字段
  registerAddress?: string; // 寄存器地址（modbus-tcp协议时使用）
  functionCode?: string; // 功能码（modbus-tcp协议时使用）
  modbusDataType?: string; // Modbus数据类型（modbus-tcp协议时使用）
  byteOrder?: 'big-endian' | 'little-endian' | ''; // 字节序（modbus-tcp协议时使用）
  registerType?: 'coil' | 'discrete-input' | 'input-register' | 'holding-register'; // 寄存器类型（modbus-tcp协议时使用）
  // HTTP协议相关字段
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // HTTP请求方法（http协议时使用）
  httpUrl?: string; // HTTP请求URL（http协议时使用）
  httpHeaders?: Record<string, string>; // HTTP请求头（http协议时使用）
  httpParams?: Record<string, string>; // HTTP请求参数（http协议时使用）
  httpDataPath?: string; // HTTP响应数据路径（http协议时使用）
  httpRequestBody?: string; // HTTP请求体（http协议时使用）
  // MQTT协议相关字段
  mqttTopic?: string; // MQTT主题（mqtt协议时使用）
  mqttQos?: 0 | 1 | 2; // MQTT服务质量等级（mqtt协议时使用）
  mqttRetain?: boolean; // MQTT保留消息（mqtt协议时使用）
  mqttDataPath?: string; // MQTT消息数据路径（mqtt协议时使用）
  mqttPayloadFormat?: 'json' | 'text' | 'binary'; // MQTT消息格式（mqtt协议时使用）
  mqttClientId?: string; // MQTT客户端ID（mqtt协议时使用）
  // 墨影采集卡协议相关字段
  moyingChannelType?: 'report' | 'control'; // 墨影采集卡通道类型（墨影采集卡协议时使用）
  moyingMacAddress?: string; // 墨影采集卡MAC地址（墨影采集卡协议时使用）
  moyingFunctionId?: string; // 墨影采集卡功能ID（墨影采集卡协议时使用）
  moyingPinType?: 'input' | 'output'; // 墨影采集卡引脚类型（墨影采集卡协议时使用）
  moyingPinNumber?: string; // 墨影采集卡引脚编号（墨影采集卡协议时使用）
  moyingPinValue?: string; // 墨影采集卡引脚值（墨影采集卡协议时使用）
  moyingDataPath?: string; // 墨影采集卡数据路径（墨影采集卡协议时使用）
  // 墨影机器人协议相关字段
  robotCommandType?: 'move' | 'action' | 'status' | 'config'; // 墨影机器人命令类型（墨影机器人协议时使用）
  robotDeviceId?: string; // 墨影机器人设备ID（墨影机器人协议时使用）
  robotActionId?: string; // 墨影机器人动作ID（墨影机器人协议时使用）
  robotParameterType?: 'position' | 'speed' | 'force' | 'sensor'; // 墨影机器人参数类型（墨影机器人协议时使用）
  robotDataFormat?: 'json' | 'binary' | 'text'; // 墨影机器人数据格式（墨影机器人协议时使用）
  robotDataPath?: string; // 墨影机器人数据路径（墨影机器人协议时使用）
  // 组合模式相关字段
  compositeType?: 'multi-register' | 'multi-pin'; // 组合类型
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
  const [valueConfigItems, setValueConfigItems] = useState<ValueConfigItem[]>([
    { id: '1', value: '', description: '默认值配置' }
  ]);
  
  // 配置映射相关状态
  const [isComposite, setIsComposite] = useState<boolean>(false);
  
  // Modbus协议相关状态
  const [registerAddress, setRegisterAddress] = useState<string>('');
  const [functionCode, setFunctionCode] = useState<string>('');
  const [modbusDataType, setModbusDataType] = useState<string>('');
  const [byteOrder, setByteOrder] = useState<'big-endian' | 'little-endian' | ''>('');
  const [registerType, setRegisterType] = useState<'coil' | 'discrete-input' | 'input-register' | 'holding-register'>('holding-register');
  
  // HTTP协议相关状态
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [httpUrl, setHttpUrl] = useState<string>('');
  const [httpHeaders, setHttpHeaders] = useState<Record<string, string>>({});
  const [httpParams, setHttpParams] = useState<Record<string, string>>({});
  const [httpDataPath, setHttpDataPath] = useState<string>('');
  
  // MQTT协议相关状态
  const [mqttTopic, setMqttTopic] = useState<string>('');
  const [mqttQos, setMqttQos] = useState<0 | 1 | 2>(0);
  const [mqttRetain, setMqttRetain] = useState<boolean>(false);
  const [mqttDataPath, setMqttDataPath] = useState<string>('');
  const [mqttPayloadFormat, setMqttPayloadFormat] = useState<'json' | 'text' | 'binary'>('json');
  const [mqttClientId, setMqttClientId] = useState<string>('');
  const [httpRequestBody, setHttpRequestBody] = useState<string>('');
  
  // 墨影采集卡协议相关状态
  const [moyingChannelType, setMoyingChannelType] = useState<'report' | 'control'>('report');
  const [moyingMacAddress, setMoyingMacAddress] = useState<string>('');
  const [moyingFunctionId, setMoyingFunctionId] = useState<string>('');
  const [moyingPinType, setMoyingPinType] = useState<'input' | 'output'>('input');
  const [moyingPinNumber, setMoyingPinNumber] = useState<string>('');
  const [moyingPinValue, setMoyingPinValue] = useState<string>('');
  const [moyingDataPath, setMoyingDataPath] = useState<string>('');
  
  // 墨影机器人协议相关状态
  const [robotCommandType, setRobotCommandType] = useState<'move' | 'action' | 'status' | 'config'>('move');
  const [robotDeviceId, setRobotDeviceId] = useState<string>('');
  const [robotActionId, setRobotActionId] = useState<string>('');
  const [robotParameterType, setRobotParameterType] = useState<'position' | 'speed' | 'force' | 'sensor'>('position');
  const [robotDataFormat, setRobotDataFormat] = useState<'json' | 'binary' | 'text'>('json');
  const [robotDataPath, setRobotDataPath] = useState<string>('');
  
  // 组合模式相关状态
  const [compositeType, setCompositeType] = useState<'multi-register' | 'multi-pin'>('multi-register');


  const [functionName, setFunctionName] = useState(''); // 用于存储第一步的功能名称
  const [currentFunctionType, setCurrentFunctionType] = useState<string>('属性（动态）'); // 当前选择的功能类型

  // 组件初始化时确保valueConfigItems正确设置
  useEffect(() => {
    if (!isEdit && dataType === 'text' && valueConfigItems.length === 0) {
      setValueConfigItems([{ id: '1', value: '', description: '默认值配置' }]);
    }
  }, [dataType, isEdit, valueConfigItems.length]);

  // 当协议为modbus_tcp时，检查并重置不支持的数据类型
  useEffect(() => {
    if (productProtocol === 'modbus_tcp' && dataType !== 'enum' && dataType !== 'bool') {
      // 重置为默认的枚举类型
      setDataType('enum');
      form.setFieldsValue({ dataType: 'enum' });
      // 重置值配置
      setValueConfigItems([
        { id: '1', value: '', description: '' },
      ]);
    }
    
    // 当协议为墨影采集卡时，检查并重置不支持的数据类型和功能类型
    if (productProtocol === '墨影采集卡') {
      if (dataType !== 'enum') {
        // 重置为枚举类型
        setDataType('enum');
        form.setFieldsValue({ dataType: 'enum' });
        // 重置值配置
        setValueConfigItems([
          { id: '1', value: '', description: '' },
        ]);
      }
      
      if (currentFunctionType !== '属性（动态）') {
        // 重置为属性（动态）
        setCurrentFunctionType('属性（动态）');
        form.setFieldsValue({ functionType: '属性（动态）' });
      }
    }
  }, [productProtocol, dataType, currentFunctionType, form]);

  // 添加寄存器映射项（用于多寄存器组合）
  const addRegisterMapping = (valueConfigItemId: string) => {
    const newMapping: RegisterMapping = {
      id: Date.now().toString(),
      registerAddress: '',
      registerType: 'holding-register',
      functionCode: '',
      dataType: 'uint16',
      byteOrder: 'big-endian',
      description: ''
    };
    
    setValueConfigItems(prev => prev.map(item => {
      if (item.id === valueConfigItemId) {
        return {
          ...item,
          registerMappings: [...(item.registerMappings || []), newMapping]
        };
      }
      return item;
    }));
  };

  // 添加引脚映射项（用于多引脚组合）
  const addPinMapping = (valueConfigItemId: string) => {
    const newMapping: PinMapping = {
      id: Date.now().toString(),
      pinType: 'output',
      pinNumber: '',
      pinValue: '',
      description: ''
    };
    
    setValueConfigItems(prev => prev.map(item => {
      if (item.id === valueConfigItemId) {
        return {
          ...item,
          pinMappings: [...(item.pinMappings || []), newMapping]
        };
      }
      return item;
    }));
  };

  // 删除寄存器映射项
  const removeRegisterMapping = (valueConfigItemId: string, mappingId: string) => {
    setValueConfigItems(prev => prev.map(item => {
      if (item.id === valueConfigItemId) {
        return {
          ...item,
          registerMappings: (item.registerMappings || []).filter(mapping => mapping.id !== mappingId)
        };
      }
      return item;
    }));
  };

  // 删除引脚映射项
  const removePinMapping = (valueConfigItemId: string, mappingId: string) => {
    setValueConfigItems(prev => prev.map(item => {
      if (item.id === valueConfigItemId) {
        return {
          ...item,
          pinMappings: (item.pinMappings || []).filter(mapping => mapping.id !== mappingId)
        };
      }
      return item;
    }));
  };

  // 更新寄存器映射项
  const updateRegisterMapping = (valueConfigItemId: string, mappingId: string, field: keyof RegisterMapping, value: any) => {
    setValueConfigItems(prev => prev.map(item => {
      if (item.id === valueConfigItemId) {
        return {
          ...item,
          registerMappings: (item.registerMappings || []).map(mapping => {
            if (mapping.id === mappingId) {
              // 如果更新的是寄存器类型，需要处理级联逻辑
              if (field === 'registerType') {
                const updatedMapping = { ...mapping, [field]: value };
                // 清空功能码，让用户重新选择
                updatedMapping.functionCode = '';
                // 根据寄存器类型设置数据类型和字节序
                if (value === 'coil' || value === 'discrete-input') {
                  updatedMapping.dataType = 'bit';
                  updatedMapping.byteOrder = undefined; // 线圈和离散量输入不需要字节序
                } else {
                  updatedMapping.dataType = 'uint16';
                  updatedMapping.byteOrder = undefined; // 清空字节序，让用户重新选择
                }
                return updatedMapping;
              }
              return { ...mapping, [field]: value };
            }
            return mapping;
          })
        };
      }
      return item;
    }));
  };

  // 更新引脚映射项
  const updatePinMapping = (valueConfigItemId: string, mappingId: string, field: keyof PinMapping, value: any) => {
    setValueConfigItems(prev => prev.map(item => {
      if (item.id === valueConfigItemId) {
        return {
          ...item,
          pinMappings: (item.pinMappings || []).map(mapping => {
            if (mapping.id === mappingId) {
              return { ...mapping, [field]: value };
            }
            return mapping;
          })
        };
      }
      return item;
    }));
  };

  // HTTP协议相关辅助函数
  // 添加HTTP请求头
  const addHttpHeader = () => {
    const newKey = `header_${Date.now()}`;
    setHttpHeaders(prev => ({ ...prev, [newKey]: '' }));
  };

  // 删除HTTP请求头
  const removeHttpHeader = (key: string) => {
    setHttpHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  // 更新HTTP请求头
  const updateHttpHeader = (oldKey: string, newKey: string, value: string) => {
    setHttpHeaders(prev => {
      const newHeaders = { ...prev };
      if (oldKey !== newKey) {
        delete newHeaders[oldKey];
      }
      newHeaders[newKey] = value;
      return newHeaders;
    });
  };

  // 添加HTTP请求参数
  const addHttpParam = () => {
    const newKey = `param_${Date.now()}`;
    setHttpParams(prev => ({ ...prev, [newKey]: '' }));
  };

  // 删除HTTP请求参数
  const removeHttpParam = (key: string) => {
    setHttpParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  };

  // 更新HTTP请求参数
  const updateHttpParam = (oldKey: string, newKey: string, value: string) => {
    setHttpParams(prev => {
      const newParams = { ...prev };
      if (oldKey !== newKey) {
        delete newParams[oldKey];
      }
      newParams[newKey] = value;
      return newParams;
    });
  };

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
        setCurrentFunctionType(editingFunction.functionType); // 设置当前功能类型
        setValueConfigItems(editingFunction.valueConfig || []);
        
        // 针对http、mqtt、墨影采集卡和墨影机器人协议的特殊处理
        if (productProtocol === 'http' || productProtocol === 'mqtt' || productProtocol === 'Mqtt' || productProtocol === '墨影采集卡' || productProtocol === '墨影机器人协议') {
          setIsComposite(false); // 强制设置为非组合
        } else {
          setIsComposite(editingFunction.isComposite || false);
        }
        
        setRegisterAddress(editingFunction.registerAddress || '');
        setFunctionCode(editingFunction.functionCode || '');
        setModbusDataType(editingFunction.modbusDataType || 'uint16');
        setByteOrder(editingFunction.byteOrder || '');
        setRegisterType(editingFunction.registerType || 'holding-register');
        setFunctionName(editingFunction.name);
        
        // 设置HTTP协议相关状态
        setHttpMethod(editingFunction.httpMethod || 'GET');
        setHttpUrl(editingFunction.httpUrl || '');
        setHttpHeaders(editingFunction.httpHeaders || {});
        setHttpParams(editingFunction.httpParams || {});
        setHttpDataPath(editingFunction.httpDataPath || '');
        setHttpRequestBody(editingFunction.httpRequestBody || '');
        
        // 设置MQTT协议相关状态
        setMqttTopic(editingFunction.mqttTopic || '');
        setMqttQos(editingFunction.mqttQos || 0);
        setMqttRetain(editingFunction.mqttRetain || false);
        setMqttDataPath(editingFunction.mqttDataPath || '');
        setMqttPayloadFormat(editingFunction.mqttPayloadFormat || 'json');
        setMqttClientId(editingFunction.mqttClientId || '');
        
        // 设置墨影采集卡协议相关状态
        setMoyingChannelType(editingFunction.moyingChannelType || 'report');
        setMoyingMacAddress(editingFunction.moyingMacAddress || '');
        setMoyingFunctionId(editingFunction.moyingFunctionId || '');
        setMoyingPinType(editingFunction.moyingPinType || 'input');
        setMoyingPinNumber(editingFunction.moyingPinNumber || '');
        setMoyingPinValue(editingFunction.moyingPinValue || '');
        setMoyingDataPath(editingFunction.moyingDataPath || '');
        
        // 设置墨影机器人协议相关状态
        setRobotCommandType(editingFunction.robotCommandType || 'move');
        setRobotDeviceId(editingFunction.robotDeviceId || '');
        setRobotActionId(editingFunction.robotActionId || '');
        setRobotParameterType(editingFunction.robotParameterType || 'position');
        setRobotDataFormat(editingFunction.robotDataFormat || 'json');
        setRobotDataPath(editingFunction.robotDataPath || '');
        
        // 设置组合模式相关状态
        setCompositeType(editingFunction.compositeType || 'multi-register');


        
        // 同步表单字段值，确保受控组件正确显示
        setTimeout(() => {
          form.setFieldsValue({
            registerAddress: editingFunction.registerAddress || '',
            registerType: editingFunction.registerType || 'holding-register',
            functionCode: editingFunction.functionCode || '',
            modbusDataType: editingFunction.modbusDataType || 'uint16',
            byteOrder: editingFunction.byteOrder || '',
            isComposite: (productProtocol === 'http' || productProtocol === 'mqtt' || productProtocol === 'Mqtt' || productProtocol === '墨影采集卡') ? false : (editingFunction.isComposite || false),
          });
        }, 0);
      } else {
        // 新增模式：重置表单并设置初始值
        form.resetFields();
        
        // 根据协议设置默认值
        const defaultDataType = productProtocol === '墨影采集卡' ? 'enum' : 'text';
        const defaultFunctionType = '属性（动态）';
        
        form.setFieldsValue({
          name: '',
          identifier: '',
          functionType: defaultFunctionType,
          readWriteMode: '读写',
          dataType: defaultDataType,
          functionCode: undefined, // 设置为undefined以显示placeholder
          byteOrder: undefined, // 设置为undefined以显示placeholder
        });
        // 重置所有状态
        setCurrentStep(0);
        setDataType(defaultDataType);
        setCurrentFunctionType(defaultFunctionType); // 设置当前功能类型为默认值
        
        // 如果是墨影采集卡协议，初始化一个枚举值配置项
        if (productProtocol === '墨影采集卡') {
          setValueConfigItems([
            { id: '1', value: '', description: '' },
          ]);
        } else {
          setValueConfigItems([]);
        }
        
        // 针对http、mqtt、墨影采集卡和墨影机器人协议的特殊处理：默认为非组合
        setIsComposite(false);
        
        setRegisterAddress('');
        setFunctionCode(''); // 清空功能码，显示placeholder
        setModbusDataType('uint16');
        setByteOrder(''); // 清空字节序，显示placeholder
        setRegisterType('holding-register');
        setFunctionName('');
        
        // 重置HTTP协议相关状态
        setHttpMethod('GET');
        setHttpUrl('');
        setHttpHeaders({});
        setHttpParams({});
        setHttpDataPath('');
        setHttpRequestBody('');
        
        // 重置MQTT协议相关状态
        setMqttTopic('');
        setMqttQos(0);
        setMqttRetain(false);
        setMqttDataPath('');
        setMqttPayloadFormat('json');
        setMqttClientId('');
        
        // 重置墨影采集卡协议相关状态
        setMoyingChannelType('report');
        setMoyingMacAddress('');
        setMoyingFunctionId('');
        setMoyingPinType('input');
        setMoyingPinNumber('');
        setMoyingDataPath('');
        
        // 重置墨影机器人协议相关状态
        setRobotCommandType('move');
        setRobotDeviceId('');
        setRobotActionId('');
        setRobotParameterType('position');
        setRobotDataFormat('json');
        setRobotDataPath('');
        
        // 重置组合模式相关状态
        const defaultCompositeType = productProtocol === '墨影采集卡' ? 'multi-pin' : 'multi-register';
        setCompositeType(defaultCompositeType);


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
  const getAllDataTypeOptions = () => [
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

  // 根据通讯协议过滤数据类型选项
  const getFilteredDataTypeOptions = () => {
    const allOptions = getAllDataTypeOptions();
    
    // 如果是modbus_tcp协议，只允许选择枚举和布尔
    if (productProtocol === 'modbus_tcp') {
      return allOptions.filter(option => 
        option.value === 'enum' || option.value === 'bool'
      );
    }
    
    // 如果是墨影采集卡协议，只允许选择枚举
    if (productProtocol === '墨影采集卡') {
      return allOptions.filter(option => 
        option.value === 'enum'
      );
    }
    
    // 其他协议返回所有选项
    return allOptions;
  };

  // 根据通讯协议过滤功能类型选项
  const getFilteredFunctionTypeOptions = () => {
    // 如果是墨影采集卡协议，只允许选择属性（动态）
    if (productProtocol === '墨影采集卡') {
      return [
        { label: '属性（动态）', value: '属性（动态）' }
      ];
    }
    
    // 其他协议返回所有选项
    return [
      { label: '属性（静态）', value: '属性（静态）' },
      { label: '属性（动态）', value: '属性（动态）' },
      { label: '事件', value: '事件' },
      { label: '服务', value: '服务' }
    ];
  };

  const dataTypeOptions = getFilteredDataTypeOptions();

  // 处理数据类型变化
  const handleDataTypeChange = (value: string) => {
    setDataType(value);
    
    // 根据数据类型初始化值配置
    if (value === 'bool') {
      setValueConfigItems([
        { id: '1', value: 'true', description: '' },
        { id: '2', value: 'false', description: '' },
      ]);
      
      // 如果是布尔类型且通讯协议是modbus_tcp，自动设置寄存器类型为线圈
      if (productProtocol === 'modbus_tcp') {
        setRegisterType('coil');
        // 清空功能码，让用户重新选择
        setFunctionCode('');
        form.setFieldsValue({ 
          registerType: 'coil',
          functionCode: undefined 
        });
        // 设置数据类型为bit
        setModbusDataType('bit');
        // 清空字节序（线圈不需要字节序）
        setByteOrder('');
        form.setFieldsValue({ 
          modbusDataType: 'bit',
          byteOrder: undefined 
        });
      }
    } else if (value === 'enum') {
      setValueConfigItems([
        { id: '1', value: '', description: '' },
      ]);
      
      // 如果是枚举类型且通讯协议是modbus_tcp，自动设置寄存器类型为保持寄存器
      if (productProtocol === 'modbus_tcp') {
        setRegisterType('holding-register');
        // 清空功能码，让用户重新选择
        setFunctionCode('');
        form.setFieldsValue({ 
          registerType: 'holding-register',
          functionCode: undefined 
        });
        // 设置数据类型为uint16
        setModbusDataType('uint16');
        // 清空字节序，让用户重新选择
        setByteOrder('');
        form.setFieldsValue({ 
          modbusDataType: 'uint16',
          byteOrder: undefined 
        });
      }
    } else {
      // 为其他数据类型初始化一个默认的值配置项，用于支持多寄存器映射
      setValueConfigItems([
        { id: '1', value: '', description: '默认值配置' },
      ]);
    }
  };

  // 添加值配置项（支持所有数据类型）
  const addValueConfigItem = () => {
    const newItem: ValueConfigItem = {
      id: Date.now().toString(),
      value: '',
      description: '',
    };
    setValueConfigItems([...valueConfigItems, newItem]);
  };

  // 删除值配置项（支持所有数据类型）
  const removeValueConfigItem = (id: string) => {
    if (valueConfigItems.length > 1) {
      setValueConfigItems(valueConfigItems.filter(item => item.id !== id));
    }
  };

  // 更新值配置项
  const updateValueConfigItem = (id: string, field: 'value' | 'description', value: string) => {
    // 如果是墨影采集卡协议且是枚举值字段，只允许输入自然数
    if (productProtocol === '墨影采集卡' && field === 'value') {
      // 只允许输入数字
      const numericValue = value.replace(/[^0-9]/g, '');
      setValueConfigItems(items =>
        items.map(item =>
          item.id === id ? { ...item, [field]: numericValue } : item
        )
      );
    } else {
      setValueConfigItems(items =>
        items.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    }
  };

  // 下一步
  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      console.log('handleNext - 表单验证通过，获取的值:', values);
      setFunctionName(values.name || ''); // 保存功能名称
      
      // 如果功能类型是属性（静态），直接保存，不进入配置映射页面
      if (values.functionType === '属性（静态）') {
        console.log('handleNext - 功能类型为属性（静态），直接保存');
        await handleSaveStaticProperty(values);
        return;
      }
      
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

  // 保存属性（静态）功能
  const handleSaveStaticProperty = async (values: any) => {
    setLoading(true);
    try {
      // 验证必填字段
      if (!values.name || !values.name.trim()) {
        message.error('请输入功能名称');
        setLoading(false);
        return;
      }
      if (!values.identifier || !values.identifier.trim()) {
        message.error('请输入标识符');
        setLoading(false);
        return;
      }
      if (!values.functionType) {
        message.error('请选择功能类型');
        setLoading(false);
        return;
      }
      if (!values.readWriteMode) {
        message.error('请选择读写方式');
        setLoading(false);
        return;
      }
      if (!values.dataType) {
        message.error('请选择数据类型');
        setLoading(false);
        return;
      }

      // 处理值配置数据
      const processedValueConfig = valueConfigItems
        .filter(item => item.value || item.description)
        .map(item => {
          // 属性（静态）不需要寄存器映射
          const { registerMappings, ...itemWithoutMappings } = item;
          return itemWithoutMappings;
        });

      const functionData: FunctionConfig = {
        name: values.name,
        identifier: values.identifier,
        functionType: values.functionType,
        readWriteMode: values.readWriteMode,
        dataType: values.dataType,
        valueConfig: processedValueConfig,
        // 属性（静态）的默认配置
        isComposite: false,
        protocol: productProtocol,
      };

      console.log('保存属性（静态）功能数据:', functionData);
      onSave(functionData);
      onClose();
      message.success(isEdit ? '功能更新成功' : '功能添加成功');
    } catch (error) {
      console.error('保存功能失败:', error);
      message.error('保存功能失败');
    } finally {
      setLoading(false);
    }
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
      
      // 验证第二步的必填字段
      if (productProtocol === 'modbus_tcp') {
        if (!isComposite) {
          // 非组合模式验证
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
        } else {
          // 组合模式验证
          if (!compositeType) {
            message.error('请选择组合类型');
            setLoading(false);
            return;
          }



          
          // 多寄存器组合模式下的寄存器映射验证（支持所有数据类型）
          if (compositeType === 'multi-register') {
            const hasInvalidMappings = valueConfigItems.some(item => {
              if (!item.registerMappings || item.registerMappings.length === 0) {
                return true; // 没有寄存器映射
              }
              return item.registerMappings.some(mapping => {
                // 基本字段验证
                if (!mapping.registerAddress || 
                    !mapping.registerType || 
                    !mapping.functionCode || 
                    !mapping.dataType) {
                  return true;
                }
                // 对于非线圈和非离散量输入类型，字节序是必填的
                if (mapping.registerType !== 'coil' && 
                    mapping.registerType !== 'discrete-input' && 
                    !mapping.byteOrder) {
                  return true;
                }
                return false;
              });
            });
            
            if (hasInvalidMappings) {
              message.error('多寄存器组合模式下，每个值配置项都必须配置完整的寄存器映射');
              setLoading(false);
              return;
            }
          }
          
          // 多引脚组合模式下的引脚映射验证
          if (compositeType === 'multi-pin') {
            const hasInvalidPinMappings = valueConfigItems.some(item => {
              if (!item.pinMappings || item.pinMappings.length === 0) {
                return true; // 没有引脚映射
              }
              return item.pinMappings.some(mapping => {
                // 基本字段验证
                if (!mapping.pinType || 
                    !mapping.pinNumber || 
                    !mapping.pinValue) {
                  return true;
                }
                return false;
              });
            });
            
            if (hasInvalidPinMappings) {
              message.error('多引脚组合模式下，每个值配置项都必须配置完整的引脚映射');
              setLoading(false);
              return;
            }
          }
        }
      }
      
      // 验证墨影采集卡协议的必填字段
      if (productProtocol === '墨影采集卡' && !isComposite) {
        if (!moyingPinNumber || !moyingPinNumber.trim()) {
          message.error('请输入引脚编号');
          setLoading(false);
          return;
        }
        if (!moyingPinValue || !moyingPinValue.trim()) {
          message.error('请输入引脚值');
          setLoading(false);
          return;
        }
      }
      
      // 处理值配置数据，确保组合模式下包含相应的映射数据
      const processedValueConfig = valueConfigItems
        .filter(item => item.value || item.description)
        .map(item => {
          // 多寄存器组合模式下，确保包含寄存器映射数据
          if (isComposite && compositeType === 'multi-register') {
            const { pinMappings, ...itemWithoutPinMappings } = item;
            return {
              ...itemWithoutPinMappings,
              registerMappings: item.registerMappings || []
            };
          }
          // 多引脚组合模式下，确保包含引脚映射数据
          if (isComposite && compositeType === 'multi-pin') {
            const { registerMappings, ...itemWithoutRegisterMappings } = item;
            return {
              ...itemWithoutRegisterMappings,
              pinMappings: item.pinMappings || []
            };
          }
          // 非组合模式，移除所有映射字段
          const { registerMappings, pinMappings, ...itemWithoutMappings } = item;
          return itemWithoutMappings;
        });

      const functionData: FunctionConfig = {
        name: finalName,
        identifier: allValues.identifier,
        functionType: allValues.functionType,
        readWriteMode: allValues.readWriteMode,
        dataType: allValues.dataType,
        valueConfig: processedValueConfig,
        // 配置映射数据
        isComposite: isComposite,
        protocol: productProtocol,
        // 根据协议类型添加相应的配置字段
        ...(productProtocol === 'modbus_tcp' ? (
          isComposite ? {
            // Modbus组合模式字段
            compositeType,
          } : {
            // Modbus非组合模式字段
            registerAddress,
            functionCode: functionCode || undefined,
            modbusDataType,
            byteOrder: byteOrder || undefined,
            registerType
          }
        ) : {}),
        ...(productProtocol === 'http' ? {
          // HTTP协议字段
          httpMethod,
          httpUrl,
          httpHeaders: Object.keys(httpHeaders).length > 0 ? httpHeaders : undefined,
          httpParams: Object.keys(httpParams).length > 0 ? httpParams : undefined,
          httpDataPath: httpDataPath || undefined,
          httpRequestBody: httpRequestBody || undefined,
        } : {}),
        ...(productProtocol === 'mqtt' || productProtocol === 'Mqtt' ? {
          // MQTT协议字段
          mqttTopic,
          mqttQos,
          mqttRetain,
          mqttDataPath: mqttDataPath || undefined,
          mqttPayloadFormat,
          mqttClientId: mqttClientId || undefined,
        } : {}),
        ...(productProtocol === '墨影采集卡' ? {
          // 墨影采集卡协议字段
          moyingChannelType,
          moyingMacAddress: moyingMacAddress || undefined,
          moyingFunctionId: moyingFunctionId || undefined,
          moyingPinType,
          moyingPinNumber: moyingPinNumber || undefined,
          moyingPinValue: moyingPinValue || undefined,
          moyingDataPath: moyingDataPath || undefined,
        } : {}),
        ...(productProtocol === '墨影机器人协议' ? {
          // 墨影机器人协议字段
          robotCommandType,
          robotDeviceId: robotDeviceId || undefined,
          robotActionId: robotActionId || undefined,
          robotParameterType,
          robotDataFormat,
          robotDataPath: robotDataPath || undefined,
        } : {})
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
            {valueConfigItems.map((item) => (
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
            {valueConfigItems.map((item) => (
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

    // 其他数据类型的值配置（固定显示，不支持添加/删除）
    if (['int', 'float', 'double', 'text', 'date', 'struct', 'array'].includes(dataType)) {
      return (
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>值配置</Text>
          <div>
            {valueConfigItems.map((item) => (
              <Row key={item.id} gutter={16} style={{ marginBottom: 8 }}>
                <Col xs={8} sm={6} md={5} lg={5} xl={5}>
                  <Input
                    placeholder={`${dataType === 'int' ? '整数值' : dataType === 'float' ? '浮点数值' : dataType === 'double' ? '双精度值' : dataType === 'text' ? '文本值' : dataType === 'date' ? '日期值' : dataType === 'struct' ? '结构体值' : '数组值'}`}
                    value={item.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateValueConfigItem(item.id, 'value', e.target.value)}
                  />
                </Col>
                <Col xs={16} sm={18} md={19} lg={19} xl={19}>
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
        functionType: '属性（动态）',
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
            <Select 
              placeholder="请选择功能类型"
              onChange={(value: string) => setCurrentFunctionType(value)}
            >
              {getFilteredFunctionTypeOptions().map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
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
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
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
    // 多寄存器组合模式下的值配置（支持所有数据类型）
    if (isComposite && compositeType === 'multi-register') {
      return (
        <Form.Item label="值配置与寄存器映射">
          <div>
            {valueConfigItems.map((item) => (
              <div key={item.id} style={{ marginBottom: 16, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12 }}>
                {/* 值配置基本信息 */}
                <Row gutter={16} style={{ marginBottom: 8 }}>
                  <Col span={6}>
                    <Text strong>值：</Text>
                    <Input value={item.value} disabled style={{ backgroundColor: '#f5f5f5', marginTop: 4 }} />
                  </Col>
                  <Col span={18}>
                    <Text strong>描述：</Text>
                    <Input value={item.description} disabled style={{ backgroundColor: '#f5f5f5', marginTop: 4 }} />
                  </Col>
                </Row>
                
                {/* 寄存器映射配置 */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong style={{ marginRight: 16 }}>寄存器映射：</Text>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addRegisterMapping(item.id)}
                      size="small"
                    >
                      添加寄存器
                    </Button>
                  </div>
                  
                  {(item.registerMappings || []).map((mapping) => (
                    <div key={mapping.id} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      <Row gutter={8}>
                        <Col span={5}>
                          <Text type="secondary" style={{ fontSize: 12 }}>寄存器地址</Text>
                          <Input
                             placeholder="如：0x0001"
                             value={mapping.registerAddress}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRegisterMapping(item.id, mapping.id, 'registerAddress', e.target.value)}
                             size="small"
                           />
                        </Col>
                        <Col span={4}>
                          <Text type="secondary" style={{ fontSize: 12 }}>寄存器类型</Text>
                          <Select
                             value={mapping.registerType}
                             onChange={(value: string) => {
                               updateRegisterMapping(item.id, mapping.id, 'registerType', value);
                               // 清空功能码，让用户重新选择
                               updateRegisterMapping(item.id, mapping.id, 'functionCode', '');
                             }}
                             size="small"
                             style={{ width: '100%' }}
                           >
                            {/* 当数据类型为bool时，只显示线圈和离散输入选项 */}
                            {dataType === 'bool' && (
                              <>
                                <Option value="coil">线圈</Option>
                                <Option value="discrete-input">离散量输入</Option>
                              </>
                            )}
                            {/* 当数据类型为enum时，只显示输入寄存器和保持寄存器选项 */}
                            {dataType === 'enum' && (
                              <>
                                <Option value="input-register">输入寄存器</Option>
                                <Option value="holding-register">保持寄存器</Option>
                              </>
                            )}
                            {/* 当数据类型为其他类型时，显示所有选项 */}
                            {dataType !== 'bool' && dataType !== 'enum' && (
                              <>
                                <Option value="coil">线圈</Option>
                                <Option value="discrete-input">离散量输入</Option>
                                <Option value="input-register">输入寄存器</Option>
                                <Option value="holding-register">保持寄存器</Option>
                              </>
                            )}
                          </Select>
                        </Col>
                        <Col span={5}>
                          <Text type="secondary" style={{ fontSize: 12 }}>功能码</Text>
                          <Select
                             value={mapping.functionCode}
                             onChange={(value: string) => updateRegisterMapping(item.id, mapping.id, 'functionCode', value)}
                             size="small"
                             style={{ width: '100%' }}
                             placeholder={mapping.registerType ? "请选择功能码" : "请先选择寄存器类型"}
                             disabled={!mapping.registerType}
                           >
                            {mapping.registerType && getFunctionCodeOptions(mapping.registerType as 'coil' | 'discrete-input' | 'input-register' | 'holding-register').map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Col>
                        <Col span={4}>
                          <Text type="secondary" style={{ fontSize: 12 }}>数据类型</Text>
                          <Select
                             value={mapping.dataType}
                             onChange={(value: string) => updateRegisterMapping(item.id, mapping.id, 'dataType', value)}
                             size="small"
                             style={{ width: '100%' }}
                             disabled={mapping.registerType === 'coil' || mapping.registerType === 'discrete-input'}
                           >
                            {mapping.registerType === 'coil' || mapping.registerType === 'discrete-input' ? (
                              <Option value="bit">Bit</Option>
                            ) : (
                              <>
                                <Option value="uint16">UInt16</Option>
                                <Option value="int16">Int16</Option>
                                <Option value="uint32">UInt32</Option>
                                <Option value="int32">Int32</Option>
                                <Option value="float32">Float32</Option>
                              </>
                            )}
                          </Select>
                        </Col>
                        {mapping.registerType !== 'coil' && mapping.registerType !== 'discrete-input' && (
                          <Col span={4}>
                            <Text type="secondary" style={{ fontSize: 12 }}>字节序</Text>
                            <Select
                               value={mapping.byteOrder}
                               onChange={(value: string) => updateRegisterMapping(item.id, mapping.id, 'byteOrder', value)}
                               size="small"
                               style={{ width: '100%' }}
                               placeholder="请选择字节序"
                             >
                              <Option value="big-endian">大端序</Option>
                              <Option value="little-endian">小端序</Option>
                            </Select>
                          </Col>
                        )}
                        <Col span={1}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeRegisterMapping(item.id, mapping.id)}
                            size="small"
                            style={{ marginTop: 16 }}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                  
                  {(!item.registerMappings || item.registerMappings.length === 0) && (
                    <div style={{ textAlign: 'center', color: '#999', padding: 16, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      暂无寄存器映射，点击上方按钮添加
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Form.Item>
      );
    }

    // 多引脚组合模式下的值配置（墨影采集卡协议）
    if (isComposite && compositeType === 'multi-pin') {
      return (
        <Form.Item label="值配置与采集卡映射">
          <div>
            {valueConfigItems.map((item) => (
              <div key={item.id} style={{ marginBottom: 16, border: '1px solid #d9d9d9', borderRadius: 6, padding: 12 }}>
                {/* 值配置基本信息 */}
                <Row gutter={16} style={{ marginBottom: 8 }}>
                  <Col span={6}>
                    <Text strong>值：</Text>
                    <Input value={item.value} disabled style={{ backgroundColor: '#f5f5f5', marginTop: 4 }} />
                  </Col>
                  <Col span={18}>
                    <Text strong>描述：</Text>
                    <Input value={item.description} disabled style={{ backgroundColor: '#f5f5f5', marginTop: 4 }} />
                  </Col>
                </Row>
                
                {/* 引脚映射配置 */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong style={{ marginRight: 16 }}>采集卡映射：</Text>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addPinMapping(item.id)}
                      size="small"
                    >
                      添加引脚
                    </Button>
                  </div>
                  
                  {(item.pinMappings || []).map((mapping) => (
                    <div key={mapping.id} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      <Row gutter={8}>
                        <Col span={8}>
                          <Text type="secondary" style={{ fontSize: 12 }}>引脚类型</Text>
                          <Select
                             value={mapping.pinType}
                             onChange={(value: 'input' | 'output') => updatePinMapping(item.id, mapping.id, 'pinType', value)}
                             size="small"
                             style={{ width: '100%' }}
                           >
                            <Option value="input">输入类型</Option>
                            <Option value="output">输出类型</Option>
                          </Select>
                        </Col>
                        <Col span={7}>
                          <Text type="secondary" style={{ fontSize: 12 }}>引脚编号</Text>
                          <Input
                             placeholder="请输入自然数"
                             value={mapping.pinNumber}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                               const value = e.target.value;
                               // 只允许输入自然数
                               if (/^\d*$/.test(value)) {
                                 updatePinMapping(item.id, mapping.id, 'pinNumber', value);
                               }
                             }}
                             size="small"
                           />
                        </Col>
                        <Col span={7}>
                          <Text type="secondary" style={{ fontSize: 12 }}>引脚值</Text>
                          <Input
                             placeholder="请输入自然数"
                             value={mapping.pinValue}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                               const value = e.target.value;
                               // 只允许输入自然数
                               if (/^\d*$/.test(value)) {
                                 updatePinMapping(item.id, mapping.id, 'pinValue', value);
                               }
                             }}
                             size="small"
                           />
                        </Col>
                        <Col span={2}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removePinMapping(item.id, mapping.id)}
                            size="small"
                            style={{ marginTop: 16 }}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                  
                  {(!item.pinMappings || item.pinMappings.length === 0) && (
                    <div style={{ textAlign: 'center', color: '#999', padding: 16, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      暂无引脚映射，点击上方按钮添加
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Form.Item>
      );
    }

    // 非多寄存器组合模式下的值配置（原有逻辑）
    if (dataType === 'bool') {
      return (
        <Form.Item label="值配置">
          <div>
            {valueConfigItems.map((item) => (
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
            {valueConfigItems.map((item) => (
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

    return null;
  };

  // 渲染配置映射步骤
  const renderConfigMapping = () => {
    // 根据数据类型动态设置默认的寄存器类型
    const getDefaultRegisterType = () => {
      if (dataType === 'bool' && productProtocol === 'modbus_tcp') {
        return 'coil';
      }
      if (dataType === 'enum' && productProtocol === 'modbus_tcp') {
        return 'holding-register';
      }
      return 'holding-register';
    };

    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isComposite: false,
          protocol: productProtocol,
          registerAddress: '',
          registerType: getDefaultRegisterType(),
          functionCode: undefined,
          modbusDataType: dataType === 'bool' ? 'bit' : 'uint16',
          byteOrder: undefined
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
              label="通讯协议"
              name="protocol"
            >
              <Input 
                value={productProtocol} 
                disabled 
                placeholder="通讯协议"
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>
          </Col>
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
                disabled={productProtocol === 'http' || productProtocol === 'mqtt' || productProtocol === 'Mqtt'}
              >
                <Option value={false}>非组合</Option>
                <Option value={true}>组合</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {!isComposite && productProtocol === 'modbus_tcp' && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0' }}>Modbus地址映射</Divider>
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
                    {/* 当数据类型为bool时，只显示线圈和离散输入选项 */}
                    {dataType === 'bool' && (
                      <>
                        <Option value="coil">线圈（Coil）</Option>
                        <Option value="discrete-input">离散量输入（Discrete Input）</Option>
                      </>
                    )}
                    {/* 当数据类型为enum时，只显示输入寄存器和保持寄存器选项 */}
                    {dataType === 'enum' && (
                      <>
                        <Option value="input-register">输入寄存器（Input Register）</Option>
                        <Option value="holding-register">保持寄存器（Holding Register）</Option>
                      </>
                    )}
                    {/* 当数据类型为其他类型时，显示所有选项 */}
                    {dataType !== 'bool' && dataType !== 'enum' && (
                      <>
                        <Option value="coil">线圈（Coil）</Option>
                        <Option value="discrete-input">离散量输入（Discrete Input）</Option>
                        <Option value="input-register">输入寄存器（Input Register）</Option>
                        <Option value="holding-register">保持寄存器（Holding Register）</Option>
                      </>
                    )}
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
                    placeholder={registerType ? "请选择功能码" : "请先选择寄存器类型"}
                    disabled={!registerType}
                  >
                    {registerType && getFunctionCodeOptions(registerType).map(option => (
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
            
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {renderReadOnlyValueConfig()}
              </Col>
            </Row>
          </>
        )}

        {!isComposite && productProtocol === 'http' && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0' }}>HTTP接口映射</Divider>
            <Row gutter={[16, 16]}>
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
                  label="请求方法"
                  name="httpMethod"
                  rules={[{ required: true, message: '请选择HTTP请求方法' }]}
                >
                  <Select 
                    value={httpMethod}
                    onChange={(value: 'GET' | 'POST' | 'PUT' | 'DELETE') => setHttpMethod(value)}
                    placeholder="请选择HTTP请求方法"
                  >
                    <Option value="GET">GET</Option>
                    <Option value="POST">POST</Option>
                    <Option value="PUT">PUT</Option>
                    <Option value="DELETE">DELETE</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Form.Item
                  label="请求URL"
                  name="httpUrl"
                  rules={[{ required: true, message: '请输入HTTP请求URL' }]}
                >
                  <Input 
                    placeholder="请输入完整的HTTP请求URL（如：http://api.example.com/data）"
                    value={httpUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHttpUrl(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Form.Item
                  label="响应数据路径"
                  name="httpDataPath"
                >
                  <Input 
                    placeholder="JSON路径（如：data.temperature）"
                    value={httpDataPath}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHttpDataPath(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            {(httpMethod === 'POST' || httpMethod === 'PUT') && (
              <Row>
                <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                  <Form.Item
                    label="请求体"
                    name="httpRequestBody"
                  >
                    <Input.TextArea 
                      placeholder="请输入请求体"
                      value={httpRequestBody}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHttpRequestBody(e.target.value)}
                      rows={4}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            {/* HTTP请求头配置 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>请求头配置</span>
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<PlusOutlined />} 
                  onClick={addHttpHeader}
                >
                  添加请求头
                </Button>
              </div>
              {Object.entries(httpHeaders).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Input
                    placeholder="请求头名称"
                    value={key.startsWith('header_') ? '' : key}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHttpHeader(key, e.target.value, value)}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="请求头值"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHttpHeader(key, key, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeHttpHeader(key)}
                  />
                </div>
              ))}
            </div>
            
            {/* HTTP请求参数配置 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>请求参数配置</span>
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<PlusOutlined />} 
                  onClick={addHttpParam}
                >
                  添加参数
                </Button>
              </div>
              {Object.entries(httpParams).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Input
                    placeholder="参数名称"
                    value={key.startsWith('param_') ? '' : key}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHttpParam(key, e.target.value, value)}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="参数值"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHttpParam(key, key, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeHttpParam(key)}
                  />
                </div>
              ))}
            </div>
            
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {renderReadOnlyValueConfig()}
              </Col>
            </Row>
          </>
        )}
        
        {!isComposite && (productProtocol === 'mqtt' || productProtocol === 'Mqtt') && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0' }}>MQTT消息映射</Divider>
            <Row gutter={[16, 16]}>
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
                  label="MQTT主题"
                  name="mqttTopic"
                  rules={[{ required: true, message: '请输入MQTT主题' }]}
                >
                  <Input 
                    placeholder="请输入MQTT主题（如：device/sensor/temperature）"
                    value={mqttTopic}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMqttTopic(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="服务质量等级"
                  name="mqttQos"
                >
                  <Select 
                    value={mqttQos}
                    onChange={(value: 0 | 1 | 2) => setMqttQos(value)}
                    placeholder="请选择QoS等级"
                  >
                    <Option value={0}>QoS 0 - 最多一次</Option>
                    <Option value={1}>QoS 1 - 至少一次</Option>
                    <Option value={2}>QoS 2 - 恰好一次</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="消息格式"
                  name="mqttPayloadFormat"
                >
                  <Select 
                    value={mqttPayloadFormat}
                    onChange={(value: 'json' | 'text' | 'binary') => setMqttPayloadFormat(value)}
                    placeholder="请选择消息格式"
                  >
                    <Option value="json">JSON</Option>
                    <Option value="text">文本</Option>
                    <Option value="binary">二进制</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Form.Item
                  label="保留消息"
                  name="mqttRetain"
                >
                  <Select 
                    value={mqttRetain}
                    onChange={(value: boolean) => setMqttRetain(value)}
                    placeholder="请选择是否保留消息"
                  >
                    <Option value={true}>是</Option>
                    <Option value={false}>否</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="消息数据路径"
                  name="mqttDataPath"
                >
                  <Input 
                    placeholder="JSON路径（如：data.value）"
                    value={mqttDataPath}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMqttDataPath(e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="客户端ID"
                  name="mqttClientId"
                >
                  <Input 
                    placeholder="MQTT客户端ID（可选）"
                    value={mqttClientId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMqttClientId(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {renderReadOnlyValueConfig()}
              </Col>
            </Row>
          </>
        )}
        
        {!isComposite && productProtocol === '墨影采集卡' && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0' }}>墨影采集卡协议映射</Divider>
            <Row gutter={[16, 16]}>
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
              {!isComposite && (
                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                  <Form.Item
                    label="引脚编号"
                    name="moyingPinNumber"
                    rules={[{ required: true, message: '请输入引脚编号' }]}
                  >
                    <Input 
                      placeholder="请输入引脚编号（自然数）"
                      value={moyingPinNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setMoyingPinNumber(value);
                      }}
                    />
                  </Form.Item>
                </Col>
              )}
              {isComposite && (
                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                  <Form.Item
                    label="通道类型"
                    name="moyingChannelType"
                    rules={[{ required: true, message: '请选择通道类型' }]}
                  >
                    <Select 
                      value={moyingChannelType}
                      onChange={(value: 'report' | 'control') => setMoyingChannelType(value)}
                      placeholder="请选择通道类型"
                    >
                      <Option value="report">上报通道</Option>
                      <Option value="control">控制通道</Option>
                    </Select>
                  </Form.Item>
                </Col>
              )}
            </Row>
            
            {isComposite && (
              <>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Form.Item
                      label="MAC地址"
                      name="moyingMacAddress"
                    >
                      <Input 
                        placeholder="请输入MAC地址（如：AA:BB:CC:DD:EE:FF）"
                        value={moyingMacAddress}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoyingMacAddress(e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Form.Item
                      label="功能ID"
                      name="moyingFunctionId"
                    >
                      <Input 
                        placeholder="请输入功能ID"
                        value={moyingFunctionId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoyingFunctionId(e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Form.Item
                      label="引脚类型"
                      name="moyingPinType"
                      rules={[{ required: true, message: '请选择引脚类型' }]}
                    >
                      <Select 
                        value={moyingPinType}
                        onChange={(value: 'input' | 'output') => setMoyingPinType(value)}
                        placeholder="请选择引脚类型"
                      >
                        <Option value="input">输入类型</Option>
                        <Option value="output">输出类型</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                    <Form.Item
                      label="引脚编号"
                      name="moyingPinNumber"
                    >
                      <Input 
                        placeholder="请输入引脚编号（自然数）"
                        value={moyingPinNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setMoyingPinNumber(value);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                    <Form.Item
                      label="数据路径"
                      name="moyingDataPath"
                    >
                      <Input 
                        placeholder="数据路径（如：data.value）"
                        value={moyingDataPath}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoyingDataPath(e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
            
            {!isComposite && (
              <>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                    <Form.Item
                      label="引脚类型"
                      name="moyingPinType"
                      rules={[{ required: true, message: '请选择引脚类型' }]}
                    >
                      <Select 
                        value={moyingPinType}
                        onChange={(value: 'input' | 'output') => setMoyingPinType(value)}
                        placeholder="请选择引脚类型"
                        defaultValue="input"
                      >
                        <Option value="input">输入类型</Option>
                        <Option value="output">输出类型</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
            
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {renderReadOnlyValueConfig()}
              </Col>
            </Row>
          </>
        )}
        
        {!isComposite && productProtocol === '墨影机器人协议' && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0' }}>墨影机器人协议映射</Divider>
            <Row gutter={[16, 16]}>
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
                  label="命令类型"
                  name="robotCommandType"
                  rules={[{ required: true, message: '请选择命令类型' }]}
                >
                  <Select 
                    value={robotCommandType}
                    onChange={(value: 'move' | 'action' | 'status' | 'config') => setRobotCommandType(value)}
                    placeholder="请选择命令类型"
                  >
                    <Option value="move">移动命令</Option>
                    <Option value="action">动作命令</Option>
                    <Option value="status">状态查询</Option>
                    <Option value="config">配置命令</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="设备ID"
                  name="robotDeviceId"
                >
                  <Input 
                    placeholder="请输入设备ID"
                    value={robotDeviceId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotDeviceId(e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="动作ID"
                  name="robotActionId"
                >
                  <Input 
                    placeholder="请输入动作ID"
                    value={robotActionId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotActionId(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="参数类型"
                  name="robotParameterType"
                  rules={[{ required: true, message: '请选择参数类型' }]}
                >
                  <Select 
                    value={robotParameterType}
                    onChange={(value: 'position' | 'speed' | 'force' | 'sensor') => setRobotParameterType(value)}
                    placeholder="请选择参数类型"
                  >
                    <Option value="position">位置参数</Option>
                    <Option value="speed">速度参数</Option>
                    <Option value="force">力度参数</Option>
                    <Option value="sensor">传感器参数</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="数据格式"
                  name="robotDataFormat"
                  rules={[{ required: true, message: '请选择数据格式' }]}
                >
                  <Select 
                    value={robotDataFormat}
                    onChange={(value: 'json' | 'binary' | 'text') => setRobotDataFormat(value)}
                    placeholder="请选择数据格式"
                  >
                    <Option value="json">JSON格式</Option>
                    <Option value="binary">二进制格式</Option>
                    <Option value="text">文本格式</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Form.Item
                  label="数据路径"
                  name="robotDataPath"
                >
                  <Input 
                    placeholder="数据路径（如：data.position.x）"
                    value={robotDataPath}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRobotDataPath(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {renderReadOnlyValueConfig()}
              </Col>
            </Row>
          </>
        )}
        
        {isComposite && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0' }}>组合模式配置</Divider>
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
                  label="组合类型"
                  name="compositeType"
                  rules={[{ required: true, message: '请选择组合类型' }]}
                >
                  <Select placeholder="请选择组合类型">
                    {productProtocol === 'modbus_tcp' && (
                      <Option value="multi-register">多寄存器组合</Option>
                    )}
                    {productProtocol === '墨影采集卡' && (
                      <Option value="multi-pin">多引脚组合</Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {renderReadOnlyValueConfig()}
              </Col>
            </Row>
          </>
        )}
      </Form>
    );
  };

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
            <Button 
              onClick={handleClose}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              取消
            </Button>
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
            {currentStep === 0 && currentFunctionType === '属性（静态）' && (
              <Button 
                type="primary" 
                onClick={handleNext} 
                loading={loading}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                保存
              </Button>
            )}
            {currentStep === 0 && currentFunctionType !== '属性（静态）' && (
              <Button 
                type="primary" 
                onClick={handleNext}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                下一步
              </Button>
            )}
            {currentStep === 1 && (
              <Button 
                type="primary" 
                onClick={handleSave} 
                loading={loading}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
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