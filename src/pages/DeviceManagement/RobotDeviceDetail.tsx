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
  Statistic,
  Timeline,
  Badge,
  Tooltip,
  message,
  AutoComplete,
  Input,
} from 'antd';
import {
  WifiOutlined,
  DisconnectOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  CloseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import DeviceMapEditor from '../../components/DeviceMapEditor';
import type { ColumnsType } from 'antd/es/table';

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
              size="small"
              placeholder="搜索添加机器人..."
              value={searchValue}
              options={searchOptions}
              onSearch={handleSearchChange}
              onSelect={handleSearchSelect}
              allowClear
            >
              <Input 
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
                  <Badge status="success" text="在线" />
                ) : (
                  <Badge status="error" text="离线" />
                )}
              </Space>
            </div>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => handleControl('启动')}
                disabled={!device.isOnline || device.currentStatus === '执行中'}
              >
                启动
              </Button>
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
                        <Descriptions.Item label="是否启用">
                          <Tag color={device.isEnabled ? 'success' : 'error'}>
                            {device.isEnabled ? '启用' : '禁用'}
                          </Tag>
                        </Descriptions.Item>
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
                <Timeline>
                  {statusHistory.map((item) => (
                    <Timeline.Item
                      key={item.id}
                      color={item.status === '异常' ? 'red' : 'blue'}
                    >
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
                    </Timeline.Item>
                  ))}
                </Timeline>
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
                      height: '600px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    bodyStyle={{ 
                      flex: 1,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column'
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
                          // 默认位置
                          return { x: 400, y: 300 };
                        })() : 
                        undefined
                      }
                      mapName={device.relatedMap}
                    />
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default RobotDeviceDetail;