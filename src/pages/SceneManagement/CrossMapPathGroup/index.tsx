import React, { useState } from 'react';
import { Card, Table, Button, Input, Select, Space, Modal, message, Row, Col, Tooltip, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import AddCrossMapPathGroup from './AddCrossMapPathGroup';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface PathGroupItem {
  id: string;
  name: string;
  mapName: string;
  pathGroups: string[];
}

interface CrossMapPathGroup {
  id: string;
  name: string;
  description?: string;
  items: PathGroupItem[];
  updateTime: string;
  updatedBy: string;
}

const CrossMapPathGroupManagement: React.FC = () => {
  const [pathGroups, setPathGroups] = useState<CrossMapPathGroup[]>([
    {
      id: '1',
      name: '生产区域路径组配置',
      description: '生产区域内各地图的路径组配置管理',
      items: [
        {
          id: 'item_1_1',
          name: '生产区域路径组配置',
          mapName: '一楼生产车间',
          pathGroups: ['路径组A', '路径组B', '路径组C']
        },
        {
          id: 'item_1_2',
          name: '生产区域路径组配置',
          mapName: '二楼装配车间',
          pathGroups: ['路径组D', '路径组E']
        }
      ],
      updateTime: '2024-01-16 14:30:25',
      updatedBy: '张三'
    },
    {
      id: '2',
      name: '仓储区域路径组配置',
      description: '仓储区域跨楼层路径组配置',
      items: [
        {
          id: 'item_2_1',
          name: '仓储区域路径组配置',
          mapName: '地下一层仓库',
          pathGroups: ['入库路径组', '出库路径组', '盘点路径组']
        },
        {
          id: 'item_2_2',
          name: '仓储区域路径组配置',
          mapName: '地下二层仓库',
          pathGroups: ['货架路径组', '通道路径组']
        }
      ],
      updateTime: '2024-01-15 09:15:10',
      updatedBy: '李四'
    },
    {
      id: '3',
      name: '办公区域路径组配置',
      description: '办公区域内部路径组配置',
      items: [
        {
          id: 'item_3_1',
          name: '办公区域路径组配置',
          mapName: '三楼办公区',
          pathGroups: ['会议室路径组', '办公室路径组']
        }
      ],
      updateTime: '2024-01-14 16:45:33',
      updatedBy: '王五'
    }
  ]);

  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingPathGroup, setEditingPathGroup] = useState<CrossMapPathGroup | null>(null);

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
  const filteredPathGroups = pathGroups
    .filter(pathGroup => {
      const pathGroupName = pathGroup.name || '';
      const pathGroupDescription = pathGroup.description || '';
      
      const matchesSearch = pathGroupName.toLowerCase().includes(searchText.toLowerCase()) ||
                           pathGroupDescription.toLowerCase().includes(searchText.toLowerCase()) ||
                           pathGroup.items.some(item => 
                             item.mapName.toLowerCase().includes(searchText.toLowerCase()) ||
                             item.pathGroups.some(pg => pg.toLowerCase().includes(searchText.toLowerCase()))
                           );
      return matchesSearch;
    })
    .sort((a, b) => {
      return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
    });

  // 移动端列配置
  const mobileColumns: ColumnsType<CrossMapPathGroup> = [
    {
      title: '路径组信息',
      key: 'pathGroupInfo',
      fixed: 'left',
      render: (_: any, record: CrossMapPathGroup) => (
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
            <span>地图数量: {record.items.length}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>更新时间: {record.updateTime}</span>
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
      render: (_: any, record: CrossMapPathGroup) => (
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
  const desktopColumns: ColumnsType<CrossMapPathGroup> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(200),
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: CrossMapPathGroup) => (
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
      title: '地图',
      key: 'maps',
      width: getColumnWidth(150),
      align: 'left',
      render: (_: any, record: CrossMapPathGroup) => (
          <div>
            {record.items.map((item, index) => (
              <div key={item.id} style={{
                marginBottom: index < record.items.length - 1 ? '12px' : '0',
                paddingBottom: index < record.items.length - 1 ? '12px' : '0',
                borderBottom: index < record.items.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <span style={{ color: '#333', fontSize: '14px' }}>
                  {item.mapName}
                </span>
              </div>
            ))}
          </div>
        ),
    },
    {
      title: '路径组',
      key: 'pathGroups',
      width: getColumnWidth(250),
      align: 'left',
      render: (_: any, record: CrossMapPathGroup) => (
        <div>
          {record.items.map((item, index) => (
            <div key={item.id} style={{
              marginBottom: index < record.items.length - 1 ? '12px' : '0',
              paddingBottom: index < record.items.length - 1 ? '12px' : '0',
              borderBottom: index < record.items.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              {item.pathGroups.map((pathGroup, pathIndex) => (
                <Tag key={pathIndex} color="green" size="small" style={{ 
                  marginBottom: '2px',
                  marginRight: '4px'
                }}>
                  {pathGroup}
                </Tag>
              ))}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(140),
      align: 'left',
      ellipsis: true,
      sorter: (a: CrossMapPathGroup, b: CrossMapPathGroup) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
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
      render: (_: any, record: CrossMapPathGroup) => (
        <Space size={4}>
          <Tooltip title="编辑路径组">
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
          <Tooltip title="删除路径组">
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
      scrollWidth = Math.max(1200, columnCount * 180);
    } else {
      scrollWidth = Math.max(1000, columnCount * 150);
    }
    
    return {
      scroll: { x: scrollWidth },
      size: 'small' as const
    };
  };

  const tableConfig = getTableConfig(isMobile, isLargeScreen, desktopColumns.length);

  const handleAdd = () => {
    setEditingPathGroup(null);
    setIsAddModalVisible(true);
  };

  const handleEdit = (pathGroup: CrossMapPathGroup) => {
    setEditingPathGroup(pathGroup);
    setIsAddModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个跨地图路径组吗？',
      onOk: () => {
        setPathGroups(pathGroups.filter(pg => pg.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handleModalClose = () => {
    setIsAddModalVisible(false);
    setEditingPathGroup(null);
  };

  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据刷新成功');
    }, 1000);
  };

  const handleSave = (pathGroupData: any) => {
    console.log('接收到的路径组数据:', pathGroupData);
    
    if (editingPathGroup) {
      // 编辑模式
      setPathGroups(pathGroups.map(pg => 
        pg.id === editingPathGroup.id 
          ? { 
              ...pg, 
              ...pathGroupData,
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
          : pg
      ));
      message.success('跨地图路径组编辑成功');
    } else {
      // 新增模式
      const newPathGroup: CrossMapPathGroup = {
        id: Date.now().toString(),
        ...pathGroupData,
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
      setPathGroups([newPathGroup, ...pathGroups]);
      message.success('跨地图路径组创建成功');
    }
    handleModalClose();
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={12} lg={10} xl={isLargeScreen ? 12 : 10} xxl={14}>
            <Input
              placeholder="请输入名称、地图或路径组搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={12} sm={12} md={4} lg={4} xl={isLargeScreen ? 4 : 4} xxl={4}>
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
          <Col xs={12} sm={12} md={8} lg={10} xl={isLargeScreen ? 8 : 10} xxl={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              新增
            </Button>
          </Col>
        </Row>
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={filteredPathGroups}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredPathGroups.length,
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
      <AddCrossMapPathGroup
        visible={isAddModalVisible}
        onClose={handleModalClose}
        onSave={handleSave}
        editData={editingPathGroup}
        placement="right"
        width="66.67%"
      />
    </div>
  );
};

export default CrossMapPathGroupManagement;