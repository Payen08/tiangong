import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Select, Space, Tag, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
// import dayjs from 'dayjs';
import TimeRangeFilter, { TimeRangeType, formatTimeRangeDisplay } from '@/components/TimeRangeFilter';
import MetricTooltip, { getMetricDefinition } from '@/components/MetricTooltip';

// const { RangePicker } = DatePicker;
const { Option } = Select;

interface TaskData {
  id: string;
  taskName: string;
  createTime: string;
  completeTime: string;
  status: 'completed' | 'pending' | 'failed';
  duration: number;
  robotId: string;
}

const BusinessPerformance: React.FC = () => {
  const [loading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('last7days');
  // const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
  //   dayjs().subtract(7, 'day'),
  //   dayjs()
  // ]);
  const [taskData, setTaskData] = useState<TaskData[]>([]);

  // 模拟数据
  useEffect(() => {
    const mockData: TaskData[] = [
      {
        id: '1',
        taskName: '货物配送-A区',
        createTime: '2024-01-15 09:00:00',
        completeTime: '2024-01-15 09:45:00',
        status: 'completed',
        duration: 45,
        robotId: 'R001'
      },
      {
        id: '2',
        taskName: '清洁任务-B区',
        createTime: '2024-01-15 10:00:00',
        completeTime: '2024-01-15 10:30:00',
        status: 'completed',
        duration: 30,
        robotId: 'R002'
      },
      {
        id: '3',
        taskName: '巡检任务-C区',
        createTime: '2024-01-15 11:00:00',
        completeTime: '',
        status: 'pending',
        duration: 0,
        robotId: 'R003'
      },
      {
        id: '4',
        taskName: '运输任务-D区',
        createTime: '2024-01-15 12:00:00',
        completeTime: '',
        status: 'failed',
        duration: 0,
        robotId: 'R001'
      }
    ];
    setTaskData(mockData);
  }, []);

  // 计算统计数据
  const totalTasks = taskData.length;
  const completedTasks = taskData.filter(task => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;
  const avgDuration = completedTasks > 0 ? 
    taskData.filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + task.duration, 0) / completedTasks : 0;
  const onTimeRate = 85.6; // 模拟数据
  const robotUtilization = 78.3; // 模拟数据
  const energyConsumption = 245.8; // 模拟数据
  const dailyAvgTasks = 156; // 模拟数据
  const peakTasks = 89; // 模拟数据
  const avgTasksPerRobot = 12.5; // 模拟数据

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      'completed': { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      'pending': { color: 'processing', text: '进行中', icon: <ClockCircleOutlined /> },
      'failed': { color: 'error', text: '失败', icon: <ArrowDownOutlined /> }
    };
    const config = statusMap[status] || { color: 'default', text: '未知', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const columns: ColumnsType<TaskData> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      align: 'center'
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center',
      sorter: true
    },
    {
      title: '完成时间',
      dataIndex: 'completeTime',
      key: 'completeTime',
      width: 160,
      align: 'center',
      render: (text: string) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '耗时(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      align: 'center',
      render: (duration: number) => duration > 0 ? duration : '-'
    },
    {
      title: '机器人ID',
      dataIndex: 'robotId',
      key: 'robotId',
      width: 120,
      align: 'center'
    }
  ];

  return (
    <div style={{ background: 'transparent' }}>
      {/* 时间范围筛选 */}
      <TimeRangeFilter
        value={timeRange}
        onChange={setTimeRange}
      />
      
      {/* 筛选操作区 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span>当前统计时间:</span>
              <Typography.Text type="secondary">
                {formatTimeRangeDisplay(timeRange)}
              </Typography.Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <span>机器人:</span>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部</Option>
                <Option value="R001">R001</Option>
                <Option value="R002">R002</Option>
                <Option value="R003">R003</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 任务完成情况统计 */}
      <Card title="任务完成情况" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  总任务量
                  <MetricTooltip {...getMetricDefinition('totalTasks')} />
                </Space>
              }
              value={totalTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  完成任务量
                  <MetricTooltip {...getMetricDefinition('completedTasks')} />
                </Space>
              }
              value={completedTasks}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <Space>
                  任务完成率
                  <MetricTooltip {...getMetricDefinition('completionRate')} />
                </Space>
              </div>
              <Progress
                type="circle"
                percent={completionRate}
                size={80}
                format={(percent) => `${percent?.toFixed(1)}%`}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  平均履约时长(分钟)
                  <MetricTooltip {...getMetricDefinition('avgDuration')} />
                </Space>
              }
              value={avgDuration}
              precision={1}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 吞吐量与效率统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="吞吐量与效率">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      日均任务量
                      <MetricTooltip {...getMetricDefinition('dailyAvgTasks')} />
                    </Space>
                  }
                  value={dailyAvgTasks}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      峰值任务量
                      <MetricTooltip {...getMetricDefinition('peakTasks')} />
                    </Space>
                  }
                  value={peakTasks}
                  prefix={<ArrowUpOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title={
                    <Space>
                      机器人平均任务数
                      <MetricTooltip {...getMetricDefinition('avgTasksPerRobot')} />
                    </Space>
                  }
                  value={avgTasksPerRobot}
                  precision={1}
                  suffix="任务/天"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="成本与收益">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    <Space>
                      机器人利用率
                      <MetricTooltip {...getMetricDefinition('robotUtilization')} />
                    </Space>
                  </div>
                  <Progress
                    percent={robotUtilization}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={(percent) => `${percent?.toFixed(1)}%`}
                  />
                </div>
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      准时达成率
                      <MetricTooltip {...getMetricDefinition('onTimeRate')} />
                    </Space>
                  }
                  value={onTimeRate}
                  precision={1}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      能耗统计(kWh)
                      <MetricTooltip {...getMetricDefinition('energyConsumption')} />
                    </Space>
                  }
                  value={energyConsumption}
                  precision={1}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 任务详情列表 */}
      <Card title="任务详情列表">
        <Table
          columns={columns}
          dataSource={taskData}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 800 }}
          pagination={{
            total: taskData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  );
};

export default BusinessPerformance;