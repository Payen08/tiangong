import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Tabs,
  Row,
  Col,
  Card,
  Radio,
  Space,
  Divider,
  message,
  Tooltip
} from 'antd';
import {
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TabPane } = Tabs;

interface FlowNode {
  id: string;
  type: 'start' | 'end' | 'stage';
  label: string;
  customName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  triggerCondition?: string;
  demandDevices?: string[];
  supplyDevices?: string[];
  data?: {
    deviceRequirements?: DeviceRequirement[];
    supplyDeviceRequirements?: SupplyDeviceRequirement[];
    stageStrategies?: StageStrategy[];
  };
}

interface DeviceRequirement {
  id: string;
  deviceType: string;
  devices: string[]; // 改为数组支持多选
  triggerType: 'general' | 'custom';
  conditionType: 'none' | 'conditional';
  conditionGroups?: TriggerConditionGroup[];
}

interface SupplyDeviceRequirement {
  id: string;
  deviceType: string;
  devices: string[]; // 改为数组支持多选
  triggerType: 'general' | 'custom';
  conditionType: 'none' | 'conditional';
  conditionGroups?: TriggerConditionGroup[];
}

interface TriggerConditionGroup {
  id: string;
  conditions: TriggerCondition[];
  logicOperator: 'and' | 'or';
}

interface TriggerCondition {
  id: string;
  dataSource: 'product' | 'global';
  dataItem?: string;
  productAttribute?: string;
  compareType?: 'greater' | 'equal' | 'less' | 'notEqual';
  value?: string;
}

interface StageStrategy {
  id: string;
  name: string;
  description?: string;
}

interface StagePropertyPanelProps {
  visible: boolean;
  stageNode: FlowNode | null;
  onClose: () => void;
  onSave: (updatedNode: FlowNode) => void;
}

const StagePropertyPanel: React.FC<StagePropertyPanelProps> = ({
  visible,
  stageNode,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('devices');
  const [deviceRequirements, setDeviceRequirements] = useState<DeviceRequirement[]>([]);
  const [supplyDeviceRequirements, setSupplyDeviceRequirements] = useState<SupplyDeviceRequirement[]>([]);
  const [stageStrategies, setStageStrategies] = useState<StageStrategy[]>([]);

  // 设备类型选项
  const deviceTypeOptions = [
    { label: '传感器', value: 'sensor' },
    { label: '执行器', value: 'actuator' },
    { label: '控制器', value: 'controller' },
    { label: '监控设备', value: 'monitor' }
  ];

  // 设备选项（根据设备类型动态变化）
  const getDeviceOptions = (deviceType: string) => {
    const deviceMap: Record<string, Array<{ label: string; value: string }>> = {
      sensor: [
        { label: '温度传感器', value: 'temp_sensor' },
        { label: '湿度传感器', value: 'humidity_sensor' },
        { label: '压力传感器', value: 'pressure_sensor' }
      ],
      actuator: [
        { label: '电机', value: 'motor' },
        { label: '阀门', value: 'valve' },
        { label: '泵', value: 'pump' }
      ],
      controller: [
        { label: 'PLC控制器', value: 'plc' },
        { label: '单片机', value: 'mcu' },
        { label: '工控机', value: 'ipc' }
      ],
      monitor: [
        { label: '摄像头', value: 'camera' },
        { label: '显示屏', value: 'display' },
        { label: '报警器', value: 'alarm' }
      ]
    };
    return deviceMap[deviceType] || [];
  };

  // 数据源选项
  const dataSourceOptions = [
    { label: '产品管理', value: 'product' },
    { label: '全局变量', value: 'global' }
  ];

  // 对比方式选项
  const compareTypeOptions = [
    { label: '大于', value: 'greater' },
    { label: '等于', value: 'equal' },
    { label: '小于', value: 'less' },
    { label: '不等于', value: 'notEqual' }
  ];

  // 初始化表单数据
  useEffect(() => {
    if (visible && stageNode) {
      form.setFieldsValue({
        id: stageNode.id,
        name: stageNode.customName || stageNode.label
      });
      
      // 初始化需求方设备，如果没有则创建默认的需求方设备1
      const existingDeviceRequirements = stageNode.data?.deviceRequirements || [];
      if (existingDeviceRequirements.length === 0) {
        const defaultDeviceRequirement: DeviceRequirement = {
          id: `req_${Date.now()}`,
          deviceType: '',
          devices: [], // 改为空数组
          triggerType: 'general',
          conditionType: 'none',
          conditionGroups: []
        };
        setDeviceRequirements([defaultDeviceRequirement]);
      } else {
        setDeviceRequirements(existingDeviceRequirements);
      }
      // 初始化供给方设备，如果没有则创建默认的供给方设备1
      const existingSupplyDevices = stageNode.data?.supplyDeviceRequirements || [];
      if (existingSupplyDevices.length === 0) {
        const defaultSupplyDevice: SupplyDeviceRequirement = {
          id: `supply_req_${Date.now()}`,
          deviceType: '',
          devices: [], // 改为空数组
          triggerType: 'general',
          conditionType: 'none',
          conditionGroups: []
        };
        setSupplyDeviceRequirements([defaultSupplyDevice]);
      } else {
        setSupplyDeviceRequirements(existingSupplyDevices);
      }
      setStageStrategies(stageNode.data?.stageStrategies || []);
    }
  }, [visible, stageNode, form]);





  // 更新设备需求
  const updateDeviceRequirement = (id: string, updates: Partial<DeviceRequirement>): void => {
    setDeviceRequirements(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  // 更新供给方设备需求
  const updateSupplyDeviceRequirement = (id: string, updates: Partial<SupplyDeviceRequirement>): void => {
    setSupplyDeviceRequirements(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  // 添加触发条件组
  const addTriggerConditionGroup = (requirementId: string): void => {
    const newGroup: TriggerConditionGroup = {
      id: `group_${Date.now()}`,
      conditions: [{
        id: `cond_${Date.now()}`,
        dataSource: 'product'
      }],
      logicOperator: 'and'
    };
    
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    updateDeviceRequirement(requirementId, {
      conditionGroups: [...(requirement?.conditionGroups || []), newGroup]
    });
  };

  // 添加供给方设备触发条件组
  const addSupplyTriggerConditionGroup = (requirementId: string): void => {
    const newGroup: TriggerConditionGroup = {
      id: `group_${Date.now()}`,
      conditions: [{
        id: `cond_${Date.now()}`,
        dataSource: 'product'
      }],
      logicOperator: 'and'
    };
    
    const requirement = supplyDeviceRequirements.find(req => req.id === requirementId);
    updateSupplyDeviceRequirement(requirementId, {
      conditionGroups: [...(requirement?.conditionGroups || []), newGroup]
    });
  };

  // 添加触发条件到组
  const addTriggerCondition = (requirementId: string, groupId: string): void => {
    const newCondition: TriggerCondition = {
      id: `cond_${Date.now()}`,
      dataSource: 'product'
    };
    
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId 
          ? { ...group, conditions: [...group.conditions, newCondition] }
          : group
      ) || [];
      
      updateDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 添加供给方设备触发条件到组
  const addSupplyTriggerCondition = (requirementId: string, groupId: string): void => {
    const newCondition: TriggerCondition = {
      id: `cond_${Date.now()}`,
      dataSource: 'product'
    };
    
    const requirement = supplyDeviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId 
          ? { ...group, conditions: [...group.conditions, newCondition] }
          : group
      ) || [];
      
      updateSupplyDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 删除触发条件组
  const removeTriggerConditionGroup = (requirementId: string, groupId: string): void => {
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      updateDeviceRequirement(requirementId, {
        conditionGroups: requirement.conditionGroups?.filter(group => group.id !== groupId) || []
      });
    }
  };

  // 删除供给方设备触发条件组
  const removeSupplyTriggerConditionGroup = (requirementId: string, groupId: string): void => {
    const requirement = supplyDeviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      updateSupplyDeviceRequirement(requirementId, {
        conditionGroups: requirement.conditionGroups?.filter(group => group.id !== groupId) || []
      });
    }
  };

  // 删除触发条件
  const removeTriggerCondition = (requirementId: string, groupId: string, conditionId: string): void => {
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId 
          ? { ...group, conditions: group.conditions.filter(cond => cond.id !== conditionId) }
          : group
      ) || [];
      
      updateDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 删除供给方设备触发条件
  const removeSupplyTriggerCondition = (requirementId: string, groupId: string, conditionId: string): void => {
    const requirement = supplyDeviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId 
          ? { ...group, conditions: group.conditions.filter(cond => cond.id !== conditionId) }
          : group
      ) || [];
      
      updateSupplyDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 更新触发条件组
  const updateTriggerConditionGroup = (requirementId: string, groupId: string, updates: Partial<TriggerConditionGroup>): void => {
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      ) || [];
      
      updateDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 更新供给方设备触发条件组
  const updateSupplyTriggerConditionGroup = (requirementId: string, groupId: string, updates: Partial<TriggerConditionGroup>): void => {
    const requirement = supplyDeviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      ) || [];
      
      updateSupplyDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 更新触发条件
  const updateTriggerCondition = (requirementId: string, groupId: string, conditionId: string, updates: Partial<TriggerCondition>): void => {
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId 
          ? {
              ...group, 
              conditions: group.conditions.map(cond => 
                cond.id === conditionId ? { ...cond, ...updates } : cond
              )
            }
          : group
      ) || [];
      
      updateDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 更新供给方设备触发条件
  const updateSupplyTriggerCondition = (requirementId: string, groupId: string, conditionId: string, updates: Partial<TriggerCondition>): void => {
    const requirement = supplyDeviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      const updatedGroups = requirement.conditionGroups?.map(group => 
        group.id === groupId 
          ? {
              ...group, 
              conditions: group.conditions.map(cond => 
                cond.id === conditionId ? { ...cond, ...updates } : cond
              )
            }
          : group
      ) || [];
      
      updateSupplyDeviceRequirement(requirementId, {
        conditionGroups: updatedGroups
      });
    }
  };

  // 保存阶段属性
  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      
      // 验证名称长度和格式
      if (values.name && values.name.length > 6) {
        message.error('名称最多6个汉字');
        return;
      }
      
      if (values.name && /\s/.test(values.name)) {
        message.error('名称不支持空格');
        return;
      }

      // 收集所有选中的需求方设备
      const allDemandDevices: string[] = [];
      deviceRequirements.forEach(req => {
        if (req.devices && req.devices.length > 0) {
          allDemandDevices.push(...req.devices);
        }
      });

      // 收集所有选中的供给方设备
      const allSupplyDevices: string[] = [];
      supplyDeviceRequirements.forEach(req => {
        if (req.devices && req.devices.length > 0) {
          allSupplyDevices.push(...req.devices);
        }
      });

      const updatedNode: FlowNode = {
        ...stageNode!,
        customName: values.name,
        label: values.name || stageNode!.label,
        demandDevices: allDemandDevices, // 同步需求方设备到节点
        supplyDevices: allSupplyDevices, // 同步供给方设备到节点
        data: {
          deviceRequirements,
          supplyDeviceRequirements,
          stageStrategies
        }
      };

      onSave(updatedNode);
      message.success('阶段属性保存成功');
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 渲染设备需求表单
  const renderDeviceRequirement = (requirement: DeviceRequirement, index: number): JSX.Element => (
    <Card
      key={requirement.id}
      size="small"
      title="需求方设备"
      style={{ marginBottom: 16 }}
    >
      {/* 设备类型 - 第一行 */}
      <Row gutter={16}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', color: '#262626' }}>设备类型 <span style={{ color: '#ff4d4f' }}>*</span></span>
          </div>
          <Select
            placeholder="请选择设备类型"
            value={requirement.deviceType}
            onChange={(value: string) => updateDeviceRequirement(requirement.id, { deviceType: value, devices: [] })}
            style={{ width: '100%' }}
          >
            {deviceTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* 设备 - 第二行 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', color: '#262626' }}>设备 <span style={{ color: '#ff4d4f' }}>*</span></span>
          </div>
          <Select
            mode="multiple"
            placeholder="请选择设备（支持多选）"
            value={requirement.devices}
            onChange={(value: string[]) => updateDeviceRequirement(requirement.id, { devices: value })}
            disabled={!requirement.deviceType}
            style={{ width: '100%' }}
          >
            {getDeviceOptions(requirement.deviceType).map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* 触发条件 - 独占一行 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', color: '#262626' }}>触发条件</span>
          </div>
          <Radio.Group
            value={requirement.conditionType}
            onChange={(e) => updateDeviceRequirement(requirement.id, { conditionType: e.target.value })}
          >
            <Radio value="none">无条件触发</Radio>
            <Radio value="conditional">有条件触发</Radio>
          </Radio.Group>
        </Col>
      </Row>

      {requirement.conditionType === 'conditional' && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fafafa', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 500 }}>触发条件设置</span>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addTriggerConditionGroup(requirement.id)}
            >
              添加条件组
            </Button>
          </div>

          {requirement.conditionGroups?.map((group, groupIndex) => (
            <div key={group.id} style={{ marginBottom: 16 }}>
              {groupIndex > 0 && (
                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                  <span style={{ 
                    background: '#f0f0f0', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    或
                  </span>
                </div>
              )}
              
              <Card 
                size="small" 
                style={{ 
                  marginBottom: 8,
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px' }}>条件组 {groupIndex + 1}</span>
                    <div>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => addTriggerCondition(requirement.id, group.id)}
                        style={{ marginRight: 4 }}
                      >
                        添加条件
                      </Button>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeTriggerConditionGroup(requirement.id, group.id)}
                      />
                    </div>
                  </div>
                }
              >
                {group.conditions.map((condition, condIndex) => (
                  <div key={condition.id}>
                    {condIndex > 0 && (
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <Radio.Group
                          value={group.logicOperator}
                          onChange={(e) => updateTriggerConditionGroup(requirement.id, group.id, { logicOperator: e.target.value })}
                          size="small"
                        >
                          <Radio.Button value="and">且</Radio.Button>
                          <Radio.Button value="or">或</Radio.Button>
                        </Radio.Group>
                      </div>
                    )}
                    
                    <Card 
                      size="small" 
                      style={{ marginBottom: 8, background: '#fafafa' }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>条件 {condIndex + 1}</span>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeTriggerCondition(requirement.id, group.id, condition.id)}
                          />
                        </div>
                      }
                    >
                      {/* 数据源 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>数据源</span>
                          </div>
                          <Select
                            placeholder="请选择数据源"
                            value={condition.dataSource}
                            onChange={(value: 'product' | 'global') => updateTriggerCondition(requirement.id, group.id, condition.id, { 
                              dataSource: value,
                              dataItem: undefined,
                              productAttribute: undefined
                            })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            {dataSourceOptions.map(option => (
                              <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 数据项 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>数据项</span>
                          </div>
                          <Select
                            placeholder="请选择数据项"
                            value={condition.dataItem}
                            onChange={(value: string) => updateTriggerCondition(requirement.id, group.id, condition.id, { dataItem: value })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            <Option value="item1">数据项1</Option>
                            <Option value="item2">数据项2</Option>
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 属性 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>属性</span>
                          </div>
                          <Select
                            placeholder="请选择属性"
                            value={condition.productAttribute}
                            onChange={(value: string) => updateTriggerCondition(requirement.id, group.id, condition.id, { productAttribute: value })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            <Option value="attr1">属性1</Option>
                            <Option value="attr2">属性2</Option>
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 对比方式 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>对比方式</span>
                          </div>
                          <Select
                            placeholder="请选择对比方式"
                            value={condition.compareType}
                            onChange={(value: 'greater' | 'equal' | 'less' | 'notEqual') => updateTriggerCondition(requirement.id, group.id, condition.id, { compareType: value })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            {compareTypeOptions.map(option => (
                              <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 值 - 独占一行 */}
                      <Row gutter={8}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>值</span>
                          </div>
                          <Input
                            placeholder="请输入值"
                            value={condition.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTriggerCondition(requirement.id, group.id, condition.id, { value: e.target.value })}
                            size="small"
                          />
                        </Col>
                      </Row>
                    </Card>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  // 渲染供给方设备需求表单
  const renderSupplyDeviceRequirement = (requirement: SupplyDeviceRequirement, index: number): JSX.Element => (
    <Card
      key={requirement.id}
      size="small"
      title="供给方设备"
      style={{ marginBottom: 16 }}
    >
      {/* 设备类型 - 第一行 */}
      <Row gutter={16}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', color: '#262626' }}>设备类型 <span style={{ color: '#ff4d4f' }}>*</span></span>
          </div>
          <Select
            placeholder="请选择设备类型"
            value={requirement.deviceType}
            onChange={(value: string) => updateSupplyDeviceRequirement(requirement.id, { deviceType: value, devices: [] })}
            style={{ width: '100%' }}
          >
            {deviceTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* 设备 - 第二行 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', color: '#262626' }}>设备 <span style={{ color: '#ff4d4f' }}>*</span></span>
          </div>
          <Select
            mode="multiple"
            placeholder="请选择设备（支持多选）"
            value={requirement.devices}
            onChange={(value: string[]) => updateSupplyDeviceRequirement(requirement.id, { devices: value })}
            disabled={!requirement.deviceType}
            style={{ width: '100%' }}
          >
            {getDeviceOptions(requirement.deviceType).map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* 触发条件 - 独占一行 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: '14px', color: '#262626' }}>触发条件</span>
          </div>
          <Radio.Group
            value={requirement.conditionType}
            onChange={(e) => updateSupplyDeviceRequirement(requirement.id, { conditionType: e.target.value })}
          >
            <Radio value="none">无条件触发</Radio>
            <Radio value="conditional">有条件触发</Radio>
          </Radio.Group>
        </Col>
      </Row>

      {requirement.conditionType === 'conditional' && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fafafa', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 500 }}>触发条件设置</span>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addSupplyTriggerConditionGroup(requirement.id)}
            >
              添加条件组
            </Button>
          </div>

          {requirement.conditionGroups?.map((group, groupIndex) => (
            <div key={group.id} style={{ marginBottom: 16 }}>
              {groupIndex > 0 && (
                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                  <span style={{ 
                    background: '#f0f0f0', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    或
                  </span>
                </div>
              )}
              
              <Card 
                size="small" 
                style={{ 
                  marginBottom: 8,
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px' }}>条件组 {groupIndex + 1}</span>
                    <div>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => addSupplyTriggerCondition(requirement.id, group.id)}
                        style={{ marginRight: 4 }}
                      >
                        添加条件
                      </Button>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeSupplyTriggerConditionGroup(requirement.id, group.id)}
                      />
                    </div>
                  </div>
                }
              >
                {group.conditions.map((condition, condIndex) => (
                  <div key={condition.id}>
                    {condIndex > 0 && (
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <Radio.Group
                          value={group.logicOperator}
                          onChange={(e) => updateSupplyTriggerConditionGroup(requirement.id, group.id, { logicOperator: e.target.value })}
                          size="small"
                        >
                          <Radio.Button value="and">且</Radio.Button>
                          <Radio.Button value="or">或</Radio.Button>
                        </Radio.Group>
                      </div>
                    )}
                    
                    <Card 
                      size="small" 
                      style={{ marginBottom: 8, background: '#fafafa' }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>条件 {condIndex + 1}</span>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeSupplyTriggerCondition(requirement.id, group.id, condition.id)}
                          />
                        </div>
                      }
                    >
                      {/* 数据源 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>数据源</span>
                          </div>
                          <Select
                            placeholder="请选择数据源"
                            value={condition.dataSource}
                            onChange={(value: 'product' | 'global') => updateSupplyTriggerCondition(requirement.id, group.id, condition.id, { 
                              dataSource: value,
                              dataItem: undefined,
                              productAttribute: undefined
                            })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            {dataSourceOptions.map(option => (
                              <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 数据项 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>数据项</span>
                          </div>
                          <Select
                            placeholder="请选择数据项"
                            value={condition.dataItem}
                            onChange={(value: string) => updateSupplyTriggerCondition(requirement.id, group.id, condition.id, { dataItem: value })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            <Option value="item1">数据项1</Option>
                            <Option value="item2">数据项2</Option>
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 属性 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>属性</span>
                          </div>
                          <Select
                            placeholder="请选择属性"
                            value={condition.productAttribute}
                            onChange={(value: string) => updateSupplyTriggerCondition(requirement.id, group.id, condition.id, { productAttribute: value })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            <Option value="attr1">属性1</Option>
                            <Option value="attr2">属性2</Option>
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 对比方式 - 独占一行 */}
                      <Row gutter={8} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>对比方式</span>
                          </div>
                          <Select
                            placeholder="请选择对比方式"
                            value={condition.compareType}
                            onChange={(value: 'greater' | 'equal' | 'less' | 'notEqual') => updateSupplyTriggerCondition(requirement.id, group.id, condition.id, { compareType: value })}
                            size="small"
                            style={{ width: '100%' }}
                          >
                            {compareTypeOptions.map(option => (
                              <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                          </Select>
                        </Col>
                      </Row>
                      
                      {/* 值 - 独占一行 */}
                      <Row gutter={8}>
                        <Col span={24}>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>值</span>
                          </div>
                          <Input
                            placeholder="请输入值"
                            value={condition.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSupplyTriggerCondition(requirement.id, group.id, condition.id, { value: e.target.value })}
                            size="small"
                          />
                        </Col>
                      </Row>
                    </Card>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  if (!visible) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        background: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '0',
        zIndex: 1000,
        width: '320px',
        height: 'calc(100vh - 32px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 标题栏 */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontSize: '16px', fontWeight: 500 }}>阶段</span>
        </div>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>
      
      {/* 内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="ID"
          name="id"
        >
          <Input disabled placeholder="系统自动生成" />
        </Form.Item>

        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 6, message: '名称最多6个汉字' },
            { pattern: /^\S*$/, message: '名称不支持空格' }
          ]}
        >
          <Input placeholder="请输入名称（最多6个汉字，不支持空格）" maxLength={6} />
        </Form.Item>
      </Form>

      <Divider />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="阶段设备" key="devices">
          <div style={{ marginBottom: 16 }}>
            {deviceRequirements.map((requirement, index) => 
              renderDeviceRequirement(requirement, index)
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            {supplyDeviceRequirements.map((requirement, index) => 
              renderSupplyDeviceRequirement(requirement, index)
            )}
          </div>
        </TabPane>

        <TabPane tab="阶段策略" key="strategies">
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            阶段策略功能开发中...
          </div>
        </TabPane>
      </Tabs>
      </div>
    </div>
  );
};

export default StagePropertyPanel;