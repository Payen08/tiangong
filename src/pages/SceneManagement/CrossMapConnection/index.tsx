import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Drawer,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AddCrossMapConnection from './AddCrossMapConnection';

const { Title } = Typography;
const { Option } = Select;

// 跨地图连接数据接口
interface CrossMapConnection {
  id: string;
  name: string;
  type: 'cross-floor' | 'cross-area';
  remark: string;
  updateTime: string;
  updateUser: string;
  createTime: string;
}

const CrossMapConnectionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<CrossMapConnection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<CrossMapConnection[]>([]);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CrossMapConnection | null>(null);

  // 检测屏幕尺寸
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  // 模拟数据
  const mockData: CrossMapConnection[] = [
    {
      id: '1',
      name: '1楼到2楼电梯连接',
      type: 'cross-floor',
      remark: '主楼电梯连接点',
      updateTime: '2024-01-15 14:30:25',
      updateUser: '张三',
      createTime: '2024-01-15 10:20:15',
    },
    {
      id: '2',
      name: 'A区到B区通道',
      type: 'cross-area',
      remark: '主要通道连接',
      updateTime: '2024-01-14 16:45:10',
      updateUser: '李四',
      createTime: '2024-01-14 09:15:30',
    },
    {
      id: '3',
      name: '2楼到3楼楼梯',
      type: 'cross-floor',
      remark: '紧急疏散通道',
      updateTime: '2024-01-13 11:20:45',
      updateUser: '王五',
      createTime: '2024-01-13 08:30:20',
    },
    {
      id: '4',
      name: 'C区到D区连廊',
      type: 'cross-area',
      remark: '空中连廊',
      updateTime: '2024-01-12 15:15:30',
      updateUser: '赵六',
      createTime: '2024-01-12 13:45:10',
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // 根据搜索文本过滤数据
    const filtered = connections.filter(connection =>
      connection.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredConnections(filtered);
  }, [connections, searchText]);

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number) => {
    if (isMobile) return baseWidth * 0.8;
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

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

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      // 按创建时间排序，最新的在前面
      const sortedData = mockData.sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
      setConnections(sortedData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingConnection(null);
    setDrawerVisible(true);
  };

  const handleEdit = (record: CrossMapConnection) => {
    setEditingConnection(record);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingConnection(null);
  };

  const handleConnectionCreated = (connectionData: any) => {
    if (editingConnection) {
      // 编辑模式
      setConnections(prev => 
        prev.map(item => item.id === editingConnection.id ? connectionData : item)
      );
      message.success('跨地图连接编辑成功');
    } else {
      // 新增模式
      setConnections(prev => [connectionData, ...prev]);
      message.success('跨地图连接创建成功');
    }
    setDrawerVisible(false);
    setEditingConnection(null);
  };

  const handleDelete = async (record: CrossMapConnection) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setConnections(prev => prev.filter(item => item.id !== record.id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };



  const getTypeTag = (type: string) => {
    const typeMap = {
      'cross-floor': { text: '跨楼层连接' },
      'cross-area': { text: '跨区域连接' },
    };
    const config = typeMap[type as keyof typeof typeMap] || { text: '未知' };
    return <span style={{ color: '#333' }}>{config.text}</span>;
  };

  // 移动端列配置
  const mobileColumns: ColumnsType<CrossMapConnection> = [
    {
      title: '连接信息',
      key: 'connectionInfo',
      fixed: 'left',
      render: (_: any, record: CrossMapConnection) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <Space size={4}>
              <ShareAltOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
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
            </Space>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            {getTypeTag(record.type)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>{record.updateUser}</span>
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
        <Space size={4} direction="vertical">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            style={{ padding: '0 4px' }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个跨地图连接吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Popconfirm>
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
      width: getColumnWidth(180),
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
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: CrossMapConnection, b: CrossMapConnection) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
      render: (updateTime: string) => {
        const [dateStr, timeStr] = updateTime.split(' ');
        return (
          <Tooltip title={updateTime}>
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
      dataIndex: 'updateUser',
      key: 'updateUser',
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
            <Popconfirm
              title="确定要删除这个跨地图连接吗？"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
                style={{ padding: '0 4px' }}
              >
                删除
              </Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 获取表格配置
  const tableConfig = getTableConfig(isMobile, isLargeScreen, desktopColumns.length);

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12} lg={10} xl={isLargeScreen ? 12 : 10} xxl={14}>
            <Input
              placeholder="请输入连接名称搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={7} xl={isLargeScreen ? 6 : 7} xxl={5}>
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
          <Col xs={12} sm={12} md={6} lg={7} xl={isLargeScreen ? 6 : 7} xxl={5}>
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
          scroll={tableConfig.scroll}
          size={tableConfig.size}
        />
      </Card>

      {/* 新增/编辑跨地图连接抽屉 */}
      <Drawer
        title={editingConnection ? '编辑跨地图连接' : '新增跨地图连接'}
        placement="right"
        width="100vw"
        onClose={handleDrawerClose}
        open={drawerVisible}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <AddCrossMapConnection 
          visible={drawerVisible}
          onClose={handleDrawerClose} 
          onConnectionCreated={handleConnectionCreated}
          editingConnection={editingConnection}
        />
      </Drawer>
    </div>
  );
};

export default CrossMapConnectionManagement;