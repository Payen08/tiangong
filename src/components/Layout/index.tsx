import React, { useEffect, useState } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Tabs } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  LogoutOutlined,
  SettingOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
  ScheduleOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  MonitorOutlined,
  ControlOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  PartitionOutlined,
  AuditOutlined,
  CloudUploadOutlined,
  BarChartOutlined,
  DashboardOutlined,
  RobotOutlined,
  ApiOutlined,
  ExceptionOutlined,
  HeatMapOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import Breadcrumb from './Breadcrumb';
import FieldControlView from '@/pages/FieldControlView';
import DigitalTwinEditor from '@/pages/DigitalTwin/Editor';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { collapsed, toggleSidebar } = useAppStore();
  const [activeTab, setActiveTab] = useState('basic-info');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 判断当前路径设置对应的标签页
  useEffect(() => {
    if (location.pathname === '/field-control') {
      setActiveTab('field-control');
    } else if (location.pathname === '/digital-twin' || location.pathname === '/digital-twin/editor') {
      setActiveTab('digital-twin');
    } else {
      setActiveTab('basic-info');
    }
  }, [location.pathname]);

  // 基础信息菜单项
  const basicInfoMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: 'scene',
      icon: <EnvironmentOutlined />,
      label: '场景管理',
      children: [
        {
          key: '/scene/maps',
          icon: <NodeIndexOutlined />,
          label: '地图管理',
        },
        {
          key: '/scene/cross-map-connections',
          icon: <ShareAltOutlined />,
          label: '跨地图连接',
        },
        {
          key: '/scene/cross-map-path-groups',
          icon: <ClusterOutlined />,
          label: '跨地图路径组',
        },
      ],
    },
    {
      key: 'resources',
      icon: <DatabaseOutlined />,
      label: '资源管理',
      children: [
        {
          key: '/resources/products',
          icon: <AppstoreOutlined />,
          label: '产品管理',
        },
        {
          key: '/resources/devices',
          icon: <SettingOutlined />,
          label: '设备管理',
        },
      ],
    },
    {
      key: 'schedule',
      icon: <ScheduleOutlined />,
      label: '排程管理',
      children: [
        {
          key: '/schedule/business-process',
          icon: <ApartmentOutlined />,
          label: '业务流程',
        },
        {
          key: '/schedule/business-orders',
          icon: <FileTextOutlined />,
          label: '业务订单',
        },
        {
          key: '/schedule/behavior-tree',
          icon: <PartitionOutlined />,
          label: '行为树管理',
        },
        {
          key: '/schedule/action-sequence',
          icon: <ThunderboltOutlined />,
          label: '动作序列',
        },
      ],
    },
    {
      key: 'dispatch',
      icon: <ControlOutlined />,
      label: '调度管理',
      children: [
        {
          key: '/dispatch/tasks',
          icon: <FileTextOutlined />,
          label: '运单任务',
        },
        {
          key: '/dispatch/idle-docking',
          icon: <NodeIndexOutlined />,
          label: '空闲停靠',
        },
        {
          key: '/dispatch/auto-charging',
          icon: <ThunderboltOutlined />,
          label: '自动充电',
        },
      ],
    },
    {
      key: 'data-statistics',
      icon: <BarChartOutlined />,
      label: '数据统计',
      children: [
        {
          key: '/data-statistics/business-performance',
          icon: <DashboardOutlined />,
          label: '业务与效能维度',
        },
        {
          key: '/data-statistics/robot-status',
          icon: <RobotOutlined />,
          label: '机器人状态维度',
        },
        {
          key: '/data-statistics/scheduling-system',
          icon: <ApiOutlined />,
          label: '调度系统维度',
        },
        {
          key: '/data-statistics/exception-fault',
          icon: <ExceptionOutlined />,
          label: '异常与故障维度',
        },
        {
          key: '/data-statistics/spatial-heatmap',
          icon: <HeatMapOutlined />,
          label: '空间与热力图维度',
        },
      ],
    },
    {
      key: 'system',
      icon: <UserOutlined />,
      label: '用户权限',
      children: [
        {
          key: '/system/users',
          icon: <TeamOutlined />,
          label: '用户管理',
        },
        {
          key: '/system/roles',
          icon: <SafetyOutlined />,
          label: '角色管理',
        },
        {
          key: '/system/permissions',
          icon: <SafetyOutlined />,
          label: '权限管理',
        },
      ],
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        {
          key: '/admin/logs',
          icon: <AuditOutlined />,
          label: '系统日志',
        },
        {
          key: '/admin/upgrade',
          icon: <CloudUploadOutlined />,
          label: '系统升级',
        },
      ],
    },
  ];

  // 场控视图菜单项
  const fieldControlMenuItems = [
    {
      key: '/field-control',
      icon: <MonitorOutlined />,
      label: '场控视图',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'field-control') {
      navigate('/field-control');
    } else if (key === 'digital-twin') {
      navigate('/digital-twin');
    } else {
      navigate('/');
    }
  };

  const getCurrentMenuItems = () => {
    return activeTab === 'field-control' ? fieldControlMenuItems : basicInfoMenuItems;
  };

  const tabItems = [
    {
      key: 'basic-info',
      label: '基础信息',
      icon: <DatabaseOutlined />,
    },
    {
      key: 'field-control',
      label: '场控视图',
      icon: <MonitorOutlined />,
    },
    {
      key: 'digital-twin',
      label: '数字孪生',
      icon: <BuildOutlined />,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  // 场控视图模式 - 移除左侧菜单栏，保留顶部Header
  if (activeTab === 'field-control' && location.pathname === '/field-control') {
    return (
      <AntLayout className="h-screen">
        <Header className="bg-white px-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg text-blue-600">管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              size="small"
              tabBarStyle={{
                marginBottom: 0,
                border: 'none'
              }}
            />
            <span className="text-gray-600">欢迎，{user?.name}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} className="cursor-pointer" />
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          <FieldControlView />
        </Content>
      </AntLayout>
    );
  }

  // 数字孪生编辑模式 - 移除左侧菜单栏和面包屑，保留顶部Header，直接渲染编辑组件
  if (activeTab === 'digital-twin' && location.pathname === '/digital-twin/editor') {
    return (
      <AntLayout className="h-screen">
        <Header className="bg-white px-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg text-blue-600">管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              size="small"
              tabBarStyle={{
                marginBottom: 0,
                border: 'none'
              }}
            />
            <span className="text-gray-600">欢迎，{user?.name}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} className="cursor-pointer" />
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          <DigitalTwinEditor />
        </Content>
      </AntLayout>
    );
  }

  // 数字孪生模式 - 移除左侧菜单栏和面包屑，保留顶部Header
  if (activeTab === 'digital-twin' && location.pathname === '/digital-twin') {
    return (
      <AntLayout className="h-screen">
        <Header className="bg-white px-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg text-blue-600">管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              size="small"
              tabBarStyle={{
                marginBottom: 0,
                border: 'none'
              }}
            />
            <span className="text-gray-600">欢迎，{user?.name}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} className="cursor-pointer" />
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </AntLayout>
    );
  }

  return (
    <AntLayout className="h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white"
        width={256}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className={`font-bold text-lg ${collapsed ? 'hidden' : 'block'}`}>
            管理系统
          </h1>
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getCurrentMenuItems()}
          onClick={handleMenuClick}
          className="border-r-0"
        />
      </Sider>
      <AntLayout>
        <Header className="bg-white px-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              className="text-lg"
            />
          </div>
          <div className="flex items-center gap-4">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              size="small"
              tabBarStyle={{
                marginBottom: 0,
                border: 'none'
              }}
            />
            <span className="text-gray-600">欢迎，{user?.name}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} className="cursor-pointer" />
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 overflow-auto">
          <div className="mx-6 my-4 min-h-[calc(100vh-112px)]">
            <Breadcrumb />
            <div className="bg-transparent">
              <Outlet />
            </div>
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;