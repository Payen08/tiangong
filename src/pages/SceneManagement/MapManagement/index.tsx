import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Dropdown,
  Tag,
  Row,
  Col,
  Avatar,
  Typography,
  Divider,
  Badge,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  ExportOutlined,
  EyeOutlined,
  FileImageOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

// 地图数据类型
interface MapData {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive';
  thumbnail: string;
  description: string;
  createTime: string;
  updateTime: string;
  updateUser: string;
}

// 地图文件数据类型
interface MapFile {
  id: string;
  name: string;
  thumbnail: string;
  status: 'active' | 'inactive';
  format: string;
}

const MapManagement: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
      setIsSmallScreen(width < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 动态列宽计算函数
  const getColumnWidth = (baseWidth: number): number => {
    if (isMobile) return Math.max(baseWidth * 0.8, 80);
    if (isLargeScreen) return baseWidth * 1.2;
    return baseWidth;
  };

  // 表格配置函数
  const getTableConfig = (mobile: boolean, large: boolean, columnCount: number) => {
    if (mobile) {
      return {
        scroll: { x: Math.max(columnCount * 120, 600) },
        size: 'small' as const,
      };
    }
    return {
      scroll: large ? { x: 'max-content' } : undefined,
      size: 'middle' as const,
    };
  };

  // 列宽调整函数
  const adjustColumnWidths = (columns: ColumnsType<MapData>, mobile: boolean) => {
    return columns.map((col: any) => ({
      ...col,
      width: col.width ? getColumnWidth(col.width as number) : undefined,
    }));
  };

  // 模拟地图数据
  const mapData: MapData[] = [
    {
      id: '1',
      name: '一楼平面图',
      version: 'v1.2.3',
      status: 'active',
      thumbnail: '/api/placeholder/300/200',
      description: '办公楼一楼的详细平面图，包含所有房间和设施信息',
      createTime: '2024-01-15',
      updateTime: '2024-03-20 14:30:25',
      updateUser: '张三',
    },
    {
      id: '2',
      name: '二楼平面图',
      version: 'v1.1.0',
      status: 'inactive',
      thumbnail: '/api/placeholder/300/200',
      description: '办公楼二楼的详细平面图，包含会议室和办公区域',
      createTime: '2024-01-10',
      updateTime: '2024-03-15 09:15:42',
      updateUser: '李四',
    },
    {
      id: '3',
      name: '地下停车场',
      version: 'v2.0.1',
      status: 'active',
      thumbnail: '/api/placeholder/300/200',
      description: '地下停车场布局图，包含车位分配和通道信息',
      createTime: '2024-02-01',
      updateTime: '2024-03-25 16:45:18',
      updateUser: '王五',
    },
  ];

  // 初始化时默认选中第一条地图数据
  useEffect(() => {
    if (mapData.length > 0) {
      setSelectedMap(mapData[0]);
    }
  }, []);

  // 模拟地图文件数据
  const getMapFiles = (mapId: string): MapFile[] => {
    const fileSets: Record<string, MapFile[]> = {
      '1': [
        {
          id: 'f1-1',
          name: '一楼平面图.dwg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
        },
        {
          id: 'f1-2',
          name: '一楼布局图.pdf',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'PDF',
        },
        {
          id: 'f1-3',
          name: '一楼设备图.jpg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'JPG',
        },
        {
          id: 'f1-4',
          name: '一楼导航图.svg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'SVG',
        },
      ],
      '2': [
        {
          id: 'f2-1',
          name: '二楼平面图.dwg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
        },
        {
          id: 'f2-2',
          name: '二楼会议室布局.pdf',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'PDF',
        },
      ],
      '3': [
        {
          id: 'f3-1',
          name: '停车场布局图.dwg',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
        },
      ],
    };
    return fileSets[mapId] || [];
  };

  // 基础表格列配置
  const baseColumns: ColumnsType<MapData> = [
    {
      title: '地图名称',
      dataIndex: 'name',
      key: 'name',
      width: getColumnWidth(150),
      align: 'left',
      fixed: 'left',
      ellipsis: true,
      render: (text: string, record: MapData) => (
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500, marginTop: 4 }}>{record.version}</div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: getColumnWidth(160),
      align: 'left',
      sorter: (a: MapData, b: MapData) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
      render: (updateTime: string) => {
        const [date, time] = updateTime.split(' ');
        return (
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'rgba(0, 0, 0, 0.88)' }}>{date}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>{time}</div>
          </div>
        );
      },
    },
    {
      title: '更新人',
      dataIndex: 'updateUser',
      key: 'updateUser',
      width: getColumnWidth(100),
      align: 'left',
      ellipsis: true,
      render: (updateUser: string) => (
        <span style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 500 }}>{updateUser}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: getColumnWidth(80),
      align: 'center',
      fixed: 'right',
      render: (_: any, record: MapData) => (
        <Space size={4}>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑',
                  onClick: () => handleEdit(record),
                },
                {
                  key: 'settings',
                  icon: <SettingOutlined />,
                  label: '设置',
                  onClick: () => handleSettings(record),
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  danger: true,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button
              type="link"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              size="small"
              style={{ padding: '0 4px' }}
            >
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 移动端简化列配置
   const mobileColumns: ColumnsType<MapData> = [
     {
       title: '地图信息',
       key: 'mapInfo',
       render: (_: any, record: MapData) => {
        const [date, time] = record.updateTime.split(' ');
        return (
          <div style={{ padding: '8px 0' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 8 
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: 'rgba(0, 0, 0, 0.88)', 
                  fontWeight: 500, 
                  fontSize: '14px',
                  marginBottom: 4 
                }}>
                  {record.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#1890ff', 
                  fontWeight: 500 
                }}>
                  {record.version}
                </div>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      icon: <EditOutlined />,
                      label: '编辑',
                      onClick: () => handleEdit(record),
                    },
                    {
                      key: 'settings',
                      icon: <SettingOutlined />,
                      label: '设置',
                      onClick: () => handleSettings(record),
                    },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除',
                      danger: true,
                      onClick: () => handleDelete(record),
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Button
                  type="link"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  size="small"
                  icon={<MoreOutlined />}
                />
              </Dropdown>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              color: '#666' 
            }}>
              <span>{date} {time}</span>
              <span>更新人: {record.updateUser}</span>
            </div>
          </div>
        );
      },
    },
  ].filter((col: any) => col);

  // 根据屏幕大小选择列配置
  const filteredColumns = isMobile ? mobileColumns : baseColumns;
  
  // 应用动态列宽调整
  const desktopColumns = adjustColumnWidths(filteredColumns, isMobile);

  // 获取表格配置
  const tableConfig = getTableConfig(isMobile, isLargeScreen, desktopColumns.length);

  // 处理行点击
  const handleRowClick = (record: MapData) => {
    setSelectedMap(record);
  };

  // 操作处理函数
  const handleEdit = (record: MapData) => {
    console.log('编辑地图:', record);
  };

  const handleDelete = (record: MapData) => {
    console.log('删除地图:', record);
  };

  const handleSettings = (record: MapData) => {
    console.log('地图设置:', record);
  };

  const handleEnable = (record: MapData) => {
    console.log('启用地图:', record);
  };

  const handleSync = (record: MapData) => {
    console.log('同步地图:', record);
  };

  const handleExport = (record: MapData) => {
    console.log('导出地图:', record);
  };

  const handleFileAction = (file: MapFile, action: string) => {
    console.log(`${action} 文件:`, file);
  };

  const handleDownload = (file: MapFile) => {
    console.log('下载文件:', file);
  };

  const handleDeleteFile = (file: MapFile) => {
    console.log('删除文件:', file);
  };

  const handleEnableFile = (file: MapFile) => {
    console.log('启用文件:', file);
  };

  const handleSyncFile = (file: MapFile) => {
    console.log('同步文件:', file);
  };

  const handleViewDetails = (file: MapFile) => {
    console.log('查看详情:', file);
  };



  // 渲染展开的地图文件内容
  const renderExpandedRow = (record: MapData) => {
    const files = getMapFiles(record.id);
    return (
      <div style={{ padding: '16px 0' }}>
        <Row gutter={[16, 16]}>
          {files.map((file) => (
            <Col xs={24} sm={12} md={8} key={file.id}>
              <Card
                size="small"
                hoverable
                cover={
                  <img
                    alt={file.name}
                    src={file.thumbnail}
                    style={{
                      height: 120,
                      objectFit: 'cover',
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                }
                actions={[
                  <DownloadOutlined
                    key="download"
                    onClick={() => handleDownload(file)}
                    title="下载"
                  />,
                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDeleteFile(file)}
                    title="删除"
                  />,
                  <PlayCircleOutlined
                    key="enable"
                    onClick={() => handleEnableFile(file)}
                    title="启用"
                  />,
                  <SyncOutlined
                    key="sync"
                    onClick={() => handleSyncFile(file)}
                    title="同步"
                  />,
                  <EyeOutlined
                    key="details"
                    onClick={() => handleViewDetails(file)}
                    title="详情"
                  />,
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      <div style={{ marginBottom: 4 }}>{file.name}</div>
                    </div>
                  }
                  description={null}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card 
        title="地图管理" 
        style={{ 
          height: isSmallScreen ? 'auto' : 'calc(100vh - 120px)',
          minHeight: isSmallScreen ? 'calc(100vh - 120px)' : 'auto'
        }}
        bodyStyle={{ 
          padding: 16, 
          height: isSmallScreen ? 'auto' : 'calc(100% - 57px)'
        }}
      >
        <Row gutter={16} style={{ height: isSmallScreen ? 'auto' : '100%' }}>
          {/* 左侧地图列表 */}
          <Col xs={24} lg={8} style={{ height: isSmallScreen ? 'auto' : '100%' }}>
            <div style={{ 
              height: isSmallScreen ? 'auto' : '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12 
              }}>
                <Title level={5} style={{ margin: 0, color: '#666' }}>地图列表</Title>
                <Button 
                  type="primary" 
                  size={isMobile ? 'large' : 'small'}
                  style={{ minWidth: isMobile ? 'auto' : '60px' }}
                >
                  {isMobile ? '新增' : '新增'}
                </Button>
              </div>
              <Card
                size="small"
                bodyStyle={{ 
                  padding: 0, 
                  flex: isSmallScreen ? 'none' : 1, 
                  overflow: isSmallScreen ? 'visible' : 'auto'
                }}
                style={{ flex: isSmallScreen ? 'none' : 1 }}
              >
                <Table
                  columns={isMobile ? mobileColumns : desktopColumns}
                  dataSource={mapData}
                  rowKey="id"
                  pagination={{
                    total: mapData.length,
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
                  expandable={{
                    // 小屏模式下启用展开功能
                    expandedRowRender: isSmallScreen ? renderExpandedRow : undefined,
                    expandRowByClick: isSmallScreen,
                    expandedRowKeys: isSmallScreen && selectedMap ? [selectedMap.id] : [],
                    onExpand: (expanded: boolean, record: MapData) => {
                      if (isSmallScreen) {
                        setSelectedMap(expanded ? record : null);
                      }
                    },
                    showExpandColumn: isSmallScreen,
                  }}
                  onRow={(record: MapData) => ({
                    onClick: () => {
                      if (!isSmallScreen) {
                        handleRowClick(record);
                      }
                    },
                    style: {
                      cursor: 'pointer',
                      backgroundColor:
                        selectedMap?.id === record.id ? '#f0f8ff' : 'transparent',
                    },
                  })}
                  scroll={tableConfig.scroll}
                  size={tableConfig.size}
                />
              </Card>
            </div>
          </Col>

          {/* 右侧地图文件 - 大屏幕显示 */}
          <Col xs={0} lg={16} style={{ height: '100%' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#666' }}>地图文件</Title>
              {selectedMap ? (
        <Card 
          title={`地图文件 - ${selectedMap.name}`}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            {getMapFiles(selectedMap.id).map((file) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={file.id}>
                <Card
                  size="small"
                          hoverable
                          cover={
                            <img
                              alt={file.name}
                              src={file.thumbnail}
                              style={{
                                height: 120,
                                objectFit: 'cover',
                                backgroundColor: '#f5f5f5',
                              }}
                            />
                          }
                          actions={[
                            <DownloadOutlined
                              key="download"
                              onClick={() => handleDownload(file)}
                              title="下载"
                            />,
                            <DeleteOutlined
                              key="delete"
                              onClick={() => handleDeleteFile(file)}
                              title="删除"
                            />,
                            <PlayCircleOutlined
                              key="enable"
                              onClick={() => handleEnableFile(file)}
                              title="启用"
                            />,
                            <SyncOutlined
                              key="sync"
                              onClick={() => handleSyncFile(file)}
                              title="同步"
                            />,
                            <EyeOutlined
                              key="details"
                              onClick={() => handleViewDetails(file)}
                              title="详情"
                            />,
                          ]}
                        >
                          <Card.Meta
                            title={
                              <div>
                                <div style={{ marginBottom: 4 }}>{file.name}</div>
                              </div>
                            }
                            description={null}
                          />
                        </Card>
                       </Col>
                     ))}
                   </Row>
                 </Card>
               ) : (
                 <Card
                   size="small"
                   bodyStyle={{
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     flex: 1,
                     minHeight: '200px'
                   }}
                   style={{ flex: 1 }}
                 >
                   <div style={{ textAlign: 'center' }}>
                     <FileImageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                     <div style={{ marginTop: 16, color: '#999' }}>
                       请从左侧列表选择一个地图查看文件
                     </div>
                   </div>
                 </Card>
               )}
             </div>
           </Col>
         </Row>
       </Card>
     </div>
   );
};

export default MapManagement;