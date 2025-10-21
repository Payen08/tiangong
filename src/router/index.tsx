import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import UserManagement from '@/pages/SystemManagement/UserManagement';
import RoleManagement from '@/pages/SystemManagement/RoleManagement';
import PermissionManagement from '@/pages/SystemManagement/PermissionManagement';
import SystemLogs from '@/pages/SystemManagement/SystemLogs';
import SystemUpgrade from '@/pages/SystemManagement/SystemUpgrade';
import ProductManagement from '@/pages/ProductManagement/index';
import AddProduct from '@/pages/ProductManagement/AddProduct';
import DeviceManagement from '@/pages/DeviceManagement/index';
import MapManagement from '@/pages/SceneManagement/MapManagement';
import CrossMapConnectionManagement from '@/pages/SystemManagement/CrossMapConnection';
import CrossMapPathGroupManagement from '@/pages/SceneManagement/CrossMapPathGroup/index';
import BusinessProcess from '@/pages/ScheduleManagement/BusinessProcess';
import BusinessOrders from '@/pages/ScheduleManagement/BusinessOrders';
import BehaviorTree from '@/pages/ScheduleManagement/BehaviorTree';
import ActionSequence from '@/pages/ScheduleManagement/ActionSequence';

import TaskManagement from '@/pages/DispatchManagement/TaskManagement';
import IdleDockingManagement from '@/pages/DispatchManagement/IdleDockingManagement';
import AutoChargingManagement from '@/pages/DispatchManagement/AutoChargingManagement';
import BusinessPerformance from '@/pages/DataStatistics/BusinessPerformance';
import RobotStatus from '@/pages/DataStatistics/RobotStatus';
import SchedulingSystem from '@/pages/DataStatistics/SchedulingSystem';
import ExceptionFault from '@/pages/DataStatistics/ExceptionFault';
import SpatialHeatmap from '@/pages/DataStatistics/SpatialHeatmap';
import DigitalTwin from '@/pages/DigitalTwin';




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