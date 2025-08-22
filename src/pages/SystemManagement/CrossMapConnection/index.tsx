import React, { useState } from 'react';
import { Card, Table, Button, Input, Select, Space, Modal, message, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import AddCrossMapConnection from './AddCrossMapConnection.tsx';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface CrossMapConnection {
  id: string;
  name: string;
  type: '跨地图连接' | '跨区域连接';
  remark?: string;
  updateTime: string;
  updatedBy: string;
}

const CrossMapConnectionManagement: React.FC = () => {
  const [connections, setConnections] = useState<CrossMapConnection[]>([
    {
      id: '1',
      name: '生产区域A到仓储区域B连接',
      type: '跨地图连接',
      remark: '用于生产数据同步的跨地图连接配置',
      updateTime: '2024-01-16 14:30:25',
      updatedBy: '张三'
    },
    {
      id: '2',
      name: '办公区域到生产区域连接',
      type: '跨区域连接',
      remark: '办公区域与生产区域的数据交互连接',
      updateTime: '2024-01-15 09:15:10',
      updatedBy: '李四'
    },
    {
      id: '3',
      name: '仓储区域内部连接',
      type: '跨地图连接',
      remark: '仓储区域内不同楼层间的连接配置',
      updateTime: '2024-01-14 16:45:33',
      updatedBy: '王五'
    }
  ]);

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CrossMapConnection | null>(null);

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

  // 筛选数据并按更新时间倒序排序
  const filteredConnections = connections
    .filter(connection => {
      const matchesSearch = connection.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           (connection.remark && connection.remark.toLowerCase().includes(searchText.toLowerCase()));
      const matchesType = !typeFilter || connection.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // 按更新时间倒序排序，最新的在前面
      return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
    });

  // 移动端列配置
  const mobileColumns: ColumnsType<CrossMapConnection> = [
    {
      title: '连接信息',
      key: 'connectionInfo',
      fixed: 'left',
      render: (_: any, record: CrossMapConnection) => (
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
            <span>类型: {record.type}</span>
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
      render: (_: any, record: CrossMapConnection) => (
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
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              onClick={() => handleDelete(record.id)}
              size="small"
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<CrossMapConnection> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(200),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: CrossMapConnection) => (
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: getColumnWidth(120),
      align: 'left',
      ellipsis: true,
      render: (type: string) => (
        <Tooltip title={type}>
          <span>{type}</span>
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: CrossMapConnection, b: CrossMapConnection) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
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
      width: getColumnWidth(80),
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
      width: getColumnWidth(110),
      align: 'right',
      fixed: 'right',
      render: (_: any, record: CrossMapConnection) => (
        <Space size={4}>
          <Tooltip title="编辑连接">
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
          <Tooltip title="删除连接">
            <Button
              type="link"
              danger
              onClick={() => handleDelete(record.id)}
              size="small"
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

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

  const handleAdd = () => {
    setEditingConnection(null);
    setIsAddModalVisible(true);
  };

  const handleEdit = (connection: CrossMapConnection) => {
    setEditingConnection(connection);
    setIsAddModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个跨地图连接吗？',
      onOk: () => {
        setConnections(connections.filter(conn => conn.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handleModalClose = () => {
    setIsAddModalVisible(false);
    setEditingConnection(null);
  };

  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据刷新成功');
    }, 1000);
  };

  const handleSave = (connectionData: any) => {
    if (editingConnection) {
      // 编辑模式
      setConnections(connections.map(conn => 
        conn.id === editingConnection.id 
          ? { 
              ...conn, 
              ...connectionData,
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
          : conn
      ));
      message.success('编辑成功');
    } else {
      // 新增模式
      const newConnection: CrossMapConnection = {
        id: Date.now().toString(),
        ...connectionData,
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
      };
      setConnections([newConnection, ...connections]);
      message.success('新增成功');
    }
    handleModalClose();
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={10} lg={8} xl={isLargeScreen ? 10 : 8} xxl={12}>
            <Input
              placeholder="请输入连接名称或备注搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={12} sm={12} md={5} lg={4} xl={isLargeScreen ? 4 : 4} xxl={4}>
            <Select
              placeholder="全部类型"
              value={typeFilter || undefined}
              onChange={(value: string | undefined) => setTypeFilter(value || '')}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              <Option value="跨地图连接">跨地图连接</Option>
              <Option value="跨区域连接">跨区域连接</Option>
            </Select>
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
          <Col xs={6} sm={6} md={6} lg={8} xl={isLargeScreen ? 7 : 8} xxl={5}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增连接'}
            </Button>
          </Col>
        </Row>
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={filteredConnections}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredConnections.length,
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
          {...tableConfig}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <AddCrossMapConnection
        visible={isAddModalVisible}
        onClose={handleModalClose}
        onSave={handleSave}
        editData={editingConnection}
      />
    </div>
  );
};

export default CrossMapConnectionManagement;