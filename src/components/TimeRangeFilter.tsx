import React from 'react';
import { Card, Row, Col, Select, Space, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

export type TimeRangeType = 'yesterday' | 'last7days' | 'last30days' | 'custom';

interface TimeRangeFilterProps {
  value: TimeRangeType;
  onChange: (value: TimeRangeType) => void;
  showDescription?: boolean;
}

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  value,
  onChange,
  showDescription = true
}) => {
  const timeRangeOptions = [
    {
      value: 'yesterday' as TimeRangeType,
      label: '昨日',
      description: '统计昨天一整天的数据'
    },
    {
      value: 'last7days' as TimeRangeType,
      label: '近7日',
      description: '统计过去7天的数据（不包含今日）'
    },
    {
      value: 'last30days' as TimeRangeType,
      label: '近30日',
      description: '统计过去30天的数据（不包含今日）'
    }
  ];

  const getCurrentDescription = () => {
    const option = timeRangeOptions.find(opt => opt.value === value);
    return option?.description || '';
  };

  return (
    <Card size="small" style={{ marginBottom: '16px' }}>
      <Row gutter={16} align="middle">
        <Col>
          <Space>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <Text strong>时间范围:</Text>
          </Space>
        </Col>
        <Col>
          <Select
            value={value}
            onChange={onChange}
            style={{ width: 120 }}
            size="middle"
          >
            {timeRangeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>
        {showDescription && (
          <Col flex="auto">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getCurrentDescription()}
            </Text>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default TimeRangeFilter;

// 工具函数：根据时间范围类型获取日期范围
export const getDateRangeByType = (type: TimeRangeType): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (type) {
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'last7days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        start: sevenDaysAgo,
        end: new Date(today.getTime() - 1)
      };
    
    case 'last30days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        start: thirtyDaysAgo,
        end: new Date(today.getTime() - 1)
      };
    
    default:
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() - 1)
      };
  }
};

// 工具函数：格式化时间范围显示
export const formatTimeRangeDisplay = (type: TimeRangeType): string => {
  const { start, end } = getDateRangeByType(type);
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  switch (type) {
    case 'yesterday':
      return `${formatDate(start)}`;
    case 'last7days':
      return `${formatDate(start)} 至 ${formatDate(end)}`;
    case 'last30days':
      return `${formatDate(start)} 至 ${formatDate(end)}`;
    default:
      return '';
  }
};