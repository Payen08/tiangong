import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  status: 'active' | 'inactive';
  createTime: string;
  lastLoginTime: string;
}

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  
  // 屏幕尺寸检测
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1400);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLargeScreen(window.innerWidth >= 1400);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 动态计算列宽
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth;
    if (isLargeScreen) return Math.floor(baseWidth * 1.2);
    return baseWidth;
  };

  // 根据列数调整列宽
  const adjustColumnWidths = (columns: ColumnsType<User>, isMobile: boolean): ColumnsType<User> => {
    if (isMobile) return columns;
    
    const columnCount = columns.length;
    let widthMultiplier = 1;
    
    if (columnCount <= 5) {
      widthMultiplier = 1.3;
    } else if (columnCount <= 7) {
      widthMultiplier = 1.1;
    } else if (columnCount >= 10) {
      widthMultiplier = 0.9;
    }
    
    return columns.map((col: any) => ({
      ...col,
      width: col.width ? col.width * widthMultiplier : col.width
    }));
  };

  // 获取表格配置
  const getTableConfig = () => {
    const scrollWidth = isMobile ? 'max-content' : isLargeScreen ? 1400 : 1200;
    return {
      scroll: { x: scrollWidth },
      size: isMobile ? 'small' : 'middle' as const
    };
  };

  // 模拟数据
  const [users, setUsers] = useState<User[]>([
    {
      id: 'admin',
      username: 'admin',
      name: '邓建平',
      email: 'admin@example.com',
      phone: '15724109149',
      password: '123456',
      role: '超级管理员',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
      lastLoginTime: '2024-01-15 14:30:00',
    },
    {
      id: '2',
      username: 'zhangsan',
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138001',
      role: '普通用户',
      status: 'active',
      createTime: '2024-01-02 09:00:00',
      lastLoginTime: '2024-01-15 11:20:00',
    },
    {
      id: '3',
      username: 'lisi',
      name: '李四',
      email: 'lisi@example.com',
      phone: '13800138002',
      role: '编辑员',
      status: 'inactive',
      createTime: '2024-01-03 15:30:00',
      lastLoginTime: '2024-01-10 16:45:00',
    },
  ]);

  // 移动端列配置
  const mobileColumns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_: any, record: User) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.username}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.phone}</div>
          <div style={{ marginTop: '4px' }}>
            <Tag color={record.status === 'active' ? 'success' : 'error'} size="small">
              {record.status === 'active' ? '正常' : '禁用'}
            </Tag>
            <Tag size="small">{record.role}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: User) => {
        const isAdmin = record.username === 'admin';
        return (
          <Space direction="vertical" size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              查看
            </Button>
            {!isAdmin && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: getColumnWidth(120),
      sorter: (a: User, b: User) => a.username.localeCompare(b.username),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(100),
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: getColumnWidth(130),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: getColumnWidth(120),
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          '超级管理员': 'red',
          '管理员': 'orange',
          '编辑员': 'blue',
          '普通用户': 'default',
        };
        return <Tag color={colorMap[role] || 'default'}>{role}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: getColumnWidth(100),
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: getColumnWidth(160),
      sorter: (a: User, b: User) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: getColumnWidth(160),
      sorter: (a: User, b: User) => new Date(a.lastLoginTime).getTime() - new Date(b.lastLoginTime).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(180),
      fixed: 'right',
      render: (_: any, record: User) => {
        const isAdmin = record.username === 'admin';
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              查看
            </Button>
            {!isAdmin && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            {!isAdmin && (
              <Popconfirm
                title="确定要删除这个用户吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            )}
            
          </Space>
        );
      },
    },
  ];

  const filteredUsers = users
    .filter(
      (user) =>
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      // 按创建时间倒序排序，最新的排在前面
      const timeA = new Date(a.createTime).getTime();
      const timeB = new Date(b.createTime).getTime();
      return timeB - timeA;
    });

  const handleAdd = () => {
    setModalType('add');
    setCurrentUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    if (user.username === 'admin') {
      message.warning('超级管理员账号不可编辑');
      return;
    }
    setModalType('edit');
    setCurrentUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleView = (user: User) => {
    setModalType('view');
    setCurrentUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    const userToDelete = users.find(user => user.id === id);
    if (userToDelete && userToDelete.username === 'admin') {
      message.warning('超级管理员账号不可删除');
      return;
    }
    setUsers(users.filter((user) => user.id !== id));
    message.success('删除成功');
  };

  const handleModalOk = async () => {
    if (modalType === 'view') {
      setIsModalVisible(false);
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      if (modalType === 'add') {
        // 如果密码为空，设置默认密码
        const password = values.password || '123456';
        const newUser: User = {
          ...values,
          password,
          id: Date.now().toString(),
          createTime: new Date().toLocaleString('zh-CN'),
          lastLoginTime: '-',
        };
        setUsers([...users, newUser]);
        message.success('添加成功');
      } else if (modalType === 'edit' && currentUser) {
        const updatedUsers = users.map((user) =>
          user.id === currentUser.id ? { ...user, ...values } : user
        );
        setUsers(updatedUsers);
        message.success('更新成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getModalTitle = () => {
    const titleMap = {
      add: '新增用户',
      edit: '编辑用户',
      view: '查看用户',
    };
    return titleMap[modalType];
  };

  return (
    <div className="space-y-4">
      <Card>
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col 
            xs={24} 
            sm={24} 
            md={16} 
            lg={14} 
            xl={isLargeScreen ? 16 : 14} 
            xxl={18}
          >
            <Input
              placeholder="搜索用户名、姓名或邮箱"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col 
            xs={24} 
            sm={24} 
            md={8} 
            lg={10} 
            xl={isLargeScreen ? 8 : 10} 
            xxl={6}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增用户'}
            </Button>
          </Col>
        </Row>

        <Table
          columns={isMobile ? mobileColumns : adjustColumnWidths(desktopColumns, isMobile)}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          scroll={getTableConfig().scroll}
          size={getTableConfig().size}
          pagination={{
            total: filteredUsers.length,
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
        />
      </Card>

      <Modal
        title={getModalTitle()}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
        okText={modalType === 'view' ? '关闭' : '确定'}
        cancelText="取消"
        cancelButtonProps={{ style: { display: modalType === 'view' ? 'none' : 'inline-block' } }}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={modalType === 'view'}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { min: 6, message: '密码至少6个字符' },
              { max: 6, message: '密码最多6个字符' },
              { pattern: /^[^\s\u4e00-\u9fa5]*$/, message: '密码不支持空格和中文' },
            ]}
          >
            <Input.Password placeholder="请输入密码（不填写默认为123456）" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="超级管理员">超级管理员</Select.Option>
              <Select.Option value="管理员">管理员</Select.Option>
              <Select.Option value="编辑员">编辑员</Select.Option>
              <Select.Option value="普通用户">普通用户</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="active">正常</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;