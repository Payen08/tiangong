import React, { useState, useRef, useEffect } from 'react';
import { /* Card, */ Button, Space, Typography, /* Divider */ } from 'antd';
import { CloseOutlined, DragOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import SubCanvas from './SubCanvas';

// 子画布视图配置接口
interface SubCanvasViewConfig {
  scale: number;
  offsetX: number;
  offsetY: number;
  gridSize: number;
  showGrid: boolean;
}

// 子流程数据接口
interface SubProcessData {
  nodes: FlowNode[];
  connections: Connection[];
  viewConfig: SubCanvasViewConfig;
  metadata: {
    name: string;
    description?: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
  settings: {
    autoLayout: boolean;
    snapToGrid: boolean;
    allowCrossConnections: boolean;
    maxNodes: number;
  };
}

// 节点类型
type NodeType = 'start' | 'end' | 'process' | 'businessProcess';

// 流程节点接口
interface FlowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  customName?: string;
  triggerCondition?: string;
  demandDevices?: string[];
  supplyDevices?: string[];
  demandDevicesNames?: string;
  supplyDevicesNames?: string;
  demandDevicesTriggerCondition?: string; // 需求方设备触发条件
  supplyDevicesTriggerCondition?: string; // 供给方设备触发条件
  data?: {
    deviceRequirements?: any[];
    supplyDeviceRequirements?: any[];
    stageStrategies?: any[];
  };
  subProcess?: boolean;
  subCanvasId?: string;
}

// 连接线接口
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
}

const { Title, Text } = Typography;

interface IndependentSubCanvasProps {
  subProcessData: SubProcessData;
  onSave: (updatedData: SubProcessData) => void;
  onClose: () => void;
  parentNodeId: string;
  parentNodeName: string;
  initialPosition?: { x: number; y: number };
  readonly?: boolean;
}

const IndependentSubCanvas: React.FC<IndependentSubCanvasProps> = ({
  subProcessData,
  onSave,
  onClose,
  parentNodeId,
  parentNodeName,
  initialPosition = { x: 100, y: 100 },
  // readonly = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // 自动调整大小基于内容
  const calculateAutoSize = () => {
    const nodeCount = subProcessData.nodes?.length || 0;
    // const connectionCount = subProcessData.connections?.length || 0;
    
    // 基于节点数量计算最小尺寸
    const minWidth = Math.max(600, Math.min(1200, nodeCount * 150 + 200));
    const minHeight = Math.max(400, Math.min(800, Math.ceil(nodeCount / 4) * 120 + 200));
    
    return { width: minWidth, height: minHeight };
  };

  // 初始化时自动调整大小
  useEffect(() => {
    const autoSize = calculateAutoSize();
    setSize(autoSize);
  }, [subProcessData]);

  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // 处理拖动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMaximized) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 限制在视窗范围内
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, size, isMaximized]);

  // 处理最大化/还原
  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      // 最大化：占满整个视窗
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
    } else {
      // 还原：回到自动计算的大小
      const autoSize = calculateAutoSize();
      setSize(autoSize);
      setPosition({ x: 100, y: 100 });
    }
  };

  // 处理子画布数据更新
  const handleSubCanvasChange = (updatedData: SubProcessData) => {
    onSave(updatedData);
    
    // 如果不是最大化状态，根据内容自动调整大小
    if (!isMaximized) {
      const autoSize = calculateAutoSize();
      setSize(autoSize);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    borderRadius: isMaximized ? 0 : 8,
    overflow: 'hidden',
    background: '#fff',
    border: '1px solid #d9d9d9'
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    background: '#fafafa',
    borderBottom: '1px solid #d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none'
  };

  const contentStyle: React.CSSProperties = {
    height: 'calc(100% - 57px)', // 减去头部高度
    overflow: 'hidden'
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* 头部标题栏 */}
      <div 
        ref={dragHandleRef}
        style={headerStyle}
        onMouseDown={handleDragStart}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DragOutlined style={{ color: '#8c8c8c' }} />
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>
              {parentNodeName} - 子流程
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              节点ID: {parentNodeId}
            </Text>
          </div>
        </div>
        
        <Space>
          <Button 
            type="text" 
            size="small" 
            icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={handleToggleMaximize}
            title={isMaximized ? '还原' : '最大化'}
          />
          <Button 
            type="text" 
            size="small" 
            icon={<CloseOutlined />}
            onClick={onClose}
            title="关闭"
          />
        </Space>
      </div>
      
      {/* 子画布内容 */}
      <div style={contentStyle}>
        <SubCanvas
          visible={true}
          onClose={() => {}}
          subProcessData={subProcessData}
          onSave={handleSubCanvasChange}
          parentNodeId={parentNodeId}
          parentNodeName={parentNodeName}
        />
      </div>
    </div>
  );
};

export default IndependentSubCanvas;