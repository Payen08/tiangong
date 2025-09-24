import React from 'react';
import {
  Drawer,
  Card,
  Descriptions,
  Tag,
  Timeline,
  Typography,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useResponsive } from '@/hooks/useResponsive';
import BehaviorTreeCanvas from '@/components/BehaviorTreeCanvas';

const { Text } = Typography;

// 运单任务详情数据类型
interface TaskDetailRecord {
  id: string;
  taskName: string;
  executionDevice: string;
  targetDevice: string;
  status: '待执行' | '执行中' | '已暂停' | '已挂起' | '已取消' | '已完成' | '已关闭';
  endTime?: string;
  createTime: string;
  relatedBusinessOrder?: string; // 关联业务订单
}

// 执行详情数据类型
interface ExecutionDetail {
  id: string;
  time: string;
  action: string;
  status: 'success' | 'processing' | 'error' | 'warning';
}

// 行为树节点数据类型
/*
interface BehaviorTreeNode {
  id: string;
  title: string;
  type: string;
  status: 'success' | 'error' | 'warning' | 'processing';
  children?: BehaviorTreeNode[];
  inputs?: NodePort[];  // 输入端点
  outputs?: NodePort[]; // 输出端点
}
*/

// 节点端口类型
/*
interface NodePort {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: string; // 数据类型，如 'position', 'command', 'status' 等
}
*/

interface TaskDetailProps {
  visible: boolean;
  onClose: () => void;
  taskData: TaskDetailRecord | null;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ visible, onClose, taskData }) => {
  const { isMobile } = useResponsive();

  // 模拟执行详情数据
  const executionDetails: ExecutionDetail[] = [
    {
      id: '1',
      time: '2022-10-10 10:01:09',
      action: '移动->CNC1',
      status: 'success',
    },
    {
      id: '2',
      time: '2022-10-10 10:01:09',
      action: '开门',
      status: 'success',
    },
    {
      id: '3',
      time: '2022-10-10 10:01:09',
      action: '前进明细',
      status: 'error',
    },
  ];

  // 模拟行为树数据 - 按用户需求重新设计结构
   
  /*
  const behaviorTreeData: BehaviorTreeNode = {
    id: 'root',
    title: '树根',
    type: 'Root',
    status: 'success',
    outputs: [
      { id: 'root_out', name: '执行流', type: 'output', dataType: 'control' }
    ],
    children: [
      {
        id: 'sequence',
        title: '顺序节点',
        type: 'Sequence',
        status: 'success',
        inputs: [
          { id: 'seq_in', name: '控制输入', type: 'input', dataType: 'control' }
        ],
        outputs: [
          { id: 'seq_out1', name: '输出1', type: 'output', dataType: 'control' },
          { id: 'seq_out2', name: '输出2', type: 'output', dataType: 'control' }
        ],
        children: [
          {
            id: 'move',
            title: '移动节点',
            type: 'MoveToPosition',
            status: 'success',
            inputs: [
              { id: 'move_in_ctrl', name: '控制输入', type: 'input', dataType: 'control' },
              { id: 'move_in_pos', name: '目标位置', type: 'input', dataType: 'position' }
            ],
            outputs: [
              { id: 'move_out_ctrl', name: '控制输出', type: 'output', dataType: 'control' },
              { id: 'move_out_status', name: '移动状态', type: 'output', dataType: 'status' }
            ],
            children: [
              {
                id: 'move_cmd',
                title: '移动指令',
                type: 'Command',
                status: 'success',
                inputs: [
                  { id: 'cmd_in', name: '位置参数', type: 'input', dataType: 'position' }
                ],
                outputs: [
                  { id: 'cmd_out', name: '指令输出', type: 'output', dataType: 'command' }
                ]
              },
              {
                id: 'move_execute',
                title: '执行移动',
                type: 'Execute',
                status: 'success',
                inputs: [
                  { id: 'exec_in', name: '指令输入', type: 'input', dataType: 'command' }
                ],
                outputs: [
                  { id: 'exec_out', name: '执行结果', type: 'output', dataType: 'status' }
                ]
              }
            ]
          },
          {
            id: 'operation',
            title: '操作节点',
            type: 'Operation',
            status: 'processing',
            inputs: [
              { id: 'op_in_ctrl', name: '控制输入', type: 'input', dataType: 'control' },
              { id: 'op_in_data', name: '操作数据', type: 'input', dataType: 'data' }
            ],
            outputs: [
              { id: 'op_out_ctrl', name: '控制输出', type: 'output', dataType: 'control' },
              { id: 'op_out_result', name: '操作结果', type: 'output', dataType: 'result' }
            ],
            children: [
              {
                id: 'op_prepare',
                title: '准备操作',
                type: 'Prepare',
                status: 'success',
                inputs: [
                  { id: 'prep_in', name: '操作参数', type: 'input', dataType: 'data' }
                ],
                outputs: [
                  { id: 'prep_out', name: '准备状态', type: 'output', dataType: 'status' }
                ]
              },
              {
                id: 'op_execute',
                title: '执行操作',
                type: 'Execute',
                status: 'processing',
                inputs: [
                  { id: 'op_exec_in', name: '准备状态', type: 'input', dataType: 'status' }
                ],
                outputs: [
                  { id: 'op_exec_out', name: '操作结果', type: 'output', dataType: 'result' }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
  */

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      '执行中': 'processing',
      '已暂停': 'warning',
      '已挂起': 'error',
      '已取消': 'default',
      '已完成': 'success',
      '已关闭': 'default',
    };
    return colorMap[status] || 'default';
  };

  // 获取时间线图标
  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'processing':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  // 获取时间线颜色
  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'processing':
        return 'blue';
      case 'error':
        return 'red';
      case 'warning':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (!taskData) return null;

  return (
    <Drawer
      title="运单详情"
      placement="right"
      width={isMobile ? '100%' : '66.67%'}
      open={visible}
      onClose={onClose}
      closable={true}
      maskClosable={true}
      keyboard={true}
      destroyOnHidden={false}
      mask={true}
      getContainer={false}
      style={{
        position: 'absolute'
      }}
      rootStyle={{
        position: 'absolute'
      }}
    >
      <div style={{ height: '100%', overflow: 'auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 第一部分：基本信息 */}
          <Card title="基本信息" size="small">
            <Descriptions
              column={isMobile ? 1 : 2}
              size="small"
              labelStyle={{ fontWeight: 'bold', color: '#666' }}
            >
              <Descriptions.Item label="运单名称">
                <Text>{taskData.taskName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="执行设备">
                {taskData.executionDevice}
              </Descriptions.Item>
              <Descriptions.Item label="目标设备">
                {taskData.targetDevice}
              </Descriptions.Item>
              <Descriptions.Item label="运单状态">
                <Tag color={getStatusColor(taskData.status)}>
                  {taskData.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {taskData.endTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {taskData.createTime}
              </Descriptions.Item>
              <Descriptions.Item label="关联业务订单" span={isMobile ? 1 : 2}>
                <Text code>{taskData.relatedBusinessOrder || 'AOV-153'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 第二部分：执行详情 */}
          <Card title="执行详情" size="small">
            <Timeline
              mode="left"
              style={{ marginTop: '20px' }}
              items={executionDetails.map((detail) => ({
                key: detail.id,
                dot: getTimelineIcon(detail.status),
                color: getTimelineColor(detail.status),
                children: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ color: '#666', flex: 1 }}>
                      {detail.action}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#999', fontSize: '12px', marginLeft: '16px' }}>
                      {detail.time}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>

          {/* 第三部分：行为执行状况 */}
          <Card title="行为执行状况" size="small">
            <div style={{ height: '600px', background: '#f8f9fa', borderRadius: '8px' }}>
              <BehaviorTreeCanvas 
                nodes={[
                  {
                    id: 'root',
                    label: '树根',
                    type: 'start',
                    x: 350,
                    y: 50,
                    width: 120,
                    height: 60,
                    behaviorTreeData: { status: 'success' }
                  },
                  {
                    id: 'sequence',
                    label: '顺序',
                    type: 'sequence',
                    x: 350,
                    y: 150,
                    width: 120,
                    height: 60,
                    behaviorTreeData: { status: 'success' }
                  },
                  {
                    id: 'move',
                    label: '移动',
                    type: 'businessProcess',
                    x: 150,
                    y: 280,
                    width: 120,
                    height: 60,
                    behaviorTreeData: { status: 'success' }
                  },
                  {
                    id: 'script',
                    label: '脚本',
                    type: 'businessProcess',
                    x: 350,
                    y: 280,
                    width: 120,
                    height: 60,
                    behaviorTreeData: { status: 'failure' },
                    data: { error: '脚本执行失败\n错误代码: SCRIPT_ERROR\n详细信息: 脚本语法错误，第15行缺少分号' }
                  },
                  {
                    id: 'update_attr',
                    label: '更新设备自定义属性',
                    type: 'businessProcess',
                    x: 550,
                    y: 280,
                    width: 200,
                    height: 60,
                    behaviorTreeData: { status: 'failure' },
                    data: { error: '属性更新失败\n错误代码: ATTR_UPDATE_ERROR\n详细信息: 设备连接超时，无法更新属性值' }
                  }
                ]}
                connections={[
                  {
                    id: 'conn1',
                    sourceId: 'root',
                    targetId: 'sequence',
                    sourcePoint: { x: 410, y: 110 },
                    targetPoint: { x: 410, y: 150 }
                  },
                  {
                    id: 'conn2',
                    sourceId: 'sequence',
                    targetId: 'move',
                    sourcePoint: { x: 410, y: 210 },
                    targetPoint: { x: 210, y: 280 }
                  },
                  {
                    id: 'conn3',
                    sourceId: 'sequence',
                    targetId: 'script',
                    sourcePoint: { x: 410, y: 210 },
                    targetPoint: { x: 410, y: 280 }
                  },
                  {
                    id: 'conn4',
                    sourceId: 'sequence',
                    targetId: 'update_attr',
                    sourcePoint: { x: 410, y: 210 },
                    targetPoint: { x: 650, y: 280 }
                  }
                ]}
              />
            </div>
          </Card>
        </Space>
      </div>
    </Drawer>
  );
};

export default TaskDetail;