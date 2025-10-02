import React from 'react';
import { Card } from 'antd';

// 拓扑路网节点
interface TopologyNode {
  id: string;
  x: number;
  y: number;
  type: 'room' | 'corridor' | 'entrance' | 'exit' | 'elevator' | 'stairs';
  name?: string;
}

// 拓扑路网连接
interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  weight?: number;
  type: 'normal' | 'emergency' | 'restricted';
}

// 地图数据接口
interface MapData {
  id: string;
  name: string;
  type: string;
  description?: string;
  baseMapUrl?: string;
  topology?: {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
  };
}

interface MapPreviewProps {
  mapData: MapData;
  width?: number;
  height?: number;
  showTopology?: boolean;
}

const MapPreview: React.FC<MapPreviewProps> = ({ 
  mapData, 
  width = 400, 
  height = 300, 
  showTopology = true 
}) => {
  // 节点类型颜色映射
  const getNodeColor = (type: string) => {
    const colorMap = {
      'room': '#1890ff',
      'corridor': '#52c41a',
      'entrance': '#fa8c16',
      'exit': '#f5222d',
      'elevator': '#722ed1',
      'stairs': '#eb2f96'
    };
    return colorMap[type as keyof typeof colorMap] || '#666666';
  };

  // 连接类型样式映射
  const getEdgeStyle = (type: string) => {
    const styleMap = {
      'normal': { stroke: '#1890ff', strokeWidth: 2, strokeDasharray: 'none' },
      'emergency': { stroke: '#f5222d', strokeWidth: 3, strokeDasharray: '5,5' },
      'restricted': { stroke: '#faad14', strokeWidth: 2, strokeDasharray: '3,3' }
    };
    return styleMap[type as keyof typeof styleMap] || styleMap.normal;
  };

  // 渲染拓扑路网
  const renderTopology = () => {
    if (!showTopology || !mapData.topology) return null;

    const { nodes, edges } = mapData.topology;

    return (
      <g className="topology-layer">
        {/* 渲染连接线 */}
        {edges.map(edge => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const style = getEdgeStyle(edge.type);
          return (
            <line
              key={edge.id}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              {...style}
              opacity={0.7}
            />
          );
        })}

        {/* 渲染节点 */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={6}
              fill={getNodeColor(node.type)}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.9}
            />
            {node.name && (
              <text
                x={node.x}
                y={node.y + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#333333"
                fontWeight="500"
              >
                {node.name}
              </text>
            )}
          </g>
        ))}
      </g>
    );
  };

  return (
    <Card 
      size="small" 
      style={{ width: width + 40, height: height + 80 }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{mapData.name}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>{mapData.description}</div>
      </div>
      
      <div style={{ 
        position: 'relative', 
        width: width, 
        height: height, 
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#fafafa'
      }}>
        <svg 
          width={width} 
          height={height} 
          viewBox="0 0 800 600"
          style={{ display: 'block' }}
        >
          {/* 底图层 */}
          {mapData.baseMapUrl && (
            <image
              href={mapData.baseMapUrl}
              x="0"
              y="0"
              width="800"
              height="600"
              opacity={0.8}
            />
          )}
          
          {/* 拓扑路网层 */}
          {renderTopology()}
        </svg>
        
        {/* 图例 */}
        {showTopology && mapData.topology && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '6px',
            borderRadius: '4px',
            fontSize: '10px',
            lineHeight: '1.2'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>图例</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#1890ff', borderRadius: '50%', marginRight: '4px' }}></div>
              <span>房间</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#fa8c16', borderRadius: '50%', marginRight: '4px' }}></div>
              <span>入口</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#f5222d', borderRadius: '50%', marginRight: '4px' }}></div>
              <span>出口</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#f5222d', marginRight: '4px' }}></div>
              <span>紧急路径</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MapPreview;