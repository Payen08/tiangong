import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Drawer, Form, Input, Select, Button, message, Row, Col, Tooltip, Modal, Card } from 'antd';
import { UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined, HomeOutlined } from '@ant-design/icons';
import { isDev } from '@/lib/utils';

// 地图选择卡片悬停效果样式
const mapSelectionCardStyle = `
  .map-selection-card:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
    z-index: 10;
  }
  
  .map-selection-card {
    position: relative;
  }
`;

// 注入样式到页面
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('map-selection-card-style');
  if (!styleElement) {
    const style = document.createElement('style');
    style.id = 'map-selection-card-style';
    style.textContent = mapSelectionCardStyle;
    document.head.appendChild(style);
  }
}

const { Option } = Select;
const { TextArea } = Input;

interface AddCrossMapConnectionProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  isDragging: boolean;
  isSpacePressed: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

interface HistoryState {
  offsetX: number;
  offsetY: number;
  scale: number;
  mapCards: any[];
  connections: any[];
}

// 地图文件接口
interface MapFile {
  id: string;
  name: string;
  type: 'grayscale' | 'topology';
  thumbnail: string;
  status: 'active' | 'inactive';
  format: string;
  updateTime: string;
}

// 地图列表接口
interface MapListItem {
  id: string;
  name: string;
  currentVersion: string;
  updateTime: string;
  thumbnail: string;
  topologyMap?: MapFile; // 拓扑地图（共用）
  mapFiles: MapFile[]; // 地图文件列表（黑白地图等）
}

const AddCrossMapConnection: React.FC<AddCrossMapConnectionProps> = ({
  visible,
  onClose,
  onSave,
  editData
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    isDragging: false,
    isSpacePressed: false,
    lastMouseX: 0,
    lastMouseY: 0
  });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // 历史记录状态
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 地图列表弹窗状态
  const [mapListModalVisible, setMapListModalVisible] = useState(false);
  
  // 调试状态已移除
  
  // 地图卡片相关状态
  const [mapCards, setMapCards] = useState<any[]>([]);
  const [selectedMapPosition, setSelectedMapPosition] = useState<{x: number, y: number} | null>(null);
  
  // 地图卡片拖拽状态
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragCardId: string | null;
    dragStartX: number;
    dragStartY: number;
    cardStartX: number;
    cardStartY: number;
    mouseDownOnCard: boolean; // 新增：跟踪鼠标是否在卡片上按下
  }>({
    isDragging: false,
    dragCardId: null,
    dragStartX: 0,
    dragStartY: 0,
    cardStartX: 0,
    cardStartY: 0,
    mouseDownOnCard: false
  });
  
  // 楼层输入状态
  const [floorInputState, setFloorInputState] = useState<{
    isEditing: boolean;
    editingCardId: string | null;
    inputValue: string;
  }>({
    isEditing: false,
    editingCardId: null,
    inputValue: ''
  });
  
  // 连接类型状态
  const [connectionType, setConnectionType] = useState<string>('cross_map');
  
  // 提交校验状态
  const [submitValidated, setSubmitValidated] = useState(false);
  
  // 曲线绘制状态
  const [curveDrawingState, setCurveDrawingState] = useState<{
    isDrawing: boolean;
    startPoint: { x: number; y: number; cardId: string; nodeIndex: number; side: 'left' | 'right' } | null;
    currentPoint: { x: number; y: number } | null;
  }>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null
  });
  
  // 选中状态
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // 悬停状态
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  
  // 动画缩放状态
  const [animationScale, setAnimationScale] = useState<{ [cardId: string]: number }>({});
  const animationFrameRef = useRef<number | null>(null);
  
  // 连接线数据
  const [connections, setConnections] = useState<{
    id: string;
    startCard: string;
    startNode: number;
    startSide: 'left' | 'right';
    endCard: string;
    endNode: number;
    endSide: 'left' | 'right';
    selected?: boolean; // 添加选中状态
  }[]>([]);
  
  // 选中的连接线ID
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // 光标闪烁状态
  const [cursorVisible, setCursorVisible] = useState(true);
  
  // 模拟地图数据
  const [mapListData] = useState<MapListItem[]>([
    {
      id: '1',
      name: '一楼平面图',
      currentVersion: 'v1.2.3',
      updateTime: '2024-03-20 14:30:25',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
      topologyMap: {
        id: 'topo_1',
        name: '一楼拓扑图',
        type: 'topology',
        thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        format: 'JSON',
        updateTime: '2024-03-20 14:30:25'
      },
      mapFiles: [
        {
          id: 'file_1_1',
          name: '一楼平面图.dwg',
          type: 'grayscale',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
          updateTime: '2024-03-20 14:30:25'
        },
        {
          id: 'file_1_2',
          name: '一楼布局图.pdf',
          type: 'grayscale',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'inactive',
          format: 'PDF',
          updateTime: '2024-03-15 10:20:15'
        }
      ]
    },
    {
      id: '2',
      name: '二楼平面图',
      currentVersion: 'v1.1.0',
      updateTime: '2024-03-15 09:15:42',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
      topologyMap: {
        id: 'topo_2',
        name: '二楼拓扑图',
        type: 'topology',
        thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        format: 'JSON',
        updateTime: '2024-03-15 09:15:42'
      },
      mapFiles: [
        {
          id: 'file_2_1',
          name: '二楼平面图.dwg',
          type: 'grayscale',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
          updateTime: '2024-03-15 09:15:42'
        }
      ]
    },
    {
      id: '3',
      name: '地下停车场',
      currentVersion: 'v2.0.1',
      updateTime: '2024-03-25 16:45:18',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
      topologyMap: {
        id: 'topo_3',
        name: '停车场拓扑图',
        type: 'topology',
        thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop&crop=center',
        status: 'active',
        format: 'JSON',
        updateTime: '2024-03-25 16:45:18'
      },
      mapFiles: [
        {
          id: 'file_3_1',
          name: '停车场布局图.dwg',
          type: 'grayscale',
          thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center',
          status: 'active',
          format: 'DWG',
          updateTime: '2024-03-25 16:45:18'
        }
      ]
    }
  ]);

  // 动画函数：平滑过渡缩放效果
  const animateScale = useCallback((cardId: string, targetScale: number) => {
    const currentScale = animationScale[cardId] || 1;
    const duration = 200; // 动画持续时间（毫秒）
    const startTime = Date.now();
    const startScale = currentScale;
    const scaleChange = targetScale - startScale;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数（ease-out）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newScale = startScale + scaleChange * easeOut;
      
      setAnimationScale(prev => ({
        ...prev,
        [cardId]: newScale
      }));
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // 动画完成，清理不需要的缩放值
        if (targetScale === 1) {
          setAnimationScale(prev => {
            const newState = { ...prev };
            delete newState[cardId];
            return newState;
          });
        }
      }
    };
    
    // 取消之前的动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animate();
  }, [animationScale]);

  // 绘制网格和画布内容
  const drawCanvas = useCallback(() => {
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 保存当前状态
    ctx.save();

    // 应用变换
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);

    // 绘制网格
    const gridSize = 20;
    const canvasWidth = canvas.width / canvasState.scale;
    const canvasHeight = canvas.height / canvasState.scale;
    const startX = Math.floor(-canvasState.offsetX / canvasState.scale / gridSize) * gridSize;
    const startY = Math.floor(-canvasState.offsetY / canvasState.scale / gridSize) * gridSize;
    const endX = startX + canvasWidth + gridSize;
    const endY = startY + canvasHeight + gridSize;

    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.6;
    ctx.beginPath();

    // 垂直线
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }

    // 水平线
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }

    ctx.stroke();

    // 根据连接类型动态生成节点数据
    const getNodeData = () => {
      if (connectionType === 'cross_region') {
        return ['A区域切换点1', 'A区域切换点2'];
      } else {
        return ['1号电梯切换点1', '2号电梯切换点2'];
      }
    };
    const elevatorNodes = getNodeData();
    
    // 绘制地图卡片
    mapCards.forEach(mapCard => {
      const cardWidth = 200;
      // 动态计算卡片高度：基础高度 + 电梯节点数量 * 节点高度
      const baseHeight = 156; // 基础内容高度（标题、版本、楼层字段、楼层输入框、电梯内点标题）- 增加6px适应标题与节点间距
      const nodeHeight = 22; // 每个电梯节点的高度 - 增加2px适应更大字体
      const cardHeight = baseHeight + elevatorNodes.length * nodeHeight + 10; // 额外10px底部间距
      
      // 设置高质量渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.textBaseline = 'middle';
      
      // 绘制卡片阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // 绘制圆角卡片背景
      const cornerRadius = 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(mapCard.x, mapCard.y, cardWidth, cardHeight, cornerRadius);
      ctx.fill();
      
      // 重置阴影，避免影响后续绘制
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 绘制卡片边框
      if (selectedCardId === mapCard.id) {
        // 选中状态 - 蓝色高亮边框
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1.5; // 调整为更合适的粗细
        ctx.beginPath();
        ctx.roundRect(mapCard.x, mapCard.y, cardWidth, cardHeight, cornerRadius);
        ctx.stroke();
        
        // 添加选中状态的外发光效果
        ctx.shadowColor = 'rgba(24, 144, 255, 0.3)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mapCard.x - 2, mapCard.y - 2, cardWidth + 4, cardHeight + 4, cornerRadius + 2);
        ctx.stroke();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      
      // 悬停状态 - 动画放大效果
      const currentScale = animationScale[mapCard.id] || 1;
      if (currentScale !== 1) {
        // 保存当前变换状态
        ctx.save();
        
        // 计算缩放中心点（卡片中心）
        const centerX = mapCard.x + cardWidth / 2;
        const centerY = mapCard.y + cardHeight / 2;
        
        // 移动到卡片中心，应用动画缩放，再移回原位置
        ctx.translate(centerX, centerY);
        ctx.scale(currentScale, currentScale);
        ctx.translate(-centerX, -centerY);
        
        // 重新绘制放大的卡片背景和边框
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(mapCard.x, mapCard.y, cardWidth, cardHeight, cornerRadius);
        ctx.fill();
        
        // 绘制边框（检查选中状态）
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        if (selectedCardId === mapCard.id) {
          // 选中状态 - 蓝色高亮边框
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(mapCard.x, mapCard.y, cardWidth, cardHeight, cornerRadius);
          ctx.stroke();
          
          // 添加选中状态的外发光效果
          ctx.shadowColor = 'rgba(24, 144, 255, 0.3)';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(mapCard.x - 2, mapCard.y - 2, cardWidth + 4, cardHeight + 4, cornerRadius + 2);
          ctx.stroke();
          
          // 重置阴影
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        } else {
          // 普通状态 - 灰色边框
          ctx.strokeStyle = '#e8e8e8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(mapCard.x, mapCard.y, cardWidth, cardHeight, cornerRadius);
          ctx.stroke();
        }
        
        // 在变换状态下绘制卡片内容
        // 绘制地图名称
        ctx.fillStyle = '#1f1f1f';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(mapCard.mapItem.name, mapCard.x + 16, mapCard.y + 28);
        
        // 绘制版本信息
        ctx.fillStyle = '#999999';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`版本 ${mapCard.mapItem.currentVersion}`, mapCard.x + 16, mapCard.y + 50);
        
        // 绘制必填标识（红色星号）
        ctx.fillStyle = '#ff4d4f';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('*', mapCard.x + 16, mapCard.y + 72);
        
        // 绘制楼层字段标签（根据连接类型动态显示）
        ctx.fillStyle = '#333333';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const fieldLabel = connectionType === 'cross_region' ? '区域' : '楼层';
        ctx.fillText(fieldLabel, mapCard.x + 25, mapCard.y + 72);
        
        // 绘制楼层输入框
        const inputRadius = 4;
        const isEditing = floorInputState.isEditing && floorInputState.editingCardId === mapCard.id;
        
        ctx.fillStyle = isEditing ? '#ffffff' : '#f8f9fa';
        ctx.beginPath();
        ctx.roundRect(mapCard.x + 12, mapCard.y + 88, 176, 28, inputRadius);
        ctx.fill();
        
        ctx.strokeStyle = isEditing ? '#1890ff' : '#e1e5e9';
        ctx.lineWidth = isEditing ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(mapCard.x + 12, mapCard.y + 88, 176, 28, inputRadius);
        ctx.stroke();
        
        // 绘制输入文本（根据连接类型动态显示占位符）
        const placeholder = connectionType === 'cross_region' ? '请输入区域' : '请输入楼层';
        const displayText = isEditing ? floorInputState.inputValue : (mapCard.floor || placeholder);
        ctx.fillStyle = (isEditing || mapCard.floor) ? '#333' : '#999';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(displayText, mapCard.x + 20, mapCard.y + 102);
        
        // 绘制光标（仅在编辑状态下）
        if (isEditing && cursorVisible) {
          const textWidth = ctx.measureText(floorInputState.inputValue).width;
          const cursorX = mapCard.x + 20 + textWidth;
          const cursorY1 = mapCard.y + 93;
          const cursorY2 = mapCard.y + 111;
          
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cursorX, cursorY1);
          ctx.lineTo(cursorX, cursorY2);
          ctx.stroke();
        }
        
        // 绘制电梯节点区域标题（根据连接类型动态显示）
        ctx.fillStyle = '#1f1f1f';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const nodeAreaTitle = connectionType === 'cross_region' ? '区域切换点' : '电梯内点';
        ctx.fillText(nodeAreaTitle, mapCard.x + 16, mapCard.y + 134);
        
        // 绘制电梯节点
        elevatorNodes.forEach((node, index) => {
          const nodeY = mapCard.y + 162 + index * 22;
          
          // 检测鼠标是否悬停在圆圈上
          const isMousePositionValid = mousePosition.x >= 0 && mousePosition.y >= 0;
          const worldMouseX = isMousePositionValid ? (mousePosition.x - canvasState.offsetX) / canvasState.scale : -999;
          const worldMouseY = isMousePositionValid ? (mousePosition.y - canvasState.offsetY) / canvasState.scale : -999;
          
          // 左侧连接圆圈
          const leftCircleDistance = isMousePositionValid ? Math.sqrt(Math.pow(worldMouseX - mapCard.x, 2) + Math.pow(worldMouseY - nodeY, 2)) : 999;
          const isLeftCircleHovered = isMousePositionValid && leftCircleDistance <= 8;
          const leftCircleRadius = isLeftCircleHovered ? 7 : 5;
          
          // 绘制左侧圆圈
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mapCard.x, nodeY, leftCircleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#52c41a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mapCard.x, nodeY, leftCircleRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // 节点名称
          ctx.fillStyle = '#4a4a4a';
          ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(node, mapCard.x + 20, nodeY);
          
          // 右侧连接圆圈
          const rightCircleDistance = isMousePositionValid ? Math.sqrt(Math.pow(worldMouseX - (mapCard.x + cardWidth), 2) + Math.pow(worldMouseY - nodeY, 2)) : 999;
          const isRightCircleHovered = isMousePositionValid && rightCircleDistance <= 8;
          const rightCircleRadius = isRightCircleHovered ? 7 : 5;
          
          // 绘制右侧圆圈
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mapCard.x + cardWidth, nodeY, rightCircleRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mapCard.x + cardWidth, nodeY, rightCircleRadius, 0, 2 * Math.PI);
          ctx.stroke();
        });
        
        // 恢复变换状态
        ctx.restore();
        
        // 标记为悬停状态，跳过后续的普通内容绘制
        return;
      } else {
        // 普通状态 - 灰色边框
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mapCard.x, mapCard.y, cardWidth, cardHeight, cornerRadius);
        ctx.stroke();
      }
      
      // 绘制地图名称 - 使用更清晰的字体和更好的排版
      ctx.fillStyle = '#1f1f1f';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(mapCard.mapItem.name, mapCard.x + 16, mapCard.y + 28);
      
      // 绘制版本信息 - 改进样式和位置，增加行间距
      ctx.fillStyle = '#999999';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`版本 ${mapCard.mapItem.currentVersion}`, mapCard.x + 16, mapCard.y + 50);
      
      // 绘制必填标识（红色星号）- 放在左边
      ctx.fillStyle = '#ff4d4f';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('*', mapCard.x + 16, mapCard.y + 72);
      
      // 绘制楼层字段标签 - 必填字段（根据连接类型动态显示）
      ctx.fillStyle = '#333333';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const fieldLabel = connectionType === 'cross_region' ? '区域' : '楼层';
      ctx.fillText(fieldLabel, mapCard.x + 25, mapCard.y + 72);
      
      // 绘制圆角楼层输入框 - 调整位置以适应新的布局
      const inputRadius = 4;
      const isEditing = floorInputState.isEditing && floorInputState.editingCardId === mapCard.id;
      const hasFloorError = submitValidated && (!mapCard.floor || mapCard.floor.trim() === ''); // 只有在提交校验后且楼层信息为空时才显示错误
      
      // 根据编辑状态和错误状态设置背景色和边框色
      ctx.fillStyle = isEditing ? '#ffffff' : '#f8f9fa';
      ctx.beginPath();
      ctx.roundRect(mapCard.x + 12, mapCard.y + 88, 176, 28, inputRadius);
      ctx.fill();
      
      // 设置边框颜色：编辑状态为蓝色，错误状态为红色，普通状态为灰色
      if (isEditing) {
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
      } else if (hasFloorError) {
        ctx.strokeStyle = '#ff4d4f'; // 红色边框表示错误
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = '#e1e5e9';
        ctx.lineWidth = 1;
      }
      
      ctx.beginPath();
      ctx.roundRect(mapCard.x + 12, mapCard.y + 88, 176, 28, inputRadius);
      ctx.stroke();
      
      // 绘制输入文本（根据连接类型动态显示占位符）
      const placeholder = connectionType === 'cross_region' ? '请输入区域' : '请输入楼层';
      const displayText = isEditing ? floorInputState.inputValue : (mapCard.floor || placeholder);
      // 如果有错误状态，提示文字也显示红色
      ctx.fillStyle = hasFloorError ? '#ff4d4f' : ((isEditing || mapCard.floor) ? '#333' : '#999');
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(displayText, mapCard.x + 20, mapCard.y + 102);
      
      // 绘制光标（仅在编辑状态下）
      if (isEditing && cursorVisible) {
        const textWidth = ctx.measureText(floorInputState.inputValue).width;
        const cursorX = mapCard.x + 20 + textWidth;
        const cursorY1 = mapCard.y + 93;
        const cursorY2 = mapCard.y + 111;
        
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY1);
        ctx.lineTo(cursorX, cursorY2);
        ctx.stroke();
      }
      
      // 绘制电梯节点区域标题 - 左对齐，增加与输入框的间距（根据连接类型动态显示）
      ctx.fillStyle = '#1f1f1f';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const nodeAreaTitle = connectionType === 'cross_region' ? '区域切换点' : '电梯内点';
      ctx.fillText(nodeAreaTitle, mapCard.x + 16, mapCard.y + 134);
      
      // 绘制电梯节点
      elevatorNodes.forEach((node, index) => {
        const nodeY = mapCard.y + 162 + index * 22; // 增加标题与节点间距，从156调整为162
        
        // 检测鼠标是否悬停在圆圈上 - 只有当鼠标位置有效时才进行悬停检测
        const isMousePositionValid = mousePosition.x >= 0 && mousePosition.y >= 0;
        const worldMouseX = isMousePositionValid ? (mousePosition.x - canvasState.offsetX) / canvasState.scale : -999;
        const worldMouseY = isMousePositionValid ? (mousePosition.y - canvasState.offsetY) / canvasState.scale : -999;
        
        // 左侧连接圆圈 - 位于卡片左边缘
        const leftCircleDistance = isMousePositionValid ? Math.sqrt(Math.pow(worldMouseX - mapCard.x, 2) + Math.pow(worldMouseY - nodeY, 2)) : 999;
        const isLeftCircleHovered = isMousePositionValid && leftCircleDistance <= 8; // 悬停检测范围稍大
        const leftCircleRadius = isLeftCircleHovered ? 7 : 5; // 悬停时放大
        
        // 绘制左侧圆圈 - 输入端口，白色填充，绿色描边
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mapCard.x, nodeY, leftCircleRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#52c41a'; // 绿色表示输入
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mapCard.x, nodeY, leftCircleRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 节点名称 - 改进文本样式
         ctx.fillStyle = '#4a4a4a';
         ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
         ctx.fillText(node, mapCard.x + 20, nodeY);
        
        // 右侧连接圆圈 - 位于卡片右边缘
        const rightCircleDistance = isMousePositionValid ? Math.sqrt(Math.pow(worldMouseX - (mapCard.x + cardWidth), 2) + Math.pow(worldMouseY - nodeY, 2)) : 999;
        const isRightCircleHovered = isMousePositionValid && rightCircleDistance <= 8; // 悬停检测范围稍大
        const rightCircleRadius = isRightCircleHovered ? 7 : 5; // 悬停时放大
        
        // 绘制右侧圆圈 - 输出端口，白色填充，蓝色描边
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mapCard.x + cardWidth, nodeY, rightCircleRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#1890ff'; // 蓝色表示输出
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mapCard.x + cardWidth, nodeY, rightCircleRadius, 0, 2 * Math.PI);
        ctx.stroke();
      });
    });

    // 绘制已完成的连接线
    connections.forEach((connection, _index) => {
      const startCard = mapCards.find(card => card.id === connection.startCard);
      const endCard = mapCards.find(card => card.id === connection.endCard);
      
      if (startCard && endCard) {
        const cardWidth = 200;
        // 计算圆圈中心位置 - 与圆圈绘制位置保持一致
        const startY = startCard.y + 162 + connection.startNode * 22; // 增加标题与节点间距
        const endY = endCard.y + 162 + connection.endNode * 22; // 增加标题与节点间距
        
        const startX = connection.startSide === 'left' ? startCard.x : startCard.x + cardWidth;
        const endX = connection.endSide === 'left' ? endCard.x : endCard.x + cardWidth;
        
        // 检查是否为选中的连线
        const isSelected = selectedConnectionId === connection.id;
        
        // 绘制贝塞尔曲线 - 选中时使用不同样式
        ctx.strokeStyle = '#1890ff'; // 保持蓝色不变
        ctx.lineWidth = isSelected ? 4 : 2; // 选中时更粗
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // 计算控制点
        const controlOffset = Math.abs(endX - startX) * 0.5;
        const cp1x = startX + (connection.startSide === 'left' ? -controlOffset : controlOffset);
        const cp2x = endX + (connection.endSide === 'left' ? -controlOffset : controlOffset);
        
        ctx.bezierCurveTo(cp1x, startY, cp2x, endY, endX, endY);
        ctx.stroke();
        
        // 绘制箭头
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = isSelected ? 10 : 8; // 选中时箭头更大
        const arrowAngle = Math.PI / 6;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle - arrowAngle),
          endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle + arrowAngle),
          endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
      }
    });
    
    // 绘制正在绘制的曲线
    if (curveDrawingState.isDrawing && curveDrawingState.startPoint && curveDrawingState.currentPoint) {
      if (isDev) console.log('✏️ Drawing temporary curve:', {
        startPoint: curveDrawingState.startPoint,
        currentPoint: curveDrawingState.currentPoint,
        isDrawing: curveDrawingState.isDrawing
      });
      
      const startX = curveDrawingState.startPoint.x;
      const startY = curveDrawingState.startPoint.y;
      const currentX = (curveDrawingState.currentPoint.x - canvasState.offsetX) / canvasState.scale;
      const currentY = (curveDrawingState.currentPoint.y - canvasState.offsetY) / canvasState.scale;
      
      // 绘制虚线曲线
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // 计算控制点
      const controlOffset = Math.abs(currentX - startX) * 0.5;
      const cp1x = startX + (curveDrawingState.startPoint.side === 'left' ? -controlOffset : controlOffset);
      const cp2x = currentX - controlOffset;
      
      ctx.bezierCurveTo(cp1x, startY, cp2x, currentY, currentX, currentY);
      ctx.stroke();
      ctx.setLineDash([]); // 重置虚线
    }

    // 恢复状态
    ctx.restore();

    // 移除坐标信息显示
    // ctx.fillStyle = '#666';
    // ctx.font = '12px Arial';
    // const worldX = (mousePosition.x - canvasState.offsetX) / canvasState.scale;
    // const worldY = (mousePosition.y - canvasState.offsetY) / canvasState.scale;
    // ctx.fillText(`坐标: (${Math.round(worldX)}, ${Math.round(worldY)})`, 10, 20);
    // ctx.fillText(`缩放: ${(canvasState.scale * 100).toFixed(0)}%`, 10, 40);
    
  }, [canvasState, mousePosition, selectedCardId, mapCards, connections, cursorVisible, curveDrawingState, selectedConnectionId, hoveredCardId, animationScale, floorInputState, submitValidated]);

  // 处理光标闪烁定时器
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    if (floorInputState.isEditing) {
      intervalId = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500);
    } else {
      setCursorVisible(true); // 重置光标状态
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [floorInputState.isEditing]);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 检测鼠标是否在地图卡片上
  const isMouseOverMapCard = useCallback((mouseX: number, mouseY: number, mapCard: any) => {
    const worldX = (mouseX - canvasState.offsetX) / canvasState.scale;
    const worldY = (mouseY - canvasState.offsetY) / canvasState.scale;
    
    // 动态计算卡片高度
    const elevatorNodes = ['1号电梯切换点1', '2号电梯切换点2'];
    const baseHeight = 156; // 增加6px以适应新的标题与节点间距
    const nodeHeight = 22; // 与drawCanvas保持一致
    const cardHeight = baseHeight + elevatorNodes.length * nodeHeight + 10;
    
    return worldX >= mapCard.x && 
           worldX <= mapCard.x + 200 && 
           worldY >= mapCard.y && 
           worldY <= mapCard.y + cardHeight;
  }, [canvasState]);

  // 获取鼠标下的地图卡片
  const getMapCardUnderMouse = useCallback((mouseX: number, mouseY: number) => {
    // 从后往前遍历，优先选择最上层的卡片
    for (let i = mapCards.length - 1; i >= 0; i--) {
      if (isMouseOverMapCard(mouseX, mouseY, mapCards[i])) {
        return mapCards[i];
      }
    }
    return null;
  }, [mapCards, isMouseOverMapCard]);
  
  // 检测鼠标是否在楼层输入框上
  const isMouseOverFloorInput = useCallback((mouseX: number, mouseY: number, mapCard: any) => {
    const worldX = (mouseX - canvasState.offsetX) / canvasState.scale;
    const worldY = (mouseY - canvasState.offsetY) / canvasState.scale;
    
    // 楼层输入框区域：x + 12, y + 88, width: 176, height: 28
    return worldX >= mapCard.x + 12 && 
           worldX <= mapCard.x + 12 + 176 && 
           worldY >= mapCard.y + 88 && 
           worldY <= mapCard.y + 88 + 28;
  }, [canvasState]);
  
  // 获取鼠标下的楼层输入框
  const getFloorInputUnderMouse = useCallback((mouseX: number, mouseY: number) => {
    for (let i = 0; i < mapCards.length; i++) {
      if (isMouseOverFloorInput(mouseX, mouseY, mapCards[i])) {
        return mapCards[i];
      }
    }
    return null;
  }, [mapCards, isMouseOverFloorInput]);

  // 保存楼层输入并退出编辑状态
  const saveFloorInputAndExit = useCallback(() => {
    if (isDev) console.log('🟡 saveFloorInputAndExit 开始执行');
    
    // 使用函数式更新来获取最新状态，避免依赖项问题
    setFloorInputState(currentState => {
      if (isDev) console.log('🟡 saveFloorInputAndExit 内部状态:', currentState);
      
      // 检查当前状态，避免重复调用
      if (!currentState.isEditing) {
        if (isDev) console.log('🟡 当前不在编辑状态，无需保存');
        return currentState;
      }
      
      // 保存输入值到对应的地图卡片
      setMapCards(prev => {
        const updated = prev.map(card => 
          card.id === currentState.editingCardId 
            ? { ...card, floor: currentState.inputValue }
            : card
        );
        if (isDev) console.log('🟡 更新地图卡片数据:', updated);
        
        // 如果输入了有效的楼层信息，重置校验状态
        if (currentState.inputValue && currentState.inputValue.trim() !== '') {
          setSubmitValidated(false);
        }
        
        return updated;
      });
      
      // 返回新的非编辑状态
      const newState = {
        isEditing: false,
        editingCardId: null,
        inputValue: ''
      };
      if (isDev) console.log('🟡 设置新的非编辑状态:', newState);
      
      return newState;
    });
    
    if (isDev) console.log('🟡 saveFloorInputAndExit 执行完成');
  }, []);
  
  // 检测鼠标是否在连接圆圈上

  
  // 获取鼠标下的连接圆圈详细信息
  const getConnectionCircleUnderMouse = useCallback((mouseX: number, mouseY: number) => {
    const worldX = (mouseX - canvasState.offsetX) / canvasState.scale;
    const worldY = (mouseY - canvasState.offsetY) / canvasState.scale;
    
    if (isDev) console.log('🎯 检测连接圆圈:', { mouseX, mouseY, worldX, worldY });
    
    for (const mapCard of mapCards) {
      const cardWidth = 200;
      const elevatorNodes = ['1号电梯切换点1', '2号电梯切换点2'];
      
      for (let index = 0; index < elevatorNodes.length; index++) {
        const nodeY = mapCard.y + 162 + index * 22; // 与drawCanvas保持一致，增加标题与节点间距
        
        // 检测左侧圆圈
        const leftDistance = Math.sqrt(Math.pow(worldX - mapCard.x, 2) + Math.pow(worldY - nodeY, 2));
        if (leftDistance <= 8) {
          return {
            cardId: mapCard.id,
            nodeIndex: index,
            side: 'left' as const,
            x: mapCard.x,
            y: nodeY
          };
        }
        
        // 检测右侧圆圈
        const rightDistance = Math.sqrt(Math.pow(worldX - (mapCard.x + cardWidth), 2) + Math.pow(worldY - nodeY, 2));
        if (rightDistance <= 8) {
          return {
            cardId: mapCard.id,
            nodeIndex: index,
            side: 'right' as const,
            x: mapCard.x + cardWidth,
            y: nodeY
          };
        }
      }
    }
    return null;
  }, [mapCards, canvasState]);

  // 检测鼠标点击是否在连线上
  const getConnectionUnderMouse = useCallback((mouseX: number, mouseY: number) => {
    const worldX = (mouseX - canvasState.offsetX) / canvasState.scale;
    const worldY = (mouseY - canvasState.offsetY) / canvasState.scale;
    
    // 简化日志输出
    if (connections.length > 0) {
      if (isDev) console.log('🔍 检测连线点击:', { connectionsCount: connections.length });
    }
    
    for (const connection of connections) {
      const startCard = mapCards.find(card => card.id === connection.startCard);
      const endCard = mapCards.find(card => card.id === connection.endCard);
      
      if (startCard && endCard) {
        const cardWidth = 200;
        // 计算连线的起始和结束点
        const startY = startCard.y + 162 + connection.startNode * 22;
        const endY = endCard.y + 162 + connection.endNode * 22;
        const startX = connection.startSide === 'left' ? startCard.x : startCard.x + cardWidth;
        const endX = connection.endSide === 'left' ? endCard.x : endCard.x + cardWidth;
        
        // 简化的点到贝塞尔曲线距离检测
        // 将贝塞尔曲线近似为多个线段进行检测
        const segments = 20; // 分割段数
        for (let i = 0; i < segments; i++) {
          const t1 = i / segments;
          const t2 = (i + 1) / segments;
          
          // 计算贝塞尔曲线上的两个点
          const controlOffset = Math.abs(endX - startX) * 0.5;
          const cp1x = startX + (connection.startSide === 'left' ? -controlOffset : controlOffset);
          const cp2x = endX + (connection.endSide === 'left' ? -controlOffset : controlOffset);
          
          // 贝塞尔曲线公式
          const getPointOnCurve = (t: number) => {
            const x = Math.pow(1-t, 3) * startX + 3 * Math.pow(1-t, 2) * t * cp1x + 3 * (1-t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * endX;
            const y = Math.pow(1-t, 3) * startY + 3 * Math.pow(1-t, 2) * t * startY + 3 * (1-t) * Math.pow(t, 2) * endY + Math.pow(t, 3) * endY;
            return { x, y };
          };
          
          const p1 = getPointOnCurve(t1);
          const p2 = getPointOnCurve(t2);
          
          // 计算点到线段的距离
          const A = worldY - p1.y;
          const B = p1.x - worldX;
          const C = worldX * p1.y - p1.x * worldY;
          const distance = Math.abs(A * p2.x + B * p2.y + C) / Math.sqrt(A * A + B * B);
          
          // 检查点是否在线段范围内
          const dotProduct = (worldX - p1.x) * (p2.x - p1.x) + (worldY - p1.y) * (p2.y - p1.y);
          const squaredLength = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
          const param = dotProduct / squaredLength;
          
          if (param >= 0 && param <= 1 && distance <= 5) { // 5像素的点击容差
            if (isDev) console.log('🎯 选中连线:', connection.id);
            return connection;
          }
        }
      }
    }
    return null;
  }, [connections, mapCards, canvasState]);

  // 保存历史记录
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      offsetX: canvasState.offsetX,
      offsetY: canvasState.offsetY,
      scale: canvasState.scale,
      mapCards: [...mapCards],
      connections: [...connections]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // 限制历史记录数量
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [canvasState, history, historyIndex, mapCards, connections]);

  // 撤回功能
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setCanvasState(prev => ({
        ...prev,
        offsetX: prevState.offsetX,
        offsetY: prevState.offsetY,
        scale: prevState.scale
      }));
      setMapCards([...prevState.mapCards]);
      setConnections([...prevState.connections]);
      setHistoryIndex(prev => prev - 1);
      
      // 清除选中状态
      setSelectedCardId(null);
      setSelectedConnectionId(null);
      
      message.success('已撤销操作');
    }
  }, [history, historyIndex]);

  // 重做功能
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setCanvasState(prev => ({
        ...prev,
        offsetX: nextState.offsetX,
        offsetY: nextState.offsetY,
        scale: nextState.scale
      }));
      setMapCards([...nextState.mapCards]);
      setConnections([...nextState.connections]);
      setHistoryIndex(prev => prev + 1);
      
      // 清除选中状态
      setSelectedCardId(null);
      setSelectedConnectionId(null);
      
      message.success('已重做操作');
    }
  }, [history, historyIndex]);

  // 放大功能
  const handleZoomIn = useCallback(() => {
    saveToHistory();
    setCanvasState(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 5) // 最大放大5倍
    }));
  }, [saveToHistory]);

  // 缩小功能
  const handleZoomOut = useCallback(() => {
    saveToHistory();
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.1) // 最小缩小到0.1倍
    }));
  }, [saveToHistory]);

  // 回到初始位置功能
  const handleResetPosition = useCallback(() => {
    saveToHistory();
    setCanvasState(prev => ({
      ...prev,
      offsetX: 0,
      offsetY: 0,
      scale: 1
    }));
  }, [saveToHistory]);
  
  // 处理画布双击事件
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    // 计算相对于画布的位置
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 记录选择位置
    setSelectedMapPosition({ x, y });
    
    // 打开地图列表弹窗
    setMapListModalVisible(true);
  }, [currentStep]);

  // 监听selectedConnectionId变化，立即重绘画布以显示选中效果
  useEffect(() => {
    if (isDev) console.log('🔄 [状态变化] selectedConnectionId更新:', {
      newValue: selectedConnectionId,
      timestamp: new Date().toISOString()
    });
    
    // 立即重绘画布以显示连线选中的加粗效果
    if (visible && currentStep === 1) {
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  }, [selectedConnectionId, visible, currentStep, drawCanvas]);

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 楼层输入编辑状态下的键盘事件
      if (floorInputState.isEditing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          // 确认输入，更新楼层信息
          setMapCards(prev => prev.map(card => 
            card.id === floorInputState.editingCardId 
              ? { ...card, floor: floorInputState.inputValue }
              : card
          ));
          
          // 如果输入了有效的楼层信息，重置校验状态
          if (floorInputState.inputValue && floorInputState.inputValue.trim() !== '') {
            setSubmitValidated(false);
          }
          
          setFloorInputState({
            isEditing: false,
            editingCardId: null,
            inputValue: ''
          });
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // 取消输入，恢复原值
          setFloorInputState({
            isEditing: false,
            editingCardId: null,
            inputValue: ''
          });
          return;
        } else if (e.key.length === 1 || e.key === 'Backspace') {
          // 处理字符输入和删除
          e.preventDefault();
          let newValue = floorInputState.inputValue;
          if (e.key === 'Backspace') {
            newValue = newValue.slice(0, -1);
          } else {
            newValue += e.key;
          }
          setFloorInputState(prev => ({
            ...prev,
            inputValue: newValue
          }));
          return;
        }
      }
      
      // 删除选中的连线
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId && !floorInputState.isEditing) {
        if (isDev) console.log('🗑️ [删除连线] 开始删除:', {
          key: e.key,
          selectedConnectionId,
          connectionsCount: connections.length,
          isEditing: floorInputState.isEditing,
          allConnectionIds: connections.map(c => c.id)
        });
        e.preventDefault();
        
        const connectionToDelete = connections.find(conn => conn.id === selectedConnectionId);
        if (connectionToDelete) {
          if (isDev) console.log('🗑️ [删除连线] 找到要删除的连线:', connectionToDelete);
          
          // 保存历史记录
          saveToHistory();
          
          setConnections(prev => {
            const filtered = prev.filter(conn => conn.id !== selectedConnectionId);
            if (isDev) console.log('🗑️ [删除连线] 删除完成:', {
              before: prev.length,
              after: filtered.length,
              removed: prev.length - filtered.length,
              deletedId: selectedConnectionId,
              remainingIds: filtered.map(c => c.id)
            });
            return filtered;
          });
          setSelectedConnectionId(null);
          message.success('连线已删除');
          // 立即重绘画布
          requestAnimationFrame(() => {
            drawCanvas();
          });
        } else {
          if (isDev) console.log('🗑️ [删除连线] 错误: 未找到要删除的连线，selectedConnectionId:', selectedConnectionId, '可用连线:', connections.map(c => c.id));
          message.error('删除失败：未找到指定连线');
        }
        return;
      }
      
      // 空格键拖拽画布
      if (e.code === 'Space' && !canvasState.isSpacePressed && !floorInputState.isEditing) {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: false, isDragging: false }));
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    };

    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [visible, canvasState.isSpacePressed, floorInputState, mapCards, selectedConnectionId, connections, drawCanvas]);

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 检测是否点击在连线上
    const clickedConnection = getConnectionUnderMouse(mouseX, mouseY);
    
    if (clickedConnection && !canvasState.isSpacePressed) {
      if (isDev) console.log('✅ 选中连线:', {
        clickedId: clickedConnection.id,
        previousSelectedId: selectedConnectionId,
        allConnections: connections.map(c => ({ id: c.id, startCard: c.startCard, endCard: c.endCard }))
      });
      // 选中连线
      setSelectedConnectionId(clickedConnection.id);
      // 清除其他选中状态
      setSelectedCardId(null);
      // 立即重绘画布以显示选中效果
      requestAnimationFrame(() => {
        drawCanvas();
      });
      return; // 阻止其他事件处理
    }
    
    // 检测是否点击在连接圆圈上
    const circleInfo = getConnectionCircleUnderMouse(mouseX, mouseY);
    if (circleInfo) {
      // 只允许从输出圆圈（右侧）开始连线
      if (circleInfo.side === 'right' && !curveDrawingState.isDrawing) {
        // 从输出圆圈开始绘制曲线
        setCurveDrawingState({
          isDrawing: true,
          startPoint: {
            x: circleInfo.x,
            y: circleInfo.y,
            cardId: circleInfo.cardId,
            nodeIndex: circleInfo.nodeIndex,
            side: circleInfo.side
          },
          currentPoint: { x: mouseX, y: mouseY }
        });
      }
      return; // 阻止其他事件处理
    }
    
    // 检查是否点击在楼层输入框上
    const clickedFloorInput = getFloorInputUnderMouse(mouseX, mouseY);
    
    if (clickedFloorInput && !canvasState.isSpacePressed) {
      if (isDev) console.log('🔵 点击了楼层输入框，卡片ID:', clickedFloorInput.id, '当前编辑状态:', floorInputState);
      // 如果当前有其他输入框正在编辑，先保存并退出
      if (floorInputState.isEditing && floorInputState.editingCardId !== clickedFloorInput.id) {
        saveFloorInputAndExit();
      }
      
      // 开始编辑楼层输入框
      // 点击楼层输入框
      const newEditState = {
        isEditing: true,
        editingCardId: clickedFloorInput.id,
        inputValue: clickedFloorInput.floor || ''
      };
      setFloorInputState(newEditState);
      if (isDev) console.log('🔵 设置楼层输入框为编辑状态:', newEditState);
      return; // 阻止其他事件处理
    }
    
    // 检查是否点击在地图卡片上
    const clickedCard = getMapCardUnderMouse(mouseX, mouseY);
    
    if (clickedCard && !canvasState.isSpacePressed) {
      // 如果当前有楼层输入框正在编辑，先保存并退出
      if (floorInputState.isEditing) {
        saveFloorInputAndExit();
      }
      
      // 记录鼠标按下状态，但不立即开始拖拽或选中
      setDragState({
        isDragging: false, // 暂时不开始拖拽
        dragCardId: clickedCard.id,
        dragStartX: mouseX,
        dragStartY: mouseY,
        cardStartX: clickedCard.x,
        cardStartY: clickedCard.y,
        mouseDownOnCard: true
      });
    } else if (canvasState.isSpacePressed) {
      // 如果当前有楼层输入框正在编辑，先保存并退出
      if (floorInputState.isEditing) {
        saveFloorInputAndExit();
      }
      
      // 开始拖拽画布
      saveToHistory(); // 在开始拖拽时保存历史记录
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    } else {
      // 点击空白区域
      if (isDev) console.log('🔴 点击了画布空白区域，当前编辑状态:', floorInputState);
      if (curveDrawingState.isDrawing) {
        // 如果正在绘制曲线，取消绘制
        setCurveDrawingState({
          isDrawing: false,
          startPoint: null,
          currentPoint: null
        });
      }
      
      if (floorInputState.isEditing) {
        // 如果处于楼层输入编辑模式，结束编辑并保存数据
        if (isDev) console.log('🔴 检测到楼层输入正在编辑，准备退出编辑模式');
        saveFloorInputAndExit();
        if (isDev) console.log('🔴 saveFloorInputAndExit 已调用');
      }
      
      // 清除所有选中状态
      setSelectedCardId(null);
      if (selectedConnectionId) {
        if (isDev) console.log('🔄 [取消选中] 清除连线选中状态:', selectedConnectionId);
        setSelectedConnectionId(null);
        // 立即重绘画布以更新视觉效果
        requestAnimationFrame(() => {
          drawCanvas();
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePosition({ x: mouseX, y: mouseY });
    
    // 检测是否应该开始拖拽（鼠标按下但还未开始拖拽）
    if (dragState.mouseDownOnCard && !dragState.isDragging && dragState.dragCardId) {
      const deltaX = mouseX - dragState.dragStartX;
      const deltaY = mouseY - dragState.dragStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 当鼠标移动超过5像素时开始拖拽
      if (distance > 5) {
        // 开始拖拽地图卡片
        setDragState(prev => ({ ...prev, isDragging: true }));
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grabbing';
        }
      }
    }
    // 处理地图卡片拖拽
    else if (dragState.isDragging && dragState.dragCardId) {
      const deltaX = (mouseX - dragState.dragStartX) / canvasState.scale;
      const deltaY = (mouseY - dragState.dragStartY) / canvasState.scale;
      
      const newX = dragState.cardStartX + deltaX;
      const newY = dragState.cardStartY + deltaY;
      
      // 更新地图卡片位置
      setMapCards(prev => prev.map(card => 
        card.id === dragState.dragCardId 
          ? { ...card, x: newX, y: newY }
          : card
      ));
    }
    // 处理画布拖拽
    else if (canvasState.isDragging && canvasState.isSpacePressed) {
      const deltaX = e.clientX - canvasState.lastMouseX;
      const deltaY = e.clientY - canvasState.lastMouseY;

      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    }
    // 更新曲线绘制状态
    else if (curveDrawingState.isDrawing) {
      setCurveDrawingState(prev => ({
        ...prev,
        currentPoint: { x: mouseX, y: mouseY }
      }));
    }
    // 更新鼠标悬停效果
    else {
      if (canvasRef.current) {
        // 检测是否悬停在连接圆圈上
        const circleInfo = getConnectionCircleUnderMouse(mouseX, mouseY);
        const hoveredCard = getMapCardUnderMouse(mouseX, mouseY);
        
        // 更新悬停卡片状态并触发动画
        const newHoveredCardId = hoveredCard ? hoveredCard.id : null;
        if (newHoveredCardId !== hoveredCardId) {
          // 如果之前有悬停的卡片，恢复其缩放
          if (hoveredCardId) {
            animateScale(hoveredCardId, 1);
          }
          // 如果现在有新的悬停卡片，开始放大动画
          if (newHoveredCardId) {
            animateScale(newHoveredCardId, 1.05);
          }
          setHoveredCardId(newHoveredCardId);
        }
        
        if (circleInfo && !canvasState.isSpacePressed) {
          // 根据圆圈类型设置不同的光标
          if (circleInfo.side === 'right') {
            // 输出圆圈 - 可以开始连线
            canvasRef.current.style.cursor = 'crosshair';
          } else if (circleInfo.side === 'left' && curveDrawingState.isDrawing) {
            // 输入圆圈 - 只有在绘制连线时才能结束连线
            canvasRef.current.style.cursor = 'pointer';
          } else {
            // 输入圆圈但不在绘制状态
            canvasRef.current.style.cursor = 'not-allowed';
          }
        } else if (hoveredCard && !canvasState.isSpacePressed) {
          canvasRef.current.style.cursor = 'grab';
        } else if (canvasState.isSpacePressed) {
          canvasRef.current.style.cursor = 'grab';
        } else {
          canvasRef.current.style.cursor = 'default';
        }
      }
    }
    
    // 如果正在绘制曲线，设置十字光标
    if (curveDrawingState.isDrawing && canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 检查是否正在绘制连线且鼠标松开在输入圆圈上
      if (curveDrawingState.isDrawing && curveDrawingState.startPoint) {
        const circleInfo = getConnectionCircleUnderMouse(mouseX, mouseY);
        
        // 只允许连接到输入圆圈（左侧）且不是同一个圆圈
        if (circleInfo && 
            circleInfo.side === 'left' && 
            (curveDrawingState.startPoint.cardId !== circleInfo.cardId || 
             curveDrawingState.startPoint.nodeIndex !== circleInfo.nodeIndex)) {
          
          const newConnection = {
            id: `connection_${Date.now()}`,
            startCard: curveDrawingState.startPoint.cardId,
            startNode: curveDrawingState.startPoint.nodeIndex,
            startSide: curveDrawingState.startPoint.side,
            endCard: circleInfo.cardId,
            endNode: circleInfo.nodeIndex,
            endSide: circleInfo.side
          };
          
          // 保存历史记录
          saveToHistory();
          
          setConnections(prev => [...prev, newConnection]);
        }
        
        // 重置绘制状态
        setCurveDrawingState({
          isDrawing: false,
          startPoint: null,
          currentPoint: null
        });
      }
    }
    
    // 处理单击选中逻辑（鼠标按下但没有开始拖拽）
    if (dragState.mouseDownOnCard && !dragState.isDragging && dragState.dragCardId) {
      // 单击选中卡片
      setSelectedCardId(dragState.dragCardId);
    }
    
    // 结束地图卡片拖拽
    if (dragState.isDragging) {
      // 保存历史记录
      saveToHistory();
    }
    
    // 重置拖拽状态
    if (dragState.mouseDownOnCard || dragState.isDragging) {
      setDragState({
        isDragging: false,
        dragCardId: null,
        dragStartX: 0,
        dragStartY: 0,
        cardStartX: 0,
        cardStartY: 0,
        mouseDownOnCard: false
      });
    }
    
    // 结束画布拖拽
    if (canvasState.isDragging) {
      setCanvasState(prev => ({ ...prev, isDragging: false }));
    }
    
    // 重置鼠标样式
    if (canvasRef.current) {
      if (canvasState.isSpacePressed) {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    saveToHistory(); // 在缩放时保存历史记录
    
    // 获取鼠标在画布中的位置
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 计算鼠标在世界坐标系中的位置（缩放前）
    const worldX = (mouseX - canvasState.offsetX) / canvasState.scale;
    const worldY = (mouseY - canvasState.offsetY) / canvasState.scale;
    
    // 计算新的缩放比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasState.scale * delta));
    
    // 计算新的偏移量，使鼠标位置保持不变
    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;
    
    setCanvasState(prev => ({ 
      ...prev, 
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  // 重绘画布 - 优化性能，只在必要时重绘
  useEffect(() => {
    if (currentStep === 1) {
      drawCanvas();
    }
  }, [currentStep, mapCards, canvasState.offsetX, canvasState.offsetY, canvasState.scale, floorInputState, selectedCardId, curveDrawingState, connections]);

  // 初始化画布尺寸
  useEffect(() => {
    if (visible && canvasRef.current && currentStep === 1) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawCanvas();
      }
    }
  }, [visible, drawCanvas, currentStep]);

  // 重置表单和状态
  useEffect(() => {
    if (visible) {
      // // // const timestamp = new Date().toLocaleTimeString();
      // 组件加载
      
      setCurrentStep(0);
      
      const initialState = {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        isDragging: false,
        isSpacePressed: false,
        lastMouseX: 0,
        lastMouseY: 0
      };
      setCanvasState(initialState);
      
      // 初始化历史记录
      setHistory([{ offsetX: 0, offsetY: 0, scale: 1, mapCards: [], connections: [] }]);
      setHistoryIndex(0);
      
      if (editData) {
        form.setFieldsValue(editData);
        // 编辑模式 - 加载已有的画布数据
        if (editData.mapCards) {
          setMapCards(editData.mapCards);
        }
        if (editData.connections) {
          setConnections(editData.connections);
        }
      } else {
        form.resetFields();
        // 新建模式 - 清空画布数据
        setMapCards([]);
        setConnections([]);
        setSelectedCardId(null);
        setSelectedConnectionId(null);
        setHoveredCardId(null);
        setSelectedMapPosition(null);
      }
    }
  }, [visible, editData, form, mapListData.length]);

  // 键盘事件监听器
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (currentStep === 1 && selectedCardId) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (isDev) console.log('🗑️ Deleting card:', selectedCardId);
          if (isDev) console.log('📊 Before deletion - mapCards:', mapCards.length, 'connections:', connections.length);
          
          // 保存历史记录
          saveToHistory();
          
          // 删除选中的卡片
          setMapCards(prev => {
            const filtered = prev.filter(card => card.id !== selectedCardId);
            if (isDev) console.log('📊 After mapCards filter:', filtered.length);
            return filtered;
          });
          
          // 删除与该卡片相关的连接线
          setConnections(prev => {
            const filtered = prev.filter(conn => 
              conn.startCard !== selectedCardId && conn.endCard !== selectedCardId
            );
            if (isDev) console.log('📊 After connections filter:', filtered.length);
            return filtered;
          });
          
          setSelectedCardId(null);
          
          // 清除鼠标位置状态，避免悬停效果残留
          setMousePosition({ x: -1, y: -1 });
          
          // 立即强制重绘画布
          if (isDev) console.log('🎨 Forcing canvas redraw after deletion');
          requestAnimationFrame(() => {
            drawCanvas();
          });
          
          message.success('已删除选中的地图卡片');
          event.preventDefault();
        }
      }
      
      if (event.key === 'Escape') {
        // ESC键取消选中状态和曲线绘制
        setSelectedCardId(null);
        setCurveDrawingState({
          isDrawing: false,
          startPoint: null,
          currentPoint: null
        });
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible, currentStep, selectedCardId]);

  // 监听楼层输入状态变化，重绘画布
  useEffect(() => {
    if (visible && currentStep === 1) {
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  }, [floorInputState, visible, currentStep]);

  // 监听mapCards变化，立即重绘画布（用于删除卡片后的即时更新）
  useEffect(() => {
    if (isDev) console.log('📊 mapCards useEffect triggered:', {
      visible,
      currentStep,
      mapCardsCount: mapCards.length,
      timestamp: new Date().toISOString()
    });
    
    if (visible && currentStep === 1) {
      if (isDev) console.log('🎨 Calling drawCanvas from mapCards useEffect');
      // 使用requestAnimationFrame避免循环依赖，不将drawCanvas放入依赖项
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  }, [mapCards, visible, currentStep]);

  const handleNext = async () => {
    // const timestamp = new Date().toLocaleTimeString();
    // 点击下一步按钮
    
    if (currentStep === 0) {
      try {
        await form.validateFields(['connectionName', 'connectionType']);
        // const formData = form.getFieldsValue();
        // 表单验证成功
        
        setCurrentStep(1);
        
        // 切换到步骤1
      } catch (error) {
        // 表单验证失败
        message.error('请完善基本信息');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(0);
  };

  const handlePrevTwoSteps = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 2);
    } else {
      setCurrentStep(0);
    }
  };

  const handleFinish = async (_values: any) => {
    try {
      // 验证所有表单字段（包括第一步的基本信息）
      const allValues = await form.validateFields(['connectionName', 'connectionType', 'remark']);
      
      // 验证第二步画布中的必填项
      if (currentStep === 1) {
        // 设置提交校验状态为true，触发错误状态显示
        setSubmitValidated(true);
        
        // 检查是否至少添加了2个地图卡片
        if (mapCards.length < 2) {
          message.error('请至少添加2个地图卡片');
          return;
        }
        
        // 检查每个地图卡片是否都填写了楼层信息
        const emptyFloorCards = mapCards.filter(card => !card.floor || card.floor.trim() === '');
        if (emptyFloorCards.length > 0) {
          message.error('请为所有地图卡片填写楼层信息');
          // 立即重绘画布以显示错误状态
          requestAnimationFrame(() => {
            drawCanvas();
          });
          return;
        }
        
        // 检查是否至少创建了1条连线
        if (connections.length < 1) {
          message.error('请至少创建1条连接线');
          return;
        }
        
        // 校验通过，重置校验状态
        setSubmitValidated(false);
      }
      
      // 构建完整的保存数据
      const saveData = {
        ...allValues,
        mapCards: mapCards,
        connections: connections,
        canvasState: {
          offsetX: canvasState.offsetX,
          offsetY: canvasState.offsetY,
          scale: canvasState.scale
        },
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN'),
        status: 'active'
      };
      
      if (isDev) console.log('保存跨地图连接数据:', saveData);
      
      // 调用父组件的保存方法
      onSave(saveData);
      
      message.success(editData ? '跨地图连接更新成功' : '跨地图连接创建成功');
      
    } catch (error) {
      if (isDev) console.error('表单验证失败:', error);
      message.error('请完善所有必填信息');
    }
  };

  const steps = [
    {
      title: '基本信息',
      description: '配置连接基本信息'
    },
    {
      title: '连接配置',
      description: '配置连接参数和画布'
    }
  ];

  return (
    <Drawer
      title={editData ? '编辑跨地图连接' : '新增跨地图连接'}
      open={visible}
      onClose={onClose}
      width="100vw"
      height="100vh"
      placement="right"
      destroyOnHidden
      styles={{
        body: { padding: 0 },
        header: { borderBottom: '1px solid #f0f0f0' }
      }}
    >
      <div className="h-full flex flex-col p-6">

        
        {/* 表单内容 */}
        <div className="flex-1 overflow-hidden" style={{ marginTop: '40px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            className="h-full"
          >
            {currentStep === 0 && (
              <Row justify="center">
                <Col xs={24} sm={23} md={20} lg={18} xl={16}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 500, 
                    color: '#262626', 
                    marginBottom: '16px' 
                  }}>
                    跨地图连接基本信息
                  </div>
                  <div className="space-y-6">
                    <Form.Item
                      label="连接名称"
                      name="connectionName"
                      rules={[
                        { required: true, message: '请输入连接名称' },
                        { min: 2, message: '连接名称至少2个字符' },
                        { max: 50, message: '连接名称不能超过50个字符' }
                      ]}
                  >
                    <Input placeholder="请输入连接名称" size="large" />
                  </Form.Item>
                  
                  <Form.Item
                    label="连接类型"
                    name="connectionType"
                    rules={[{ required: true, message: '请选择连接类型' }]}
                  >
                    <Select 
                      placeholder="请选择连接类型" 
                      size="large"
                      onChange={(value: string) => {
                        setConnectionType(value);
                        // 重新绘制画布以更新显示内容
                        setTimeout(() => {
                          drawCanvas();
                        }, 0);
                      }}
                    >
                      <Option value="cross_map">跨地图连接</Option>
                      <Option value="cross_region">跨区域连接</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    label="备注"
                    name="remark"
                    rules={[
                      { max: 200, message: '备注不能超过200个字符' }
                    ]}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="请输入备注信息（可选）" 
                      showCount 
                      maxLength={200}
                      size="large"
                    />
                  </Form.Item>
                  </div>
                </Col>
              </Row>
            )}

            {currentStep === 1 && (
              <div className="h-full flex flex-col" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}>
                <div className="flex-1 relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onDoubleClick={handleCanvasDoubleClick}
                    style={{ 
                      cursor: canvasState.isSpacePressed ? 'grab' : 'default',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>
              </div>
            )}
          </Form>
        </div>

        {/* 底部操作栏 */}
        <div className="flex justify-center items-center pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            {/* 画布操作按钮（仅在画布步骤显示） */}
            {currentStep === 1 && (
              <>
                <Tooltip title="撤回">
                  <Button 
                    icon={<UndoOutlined />} 
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                  />
                </Tooltip>
                <Tooltip title="重做">
                  <Button 
                    icon={<RedoOutlined />} 
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                  />
                </Tooltip>
                <Tooltip title="放大">
                  <Button 
                    icon={<ZoomInOutlined />} 
                    onClick={handleZoomIn}
                    disabled={canvasState.scale >= 3}
                  />
                </Tooltip>
                <Tooltip title="缩小">
                  <Button 
                    icon={<ZoomOutOutlined />} 
                    onClick={handleZoomOut}
                    disabled={canvasState.scale <= 0.1}
                  />
                </Tooltip>
                <Tooltip title="回到初始位置">
                  <Button 
                    icon={<HomeOutlined />} 
                    onClick={handleResetPosition}
                  />
                </Tooltip>
                {/* 分隔线 */}
                <div style={{ width: '1px', height: '24px', backgroundColor: '#d9d9d9', margin: '0 8px' }} />
              </>
            )}
            
            {/* 主要操作按钮 */}
            <Button onClick={onClose}>
              取消
            </Button>
            {currentStep > 0 && (
              <Button
                type="primary"
                onClick={handlePrev}
              >
                上一步
              </Button>
            )}
            {currentStep > 1 && (
              <Button
                onClick={handlePrevTwoSteps}
              >
                回退2步
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={() => form.submit()}>
                提交
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* 地图列表弹窗 */}
      <Modal
        title="选择地图"
        open={mapListModalVisible}
        onCancel={() => setMapListModalVisible(false)}
        footer={null}
        width={800}
        height={600}
        centered
        styles={{
          body: {
            height: '500px',
            overflowY: 'auto',
            padding: '16px'
          }
        }}
      >
        <Row gutter={[12, 12]}>
          {mapListData.map((mapItem) => (
            <Col xs={24} sm={12} md={12} lg={8} key={mapItem.id}>
              <Card
                 hoverable
                 size="small"
                 cover={
                   <img
                     alt={mapItem.name}
                     src={mapItem.thumbnail}
                     style={{ height: 100, objectFit: 'cover' }}
                   />
                 }
                 onClick={() => {
                   // const timestamp = new Date().toLocaleTimeString();
                   // 地图卡片点击
                   
                   if (selectedMapPosition) {
                     // 创建新的地图卡片
                     const newMapCard = {
                       id: Date.now().toString(),
                       mapItem,
                       floor: '',
                       x: selectedMapPosition.x,
                       y: selectedMapPosition.y
                     };
                     
                     // 保存历史记录
                     saveToHistory();
                     
                     // 创建新地图卡片
                     setMapCards(prev => {
                       const updated = [...prev, newMapCard];
                       // 更新后的地图卡片列表
                       return updated;
                     });
                     
                     setSelectedMapPosition(null);
                     message.success(`已添加地图: ${mapItem.name}`);
                   } else {
                     if (isDev) console.error(`🐛 跨地图连接 - 没有选择位置信息`);
                     message.error('请先双击画布选择位置');
                   }
                   
                   setMapListModalVisible(false);
                   
                   // 地图选择弹窗已关闭
                 }}
                 styles={{ body: { padding: '8px' } }}
                 style={{ 
                   boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                   transition: 'all 0.3s ease',
                   cursor: 'pointer'
                 }}
                 className="map-selection-card"
              >
                <Card.Meta
                  title={
                    <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                      {mapItem.name}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: '11px', color: '#1890ff', marginBottom: 2 }}>
                        版本: {mapItem.currentVersion}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {mapItem.updateTime}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </Drawer>
  );
};

export default AddCrossMapConnection;