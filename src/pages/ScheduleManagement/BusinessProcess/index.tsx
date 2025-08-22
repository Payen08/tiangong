import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddBusinessProcess from './AddBusinessProcess';
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

const { Option } = Select;
const { confirm } = Modal;

interface BusinessProcessRecord {
  id: string;
  businessName: string;
  identifier: string;
  status: 'enabled' | 'disabled' | 'obsolete';
  remark: string;
  updateTime: string;
  updatedBy: string;
}

const BusinessProcess: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BusinessProcessRecord | null>(null);
  const [isAddDrawerVisible, setIsAddDrawerVisible] = useState(false);
  const [editingDrawerRecord, setEditingDrawerRecord] = useState<BusinessProcessRecord | null>(null);
  const [isEditingProcessKey, setIsEditingProcessKey] = useState(false);
  const [editingProcessKeyRecord, setEditingProcessKeyRecord] = useState<BusinessProcessRecord | null>(null);
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

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth * 0.8;
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 模拟数据
  const [dataSource, setDataSource] = useState<BusinessProcessRecord[]>([
    {
      id: '1',
      businessName: '订单处理流程',
      identifier: 'order_process',
      status: 'enabled',
      remark: '处理客户订单的标准流程',
      updateTime: '2024-01-15 10:30:00',
      updatedBy: '张三',
    },
    {
      id: '2',
      businessName: '库存管理流程',
      identifier: 'inventory_management',
      status: 'disabled',
      remark: '管理仓库库存的业务流程',
      updateTime: '2024-01-14 14:20:00',
      updatedBy: '李四',
    },
    {
      id: '3',
      businessName: '退货处理流程',
      identifier: 'return_process',
      status: 'obsolete',
      remark: '处理客户退货的流程',
      updateTime: '2024-01-13 09:15:00',
      updatedBy: '王五',
    },
  ]);

  const getStatusTag = (status: string) => {
    const statusMap = {
      enabled: { color: 'green', text: '启用' },
      disabled: { color: 'orange', text: '停用' },
      obsolete: { color: 'red', text: '作废' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleStatusChange = (record: BusinessProcessRecord, newStatus: string) => {
    const statusText = {
      enabled: '启用',
      disabled: '停用',
      obsolete: '作废',
    }[newStatus];

    confirm({
      title: `确认${statusText}`,
      icon: <ExclamationCircleOutlined />,
      content: `确定要${statusText}业务流程"${record.businessName}"吗？`,
      onOk() {
        setDataSource(prev =>
          prev.map(item =>
            item.id === record.id
              ? {
                  ...item,
                  status: newStatus as 'enabled' | 'disabled' | 'obsolete',
                  updateTime: new Date().toLocaleString('zh-CN'),
                  updatedBy: '当前用户',
                }
              : item
          )
        );
        message.success(`${statusText}成功`);
      },
    });
  };

  const handleDelete = (record: BusinessProcessRecord) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除业务流程"${record.businessName}"吗？此操作不可恢复。`,
      okType: 'danger',
      onOk() {
        setDataSource(prev => prev.filter(item => item.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const getMoreMenuItems = (record: BusinessProcessRecord): MenuProps['items'] => {
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
  const handleEditProcessKey = (record: BusinessProcessRecord) => {
    setEditingProcessKeyRecord(record);
    processKeyForm.setFieldsValue({ identifier: record.identifier });
    setIsEditingProcessKey(true);
  };

  const handleProcessKeyModalOk = async () => {
    try {
      const values = await processKeyForm.validateFields();
      const oldKey = editingProcessKeyRecord?.identifier;
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
            <p><strong>业务名称：</strong>{editingProcessKeyRecord?.businessName}</p>
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
              setDataSource(prev =>
                prev.map(item =>
                  item.id === editingProcessKeyRecord.id
                    ? {
                        ...item,
                        identifier: newKey,
                        updateTime: new Date().toLocaleString('zh-CN'),
                        updatedBy: '当前用户',
                      }
                    : item
                )
              );
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
      console.error('表单验证失败:', error);
    }
  };

  const handleProcessKeyModalCancel = () => {
    setIsEditingProcessKey(false);
    setEditingProcessKeyRecord(null);
    processKeyForm.resetFields();
  };

  // 移动端列配置
  const mobileColumns: ColumnsType<BusinessProcessRecord> = [
    {
      title: '业务流程信息',
      key: 'processInfo',
      fixed: 'left',
      render: (_: any, record: BusinessProcessRecord) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {record.businessName}
            </span>
          </div>
          <div style={{ fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#666', marginRight: '4px' }}>流程key:</span>
            <Space size={4}>
              <Tooltip title={record.identifier}>
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
                    navigator.clipboard.writeText(record.identifier);
                    message.success('流程key已复制到剪贴板');
                  }}
                >
                  {record.identifier}
                </span>
              </Tooltip>
              <Tooltip title="复制流程key">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ color: '#1890ff' }} />}
                  onClick={() => {
                    navigator.clipboard.writeText(record.identifier);
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
      render: (_: any, record: BusinessProcessRecord) => (
        <Space size={2} direction="vertical">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
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
  const desktopColumns: ColumnsType<BusinessProcessRecord> = [
    {
      title: '业务名称',
      dataIndex: 'businessName',
      key: 'businessName',
      width: getColumnWidth(200),
      align: 'left',
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name}>
          <span style={{ color: '#1890ff', cursor: 'pointer' }}>
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '流程key',
      dataIndex: 'identifier',
      key: 'identifier',
      width: getColumnWidth(220),
      align: 'left',
      ellipsis: true,
      render: (identifier: string, record: BusinessProcessRecord) => (
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
      sorter: (a: BusinessProcessRecord, b: BusinessProcessRecord) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
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
      render: (_: any, record: BusinessProcessRecord) => (
        <Space size={4}>
          <Tooltip title="编辑业务流程">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRecord(record);
                form.setFieldsValue(record);
                setIsModalVisible(true);
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
      
      if (editingRecord) {
        // 编辑
        setDataSource(prev =>
          prev.map(item =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  ...values,
                  updateTime: new Date().toLocaleString('zh-CN'),
                  updatedBy: '当前用户',
                }
              : item
          )
        );
        message.success('编辑成功');
      } else {
        // 新增
        const newRecord: BusinessProcessRecord = {
          id: Date.now().toString(),
          ...values,
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户',
        };
        setDataSource(prev => [newRecord, ...prev]);
        message.success('新增成功');
      }
      
      setIsModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选数据并按更新时间倒序排序
  const filteredData = dataSource
    .filter(item => {
      const matchesSearch = !searchText || 
        item.businessName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.identifier.toLowerCase().includes(searchText.toLowerCase()) ||
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
          <Col xs={24} sm={24} md={10} lg={8} xl={8} xxl={12}>
            <Input
              placeholder="请输入业务名称搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size="middle"
            />
          </Col>
          <Col xs={12} sm={12} md={5} lg={4} xl={4} xxl={4}>
            <Select
              placeholder="全部状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
              size="middle"
            >
              <Option value="enabled">启用</Option>
              <Option value="disabled">停用</Option>
              <Option value="obsolete">作废</Option>
            </Select>
          </Col>
          <Col xs={6} sm={6} md={3} lg={4} xl={4} xxl={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size="middle"
              style={{ width: '100%' }}
            >
              刷新
            </Button>
          </Col>
          <Col xs={6} sm={6} md={6} lg={8} xl={8} xxl={5}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDrawerRecord(null);
                setIsAddDrawerVisible(true);
              }}
              size="middle"
              style={{ width: '100%' }}
            >
              新增
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
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            size: isMobile ? 'small' : 'default',
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑业务流程' : '新增业务流程'}
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
            name="businessName"
            label="业务名称"
            rules={[
              { required: true, message: '请输入业务名称' },
              { max: 50, message: '业务名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入业务名称" />
          </Form.Item>

          <Form.Item
            name="identifier"
            label="流程key"
            rules={[
              { required: true, message: '请输入流程key' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '流程key必须以字母开头，只能包含字母、数字和下划线' },
              { max: 30, message: '流程key不能超过30个字符' },
            ]}
          >
            <Input placeholder="请输入流程key" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue="enabled"
          >
            <Select>
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

      {/* 流程key编辑Modal */}
      <Modal
        title="编辑流程key"
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
            identifier: editingProcessKeyRecord?.identifier || '',
          }}
        >
          <Form.Item
            label="流程key"
            name="identifier"
            rules={[
              { required: true, message: '请输入流程key' },
              { min: 3, message: '流程key至少3个字符' },
              { max: 50, message: '流程key最多50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '流程key只能包含字母、数字、下划线和连字符' },
            ]}
          >
            <Input placeholder="请输入流程key" />
          </Form.Item>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '-16px', marginBottom: '16px' }}>
            注意：流程key用于业务流程唯一标识，修改后请确保相关系统同步更新
          </div>
        </Form>
      </Modal>

      {/* 新增/编辑业务流程 Drawer */}
      <AddBusinessProcess
        visible={isAddDrawerVisible}
        onClose={() => {
          setIsAddDrawerVisible(false);
          setEditingDrawerRecord(null);
        }}
        onSave={(data) => {
          // 处理保存逻辑
          const newRecord: BusinessProcessRecord = {
            id: editingDrawerRecord ? editingDrawerRecord.id : Date.now().toString(),
            businessName: data.businessName,
            identifier: data.identifier,
            status: data.status,
            remark: data.remark || '',
            updateTime: new Date().toLocaleString('zh-CN'),
            updatedBy: '当前用户'
          };

          if (editingDrawerRecord) {
             // 编辑模式
             setDataSource((prevData: BusinessProcessRecord[]) => 
               prevData.map((item: BusinessProcessRecord) => 
                 item.id === editingDrawerRecord.id ? newRecord : item
               )
             );
             message.success('业务流程编辑成功！');
           } else {
             // 新增模式
             setDataSource((prevData: BusinessProcessRecord[]) => [newRecord, ...prevData]);
             message.success('业务流程创建成功！');
           }

          setIsAddDrawerVisible(false);
          setEditingDrawerRecord(null);
        }}
        editData={editingDrawerRecord}
      />
    </div>
  );
};

export default BusinessProcess;