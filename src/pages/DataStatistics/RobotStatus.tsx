import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Space, Tag, Avatar, Typography } from 'antd';
import { RobotOutlined, ThunderboltOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltFilled } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table';
import * as echarts from 'echarts';
import TimeRangeFilter, { TimeRangeType, getDateRangeByType, formatTimeRangeDisplay } from '@/components/TimeRangeFilter';
import MetricTooltip, { getMetricDefinition } from '@/components/MetricTooltip';

interface RobotData {
  id: string;
  name: string;
  status: 'working' | 'idle' | 'charging' | 'fault' | 'offline';
  battery: number;
  runningTime: number;
  totalDistance: number;
  taskCount: number;
  lastMaintenance: string;
  location: string;
}

const RobotStatus: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('last7days');
  const [robotData, setRobotData] = useState<RobotData[]>([]);
  const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);

  // 模拟数据
  useEffect(() => {
    const mockData: RobotData[] = [
      {
        id: 'R001',
        name: '配送机器人-01',
        status: 'working',
        battery: 85,
        runningTime: 6.5,
        totalDistance: 125.8,
        taskCount: 12,
        lastMaintenance: '2024-01-10',
        location: 'A区-货架1'
      },
      {
        id: 'R002',
        name: '清洁机器人-02',
        status: 'idle',
        battery: 92,
        runningTime: 4.2,
        totalDistance: 89.3,
        taskCount: 8,
        lastMaintenance: '2024-01-12',
        location: 'B区-休息点'
      },
      {
        id: 'R003',
        name: '巡检机器人-03',
        status: 'charging',
        battery: 45,
        runningTime: 8.1,
        totalDistance: 156.7,
        taskCount: 15,
        lastMaintenance: '2024-01-08',
        location: '充电桩-01'
      },
      {
        id: 'R004',
        name: '运输机器人-04',
        status: 'fault',
        battery: 78,
        runningTime: 2.3,
        totalDistance: 45.2,
        taskCount: 3,
        lastMaintenance: '2024-01-15',
        location: 'C区-维修点'
      },
      {
        id: 'R005',
        name: '配送机器人-05',
        status: 'offline',
        battery: 0,
        runningTime: 0,
        totalDistance: 0,
        taskCount: 0,
        lastMaintenance: '2024-01-05',
        location: '未知'
      }
    ];
    setRobotData(mockData);
  }, []);

  // 初始化状态分布饼图
  useEffect(() => {
    if (chartRef && robotData.length > 0) {
      const chart = echarts.init(chartRef);
      
      const statusCount = robotData.reduce((acc, robot) => {
        acc[robot.status] = (acc[robot.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusMap = {
        'working': { name: '工作中', color: '#52c41a' },
        'idle': { name: '空闲中', color: '#1890ff' },
        'charging': { name: '充电中', color: '#faad14' },
        'fault': { name: '故障中', color: '#f5222d' },
        'offline': { name: '离线', color: '#d9d9d9' }
      };

      const pieData = Object.entries(statusCount).map(([status, count]) => ({
        name: statusMap[status as keyof typeof statusMap]?.name || status,
        value: count,
        itemStyle: {
          color: statusMap[status as keyof typeof statusMap]?.color || '#d9d9d9'
        }
      }));

      const option = {
        title: {
          text: '机器人状态分布',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          bottom: '5%',
          left: 'center'
        },
        series: [
          {
            name: '机器人状态',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [chartRef, robotData]);

  // 计算统计数据
  const totalRobots = robotData.length;
  const onlineRobots = robotData.filter(robot => robot.status !== 'offline').length;
  const workingRobots = robotData.filter(robot => robot.status === 'working').length;
  const faultRobots = robotData.filter(robot => robot.status === 'fault').length;
  const avgRunningTime = robotData.length > 0 ? 
    robotData.reduce((sum, robot) => sum + robot.runningTime, 0) / robotData.length : 0;
  const totalDistance = robotData.reduce((sum, robot) => sum + robot.totalDistance, 0);
  const avgBattery = robotData.length > 0 ? 
    robotData.reduce((sum, robot) => sum + robot.battery, 0) / robotData.length : 0;
  const mtbf = 168.5; // 模拟平均无故障运行时间(小时)
  const mttr = 2.3; // 模拟平均修复时间(小时)
  const avgChargingTimes = 3.2; // 模拟平均充电次数
  const energyEfficiency = 0.85; // 模拟能耗效率(kWh/km)

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      'working': { color: 'success', text: '工作中', icon: <RobotOutlined /> },
      'idle': { color: 'processing', text: '空闲中', icon: <ClockCircleOutlined /> },
      'charging': { color: 'warning', text: '充电中', icon: <ThunderboltFilled style={{ color: '#faad14' }} /> },
      'fault': { color: 'error', text: '故障中', icon: <WarningOutlined /> },
      'offline': { color: 'default', text: '离线', icon: <WarningOutlined /> }
    };
    const config = statusMap[status] || { color: 'default', text: '未知', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getBatteryColor = (battery: number) => {
    if (battery >= 80) return '#52c41a';
    if (battery >= 50) return '#faad14';
    if (battery >= 20) return '#fa8c16';
    return '#f5222d';
  };

  const columns: ColumnsType<RobotData> = [
    {
      title: '机器人',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      align: 'center',
      render: (text: string, record: RobotData) => (
        <Space size={8}>
          <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.id}</div>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '电量',
      dataIndex: 'battery',
      key: 'battery',
      width: 120,
      align: 'center',
      render: (battery: number) => (
        <div style={{ width: '80px' }}>
          <Progress
            percent={battery}
            size="small"
            strokeColor={getBatteryColor(battery)}
            format={(percent) => `${percent}%`}
          />
        </div>
      )
    },
    {
      title: '运行时长(小时)',
      dataIndex: 'runningTime',
      key: 'runningTime',
      width: 140,
      align: 'center',
      render: (time: number) => time.toFixed(1)
    },
    {
      title: '总里程(km)',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      width: 120,
      align: 'center',
      render: (distance: number) => distance.toFixed(1)
    },
    {
      title: '任务数',
      dataIndex: 'taskCount',
      key: 'taskCount',
      width: 100,
      align: 'center'
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      align: 'center'
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
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
      
      {/* 机器人群组概览 */}
      <Card title="机器人群组概览" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  机器人总数
                  <MetricTooltip {...getMetricDefinition('totalRobots')} />
                </Space>
              }
              value={totalRobots}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  在线数量
                  <MetricTooltip {...getMetricDefinition('onlineRobots')} />
                </Space>
              }
              value={onlineRobots}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  工作中
                  <MetricTooltip {...getMetricDefinition('workingRobots')} />
                </Space>
              }
              value={workingRobots}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  故障数量
                  <MetricTooltip {...getMetricDefinition('faultRobots')} />
                </Space>
              }
              value={faultRobots}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 状态分布和运行指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="状态分布" style={{ height: '400px' }}>
            <div ref={setChartRef} style={{ width: '100%', height: '320px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="运行指标" style={{ height: '400px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      总运行时长(小时)
                      <MetricTooltip {...getMetricDefinition('avgRunningTime')} />
                    </Space>
                  }
                  value={avgRunningTime}
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      总运行里程(km)
                      <MetricTooltip {...getMetricDefinition('totalDistance')} />
                    </Space>
                  }
                  value={totalDistance}
                  precision={1}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      平均电量
                      <MetricTooltip {...getMetricDefinition('avgBattery')} />
                    </Space>
                  }
                  value={avgBattery}
                  precision={1}
                  suffix="%"
                  prefix={<ThunderboltFilled style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      MTBF(小时)
                      <MetricTooltip {...getMetricDefinition('mtbf')} />
                    </Space>
                  }
                  value={mtbf}
                  precision={1}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      MTTR(小时)
                      <MetricTooltip {...getMetricDefinition('mttr')} />
                    </Space>
                  }
                  value={mttr}
                  precision={1}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      能耗效率(kWh/km)
                      <MetricTooltip {...getMetricDefinition('energyEfficiency')} />
                    </Space>
                  }
                  value={energyEfficiency}
                  precision={2}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 充电与能耗统计 */}
      <Card title="充电与能耗" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  平均充电次数/天
                  <MetricTooltip {...getMetricDefinition('avgChargingTimes')} />
                </Space>
              }
              value={avgChargingTimes}
              precision={1}
              prefix={<ThunderboltFilled style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <Space>
                  平均电量水平
                  <MetricTooltip {...getMetricDefinition('avgBatteryLevel')} />
                </Space>
              </div>
              <Progress
                percent={avgBattery}
                strokeColor={{
                  '0%': '#f5222d',
                  '20%': '#fa8c16',
                  '50%': '#faad14',
                  '80%': '#52c41a',
                }}
                format={(percent) => `${percent?.toFixed(1)}%`}
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  总能耗(kWh)
                  <MetricTooltip {...getMetricDefinition('totalEnergyConsumption')} />
                </Space>
              }
              value={totalDistance * energyEfficiency}
              precision={1}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 机器人详情列表 */}
      <Card title="机器人详情列表">
        <Table
          columns={columns}
          dataSource={robotData}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{
            total: robotData.length,
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

export default RobotStatus;