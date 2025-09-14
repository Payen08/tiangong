import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Tooltip,
  Dropdown,
  Tabs,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '@/hooks/useResponsive';
import WaybillTaskDetail from './WaybillTaskDetail';
import TaskDetail from '@/pages/DispatchManagement/TaskManagement/TaskDetail';

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

// 运单任务数据类型
interface WaybillTask {
  id: string;
  taskName: string;
  taskType: string;
  executionDevice: string;
  status: '待执行' | '执行中' | '已完成' | '已取消' | '异常' | '已挂起' | '已关闭' | '已暂停';
  executionStatus: '移动' | 'n1' | '呼梯' | '乘梯' | '关梯' | '上下料';
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
  orderStatus: '待分配' | '待执行' | '执行中' | '已完成' | '已取消' | '异常关闭';
  createTime: string;
  endTime?: string;
  updatedBy: string;
  waybillTasks?: WaybillTask[]; // 运单任务列表
}

const BusinessOrders: React.FC = () => {
  const { isMobile, isLargeScreen } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [executionStatusFilter, setExecutionStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const [waybillTaskDetailVisible, setWaybillTaskDetailVisible] = useState(false);
  const [selectedWaybillTask, setSelectedWaybillTask] = useState<WaybillTask | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  
  // 检测屏幕尺寸
  const [isLargeScreenLocal, setIsLargeScreenLocal] = useState(window.innerWidth >= 1600);
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsLargeScreenLocal(width >= 1600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 使用本地的isLargeScreen状态
  const isLargeScreenState = isLargeScreen || isLargeScreenLocal;
  
  // 模拟业务订单数据
  const [orders, setOrders] = useState<BusinessOrderRecord[]>([
    {
      id: '1',
      orderName: '生产订单001',
      currentWaybill: 'WB-001',
      executionStatus: '移动',
      orderStatus: '执行中',
      createTime: '2024-01-15 09:30:00',
      endTime: undefined,
      updatedBy: '张三',
      waybillTasks: [
        { id: 'WT-001', taskName: '原料搬运任务', taskType: '搬运', executionDevice: 'AGV-001', status: '已完成', executionStatus: '上下料', priority: '高', createTime: '2024-01-15 09:30:00', startTime: '2024-01-15 09:35:00', endTime: '2024-01-15 10:15:00', progress: 100 },
        { id: 'WT-002', taskName: '产品配送任务', taskType: '配送', executionDevice: 'AGV-002', status: '执行中', executionStatus: '移动', priority: '中', createTime: '2024-01-15 10:20:00', startTime: '2024-01-15 10:25:00', progress: 65 }
      ]
    },
    {
      id: '2',
      orderName: '配送订单002',
      currentWaybill: 'WB-002',
      executionStatus: '上下料',
      orderStatus: '待执行',
      createTime: '2024-01-15 10:15:00',
      endTime: undefined,
      updatedBy: '李四',
      waybillTasks: [
        { id: 'WT-003', taskName: '设备维护任务', taskType: '维护', executionDevice: 'AGV-003', status: '待执行', executionStatus: 'n1', priority: '低', createTime: '2024-01-15 11:00:00', progress: 0 }
      ]
    },
    {
      id: '3',
      orderName: '回收订单003',
      currentWaybill: 'WB-003',
      executionStatus: '呼梯',
      orderStatus: '异常关闭',
      createTime: '2024-01-15 11:00:00',
      endTime: undefined,
      updatedBy: '王五',
      waybillTasks: [
        { id: 'WT-004', taskName: '回收运输任务', taskType: '回收', executionDevice: 'AGV-004', status: '已关闭', executionStatus: '呼梯', priority: '高', createTime: '2024-01-15 11:00:00', startTime: '2024-01-15 11:05:00', progress: 30 },
        { id: 'WT-005', taskName: '清理任务', taskType: '清理', executionDevice: 'AGV-005', status: '已取消', executionStatus: '关梯', priority: '中', createTime: '2024-01-15 11:30:00', progress: 0 }
      ]
    },
    {
      id: '4',
      orderName: '维护订单004',
      currentWaybill: 'WB-004',
      executionStatus: 'n1',
      orderStatus: '已完成',
      createTime: '2024-01-14 14:20:00',
      endTime: '2024-01-14 16:45:00',
      updatedBy: '赵六',
      waybillTasks: [
        { id: 'WT-006', taskName: '检测任务', taskType: '检测', executionDevice: 'AGV-006', status: '已完成', executionStatus: '乘梯', priority: '中', createTime: '2024-01-14 14:20:00', startTime: '2024-01-14 14:25:00', endTime: '2024-01-14 16:45:00', progress: 100 }
      ]
    },
    {
      id: '5',
      orderName: '检测订单005',
      currentWaybill: 'WB-005',
      executionStatus: '乘梯',
      orderStatus: '待执行',
      createTime: '2024-01-15 13:30:00',
      endTime: undefined,
      updatedBy: '孙七',
      waybillTasks: [
        { id: 'WT-007', taskName: '质量检测任务', taskType: '检测', executionDevice: 'AGV-007', status: '待执行', executionStatus: '移动', priority: '高', createTime: '2024-01-15 13:30:00', progress: 0 },
        { id: 'WT-008', taskName: '数据采集任务', taskType: '采集', executionDevice: 'AGV-008', status: '待执行', executionStatus: '呼梯', priority: '中', createTime: '2024-01-15 13:35:00', progress: 0 },
        { id: 'WT-009', taskName: '报告生成任务', taskType: '生成', executionDevice: 'AGV-009', status: '待执行', executionStatus: '上下料', priority: '低', createTime: '2024-01-15 13:40:00', progress: 0 }
      ]
    },
    {
      id: '6',
      orderName: '故障订单006',
      currentWaybill: 'WB-006',
      executionStatus: '移动',
      orderStatus: '异常关闭',
      createTime: '2024-01-16 08:00:00',
      endTime: '2024-01-16 08:30:00',
      updatedBy: '李四',
      waybillTasks: [
        { id: 'WT-010', taskName: '故障处理任务', taskType: '维修', executionDevice: 'AGV-010', status: '已关闭', executionStatus: '移动', priority: '高', createTime: '2024-01-16 08:00:00', startTime: '2024-01-16 08:05:00', endTime: '2024-01-16 08:30:00', progress: 100 }
      ]
     },
      {
        id: '7',
        orderName: '新建订单007',
        currentWaybill: 'WB-007',
        executionStatus: 'n1',
        orderStatus: '待分配',
        createTime: '2024-01-15 15:00:00',
        endTime: undefined,
        updatedBy: '周八',
        waybillTasks: []
      },
    {
      id: '8',
      orderName: '紧急订单008',
      currentWaybill: 'WB-008',
      executionStatus: '移动',
      orderStatus: '执行中',
      createTime: '2024-01-15 16:30:00',
      endTime: undefined,
      updatedBy: '吴九',
      waybillTasks: [
        { id: 'WT-011', taskName: '紧急搬运任务', taskType: '搬运', executionDevice: 'AGV-011', status: '已挂起', executionStatus: '移动', priority: '高', createTime: '2024-01-15 16:30:00', progress: 0 }
      ]
    },
    {
      id: '9',
      orderName: '系统维护订单009',
      currentWaybill: 'WB-009',
      executionStatus: '关梯',
      orderStatus: '异常关闭',
      createTime: '2024-01-14 09:00:00',
      endTime: '2024-01-14 12:30:00',
      updatedBy: '系统管理员',
      waybillTasks: [
        { id: 'WT-012', taskName: '系统诊断任务', taskType: '诊断', executionDevice: 'AGV-012', status: '已关闭', executionStatus: '关梯', priority: '高', createTime: '2024-01-14 09:00:00', startTime: '2024-01-14 09:05:00', endTime: '2024-01-14 10:30:00', progress: 100 },
        { id: 'WT-013', taskName: '数据备份任务', taskType: '备份', executionDevice: 'AGV-013', status: '已关闭', executionStatus: '上下料', priority: '中', createTime: '2024-01-14 10:30:00', startTime: '2024-01-14 10:35:00', endTime: '2024-01-14 12:30:00', progress: 100 }
      ]
    },
    {
      id: '10',
      orderName: '设备校准订单010',
      currentWaybill: 'WB-010',
      executionStatus: '乘梯',
      orderStatus: '异常关闭',
      createTime: '2024-01-13 14:00:00',
      endTime: '2024-01-13 17:45:00',
      updatedBy: '技术部',
      waybillTasks: [
        { id: 'WT-014', taskName: '设备校准任务', taskType: '校准', executionDevice: 'AGV-014', status: '已关闭', executionStatus: '乘梯', priority: '高', createTime: '2024-01-13 14:00:00', startTime: '2024-01-13 14:10:00', endTime: '2024-01-13 16:20:00', progress: 100 },
        { id: 'WT-015', taskName: '精度测试任务', taskType: '测试', executionDevice: 'AGV-015', status: '已关闭', executionStatus: '移动', priority: '中', createTime: '2024-01-13 16:20:00', startTime: '2024-01-13 16:25:00', endTime: '2024-01-13 17:45:00', progress: 100 }
      ]
    },
    {
      id: '11',
      orderName: '库存盘点订单011',
      currentWaybill: 'WB-011',
      executionStatus: '呼梯',
      orderStatus: '异常关闭',
      createTime: '2024-01-12 08:30:00',
      endTime: '2024-01-12 18:00:00',
      updatedBy: '仓库管理员',
      waybillTasks: [
        { id: 'WT-016', taskName: '库存扫描任务', taskType: '扫描', executionDevice: 'AGV-016', status: '已关闭', executionStatus: '呼梯', priority: '中', createTime: '2024-01-12 08:30:00', startTime: '2024-01-12 08:35:00', endTime: '2024-01-12 12:00:00', progress: 100 },
        { id: 'WT-017', taskName: '数据统计任务', taskType: '统计', executionDevice: 'AGV-017', status: '已关闭', executionStatus: '上下料', priority: '低', createTime: '2024-01-12 12:00:00', startTime: '2024-01-12 12:05:00', endTime: '2024-01-12 15:30:00', progress: 100 },
        { id: 'WT-018', taskName: '报告生成任务', taskType: '生成', executionDevice: 'AGV-018', status: '已关闭', executionStatus: '移动', priority: '低', createTime: '2024-01-12 15:30:00', startTime: '2024-01-12 15:35:00', endTime: '2024-01-12 18:00:00', progress: 100 }
      ]
    },
    {
      id: '12',
      orderName: '安全检查订单012',
      currentWaybill: 'WB-012',
      executionStatus: 'n1',
      orderStatus: '异常关闭',
      createTime: '2024-01-11 10:00:00',
      endTime: '2024-01-11 16:30:00',
      updatedBy: '安全部门',
      waybillTasks: [
        { id: 'WT-019', taskName: '路径安全检查', taskType: '检查', executionDevice: 'AGV-019', status: '已关闭', executionStatus: 'n1', priority: '高', createTime: '2024-01-11 10:00:00', startTime: '2024-01-11 10:05:00', endTime: '2024-01-11 13:20:00', progress: 100 },
        { id: 'WT-020', taskName: '设备状态检查', taskType: '检查', executionDevice: 'AGV-020', status: '已关闭', executionStatus: '关梯', priority: '高', createTime: '2024-01-11 13:20:00', startTime: '2024-01-11 13:25:00', endTime: '2024-01-11 16:30:00', progress: 100 }
      ]
    },
  ]);

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      '待分配': 'blue',
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

  // 筛选数据
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderName.toLowerCase().includes(searchText.toLowerCase()) ||
                         order.currentWaybill.toLowerCase().includes(searchText.toLowerCase()) ||
                         order.updatedBy.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || order.orderStatus === statusFilter;
    const matchesExecutionStatus = !executionStatusFilter || order.executionStatus === executionStatusFilter;
    
    // 根据activeTab筛选
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unassigned' && order.orderStatus === '待分配') ||
                      (activeTab === 'pending' && order.orderStatus === '待执行') ||
                      (activeTab === 'executing' && order.orderStatus === '执行中') ||
                      (activeTab === 'abnormal' && order.orderStatus === '异常关闭') ||
                      (activeTab === 'completed' && order.orderStatus === '已完成') ||
                      (activeTab === 'cancelled' && order.orderStatus === '已取消');
    
    return matchesSearch && matchesStatus && matchesExecutionStatus && matchesTab;
  });

  // 获取今日日期字符串
  const getTodayDateString = () => {
    const today = new Date();
    return today.toLocaleDateString('zh-CN');
  };

  // 判断订单是否为今日创建
  const isOrderCreatedToday = (createTime: string) => {
    const orderDate = new Date(createTime);
    const orderDateString = orderDate.toLocaleDateString('zh-CN');
    return orderDateString === getTodayDateString();
  };

  // 获取订单统计（只统计今日创建的订单）
  const orderCounts = {
    all: orders.filter(order => isOrderCreatedToday(order.createTime)).length,
    unassigned: orders.filter(order => order.orderStatus === '待分配' && isOrderCreatedToday(order.createTime)).length,
    pending: orders.filter(order => order.orderStatus === '待执行' && isOrderCreatedToday(order.createTime)).length,
    executing: orders.filter(order => order.orderStatus === '执行中' && isOrderCreatedToday(order.createTime)).length,
    abnormal: orders.filter(order => order.orderStatus === '异常关闭' && isOrderCreatedToday(order.createTime)).length,
    completed: orders.filter(order => order.orderStatus === '已完成' && isOrderCreatedToday(order.createTime)).length,
    cancelled: orders.filter(order => order.orderStatus === '已取消' && isOrderCreatedToday(order.createTime)).length,
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  // 取消订单（批量取消执行运单）
  const handleCancel = (record: BusinessOrderRecord) => {
    const waybillTasksCount = record.waybillTasks?.length || 0;
    const activeTasksCount = record.waybillTasks?.filter(task => 
      ['待执行', '执行中', '已暂停', '已挂起'].includes(task.status)
    ).length || 0;
    
    confirm({
      title: '确认取消业务订单',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要取消业务订单"{record.orderName}"吗？</p>
          {waybillTasksCount > 0 && (
            <p style={{ color: '#faad14', marginTop: 8 }}>
              此操作将同时取消 {activeTasksCount} 个关联的执行运单任务
            </p>
          )}
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>此操作不可撤销</p>
        </div>
      ),
      okType: 'danger',
      onOk() {
        setOrders(prev => prev.map(order => {
          if (order.id === record.id) {
            // 取消业务订单并批量取消所有关联的执行运单
            const updatedWaybillTasks = order.waybillTasks?.map(task => {
              // 只取消未完成的任务
              if (['待执行', '执行中', '已暂停', '已挂起'].includes(task.status)) {
                return {
                  ...task,
                  status: '已取消' as const,
                  endTime: new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }).replace(/\//g, '-')
                };
              }
              return task;
            });
            
            return {
              ...order,
              orderStatus: '已取消' as const,
              endTime: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }).replace(/\//g, '-'),
              waybillTasks: updatedWaybillTasks
            };
          }
          return order;
        }));
        
        if (activeTasksCount > 0) {
          message.success(`业务订单已取消，同时取消了 ${activeTasksCount} 个执行运单任务`);
        } else {
          message.success('业务订单已取消');
        }
      },
    });
  };



  // 将WaybillTask转换为TaskDetail所需的数据格式
  const convertWaybillTaskToTaskDetail = (waybillTask: WaybillTask, businessOrder: BusinessOrderRecord) => {
    return {
      id: waybillTask.id,
      taskName: waybillTask.taskName,
      executionDevice: waybillTask.executionDevice,
      targetDevice: '工作站A', // 模拟目标设备
      status: waybillTask.status,
      createTime: waybillTask.createTime,
      endTime: waybillTask.endTime,
      relatedBusinessOrder: businessOrder.orderName,
    };
  };

  // 处理运单任务详情显示
  const handleWaybillTaskDetail = (waybillTask: WaybillTask, businessOrder: BusinessOrderRecord) => {
    const taskDetailData = convertWaybillTaskToTaskDetail(waybillTask, businessOrder);
    setSelectedTaskForDetail(taskDetailData);
    setTaskDetailVisible(true);
  };

  // 关闭运单任务详情
  const handleTaskDetailClose = () => {
    setTaskDetailVisible(false);
    setSelectedTaskForDetail(null);
  };

  // 启动运单任务
  const handleStartWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    confirm({
      title: '确认启动运单任务',
      content: `确定要启动运单任务 "${task.taskName}" 吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk() {
        message.success(`运单任务 "${task.taskName}" 启动成功`);
        // 这里可以添加实际的启动逻辑
    
      },
    });
  };

  // 暂停运单任务
  const handlePauseWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    confirm({
      title: '确认暂停运单任务',
      content: `确定要暂停运单任务 "${task.taskName}" 吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk() {
        setOrders(prev => prev.map(order => {
          if (order.id === businessOrder.id) {
            const updatedWaybillTasks = order.waybillTasks?.map(t => 
              t.id === task.id ? { ...t, status: '已暂停' as WaybillTask['status'] } : t
            );
            const updatedOrder = { ...order, waybillTasks: updatedWaybillTasks } as BusinessOrderRecord;
            // 检查并更新业务订单状态
            return checkAndUpdateBusinessOrderStatus(updatedOrder);
          }
          return order;
        }));
        message.success(`运单任务 "${task.taskName}" 已暂停`);
      },
    });
  };

  // 恢复运单任务
  const handleResumeWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    confirm({
      title: '确认恢复运单任务',
      content: `确定要恢复运单任务 "${task.taskName}" 吗？`,
      icon: <ExclamationCircleOutlined />,
      onOk() {
        setOrders(prev => prev.map(order => {
          if (order.id === businessOrder.id) {
            const updatedWaybillTasks = order.waybillTasks?.map(t => 
              t.id === task.id ? { ...t, status: '执行中' as WaybillTask['status'] } : t
            );
            const updatedOrder = { ...order, waybillTasks: updatedWaybillTasks } as BusinessOrderRecord;
            // 检查并更新业务订单状态
            return checkAndUpdateBusinessOrderStatus(updatedOrder);
          }
          return order;
        }));
        message.success(`运单任务 "${task.taskName}" 已恢复执行`);
      },
    });
  };

  // 停止运单任务
  const handleStopWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    confirm({
      title: '确认停止运单任务',
      content: `确定要停止运单任务 "${task.taskName}" 吗？停止后任务将无法继续执行。`,
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      onOk() {
        message.success(`运单任务 "${task.taskName}" 停止成功`);
        // 这里可以添加实际的停止逻辑
    
      },
    });
  };

  // 关闭运单任务
  const handleCloseWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    confirm({
      title: '确认关闭运单任务',
      content: `确定要关闭运单任务 "${task.taskName}" 吗？关闭后任务将无法执行。`,
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      onOk() {
        setOrders(prev => prev.map(order => {
          if (order.id === businessOrder.id) {
            const updatedWaybillTasks = order.waybillTasks?.map(t => 
              t.id === task.id ? { 
                ...t, 
                status: '已关闭' as WaybillTask['status'],
                endTime: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }).replace(/\//g, '-')
              } : t
            );
            const updatedOrder = { ...order, waybillTasks: updatedWaybillTasks } as BusinessOrderRecord;
            // 检查并更新业务订单状态
            return checkAndUpdateBusinessOrderStatus(updatedOrder);
          }
          return order;
        }));
        message.success(`运单任务 "${task.taskName}" 已关闭`);
      },
    });
  };

  // 检查并更新业务订单状态
  const checkAndUpdateBusinessOrderStatus = (order: BusinessOrderRecord): BusinessOrderRecord => {
    const waybillTasks = order.waybillTasks || [];
    
    // 如果没有运单任务，保持原状态
    if (waybillTasks.length === 0) {
      return order;
    }
    
    // 统计各种状态的任务数量
    const cancelledTasks = waybillTasks.filter(task => task.status === '已取消');
    const closedTasks = waybillTasks.filter(task => task.status === '已关闭');
    const pendingTasks = waybillTasks.filter(task => task.status === '待执行');
    const executingTasks = waybillTasks.filter(task => task.status === '执行中');
    const completedTasks = waybillTasks.filter(task => task.status === '已完成');
    const pausedTasks = waybillTasks.filter(task => task.status === '已暂停');
    const suspendedTasks = waybillTasks.filter(task => task.status === '已挂起');
    const abnormalTasks = waybillTasks.filter(task => task.status === '异常');
    
    const currentTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-');
    
    // 规则2和4：如果执行运单中有已关闭的运单任务，业务订单状态就是异常关闭
    if (closedTasks.length > 0) {
      return {
        ...order,
        orderStatus: '异常关闭' as const,
        endTime: order.endTime || currentTime
      };
    }
    
    // 规则1：如果执行运单中所有运单任务状态是已取消，业务订单状态就是已取消
    if (cancelledTasks.length === waybillTasks.length) {
      return {
        ...order,
        orderStatus: '已取消' as const,
        endTime: order.endTime || currentTime
      };
    }
    
    // 规则3：如果执行运单中所有运单任务状态是待执行，业务订单状态就是待执行
    if (pendingTasks.length === waybillTasks.length) {
      return {
        ...order,
        orderStatus: '待执行' as const,
        endTime: undefined // 清除结束时间
      };
    }
    
    // 规则5：如果执行运单中有执行中的运单任务，且没有已取消和已关闭状态的运单任务，业务订单状态就是执行中
    if (executingTasks.length > 0 && cancelledTasks.length === 0 && closedTasks.length === 0) {
      return {
        ...order,
        orderStatus: '执行中' as const,
        endTime: undefined // 清除结束时间
      };
    }
    
    // 如果所有任务都已完成，业务订单状态为已完成
    if (completedTasks.length === waybillTasks.length) {
      return {
        ...order,
        orderStatus: '已完成' as const,
        endTime: order.endTime || currentTime
      };
    }
    
    // 其他情况保持原状态
    return order;
  };

  // 取消运单任务
  const handleCancelWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    confirm({
      title: '确认取消运单任务',
      content: `确定要取消运单任务 "${task.taskName}" 吗？取消后任务将无法执行。`,
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      onOk() {
        setOrders(prev => prev.map(order => {
          if (order.id === businessOrder.id) {
            const updatedWaybillTasks = order.waybillTasks?.map(t => 
              t.id === task.id ? { 
                ...t, 
                status: '已取消' as WaybillTask['status'],
                endTime: new Date().toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }).replace(/\//g, '-')
              } : t
            );
            const updatedOrder = { ...order, waybillTasks: updatedWaybillTasks } as BusinessOrderRecord;
            // 检查并更新业务订单状态
            return checkAndUpdateBusinessOrderStatus(updatedOrder);
          }
          return order;
        }));
        message.success(`运单任务 "${task.taskName}" 已取消`);
      },
    });
  };

  // 诊断业务订单
  const handleDiagnoseBusinessOrder = (record: BusinessOrderRecord) => {
    message.info(`正在诊断业务订单 "${record.orderName}"...`);
    // 这里可以添加实际的诊断逻辑

    
    // 模拟诊断结果
    setTimeout(() => {
      Modal.info({
        title: '业务订单诊断结果',
        content: (
          <div>
            <p><strong>订单名称:</strong> {record.orderName}</p>
            <p><strong>订单状态:</strong> {record.orderStatus}</p>
            <p><strong>当前运单:</strong> {record.currentWaybill}</p>
            <p><strong>执行状态:</strong> {record.executionStatus}</p>
            <p><strong>诊断结果:</strong> 业务订单状态正常，无异常情况</p>
          </div>
        ),
        width: 500,
      });
    }, 1000);
  };

  // 诊断运单任务
  const handleDiagnoseWaybillTask = (task: WaybillTask, businessOrder: BusinessOrderRecord) => {
    message.info(`正在诊断运单任务 "${task.taskName}"...`);
    // 这里可以添加实际的诊断逻辑

    
    // 模拟诊断结果
    setTimeout(() => {
      Modal.info({
        title: '运单任务诊断结果',
        content: (
          <div>
            <p><strong>任务名称:</strong> {task.taskName}</p>
            <p><strong>任务状态:</strong> {task.status}</p>
            <p><strong>执行设备:</strong> {task.executionDevice}</p>
            <p><strong>诊断结果:</strong> 任务执行正常，无异常情况</p>
          </div>
        ),
        width: 500,
      });
    }, 1000);
  };

  // 获取操作按钮
  const getActionButtons = (record: BusinessOrderRecord) => {
    // 检查运单任务状态
    const hasWaybillTasks = record.waybillTasks && record.waybillTasks.length > 0;
    const hasUnexecutedTasks = hasWaybillTasks && record.waybillTasks!.some(task => task.status === '待执行');
    const hasExecutedTasks = hasWaybillTasks && record.waybillTasks!.some(task => ['执行中', '已完成', '已取消', '异常'].includes(task.status));

    // 根据状态确定可用的操作
    const getAvailableActions = (status: string) => {
      // 删除按钮显示条件：
      // 1. 待分配状态的订单
      // 2. 有运单任务但未执行的订单（有未执行任务且无已执行任务）
      const canDelete = status === '待分配' || (hasUnexecutedTasks && !hasExecutedTasks);
      
      if (status === '待分配') {
        return ['diagnose', 'cancel'];
      }
      
      if (canDelete) {
        return ['cancel'];
      }
      
      return [];
    };

    const availableActions = getAvailableActions(record.orderStatus);

    if (isMobile) {
      const allItems = [
        {
          key: 'diagnose',
          label: '诊断',
          icon: <EyeOutlined />,
          onClick: () => handleDiagnoseBusinessOrder(record),
        },
        {
          key: 'cancel',
          label: '取消',
          icon: <StopOutlined />,
          onClick: () => handleCancel(record),
        },
      ];

      const items = allItems.filter(item => availableActions.includes(item.key));

      if (items.length === 0) {
        return <span style={{ color: '#999' }}>无可用操作</span>;
      }

      return (
        <Dropdown
          menu={{
            items: items.map(item => ({
              key: item.key,
              label: item.label,
              icon: item.icon,
              onClick: item.onClick,
            })),
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            style={{ padding: '0 4px' }}
          />
        </Dropdown>
      );
    }

    const actionButtons = [];

    if (availableActions.includes('diagnose')) {
      actionButtons.push(
        <Tooltip key="diagnose" title="诊断订单">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleDiagnoseBusinessOrder(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            诊断
          </Button>
        </Tooltip>
      );
    }

    if (availableActions.includes('cancel')) {
      actionButtons.push(
        <Tooltip key="cancel" title="取消订单">
          <Button
            type="link"
            danger
            icon={<StopOutlined />}
            onClick={() => handleCancel(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            取消
          </Button>
        </Tooltip>
      );
    }

    // 按钮分组：每行最多显示2个按钮
    const buttonGroups = [];
    for (let i = 0; i < actionButtons.length; i += 2) {
      buttonGroups.push(actionButtons.slice(i, i + 2));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        {buttonGroups.map((group, index) => (
          <Space key={index} size={8}>
            {group}
          </Space>
        ))}
      </div>
    );
  };

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth * 0.8;
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 桌面端表格列配置
  const desktopColumns: ColumnsType<BusinessOrderRecord> = [
    {
      title: '订单名称',
      dataIndex: 'orderName',
      key: 'orderName',
      width: getColumnWidth(150),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ color: '#000000' }}>
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '执行运单',
      dataIndex: 'waybillTasks',
      key: 'waybillTasks',
      width: getColumnWidth(350),
      align: 'left',
      render: (waybillTasks: WaybillTask[], record: BusinessOrderRecord) => {
        if (!waybillTasks || waybillTasks.length === 0) {
          return <span style={{ color: '#999' }}>暂无运单任务</span>;
        }
        
        // 获取运单任务可用操作（与调度管理保持一致）
        const getWaybillTaskAvailableActions = (status: string) => {
          switch (status) {
            case '待执行':
              return ['cancel']; // 待执行状态只显示取消按钮，不显示关闭按钮
            case '执行中':
              return ['pause', 'cancel', 'close'];
            case '已暂停':
              return ['resume', 'cancel', 'close'];
            case '已挂起':
              return ['continue', 'diagnose', 'cancel', 'close'];
            case '异常':
              return ['diagnose', 'close'];
            case '已取消':
            case '已完成':
              return [];
            case '已关闭':
              return ['diagnose'];
            default:
              return [];
          }
        };

        const getWaybillTaskActions = (task: WaybillTask) => {
          const availableActions = getWaybillTaskAvailableActions(task.status);
          const actions = [];
          
          // 根据可用操作生成按钮
          if (availableActions.includes('pause')) {
            actions.push(
              <Button
                key="pause"
                type="link"
                size="small"
                style={{ padding: '0 4px', color: '#faad14' }}
                onClick={() => handlePauseWaybillTask(task, record)}
              >
                暂停
              </Button>
            );
          }
          
          if (availableActions.includes('resume')) {
            actions.push(
              <Button
                key="resume"
                type="link"
                size="small"
                style={{ padding: '0 4px', color: '#52c41a' }}
                onClick={() => handleResumeWaybillTask(task, record)}
              >
                恢复
              </Button>
            );
          }
          
          if (availableActions.includes('continue')) {
            actions.push(
              <Button
                key="continue"
                type="link"
                size="small"
                style={{ padding: '0 4px', color: '#52c41a' }}
                onClick={() => handleResumeWaybillTask(task, record)}
              >
                继续
              </Button>
            );
          }
          
          if (availableActions.includes('diagnose')) {
            actions.push(
              <Button
                key="diagnose"
                type="link"
                size="small"
                style={{ padding: '0 4px', color: '#1890ff' }}
                onClick={() => handleDiagnoseWaybillTask(task, record)}
              >
                诊断
              </Button>
            );
          }
          
          if (availableActions.includes('cancel')) {
            actions.push(
              <Button
                key="cancel"
                type="link"
                size="small"
                style={{ padding: '0 4px', color: '#ff4d4f' }}
                onClick={() => handleCancelWaybillTask(task, record)}
              >
                取消
              </Button>
            );
          }
          
          if (availableActions.includes('close')) {
            actions.push(
              <Button
                key="close"
                type="link"
                size="small"
                style={{ padding: '0 4px', color: '#ff4d4f' }}
                onClick={() => handleCloseWaybillTask(task, record)}
              >
                关闭
              </Button>
            );
          }
          
          return actions;
        };
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {waybillTasks.map((task, index) => (
              <div key={task.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                flexWrap: 'wrap',
                padding: '4px 8px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto', color: '#1890ff', fontWeight: 500 }}
                    onClick={() => handleWaybillTaskDetail(task, record)}
                  >
                    {task.taskName}
                  </Button>
                  <Tag 
                    size="small" 
                    color={
                      task.status === '已完成' ? 'success' :
                      task.status === '执行中' ? 'processing' :
                      task.status === '待执行' ? 'default' :
                      task.status === '已挂起' ? 'orange' :
                      task.status === '已关闭' ? 'volcano' :
                      task.status === '异常' ? 'error' : 'warning'
                    }
                  >
                    {task.status}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {getWaybillTaskActions(task)}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },

    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: getColumnWidth(100),
      align: 'left',
      ellipsis: true,
      render: (status: string) => (
        <Tooltip title={status}>
          <Tag color={getStatusColor(status)} size="small">
            {status}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: BusinessOrderRecord, b: BusinessOrderRecord) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
      render: (time: string) => {
        const date = new Date(time);
        const dateStr = date.toLocaleDateString('zh-CN');
        const timeStr = date.toLocaleTimeString('zh-CN', { hour12: false });
        return (
          <Tooltip title={time}>
            <div style={{ lineHeight: '1.2' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{dateStr}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{timeStr}</div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: BusinessOrderRecord, b: BusinessOrderRecord) => new Date(a.endTime || '').getTime() - new Date(b.endTime || '').getTime(),
      render: (time: string) => {
        if (!time) return '-';
        const date = new Date(time);
        const dateStr = date.toLocaleDateString('zh-CN');
        const timeStr = date.toLocaleTimeString('zh-CN', { hour12: false });
        return (
          <Tooltip title={time}>
            <div style={{ lineHeight: '1.2' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{dateStr}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{timeStr}</div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: getColumnWidth(100),
      align: 'left',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(140),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: BusinessOrderRecord) => getActionButtons(record),
    },
  ];

  // 移动端列配置
  const mobileColumns: ColumnsType<BusinessOrderRecord> = [
    {
      title: '订单信息',
      key: 'orderInfo',
      render: (_: any, record: BusinessOrderRecord) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#000000' }}>
            {record.orderName}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
            当前运单: {record.currentWaybill}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
            更新人: {record.updatedBy}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
            创建时间: {new Date(record.createTime).toLocaleString('zh-CN')}
          </div>
          <Space size={4}>
            <Tag color={getExecutionStatusColor(record.executionStatus)} size="small">
              {record.executionStatus}
            </Tag>
            <Tag color={getStatusColor(record.orderStatus)} size="small">
              {record.orderStatus}
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'right',
      render: (_: any, record: BusinessOrderRecord) => getActionButtons(record),
    },
  ];

  // 获取表格配置
  const getTableConfig = () => {
    const scrollWidth = isMobile ? 'max-content' : isLargeScreen ? 1400 : 1200;
    return {
      columns: isMobile ? mobileColumns : desktopColumns,
      scroll: { x: scrollWidth },
      size: isMobile ? 'small' : 'middle' as const
    };
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'all',
              label: `今日全部订单（${orderCounts.all}）`,
            },
            {
              key: 'unassigned',
              label: `今日待分配（${orderCounts.unassigned}）`,
            },
            {
              key: 'pending',
              label: `今日待执行（${orderCounts.pending}）`,
            },
            {
              key: 'executing',
              label: `今日执行中（${orderCounts.executing}）`,
            },
            {
              key: 'abnormal',
              label: `今日异常关闭（${orderCounts.abnormal}）`,
            },
            {
              key: 'completed',
              label: `今日已完成（${orderCounts.completed}）`,
            },
            {
              key: 'cancelled',
              label: `今日已取消（${orderCounts.cancelled}）`,
            },
          ]}
        />
        
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={8} lg={6} xl={isLargeScreenState ? 8 : 6} xxl={8}>
            <Input
              placeholder="搜索订单名称、运单、更新人..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={8} sm={8} md={4} lg={3} xl={isLargeScreenState ? 3 : 3} xxl={3}>
            <Select
              placeholder="订单状态"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              <Option value="待执行">待执行</Option>
              <Option value="执行中">执行中</Option>
              <Option value="异常关闭">异常关闭</Option>
              <Option value="已完成">已完成</Option>
              <Option value="已取消">已取消</Option>
            </Select>
          </Col>
          <Col xs={8} sm={8} md={4} lg={3} xl={isLargeScreenState ? 3 : 3} xxl={3}>
            <Select
              placeholder="执行状态"
              value={executionStatusFilter || undefined}
              onChange={setExecutionStatusFilter}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              <Option value="移动">移动</Option>
              <Option value="n1">n1</Option>
              <Option value="呼梯">呼梯</Option>
              <Option value="乘梯">乘梯</Option>
              <Option value="关梯">关梯</Option>
              <Option value="上下料">上下料</Option>
            </Select>
          </Col>
          <Col xs={8} sm={8} md={8} lg={12} xl={isLargeScreenState ? 10 : 12} xxl={8}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '' : '刷新'}
            </Button>
          </Col>
        </Row>
        
        <Table
          {...getTableConfig()}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredOrders.length,
            pageSize: isMobile ? 5 : isLargeScreenState ? 15 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile ? undefined : (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
            showLessItems: !isLargeScreenState,
            pageSizeOptions: isLargeScreenState ? ['10', '15', '20', '50'] : ['10', '20', '50'],
          }}
        />
      </Card>
      

      
      {/* 运单任务详情 */}
      <WaybillTaskDetail
        visible={waybillTaskDetailVisible}
        onClose={() => {
          setWaybillTaskDetailVisible(false);
          setSelectedWaybillTask(null);
        }}
        taskData={selectedWaybillTask}
      />
      
      {/* 运单详情（与调度管理页面相同） */}
      <TaskDetail
        visible={taskDetailVisible}
        onClose={handleTaskDetailClose}
        taskData={selectedTaskForDetail}
      />
    </div>
  );
};

export default BusinessOrders;