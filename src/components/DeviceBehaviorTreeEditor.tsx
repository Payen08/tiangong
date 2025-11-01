import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Tabs, Button, Space, Tree, List, Input, Select, InputNumber, Switch, Tag, Divider, Table, Modal, Form, message, Checkbox, Upload, Row, Col } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  HomeOutlined,
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DragOutlined,
  RotateLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  AimOutlined,
  GlobalOutlined,
  RadarChartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  LineOutlined,
  ShareAltOutlined,
  ControlOutlined,
  SearchOutlined
} from '@ant-design/icons';
import BehaviorTreeCanvas, { FlowNode, Connection, BehaviorTreeCanvasRef } from './BehaviorTreeCanvas';
import { usePoseCoordinateStore } from '../store/poseCoordinateStore';

interface DeviceBehaviorTreeEditorProps {
  deviceId: string;
  deviceName: string;
}

interface BehaviorTreeItem {
  id: string;
  name: string;
  description: string;
  status: string;
  lastModified: string;
  updatedBy: string;
  autoStart: boolean;
  parentTreeId?: string;
  subTrees?: string[];
  nodes: FlowNode[];
  connections: Connection[];
}

interface TransformData {
  from: string;
  to: string;
  translation: number[];
  rotation: number[];
}

// 位姿管理数据接口
interface PoseManagementItem {
  id: string;
  name: string;
  description: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  orientationX: number;
  orientationY: number;
  orientationZ: number;
  orientationW: number;
  frameId: string;
  timestamp: string;
  status: 'active' | 'inactive';
  createdBy: string;
  lastModified: string;
}

// 坐标系管理数据接口
interface CoordinateSystemItem {
  id: string;
  name: string;
  description: string;
  frameId: string;
  parentFrame: string;
  translationX: number;
  translationY: number;
  translationZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationW: number;
  isStatic: boolean;
  publishRate: number;
  status: 'active' | 'inactive';
  createdBy: string;
  lastModified: string;
}

// 状态历史接口
interface StatusHistoryItem {
  id: string;
  status: string;
  timestamp: string;
  duration: string;
  description: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

// 模拟行为树数据
const mockBehaviorTrees: BehaviorTreeItem[] = [
  {
    id: '1',
    name: '完整机器人行为树',
    description: '展示所有节点类型的完整机器人行为树',
    status: 'active',
    lastModified: '2024-01-15 10:30:00',
    updatedBy: '张三',
    autoStart: true,
    subTrees: ['3', '4'],
    nodes: [
      {
        id: 'start-1',
        type: 'start' as const,
        x: 50,
        y: 150,
        width: 120,
        height: 50,
        label: '开始',
        behaviorTreeData: {
          status: 'success'
        }
      },
      {
        id: 'stage-1',
        type: 'stage' as const,
        x: 220,
        y: 80,
        width: 150,
        height: 60,
        label: '初始化阶段',
        behaviorTreeData: {
          status: 'success',
          description: '系统初始化和自检'
        }
      },
      {
        id: 'condition-1',
        type: 'condition' as const,
        x: 420,
        y: 150,
        width: 150,
        height: 80,
        label: '多条件检查',
        behaviorTreeData: {
          status: 'success',
          conditionExpression: 'battery > 20% AND sensors_ok',
          description: '检查设备电量和传感器状态',
          conditionGroups: [
            {
              id: 'group-1',
              name: '电量检查',
              conditions: [
                { id: 'cond-1', field: 'battery', operator: '>', value: 20 }
              ]
            },
            {
              id: 'group-2',
              name: '传感器检查',
              conditions: [
                { id: 'cond-2', field: 'sensors', operator: '==', value: 'ok' }
              ]
            }
          ]
        }
      },
      {
        id: 'parallel-1',
        type: 'parallel' as const,
        x: 620,
        y: 80,
        width: 120,
        height: 50,
        label: '并行任务',
        behaviorTreeData: {
          status: 'running',
          description: '同时执行多个任务'
        }
      },
      {
        id: 'sequence-1',
        type: 'sequence' as const,
        x: 620,
        y: 180,
        width: 120,
        height: 50,
        label: '移动序列',
        behaviorTreeData: {
          status: 'running',
          description: '按顺序执行移动任务'
        }
      },
      {
        id: 'businessProcess-1',
        type: 'businessProcess' as const,
        x: 800,
        y: 80,
        width: 160,
        height: 50,
        label: '货物搬运流程',
        behaviorTreeData: {
          status: 'idle',
          description: '执行货物搬运业务流程'
        }
      },
      {
        id: 'repeat-1',
        type: 'repeat' as const,
        x: 800,
        y: 180,
        width: 120,
        height: 50,
        label: '重试机制',
        behaviorTreeData: {
          status: 'idle',
          repeatCount: 3,
          description: '失败时重试执行'
        }
      },
      {
        id: 'inverter-1',
        type: 'inverter' as const,
        x: 420,
        y: 280,
        width: 120,
        height: 50,
        label: '逆转器',
        behaviorTreeData: {
          status: 'idle',
          description: '反转子节点的执行结果'
        }
      },
      {
        id: 'end-1',
        type: 'end' as const,
        x: 1000,
        y: 150,
        width: 120,
        height: 50,
        label: '结束',
        behaviorTreeData: {
          status: 'idle'
        }
      }
    ],
    connections: [
      {
        id: 'conn-1',
        sourceId: 'start-1',
        targetId: 'stage-1',
        sourcePoint: { x: 170, y: 175 },
        targetPoint: { x: 220, y: 110 }
      },
      {
        id: 'conn-2',
        sourceId: 'start-1',
        targetId: 'condition-1',
        sourcePoint: { x: 170, y: 175 },
        targetPoint: { x: 420, y: 190 }
      },
      {
        id: 'conn-3',
        sourceId: 'condition-1',
        targetId: 'parallel-1',
        sourcePoint: { x: 570, y: 170 },
        targetPoint: { x: 620, y: 105 }
      },
      {
        id: 'conn-4',
        sourceId: 'condition-1',
        targetId: 'sequence-1',
        sourcePoint: { x: 570, y: 210 },
        targetPoint: { x: 620, y: 205 }
      },
      {
        id: 'conn-5',
        sourceId: 'parallel-1',
        targetId: 'businessProcess-1',
        sourcePoint: { x: 740, y: 105 },
        targetPoint: { x: 800, y: 105 }
      },
      {
        id: 'conn-6',
        sourceId: 'sequence-1',
        targetId: 'repeat-1',
        sourcePoint: { x: 740, y: 205 },
        targetPoint: { x: 800, y: 205 }
      },
      {
        id: 'conn-7',
        sourceId: 'condition-1',
        targetId: 'inverter-1',
        sourcePoint: { x: 495, y: 230 },
        targetPoint: { x: 480, y: 280 }
      },
      {
        id: 'conn-8',
        sourceId: 'businessProcess-1',
        targetId: 'end-1',
        sourcePoint: { x: 960, y: 105 },
        targetPoint: { x: 1000, y: 175 }
      },
      {
        id: 'conn-9',
        sourceId: 'repeat-1',
        targetId: 'end-1',
        sourcePoint: { x: 920, y: 205 },
        targetPoint: { x: 1000, y: 175 }
      }
    ]
  },
  {
    id: '2',
    name: '充电行为树',
    description: '设备自动充电流程',
    status: 'inactive',
    lastModified: '2024-01-14 16:45:00',
    updatedBy: '李四',
    autoStart: false,
    nodes: [],
    connections: []
  },
  {
    id: '3',
    name: '电量检测子树',
    description: '检测设备电量状态',
    status: 'active',
    lastModified: '2024-01-15 09:15:00',
    updatedBy: '王五',
    autoStart: false,
    parentTreeId: '1',
    nodes: [],
    connections: []
  },
  {
    id: '4',
    name: '路径规划子树',
    description: '规划巡检路径',
    status: 'active',
    lastModified: '2024-01-15 09:30:00',
    updatedBy: '赵六',
    autoStart: false,
    parentTreeId: '1',
    nodes: [],
    connections: []
  }
];

// 模拟位姿数据
const mockPoseData = {
  position: { x: 125.5, y: 89.3, z: 0.0 },
  orientation: { x: 0.0, y: 0.0, z: 0.707, w: 0.707 },
  linearVelocity: { x: 0.2, y: 0.0, z: 0.0 },
  angularVelocity: { x: 0.0, y: 0.0, z: 0.1 }
};

// 模拟坐标系数据
const mockCoordinateData = {
  baseFrame: 'map',
  robotFrame: 'base_link',
  sensorFrames: ['laser', 'camera', 'imu'],
  transformations: [
    { from: 'map', to: 'base_link', translation: [125.5, 89.3, 0.0], rotation: [0.0, 0.0, 0.707, 0.707] },
    { from: 'base_link', to: 'laser', translation: [0.2, 0.0, 0.1], rotation: [0.0, 0.0, 0.0, 1.0] }
  ]
};

// 位姿管理模拟数据 - 与菜单栏数据保持一致
const mockPoseManagementData: PoseManagementItem[] = [
  {
    id: 'pose_001',
    name: '充电桩位姿',
    description: '机器人充电桩的标准位姿',
    positionX: 10.5,
    positionY: 5.2,
    positionZ: 0.0,
    orientationX: 0.0,
    orientationY: 0.0,
    orientationZ: 0.707,
    orientationW: 0.707,
    frameId: 'map',
    timestamp: '2024-01-20 14:30:25',
    status: 'active',
    createdBy: '系统管理员',
    lastModified: '2024-01-20 14:30:25'
  },
  {
    id: 'pose_002',
    name: '工作站位姿',
    description: '机器人工作站的标准位姿',
    positionX: 15.8,
    positionY: 8.6,
    positionZ: 0.0,
    orientationX: 0.0,
    orientationY: 0.0,
    orientationZ: 0.0,
    orientationW: 1.0,
    frameId: 'map',
    timestamp: '2024-01-20 10:15:30',
    status: 'active',
    createdBy: '操作员',
    lastModified: '2024-01-20 12:45:10'
  },
  {
    id: 'pose_003',
    name: '待机位姿',
    description: '机器人待机时的标准位姿',
    positionX: 0.0,
    positionY: 0.0,
    positionZ: 0.0,
    orientationX: 0.0,
    orientationY: 0.0,
    orientationZ: 0.0,
    orientationW: 1.0,
    frameId: 'base_link',
    timestamp: '2024-01-19 16:20:15',
    status: 'inactive',
    createdBy: '系统管理员',
    lastModified: '2024-01-19 16:20:15'
  }
];

// 坐标系管理模拟数据 - 与菜单栏数据保持一致
const mockCoordinateSystemData: CoordinateSystemItem[] = [
  {
    id: 'coord_001',
    name: '地图坐标系',
    description: '全局地图坐标系',
    frameId: 'map',
    parentFrame: 'world',
    translationX: 0.0,
    translationY: 0.0,
    translationZ: 0.0,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.0,
    rotationW: 1.0,
    isStatic: true,
    publishRate: 10,
    status: 'active',
    createdBy: '系统管理员',
    lastModified: '2024-01-20 14:30:25'
  },
  {
    id: 'coord_002',
    name: '机器人基座坐标系',
    description: '机器人基座的本地坐标系',
    frameId: 'base_link',
    parentFrame: 'map',
    translationX: 10.5,
    translationY: 5.2,
    translationZ: 0.0,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.707,
    rotationW: 0.707,
    isStatic: false,
    publishRate: 50,
    status: 'active',
    createdBy: '系统管理员',
    lastModified: '2024-01-20 14:30:25'
  },
  {
    id: 'coord_003',
    name: '激光雷达坐标系',
    description: '激光雷达传感器坐标系',
    frameId: 'laser_link',
    parentFrame: 'base_link',
    translationX: 0.2,
    translationY: 0.0,
    translationZ: 0.3,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.0,
    rotationW: 1.0,
    isStatic: true,
    publishRate: 30,
    status: 'active',
    createdBy: '技术员',
    lastModified: '2024-01-19 10:15:30'
  },
  {
    id: 'coord_004',
    name: '摄像头坐标系',
    description: '前置摄像头坐标系',
    frameId: 'camera_link',
    parentFrame: 'base_link',
    translationX: 0.3,
    translationY: 0.0,
    translationZ: 0.5,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.0,
    rotationW: 1.0,
    isStatic: true,
    publishRate: 20,
    status: 'inactive',
    createdBy: '技术员',
    lastModified: '2024-01-18 15:45:20'
  }
];

const DeviceBehaviorTreeEditor: React.FC<DeviceBehaviorTreeEditorProps> = ({ deviceId, deviceName }) => {
  const { 
    poseData, 
    coordinateData, 
    setPoseData, 
    setCoordinateData,
    addPose,
    updatePose,
    deletePose,
    addCoordinate,
    updateCoordinate,
    deleteCoordinate,
    initializeData
  } = usePoseCoordinateStore();
  
  // 添加加载状态和错误处理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  // 行为树状态
  const [currentBehaviorTree, setCurrentBehaviorTree] = useState<BehaviorTreeItem>({
    id: '',
    name: '',
    description: '',
    status: 'inactive',
    lastModified: '',
    updatedBy: '',
    autoStart: false,
    nodes: [],
    connections: []
  });
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // 画布状态
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [dragTool, setDragTool] = useState(false);
  
  // 管理模态框状态
  const [isManagementModalVisible, setIsManagementModalVisible] = useState(false);
  const [isBehaviorTreeEditing, setIsBehaviorTreeEditing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 位姿和坐标系管理状态
  const [poseModalVisible, setPoseModalVisible] = useState(false);
  const [coordinateModalVisible, setCoordinateModalVisible] = useState(false);
  const [editingPose, setEditingPose] = useState<PoseManagementItem | null>(null);
  const [editingCoordinate, setEditingCoordinate] = useState<CoordinateSystemItem | null>(null);
  const [selectedPoseRows, setSelectedPoseRows] = useState<string[]>([]);
  const [selectedCoordinateRows, setSelectedCoordinateRows] = useState<string[]>([]);
  
  // 行为树搜索状态
  const [behaviorTreeSearchVisible, setBehaviorTreeSearchVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // 调试运行状态
  const [isDebugging, setIsDebugging] = useState(false);
  
  const canvasRef = useRef<BehaviorTreeCanvasRef>(null);
  const [poseForm] = Form.useForm();
  const [coordinateForm] = Form.useForm();

  // 模拟根据设备ID加载行为树数据的函数
  const loadBehaviorTreeData = useCallback(async (deviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 根据设备ID查找对应的行为树数据
      // 这里使用模拟数据，实际应该调用API
      const deviceBehaviorTree = mockBehaviorTrees.find(tree => 
        tree.id === deviceId || tree.name.includes(deviceId)
      );
      
      if (deviceBehaviorTree) {
        setCurrentBehaviorTree(deviceBehaviorTree);
        setNodes(deviceBehaviorTree.nodes || []);
        setConnections(deviceBehaviorTree.connections || []);
        setDataInitialized(true);
      } else {
        // 如果找不到对应的行为树，创建一个空的行为树
        const emptyBehaviorTree: BehaviorTreeItem = {
          id: deviceId,
          name: `设备 ${deviceId} 行为树`,
          description: `设备 ${deviceId} 的行为树配置`,
          status: 'inactive',
          lastModified: new Date().toLocaleString(),
          updatedBy: '系统',
          autoStart: false,
          nodes: [],
          connections: []
        };
        setCurrentBehaviorTree(emptyBehaviorTree);
        setNodes([]);
        setConnections([]);
        setDataInitialized(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载行为树数据失败');
      console.error('加载行为树数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 统一的初始化逻辑 - 只在设备ID变化时触发
  useEffect(() => {
    if (deviceId) {
      setDataInitialized(false);
      loadBehaviorTreeData(deviceId);
    }
  }, [deviceId, loadBehaviorTreeData]);

  // 初始化位姿和坐标系数据
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, 'running' | 'success' | 'failure' | 'idle'>>({});

  // 画布操作函数
  const handleZoomIn = () => {
    canvasRef.current?.handleZoomIn();
  };

  const handleZoomOut = () => {
    canvasRef.current?.handleZoomOut();
  };

  const handleResetCanvas = () => {
    canvasRef.current?.handleResetCanvas();
  };

  const handleUndo = () => {
    canvasRef.current?.handleUndo();
  };

  const handleRedo = () => {
    canvasRef.current?.handleRedo();
  };

  const toggleDragTool = () => {
    setDragTool(!dragTool);
  };

  const handleSave = () => {
    console.log('保存行为树:', { nodes, connections });
  };

  // 行为树切换处理函数
  const handleBehaviorTreeChange = (treeId: string) => {
    const selectedTree = mockBehaviorTrees.find(tree => tree.id === treeId);
    if (selectedTree) {
      setCurrentBehaviorTree(selectedTree);
      setNodes(selectedTree.nodes);
      setConnections(selectedTree.connections);
      message.success(`已切换到：${selectedTree.name}`);
    }
  };

  // 模式切换处理函数
  const handleEnterEditMode = () => {
    setIsEditMode(true);
    message.success('已进入编辑模式');
  };

  const handleSaveAndExit = () => {
    // 保存当前行为树
    console.log('保存行为树:', { 
      id: currentBehaviorTree.id,
      nodes, 
      connections 
    });
    setIsEditMode(false);
    message.success('保存成功，已切换到预览模式');
  };

  // 调试运行处理函数
  const handleDebugRun = async () => {
    if (isDebugging) {
      // 停止调试
      setIsDebugging(false);
      setNodeExecutionStatus({});
      // 重置所有节点状态
      const resetNodes = nodes.map(node => ({
        ...node,
        behaviorTreeData: {
          ...node.behaviorTreeData,
          status: 'idle' as 'success' | 'failure' | 'running' | 'idle'
        }
      }));
      setNodes(resetNodes);
      message.info('调试运行已停止');
      return;
    }

    // 开始调试运行
    setIsDebugging(true);
    message.success('开始调试运行行为树');

    // 重置所有节点状态为idle
    const initialNodes = nodes.map(node => ({
      ...node,
      behaviorTreeData: {
        ...node.behaviorTreeData,
        status: 'idle' as 'success' | 'failure' | 'running' | 'idle'
      }
    }));
    setNodes(initialNodes);

    // 模拟节点执行过程
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!isDebugging) break; // 如果调试被停止，退出循环

      // 设置节点为运行状态
      setNodeExecutionStatus(prev => ({
        ...prev,
        [node.id]: 'running'
      }));

      // 更新节点状态为运行中
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id 
            ? {
                ...n,
                behaviorTreeData: {
                  ...n.behaviorTreeData,
                  status: 'running' as 'success' | 'failure' | 'running' | 'idle'
                }
              }
            : n
        )
      );

      // 模拟节点执行时间（1-3秒）
      const executionTime = Math.random() * 2000 + 1000;
      await new Promise(resolve => setTimeout(resolve, executionTime));

      // 随机决定节点执行结果（80%成功，20%失败）
      const isSuccess = Math.random() > 0.2;
      const status = isSuccess ? 'success' : 'failure';

      setNodeExecutionStatus(prev => ({
        ...prev,
        [node.id]: status
      }));

      // 更新节点状态
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id 
            ? {
                ...n,
                behaviorTreeData: {
                  ...n.behaviorTreeData,
                  status: status as 'success' | 'failure' | 'running' | 'idle'
                }
              }
            : n
        )
      );

      // 如果节点失败，停止执行后续节点
      if (!isSuccess) {
        message.error(`节点 "${node.label}" 执行失败，调试运行终止`);
        setIsDebugging(false);
        return;
      }

      message.success(`节点 "${node.label}" 执行成功`);
    }

    // 所有节点执行完成
    setIsDebugging(false);
    message.success('行为树调试运行完成');
  };

  // 位姿管理操作函数
  const handleAddPose = () => {
    setEditingPose(null);
    poseForm.resetFields();
    setPoseModalVisible(true);
  };

  const handleEditPose = (record: PoseManagementItem) => {
    setEditingPose(record);
    poseForm.setFieldsValue(record);
    setPoseModalVisible(true);
  };

  const handleDeletePose = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个位姿吗？',
      onOk: () => {
        deletePose(id);
        message.success('删除成功');
      }
    });
  };

  const handlePoseSubmit = async () => {
    try {
      const values = await poseForm.validateFields();
      if (editingPose) {
        // 编辑
        updatePose(editingPose.id, { ...values, lastModified: new Date().toLocaleString() });
        message.success('编辑成功');
      } else {
        // 新增
        const newPose: PoseManagementItem = {
          ...values,
          id: `pose_${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          lastModified: new Date().toLocaleString(),
          createdBy: '当前用户'
        };
        addPose(newPose);
        message.success('新增成功');
      }
      setPoseModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 坐标系管理操作函数
  const handleAddCoordinate = () => {
    setEditingCoordinate(null);
    coordinateForm.resetFields();
    setCoordinateModalVisible(true);
  };

  const handleEditCoordinate = (record: CoordinateSystemItem) => {
    setEditingCoordinate(record);
    coordinateForm.setFieldsValue(record);
    setCoordinateModalVisible(true);
  };

  const handleDeleteCoordinate = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个坐标系吗？',
      onOk: () => {
        deleteCoordinate(id);
        message.success('删除成功');
      }
    });
  };

  const handleCoordinateSubmit = async () => {
    try {
      const values = await coordinateForm.validateFields();
      if (editingCoordinate) {
        // 编辑
        updateCoordinate(editingCoordinate.id, { ...values, lastModified: new Date().toLocaleString() });
        message.success('编辑成功');
      } else {
        // 新增
        const newCoordinate: CoordinateSystemItem = {
          ...values,
          id: `coord_${Date.now()}`,
          lastModified: new Date().toLocaleString(),
          createdBy: '当前用户'
        };
        addCoordinate(newCoordinate);
        message.success('新增成功');
      }
      setCoordinateModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 行为树搜索过滤逻辑
  const filteredBehaviorTrees = mockBehaviorTrees.filter(tree => {
    if (!searchKeyword.trim()) return true;
    return tree.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
           tree.description.toLowerCase().includes(searchKeyword.toLowerCase());
  });

  // 获取坐标系名称的辅助函数
  const getCoordinateSystemName = (frameId: string): string => {
    const coordinate = coordinateData.find(coord => coord.frameId === frameId);
    return coordinate ? coordinate.name : frameId;
  };

  // 获取父坐标系名称的辅助函数
  const getParentCoordinateSystemName = (frameId: string): string => {
    const coordinate = coordinateData.find(coord => coord.frameId === frameId);
    if (coordinate && coordinate.parentFrame) {
      const parentCoordinate = coordinateData.find(coord => coord.frameId === coordinate.parentFrame);
      return parentCoordinate ? parentCoordinate.name : coordinate.parentFrame;
    }
    return '无';
  };

  // 右侧面板内容
  const rightPanelItems = [
    {
      key: 'pose',
      label: '位姿管理',
      children: (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold' }}>位姿列表</span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
             {poseData.map((pose) => (
               <div key={pose.id} style={{ 
                 padding: '8px', 
                 border: '1px solid #f0f0f0', 
                 borderRadius: '4px', 
                 marginBottom: '8px',
                 background: '#fafafa'
               }}>
                 <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{pose.name}</div>
                 <div style={{ fontSize: '11px', color: '#666' }}>
                   作用坐标名称: {getCoordinateSystemName(pose.frameId)}
                 </div>
                 <div style={{ fontSize: '11px', color: '#666' }}>
                   参考坐标名称: {getParentCoordinateSystemName(pose.frameId)}
                 </div>
               </div>
             ))}
           </div>
        </div>
      ),
    },
    {
      key: 'coordinate',
      label: '坐标系管理',
      children: (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold' }}>坐标系列表</span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
             {coordinateData.map((coord) => (
               <div key={coord.id} style={{ 
                 padding: '8px', 
                 border: '1px solid #f0f0f0', 
                 borderRadius: '4px', 
                 marginBottom: '8px',
                 background: '#fafafa'
               }}>
                 <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{coord.name}</div>
                 <div style={{ fontSize: '11px', color: '#666' }}>
                   参考坐标名称: {getParentCoordinateSystemName(coord.parentFrame)}
                 </div>
               </div>
             ))}
           </div>
        </div>
      ),
    },
  ];

  // 显示加载状态
  if (loading) {
    return (
      <div style={{ 
        height: '840px',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>正在加载设备行为树...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>设备: {deviceName} (ID: {deviceId})</div>
        </div>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div style={{ 
        height: '840px',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px', color: '#ff4d4f' }}>加载失败</div>
          <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
          <Button 
            type="primary" 
            style={{ marginTop: '16px' }}
            onClick={() => loadBehaviorTreeData(deviceId)}
          >
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '840px',
      background: '#ffffff',
      position: 'relative',
      display: 'flex'
    }}>
      {/* 画布区域 - 缩小以留出右侧面板空间 */}
      <div style={{ 
        width: showRightPanel ? 'calc(100% - 296px)' : '100%',
        height: '100%',
        position: 'relative',
        transition: 'width 0.3s ease',
        marginRight: showRightPanel ? '16px' : '0',
        paddingRight: showRightPanel ? '0' : '0',
        background: '#f5f5f5'
      }}>
        {/* 浮动工具栏 - 行为树切换和模式控制 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'transparent',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          {/* 居中排列的所有元素 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 行为树选择器 */}
            <Select
              value={currentBehaviorTree.id}
              onChange={handleBehaviorTreeChange}
              style={{ width: 200 }}
              size="middle"
            >
              {mockBehaviorTrees.map(tree => (
                <Select.Option key={tree.id} value={tree.id}>
                  <span>{tree.name}</span>
                </Select.Option>
              ))}
            </Select>

            {/* 行为树管理按钮 */}
            <Button
              size="middle"
              icon={<ControlOutlined />}
              onClick={() => setIsManagementModalVisible(true)}
            >
              行为树管理
            </Button>

            {/* 操作按钮 */}
            {isEditMode ? (
              <Space>
                <Button 
                  type="primary" 
                  size="middle"
                  icon={<SaveOutlined />}
                  onClick={handleSaveAndExit}
                >
                  保存并退出
                </Button>
                <Button 
                  type={isDebugging ? "primary" : "default"}
                  size="middle"
                  icon={isDebugging ? <StopOutlined /> : <PlayCircleOutlined />}
                  onClick={handleDebugRun}
                  loading={isDebugging}
                >
                  {isDebugging ? '正在运行' : '调试运行'}
                </Button>
              </Space>
            ) : (
              <Button 
                type="primary" 
                size="middle"
                icon={<EditOutlined />}
                onClick={handleEnterEditMode}
              >
                进入编辑模式
              </Button>
            )}
          </div>
        </div>

        <BehaviorTreeCanvas
          ref={canvasRef}
          nodes={nodes}
          connections={connections}
          onNodesChange={setNodes}
          onConnectionsChange={setConnections}
          width={showRightPanel ? 600 : 800}
          height={800}
          />

        {/* 模式角标 - 画布左上角带圆角的角标 */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          zIndex: 1000,
          width: '80px',
          height: '80px',
          background: isEditMode ? 'rgba(24, 144, 255, 0.85)' : 'rgba(82, 196, 26, 0.85)',
          borderTopLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* 角标内的文字 */}
          <div style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            transform: 'rotate(-45deg)',
            transformOrigin: 'center',
            whiteSpace: 'nowrap'
          }}>
            {isEditMode ? '编辑' : '预览'}
          </div>
        </div>
          
          {/* 悬浮操作工具栏 */}
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e8e8e8',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 100
          }}>
            {/* 拖动画布工具 */}
            <Button
              type={dragTool ? "primary" : "text"}
              icon={<DragOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: dragTool ? '#1890ff' : 'transparent',
                color: dragTool ? '#fff' : 'inherit'
              }}
              title="拖动画布"
              onClick={toggleDragTool}
            />
            
            {/* 放大画布工具 */}
            <Button
              type="text"
              icon={<ZoomInOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none'
              }}
              title="放大画布"
              onClick={handleZoomIn}
            />
            
            {/* 缩小画布工具 */}
            <Button
              type="text"
              icon={<ZoomOutOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none'
              }}
              title="缩小画布"
              onClick={handleZoomOut}
            />
            
            {/* 分隔线 */}
            <div style={{
              height: '1px',
              background: '#e8e8e8',
              margin: '4px 0'
            }} />
            
            {/* 撤销工具 */}
            <Button
              type="text"
              icon={<UndoOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: '#1890ff'
              }}
              title="撤销 (Ctrl+Z / Cmd+Z)"
              onClick={handleUndo}
            />
            
            {/* 重做工具 */}
            <Button
              type="text"
              icon={<RedoOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: '#1890ff'
              }}
              title="重做 (Ctrl+Y / Cmd+Y)"
              onClick={handleRedo}
            />
            
            {/* 分隔线 */}
            <div style={{
              height: '1px',
              background: '#e8e8e8',
              margin: '4px 0'
            }} />
            
            {/* 旋转画布工具 */}
            <Button
              type="text"
              icon={<RotateLeftOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none'
              }}
              title="旋转画布"
            />
            
            {/* 回到初始画布工具 */}
            <Button
              type="text"
              icon={<HomeOutlined />}
              size="small"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none'
              }}
              title="回到初始画布"
              onClick={handleResetCanvas}
            />
          </div>
        

      </div>

      {/* 右侧固定面板 */}
      {showRightPanel && (
        <div style={{
          width: '280px',
          height: '100%',
          background: '#fff',
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <Tabs
            items={rightPanelItems}
            size="small"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            tabBarStyle={{ margin: 0, padding: '8px 16px 0 16px' }}
           />
        </div>
      )}

      {/* 位姿管理模态框 */}
      <Modal
        title={editingPose ? '编辑位姿' : '新增位姿'}
        open={poseModalVisible}
        onOk={handlePoseSubmit}
        onCancel={() => setPoseModalVisible(false)}
        width={600}
      >
        <Form
          form={poseForm}
          layout="vertical"
          initialValues={{
            status: 'active',
            frameId: 'map'
          }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入位姿名称' }]}
          >
            <Input placeholder="请输入位姿名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入位姿描述" rows={2} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="positionX"
              label="位置X"
              rules={[{ required: true, message: '请输入X坐标' }]}
            >
              <InputNumber placeholder="X坐标" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="positionY"
              label="位置Y"
              rules={[{ required: true, message: '请输入Y坐标' }]}
            >
              <InputNumber placeholder="Y坐标" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="positionZ"
              label="位置Z"
              rules={[{ required: true, message: '请输入Z坐标' }]}
            >
              <InputNumber placeholder="Z坐标" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="orientationX"
              label="方向X"
              rules={[{ required: true, message: '请输入方向X' }]}
            >
              <InputNumber placeholder="方向X" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="orientationY"
              label="方向Y"
              rules={[{ required: true, message: '请输入方向Y' }]}
            >
              <InputNumber placeholder="方向Y" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="orientationZ"
              label="方向Z"
              rules={[{ required: true, message: '请输入方向Z' }]}
            >
              <InputNumber placeholder="方向Z" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="orientationW"
              label="方向W"
              rules={[{ required: true, message: '请输入方向W' }]}
            >
              <InputNumber placeholder="方向W" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="frameId"
              label="坐标系"
              rules={[{ required: true, message: '请选择坐标系' }]}
            >
              <Select placeholder="请选择坐标系">
                <Select.Option value="map">map</Select.Option>
                <Select.Option value="odom">odom</Select.Option>
                <Select.Option value="base_link">base_link</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Select.Option value="active">启用</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 坐标系管理模态框 */}
      <Modal
        title={editingCoordinate ? '编辑坐标系' : '新增坐标系'}
        open={coordinateModalVisible}
        onOk={handleCoordinateSubmit}
        onCancel={() => setCoordinateModalVisible(false)}
        width={600}
      >
        <Form
          form={coordinateForm}
          layout="vertical"
          initialValues={{
            status: 'active',
            isStatic: true,
            publishRate: 50
          }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入坐标系名称' }]}
          >
            <Input placeholder="请输入坐标系名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入坐标系描述" rows={2} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="frameId"
              label="坐标系ID"
              rules={[{ required: true, message: '请输入坐标系ID' }]}
            >
              <Input placeholder="请输入坐标系ID" />
            </Form.Item>
            <Form.Item
              name="parentFrame"
              label="父坐标系"
              rules={[{ required: true, message: '请输入父坐标系' }]}
            >
              <Input placeholder="请输入父坐标系" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="translationX"
              label="平移X"
              rules={[{ required: true, message: '请输入平移X' }]}
            >
              <InputNumber placeholder="平移X" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="translationY"
              label="平移Y"
              rules={[{ required: true, message: '请输入平移Y' }]}
            >
              <InputNumber placeholder="平移Y" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="translationZ"
              label="平移Z"
              rules={[{ required: true, message: '请输入平移Z' }]}
            >
              <InputNumber placeholder="平移Z" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="rotationX"
              label="旋转X"
              rules={[{ required: true, message: '请输入旋转X' }]}
            >
              <InputNumber placeholder="旋转X" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="rotationY"
              label="旋转Y"
              rules={[{ required: true, message: '请输入旋转Y' }]}
            >
              <InputNumber placeholder="旋转Y" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="rotationZ"
              label="旋转Z"
              rules={[{ required: true, message: '请输入旋转Z' }]}
            >
              <InputNumber placeholder="旋转Z" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="rotationW"
              label="旋转W"
              rules={[{ required: true, message: '请输入旋转W' }]}
            >
              <InputNumber placeholder="旋转W" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="isStatic"
              label="是否静态"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="publishRate"
              label="发布频率(Hz)"
              rules={[{ required: true, message: '请输入发布频率' }]}
            >
              <InputNumber placeholder="发布频率" style={{ width: '100%' }} min={1} max={100} />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Select.Option value="active">启用</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 行为树管理弹窗 */}
      <Modal
        title="行为树管理"
        open={isManagementModalVisible}
        onCancel={() => setIsManagementModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsManagementModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Divider style={{ marginTop: 0, marginBottom: 20 }} />
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Input.Search
              placeholder="按名称搜索行为树..."
              value={searchKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ flexShrink: 0 }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />}>
                新增行为树
              </Button>
              <Button icon={<ImportOutlined />}>
                导入
              </Button>
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
            </Space>
          </div>
        </div>
        <Table
          dataSource={filteredBehaviorTrees}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          columns={[
            {
              title: '行为树名称',
              dataIndex: 'name',
              key: 'name',
              width: 200,
            },
            {
              title: '描述',
              dataIndex: 'description',
              key: 'description',
            },
            {
              title: '自启动',
              dataIndex: 'autoStart',
              key: 'autoStart',
              width: 80,
              render: (autoStart: boolean) => (
                <Tag color={autoStart ? 'green' : 'red'}>
                  {autoStart ? '是' : '否'}
                </Tag>
              ),
            },
            {
              title: '更新时间',
              dataIndex: 'lastModified',
              key: 'lastModified',
              width: 150,
            },
            {
              title: '更新人',
              dataIndex: 'updatedBy',
              key: 'updatedBy',
              width: 100,
            },
            {
               title: '操作',
               key: 'action',
               width: 150,
               render: (_: any, record: BehaviorTreeItem) => (
                 <Space size="small">
                   <Button type="link" size="small" icon={<EditOutlined />}>
                     编辑
                   </Button>
                   <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                     删除
                   </Button>
                 </Space>
               ),
             },
          ]}
        />
      </Modal>
    </div>
  );
};

export default DeviceBehaviorTreeEditor;