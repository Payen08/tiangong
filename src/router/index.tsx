import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import UserManagement from '@/pages/SystemManagement/UserManagement';
import RoleManagement from '@/pages/SystemManagement/RoleManagement';
import PermissionManagement from '@/pages/SystemManagement/PermissionManagement';
import ProductManagement from '@/pages/ProductManagement/index';
import AddProduct from '@/pages/ProductManagement/AddProduct';



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
    ],
  },
]);