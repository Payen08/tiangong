import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Tag, Select, Alert, Typography } from 'antd';
import { HeatMapOutlined, WarningOutlined, CarOutlined, AimOutlined, FireOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as echarts from 'echarts';
import { TimeRangeType, formatTimeRangeDisplay } from '@/components/TimeRangeFilter';
import MetricTooltip, { getMetricDefinition } from '@/components/MetricTooltip';

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  name?: string;
}

interface TrafficData {
  id: string;
  robotId: string;
  path: Array<{ x: number; y: number; timestamp: string }>;
  frequency: number;
  avgSpeed: number;
  congestionLevel: 'low' | 'medium' | 'high';
  date: string;
}

interface TaskPoint {
  id: string;
  x: number;
  y: number;
  taskCount: number;
  taskType: 'pickup' | 'delivery' | 'patrol' | 'cleaning';
  area: string;
  avgCompletionTime: number;
}

interface FaultLocation {
  id: string;
  x: number;
  y: number;
  faultCount: number;
  faultType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  lastOccurrence: string;
}

const SpatialHeatmap: React.FC = () => {
  const [loading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('last7days');
  const [, setTrafficData] = useState<TrafficData[]>([]);
  const [taskPoints, setTaskPoints] = useState<TaskPoint[]>([]);
  const [faultLocations, setFaultLocations] = useState<FaultLocation[]>([]);
  const [selectedView, setSelectedView] = useState<'traffic' | 'task' | 'fault'>('traffic');
  // const [, setShowRealTime] = useState(true);
  const [trafficChartRef, setTrafficChartRef] = useState<HTMLDivElement | null>(null);
  const [taskChartRef, setTaskChartRef] = useState<HTMLDivElement | null>(null);
  const [faultChartRef, setFaultChartRef] = useState<HTMLDivElement | null>(null);

  // 模拟数据
  useEffect(() => {
    // 模拟流量数据
    const mockTrafficData: TrafficData[] = [
      {
        id: 'T001',
        robotId: 'R001',
        path: [
          { x: 10, y: 20, timestamp: '2024-01-20 09:00:00' },
          { x: 15, y: 25, timestamp: '2024-01-20 09:05:00' },
          { x: 20, y: 30, timestamp: '2024-01-20 09:10:00' }
        ],
        frequency: 15,
        avgSpeed: 1.2,
        congestionLevel: 'medium',
        date: '2024-01-20'
      },
      {
        id: 'T002',
        robotId: 'R002',
        path: [
          { x: 30, y: 40, timestamp: '2024-01-20 09:00:00' },
          { x: 35, y: 45, timestamp: '2024-01-20 09:03:00' },
          { x: 40, y: 50, timestamp: '2024-01-20 09:06:00' }
        ],
        frequency: 25,
        avgSpeed: 1.8,
        congestionLevel: 'high',
        date: '2024-01-20'
      }
    ];
    setTrafficData(mockTrafficData);

    // 模拟任务点数据
    const mockTaskPoints: TaskPoint[] = [
      {
        id: 'TP001',
        x: 15,
        y: 25,
        taskCount: 45,
        taskType: 'pickup',
        area: 'A区',
        avgCompletionTime: 3.5
      },
      {
        id: 'TP002',
        x: 35,
        y: 45,
        taskCount: 38,
        taskType: 'delivery',
        area: 'B区',
        avgCompletionTime: 4.2
      },
      {
        id: 'TP003',
        x: 55,
        y: 35,
        taskCount: 52,
        taskType: 'patrol',
        area: 'C区',
        avgCompletionTime: 2.8
      },
      {
        id: 'TP004',
        x: 25,
        y: 55,
        taskCount: 28,
        taskType: 'cleaning',
        area: 'D区',
        avgCompletionTime: 5.1
      },
      {
        id: 'TP005',
        x: 45,
        y: 25,
        taskCount: 41,
        taskType: 'pickup',
        area: 'E区',
        avgCompletionTime: 3.8
      }
    ];
    setTaskPoints(mockTaskPoints);

    // 模拟故障位置数据
    const mockFaultLocations: FaultLocation[] = [
      {
        id: 'FL001',
        x: 20,
        y: 30,
        faultCount: 8,
        faultType: '传感器故障',
        severity: 'high',
        description: '该区域光线不足，影响传感器正常工作',
        lastOccurrence: '2024-01-20 10:30:00'
      },
      {
        id: 'FL002',
        x: 40,
        y: 50,
        faultCount: 12,
        faultType: '路径阻塞',
        severity: 'medium',
        description: '通道狭窄，经常有货物临时堆放',
        lastOccurrence: '2024-01-20 11:15:00'
      },
      {
        id: 'FL003',
        x: 60,
        y: 20,
        faultCount: 5,
        faultType: '网络信号弱',
        severity: 'low',
        description: 'WiFi信号覆盖不佳，偶尔出现通信中断',
        lastOccurrence: '2024-01-20 09:45:00'
      },
      {
        id: 'FL004',
        x: 10,
        y: 60,
        faultCount: 15,
        faultType: '地面不平',
        severity: 'high',
        description: '地面有凹陷，机器人经常在此处发生故障',
        lastOccurrence: '2024-01-20 12:00:00'
      }
    ];
    setFaultLocations(mockFaultLocations);
  }, []);

  // 初始化流量热力图
  useEffect(() => {
    if (trafficChartRef) {
      const chart = echarts.init(trafficChartRef);
      
      // 生成热力图数据
      const heatmapData: HeatmapPoint[] = [];
      for (let i = 0; i < 80; i += 5) {
        for (let j = 0; j < 80; j += 5) {
          const value = Math.floor(Math.random() * 20);
          heatmapData.push({ x: i, y: j, value });
        }
      }

      const option = {
        title: {
          text: '机器人流量热力图',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          position: 'top',
          formatter: function(params: any) {
            return `坐标: (${params.data[0]}, ${params.data[1]})<br/>流量: ${params.data[2]}`;
          }
        },
        grid: {
          height: '70%',
          top: '15%'
        },
        xAxis: {
          type: 'category',
          data: Array.from({length: 17}, (_, i) => (i * 5).toString()),
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        },
        yAxis: {
          type: 'category',
          data: Array.from({length: 17}, (_, i) => (i * 5).toString()),
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        },
        visualMap: {
          min: 0,
          max: 20,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          }
        },
        series: [{
          name: '流量热力图',
          type: 'heatmap',
          data: heatmapData.map(point => [Math.floor(point.x / 5), Math.floor(point.y / 5), point.value]),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [trafficChartRef]);

  // 初始化任务点热力图
  useEffect(() => {
    if (taskChartRef && taskPoints.length > 0) {
      const chart = echarts.init(taskChartRef);
      
      const taskTypeColors = {
        'pickup': '#1890ff',
        'delivery': '#52c41a',
        'patrol': '#faad14',
        'cleaning': '#f5222d'
      };

      const scatterData = taskPoints.map(point => ({
        name: point.area,
        value: [point.x, point.y, point.taskCount],
        itemStyle: {
          color: taskTypeColors[point.taskType]
        }
      }));

      const option = {
        title: {
          text: '任务点分布热力图',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params: any) {
            const point = taskPoints.find(p => p.x === params.data.value[0] && p.y === params.data.value[1]);
            return `区域: ${params.data.name}<br/>坐标: (${params.data.value[0]}, ${params.data.value[1]})<br/>任务数: ${params.data.value[2]}<br/>类型: ${point?.taskType}<br/>平均完成时间: ${point?.avgCompletionTime}分钟`;
          }
        },
        legend: {
          data: ['取货点', '配送点', '巡检点', '清洁点'],
          bottom: '5%'
        },
        grid: {
          height: '70%',
          top: '15%'
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: 80,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 80,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        },
        series: [
          {
            name: '取货点',
            type: 'scatter',
            data: scatterData.filter((_, index) => taskPoints[index].taskType === 'pickup'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 3;
            },
            itemStyle: {
              color: '#1890ff'
            }
          },
          {
            name: '配送点',
            type: 'scatter',
            data: scatterData.filter((_, index) => taskPoints[index].taskType === 'delivery'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 3;
            },
            itemStyle: {
              color: '#52c41a'
            }
          },
          {
            name: '巡检点',
            type: 'scatter',
            data: scatterData.filter((_, index) => taskPoints[index].taskType === 'patrol'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 3;
            },
            itemStyle: {
              color: '#faad14'
            }
          },
          {
            name: '清洁点',
            type: 'scatter',
            data: scatterData.filter((_, index) => taskPoints[index].taskType === 'cleaning'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 3;
            },
            itemStyle: {
              color: '#f5222d'
            }
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [taskChartRef, taskPoints]);

  // 初始化故障点地图
  useEffect(() => {
    if (faultChartRef && faultLocations.length > 0) {
      const chart = echarts.init(faultChartRef);
      
      const severityColors = {
        'low': '#52c41a',
        'medium': '#faad14',
        'high': '#f5222d'
      };

      const faultData = faultLocations.map(fault => ({
        name: fault.faultType,
        value: [fault.x, fault.y, fault.faultCount],
        itemStyle: {
          color: severityColors[fault.severity]
        }
      }));

      const option = {
        title: {
          text: '故障点分布地图',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params: any) {
            const fault = faultLocations.find(f => f.x === params.data.value[0] && f.y === params.data.value[1]);
            return `故障类型: ${params.data.name}<br/>坐标: (${params.data.value[0]}, ${params.data.value[1]})<br/>故障次数: ${params.data.value[2]}<br/>严重程度: ${fault?.severity}<br/>描述: ${fault?.description}<br/>最后发生: ${fault?.lastOccurrence}`;
          }
        },
        legend: {
          data: ['低风险', '中风险', '高风险'],
          bottom: '5%'
        },
        grid: {
          height: '70%',
          top: '15%'
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: 80,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 80,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#f0f0f0'
            }
          }
        },
        series: [
          {
            name: '低风险',
            type: 'scatter',
            data: faultData.filter((_, index) => faultLocations[index].severity === 'low'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 4;
            },
            itemStyle: {
              color: '#52c41a'
            }
          },
          {
            name: '中风险',
            type: 'scatter',
            data: faultData.filter((_, index) => faultLocations[index].severity === 'medium'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 4;
            },
            itemStyle: {
              color: '#faad14'
            }
          },
          {
            name: '高风险',
            type: 'scatter',
            data: faultData.filter((_, index) => faultLocations[index].severity === 'high'),
            symbolSize: function(data: any) {
              return Math.sqrt(data[2]) * 4;
            },
            itemStyle: {
              color: '#f5222d'
            }
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [faultChartRef, faultLocations]);

  // 计算统计数据
  const totalTrafficPoints = 156; // 模拟总流量点
  const highTrafficAreas = 8; // 模拟高流量区域
  const congestionPoints = 3; // 模拟拥堵点
  const coreWorkAreas = taskPoints.filter(point => point.taskCount > 40).length;
  const totalFaultPoints = faultLocations.length;
  const highRiskAreas = faultLocations.filter(fault => fault.severity === 'high').length;
  const avgFaultFrequency = faultLocations.reduce((sum, fault) => sum + fault.faultCount, 0) / faultLocations.length;

  // getCongestionTag function removed as it's not used

  const getTaskTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      'pickup': { color: 'blue', text: '取货' },
      'delivery': { color: 'green', text: '配送' },
      'patrol': { color: 'orange', text: '巡检' },
      'cleaning': { color: 'red', text: '清洁' }
    };
    const config = typeMap[type] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSeverityTag = (severity: string) => {
    const severityMap: Record<string, { color: string; text: string }> = {
      'low': { color: 'success', text: '低风险' },
      'medium': { color: 'warning', text: '中风险' },
      'high': { color: 'error', text: '高风险' }
    };
    const config = severityMap[severity] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const taskColumns: ColumnsType<TaskPoint> = [
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      align: 'center'
    },
    {
      title: '坐标',
      key: 'coordinate',
      width: 120,
      align: 'center',
      render: (_: any, record: TaskPoint) => `(${record.x}, ${record.y})`
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 100,
      align: 'center',
      render: (type: string) => getTaskTypeTag(type)
    },
    {
      title: '任务数量',
      dataIndex: 'taskCount',
      key: 'taskCount',
      width: 100,
      align: 'center',
      sorter: (a: TaskPoint, b: TaskPoint) => a.taskCount - b.taskCount
    },
    {
      title: '平均完成时间(分钟)',
      dataIndex: 'avgCompletionTime',
      key: 'avgCompletionTime',
      width: 160,
      align: 'center',
      render: (time: number) => time.toFixed(1)
    }
  ];

  const faultColumns: ColumnsType<FaultLocation> = [
    {
      title: '坐标',
      key: 'coordinate',
      width: 120,
      align: 'center',
      render: (_: any, record: FaultLocation) => `(${record.x}, ${record.y})`
    },
    {
      title: '故障类型',
      dataIndex: 'faultType',
      key: 'faultType',
      width: 120,
      align: 'center'
    },
    {
      title: '故障次数',
      dataIndex: 'faultCount',
      key: 'faultCount',
      width: 100,
      align: 'center',
      sorter: (a: FaultLocation, b: FaultLocation) => a.faultCount - b.faultCount
    },
    {
      title: '风险等级',
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
      title: '最后发生时间',
      dataIndex: 'lastOccurrence',
      key: 'lastOccurrence',
      width: 160,
      align: 'center'
    }
  ];

  return (
    <div style={{ background: 'transparent' }}>
      {/* 时间范围和统计信息 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <CalendarOutlined style={{ color: '#1890ff' }} />
              <Typography.Text strong>时间范围:</Typography.Text>
            </Space>
          </Col>
          <Col>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
              size="middle"
            >
              <Select.Option value="yesterday">昨日</Select.Option>
              <Select.Option value="last7days">近7日</Select.Option>
              <Select.Option value="last30days">近30日</Select.Option>
            </Select>
          </Col>
          <Col flex="auto">
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
              {timeRange === 'yesterday' ? '统计昨天一整天的数据' : 
               timeRange === 'last7days' ? '统计过去7天的数据（不包含今日）' : 
               '统计过去30天的数据（不包含今日）'}
            </Typography.Text>
          </Col>
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
      
      {/* 空间统计概览 */}
      <Card title="空间统计概览" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  流量监测点
                  <MetricTooltip {...getMetricDefinition('trafficPoints')} />
                </Space>
              }
              value={totalTrafficPoints}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  高流量区域
                  <MetricTooltip {...getMetricDefinition('highTrafficAreas')} />
                </Space>
              }
              value={highTrafficAreas}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  核心工作区
                  <MetricTooltip {...getMetricDefinition('coreWorkAreas')} />
                </Space>
              }
              value={coreWorkAreas}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title={
                <Space>
                  高风险区域
                  <MetricTooltip {...getMetricDefinition('highRiskAreas')} />
                </Space>
              }
              value={highRiskAreas}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 热力图展示 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        {selectedView === 'traffic' && (
          <Col span={24}>
            <Card 
              title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      机器人流量热力图 
                      <MetricTooltip {...getMetricDefinition('robotTrafficHeatmap')} />
                    </div>
                  </Col>
                  <Col>
                    <Space>
                      <span>热力图类型:</span>
                      <Select
                        value={selectedView}
                        onChange={setSelectedView}
                        style={{ width: 120 }}
                        options={[
                          { value: 'traffic', label: '流量热力图' },
                          { value: 'task', label: '任务点分布' },
                          { value: 'fault', label: '故障点地图' }
                        ]}
                      />
                    </Space>
                  </Col>
                </Row>
              } 
              style={{ height: '500px' }}
            >
              <div ref={setTrafficChartRef} style={{ width: '100%', height: '420px' }} />
            </Card>
          </Col>
        )}
        {selectedView === 'task' && (
          <Col span={24}>
            <Card 
              title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      任务点分布热力图 
                      <MetricTooltip {...getMetricDefinition('taskDistributionHeatmap')} />
                    </div>
                  </Col>
                  <Col>
                    <Space>
                      <span>热力图类型:</span>
                      <Select
                        value={selectedView}
                        onChange={setSelectedView}
                        style={{ width: 120 }}
                        options={[
                          { value: 'traffic', label: '流量热力图' },
                          { value: 'task', label: '任务点分布' },
                          { value: 'fault', label: '故障点地图' }
                        ]}
                      />
                    </Space>
                  </Col>
                </Row>
              } 
              style={{ height: '500px' }}
            >
              <div ref={setTaskChartRef} style={{ width: '100%', height: '420px' }} />
            </Card>
          </Col>
        )}
        {selectedView === 'fault' && (
          <Col span={24}>
            <Card 
              title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      故障点分布地图 
                      <MetricTooltip {...getMetricDefinition('faultDistributionMap')} />
                    </div>
                  </Col>
                  <Col>
                    <Space>
                      <span>热力图类型:</span>
                      <Select
                        value={selectedView}
                        onChange={setSelectedView}
                        style={{ width: 120 }}
                        options={[
                          { value: 'traffic', label: '流量热力图' },
                          { value: 'task', label: '任务点分布' },
                          { value: 'fault', label: '故障点地图' }
                        ]}
                      />
                    </Space>
                  </Col>
                </Row>
              } 
              style={{ height: '500px' }}
            >
              <div ref={setFaultChartRef} style={{ width: '100%', height: '420px' }} />
            </Card>
          </Col>
        )}
      </Row>

      {/* 详细数据分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          <Card title="流量分析" style={{ height: '300px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      拥堵点数量
                      <MetricTooltip {...getMetricDefinition('spatialCongestionPoints')} />
                    </Space>
                  }
                  value={congestionPoints}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      平均通行速度
                      <MetricTooltip {...getMetricDefinition('avgTrafficSpeed')} />
                    </Space>
                  }
                  value={1.5}
                  precision={1}
                  suffix="m/s"
                  prefix={<CarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={24}>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>通道利用率</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['主通道A', '主通道B', '辅助通道C'].map((channel, index) => (
                      <div key={channel} style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>{channel}</div>
                        <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${[85, 72, 45][index]}%`, 
                              backgroundColor: [85, 72, 45][index] > 80 ? '#f5222d' : [85, 72, 45][index] > 60 ? '#faad14' : '#52c41a',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{[85, 72, 45][index]}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="故障分析" style={{ height: '300px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      故障点总数
                      <MetricTooltip {...getMetricDefinition('spatialFaultPoints')} />
                    </Space>
                  }
                  value={totalFaultPoints}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space>
                      平均故障频率
                      <MetricTooltip {...getMetricDefinition('spatialFaultFrequency')} />
                    </Space>
                  }
                  value={avgFaultFrequency}
                  precision={1}
                  suffix="次/点"
                  prefix={<HeatMapOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={24}>
                {highRiskAreas > 2 && (
                  <Alert
                    message="高风险区域警告"
                    description={`发现 ${highRiskAreas} 个高风险区域，建议优化环境或调整机器人路径规划。`}
                    type="warning"
                    showIcon
                    style={{ marginTop: '16px' }}
                  />
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      {selectedView === 'task' && (
        <Card title="任务点详情" style={{ marginBottom: '16px' }}>
          <Table
            columns={taskColumns}
            dataSource={taskPoints}
            rowKey="id"
            loading={loading}
            size="middle"
            pagination={{
              total: taskPoints.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => `共 ${total} 条记录`
            }}
          />
        </Card>
      )}

      {selectedView === 'fault' && (
        <Card title="故障点详情">
          <Table
            columns={faultColumns}
            dataSource={faultLocations}
            rowKey="id"
            loading={loading}
            size="middle"
            pagination={{
              total: faultLocations.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => `共 ${total} 条记录`
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default SpatialHeatmap;