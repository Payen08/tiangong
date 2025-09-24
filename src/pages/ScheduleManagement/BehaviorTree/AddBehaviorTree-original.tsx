import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Steps,
  message,
  Tooltip,
  Card,
  Radio,
} from 'antd';
import StagePropertyPanel from './StagePropertyPanel';
import BusinessProcessPropertyPanel from './BusinessProcessPropertyPanel';
import { 
  ArrowLeftOutlined, 
  UndoOutlined, 
  RedoOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  HomeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { isDev } from '@/lib/utils';

const { TextArea } = Input;
const { Option } = Select;

// 接口定义
interface TriggerCondition {
  id: string;
  dataSource: 'product' | 'global';
  dataItem?: string;
  productAttribute?: string;
  compareType?: 'greater' | 'equal' | 'less' | 'notEqual';
  value?: string;
}

interface TriggerConditionGroup {
  id: string;
  conditions: TriggerCondition[];
  logicOperator: 'and' | 'or';
}

interface ExecutionDevice {
  id: string;
  deviceType: string;
  devices: string[];
  deviceNames?: string;
  triggerType: 'general' | 'custom';
  conditionType: 'none' | 'conditional';
  conditionGroups?: TriggerConditionGroup[];
}

// interface BehaviorTreeData {
//   treeName: string;
//   treeKey: string;
//   status: 'enabled' | 'disabled' | 'obsolete';
//   executionDevices?: ExecutionDevice[];
// }

interface AddBehaviorTreeProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  isDragging: boolean;
  isSpacePressed: boolean;
  lastMouseX: number;
  lastMouseY: number;
  history?: Array<{ nodes: FlowNode[]; connections: Connection[] }>;
  historyIndex?: number;
}

interface HistoryState {
  nodes: FlowNode[];
  connections: Connection[];
  subCanvases: SubCanvas[];
  canvasState: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
}

type NodeType = 'start' | 'end' | 'stage' | 'businessProcess' | 'sequence' | 'parallel' | 'condition' | 'inverter' | 'repeat';

interface SubCanvasViewConfig {
  scale: number;
  offsetX: number;
  offsetY: number;
  gridSize: number;
  showGrid: boolean;
}

interface SubProcessData {
  nodes: FlowNode[];
  connections: Connection[];
  viewConfig: SubCanvasViewConfig;
  metadata: {
    name: string;
    description?: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
  settings: {
    autoLayout: boolean;
    snapToGrid: boolean;
    allowCrossConnections: boolean;
    maxNodes: number;
  };
}

interface SubCanvas {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  nodes: FlowNode[];
  connections: Connection[];
  parentNodeId: string;
}

interface FlowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  customName?: string;
  triggerCondition?: string;
  demandDevicesTriggerCondition?: string;
  supplyDevicesTriggerCondition?: string;
  demandDevices?: string[];
  supplyDevices?: string[];
  demandDevicesNames?: string;
  supplyDevicesNames?: string;
  data?: any;
  subProcess?: SubProcessData;
  subCanvasId?: string;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  sourceType?: 'node' | 'stage' | 'subcanvas' | 'businessProcess';
  targetType?: 'node' | 'stage' | 'subcanvas' | 'businessProcess';
}

// interface NodeTool {
//   type: NodeType;
//   icon: React.ReactNode;
//   label: string;
//   color: string;
// }

const AddBehaviorTree: React.FC<AddBehaviorTreeProps> = ({ 
  visible,
  onClose, 
  onSave, 
  editData 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (visible && editData) {
      form.setFieldsValue(editData);
    }
  }, [visible]);

  const [currentStep, setCurrentStep] = useState(0);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    isDragging: false,
    isSpacePressed: false,
    lastMouseX: 0,
    lastMouseY: 0,
    history: [],
    historyIndex: -1
  });

  // const [invalidNodes, setInvalidNodes] = useState<string[]>([]);

  const [history] = useState<HistoryState[]>([]);
  const [historyIndex] = useState(-1);

  const [nodes, setNodes] = useState<FlowNode[]>([]);
  // const [connections] = useState<Connection[]>([]);
  // const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  // const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
  // const [isDraggingNode, setIsDraggingNode] = useState(false);
  // const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // const [isDraggingSubCanvas, setIsDraggingSubCanvas] = useState(false);
  // const [draggedSubCanvas, setDraggedSubCanvas] = useState<SubCanvas | null>(null);
  // const [subCanvasDragOffset, setSubCanvasDragOffset] = useState({ x: 0, y: 0 });

  // const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  // const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // const [insertingConnectionId, setInsertingConnectionId] = useState<string | null>(null);

  const [hoveredConnectionPoint] = useState<{nodeId: string, type: 'input' | 'output' | 'subcanvas' | 'bottom'} | null>(null);
  // const [hoveredSubCanvasLine, setHoveredSubCanvasLine] = useState<string | null>(null);
  // const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  // const [dragConnectionStart, setDragConnectionStart] = useState<{nodeId: string, type: 'input' | 'output' | 'subcanvas' | 'bottom', x: number, y: number} | null>(null);
  // const [dragConnectionEnd, setDragConnectionEnd] = useState<{x: number, y: number} | null>(null);

  // const [subCanvases, setSubCanvases] = useState<SubCanvas[]>([]);
  // const [selectedSubCanvas, setSelectedSubCanvas] = useState<string | null>(null);

  const [editingSubProcess, setEditingSubProcess] = useState<string | null>(null);

  // const [openSubCanvasWindows, setOpenSubCanvasWindows] = useState<Map<string, { nodeId: string; position: { x: number; y: number } }>>(new Map());

  // const [showNodePanel, setShowNodePanel] = useState(false);
  // const [nodeAddPosition, setNodeAddPosition] = useState({ x: 0, y: 0 });

  const [stagePropertyPanelVisible, setStagePropertyPanelVisible] = useState(false);
  const [selectedStageNode, setSelectedStageNode] = useState<FlowNode | null>(null);

  const [businessProcessPropertyPanelVisible, setBusinessProcessPropertyPanelVisible] = useState(false);
  const [selectedBusinessProcessNode, setSelectedBusinessProcessNode] = useState<FlowNode | null>(null);

  // const [hoveredDemandDevice, setHoveredDemandDevice] = useState<{nodeId: string, deviceText: string, x: number, y: number} | null>(null);
  // const [hoveredTriggerCondition, setHoveredTriggerCondition] = useState<{nodeId: string, conditionText: string, x: number, y: number} | null>(null);

  const [executionDevices, setExecutionDevices] = useState<ExecutionDevice[]>([
    {
      id: `device_${Date.now()}`,
      deviceType: 'sensor',
      devices: [],
      triggerType: 'general',
      conditionType: 'none'
    }
  ]);

  const deviceTypeOptions = [
    { label: '传感器', value: 'sensor' },
    { label: '执行器', value: 'actuator' },
    { label: '控制器', value: 'controller' },
    { label: '监控设备', value: 'monitor' }
  ];

  const getDeviceOptions = (deviceType: string) => {
    const deviceMap = {
      sensor: [
        { label: '温度传感器01', value: 'temp_sensor_01' },
        { label: '湿度传感器01', value: 'humidity_sensor_01' },
        { label: '压力传感器01', value: 'pressure_sensor_01' }
      ],
      actuator: [
        { label: '电机01', value: 'motor_01' },
        { label: '阀门01', value: 'valve_01' },
        { label: '泵01', value: 'pump_01' }
      ],
      controller: [
        { label: 'PLC控制器01', value: 'plc_controller_01' },
        { label: '单片机01', value: 'mcu_01' }
      ],
      monitor: [
        { label: '监控摄像头01', value: 'camera_01' },
        { label: '数据采集器01', value: 'data_collector_01' }
      ]
    };
    return deviceMap[deviceType as keyof typeof deviceMap] || [];
  };

  const getDeviceNameById = (deviceId: string): string => {
    const allDevices = [
      ...getDeviceOptions('sensor'),
      ...getDeviceOptions('actuator'),
      ...getDeviceOptions('controller'),
      ...getDeviceOptions('monitor')
    ];
    const device = allDevices.find(d => d.value === deviceId);
    return device ? device.label : deviceId;
  };

  const addExecutionDevice = () => {
    setExecutionDevices(prev => [...prev, {
      id: `device_${Date.now()}`,
      deviceType: 'sensor',
      devices: [],
      triggerType: 'general',
      conditionType: 'none'
    }]);
  };

  const updateExecutionDevice = (deviceId: string, updates: Partial<ExecutionDevice>) => {
    setExecutionDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, ...updates } : device
    ));
  };

  const removeExecutionDevice = (deviceId: string) => {
    setExecutionDevices(prev => prev.filter(device => device.id !== deviceId));
  };

  const dataSourceOptions = [
    { label: '产品管理', value: 'product' },
    { label: '全局变量', value: 'global' }
  ];

  const compareTypeOptions = [
    { label: '大于', value: 'greater' },
    { label: '等于', value: 'equal' },
    { label: '小于', value: 'less' },
    { label: '不等于', value: 'notEqual' }
  ];

  const addTriggerConditionGroup = (deviceId: string): void => {
    const newGroup: TriggerConditionGroup = {
      id: `group_${Date.now()}`,
      conditions: [{
        id: `condition_${Date.now()}`,
        dataSource: 'product'
      }],
      logicOperator: 'and'
    };
    updateExecutionDevice(deviceId, {
      conditionGroups: [...(executionDevices.find(d => d.id === deviceId)?.conditionGroups || []), newGroup]
    });
  };

  const updateTriggerCondition = (deviceId: string, groupId: string, conditionId: string, updates: Partial<TriggerCondition>): void => {
    const device = executionDevices.find(d => d.id === deviceId);
    if (!device || !device.conditionGroups) return;

    const updatedGroups = device.conditionGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(condition => 
            condition.id === conditionId ? { ...condition, ...updates } : condition
          )
        };
      }
      return group;
    });

    updateExecutionDevice(deviceId, { conditionGroups: updatedGroups });
  };

  // const handleStageNodeClick = (node: FlowNode) => {
  //   setSelectedStageNode(node);
  //   setStagePropertyPanelVisible(true);
  // };

  const handleSaveStageNode = () => {
    setStagePropertyPanelVisible(false);
  };

  const handleCloseStagePropertyPanel = () => {
    setStagePropertyPanelVisible(false);
    setSelectedStageNode(null);
  };

  const handleSaveBusinessProcessNode = () => {
    setBusinessProcessPropertyPanelVisible(false);
  };

  const handleCloseBusinessProcessPropertyPanel = () => {
    setBusinessProcessPropertyPanelVisible(false);
    setSelectedBusinessProcessNode(null);
  };

  const exitSubProcessMode = () => {
    setEditingSubProcess(null);
  };

  const steps = [
    { title: '基本信息', description: '设置行为树基本信息' },
    { title: '流程设计', description: '设计行为树流程' },
    { title: '执行设备', description: '配置执行设备' }
  ];

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      // setConnections(state.connections);
      // setSubCanvases(state.subCanvases);
      setCanvasState(prev => ({
        ...prev,
        ...state.canvasState
      }));
      // setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      // setConnections(state.connections);
      // setSubCanvases(state.subCanvases);
      setCanvasState(prev => ({
        ...prev,
        ...state.canvasState
      }));
      // setHistoryIndex(newIndex);
    }
  };

  const handleZoomIn = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3)
    }));
  };

  const handleZoomOut = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.3)
    }));
  };

  const handleResetPosition = () => {
    setCanvasState(prev => ({
      ...prev,
      offsetX: 0,
      offsetY: 0,
      scale: 1
    }));
  };

  const autoSortNodes = () => {

  };

  const handleMouseDown = () => {

  };

  const handleMouseMove = () => {

  };

  const handleMouseUp = () => {

  };

  const handleMouseLeave = () => {

  };

  const handleWheel = () => {

  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBack2Steps = () => {
    if (currentStep >= 2) {
      setCurrentStep(currentStep - 2);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const data = {
        ...values,
        executionDevices
      };
      onSave(data);
      message.success(editData ? '保存成功' : '创建成功');
      onClose();
    } catch (error) {
      if (isDev) console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={editData ? '编辑行为树' : '新增行为树'}
      width="100%"
      open={visible}
      onClose={onClose}
      destroyOnHidden
      styles={{
        body: { padding: 0 },
        header: { borderBottom: '1px solid #f0f0f0' }
      }}
    >
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Steps current={currentStep} items={steps} />
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Form
            form={form}
            layout="vertical"
            style={{ height: '100%' }}
          >
            {currentStep === 0 && (
              <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="行为树名称"
                      name="treeName"
                      rules={[{ required: true, message: '请输入行为树名称' }]}
                    >
                      <Input placeholder="请输入行为树名称" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="行为树标识"
                      name="treeKey"
                      rules={[{ required: true, message: '请输入行为树标识' }]}
                    >
                      <Input placeholder="请输入行为树标识" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="状态"
                      name="status"
                      initialValue="enabled"
                    >
                      <Select>
                        <Option value="enabled">启用</Option>
                        <Option value="disabled">禁用</Option>
                        <Option value="obsolete">废弃</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="触发条件" name="triggerCondition" initialValue="none">
                      <Radio.Group>
                        <Radio value="none">调用触发</Radio>
                        <Radio value="conditional">条件触发</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="描述" name="description">
                  <TextArea rows={4} placeholder="请输入行为树描述" />
                </Form.Item>
              </div>
            )}

            {currentStep === 1 && (
              <div className="h-full relative" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0, backgroundColor: '#f5f7fa' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    style={{ 
                      cursor: // isDraggingConnection ? 'crosshair' : 
                             (hoveredConnectionPoint ? 'crosshair' : 
                             // (isDraggingNode ? 'grabbing' : 
                             // (isDraggingSubCanvas ? 'grabbing' :
                             (canvasState.isSpacePressed ? 'grab' : 
                             'default')), // ))),
                      backgroundColor: '#f5f7fa'
                    }}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>执行设备配置</h3>
                  <Button type="primary" icon={<PlusOutlined />} onClick={addExecutionDevice}>
                    添加设备
                  </Button>
                </div>

                {executionDevices.map((device, index) => (
                  <Card
                    key={device.id}
                    title={`设备 ${index + 1}`}
                    extra={
                      executionDevices.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeExecutionDevice(device.id)}
                        />
                      )
                    }
                    style={{ marginBottom: '16px' }}
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <div style={{ marginBottom: '8px' }}>设备类型</div>
                        <Select
                           value={device.deviceType}
                           onChange={(value: string) => updateExecutionDevice(device.id, { deviceType: value, devices: [] })}
                           style={{ width: '100%' }}
                           placeholder="选择设备类型"
                         >
                          {deviceTypeOptions.map(option => (
                            <Option key={option.value} value={option.value}>{option.label}</Option>
                          ))}
                        </Select>
                      </Col>
                      <Col span={8}>
                        <div style={{ marginBottom: '8px' }}>设备选择</div>
                        <Select
                           mode="multiple"
                           value={device.devices}
                           onChange={(value: string[]) => {
                             const deviceNames = value.map((id: string) => getDeviceNameById(id)).join(', ');
                             updateExecutionDevice(device.id, { devices: value, deviceNames });
                           }}
                           style={{ width: '100%' }}
                           placeholder="选择设备"
                         >
                          {getDeviceOptions(device.deviceType).map(option => (
                            <Option key={option.value} value={option.value}>{option.label}</Option>
                          ))}
                        </Select>
                      </Col>
                      <Col span={8}>
                        <div style={{ marginBottom: '8px' }}>触发类型</div>
                        <Select
                           value={device.triggerType}
                           onChange={(value: 'general' | 'custom') => updateExecutionDevice(device.id, { triggerType: value })}
                           style={{ width: '100%' }}
                         >
                          <Option value="general">通用触发</Option>
                          <Option value="custom">自定义触发</Option>
                        </Select>
                      </Col>
                    </Row>

                    <Row gutter={16} style={{ marginTop: '16px' }}>
                      <Col span={24}>
                        <div style={{ marginBottom: '8px' }}>条件类型</div>
                        <Radio.Group
                           value={device.conditionType}
                           onChange={(e: any) => updateExecutionDevice(device.id, { conditionType: e.target.value })}
                         >
                          <Radio value="none">无条件</Radio>
                          <Radio value="conditional">条件触发</Radio>
                        </Radio.Group>
                      </Col>
                    </Row>

                    {device.conditionType === 'conditional' && (
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>触发条件</span>
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => addTriggerConditionGroup(device.id)}
                          >
                            添加条件组
                          </Button>
                        </div>

                        {device.conditionGroups?.map((group, groupIndex) => (
                          <Card
                            key={group.id}
                            size="small"
                            title={`条件组 ${groupIndex + 1}`}
                            style={{ marginBottom: '8px' }}
                          >
                            {group.conditions.map((condition, _conditionIndex) => (
                              <div key={condition.id} style={{ marginBottom: '12px' }}>
                                <Row gutter={8}>
                                  <Col span={8}>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: '12px', color: '#666' }}>数据源</span>
                                    </div>
                                    <Select
                                      placeholder="数据源"
                                      value={condition.dataSource}
                                      onChange={(value: 'product' | 'global') => updateTriggerCondition(device.id, group.id, condition.id, { dataSource: value })}
                                      size="small"
                                      style={{ width: '100%' }}
                                    >
                                      {dataSourceOptions.map(option => (
                                        <Option key={option.value} value={option.value}>{option.label}</Option>
                                      ))}
                                    </Select>
                                  </Col>
                                  <Col span={8}>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: '12px', color: '#666' }}>数据项</span>
                                    </div>
                                    <Select
                                      placeholder="数据项"
                                      value={condition.dataItem}
                                      onChange={(value: string) => updateTriggerCondition(device.id, group.id, condition.id, { dataItem: value })}
                                      size="small"
                                      style={{ width: '100%' }}
                                    >
                                      <Option value="temperature">温度</Option>
                                      <Option value="humidity">湿度</Option>
                                      <Option value="pressure">压力</Option>
                                    </Select>
                                  </Col>
                                  <Col span={8}>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: '12px', color: '#666' }}>产品属性</span>
                                    </div>
                                    <Select
                                      placeholder="产品属性"
                                      value={condition.productAttribute}
                                      onChange={(value: string) => updateTriggerCondition(device.id, group.id, condition.id, { productAttribute: value })}
                                      size="small"
                                      style={{ width: '100%' }}
                                    >
                                      <Option value="attr1">属性1</Option>
                                      <Option value="attr2">属性2</Option>
                                    </Select>
                                  </Col>
                                </Row>

                                <Row gutter={8}>
                                  <Col span={12}>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: '12px', color: '#666' }}>操作符</span>
                                    </div>
                                    <Select
                                      placeholder="操作符"
                                      value={condition.compareType}
                                      onChange={(value: 'greater' | 'equal' | 'less' | 'notEqual') => updateTriggerCondition(device.id, group.id, condition.id, { compareType: value })}
                                      size="small"
                                      style={{ width: '100%' }}
                                    >
                                      {compareTypeOptions.map(option => (
                                        <Option key={option.value} value={option.value}>{option.label}</Option>
                                      ))}
                                    </Select>
                                  </Col>
                                  <Col span={12}>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: '12px', color: '#666' }}>条件值</span>
                                    </div>
                                    <Input
                                      placeholder="请输入条件值"
                                      value={condition.value}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTriggerCondition(device.id, group.id, condition.id, { value: e.target.value })}
                                      size="small"
                                    />
                                  </Col>
                                </Row>
                              </div>
                            ))}
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Form>
        </div>

        <div style={{
          borderTop: '1px solid #f0f0f0',
          paddingTop: '16px',
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {currentStep === 1 && (
            <>
              <Tooltip title="撤回">
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
              <Tooltip title="重做">
                <Button
                  icon={<RedoOutlined />}
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
              <Tooltip title="放大">
                <Button
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={canvasState.scale >= 3}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
              <Tooltip title="缩小">
                <Button
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={canvasState.scale <= 0.3}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
              <Tooltip title="回到初始位置">
                <Button
                  icon={<HomeOutlined />}
                  onClick={handleResetPosition}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
              <div style={{
                width: '1px',
                height: '24px',
                backgroundColor: '#d9d9d9',
                margin: '0 8px'
              }} />
              <Tooltip title="自动排序">
                <Button
                  icon={<SortAscendingOutlined />}
                  onClick={autoSortNodes}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Tooltip>
            </>
          )}
          {currentStep === 1 && (
            <>
              {editingSubProcess ? (
                <>
                  <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={exitSubProcessMode}
                    type="primary"
                    style={{ 
                      borderRadius: '6px',
                      backgroundColor: '#ff4d4f',
                      borderColor: '#ff4d4f',
                      boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
                    }}
                  >
                    退出子流程编辑
                  </Button>
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    当前编辑: {nodes.find(n => n.id === editingSubProcess)?.customName || nodes.find(n => n.id === editingSubProcess)?.label || '阶段节点'}
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    icon={<PlayCircleOutlined />}
                    style={{ 
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    调试运行
                  </Button>
                </>
              )}
            </>
          )}
          <Button 
            onClick={onClose}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            取消
          </Button>
          {currentStep > 0 && (
            <Button 
              type="primary"
              onClick={handlePrev}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              上一步
            </Button>
          )}
          {currentStep >= 2 && (
            <Button 
              onClick={handleBack2Steps}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              回退2步
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button 
              type="primary" 
              onClick={handleNext}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              下一步
            </Button>
          ) : (
            <Button 
              type="primary" 
              loading={loading}
              onClick={handleSave}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {editData ? '保存' : '创建'}
            </Button>
          )}
        </div>
      </div>

      <StagePropertyPanel
        visible={stagePropertyPanelVisible}
        stageNode={selectedStageNode}
        onSave={handleSaveStageNode}
        onClose={handleCloseStagePropertyPanel}
      />

      <BusinessProcessPropertyPanel
        visible={businessProcessPropertyPanelVisible}
        businessProcessNode={selectedBusinessProcessNode}
        onSave={handleSaveBusinessProcessNode}
        onClose={handleCloseBusinessProcessPropertyPanel}
      />
    </Drawer>
  );
};

export default AddBehaviorTree;