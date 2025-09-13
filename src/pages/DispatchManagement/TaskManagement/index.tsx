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
  PauseOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '@/hooks/useResponsive';
import TaskDetail from './TaskDetail';

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

// 任务数据类型
interface TaskRecord {
  id: string;
  taskName: string;
  taskType: '工作任务' | '停靠任务' | '充电任务';
  executionDevice: string;
  targetDevice: string;
  status: '执行中' | '已暂停' | '已挂起' | '已取消' | '已完成' | '已关闭';
  endTime?: string;
  createTime: string;
  relatedBusinessOrder?: string; // 关联业务订单
}

const TaskManagement: React.FC = () => {
  const { isMobile, isLargeScreen } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  
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
  
  // 模拟任务数据
  const [tasks, setTasks] = useState<TaskRecord[]>([
    {
      id: '1',
      taskName: '货物运输任务001',
      taskType: '工作任务',
      executionDevice: 'AGV-001',
      targetDevice: '工作站A',
      status: '执行中',
      createTime: '2024-01-15 09:30:00',
      relatedBusinessOrder: 'AOV-001',
    },
    {
      id: '2',
      taskName: '原料配送任务002',
      taskType: '工作任务',
      executionDevice: 'AGV-002',
      targetDevice: '生产线B',
      status: '已暂停',
      createTime: '2024-01-15 10:15:00',
      relatedBusinessOrder: 'AOV-002',
    },
    {
      id: '3',
      taskName: '成品回收任务003',
      taskType: '工作任务',
      executionDevice: 'AGV-003',
      targetDevice: '仓库C',
      status: '已挂起',
      createTime: '2024-01-15 11:00:00',
      relatedBusinessOrder: 'AOV-003',
    },
    {
      id: '4',
      taskName: '设备维护任务004',
      taskType: '停靠任务',
      executionDevice: 'AGV-004',
      targetDevice: '维修区',
      status: '已完成',
      endTime: '2024-01-15 14:30:00',
      createTime: '2024-01-15 13:00:00',
      relatedBusinessOrder: 'AOV-004',
    },
    {
      id: '5',
      taskName: '紧急运输任务005',
      taskType: '充电任务',
      executionDevice: 'AGV-005',
      targetDevice: '应急区',
      status: '已取消',
      endTime: '2024-01-15 15:00:00',
      createTime: '2024-01-15 14:45:00',
      relatedBusinessOrder: 'AOV-005',
    },
    {
      id: '6',
      taskName: '库存盘点任务006',
      taskType: '工作任务',
      executionDevice: 'AGV-006',
      targetDevice: '仓库A',
      status: '已关闭',
      endTime: '2024-01-14 18:30:00',
      createTime: '2024-01-14 16:00:00',
      relatedBusinessOrder: 'AOV-006',
    },
    {
      id: '7',
      taskName: '设备校准任务007',
      taskType: '停靠任务',
      executionDevice: 'AGV-007',
      targetDevice: '校准区',
      status: '已关闭',
      endTime: '2024-01-14 17:45:00',
      createTime: '2024-01-14 15:30:00',
      relatedBusinessOrder: 'AOV-007',
    },
    {
      id: '8',
      taskName: '充电维护任务008',
      taskType: '充电任务',
      executionDevice: 'AGV-008',
      targetDevice: '充电桩C',
      status: '已关闭',
      endTime: '2024-01-14 16:20:00',
      createTime: '2024-01-14 14:00:00',
      relatedBusinessOrder: 'AOV-008',
    },
    {
      id: '9',
      taskName: '安全检查任务009',
      taskType: '工作任务',
      executionDevice: 'AGV-009',
      targetDevice: '检查区',
      status: '已关闭',
      endTime: '2024-01-14 19:15:00',
      createTime: '2024-01-14 17:00:00',
      relatedBusinessOrder: 'AOV-009',
    },
    {
      id: '10',
      taskName: '系统维护任务010',
      taskType: '停靠任务',
      executionDevice: 'AGV-010',
      targetDevice: '维护区',
      status: '已关闭',
      endTime: '2024-01-14 20:00:00',
      createTime: '2024-01-14 18:30:00',
      relatedBusinessOrder: 'AOV-010',
    },
    {
      id: '11',
      taskName: '物料清理任务011',
      taskType: '工作任务',
      executionDevice: 'AGV-011',
      targetDevice: '清理区',
      status: '已关闭',
      endTime: '2024-01-13 22:30:00',
      createTime: '2024-01-13 20:00:00',
      relatedBusinessOrder: 'AOV-011',
    },
    {
      id: '12',
      taskName: '设备停靠任务012',
      taskType: '停靠任务',
      executionDevice: 'AGV-012',
      targetDevice: '停靠区B',
      status: '已关闭',
      endTime: '2024-01-13 21:45:00',
      createTime: '2024-01-13 19:30:00',
      relatedBusinessOrder: 'AOV-012',
    },
    {
      id: '13',
      taskName: '夜间充电任务013',
      taskType: '充电任务',
      executionDevice: 'AGV-013',
      targetDevice: '充电桩D',
      status: '已关闭',
      endTime: '2024-01-13 23:00:00',
      createTime: '2024-01-13 21:00:00',
      relatedBusinessOrder: 'AOV-013',
    },
  ]);

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      '执行中': 'processing',
      '已暂停': 'warning',
      '已挂起': 'error',
      '已取消': 'default',
      '已完成': 'success',
      '已关闭': 'default',
    };
    return colorMap[status] || 'default';
  };

  // 操作按钮处理函数
  const handlePause = (record: TaskRecord) => {
    confirm({
      title: '确认暂停',
      icon: <ExclamationCircleOutlined />,
      content: `确定要暂停运单任务"${record.taskName}"吗？`,
      onOk() {
        setTasks(prev => prev.map(task => 
          task.id === record.id ? { ...task, status: '已暂停' } : task
        ));
        message.success('任务已暂停');
      },
    });
  };

  const handleResume = (record: TaskRecord) => {
    confirm({
      title: '确认恢复',
      icon: <ExclamationCircleOutlined />,
      content: `确定要恢复运单任务"${record.taskName}"吗？`,
      onOk() {
        setTasks(prev => prev.map(task => 
          task.id === record.id ? { ...task, status: '执行中' } : task
        ));
        message.success('任务已恢复');
      },
    });
  };

  const handleCancel = (record: TaskRecord) => {
    confirm({
      title: '确认取消',
      icon: <ExclamationCircleOutlined />,
      content: `确定要取消运单任务"${record.taskName}"吗？此操作不可撤销。`,
      onOk() {
        setTasks(prev => prev.map(task => 
          task.id === record.id ? { 
            ...task, 
            status: '已取消',
            endTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).replace(/\//g, '-')
          } : task
        ));
        message.success('任务已取消');
      },
    });
  };

  const handleContinue = (record: TaskRecord) => {
    confirm({
      title: '确认继续',
      icon: <ExclamationCircleOutlined />,
      content: `确定要继续执行运单任务"${record.taskName}"吗？`,
      onOk() {
        setTasks(prev => prev.map(task => 
          task.id === record.id ? { ...task, status: '执行中' } : task
        ));
        message.success('任务已继续执行');
      },
    });
  };

  const handleDiagnose = (record: TaskRecord) => {
    message.info(`正在诊断运单任务"${record.taskName}"...`);
    // 这里可以添加诊断逻辑
  };

  const handleDetail = (record: TaskRecord) => {
    setSelectedTask(record);
    setDetailVisible(true);
  };

  const handleDetailClose = () => {
    setDetailVisible(false);
    setSelectedTask(null);
  };

  // 获取操作按钮
  const getActionButtons = (record: TaskRecord) => {
    // 根据状态确定可用的操作
    const getAvailableActions = (status: string) => {
      switch (status) {
        case '执行中':
          return ['pause', 'cancel'];
        case '已暂停':
          return ['resume', 'cancel'];
        case '已挂起':
          return ['continue', 'diagnose', 'cancel'];
        case '已取消':
        case '已完成':
          return [];
        case '已关闭':
          return ['diagnose'];
        default:
          return [];
      }
    };

    const availableActions = getAvailableActions(record.status);

    if (isMobile) {
      const allItems = [
        {
          key: 'detail',
          label: '详情',
          icon: <EyeOutlined />,
          onClick: () => handleDetail(record),
        },
        {
          key: 'pause',
          label: '暂停',
          icon: <PauseOutlined />,
          onClick: () => handlePause(record),
        },
        {
          key: 'resume',
          label: '恢复',
          icon: <PlayCircleOutlined />,
          onClick: () => handleResume(record),
        },
        {
          key: 'continue',
          label: '继续',
          icon: <PlayCircleOutlined />,
          onClick: () => handleContinue(record),
        },
        {
          key: 'diagnose',
          label: '诊断',
          icon: <ToolOutlined />,
          onClick: () => handleDiagnose(record),
        },
        {
          key: 'cancel',
          label: '取消',
          icon: <StopOutlined />,
          onClick: () => handleCancel(record),
        },
      ];

      const items = allItems.filter(item => item.key === 'detail' || availableActions.includes(item.key));

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

    // 详情按钮始终显示
    actionButtons.push(
      <Tooltip key="detail" title="查看详情">
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleDetail(record)}
          size="small"
          style={{ padding: '0 4px' }}
        >
          详情
        </Button>
      </Tooltip>
    );

    if (availableActions.includes('pause')) {
      actionButtons.push(
        <Tooltip key="pause" title="暂停任务">
          <Button
            type="link"
            icon={<PauseOutlined />}
            onClick={() => handlePause(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            暂停
          </Button>
        </Tooltip>
      );
    }

    if (availableActions.includes('resume')) {
      actionButtons.push(
        <Tooltip key="resume" title="恢复任务">
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleResume(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            恢复
          </Button>
        </Tooltip>
      );
    }

    if (availableActions.includes('continue')) {
      actionButtons.push(
        <Tooltip key="continue" title="继续任务">
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleContinue(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            继续
          </Button>
        </Tooltip>
      );
    }

    if (availableActions.includes('diagnose')) {
      actionButtons.push(
        <Tooltip key="diagnose" title="诊断任务">
          <Button
            type="link"
            icon={<ToolOutlined />}
            onClick={() => handleDiagnose(record)}
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
        <Tooltip key="cancel" title="取消任务">
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

    // 由于详情按钮始终存在，actionButtons.length 不会为0，移除此判断

    // 按钮分组：每行最多显示2个按钮
    const buttonGroups = [];
    for (let i = 0; i < actionButtons.length; i += 2) {
      buttonGroups.push(actionButtons.slice(i, i + 2));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
  const desktopColumns: ColumnsType<TaskRecord> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: getColumnWidth(150),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: TaskRecord) => (
        <Tooltip title={text}>
          <span 
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => handleDetail(record)}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: getColumnWidth(100),
      align: 'left',
      render: (taskType: string) => {
        const typeColorMap: Record<string, string> = {
          '工作任务': 'blue',
          '停靠任务': 'orange',
          '充电任务': 'green',
        };
        return (
          <Tag color={typeColorMap[taskType] || 'default'}>
            {taskType}
          </Tag>
        );
      },
    },
    {
      title: '执行设备',
      dataIndex: 'executionDevice',
      key: 'executionDevice',
      width: getColumnWidth(120),
      align: 'left',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '目标设备',
      dataIndex: 'targetDevice',
      key: 'targetDevice',
      width: getColumnWidth(120),
      align: 'left',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      key: 'status',
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
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: TaskRecord, b: TaskRecord) => new Date(a.endTime || '').getTime() - new Date(b.endTime || '').getTime(),
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: TaskRecord, b: TaskRecord) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
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
      title: '操作',
      key: 'action',
      width: getColumnWidth(110),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: TaskRecord) => getActionButtons(record),
    },
  ];

  // 移动端列配置
  const mobileColumns: ColumnsType<TaskRecord> = [
    {
      title: '运单信息',
      key: 'taskInfo',
      render: (_: any, record: TaskRecord) => (
        <div>
          <div 
            style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff', cursor: 'pointer' }}
            onClick={() => handleDetail(record)}
          >
            {record.taskName}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
            执行设备: {record.executionDevice}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
            目标设备: {record.targetDevice}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
            创建时间: {new Date(record.createTime).toLocaleString('zh-CN')}
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag color={getStatusColor(record.status)} size="small">
              {record.status}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_: any, record: TaskRecord) => getActionButtons(record),
    },
  ];

  // 过滤数据
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchText || 
      task.taskName.toLowerCase().includes(searchText.toLowerCase()) ||
      task.executionDevice.toLowerCase().includes(searchText.toLowerCase()) ||
      task.targetDevice.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    
    const matchesTaskType = !taskTypeFilter || task.taskType === taskTypeFilter;
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'work' && task.taskType === '工作任务') ||
      (activeTab === 'dock' && task.taskType === '停靠任务') ||
      (activeTab === 'charge' && task.taskType === '充电任务');
    
    return matchesSearch && matchesStatus && matchesTaskType && matchesTab;
  });

  // 计算各类型任务数量
  const taskCounts = {
    all: tasks.length,
    work: tasks.filter(task => task.taskType === '工作任务').length,
    dock: tasks.filter(task => task.taskType === '停靠任务').length,
    charge: tasks.filter(task => task.taskType === '充电任务').length,
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  // 根据Tab动态过滤列
  const getFilteredColumns = (columns: ColumnsType<TaskRecord>) => {
    // 在特定Tab页面隐藏任务类型字段
    if (activeTab === 'work' || activeTab === 'dock' || activeTab === 'charge') {
      return columns.filter((column: any) => column.key !== 'taskType');
    }
    return columns;
  };

  // 获取表格配置
  const getTableConfig = () => {
    if (isMobile) {
      return {
        columns: getFilteredColumns(mobileColumns),
        scroll: { x: 400 },
        size: 'small' as const,
      };
    }
    
    return {
      columns: getFilteredColumns(desktopColumns),
      scroll: { x: 1000, y: 600 },
      size: 'middle' as const,
    };
  };

  const tableConfig = getTableConfig();

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* Tab切换区域 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: `全部任务（${taskCounts.all}）`,
            },
            {
              key: 'work',
              label: `工作任务（${taskCounts.work}）`,
            },
            {
              key: 'dock',
              label: `停靠任务（${taskCounts.dock}）`,
            },
            {
              key: 'charge',
              label: `充电任务（${taskCounts.charge}）`,
            },
          ]}
        />
        
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={8} lg={6} xl={isLargeScreenState ? 8 : 6} xxl={8}>
            <Input
              placeholder="搜索任务名称、设备..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={8} sm={8} md={4} lg={3} xl={isLargeScreenState ? 3 : 3} xxl={3}>
            <Select
              placeholder="任务状态"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              <Option value="执行中">执行中</Option>
              <Option value="已暂停">已暂停</Option>
              <Option value="已挂起">已挂起</Option>
              <Option value="已取消">已取消</Option>
              <Option value="已完成">已完成</Option>
              <Option value="已关闭">已关闭</Option>
            </Select>
          </Col>
          <Col xs={8} sm={8} md={4} lg={3} xl={isLargeScreenState ? 3 : 3} xxl={3}>
            <Select
              placeholder="任务类型"
              value={taskTypeFilter || undefined}
              onChange={setTaskTypeFilter}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              <Option value="工作任务">工作任务</Option>
              <Option value="停靠任务">停靠任务</Option>
              <Option value="充电任务">充电任务</Option>
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
          dataSource={filteredTasks}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredTasks.length,
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
      <TaskDetail
        visible={detailVisible}
        onClose={handleDetailClose}
        taskData={selectedTask}
      />
    </div>
  );
};

export default TaskManagement;