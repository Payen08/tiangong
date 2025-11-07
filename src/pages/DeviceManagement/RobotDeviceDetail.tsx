import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  Table,
  Timeline,
  Badge,
  Tooltip,
  message,
  AutoComplete,
  Input,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
} from 'antd';
import {
  WifiOutlined,
  DisconnectOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  CloseOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import DeviceMapEditor from '../../components/DeviceMapEditor';
import DeviceBehaviorTreeEditor from '../../components/DeviceBehaviorTreeEditor';
import type { ColumnsType } from 'antd/es/table';
import { usePoseCoordinateStore, type PoseManagementItem, type CoordinateSystemItem } from '../../store/poseCoordinateStore';

// 机器人设备接口
interface RobotDevice {
  id: string;
  deviceName: string;
  deviceKey: string;
  deviceType: string;
  productName: string;
  isEnabled: boolean;
  currentStatus: '空闲' | '执行中' | '充电中' | '异常' | '交管中' | '避障' | '解包闸' | '急停';
  isOnline: boolean;
  relatedMap: string;
  mapPosition: string;
  ipAddress: string;
  port: string;
  macAddress: string;
  batteryLevel: number;
  updateTime: string;
  updatedBy: string;
  // 机器人特有属性
  speed: number;
  direction: number;
  workingHours: number;
  totalDistance: number;
  taskCount: number;
  errorCount: number;
}

// 任务记录接口
interface TaskRecord {
  id: string;
  taskName: string;
  taskType: string;
  startTime: string;
  endTime: string;
  status: 'completed' | 'failed' | 'running';
  duration: string;
  description: string;
}

// 状态历史接口
interface StatusHistory {
  id: string;
  status: string;
  timestamp: string;
  duration: string;
  description: string;
}

// 设备任务接口定义
interface DeviceTask {
  id: string;                    // 任务ID
  name: string;                  // 任务名称
  type: 'move' | 'behavior_tree'; // 任务类型：移动任务或行为树任务
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'; // 执行结果
  errorCode?: string;            // 错误码
  startTime: string;             // 开始时间
  endTime?: string;              // 结束时间
  // 移动任务特有字段
  targetMapId?: string;          // 目标地图ID
  targetMapName?: string;        // 目标地图名称
  targetPointId?: string;        // 目标点位ID
  targetPointName?: string;      // 目标点位名称
  // 行为树任务特有字段
  behaviorTreeName?: string;     // 行为树名称
  behaviorTreeId?: string;       // 行为树ID
  // 通用字段
  description?: string;          // 任务描述
  progress?: number;             // 执行进度
}

// 位姿管理数据接口和坐标系管理数据接口现在从共享store导入

const RobotDeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<RobotDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [robotTabs, setRobotTabs] = useState<RobotDevice[]>([]); // 机器人标签页列表
  const [currentRobotId, setCurrentRobotId] = useState<string>(''); // 当前激活的机器人ID
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<{ value: string; label: string; robot: RobotDevice }[]>([]);
  const [taskSearchText, setTaskSearchText] = useState(''); // 任务搜索文本
  const [deviceTasks, setDeviceTasks] = useState<DeviceTask[]>([]); // 设备任务列表
  const [studioTab, setStudioTab] = useState<'mystudio' | '烛微'>('mystudio'); // 顶部自定义切换按钮

  // 使用共享的位姿和坐标系数据store
  const {
    poseData,
    coordinateData,
    addPose,
    updatePose,
    deletePose,
    addCoordinate,
    updateCoordinate,
    deleteCoordinate,
    initializeData
  } = usePoseCoordinateStore();

  // 位姿管理相关状态
  const [poseModalVisible, setPoseModalVisible] = useState(false);
  const [poseEditingItem, setPoseEditingItem] = useState<PoseManagementItem | null>(null);
  const [poseSelectedRowKeys] = useState<React.Key[]>([]);
  const [poseContinuousMode, setPoseContinuousMode] = useState(false); // 位姿连续操作开关
  const [poseForm] = Form.useForm();

  // 坐标系管理相关状态
  const [coordinateModalVisible, setCoordinateModalVisible] = useState(false);
  const [coordinateEditingItem, setCoordinateEditingItem] = useState<CoordinateSystemItem | null>(null);
  const [coordinateSelectedRowKeys] = useState<React.Key[]>([]);
  const [coordinateContinuousMode, setCoordinateContinuousMode] = useState(false); // 坐标系连续操作开关
  const [coordinateForm] = Form.useForm();

  // 模拟机器人数据列表
  const mockRobotList: RobotDevice[] = [
    {
      id: '1',
      deviceName: 'AGV-001',
      deviceKey: 'agv_001_key',
      deviceType: '机器人设备',
      productName: '智能搬运机器人',
      isEnabled: true,
      currentStatus: '执行中',
      isOnline: true,
      relatedMap: '仓储区域A',
      mapPosition: '点位1',
      ipAddress: '192.168.1.101',
      port: '8080',
      macAddress: '00:1B:44:11:3A:B1',
      batteryLevel: 85,
      updateTime: '2024-01-15 14:30:25',
      updatedBy: '系统管理员',
      speed: 1.2,
      direction: 45,
      workingHours: 156.5,
      totalDistance: 2847.6,
      taskCount: 342,
      errorCount: 3,
    },
    {
      id: '2',
      deviceName: 'AGV-002',
      deviceKey: 'agv_002_key',
      deviceType: '机器人设备',
      productName: '智能搬运机器人',
      isEnabled: true,
      currentStatus: '空闲',
      isOnline: true,
      relatedMap: '仓储区域B',
      mapPosition: '点位2',
      ipAddress: '192.168.1.102',
      port: '8080',
      macAddress: '00:1B:44:11:3A:B2',
      batteryLevel: 92,
      updateTime: '2024-01-15 14:25:10',
      updatedBy: '系统管理员',
      speed: 0,
      direction: 0,
      workingHours: 203.2,
      totalDistance: 3521.8,
      taskCount: 456,
      errorCount: 1,
    },
    {
      id: '3',
      deviceName: 'AGV-003',
      deviceKey: 'agv_003_key',
      deviceType: '机器人设备',
      productName: '智能搬运机器人',
      isEnabled: true,
      currentStatus: '充电中',
      isOnline: true,
      relatedMap: '仓储区域C',
      mapPosition: '充电桩1',
      ipAddress: '192.168.1.103',
      port: '8080',
      macAddress: '00:1B:44:11:3A:B3',
      batteryLevel: 45,
      updateTime: '2024-01-15 14:20:30',
      updatedBy: '系统管理员',
      speed: 0,
      direction: 0,
      workingHours: 89.7,
      totalDistance: 1654.3,
      taskCount: 234,
      errorCount: 0,
    },
  ];

  // 模拟获取设备详情数据
  useEffect(() => {
    const fetchDeviceDetail = async () => {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        // 从模拟数据列表中查找对应的设备
        const foundDevice = mockRobotList.find(robot => robot.id === id);
        if (foundDevice) {
          setDevice(foundDevice);
          setCurrentRobotId(foundDevice.id);
          
          // 检查当前机器人是否已在标签页列表中
          setRobotTabs(prevTabs => {
            const existingTab = prevTabs.find(tab => tab.id === foundDevice.id);
            if (!existingTab) {
              // 如果不存在，添加到标签页列表
              return [...prevTabs, foundDevice];
            }
            return prevTabs;
          });
        } else {
          // 如果没找到，使用默认的第一个设备
          const defaultDevice = mockRobotList[0];
          setDevice(defaultDevice);
          setCurrentRobotId(defaultDevice.id);
          setRobotTabs([defaultDevice]);
        }
        
        // 初始化模拟设备任务数据
        const mockDeviceTasks: DeviceTask[] = [
          {
            id: 'task_001',
            name: '移动到地图A的充电点1',
            type: 'move',
            status: 'running',
            startTime: '2024-01-20 14:30:00',
            targetMapId: 'map_a',
            targetMapName: '地图A',
            targetPointId: 'charge_001',
            targetPointName: '充电点1',
            description: '设备正在移动到地图A的充电点1',
            progress: 65
          },
          {
            id: 'task_002',
            name: '清洁行为树',
            type: 'behavior_tree',
            status: 'completed',
            startTime: '2024-01-20 10:00:00',
            endTime: '2024-01-20 12:30:00',
            behaviorTreeId: 'bt_clean_001',
            behaviorTreeName: '清洁行为树',
            description: '执行清洁行为树任务',
            progress: 100
          },
          {
            id: 'task_003',
            name: '移动到地图B的站点3',
            type: 'move',
            status: 'failed',
            errorCode: 'E001',
            startTime: '2024-01-20 09:00:00',
            endTime: '2024-01-20 09:15:00',
            targetMapId: 'map_b',
            targetMapName: '地图B',
            targetPointId: 'station_003',
            targetPointName: '站点3',
            description: '移动任务执行失败：路径被阻塞',
            progress: 25
          },
          {
            id: 'task_004',
            name: '巡检行为树',
            type: 'behavior_tree',
            status: 'running',
            startTime: '2024-01-19 17:45:00',
            behaviorTreeId: 'bt_patrol_001',
            behaviorTreeName: '巡检行为树',
            description: '正在执行巡检任务',
            progress: 60
          },
          {
            id: 'task_005',
            name: '移动到地图C的临停点2',
            type: 'move',
            status: 'completed',
            startTime: '2024-01-19 16:00:00',
            endTime: '2024-01-19 16:25:00',
            targetMapId: 'map_c',
            targetMapName: '地图C',
            targetPointId: 'temp_002',
            targetPointName: '临停点2',
            description: '移动任务已完成',
            progress: 100
          },
          {
            id: 'task_006',
            name: '配送行为树',
            type: 'behavior_tree',
            status: 'failed',
            errorCode: 'E002',
            startTime: '2024-01-19 15:30:00',
            endTime: '2024-01-19 15:45:00',
            behaviorTreeId: 'bt_delivery_001',
            behaviorTreeName: '配送行为树',
            description: '配送任务执行失败：目标不可达',
            progress: 40
          }
        ];
        
        setDeviceTasks(mockDeviceTasks);

        initializeData();
        setLoading(false);
      }, 500);
    };

    if (id) {
      fetchDeviceDetail();
    }
  }, [id]);

  // 处理关闭按钮
  const handleClose = () => {
    navigate('/resources/devices');
    message.success('已退出机器人详情页');
  };

  // 处理标签页切换
  const handleTabSwitch = (robotId: string) => {
    if (robotId !== currentRobotId) {
      navigate(`/resources/devices/robot/${robotId}`);
    }
  };

  // 处理单个标签页关闭
  const handleTabClose = (robotId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    
    const updatedTabs = robotTabs.filter(tab => tab.id !== robotId);
    setRobotTabs(updatedTabs);
    
    // 如果关闭的是当前激活的标签页
    if (robotId === currentRobotId) {
      if (updatedTabs.length > 0) {
        // 切换到第一个剩余的标签页
        navigate(`/resources/devices/robot/${updatedTabs[0].id}`);
      } else {
        // 如果没有剩余标签页，返回设备列表
        navigate('/resources/devices');
        message.success('已关闭所有机器人标签页');
        return;
      }
    }
    
    const closedRobot = robotTabs.find(tab => tab.id === robotId);
    if (closedRobot) {
      message.success(`已关闭 ${closedRobot.deviceName} 标签页`);
    }
  };

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (value) {
      // 模糊匹配机器人名称
      const filteredOptions = mockRobotList
        .filter(robot => 
          robot.deviceName.toLowerCase().includes(value.toLowerCase()) ||
          robot.id.includes(value)
        )
        .map(robot => ({
          value: robot.deviceName,
          label: `${robot.deviceName} (${robot.currentStatus})`,
          robot: robot
        }));
      setSearchOptions(filteredOptions);
    } else {
      setSearchOptions([]);
    }
  };

  // 处理搜索选择
  const handleSearchSelect = (_value: string, option: any) => {
    const selectedRobot = option.robot;
    if (selectedRobot) {
      // 检查是否已存在该机器人标签页
      const existingTab = robotTabs.find(tab => tab.id === selectedRobot.id);
      
      if (!existingTab) {
        // 如果不存在，添加新标签页
        setRobotTabs(prevTabs => [...prevTabs, selectedRobot]);
        message.success(`已添加 ${selectedRobot.deviceName} 标签页`);
      } else {
        message.info(`${selectedRobot.deviceName} 标签页已存在`);
      }
      
      // 切换到选中的机器人
      if (selectedRobot.id !== currentRobotId) {
        navigate(`/resources/devices/robot/${selectedRobot.id}`);
      }
      
      setSearchValue('');
      setSearchOptions([]);
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

  // 位姿管理处理函数
  const handlePoseAdd = () => {
    setPoseEditingItem(null);
    poseForm.resetFields();
    setPoseModalVisible(true);
  };

  const handlePoseEdit = (record: PoseManagementItem) => {
    setPoseEditingItem(record);
    poseForm.setFieldsValue(record);
    setPoseModalVisible(true);
  };

  const handlePoseDelete = (record: PoseManagementItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除位姿 "${record.name}" 吗？`,
      onOk: () => {
        deletePose(record.id);
        message.success('位姿删除成功');
      }
    });
  };

  

  const handlePoseExport = () => {
    const selectedData = poseData.filter(item => poseSelectedRowKeys.includes(item.id));
    const dataToExport = selectedData.length > 0 ? selectedData : poseData;
    
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pose_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success(`已导出 ${dataToExport.length} 条位姿数据`);
  };

  // 坐标系管理处理函数
  const handleCoordinateAdd = () => {
    setCoordinateEditingItem(null);
    coordinateForm.resetFields();
    setCoordinateModalVisible(true);
  };

  const handleCoordinateEdit = (record: CoordinateSystemItem) => {
    setCoordinateEditingItem(record);
    coordinateForm.setFieldsValue(record);
    setCoordinateModalVisible(true);
  };

  const handleCoordinateDelete = (record: CoordinateSystemItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除坐标系 "${record.name}" 吗？`,
      onOk: () => {
        deleteCoordinate(record.id);
        message.success('坐标系删除成功');
      }
    });
  };

  

  const handleCoordinateExport = () => {
    const selectedData = coordinateData.filter(item => coordinateSelectedRowKeys.includes(item.id));
    const dataToExport = selectedData.length > 0 ? selectedData : coordinateData;
    
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordinate_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success(`已导出 ${dataToExport.length} 条坐标系数据`);
  };



  // 模拟任务记录数据
  const taskRecords: TaskRecord[] = [
    {
      id: '1',
      taskName: '货物搬运-A区到B区',
      taskType: '搬运任务',
      startTime: '2024-01-15 14:20:00',
      endTime: '2024-01-15 14:28:30',
      status: 'completed',
      duration: '8分30秒',
      description: '成功将货物从A区搬运至B区',
    },
    {
      id: '2',
      taskName: '巡检任务-仓储区域',
      taskType: '巡检任务',
      startTime: '2024-01-15 13:45:00',
      endTime: '2024-01-15 14:15:00',
      status: 'completed',
      duration: '30分钟',
      description: '完成仓储区域安全巡检',
    },
    {
      id: '3',
      taskName: '充电任务',
      taskType: '维护任务',
      startTime: '2024-01-15 12:30:00',
      endTime: '2024-01-15 13:30:00',
      status: 'completed',
      duration: '1小时',
      description: '电量充至100%',
    },
  ];

  // 模拟状态历史数据
  const statusHistory: StatusHistory[] = [
    {
      id: '1',
      status: '执行中',
      timestamp: '2024-01-15 14:20:00',
      duration: '10分钟',
      description: '开始执行搬运任务',
    },
    {
      id: '2',
      status: '空闲',
      timestamp: '2024-01-15 14:15:00',
      duration: '5分钟',
      description: '等待任务分配',
    },
    {
      id: '3',
      status: '充电中',
      timestamp: '2024-01-15 12:30:00',
      duration: '1小时45分钟',
      description: '自动充电至100%',
    },
  ];

  // 将时间字符串转换为分钟数
  const convertToMinutes = (duration: string): string => {
    if (duration.includes('小时')) {
      const hours = parseFloat(duration.match(/(\d+(?:\.\d+)?)小时/)?.[1] || '0');
      const minutes = parseFloat(duration.match(/(\d+(?:\.\d+)?)分钟/)?.[1] || '0');
      return (hours * 60 + minutes).toFixed(1);
    } else if (duration.includes('分钟')) {
      const minutes = parseFloat(duration.match(/(\d+(?:\.\d+)?)分钟/)?.[1] || '0');
      return minutes.toFixed(1);
    } else if (duration.includes('秒')) {
      const minutes = parseFloat(duration.match(/(\d+(?:\.\d+)?)分钟/)?.[1] || '0');
      const seconds = parseFloat(duration.match(/(\d+(?:\.\d+)?)秒/)?.[1] || '0');
      return (minutes + seconds / 60).toFixed(1);
    }
    return '0.0';
  };

  // 任务记录表格列配置
  const taskColumns: ColumnsType<TaskRecord> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 120,
      align: 'center',
      render: (text: string) => (
        <Tag color="blue" size="small">{text}</Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      align: 'center',
      sorter: (a: TaskRecord, b: TaskRecord) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      align: 'center',
      sorter: (a: TaskRecord, b: TaskRecord) => 
        new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
    },
    {
      title: '耗时（分钟）',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      align: 'center',
      render: (text: string) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          {convertToMinutes(text)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      filters: [
        { text: '已完成', value: 'completed' },
        { text: '执行中', value: 'running' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value: any, record: TaskRecord) => record.status === value,
      render: (status: string) => {
        const statusMap = {
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' },
          running: { color: 'processing', text: '执行中' },
        };
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_: any, record: TaskRecord) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              message.info(`查看任务详情: ${record.taskName}`);
            }}
          >
            详情
          </Button>
          {record.status === 'running' && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => {
                message.warning(`停止任务: ${record.taskName}`);
              }}
            >
              停止
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 设备任务表格列定义
  const deviceTaskColumns: ColumnsType<DeviceTask> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      align: 'left',
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      align: 'left',
      render: (text: string, record: DeviceTask) => {
        if (record.type === 'move') {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>{record.targetMapName}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{record.targetPointName}</div>
            </div>
          );
        } else if (record.type === 'behavior_tree') {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>{record.behaviorTreeName}</div>
            </div>
          );
        }
        return text;
      },
    },
    {
      title: '执行类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'left',
      render: (type: string) => {
        const typeMap = {
          move: { color: 'blue', text: '移动' },
          behavior_tree: { color: 'green', text: '行为树' },
        };
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '执行结果',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'left',
      render: (status: string) => {
        const statusMap = {
          running: { status: 'processing', text: '运行中' },
          completed: { status: 'success', text: '已完成' },
          failed: { status: 'error', text: '失败' },
          cancelled: { status: 'default', text: '已取消' },
          paused: { status: 'warning', text: '暂停中' },
        };
        const config = statusMap[status as keyof typeof statusMap] || { status: 'default', text: '未知' };
        return <Badge status={config.status as any} text={config.text} />;
      },
    },
    {
      title: '错误码',
      dataIndex: 'errorCode',
      key: 'errorCode',
      width: 100,
      align: 'left',
      render: (errorCode: string) => errorCode || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      align: 'left',
      sorter: (a: DeviceTask, b: DeviceTask) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      align: 'left',
      render: (endTime: string) => endTime || '-',
      sorter: (a: DeviceTask, b: DeviceTask) => {
        if (!a.endTime && !b.endTime) return 0;
        if (!a.endTime) return 1;
        if (!b.endTime) return -1;
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      align: 'right',
      render: (_: any, record: DeviceTask) => {
        const { status, type } = record;
        return (
          <Space size={4}>
            {status === 'running' && (
              <>
                {/* 移动任务显示暂停和取消，行为树任务只显示取消 */}
                {type === 'move' && (
                  <Button
                    type="link"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={() => {
                      // 更新任务状态为暂停
                      setDeviceTasks(prevTasks => 
                        prevTasks.map(task => 
                          task.id === record.id 
                            ? { ...task, status: 'paused' as const, description: '任务已暂停' }
                            : task
                        )
                      );
                      message.info(`暂停任务: ${record.name}`);
                    }}
                  >
                    暂停
                  </Button>
                )}
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    message.warning(`取消任务: ${record.name}`);
                  }}
                >
                  取消
                </Button>
              </>
            )}
            {status === 'paused' && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                     // 更新任务状态为运行中
                     setDeviceTasks(prevTasks => 
                       prevTasks.map(task => 
                         task.id === record.id 
                           ? { ...task, status: 'running' as const, description: task.type === 'move' ? '设备正在移动中' : '行为树正在执行中' }
                           : task
                       )
                     );
                     message.success(`继续任务: ${record.name}`);
                   }}
                >
                  继续
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    message.warning(`取消任务: ${record.name}`);
                  }}
                >
                  取消
                </Button>
              </>
            )}
            {status === 'cancelled' && (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  message.success(`继续任务: ${record.name}`);
                }}
              >
                继续
              </Button>
            )}
            {(status === 'completed' || status === 'failed') && (
              <span style={{ color: '#999' }}>无操作</span>
            )}
          </Space>
        );
      },
    },
  ];

  // 过滤任务记录
  const filteredTaskRecords = taskRecords.filter(task => {
    if (!taskSearchText) return true;
    return task.taskName.toLowerCase().includes(taskSearchText.toLowerCase()) ||
           task.taskType.toLowerCase().includes(taskSearchText.toLowerCase());
  });

  // 控制按钮处理函数
  const handleControl = (action: string) => {
    message.success(`${action}指令已发送`);
  };

  if (loading) {
    return (
      <div style={{ background: 'transparent', margin: '16px' }}>
        <Card loading={loading} />
      </div>
    );
  }

  if (!device) {
    return (
      <div style={{ background: 'transparent', margin: '16px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>设备不存在</p>
            <Button onClick={() => navigate('/resources/devices')}>返回设备管理</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* 位姿管理模态框 */}
      <Modal
        title={poseEditingItem ? '编辑位姿' : '新增位姿'}
        open={poseModalVisible}
        onOk={() => {
           poseForm.validateFields().then((values: any) => {
            if (poseEditingItem) {
              // 编辑模式
              updatePose(poseEditingItem.id, { ...values, lastModified: new Date().toLocaleString() });
              message.success('位姿更新成功');
              setPoseModalVisible(false);
              setPoseEditingItem(null);
              poseForm.resetFields();
            } else {
              // 新增模式
              const newPose: PoseManagementItem = {
                id: `pose_${Date.now()}`,
                ...values,
                timestamp: new Date().toISOString(),
                createdBy: '当前用户',
                lastModified: new Date().toLocaleString(),
              };
              addPose(newPose);
              message.success('位姿创建成功');
              
              // 连续操作模式：清空表单但不关闭弹窗
              if (poseContinuousMode) {
                poseForm.resetFields();
                // 重新设置默认值
                poseForm.setFieldsValue({
                  status: 'active',
                  frameId: 'base_link',
                });
              } else {
                // 普通模式：关闭弹窗并清空表单
                setPoseModalVisible(false);
                setPoseEditingItem(null);
                poseForm.resetFields();
              }
            }
          });
        }}
        onCancel={() => {
          setPoseModalVisible(false);
          setPoseEditingItem(null);
          poseForm.resetFields();
          setPoseContinuousMode(false); // 关闭时重置连续操作开关
        }}
        width={700}
      >
        <Form
          form={poseForm}
          layout="vertical"
          initialValues={{
            status: 'active',
            frameId: 'base_link',
          }}
        >
          {/* 连续操作开关 - 仅在新增模式下显示 */}
          {!poseEditingItem && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <Space align="center">
                <Switch
                  checked={poseContinuousMode}
                  onChange={setPoseContinuousMode}
                  size="small"
                />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  连续操作模式
                </span>
                <Tooltip title="开启后，保存成功时将清空表单内容但不关闭弹窗，方便连续添加多个位姿">
                  <span style={{ color: '#999', cursor: 'help' }}>ⓘ</span>
                </Tooltip>
              </Space>
            </div>
          )}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入位姿名称' }]}
              >
                <Input placeholder="请输入位姿名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="workingFrameName"
                label="作用坐标名称"
                rules={[{ required: true, message: '请输入作用坐标名称' }]}
              >
                <Input placeholder="请输入作用坐标名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="referenceFrameName"
                label="参考坐标名称"
                rules={[{ required: true, message: '请输入参考坐标名称' }]}
              >
                <Input placeholder="请输入参考坐标名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="positionX"
                label="位置 X"
                rules={[{ required: true, message: '请输入X坐标' }]}
              >
                <InputNumber placeholder="X坐标" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="positionY"
                label="位置 Y"
                rules={[{ required: true, message: '请输入Y坐标' }]}
              >
                <InputNumber placeholder="Y坐标" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="positionZ"
                label="位置 Z"
                rules={[{ required: true, message: '请输入Z坐标' }]}
              >
                <InputNumber placeholder="Z坐标" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="rotationX"
                label="旋转 Rx"
                rules={[{ required: true, message: '请输入X旋转角度' }]}
              >
                <InputNumber placeholder="Rx角度" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rotationY"
                label="旋转 Ry"
                rules={[{ required: true, message: '请输入Y旋转角度' }]}
              >
                <InputNumber placeholder="Ry角度" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rotationZ"
                label="旋转 Rz"
                rules={[{ required: true, message: '请输入Z旋转角度' }]}
              >
                <InputNumber placeholder="Rz角度" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
          {/* 第一行：J1, J2, J3 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="joint1"
                label="关节 J1"
                rules={[{ required: true, message: '请输入J1角度' }]}
              >
                <InputNumber placeholder="J1" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="joint2"
                label="关节 J2"
                rules={[{ required: true, message: '请输入J2角度' }]}
              >
                <InputNumber placeholder="J2" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="joint3"
                label="关节 J3"
                rules={[{ required: true, message: '请输入J3角度' }]}
              >
                <InputNumber placeholder="J3" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
          {/* 第二行：J4, J5, J6 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="joint4"
                label="关节 J4"
                rules={[{ required: true, message: '请输入J4角度' }]}
              >
                <InputNumber placeholder="J4" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="joint5"
                label="关节 J5"
                rules={[{ required: true, message: '请输入J5角度' }]}
              >
                <InputNumber placeholder="J5" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="joint6"
                label="关节 J6"
                rules={[{ required: true, message: '请输入J6角度' }]}
              >
                <InputNumber placeholder="J6" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 坐标系管理模态框 */}
      <Modal
        title={coordinateEditingItem ? '编辑坐标系' : '新增坐标系'}
        open={coordinateModalVisible}
        onOk={() => {
           coordinateForm.validateFields().then((values: any) => {
            if (coordinateEditingItem) {
              // 编辑模式
              updateCoordinate(coordinateEditingItem.id, { ...values, lastModified: new Date().toLocaleString() });
              message.success('坐标系更新成功');
              setCoordinateModalVisible(false);
              setCoordinateEditingItem(null);
              coordinateForm.resetFields();
            } else {
              // 新增模式
              const newCoordinate: CoordinateSystemItem = {
                id: `coord_${Date.now()}`,
                ...values,
                createdBy: '当前用户',
                lastModified: new Date().toLocaleString(),
              };
              addCoordinate(newCoordinate);
              message.success('坐标系创建成功');
              
              // 连续操作模式：清空表单但不关闭弹窗
              if (coordinateContinuousMode) {
                coordinateForm.resetFields();
                // 重新设置默认值
                coordinateForm.setFieldsValue({
                  parentFrame: 'map',
                });
              } else {
                // 普通模式：关闭弹窗并清空表单
                setCoordinateModalVisible(false);
                setCoordinateEditingItem(null);
                coordinateForm.resetFields();
              }
            }
          });
        }}
        onCancel={() => {
          setCoordinateModalVisible(false);
          setCoordinateEditingItem(null);
          coordinateForm.resetFields();
          setCoordinateContinuousMode(false); // 关闭时重置连续操作开关
        }}
        width={700}
      >
        <Form
          form={coordinateForm}
          layout="vertical"
          initialValues={{
            parentFrame: 'map',
          }}
        >
          {/* 连续操作开关 - 仅在新增模式下显示 */}
          {!coordinateEditingItem && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <Space align="center">
                <Switch
                  checked={coordinateContinuousMode}
                  onChange={setCoordinateContinuousMode}
                  size="small"
                />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  连续操作模式
                </span>
                <Tooltip title="开启后，保存成功时将清空表单内容但不关闭弹窗，方便连续添加多个坐标系">
                  <span style={{ color: '#999', cursor: 'help' }}>ⓘ</span>
                </Tooltip>
              </Space>
            </div>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入坐标系名称' }]}
              >
                <Input placeholder="请输入坐标系名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parentFrame"
                label="参考坐标名称"
                rules={[{ required: true, message: '请选择参考坐标名称' }]}
              >
                <Select placeholder="请选择参考坐标名称">
                  <Select.Option value="map">map</Select.Option>
                  <Select.Option value="odom">odom</Select.Option>
                  <Select.Option value="base_link">base_link</Select.Option>
                  <Select.Option value="world">world</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="translationX"
                label="X"
                rules={[{ required: true, message: '请输入X坐标' }]}
              >
                <InputNumber placeholder="X坐标" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="translationY"
                label="Y"
                rules={[{ required: true, message: '请输入Y坐标' }]}
              >
                <InputNumber placeholder="Y坐标" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="translationZ"
                label="Z"
                rules={[{ required: true, message: '请输入Z坐标' }]}
              >
                <InputNumber placeholder="Z坐标" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="rotationX"
                label="Rx"
                rules={[{ required: true, message: '请输入Rx旋转角度' }]}
              >
                <InputNumber placeholder="Rx角度" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rotationY"
                label="Ry"
                rules={[{ required: true, message: '请输入Ry旋转角度' }]}
              >
                <InputNumber placeholder="Ry角度" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rotationZ"
                label="Rz"
                rules={[{ required: true, message: '请输入Rz旋转角度' }]}
              >
                <InputNumber placeholder="Rz角度" style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <div style={{ background: 'transparent' }}>
      {/* 二级面包屑导航 - 多机器人标签页 */}
      <div style={{ 
        marginBottom: '16px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 8]}>
          <Col flex="auto" style={{ minWidth: 0 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              flexWrap: 'wrap',
              overflow: 'hidden'
            }}>
              {robotTabs.map((robot) => (
                <div
                  key={robot.id}
                  onClick={() => handleTabSwitch(robot.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: robot.id === currentRobotId 
                      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' 
                      : '#ffffff',
                    color: robot.id === currentRobotId ? '#ffffff' : '#262626',
                    border: `1px solid ${robot.id === currentRobotId ? '#1890ff' : '#e8e8e8'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: robot.id === currentRobotId ? 500 : 400,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '28px',
                    maxWidth: '150px',
                    boxShadow: robot.id === currentRobotId 
                      ? '0 2px 8px rgba(24, 144, 255, 0.3)' 
                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (robot.id !== currentRobotId) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)';
                      e.currentTarget.style.borderColor = '#40a9ff';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(64, 169, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (robot.id !== currentRobotId) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <span style={{ 
                    marginRight: '6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {robot.deviceName}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleTabClose(robot.id, e)}
                    style={{
                      color: robot.id === currentRobotId ? 'rgba(255, 255, 255, 0.8)' : '#8c8c8c',
                      padding: '0',
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      lineHeight: '18px',
                      fontSize: '10px',
                      borderRadius: '3px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.background = robot.id === currentRobotId 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title={`关闭 ${robot.deviceName}`}
                  />
                </div>
              ))}
              
              {/* 全部关闭按钮 */}
              {robotTabs.length > 1 && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<CloseOutlined />} 
                  onClick={handleClose}
                  style={{ 
                    color: '#8c8c8c',
                    padding: '4px 8px',
                    height: '28px',
                    lineHeight: '20px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #e8e8e8',
                    background: '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.background = '#fff2f0';
                    e.currentTarget.style.borderColor = '#ffccc7';
                    e.currentTarget.style.color = '#ff4d4f';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.color = '#8c8c8c';
                  }}
                  title="关闭所有标签页"
                >
                  全部关闭
                </Button>
              )}
            </div>
          </Col>
          <Col style={{ flexShrink: 0 }}>
            <AutoComplete
              style={{ width: 200, minWidth: 150 }}
              value={searchValue}
              options={searchOptions}
              onSearch={handleSearchChange}
              onSelect={handleSearchSelect}
              allowClear
            >
              <Input 
                size="middle"
                placeholder="搜索添加机器人..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                style={{ 
                  fontSize: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid #e8e8e8' 
                }}
              />
            </AutoComplete>
          </Col>
        </Row>
      </div>

      {/* 页面头部 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div>
              <Space size={8} align="center">
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{device.deviceName}</span>
                {getStatusTag(device.currentStatus)}
                {device.isOnline ? (
                  <Space size={8}>
                    <Badge status="success" text="在线" />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      IP: {device.ipAddress} | 端口: {device.port} | MAC: {device.macAddress}
                    </span>
                  </Space>
                ) : (
                  <Badge status="error" text="离线" />
                )}
              </Space>
            </div>
          </Col>
          <Col>
            <Space>

              <Button 
                icon={<PauseCircleOutlined />}
                onClick={() => handleControl('暂停')}
                disabled={!device.isOnline || device.currentStatus !== '执行中'}
              >
                暂停
              </Button>
              <Button 
                danger 
                icon={<StopOutlined />}
                onClick={() => handleControl('停止')}
                disabled={!device.isOnline}
              >
                急停
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => handleControl('重启')}
                disabled={!device.isOnline}
              >
                重启
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        {/* 顶部自定义切换按钮 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Space size={12}>
            <Button
              type={studioTab === 'mystudio' ? 'primary' : 'default'}
              onClick={() => setStudioTab('mystudio')}
              style={{
                borderRadius: '8px',
                padding: '6px 16px',
                minWidth: '96px'
              }}
            >
              mystudio
            </Button>
            <Button
              type={studioTab === '烛微' ? 'primary' : 'default'}
              onClick={() => setStudioTab('烛微')}
              style={{
                borderRadius: '8px',
                padding: '6px 16px',
                minWidth: '96px'
              }}
            >
              烛微
            </Button>
          </Space>
        </div>
        {studioTab === 'mystudio' ? (
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
            {
              key: 'overview',
              label: '设备概览',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="基本信息" size="small">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="设备名称">{device.deviceName}</Descriptions.Item>
                        <Descriptions.Item label="设备Key">{device.deviceKey}</Descriptions.Item>
                        <Descriptions.Item label="设备类型">{device.deviceType}</Descriptions.Item>
                        <Descriptions.Item label="所属产品">{device.productName}</Descriptions.Item>

                        <Descriptions.Item label="当前状态">
                          {getStatusTag(device.currentStatus)}
                        </Descriptions.Item>
                        <Descriptions.Item label="在线状态">
                          {device.isOnline ? (
                            <Space size={4}>
                              <WifiOutlined style={{ color: '#52c41a' }} />
                              <Tag color="success">在线</Tag>
                            </Space>
                          ) : (
                            <Space size={4}>
                              <DisconnectOutlined style={{ color: '#ff4d4f' }} />
                              <Tag color="error">离线</Tag>
                            </Space>
                          )}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="网络信息" size="small">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="IP地址">{device.ipAddress}</Descriptions.Item>
                        <Descriptions.Item label="端口">{device.port}</Descriptions.Item>
                        <Descriptions.Item label="MAC地址">{device.macAddress}</Descriptions.Item>
                        <Descriptions.Item label="关联地图">{device.relatedMap}</Descriptions.Item>
                        <Descriptions.Item label="地图点位">{device.mapPosition}</Descriptions.Item>
                        <Descriptions.Item label="更新时间">{device.updateTime}</Descriptions.Item>
                        <Descriptions.Item label="更新人">{device.updatedBy}</Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'performance',
              label: '设备地图',
              children: (
                <div style={{ background: 'transparent' }}>
                  {/* 地图编辑器 */}
                  <Card 
                    style={{ 
                      height: '840px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    styles={{
                      body: {
                        flex: 1,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column'
                      }
                    }}
                  >
                    <DeviceMapEditor 
                      deviceId={device.id}
                      deviceName={device.deviceName}
                      currentPosition={
                        device.mapPosition ? 
                        (() => {
                          // 尝试解析位置字符串，格式如 "x:100,y:200" 或 "100,200"
                          try {
                            if (device.mapPosition.includes('x:') && device.mapPosition.includes('y:')) {
                              const matches = device.mapPosition.match(/x:(\d+),y:(\d+)/);
                              if (matches) {
                                return { x: parseInt(matches[1]), y: parseInt(matches[2]) };
                              }
                            } else if (device.mapPosition.includes(',')) {
                              const [x, y] = device.mapPosition.split(',').map(s => parseInt(s.trim()));
                              if (!isNaN(x) && !isNaN(y)) {
                                return { x, y };
                              }
                            }
                          } catch (e) {
                            console.warn('无法解析设备位置:', device.mapPosition);
                          }
                          // 为测试提供一个有效的默认位置（画布中心区域）
                          return { x: 500, y: 400 };
                        })() : 
                        // 如果没有mapPosition，也提供一个默认位置用于雷达测试
                        { x: 500, y: 400 }
                      }
                      mapName={device.relatedMap}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'behaviorTree',
              label: '行为树',
              children: (
                <div style={{ background: 'transparent' }} key={`behavior-tree-${device.id}`}>
                  <Card 
                    style={{ 
                      height: '840px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    styles={{
                      body: {
                        flex: 1,
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column'
                      }
                    }}
                  >
                    <DeviceBehaviorTreeEditor 
                      key={`device-behavior-tree-${device.id}`}
                      deviceId={device.id}
                      deviceName={device.deviceName}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'pose_management',
              label: '位姿管理',
              children: (
                <div style={{ background: 'transparent' }}>
                  {/* 操作栏 */}
                  <Card style={{ marginBottom: '16px' }}>
                    <Row gutter={16} align="middle">
                      <Col flex="auto">
                        <Space>
                          <Button type="primary" icon={<PlusOutlined />} onClick={handlePoseAdd}>
                            新增位姿
                          </Button>
                          <Button 
                            icon={<ExportOutlined />} 
                            onClick={handlePoseExport}
                            disabled={poseData.length === 0}
                          >
                            导出数据
                          </Button>
                          <Button icon={<ImportOutlined />}>
                            导入数据
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* 位姿管理表格 */}
                  <Card>
                    <Table<PoseManagementItem>
                      columns={[
                        {
                          title: '名称',
                          dataIndex: 'name',
                          key: 'name',
                          width: 100,
                          align: 'left',
                          fixed: 'left',
                        },
                        {
                          title: '作用坐标名称',
                          dataIndex: 'workingFrameName',
                          key: 'workingFrameName',
                          width: 120,
                          align: 'left',
                        },
                        {
                          title: '参考坐标名称',
                          dataIndex: 'referenceFrameName',
                          key: 'referenceFrameName',
                          width: 120,
                          align: 'left',
                        },
                        {
                          title: 'X',
                          dataIndex: 'positionX',
                          key: 'positionX',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Y',
                          dataIndex: 'positionY',
                          key: 'positionY',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Z',
                          dataIndex: 'positionZ',
                          key: 'positionZ',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Rx',
                          dataIndex: 'rotationX',
                          key: 'rotationX',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Ry',
                          dataIndex: 'rotationY',
                          key: 'rotationY',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Rz',
                          dataIndex: 'rotationZ',
                          key: 'rotationZ',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'J1',
                          dataIndex: 'joint1',
                          key: 'joint1',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'J2',
                          dataIndex: 'joint2',
                          key: 'joint2',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'J3',
                          dataIndex: 'joint3',
                          key: 'joint3',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'J4',
                          dataIndex: 'joint4',
                          key: 'joint4',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'J5',
                          dataIndex: 'joint5',
                          key: 'joint5',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'J6',
                          dataIndex: 'joint6',
                          key: 'joint6',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 150,
                          align: 'right',
                          fixed: 'right',
                          render: (_: any, record: PoseManagementItem) => (
                            <Space size={8}>
                              <Button type="link" icon={<EditOutlined />} onClick={() => handlePoseEdit(record)} size="small">
                                编辑
                              </Button>
                              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handlePoseDelete(record)} size="small">
                                删除
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                      dataSource={poseData}
                      rowKey="id"
                      size="middle"
                      scroll={{ x: 'max-content' }}
                      pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        defaultPageSize: 10,
                      }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'coordinate_management',
              label: '坐标系管理',
              children: (
                <div style={{ background: 'transparent' }}>
                  {/* 操作栏 */}
                  <Card style={{ marginBottom: '16px' }}>
                    <Row gutter={16} align="middle">
                      <Col flex="auto">
                        <Space>
                          <Button type="primary" icon={<PlusOutlined />} onClick={handleCoordinateAdd}>
                            新增坐标系
                          </Button>
                          <Button 
                            icon={<ExportOutlined />} 
                            onClick={handleCoordinateExport}
                            disabled={coordinateData.length === 0}
                          >
                            导出数据
                          </Button>
                          <Button icon={<ImportOutlined />}>
                            导入数据
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* 坐标系管理表格 */}
                  <Card>
                    <Table<CoordinateSystemItem>
                      columns={[
                        {
                          title: '名称',
                          dataIndex: 'name',
                          key: 'name',
                          width: 100,
                          align: 'left',
                          fixed: 'left',
                        },
                        {
                          title: '参考坐标名称',
                          dataIndex: 'parentFrame',
                          key: 'parentFrame',
                          width: 120,
                          align: 'left',
                        },
                        {
                          title: 'X',
                          dataIndex: 'translationX',
                          key: 'translationX',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Y',
                          dataIndex: 'translationY',
                          key: 'translationY',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Z',
                          dataIndex: 'translationZ',
                          key: 'translationZ',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Rx',
                          dataIndex: 'rotationX',
                          key: 'rotationX',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Ry',
                          dataIndex: 'rotationY',
                          key: 'rotationY',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: 'Rz',
                          dataIndex: 'rotationZ',
                          key: 'rotationZ',
                          width: 80,
                          align: 'left',
                          render: (value: number) => value != null ? value.toFixed(2) : '-',
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 150,
                          align: 'right',
                          fixed: 'right',
                          render: (_: any, record: CoordinateSystemItem) => (
                            <Space size={8}>
                              <Button type="link" icon={<EditOutlined />} onClick={() => handleCoordinateEdit(record)} size="small">
                                编辑
                              </Button>
                              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleCoordinateDelete(record)} size="small">
                                删除
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                      dataSource={coordinateData}
                      rowKey="id"
                      size="middle"
                      scroll={{ x: 'max-content' }}
                      pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        defaultPageSize: 10,
                      }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'device_io_management',
              label: '设备I/O管理',
              children: (
                <div style={{ background: 'transparent' }}>
                  {(() => {
                    const onNext = (currentId: string) => {
                      const idx = ioDeviceData.findIndex(d => d.id === currentId);
                      const next = ioDeviceData[(idx + 1) % ioDeviceData.length];
                      Modal.destroyAll();
                      showIoModal(next);
                    };
                    const showIoModal = (ioDevice: { id: string; name: string; hardwareType: string; description: string }) => {
                      Modal.info({
                        title: null,
                        icon: null,
                        width: 1200,
                        maskClosable: true,
                        closable: true,
                        okButtonProps: { style: { display: 'none' } },
                        content: (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <Space>
                                <span style={{ fontWeight: 600 }}>设备名称：</span>
                                <span style={{ fontSize: 18, fontWeight: 600 }}>{(device && device.deviceName) || ioDevice.name}</span>
                              </Space>
                              <Space style={{ marginRight: 16 }}>
                                <Button onClick={() => message.success('I/O状态已刷新')}>手动刷新</Button>
                                <Button type="primary" onClick={() => onNext(ioDevice.id)}>下一个</Button>
                              </Space>
                            </div>
                            <Row gutter={[32, 16]} style={{ display: 'flex', alignItems: 'stretch', marginTop: 8 }}>
                              <Col xs={24} md={12} style={{ display: 'flex' }}>
                                <Card style={{ width: '100%' }} title="数字输入">
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                    {Array.from({ length: 10 }).map((_, i) => {
                                      const active = i === 1; // DI2 亮起
                                      return (
                                        <div key={`di-${i}`} style={{ width: '20%', minWidth: 120, padding: 12 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 600 }}>{`DI ${i + 1}`}</span>
                                            <span
                                              style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                background: active ? '#52c41a' : '#d9d9d9',
                                                boxShadow: active ? '0 0 0 4px rgba(82,196,26,.2)' : 'none',
                                              }}
                                            />
                                          </div>
                                          <Tooltip title={'描述限定8个字符'}>
                                            <div
                                              style={{ marginTop: 8, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.whiteSpace = 'normal';
                                                e.currentTarget.style.overflow = 'visible';
                                                e.currentTarget.style.textOverflow = 'clip';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.whiteSpace = 'nowrap';
                                                e.currentTarget.style.overflow = 'hidden';
                                                e.currentTarget.style.textOverflow = 'ellipsis';
                                              }}
                                            >
                                              描述限定8个字符
                                            </div>
                                          </Tooltip>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </Card>
                              </Col>
                              <Col xs={24} md={12} style={{ display: 'flex' }}>
                                <Card style={{ width: '100%' }} title="数字输出">
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                    {Array.from({ length: 10 }).map((_, i) => {
                                      const defaultChecked = i === 1; // DO2 打开
                                      return (
                                        <div key={`do-${i}`} style={{ width: '20%', minWidth: 120, padding: 12 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Switch defaultChecked={defaultChecked} />
                                            <span style={{ fontWeight: 600 }}>{`DO ${i + 1}`}</span>
                                          </div>
                                          <Tooltip title={'描述限定8个字符'}>
                                            <div
                                              style={{ marginTop: 8, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.whiteSpace = 'normal';
                                                e.currentTarget.style.overflow = 'visible';
                                                e.currentTarget.style.textOverflow = 'clip';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.whiteSpace = 'nowrap';
                                                e.currentTarget.style.overflow = 'hidden';
                                                e.currentTarget.style.textOverflow = 'ellipsis';
                                              }}
                                            >
                                              描述限定8个字符
                                            </div>
                                          </Tooltip>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </Card>
                              </Col>
                            </Row>
                          </>
                        ),
                      });
                    };
                    const ioDeviceData = [
                      { id: 'io-1', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-2', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-3', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-4', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-5', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-6', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-7', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                      { id: 'io-8', name: 'ED_DIN', hardwareType: 'VDD_24', description: '节卡机械臂控制柜数字输入' },
                    ];
                    return (
                      <Row gutter={[16, 16]} style={{ display: 'flex', alignItems: 'stretch' }}>
                        {ioDeviceData.map((item) => (
                          <Col key={item.id} xs={24} sm={12} md={12} lg={6} style={{ display: 'flex' }}>
                            <Card
                              hoverable
                              className="transition-transform hover:-translate-y-0.5"
                              onClick={() => showIoModal(item)}
                              style={{ width: '100%', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,21,41,.08)', border: '1px solid #f0f0f0', cursor: 'pointer' }}
                              bodyStyle={{ padding: 16 }}
                            >
                              <div
                                style={{
                                  height: 120,
                                  background: '#f5f5f5',
                                  borderRadius: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#4a4a4a',
                                  fontSize: 48,
                                  fontWeight: 600,
                                  letterSpacing: 2,
                                }}
                              >
                                I/O
                              </div>
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ marginTop: 8, color: '#666' }}>
                                  硬件类型 <span style={{ marginLeft: 8 }}>{item.hardwareType}</span>
                                </div>
                                <div style={{ marginTop: 4, color: '#666' }}>
                                  硬件描述 <span style={{ marginLeft: 8 }}>{item.description}</span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    );
                  })()}
                </div>
              ),
            },
            {
              key: 'deviceTasks',
              label: '设备任务',
              children: (
                <div style={{ background: 'transparent' }}>
                  <Card style={{ marginBottom: '16px' }}>
                    <Table
                      dataSource={deviceTasks}
                      columns={deviceTaskColumns}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                      }}
                      scroll={{ x: 1200 }}
                      size="middle"
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'tasks',
              label: '调度任务',
              children: (
                <div>
                  {/* 搜索筛选区 */}
                  <Card size="small" style={{ marginBottom: '16px' }}>
                    <Row gutter={16} align="middle">
                      <Col flex="auto">
                        <Input.Search
                          placeholder="搜索任务名称或类型..."
                          value={taskSearchText}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskSearchText(e.target.value)}
                          onSearch={(value: string) => setTaskSearchText(value)}
                          allowClear
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col>
                        <Space>
                          <Button 
                            type="primary" 
                            icon={<SearchOutlined />}
                            onClick={() => {
                              message.info('刷新调度任务');
                            }}
                          >
                            刷新
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* 调度任务表格 */}
                   <Table
                     columns={taskColumns}
                     dataSource={filteredTaskRecords}
                     rowKey="id"
                     size="middle"
                     scroll={{ x: 'max-content' }}
                     pagination={{
                       showSizeChanger: true,
                       showQuickJumper: true,
                       showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                       pageSizeOptions: ['10', '20', '50', '100'],
                       defaultPageSize: 10,
                       responsive: true,
                     }}
                     className="task-records-table"
                   />
                </div>
              ),
            },
            {
              key: 'history',
              label: '状态历史',
              children: (
                <Timeline
                  items={statusHistory.map((item) => ({
                    key: item.id,
                    color: item.status === '异常' ? 'red' : 'blue',
                    children: (
                      <>
                        <div>
                          <Space>
                            <strong>{getStatusTag(item.status)}</strong>
                            <span style={{ color: '#666' }}>{item.timestamp}</span>
                          </Space>
                        </div>
                        <div style={{ marginTop: '4px', color: '#666' }}>
                          持续时长: {item.duration}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          {item.description}
                        </div>
                      </>
                    )
                  }))}
                />
              ),
            },
          ]}
          />
        ) : (
          <div style={{ background: 'transparent', height: 260 }} />
        )}
      </Card>
    </div>
    </>
  );
};

export default RobotDeviceDetail;