import React from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Typography,
  Timeline,
  Card,
  Row,
  Col,
  Progress,
  Button,
} from 'antd';
import {
  ClockCircleOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// 运单任务数据类型
interface WaybillTask {
  id: string;
  taskName: string;
  taskType: string;
  executionDevice: string;
  status: '待执行' | '执行中' | '已完成' | '已取消' | '异常' | '已挂起' | '已关闭' | '已暂停';
  priority: '高' | '中' | '低';
  createTime: string;
  startTime?: string;
  endTime?: string;
  progress: number;
}

// 运单任务详情组件属性
interface WaybillTaskDetailProps {
  visible: boolean;
  onClose: () => void;
  taskData: WaybillTask | null;
}

const WaybillTaskDetail: React.FC<WaybillTaskDetailProps> = ({
  visible,
  onClose,
  taskData,
}) => {
  if (!taskData) return null;

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      '待执行': 'default',
      '执行中': 'processing',
      '已完成': 'success',
      '已取消': 'warning',
      '异常': 'error',
      '已挂起': 'orange',
      '已关闭': 'volcano',
    };
    return colorMap[status] || 'default';
  };

  // 优先级颜色映射
  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      '高': 'red',
      '中': 'orange',
      '低': 'blue',
    };
    return colorMap[priority] || 'default';
  };

  // 模拟执行历史数据
  const getExecutionHistory = () => {
    const baseHistory = [
      {
        time: taskData.createTime,
        title: '任务创建',
        description: `任务 ${taskData.taskName} 已创建`,
        icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
        color: 'blue',
      },
    ];

    if (taskData.startTime) {
      baseHistory.push({
        time: taskData.startTime,
        title: '开始执行',
        description: `设备 ${taskData.executionDevice} 开始执行任务`,
        icon: <PlayCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
      });
    }

    if (taskData.status === '已完成' && taskData.endTime) {
      baseHistory.push({
        time: taskData.endTime,
        title: '执行完成',
        description: '任务执行成功完成',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
      });
    } else if (taskData.status === '异常') {
      baseHistory.push({
        time: new Date().toLocaleString(),
        title: '执行异常',
        description: '任务执行过程中出现异常',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        color: 'red',
      });
    } else if (taskData.status === '已取消') {
      baseHistory.push({
        time: new Date().toLocaleString(),
        title: '任务取消',
        description: '任务已被手动取消',
        icon: <StopOutlined style={{ color: '#faad14' }} />,
        color: 'orange',
      });
    }

    return baseHistory;
  };

  // 模拟设备信息
  const getDeviceInfo = () => {
    return {
      deviceId: taskData.executionDevice,
      deviceName: `智能搬运设备-${taskData.executionDevice.split('-')[1]}`,
      deviceType: 'AGV搬运机器人',
      location: '车间A-3号工位',
      status: taskData.status === '执行中' ? '运行中' : '空闲',
      batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
      lastMaintenance: '2024-01-10',
    };
  };

  const deviceInfo = getDeviceInfo();
  const executionHistory = getExecutionHistory();

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined />
          <span>运单任务详情</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={800}
      styles={{
        body: { padding: '24px' },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 基本信息 */}
        <Card title="基本信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="任务ID">{taskData.id}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{taskData.taskName}</Descriptions.Item>
            <Descriptions.Item label="任务类型">{taskData.taskType}</Descriptions.Item>
            <Descriptions.Item label="执行设备">{taskData.executionDevice}</Descriptions.Item>
            <Descriptions.Item label="任务状态">
              <Tag color={getStatusColor(taskData.status)}>{taskData.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={getPriorityColor(taskData.priority)}>{taskData.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{taskData.createTime}</Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {taskData.startTime || '未开始'}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {taskData.endTime || '未结束'}
            </Descriptions.Item>
            <Descriptions.Item label="执行进度">
              <Progress 
                percent={taskData.progress} 
                size="small" 
                status={
                  taskData.status === '异常' ? 'exception' :
                  taskData.status === '已完成' ? 'success' : 'active'
                }
              />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 设备信息 */}
        <Card title="设备信息" size="small">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="设备ID">{deviceInfo.deviceId}</Descriptions.Item>
                <Descriptions.Item label="设备名称">{deviceInfo.deviceName}</Descriptions.Item>
                <Descriptions.Item label="设备类型">{deviceInfo.deviceType}</Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="当前位置">{deviceInfo.location}</Descriptions.Item>
                <Descriptions.Item label="设备状态">
                  <Tag color={deviceInfo.status === '运行中' ? 'processing' : 'default'}>
                    {deviceInfo.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="电池电量">
                  <Progress 
                    percent={deviceInfo.batteryLevel} 
                    size="small"
                    format={(percent) => `${percent}%`}
                    strokeColor={
                      deviceInfo.batteryLevel > 80 ? '#52c41a' :
                      deviceInfo.batteryLevel > 50 ? '#faad14' : '#ff4d4f'
                    }
                  />
                </Descriptions.Item>
                <Descriptions.Item label="上次维护">{deviceInfo.lastMaintenance}</Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>

        {/* 执行历史 */}
        <Card title="执行历史" size="small">
          <Timeline
            items={executionHistory.map((item) => ({
              dot: item.icon,
              children: (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    {item.title}
                    <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                      {item.time}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {item.description}
                  </Text>
                </div>
              ),
            }))}
          />
        </Card>

        {/* 操作按钮 */}
        <Card size="small">
          <Space>
            {taskData.status === '待执行' && (
              <Button type="primary" icon={<PlayCircleOutlined />}>
                开始执行
              </Button>
            )}
            {taskData.status === '执行中' && (
              <>
                <Button icon={<PauseCircleOutlined />}>
                  暂停任务
                </Button>
                <Button danger icon={<StopOutlined />}>
                  停止任务
                </Button>
              </>
            )}
            {(taskData.status === '异常' || taskData.status === '已取消') && (
              <Button type="primary" icon={<PlayCircleOutlined />}>
                重新执行
              </Button>
            )}
            <Button onClick={onClose}>
              关闭
            </Button>
          </Space>
        </Card>
      </div>
    </Drawer>
  );
};

export default WaybillTaskDetail;