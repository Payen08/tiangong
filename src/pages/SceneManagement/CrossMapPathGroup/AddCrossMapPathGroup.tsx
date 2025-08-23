import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Button, Space, Card, Row, Col, Select, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface PathGroupItem {
  id: string;
  name: string;
  mapName: string;
  pathGroups: string[];
}

interface CrossMapPathGroup {
  id: string;
  name: string;
  description?: string;
  items: PathGroupItem[];
  updateTime: string;
  updatedBy: string;
}

interface AddCrossMapPathGroupProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: CrossMapPathGroup | null;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: string | number;
}

const AddCrossMapPathGroup: React.FC<AddCrossMapPathGroupProps> = ({
  visible,
  onClose,
  onSave,
  editData,
  placement = 'right',
  width = '66.67%'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PathGroupItem[]>([]);

  // 模拟地图数据
  const mockMaps = [
    '一楼生产车间',
    '二楼装配车间',
    '三楼办公区',
    '地下一层仓库',
    '地下二层仓库',
    '四楼会议区',
    '五楼研发区'
  ];

  // 地图对应的路径组数据（二级联动）
  const mapPathGroupsMapping: Record<string, string[]> = {
    '一楼生产车间': ['生产线路径组A', '生产线路径组B', '质检路径组', '包装路径组'],
    '二楼装配车间': ['装配线路径组A', '装配线路径组B', '测试路径组', '调试路径组'],
    '三楼办公区': ['办公室路径组', '会议室路径组', '接待路径组', '休息区路径组'],
    '地下一层仓库': ['入库路径组', '出库路径组', '盘点路径组', '货架路径组A'],
    '地下二层仓库': ['货架路径组B', '通道路径组', '分拣路径组', '临时存储路径组'],
    '四楼会议区': ['大会议室路径组', '小会议室路径组', '培训室路径组', '展示区路径组'],
    '五楼研发区': ['研发路径组A', '研发路径组B', '实验室路径组', '测试区路径组']
  };

  // 获取指定地图的路径组选项
  const getPathGroupsByMap = (mapName: string): string[] => {
    return mapPathGroupsMapping[mapName] || [];
  };

  useEffect(() => {
    if (visible) {
      if (editData) {
        // 编辑模式
        form.setFieldsValue({
          name: editData.name,
          description: editData.description
        });
        setItems(editData.items || []);
      } else {
        // 新增模式
        form.resetFields();
        setItems([{
          id: Date.now().toString(),
          name: '',
          mapName: '',
          pathGroups: []
        }]);
      }
    }
  }, [visible, editData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证items
      if (items.length === 0) {
        message.error('请至少添加一个地图配置');
        return;
      }

      for (const item of items) {
        if (!item.mapName) {
          message.error('请选择地图');
          return;
        }
        if (item.pathGroups.length === 0) {
          message.error('请为每个地图至少选择一个路径组');
          return;
        }
      }

      setLoading(true);
      
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const saveData = {
        ...values,
        items: items.map(item => ({
          ...item,
          name: values.name // 确保item的name与主名称一致
        }))
      };
      
      onSave(saveData);
      setLoading(false);
    } catch (error) {
      console.error('表单验证失败:', error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setItems([]);
    onClose();
  };

  const addItem = () => {
    const newItem: PathGroupItem = {
      id: Date.now().toString(),
      name: form.getFieldValue('name') || '',
      mapName: '',
      pathGroups: []
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <Drawer
      title={editData ? '编辑跨地图路径组' : '新增跨地图路径组'}
      open={visible}
      onClose={handleCancel}
      width={width}
      placement={placement}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" loading={loading} onClick={handleSave}>
              {editData ? '更新' : '提交'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: ''
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="名称"
              name="name"
              rules={[
                { required: true, message: '请输入名称' },
                { min: 2, message: '名称至少2个字符' },
                { max: 50, message: '名称不能超过50个字符' }
              ]}
            >
              <Input 
                placeholder="请输入名称" 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  // 同步更新所有items的name
                  const newName = e.target.value;
                  setItems(items.map(item => ({ ...item, name: newName })));
                }}
              />
            </Form.Item>
          </Col>
        </Row>



        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 500, fontSize: '14px' }}>地图路径组配置</span>
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={addItem}
              size="small"
            >
              添加地图
            </Button>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {items.map((item, index) => (
              <Card 
                key={item.id} 
                size="small" 
                style={{ marginBottom: 12 }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>地图配置 {index + 1}</span>
                    {items.length > 1 && (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeItem(item.id)}
                        size="small"
                      >
                        删除
                      </Button>
                    )}
                  </div>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '13px', color: '#ff4d4f' }}>*</span>
                      <span style={{ fontSize: '13px', color: '#666', marginLeft: '4px' }}>选择地图</span>
                    </div>
                    <Select
                      placeholder="请选择地图"
                      value={item.mapName || undefined}
                      onChange={(value: string) => {
                        // 同时更新地图名称和清空路径组选择（二级联动）
                        setItems(items.map(i => 
                          i.id === item.id 
                            ? { ...i, mapName: value, pathGroups: [] }
                            : i
                        ));
                      }}
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input: string, option: any) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {mockMaps.map(map => (
                        <Option key={map} value={map}>{map}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '13px', color: '#ff4d4f' }}>*</span>
                      <span style={{ fontSize: '13px', color: '#666', marginLeft: '4px' }}>选择路径组</span>
                    </div>
                    <Select
                      mode="multiple"
                      placeholder={item.mapName ? "请选择路径组，支持搜索" : "请先选择地图"}
                      value={item.pathGroups}
                      onChange={(value: string[]) => updateItem(item.id, 'pathGroups', value)}
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input: string, option: any) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                      maxTagCount={3}
                      maxTagTextLength={8}
                      disabled={!item.mapName}
                    >
                      {getPathGroupsByMap(item.mapName).map((pathGroup: string) => (
                        <Option key={pathGroup} value={pathGroup}>{pathGroup}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
                
                {item.pathGroups.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: 6 }}>已选择的路径组:</div>
                    <div>
                      {item.pathGroups.map((pathGroup, pgIndex) => (
                        <Tag key={pgIndex} color="green" style={{ marginBottom: 4 }}>
                          {pathGroup}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export default AddCrossMapPathGroup;