import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined, UserOutlined, TeamOutlined, SafetyOutlined, DatabaseOutlined, AppstoreOutlined, SettingOutlined, EnvironmentOutlined, NodeIndexOutlined, ShareAltOutlined, ScheduleOutlined, ApartmentOutlined, ClusterOutlined, MonitorOutlined, ControlOutlined, FileTextOutlined, ThunderboltOutlined, PartitionOutlined, AuditOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';

const routeMap: Record<string, { title: string; icon?: React.ReactNode }> = {
  '/': { title: '首页', icon: <HomeOutlined /> },
  '/field-control': { title: '场控视图', icon: <MonitorOutlined /> },
  '/scene': { title: '场景管理', icon: <EnvironmentOutlined /> },
  '/scene/maps': { title: '地图管理', icon: <NodeIndexOutlined /> },
  '/scene/cross-map-connections': { title: '跨地图连接', icon: <ShareAltOutlined /> },
  '/resources': { title: '资源管理', icon: <DatabaseOutlined /> },
  '/resources/products': { title: '产品管理', icon: <AppstoreOutlined /> },
  '/resources/products/add': { title: '新增产品', icon: <AppstoreOutlined /> },
  '/resources/devices': { title: '设备管理', icon: <SettingOutlined /> },
  '/system': { title: '系统管理', icon: <UserOutlined /> },
  '/system/users': { title: '用户管理', icon: <TeamOutlined /> },
  '/system/roles': { title: '角色管理', icon: <SafetyOutlined /> },
  '/system/permissions': { title: '权限管理', icon: <SafetyOutlined /> },
  '/dispatch': { title: '调度管理', icon: <ControlOutlined /> },
  '/dispatch/tasks': { title: '运单任务', icon: <FileTextOutlined /> },
  '/dispatch/idle-docking': { title: '空闲停靠', icon: <NodeIndexOutlined /> },
  '/dispatch/auto-charging': { title: '自动充电', icon: <ThunderboltOutlined /> },
  '/scene/cross-map-path-groups': { title: '跨地图路径组', icon: <ClusterOutlined /> },
  '/schedule': { title: '排程管理', icon: <ScheduleOutlined /> },
  '/schedule/business-process': { title: '业务流程', icon: <ApartmentOutlined /> },
  '/schedule/business-orders': { title: '业务订单', icon: <FileTextOutlined /> },
  '/schedule/behavior-tree': { title: '行为树管理', icon: <PartitionOutlined /> },
  '/schedule/action-sequence': { title: '动作序列', icon: <ThunderboltOutlined /> },
  '/admin': { title: '系统管理', icon: <SettingOutlined /> },
  '/admin/logs': { title: '系统日志', icon: <AuditOutlined /> },
  '/admin/upgrade': { title: '系统升级', icon: <CloudUploadOutlined /> },
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter((i: string) => i);
  
  const breadcrumbItems = [
    {
      title: (
        <Link to="/" className="flex items-center gap-1">
          <HomeOutlined />
          <span>首页</span>
        </Link>
      ),
    },
  ];

  let currentPath = '';
  pathSnippets.forEach((snippet: string) => {
    currentPath += `/${snippet}`;
    const route = routeMap[currentPath];
    if (route) {
      const isLast = currentPath === location.pathname;
      breadcrumbItems.push({
        title: isLast ? (
          <span className="flex items-center gap-1">
            {route.icon}
            <span>{route.title}</span>
          </span>
        ) : (
          <Link to={currentPath} className="flex items-center gap-1">
            {route.icon}
            <span>{route.title}</span>
          </Link>
        ),
      });
    }
  });

  return (
    <AntBreadcrumb
      items={breadcrumbItems}
      className="mb-4 px-0"
    />
  );
};

export default Breadcrumb;