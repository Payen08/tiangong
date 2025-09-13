import React from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Timeline,
  Card,
  Collapse,
  Table,
  Button,
} from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  CarOutlined,
  DownOutlined,
  EyeOutlined,
  BugOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// 运单任务数据类型
interface WaybillTask {
  id: string;
  taskName: string;
  taskType: string;
  executionDevice: string;
  status: '待执行' | '执行中' | '已完成' | '已取消' | '异常' | '已挂起' | '已关闭';
  priority: '高' | '中' | '低';
  createTime: string;
  startTime?: string;
  endTime?: string;
  progress: number;
}

// 业务订单数据类型
interface BusinessOrderRecord {
  id: string;
  orderName: string;
  currentWaybill: string;
  executionStatus: '移动' | 'n1' | '呼梯' | '乘梯' | '关梯' | '上下料';
  orderStatus: '待执行' | '执行中' | '已完成' | '已取消' | '异常关闭';
  createTime: string;
  endTime?: string;
  updatedBy: string;
  waybillTasks?: WaybillTask[];
}

interface BusinessOrderDetailProps {
  visible: boolean;
  onClose: () => void;
  orderData: BusinessOrderRecord | null;
}

const BusinessOrderDetail: React.FC<BusinessOrderDetailProps> = ({
  visible,
  onClose,
  orderData,
}) => {
  if (!orderData) return null;

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      '待执行': 'default',
      '执行中': 'processing',
      '已完成': 'success',
      '已取消': 'error',
      '异常关闭': 'warning',
    };
    return statusColorMap[status] || 'default';
  };

  // 获取执行状态颜色
  const getExecutionStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      '移动': 'blue',
      'n1': 'cyan',
      '呼梯': 'orange',
      '乘梯': 'purple',
      '关梯': 'red',
      '上下料': 'green',
    };
    return statusColorMap[status] || 'default';
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '待执行': <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
      '执行中': <ClockCircleOutlined style={{ color: '#1890ff' }} />,
      '已完成': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      '已取消': <StopOutlined style={{ color: '#ff4d4f' }} />,
      '异常关闭': <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
    };
    return iconMap[status] || <ClockCircleOutlined />;
  };

  // 获取运单任务状态颜色
  const getTaskStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      '待执行': 'default',
      '执行中': 'processing',
      '已完成': 'success',
      '已取消': 'error',
      '异常': 'warning',
      '已挂起': 'orange',
      '已关闭': 'volcano',
    };
    return statusColorMap[status] || 'default';
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    const priorityColorMap: Record<string, string> = {
      '高': 'red',
      '中': 'orange',
      '低': 'blue',
    };
    return priorityColorMap[priority] || 'default';
  };

  // 模拟运单任务数据
  const mockWaybillTasks: WaybillTask[] = [
    {
      id: 'WT-001',
      taskName: '原料搬运任务',
      taskType: '搬运',
      executionDevice: 'AGV-001',
      status: '已完成',
      priority: '高',
      createTime: '2024-01-15 09:30:00',
      startTime: '2024-01-15 09:35:00',
      endTime: '2024-01-15 10:15:00',
      progress: 100,
    },
    {
      id: 'WT-002',
      taskName: '产品配送任务',
      taskType: '配送',
      executionDevice: 'AGV-002',
      status: '执行中',
      priority: '中',
      createTime: '2024-01-15 10:20:00',
      startTime: '2024-01-15 10:25:00',
      endTime: undefined,
      progress: 65,
    },
    {
      id: 'WT-003',
      taskName: '设备维护任务',
      taskType: '维护',
      executionDevice: 'AGV-003',
      status: '待执行',
      priority: '低',
      createTime: '2024-01-15 11:00:00',
      startTime: undefined,
      endTime: undefined,
      progress: 0,
    },
  ];

  // 运单任务表格列配置
  const waybillTaskColumns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
      render: (text: string, record: WaybillTask) => (
        <Space>
          <CarOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 80,
      render: (text: string) => (
        <Tag color="blue" size="small">{text}</Tag>
      ),
    },
    {
      title: '执行设备',
      dataIndex: 'executionDevice',
      key: 'executionDevice',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getTaskStatusColor(status)} size="small">
          {status}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 70,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)} size="small">
          {priority}
        </Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 80,
      render: (progress: number) => (
        <span style={{ color: progress === 100 ? '#52c41a' : '#1890ff' }}>
          {progress}%
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: WaybillTask) => (
        <Space size={4}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => console.log('查看任务详情:', record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<BugOutlined />}
            size="small"
            onClick={() => console.log('诊断任务:', record)}
          >
            诊断
          </Button>
        </Space>
      ),
    },
  ];

  // 模拟执行历史数据
  const executionHistory = [
    {
      time: '2024-01-15 09:30:00',
      status: '订单创建',
      description: '业务订单创建成功',
      operator: '张三',
    },
    {
      time: '2024-01-15 09:35:00',
      status: '开始执行',
      description: '订单开始执行，分配运单 WB-001',
      operator: '系统',
    },
    {
      time: '2024-01-15 10:15:00',
      status: '状态更新',
      description: '执行状态更新为：移动',
      operator: '系统',
    },
  ];

  // 获取运单任务数据
  const waybillTasks = orderData.waybillTasks || mockWaybillTasks;

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined />
          <span>业务订单详情</span>
        </Space>
      }
      width={600}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      <div style={{ padding: '0 8px' }}>
        {/* 基本信息 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: '0 0 16px 0' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            基本信息
          </Title>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="订单名称">
              <Text strong>{orderData.orderName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="订单ID">
              <Text code>{orderData.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="执行当前运单">
              <Text code>{orderData.currentWaybill}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="执行状态">
              <Tag color={getExecutionStatusColor(orderData.executionStatus)}>
                {orderData.executionStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Space>
                {getStatusIcon(orderData.orderStatus)}
                <Tag color={getStatusColor(orderData.orderStatus)}>
                  {orderData.orderStatus}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              <Text>{orderData.createTime}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              <Text>{orderData.endTime || '未结束'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="更新人">
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text>{orderData.updatedBy}</Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 运单任务详情 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Collapse
            defaultActiveKey={['1']}
            expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
            style={{ background: '#fff', border: 'none' }}
          >
            <Panel
              header={
                <Space>
                  <CarOutlined style={{ color: '#1890ff' }} />
                  <span style={{ fontWeight: 500 }}>运单任务详情</span>
                  <Tag color="blue" size="small">
                    {waybillTasks.length} 个任务
                  </Tag>
                </Space>
              }
              key="1"
              style={{ border: 'none' }}
            >
              <Table
                columns={waybillTaskColumns}
                dataSource={waybillTasks}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content' }}
                style={{ marginTop: 8 }}
              />
            </Panel>
          </Collapse>
        </Card>

        {/* 执行历史 */}
        <Card size="small">
          <Title level={5} style={{ margin: '0 0 16px 0' }}>
            <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            执行历史
          </Title>
          <Timeline
            items={executionHistory.map((item, index) => ({
              key: index,
              dot: index === 0 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : undefined,
              children: (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {item.status}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: 4 }}>
                    {item.description}
                  </div>
                  <div style={{ color: '#999', fontSize: '12px' }}>
                    <Space size={16}>
                      <span>{item.time}</span>
                      <span>操作人：{item.operator}</span>
                    </Space>
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      </div>
    </Drawer>
  );
};

export default BusinessOrderDetail;