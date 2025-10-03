import React from 'react';
import { Modal, Form, Input, Select, Button, Row, Col } from 'antd';

// 属性面板类型定义
interface PropertyPanelProps {
  visible: boolean;
  onClose: () => void;
  elementType: 'point' | 'line' | 'area' | null;
  elementData: any;
  onSave: (values: any) => void;
}

// 内部表单组件，只在Modal可见时渲染
const PropertyForm: React.FC<{
  elementType: 'point' | 'line' | 'area' | null;
  elementData: any;
  onSave: (values: any) => void;
  onClose: () => void;
}> = ({ elementType, elementData }) => {
  const [form] = Form.useForm();

  // 根据元素类型设置表单初始值
  React.useEffect(() => {
    if (elementData) {
      form.setFieldsValue(elementData);
    }
  }, [elementData, form]);



  // 渲染点属性表单
  const renderPointForm = () => {
    const pointType = elementData?.type;
    
    return (
      <>
        <Form.Item
          label="点ID"
          style={{ marginBottom: 16 }}
        >
          <Input value={elementData?.id} disabled style={{ color: '#666' }} />
        </Form.Item>
        
        <Form.Item
          name="name"
          label="点名称"
          style={{ marginBottom: 16 }}
        >
          <Input 
            placeholder="请输入点名称" 
            disabled
            value={elementData?.name}
          />
        </Form.Item>
        
        <Form.Item
          name="type"
          label="点类型"
          style={{ marginBottom: 16 }}
        >
          <Select placeholder="请选择点类型" disabled value={elementData?.type}>
            <Select.Option value="节点">节点</Select.Option>
            <Select.Option value="站点">站点</Select.Option>
            <Select.Option value="充电点">充电点</Select.Option>
            <Select.Option value="停靠点">停靠点</Select.Option>
            <Select.Option value="临停点">临停点</Select.Option>
            <Select.Option value="归位点">归位点</Select.Option>
            <Select.Option value="电梯点">电梯点</Select.Option>
            <Select.Option value="自动门">自动门</Select.Option>
            <Select.Option value="切换点">切换点</Select.Option>
          </Select>
        </Form.Item>
        
        {/* 根据点类型显示不同的字段 */}
        {pointType && pointType !== '节点' && (
          <>
            {/* 充电点专用字段 */}
            {pointType === '充电点' && (
              <>
                <Form.Item
                  name="canBeUsedAsDockingPoint"
                  label="是否可作为停靠点使用"
                  style={{ marginBottom: 16 }}
                >
                  <Select disabled value={elementData?.canBeUsedAsDockingPoint}>
                    <Select.Option value={false}>否</Select.Option>
                    <Select.Option value={true}>是</Select.Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="relatedRobots"
                  label="关联机器人"
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    mode="multiple"
                    placeholder="关联的机器人设备"
                    disabled
                    value={elementData?.relatedRobots || []}
                  />
                </Form.Item>
              </>
            )}
            
            {/* 停靠点专用字段 */}
            {pointType === '停靠点' && (
              <Form.Item
                name="relatedRobots"
                label="关联机器人"
                style={{ marginBottom: 16 }}
              >
                <Select
                  mode="multiple"
                  placeholder="关联的机器人设备"
                  disabled
                  value={elementData?.relatedRobots || []}
                />
              </Form.Item>
            )}
            
            {/* 电梯点专用字段 */}
            {pointType === '电梯点' && (
              <>
                <Form.Item
                  name="elevatorLocation"
                  label="电梯内/外"
                  style={{ marginBottom: 16 }}
                >
                  <Select disabled value={elementData?.elevatorLocation}>
                    <Select.Option value="电梯内">电梯内</Select.Option>
                    <Select.Option value="电梯外">电梯外</Select.Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="elevatorDevice"
                  label="电梯设备"
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    placeholder="电梯设备"
                    disabled
                    value={elementData?.elevatorDevice}
                  />
                </Form.Item>
                
                <Form.Item
                  name="elevatorDoor"
                  label="电梯门"
                  style={{ marginBottom: 16 }}
                >
                  <Select disabled value={elementData?.elevatorDoor}>
                    <Select.Option value="A门">A门</Select.Option>
                    <Select.Option value="B门">B门</Select.Option>
                    <Select.Option value="C门">C门</Select.Option>
                    <Select.Option value="D门">D门</Select.Option>
                  </Select>
                </Form.Item>
              </>
            )}
            
            {/* 自动门专用字段 */}
            {pointType === '自动门' && (
              <>
                <Form.Item
                  name="autoDoorDevice"
                  label="自动门设备"
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    placeholder="自动门设备"
                    disabled
                    value={elementData?.autoDoorDevice}
                  />
                </Form.Item>
                
                <Form.Item
                  name="autoDoorType"
                  label="自动门"
                  style={{ marginBottom: 16 }}
                >
                  <Select disabled value={elementData?.autoDoorType}>
                    <Select.Option value="A门">A门</Select.Option>
                    <Select.Option value="B门">B门</Select.Option>
                    <Select.Option value="C门">C门</Select.Option>
                    <Select.Option value="D门">D门</Select.Option>
                  </Select>
                </Form.Item>
              </>
            )}
            
            {/* 方向角度字段 - 除节点外的所有类型都显示 */}
            <Form.Item
              name="direction"
              label="方向角度"
              style={{ marginBottom: 16 }}
            >
              <Input
                type="number"
                placeholder="方向角度"
                suffix="°"
                disabled
                value={elementData?.direction}
              />
            </Form.Item>
            
            {/* 是否禁止调头字段 - 除节点外的所有类型都显示 */}
            <Form.Item
              name="noUturn"
              label="是否禁止调头"
              style={{ marginBottom: 16 }}
            >
              <Select disabled value={elementData?.noUturn}>
                <Select.Option value={false}>否</Select.Option>
                <Select.Option value={true}>是</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <div><strong>坐标位置:</strong> ({elementData?.x}, {elementData?.y})</div>
          <div style={{ marginTop: '4px' }}><strong>创建时间:</strong> {new Date().toLocaleString()}</div>
        </div>
      </>
    );
  };

  // 渲染线属性表单
  const renderLineForm = () => (
    <>
      <Form.Item
        label="路径ID"
        style={{ marginBottom: 16 }}
      >
        <Input value={elementData?.id} disabled style={{ color: '#666' }} />
      </Form.Item>
      
      <Form.Item
        name="name"
        label="路径名称"
        style={{ marginBottom: 16 }}
      >
        <Input 
          placeholder="路径名称" 
          disabled
          value={elementData?.name}
        />
      </Form.Item>
      
      <Form.Item
        name="type"
        label="路径类型"
        style={{ marginBottom: 16 }}
      >
        <Select placeholder="路径类型" disabled value={elementData?.type}>
          <Select.Option value="single-line">单向直线</Select.Option>
          <Select.Option value="double-line">双向直线</Select.Option>
          <Select.Option value="single-bezier">单向贝塞尔曲线</Select.Option>
          <Select.Option value="double-bezier">双向贝塞尔曲线</Select.Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        label="路径长度"
        style={{ marginBottom: 16 }}
      >
        <Input 
          value={`${((elementData?.length || 0) * 0.05).toFixed(2)} m`} 
          disabled 
          style={{ color: '#666' }} 
          addonAfter="实际距离"
        />
      </Form.Item>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '12px', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <Row gutter={16}>
          <Col span={12}>
            <div><strong>起始点:</strong> {elementData?.startPointName || '未知'}</div>
            <div style={{ marginTop: '4px' }}><strong>起始坐标:</strong> 
              ({elementData?.startX || 0}, {elementData?.startY || 0})
            </div>
          </Col>
          <Col span={12}>
            <div><strong>结束点:</strong> {elementData?.endPointName || '未知'}</div>
            <div style={{ marginTop: '4px' }}><strong>结束坐标:</strong> 
              ({elementData?.endX || 0}, {elementData?.endY || 0})
            </div>
          </Col>
        </Row>
        <div style={{ marginTop: '8px' }}><strong>创建时间:</strong> {new Date().toLocaleString()}</div>
      </div>
    </>
  );

  // 渲染区域属性表单
  const renderAreaForm = () => {
    const areaType = elementData?.type;
    
    return (
      <>
        <Form.Item
          label="区域ID"
          style={{ marginBottom: 16 }}
        >
          <Input value={elementData?.id} disabled style={{ color: '#666' }} />
        </Form.Item>
        
        <Form.Item
          name="name"
          label="区域名称"
          style={{ marginBottom: 16 }}
        >
          <Input 
            placeholder="区域名称" 
            disabled
            value={elementData?.name}
          />
        </Form.Item>
        
        <Form.Item
          name="type"
          label="区域类型"
          style={{ marginBottom: 16 }}
        >
          <Select placeholder="区域类型" disabled value={elementData?.type}>
            <Select.Option value="禁行区域">禁行区域</Select.Option>
            <Select.Option value="调速区域">调速区域</Select.Option>
            <Select.Option value="多路网区">多路网区</Select.Option>
          </Select>
        </Form.Item>
        
        {/* 根据区域类型显示不同的字段 */}
        {areaType === '调速区域' && (
          <Form.Item
            name="speed"
            label="调速设置"
            style={{ marginBottom: 16 }}
          >
            <Input
              type="number"
              placeholder="调速值"
              suffix="m/s"
              disabled
              value={elementData?.speed}
            />
          </Form.Item>
        )}
        
        <Form.Item
          name="description"
          label="区域描述"
          style={{ marginBottom: 16 }}
        >
          <Input.TextArea 
            placeholder="区域描述" 
            rows={3}
            disabled
            value={elementData?.description}
          />
        </Form.Item>
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <div><strong>区域点数:</strong> {elementData?.points?.length || 0} 个点</div>
          <div style={{ marginTop: '4px' }}><strong>创建时间:</strong> {new Date().toLocaleString()}</div>
        </div>
      </>
    );
  };

  return (
    <Form
      form={form}
      layout="vertical"
    >
      {elementType === 'point' && renderPointForm()}
      {elementType === 'line' && renderLineForm()}
      {elementType === 'area' && renderAreaForm()}
    </Form>
  );
};

// 主组件，只在visible为true时渲染内部表单组件
const PropertyPanel: React.FC<PropertyPanelProps> = ({
  visible,
  onClose,
  elementType,
  elementData,
  onSave
}) => {
  // 获取弹窗标题
  const getTitle = () => {
    switch (elementType) {
      case 'point':
        return '查看点属性';
      case 'line':
        return '查看路径属性';
      case 'area':
        return '查看区域属性';
      default:
        return '查看属性';
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={500}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '24px'
        }
      }}
      zIndex={2000}
    >
      {visible && (
        <PropertyForm
          elementType={elementType}
          elementData={elementData}
          onSave={onSave}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default PropertyPanel;