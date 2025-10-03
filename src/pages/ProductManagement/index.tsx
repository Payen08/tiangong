import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Row,
  Col,
  Tooltip,
  Modal,
  Form,
  message,
  Dropdown,
  Drawer,
} from 'antd';
import AddProduct from './AddProduct';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MoreOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface ProductFunction {
  id: string;
  name: string;
  identifier: string;
  functionType: '属性（静态）' | '属性（动态）' | '服务' | '事件';
  readWriteMode?: '读写' | '只读';
  dataType?: string;
  valueConfig: string;
  isComposite?: boolean;
  compositeType?: 'multi-register' | 'multi-pin'; // 组合类型
  protocol?: string;
  registerAddress?: string;
  functionCode?: string;
  modbusDataType?: string;
  byteOrder?: 'big-endian' | 'little-endian' | '';
  registerType?: 'coil' | 'discrete-input' | 'input-register' | 'holding-register';
  // 墨影采集卡协议相关字段
  moyingChannelType?: 'report' | 'control';
  moyingMacAddress?: string;
  moyingFunctionId?: string;
  moyingPinType?: 'input' | 'output';
  moyingPinNumber?: string;
  moyingPinValue?: string;
  moyingDataPath?: string;
}

interface Product {
  id: string;
  productName: string;
  productKey: string;
  productType: string;
  protocol: string;
  deviceCount: number;
  updateTime: string;
  updatedBy: string;
  functions?: ProductFunction[];
}

// 内部表单组件，确保useForm只在Modal可见时才被创建
const ProductForm = React.forwardRef<
  { validateAndSubmit: () => Promise<void> },
  {
    editingProduct: Product | null,
    onFinish: (values: any) => void,
    loading: boolean
  }
>(({ editingProduct, onFinish }, ref) => {
  const [form] = Form.useForm();

  // 当编辑产品变化时，设置表单值
  React.useEffect(() => {
    if (editingProduct) {
      form.setFieldsValue({
        productName: editingProduct.productName,
        productKey: editingProduct.productKey,
        productType: editingProduct.productType,
        protocol: editingProduct.protocol,
      });
    } else {
      form.resetFields();
    }
  }, [editingProduct, form]);

  // 暴露表单验证和提交方法给父组件
  React.useImperativeHandle(ref, () => ({
    validateAndSubmit: async () => {
      try {
        const values = await form.validateFields();
        onFinish(values);
      } catch (error) {
        // 开发环境下输出调试信息，Ant Design会自动显示表单验证错误
        if (process.env.NODE_ENV === 'development') {
          console.error('表单验证失败:', error);
        }
        throw error;
      }
    }
  }));

  // 产品类型选项
  const productTypes = ['机器人产品', '生产产品', '电梯产品', '自动门产品', '虚拟产品'];
  const protocols = ['Mqtt', 'http', 'Modbus', '墨影采集卡'];

  return (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Form.Item
            label="产品名称"
            name="productName"
            rules={[
              { required: true, message: '请输入产品名称' },
              { max: 50, message: '产品名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Form.Item
            label="产品Key"
            name="productKey"
            rules={[
              { required: true, message: '请输入产品Key' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '产品Key只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="请输入产品Key" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Form.Item
            label="产品类型"
            name="productType"
            rules={[{ required: true, message: '请选择产品类型' }]}
          >
            <Select placeholder="请选择产品类型">
              {productTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Form.Item
            label="通讯协议"
            name="protocol"
            rules={[{ required: true, message: '请选择通讯协议' }]}
          >
            <Select placeholder="请选择通讯协议">
              {protocols.map((protocol) => (
                <Option key={protocol} value={protocol}>
                  {protocol}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
   );
 });

const ProductManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const productFormRef = React.useRef<any>(null);

  // 模拟数据
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      productName: '智能温度传感器',
      productKey: 'temp_sensor_001',
      productType: '机器人产品',
      protocol: 'Mqtt',
      deviceCount: 156,
      updateTime: '2024-01-15 14:30:25',
      updatedBy: '张三',
      functions: [
        {
          id: '1',
          name: '温度',
          identifier: 'temperature',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: 'Mqtt',
          registerAddress: '0x0001',
          functionCode: '03',
          modbusDataType: 'float32',
          byteOrder: 'big-endian',
          registerType: 'input-register',
        },
        {
          id: '2',
          name: '湿度',
          identifier: 'humidity',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: 'Mqtt',
          registerAddress: '0x0002',
          functionCode: '03',
          modbusDataType: 'float32',
          byteOrder: 'big-endian',
          registerType: 'input-register',
        },
      ],
    },
    {
      id: '2',
      productName: '智能门锁',
      productKey: 'smart_lock_002',
      productType: '生产产品',
      protocol: 'http',
      deviceCount: 89,
      updateTime: '2024-01-14 09:15:10',
      updatedBy: '李四',
      functions: [
        {
          id: '3',
          name: '门锁状态',
          identifier: 'lock_status',
          functionType: '属性（静态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '0:关闭;1:开启',
          isComposite: false,
          protocol: 'http',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
    {
      id: '3',
      productName: '环境监测仪',
      productKey: 'env_monitor_003',
      productType: '虚拟产品',
      protocol: 'modbus_tcp',
      deviceCount: 234,
      updateTime: '2024-01-13 16:45:33',
      updatedBy: '王五',
      functions: [
        {
          id: '4',
          name: 'PM2.5',
          identifier: 'pm25',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'int',
          valueConfig: '',
          isComposite: false,
          protocol: 'modbus_tcp',
          registerAddress: '0x0010',
          functionCode: '04',
          modbusDataType: 'uint16',
          byteOrder: 'big-endian',
          registerType: 'input-register',
        },
        {
          id: '5',
          name: '报警事件',
          identifier: 'alarm_event',
          functionType: '事件',
          readWriteMode: '只读',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: 'modbus_tcp',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
        {
          id: '5a',
          name: '环境状态',
          identifier: 'env_status',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"正常","registerMappings":[{"id":"1","registerAddress":"0x0020","registerType":"input-register","functionCode":"04","dataType":"uint16","byteOrder":"big-endian","description":"温度寄存器"},{"id":"2","registerAddress":"0x0021","registerType":"input-register","functionCode":"04","dataType":"uint16","byteOrder":"big-endian","description":"湿度寄存器"}]},{"id":"2","value":"1","description":"警告","registerMappings":[{"id":"3","registerAddress":"0x0020","registerType":"input-register","functionCode":"04","dataType":"uint16","byteOrder":"big-endian","description":"温度寄存器"},{"id":"4","registerAddress":"0x0021","registerType":"input-register","functionCode":"04","dataType":"uint16","byteOrder":"big-endian","description":"湿度寄存器"}]},{"id":"3","value":"2","description":"异常","registerMappings":[{"id":"5","registerAddress":"0x0020","registerType":"input-register","functionCode":"04","dataType":"uint16","byteOrder":"big-endian","description":"温度寄存器"},{"id":"6","registerAddress":"0x0021","registerType":"input-register","functionCode":"04","dataType":"uint16","byteOrder":"big-endian","description":"湿度寄存器"}]}]',
          isComposite: true,
          compositeType: 'multi-register',
          protocol: 'modbus_tcp',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
      ],
    },
    {
      id: '4',
      productName: 'CNC加工中心',
      productKey: 'cnc_machining_center_001',
      productType: '生产产品',
      protocol: '墨影采集卡',
      deviceCount: 12,
      updateTime: '2024-01-16 10:20:15',
      updatedBy: '赵六',
      functions: [
        {
          id: '6',
          name: '主轴转速',
          identifier: 'spindle_speed',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'int',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影采集卡',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '7',
          name: '切削液压力',
          identifier: 'coolant_pressure',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影采集卡',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '8',
          name: '设备状态',
          identifier: 'machine_status',
          functionType: '属性（静态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '0:停机;1:运行;2:故障;3:维护',
          isComposite: false,
          protocol: '墨影采集卡',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
        {
          id: '9',
          name: '故障报警',
          identifier: 'fault_alarm',
          functionType: '事件',
          readWriteMode: '只读',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影采集卡',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
    {
      id: '5',
      productName: 'CNC数控车床',
      productKey: 'cnc_lathe_002',
      productType: '生产产品',
      protocol: '墨影采集卡',
      deviceCount: 8,
      updateTime: '2024-01-16 11:35:42',
      updatedBy: '孙七',
      functions: [
        {
          id: '10',
          name: '主轴负载',
          identifier: 'spindle_load',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"停止"},{"id":"2","value":"1","description":"低负载"},{"id":"3","value":"2","description":"中负载"},{"id":"4","value":"3","description":"高负载"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'report',
          moyingMacAddress: 'AA:BB:CC:DD:EE:01',
          moyingFunctionId: 'spindle_load_001',
          moyingPinType: 'input',
          moyingPinNumber: '1',
          moyingPinValue: '',
          moyingDataPath: 'data.spindle.load',
        },
        {
          id: '11',
          name: '进给速度',
          identifier: 'feed_rate',
          functionType: '属性（动态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"停止"},{"id":"2","value":"1","description":"低速"},{"id":"3","value":"2","description":"中速"},{"id":"4","value":"3","description":"高速"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'control',
          moyingMacAddress: 'AA:BB:CC:DD:EE:01',
          moyingFunctionId: 'feed_rate_001',
          moyingPinType: 'output',
          moyingPinNumber: '2',
          moyingPinValue: '',
          moyingDataPath: 'data.feed.rate',
        },
        {
          id: '11a',
          name: '多引脚状态监控',
          identifier: 'multi_pin_status',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"正常","pinMappings":[{"id":"1","pinType":"input","pinNumber":"1","pinValue":"0","description":"状态引脚1"},{"id":"2","pinType":"input","pinNumber":"2","pinValue":"0","description":"状态引脚2"}]},{"id":"2","value":"1","description":"警告","pinMappings":[{"id":"3","pinType":"input","pinNumber":"1","pinValue":"1","description":"状态引脚1"},{"id":"4","pinType":"input","pinNumber":"2","pinValue":"0","description":"状态引脚2"}]},{"id":"3","value":"2","description":"故障","pinMappings":[{"id":"5","pinType":"input","pinNumber":"1","pinValue":"1","description":"状态引脚1"},{"id":"6","pinType":"input","pinNumber":"2","pinValue":"1","description":"状态引脚2"}]}]',
          isComposite: true,
          compositeType: 'multi-pin',
          protocol: '墨影采集卡',
          moyingChannelType: 'report',
          moyingMacAddress: 'AA:BB:CC:DD:EE:01',
          moyingFunctionId: 'multi_pin_status_001',
          moyingDataPath: 'data.status.multi',
        },
        {
          id: '12',
          name: '刀具磨损',
          identifier: 'tool_wear',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"正常"},{"id":"2","value":"1","description":"轻微磨损"},{"id":"3","value":"2","description":"中度磨损"},{"id":"4","value":"3","description":"严重磨损"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'report',
          moyingMacAddress: 'AA:BB:CC:DD:EE:01',
          moyingFunctionId: 'tool_wear_001',
          moyingPinType: 'input',
          moyingPinNumber: '3',
          moyingPinValue: '',
          moyingDataPath: 'data.tool.wear',
        },
      ],
    },
    {
      id: '6',
      productName: 'CNC铣床',
      productKey: 'cnc_milling_003',
      productType: '生产产品',
      protocol: '墨影采集卡',
      deviceCount: 6,
      updateTime: '2024-01-16 13:15:28',
      updatedBy: '周八',
      functions: [
        {
          id: '13',
          name: 'X轴位置',
          identifier: 'x_axis_position',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"原点位置"},{"id":"2","value":"1","description":"工作位置1"},{"id":"3","value":"2","description":"工作位置2"},{"id":"4","value":"3","description":"极限位置"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'report',
          moyingMacAddress: 'AA:BB:CC:DD:EE:02',
          moyingFunctionId: 'x_axis_pos_001',
          moyingPinType: 'input',
          moyingPinNumber: '4',
          moyingPinValue: '',
          moyingDataPath: 'data.axis.x.position',
        },
        {
          id: '14',
          name: 'Y轴位置',
          identifier: 'y_axis_position',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"原点位置"},{"id":"2","value":"1","description":"工作位置1"},{"id":"3","value":"2","description":"工作位置2"},{"id":"4","value":"3","description":"极限位置"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'report',
          moyingMacAddress: 'AA:BB:CC:DD:EE:02',
          moyingFunctionId: 'y_axis_pos_001',
          moyingPinType: 'input',
          moyingPinNumber: '5',
          moyingPinValue: '',
          moyingDataPath: 'data.axis.y.position',
        },
        {
          id: '15',
          name: 'Z轴位置',
          identifier: 'z_axis_position',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"原点位置"},{"id":"2","value":"1","description":"工作位置1"},{"id":"3","value":"2","description":"工作位置2"},{"id":"4","value":"3","description":"极限位置"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'report',
          moyingMacAddress: 'AA:BB:CC:DD:EE:02',
          moyingFunctionId: 'z_axis_pos_001',
          moyingPinType: 'input',
          moyingPinNumber: '6',
          moyingPinValue: '',
          moyingDataPath: 'data.axis.z.position',
        },
        {
          id: '16',
          name: '加工程序',
          identifier: 'machining_program',
          functionType: '属性（动态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '[{"id":"1","value":"0","description":"停止"},{"id":"2","value":"1","description":"程序1"},{"id":"3","value":"2","description":"程序2"},{"id":"4","value":"3","description":"程序3"}]',
          isComposite: false,
          protocol: '墨影采集卡',
          moyingChannelType: 'control',
          moyingMacAddress: 'AA:BB:CC:DD:EE:02',
          moyingFunctionId: 'machining_prog_001',
          moyingPinType: 'output',
          moyingPinNumber: '7',
          moyingPinValue: '',
          moyingDataPath: 'data.machining.program',
        },
      ],
    },
    {
      id: '7',
      productName: 'AGV自动导引车',
      productKey: 'agv_robot_001',
      productType: '机器人产品',
      protocol: '墨影机器人',
      deviceCount: 5,
      updateTime: '2024-01-16 14:25:18',
      updatedBy: '吴九',
      functions: [
        {
          id: '17',
          name: '当前位置',
          identifier: 'current_position',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '18',
          name: '电池电量',
          identifier: 'battery_level',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'int',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '19',
          name: '运行状态',
          identifier: 'running_status',
          functionType: '属性（静态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '0:待机;1:运行;2:充电;3:故障',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
        {
          id: '20',
          name: '导航指令',
          identifier: 'navigation_command',
          functionType: '服务',
          readWriteMode: '读写',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
    {
      id: '8',
      productName: 'AMR自主移动机器人',
      productKey: 'amr_robot_002',
      productType: '机器人产品',
      protocol: '墨影机器人',
      deviceCount: 3,
      updateTime: '2024-01-16 15:10:33',
      updatedBy: '郑十',
      functions: [
        {
          id: '21',
          name: '激光雷达数据',
          identifier: 'lidar_data',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '22',
          name: '移动速度',
          identifier: 'movement_speed',
          functionType: '属性（动态）',
          readWriteMode: '读写',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
        {
          id: '23',
          name: '避障状态',
          identifier: 'obstacle_avoidance',
          functionType: '属性（静态）',
          readWriteMode: '只读',
          dataType: 'enum',
          valueConfig: '0:正常;1:检测到障碍;2:避障中',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '24',
          name: '路径规划',
          identifier: 'path_planning',
          functionType: '服务',
          readWriteMode: '读写',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
    {
      id: '9',
      productName: 'MCR多功能协作机器人',
      productKey: 'mcr_robot_003',
      productType: '机器人产品',
      protocol: '墨影机器人',
      deviceCount: 2,
      updateTime: '2024-01-16 16:45:27',
      updatedBy: '钱十一',
      functions: [
        {
          id: '25',
          name: '关节角度',
          identifier: 'joint_angles',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '26',
          name: '末端位置',
          identifier: 'end_effector_position',
          functionType: '属性（动态）',
          readWriteMode: '读写',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
        {
          id: '27',
          name: '力传感器数据',
          identifier: 'force_sensor_data',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'input-register',
        },
        {
          id: '28',
          name: '协作模式',
          identifier: 'collaboration_mode',
          functionType: '属性（静态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '0:手动模式;1:自动模式;2:协作模式;3:安全模式',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
        {
          id: '29',
          name: '动作指令',
          identifier: 'motion_command',
          functionType: '服务',
          readWriteMode: '读写',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: '墨影机器人',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
  ]);

  const productTypes = ['机器人产品', '生产产品', '虚拟产品', '电梯产品', '自动门产品'];

  // 筛选数据并按更新时间倒序排序
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.productName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesType = !selectedType || product.productType === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // 按更新时间倒序排序，最新的在前面
      return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
    });

  const handleAdd = () => {
    setEditingProduct(null); // 确保新增模式时清空编辑产品数据
    setIsDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
  };

  const handleEditDrawerClose = () => {
    setIsEditDrawerVisible(false);
    setEditingProduct(null);
  };

  // 处理产品创建或编辑成功
  const handleProductCreated = (productData: any) => {
    if (productData.id && editingProduct) {
      // 编辑模式：更新现有产品
      const updatedProduct: Product = {
        id: productData.id,
        productName: productData.productName,
        productKey: productData.productKey,
        productType: productData.productType,
        protocol: productData.protocol,
        deviceCount: editingProduct.deviceCount, // 保持原有设备数
        updateTime: productData.updateTime,
        updatedBy: productData.updatedBy,
        functions: productData.functions || [], // 包含功能数据
      };
      
      // 更新产品列表
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === productData.id ? updatedProduct : p)
      );
      
      // 关闭编辑抽屉
      setIsEditDrawerVisible(false);
      setEditingProduct(null);
      
      message.success('产品编辑成功！');
    } else {
      // 新增模式：添加新产品
      const product: Product = {
        id: Date.now().toString(),
        productName: productData.productName,
        productKey: productData.productKey || `${productData.productName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        productType: productData.productType,
        protocol: productData.protocol,
        deviceCount: 0, // 新产品设备数为0
        updateTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-'),
        updatedBy: '管理员', // 这里可以从用户状态获取
        functions: productData.functions || [], // 包含功能数据
      };
      
      // 添加到产品列表
      setProducts(prevProducts => [product, ...prevProducts]);
      
      // 关闭新增抽屉
      setIsDrawerVisible(false);
      
      message.success('产品创建成功！');
    }
  };



  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据刷新成功');
    }, 1000);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    setIsEditDrawerVisible(true);
  };

  const handleDelete = (record: Product) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除产品 "${record.productName}" 吗？`,
      onOk: () => {
        setProducts(products.filter((p) => p.id !== record.id));
        message.success('删除成功');
      },
    });
  };



  const handleFormFinish = (values: any) => {
    setLoading(true);
    
    // 模拟API调用
    setTimeout(() => {
      if (editingProduct) {
        // 编辑
        setProducts(
          products.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...values,
                  updateTime: new Date().toLocaleString('zh-CN'),
                  updatedBy: '当前用户',
                }
              : p
          )
        );
        message.success('编辑成功');
      } else {
        // 新增
        const newProduct: Product = {
          id: Date.now().toString(),
          ...values,
          deviceCount: 0,
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户',
        };
        setProducts([...products, newProduct]);
        message.success('新增成功');
      }
      setIsModalVisible(false);
      setLoading(false);
    }, 1000);
  };

  const handleModalOk = async () => {
    if (productFormRef.current) {
      await productFormRef.current.validateAndSubmit();
    }
  };

  // 检测屏幕尺寸
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth * 0.8;
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 根据列数调整列宽
  const adjustColumnWidths = (columns: ColumnsType<Product>, isMobile: boolean): ColumnsType<Product> => {
    if (isMobile) return columns;
    
    const columnCount = columns.length;
    let widthMultiplier = 1;
    
    if (columnCount <= 5) {
      widthMultiplier = 1.3;
    } else if (columnCount <= 7) {
      widthMultiplier = 1.1;
    } else if (columnCount >= 10) {
      widthMultiplier = 0.9;
    }
    
    return columns.map((col: any) => ({
      ...col,
      width: col.width ? col.width * widthMultiplier : col.width
    }));
  };

  // 动态表格配置
  const getTableConfig = (isMobile: boolean, isLargeScreen: boolean, columnCount: number) => {
    let scrollWidth: number | string = 1000;
    
    if (isMobile) {
      scrollWidth = 'max-content';
    } else if (isLargeScreen) {
      scrollWidth = Math.max(1200, columnCount * 150);
    } else {
      scrollWidth = Math.max(1000, columnCount * 120);
    }
    
    return {
      scroll: { x: scrollWidth },
      size: 'small' as const
    };
  };

  // 移动端列配置
  const mobileColumns: ColumnsType<Product> = [
    {
      title: '产品信息',
      key: 'productInfo',
      fixed: 'left',
      render: (_: any, record: Product) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <span 
            style={{ 
              color: '#1890ff', 
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px'
            }}
            onClick={() => handleEdit(record)}
          >
            {record.productName}
          </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span>Key: </span>
            <span 
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard.writeText(record.productKey);
                message.success('产品Key已复制到剪贴板');
              }}
            >
              {record.productKey}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>{record.productType} | {record.protocol} | 设备数: {record.deviceCount}</span>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      fixed: 'right',
      render: (_: any, record: Product) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => handleEdit(record),
              },
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => handleEdit(record),
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                onClick: () => handleDelete(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // 桌面端列配置
  const filteredColumns: ColumnsType<Product> = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: getColumnWidth(150),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: Product) => (
        <Tooltip title={text}>
          <span 
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => handleEdit(record)}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '产品Key',
      dataIndex: 'productKey',
      key: 'productKey',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      render: (text: string) => (
        <Space size={4}>
          <Tooltip title={text}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }} 
              onClick={() => {
                navigator.clipboard.writeText(text);
                message.success('产品Key已复制到剪贴板');
              }}
            >
              {text}
            </span>
          </Tooltip>
          <Tooltip title="复制产品Key">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: '#1890ff' }} />}
              onClick={() => {
                navigator.clipboard.writeText(text);
                message.success('产品Key已复制到剪贴板');
              }}
              style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'productType',
      key: 'productType',
      width: getColumnWidth(100),
      align: 'left',
      ellipsis: true,
      render: (type: string) => (
        <Tooltip title={type}>
          <span>{type}</span>
        </Tooltip>
      ),
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: getColumnWidth(80),
      align: 'left',
      ellipsis: true,
      render: (protocol: string) => (
        <Tooltip title={protocol}>
          <span>{protocol}</span>
        </Tooltip>
      ),
    },
    {
      title: '设备数',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      width: getColumnWidth(80),
      align: 'center',
      sorter: (a: Product, b: Product) => a.deviceCount - b.deviceCount,
      render: (count: number) => (
        <span style={{ fontWeight: 500, color: count > 0 ? '#52c41a' : '#999' }}>
          {count}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: Product, b: Product) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
      render: (time: string) => {
        const date = new Date(time);
        const dateStr = date.toLocaleDateString('zh-CN');
        const timeStr = date.toLocaleTimeString('zh-CN', { hour12: false });
        return (
          <Tooltip title={time}>
            <div style={{ lineHeight: '1.2' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{dateStr}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{timeStr}</div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: getColumnWidth(80),
      align: 'left',
      ellipsis: true,
      render: (user: string) => (
        <Tooltip title={user}>
          <span>{user}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(110),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: Product) => {
        return (
          <Space size={4}>
            <Tooltip title="编辑产品">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
                style={{ padding: '0 4px' }}
              >
                编辑
              </Button>
            </Tooltip>
            <Tooltip title="删除产品">
              <Button
                type="link"
                danger
                onClick={() => handleDelete(record)}
                size="small"
                style={{ padding: '0 4px' }}
              >
                删除
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // 应用动态列宽调整
  const desktopColumns = adjustColumnWidths(filteredColumns, isMobile);

  // 获取表格配置
  const tableConfig = getTableConfig(isMobile, isLargeScreen, desktopColumns.length);

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={10} lg={8} xl={isLargeScreen ? 10 : 8} xxl={12}>
            <Input
              placeholder="请输入产品名称搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}

            />
          </Col>
          <Col xs={12} sm={12} md={5} lg={4} xl={isLargeScreen ? 4 : 4} xxl={4}>
            <Select
              placeholder="全部类型"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              {productTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={6} sm={6} md={3} lg={4} xl={isLargeScreen ? 3 : 4} xxl={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '' : '刷新'}
            </Button>
          </Col>
          <Col xs={6} sm={6} md={6} lg={8} xl={isLargeScreen ? 7 : 8} xxl={5}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增产品'}
            </Button>
          </Col>
        </Row>
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            total: filteredProducts.length,
            pageSize: isMobile ? 5 : isLargeScreen ? 15 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile ? undefined : (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
            showLessItems: !isLargeScreen,
            pageSizeOptions: isLargeScreen ? ['10', '15', '20', '50'] : ['10', '20', '50'],
          }}
          scroll={tableConfig.scroll}
          size={tableConfig.size}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={isLargeScreen ? 800 : isMobile ? '90vw' : 600}
      >
        <ProductForm
          ref={productFormRef}
          editingProduct={editingProduct}
          onFinish={handleFormFinish}
          loading={loading}
        />
      </Modal>
        
        {/* 新增产品抽屉 */}
        <Drawer
          title="添加产品"
          placement="right"
          width="100vw"
          onClose={handleDrawerClose}
          open={isDrawerVisible}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <AddProduct 
            onClose={handleDrawerClose} 
            onProductCreated={handleProductCreated}
            editingProduct={null}
          />
        </Drawer>

        {/* 编辑产品抽屉 */}
        <Drawer
          title="编辑产品"
          placement="right"
          width="100vw"
          onClose={handleEditDrawerClose}
          open={isEditDrawerVisible}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <AddProduct 
            onClose={handleEditDrawerClose} 
            onProductCreated={handleProductCreated}
            editingProduct={editingProduct}
          />
        </Drawer>
        

      </div>
    );
  };
  
  export default ProductManagement;