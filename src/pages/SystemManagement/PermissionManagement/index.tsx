import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Drawer,
  Form,
  Select,
  message,
  Modal,
  TreeSelect,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
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
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [drawerType, setDrawerType] = useState<'add' | 'edit'>('add');
  const [currentPermission, setCurrentPermission] = useState<Permission | null>(null);
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
  const adjustColumnWidths = (columns: ColumnsType<Permission>, isMobile: boolean): ColumnsType<Permission> => {
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

  // 移动端列配置
  const mobileColumns: ColumnsType<Permission & { level: number }> = [
    {
      title: '权限信息',
      key: 'permissionInfo',
      render: (_: any, record: Permission & { level: number }) => (
        <div style={{ paddingLeft: record.level * 10 }}>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            <Tag color="blue" size="small">{record.code}</Tag>
            <Tag color={record.type === 'menu' ? 'green' : record.type === 'button' ? 'blue' : 'orange'} size="small">
              {record.type === 'menu' ? '菜单' : record.type === 'button' ? '按钮' : 'API'}
            </Tag>
          </div>

          <div style={{ marginTop: '4px' }}>
            <Tag color={record.status === 'active' ? 'success' : 'error'} size="small">
              {record.status === 'active' ? '启用' : '禁用'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_: any, record: Permission & { level: number }) => (
        <Space direction="vertical" size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<Permission & { level: number }> = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(250),
      fixed: 'left',
      render: (name: string, record: Permission & { level: number }) => (
        <span style={{ paddingLeft: record.level * 20 }}>
          {name}
        </span>
      ),
    },
    {
      title: '权限编码',
      dataIndex: 'code',
      key: 'code',
      width: getColumnWidth(200),
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: getColumnWidth(100),
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
      width: getColumnWidth(200),
      render: (path: string) => path || '-',
    },

    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: getColumnWidth(100),
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
      width: getColumnWidth(160),
      align: 'left',
      ellipsis: true,
      sorter: (a: Permission & { level: number }, b: Permission & { level: number }) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
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
      width: getColumnWidth(120),
      fixed: 'right',
      align: 'right',
      render: (_: any, record: Permission & { level: number }) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteConfirm(record)}
          >
            删除
          </Button>
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
    setDrawerType('add');
    setCurrentPermission(null);
    form.resetFields();
    setIsDrawerVisible(true);
  };

  const handleEdit = (permission: Permission) => {
    setDrawerType('edit');
    setCurrentPermission(permission);
    form.setFieldsValue(permission);
    setIsDrawerVisible(true);
  };

  const handleDeleteConfirm = (permission: Permission) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除权限 "${permission.name}" 吗？删除后子权限也会被删除，此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => handleDelete(permission.id),
    });
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

  const handleDrawerOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (drawerType === 'add') {
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
      } else if (drawerType === 'edit' && currentPermission) {
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

      setIsDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerCancel = () => {
    setIsDrawerVisible(false);
    form.resetFields();
  };

  const getDrawerTitle = () => {
    switch (drawerType) {
      case 'add':
        return '新增权限';
      case 'edit':
        return '编辑权限';
      default:
        return '权限管理';
    }
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
              placeholder="搜索权限名称、编码或描述"
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
              {isMobile ? '新增' : '新增权限'}
            </Button>
          </Col>
        </Row>

        <Table
          columns={isMobile ? mobileColumns : adjustColumnWidths(desktopColumns, isMobile)}
          dataSource={filteredPermissions}
          rowKey="id"
          loading={loading}
          {...getTableConfig()}
          pagination={{
            total: filteredPermissions.length,
            pageSize: isMobile ? 10 : 20,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile ? undefined : (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
            showLessItems: isMobile,
            pageSizeOptions: isMobile ? ['5', '10'] : ['10', '20', '50', '100'],
          }}
        />
      </Card>

      <Drawer
        title={getDrawerTitle()}
        placement="right"
        width={isMobile ? '100%' : 600}
        onClose={handleDrawerCancel}
        open={isDrawerVisible}
        footer={null}
      >
        <div style={{ paddingBottom: '80px' }}>
          <Form
            form={form}
            layout="vertical"
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
        </div>
        
        {/* 底部固定按钮 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Button onClick={handleDrawerCancel}>
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={handleDrawerOk}
            loading={loading}
          >
            确定
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default PermissionManagement;