import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Modal,
  Form,
  message,
  Tooltip,
  Switch,
  Drawer,
  InputNumber,
  Select,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useResponsive } from '@/hooks/useResponsive';

const { confirm } = Modal;

// 空闲停靠规则接口
interface IdleDockingRule {
  id: string;
  name: string;
  isEnabled: boolean;
  updateTime: string;
  updatedBy: string;
  taskGenerationRule: number; // 停靠任务生成规则（毫秒）
  selectedRobots: string[]; // 选择的机器人ID列表
}

const IdleDockingManagement: React.FC = () => {
  const { isMobile, isLargeScreen } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<IdleDockingRule | null>(null);
  const [form] = Form.useForm();

  // 模拟机器人数据
  const robotOptions = [
    { label: '潜伏顶升车-001', value: 'robot-001' },
    { label: '潜伏顶升车-002', value: 'robot-002' },
    { label: '叉车-003', value: 'robot-003' },
    { label: 'AGV-004', value: 'robot-004' },
    { label: 'AGV-005', value: 'robot-005' },
    { label: '搬运机器人-006', value: 'robot-006' },
  ];

  // 模拟数据
  const [rules, setRules] = useState<IdleDockingRule[]>([
    {
      id: '1',
      name: '空闲停靠',
      isEnabled: false,
      updateTime: '2024-01-16 10:00:00',
      updatedBy: '系统',
      taskGenerationRule: 3000,
      selectedRobots: ['robot-001', 'robot-002', 'robot-003', 'robot-004', 'robot-005', 'robot-006'],
    },
    {
      id: '2',
      name: '潜伏顶升车停靠规则',
      isEnabled: true,
      updateTime: '2024-01-15 14:30:25',
      updatedBy: '管理员',
      taskGenerationRule: 5000,
      selectedRobots: ['robot-001', 'robot-002'],
    },
    {
      id: '3',
      name: '叉车停靠规则',
      isEnabled: false,
      updateTime: '2024-01-14 09:15:10',
      updatedBy: '操作员',
      taskGenerationRule: 3000,
      selectedRobots: ['robot-003'],
    },
    {
      id: '4',
      name: 'AGV停靠规则',
      isEnabled: true,
      updateTime: '2024-01-13 16:45:30',
      updatedBy: '系统管理员',
      taskGenerationRule: 8000,
      selectedRobots: ['robot-001', 'robot-004', 'robot-005'],
    },
  ]);

  // 动态列宽计算
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth * 0.8;
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 过滤数据
  const filteredRules = rules.filter(rule =>
    !searchText || rule.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 处理启用/禁用
  const handleToggleEnabled = (record: IdleDockingRule) => {
    setRules(prevRules =>
      prevRules.map(rule =>
        rule.id === record.id
          ? {
              ...rule,
              isEnabled: !rule.isEnabled,
              updateTime: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(/\//g, '-'),
              updatedBy: '当前用户'
            }
          : rule
      )
    );
    message.success(`规则已${record.isEnabled ? '禁用' : '启用'}`);
  };

  // 处理编辑
  const handleEdit = (record: IdleDockingRule) => {
    setEditingRule(record);
    form.setFieldsValue({
      name: record.name,
      isEnabled: record.isEnabled,
      taskGenerationRule: record.taskGenerationRule,
      selectedRobots: record.id === '1' ? ['all'] : record.selectedRobots,
    });
    setIsDrawerVisible(true);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setIsDrawerVisible(true);
  };

  // 处理删除
  const handleDelete = (record: IdleDockingRule) => {
    // 内置空闲规则不允许删除
    if (record.id === '1') {
      message.warning('内置规则不支持删除');
      return;
    }
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除规则"${record.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        setRules(prevRules => prevRules.filter(rule => rule.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  // 处理模态框确定
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      setTimeout(() => {
        const currentTime = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-');

        if (editingRule) {
          // 编辑
          setRules(prevRules =>
            prevRules.map(rule =>
              rule.id === editingRule.id
                ? {
                    ...rule,
                    name: values.name,
                    isEnabled: values.isEnabled,
                    taskGenerationRule: values.taskGenerationRule,
                    selectedRobots: editingRule.id === '1' ? ['robot-001', 'robot-002', 'robot-003', 'robot-004', 'robot-005', 'robot-006'] : values.selectedRobots,
                    updateTime: currentTime,
                    updatedBy: '当前用户'
                  }
                : rule
            )
          );
          message.success('规则更新成功');
        } else {
          // 新增
          const newRule: IdleDockingRule = {
            id: Date.now().toString(),
            name: values.name,
            isEnabled: values.isEnabled || false,
            updateTime: currentTime,
            updatedBy: '当前用户',
            taskGenerationRule: values.taskGenerationRule || 5000,
            selectedRobots: values.selectedRobots || [],
          };
          setRules(prevRules => [newRule, ...prevRules]);
          message.success('规则创建成功');
        }
        
        setLoading(false);
        setIsDrawerVisible(false);
        setEditingRule(null);
        form.resetFields();
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  // 移动端列配置
  const mobileColumns: ColumnsType<IdleDockingRule> = [
    {
      title: '规则信息',
      key: 'ruleInfo',
      fixed: 'left',
      render: (_: any, record: IdleDockingRule) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px'
              }}
              onClick={() => handleEdit(record)}
            >
              {record.name}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span>空闲规则: {record.taskGenerationRule} ms | 机器人: {record.id === '1' ? '全部机器人' : `${record.selectedRobots?.length || 0}台`}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span>状态: </span>
            <Switch
              size="small"
              checked={record.isEnabled}
              onChange={() => handleToggleEnabled(record)}
            />
            <span style={{ marginLeft: 8 }}>
              {record.isEnabled ? '启用' : '禁用'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>{record.updateTime} | {record.updatedBy}</span>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      fixed: 'right',
      render: (_: any, record: IdleDockingRule) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              style={{ padding: '0 4px' }}
            >
              编辑
            </Button>
          </Tooltip>
          {record.id !== '1' && (
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                size="small"
                style={{ padding: '0 4px' }}
              >
                删除
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<IdleDockingRule> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(150),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: IdleDockingRule) => (
        <Tooltip title={text}>
          <span 
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => handleEdit(record)}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '空闲规则',
      dataIndex: 'taskGenerationRule',
      key: 'taskGenerationRule',
      width: getColumnWidth(100),
      align: 'left',
      render: (value: number) => (
        <span>{value} ms</span>
      ),
    },
    {
      title: '作用机器人',
      dataIndex: 'selectedRobots',
      key: 'selectedRobots',
      width: getColumnWidth(150),
      align: 'left',
      render: (robots: string[], record: IdleDockingRule) => {
        if (!robots || robots.length === 0) {
          return <span style={{ color: '#999' }}>未选择</span>;
        }
        
        // 内置规则显示"全部机器人"
        if (record.id === '1') {
          return (
            <span>
              全部机器人
              <span style={{ color: '#1890ff', marginLeft: '4px' }}>({robots.length}台)</span>
            </span>
          );
        }
        
        const displayCount = 2;
        const displayRobots = robots.slice(0, displayCount);
        const hasMore = robots.length > displayCount;
        
        return (
          <Tooltip 
            title={
              <div>
                <div style={{ marginBottom: '4px' }}>共 {robots.length} 台机器人:</div>
                {robots.map((robot, index) => (
                  <div key={index}>{robot}</div>
                ))}
              </div>
            }
          >
            <span>
              {displayRobots.join(', ')}
              {hasMore && '...'}
              <span style={{ color: '#1890ff', marginLeft: '4px' }}>({robots.length}台)</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '是否启用',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: getColumnWidth(100),
      align: 'left',
      render: (isEnabled: boolean, record: IdleDockingRule) => (
        <Switch
          checked={isEnabled}
          onChange={() => handleToggleEnabled(record)}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(140),
      align: 'left',
      sorter: (a: IdleDockingRule, b: IdleDockingRule) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
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
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: getColumnWidth(100),
      align: 'left',
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(150),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: IdleDockingRule) => (
        <Space size={8}>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              style={{ padding: '0 4px' }}
            >
              编辑
            </Button>
          </Tooltip>
          {record.id !== '1' && (
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                size="small"
                style={{ padding: '0 4px' }}
              >
                删除
              </Button>
            </Tooltip>
          )}
         </Space>
       ),
     },
  ];

  // 获取表格配置
  const getTableConfig = () => {
    if (isMobile) {
      return {
        columns: mobileColumns,
        scroll: { x: 400 },
        size: 'small' as const,
      };
    }
    
    return {
      columns: desktopColumns,
      scroll: { x: 800, y: 600 },
      size: 'middle' as const,
    };
  };

  const tableConfig = getTableConfig();

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 搜索和操作区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={10} lg={8} xl={isLargeScreen ? 10 : 8} xxl={12}>
            <Input
              placeholder="请输入规则名称搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={6} sm={6} md={3} lg={4} xl={isLargeScreen ? 3 : 4} xxl={3}>
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
          <Col xs={18} sm={18} md={11} lg={12} xl={isLargeScreen ? 11 : 12} xxl={9}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增规则'}
            </Button>
          </Col>
        </Row>
        
        <Table
          columns={tableConfig.columns}
          dataSource={filteredRules}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredRules.length,
            pageSize: isMobile ? 5 : isLargeScreen ? 15 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile ? undefined : (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
            showLessItems: !isLargeScreen,
            pageSizeOptions: isLargeScreen ? ['10', '15', '20', '50'] : ['10', '20', '50'],
          }}
          scroll={tableConfig.scroll}
          size={tableConfig.size}
        />
      </Card>

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={editingRule ? '编辑规则' : '新增规则'}
        open={isDrawerVisible}
        onClose={() => {
          setIsDrawerVisible(false);
          setEditingRule(null);
          form.resetFields();
        }}
        width={isMobile ? '90vw' : '66.67vw'}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={() => {
                setIsDrawerVisible(false);
                setEditingRule(null);
                form.resetFields();
              }}>取消</Button>
              <Button type="primary" loading={loading} onClick={handleModalOk}>确定</Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="规则名称"
            name="name"
            rules={[
              { required: true, message: '请输入规则名称' },
              { max: 50, message: '规则名称最多50个字符' },
            ]}
          >
            <Input placeholder="请输入规则名称" maxLength={50} />
          </Form.Item>
          
          <Form.Item
            label="停靠任务生成规则"
            name="taskGenerationRule"
            rules={[
              { required: true, message: '请输入停靠任务生成规则' },
              { type: 'number', min: 1000, message: '最小值为1000毫秒' },
            ]}
            extra="单位：毫秒（ms），表示多少毫秒没有任务时生成停靠任务"
          >
            <InputNumber
                placeholder="请输入毫秒数"
                min={1000}
                max={60000}
                step={1000}
                style={{ width: '100%' }}
                addonAfter="ms"
              />
          </Form.Item>
          
          <Form.Item
            label="选择机器人"
            name="selectedRobots"
            rules={[
              { required: true, message: '请至少选择一个机器人' },
            ]}
            extra={editingRule?.id === '1' ? '内置规则默认应用于全部机器人' : '支持多选，选择需要应用此停靠规则的机器人'}
          >
            {editingRule?.id === '1' ? (
              <Select
                mode="multiple"
                placeholder="全部机器人"
                value={['all']}
                disabled
                options={[{ label: '全部机器人', value: 'all' }]}
              />
            ) : (
              <Select
                mode="multiple"
                placeholder="请选择机器人"
                options={robotOptions}
                showSearch
                filterOption={(input: string, option: any) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
            )}
          </Form.Item>
          
          <Form.Item
            label="是否启用"
            name="isEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default IdleDockingManagement;