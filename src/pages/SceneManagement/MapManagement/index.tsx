import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Switch,
  Pagination,
  Drawer,
  Form,
  Input,
  Upload,
  message,
  Tabs,
  Modal,
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
  PlusOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
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
  const navigate = useNavigate();
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapFiles, setMapFiles] = useState<Record<string, MapFile[]>>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingMap, setEditingMap] = useState<MapData | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [editUploadedFile, setEditUploadedFile] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'front' | 'top' | 'side'>('front');
  
  // 响应式状态管理
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 992);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
      setIsSmallScreen(width < 992);
      
      // 根据屏幕大小设置默认每页大小
      const defaultPageSize = width < 768 ? 5 : width >= 1600 ? 15 : 10;
      setPageSize(defaultPageSize);
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

  // 地图数据状态
  const [mapData, setMapData] = useState<MapData[]>([]);

  // 初始化地图数据
  useEffect(() => {
    const defaultMapData: MapData[] = [
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

    // 从localStorage读取数据，如果没有则使用默认数据
    const savedMapData = localStorage.getItem('mapData');
    if (savedMapData) {
      try {
        const parsedData = JSON.parse(savedMapData);
        setMapData(parsedData);
        if (parsedData.length > 0) {
          setSelectedMap(parsedData[0]);
        }
      } catch (error) {
        console.error('解析localStorage数据失败:', error);
        setMapData(defaultMapData);
        setSelectedMap(defaultMapData[0]);
        localStorage.setItem('mapData', JSON.stringify(defaultMapData));
      }
    } else {
      setMapData(defaultMapData);
      setSelectedMap(defaultMapData[0]);
      localStorage.setItem('mapData', JSON.stringify(defaultMapData));
    }
  }, []);

  // 初始化地图文件数据
  useEffect(() => {
    const initialFileSets: Record<string, MapFile[]> = {
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
          status: 'inactive',
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
          status: 'inactive',
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
    setMapFiles(initialFileSets);
  }, []);

  // 获取地图文件数据
  const getMapFiles = (mapId: string): MapFile[] => {
    return mapFiles[mapId] || [];
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
            style={{ padding: '0 4px', fontSize: '12px' }}
          >
            更多
          </Button>
        </Dropdown>
      ),
    },
  ];

  // 移动端简化列配置
   const mobileColumns: ColumnsType<MapData> = [
     {
       title: '',  // 小屏不显示表头
       key: 'mapInfo',
       render: (_: any, record: MapData) => {
        const [date, time] = record.updateTime.split(' ');
        return (
          <div style={{ padding: '12px 8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 8 
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: 'rgba(0, 0, 0, 0.88)', 
                  fontWeight: 500, 
                  fontSize: '14px',
                  marginBottom: 4,
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {record.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#1890ff', 
                  fontWeight: 500,
                  marginBottom: 8
                }}>
                  版本: {record.version}
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
              fontSize: '11px', 
              color: '#666',
              lineHeight: '1.4'
            }}>
              <div style={{ marginBottom: 2 }}>
                更新时间: {date} {time}
              </div>
              <div>
                更新人: {record.updateUser}
              </div>
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
    setEditingMap(record);
    editForm.setFieldsValue({
      mapName: record.name,
      description: record.description,
    });
    setEditUploadedFile(null);
    setEditDrawerVisible(true);
  };

  const handleDelete = (record: MapData) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除地图 <strong>{record.name}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            删除后，该地图下的所有文件数据也将被删除，此操作不可恢复。
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          // 模拟删除API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 从mapData中删除该地图
          const updatedMapData = mapData.filter(map => map.id !== record.id);
          setMapData(updatedMapData);
          
          // 删除对应的地图文件数据
          const updatedMapFiles = { ...mapFiles };
          delete updatedMapFiles[record.id];
          setMapFiles(updatedMapFiles);
          
          // 更新localStorage
          localStorage.setItem('mapData', JSON.stringify(updatedMapData));
          
          // 如果删除的是当前选中的地图，重新选择第一个
          if (selectedMap?.id === record.id) {
            setSelectedMap(updatedMapData.length > 0 ? updatedMapData[0] : null);
          }
          
          message.success('地图删除成功！');
        } catch (error) {
          message.error('删除失败，请重试');
        } finally {
          setLoading(false);
        }
      },
    });
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

  const handleDownload = (file: MapFile) => {
    console.log('下载文件:', file);
  };

  const handleDeleteFile = (file: MapFile) => {
    console.log('删除文件:', file);
  };

  const handleDetail = (file: MapFile) => {
    console.log('查看文件详情:', file);
  };

  const handleEnableFile = (file: MapFile, mapId: string) => {
    console.log('启用文件:', file);
    
    // 更新地图文件状态，确保只有一个文件启用
    setMapFiles(prev => {
      const updatedFiles = { ...prev };
      const currentMapFiles = updatedFiles[mapId] || [];
      
      // 将当前地图的所有文件设为禁用
      const newFiles = currentMapFiles.map(f => ({
        ...f,
        status: f.id === file.id ? 'active' : 'inactive'
      })) as MapFile[];
      
      updatedFiles[mapId] = newFiles;
      return updatedFiles;
    });
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
            <Col xs={12} sm={8} md={6} lg={8} xl={6} key={file.id}>
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
                    onClick={() => handleEnableFile(file, record.id)}
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

  // 处理新增地图表单提交
  const handleAddMap = async (values: any) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMap: MapData = {
        id: `map_${Date.now()}`,
        name: values.mapName,
        version: '1.0.0',
        status: 'inactive',
        thumbnail: '/api/placeholder/150/100',
        description: values.description || '',
        createTime: new Date().toISOString().split('T')[0],
        updateTime: new Date().toISOString().split('T')[0],
        updateUser: '当前用户'
      };
      
      // 将新地图添加到地图列表中（添加到开头，保持按创建时间倒序）
      const updatedMapData = [newMap, ...mapData];
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      setDrawerVisible(false);
      form.resetFields();
      setUploadedFile(null);
      message.success('地图添加成功！');
    } catch (error) {
      message.error('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑地图表单提交
  const handleEditMap = async (values: any) => {
    if (!editingMap) return;

    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 更新地图数据
      const updatedMap: MapData = {
        ...editingMap,
        name: values.mapName,
        description: values.description || '',
        updateTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
        updateUser: '当前用户'
      };

      // 更新mapData中的数据
      const updatedMapData = mapData.map((map: MapData) => 
        map.id === editingMap.id ? updatedMap : map
      );
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      // 如果编辑的是当前选中的地图，更新选中状态
      if (selectedMap?.id === editingMap.id) {
        setSelectedMap(updatedMap);
      }

      setEditDrawerVisible(false);
      editForm.resetFields();
      setEditUploadedFile(null);
      setEditingMap(null);
      message.success('地图更新成功！');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploadedFile(info.file);
      setLoading(false);
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 处理编辑文件上传
  const handleEditFileUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setEditUploadedFile(info.file);
      setLoading(false);
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      setLoading(false);
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 自定义上传请求
  const customRequest = (options: any) => {
    const { onSuccess, onError, file } = options;
    
    // 模拟上传过程
    setTimeout(() => {
      if (file.type.includes('model') || file.name.endsWith('.obj') || file.name.endsWith('.fbx') || file.name.endsWith('.gltf')) {
        onSuccess(file);
      } else {
        onError(new Error('请上传3D模型文件'));
      }
    }, 1000);
  };

  // 渲染3D模型预览
  const render3DPreview = () => {
    if (!uploadedFile) {
      return (
        <div style={{ 
          height: 300, 
          border: '2px dashed #d9d9d9', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#999'
        }}>
          <FileImageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>请先上传3D模型文件</div>
        </div>
      );
    }

    return (
      <div style={{ height: 300, border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
        <Tabs 
          activeKey={previewMode}
          onChange={(key) => setPreviewMode(key as 'front' | 'top' | 'side')}
          items={[
            {
              key: 'front',
              label: '正视图',
              children: (
                <div style={{ 
                  height: 250, 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileImageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>3D模型正视图预览</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>文件: {uploadedFile.name}</div>
                  </div>
                </div>
              )
            },
            {
              key: 'top',
              label: '顶视图',
              children: (
                <div style={{ 
                  height: 250, 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileImageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>3D模型顶视图预览</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>文件: {uploadedFile.name}</div>
                  </div>
                </div>
              )
            },
            {
              key: 'side',
              label: '侧视图',
              children: (
                <div style={{ 
                  height: 250, 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileImageOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                    <div>3D模型侧视图预览</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>文件: {uploadedFile.name}</div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>
    );
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>地图管理</span>
          </div>
        }
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
          <Col xs={24} lg={10} style={{ height: isSmallScreen ? 'auto' : '100%', marginBottom: isSmallScreen ? 16 : 0 }}>
            <div style={{ 
              height: isSmallScreen ? 'auto' : '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12,
                height: '32px'
              }}>
                <Title level={5} style={{ margin: 0, color: '#666', fontSize: '16px', fontWeight: 500, lineHeight: '32px' }}>地图列表</Title>
                <Button 
                  type="primary" 
                  size={isMobile ? 'large' : 'small'}
                  style={{ minWidth: isMobile ? 'auto' : '60px' }}
                  onClick={() => setDrawerVisible(true)}
                  icon={<PlusOutlined />}
                >
                  {isMobile ? '新增' : '新增'}
                </Button>
              </div>
              <Card
                size="small"
                bodyStyle={{ 
                  padding: 0, 
                  flex: isSmallScreen ? 'none' : 1, 
                  overflow: isSmallScreen ? 'visible' : 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                style={{ flex: isSmallScreen ? 'none' : 1, display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <Table
                    columns={isMobile ? mobileColumns : desktopColumns}
                    dataSource={mapData.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    rowKey="id"
                    showHeader={!isMobile}  // 小屏时隐藏表头
                    pagination={false}  // 禁用表格内置分页器
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
                </div>
                {/* 外部分页器 */}
                <div style={{
                  borderTop: '1px solid #f0f0f0',
                  padding: isMobile ? '12px 8px' : '16px 24px',
                  backgroundColor: '#fff',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: isMobile ? '56px' : '64px'
                }}>
                  <Pagination
                    current={currentPage}
                    total={mapData.length}
                    pageSize={pageSize}
                    showSizeChanger={!isMobile}
                    showQuickJumper={!isMobile}
                    showTotal={isMobile ? undefined : (total: number, range: [number, number]) =>
                      `第 ${range[0]}-${range[1]} 条/共 ${total} 条`}
                    simple={isMobile}
                    size={isMobile ? 'small' : 'default'}
                    showLessItems={!isLargeScreen}
                    pageSizeOptions={isLargeScreen ? ['10', '15', '20', '50'] : ['10', '20', '50']}
                    onChange={(page: number, size?: number) => {
                       setCurrentPage(page);
                       if (size && size !== pageSize) {
                         setPageSize(size);
                         setCurrentPage(1); // 改变每页大小时重置到第一页
                       }
                     }}
                    style={{ 
                      margin: 0,
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                    className={isMobile ? 'mobile-pagination' : ''}
                  />
                </div>
              </Card>
            </div>
          </Col>

          {/* 右侧地图文件 - 大屏幕显示，小屏时也显示 */}
          <Col xs={0} lg={14} style={{ height: isSmallScreen ? 'auto' : '100%' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#666', fontSize: '16px', fontWeight: 500, lineHeight: '32px', height: '32px', display: 'flex', alignItems: 'center' }}>地图文件</Title>
              {selectedMap ? (
        <Card 
          title={`地图文件 - ${selectedMap.name}`}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            {getMapFiles(selectedMap.id).map((file) => (
              <Col xs={12} sm={8} md={6} lg={8} xl={6} key={file.id}>
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
                            <SyncOutlined
                              key="sync"
                              onClick={() => handleSync(selectedMap)}
                              title="同步"
                            />,
                            <EyeOutlined
                              key="detail"
                              onClick={() => handleDetail(file)}
                              title="详情"
                            />,
                          ]}
                        >
                          <Card.Meta
                            title={
                              <div>
                                <div style={{ marginBottom: 4 }}>{file.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                  <Switch
                                    size="small"
                                    checked={file.status === 'active'}
                                    onChange={(checked) => {
                                      if (checked) {
                                        handleEnableFile(file, selectedMap.id);
                                      }
                                    }}
                                  />
                                  <span style={{ fontSize: '12px', color: '#666' }}>
                                    {file.status === 'active' ? '启用' : '禁用'}
                                  </span>
                                </div>
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
       
       {/* 新增地图侧滑弹窗 */}
       <Drawer
         title="新增地图"
         width={window.innerWidth * 2 / 3}
         onClose={() => {
           setDrawerVisible(false);
           form.resetFields();
           setUploadedFile(null);
         }}
         open={drawerVisible}
         bodyStyle={{ paddingBottom: 80 }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setDrawerVisible(false);
                 form.resetFields();
                 setUploadedFile(null);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               onClick={() => form.submit()} 
               type="primary" 
               loading={loading}
             >
               确定
             </Button>
           </div>
         }
       >
         <Form
           form={form}
           layout="vertical"
           onFinish={handleAddMap}
           requiredMark={true}
         >
           <Form.Item
             name="mapName"
             label="地图名称"
             rules={[
               { required: true, message: '请输入地图名称' },
               { max: 50, message: '地图名称不能超过50个字符' },
               { 
                  validator: (_: any, value: string) => {
                    if (value && value.trim() === '') {
                      return Promise.reject(new Error('地图名称不能为空格'));
                    }
                    return Promise.resolve();
                  }
                }
             ]}
           >
             <Input 
               placeholder="请输入地图名称" 
               size="large"
             />
           </Form.Item>

           <Form.Item
             name="description"
             label="地图描述"
             rules={[
               { max: 200, message: '描述不能超过200个字符' }
             ]}
           >
             <Input.TextArea 
               placeholder="请输入地图描述（可选）" 
               rows={3}
               size="large"
             />
           </Form.Item>

           <Form.Item
             label="场景3D模型文件"
           >
             <Upload.Dragger
               name="modelFile"
               customRequest={customRequest}
               onChange={handleFileUpload}
               showUploadList={false}
               accept=".obj,.fbx,.gltf,.glb,.3ds,.dae"
               style={{ marginBottom: 16 }}
             >
               <p className="ant-upload-drag-icon">
                 <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
               </p>
               <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                 点击或拖拽文件到此区域上传
               </p>
               <p className="ant-upload-hint" style={{ color: '#999' }}>
                 支持 .obj, .fbx, .gltf, .glb, .3ds, .dae 等3D模型格式
               </p>
               {uploadedFile && (
                 <div style={{ 
                   marginTop: 12, 
                   padding: '8px 16px', 
                   background: '#f6ffed', 
                   border: '1px solid #b7eb8f',
                   borderRadius: 6,
                   color: '#52c41a'
                 }}>
                   <FileImageOutlined style={{ marginRight: 8 }} />
                   已上传: {uploadedFile.name}
                 </div>
               )}
             </Upload.Dragger>
           </Form.Item>

           {uploadedFile && (
             <Form.Item label="3D模型预览">
               {render3DPreview()}
             </Form.Item>
           )}
         </Form>
       </Drawer>

       {/* 编辑地图弹窗 */}
       <Drawer
         title="编辑地图"
         width="66.67%"
         placement="right"
         onClose={() => {
           setEditDrawerVisible(false);
           editForm.resetFields();
           setEditUploadedFile(null);
           setEditingMap(null);
         }}
         open={editDrawerVisible}
         bodyStyle={{ paddingBottom: 80 }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setEditDrawerVisible(false);
                 editForm.resetFields();
                 setEditUploadedFile(null);
                 setEditingMap(null);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               onClick={() => editForm.submit()} 
               type="primary" 
               loading={loading}
             >
               保存修改
             </Button>
           </div>
         }
       >
         <Form
           form={editForm}
           layout="vertical"
           onFinish={handleEditMap}
           requiredMark={true}
         >
           <Form.Item
             name="mapName"
             label="地图名称"
             rules={[
               { required: true, message: '请输入地图名称' },
               { max: 50, message: '地图名称不能超过50个字符' },
               { 
                  validator: (_: any, value: string) => {
                    if (value && value.trim() === '') {
                      return Promise.reject(new Error('地图名称不能为空格'));
                    }
                    return Promise.resolve();
                  }
                }
             ]}
           >
             <Input 
               placeholder="请输入地图名称" 
               size="large"
             />
           </Form.Item>

           <Form.Item
             name="description"
             label="地图描述"
             rules={[
               { max: 200, message: '描述不能超过200个字符' }
             ]}
           >
             <Input.TextArea 
               placeholder="请输入地图描述（可选）" 
               rows={3}
               size="large"
             />
           </Form.Item>

           <Form.Item
             label="场景3D模型文件"
           >
             <Upload.Dragger
               name="modelFile"
               customRequest={customRequest}
               onChange={handleEditFileUpload}
               showUploadList={false}
               accept=".obj,.fbx,.gltf,.glb,.3ds,.dae"
               style={{ marginBottom: 16 }}
             >
               <p className="ant-upload-drag-icon">
                 <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
               </p>
               <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                 点击或拖拽文件到此区域上传
               </p>
               <p className="ant-upload-hint" style={{ color: '#999' }}>
                 支持 .obj, .fbx, .gltf, .glb, .3ds, .dae 等3D模型格式
               </p>
               {editUploadedFile && (
                 <div style={{ 
                   marginTop: 12, 
                   padding: '8px 16px', 
                   background: '#f6ffed', 
                   border: '1px solid #b7eb8f',
                   borderRadius: 6,
                   color: '#52c41a'
                 }}>
                   <FileImageOutlined style={{ marginRight: 8 }} />
                   已上传: {editUploadedFile.name}
                 </div>
               )}
             </Upload.Dragger>
           </Form.Item>

           {editUploadedFile && (
             <Form.Item label="3D模型预览">
               {render3DPreview()}
             </Form.Item>
           )}
         </Form>
       </Drawer>
     </div>
   );
};

export default MapManagement;