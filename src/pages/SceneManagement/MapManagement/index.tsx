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
  Popover,
  Radio,
  Tooltip,
  Checkbox,
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
  ImportOutlined,
  CloudDownloadOutlined,
  FolderOpenOutlined,
  RobotOutlined,
  WifiOutlined,
  DisconnectOutlined,
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

// 机器人设备类型
interface RobotDevice {
  id: string;
  deviceName: string;
  deviceKey: string;
  deviceType: string;
  productName: string;
  isEnabled: boolean;
  currentStatus: string;
  isOnline: boolean;
  relatedMap: string;
  mapPosition: string;
  ipAddress: string;
  port: string;
  batteryLevel: number;
  updateTime: string;
  updatedBy: string;
  lastConnectTime: string;
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
  
  // 导入功能相关状态
  const [importPopoverVisible, setImportPopoverVisible] = useState(false);
  const [robotDrawerVisible, setRobotDrawerVisible] = useState(false);
  const [localImportDrawerVisible, setLocalImportDrawerVisible] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [robotDevices, setRobotDevices] = useState<RobotDevice[]>([]);
  const [robotMaps, setRobotMaps] = useState<string[]>([]);
  const [selectedRobotMaps, setSelectedRobotMaps] = useState<string[]>([]);
  const [localImportForm] = Form.useForm();
  const [localImportFile, setLocalImportFile] = useState<any>(null);
  
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

  // 初始化机器人设备数据
  useEffect(() => {
    const mockRobotDevices: RobotDevice[] = [
      {
        id: 'robot_001',
        deviceName: 'AGV-001',
        deviceKey: 'agv_001_key',
        deviceType: '机器人设备',
        productName: 'AGV自动导引车',
        isEnabled: true,
        currentStatus: '空闲',
        isOnline: true,
        relatedMap: '一楼平面图',
        mapPosition: '仓库A区',
        ipAddress: '192.168.1.101',
        port: '8080',
        batteryLevel: 85,
        updateTime: '2024-01-15 14:30:25',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 14:28:15'
      },
      {
        id: 'robot_002',
        deviceName: 'AMR-002',
        deviceKey: 'amr_002_key',
        deviceType: '机器人设备',
        productName: 'AMR移动机器人',
        isEnabled: true,
        currentStatus: '执行中',
        isOnline: true,
        relatedMap: '二楼平面图',
        mapPosition: '生产线B',
        ipAddress: '192.168.1.102',
        port: '8080',
        batteryLevel: 72,
        updateTime: '2024-01-15 15:20:10',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 15:18:05'
      },
      {
        id: 'robot_003',
        deviceName: 'MCR-003',
        deviceKey: 'mcr_003_key',
        deviceType: '机器人设备',
        productName: 'MCR清洁机器人',
        isEnabled: true,
        currentStatus: '充电中',
        isOnline: true,
        relatedMap: '三楼平面图',
        mapPosition: '办公区C',
        ipAddress: '192.168.1.103',
        port: '8080',
        batteryLevel: 45,
        updateTime: '2024-01-15 16:10:30',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 16:08:20'
      },
      {
        id: 'robot_004',
        deviceName: 'AGV-004',
        deviceKey: 'agv_004_key',
        deviceType: '机器人设备',
        productName: 'AGV自动导引车',
        isEnabled: false,
        currentStatus: '异常',
        isOnline: false,
        relatedMap: '一楼平面图',
        mapPosition: '维修区',
        ipAddress: '192.168.1.104',
        port: '8080',
        batteryLevel: 15,
        updateTime: '2024-01-15 12:45:15',
        updatedBy: '系统',
        lastConnectTime: '2024-01-15 11:30:45'
      }
    ];
    setRobotDevices(mockRobotDevices);
    // 默认选中第一台在线机器人
    const onlineRobots = mockRobotDevices.filter(robot => robot.isOnline && robot.isEnabled);
    if (onlineRobots.length > 0) {
      setSelectedRobot(onlineRobots[0].id);
    }
  }, []);

  // 监听选中机器人变化，获取机器人地图列表
  useEffect(() => {
    if (selectedRobot) {
      // 根据不同机器人配置不同的地图列表
      const robotMapConfig: Record<string, string[]> = {
        'robot_001': [
          '仓库A区地图_v1.3',
          '仓库A区导航图_v2.1',
          '一楼物流通道_v1.0',
          '货架布局图_v1.8'
        ],
        'robot_002': [
          '生产线B区地图_v2.2',
          '二楼作业区_v1.5',
          '设备布局图_v1.9',
          '安全通道图_v1.1',
          '质检区域图_v1.0'
        ],
        'robot_003': [
          '办公区C清洁路径_v1.7',
          '三楼办公区_v2.0',
          '会议室布局_v1.3',
          '休息区地图_v1.2'
        ],
        'robot_004': [
          '维修区域图_v1.0',
          '一楼维护通道_v1.4',
          '设备检修图_v2.1'
        ]
      };
      
      const maps = robotMapConfig[selectedRobot] || [];
      setRobotMaps(maps);
    } else {
      setRobotMaps([]);
    }
  }, [selectedRobot]);

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

  // 处理本地导入地图
  const handleLocalImport = async (values: any) => {
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
      
      // 将新地图添加到地图列表中
      const updatedMapData = [newMap, ...mapData];
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      setLocalImportDrawerVisible(false);
      localImportForm.resetFields();
      setLocalImportFile(null);
      message.success('地图导入成功！');
    } catch (error) {
      message.error('导入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理机器人地图导入
  const handleRobotImport = async () => {
    if (!selectedRobot || selectedRobotMaps.length === 0) {
      message.warning('请选择机器人和地图');
      return;
    }
    
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMaps: MapData[] = selectedRobotMaps.map((mapName, index) => ({
        id: `map_${Date.now()}_${index}`,
        name: mapName,
        version: '1.0.0',
        status: 'inactive',
        thumbnail: '/api/placeholder/150/100',
        description: `从机器人${selectedRobot}导入的地图`,
        createTime: new Date().toISOString().split('T')[0],
        updateTime: new Date().toISOString().split('T')[0],
        updateUser: '当前用户'
      }));
      
      // 将新地图添加到地图列表中
      const updatedMapData = [...newMaps, ...mapData];
      setMapData(updatedMapData);
      
      // 更新localStorage
      localStorage.setItem('mapData', JSON.stringify(updatedMapData));
      
      setRobotDrawerVisible(false);
      setSelectedRobot('');
      setSelectedRobotMaps([]);
      setRobotMaps([]);
      message.success(`成功导入${selectedRobotMaps.length}张地图！`);
    } catch (error) {
      message.error('导入失败，请重试');
    } finally {
      setLoading(false);
    }
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
                <Space size={8}>
                  <Popover
                    content={
                      <div style={{ width: 200 }}>
                        <div 
                          style={{ 
                            padding: '8px 12px', 
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            setImportPopoverVisible(false);
                            setLocalImportDrawerVisible(true);
                          }}
                        >
                          <Space>
                            <FolderOpenOutlined style={{ color: '#1890ff' }} />
                            <span>从本地导入</span>
                          </Space>
                        </div>
                        <div 
                          style={{ 
                            padding: '8px 12px', 
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            setImportPopoverVisible(false);
                            // 打开抽屉时自动选择第一个在线机器人
                            const onlineRobots = robotDevices.filter(robot => robot.isOnline && robot.isEnabled);
                            if (onlineRobots.length > 0 && !selectedRobot) {
                              setSelectedRobot(onlineRobots[0].id);
                            }
                            setRobotDrawerVisible(true);
                          }}
                        >
                          <Space>
                            <RobotOutlined style={{ color: '#52c41a' }} />
                            <span>从机器人拉取</span>
                          </Space>
                        </div>
                      </div>
                    }
                    title="导入地图"
                    trigger="click"
                    open={importPopoverVisible}
                    onOpenChange={setImportPopoverVisible}
                    placement="bottomRight"
                  >
                    <Button 
                      size={isMobile ? 'large' : 'small'}
                      icon={<ImportOutlined />}
                      style={{ minWidth: isMobile ? 'auto' : '60px' }}
                    >
                      {isMobile ? '导入' : '导入'}
                    </Button>
                  </Popover>
                  <Button 
                    type="primary" 
                    size={isMobile ? 'large' : 'small'}
                    style={{ minWidth: isMobile ? 'auto' : '60px' }}
                    onClick={() => setDrawerVisible(true)}
                    icon={<PlusOutlined />}
                  >
                    {isMobile ? '新增' : '新增'}
                  </Button>
                </Space>
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

       {/* 从机器人拉取地图侧滑抽屉 */}
       <Drawer
         title="从机器人拉取地图"
         width={`${Math.floor(window.innerWidth * 2 / 3)}px`}
         placement="right"
         onClose={() => {
           setRobotDrawerVisible(false);
           // 不清空选中的机器人，保持选中状态
         }}
         open={robotDrawerVisible}
         bodyStyle={{ padding: '24px' }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setRobotDrawerVisible(false);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               type="primary" 
               disabled={!selectedRobot || selectedRobotMaps.length === 0}
               onClick={() => handleRobotImport()}
               loading={loading}
             >
               确认导入 ({selectedRobotMaps.length})
             </Button>
           </div>
         }
       >
         <div>
           <div style={{ marginBottom: 24 }}>
             <Title level={5} style={{ margin: 0, marginBottom: 8 }}>选择在线机器人设备</Title>
             <div style={{ color: '#666', fontSize: '14px' }}>
               仅显示在线且已启用的机器人设备
             </div>
           </div>
           
           <Row gutter={[16, 16]}>
             {robotDevices
               .filter(robot => robot.isOnline && robot.isEnabled)
               .map(robot => (
                 <Col key={robot.id} xs={24} sm={12} md={8} lg={8} xl={8}>
                   <Card 
                     size="small" 
                     style={{ 
                       width: '100%',
                       border: selectedRobot === robot.id ? '2px solid #1890ff' : '1px solid #e8e8e8',
                       backgroundColor: selectedRobot === robot.id ? '#f0f9ff' : '#fff',
                       borderRadius: '8px',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       position: 'relative'
                     }}
                     bodyStyle={{ padding: '16px' }}
                     hoverable
                     onClick={() => setSelectedRobot(robot.id)}
                   >
                     {/* 选择按钮放在卡片内右上角 */}
                     <Radio 
                       checked={selectedRobot === robot.id}
                       style={{ 
                         position: 'absolute',
                         top: '12px',
                         right: '12px',
                         zIndex: 1
                       }}
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedRobot(robot.id);
                       }}
                     />
                     
                     <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingTop: '8px' }}>
                       <Avatar 
                         icon={<RobotOutlined />} 
                         style={{ 
                           backgroundColor: '#1890ff',
                           border: '2px solid #e6f7ff',
                           flexShrink: 0
                         }}
                         size={24}
                       />
                       <div style={{ flex: 1, textAlign: 'left' }}>
                         <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#262626' }}>
                           {robot.deviceName}
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                           <Badge 
                             status={robot.isOnline ? 'success' : 'error'} 
                             text={
                               <span style={{ fontSize: '13px', fontWeight: 500 }}>
                                 {robot.isOnline ? '在线' : '离线'}
                               </span>
                             }
                           />
                           <span style={{ color: '#666', fontSize: '12px' }}>
                             {robot.ipAddress}:{robot.port}
                           </span>
                           <span style={{ color: '#999', fontSize: '12px' }}>
                             最近连接: {robot.lastConnectTime}
                           </span>
                         </div>
                       </div>
                     </div>
                   </Card>
                 </Col>
               ))
             }
           </Row>
           
           {/* 机器人地图列表 */}
           {selectedRobot && robotMaps.length > 0 && (
             <div style={{ marginTop: 32 }}>
               <Divider orientation="left">
                 <Title level={5} style={{ margin: 0 }}>可拉取的地图列表</Title>
               </Divider>
               <div style={{ 
                 backgroundColor: '#fafafa', 
                 borderRadius: '8px', 
                 padding: '16px',
                 border: '1px solid #f0f0f0'
               }}>
                 <Row gutter={[8, 8]}>
                   {robotMaps.map((mapName, index) => {
                     // 模拟地图数据
                     const mapData = {
                       name: mapName,
                       size: `${(Math.random() * 50 + 10).toFixed(1)}MB`,
                       updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
                         year: 'numeric',
                         month: '2-digit',
                         day: '2-digit',
                         hour: '2-digit',
                         minute: '2-digit'
                       })
                     };
                     
                     return (
                       <Col key={index} xs={24} sm={12} md={8} lg={6} xl={6}>
                         <Card 
                           size="small"
                           style={{ 
                             borderRadius: '8px',
                             border: selectedRobotMaps.includes(mapName) ? '2px solid #1890ff' : '1px solid #e8e8e8',
                             backgroundColor: selectedRobotMaps.includes(mapName) ? '#f0f9ff' : '#fff',
                             cursor: 'pointer',
                             transition: 'all 0.3s ease',
                             position: 'relative',
                             height: '100px'
                           }}
                           bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
                           hoverable
                           onClick={() => {
                             const newSelected = selectedRobotMaps.includes(mapName)
                               ? selectedRobotMaps.filter(m => m !== mapName)
                               : [...selectedRobotMaps, mapName];
                             setSelectedRobotMaps(newSelected);
                           }}
                         >
                           {/* 多选框放在卡片内右上角 */}
                           <Checkbox 
                             checked={selectedRobotMaps.includes(mapName)}
                             style={{ 
                               position: 'absolute',
                               top: '12px',
                               right: '12px',
                               zIndex: 1
                             }}
                             onClick={(e) => {
                               e.stopPropagation();
                               const newSelected = selectedRobotMaps.includes(mapName)
                                 ? selectedRobotMaps.filter(m => m !== mapName)
                                 : [...selectedRobotMaps, mapName];
                               setSelectedRobotMaps(newSelected);
                             }}
                           />
                           
                           <div style={{ 
                             display: 'flex', 
                             flexDirection: 'column', 
                             justifyContent: 'center',
                             height: '100%',
                             paddingTop: '8px'
                           }}>
                             <div style={{ 
                               display: 'flex', 
                               flexDirection: 'column',
                               gap: '4px'
                             }}>
                               <span style={{ 
                                 fontSize: '14px', 
                                 fontWeight: 600, 
                                 color: '#262626'
                               }}>
                                 {mapData.name}
                               </span>
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '8px',
                                 flexWrap: 'wrap'
                               }}>
                                 <span style={{ 
                                   fontSize: '12px', 
                                   color: '#666'
                                 }}>
                                   大小: {mapData.size}
                                 </span>
                                 <span style={{ 
                                   fontSize: '12px', 
                                   color: '#999'
                                 }}>
                                   更新: {mapData.updateTime}
                                 </span>
                               </div>
                             </div>
                           </div>
                         </Card>
                       </Col>
                     );
                   })}
                 </Row>
               </div>
             </div>
           )}
           
           {robotDevices.filter(robot => robot.isOnline && robot.isEnabled).length === 0 && (
             <div style={{ 
               textAlign: 'center', 
               padding: '60px 20px',
               color: '#999',
               backgroundColor: '#fafafa',
               borderRadius: '8px',
               border: '1px dashed #d9d9d9'
             }}>
               <RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
               <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无可用的机器人设备</div>
               <div style={{ fontSize: '14px' }}>请确保机器人设备已上线并启用</div>
             </div>
           )}
         </div>
       </Drawer>

       {/* 本地导入地图侧滑弹窗 */}
       <Drawer
         title="本地导入地图"
         width={window.innerWidth * 2 / 3}
         onClose={() => {
           setLocalImportDrawerVisible(false);
           localImportForm.resetFields();
           setLocalImportFile(null);
         }}
         open={localImportDrawerVisible}
         bodyStyle={{ paddingBottom: 80 }}
         footer={
           <div style={{ textAlign: 'center' }}>
             <Button 
               onClick={() => {
                 setLocalImportDrawerVisible(false);
                 localImportForm.resetFields();
                 setLocalImportFile(null);
               }} 
               style={{ marginRight: 8 }}
             >
               取消
             </Button>
             <Button 
               onClick={() => localImportForm.submit()} 
               type="primary" 
               loading={loading}
             >
               确认导入
             </Button>
           </div>
         }
       >
         <Form
           form={localImportForm}
           layout="vertical"
           onFinish={handleLocalImport}
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
             label="地图文件"
             required
           >
             <Upload.Dragger
               name="mapFile"
               customRequest={({ onSuccess }) => {
                 setTimeout(() => {
                   onSuccess && onSuccess('ok');
                 }, 0);
               }}
               onChange={(info) => {
                 if (info.file.status === 'done') {
                   setLocalImportFile(info.file);
                   message.success(`${info.file.name} 文件上传成功`);
                 } else if (info.file.status === 'error') {
                   message.error(`${info.file.name} 文件上传失败`);
                 }
               }}
               showUploadList={false}
               accept=".map,.pgm,.yaml,.yml,.json"
               style={{ marginBottom: 16 }}
             >
               <p className="ant-upload-drag-icon">
                 <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
               </p>
               <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                 点击或拖拽文件到此区域上传
               </p>
               <p className="ant-upload-hint" style={{ color: '#999' }}>
                 支持 .map, .pgm, .yaml, .yml, .json 等地图格式
               </p>
               {localImportFile && (
                 <div style={{ 
                   marginTop: 12, 
                   padding: '8px 16px', 
                   background: '#f6ffed', 
                   border: '1px solid #b7eb8f',
                   borderRadius: 6,
                   color: '#52c41a'
                 }}>
                   <FileImageOutlined style={{ marginRight: 8 }} />
                   已上传: {localImportFile.name}
                 </div>
               )}
             </Upload.Dragger>
           </Form.Item>
         </Form>
       </Drawer>
    </div>
  );
};

export default MapManagement;