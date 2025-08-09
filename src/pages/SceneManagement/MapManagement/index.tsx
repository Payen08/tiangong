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
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [loading, setLoading] = useState(false);

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

  // 表格列配置
  const columns: ColumnsType<MapData> = [
    {
      title: '地图名称',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      onHeaderCell: () => ({
          style: { paddingLeft: 18 }
        }),
      render: (text: string, record: MapData) => (
        <div style={{ paddingLeft: 14 }}>
          <div style={{ color: 'rgba(0, 0, 0, 0.88)' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: 500, marginTop: 4 }}>{record.version}</div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      align: 'left',
      render: (updateTime: string) => {
        const [date, time] = updateTime.split(' ');
        return (
          <div>
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
      align: 'left',
      render: (updateUser: string) => (
        <span style={{ color: 'rgba(0, 0, 0, 0.88)' }}>{updateUser}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      align: 'right',
      onHeaderCell: () => ({
        style: { paddingRight: 14 }
      }),
      render: (_: any, record: MapData) => (
        <div style={{ paddingRight: 10 }}>
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
              style={{ padding: 0 }}
            >
              更多
            </Button>
          </Dropdown>
        </div>
      ),
    },
  ];

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
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#666' }}>地图列表</Title>
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
                  columns={columns}
                  dataSource={mapData}
                  rowKey="id"
                  pagination={{
                    pageSize: 5, // 小屏模式下减少每页显示数量
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total: number, range: [number, number]) =>
                      `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                    style: {
                      marginLeft: '16px',
                      marginRight: '16px',
                    },
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
                  size="small"
                  style={{
                    '--ant-table-padding-horizontal': '8px',
                  } as React.CSSProperties}
                />
              </Card>
            </div>

          </Col>

          {/* 大屏幕下的右侧地图文件 */}
          <Col xs={0} lg={16} style={{ height: '100%' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#666' }}>地图文件</Title>
              {selectedMap ? (
                <Card
                  size="small"
                  bodyStyle={{ padding: 16, flex: 1, overflow: 'auto' }}
                  style={{ flex: 1 }}
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