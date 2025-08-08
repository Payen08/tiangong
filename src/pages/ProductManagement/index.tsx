import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Row,
  Col,
  Tooltip,
  Modal,
  Form,
  message,
  Dropdown,
  Drawer,
} from 'antd';
import AddProduct from './AddProduct';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  MoreOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface ProductFunction {
  id: string;
  name: string;
  identifier: string;
  functionType: '属性（静态）' | '属性（动态）' | '服务' | '事件';
  readWriteMode?: '读写' | '只读';
  dataType?: string;
  valueConfig: string;
  isComposite?: boolean;
  protocol?: string;
  registerAddress?: string;
  functionCode?: string;
  modbusDataType?: string;
  byteOrder?: 'big-endian' | 'little-endian' | '';
  registerType?: 'coil' | 'discrete-input' | 'input-register' | 'holding-register';
}

interface Product {
  id: string;
  productName: string;
  productKey: string;
  productType: string;
  protocol: string;
  deviceCount: number;
  updateTime: string;
  updatedBy: string;
  functions?: ProductFunction[];
}

const ProductManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);


  // 模拟数据
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      productName: '智能温度传感器',
      productKey: 'temp_sensor_001',
      productType: '机器人产品',
      protocol: 'Mqtt',
      deviceCount: 156,
      updateTime: '2024-01-15 14:30:25',
      updatedBy: '张三',
      functions: [
        {
          id: '1',
          name: '温度',
          identifier: 'temperature',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: 'Mqtt',
          registerAddress: '0x0001',
          functionCode: '03',
          modbusDataType: 'float32',
          byteOrder: 'big-endian',
          registerType: 'input-register',
        },
        {
          id: '2',
          name: '湿度',
          identifier: 'humidity',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'float',
          valueConfig: '',
          isComposite: false,
          protocol: 'Mqtt',
          registerAddress: '0x0002',
          functionCode: '03',
          modbusDataType: 'float32',
          byteOrder: 'big-endian',
          registerType: 'input-register',
        },
      ],
    },
    {
      id: '2',
      productName: '智能门锁',
      productKey: 'smart_lock_002',
      productType: '生产产品',
      protocol: 'http',
      deviceCount: 89,
      updateTime: '2024-01-14 09:15:10',
      updatedBy: '李四',
      functions: [
        {
          id: '3',
          name: '门锁状态',
          identifier: 'lock_status',
          functionType: '属性（静态）',
          readWriteMode: '读写',
          dataType: 'enum',
          valueConfig: '0:关闭;1:开启',
          isComposite: false,
          protocol: 'http',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
    {
      id: '3',
      productName: '环境监测仪',
      productKey: 'env_monitor_003',
      productType: '虚拟产品',
      protocol: 'modbus_tcp',
      deviceCount: 234,
      updateTime: '2024-01-13 16:45:33',
      updatedBy: '王五',
      functions: [
        {
          id: '4',
          name: 'PM2.5',
          identifier: 'pm25',
          functionType: '属性（动态）',
          readWriteMode: '只读',
          dataType: 'int',
          valueConfig: '',
          isComposite: false,
          protocol: 'modbus_tcp',
          registerAddress: '0x0010',
          functionCode: '04',
          modbusDataType: 'uint16',
          byteOrder: 'big-endian',
          registerType: 'input-register',
        },
        {
          id: '5',
          name: '报警事件',
          identifier: 'alarm_event',
          functionType: '事件',
          readWriteMode: '只读',
          dataType: 'text',
          valueConfig: '',
          isComposite: false,
          protocol: 'modbus_tcp',
          registerAddress: '',
          functionCode: '',
          modbusDataType: '',
          byteOrder: '',
          registerType: 'holding-register',
        },
      ],
    },
  ]);

  const productTypes = ['机器人产品', '生产产品', '虚拟产品', '电梯产品', '自动门产品'];
  const protocols = ['http', 'Mqtt', 'modbus_tcp', '墨影采集卡'];

  // 筛选数据
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.productName
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesType = !selectedType || product.productType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAdd = () => {
    setEditingProduct(null); // 确保新增模式时清空编辑产品数据
    setIsDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
  };

  const handleEditDrawerClose = () => {
    setIsEditDrawerVisible(false);
    setEditingProduct(null);
  };

  // 处理产品创建或编辑成功
  const handleProductCreated = (productData: any) => {
    if (productData.id && editingProduct) {
      // 编辑模式：更新现有产品
      const updatedProduct: Product = {
        id: productData.id,
        productName: productData.productName,
        productKey: productData.productKey,
        productType: productData.productType,
        protocol: productData.protocol,
        deviceCount: editingProduct.deviceCount, // 保持原有设备数
        updateTime: productData.updateTime,
        updatedBy: productData.updatedBy,
        functions: productData.functions || [], // 包含功能数据
      };
      
      // 更新产品列表
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === productData.id ? updatedProduct : p)
      );
      
      // 关闭编辑抽屉
      setIsEditDrawerVisible(false);
      setEditingProduct(null);
      
      message.success('产品编辑成功！');
    } else {
      // 新增模式：添加新产品
      const product: Product = {
        id: Date.now().toString(),
        productName: productData.productName,
        productKey: productData.productKey || `${productData.productName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        productType: productData.productType,
        protocol: productData.protocol,
        deviceCount: 0, // 新产品设备数为0
        updateTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-'),
        updatedBy: '管理员', // 这里可以从用户状态获取
        functions: productData.functions || [], // 包含功能数据
      };
      
      // 添加到产品列表
      setProducts(prevProducts => [product, ...prevProducts]);
      
      // 关闭新增抽屉
      setIsDrawerVisible(false);
      
      message.success('产品创建成功！');
    }
  };



  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据刷新成功');
    }, 1000);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    setIsEditDrawerVisible(true);
  };

  const handleDelete = (record: Product) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除产品 "${record.productName}" 吗？`,
      onOk: () => {
        setProducts(products.filter((p) => p.id !== record.id));
        message.success('删除成功');
      },
    });
  };

  const handleView = (record: Product) => {
    Modal.info({
      title: '产品详情',
      content: (
        <div>
          <p><strong>产品名称：</strong>{record.productName}</p>
          <p><strong>产品Key：</strong>{record.productKey}</p>
          <p><strong>产品类型：</strong>{record.productType}</p>
          <p><strong>通讯协议：</strong>{record.protocol}</p>
          <p><strong>关联设备数：</strong>{record.deviceCount}</p>
          <p><strong>更新时间：</strong>{record.updateTime}</p>
          <p><strong>更新人：</strong>{record.updatedBy}</p>
        </div>
      ),
      width: 500,
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 模拟API调用
      setTimeout(() => {
        if (editingProduct) {
          // 编辑
          setProducts(
            products.map((p) =>
              p.id === editingProduct.id
                ? {
                    ...p,
                    ...values,
                    updateTime: new Date().toLocaleString('zh-CN'),
                    updatedBy: '当前用户',
                  }
                : p
            )
          );
          message.success('编辑成功');
        } else {
          // 新增
          const newProduct: Product = {
            id: Date.now().toString(),
            ...values,
            deviceCount: 0,
            updateTime: new Date().toLocaleString('zh-CN'),
            updatedBy: '当前用户',
          };
          setProducts([...products, newProduct]);
          message.success('新增成功');
        }
        setIsModalVisible(false);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 检测屏幕尺寸
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1600);
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeScreen(width >= 1600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 移动端列配置
  const mobileColumns: ColumnsType<Product> = [
    {
      title: '产品信息',
      key: 'productInfo',
      fixed: 'left',
      render: (_: any, record: Product) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '4px' }}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px'
              }}
              onClick={() => {
                console.log('跳转到产品详情页面:', record.id);
              }}
            >
              {record.productName}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            <span>Key: </span>
            <span 
              style={{ color: '#1890ff', cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard.writeText(record.productKey);
                message.success('产品Key已复制到剪贴板');
              }}
            >
              {record.productKey}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>{record.productType} | {record.protocol} | 设备数: {record.deviceCount}</span>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      fixed: 'right',
      render: (_: any, record: Product) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => handleEdit(record),
              },
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => console.log('编辑产品:', record.id),
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                onClick: () => console.log('删除产品:', record.id),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // 桌面端列配置
  const desktopColumns: ColumnsType<Product> = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: isLargeScreen ? 200 : 150,
      align: 'left',
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record: Product) => (
        <Tooltip title={text}>
          <span 
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => {
              console.log('跳转到产品详情页面:', record.id);
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '产品Key',
      dataIndex: 'productKey',
      key: 'productKey',
      width: isLargeScreen ? 180 : 140,
      align: 'left',
      ellipsis: true,
      render: (text: string) => (
        <Space size={4}>
          <Tooltip title={text}>
            <span 
              style={{ 
                color: '#1890ff', 
                cursor: 'pointer',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }} 
              onClick={() => {
                navigator.clipboard.writeText(text);
                message.success('产品Key已复制到剪贴板');
              }}
            >
              {text}
            </span>
          </Tooltip>
          <Tooltip title="复制产品Key">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: '#1890ff' }} />}
              onClick={() => {
                navigator.clipboard.writeText(text);
                message.success('产品Key已复制到剪贴板');
              }}
              style={{ padding: 0, minWidth: 'auto', height: 'auto' }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'productType',
      key: 'productType',
      width: isLargeScreen ? 120 : 100,
      align: 'left',
      ellipsis: true,
      render: (type: string) => (
        <Tooltip title={type}>
          <span>{type}</span>
        </Tooltip>
      ),
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: isLargeScreen ? 100 : 80,
      align: 'left',
      ellipsis: true,
      render: (protocol: string) => (
        <Tooltip title={protocol}>
          <span>{protocol}</span>
        </Tooltip>
      ),
    },
    {
      title: '设备数',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      width: isLargeScreen ? 100 : 80,
      align: 'center',
      sorter: (a: Product, b: Product) => a.deviceCount - b.deviceCount,
      render: (count: number) => (
        <span style={{ fontWeight: 500, color: count > 0 ? '#52c41a' : '#999' }}>
          {count}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: isLargeScreen ? 180 : 140,
      align: 'left',
      ellipsis: true,
      sorter: (a: Product, b: Product) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
      render: (time: string) => (
        <Tooltip title={time}>
          <span>{time}</span>
        </Tooltip>
      ),
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: isLargeScreen ? 100 : 80,
      align: 'left',
      ellipsis: true,
      render: (user: string) => (
        <Tooltip title={user}>
          <span>{user}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: isLargeScreen ? 150 : 120,
      align: 'right',
      fixed: 'right',
      render: (_: any, record: Product) => {
        const moreMenuItems = [
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Space size={4}>
            <Tooltip title="编辑产品">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
                style={{ padding: '0 4px' }}
              >
                编辑
              </Button>
            </Tooltip>
            <Dropdown
              menu={{ items: moreMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="link"
                icon={<MoreOutlined />}
                size="small"
                style={{ padding: '0 4px' }}
              >
                更多
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={{ marginBottom: 16 }}>
        {/* 搜索和筛选区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={10} lg={8} xl={isLargeScreen ? 10 : 8} xxl={12}>
            <Input
              placeholder="请输入产品名称搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              allowClear
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={12} sm={12} md={5} lg={4} xl={isLargeScreen ? 4 : 4} xxl={4}>
            <Select
              placeholder="全部类型"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            >
              {productTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={6} sm={6} md={3} lg={4} xl={isLargeScreen ? 3 : 4} xxl={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '' : '刷新'}
            </Button>
          </Col>
          <Col xs={6} sm={6} md={6} lg={8} xl={isLargeScreen ? 7 : 8} xxl={5}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size={isMobile ? 'large' : 'middle'}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增产品'}
            </Button>
          </Col>
        </Row>
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            total: filteredProducts.length,
            pageSize: isMobile ? 5 : isLargeScreen ? 15 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile ? undefined : (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            simple: isMobile,
            size: isMobile ? 'small' : 'default',
            showLessItems: !isLargeScreen,
            pageSizeOptions: isLargeScreen ? ['10', '15', '20', '50'] : ['10', '20', '50'],
          }}
          scroll={isMobile ? { x: 'max-content' } : isLargeScreen ? { x: 1200 } : { x: 1000 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={isLargeScreen ? 800 : isMobile ? '90vw' : 600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="产品名称"
                name="productName"
                rules={[
                  { required: true, message: '请输入产品名称' },
                  { max: 50, message: '产品名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="产品Key"
                name="productKey"
                rules={[
                  { required: true, message: '请输入产品Key' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '产品Key只能包含字母、数字和下划线' },
                ]}
              >
                <Input placeholder="请输入产品Key" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="产品类型"
                name="productType"
                rules={[{ required: true, message: '请选择产品类型' }]}
              >
                <Select placeholder="请选择产品类型">
                  {productTypes.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Item
                label="通讯协议"
                name="protocol"
                rules={[{ required: true, message: '请选择通讯协议' }]}
              >
                <Select placeholder="请选择通讯协议">
                  {protocols.map((protocol) => (
                    <Option key={protocol} value={protocol}>
                      {protocol}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
        
        {/* 新增产品抽屉 */}
        <Drawer
          title="添加产品"
          placement="right"
          width="100vw"
          onClose={handleDrawerClose}
          open={isDrawerVisible}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <AddProduct 
            onClose={handleDrawerClose} 
            onProductCreated={handleProductCreated}
            editingProduct={null}
          />
        </Drawer>

        {/* 编辑产品抽屉 */}
        <Drawer
          title="编辑产品"
          placement="right"
          width="100vw"
          onClose={handleEditDrawerClose}
          open={isEditDrawerVisible}
          styles={{
            body: {
              padding: 0,
            },
          }}
        >
          <AddProduct 
            onClose={handleEditDrawerClose} 
            onProductCreated={handleProductCreated}
            editingProduct={editingProduct}
          />
        </Drawer>
        

      </div>
    );
  };
  
  export default ProductManagement;