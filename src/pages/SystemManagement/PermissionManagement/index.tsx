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
  TreeSelect,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  parentId: string | null;
  path?: string;
  description: string;
  status: 'active' | 'inactive';
  createTime: string;
  children?: Permission[];
}

const PermissionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();

  // 模拟权限数据
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: '1',
      name: '系统管理',
      code: 'system',
      type: 'menu',
      parentId: null,
      path: '/system',
      description: '系统管理模块',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
      children: [
        {
          id: '1-1',
          name: '用户管理',
          code: 'system:user',
          type: 'menu',
          parentId: '1',
          path: '/system/users',
          description: '用户管理页面',
          status: 'active',
          createTime: '2024-01-01 10:00:00',
          children: [
            {
              id: '1-1-1',
              name: '查看用户',
              code: 'system:user:read',
              type: 'button',
              parentId: '1-1',
              description: '查看用户列表',
              status: 'active',
              createTime: '2024-01-01 10:00:00',
            },
            {
              id: '1-1-2',
              name: '新增用户',
              code: 'system:user:create',
              type: 'button',
              parentId: '1-1',
              description: '新增用户',
              status: 'active',
              createTime: '2024-01-01 10:00:00',
            },
            {
              id: '1-1-3',
              name: '编辑用户',
              code: 'system:user:update',
              type: 'button',
              parentId: '1-1',
              description: '编辑用户信息',
              status: 'active',
              createTime: '2024-01-01 10:00:00',
            },
            {
              id: '1-1-4',
              name: '删除用户',
              code: 'system:user:delete',
              type: 'button',
              parentId: '1-1',
              description: '删除用户',
              status: 'active',
              createTime: '2024-01-01 10:00:00',
            },
          ],
        },
        {
          id: '1-2',
          name: '角色管理',
          code: 'system:role',
          type: 'menu',
          parentId: '1',
          path: '/system/roles',
          description: '角色管理页面',
          status: 'active',
          createTime: '2024-01-01 10:00:00',
        },
        {
          id: '1-3',
          name: '权限管理',
          code: 'system:permission',
          type: 'menu',
          parentId: '1',
          path: '/system/permissions',
          description: '权限管理页面',
          status: 'active',
          createTime: '2024-01-01 10:00:00',
        },
      ],
    },
  ]);

  // 将树形数据转换为平铺数据用于表格显示
  const flattenPermissions = (perms: Permission[], level = 0): (Permission & { level: number })[] => {
    const result: (Permission & { level: number })[] = [];
    perms.forEach((perm) => {
      result.push({ ...perm, level });
      if (perm.children && perm.children.length > 0) {
        result.push(...flattenPermissions(perm.children, level + 1));
      }
    });
    return result;
  };

  // 获取父级权限选项
  const getParentOptions = (perms: Permission[], excludeId?: string): any[] => {
    const options: any[] = [];
    const traverse = (items: Permission[], level = 0) => {
      items.forEach((item) => {
        if (item.id !== excludeId) {
          options.push({
            title: '　'.repeat(level) + item.name,
            value: item.id,
            key: item.id,
          });
          if (item.children) {
            traverse(item.children, level + 1);
          }
        }
      });
    };
    traverse(perms);
    return options;
  };

  const columns: ColumnsType<Permission & { level: number }> = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string, record) => (
        <span style={{ paddingLeft: record.level * 20 }}>
          {name}
        </span>
      ),
    },
    {
      title: '权限编码',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          menu: { color: 'green', text: '菜单' },
          button: { color: 'blue', text: '按钮' },
          api: { color: 'orange', text: 'API' },
        };
        const typeInfo = typeMap[type] || { color: 'default', text: type };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      render: (path: string) => path || '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
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
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个权限吗？"
            description="删除后子权限也会被删除"
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
        </Space>
      ),
    },
  ];

  const flatData = flattenPermissions(permissions);
  const filteredPermissions = flatData.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchText.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchText.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAdd = () => {
    setModalType('add');
    setCurrentPermission(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (permission: Permission) => {
    setModalType('edit');
    setCurrentPermission(permission);
    form.setFieldsValue(permission);
    setIsModalVisible(true);
  };

  const handleView = (permission: Permission) => {
    setModalType('view');
    setCurrentPermission(permission);
    form.setFieldsValue(permission);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    // 递归删除权限及其子权限
    const deletePermission = (perms: Permission[], targetId: string): Permission[] => {
      return perms.filter((perm) => {
        if (perm.id === targetId) {
          return false;
        }
        if (perm.children) {
          perm.children = deletePermission(perm.children, targetId);
        }
        return true;
      });
    };

    setPermissions(deletePermission(permissions, id));
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
        const newPermission: Permission = {
          ...values,
          id: Date.now().toString(),
          createTime: new Date().toLocaleString('zh-CN'),
        };

        // 如果有父级，添加到父级的children中
        if (values.parentId) {
          const addToParent = (perms: Permission[]): Permission[] => {
            return perms.map((perm) => {
              if (perm.id === values.parentId) {
                return {
                  ...perm,
                  children: [...(perm.children || []), newPermission],
                };
              }
              if (perm.children) {
                return {
                  ...perm,
                  children: addToParent(perm.children),
                };
              }
              return perm;
            });
          };
          setPermissions(addToParent(permissions));
        } else {
          // 添加为顶级权限
          setPermissions([...permissions, newPermission]);
        }
        message.success('添加成功');
      } else if (modalType === 'edit' && currentPermission) {
        // 更新权限
        const updatePermission = (perms: Permission[]): Permission[] => {
          return perms.map((perm) => {
            if (perm.id === currentPermission.id) {
              return { ...perm, ...values };
            }
            if (perm.children) {
              return {
                ...perm,
                children: updatePermission(perm.children),
              };
            }
            return perm;
          });
        };
        setPermissions(updatePermission(permissions));
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
      add: '新增权限',
      edit: '编辑权限',
      view: '查看权限',
    };
    return titleMap[modalType];
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="搜索权限名称、编码或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增权限
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredPermissions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredPermissions.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
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
            label="权限名称"
            name="name"
            rules={[
              { required: true, message: '请输入权限名称' },
              { min: 2, message: '权限名称至少2个字符' },
            ]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>

          <Form.Item
            label="权限编码"
            name="code"
            rules={[
              { required: true, message: '请输入权限编码' },
              { pattern: /^[a-zA-Z0-9:_]+$/, message: '权限编码只能包含字母、数字、冒号和下划线' },
            ]}
          >
            <Input placeholder="请输入权限编码，如：system:user:read" />
          </Form.Item>

          <Form.Item
            label="权限类型"
            name="type"
            rules={[{ required: true, message: '请选择权限类型' }]}
          >
            <Select placeholder="请选择权限类型">
              <Select.Option value="menu">菜单</Select.Option>
              <Select.Option value="button">按钮</Select.Option>
              <Select.Option value="api">API</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="父级权限"
            name="parentId"
          >
            <TreeSelect
              placeholder="请选择父级权限（可选）"
              allowClear
              treeData={[
                { title: '无父级', value: null, key: 'root' },
                ...getParentOptions(permissions, currentPermission?.id),
              ]}
            />
          </Form.Item>

          <Form.Item
            label="路径"
            name="path"
          >
            <Input placeholder="请输入路径（菜单类型必填）" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入权限描述' }]}
          >
            <Input.TextArea
              placeholder="请输入权限描述"
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
    </div>
  );
};

export default PermissionManagement;