import React from 'react';
import { Card, Row, Col, Statistic, List, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  SettingOutlined,
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WifiOutlined,
  DisconnectOutlined,
  DatabaseOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const statisticsData = [
    {
      title: '昨日运单总数',
      value: 1234,
      icon: <FileTextOutlined className="text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      title: '昨日完成运单数',
      value: 1156,
      icon: <CheckCircleOutlined className="text-green-500" />,
      color: 'bg-green-50',
    },
    {
      title: '在线设备数',
      value: 56,
      icon: <WifiOutlined className="text-orange-500" />,
      color: 'bg-orange-50',
    },
    {
      title: '离线设备数',
      value: 8,
      icon: <DisconnectOutlined className="text-red-500" />,
      color: 'bg-red-50',
    },
  ];

  const quickActions = [
    {
      title: '资源管理',
      description: 'myData',
      icon: <DatabaseOutlined />,
      action: () => navigate('/resources/products'),
    },
    {
      title: '排程管理',
      description: 'myFMS',
      icon: <ScheduleOutlined />,
      action: () => navigate('/schedule/business-process'),
    },
    {
      title: '排程管理',
      description: 'myRCS',
      icon: <DeploymentUnitOutlined />,
      action: () => navigate('/dispatch/tasks'),
    },
    {
      title: '数据统计',
      description: 'myRPT',
      icon: <BarChartOutlined />,
      action: () => navigate('/data-statistics/business-performance'),
    },
  ];

  interface Activity {
    title: string;
    time: string;
    type: string;
  }

  const recentActivities: Activity[] = [
    {
      title: '用户 张三 登录系统',
      time: '2024-01-15 10:30:00',
      type: 'login',
    },
    {
      title: '管理员 李四 创建了新角色',
      time: '2024-01-15 09:45:00',
      type: 'create',
    },
    {
      title: '用户 王五 修改了个人信息',
      time: '2024-01-15 09:20:00',
      type: 'update',
    },
    {
      title: '系统进行了安全更新',
      time: '2024-01-15 08:00:00',
      type: 'system',
    },
  ];

  const getActivityTag = (type: string) => {
    const tagMap: Record<string, { color: string; text: string }> = {
      login: { color: 'blue', text: '登录' },
      create: { color: 'green', text: '创建' },
      update: { color: 'orange', text: '更新' },
      system: { color: 'purple', text: '系统' },
    };
    const tag = tagMap[type] || { color: 'default', text: '其他' };
    return <Tag color={tag.color}>{tag.text}</Tag>;
  };

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              欢迎回来，{user?.name}！
            </h2>
            <p className="text-gray-600">
              今天是 {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">当前角色</p>
            <Tag color="blue" className="mt-1">{user?.role}</Tag>
          </div>
        </div>
      </Card>

      {/* 数据统计 */}
      <Row gutter={[16, 16]}>
        {statisticsData.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className={`${item.color} border-0`}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作" className="h-full">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Card
                    hoverable
                    className="text-center cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={action.action}
                  >
                    <div className="text-2xl text-blue-500 mb-2">
                      {action.icon}
                    </div>
                    <h4 className="font-medium mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 操作记录 */}
        <Col xs={24} lg={12}>
          <Card title="操作记录" className="h-full">
            <List
              dataSource={recentActivities}
              renderItem={(item: Activity) => (
                <List.Item>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <p className="mb-1">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                    <div className="ml-4">
                      {getActivityTag(item.type)}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统状态 */}
      <Card title="系统状态">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">服务状态</p>
              <p className="text-sm text-gray-500">正常运行</p>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">数据库</p>
              <p className="text-sm text-gray-500">连接正常</p>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="text-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium">缓存服务</p>
              <p className="text-sm text-gray-500">轻微延迟</p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Home;