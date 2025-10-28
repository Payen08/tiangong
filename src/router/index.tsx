import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import Layout from '@/components/Layout';

// 创建加载组件的包装器
const createLazyComponent = (importFunc: () => Promise<any>) => {
  const LazyComponent = lazy(importFunc);
  return () => (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><Spin size="large" /></div>}>
      <LazyComponent />
    </Suspense>
  );
};

// 动态导入所有页面组件
const Login = createLazyComponent(() => import('@/pages/Login'));
const Home = createLazyComponent(() => import('@/pages/Home'));

// 系统管理模块
const UserManagement = createLazyComponent(() => import('@/pages/SystemManagement/UserManagement'));
const RoleManagement = createLazyComponent(() => import('@/pages/SystemManagement/RoleManagement'));
const PermissionManagement = createLazyComponent(() => import('@/pages/SystemManagement/PermissionManagement'));
const SystemLogs = createLazyComponent(() => import('@/pages/SystemManagement/SystemLogs'));
const SystemUpgrade = createLazyComponent(() => import('@/pages/SystemManagement/SystemUpgrade'));
const CrossMapConnectionManagement = createLazyComponent(() => import('@/pages/SystemManagement/CrossMapConnection'));

// 产品管理模块
const ProductManagement = createLazyComponent(() => import('@/pages/ProductManagement/index'));
const AddProduct = createLazyComponent(() => import('@/pages/ProductManagement/AddProduct'));

// 设备管理模块
const DeviceManagement = createLazyComponent(() => import('@/pages/DeviceManagement/index'));
const RobotDeviceDetail = createLazyComponent(() => import('@/pages/DeviceManagement/RobotDeviceDetail'));

// 场景管理模块
const MapManagement = createLazyComponent(() => import('@/pages/SceneManagement/MapManagement'));
const CrossMapPathGroupManagement = createLazyComponent(() => import('@/pages/SceneManagement/CrossMapPathGroup/index'));

// 调度管理模块
const BusinessProcess = createLazyComponent(() => import('@/pages/ScheduleManagement/BusinessProcess'));
const BusinessOrders = createLazyComponent(() => import('@/pages/ScheduleManagement/BusinessOrders'));
const BehaviorTree = createLazyComponent(() => import('@/pages/ScheduleManagement/BehaviorTree'));
const ActionSequence = createLazyComponent(() => import('@/pages/ScheduleManagement/ActionSequence'));

// 派遣管理模块
const TaskManagement = createLazyComponent(() => import('@/pages/DispatchManagement/TaskManagement'));
const IdleDockingManagement = createLazyComponent(() => import('@/pages/DispatchManagement/IdleDockingManagement'));
const AutoChargingManagement = createLazyComponent(() => import('@/pages/DispatchManagement/AutoChargingManagement'));

// 数据统计模块
const BusinessPerformance = createLazyComponent(() => import('@/pages/DataStatistics/BusinessPerformance'));
const RobotStatus = createLazyComponent(() => import('@/pages/DataStatistics/RobotStatus'));
const SchedulingSystem = createLazyComponent(() => import('@/pages/DataStatistics/SchedulingSystem'));
const ExceptionFault = createLazyComponent(() => import('@/pages/DataStatistics/ExceptionFault'));
const SpatialHeatmap = createLazyComponent(() => import('@/pages/DataStatistics/SpatialHeatmap'));

// 数字孪生模块
const DigitalTwin = createLazyComponent(() => import('@/pages/DigitalTwin'));




export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'field-control',
        element: <div>场控视图</div>, // Layout组件会处理这个路径
      },
      {
        path: 'digital-twin',
        element: <DigitalTwin />,
      },
      {
        path: 'digital-twin/editor',
        element: <div>数字孪生编辑器</div>, // Layout组件会处理这个路径
      },
      {
        path: 'scene',
        children: [
          {
            path: 'maps',
            element: <MapManagement />,
          },
          {
            path: 'cross-map-connections',
            element: <CrossMapConnectionManagement />,
          },
          {
            path: 'cross-map-path-groups',
            element: <CrossMapPathGroupManagement />,
          },
        ],
      },
      {
        path: 'resources',
        children: [
          {
            path: 'products',
            element: <ProductManagement />,
          },
          {
            path: 'products/add',
            element: <AddProduct />,
          },
          {
            path: 'devices',
            element: <DeviceManagement />,
          },
          {
            path: 'devices/robot/:id',
            element: <RobotDeviceDetail />,
          },
        ],
      },
      {
        path: 'schedule',
        children: [
          {
            path: 'business-process',
            element: <BusinessProcess />,
          },
          {
            path: 'business-orders',
            element: <BusinessOrders />,
          },
          {
            path: 'behavior-tree',
            element: <BehaviorTree />,
          },
          {
            path: 'action-sequence',
            element: <ActionSequence />,
          },
        ],
      },
      {
        path: 'dispatch',
        children: [
          {
            path: 'tasks',
            element: <TaskManagement />,
          },
          {
            path: 'idle-docking',
            element: <IdleDockingManagement />,
          },
          {
            path: 'auto-charging',
            element: <AutoChargingManagement />,
          },
        ],
      },
      {
        path: 'system',
        children: [
          {
            path: 'users',
            element: <UserManagement />,
          },
          {
            path: 'roles',
            element: <RoleManagement />,
          },
          {
            path: 'permissions',
            element: <PermissionManagement />,
          },
        ],
      },
      {
        path: 'data-statistics',
        children: [
          {
            path: 'business-performance',
            element: <BusinessPerformance />,
          },
          {
            path: 'robot-status',
            element: <RobotStatus />,
          },
          {
            path: 'scheduling-system',
            element: <SchedulingSystem />,
          },
          {
            path: 'exception-fault',
            element: <ExceptionFault />,
          },
          {
            path: 'spatial-heatmap',
            element: <SpatialHeatmap />,
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: 'logs',
            element: <SystemLogs />,
          },
          {
            path: 'upgrade',
            element: <SystemUpgrade />,
          },
        ],
      },
    ],
  },
]);