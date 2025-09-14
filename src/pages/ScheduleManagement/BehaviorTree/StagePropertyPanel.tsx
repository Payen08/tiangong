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

} from 'antd';
import {

  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  SwapOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TabPane } = Tabs;

type NodeType = 'start' | 'end' | 'stage' | 'businessProcess' | 'sequence' | 'parallel' | 'condition' | 'inverter' | 'repeat';

interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  customName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  triggerCondition?: string;
  demandDevicesTriggerCondition?: string; // 需求方设备触发条件
  demandDevices?: string[];
  demandDevicesNames?: string;
  data?: {
    deviceRequirements?: DeviceRequirement[];
    stageStrategies?: StageStrategy[];
  };
  // 行为树节点特有属性
  behaviorTreeData?: {
    status?: 'success' | 'failure' | 'running' | 'idle';
    conditionExpression?: string;
    repeatCount?: number;
    maxRetries?: number;
    timeout?: number;
    description?: string;
    priority?: number;
  };
}

interface DeviceRequirement {
  id: string;
  deviceType?: string;
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

  // 根据设备ID获取设备中文名称
  const getDeviceNameById = (deviceId: string): string => {
    for (const deviceType in getDeviceOptions('')) {
      const options = getDeviceOptions(deviceType);
      const device = options.find(option => option.value === deviceId);
      if (device) {
        return device.label;
      }
    }
    // 如果没找到，遍历所有设备类型
    const allDeviceTypes = ['sensor', 'actuator', 'controller', 'monitor'];
    for (const deviceType of allDeviceTypes) {
      const options = getDeviceOptions(deviceType);
      const device = options.find(option => option.value === deviceId);
      if (device) {
        return device.label;
      }
    }
    return deviceId; // 如果找不到，返回原始ID
  };

  // 格式化触发条件为中文
  const formatTriggerCondition = (condition: any): string => {
    const compareTypeMap: Record<string, string> = {
      'greater': '>',
      'equal': '==',
      'less': '<',
      'notEqual': '!='
    };
    
    const compareSymbol = compareTypeMap[condition.compareType] || condition.compareType;
    return `${condition.dataItem}${compareSymbol}${condition.value}`;
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
          deviceType: undefined,
          devices: [], // 改为空数组
          triggerType: 'general',
          conditionType: 'none',
          conditionGroups: []
        };
        setDeviceRequirements([defaultDeviceRequirement]);
      } else {
        setDeviceRequirements(existingDeviceRequirements);
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



  // 删除触发条件组
  const removeTriggerConditionGroup = (requirementId: string, groupId: string): void => {
    const requirement = deviceRequirements.find(req => req.id === requirementId);
    if (requirement) {
      updateDeviceRequirement(requirementId, {
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

      // 收集所有选中的需求方设备（原始ID）
      const allDemandDevices: string[] = [];
      deviceRequirements.forEach(req => {
        if (req.devices && req.devices.length > 0) {
          allDemandDevices.push(...req.devices);
        }
      });



      // 收集需求方设备的中文名称
      const demandDeviceNames: string[] = [];
      deviceRequirements.forEach(req => {
        if (req.devices && req.devices.length > 0) {
          req.devices.forEach(deviceId => {
            const deviceName = getDeviceNameById(deviceId);
            demandDeviceNames.push(deviceName);
          });
        }
      });



      // 分别收集需求方和供给方设备的触发条件
      const demandTriggerConditions: string[] = [];
      deviceRequirements.forEach(req => {
        req.conditionGroups?.forEach(group => {
          group.conditions.forEach(condition => {
            if (condition.dataItem && condition.compareType && condition.value) {
              const conditionText = formatTriggerCondition(condition);
              demandTriggerConditions.push(conditionText);
            }
          });
        });
      });
      const demandTriggerConditionText = demandTriggerConditions.length > 0 ? demandTriggerConditions.join(' && ') : '';



      // 保持原有的triggerCondition字段为兼容性
      const triggerConditionText = demandTriggerConditions.join(' && ');

      const updatedNode: FlowNode = {
        ...stageNode!,
        customName: values.name,
        label: values.name || stageNode!.label,
        demandDevices: allDemandDevices, // 同步需求方设备到节点（原始ID）
        demandDevicesNames: demandDeviceNames.join(', '), // 需求方设备中文名称
        triggerCondition: triggerConditionText, // 同步触发条件到节点
        demandDevicesTriggerCondition: demandTriggerConditionText, // 需求方设备触发条件
         data: {
          deviceRequirements,
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
  const renderDeviceRequirement = (requirement: DeviceRequirement): JSX.Element => (
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
            {getDeviceOptions(requirement.deviceType || '').map(option => (
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
            {deviceRequirements.map((requirement) => 
              renderDeviceRequirement(requirement)
            )}
          </div>


        </TabPane>

        <TabPane tab="行为树" key="behavior-tree">
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>
              选择节点类型
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 行为树控制节点 */}
              <div style={{ marginTop: '16px', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#666' }}>
                行为树控制节点
              </div>
              <Button 
                type="default" 
                icon={<OrderedListOutlined />}
                onClick={() => {
                  // TODO: 处理顺序节点选择
                  message.info('顺序节点功能开发中...');
                }}
                style={{ textAlign: 'left', height: '40px' }}
              >
                顺序节点
              </Button>
              <Button 
                type="default" 
                icon={<AppstoreOutlined />}
                onClick={() => {
                  // TODO: 处理并行节点选择
                  message.info('并行节点功能开发中...');
                }}
                style={{ textAlign: 'left', height: '40px' }}
              >
                并行节点
              </Button>
              <Button 
                type="default" 
                icon={<QuestionCircleOutlined />}
                onClick={() => {
                  // TODO: 处理条件节点选择
                  message.info('条件节点功能开发中...');
                }}
                style={{ textAlign: 'left', height: '40px' }}
              >
                条件节点
              </Button>
              <Button 
                type="default" 
                icon={<SwapOutlined />}
                onClick={() => {
                  // TODO: 处理逆变节点选择
                  message.info('逆变节点功能开发中...');
                }}
                style={{ textAlign: 'left', height: '40px' }}
              >
                逆变节点
              </Button>
              <Button 
                type="default" 
                icon={<ReloadOutlined />}
                onClick={() => {
                  // TODO: 处理重复节点选择
                  message.info('重复节点功能开发中...');
                }}
                style={{ textAlign: 'left', height: '40px' }}
              >
                重复节点
              </Button>
            </div>
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