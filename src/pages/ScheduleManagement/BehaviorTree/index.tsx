import React, { useState } from 'react';
import AddBehaviorTree from './AddBehaviorTree';
import { 
  behaviorTreeData, 
  type BehaviorTreeRecord,
  addBehaviorTree,
  updateBehaviorTree,
  deleteBehaviorTree
} from '../../../data/behaviorTreeData';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Dropdown,
  Tag,
  Modal,
  Form,
  message,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { isDev } from '@/lib/utils';

const { Option } = Select;
const { confirm } = Modal;

const BehaviorTree: React.FC = () => {

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BehaviorTreeRecord | null>(null);
  const [isAddDrawerVisible, setIsAddDrawerVisible] = useState(false);
  const [editingDrawerRecord, setEditingDrawerRecord] = useState<BehaviorTreeRecord | null>(null);
  const [isEditingProcessKey, setIsEditingProcessKey] = useState(false);
  const [editingProcessKeyRecord, setEditingProcessKeyRecord] = useState<BehaviorTreeRecord | null>(null);
  const [processKeyForm] = Form.useForm();
  const [form] = Form.useForm();

  // 检测屏幕尺寸
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N: 新增行为树
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        setEditingDrawerRecord(null);
        setIsAddDrawerVisible(true);
      }
      // Ctrl/Cmd + R: 刷新数据
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
      // ESC: 关闭弹窗
      if (event.key === 'Escape') {
        if (isAddDrawerVisible) {
          setIsAddDrawerVisible(false);
          setEditingDrawerRecord(null);
        }
        if (isModalVisible) {
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }
        if (isEditingProcessKey) {
          setIsEditingProcessKey(false);
          setEditingProcessKeyRecord(null);
          processKeyForm.resetFields();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAddDrawerVisible, isModalVisible, isEditingProcessKey, form, processKeyForm]);

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth * 0.8;
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 使用共享数据源
  const [dataSource, setDataSource] = useState<BehaviorTreeRecord[]>(behaviorTreeData);

  const getStatusTag = (status: string) => {
    const statusMap = {
      enabled: { color: 'green', text: '启用' },
      disabled: { color: 'orange', text: '停用' },
      obsolete: { color: 'red', text: '作废' },
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleStatusChange = (record: BehaviorTreeRecord, newStatus: string) => {
    const statusText = {
      enabled: '启用',
      disabled: '停用',
      obsolete: '作废',
    }[newStatus];

    confirm({
      title: `确认${statusText}`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要{statusText}行为树"{record.treeName}"吗？</p>
          {newStatus === 'obsolete' && (
            <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '8px 0 0 0' }}>
              注意：作废后的行为树将无法恢复使用
            </p>
          )}
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk() {
        const updatedData = {
          status: newStatus as 'enabled' | 'disabled' | 'obsolete',
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户',
        };
        
        // 更新本地状态
        setDataSource(prev =>
          prev.map(item =>
            item.id === record.id
              ? { ...item, ...updatedData }
              : item
          )
        );
        
        // 同步更新共享数据源
        updateBehaviorTree(record.id, updatedData);
        
        message.success({
          content: `行为树"${record.treeName}"${statusText}成功`,
          duration: 3
        });
      },
    });
  };

  const handleDelete = (record: BehaviorTreeRecord) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>确定要删除行为树"{record.treeName}"吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '8px 0 0 0' }}>
            ⚠️ 此操作不可恢复，请谨慎操作
          </p>
          <div style={{ background: '#fff2f0', padding: '8px', borderRadius: '4px', margin: '8px 0 0 0', fontSize: '12px' }}>
            <strong>删除影响：</strong>
            <br />• 行为树配置将永久丢失
            <br />• 相关的执行记录将被清除
          </div>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk() {
        // 更新本地状态
        setDataSource(prev => prev.filter(item => item.id !== record.id));
        
        // 同步更新共享数据源
        deleteBehaviorTree(record.id);
        
        message.success({
          content: `行为树"${record.treeName}"删除成功`,
          duration: 3
        });
      },
    });
  };

  const getMoreMenuItems = (record: BehaviorTreeRecord): MenuProps['items'] => {
    const items: MenuProps['items'] = [];

    if (record.status === 'enabled') {
      items.push({
        key: 'disable',
        label: '停用',
        onClick: () => handleStatusChange(record, 'disabled'),
      });
    } else if (record.status === 'disabled') {
      items.push(
        {
          key: 'enable',
          label: '启用',
          onClick: () => handleStatusChange(record, 'enabled'),
        },
        {
          key: 'obsolete',
          label: '作废',
          onClick: () => handleStatusChange(record, 'obsolete'),
        }
      );
    } else if (record.status === 'obsolete') {
      items.push({
        key: 'disable',
        label: '停用',
        onClick: () => handleStatusChange(record, 'disabled'),
      });
    }

    items.push({
      key: 'delete',
      label: '删除',
      danger: true,
      onClick: () => handleDelete(record),
    });

    return items;
  };

  // 处理流程key编辑
  const handleEditProcessKey = (record: BehaviorTreeRecord) => {
    setEditingProcessKeyRecord(record);
    processKeyForm.setFieldsValue({ identifier: record.treeKey });
    setIsEditingProcessKey(true);
  };

  const handleProcessKeyModalOk = async () => {
    try {
      const values = await processKeyForm.validateFields();
      const oldKey = editingProcessKeyRecord?.treeKey;
      const newKey = values.identifier;
      
      // 检查是否有实际变更
      if (oldKey === newKey) {
        message.info('流程key未发生变更');
        setIsEditingProcessKey(false);
        setEditingProcessKeyRecord(null);
        processKeyForm.resetFields();
        return;
      }
      
      // 显示确认对话框
      Modal.confirm({
        title: '确认修改流程key',
        content: (
          <div>
            <p><strong>行为树名称：</strong>{editingProcessKeyRecord?.treeName}</p>
            <p><strong>原流程key：</strong><code style={{background: '#f5f5f5', padding: '2px 4px'}}>{oldKey}</code></p>
            <p><strong>新流程key：</strong><code style={{background: '#e6f7ff', padding: '2px 4px'}}>{newKey}</code></p>
            <p style={{color: '#ff4d4f', marginTop: '12px'}}>⚠️ 修改流程key后，请确保相关系统同步更新配置</p>
          </div>
        ),
        onOk: () => {
          setLoading(true);
          
          // 模拟API调用
          setTimeout(() => {
            if (editingProcessKeyRecord) {
              const updatedData = {
                treeKey: newKey,
                updateTime: new Date().toLocaleString('zh-CN'),
                updatedBy: '当前用户',
              };
              
              // 更新本地状态
              setDataSource(prev =>
                prev.map(item =>
                  item.id === editingProcessKeyRecord.id
                    ? { ...item, ...updatedData }
                    : item
                )
              );
              
              // 同步更新共享数据源
              updateBehaviorTree(editingProcessKeyRecord.id, updatedData);
              
              message.success('流程key修改成功');
            }
            setIsEditingProcessKey(false);
            setEditingProcessKeyRecord(null);
            processKeyForm.resetFields();
            setLoading(false);
          }, 1000);
        },
      });
    } catch (error) {
      if (isDev) console.error('表单验证失败:', error);
    }
  };

  const handleProcessKeyModalCancel = () => {
    setIsEditingProcessKey(false);
    setEditingProcessKeyRecord(null);
    processKeyForm.resetFields();
  };

  // 移动端列配置
  const mobileColumns: ColumnsType<BehaviorTreeRecord> = [
    {
      title: '业务流程信息',
      key: 'processInfo',
      fixed: 'left',
      render: (_: any, record: BehaviorTreeRecord) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
                {record.treeName}
              </span>
          </div>
          <div style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', marginRight: '4px' }}>流程key:</span>
              <Space size={4}>
                <Tooltip title={record.treeKey}>
                  <span 
                    style={{ 
                      color: '#1890ff', 
                      cursor: 'pointer',
                      maxWidth: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block'
                    }} 
                    onClick={() => {
                      navigator.clipboard.writeText(record.treeKey);
                      message.success('流程key已复制到剪贴板');
                    }}
                  >
                    {record.treeKey}
                  </span>
                </Tooltip>
              <Tooltip title="复制流程key">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined style={{ color: '#1890ff' }} />}
                    onClick={() => {
                      navigator.clipboard.writeText(record.treeKey);
                      message.success('流程key已复制到剪贴板');
                    }}
                    style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
                  />
              </Tooltip>
              <Tooltip title="编辑流程key">
                <EditOutlined
                  style={{ color: '#1890ff', cursor: 'pointer', fontSize: '12px' }}
                  onClick={() => handleEditProcessKey(record)}
                />
              </Tooltip>
            </Space>
          </div>
          <div style={{ marginBottom: '4px' }}>
            {getStatusTag(record.status)}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {record.updateTime} · {record.updatedBy}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(100),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: BehaviorTreeRecord) => (
        <Space size={2} direction="vertical">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingDrawerRecord(record);
              setIsAddDrawerVisible(true);
            }}
            style={{ padding: '0 4px', fontSize: '12px' }}
          >
            编辑
          </Button>
          <Dropdown
            menu={{ items: getMoreMenuItems(record) }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="link" size="small" icon={<MoreOutlined />} style={{ padding: '0 4px', fontSize: '12px' }}>
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<BehaviorTreeRecord> = [
    {
      title: '行为树名称',
      dataIndex: 'treeName',
      key: 'treeName',
      width: getColumnWidth(200),
      align: 'left',
      ellipsis: true,
      render: (name: string, record: BehaviorTreeRecord) => (
        <Tooltip title={name}>
          <span 
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => {
              setEditingDrawerRecord(record);
              setIsAddDrawerVisible(true);
            }}
          >
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '流程key',
      dataIndex: 'treeKey',
      key: 'treeKey',
      width: getColumnWidth(220),
      align: 'left',
      ellipsis: true,
      render: (identifier: string, record: BehaviorTreeRecord) => (
        <Space size={4}>
          <Tooltip title={identifier}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }} 
              onClick={() => {
                navigator.clipboard.writeText(identifier);
                message.success('流程key已复制到剪贴板');
              }}
            >
              {identifier}
            </span>
          </Tooltip>
          <Tooltip title="复制流程key">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: '#1890ff' }} />}
              onClick={() => {
                navigator.clipboard.writeText(identifier);
                message.success('流程key已复制到剪贴板');
              }}
              style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
            />
          </Tooltip>
          <Tooltip title="编辑流程key">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleEditProcessKey(record)}
              style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: getColumnWidth(100),
      align: 'left',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(160),
      align: 'left',
      ellipsis: true,
      sorter: (a: BehaviorTreeRecord, b: BehaviorTreeRecord) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
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
      ellipsis: true,
      render: (user: string) => (
        <Tooltip title={user}>
          <span>{user}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(120),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: BehaviorTreeRecord) => (
        <Space size={4}>
          <Tooltip title="编辑行为树">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingDrawerRecord(record);
                setIsAddDrawerVisible(true);
              }}
              size="small"
              style={{ padding: '0 4px' }}
            >
              编辑
            </Button>
          </Tooltip>
          <Dropdown
            menu={{ items: getMoreMenuItems(record) }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="link" size="small" icon={<MoreOutlined />} style={{ padding: '0 4px' }}>
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 模拟网络延迟，提供更真实的用户体验
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (editingRecord) {
        // 编辑
        const updatedData = {
          ...values,
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户',
        };
        
        // 更新本地状态
        setDataSource(prev =>
          prev.map(item =>
            item.id === editingRecord.id
              ? { ...item, ...updatedData }
              : item
          )
        );
        
        // 同步更新共享数据源
        updateBehaviorTree(editingRecord.id, updatedData);
        
        message.success({
          content: `行为树"${values.treeName}"编辑成功`,
          duration: 3
        });
      } else {
        // 新增
        const newRecord: BehaviorTreeRecord = {
          id: Date.now().toString(),
          ...values,
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户',
        };
        
        // 更新本地状态
        setDataSource(prev => [newRecord, ...prev]);
        
        // 同步更新共享数据源
        addBehaviorTree(newRecord);
        
        message.success({
          content: `行为树"${values.treeName}"创建成功`,
          duration: 3
        });
      }
      
      setIsModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    } catch (error) {
      if (isDev) console.error('操作失败:', error);
      message.error({
        content: editingRecord ? '编辑行为树失败，请重试' : '创建行为树失败，请重试',
        duration: 4
      });
    } finally {
      setLoading(false);
    }
  };

  // 筛选数据并按更新时间倒序排序
  const filteredData = dataSource
    .filter(item => {
      const matchesSearch = !searchText || 
        item.treeName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.treeKey.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.remark && item.remark.toLowerCase().includes(searchText.toLowerCase()));
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // 按更新时间倒序排序，最新的在前面
      return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
    });

  // 动态表格配置
  const getTableConfig = (isMobile: boolean, isLargeScreen: boolean, columnCount: number) => {
    let scrollWidth: number | string = 800;
    
    if (isMobile) {
      scrollWidth = 'max-content';
    } else if (isLargeScreen) {
      scrollWidth = Math.max(1000, columnCount * 150);
    } else {
      scrollWidth = Math.max(800, columnCount * 120);
    }
    
    return {
      scroll: { x: scrollWidth },
      size: 'small' as const
    };
  };

  const tableConfig = getTableConfig(isMobile, isLargeScreen, desktopColumns.length);

  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('刷新成功');
    }, 1000);
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card>
        {/* 搜索和操作区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12} lg={10} xl={10} xxl={12}>
            <Input
              placeholder={isMobile ? "搜索行为树" : "请输入行为树名称搜索"}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? "large" : "middle"}
            />
          </Col>
          <Col xs={8} sm={8} md={4} lg={4} xl={4} xxl={4}>
            <Select
              placeholder={isMobile ? "状态" : "全部状态"}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? "large" : "middle"}
            >
              <Option value="enabled">启用</Option>
              <Option value="disabled">停用</Option>
              <Option value="obsolete">作废</Option>
            </Select>
          </Col>
          <Col xs={8} sm={8} md={4} lg={4} xl={4} xxl={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size={isMobile ? "large" : "middle"}
              style={{ width: '100%' }}
              title="快捷键: Ctrl/Cmd + R"
            >
              {isMobile ? "" : "刷新"}
            </Button>
          </Col>
          <Col xs={8} sm={8} md={4} lg={6} xl={6} xxl={5}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDrawerRecord(null);
                setIsAddDrawerVisible(true);
              }}
              size={isMobile ? "large" : "middle"}
              style={{ width: '100%' }}
              title="快捷键: Ctrl/Cmd + N"
            >
              {isMobile ? "" : "新增"}
            </Button>
          </Col>
        </Row>

        {/* 数据表格 */}
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          {...tableConfig}
          pagination={{
            total: filteredData.length,
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile 
              ? (total: number) => `共 ${total} 条`
              : (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            size: isMobile ? 'small' : 'default',
            simple: isMobile,
            responsive: true,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑行为树' : '新增行为树'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="treeName"
            label="行为树名称"
            rules={[
              { required: true, message: '请输入行为树名称' },
              { max: 50, message: '行为树名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入行为树名称" />
          </Form.Item>

          <Form.Item
            name="treeKey"
            label="树key"
            rules={[
              { required: true, message: '请输入树key' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '树key必须以字母开头，只能包含字母、数字和下划线' },
              { max: 30, message: '树key不能超过30个字符' },
            ]}
          >
            <Input placeholder="请输入树key" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue="enabled"
          >
            <Select placeholder="请选择状态">
              <Option value="enabled">启用</Option>
              <Option value="disabled">停用</Option>
              <Option value="obsolete">作废</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
            rules={[{ max: 200, message: '备注不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入备注"
              rows={4}
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingRecord(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRecord ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 树key编辑Modal */}
      <Modal
        title="编辑树key"
        open={isEditingProcessKey}
        onOk={handleProcessKeyModalOk}
        onCancel={handleProcessKeyModalCancel}
        confirmLoading={loading}
        width={500}
      >
        <Form
          form={processKeyForm}
          layout="vertical"
          initialValues={{
            treeKey: editingProcessKeyRecord?.treeKey || '',
          }}
        >
          <Form.Item
            label="树key"
            name="treeKey"
            rules={[
              { required: true, message: '请输入树key' },
              { min: 3, message: '树key至少3个字符' },
              { max: 50, message: '树key最多50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '树key只能包含字母、数字、下划线和连字符' },
            ]}
          >
            <Input placeholder="请输入树key" />
          </Form.Item>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '-16px', marginBottom: '16px' }}>
            注意：树key用于行为树唯一标识，修改后请确保相关系统同步更新
          </div>
        </Form>
      </Modal>

      {/* 新增/编辑行为树 Drawer */}
      <AddBehaviorTree
        visible={isAddDrawerVisible}
        onClose={() => {
          setIsAddDrawerVisible(false);
          setEditingDrawerRecord(null);
        }}
        onSave={(data) => {
          
          
          const newRecord: BehaviorTreeRecord = {
            id: editingDrawerRecord ? editingDrawerRecord.id : Date.now().toString(),
            treeName: data.treeName || '未命名行为树',
            treeKey: data.treeKey || '',
            status: data.status || 'enabled',
            remark: data.remark || '',
            updateTime: new Date().toLocaleString('zh-CN'),
            updatedBy: '当前用户',
            canvasData: data.canvasData || { nodes: [], connections: [], subCanvases: [] }
          };
          
          

          if (editingDrawerRecord) {
             // 编辑模式
             
             updateBehaviorTree(editingDrawerRecord.id, newRecord);
             // 直接从behaviorTreeData获取最新数据，确保数据同步
             setDataSource([...behaviorTreeData]);
             message.success('行为树编辑成功！');
           } else {
             // 新增模式
             
             addBehaviorTree(newRecord);
             // 直接从behaviorTreeData获取最新数据，避免重复添加
             setDataSource([...behaviorTreeData]);
             message.success('行为树创建成功！');
           }

          setIsAddDrawerVisible(false);
          setEditingDrawerRecord(null);
        }}
        editData={editingDrawerRecord}
      />
    </div>
  );
};

export default BehaviorTree;