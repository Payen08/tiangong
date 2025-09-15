import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Space, Tag, Alert, Typography } from 'antd';
import { ClockCircleOutlined, ApiOutlined, DatabaseOutlined, DesktopOutlined, HddOutlined, WifiOutlined, NodeIndexOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as echarts from 'echarts';
import TimeRangeFilter, { TimeRangeType, getDateRangeByType, formatTimeRangeDisplay } from '@/components/TimeRangeFilter';
import MetricTooltip, { getMetricDefinition } from '@/components/MetricTooltip';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'error';
  threshold: number;
  timestamp: string;
}

interface TaskScheduleData {
  id: string;
  taskId: string;
  robotId: string;
  assignTime: number; // 分配时间(ms)
  planningTime: number; // 路径规划时间(ms)
  waitTime: number; // 等待时间(ms)
  status: 'success' | 'failed' | 'timeout';
  emptyDistance: number; // 空驶里程(km)
  createTime: string;
}

const SchedulingSystem: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('last7days');
  const [scheduleData, setScheduleData] = useState<TaskScheduleData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);
  const [performanceChartRef, setPerformanceChartRef] = useState<HTMLDivElement | null>(null);

  // 模拟调度数据
  useEffect(() => {
    const mockScheduleData: TaskScheduleData[] = [
      {
        id: 'S001',
        taskId: 'T001',
        robotId: 'R001',
        assignTime: 120,
        planningTime: 85,
        waitTime: 45,
        status: 'success',
        emptyDistance: 0.8,
        createTime: '2024-01-20 09:15:30'
      },
      {
        id: 'S002',
        taskId: 'T002',
        robotId: 'R003',
        assignTime: 95,
        planningTime: 156,
        waitTime: 120,
        status: 'success',
        emptyDistance: 1.2,
        createTime: '2024-01-20 09:18:45'
      },
      {
        id: 'S003',
        taskId: 'T003',
        robotId: 'R002',
        assignTime: 200,
        planningTime: 89,
        waitTime: 30,
        status: 'failed',
        emptyDistance: 0.5,
        createTime: '2024-01-20 09:22:10'
      },
      {
        id: 'S004',
        taskId: 'T004',
        robotId: 'R004',
        assignTime: 75,
        planningTime: 245,
        waitTime: 180,
        status: 'timeout',
        emptyDistance: 2.1,
        createTime: '2024-01-20 09:25:20'
      },
      {
        id: 'S005',
        taskId: 'T005',
        robotId: 'R001',
        assignTime: 110,
        planningTime: 92,
        waitTime: 25,
        status: 'success',
        emptyDistance: 0.6,
        createTime: '2024-01-20 09:28:15'
      }
    ];
    setScheduleData(mockScheduleData);

    // 模拟系统指标数据
    const mockMetrics: SystemMetric[] = [
      {
        id: 'M001',
        name: 'CPU使用率',
        value: 65,
        unit: '%',
        status: 'normal',
        threshold: 80,
        timestamp: '2024-01-20 09:30:00'
      },
      {
        id: 'M002',
        name: '内存使用率',
        value: 78,
        unit: '%',
        status: 'warning',
        threshold: 75,
        timestamp: '2024-01-20 09:30:00'
      },
      {
        id: 'M003',
        name: '网络IO',
        value: 45,
        unit: 'MB/s',
        status: 'normal',
        threshold: 100,
        timestamp: '2024-01-20 09:30:00'
      },
      {
        id: 'M004',
        name: '消息队列积压',
        value: 156,
        unit: '条',
        status: 'warning',
        threshold: 100,
        timestamp: '2024-01-20 09:30:00'
      }
    ];
    setSystemMetrics(mockMetrics);
  }, []);

  // 初始化调度效率趋势图
  useEffect(() => {
    if (chartRef && scheduleData.length > 0) {
      const chart = echarts.init(chartRef);
      
      // 生成24小时的模拟数据
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const assignTimeData = hours.map(() => Math.floor(Math.random() * 100) + 50);
      const planningTimeData = hours.map(() => Math.floor(Math.random() * 150) + 80);
      const waitTimeData = hours.map(() => Math.floor(Math.random() * 120) + 20);

      const option = {
        title: {
          text: '调度效率趋势(24小时)',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['任务分配时间', '路径规划时间', '任务等待时间'],
          bottom: '5%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: hours.map(h => `${h}:00`),
          axisLabel: {
            interval: 3
          }
        },
        yAxis: {
          type: 'value',
          name: '时间(ms)',
          axisLabel: {
            formatter: '{value}ms'
          }
        },
        series: [
          {
            name: '任务分配时间',
            type: 'line',
            data: assignTimeData,
            smooth: true,
            itemStyle: {
              color: '#1890ff'
            }
          },
          {
            name: '路径规划时间',
            type: 'line',
            data: planningTimeData,
            smooth: true,
            itemStyle: {
              color: '#52c41a'
            }
          },
          {
            name: '任务等待时间',
            type: 'line',
            data: waitTimeData,
            smooth: true,
            itemStyle: {
              color: '#faad14'
            }
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [chartRef, scheduleData]);

  // 初始化系统性能监控图
  useEffect(() => {
    if (performanceChartRef && systemMetrics.length > 0) {
      const chart = echarts.init(performanceChartRef);
      
      // 生成实时性能数据
      const timePoints = Array.from({ length: 20 }, (_, i) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - (19 - i));
        return now.toLocaleTimeString('zh-CN', { hour12: false }).slice(0, 5);
      });
      
      const cpuData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 30) + 50);
      const memoryData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 25) + 60);
      const networkData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 40) + 30);

      const option = {
        title: {
          text: '系统性能监控',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['CPU使用率', '内存使用率', '网络IO'],
          bottom: '5%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timePoints,
          axisLabel: {
            interval: 3
          }
        },
        yAxis: {
          type: 'value',
          name: '使用率(%)',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: 'CPU使用率',
            type: 'line',
            data: cpuData,
            smooth: true,
            itemStyle: {
              color: '#1890ff'
            },
            areaStyle: {
              opacity: 0.3
            }
          },
          {
            name: '内存使用率',
            type: 'line',
            data: memoryData,
            smooth: true,
            itemStyle: {
              color: '#52c41a'
            },
            areaStyle: {
              opacity: 0.3
            }
          },
          {
            name: '网络IO',
            type: 'line',
            data: networkData,
            smooth: true,
            itemStyle: {
              color: '#faad14'
            },
            areaStyle: {
              opacity: 0.3
            }
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [performanceChartRef, systemMetrics]);

  // 计算统计数据
  const avgAssignTime = scheduleData.length > 0 ? 
    scheduleData.reduce((sum, item) => sum + item.assignTime, 0) / scheduleData.length : 0;
  const avgPlanningTime = scheduleData.length > 0 ? 
    scheduleData.reduce((sum, item) => sum + item.planningTime, 0) / scheduleData.length : 0;
  const avgWaitTime = scheduleData.length > 0 ? 
    scheduleData.reduce((sum, item) => sum + item.waitTime, 0) / scheduleData.length : 0;
  const successRate = scheduleData.length > 0 ? 
    (scheduleData.filter(item => item.status === 'success').length / scheduleData.length) * 100 : 0;
  const avgEmptyDistance = scheduleData.length > 0 ? 
    scheduleData.reduce((sum, item) => sum + item.emptyDistance, 0) / scheduleData.length : 0;
  const emptyDistanceRate = avgEmptyDistance / (avgEmptyDistance + 5.2) * 100; // 假设平均任务里程5.2km
  const queueBacklog = 156; // 模拟消息队列积压
  const avgApiResponse = 85; // 模拟API响应时间
  const conflictCount = 3; // 模拟冲突次数

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'success': { color: 'success', text: '成功' },
      'failed': { color: 'error', text: '失败' },
      'timeout': { color: 'warning', text: '超时' }
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getMetricStatus = (metric: SystemMetric) => {
    if (metric.status === 'error') return 'error';
    if (metric.status === 'warning') return 'warning';
    return 'success';
  };

  const scheduleColumns: ColumnsType<TaskScheduleData> = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 100,
      align: 'center'
    },
    {
      title: '机器人ID',
      dataIndex: 'robotId',
      key: 'robotId',
      width: 120,
      align: 'center'
    },
    {
      title: '分配时间(ms)',
      dataIndex: 'assignTime',
      key: 'assignTime',
      width: 120,
      align: 'center',
      sorter: (a: TaskScheduleData, b: TaskScheduleData) => a.assignTime - b.assignTime
    },
    {
      title: '规划时间(ms)',
      dataIndex: 'planningTime',
      key: 'planningTime',
      width: 120,
      align: 'center',
      sorter: (a: TaskScheduleData, b: TaskScheduleData) => a.planningTime - b.planningTime
    },
    {
      title: '等待时间(ms)',
      dataIndex: 'waitTime',
      key: 'waitTime',
      width: 120,
      align: 'center',
      sorter: (a: TaskScheduleData, b: TaskScheduleData) => a.waitTime - b.waitTime
    },
    {
      title: '空驶里程(km)',
      dataIndex: 'emptyDistance',
      key: 'emptyDistance',
      width: 120,
      align: 'center',
      render: (distance: number) => distance.toFixed(1)
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
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
      
      {/* 当前统计时间显示 */}
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
        </Row>
      </Card>

      {/* 调度效率概览 */}
      <Card title="调度效率" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  平均分配时间
                  <MetricTooltip {...getMetricDefinition('avgAssignTime')} />
                </Space>
              }
              value={avgAssignTime}
              precision={0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  平均规划时间
                  <MetricTooltip {...getMetricDefinition('avgPlanningTime')} />
                </Space>
              }
              value={avgPlanningTime}
              precision={0}
              suffix="ms"
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  路径规划成功率
                  <MetricTooltip {...getMetricDefinition('successRate')} />
                </Space>
              }
              value={successRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: successRate >= 90 ? '#52c41a' : '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  平均等待时间
                  <MetricTooltip {...getMetricDefinition('avgWaitTime')} />
                </Space>
              }
              value={avgWaitTime}
              precision={0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 系统负载 */}
      <Card title="系统负载" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  消息队列积压
                  <MetricTooltip {...getMetricDefinition('queueBacklog')} />
                </Space>
              }
              value={queueBacklog}
              suffix="条"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: queueBacklog > 100 ? '#f5222d' : '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  API响应时间
                  <MetricTooltip {...getMetricDefinition('avgApiResponse')} />
                </Space>
              }
              value={avgApiResponse}
              suffix="ms"
              prefix={<ApiOutlined />}
              valueStyle={{ color: avgApiResponse > 100 ? '#faad14' : '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <Space>
                  CPU使用率
                  <MetricTooltip {...getMetricDefinition('cpuUsage')} />
                </Space>
              </div>
              <Progress
                percent={systemMetrics.find(m => m.name === 'CPU使用率')?.value || 0}
                status={getMetricStatus(systemMetrics.find(m => m.name === 'CPU使用率') || {} as SystemMetric) === 'error' ? 'exception' : 'normal'}
                strokeColor={{
                  '0%': '#52c41a',
                  '70%': '#faad14',
                  '85%': '#f5222d',
                }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <Space>
                  内存使用率
                  <MetricTooltip {...getMetricDefinition('memoryUsage')} />
                </Space>
              </div>
              <Progress
                percent={systemMetrics.find(m => m.name === '内存使用率')?.value || 0}
                status={getMetricStatus(systemMetrics.find(m => m.name === '内存使用率') || {} as SystemMetric) === 'error' ? 'exception' : 'normal'}
                strokeColor={{
                  '0%': '#52c41a',
                  '70%': '#faad14',
                  '85%': '#f5222d',
                }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 算法优化指标 */}
      <Card title="算法优化" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  空驶里程率
                  <MetricTooltip {...getMetricDefinition('emptyDistanceRate')} />
                </Space>
              }
              value={emptyDistanceRate}
              precision={1}
              suffix="%"
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: emptyDistanceRate > 15 ? '#f5222d' : '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  平均空驶里程
                  <MetricTooltip {...getMetricDefinition('avgEmptyDistance')} />
                </Space>
              }
              value={avgEmptyDistance}
              precision={1}
              suffix="km"
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  冲突/死锁次数
                  <MetricTooltip {...getMetricDefinition('conflictCount')} />
                </Space>
              }
              value={conflictCount}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: conflictCount > 5 ? '#f5222d' : '#52c41a' }}
            />
          </Col>
        </Row>
        {emptyDistanceRate > 15 && (
          <Alert
            message="空驶率偏高"
            description="当前空驶率超过15%，建议优化路径规划算法以减少无效移动。"
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      {/* 趋势图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="调度效率趋势" style={{ height: '400px' }}>
            <div ref={setChartRef} style={{ width: '100%', height: '320px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统性能监控" style={{ height: '400px' }}>
            <div ref={setPerformanceChartRef} style={{ width: '100%', height: '320px' }} />
          </Card>
        </Col>
      </Row>

      {/* 调度详情列表 */}
      <Card title="调度详情列表">
        <Table
          columns={scheduleColumns}
          dataSource={scheduleData}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{
            total: scheduleData.length,
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

export default SchedulingSystem;