import React from 'react';
import { Tooltip, Typography, Space } from 'antd';
import { QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface MetricTooltipProps {
  title: string;
  description: string;
  calculation?: string;
  example?: string;
  type?: 'question' | 'info';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

const MetricTooltip: React.FC<MetricTooltipProps> = ({
  title,
  description,
  calculation,
  example,
  type = 'question',
  placement = 'top'
}) => {
  const tooltipContent = (
    <div style={{ maxWidth: '300px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Text strong style={{ color: '#fff' }}>{title}</Text>
      </div>
      <div style={{ marginBottom: calculation || example ? '8px' : '0' }}>
        <Text style={{ color: '#fff', fontSize: '12px' }}>{description}</Text>
      </div>
      {calculation && (
        <div style={{ marginBottom: example ? '8px' : '0' }}>
          <Text style={{ color: '#91d5ff', fontSize: '12px' }}>
            <strong>计算规则:</strong> {calculation}
          </Text>
        </div>
      )}
      {example && (
        <div>
          <Text style={{ color: '#b7eb8f', fontSize: '12px' }}>
            <strong>示例:</strong> {example}
          </Text>
        </div>
      )}
    </div>
  );

  const icon = type === 'info' ? (
    <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '14px', marginLeft: '4px' }} />
  ) : (
    <QuestionCircleOutlined style={{ color: '#8c8c8c', fontSize: '14px', marginLeft: '4px' }} />
  );

  return (
    <Tooltip
      title={tooltipContent}
      placement={placement}
      overlayStyle={{ maxWidth: '350px' }}
      color="rgba(0, 0, 0, 0.85)"
    >
      {icon}
    </Tooltip>
  );
};

export default MetricTooltip;

// 预定义的指标说明配置
export const METRIC_DEFINITIONS = {
  // 业务性能指标
  totalTasks: {
    title: '总任务量',
    description: '在选定时间范围内系统分配给机器人的所有任务总数',
    calculation: '已完成任务 + 进行中任务 + 失败任务',
    example: '昨日总任务量156个，包含各种类型的任务'
  },
  completedTasks: {
    title: '完成任务量',
    description: '在选定时间范围内机器人成功完成的任务数量',
    calculation: '状态为"已完成"的任务总数',
    example: '昨日完成132个任务，完成率84.6%'
  },
  completionRate: {
    title: '任务完成率',
    description: '完成任务数量占总任务数量的百分比，反映系统整体执行效率',
    calculation: '(完成任务量 ÷ 总任务量) × 100%',
    example: '完成率85%表示每100个任务中有85个成功完成'
  },
  avgDuration: {
    title: '平均履约时长',
    description: '机器人完成单个任务所需的平均时间，以分钟为单位',
    calculation: '所有已完成任务的执行时长总和 ÷ 完成任务数量',
    example: '平均35分钟表示每个任务平均需要35分钟完成'
  },
  onTimeRate: {
    title: '准时达成率',
    description: '在预期时间内完成的任务占总完成任务的百分比',
    calculation: '(准时完成任务数 ÷ 总完成任务数) × 100%',
    example: '准时率90%表示90%的任务在预期时间内完成'
  },
  robotUtilization: {
    title: '机器人利用率',
    description: '机器人实际工作时间占总可用时间的百分比',
    calculation: '(实际工作时长 ÷ 总可用时长) × 100%',
    example: '利用率78%表示机器人78%的时间在执行任务'
  },
  energyConsumption: {
    title: '能耗统计',
    description: '机器人在选定时间范围内的总电力消耗，以千瓦时为单位',
    calculation: '所有机器人的电力消耗总和',
    example: '日耗电245.8kWh，包含移动、作业、待机等状态'
  },
  dailyAvgTasks: {
    title: '日均任务量',
    description: '选定时间范围内平均每天处理的任务数量',
    calculation: '总任务量 ÷ 统计天数',
    example: '近7日日均156个任务，工作负荷稳定'
  },
  peakTasks: {
    title: '峰值任务量',
    description: '选定时间范围内单日最高任务处理数量',
    calculation: '统计期间内单日任务量的最大值',
    example: '峰值89个任务，通常出现在工作日高峰期'
  },
  avgTasksPerRobot: {
    title: '机器人平均任务数',
    description: '平均每台机器人每天处理的任务数量',
    calculation: '日均任务量 ÷ 活跃机器人数量',
    example: '每台机器人日均12.5个任务，负载均衡良好'
  },

  // 机器人状态指标
  totalRobots: {
    title: '机器人总数',
    description: '系统中注册的机器人设备总数量',
    calculation: '所有状态机器人的总数',
    example: '总共25台机器人，包含工作中、空闲、充电等状态'
  },
  workingRobots: {
    title: '工作中',
    description: '当前正在执行任务的机器人数量',
    calculation: '状态为"工作中"的机器人数量',
    example: '15台机器人正在执行配送、清洁等任务'
  },
  idleRobots: {
    title: '空闲',
    description: '当前处于待命状态，可以接受新任务的机器人数量',
    calculation: '状态为"空闲"的机器人数量',
    example: '8台机器人处于空闲状态，可随时分配任务'
  },
  chargingRobots: {
    title: '充电中',
    description: '当前正在充电的机器人数量',
    calculation: '状态为"充电中"的机器人数量',
    example: '2台机器人正在充电，预计30分钟后可用'
  },
  faultRobots: {
    title: '故障',
    description: '当前出现故障需要维修的机器人数量',
    calculation: '状态为"故障"的机器人数量',
    example: '0台机器人故障，系统运行正常'
  },
  avgBattery: {
    title: '平均电量',
    description: '所有机器人当前电池电量的平均值',
    calculation: '所有机器人电量总和 ÷ 机器人总数',
    example: '平均电量76%，整体电量状况良好'
  },
  avgRuntime: {
    title: '平均运行时长',
    description: '机器人平均连续运行时间，以小时为单位',
    calculation: '所有机器人运行时长总和 ÷ 机器人总数',
    example: '平均运行6.8小时，工作强度适中'
  },

  // 异常故障指标
  totalFaults: {
    title: '故障总数',
    description: '选定时间范围内发生的所有故障事件数量',
    calculation: '已解决故障 + 待处理故障',
    example: '近7日共发生23起故障，包含硬件、软件等类型'
  },
  resolvedFaults: {
    title: '已解决',
    description: '已经处理完成的故障数量',
    calculation: '状态为"已解决"的故障数量',
    example: '已解决18起故障，处理效率较高'
  },
  pendingFaults: {
    title: '待处理',
    description: '尚未解决的故障数量',
    calculation: '状态为"待处理"的故障数量',
    example: '5起故障待处理，需要优先关注'
  },
  criticalFaults: {
    title: '严重故障',
    description: '影响系统正常运行的高优先级故障数量',
    calculation: '严重级别为"严重"的故障数量',
    example: '2起严重故障，需要立即处理'
  },
  faultRate: {
    title: '故障率',
    description: '故障发生频率，反映系统稳定性',
    calculation: '(故障总数 ÷ 总任务数) × 100%',
    example: '故障率2.3%，系统稳定性良好'
  },
  avgResolutionTime: {
    title: '平均解决时间',
    description: '从故障发生到解决完成的平均时长，以小时为单位',
    calculation: '所有已解决故障的处理时长总和 ÷ 已解决故障数量',
    example: '平均2.5小时解决故障，响应速度较快'
  },

  // 调度系统指标
  totalSchedules: {
    title: '调度总数',
    description: '选定时间范围内系统执行的调度操作总数',
    calculation: '成功调度 + 失败调度',
    example: '昨日执行1,245次调度操作'
  },
  successfulSchedules: {
    title: '成功调度',
    description: '成功完成的调度操作数量',
    calculation: '状态为"成功"的调度数量',
    example: '1,198次成功调度，成功率96.2%'
  },
  scheduleSuccessRate: {
    title: '调度成功率',
    description: '成功调度占总调度的百分比，反映调度系统效率',
    calculation: '(成功调度数 ÷ 调度总数) × 100%',
    example: '成功率96.2%，调度系统运行稳定'
  },
  avgScheduleTime: {
    title: '平均调度时间',
    description: '系统完成单次调度决策所需的平均时间，以毫秒为单位',
    calculation: '所有调度操作耗时总和 ÷ 调度总数',
    example: '平均125ms完成调度，响应速度快'
  },
  avgPlanningTime: {
    title: '平均路径规划时间',
    description: '系统为机器人规划最优路径所需的平均时间',
    calculation: '所有路径规划耗时总和 ÷ 规划次数',
    example: '平均85ms完成路径规划，算法效率高'
  },
  avgWaitTime: {
    title: '平均等待时间',
    description: '任务从创建到开始执行的平均等待时间',
    calculation: '所有任务等待时长总和 ÷ 任务总数',
    example: '平均等待45ms，调度响应及时'
  },

  // 空间热力图指标
  totalTrafficPoints: {
    title: '流量监测点',
    description: '系统中设置的流量监测点总数',
    calculation: '所有流量监测点的数量',
    example: '156个监测点覆盖主要通道和区域'
  },
  highTrafficAreas: {
    title: '高流量区域',
    description: '机器人通行频率较高的区域数量',
    calculation: '流量超过阈值的区域数量',
    example: '8个高流量区域，需要优化路径规划'
  },
  congestionPoints: {
    title: '拥堵点',
    description: '经常发生交通拥堵的位置数量',
    calculation: '拥堵频率超过阈值的点位数量',
    example: '3个拥堵点，建议增加通道或调整路径'
  },
  totalTaskPoints: {
    title: '任务执行点',
    description: '机器人执行任务的地点总数',
    calculation: '所有任务执行位置的数量',
    example: '45个任务点分布在各个工作区域'
  },
  coreWorkAreas: {
    title: '核心工作区',
    description: '任务密度较高的核心工作区域数量',
    calculation: '任务数量超过阈值的区域数量',
    example: '12个核心工作区，承担主要业务'
  },
  avgTaskDensity: {
    title: '平均任务密度',
    description: '每个工作区域的平均任务数量',
    calculation: '总任务数 ÷ 工作区域数',
    example: '平均32.5个任务/区域，分布较为均匀'
  },
  totalFaultPoints: {
    title: '故障发生点',
    description: '记录到故障事件的位置总数',
    calculation: '发生过故障的位置数量',
    example: '18个故障点，需要重点监控'
  },
  highRiskAreas: {
    title: '高风险区域',
    description: '故障发生频率较高的高风险区域数量',
    calculation: '故障频率超过阈值的区域数量',
    example: '3个高风险区域，需要加强维护'
  },
  avgFaultFrequency: {
    title: '平均故障频率',
    description: '每个区域的平均故障发生次数',
    calculation: '总故障数 ÷ 故障发生区域数',
    example: '平均2.1次/区域，整体稳定性良好'
  },

  // 机器人状态补充指标
  avgRunningTime: {
    title: '总运行时长',
    description: '机器人累计运行的总时间，以小时为单位',
    calculation: '所有机器人运行时长的总和',
    example: '总运行156.8小时，工作量饱满'
  },
  totalDistance: {
    title: '总运行里程',
    description: '机器人累计行驶的总距离，以公里为单位',
    calculation: '所有机器人行驶距离的总和',
    example: '总里程1,245.6公里，运行效率高'
  },
  mtbf: {
    title: 'MTBF(平均故障间隔时间)',
    description: '机器人平均无故障运行时间，反映设备可靠性',
    calculation: '总运行时间 ÷ 故障次数',
    example: 'MTBF 168小时，设备可靠性良好'
  },
  mttr: {
    title: 'MTTR(平均故障修复时间)',
    description: '从故障发生到修复完成的平均时间',
    calculation: '故障修复总时间 ÷ 故障次数',
    example: 'MTTR 2.5小时，维修响应及时'
  },
  energyEfficiency: {
    title: '能耗效率',
    description: '机器人单位里程的能耗，以千瓦时/公里为单位',
    calculation: '总能耗 ÷ 总里程',
    example: '0.85kWh/km，能耗控制良好'
  },
  avgChargingTimes: {
    title: '平均充电次数',
    description: '机器人平均每天的充电次数',
    calculation: '总充电次数 ÷ 统计天数',
    example: '日均2.3次充电，电池管理合理'
  },
  avgBatteryLevel: {
    title: '平均电量水平',
    description: '机器人电池的平均电量百分比',
    calculation: '所有机器人电量总和 ÷ 机器人数量',
    example: '平均电量76%，电池状态良好'
  },
  totalEnergyConsumption: {
    title: '总能耗',
    description: '所有机器人的总电力消耗，以千瓦时为单位',
    calculation: '所有机器人能耗的总和',
    example: '总能耗1,058.9kWh，能源管理有效'
  },

  // 异常故障补充指标
  resolutionRate: {
    title: '故障解决率',
    description: '已解决故障占总故障的百分比',
    calculation: '(已解决故障数 ÷ 总故障数) × 100%',
    example: '解决率78.3%，处理效率较高'
  },
  totalInterventions: {
    title: '人工干预次数',
    description: '需要人工介入处理的事件总数',
    calculation: '所有人工干预事件的总数',
    example: '共干预15次，自动化程度较高'
  },
  avgInterventionTime: {
    title: '平均干预时长',
    description: '人工干预处理的平均耗时，以分钟为单位',
    calculation: '干预总时长 ÷ 干预次数',
    example: '平均25分钟，响应处理及时'
  },
  frequentFaultRobot: {
    title: '高频故障机器人',
    description: '故障发生频率最高的机器人编号',
    calculation: '统计各机器人故障次数，取最高值',
    example: 'R001机器人故障5次，需重点关注'
  },

  // 调度系统补充指标
  avgAssignTime: {
    title: '平均分配时间',
    description: '系统为任务分配机器人所需的平均时间',
    calculation: '任务分配总时间 ÷ 分配次数',
    example: '平均85ms完成分配，响应迅速'
  },
  successRate: {
    title: '路径规划成功率',
    description: '成功完成路径规划的任务占总任务的百分比',
    calculation: '(成功规划数 ÷ 总规划数) × 100%',
    example: '成功率96.8%，算法稳定可靠'
  },
  avgQueueWaitTime: {
    title: '平均队列等待时间',
    description: '任务在队列中等待处理的平均时间',
    calculation: '任务等待总时间 ÷ 任务数量',
    example: '平均等待65ms，调度效率高'
  },
  queueBacklog: {
    title: '消息队列积压',
    description: '待处理的消息队列中的任务数量',
    calculation: '队列中未处理消息的实时数量',
    example: '积压23条消息，系统负载正常'
  },
  avgApiResponse: {
    title: 'API响应时间',
    description: '系统API接口的平均响应时间',
    calculation: 'API响应总时间 ÷ 请求次数',
    example: '平均响应45ms，接口性能良好'
  },
  cpuUsage: {
    title: 'CPU使用率',
    description: '系统处理器的使用率百分比',
    calculation: '(已使用CPU时间 ÷ 总CPU时间) × 100%',
    example: 'CPU使用率65%，系统负载适中'
  },
  memoryUsage: {
    title: '内存使用率',
    description: '系统内存的使用率百分比',
    calculation: '(已使用内存 ÷ 总内存) × 100%',
    example: '内存使用率72%，资源利用合理'
  },
  emptyDistanceRate: {
    title: '空驶里程率',
    description: '机器人空载行驶距离占总行驶距离的百分比',
    calculation: '(空驶里程 ÷ 总里程) × 100%',
    example: '空驶率12.5%，路径优化良好'
  },
  avgEmptyDistance: {
    title: '平均空驶里程',
    description: '机器人平均每次任务的空载行驶距离',
    calculation: '总空驶里程 ÷ 任务次数',
    example: '平均空驶0.8公里，效率较高'
  },
  conflictCount: {
    title: '冲突/死锁次数',
    description: '机器人路径冲突或系统死锁的发生次数',
    calculation: '冲突事件和死锁事件的总数',
    example: '冲突3次，调度算法运行稳定'
  },

  // 空间热力图补充指标
  spatialCongestionPoints: {
    title: '拥堵点数量',
    description: '机器人通行出现拥堵的地点数量',
    calculation: '通行速度 < 正常速度50%的地点数量',
    example: '如果正常通行速度为2m/s，有3个地点的通行速度低于1m/s，则拥堵点数量 = 3个'
  },
  avgTrafficSpeed: {
    title: '平均通行速度',
    description: '机器人在监测区域内的平均移动速度',
    calculation: '所有机器人移动距离总和 ÷ 移动时间总和',
    example: '如果10台机器人在1小时内总共移动5400米，则平均通行速度 = 5400m ÷ 3600s = 1.5m/s'
  },
  spatialFaultPoints: {
    title: '故障点总数',
    description: '系统中记录的所有故障发生地点数量',
    calculation: '发生过故障的不同地点数量统计',
    example: '如果在12个不同位置发生过故障（包括传感器故障、路径阻塞等），则故障点总数 = 12个'
  },
  spatialFaultFrequency: {
    title: '平均故障频率',
    description: '每个故障点平均发生故障的次数',
    calculation: '故障总次数 ÷ 故障点总数',
    example: '如果12个故障点总共发生了36次故障，则平均故障频率 = 36 ÷ 12 = 3.0次/点'
  },

  // 热力图模块指标
  robotTrafficHeatmap: {
    title: '机器人流量热力图',
    description: '显示机器人在各个区域的通行频率和密度分布，用颜色深浅表示流量大小',
    calculation: '统计每个网格区域内机器人通过次数，生成热力图可视化',
    example: '红色区域表示高流量（>50次/小时），蓝色区域表示低流量（<10次/小时），帮助识别繁忙通道和优化路径规划'
  },
  taskDistributionHeatmap: {
    title: '任务点分布热力图',
    description: '显示任务执行点的空间分布密度，反映工作负载的地理分布特征',
    calculation: '统计各区域任务执行次数和类型，按密度生成热力图',
    example: '深红色表示高任务密度区域（>30个任务/区域），浅色表示低密度区域（<5个任务/区域），用于优化任务分配和机器人部署'
  },
  faultDistributionMap: {
    title: '故障点分布地图',
    description: '显示故障事件的空间分布和严重程度，帮助识别高风险区域和故障模式',
    calculation: '标记故障发生位置，按故障频率和严重程度分级显示',
    example: '红色标记表示高频故障点（>5次故障），黄色表示中频故障点（2-5次），绿色表示低频故障点（1次），便于预防性维护规划'
  }
};

// 根据指标名称获取说明信息的工具函数
export const getMetricDefinition = (metricKey: string) => {
  return METRIC_DEFINITIONS[metricKey as keyof typeof METRIC_DEFINITIONS];
};