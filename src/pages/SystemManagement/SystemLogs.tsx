import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  message,
  Grid,
} from 'antd';
import {
  DownloadOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';



interface LogFile {
  id: string;
  filename: string;
  date: string;
  size: string;
}

const { useBreakpoint } = Grid;

const SystemLogs: React.FC = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const screens = useBreakpoint();

  // 模拟日志文件数据
  const mockLogFiles: LogFile[] = [
    {
      id: '1',
      filename: 'system_logs_2024-01-15.zip',
      date: '2024-01-15',
      size: '2.5 MB',
    },
    {
      id: '2',
      filename: 'system_logs_2024-01-14.zip',
      date: '2024-01-14',
      size: '3.2 MB',
    },
    {
      id: '3',
      filename: 'system_logs_2024-01-13.zip',
      date: '2024-01-13',
      size: '1.8 MB',
    },
    {
      id: '4',
      filename: 'system_logs_2024-01-12.zip',
      date: '2024-01-12',
      size: '4.1 MB',
    },
    {
      id: '5',
      filename: 'system_logs_2024-01-11.zip',
      date: '2024-01-11',
      size: '2.9 MB',
    },
  ];

  useEffect(() => {
    loadLogFiles();
  }, []);

  const loadLogFiles = async () => {
    try {
      // 直接设置数据，不使用loading
      setLogFiles(mockLogFiles);
    } catch {
      message.error('加载日志文件失败');
    }
  };

  const handleDownload = (logFile: LogFile) => {
    // 模拟下载日志文件
    const filename = logFile.filename;
    
    // 生成模拟的日志内容
    const logContent = `系统日志文件：${filename}\n生成日期：${logFile.date}\n文件大小：${logFile.size}\n\n这是一个模拟的日志文件内容...`;
    
    // 创建下载链接
    const blob = new Blob([logContent], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success(`日志文件 ${filename} 下载成功`);
  };



  // 响应式列配置
  const getColumns = (): ColumnsType<LogFile> => {
    const baseColumns: ColumnsType<LogFile> = [
      {
        title: '文件',
        dataIndex: 'filename',
        key: 'filename',
        ellipsis: true,
        render: (filename: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileZipOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
            <span style={{ wordBreak: 'break-all' }}>{filename}</span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: screens.xs ? 80 : 100,
        fixed: screens.xs ? 'right' : undefined,
        render: (_: any, record: LogFile) => (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            size={screens.xs ? 'small' : 'middle'}
          >
            {screens.xs ? '' : '下载'}
          </Button>
        ),
      },
    ];

    // 桌面端显示完整列
    if (screens.md) {
      baseColumns.splice(1, 0, 
        {
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          width: 120,
          sorter: (a: LogFile, b: LogFile) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
          title: '文件大小',
          dataIndex: 'size',
          key: 'size',
          width: 100,
        }
      );
    } else {
      // 移动端在文件名下方显示日期和大小
      baseColumns[0].render = (filename: string, record: LogFile) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileZipOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
            <span style={{ wordBreak: 'break-all', fontWeight: 500 }}>{filename}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '12px' }}>
            <span>日期: {record.date}</span>
            <span>大小: {record.size}</span>
          </div>
        </div>
      );
    }

    return baseColumns;
  };



  return (
    <div style={{ background: 'transparent' }}>
      {/* 日志文件列表 */}
      <Card>
        <Table
          columns={getColumns()}
          dataSource={logFiles}
          rowKey="id"

          scroll={{ x: screens.xs ? 300 : undefined }}
          size={screens.xs ? 'small' : 'middle'}
          pagination={{
            total: logFiles.length,
            pageSize: screens.xs ? 5 : 10,
            showSizeChanger: !screens.xs,
            showQuickJumper: !screens.xs,
            simple: screens.xs,
            showTotal: screens.xs ? undefined : (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default SystemLogs;