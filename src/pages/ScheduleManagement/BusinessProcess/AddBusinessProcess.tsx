import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Steps,
  message,
  Tooltip,
} from 'antd';
import { ArrowLeftOutlined, UndoOutlined, RedoOutlined, ZoomInOutlined, ZoomOutOutlined, HomeOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

// 业务流程接口
interface BusinessProcessData {
  businessName: string;
  identifier: string;
  status: 'enabled' | 'disabled' | 'obsolete';
  remark?: string;
}

interface AddBusinessProcessProps {
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

const AddBusinessProcess: React.FC<AddBusinessProcessProps> = ({ 
  visible,
  onClose, 
  onSave, 
  editData 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 主步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  
  // 画布状态
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    isDragging: false,
    isSpacePressed: false,
    lastMouseX: 0,
    lastMouseY: 0
  });
  
  // 历史记录管理
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 处理编辑模式初始化
  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        businessName: editData.businessName,
        identifier: editData.identifier,
        status: editData.status,
        remark: editData.remark,
      });
    } else {
      form.resetFields();
      setCurrentStep(0);
    }
  }, [editData, form]);

  // 初始化历史记录
  useEffect(() => {
    if (visible && history.length === 0) {
      const initialState = {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        isDragging: false,
        isSpacePressed: false,
        lastMouseX: 0,
        lastMouseY: 0
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [visible, history.length]);

  // 主流程下一步
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        // 验证基本信息表单
        await form.validateFields(['businessName', 'identifier', 'status']);
        setCurrentStep(1);
      }
    } catch (error) {
      message.error('请完善必填信息');
    }
  };

  // 主流程上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 回退2步
  const handleBack2Steps = () => {
    if (currentStep >= 2) {
      setCurrentStep(currentStep - 2);
    } else {
      setCurrentStep(0);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      const allValues = await form.validateFields();
      onSave(allValues);
    } catch (error) {
      message.error('请完善所有必填信息');
    }
  };

  // 保存历史记录
  const saveToHistory = useCallback((state: CanvasState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...state });
      return newHistory.slice(-50); // 限制历史记录数量
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

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
      setHistoryIndex(prev => prev - 1);
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
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // 放大功能
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(canvasState.scale * 1.2, 3);
    const newState = {
      ...canvasState,
      scale: newScale
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  // 缩小功能
  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(canvasState.scale / 1.2, 0.3);
    const newState = {
      ...canvasState,
      scale: newScale
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  // 回到初始位置
  const handleResetPosition = useCallback(() => {
    const newState = {
      ...canvasState,
      offsetX: 0,
      offsetY: 0,
      scale: 1
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  const steps = [
    {
      title: '基本信息',
      description: '配置业务流程基本信息'
    },
    {
      title: '流程画布',
      description: '设计业务流程图'
    }
  ];

  // 画布鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && canvasState.isSpacePressed) {
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    }
  }, [canvasState.isSpacePressed]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasState.isDragging && canvasState.isSpacePressed) {
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
  }, [canvasState.isDragging, canvasState.isSpacePressed, canvasState.lastMouseX, canvasState.lastMouseY]);

  const handleMouseUp = useCallback(() => {
    if (canvasState.isDragging) {
      const newState = { ...canvasState, isDragging: false };
      setCanvasState(newState);
      saveToHistory(newState);
    } else {
      setCanvasState(prev => ({ ...prev, isDragging: false }));
    }
  }, [canvasState, saveToHistory]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newState = {
      ...canvasState,
      scale: Math.max(0.1, Math.min(3, canvasState.scale * delta))
    };
    setCanvasState(newState);
    saveToHistory(newState);
  }, [canvasState, saveToHistory]);

  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20 * canvasState.scale;
    const offsetX = canvasState.offsetX % gridSize;
    const offsetY = canvasState.offsetY % gridSize;

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // 绘制垂直线
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [canvasState.scale, canvasState.offsetX, canvasState.offsetY]);

  // Canvas绘制逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentStep !== 1) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    drawGrid(ctx, canvas.width, canvas.height);
  }, [canvasState, drawGrid, currentStep]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setCanvasState(prev => ({ ...prev, isSpacePressed: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setCanvasState(prev => ({ ...prev, isSpacePressed: false, isDragging: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <Drawer
      title={editData ? '编辑业务流程' : '新增业务流程'}
      open={visible}
      onClose={onClose}
      width="100vw"
      height="100vh"
      placement="right"
      destroyOnClose
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
                    业务流程基本信息
                  </div>
                  <div className="space-y-6">
                    <Form.Item
                      label="业务名称"
                      name="businessName"
                      rules={[
                        { required: true, message: '请输入业务名称' },
                        { min: 2, message: '业务名称至少2个字符' },
                        { max: 50, message: '业务名称不能超过50个字符' }
                      ]}
                    >
                      <Input placeholder="请输入业务名称" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="标识符"
                      name="identifier"
                      rules={[
                        { required: true, message: '请输入标识符' },
                        { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '标识符必须以字母开头，只能包含字母、数字和下划线' }
                      ]}
                    >
                      <Input placeholder="请输入标识符" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="状态"
                      name="status"
                      rules={[{ required: true, message: '请选择状态' }]}
                      initialValue="enabled"
                    >
                      <Select placeholder="请选择状态" size="large">
                        <Option value="enabled">启用</Option>
                        <Option value="disabled">禁用</Option>
                        <Option value="obsolete">废弃</Option>
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
        <div style={{
          borderTop: '1px solid #f0f0f0',
          paddingTop: '16px',
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* 画布操作按钮 - 仅在画布步骤显示 */}
          {currentStep === 1 && (
            <>
              <Tooltip title="撤回">
                 <Button
                   icon={<UndoOutlined />}
                   onClick={handleUndo}
                   disabled={historyIndex <= 0}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="重做">
                 <Button
                   icon={<RedoOutlined />}
                   onClick={handleRedo}
                   disabled={historyIndex >= history.length - 1}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="放大">
                 <Button
                   icon={<ZoomInOutlined />}
                   onClick={handleZoomIn}
                   disabled={canvasState.scale >= 3}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="缩小">
                 <Button
                   icon={<ZoomOutOutlined />}
                   onClick={handleZoomOut}
                   disabled={canvasState.scale <= 0.3}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
               <Tooltip title="回到初始位置">
                 <Button
                   icon={<HomeOutlined />}
                   onClick={handleResetPosition}
                   style={{
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 />
               </Tooltip>
              <div style={{
                width: '1px',
                height: '24px',
                backgroundColor: '#d9d9d9',
                margin: '0 8px'
              }} />
            </>
          )}
          <Button 
            onClick={onClose}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            取消
          </Button>
          {currentStep > 0 && (
            <Button 
              type="primary"
              onClick={handlePrev}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              上一步
            </Button>
          )}
          {currentStep >= 2 && (
            <Button 
              onClick={handleBack2Steps}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              回退2步
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button 
              type="primary" 
              onClick={handleNext}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              下一步
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleFinish}
              loading={loading}
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {editData ? '保存' : '创建'}
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default AddBusinessProcess;