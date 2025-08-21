import React, { useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd';
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
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '@/store';
import Breadcrumb from './Breadcrumb';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { collapsed, toggleSidebar } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const menuItems = [
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
      key: 'system',
      icon: <UserOutlined />,
      label: '系统管理',
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
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

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
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0"
        />
      </Sider>
      <AntLayout>
        <Header className="bg-white px-4 flex items-center justify-between border-b border-gray-200">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className="text-lg"
          />
          <div className="flex items-center gap-4">
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