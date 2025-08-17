import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Table,
  Modal,
  message,
  Tooltip,
  Steps,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import AddFunction from './AddFunction';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

// 产品功能接口
interface ProductFunction {
  id: string;
  name: string;
  identifier: string;
  functionType: '属性（静态）' | '属性（动态）' | '服务' | '事件';
  readWriteMode?: '读写' | '只读';
  dataType?: string;
  valueConfig: string; // 值配置
  // 配置映射相关字段
  isComposite?: boolean;
  protocol?: string;
  registerAddress?: string;
  functionCode?: string;
  modbusDataType?: string;
  byteOrder?: 'big-endian' | 'little-endian' | '';
  registerType?: 'coil' | 'discrete-input' | 'input-register' | 'holding-register';
}

// 产品类型与协议映射
const protocolMap: Record<string, string[]> = {
  '机器人产品': ['墨影机器人协议'],
  '生产产品': ['modbus_tcp', 'Mqtt', 'http', '墨影采集卡'],
  '其他产品': ['modbus_tcp', 'Mqtt', 'http', '墨影采集卡'],
  '电梯产品': ['modbus_tcp', 'Mqtt', 'http', '墨影采集卡'],
  '自动门产品': ['modbus_tcp', 'Mqtt', 'http', '墨影采集卡'],
  '虚拟产品': [], // 虚拟产品不显示通讯协议
};

interface AddProductProps {
  onClose?: () => void;
  onProductCreated?: (productData: any) => void;
  editingProduct?: any;
}

const AddProduct: React.FC<AddProductProps> = ({ onClose, onProductCreated, editingProduct }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  
  // 主步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  const [basicInfoData, setBasicInfoData] = useState<any>(null);
  
  // 功能列表状态
  const [functions, setFunctions] = useState<ProductFunction[]>([]);
  const [addFunctionVisible, setAddFunctionVisible] = useState(false);
  const [editingFunction, setEditingFunction] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 产品类型选项
  const productTypes = ['机器人产品', '生产产品', '电梯产品', '自动门产品', '虚拟产品'];
  
  // 组件卸载时清理form实例
  useEffect(() => {
    return () => {
      form.resetFields();
    };
  }, []);

  // 处理编辑模式初始化
  useEffect(() => {
    if (editingProduct) {
      form.setFieldsValue({
        productName: editingProduct.productName,
        productKey: editingProduct.productKey,
        productType: editingProduct.productType,
        protocol: editingProduct.protocol,
      });
      setSelectedProductType(editingProduct.productType);
      setBasicInfoData(editingProduct);
      // 初始化功能列表
      if (editingProduct.functions && Array.isArray(editingProduct.functions)) {
        setFunctions(editingProduct.functions);
      } else {
        setFunctions([]);
      }
    } else {
      form.resetFields();
      setSelectedProductType('');
      setBasicInfoData(null);
      setCurrentStep(0);
      setFunctions([]);
      setSearchText(''); // 清空搜索文本
      setAddFunctionVisible(false); // 关闭添加功能抽屉
      setEditingFunction(null); // 清空编辑功能数据
      setIsEditMode(false); // 重置编辑模式
    }
  }, [editingProduct, form]);
  
  // 处理产品类型变化
  const handleProductTypeChange = (value: string) => {
    setSelectedProductType(value);
    form.setFieldsValue({ protocol: undefined }); // 清空通讯协议选择
  };

  // 获取可用的通讯协议
  const getAvailableProtocols = () => {
    return protocolMap[selectedProductType] || [];
  };

  // 过滤功能列表
  const filteredFunctions = functions.filter((func) => {
    const funcName = func.name || '';
    const search = searchText || '';
    return funcName.toLowerCase().includes(search.toLowerCase());
  }
  );

  // 删除功能
  const handleDeleteFunction = (record: ProductFunction) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除功能 "${record.name}" 吗？`,
      onOk: () => {
        setFunctions(functions.filter(func => func.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  // 编辑功能
  const handleEditFunction = (record: ProductFunction) => {
    // 将ProductFunction转换为FunctionConfig格式
    const functionConfig = {
      id: record.id, // 保持原有ID
      name: record.name,
      identifier: record.identifier,
      functionType: record.functionType,
      readWriteMode: record.readWriteMode || '读写' as const,
      dataType: record.dataType || 'text' as const,
      valueConfig: record.valueConfig ? record.valueConfig.split(';').map((item, index) => {
        const [value, description] = item.split(':');
        return {
          id: `${index}`,
          value: value || '',
          description: description || ''
        };
      }) : [],
      // 配置映射相关字段
      isComposite: record.isComposite || false,
      protocol: record.protocol || 'modbus_tcp',
      registerAddress: record.registerAddress || '',
      functionCode: record.functionCode || '',
      modbusDataType: record.modbusDataType || '',
      byteOrder: record.byteOrder || '',
      registerType: record.registerType || 'holding-register',
    };
    
    setEditingFunction(functionConfig);
    setIsEditMode(true);
    setAddFunctionVisible(true);
  };

  // 刷新功能列表
  const handleRefreshFunctions = () => {
    message.success('功能列表已刷新');
  };

  // 添加功能按钮点击
  const handleAddFunction = () => {
    setEditingFunction(null);
    setIsEditMode(false);
    setAddFunctionVisible(true);
  };



  // 关闭添加功能抽屉
  const handleCloseAddFunction = () => {
    setAddFunctionVisible(false);
    setEditingFunction(null);
    setIsEditMode(false);
  };

  // 保存功能（新增或编辑）
  const handleSaveFunction = (functionData: any) => {
    if (isEditMode && editingFunction) {
      // 编辑模式：更新现有功能
      const updatedFunction: ProductFunction = {
        id: editingFunction.id, // 保持原有ID
        name: functionData.name,
        identifier: functionData.identifier,
        functionType: functionData.functionType,
        readWriteMode: functionData.readWriteMode,
        dataType: functionData.dataType,
        valueConfig: functionData.valueConfig?.map((item: any) => `${item.value}:${item.description}`).join(';') || '',
        // 配置映射相关字段
        isComposite: functionData.isComposite,
        protocol: functionData.protocol,
        registerAddress: functionData.registerAddress,
        functionCode: functionData.functionCode,
        modbusDataType: functionData.modbusDataType,
        byteOrder: functionData.byteOrder,
        registerType: functionData.registerType,
      };
      
      setFunctions(prevFunctions => {
        const updatedFunctions = prevFunctions.map(func => 
          func.id === editingFunction.id ? updatedFunction : func
        );
        return updatedFunctions;
      });
      
      message.success('功能编辑成功！');
    } else {
      // 新增模式：添加新功能
      const newFunction: ProductFunction = {
        id: Date.now().toString(),
        name: functionData.name,
        identifier: functionData.identifier,
        functionType: functionData.functionType,
        readWriteMode: functionData.readWriteMode,
        dataType: functionData.dataType,
        valueConfig: functionData.valueConfig?.map((item: any) => `${item.value}:${item.description}`).join(';') || '',
        // 配置映射相关字段
        isComposite: functionData.isComposite,
        protocol: functionData.protocol,
        registerAddress: functionData.registerAddress,
        functionCode: functionData.functionCode,
        modbusDataType: functionData.modbusDataType,
        byteOrder: functionData.byteOrder,
        registerType: functionData.registerType,
      };
      
      setFunctions(prevFunctions => {
        const updatedFunctions = [...prevFunctions, newFunction];
        return updatedFunctions;
      });
      
      message.success('功能添加成功！');
    }
    
    setAddFunctionVisible(false);
    setEditingFunction(null);
    setIsEditMode(false);
  };

  // 主流程下一步
  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setBasicInfoData(values);
      setCurrentStep(1);
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完善产品基本信息');
    }
  };

  // 主流程上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 完成创建或编辑
  const handleFinish = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const productData = {
        ...basicInfoData,
        functions: functions,
        ...(editingProduct ? {
          id: editingProduct.id,
          updateTime: new Date().toLocaleString('zh-CN'),
          updatedBy: '当前用户'
        } : {
          createdAt: new Date().toISOString()
        })
      };
      
      // 调用父组件的回调函数来更新产品列表
      if (onProductCreated) {
        onProductCreated(productData);
      } else {
        message.success(editingProduct ? '产品编辑成功！' : '产品创建成功！');
        // 返回产品列表
        if (onClose) {
          onClose();
        } else {
          navigate('/product-management');
        }
      }
      
      // 如果是新增模式，创建成功后重置所有状态
      if (!editingProduct) {
        // 重置表单
        form.resetFields();
        // 重置所有状态
        setSelectedProductType('');
        setBasicInfoData(null);
        setCurrentStep(0);
        setFunctions([]);
        setSearchText('');
        setAddFunctionVisible(false);
        setEditingFunction(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error(editingProduct ? '编辑失败:' : '创建失败:', error);
      message.error(editingProduct ? '编辑失败，请重试' : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回
  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/product-management');
    }
  };

  // 功能表格列定义
  const functionColumns: ColumnsType<ProductFunction> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '标识符',
      dataIndex: 'identifier',
      key: 'identifier',
      width: 150,
    },
    {
      title: '功能类型',
      dataIndex: 'functionType',
      key: 'functionType',
      width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '属性（静态）': '#108ee9',
          '属性（动态）': '#87d068',
          '服务': '#f50',
          '事件': '#2db7f5',
        };
        return <span style={{ color: colorMap[type] || '#666' }}>{type}</span>;
      },
    },
    {
      title: '值配置',
      dataIndex: 'valueConfig',
      key: 'valueConfig',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'right',
      render: (_: any, record: ProductFunction) => (
        <Space size={8}>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleEditFunction(record)}
              size="small"
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteFunction(record)}
              size="small"
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 步骤配置
  const steps = [
    {
      title: '基本信息',
    },
    {
      title: '功能定义',
    },
  ];

  // 渲染基本信息配置步骤
  const renderBasicInfo = () => (
    <Row justify="center">
      <Col xs={24} sm={23} md={20} lg={18} xl={16}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 500, 
          color: '#262626', 
          marginBottom: '16px' 
        }}>
          产品基本信息
        </div>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleNext}
          >
            <Row gutter={16}>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="产品名称"
                  name="productName"
                  rules={[{ required: true, message: '请输入产品名称' }]}
                >
                  <Input placeholder="请输入产品名称" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                <Form.Item
                  label="产品类型"
                  name="productType"
                  rules={[{ required: true, message: '请选择产品类型' }]}
                >
                  <Select
                    value={selectedProductType}
                    onChange={handleProductTypeChange}
                    placeholder="请选择产品类型"
                  >
                    {productTypes.map((type) => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            {selectedProductType !== '虚拟产品' && (
              <Row gutter={16}>
                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                  <Form.Item
                    label="通讯协议"
                    name="protocol"
                    rules={[{ required: true, message: '请选择通讯协议' }]}
                  >
                    <Select placeholder="请选择通讯协议">
                      {getAvailableProtocols().map((protocol) => (
                        <Option key={protocol} value={protocol}>
                          {protocol}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                  <Form.Item
                    label="上报周期（秒）"
                    name="reportPeriod"
                    initialValue="5"
                    rules={[
                      { required: true, message: '请输入上报周期' },
                      { pattern: /^[1-9]\d*$/, message: '请输入正整数' }
                    ]}
                  >
                    <Input placeholder="请输入上报周期（秒）" type="number" min={1} />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="产品描述"
                  name="description"
                >
                  <Input.TextArea 
                    placeholder="请输入产品描述" 
                    rows={3}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </Col>
    </Row>
  );

  // 渲染功能定义步骤
  const renderFunctionDefinition = () => {
    return (
      <Row justify="center">
        <Col xs={24} sm={23} md={20} lg={18} xl={16}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 500, 
            color: '#262626', 
            marginBottom: '16px' 
          }}>
            功能定义
          </div>
        <Card style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <Input
              placeholder="搜索功能名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefreshFunctions}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddFunction}
              >
                添加功能
              </Button>
            </Space>
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Table
              columns={functionColumns}
              dataSource={filteredFunctions}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 550 }}
              style={{ flex: 1 }}
              locale={{
                emptyText: '暂无功能数据，请先添加功能'
              }}
            />
          </div>
        </Card>
      </Col>
    </Row>
    );
  };

  return (
    <div className="space-y-4" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
      {/* 步骤指示器 */}
      <Row justify="center" style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Steps current={currentStep} items={steps} />
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <div className="min-h-[500px]">
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderFunctionDefinition()}
      </div>

      {/* 固定在底部的操作按钮 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        zIndex: 1000
      }}>
        {currentStep === 0 && (
          <>
            <Button 
              onClick={handleBack}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleNext}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              下一步
            </Button>
          </>
        )}
        {currentStep > 0 && (
          <Button 
            onClick={handlePrev}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            上一步
          </Button>
        )}
        {currentStep === 1 && (
          <Button 
            type="primary" 
            onClick={handleFinish} 
            loading={loading}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            完成创建
          </Button>
        )}
      </div>

      {/* 添加功能抽屉 */}
      <AddFunction
        visible={addFunctionVisible}
        onClose={handleCloseAddFunction}
        onSave={handleSaveFunction}
        productProtocol={form.getFieldValue('protocol') || ''}
        editingFunction={editingFunction}
        isEdit={isEditMode}
      />
    </div>
  );
};

export default AddProduct;