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

interface Product {
  id: string;
  productName: string;
  productKey: string;
  productType: string;
  protocol: string;
  deviceCount: number;
  updateTime: string;
  updatedBy: string;
}

const ProductManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);


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
    setIsDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
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
    form.setFieldsValue(record);
    setIsModalVisible(true);
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

  const columns: ColumnsType<Product> = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      align: 'left',
      fixed: 'left',
      render: (text: string, record: Product) => (
        <span 
          style={{ color: '#1890ff', cursor: 'pointer' }}
          onClick={() => {
            // 跳转到产品详情页面
            console.log('跳转到产品详情页面:', record.id);
            // 这里可以使用 React Router 进行页面跳转
            // navigate(`/product-detail/${record.id}`);
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '产品Key',
      dataIndex: 'productKey',
      key: 'productKey',
      width: 160,
      align: 'left',
      render: (text: string) => (
        <Space size={4}>
          <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => {
            navigator.clipboard.writeText(text);
            message.success('产品Key已复制到剪贴板');
          }}>
            {text}
          </span>
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
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 120,
      align: 'left',
      render: (type: string) => (
        <span style={{ color: '#000000' }}>{type}</span>
      ),
    },
    {
      title: '通讯协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: 120,
      align: 'left',
      render: (protocol: string) => (
        <span style={{ color: '#000000' }}>{protocol}</span>
      ),
    },
    {
      title: '关联设备数',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      width: 120,
      align: 'left',
      sorter: (a: Product, b: Product) => a.deviceCount - b.deviceCount,
      render: (count: number) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>
          {count}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 160,
      align: 'left',
      sorter: (a: Product, b: Product) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: 100,
      align: 'left',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          <Space size={8}>
            <Tooltip title="查看详情">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
                size="small"
              >
                详情
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
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="请输入产品名称搜索"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="全部"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: 150 }}
            >
              {productTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增产品
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          pagination={{
            total: filteredProducts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            productType: '机器人产品',
            protocol: 'Mqtt',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
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
            <Col span={12}>
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
            <Col span={12}>
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
          <AddProduct onClose={handleDrawerClose} />
        </Drawer>
        

      </div>
    );
  };
  
  export default ProductManagement;