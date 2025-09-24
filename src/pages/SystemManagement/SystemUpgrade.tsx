import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Upload,
  Button,
  Progress,
  message,
  Table,
  Tag,
  Space,
  Modal,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  CloudUploadOutlined,
  ReloadOutlined,
  HistoryOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;
const { confirm } = Modal;

// 升级记录接口
interface UpgradeRecord {
  id: string;
  version: string;
  fileName: string;
  uploadTime: string;
  upgradeTime?: string;
  status: 'pending' | 'upgrading' | 'success' | 'failed' | 'rollback';
  description: string;
  fileSize: string;
  operator: string;
}

const SystemUpgrade: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [upgradeRecords, setUpgradeRecords] = useState<UpgradeRecord[]>([]);
  const [loading] = useState(false);

  // 模拟升级记录数据
  useEffect(() => {
    const mockRecords: UpgradeRecord[] = [
      {
        id: '1',
        version: 'v2.1.0',
        fileName: 'system-v2.1.0.zip',
        uploadTime: '2024-01-15 14:30:00',
        upgradeTime: '2024-01-15 14:35:00',
        status: 'success',
        description: '新增系统升级功能，优化用户体验',
        fileSize: '125.6 MB',
        operator: '管理员',
      },
      {
        id: '2',
        version: 'v2.0.5',
        fileName: 'system-v2.0.5.zip',
        uploadTime: '2024-01-10 09:15:00',
        upgradeTime: '2024-01-10 09:20:00',
        status: 'success',
        description: '修复已知问题，提升系统稳定性',
        fileSize: '98.3 MB',
        operator: '管理员',
      },
      {
        id: '3',
        version: 'v2.0.4',
        fileName: 'system-v2.0.4.zip',
        uploadTime: '2024-01-05 16:45:00',
        upgradeTime: '2024-01-05 16:50:00',
        status: 'rollback',
        description: '升级后发现兼容性问题，已回退',
        fileSize: '102.1 MB',
        operator: '管理员',
      },
    ];
    setUpgradeRecords(mockRecords);
  }, []);

  // 文件上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip,.tar.gz',
    showUploadList: false, // 隐藏默认的文件列表
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/zip' || file.name.endsWith('.zip') || file.name.endsWith('.tar.gz');
      if (!isValidType) {
        message.error('只能上传 ZIP 或 TAR.GZ 格式的文件!');
        return false;
      }
      const isLt500M = file.size / 1024 / 1024 < 500;
      if (!isLt500M) {
        message.error('文件大小不能超过 500MB!');
        return false;
      }
      setCurrentFile(file);
      message.success('文件选择成功!');
      return false; // 阻止自动上传
    },
  };

  // 删除已选择的文件
  const handleRemoveFile = () => {
    setCurrentFile(null);
    setUploadProgress(0);
    message.info('已移除文件');
  };

  // 模拟文件上传
  const handleUpload = async () => {
    if (!currentFile) {
      message.warning('请先选择要上传的文件!');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setUploading(false);
          message.success('文件上传成功!');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // 模拟系统升级
  const handleUpgrade = () => {
    if (!currentFile || uploadProgress < 100) {
      message.warning('请先完成文件上传!');
      return;
    }

    confirm({
      title: '确认升级',
      icon: <ExclamationCircleOutlined />,
      content: '系统升级过程中将暂时中断服务，确定要开始升级吗？',
      okText: '确认升级',
      cancelText: '取消',
      onOk: () => {
        setUpgrading(true);
        setUpgradeProgress(0);

        // 模拟升级进度
        const upgradeSteps = [
          { step: 10, message: '正在备份当前系统...' },
          { step: 30, message: '正在解压升级包...' },
          { step: 50, message: '正在更新系统文件...' },
          { step: 70, message: '正在更新数据库...' },
          { step: 90, message: '正在重启服务...' },
          { step: 100, message: '升级完成!' },
        ];

        let currentStepIndex = 0;
        const upgradeInterval = setInterval(() => {
          if (currentStepIndex < upgradeSteps.length) {
            const currentStep = upgradeSteps[currentStepIndex];
            setUpgradeProgress(currentStep.step);
            message.info(currentStep.message);
            currentStepIndex++;
          } else {
            clearInterval(upgradeInterval);
            setUpgrading(false);
            message.success('系统升级完成!');
            
            // 添加新的升级记录
            const newRecord: UpgradeRecord = {
              id: Date.now().toString(),
              version: 'v2.1.1',
              fileName: currentFile.name,
              uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              upgradeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              status: 'success',
              description: '系统升级成功',
              fileSize: `${(currentFile.size / 1024 / 1024).toFixed(1)} MB`,
              operator: '管理员',
            };
            setUpgradeRecords(prev => [newRecord, ...prev]);
            setCurrentFile(null);
            setUploadProgress(0);
          }
        }, 1000);
      },
    });
  };

  // 版本回退
  const handleRollback = (record: UpgradeRecord) => {
    confirm({
      title: '确认回退',
      icon: <ExclamationCircleOutlined />,
      content: `确定要回退到版本 ${record.version} 吗？此操作将覆盖当前系统版本。`,
      okText: '确认回退',
      cancelText: '取消',
      onOk: () => {
        message.loading('正在回退版本...', 2);
        setTimeout(() => {
          message.success(`已成功回退到版本 ${record.version}`);
          // 更新记录状态
          setUpgradeRecords(prev => 
            prev.map(item => 
              item.id === record.id 
                ? { ...item, status: 'success' as const }
                : { ...item, status: item.status === 'success' ? 'rollback' as const : item.status }
            )
          );
        }, 2000);
      },
    });
  };

  // 获取状态标签
  const getStatusTag = (status: UpgradeRecord['status']) => {
    const statusMap = {
      pending: { color: 'default', text: '待升级', icon: <ClockCircleOutlined /> },
      upgrading: { color: 'processing', text: '升级中', icon: <ReloadOutlined spin /> },
      success: { color: 'success', text: '成功', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
      rollback: { color: 'warning', text: '已回退', icon: <RollbackOutlined /> },
    };
    const config = statusMap[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 升级记录表格列配置
  const columns: ColumnsType<UpgradeRecord> = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
      render: (version: string) => (
        <Tag color="blue" style={{ fontWeight: 500 }}>
          {version}
        </Tag>
      ),
    },
    {
      title: '文件信息',
      key: 'fileInfo',
      width: 220,
      render: (_: any, record: UpgradeRecord) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileZipOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: '13px' }}>{record.fileName}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            大小: {record.fileSize}
          </Text>
        </div>
      ),
    },

    {      title: '升级时间',      dataIndex: 'upgradeTime',      key: 'upgradeTime',      width: 120,      align: 'left',      render: (time: string) => (        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>          <Text style={{ fontSize: '13px', lineHeight: '18px' }}>            {time ? dayjs(time).format('YYYY-MM-DD') : '-'}          </Text>          <Text style={{ fontSize: '12px', color: '#666', lineHeight: '16px' }}>            {time ? dayjs(time).format('HH:mm:ss') : ''}          </Text>        </div>      ),    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: UpgradeRecord['status']) => getStatusTag(status),
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
      width: 80,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_: any, record: UpgradeRecord) => (
        <Space size={8}>
          {record.status === 'success' && (
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => handleRollback(record)}
            >
              回退
            </Button>
          )}
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => message.info('重新升级功能开发中...')}
            >
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: 'transparent' }}>
      <Row gutter={[16, 16]} style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* 左侧：系统包上传和升级 */}
        <Col xs={24} lg={8} style={{ display: 'flex' }}>
          <Card
            title={
              <Space>
                <CloudUploadOutlined style={{ color: '#1890ff' }} />
                <span>系统升级</span>
              </Space>
            }
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '650px',
            }}
            styles={{
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }
            }}
          >
            <div>
                {/* 当前系统信息 */}
                <Alert
                  message="当前系统版本"
                  description={
                    <div>
                      <Text strong>版本: v2.1.0</Text>
                      <br />
                      <Text type="secondary">发布时间: 2024-01-15</Text>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: '24px' }}
                />

                <Divider orientation="left">上传升级包</Divider>
                
                {/* 文件上传区域 */}
                <div style={{ marginBottom: '24px' }}>
                  {!currentFile ? (
                    <Upload.Dragger {...uploadProps}>
                      <p className="ant-upload-drag-icon">
                        <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                      </p>
                      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                      <p className="ant-upload-hint">
                        支持 ZIP、TAR.GZ 格式，文件大小不超过 500MB
                      </p>
                    </Upload.Dragger>
                  ) : (
                    <div style={{ 
                      border: '2px dashed #d9d9d9', 
                      borderRadius: '6px', 
                      padding: '24px', 
                      textAlign: 'center',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                        <FileZipOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{currentFile.name}</div>
                          <div style={{ color: '#666', fontSize: '12px' }}>
                            大小: {(currentFile.size / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>
                      </div>
                      <Space>
                        <Upload {...uploadProps}>
                          <Button icon={<CloudUploadOutlined />}>重新选择</Button>
                        </Upload>
                        <Button 
                          icon={<CloseCircleOutlined />} 
                          onClick={handleRemoveFile}
                          danger
                        >
                          删除
                        </Button>
                      </Space>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <Space style={{ width: '100%', justifyContent: 'center', marginBottom: '24px' }}>
                  <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    loading={uploading}
                    disabled={!currentFile || upgrading}
                    onClick={handleUpload}
                    size="large"
                  >
                    {uploading ? '上传中...' : '上传文件'}
                  </Button>
                  <Button
                    type="primary"
                    danger
                    icon={<ReloadOutlined />}
                    loading={upgrading}
                    disabled={uploadProgress < 100 || upgrading}
                    onClick={handleUpgrade}
                    size="large"
                  >
                    {upgrading ? '升级中...' : '开始升级'}
                  </Button>
                </Space>

                {/* 上传进度 */}
                {uploading && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text>上传进度:</Text>
                    <Progress percent={uploadProgress} status="active" />
                  </div>
                )}

                {/* 升级进度 */}
                {upgrading && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text>升级进度:</Text>
                    <Progress percent={upgradeProgress} status="active" />
                  </div>
                )}
            </div>
          </Card>
        </Col>

        {/* 右侧：升级记录 */}
        <Col xs={24} lg={16} style={{ display: 'flex' }}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#52c41a' }} />
                <span>升级记录</span>
              </Space>
            }
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            styles={{
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
              }
            }}
          >
            <Table
              columns={columns}
              dataSource={upgradeRecords}
              rowKey="id"
              loading={loading}
              size="small"
              scroll={{ x: 650 }}
              pagination={{
                total: upgradeRecords.length,
                pageSize: 6,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}

            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemUpgrade;