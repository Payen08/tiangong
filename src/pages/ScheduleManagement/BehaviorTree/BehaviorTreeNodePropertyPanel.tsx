import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
  InputNumber,

  Tabs,
  Tag,
  Radio,

} from 'antd';
import {
  SettingOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  SwapOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { isDev } from '@/lib/utils';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// 条件项接口
interface TriggerCondition {
  id: string;
  dataSource: string;
  dataItem: string;
  property: string;
  compareType: string;
  value: string;
}

// 条件组接口
interface TriggerConditionGroup {
  id: string;
  logicOperator: 'and' | 'or';
  conditions: TriggerCondition[];
}

interface FlowNode {
  id: string;
  type: 'start' | 'end' | 'stage' | 'businessProcess' | 'sequence' | 'parallel' | 'condition' | 'inverter' | 'repeat';
  label: string;
  customName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  behaviorTreeData?: {
    status?: 'success' | 'failure' | 'running' | 'idle';
    conditionExpression?: string;
    conditionGroups?: TriggerConditionGroup[];
    repeatCount?: number;
    maxRetries?: number;
    timeout?: number;
    description?: string;
    priority?: number;
    parallelPolicy?: 'all' | 'any' | 'count';
    requiredSuccessCount?: number;
    failurePolicy?: 'immediate' | 'continue';
    retryDelay?: number;
    maxExecutionTime?: number;
  };
}

interface BehaviorTreeNodePropertyPanelProps {
  visible: boolean;
  behaviorTreeNode: FlowNode | null;
  onClose: () => void;
  onSave: (updatedNode: FlowNode) => void;
  readonly?: boolean;
  positioning?: 'fixed' | 'relative'; // 新增定位方式属性
}

const BehaviorTreeNodePropertyPanel: React.FC<BehaviorTreeNodePropertyPanelProps> = ({
  visible,
  behaviorTreeNode,
  onClose,
  onSave,
  readonly = false,
  positioning = 'relative' // 默认使用相对定位
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [conditionGroups, setConditionGroups] = useState<TriggerConditionGroup[]>([]);

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

  // 获取节点类型对应的图标和标题
  const getNodeTypeInfo = (type: string) => {
    switch (type) {
      case 'sequence':
        return { icon: <OrderedListOutlined />, title: '顺序节点', color: '#1890ff' };
      case 'parallel':
        return { icon: <AppstoreOutlined />, title: '并行节点', color: '#52c41a' };
      case 'condition':
        return { icon: <QuestionCircleOutlined />, title: '条件节点', color: '#faad14' };
      case 'inverter':
        return { icon: <SwapOutlined />, title: '逆变节点', color: '#722ed1' };
      case 'repeat':
        return { icon: <ReloadOutlined />, title: '重复节点', color: '#eb2f96' };
      default:
        return { icon: <SettingOutlined />, title: '行为树节点', color: '#666666' };
    }
  };

  // 条件组管理函数
  const addConditionGroup = () => {
    const newGroup: TriggerConditionGroup = {
      id: `group_${Date.now()}`,
      logicOperator: 'and',
      conditions: [{
        id: `condition_${Date.now()}`,
        dataSource: 'product',
        dataItem: '',
        property: '',
        compareType: 'equal',
        value: ''
      }]
    };
    setConditionGroups([...conditionGroups, newGroup]);
  };

  const removeConditionGroup = (groupId: string) => {
    setConditionGroups(conditionGroups.filter(group => group.id !== groupId));
  };

  const updateConditionGroup = (groupId: string, updates: Partial<TriggerConditionGroup>) => {
    setConditionGroups(conditionGroups.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ));
  };

  const addCondition = (groupId: string) => {
    const newCondition: TriggerCondition = {
      id: `condition_${Date.now()}`,
      dataSource: 'product',
      dataItem: '',
      property: '',
      compareType: 'equal',
      value: ''
    };
    setConditionGroups(conditionGroups.map(group => 
      group.id === groupId 
        ? { ...group, conditions: [...group.conditions, newCondition] }
        : group
    ));
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setConditionGroups(conditionGroups.map(group => 
      group.id === groupId 
        ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
        : group
    ));
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<TriggerCondition>) => {
    setConditionGroups(conditionGroups.map(group => 
      group.id === groupId 
        ? {
            ...group, 
            conditions: group.conditions.map(condition => 
              condition.id === conditionId ? { ...condition, ...updates } : condition
            )
          }
        : group
    ));
  };

  // 初始化表单数据
  useEffect(() => {
    if (visible && behaviorTreeNode) {
      const behaviorData = behaviorTreeNode.behaviorTreeData || {};
      
      form.setFieldsValue({
        id: behaviorTreeNode.id,
        name: behaviorTreeNode.customName || behaviorTreeNode.label,
        description: behaviorData.description || '',
        priority: behaviorData.priority || 1,
        timeout: behaviorData.timeout || 5000,
        maxRetries: behaviorData.maxRetries || 0,
        retryDelay: behaviorData.retryDelay || 1000,
        maxExecutionTime: behaviorData.maxExecutionTime || 30000,
        
        // 条件节点特有
        conditionExpression: behaviorData.conditionExpression || '',
        
        // 重复节点特有
        repeatCount: behaviorData.repeatCount || 1,
        
        // 并行节点特有
        parallelPolicy: behaviorData.parallelPolicy || 'all',
        requiredSuccessCount: behaviorData.requiredSuccessCount || 1,
        failurePolicy: behaviorData.failurePolicy || 'immediate'
      });
      
      // 初始化条件组数据
      if (behaviorTreeNode.type === 'condition' && behaviorTreeNode.behaviorTreeData?.conditionGroups) {
        setConditionGroups(behaviorTreeNode.behaviorTreeData.conditionGroups);
      } else if (behaviorTreeNode.type === 'condition') {
        // 如果没有条件组数据，创建默认的条件组
        setConditionGroups([{
          id: `group_${Date.now()}`,
          logicOperator: 'and',
          conditions: [{
            id: `condition_${Date.now()}`,
            dataSource: 'product',
            dataItem: '',
            property: '',
            compareType: 'equal',
            value: ''
          }]
        }]);
      }
    }
  }, [visible, behaviorTreeNode, form]);

  // 保存节点属性
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (!behaviorTreeNode) return;

      // 验证名称
      if (values.name && values.name.length > 20) {
        message.error('节点名称最多20个字符');
        return;
      }

      const updatedNode: FlowNode = {
        ...behaviorTreeNode,
        customName: values.name,
        behaviorTreeData: {
          ...behaviorTreeNode.behaviorTreeData,
          description: values.description,
          priority: values.priority,
          timeout: values.timeout,
          maxRetries: values.maxRetries,
          retryDelay: values.retryDelay,
          maxExecutionTime: values.maxExecutionTime,
          
          // 条件节点特有
          ...(behaviorTreeNode.type === 'condition' && {
            conditionExpression: values.conditionExpression,
            conditionGroups: conditionGroups
          }),
          
          // 重复节点特有
          ...(behaviorTreeNode.type === 'repeat' && {
            repeatCount: values.repeatCount
          }),
          
          // 并行节点特有
          ...(behaviorTreeNode.type === 'parallel' && {
            parallelPolicy: values.parallelPolicy,
            requiredSuccessCount: values.requiredSuccessCount,
            failurePolicy: values.failurePolicy
          })
        }
      };

      onSave(updatedNode);
      message.success('节点属性保存成功！');
    } catch (error) {
      if (isDev) console.error('保存失败:', error);
      message.error('保存失败，请检查输入内容');
    }
  };

  // 渲染节点特有配置
  const renderNodeSpecificConfig = () => {
    if (!behaviorTreeNode) return null;

    switch (behaviorTreeNode.type) {
      case 'condition':
        return (
          <Card title="条件配置" size="small" style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 500 }}>条件组配置</span>
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={addConditionGroup}
                  disabled={readonly}
                >
                  添加条件组
                </Button>
              </div>
              
              {conditionGroups.map((group, groupIndex) => (
                <Card 
                  key={group.id}
                  size="small" 
                  style={{ marginBottom: 12 }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>条件组 {groupIndex + 1}</span>
                      <Button 
                        type="text" 
                        size="small" 
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeConditionGroup(group.id)}
                        disabled={conditionGroups.length === 1 || readonly}
                      />
                    </div>
                  }
                >
                  {/* 条件组逻辑运算符 */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ marginRight: 8 }}>组内逻辑:</span>
                    <Radio.Group
                      value={group.logicOperator}
                      onChange={(e) => updateConditionGroup(group.id, { logicOperator: e.target.value })}
                      size="small"
                      disabled={readonly}
                    >
                      <Radio.Button value="and">且(AND)</Radio.Button>
                      <Radio.Button value="or">或(OR)</Radio.Button>
                    </Radio.Group>
                  </div>
                  
                  {/* 条件项列表 */}
                  {group.conditions.map((condition, conditionIndex) => (
                    <Card 
                      key={condition.id}
                      size="small" 
                      style={{ marginBottom: 8, backgroundColor: '#fafafa' }}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px' }}>条件 {conditionIndex + 1}</span>
                          <div>
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<PlusOutlined />}
                              onClick={() => addCondition(group.id)}
                              style={{ marginRight: 4 }}
                              disabled={readonly}
                            />
                            <Button 
                              type="text" 
                              size="small" 
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeCondition(group.id, condition.id)}
                              disabled={group.conditions.length === 1 || readonly}
                            />
                          </div>
                        </div>
                      }
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* 数据源 */}
                        <div>
                          <label style={{ fontSize: '12px', color: '#666' }}>数据源</label>
                          <Select
                             size="small"
                             value={condition.dataSource}
                             onChange={(value: string) => updateCondition(group.id, condition.id, { dataSource: value })}
                             style={{ width: '100%' }}
                             placeholder="选择数据源"
                             disabled={readonly}
                           >
                            {dataSourceOptions.map(option => (
                              <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                          </Select>
                        </div>
                        
                        {/* 数据项 */}
                        <div>
                          <label style={{ fontSize: '12px', color: '#666' }}>数据项</label>
                          <Input
                             size="small"
                             value={condition.dataItem}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(group.id, condition.id, { dataItem: e.target.value })}
                             placeholder="输入数据项"
                             disabled={readonly}
                           />
                        </div>
                        
                        {/* 属性 */}
                        <div>
                          <label style={{ fontSize: '12px', color: '#666' }}>属性</label>
                          <Input
                             size="small"
                             value={condition.property}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(group.id, condition.id, { property: e.target.value })}
                             placeholder="输入属性"
                             disabled={readonly}
                           />
                        </div>
                        
                        {/* 对比方式 */}
                        <div>
                          <label style={{ fontSize: '12px', color: '#666' }}>对比方式</label>
                          <Select
                             size="small"
                             value={condition.compareType}
                             onChange={(value: string) => updateCondition(group.id, condition.id, { compareType: value })}
                             style={{ width: '100%' }}
                             placeholder="选择对比方式"
                             disabled={readonly}
                           >
                            {compareTypeOptions.map(option => (
                              <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                          </Select>
                        </div>
                        
                        {/* 值 */}
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '12px', color: '#666' }}>值</label>
                          <Input
                             size="small"
                             value={condition.value}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(group.id, condition.id, { value: e.target.value })}
                             placeholder="输入比较值"
                             disabled={readonly}
                           />
                        </div>
                      </div>
                    </Card>
                  ))}
                </Card>
              ))}
            </div>
          </Card>
        );
        
      case 'repeat':
        return (
          <Card title="重复配置" size="small" style={{ marginBottom: 12 }}>
            <Form.Item
              label="重复次数"
              name="repeatCount"
              rules={[{ required: true, message: '请输入重复次数' }]}
            >
              <InputNumber 
                min={1} 
                max={1000} 
                placeholder="重复执行次数"
                style={{ width: '100%' }}
                disabled={readonly}
              />
            </Form.Item>
          </Card>
        );
        
      case 'parallel':
        return (
          <Card title="并行配置" size="small" style={{ marginBottom: 12 }}>
            <Form.Item
              label="成功策略"
              name="parallelPolicy"
              tooltip="all: 所有子节点成功; any: 任一子节点成功; count: 指定数量成功"
            >
              <Select placeholder="选择成功策略" disabled={readonly}>
                <Option value="all">全部成功</Option>
                <Option value="any">任一成功</Option>
                <Option value="count">指定数量成功</Option>
              </Select>
            </Form.Item>
            
            {form.getFieldValue('parallelPolicy') === 'count' && (
              <Form.Item
                label="所需成功数量"
                name="requiredSuccessCount"
                rules={[{ required: true, message: '请输入所需成功数量' }]}
              >
                <InputNumber 
                  min={1} 
                  max={10} 
                  placeholder="所需成功的子节点数量"
                  style={{ width: '100%' }}
                  disabled={readonly}
                />
              </Form.Item>
            )}
            
            <Form.Item
              label="失败策略"
              name="failurePolicy"
              tooltip="immediate: 立即失败; continue: 继续执行"
            >
              <Select placeholder="选择失败策略" disabled={readonly}>
                <Option value="immediate">立即失败</Option>
                <Option value="continue">继续执行</Option>
              </Select>
            </Form.Item>
          </Card>
        );
        
      case 'sequence':
        return (
          <Card title="顺序配置" size="small" style={{ marginBottom: 12 }}>
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              <OrderedListOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>顺序节点按顺序执行子节点</div>
              <div style={{ fontSize: 12 }}>任一子节点失败则整体失败</div>
            </div>
          </Card>
        );
        
      case 'inverter':
        return (
          <Card title="逆变配置" size="small" style={{ marginBottom: 12 }}>
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              <SwapOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>逆变节点反转子节点的执行结果</div>
              <div style={{ fontSize: 12 }}>成功变失败，失败变成功</div>
            </div>
          </Card>
        );
        
      default:
        return null;
    }
  };

  if (!visible || !behaviorTreeNode) {
    return null;
  }

  const nodeInfo = getNodeTypeInfo(behaviorTreeNode.type);

  // 根据positioning属性动态设置样式
  const containerStyle = positioning === 'fixed' 
    ? {
        position: 'fixed' as const,
        top: '16px',
        right: '16px',
        zIndex: 1000,
        width: '320px',
        height: 'calc(100vh - 32px)',
        backgroundColor: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        padding: '0'
      }
    : {
        position: 'relative' as const,
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        padding: '0'
      };

  return (
    <div style={containerStyle}>
      {/* 标题栏 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: nodeInfo.color, fontSize: 16 }}>{nodeInfo.icon}</span>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>{nodeInfo.title}</span>
        </div>
        <Space>
          <Button onClick={onClose}>关闭</Button>
          {!readonly && (
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          )}
        </Space>
      </div>
      
      {/* 内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="basic">
            <Form form={form} layout="vertical">
              <Card title="节点信息" size="small" style={{ marginBottom: 12 }}>
                <Form.Item label="节点ID" name="id">
                  <Input disabled />
                </Form.Item>
                
                <Form.Item
                  label="节点名称"
                  name="name"
                  rules={[
                    { required: true, message: '请输入节点名称' },
                    { max: 20, message: '节点名称最多20个字符' }
                  ]}
                >
                  <Input placeholder="请输入节点名称" maxLength={20} disabled={readonly} />
                </Form.Item>
                
                <Form.Item label="节点描述" name="description">
                  <TextArea 
                    rows={2} 
                    placeholder="请输入节点描述（可选）"
                    maxLength={200}
                    disabled={readonly}
                  />
                </Form.Item>
                
                <Form.Item
                  label="优先级"
                  name="priority"
                  tooltip="数值越大优先级越高"
                >
                  <InputNumber 
                    min={1} 
                    max={10} 
                    placeholder="节点执行优先级"
                    style={{ width: '100%' }}
                    disabled={readonly}
                  />
                </Form.Item>
              </Card>
              
              {renderNodeSpecificConfig()}
            </Form>
          </TabPane>
          
          <TabPane tab="执行配置" key="execution">
            <Form form={form} layout="vertical">
              <Card title="超时设置" size="small" style={{ marginBottom: 12 }}>
                <Form.Item
                  label="执行超时（毫秒）"
                  name="timeout"
                  tooltip="节点执行的最大等待时间"
                >
                  <InputNumber 
                    min={100} 
                    max={300000} 
                    placeholder="超时时间（毫秒）"
                    style={{ width: '100%' }}
                    disabled={readonly}
                  />
                </Form.Item>
                
                <Form.Item
                  label="最大执行时间（毫秒）"
                  name="maxExecutionTime"
                  tooltip="节点的最大执行时间限制"
                >
                  <InputNumber 
                    min={1000} 
                    max={600000} 
                    placeholder="最大执行时间（毫秒）"
                    style={{ width: '100%' }}
                    disabled={readonly}
                  />
                </Form.Item>
              </Card>
              
              <Card title="重试设置" size="small" style={{ marginBottom: 12 }}>
                <Form.Item
                  label="最大重试次数"
                  name="maxRetries"
                  tooltip="节点执行失败时的最大重试次数"
                >
                  <InputNumber 
                    min={0} 
                    max={10} 
                    placeholder="最大重试次数"
                    style={{ width: '100%' }}
                    disabled={readonly}
                  />
                </Form.Item>
                
                <Form.Item
                  label="重试延迟（毫秒）"
                  name="retryDelay"
                  tooltip="重试之间的等待时间"
                >
                  <InputNumber 
                    min={100} 
                    max={10000} 
                    placeholder="重试延迟时间（毫秒）"
                    style={{ width: '100%' }}
                    disabled={readonly}
                  />
                </Form.Item>
              </Card>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default BehaviorTreeNodePropertyPanel;