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
  message,
  // Popconfirm,
  Tree,
  Select,
  Row,
  Col,
  Drawer,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  // EyeOutlined,
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
  const [isPermissionDrawerVisible, setIsPermissionDrawerVisible] = useState(false);
  const [isAddDrawerVisible, setIsAddDrawerVisible] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
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
  const adjustColumnWidths = (columns: ColumnsType<Role>, isMobile: boolean): ColumnsType<Role> => {
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
    const scrollWidth = isMobile ? 'max-content' : isLargeScreen ? 1200 : 1000;
    return {
      scroll: { x: scrollWidth },
      size: isMobile ? 'small' : 'middle' as const
    };
  };

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

  // 移动端列配置
  const mobileColumns: ColumnsType<Role> = [
    {
      title: '角色信息',
      key: 'roleInfo',
      render: (_: any, record: Role) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            <Button
              type="link"
              style={{ color: '#1890ff', padding: 0, height: 'auto', fontWeight: 'bold' }}
              onClick={() => handleEdit(record)}
            >
              {record.name}
            </Button>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Tag color="blue" size="small">{record.code}</Tag>
          </div>
          <div style={{ marginTop: '4px' }}>
            <Tag color={record.status === 'active' ? 'success' : 'error'} size="small">
              {record.status === 'active' ? '启用' : '禁用'}
            </Tag>
            <span style={{ color: '#1890ff', fontWeight: 500, marginLeft: '8px' }}>
              {record.userCount}人
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      align: 'right',
      render: (_: any, record: Role) => {
        const isSuperAdmin = record.code === 'super_admin';
        return (
          <Space direction="vertical" size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            {!isSuperAdmin && (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteConfirm(record)}
              >
                删除
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
      sorter: (a: Role, b: Role) => a.name.localeCompare(b.name),
      render: (name: string, record: Role) => (
        <Button
          type="link"
          style={{ color: '#1890ff', padding: 0, height: 'auto', fontWeight: 'normal' }}
          onClick={() => handleEdit(record)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
      width: getColumnWidth(150),
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      width: getColumnWidth(100),
      sorter: (a: Role, b: Role) => a.userCount - b.userCount,
      render: (count: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>{count}</span>
      ),
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
      sorter: (a: Role, b: Role) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
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
      width: 150,
      fixed: 'right',
      align: 'right',
      render: (_: any, record: Role) => (
        <Space size="small">
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
          {record.code !== 'super_admin' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteConfirm(record)}
            >
              删除
            </Button>
          )}
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
    setCurrentRole(null);
    addForm.resetFields();
    setIsAddDrawerVisible(true);
  };

  const handleEdit = (role: Role) => {
    setCurrentRole(role);
    editForm.setFieldsValue(role);
    setIsEditDrawerVisible(true);
  };

  const handleAddDrawerClose = () => {
    setIsAddDrawerVisible(false);
    setCurrentRole(null);
    addForm.resetFields();
  };

  const handleEditDrawerClose = () => {
    setIsEditDrawerVisible(false);
    setCurrentRole(null);
    editForm.resetFields();
  };

  const handlePermission = (role: Role) => {
    setCurrentRole(role);
    setSelectedPermissions(role.permissions);
    setIsPermissionDrawerVisible(true);
  };

  const handleDeleteConfirm = (record: Role) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色 "${record.name}" 吗？删除后该角色下的用户将失去相应权限。`,
      onOk: () => {
        handleDelete(record.id);
      },
    });
  };

  const handleDelete = (id: string) => {
    setRoles(roles.filter((role) => role.id !== id));
    message.success('删除成功');
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      setLoading(true);

      const newRole: Role = {
        ...values,
        id: Date.now().toString(),
        permissions: [],
        userCount: 0,
        createTime: new Date().toLocaleString('zh-CN'),
      };
      setRoles([...roles, newRole]);
      message.success('添加成功');
      handleAddDrawerClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);

      if (currentRole) {
        const updatedRoles = roles.map((role) =>
          role.id === currentRole.id ? { ...role, ...values } : role
        );
        setRoles(updatedRoles);
        message.success('更新成功');
        handleEditDrawerClose();
      }
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
    setIsPermissionDrawerVisible(false);
  };

  // const handlePermissionCancel = () => {
  //   setIsPermissionDrawerVisible(false);
  // };

  const handlePermissionDrawerClose = () => {
    setIsPermissionDrawerVisible(false);
    setCurrentRole(null);
    setSelectedPermissions([]);
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
              placeholder="搜索角色名称、编码或描述"
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
              {isMobile ? '新增' : '新增角色'}
            </Button>
          </Col>
        </Row>

        <Table
          columns={isMobile ? mobileColumns : adjustColumnWidths(desktopColumns, isMobile)}
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          scroll={getTableConfig().scroll}
          size={getTableConfig().size}
          pagination={{
            total: filteredRoles.length,
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

      {/* 新增角色抽屉 */}
      <Drawer
        title="新增角色"
        placement="right"
        width={isMobile ? '100%' : 600}
        onClose={handleAddDrawerClose}
        open={isAddDrawerVisible}
        footer={null}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddSubmit}
          style={{ paddingBottom: '80px' }}
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
        
        {/* 底部固定按钮 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Button onClick={handleAddDrawerClose}>
            取消
          </Button>
          <Button 
            type="primary" 
            loading={loading}
            onClick={handleAddSubmit}
          >
            保存
          </Button>
        </div>
      </Drawer>

      {/* 编辑角色抽屉 */}
      <Drawer
        title="编辑角色"
        placement="right"
        width={isMobile ? '100%' : 600}
        onClose={handleEditDrawerClose}
        open={isEditDrawerVisible}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ paddingBottom: '80px' }}
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
        
        {/* 底部固定按钮 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Button onClick={handleEditDrawerClose}>
            取消
          </Button>
          <Button 
            type="primary" 
            loading={loading}
            onClick={handleEditSubmit}
          >
            保存
          </Button>
        </div>
      </Drawer>

      {/* 权限配置抽屉 */}
      <Drawer
        title={`配置权限 - ${currentRole?.name}`}
        placement="right"
        width={isMobile ? '100%' : 600}
        onClose={handlePermissionDrawerClose}
        open={isPermissionDrawerVisible}
        footer={null}
      >
        <div style={{ paddingBottom: '80px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>请选择该角色拥有的权限：</p>
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
        
        {/* 底部固定按钮 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Button onClick={handlePermissionDrawerClose}>
            取消
          </Button>
          <Button 
            type="primary" 
            loading={loading}
            onClick={handlePermissionOk}
          >
            保存
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default RoleManagement;