import React, { useState } from 'react';
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

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      sorter: (a: User, b: User) => a.username.localeCompare(b.username),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
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
      width: 100,
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
      width: 160,
      sorter: (a: User, b: User) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 160,
      sorter: (a: User, b: User) => new Date(a.lastLoginTime).getTime() - new Date(b.lastLoginTime).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="搜索用户名、姓名或邮箱"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
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