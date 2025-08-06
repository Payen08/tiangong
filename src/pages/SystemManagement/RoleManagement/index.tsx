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
  message,
  Popconfirm,
  Tree,
  Checkbox,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive';
  createTime: string;
}

const RoleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [form] = Form.useForm();

  // 模拟角色数据
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统所有权限',
      permissions: ['user:read', 'user:write', 'role:read', 'role:write', 'permission:read', 'permission:write'],
      userCount: 1,
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      name: '管理员',
      code: 'admin',
      description: '拥有大部分管理权限',
      permissions: ['user:read', 'user:write', 'role:read'],
      userCount: 3,
      status: 'active',
      createTime: '2024-01-02 09:00:00',
    },
    {
      id: '3',
      name: '编辑员',
      code: 'editor',
      description: '拥有内容编辑权限',
      permissions: ['user:read'],
      userCount: 5,
      status: 'active',
      createTime: '2024-01-03 15:30:00',
    },
  ]);

  // 权限树数据
  const permissionTreeData: DataNode[] = [
    {
      title: '用户管理',
      key: 'user',
      children: [
        { title: '查看用户', key: 'user:read' },
        { title: '新增用户', key: 'user:write' },
        { title: '编辑用户', key: 'user:edit' },
        { title: '删除用户', key: 'user:delete' },
      ],
    },
    {
      title: '角色管理',
      key: 'role',
      children: [
        { title: '查看角色', key: 'role:read' },
        { title: '新增角色', key: 'role:write' },
        { title: '编辑角色', key: 'role:edit' },
        { title: '删除角色', key: 'role:delete' },
      ],
    },
    {
      title: '权限管理',
      key: 'permission',
      children: [
        { title: '查看权限', key: 'permission:read' },
        { title: '新增权限', key: 'permission:write' },
        { title: '编辑权限', key: 'permission:edit' },
        { title: '删除权限', key: 'permission:delete' },
      ],
    },
  ];

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a: Role, b: Role) => a.name.localeCompare(b.name),
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 100,
      sorter: (a: Role, b: Role) => a.userCount - b.userCount,
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      sorter: (a: Role, b: Role) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: Role) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handlePermission(record)}
          >
            权限
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            description="删除后该角色下的用户将失去相应权限"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.code === 'super_admin'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchText.toLowerCase()) ||
      role.code.toLowerCase().includes(searchText.toLowerCase()) ||
      role.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAdd = () => {
    setModalType('add');
    setCurrentRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (role: Role) => {
    setModalType('edit');
    setCurrentRole(role);
    form.setFieldsValue(role);
    setIsModalVisible(true);
  };

  const handleView = (role: Role) => {
    setModalType('view');
    setCurrentRole(role);
    form.setFieldsValue(role);
    setIsModalVisible(true);
  };

  const handlePermission = (role: Role) => {
    setCurrentRole(role);
    setSelectedPermissions(role.permissions);
    setIsPermissionModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setRoles(roles.filter((role) => role.id !== id));
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
        const newRole: Role = {
          ...values,
          id: Date.now().toString(),
          permissions: [],
          userCount: 0,
          createTime: new Date().toLocaleString('zh-CN'),
        };
        setRoles([...roles, newRole]);
        message.success('添加成功');
      } else if (modalType === 'edit' && currentRole) {
        const updatedRoles = roles.map((role) =>
          role.id === currentRole.id ? { ...role, ...values } : role
        );
        setRoles(updatedRoles);
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

  const handlePermissionOk = () => {
    if (currentRole) {
      const updatedRoles = roles.map((role) =>
        role.id === currentRole.id
          ? { ...role, permissions: selectedPermissions }
          : role
      );
      setRoles(updatedRoles);
      message.success('权限更新成功');
    }
    setIsPermissionModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handlePermissionCancel = () => {
    setIsPermissionModalVisible(false);
  };

  const getModalTitle = () => {
    const titleMap = {
      add: '新增角色',
      edit: '编辑角色',
      view: '查看角色',
    };
    return titleMap[modalType];
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="搜索角色名称、编码或描述"
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
            新增角色
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            total: filteredRoles.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
        />
      </Card>

      {/* 角色信息模态框 */}
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
            label="角色名称"
            name="name"
            rules={[
              { required: true, message: '请输入角色名称' },
              { min: 2, message: '角色名称至少2个字符' },
            ]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item
            label="角色编码"
            name="code"
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '角色编码只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="请输入角色编码" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <Input.TextArea
              placeholder="请输入角色描述"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限配置模态框 */}
      <Modal
        title={`配置权限 - ${currentRole?.name}`}
        open={isPermissionModalVisible}
        onOk={handlePermissionOk}
        onCancel={handlePermissionCancel}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <div className="mb-4">
          <p className="text-gray-600 mb-2">请选择该角色拥有的权限：</p>
          <Tree
            checkable
            checkedKeys={selectedPermissions}
            onCheck={(checkedKeys: React.Key[]) => {
              setSelectedPermissions(checkedKeys as string[]);
            }}
            treeData={permissionTreeData}
            defaultExpandAll
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;