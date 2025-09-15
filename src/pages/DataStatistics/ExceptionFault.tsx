import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Tag, Alert, Progress, List, Avatar, Typography } from 'antd';
import { WarningOutlined, BugOutlined, ToolOutlined, UserOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as echarts from 'echarts';
import TimeRangeFilter, { TimeRangeType, formatTimeRangeDisplay } from '@/components/TimeRangeFilter';
import MetricTooltip, { getMetricDefinition } from '@/components/MetricTooltip';

interface FaultData {
  id: string;
  robotId: string;
  robotName: string;
  faultType: 'hardware' | 'software' | 'network' | 'environment';
  faultSubType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  occurTime: string;
  resolveTime?: string;
  status: 'pending' | 'processing' | 'resolved';
  operator?: string;
}

interface InterventionData {
  id: string;
  robotId: string;
  taskId: string;
  reason: 'algorithm' | 'environment' | 'hardware' | 'emergency';
  description: string;
  operator: string;
  startTime: string;
  endTime?: string;
  duration?: number; // 分钟
  status: 'ongoing' | 'completed';
}

const ExceptionFault: React.FC = () => {
  const [loading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('last7days');
  const [faultData, setFaultData] = useState<FaultData[]>([]);
  const [interventionData, setInterventionData] = useState<InterventionData[]>([]);
  const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);
  const [trendChartRef, setTrendChartRef] = useState<HTMLDivElement | null>(null);

  // 模拟故障数据
  useEffect(() => {
    const mockFaultData: FaultData[] = [
      {
        id: 'F001',
        robotId: 'R001',
        robotName: '配送机器人-01',
        faultType: 'hardware',
        faultSubType: '传感器故障',
        severity: 'high',
        description: '激光雷达传感器数据异常，影响导航精度',
        location: 'A区-货架1',
        occurTime: '2024-01-20 08:30:15',
        resolveTime: '2024-01-20 10:45:30',
        status: 'resolved',
        operator: '张工程师'
      },
      {
        id: 'F002',
        robotId: 'R003',
        robotName: '巡检机器人-03',
        faultType: 'software',
        faultSubType: '路径规划异常',
        severity: 'medium',
        description: '路径规划算法出现死循环，无法生成有效路径',
        location: 'B区-通道2',
        occurTime: '2024-01-20 09:15:22',
        status: 'processing',
        operator: '李工程师'
      },
      {
        id: 'F003',
        robotId: 'R002',
        robotName: '清洁机器人-02',
        faultType: 'network',
        faultSubType: '通信中断',
        severity: 'critical',
        description: 'WiFi信号不稳定，与控制中心失去连接',
        location: 'C区-角落位置',
        occurTime: '2024-01-20 09:45:10',
        status: 'pending'
      },
      {
        id: 'F004',
        robotId: 'R004',
        robotName: '运输机器人-04',
        faultType: 'environment',
        faultSubType: '路径阻塞',
        severity: 'low',
        description: '通道被临时堆放的货物阻塞，无法通行',
        location: 'D区-主通道',
        occurTime: '2024-01-20 10:20:05',
        resolveTime: '2024-01-20 10:35:12',
        status: 'resolved',
        operator: '王操作员'
      },
      {
        id: 'F005',
        robotId: 'R001',
        robotName: '配送机器人-01',
        faultType: 'hardware',
        faultSubType: '电池异常',
        severity: 'medium',
        description: '电池充电效率下降，续航时间缩短',
        location: '充电桩-02',
        occurTime: '2024-01-20 11:10:30',
        status: 'processing',
        operator: '赵技师'
      }
    ];
    setFaultData(mockFaultData);

    // 模拟人工干预数据
    const mockInterventionData: InterventionData[] = [
      {
        id: 'I001',
        robotId: 'R002',
        taskId: 'T001',
        reason: 'algorithm',
        description: '路径规划算法无法处理复杂环境，需要人工指导',
        operator: '张操作员',
        startTime: '2024-01-20 08:45:00',
        endTime: '2024-01-20 09:15:00',
        duration: 30,
        status: 'completed'
      },
      {
        id: 'I002',
        robotId: 'R003',
        taskId: 'T003',
        reason: 'environment',
        description: '遇到未知障碍物，环境过于复杂',
        operator: '李操作员',
        startTime: '2024-01-20 09:30:00',
        endTime: '2024-01-20 10:00:00',
        duration: 30,
        status: 'completed'
      },
      {
        id: 'I003',
        robotId: 'R001',
        taskId: 'T005',
        reason: 'hardware',
        description: '传感器数据异常，需要人工校准',
        operator: '王技师',
        startTime: '2024-01-20 10:15:00',
        status: 'ongoing'
      },
      {
        id: 'I004',
        robotId: 'R004',
        taskId: 'T007',
        reason: 'emergency',
        description: '紧急任务需要立即处理，人工接管',
        operator: '赵主管',
        startTime: '2024-01-20 11:00:00',
        endTime: '2024-01-20 11:20:00',
        duration: 20,
        status: 'completed'
      }
    ];
    setInterventionData(mockInterventionData);
  }, []);

  // 初始化故障类型分布饼图
  useEffect(() => {
    if (chartRef && faultData.length > 0) {
      const chart = echarts.init(chartRef);
      
      const faultTypeCount = faultData.reduce((acc, fault) => {
        acc[fault.faultType] = (acc[fault.faultType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const typeMap = {
        'hardware': { name: '硬件故障', color: '#f5222d' },
        'software': { name: '软件故障', color: '#fa8c16' },
        'network': { name: '网络故障', color: '#faad14' },
        'environment': { name: '环境因素', color: '#52c41a' }
      };

      const pieData = Object.entries(faultTypeCount).map(([type, count]) => ({
        name: typeMap[type as keyof typeof typeMap]?.name || type,
        value: count,
        itemStyle: {
          color: typeMap[type as keyof typeof typeMap]?.color || '#d9d9d9'
        }
      }));

      const option = {
        title: {
          text: '故障类型分布',
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
            name: '故障类型',
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
  }, [chartRef, faultData]);

  // 初始化故障趋势图
  useEffect(() => {
    if (trendChartRef) {
      const chart = echarts.init(trendChartRef);
      
      // 生成最近7天的故障趋势数据
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      });
      
      const hardwareFaults = [2, 1, 3, 2, 1, 2, 1];
      const softwareFaults = [1, 2, 1, 3, 2, 1, 2];
      const networkFaults = [0, 1, 1, 0, 1, 2, 1];
      const environmentFaults = [1, 0, 2, 1, 1, 0, 1];

      const option = {
        title: {
          text: '故障趋势(最近7天)',
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
          data: ['硬件故障', '软件故障', '网络故障', '环境因素'],
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
          data: days
        },
        yAxis: {
          type: 'value',
          name: '故障次数'
        },
        series: [
          {
            name: '硬件故障',
            type: 'line',
            data: hardwareFaults,
            smooth: true,
            itemStyle: {
              color: '#f5222d'
            }
          },
          {
            name: '软件故障',
            type: 'line',
            data: softwareFaults,
            smooth: true,
            itemStyle: {
              color: '#fa8c16'
            }
          },
          {
            name: '网络故障',
            type: 'line',
            data: networkFaults,
            smooth: true,
            itemStyle: {
              color: '#faad14'
            }
          },
          {
            name: '环境因素',
            type: 'line',
            data: environmentFaults,
            smooth: true,
            itemStyle: {
              color: '#52c41a'
            }
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [trendChartRef]);

  // 计算统计数据
  const totalFaults = faultData.length;
  const resolvedFaults = faultData.filter(fault => fault.status === 'resolved').length;
  const pendingFaults = faultData.filter(fault => fault.status === 'pending').length;
  const criticalFaults = faultData.filter(fault => fault.severity === 'critical').length;
  const faultRate = totalFaults > 0 ? (totalFaults / 100) * 100 : 0; // 假设总任务数100
  const avgResolutionTime = 2.5; // 模拟平均解决时间(小时)
  const totalInterventions = interventionData.length;
  const avgInterventionTime = interventionData.filter(i => i.duration).reduce((sum, i) => sum + (i.duration || 0), 0) / interventionData.filter(i => i.duration).length || 0;
  const frequentFaultRobot = 'R001'; // 模拟高频故障机器人

  const getSeverityTag = (severity: string) => {
    const severityMap: Record<string, { color: string; text: string }> = {
      'low': { color: 'success', text: '低' },
      'medium': { color: 'warning', text: '中' },
      'high': { color: 'error', text: '高' },
      'critical': { color: 'error', text: '严重' }
    };
    const config = severityMap[severity] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'pending': { color: 'warning', text: '待处理' },
      'processing': { color: 'processing', text: '处理中' },
      'resolved': { color: 'success', text: '已解决' }
    };
    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getReasonTag = (reason: string) => {
    const reasonMap: Record<string, { color: string; text: string }> = {
      'algorithm': { color: 'blue', text: '算法缺陷' },
      'environment': { color: 'green', text: '环境复杂' },
      'hardware': { color: 'red', text: '硬件故障' },
      'emergency': { color: 'orange', text: '紧急情况' }
    };
    const config = reasonMap[reason] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const faultColumns: ColumnsType<FaultData> = [
    {
      title: '机器人',
      dataIndex: 'robotName',
      key: 'robotName',
      width: 180,
      align: 'center',
      render: (text: string, record: FaultData) => (
        <Space size={8}>
          <Avatar icon={<WarningOutlined />} style={{ backgroundColor: '#f5222d' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.robotId}</div>
          </div>
        </Space>
      )
    },
    {
      title: '故障类型',
      dataIndex: 'faultSubType',
      key: 'faultSubType',
      width: 120,
      align: 'center'
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      align: 'center',
      render: (severity: string) => getSeverityTag(severity)
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      align: 'center'
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      align: 'center'
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
      title: '发生时间',
      dataIndex: 'occurTime',
      key: 'occurTime',
      width: 160,
      align: 'center',
      sorter: (a: FaultData, b: FaultData) => new Date(a.occurTime).getTime() - new Date(b.occurTime).getTime()
    },
    {
      title: '处理人员',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      align: 'center',
      render: (operator: string) => operator || '-'
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
        <Space>
          <span>当前统计时间:</span>
          <Typography.Text type="secondary">
            {formatTimeRangeDisplay(timeRange)}
          </Typography.Text>
        </Space>
      </Card>

      {/* 故障统计概览 */}
      <Card title="故障统计" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  故障总数
                  <MetricTooltip {...getMetricDefinition('totalFaults')} />
                </Space>
              }
              value={totalFaults}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  已解决
                  <MetricTooltip {...getMetricDefinition('resolvedFaults')} />
                </Space>
              }
              value={resolvedFaults}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  待处理
                  <MetricTooltip {...getMetricDefinition('pendingFaults')} />
                </Space>
              }
              value={pendingFaults}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  严重故障
                  <MetricTooltip {...getMetricDefinition('criticalFaults')} />
                </Space>
              }
              value={criticalFaults}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 故障率和解决效率 */}
      <Card title="故障率与解决效率" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  故障率
                  <MetricTooltip {...getMetricDefinition('faultRate')} />
                </Space>
              }
              value={faultRate}
              precision={1}
              suffix="%"
              prefix={<BugOutlined />}
              valueStyle={{ color: faultRate > 5 ? '#f5222d' : '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  平均解决时间
                  <MetricTooltip {...getMetricDefinition('avgResolutionTime')} />
                </Space>
              }
              value={avgResolutionTime}
              precision={1}
              suffix="小时"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <Space>
                  故障解决率
                  <MetricTooltip {...getMetricDefinition('resolutionRate')} />
                </Space>
              </div>
              <Progress
                percent={(resolvedFaults / totalFaults) * 100}
                strokeColor={{
                  '0%': '#f5222d',
                  '50%': '#faad14',
                  '80%': '#52c41a',
                }}
                format={(percent) => `${percent?.toFixed(1)}%`}
              />
            </div>
          </Col>
        </Row>
        {criticalFaults > 0 && (
          <Alert
            message="严重故障警告"
            description={`当前有 ${criticalFaults} 个严重故障待处理，请立即关注并安排技术人员处理。`}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      {/* 人工干预统计 */}
      <Card title="人工干预" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  干预次数
                  <MetricTooltip {...getMetricDefinition('totalInterventions')} />
                </Space>
              }
              value={totalInterventions}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  平均干预时长
                  <MetricTooltip {...getMetricDefinition('avgInterventionTime')} />
                </Space>
              }
              value={avgInterventionTime}
              precision={0}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title={
                <Space>
                  高频故障机器人
                  <MetricTooltip {...getMetricDefinition('frequentFaultRobot')} />
                </Space>
              }
              value={frequentFaultRobot}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 图表展示 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="故障类型分布" style={{ height: '400px' }}>
            <div ref={setChartRef} style={{ width: '100%', height: '320px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="故障趋势" style={{ height: '400px' }}>
            <div ref={setTrendChartRef} style={{ width: '100%', height: '320px' }} />
          </Card>
        </Col>
      </Row>

      {/* 最近干预记录 */}
      <Card title="最近干预记录" style={{ marginBottom: '16px' }}>
        <List
          itemLayout="horizontal"
          dataSource={interventionData.slice(0, 5)}
          renderItem={(item: InterventionData) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                title={
                  <Space>
                    <span>{item.robotId}</span>
                    {getReasonTag(item.reason)}
                    <Tag color={item.status === 'ongoing' ? 'processing' : 'success'}>
                      {item.status === 'ongoing' ? '进行中' : '已完成'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>{item.description}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      操作员: {item.operator} | 开始时间: {item.startTime}
                      {item.duration && ` | 耗时: ${item.duration}分钟`}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 故障详情列表 */}
      <Card title="故障详情列表">
        <Table
          columns={faultColumns}
          dataSource={faultData}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{
            total: faultData.length,
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

export default ExceptionFault;