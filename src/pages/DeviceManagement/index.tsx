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
  Drawer,
  Form,
  message,
  Dropdown,
  Tag,
  Badge,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  MoreOutlined,
  CopyOutlined,
  WifiOutlined,
  DisconnectOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Device {
  id: string;
  deviceName: string;
  deviceKey: string;
  deviceType: '机器人设备' | '生产设备' | '电梯设备' | '自动门设备' | '虚拟设备' | '其他设备';
  productName: string;
  isEnabled: boolean;
  currentStatus: '空闲' | '执行中' | '充电中' | '异常' | '交管中' | '避障' | '解包闸' | '急停';
  isOnline: boolean;
  relatedDevices: string[]; // 关联设备列表
  relatedMap: string; // 关联地图
  mapPosition: string; // 地图点位
  ipAddress: string; // IP地址
  port: string; // 端口
  macAddress: string;
  isRelatedDevice: boolean; // 是否关联设备
  batteryLevel: number;
  updateTime: string;
  updatedBy: string;
}

const DeviceManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | undefined>(undefined);
  const [selectedOnlineStatus, setSelectedOnlineStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();
  const [isEditingDeviceKey, setIsEditingDeviceKey] = useState(false);
  const [editingDeviceKeyRecord, setEditingDeviceKeyRecord] = useState<Device | null>(null);
  const [deviceKeyForm] = Form.useForm();
  
  // 监听表单字段变化
  const productName = Form.useWatch('productName', form);
  const deviceType = Form.useWatch('deviceType', form);
  const isRelatedDevice = Form.useWatch('isRelatedDevice', form);
  const relatedDeviceType = Form.useWatch('relatedDeviceType', form);

  // 产品与设备类型的对应关系
  const getDeviceTypeByProduct = (product: string): string => {
    if (product?.includes('AGV') || product?.includes('AMR') || product?.includes('MCR')) {
      return '机器人设备';
    }
    if (product?.includes('CNC') || product?.includes('生产线')) {
      return '生产设备';
    }
    if (product?.includes('电梯') || product?.includes('升降机')) {
      return '电梯设备';
    }
    if (product?.includes('门') || product?.includes('卷帘')) {
      return '自动门设备';
    }
    if (product?.includes('虚拟')) {
      return '虚拟设备';
    }
    return '其他设备';
  };




  // 当选择产品时，自动设置对应的设备类型
  React.useEffect(() => {
    if (productName) {
      const correspondingDeviceType = getDeviceTypeByProduct(productName);
      form.setFieldsValue({ deviceType: correspondingDeviceType });
    }
  }, [productName, form]);

  // 当设备类型改变时的处理逻辑（已禁用产品清空功能）
  // React.useEffect(() => {
  //   // 产品选择不再受设备类型限制，因此不需要清空产品选择
  // }, [deviceType, form, editingDevice, selectedDeviceType]);

  // 模拟数据
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      deviceName: 'AGV-001',
      deviceKey: 'agv_001_key',
      deviceType: '机器人设备',
      productName: 'AGV自动导引车',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedDevices: ['AMR-002'],
      relatedMap: '仓库一层',
      mapPosition: '点位1',
      ipAddress: '192.168.1.101',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 85,
      macAddress: '00:1B:44:11:3A:B7',
      updateTime: '2024-01-15 14:30:25',
      updatedBy: '张三',
    },
    {
      id: '2',
      deviceName: 'AMR-002',
      deviceKey: 'amr_002_key',
      deviceType: '机器人设备',
      productName: 'AMR自主移动机器人',
      isEnabled: true,
      currentStatus: '充电中',
      isOnline: true,
      relatedDevices: ['AGV-001'],
      relatedMap: '生产车间',
      mapPosition: '点位2',
      ipAddress: '192.168.1.102',
      port: '8080',
      isRelatedDevice: true,
      batteryLevel: 25,
      macAddress: '00:1B:44:11:3A:B8',
      updateTime: '2024-01-15 13:45:12',
      updatedBy: '李四',
    },
    {
      id: '3',
      deviceName: 'MCR-003',
      deviceKey: 'mcr_003_key',
      deviceType: '机器人设备',
      productName: 'MCR协作机器人',
      isEnabled: false,
      currentStatus: '异常',
      isOnline: false,
      relatedDevices: [],
      relatedMap: '装配线A',
      mapPosition: '点位3',
      ipAddress: '192.168.1.103',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:B9',
      updateTime: '2024-01-15 12:20:08',
      updatedBy: '王五',
    },
    {
      id: '4',
      deviceName: 'CNC-004',
      deviceKey: 'cnc_004_key',
      deviceType: '生产设备',
      productName: 'CNC加工中心',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: ['AGV-005'],
      relatedMap: '加工车间',
      mapPosition: '点位4',
      ipAddress: '192.168.1.104',
      port: '8080',
      isRelatedDevice: true,
      batteryLevel: 100,
      macAddress: '00:1B:44:11:3A:C0',
      updateTime: '2024-01-15 11:15:30',
      updatedBy: '赵六',
    },
    {
      id: '5',
      deviceName: 'AGV-005',
      deviceKey: 'agv_005_key',
      deviceType: '机器人设备',
      productName: 'AGV自动导引车',
      isEnabled: true,
      currentStatus: '避障',
      isOnline: true,
      relatedDevices: ['CNC-004'],
      relatedMap: '仓库二层',
      mapPosition: '点位5',
      ipAddress: '192.168.1.105',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 60,
      macAddress: '00:1B:44:11:3A:C1',
      updateTime: '2024-01-15 10:30:45',
      updatedBy: '孙七',
    },
    {
      id: '6',
      deviceName: 'Virtual-001',
      deviceKey: 'virtual_001_key',
      deviceType: '虚拟设备',
      productName: '虚拟控制器',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedDevices: ['AGV-001', 'AMR-002', 'CNC-004'],
      relatedMap: '虚拟环境',
      mapPosition: '点位6',
      ipAddress: '192.168.1.106',
      port: '8080',
      isRelatedDevice: true,
      batteryLevel: 100,
      macAddress: '00:1B:44:11:3A:C2',
      updateTime: '2024-01-15 15:20:30',
      updatedBy: '系统管理员',
    },
    {
      id: '7',
      deviceName: 'Virtual-002',
      deviceKey: 'virtual_002_key',
      deviceType: '虚拟设备',
      productName: '虚拟监控系统',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: ['AGV-005'],
      relatedMap: '监控中心',
      mapPosition: '点位7',
      ipAddress: '192.168.1.107',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 100,
      macAddress: '00:1B:44:11:3A:C3',
      updateTime: '2024-01-15 14:45:15',
      updatedBy: '系统管理员',
    },
    {
      id: '8',
      deviceName: 'CNC-008',
      deviceKey: 'cnc_008_key',
      deviceType: '生产设备',
      productName: 'CNC数控车床',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '精密加工区',
      mapPosition: '点位8',
      ipAddress: '192.168.1.108',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:C4',
      updateTime: '2024-01-15 16:10:20',
      updatedBy: '操作员A',
    },
    {
      id: '9',
      deviceName: 'CNC-009',
      deviceKey: 'cnc_009_key',
      deviceType: '生产设备',
      productName: 'CNC铣床',
      isEnabled: false,
      currentStatus: '异常',
      isOnline: false,
      relatedDevices: [],
      relatedMap: '机械加工车间',
      mapPosition: '点位9',
      ipAddress: '192.168.1.109',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:C5',
      updateTime: '2024-01-15 09:30:15',
      updatedBy: '维修工程师',
    },
    {
      id: '10',
      deviceName: 'PROD-010',
      deviceKey: 'prod_010_key',
      deviceType: '生产设备',
      productName: '自动化生产线',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: ['AGV-001'],
      relatedMap: '生产车间A',
      mapPosition: '点位10',
      ipAddress: '192.168.1.110',
      port: '8080',
      isRelatedDevice: true,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:C6',
      updateTime: '2024-01-15 17:25:40',
      updatedBy: '生产主管',
    },
    {
      id: '11',
      deviceName: 'ELEV-011',
      deviceKey: 'elev_011_key',
      deviceType: '电梯设备',
      productName: '货运电梯A',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '物流中心',
      mapPosition: '1F-3F',
      ipAddress: '192.168.1.111',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:C7',
      updateTime: '2024-01-15 18:00:10',
      updatedBy: '设备管理员',
    },
    {
      id: '12',
      deviceName: 'ELEV-012',
      deviceKey: 'elev_012_key',
      deviceType: '电梯设备',
      productName: '客运电梯B',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '办公大楼',
      mapPosition: '1F-10F',
      ipAddress: '192.168.1.112',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:C8',
      updateTime: '2024-01-15 17:45:30',
      updatedBy: '维保人员',
    },
    {
      id: '13',
      deviceName: 'ELEV-013',
      deviceKey: 'elev_013_key',
      deviceType: '电梯设备',
      productName: '载货升降机',
      isEnabled: false,
      currentStatus: '异常',
      isOnline: false,
      relatedDevices: [],
      relatedMap: '仓储区域',
      mapPosition: '地下1F-2F',
      ipAddress: '192.168.1.113',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:C9',
      updateTime: '2024-01-15 08:20:45',
      updatedBy: '安全检查员',
    },
    {
      id: '14',
      deviceName: 'OTHER-014',
      deviceKey: 'other_014_key',
      deviceType: '其他设备',
      productName: '环境监测系统',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '全厂区',
      mapPosition: '监测点1-20',
      ipAddress: '192.168.1.114',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:D0',
      updateTime: '2024-01-15 19:10:25',
      updatedBy: '环境工程师',
    },
    {
      id: '15',
      deviceName: 'OTHER-015',
      deviceKey: 'other_015_key',
      deviceType: '其他设备',
      productName: '安防监控系统',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '安防中心',
      mapPosition: '摄像头1-50',
      ipAddress: '192.168.1.115',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:D1',
      updateTime: '2024-01-15 20:30:15',
      updatedBy: '安保主管',
    },
    {
      id: '16',
      deviceName: 'OTHER-016',
      deviceKey: 'other_016_key',
      deviceType: '其他设备',
      productName: '消防报警系统',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '全厂区',
      mapPosition: '报警点1-30',
      ipAddress: '192.168.1.116',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:D2',
      updateTime: '2024-01-15 21:15:50',
      updatedBy: '消防管理员',
    },
    {
      id: '17',
      deviceName: 'DOOR-017',
      deviceKey: 'door_017_key',
      deviceType: '自动门设备',
      productName: '感应玻璃门',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '办公大楼入口',
      mapPosition: '1F大厅',
      ipAddress: '192.168.1.117',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:D3',
      updateTime: '2024-01-15 22:00:30',
      updatedBy: '门禁管理员',
    },
    {
      id: '18',
      deviceName: 'DOOR-018',
      deviceKey: 'door_018_key',
      deviceType: '自动门设备',
      productName: '旋转门系统',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedDevices: [],
      relatedMap: '主入口大厅',
      mapPosition: '正门',
      ipAddress: '192.168.1.118',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:D4',
      updateTime: '2024-01-15 21:45:20',
      updatedBy: '安保人员',
    },
    {
      id: '19',
      deviceName: 'DOOR-019',
      deviceKey: 'door_019_key',
      deviceType: '自动门设备',
      productName: '防火卷帘门',
      isEnabled: false,
      currentStatus: '异常',
      isOnline: false,
      relatedDevices: [],
      relatedMap: '生产车间B',
      mapPosition: '防火分区',
      ipAddress: '192.168.1.119',
      port: '8080',
      isRelatedDevice: false,
      batteryLevel: 0,
      macAddress: '00:1B:44:11:3A:D5',
      updateTime: '2024-01-15 07:30:10',
      updatedBy: '消防维保',
    },
  ]);

  const productNames = ['AGV自动导引车', 'AMR自主移动机器人', 'MCR协作机器人', 'CNC加工中心', 'CNC数控车床', 'CNC铣床', '自动化生产线', '货运电梯A', '客运电梯B', '载货升降机', '感应玻璃门', '旋转门系统', '防火卷帘门', '环境监测系统', '安防监控系统', '消防报警系统', '虚拟控制器', '虚拟监控系统'];
  const deviceTypeOptions = ['机器人设备', '生产设备', '电梯设备', '自动门设备', '虚拟设备', '其他设备'];
  const statusOptions = ['空闲', '执行中', '充电中', '异常', '交管中', '避障', '解包闸', '急停'];
  const onlineStatusOptions = ['在线', '离线'];

  // 筛选数据并按更新时间倒序排序
  const filteredDevices = devices
    .filter((device) => {
      const matchesSearch = device.deviceName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesProduct = !selectedProduct || device.productName === selectedProduct;
      const matchesDeviceType = !selectedDeviceType || device.deviceType === selectedDeviceType;
      // 设备状态过滤已移除
      // 在虚拟设备Tab页面中不应用在线状态过滤
      const matchesOnlineStatus = selectedDeviceType === '虚拟设备' || !selectedOnlineStatus || 
        (selectedOnlineStatus === '在线' ? device.isOnline : !device.isOnline);
      return matchesSearch && matchesProduct && matchesDeviceType && matchesOnlineStatus;
    })
    .sort((a, b) => {
      // 按更新时间倒序排序，最新的在前面
      return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
    });

  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据刷新成功');
    }, 1000);
  };

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    
    // 如果当前选中了特定的设备类型标签页，则预设设备类型
    if (selectedDeviceType && selectedDeviceType !== '') {
      form.setFieldsValue({
        deviceType: selectedDeviceType
      });
    }
    
    setIsModalVisible(true);
  };

  const handleEdit = (record: Device) => {
    setEditingDevice(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (record: Device) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除设备 "${record.deviceName}" 吗？`,
      onOk: () => {
        setDevices(devices.filter((d) => d.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleToggleEnabled = (record: Device) => {
    const action = record.isEnabled ? '禁用' : '启用';
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要${action}设备 "${record.deviceName}" 吗？`,
      onOk: () => {
        setDevices(devices.map((d) => 
          d.id === record.id 
            ? { 
                ...d, 
                isEnabled: !d.isEnabled,
                updateTime: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(/\//g, '-'),
                updatedBy: '当前用户'
              }
            : d
        ));
        message.success(`${action}成功`);
      },
    });
  };

  const handleView = (record: Device) => {
    Modal.info({
      title: '设备详情',
      content: (
        <div>
          <p><strong>设备名称：</strong>{record.deviceName}</p>
          <p><strong>设备Key：</strong>{record.deviceKey}</p>
          <p><strong>所属产品：</strong>{record.productName}</p>
          <p><strong>是否启用：</strong>{record.isEnabled ? '启用' : '禁用'}</p>
          <p><strong>当前状态：</strong>{record.currentStatus}</p>
          <p><strong>是否在线：</strong>{record.isOnline ? '在线' : '离线'}</p>
          <p><strong>当前地图：</strong>{record.relatedMap}</p>
          <p><strong>当前电量：</strong>{record.batteryLevel}%</p>
          <p><strong>IP地址：</strong>{record.ipAddress}</p>
          <p><strong>端口：</strong>{record.port}</p>
          <p><strong>MAC地址：</strong>{record.macAddress}</p>
          <p><strong>更新时间：</strong>{record.updateTime}</p>
          <p><strong>更新人：</strong>{record.updatedBy}</p>
        </div>
      ),
      width: 500,
    });
  };

  const handleEditDeviceKey = (record: Device) => {
    setEditingDeviceKeyRecord(record);
    deviceKeyForm.setFieldsValue({ deviceKey: record.deviceKey });
    setIsEditingDeviceKey(true);
  };

  const handleDeviceKeyModalOk = async () => {
    try {
      const values = await deviceKeyForm.validateFields();
      const oldKey = editingDeviceKeyRecord?.deviceKey;
      const newKey = values.deviceKey;
      
      // 检查是否有实际变更
      if (oldKey === newKey) {
        message.info('设备Key未发生变更');
        setIsEditingDeviceKey(false);
        setEditingDeviceKeyRecord(null);
        deviceKeyForm.resetFields();
        return;
      }
      
      // 显示确认对话框
      Modal.confirm({
        title: '确认修改设备Key',
        content: (
          <div>
            <p><strong>设备名称：</strong>{editingDeviceKeyRecord?.deviceName}</p>
            <p><strong>原设备Key：</strong><code style={{background: '#f5f5f5', padding: '2px 4px'}}>{oldKey}</code></p>
            <p><strong>新设备Key：</strong><code style={{background: '#e6f7ff', padding: '2px 4px'}}>{newKey}</code></p>
            <p style={{color: '#ff4d4f', marginTop: '12px'}}>⚠️ 修改设备Key后，请确保设备端同步更新配置</p>
          </div>
        ),
        onOk: () => {
          setLoading(true);
          
          // 模拟API调用
          setTimeout(() => {
            if (editingDeviceKeyRecord) {
              setDevices(
                devices.map((d) =>
                  d.id === editingDeviceKeyRecord.id
                    ? {
                        ...d,
                        deviceKey: newKey,
                        updateTime: new Date().toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        }).replace(/\//g, '-'),
                        updatedBy: '当前用户',
                      }
                    : d
                )
              );
              message.success(`设备Key已从 "${oldKey}" 更新为 "${newKey}"`);
            }
            setIsEditingDeviceKey(false);
            setEditingDeviceKeyRecord(null);
            setLoading(false);
            deviceKeyForm.resetFields();
          }, 1000);
        },
        onCancel: () => {
          // 用户取消确认，保持编辑状态
        }
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleDeviceKeyModalCancel = () => {
    setIsEditingDeviceKey(false);
    setEditingDeviceKeyRecord(null);
    deviceKeyForm.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 模拟API调用
      setTimeout(() => {
        if (editingDevice) {
          // 编辑
          setDevices(
            devices.map((d) =>
              d.id === editingDevice.id
                ? {
                    ...d,
                    ...values,
                    updateTime: new Date().toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }).replace(/\//g, '-'),
                    updatedBy: '当前用户',
                  }
                : d
            )
          );
          message.success('编辑成功');
        } else {
          // 新增
          const newDevice: Device = {
            id: Date.now().toString(),
            ...values,
            updateTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-'),
            updatedBy: '当前用户',
          };
          setDevices([newDevice, ...devices]);
          message.success('新增成功');
        }
        setIsModalVisible(false);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      '空闲': { color: 'default', text: '空闲' },
      '执行中': { color: 'processing', text: '执行中' },
      '充电中': { color: 'warning', text: '充电中' },
      '异常': { color: 'error', text: '异常' },
      '交管中': { color: 'purple', text: '交管中' },
      '避障': { color: 'orange', text: '避障' },
      '解包闸': { color: 'cyan', text: '解包闸' },
      '急停': { color: 'red', text: '急停' },
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取电量颜色
  const getBatteryColor = (level: number) => {
    if (level > 60) return '#52c41a';
    if (level > 30) return '#faad14';
    return '#ff4d4f';
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

  // 移动端列配置
  const mobileColumns: ColumnsType<Device> = [
    {
      title: '设备信息',
      key: 'deviceInfo',
      fixed: 'left',
      render: (_: any, record: Device) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <Space size={4}>
              <span 
                style={{ 
                  color: '#1890ff', 
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
                onClick={() => handleView(record)}
              >
                {record.deviceName}
              </span>
              {record.deviceType === '虚拟设备' ? (
                <span style={{ color: '#999', fontSize: '12px' }}>--</span>
              ) : record.isOnline ? (
                <Badge status="success" />
              ) : (
                <Badge status="error" />
              )}
            </Space>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span>Key: </span>
            <span 
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard.writeText(record.deviceKey);
                message.success('设备Key已复制到剪贴板');
              }}
            >
              {record.deviceKey}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span style={{ color: '#000000', fontWeight: '500' }}>{record.productName}</span>
            {/* 只有机器人设备显示状态，其他设备类型显示"--" */}
            {record.deviceType === '机器人设备' ? (
              <>
                <span> | </span>
                {getStatusTag(record.currentStatus)}
              </>
            ) : (
              <>
                <span> | </span>
                <span style={{ color: '#999' }}>--</span>
              </>
            )}
          </div>
          {record.deviceType === '机器人设备' && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              <ThunderboltOutlined style={{ color: getBatteryColor(record.batteryLevel) }} />
              <span style={{ marginLeft: '4px' }}>{record.batteryLevel}%</span>
              <span style={{ marginLeft: '8px' }}>
                <EnvironmentOutlined /> {record.relatedMap}
              </span>
            </div>
          )}
          {selectedDeviceType === '生产设备' && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              <span style={{ marginLeft: '8px' }}>
                <EnvironmentOutlined /> {record.relatedMap}
              </span>
            </div>
          )}
          {selectedDeviceType !== '生产设备' && selectedDeviceType !== '电梯设备' && selectedDeviceType !== '自动门设备' && selectedDeviceType !== '其他设备' && selectedDeviceType !== '虚拟设备' && (
            record.deviceType === '虚拟设备' ? (
              record.relatedDevices.length > 0 ? (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <span>关联设备: </span>
                  <span style={{ color: '#000', fontSize: '12px' }}>
                    {record.relatedDevices.length === 1 ? record.relatedDevices[0] : `${record.relatedDevices[0]} 等${record.relatedDevices.length}个`}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <span>关联设备: </span>
                  <span style={{ color: '#999', fontSize: '12px' }}>无关联设备</span>
                </div>
              )
            ) : (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <span>关联设备: </span>
                <span style={{ color: '#999', fontSize: '12px' }}>--</span>
              </div>
            )
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      fixed: 'right',
      render: (_: any, record: Device) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: '详情',
                icon: <EyeOutlined />,
                onClick: () => handleView(record),
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
                danger: true,
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

  // 根据显示列数动态计算列宽
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth;
    return isLargeScreen ? baseWidth + 20 : baseWidth;
  };

  // 根据实际显示列数动态调整列宽
  const adjustColumnWidths = (columns: any[], actualColumnCount: number) => {
    return columns.map(column => {
      if (column.width && typeof column.width === 'number') {
        let widthFactor = 1;
        
        // 根据实际列数调整宽度系数
        if (actualColumnCount <= 6) {
          widthFactor = 1.4; // 列数少时，列宽可以更宽
        } else if (actualColumnCount <= 8) {
          widthFactor = 1.2;
        } else if (actualColumnCount <= 10) {
          widthFactor = 1.1;
        } else if (actualColumnCount <= 12) {
          widthFactor = 1.0;
        } else {
          widthFactor = 0.9; // 列数多时，列宽需要压缩
        }
        
        const adjustedWidth = Math.round(column.width * widthFactor);
        return {
          ...column,
          width: adjustedWidth
        };
      }
      return column;
    });
  };

  // 桌面端列配置
  const allDesktopColumns: ColumnsType<Device> = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: getColumnWidth(120),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: Device) => (
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
      title: '设备Key',
      dataIndex: 'deviceKey',
      key: 'deviceKey',
      width: getColumnWidth(150),
      align: 'left',
      ellipsis: true,
      render: (text: string, record: Device) => (
        <Space size={4}>
          <Tooltip title={text}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }} 
              onClick={() => {
                navigator.clipboard.writeText(text);
                message.success('设备Key已复制到剪贴板');
              }}
            >
              {text}
            </span>
          </Tooltip>
          <Tooltip title="复制设备Key">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: '#1890ff' }} />}
              onClick={() => {
                navigator.clipboard.writeText(text);
                message.success('设备Key已复制到剪贴板');
              }}
              style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
            />
          </Tooltip>
          <Tooltip title="编辑设备Key">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleEditDeviceKey(record)}
              style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: getColumnWidth(100),
      align: 'left',
      render: (deviceType: string) => (
        <span style={{ color: '#000000' }}>{deviceType}</span>
      ),
    },
    {
      title: '所属产品',
      dataIndex: 'productName',
      key: 'productName',
      width: getColumnWidth(120),
      align: 'left',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '是否启用',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: getColumnWidth(90),
      align: 'left',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'error'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '当前状态',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      width: getColumnWidth(90),
      align: 'left',
      render: (status: string, record: Device) => {
        // 只有机器人设备显示状态，其他设备类型显示"--"
        if (record.deviceType === '机器人设备') {
          return getStatusTag(status);
        }
        return <span style={{ color: '#999' }}>--</span>;
      },
    },
    {
      title: '是否在线',
      dataIndex: 'isOnline',
      key: 'isOnline',
      width: getColumnWidth(100),
      align: 'left',
      render: (online: boolean, record: Device) => {
        // 虚拟设备显示"--"，其他设备显示在线状态
        if (record.deviceType === '虚拟设备') {
          return <span style={{ color: '#999' }}>--</span>;
        }
        return (
          <Space size={4}>
            {online ? (
              <WifiOutlined style={{ color: '#52c41a' }} />
            ) : (
              <DisconnectOutlined style={{ color: '#ff4d4f' }} />
            )}
            <Tag color={online ? 'success' : 'error'}>
              {online ? '在线' : '离线'}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '关联设备',
      dataIndex: 'relatedDevices',
      key: 'relatedDevices',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      render: (relatedDevices: string[], record: Device) => (
        <div>
          {record.deviceType === '虚拟设备' ? (
            relatedDevices.length > 0 ? (
              <Tooltip title={relatedDevices.join(', ')}>
                <span style={{ color: '#000', fontSize: '14px' }}>
                  {relatedDevices.length === 1 ? relatedDevices[0] : `${relatedDevices[0]} 等${relatedDevices.length}个`}
                </span>
              </Tooltip>
            ) : (
              <span style={{ color: '#999' }}>无关联设备</span>
            )
          ) : (
            <span style={{ color: '#999' }}>--</span>
          )}
        </div>
      ),
    },
    {
      title: '当前地图',
      dataIndex: 'relatedMap',
      key: 'relatedMap',
      width: getColumnWidth(110),
      align: 'left',
      ellipsis: true,
      render: (map: string) => (
        <Tooltip title={map}>
          <Space size={4}>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            <span>{map}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '当前电量',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      width: getColumnWidth(90),
      align: 'left',
      sorter: (a: Device, b: Device) => a.batteryLevel - b.batteryLevel,
      render: (level: number, record: Device) => {
        // 只有机器人设备显示电量，其他设备类型显示"--"
        if (record.deviceType === '机器人设备') {
          return (
            <Space size={4}>
              <ThunderboltOutlined style={{ color: getBatteryColor(level) }} />
              <span style={{ color: getBatteryColor(level), fontWeight: 500 }}>
                {level}%
              </span>
            </Space>
          );
        }
        return <span style={{ color: '#999' }}>--</span>;
      },
    },
    {
      title: 'IP/端口',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: getColumnWidth(130),
      align: 'left',
      render: (_: string, record: Device) => {
        return (
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '500' }}>{record.ipAddress}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{record.port}</div>
          </div>
        );
      },
    },
    {
      title: 'MAC地址',
      dataIndex: 'macAddress',
      key: 'macAddress',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      render: (mac: string) => (
        <Tooltip title={mac}>
          <span style={{ fontFamily: 'monospace' }}>{mac}</span>
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(150),
      align: 'left',
      sorter: (a: Device, b: Device) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
      render: (time: string) => {
        const date = new Date(time);
        const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontSize: '13px', fontWeight: '500' }}>{dateStr}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{timeStr}</div>
          </div>
        );
      },
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: getColumnWidth(90),
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
      width: getColumnWidth(120),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: Device) => {
        const moreMenuItems = [
          {
            key: 'toggle',
            label: record.isEnabled ? '禁用' : '启用',
            icon: record.isEnabled ? <DisconnectOutlined /> : <ThunderboltOutlined />,
            onClick: () => handleToggleEnabled(record),
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Space size={4}>
            <Tooltip title="编辑设备">
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
            <Dropdown
              menu={{ items: moreMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="link"
                icon={<MoreOutlined />}
                size="small"
                style={{ padding: '0 4px' }}
              >
                更多
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // 根据选中的设备类型动态过滤列
  const filteredColumns = allDesktopColumns.filter((column: any) => {
    // 在所有设备类型tab页中隐藏设备类型列
    if (selectedDeviceType && column.key === 'deviceType') {
      return false;
    }
    // 如果是机器人设备，隐藏关联设备列
    if (selectedDeviceType === '机器人设备' && column.key === 'relatedDevices') {
      return false;
    }
    // 如果是生产设备，隐藏当前电量、关联设备和当前状态列
    if (selectedDeviceType === '生产设备' && (column.key === 'batteryLevel' || column.key === 'relatedDevices' || column.key === 'currentStatus')) {
      return false;
    }
    // 如果是电梯设备，隐藏当前电量、关联设备、当前状态和当前地图列
    if (selectedDeviceType === '电梯设备' && (column.key === 'batteryLevel' || column.key === 'relatedDevices' || column.key === 'currentStatus' || column.key === 'relatedMap')) {
      return false;
    }
    // 如果是自动门设备，隐藏当前电量、关联设备、当前状态和当前地图列
    if (selectedDeviceType === '自动门设备' && (column.key === 'batteryLevel' || column.key === 'relatedDevices' || column.key === 'currentStatus' || column.key === 'relatedMap')) {
      return false;
    }
    // 如果是其他设备，隐藏当前电量、关联设备和当前状态列
    if (selectedDeviceType === '其他设备' && (column.key === 'batteryLevel' || column.key === 'relatedDevices' || column.key === 'currentStatus')) {
      return false;
    }
    // 如果是虚拟设备，隐藏当前电量、是否在线、MAC地址、IP/端口和当前状态列
    if (selectedDeviceType === '虚拟设备' && (column.key === 'batteryLevel' || column.key === 'isOnline' || column.key === 'macAddress' || column.key === 'ipAddress' || column.key === 'currentStatus')) {
      return false;
    }
    return true;
  });

  // 根据实际显示列数动态调整列宽
  const desktopColumns = isMobile ? filteredColumns : adjustColumnWidths(filteredColumns, filteredColumns.length);

  // 根据显示列数动态计算表格配置
  const getTableConfig = () => {
    const columnCount = desktopColumns.length;
    let scrollWidth: number;
    let tableSize: 'small' | 'middle' | 'large';
    
    // 根据列数和屏幕尺寸动态调整滚动宽度
    if (isMobile) {
      scrollWidth = Math.max(800, columnCount * 120); // 移动端基础宽度
      tableSize = 'small';
    } else if (isLargeScreen) {
      // 大屏幕：列数少时使用更紧凑的布局
      if (columnCount <= 8) {
        scrollWidth = Math.min(1400, columnCount * 160);
        tableSize = 'small';
      } else if (columnCount <= 12) {
        scrollWidth = Math.min(1800, columnCount * 150);
        tableSize = 'small';
      } else {
        scrollWidth = columnCount * 140;
        tableSize = 'small';
      }
    } else {
      // 中等屏幕：根据列数调整
      if (columnCount <= 6) {
        scrollWidth = Math.min(1200, columnCount * 180);
        tableSize = 'small';
      } else if (columnCount <= 10) {
        scrollWidth = Math.min(1600, columnCount * 160);
        tableSize = 'small';
      } else {
        scrollWidth = columnCount * 140;
        tableSize = 'small';
      }
    }
    
    return {
      scroll: isMobile ? { x: 'max-content' } : { x: scrollWidth },
      size: tableSize,
      columnCount
    };
  };

  const tableConfig = getTableConfig();

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 设备类型Tab切换 */}
        <Tabs
          activeKey={selectedDeviceType || 'all'}
          onChange={(key) => setSelectedDeviceType(key === 'all' ? '' : key)}
          items={[
            {
              key: 'all',
              label: `全部设备 (${devices.length})`,
            },
            {
              key: '机器人设备',
              label: `机器人设备 (${devices.filter(device => device.deviceType === '机器人设备').length})`,
            },
            {
              key: '生产设备',
              label: `生产设备 (${devices.filter(device => device.deviceType === '生产设备').length})`,
            },
            {
              key: '电梯设备',
              label: `电梯设备 (${devices.filter(device => device.deviceType === '电梯设备').length})`,
            },
            {
              key: '自动门设备',
              label: `自动门设备 (${devices.filter(device => device.deviceType === '自动门设备').length})`,
            },
            {
              key: '虚拟设备',
              label: `虚拟设备 (${devices.filter(device => device.deviceType === '虚拟设备').length})`,
            },
            {
              key: '其他设备',
              label: `其他设备 (${devices.filter(device => device.deviceType === '其他设备').length})`,
            },
          ]}
        />
        
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {/* 搜索框 */}
          <Col 
            xs={24} 
            sm={24} 
            md={selectedDeviceType === '虚拟设备' ? 12 : 10} 
            lg={selectedDeviceType === '虚拟设备' ? 12 : 10} 
            xl={selectedDeviceType === '虚拟设备' ? 12 : 10} 
            xxl={selectedDeviceType === '虚拟设备' ? 12 : 10}
          >
            <Input
              placeholder={selectedDeviceType ? `请输入${selectedDeviceType}名称搜索` : "请输入设备名称搜索"}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}

            />
          </Col>
          
          {/* 所属产品筛选 */}
          <Col 
            xs={12} 
            sm={12} 
            md={selectedDeviceType === '虚拟设备' ? 4 : 4} 
            lg={selectedDeviceType === '虚拟设备' ? 4 : 4} 
            xl={selectedDeviceType === '虚拟设备' ? 4 : 4} 
            xxl={selectedDeviceType === '虚拟设备' ? 4 : 4}
          >
            <Select
              placeholder="所属产品"
              value={selectedProduct}
              onChange={setSelectedProduct}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              {productNames.map((product) => (
                <Option key={product} value={product}>
                  {product}
                </Option>
              ))}
            </Select>
          </Col>
          
          {/* 在线状态筛选 - 虚拟设备时隐藏 */}
          {selectedDeviceType !== '虚拟设备' && (
            <Col 
              xs={12} 
              sm={12} 
              md={4} 
              lg={4} 
              xl={4} 
              xxl={4}
            >
              <Select
                placeholder="在线状态"
                value={selectedOnlineStatus}
                onChange={setSelectedOnlineStatus}
                allowClear
                style={{ width: '100%' }}
                size={isMobile ? 'large' : 'middle'}
              >
                {onlineStatusOptions.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Col>
          )}
          
          {/* 刷新按钮 */}
          <Col 
            xs={12} 
            sm={12} 
            md={selectedDeviceType === '虚拟设备' ? 4 : 3} 
            lg={selectedDeviceType === '虚拟设备' ? 4 : 3} 
            xl={selectedDeviceType === '虚拟设备' ? 4 : 3} 
            xxl={selectedDeviceType === '虚拟设备' ? 4 : 3}
          >
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
          
          {/* 新增按钮 */}
          <Col 
            xs={12} 
            sm={12} 
            md={selectedDeviceType === '虚拟设备' ? 4 : 3} 
            lg={selectedDeviceType === '虚拟设备' ? 4 : 3} 
            xl={selectedDeviceType === '虚拟设备' ? 4 : 3} 
            xxl={selectedDeviceType === '虚拟设备' ? 4 : 3}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增设备'}
            </Button>
          </Col>
        </Row>
        
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={filteredDevices}
          rowKey="id"
          pagination={{
            total: filteredDevices.length,
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

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={editingDevice ? '编辑设备' : '新增设备'}
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        width="66.67vw"
        placement="right"
        footer={
          <div style={{ 
            textAlign: 'center',
            padding: '16px 24px',
            background: '#fff',
            position: 'sticky',
            bottom: 0,
            zIndex: 1
          }}>
            <Space size={16}>
              <Button size="large" onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button size="large" type="primary" onClick={handleModalOk} loading={loading}>
                {editingDevice ? '更新' : '新增'}
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="设备名称"
                name="deviceName"
                rules={[
                  { required: true, message: '请输入设备名称' },
                  { max: 64, message: '设备名称最多输入64个字符' },
                  { pattern: /^[^\s]*$/, message: '设备名称不支持空格' },
                ]}
              >
                <Input placeholder="请输入设备名称（最多64个字符，不支持空格）" maxLength={64} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="设备Key"
                name="deviceKey"
                rules={[
                  { max: 64, message: '设备Key最多输入64个字符' },
                  { pattern: /^[a-zA-Z0-9_]*$/, message: '设备Key只能包含字母、数字和下划线' },
                ]}
              >
                <Input placeholder="请输入设备Key（非必填，系统可自动生成）" maxLength={64} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="所属产品"
                name="productName"
                rules={[{ required: true, message: '请选择所属产品' }]}
              >
                <Select placeholder="请选择所属产品">
                  {productNames.map((product) => (
                    <Option key={product} value={product}>
                      {product}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="设备类型"
                name="deviceType"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select 
                  placeholder={deviceType ? `设备类型已固定为${deviceType}` : (selectedDeviceType ? "设备类型将根据标签页自动设置" : "设备类型将根据所属产品自动设置")}
                  disabled={true}
                >
                  {deviceTypeOptions.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="当前状态"
                name="currentStatus"
                rules={[{ required: true, message: '请选择当前状态' }]}
              >
                <Select placeholder="请选择当前状态">
                  {statusOptions.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="是否在线"
                name="isOnline"
                rules={[{ required: true, message: '请选择是否在线' }]}
              >
                <Select placeholder="请选择是否在线">
                  <Option value={true}>在线</Option>
                  <Option value={false}>离线</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="关联地图"
                name="relatedMap"
                rules={[{ required: true, message: '请选择关联地图' }]}
              >
                <Select placeholder="请选择关联地图">
                  <Option value="地图1">地图1</Option>
                  <Option value="地图2">地图2</Option>
                  <Option value="地图3">地图3</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="地图点位"
                name="mapPosition"
                rules={[{ required: true, message: '请选择地图点位' }]}
              >
                <Select placeholder="请选择地图点位">
                  <Option value="点位1">点位1</Option>
                  <Option value="点位2">点位2</Option>
                  <Option value="点位3">点位3</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="IP地址"
                name="ipAddress"
                rules={[
                  { required: true, message: '请输入IP地址' },
                  { pattern: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/, message: 'IP地址格式不正确' },
                ]}
              >
                <Input placeholder="请输入IP地址，如：192.168.1.100" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="端口"
                name="port"
                rules={[
                  { required: true, message: '请输入端口' },
                  { pattern: /^([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/, message: '端口范围为1-65535' },
                ]}
              >
                <Input placeholder="请输入端口，如：8080" />
              </Form.Item>
            </Col>
          </Row>
          {/* MAC地址独占一行 */}
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="MAC地址"
                name="macAddress"
                rules={[
                  { required: true, message: '请输入MAC地址' },
                  { pattern: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, message: 'MAC地址格式不正确' },
                ]}
              >
                <Input placeholder="请输入MAC地址，如：00:1B:44:11:3A:B7" />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 是否关联设备字段 - 仅在设备类型为虚拟设备时显示 */}
          {deviceType === '虚拟设备' && (
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  label="是否关联设备"
                  name="isRelatedDevice"
                  initialValue={false}
                >
                  <Select placeholder="请选择是否关联设备">
                    <Option value={true}>是</Option>
                    <Option value={false}>否</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
          
          {/* 关联设备类型和关联设备 - 仅在选择关联设备时显示 */}
          {deviceType === '虚拟设备' && isRelatedDevice && (
            <Row gutter={16}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="关联设备类型"
                  name="relatedDeviceType"
                  rules={[{ required: true, message: '请选择关联设备类型' }]}
                >
                  <Select 
                    placeholder="请选择要关联的设备类型"
                    onChange={() => {
                      // 清空关联设备选择
                      form.setFieldsValue({ relatedDeviceId: undefined });
                    }}
                  >
                    {deviceTypeOptions
                      .filter(type => type !== '虚拟设备')
                      .map(type => (
                        <Option key={type} value={type}>
                          {type}
                        </Option>
                      ))
                    }
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="关联设备"
                  name="relatedDeviceId"
                  rules={[{ required: relatedDeviceType, message: '请选择关联设备' }]}
                >
                  <Select 
                    placeholder={relatedDeviceType ? `请选择要关联的${relatedDeviceType}` : '请先选择关联设备类型'}
                    disabled={!relatedDeviceType}
                  >
                    {devices
                      .filter(device => device.deviceType === relatedDeviceType)
                      .map(device => (
                        <Option key={device.id} value={device.id}>
                          {device.deviceName}
                        </Option>
                      ))
                    }
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Drawer>

      {/* 设备Key编辑Modal */}
      <Modal
        title="编辑设备Key"
        open={isEditingDeviceKey}
        onOk={handleDeviceKeyModalOk}
        onCancel={handleDeviceKeyModalCancel}
        confirmLoading={loading}
        width={500}
      >
        <Form
          form={deviceKeyForm}
          layout="vertical"
          initialValues={{
            deviceKey: editingDeviceKeyRecord?.deviceKey || '',
          }}
        >
          <Form.Item
            label="设备Key"
            name="deviceKey"
            rules={[
              { required: true, message: '请输入设备Key' },
              { min: 3, message: '设备Key至少3个字符' },
              { max: 50, message: '设备Key最多50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '设备Key只能包含字母、数字、下划线和连字符' },
            ]}
          >
            <Input placeholder="请输入设备Key" />
          </Form.Item>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '-16px', marginBottom: '16px' }}>
            注意：设备Key用于设备唯一标识，修改后请确保设备端同步更新
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DeviceManagement;