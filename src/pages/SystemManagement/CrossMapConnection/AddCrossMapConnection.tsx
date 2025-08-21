import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Drawer, Steps, Form, Input, Select, Button, message, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Step } = Steps;
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
    ctx.lineWidth = 0.5;
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

    // 移除坐标轴和原点绘制

    // 恢复状态
    ctx.restore();

    // 移除坐标信息显示
    // ctx.fillStyle = '#666';
    // ctx.font = '12px Arial';
    // const worldX = (mousePosition.x - canvasState.offsetX) / canvasState.scale;
    // const worldY = (mousePosition.y - canvasState.offsetY) / canvasState.scale;
    // ctx.fillText(`坐标: (${Math.round(worldX)}, ${Math.round(worldY)})`, 10, 20);
    // ctx.fillText(`缩放: ${(canvasState.scale * 100).toFixed(0)}%`, 10, 40);
  }, [canvasState, mousePosition]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !canvasState.isSpacePressed) {
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
  }, [visible, canvasState.isSpacePressed]);

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasState.isSpacePressed) {
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

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
  };

  const handleMouseUp = () => {
    if (canvasState.isDragging) {
      setCanvasState(prev => ({ ...prev, isDragging: false }));
      if (canvasRef.current && canvasState.isSpacePressed) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasState.scale * delta));
    
    setCanvasState(prev => ({ ...prev, scale: newScale }));
  };

  // 重绘画布
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // 初始化画布尺寸
  useEffect(() => {
    if (visible && canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawCanvas();
      }
    }
  }, [visible, drawCanvas]);

  // 重置表单和状态
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setCanvasState({
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        isDragging: false,
        isSpacePressed: false,
        lastMouseX: 0,
        lastMouseY: 0
      });
      
      if (editData) {
        form.setFieldsValue(editData);
      } else {
        form.resetFields();
      }
    }
  }, [visible, editData, form]);

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['name', 'type']);
        setCurrentStep(1);
      } catch (error) {
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

  const handleFinish = async (values: any) => {
    try {
      const allValues = await form.validateFields();
      onSave(allValues);
    } catch (error) {
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
                    <Select placeholder="请选择连接类型" size="large">
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
                {editData ? '保存' : '创建'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default AddCrossMapConnection;