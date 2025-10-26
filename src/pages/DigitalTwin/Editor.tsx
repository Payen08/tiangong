import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Select, Space, Typography, Input, InputNumber, List, Card, Divider, Modal, Form, message, Row, Col, Slider, ColorPicker, Progress, Upload } from 'antd';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import {
  ReloadOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HomeOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  VerticalAlignTopOutlined,
  BorderOutlined,
  AppstoreOutlined,
  ToolOutlined,
  BuildOutlined,
  DashboardOutlined,
  ColumnHeightOutlined,
  BorderInnerOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LineOutlined,
  BgColorsOutlined,
  SelectOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AlignCenterOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  DragOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

// 产品模型类型定义
interface ProductModel {
  id: string;
  name: string;
  type: 'wall' | 'door' | 'column' | 'floor' | 'equipment' | 'cnc';
  icon: React.ReactNode;
  description: string;
}

// CNC机台模型接口
interface CNCMachine {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  type: 'cnc';
  color: string;
  selected?: boolean;
  // 3D参数
  depth3D?: number;    // 3D深度（Z轴，单位：m）
  width3D?: number;    // 3D宽度（X轴，单位：m）
  height3D?: number;   // 3D高度（Y轴，单位：m）
  // 新增3D渲染参数
  opacity?: number;    // 透明度 (0-1)
  scale?: number;      // 整体缩放 (0.1-5.0)
  lighting?: {         // 光照参数
    intensity?: number;    // 光照强度 (0-2)
    ambient?: number;      // 环境光强度 (0-1)
    directional?: number;  // 方向光强度 (0-2)
  };
  rotation?: {         // 旋转参数
    x?: number;        // X轴旋转角度 (度)
    y?: number;        // Y轴旋转角度 (度)
    z?: number;        // Z轴旋转角度 (度)
  };
  // GLB模型相关参数
  currentModel?: string;    // 当前使用的模型ID ('custom' 表示自定义GLB模型)
  modelFile?: File | null;  // GLB模型文件对象
  modelUrl?: string;        // GLB模型文件URL (用于预览)
  modelFileName?: string;   // GLB模型文件名 (用于显示)
  modelFileBase64?: string; // GLB模型文件Base64编码 (用于存储)
}

// 绘图工具类型定义
interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'wall' | 'door' | 'column' | 'floor' | 'select';
  description: string;
  active: boolean;
  subType?: 'line' | 'bezier'; // 墙体绘制子类型
}

// 墙体数据结构
interface WallPoint {
  x: number;
  y: number;
}

// 共享端点数据结构
interface SharedPoint {
  id: string;
  x: number;
  y: number;
  connectedWalls: Array<{
    wallId: string;
    pointIndex: number;
  }>;
}

interface Wall {
  id: string;
  type: 'line' | 'bezier';
  points: WallPoint[];
  pointIds?: (string | null)[]; // 对应共享端点的ID数组，与points数组一一对应，允许null值
  controlPoints?: WallPoint[]; // 贝塞尔曲线控制点
  thickness: number; // 厚度 (Y轴，单位：m)
  color: string;
  completed: boolean;
  // 3D属性
  width?: number; // 宽度 (X轴，单位：m)
  height?: number; // 高度 (Z轴，单位：m)
  // 选中状态
  selected?: boolean;
  selectedEndpoints?: number[]; // 选中的端点索引
  selectedSegments?: number[]; // 选中的线段索引（从0开始，表示第i个点到第i+1个点的线段）
}

// 地面区域接口定义（参考地图管理中的区域绘制）
interface FloorArea {
  id: string;
  name: string;
  type: string; // 地面类型，如 'floor', 'carpet', 'tile' 等
  points: WallPoint[]; // 多边形顶点
  color: string;
  opacity?: number;
  completed: boolean;
  visible?: boolean;
  material?: string; // 材质类型
  texture?: string; // 纹理URL
  thickness?: number; // 地面厚度 (Z轴，单位：m)，默认0.1m
  selected?: boolean; // 选中状态
}

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
  baseMapUrl?: string; // 默认底图URL
  availableBaseMaps?: string[]; // 可用底图ID列表
  topology?: {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
  };
}

// 楼层场景接口
// 底图数据接口
interface BaseMapData {
  id: string;
  name: string;
  url: string;
  description?: string;
}

interface FloorScene {
  id: string;
  name: string;
  floor: number;
  dataSource?: string; // 场景基础数据源
  baseMap?: string; // 选择的底图ID
  initializeDevices?: boolean; // 是否初始化地图关联设备
  increaseUpdate?: boolean; // 是否增量更新
  sceneModel?: {
    file: File;
    name: string;
    size: number;
    type: string;
    url?: string; // 预览URL
  }; // 3D场景模型文件
}

// 3D编辑器组件ref接口
interface ThreeDEditorRef {
  resetView: () => void;
  updateCNCMachines: (machines: CNCMachine[]) => void;
  getScene: () => THREE.Scene | undefined;
  extractTopView: () => Array<{x: number, y: number}> | null;
}

// 3D编辑器组件接口
interface ThreeDEditorProps {
  walls: Wall[];
  cncMachines: CNCMachine[];
  floorAreas: FloorArea[]; // 地面区域数组
  selectedWall3DProps: {
    width: number;
    thickness: number;
    height: number;
    color: string;
    opacity: number;
  };
  selectedFloor3DProps: {
    thickness: number;
    color: string;
    opacity: number;
  };
  sceneModel?: {
    file: File;
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
  } | null; // 3D场景模型文件信息
  onWallSelect: (wallId: string) => void;
  onCNCMachineSelect?: (cncId: string) => void;
  onModelLoaded?: (topViewData: {x: number, y: number}[] | null) => void; // 3D模型加载成功回调
  style?: React.CSSProperties;
}

// 3D编辑器组件
const ThreeDEditor = React.forwardRef<ThreeDEditorRef, ThreeDEditorProps>(({ walls, cncMachines, floorAreas, selectedWall3DProps, selectedFloor3DProps, sceneModel, onWallSelect: _onWallSelect, onCNCMachineSelect: _onCNCMachineSelect, onModelLoaded, style }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const wallMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const cncMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const textureCache = useRef<Map<string, THREE.CanvasTexture>>(new Map());
  const floorMeshesRef = useRef<THREE.Mesh[]>([]);
  const sceneModelRef = useRef<THREE.Group | null>(null); // 3D场景模型引用

  // 暴露重置视图方法和更新CNC机台方法
  React.useImperativeHandle(ref, () => ({
    resetView: () => {
      if (cameraRef.current && controlsRef.current) {
        console.log('3D重置视图被调用');
        console.log('重置前相机位置:', cameraRef.current.position);
        console.log('重置前控制器目标:', controlsRef.current.target);
        
        // 重置相机位置和控制器目标到初始值
        cameraRef.current.position.set(10, 10, 10);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
        
        console.log('重置后相机位置:', cameraRef.current.position);
        console.log('重置后控制器目标:', controlsRef.current.target);
      } else {
        console.error('3D相机或控制器引用不存在');
      }
    },
    updateCNCMachines: (machines: CNCMachine[]) => {
      console.log('🔄 [3D-EDITOR] updateCNCMachines 被调用，机台数量:', machines.length);
      
      if (!sceneRef.current) {
        console.warn('⚠️ [3D-EDITOR] 场景引用不存在，无法更新CNC机台');
        return;
      }
      
      // 清除现有的CNC机台模型
      cncMeshesRef.current.forEach((mesh) => {
        sceneRef.current!.remove(mesh);
      });
      cncMeshesRef.current.clear();
      
      // 重新创建CNC机台模型
      machines.forEach((cnc) => {
        createCNCMachine(cnc, sceneRef.current!, cncMeshesRef.current);
      });
      
      console.log('✅ [3D-EDITOR] CNC机台更新完成');
    },
    getScene: () => {
      return sceneRef.current;
    },
    extractTopView: () => {
      console.log('🔄 [3D-EDITOR] extractTopView 被调用');
      
      if (!sceneModelRef.current) {
        console.warn('⚠️ [3D-EDITOR] 没有加载的3D场景模型');
        return null;
      }

      const topViewData: Array<{x: number, y: number}> = [];
      
      // 遍历场景模型的所有子对象
      sceneModelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geometry = child.geometry;
          
          // 获取几何体的位置属性
          const positionAttribute = geometry.getAttribute('position');
          if (positionAttribute) {
            const positions = positionAttribute.array;
            
            // 提取顶点的X和Z坐标（忽略Y轴高度）
            for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];     // X坐标
              const z = positions[i + 2]; // Z坐标（在2D顶视图中对应Y坐标）
              
              topViewData.push({ x, y: z });
            }
          }
        }
      });

      // 简化点集，移除重复和过于密集的点
      const simplifiedPoints = simplifyTopViewPoints(topViewData);
      
      console.log('✅ [3D-EDITOR] 顶视图提取完成，点数量:', simplifiedPoints.length);
      return simplifiedPoints;
    }
  }), []);
  
  // 简化顶视图点集的辅助函数
  const simplifyTopViewPoints = (points: Array<{x: number, y: number}>): Array<{x: number, y: number}> => {
    if (points.length === 0) return [];
    
    const tolerance = 0.1; // 简化容差，可根据需要调整
    const simplified: Array<{x: number, y: number}> = [];
    const visited = new Set<string>();
    
    for (const point of points) {
      const key = `${Math.round(point.x / tolerance)}_${Math.round(point.y / tolerance)}`;
      
      if (!visited.has(key)) {
        visited.add(key);
        simplified.push({
          x: Math.round(point.x * 100) / 100, // 保留两位小数
          y: Math.round(point.y * 100) / 100
        });
      }
    }
    
    return simplified;
  };
  
  // 键盘控制状态（预留用于未来功能扩展）

  // 安全纹理创建函数，避免重复创建纹理
  const createSafeTexture = (canvas: HTMLCanvasElement, cacheKey: string): THREE.CanvasTexture => {
    const cachedTexture = textureCache.current.get(cacheKey);
    if (cachedTexture && cachedTexture.image) {
      return cachedTexture;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    textureCache.current.set(cacheKey, texture);
    return texture;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    
    // 创建优雅的景深背景
    const createDepthBackground = () => {
      // 创建渐变背景纹理
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d')!;
      
      // 创建垂直渐变 - 从天空到地平线
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#e8f4f8');    // 淡蓝天空
      gradient.addColorStop(0.4, '#f0f6f8');  // 浅蓝过渡
      gradient.addColorStop(0.7, '#f8f8f8');  // 接近白色
      gradient.addColorStop(1, '#f5f5f5');    // 原始背景色
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // 设置为场景背景
      const texture = createSafeTexture(canvas, 'scene-background');
      scene.background = texture;
    };
    
    createDepthBackground();
    
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 优化光照系统 - 营造空间感，增强亮度
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    // 主方向光 - 模拟自然光照，增强强度
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(15, 15, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    
    // 添加增强的填充光
    const fillLight = new THREE.DirectionalLight(0xe8f4f8, 0.6);
    fillLight.position.set(-10, 5, -5);
    scene.add(fillLight);

    // 添加额外的点光源来照亮CNC机台区域
    const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 50);
    pointLight1.position.set(0, 10, 0);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.6, 40);
    pointLight2.position.set(-20, 8, -20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.6, 40);
    pointLight3.position.set(20, 8, 20);
    scene.add(pointLight3);



    // 添加单一网格辅助线
    const gridHelper = new THREE.GridHelper(1000, 100, 0x999999, 0xdddddd);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.5;
    scene.add(gridHelper);

    // 添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // 添加坐标轴标签的函数
    const addAxisLabel = (text: string, position: THREE.Vector3, color: number) => {
      // 创建文字纹理
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = 'Bold 32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 32, 32);
      
      const texture = createSafeTexture(canvas, `axis-label-${text}`);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      
      sprite.position.copy(position);
      sprite.scale.set(0.5, 0.5, 1);
      scene.add(sprite);
    };

    // 添加X、Y、Z轴标签
    addAxisLabel('X', new THREE.Vector3(5.5, 0, 0), 0xff0000); // 红色 X 轴
    addAxisLabel('Y', new THREE.Vector3(0, 5.5, 0), 0x00ff00); // 绿色 Y 轴
    addAxisLabel('Z', new THREE.Vector3(0, 0, 5.5), 0x0000ff); // 蓝色 Z 轴

    mountRef.current.appendChild(renderer.domElement);

    // 渲染循环
    const animate = () => {
      requestAnimationFrame(animate);
      
      // 更新OrbitControls
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };



    // 键盘事件处理（预留用于未来功能扩展）
    const handleKeyDown = (_event: KeyboardEvent) => {
      // 键盘按下事件处理逻辑
    };

    const handleKeyUp = (_event: KeyboardEvent) => {
      // 键盘释放事件处理逻辑
    };

    // 键盘移动处理 - 暂时禁用，将由OrbitControls处理
    const handleKeyboardMovement = () => {
      // 键盘移动功能将由OrbitControls处理
    };

    // 初始化OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 启用阻尼效果
    controls.dampingFactor = 0.05; // 阻尼系数
    controls.screenSpacePanning = false; // 禁用屏幕空间平移
    controls.minDistance = 1; // 最小距离
    controls.maxDistance = 100; // 最大距离
    controls.maxPolarAngle = Math.PI / 2; // 最大极角（防止相机翻转到地面以下）
    
    // 设置初始相机位置和目标
    camera.position.set(10, 10, 10);
    controls.target.set(0, 0, 0);
    controls.update();
    
    controlsRef.current = controls;

    // 设置键盘移动循环
    const keyboardInterval = setInterval(handleKeyboardMovement, 16); // 60fps

    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(keyboardInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      // 销毁OrbitControls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      // 清理纹理缓存
      textureCache.current.forEach(texture => {
        texture.dispose();
      });
      textureCache.current.clear();
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 3D模型加载useEffect
  useEffect(() => {
    if (!sceneModel || !sceneRef.current) return;

    const loader = new GLTFLoader();
    
    // 移除之前的模型
    if (sceneModelRef.current) {
      sceneRef.current.remove(sceneModelRef.current);
      sceneModelRef.current = null;
    }

    // 创建文件URL
    const fileUrl = URL.createObjectURL(sceneModel.file);
    
    // 加载3D模型
    loader.load(
      fileUrl,
      (gltf) => {
        console.log('3D模型加载成功:', sceneModel.name);
        
        // 创建模型组
        const modelGroup = new THREE.Group();
        modelGroup.add(gltf.scene);
        
        // 设置模型位置和缩放
        modelGroup.position.set(0, 0, 0);
        modelGroup.scale.set(1, 1, 1);
        
        // 添加到场景
        sceneRef.current!.add(modelGroup);
        sceneModelRef.current = modelGroup;
        
        // 清理文件URL
        URL.revokeObjectURL(fileUrl);
        
        console.log('3D模型已添加到场景');
      },
      (progress) => {
        console.log('3D模型加载进度:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('3D模型加载失败:', error);
        // 清理文件URL
        URL.revokeObjectURL(fileUrl);
      }
    );

    // 清理函数
    return () => {
      if (sceneModelRef.current && sceneRef.current) {
        sceneRef.current.remove(sceneModelRef.current);
        sceneModelRef.current = null;
      }
    };
  }, [sceneModel]);

  // 相机位置更新将由OrbitControls自动处理

  // 创建统一的闭合墙体（使用BufferGeometry精确构建）
  const createUnifiedClosedWall = (
    wall: Wall, 
    props: typeof selectedWall3DProps, 
    scene: THREE.Scene, 
    meshMap: Map<string, THREE.Mesh>
  ) => {
    const points = wall.points;
    if (points.length < 3) return;

    // 计算墙体厚度的一半
    const halfThickness = props.thickness / 2;
    const height = props.height;
    
    // 创建外轮廓和内轮廓顶点
    const outerVertices: THREE.Vector3[] = [];
    const innerVertices: THREE.Vector3[] = [];
    
    // 计算每个点的精确偏移位置
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const prev = points[(i - 1 + points.length) % points.length];
      const next = points[(i + 1) % points.length];
      
      // 使用与地面一致的坐标转换逻辑 - 移除Z轴镜像
      const currentPos = new THREE.Vector3(current.x / 100 * 5, 0, current.y / 100 * 5);
      const prevPos = new THREE.Vector3(prev.x / 100 * 5, 0, prev.y / 100 * 5);
      const nextPos = new THREE.Vector3(next.x / 100 * 5, 0, next.y / 100 * 5);
      
      // 计算前一段和后一段的方向向量
      const prevDir = new THREE.Vector3().subVectors(currentPos, prevPos).normalize();
      const nextDir = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
      
      // 计算法向量（垂直于墙体方向，向右）
      const prevNormal = new THREE.Vector3(-prevDir.z, 0, prevDir.x).normalize();
      const nextNormal = new THREE.Vector3(-nextDir.z, 0, nextDir.x).normalize();
      
      // 计算角平分线法向量
      let bisectorNormal = new THREE.Vector3().addVectors(prevNormal, nextNormal);
      
      // 处理特殊情况：当两个法向量相反时（180度角）
      if (bisectorNormal.length() < 0.001) {
        // 使用任意一个法向量
        bisectorNormal = prevNormal.clone();
      } else {
        bisectorNormal.normalize();
      }
      
      // 计算角度和偏移距离
      const angle = prevDir.angleTo(nextDir);
      let offsetDistance = halfThickness;
      
      // 对于非直角，使用角平分线算法
      if (Math.abs(angle) > 0.01 && Math.abs(angle - Math.PI) > 0.01) {
        const sinHalfAngle = Math.sin(Math.max(angle / 2, 0.01));
        offsetDistance = halfThickness / sinHalfAngle;
        // 限制最大偏移，避免尖角过长
        offsetDistance = Math.min(offsetDistance, halfThickness * 3);
      }
      
      // 确保偏移方向正确（检查是否为凸角）
      const cross = new THREE.Vector3().crossVectors(prevDir, nextDir);
      if (cross.y < 0) {
        // 凹角，需要反向偏移
        bisectorNormal.negate();
      }
      
      // 生成外轮廓和内轮廓顶点（底部和顶部）
      const outerOffset = new THREE.Vector3()
        .copy(bisectorNormal)
        .multiplyScalar(offsetDistance);
      const innerOffset = new THREE.Vector3()
        .copy(bisectorNormal)
        .multiplyScalar(-offsetDistance);
      
      // 外轮廓顶点（底部和顶部）
      outerVertices.push(
        new THREE.Vector3().addVectors(currentPos, outerOffset).setY(0), // 底部与地面对齐
        new THREE.Vector3().addVectors(currentPos, outerOffset).setY(height) // 顶部
      );
      
      // 内轮廓顶点（底部和顶部）
      innerVertices.push(
        new THREE.Vector3().addVectors(currentPos, innerOffset).setY(0), // 底部与地面对齐
        new THREE.Vector3().addVectors(currentPos, innerOffset).setY(height) // 顶部
      );
    }
    
    // 创建BufferGeometry
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // 添加所有顶点
    const allVertices = [...outerVertices, ...innerVertices];
    allVertices.forEach(vertex => {
      vertices.push(vertex.x, vertex.y, vertex.z);
    });
    
    const numPoints = points.length;
    
    // 生成外墙面
    for (let i = 0; i < numPoints; i++) {
      const next = (i + 1) % numPoints;
      const baseIdx = i * 2;
      const nextBaseIdx = next * 2;
      
      // 外墙四边形（两个三角形）
      indices.push(
        baseIdx, baseIdx + 1, nextBaseIdx,
        nextBaseIdx, baseIdx + 1, nextBaseIdx + 1
      );
    }
    
    // 生成内墙面
    const innerOffset = numPoints * 2;
    for (let i = 0; i < numPoints; i++) {
      const next = (i + 1) % numPoints;
      const baseIdx = innerOffset + i * 2;
      const nextBaseIdx = innerOffset + next * 2;
      
      // 内墙四边形（逆序，内法向量）
      indices.push(
        baseIdx, nextBaseIdx, baseIdx + 1,
        nextBaseIdx, nextBaseIdx + 1, baseIdx + 1
      );
    }
    
    // 生成顶面和底面（环带三角形，将外轮廓与内轮廓连接成带状）
    for (let i = 0; i < numPoints; i++) {
      const next = (i + 1) % numPoints;
      const outerBase = i * 2;
      const outerNextBase = next * 2;
      const innerBase = innerOffset + i * 2;
      const innerNextBase = innerOffset + next * 2;

      // 顶面带（两个三角形）：外顶-外下一顶-内顶，外下一顶-内下一顶-内顶
      indices.push(
        outerBase + 1, outerNextBase + 1, innerBase + 1,
        outerNextBase + 1, innerNextBase + 1, innerBase + 1
      );

      // 底面带（两个三角形）：外底-内底-外下一底，外下一底-内底-内下一底
      indices.push(
        outerBase, innerBase, outerNextBase,
        outerNextBase, innerBase, innerNextBase
      );
    }
    
    // 设置几何体属性
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals(); // 自动计算法向量
    
    // 创建墙体材质
    const material = new THREE.MeshLambertMaterial({
      color: props.color,
      transparent: true,
      opacity: props.opacity,
      side: THREE.DoubleSide // 匹配地面显示逻辑，避免单面剔除导致的方向问题
    });
    
    // 创建墙体网格
    const mesh = new THREE.Mesh(geometry, material);
    
    // 设置阴影
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // 设置用户数据
    mesh.userData = { wallId: wall.id, segmentIndex: 0 };
    
    // 添加调试日志
    console.log(`创建统一墙体 ${wall.id}:`, {
      点数: numPoints,
      厚度: halfThickness * 2,
      顶点数: vertices.length / 3,
      面片数: indices.length / 3,
      墙体点坐标: wall.points
    });
    
    // 添加到场景
    scene.add(mesh);
    meshMap.set(`${wall.id}-unified`, mesh);
  };

  // 创建开放墙体（使用传统分段方法）
  const createOpenWall = (
    wall: Wall, 
    props: typeof selectedWall3DProps, 
    scene: THREE.Scene, 
    meshMap: Map<string, THREE.Mesh>
  ) => {
    const points = wall.points;
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      // 计算墙体段参数
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const length2D = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (length2D < 5) continue; // 跳过过短的段
      
      const length3D = length2D / 100 * 5;
      
      // 计算中心点和角度 - 使用与地面相同的坐标变换逻辑
      const centerX = (start.x + end.x) / 2 / 100 * 5;
      const centerY = props.height / 2; // 墙体底部与地面对齐（地面在Y=0）
      const centerZ = (start.y + end.y) / 2 / 100 * 5;
      
      // 角度计算：在3D坐标系中，X轴对应原2D的X轴，Z轴对应原2D的Y轴
      const angle = Math.atan2(deltaX, deltaY);
      
      // 创建墙体几何体
      const geometry = new THREE.BoxGeometry(
        props.thickness,
        props.height,
        length3D
      );
      
      // 创建材质
      const material = new THREE.MeshLambertMaterial({
        color: props.color,
        transparent: true,
        opacity: props.opacity
      });
      
      // 创建网格
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(centerX, centerY, centerZ);
      mesh.rotation.y = angle;
      
      // 设置阴影
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // 设置用户数据
      mesh.userData = { wallId: wall.id, segmentIndex: i };
      
      // 添加到场景
      scene.add(mesh);
      meshMap.set(`${wall.id}-${i}`, mesh);
    }
  };

  // 更新墙体3D模型
  useEffect(() => {
    if (!sceneRef.current) return;

    // 清除现有墙体
    wallMeshesRef.current.forEach((mesh) => {
      sceneRef.current!.remove(mesh);
    });
    wallMeshesRef.current.clear();

    // 创建新的墙体
    walls.forEach((wall) => {
      if (wall.points.length < 2) return;

      // 改进的墙体闭合检测逻辑
      const firstPoint = wall.points[0];
      const lastPoint = wall.points[wall.points.length - 1];
      
      // 方法1：检查首尾点位置距离（使用更宽松的容差）
      const POSITION_TOLERANCE = 20; // 增加到20像素容差，适应手绘误差
      const distance = Math.sqrt(
        Math.pow(lastPoint.x - firstPoint.x, 2) + 
        Math.pow(lastPoint.y - firstPoint.y, 2)
      );
      const isClosedByPosition = wall.points.length >= 3 && distance < POSITION_TOLERANCE;
      
      // 方法2：检查是否通过共享端点形成闭合（首尾点共享同一个端点ID）
      const isClosedBySharedPoint = wall.pointIds && 
        wall.pointIds.length >= 3 && 
        wall.pointIds[0] !== null && 
        wall.pointIds[wall.pointIds.length - 1] !== null &&
        wall.pointIds[0] === wall.pointIds[wall.pointIds.length - 1];
      
      // 方法3：智能检测 - 如果墙体有足够多的点且形成近似闭合形状
      const hasEnoughPoints = wall.points.length >= 4;
      const isNearlyRectangular = hasEnoughPoints && distance < 40; // 更宽松的形状检测
      
      // 方法4：基于用户绘制意图 - 如果墙体已完成且点数合理
      const isIntentionallyClosed = wall.completed && hasEnoughPoints && distance < 60;
      
      const isClosedWall = isClosedByPosition || isClosedBySharedPoint || isNearlyRectangular || isIntentionallyClosed;

      // 调试信息：检查红色墙体的闭合状态
      if (wall.id.includes('red') || wall.color === '#ff0000' || wall.color === 'red') {
        console.log('🔴 红色墙体闭合检测 (改进版):', {
          wallId: wall.id,
          pointsCount: wall.points.length,
          firstPoint,
          lastPoint,
          distance: distance.toFixed(2) + 'px',
          tolerance: POSITION_TOLERANCE + 'px',
          isClosedByPosition: `${isClosedByPosition} (距离 < ${POSITION_TOLERANCE}px)`,
          pointIds: wall.pointIds,
          firstPointId: wall.pointIds?.[0],
          lastPointId: wall.pointIds?.[wall.pointIds.length - 1],
          isClosedBySharedPoint,
          hasEnoughPoints,
          isNearlyRectangular: `${isNearlyRectangular} (距离 < 40px)`,
          isIntentionallyClosed: `${isIntentionallyClosed} (已完成 && 点数>=4 && 距离 < 60px)`,
          wallCompleted: wall.completed,
          finalResult: `${isClosedWall} ⭐`
        });
      }

      if (isClosedWall) {
        // 对于闭合墙体，使用几何体合并技术创建单一无缝墙体
        createUnifiedClosedWall(wall, selectedWall3DProps, sceneRef.current!, wallMeshesRef.current);
      } else {
        // 对于开放墙体，使用优化的重叠方法
        createOpenWall(wall, selectedWall3DProps, sceneRef.current!, wallMeshesRef.current);
      }
 
    });
  }, [walls, selectedWall3DProps]);

  // 创建CNC机台3D模型
  const createCNCMachine = (
    cnc: CNCMachine,
    scene: THREE.Scene,
    meshMap: Map<string, THREE.Mesh>
  ) => {
    console.log('🎯 [模型] 开始创建CNC机台3D模型:', {
      id: cnc.id,
      name: cnc.name,
      currentModel: cnc.currentModel,
      modelUrl: cnc.modelUrl,
      modelFileName: cnc.modelFileName,
      hasModelFile: !!cnc.modelFile
    });

    // 获取3D参数，如果没有则使用默认值
    const width3D = cnc.width3D || 5;
    const depth3D = cnc.depth3D || 5;
    const height3D = cnc.height3D || 5;
    
    // 使用与地面相同的坐标变换逻辑
    const x3D = cnc.x / 100 * 5; // 世界坐标转米，缩放到3D场景
    const z3D = cnc.y / 100 * 5; // 世界坐标转米，缩放到3D场景
    const y3D = height3D / 2 - 0.01; // Y轴位置（底部与地面对齐，地面在Y=-0.01）
    
    // 创建组合对象
    const cncGroup = new THREE.Group();
    cncGroup.userData = { 
      cncId: cnc.id, 
      type: 'cnc',
      name: cnc.name 
    };
    
    // 检查是否使用自定义GLB模型
    if (cnc.currentModel === 'custom' && cnc.modelUrl) {
      console.log('🎯 [模型] 加载自定义GLB模型到主场景:', {
        modelUrl: cnc.modelUrl,
        modelFileName: cnc.modelFileName,
        position: { x: x3D, y: y3D, z: z3D }
      });
      
      // 严格的文件大小验证（主场景）
      if (cnc.modelFile) {
        const fileSizeMB = cnc.modelFile.size / (1024 * 1024);
        console.log('📊 [模型] 主场景GLB文件大小:', fileSizeMB.toFixed(2) + 'MB');
        
        // 大幅降低文件大小限制到10MB，避免WebAssembly内存溢出
        if (fileSizeMB > 10) {
          console.error('❌ [模型] 主场景GLB文件过大:', fileSizeMB.toFixed(2) + 'MB');
          createDefaultCNCModel(cncGroup, width3D, height3D, depth3D, x3D, y3D, z3D, cnc);
          return;
        }
      }
      
      const loader = new GLTFLoader();
      
      // 🔧 启用保守的DRACO压缩配置（主场景）
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/'); // 使用本地Draco解码器文件
      dracoLoader.setWorkerLimit(1); // 限制工作线程为1以减少内存使用
      loader.setDRACOLoader(dracoLoader);
      
      console.log('🔧 [模型] 主场景使用本地GLB加载器（启用保守的DRACO压缩配置）');
      
      // 添加超时处理（主场景）
      const loadingTimeout = setTimeout(() => {
        console.error('❌ [模型] 主场景GLB加载超时');
        createDefaultCNCModel(cncGroup, width3D, height3D, depth3D, x3D, y3D, z3D, cnc);
      }, 30000); // 30秒超时
      
      loader.load(
        cnc.modelUrl,
        (gltf) => {
          clearTimeout(loadingTimeout);
          
          const model = gltf.scene;
          
          // 设置模型位置
          model.position.set(x3D, y3D, z3D);
          
          // 设置模型缩放（使用CNC机台的缩放参数，如果没有则使用默认值1）
          const scale = cnc.scale || 1;
          model.scale.setScalar(scale);
          
          // 设置模型旋转（使用CNC机台的旋转参数，如果没有则使用默认值0）
          model.rotation.set(
            ((cnc.rotation?.x || 0) * Math.PI) / 180,
            ((cnc.rotation?.y || 0) * Math.PI) / 180,
            ((cnc.rotation?.z || 0) * Math.PI) / 180
          );

          // 遍历模型中的所有网格，设置基本属性
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // 设置材质属性
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => {
                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshLambertMaterial) {
                      // 保留原始颜色，只设置透明度
                      const opacity = cnc.opacity !== undefined ? cnc.opacity : 1;
                      mat.transparent = opacity < 1;
                      mat.opacity = opacity;
                    }
                  });
                } else if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshLambertMaterial) {
                  // 保留原始颜色，只设置透明度
                  const opacity = cnc.opacity !== undefined ? cnc.opacity : 1;
                  child.material.transparent = opacity < 1;
                  child.material.opacity = opacity;
                }
              }
            }
          });

          // 将GLB模型添加到CNC组
          cncGroup.add(model);
          
          console.log('✅ [模型] GLB模型已成功加载并添加到主场景:', {
            cncId: cnc.id,
            modelFileName: cnc.modelFileName,
            modelPosition: model.position,
            modelScale: model.scale,
            modelRotation: model.rotation,
            groupChildren: cncGroup.children.length
          });
          
          // 清理DRACOLoader资源（保守的内存管理）
          dracoLoader.dispose();
        },
        (progress) => {
          const percentage = (progress.loaded / progress.total * 100).toFixed(1);
          console.log('📈 [模型] 主场景GLB模型加载进度:', {
            cncId: cnc.id,
            progress: percentage + '%'
          });
        },
        (error: unknown) => {
          clearTimeout(loadingTimeout);
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          console.error('❌ [模型] 主场景GLB模型加载失败，使用默认立方体:', {
            cncId: cnc.id,
            error: error,
            errorMessage: errorMessage,
            modelUrl: cnc.modelUrl,
            modelFileName: cnc.modelFileName
          });
          
          // 清理DRACOLoader资源（保守的内存管理）
          dracoLoader.dispose();
          
          // 加载失败时创建默认立方体
          createDefaultCNCModel(cncGroup, width3D, height3D, depth3D, x3D, y3D, z3D, cnc);
        }
      );
    } else {
      console.log('🎯 [模型] 使用默认立方体模型:', {
        cncId: cnc.id,
        currentModel: cnc.currentModel,
        dimensions: { width3D, height3D, depth3D }
      });
      
      // 使用默认立方体模型
      createDefaultCNCModel(cncGroup, width3D, height3D, depth3D, x3D, y3D, z3D, cnc);
    }
    
    // 添加到场景和映射
    scene.add(cncGroup);
    meshMap.set(cnc.id, cncGroup as any);
  };

  // 创建默认CNC立方体模型的辅助函数
  const createDefaultCNCModel = (
    cncGroup: THREE.Group,
    width3D: number,
    height3D: number,
    depth3D: number,
    x3D: number,
    y3D: number,
    z3D: number,
    cnc: CNCMachine
  ) => {
    // 创建主体几何体
    const mainGeometry = new THREE.BoxGeometry(width3D, height3D, depth3D);
    
    // 创建主体材质
    const mainMaterial = new THREE.MeshLambertMaterial({
      color: cnc.color || '#4CAF50',
      transparent: false
    });
    
    // 创建主体网格
    const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
    mainMesh.position.set(x3D, y3D, z3D);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    
    // 创建边框线条以增强立体感
    const edges = new THREE.EdgesGeometry(mainGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: cnc.selected ? '#ff4444' : '#333333',
      linewidth: cnc.selected ? 3 : 1
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.position.copy(mainMesh.position);
    
    // 添加到CNC组
    cncGroup.add(mainMesh);
    cncGroup.add(wireframe);
    
    // 如果选中，添加选中指示器
    if (cnc.selected) {
      // 创建选中指示器（发光效果）
      const indicatorGeometry = new THREE.BoxGeometry(width3D + 0.2, height3D + 0.2, depth3D + 0.2);
      const indicatorMaterial = new THREE.MeshBasicMaterial({
        color: '#ffff00',
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.copy(mainMesh.position);
      cncGroup.add(indicator);
    }
    
    console.log('✅ [模型] 默认立方体模型创建完成:', {
      cncId: cnc.id,
      position: { x: x3D, y: y3D, z: z3D },
      dimensions: { width3D, height3D, depth3D },
      groupChildren: cncGroup.children.length
    });
  };

  // 创建地面3D模型
  const createFloorArea = (
    floor: FloorArea,
    scene: THREE.Scene,
    meshMap: Map<string, THREE.Mesh>,
    meshArray: THREE.Mesh[]
  ) => {
    console.log(`🏗️ 开始创建地面区域 ${floor.id}:`, {
      points: floor.points?.length || 0,
      color: floor.color,
      opacity: floor.opacity,
      thickness: floor.thickness
    });
    
    const points = floor.points;
    if (points.length < 3) {
      console.log(`❌ 地面区域 ${floor.id} 点数不足 (${points.length} < 3)`);
      return;
    }

    // 创建地面几何体
    const shape = new THREE.Shape();
    
    // 转换第一个点为3D坐标系（Y轴向上） - 使用Z轴镜像，与原来的地面逻辑保持一致
    const firstPoint = new THREE.Vector2(points[0].x / 100 * 5, -(points[0].y / 100 * 5));
    shape.moveTo(firstPoint.x, firstPoint.y);
    
    // 添加其他点
    for (let i = 1; i < points.length; i++) {
      const point = new THREE.Vector2(points[i].x / 100 * 5, -(points[i].y / 100 * 5));
      shape.lineTo(point.x, point.y);
    }
    
    // 闭合路径
    shape.closePath();
    
    // 创建拉伸几何体（地面有厚度）
    const extrudeSettings = {
      depth: floor.thickness,
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // 旋转几何体，使其平躺在XZ平面上
    geometry.rotateX(-Math.PI / 2);
    
    // 创建地面材质
    const material = new THREE.MeshLambertMaterial({
      color: floor.color,
      transparent: true,
      opacity: floor.opacity
    });
    
    // 创建地面网格
    const mesh = new THREE.Mesh(geometry, material);
    
    // 设置位置（地面稍微下移，避免与墙体底部Z-fighting）
    mesh.position.y = -0.01;
    
    // 设置阴影
    mesh.castShadow = false; // 地面通常不投射阴影
    mesh.receiveShadow = true; // 地面接收阴影
    
    // 设置用户数据
    mesh.userData = { 
      floorId: floor.id, 
      type: 'floor',
      name: floor.name 
    };
    
    // 添加到场景
    scene.add(mesh);
    meshMap.set(floor.id, mesh);
    meshArray.push(mesh);
    
    console.log(`✅ 成功创建地面区域 ${floor.id}，已添加到场景中`);
    console.log(`📊 当前场景中地面网格数量: ${meshArray.length}`);
  };

  // 更新CNC机台3D模型
  useEffect(() => {
    if (!sceneRef.current) return;

    // 清除现有CNC机台
    cncMeshesRef.current.forEach((mesh) => {
      sceneRef.current!.remove(mesh);
    });
    cncMeshesRef.current.clear();

    // 创建新的CNC机台
    cncMachines.forEach((cnc) => {
      createCNCMachine(cnc, sceneRef.current!, cncMeshesRef.current);
    });
  }, [cncMachines]);

  // 地面渲染
  useEffect(() => {
    console.log('🏠 地面渲染useEffect触发，floorAreas数量:', floorAreas.length);
    console.log('🏠 floorAreas详情:', floorAreas);
    
    if (!sceneRef.current || !floorMeshesRef.current) {
      console.log('❌ 场景或地面网格引用不存在');
      return;
    }

    // 清除旧的地面网格
    floorMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    floorMeshesRef.current.length = 0;

    // 创建新的地面网格
    const floorMeshMap = new Map<string, THREE.Mesh>();
    floorAreas.forEach(floorArea => {
      console.log(`🔍 检查地面区域 ${floorArea.id}:`, {
        visible: floorArea.visible,
        completed: floorArea.completed,
        points: floorArea.points?.length || 0
      });
      
      if (floorArea.visible && floorArea.completed) {
        console.log(`✅ 创建地面区域 ${floorArea.id}`);
        createFloorArea(floorArea, sceneRef.current!, floorMeshMap, floorMeshesRef.current);
      } else {
        console.log(`❌ 跳过地面区域 ${floorArea.id} - visible: ${floorArea.visible}, completed: ${floorArea.completed}`);
      }
    });
    
    console.log('🏠 地面渲染完成，创建的网格数量:', floorMeshesRef.current.length);
  }, [floorAreas]);

  // 地面属性实时预览效果
  useEffect(() => {
    if (!selectedFloor3DProps) return;
    
    console.log('🎨 更新地面属性预览:', selectedFloor3DProps);
    
    // 更新所有地面的材质属性
    floorMeshesRef.current.forEach(mesh => {
      const floorId = mesh.userData.floorId;
      
      if (mesh.material instanceof THREE.MeshLambertMaterial) {
        // 更新材质颜色和透明度
        mesh.material.color.setHex(parseInt(selectedFloor3DProps.color.replace('#', ''), 16));
        mesh.material.opacity = selectedFloor3DProps.opacity;
        mesh.material.needsUpdate = true;
        
        // 更新地面厚度（需要重新创建几何体）
        const floorArea = floorAreas.find(floor => floor.id === floorId);
        if (floorArea && floorArea.thickness !== selectedFloor3DProps.thickness) {
          // 获取原始形状
          const points = floorArea.points;
          if (points.length >= 3) {
            // 创建新的形状 - 使用Z轴镜像，与原来的地面逻辑保持一致
            const shape = new THREE.Shape();
            const firstPoint = new THREE.Vector2(points[0].x / 100 * 5, -(points[0].y / 100 * 5));
            shape.moveTo(firstPoint.x, firstPoint.y);
            
            for (let i = 1; i < points.length; i++) {
              const point = new THREE.Vector2(points[i].x / 100 * 5, -(points[i].y / 100 * 5));
              shape.lineTo(point.x, point.y);
            }
            shape.closePath();
            
            // 创建新的拉伸几何体
            const extrudeSettings = {
              depth: selectedFloor3DProps.thickness,
              bevelEnabled: false
            };
            
            const newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            newGeometry.rotateX(-Math.PI / 2);
            
            // 释放旧几何体
            if (mesh.geometry) {
              mesh.geometry.dispose();
            }
            
            // 应用新几何体
            mesh.geometry = newGeometry;
          }
        }
      }
    });
  }, [selectedFloor3DProps, floorAreas]);

  // 处理3D场景模型加载
  useEffect(() => {
    if (!sceneRef.current || !sceneModel || !sceneModel.previewUrl) {
      // 如果没有场景模型，清除之前的模型
      if (sceneModelRef.current && sceneRef.current) {
        sceneRef.current.remove(sceneModelRef.current);
        sceneModelRef.current = null;
      }
      return;
    }

    console.log('🎯 [3D-EDITOR] 开始加载场景模型:', {
      modelUrl: sceneModel.previewUrl,
      modelFileName: sceneModel.name
    });

    // 清除之前的场景模型
    if (sceneModelRef.current) {
      sceneRef.current.remove(sceneModelRef.current);
      sceneModelRef.current = null;
    }

    // 使用GLTFLoader加载场景模型
    const loader = new GLTFLoader();
    
    // 启用DRACO压缩支持
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setWorkerLimit(1);
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      sceneModel.previewUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // 设置模型属性 - 使用默认值，因为sceneModel只是文件信息
        model.position.set(0, 0, 0);
        model.scale.setScalar(1); // 默认缩放
        model.rotation.set(0, 0, 0); // 默认旋转

        // 遍历模型设置材质属性
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshLambertMaterial) {
                    mat.transparent = false; // 默认不透明
                    mat.opacity = 1; // 默认完全不透明
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshLambertMaterial) {
                child.material.transparent = false; // 默认不透明
                child.material.opacity = 1; // 默认完全不透明
              }
            }
          }
        });

        // 添加到场景
        sceneRef.current!.add(model);
        sceneModelRef.current = model;
        
        console.log('✅ [3D-EDITOR] 场景模型加载成功');
        
        // 提取顶视图数据并通知父组件
        if (onModelLoaded) {
          const topViewData: Array<{x: number, y: number}> = [];
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              const geometry = child.geometry;
              const positionAttribute = geometry.getAttribute('position');
              if (positionAttribute) {
                const positions = positionAttribute.array;
                for (let i = 0; i < positions.length; i += 3) {
                  const x = positions[i];
                  const z = positions[i + 2];
                  topViewData.push({ x, y: z });
                }
              }
            }
          });

          const simplifiedPoints = simplifyTopViewPoints(topViewData);
          onModelLoaded(simplifiedPoints);
        }
        
        // 清理资源
        dracoLoader.dispose();
      },
      (progress) => {
        const percentage = (progress.loaded / progress.total * 100).toFixed(1);
        console.log('📈 [3D-EDITOR] 场景模型加载进度:', percentage + '%');
      },
      (error) => {
        console.error('❌ [3D-EDITOR] 场景模型加载失败:', error);
        dracoLoader.dispose();
      }
    );
  }, [sceneModel, onModelLoaded]);

  return (
    <div
      ref={mountRef}
      style={{
        ...style,
        backgroundColor: '#f5f5f5'
      }}
    />
  );
});

// 模拟产品模型数据
const mockProductModels: ProductModel[] = [
  {
    id: 'wall-001',
    name: '标准墙体',
    type: 'wall',
    icon: <BuildOutlined />,
    description: '标准建筑墙体模型'
  },
  {
    id: 'door-001',
    name: '标准门',
    type: 'door',
    icon: <DashboardOutlined />,
    description: '标准建筑门模型'
  },
  {
    id: 'column-001',
    name: '标准柱子',
    type: 'column',
    icon: <ColumnHeightOutlined />,
    description: '标准建筑柱子模型'
  },
  {
    id: 'floor-001',
    name: '标准地面',
    type: 'floor',
    icon: <BorderInnerOutlined />,
    description: '标准地面模型'
  },
  {
    id: 'cnc-001',
    name: 'CNC机台',
    type: 'cnc',
    icon: <ToolOutlined />,
    description: 'CNC数控机床设备模型'
  },
];

// 模拟底图数据
const mockBaseMapData: BaseMapData[] = [
  {
    id: 'basemap-1',
    name: '标准建筑底图',
    url: '/src/assets/base-map.svg',
    description: '标准建筑平面图底图'
  },
  {
    id: 'basemap-2', 
    name: '简化建筑底图',
    url: '/src/assets/base-map-simple.svg',
    description: '简化版建筑平面图底图'
  },
  {
    id: 'basemap-3',
    name: '详细建筑底图', 
    url: '/src/assets/base-map-detailed.svg',
    description: '详细版建筑平面图底图'
  }
];

// 模拟地图数据
const mockMapData: MapData[] = [
  { 
    id: 'map-1', 
    name: '建筑主体地图', 
    type: 'building', 
    description: '主要建筑结构地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-2', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'room-1', x: 210, y: 200, type: 'room', name: '办公区A' },
        { id: 'room-2', x: 420, y: 260, type: 'room', name: '中央大厅' },
        { id: 'room-3', x: 610, y: 200, type: 'room', name: '办公区B' },
        { id: 'room-4', x: 210, y: 390, type: 'room', name: '会议室' },
        { id: 'room-5', x: 610, y: 390, type: 'room', name: '设备间' },
        { id: 'elevator-1', x: 410, y: 155, type: 'elevator', name: '电梯' },
        { id: 'stairs-1', x: 370, y: 170, type: 'stairs', name: '楼梯' },
        { id: 'entrance-1', x: 420, y: 100, type: 'entrance', name: '主入口' },
      ],
      edges: [
        { id: 'edge-1', from: 'entrance-1', to: 'room-2', type: 'normal' },
        { id: 'edge-2', from: 'room-2', to: 'room-1', type: 'normal' },
        { id: 'edge-3', from: 'room-2', to: 'room-3', type: 'normal' },
        { id: 'edge-4', from: 'room-2', to: 'room-4', type: 'normal' },
        { id: 'edge-5', from: 'room-2', to: 'room-5', type: 'normal' },
        { id: 'edge-6', from: 'room-2', to: 'elevator-1', type: 'normal' },
        { id: 'edge-7', from: 'room-2', to: 'stairs-1', type: 'emergency' },
      ]
    }
  },
  { 
    id: 'map-2', 
    name: '设备分布地图', 
    type: 'equipment', 
    description: '设备位置分布地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'device-1', x: 150, y: 150, type: 'room', name: '空调设备' },
        { id: 'device-2', x: 650, y: 150, type: 'room', name: '网络设备' },
        { id: 'device-3', x: 610, y: 390, type: 'room', name: '电力设备' },
        { id: 'corridor-1', x: 420, y: 260, type: 'corridor', name: '设备通道' },
      ],
      edges: [
        { id: 'device-edge-1', from: 'corridor-1', to: 'device-1', type: 'normal' },
        { id: 'device-edge-2', from: 'corridor-1', to: 'device-2', type: 'normal' },
        { id: 'device-edge-3', from: 'corridor-1', to: 'device-3', type: 'restricted' },
      ]
    }
  },
  { 
    id: 'map-3', 
    name: '管线布局地图', 
    type: 'pipeline', 
    description: '管线系统布局地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-2', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'pipe-1', x: 200, y: 120, type: 'room', name: '供水管线' },
        { id: 'pipe-2', x: 600, y: 120, type: 'room', name: '排水管线' },
        { id: 'pipe-3', x: 400, y: 480, type: 'room', name: '燃气管线' },
        { id: 'junction-1', x: 400, y: 300, type: 'corridor', name: '管线汇聚点' },
      ],
      edges: [
        { id: 'pipe-edge-1', from: 'junction-1', to: 'pipe-1', type: 'normal' },
        { id: 'pipe-edge-2', from: 'junction-1', to: 'pipe-2', type: 'normal' },
        { id: 'pipe-edge-3', from: 'junction-1', to: 'pipe-3', type: 'normal' },
      ]
    }
  },
  { 
    id: 'map-4', 
    name: '安全区域地图', 
    type: 'safety', 
    description: '安全区域划分地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-2'],
    topology: {
      nodes: [
        { id: 'safe-1', x: 210, y: 200, type: 'room', name: '安全区域A' },
        { id: 'safe-2', x: 610, y: 200, type: 'room', name: '安全区域B' },
        { id: 'exit-1', x: 420, y: 100, type: 'exit', name: '紧急出口1' },
        { id: 'exit-2', x: 100, y: 300, type: 'exit', name: '紧急出口2' },
        { id: 'stairs-1', x: 370, y: 170, type: 'stairs', name: '疏散楼梯' },
      ],
      edges: [
        { id: 'safe-edge-1', from: 'safe-1', to: 'exit-1', type: 'emergency' },
        { id: 'safe-edge-2', from: 'safe-1', to: 'exit-2', type: 'emergency' },
        { id: 'safe-edge-3', from: 'safe-2', to: 'exit-1', type: 'emergency' },
        { id: 'safe-edge-4', from: 'safe-1', to: 'stairs-1', type: 'emergency' },
        { id: 'safe-edge-5', from: 'safe-2', to: 'stairs-1', type: 'emergency' },
      ]
    }
  },
  { 
    id: 'map-5', 
    name: '消防设施地图', 
    type: 'fire', 
    description: '消防设施分布地图',
    baseMapUrl: '/src/assets/base-map.svg',
    availableBaseMaps: ['basemap-1', 'basemap-3'],
    topology: {
      nodes: [
        { id: 'fire-1', x: 180, y: 180, type: 'room', name: '灭火器A' },
        { id: 'fire-2', x: 620, y: 180, type: 'room', name: '灭火器B' },
        { id: 'fire-3', x: 400, y: 140, type: 'room', name: '消防栓' },
        { id: 'fire-4', x: 210, y: 420, type: 'room', name: '烟感器' },
        { id: 'control-1', x: 610, y: 390, type: 'room', name: '消防控制室' },
      ],
      edges: [
        { id: 'fire-edge-1', from: 'control-1', to: 'fire-1', type: 'normal' },
        { id: 'fire-edge-2', from: 'control-1', to: 'fire-2', type: 'normal' },
        { id: 'fire-edge-3', from: 'control-1', to: 'fire-3', type: 'normal' },
        { id: 'fire-edge-4', from: 'control-1', to: 'fire-4', type: 'normal' },
      ]
    }
  },
];

// 模拟楼层场景数据
const mockFloorScenes: FloorScene[] = [
  { id: 'floor-1', name: '1楼', floor: 1, dataSource: 'map-1', baseMap: 'basemap-1', initializeDevices: true },
  { id: 'floor-2', name: '2楼', floor: 2, dataSource: 'map-2', baseMap: 'basemap-3', initializeDevices: false },
  { id: 'floor-3', name: '3楼', floor: 3, dataSource: 'map-1', baseMap: 'basemap-2', initializeDevices: true },
];

const DigitalTwinEditor: React.FC = () => {
  // 面板显示状态
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [allPanelsVisible, setAllPanelsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 视图模式状态
  const [viewMode, setViewMode] = useState<'top' | 'perspective'>('top');
  
  // 强制重绘状态 - 用于解决视图切换时的画布变形问题
  const [forceRedraw, setForceRedraw] = useState(0);

  // 属性面板显示状态
  const [showWallPropertiesPanel, setShowWallPropertiesPanel] = useState(false);
  const [showFloorPropertiesPanel, setShowFloorPropertiesPanel] = useState(false);
  const [showDevicePropertiesPanel, setShowDevicePropertiesPanel] = useState(false);

  // 光源设置状态
  const [lightingSettings, setLightingSettings] = useState({
    ambientLight: {
      intensity: 0.8,
      color: '#404040'
    },
    directionalLight: {
      intensity: 1.2,
      color: '#ffffff',
      position: { x: 15, y: 15, z: 8 }
    },
    fillLight: {
      intensity: 0.6,
      color: '#e8f4f8',
      position: { x: -10, y: 5, z: -5 }
    },
    pointLight1: {
      intensity: 0.8,
      color: '#ffffff',
      position: { x: 0, y: 10, z: 0 },
      distance: 50
    },
    pointLight2: {
      intensity: 0.6,
      color: '#ffffff',
      position: { x: -20, y: 8, z: -20 },
      distance: 40
    },
    pointLight3: {
      intensity: 0.7,
      color: '#ffffff',
      position: { x: 20, y: 8, z: 20 },
      distance: 40
    }
  });

  // 选中墙体的3D属性状态
  const [selectedWall3DProps, setSelectedWall3DProps] = useState({
    width: 3, // X轴长度，单位：米
    thickness: 0.2, // Y轴厚度，单位：米
    height: 2.8, // Z轴高度，单位：米
    color: '#cccccc', // 墙体颜色
    opacity: 1.0 // 透明度
  });

  // 选中地面的3D属性状态
  const [selectedFloor3DProps, setSelectedFloor3DProps] = useState({
    thickness: 0.1, // 地面厚度，单位：米
    color: '#f0f0f0', // 地面颜色
    opacity: 1.0 // 透明度
  });

  // 选中墙体状态
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  // 3D模型顶视图数据状态
  const [modelTopViewData, setModelTopViewData] = useState<{x: number, y: number}[] | null>(null);

  // 监听modelTopViewData状态变化
  useEffect(() => {
    console.log('🔄 [STATE] modelTopViewData状态变化:', {
      hasData: !!modelTopViewData,
      dataLength: modelTopViewData?.length || 0,
      data: modelTopViewData
    });
  }, [modelTopViewData]);

  // 计算初始屏幕中心坐标的函数
  const getInitialCenterOffset = () => {
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 画布现在覆盖整个视口，不需要考虑面板的影响
    // 返回视口中心坐标
    return {
      centerX: viewportWidth / 2,
      centerY: viewportHeight / 2
    };
  };

  // 画布相关状态
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeDEditorRef = useRef<ThreeDEditorRef>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(() => getInitialCenterOffset().centerX);
  const [offsetY, setOffsetY] = useState(() => getInitialCenterOffset().centerY);// 画布拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false); // 空格键状态
  
  // 框选开始坐标的ref，用于全局事件监听器访问
  const selectionStartRef = useRef<WallPoint | null>(null);


  // 地面绘制相关状态
  const [floorAreas, setFloorAreas] = useState<FloorArea[]>([]);
  const [isDrawingFloor, setIsDrawingFloor] = useState(false);
  const [currentFloorPoints, setCurrentFloorPoints] = useState<WallPoint[]>([]);
  const [currentFloorType] = useState<string>('standard'); // 预留用于地面类型设置
  const [floorStyle] = useState({
    color: '#e6f7ff',
    opacity: 0.6,
    material: 'standard',
    texture: 'none'
  }); // 地面样式配置，预留用于未来的地面样式设置功能
  const [showFloorVertices, setShowFloorVertices] = useState(false); // 控制地面顶点显示
  const [floorPreviewMousePos, setFloorPreviewMousePos] = useState<WallPoint | null>(null); // 地面绘制预览鼠标位置

  // 获取当前激活的绘图工具
  const getActiveTool = () => {
    return drawingTools.find(tool => tool.active);
  };

  // 屏幕坐标转换为画布坐标
  const screenToCanvas = (screenX: number, screenY: number): WallPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // 转换为世界坐标
    const worldX = (canvasX - offsetX) / scale;
    const worldY = (canvasY - offsetY) / scale;

    return { x: worldX, y: worldY };
  };

  // 节流时间ref
  const lastUpdateTimeRef = useRef<number>(0);

  // 优化的鼠标位置更新函数（参考地图编辑器）
  const updateMousePositionOptimized = useCallback((x: number, y: number) => {
    // 立即更新ref，用于虚线渲染
    mousePositionRef.current = { x, y };
    
    // 使用节流更新状态，避免过度渲染
    const now = Date.now();
    if (now - lastUpdateTimeRef.current > 16) {
      setMousePosition({ x, y });
      lastUpdateTimeRef.current = now;
    }
  }, []);

  // 楼层场景状态
  const [floorScenes, setFloorScenes] = useState<FloorScene[]>(mockFloorScenes);
  const [currentFloor, setCurrentFloor] = useState<string>('floor-1');
  const [sceneListModalVisible, setSceneListModalVisible] = useState(false); // 场景列表对话框
  const [newSceneModalVisible, setNewSceneModalVisible] = useState(false); // 新增场景对话框
  const [editingScene, setEditingScene] = useState<FloorScene | null>(null);
  const [sceneForm] = Form.useForm();
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null); // 选中的地图ID
  const [availableBaseMaps, setAvailableBaseMaps] = useState<BaseMapData[]>([]); // 可用底图列表
  const [initializeDevicesValue, setInitializeDevicesValue] = useState<boolean>(true); // 是否初始化地图关联设备的值
  const [uploadedSceneModel, setUploadedSceneModel] = useState<File | null>(null); // 上传的3D场景模型文件

  // 监听uploadedSceneModel状态变化
  useEffect(() => {
    console.log('📁 [FILE] uploadedSceneModel状态变化:', {
      hasFile: !!uploadedSceneModel,
      fileName: uploadedSceneModel?.name || 'null',
      fileSize: uploadedSceneModel?.size || 0,
      fileType: uploadedSceneModel?.type || 'null'
    });
  }, [uploadedSceneModel]);

  // 绘图工具状态
  const [drawingTools, setDrawingTools] = useState<DrawingTool[]>([
    {
      id: 'select-wall',
      name: '选择墙体',
      icon: <SelectOutlined />,
      type: 'select',
      description: '选择和编辑墙体',
      active: true  // 默认激活选择工具
    },
    {
      id: 'wall-line',
      name: '直线墙体',
      icon: <LineOutlined />,
      type: 'wall',
      subType: 'line',
      description: '点击两点绘制直线墙体',
      active: false
    },
    {
      id: 'wall-bezier',
      name: '曲线墙体',
      icon: <BgColorsOutlined />,
      type: 'wall',
      subType: 'bezier',
      description: '绘制贝塞尔曲线墙体',
      active: false
    },
    {
      id: 'door',
      name: '绘制门',
      icon: <DashboardOutlined />,
      type: 'door',
      description: '绘制建筑门',
      active: false
    },
    {
      id: 'column',
      name: '绘制柱子',
      icon: <ColumnHeightOutlined />,
      type: 'column',
      description: '绘制建筑柱子',
      active: false
    },
    {
      id: 'floor',
      name: '绘制地面',
      icon: <BorderInnerOutlined />,
      type: 'floor',
      description: '绘制地面区域',
      active: false
    }
  ]);

  // 墙体相关状态 - 初始化为空数组
  const [walls, setWalls] = useState<Wall[]>([]);
  const [currentWall, setCurrentWall] = useState<Wall | null>(null);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallStyle, setWallStyle] = useState({
    thickness: 10,
    color: '#333333',
    width: 10,
    height: 300
  });
  const [mousePosition, setMousePosition] = useState<WallPoint | null>(null);
  const mousePositionRef = useRef<WallPoint | null>(null); // 实时鼠标位置引用，避免状态更新延迟

  // 共享端点状态管理
  const [sharedPoints, setSharedPoints] = useState<Map<string, SharedPoint>>(new Map());
  const sharedPointsRef = useRef<Map<string, SharedPoint>>(new Map()); // 用于实时访问





  // 监听面板状态变化，重新计算偏移量以保持原点在屏幕中心
  useEffect(() => {
    const recalculateOffset = () => {
      const canvas = canvasRef.current;
      if (canvas && viewMode === 'top') {
        // 延迟执行，确保DOM布局更新完成
        setTimeout(() => {
          const rect = canvas.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // 重新设置偏移量，使世界坐标原点(0,0)显示在屏幕中心
            setOffsetX(centerX);
            setOffsetY(centerY);
            
            console.log('🔄 面板状态变化，重新计算偏移量:', { 
              centerX, 
              centerY, 
              canvasWidth: rect.width, 
              canvasHeight: rect.height,
              leftPanelVisible,
              rightPanelVisible,
              isFullscreen
            });
          }
        }, 50); // 50ms延迟确保CSS动画和布局更新完成
      }
    };

    recalculateOffset();
  }, [leftPanelVisible, rightPanelVisible, viewMode, isFullscreen]); // 监听面板状态、视图模式和全屏状态变化

  // 连线状态管理（参考地图编辑器）
  const [isConnecting, setIsConnecting] = useState(false); // 是否正在连线
  const [continuousConnecting, setContinuousConnecting] = useState(false); // 连续连线模式
  const [connectingStartPoint, setConnectingStartPoint] = useState<WallPoint | null>(null); // 连线起始点
  const [lastConnectedPoint, setLastConnectedPoint] = useState<WallPoint | null>(null); // 最后连接的点
  
  // 连线状态的ref引用，用于解决状态更新时序问题
  const isConnectingRef = useRef(false);
  const continuousConnectingRef = useRef(false);

  // 贝塞尔曲线绘制状态（地图编辑器风格 - 两点绘制模式）
  const [bezierDrawingState, setBezierDrawingState] = useState<{
    phase: 'idle' | 'drawing'; // 简化为两个阶段：空闲和绘制中
    startPoint: WallPoint | null;
    endPoint: WallPoint | null;
    controlPoint1: WallPoint | null;
    controlPoint2: WallPoint | null;
    isDraggingControl: boolean;
    activeControlPoint: 1 | 2 | null; // 当前正在拖拽的控制点
    continuousMode: boolean; // 连续绘制模式
    lastEndPoint: WallPoint | null; // 上一条曲线的终点，用于连续绘制
  }>({
    phase: 'idle',
    startPoint: null,
    endPoint: null,
    controlPoint1: null,
    controlPoint2: null,
    isDraggingControl: false,
    activeControlPoint: null,
    continuousMode: false,
    lastEndPoint: null
  });

  // 选择相关状态
  const [selectedWalls, setSelectedWalls] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<WallPoint | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<WallPoint | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{wallId: string, pointIndex: number} | null>(null);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedWall, setLastClickedWall] = useState<string | null>(null);
  // 线段选择状态
  const [selectedSegments, setSelectedSegments] = useState<{wallId: string, segmentIndex: number}[]>([]);
  // 地面选择状态
  const [selectedFloorAreas, setSelectedFloorAreas] = useState<string[]>([]);
  // 地面端点选择状态
  const [selectedFloorEndpoint, setSelectedFloorEndpoint] = useState<{floorId: string, pointIndex: number} | null>(null);
  const [isDraggingFloorEndpoint, setIsDraggingFloorEndpoint] = useState(false);

  // 端点相关状态
  const [hoveredEndpoint, setHoveredEndpoint] = useState<{wallId: string, pointIndex: number} | null>(null);
  const [hoveredFloorEndpoint, setHoveredFloorEndpoint] = useState<{floorId: string, pointIndex: number} | null>(null);

  const [nearbyEndpoints, setNearbyEndpoints] = useState<{wallId: string, pointIndex: number, point: WallPoint}[]>([]); // 绘制模式下附近的端点

  // 贝塞尔曲线编辑模式状态
  const [bezierEditMode, setBezierEditMode] = useState<{
    isEditing: boolean;
    wallId: string | null;
    isDraggingControl: boolean;
    activeControlPoint: number | string | null; // 支持数字（贝塞尔曲线控制点）和字符串（直线中点）
  }>({
    isEditing: false,
    wallId: null,
    isDraggingControl: false,
    activeControlPoint: null
  });

  // 属性面板状态
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [propertiesFormData, setPropertiesFormData] = useState<{
    wallId: string;
    thickness: number;
    width: number;
    height: number;
    color: string;
  } | null>(null);
  const [propertiesForm] = Form.useForm();

  // CNC机台属性面板状态
  const [showCNCPropertiesPanel, setShowCNCPropertiesPanel] = useState(false);
  const [cncPropertiesFormData, setCncPropertiesFormData] = useState<{
    cncId: string;
    name: string;
    width: number;
    height: number;
    depth3D: number;
    color: string;
    // 新增3D渲染参数
    opacity: number;
    scale: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    // 模型相关字段
    currentModel: string;
    modelFile?: File | null;
    modelUrl?: string;
    modelFileName?: string;  // 添加缺失的modelFileName字段
    modelFileBase64?: string; // GLB模型文件Base64编码 (用于存储)
  } | null>(null);
  const [cncPropertiesForm] = Form.useForm();

  // 模型导入相关状态
  const [isImportingModel, setIsImportingModel] = useState(false);
  const [modelImportProgress, setModelImportProgress] = useState(0);
  const [availablePresetModels] = useState([
    { id: 'default', name: '默认正方体', url: null }
  ]);

  // 防抖状态更新函数
  const debouncedUpdateCncFormData = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newData: typeof cncPropertiesFormData) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setCncPropertiesFormData(newData);
        }, 300); // 300ms 防抖延迟
      };
    })(),
    []
  );

  // 搜索状态
  const [modelSearchText, setModelSearchText] = useState('');

  // CNC机台相关状态
  const [cncMachines, setCncMachines] = useState<CNCMachine[]>([]);
  
  // 添加调试日志监听cncMachines变化
  useEffect(() => {
    console.log('🔍 [DEBUG] cncMachines数组状态变化:', {
      length: cncMachines.length,
      machines: cncMachines.map(cnc => ({
        id: cnc.id,
        name: cnc.name,
        currentModel: cnc.currentModel,
        modelUrl: cnc.modelUrl,
        modelFileName: cnc.modelFileName,
        hasModelFile: !!cnc.modelFile,
        position: { x: cnc.x, y: cnc.y }
      }))
    });
    
    // 特别检查已上传模型的CNC机台
    const machinesWithCustomModels = cncMachines.filter(cnc => cnc.currentModel === 'custom');
    if (machinesWithCustomModels.length > 0) {
      console.log('🎯 [模型] 发现自定义模型的CNC机台:', machinesWithCustomModels.map(cnc => ({
        id: cnc.id,
        name: cnc.name,
        currentModel: cnc.currentModel,
        modelUrl: cnc.modelUrl,
        modelFileName: cnc.modelFileName,
        hasModelFile: !!cnc.modelFile,
        modelUrlValid: cnc.modelUrl ? cnc.modelUrl.startsWith('blob:') : false
      })));
    }
  }, [cncMachines]);
  
  // 预留用于CNC拖拽状态管理
  const [_draggedCNCModel, setDraggedCNCModel] = useState<ProductModel | null>(null);
  const [selectedCNCMachines, setSelectedCNCMachines] = useState<string[]>([]);
  const selectedCNCMachinesRef = useRef<string[]>([]);
  
  // CNC机台拖拽移动状态
  const [isDraggingCNCMachine, setIsDraggingCNCMachine] = useState(false);
  const [draggedCNCMachineId, setDraggedCNCMachineId] = useState<string | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);

  // CNC机台3D预览相关状态
  const cncPreviewSceneRef = useRef<THREE.Scene | null>(null);
  const cncPreviewRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cncPreviewCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cncPreviewControlsRef = useRef<OrbitControls | null>(null);
  const cncPreviewMeshRef = useRef<THREE.Mesh | null>(null);

  // 画布操作工具状态
  const [canvasOperationMode, setCanvasOperationMode] = useState<'select' | 'drag' | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // 同步 sharedPoints 状态和 ref
  useEffect(() => {
    sharedPointsRef.current = sharedPoints;
  }, [sharedPoints]);

  // 同步 selectedCNCMachines 状态和 ref
  useEffect(() => {
    selectedCNCMachinesRef.current = selectedCNCMachines;
  }, [selectedCNCMachines]);

  // 监听CNC属性面板显示状态，初始化3D预览
  useEffect(() => {
    if (showCNCPropertiesPanel) {
      // 延迟初始化，确保DOM元素已渲染
      const timer = setTimeout(() => {
        initCNCPreviewScene();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCNCPropertiesPanel]);

  // 监听CNC属性表单数据变化，实时更新3D预览
  useEffect(() => {
    console.log('🔍 [USEEFFECT] ========== CNC属性监听useEffect触发 ==========');
    console.log('🔍 [USEEFFECT] showCNCPropertiesPanel:', showCNCPropertiesPanel);
    console.log('🔍 [USEEFFECT] cncPropertiesFormData存在:', !!cncPropertiesFormData);
    console.log('🔍 [USEEFFECT] cncPropertiesFormData详细数据:', cncPropertiesFormData);
    console.log('🔍 [USEEFFECT] 场景状态:', {
      hasScene: !!cncPreviewSceneRef.current,
      hasRenderer: !!cncPreviewRendererRef.current
    });
    
    if (showCNCPropertiesPanel && cncPropertiesFormData) {
      // 延迟更新，确保场景初始化完成
      const timer = setTimeout(() => {
        // 检查场景是否已初始化
        if (cncPreviewSceneRef.current && cncPreviewRendererRef.current) {
          console.log('✅ [USEEFFECT] 场景已初始化，调用updateCNCPreview加载GLB模型');
          updateCNCPreview(cncPropertiesFormData);
        } else {
          console.log('⏳ [USEEFFECT] 场景未初始化，调用updateCNCPreviewMesh创建默认几何体');
          updateCNCPreviewMesh();
        }
      }, 200); // 延迟200ms，确保场景初始化完成
      
      return () => clearTimeout(timer);
    } else {
      console.log('❌ [USEEFFECT] 条件不满足，跳过3D预览更新');
      console.log('❌ [USEEFFECT] 原因分析:', {
        showCNCPropertiesPanel,
        cncPropertiesFormDataExists: !!cncPropertiesFormData
      });
    }
    console.log('🔍 [USEEFFECT] ========== CNC属性监听useEffect结束 ==========');
  }, [showCNCPropertiesPanel, cncPropertiesFormData]);

  // 监听视图模式变化，透视图模式下自动隐藏面板实现全屏显示
  useEffect(() => {
    if (viewMode === 'perspective') {
      // 透视图模式：隐藏左右面板，实现全屏显示
      setLeftPanelVisible(false);
      setRightPanelVisible(false);
      setAllPanelsVisible(false);
    } else if (viewMode === 'top') {
      // 顶视图模式：恢复面板显示
      setLeftPanelVisible(true);
      setRightPanelVisible(true);
      setAllPanelsVisible(true);
      
      // 重新计算偏移量，确保画布内容居中显示
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // 将偏移量设置为画布中心，使世界坐标原点(0,0)显示在屏幕中心
            setOffsetX(centerX);
            setOffsetY(centerY);
            
            console.log('✅ 顶视图切换：重新计算偏移量', { 
              centerX, 
              centerY, 
              canvasWidth: rect.width, 
              canvasHeight: rect.height 
            });
          }
        }
      }, 100); // 延迟100ms确保面板状态更新完成
    }
  }, [viewMode]);

  // 监听浏览器全屏状态变化，确保状态同步
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      console.log('🔍 [全屏监听] 浏览器全屏状态变化:', isCurrentlyFullscreen);
      
      // 如果浏览器全屏状态与组件状态不一致，则同步状态
      if (isCurrentlyFullscreen !== isFullscreen) {
        console.log('🔄 [全屏监听] 状态不一致，同步状态:', {
          browser: isCurrentlyFullscreen,
          component: isFullscreen
        });
        setIsFullscreen(isCurrentlyFullscreen);
      }
    };

    // 添加全屏状态变化监听器
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // 清理函数
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // 面板切换函数
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };

  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  const toggleAllPanels = () => {
    const newVisible = !allPanelsVisible;
    setAllPanelsVisible(newVisible);
    setLeftPanelVisible(newVisible);
    setRightPanelVisible(newVisible);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // 墙体选择处理函数
  const handleWallSelect = (wallId: string) => {
    setSelectedWallId(wallId);
    
    // 查找选中的墙体并更新3D属性面板
    const selectedWall = walls.find(wall => wall.id === wallId);
    if (selectedWall) {
      setSelectedWall3DProps({
        width: selectedWall.width || 3,
        thickness: (selectedWall.thickness || 20) / 100, // 转换为米，默认20像素
        height: (selectedWall.height || 280) / 100, // 转换为米，默认280像素
        color: selectedWall.color || '#cccccc',
        opacity: 1.0
      });
    }
  };

  // 应用3D设置到选中墙体的函数已被移除（未使用）

  // 重置3D设置
  const resetWall3DSettings = () => {
    setSelectedWall3DProps({
      width: 3,
      thickness: 0.2,
      height: 2.8,
      color: '#cccccc',
      opacity: 1.0
    });
    message.info('设置已重置');
  };

  // 重置设备属性设置
  const resetDeviceSettings = () => {
    setLightingSettings({
      ambientLight: {
        intensity: 0.8,
        color: '#404040'
      },
      directionalLight: {
        intensity: 1.2,
        color: '#ffffff',
        position: { x: 15, y: 15, z: 8 }
      },
      fillLight: {
        intensity: 0.6,
        color: '#e8f4f8',
        position: { x: -10, y: 5, z: -5 }
      },
      pointLight1: {
        intensity: 0.8,
        color: '#ffffff',
        position: { x: 0, y: 10, z: 0 },
        distance: 50
      },
      pointLight2: {
        intensity: 0.6,
        color: '#ffffff',
        position: { x: -20, y: 8, z: -20 },
        distance: 40
      },
      pointLight3: {
        intensity: 0.7,
        color: '#ffffff',
        position: { x: 20, y: 8, z: 20 },
        distance: 40
      }
    });
    message.info('设备属性已重置');
  };

  // 重置视图
  const resetView = () => {
    console.log('🔄 重置视图被调用, 当前视图模式:', viewMode);
    
    // 如果是3D透视图模式，调用ThreeDEditor的resetView方法
    if (viewMode === 'perspective' && threeDEditorRef.current) {
      console.log('📐 调用3D编辑器的重置视图方法');
      threeDEditorRef.current.resetView();
      return;
    }
    
    // 2D模式的重置逻辑
    console.log('📋 执行2D视图重置');
    
    // 重置缩放比例
    setScale(1);
    
    // 获取画布尺寸并计算中心位置
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // 将偏移量设置为画布中心，使世界坐标原点(0,0)显示在屏幕中心
        setOffsetX(centerX);
        setOffsetY(centerY);
        
        console.log('✅ 2D视图已重置到中心位置:', { 
          centerX, 
          centerY, 
          canvasWidth: rect.width, 
          canvasHeight: rect.height 
        });
      } else {
        console.warn('⚠️ 画布尺寸无效，使用默认偏移量');
        setOffsetX(0);
        setOffsetY(0);
      }
    } else {
      console.warn('⚠️ 画布引用不存在，使用默认偏移量');
      setOffsetX(0);
      setOffsetY(0);
    }
  };

  // 顶视图 - 切换到顶视图模式
  const handleTopView = () => {
    setViewMode('top');
    // 延迟重绘画布，确保视图切换完成后再渲染
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        // 触发画布重绘
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 清除画布并重新绘制
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // 强制重绘
          setForceRedraw(prev => prev + 1);
          // 触发重绘
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }
    }, 150);
    message.success('已切换到顶视图编辑器');
  };

  // 正视图 - 切换到透视图模式
  const handleFrontView = () => {
    setViewMode(viewMode === 'top' ? 'perspective' : 'top');
    if (viewMode === 'top') {
      message.success('已切换到透视图编辑器');
    } else {
      message.success('已切换到顶视图编辑器');
    }
  };

  // 返回数字孪生页面
  const handleBack = () => {
    window.location.href = '/digital-twin';
  };

  // 画布操作工具功能函数
  // 拖动画布工具
  const handleCanvasDrag = () => {
    setCanvasOperationMode(canvasOperationMode === 'drag' ? null : 'drag');
    message.info(canvasOperationMode === 'drag' ? '已退出拖动模式' : '已进入拖动模式');
  };

  // 放大画布
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3); // 最大放大3倍
    setScale(newScale);
    message.info(`画布已放大至 ${Math.round(newScale * 100)}%`);
  };

  // 缩小画布
  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1); // 最小缩小至10%
    setScale(newScale);
    message.info(`画布已缩小至 ${Math.round(newScale * 100)}%`);
  };

  // 保存当前状态到撤销栈
  const saveStateToUndoStack = useCallback(() => {
    const currentState = {
      walls: [...walls],
      cncMachines: [...cncMachines],
      scale,
      offsetX,
      offsetY,
      timestamp: Date.now()
    };
    
    setUndoStack(prev => {
      const newStack = [...prev, currentState];
      // 限制撤销栈大小为20
      return newStack.length > 20 ? newStack.slice(1) : newStack;
    });
    
    // 清空重做栈
    setRedoStack([]);
  }, [walls, cncMachines, scale, offsetX, offsetY]);

  // 撤销操作
  const handleUndo = () => {
    if (undoStack.length === 0) {
      message.warning('没有可撤销的操作');
      return;
    }

    const currentState = {
      walls: [...walls],
      cncMachines: [...cncMachines],
      scale,
      offsetX,
      offsetY,
      timestamp: Date.now()
    };

    const previousState = undoStack[undoStack.length - 1];
    
    // 恢复状态
    console.log('🔄 [UNDO] ========== 撤销操作开始 ==========');
    console.log('🔄 [UNDO] 当前CNC机台数量:', cncMachines.length);
    console.log('🔄 [UNDO] 撤销前状态CNC机台数量:', previousState.cncMachines.length);
    console.log('🔄 [UNDO] 撤销前状态CNC机台列表:', previousState.cncMachines);
    
    setWalls(previousState.walls);
    setCncMachines(previousState.cncMachines);
    setScale(previousState.scale);
    setOffsetX(previousState.offsetX);
    setOffsetY(previousState.offsetY);
    
    console.log('🔄 [UNDO] setCncMachines调用完成');
    console.log('🔄 [UNDO] ========== 撤销操作结束 ==========');

    // 更新栈
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentState]);
    
    message.success('已撤销上一步操作');
  };

  // 重做操作
  const handleRedo = () => {
    if (redoStack.length === 0) {
      message.warning('没有可重做的操作');
      return;
    }

    const currentState = {
      walls: [...walls],
      cncMachines: [...cncMachines],
      scale,
      offsetX,
      offsetY,
      timestamp: Date.now()
    };

    const nextState = redoStack[redoStack.length - 1];
    
    // 恢复状态
    console.log('🔄 [REDO] ========== 重做操作开始 ==========');
    console.log('🔄 [REDO] 当前CNC机台数量:', cncMachines.length);
    console.log('🔄 [REDO] 重做状态CNC机台数量:', nextState.cncMachines.length);
    console.log('🔄 [REDO] 重做状态CNC机台列表:', nextState.cncMachines);
    
    setWalls(nextState.walls);
    setCncMachines(nextState.cncMachines);
    setScale(nextState.scale);
    setOffsetX(nextState.offsetX);
    setOffsetY(nextState.offsetY);
    
    console.log('🔄 [REDO] setCncMachines调用完成');
    console.log('🔄 [REDO] ========== 重做操作结束 ==========');

    // 更新栈
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentState]);
    
    message.success('已重做操作');
  };



  // 取消贝塞尔曲线绘制
  const cancelBezierDrawing = useCallback(() => {
    setBezierDrawingState({
      phase: 'idle',
      startPoint: null,
      endPoint: null,
      controlPoint1: null,
      controlPoint2: null,
      isDraggingControl: false,
      activeControlPoint: null,
      continuousMode: false,
      lastEndPoint: null
    });
    message.info('已取消贝塞尔曲线绘制');
  }, []);

  // 完成当前墙体绘制
  const finishCurrentWall = useCallback(() => {
    if (currentWall && currentWall.points.length >= 2) {
      // 保存当前状态到撤销栈
      saveStateToUndoStack();
      
      const completedWall = { ...currentWall, completed: true };
      setWalls(prev => [...prev, completedWall]);
    }
    setCurrentWall(null);
    setIsDrawingWall(false);
    
    // 自动切换回选择工具
    setDrawingTools(prev => prev.map(tool => ({
      ...tool,
      active: tool.type === 'select'
    })));
  }, [currentWall, saveStateToUndoStack]);

  // 取消当前墙体绘制
  const cancelCurrentWall = useCallback(() => {
    setCurrentWall(null);
    setIsDrawingWall(false);
  }, []);

  // 完成地面绘制
  const completeFloorDrawing = useCallback(() => {
    console.log('🎯 completeFloorDrawing被调用，当前点数:', currentFloorPoints.length);
    console.log('🎯 当前地面点:', currentFloorPoints);
    
    if (currentFloorPoints.length < 3) {
      message.warning('地面区域至少需要3个点才能完成绘制');
      return;
    }

    // 保存当前状态到撤销栈
    saveStateToUndoStack();

    // 创建新的地面区域
    const newFloorArea: FloorArea = {
      id: `floor-${Date.now()}`,
      name: `地面区域${floorAreas.length + 1}`,
      type: currentFloorType,
      points: [...currentFloorPoints],
      color: floorStyle.color,
      opacity: floorStyle.opacity,
      completed: true,
      visible: true,
      material: floorStyle.material,
      texture: floorStyle.texture,
      thickness: 0.1 // 默认地面厚度为0.1米
    };

    // 添加到地面区域列表
    setFloorAreas(prev => {
        const newAreas = [...prev, newFloorArea];
      console.log('🎯 地面区域已添加，新的floorAreas:', newAreas);
      console.log('🎯 新地面区域详情:', newFloorArea);
      return newAreas;
    });

    // 重置绘制状态
    setCurrentFloorPoints([]);
    setIsDrawingFloor(false);

    // 自动切换回选择工具
    setDrawingTools(prev => prev.map(tool => ({
      ...tool,
      active: tool.type === 'select'
    })));

    message.success('地面区域绘制完成');
  }, [currentFloorPoints, currentFloorType, floorStyle, floorAreas.length, saveStateToUndoStack]);

  // 取消地面绘制
  const cancelFloorDrawing = useCallback(() => {
    setCurrentFloorPoints([]);
    setIsDrawingFloor(false);
    message.info('已取消地面绘制');
  }, []);

  // 绘图工具选择
  const selectDrawingTool = useCallback((toolId: string) => {
    // 如果正在绘制墙体，先完成当前墙体
    if (isDrawingWall) {
      finishCurrentWall();
    }
    
    // 如果正在绘制地面，先取消当前地面绘制
    if (isDrawingFloor) {
      cancelFloorDrawing();
    }
    
    setDrawingTools(prev => prev.map(tool => ({
      ...tool,
      active: tool.id === toolId
    })));
    
    // 如果选择的是地面绘制工具，初始化地面绘制状态
    const selectedTool = drawingTools.find(tool => tool.id === toolId);
    if (selectedTool?.type === 'floor') {
      setIsDrawingFloor(true);
      setCurrentFloorPoints([]);
      message.info('开始绘制地面区域，点击画布添加点，ESC键完成绘制');
    }
  }, [isDrawingWall, isDrawingFloor, finishCurrentWall, cancelFloorDrawing, drawingTools]);

  // 使用 ref 来获取最新的状态值，解决闭包问题
  // 使用 ref 来获取最新的状态值，解决闭包问题
  const selectedEndpointRef = useRef(selectedEndpoint);
  const selectedWallsRef = useRef(selectedWalls);
  const selectedFloorAreasRef = useRef(selectedFloorAreas);
  const wallsRef = useRef(walls);
  const isDrawingWallRef = useRef(isDrawingWall);
  const currentWallRef = useRef(currentWall);
  const bezierDrawingStateRef = useRef(bezierDrawingState);
  
  // 更新 ref 值
  useEffect(() => {
    selectedEndpointRef.current = selectedEndpoint;
    console.log('🔄 selectedEndpoint 状态变化:', {
      newValue: selectedEndpoint,
      refValue: selectedEndpointRef.current,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [selectedEndpoint]);
  
  useEffect(() => {
    selectedWallsRef.current = selectedWalls;
  }, [selectedWalls]);
  
  useEffect(() => {
    selectedFloorAreasRef.current = selectedFloorAreas;
  }, [selectedFloorAreas]);
  
  useEffect(() => {
    wallsRef.current = walls;
  }, [walls]);
  
  useEffect(() => {
    isDrawingWallRef.current = isDrawingWall;
  }, [isDrawingWall]);
  
  useEffect(() => {
    currentWallRef.current = currentWall;
  }, [currentWall]);
  
  useEffect(() => {
    bezierDrawingStateRef.current = bezierDrawingState;
  }, [bezierDrawingState]);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      
      if (e.key === 'Escape') {
        // 检查是否正在绘制地面
        if (isDrawingFloor && currentFloorPoints.length >= 3) {
          // ESC键完成地面绘制
          completeFloorDrawing();
          return;
        } else if (isDrawingFloor) {
          // 如果地面点数不足，取消绘制
          cancelFloorDrawing();
          return;
        }
        
        // ESC键取消所有选择
        setSelectedWalls([]);
        setSelectedSegments([]);
        setSelectedEndpoint(null);
        setSelectedFloorEndpoint(null);  // 取消地面端点选择
        setSelectedFloorAreas([]);  // 取消地面区域选择
        setIsSelecting(false);
        setIsDraggingEndpoint(false);
        setIsDraggingFloorEndpoint(false);  // 取消地面端点拖拽
        setBezierEditMode({
           isEditing: false,
           wallId: null,
           isDraggingControl: false,
           activeControlPoint: null
         });
        setIsConnecting(false);
        isConnectingRef.current = false;
        setContinuousConnecting(false);
        continuousConnectingRef.current = false;
        setConnectingStartPoint(null);
        setLastConnectedPoint(null);
        
        if (isDrawingWallRef.current && currentWallRef.current) {
          cancelCurrentWall();
        }
        
        if (bezierDrawingStateRef.current.phase === 'drawing') {
           cancelBezierDrawing();
         }
         
        // 切换到选择工具
        selectDrawingTool('select-wall');
        message.info('已切换到选择工具');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // 🛡️ 检查是否在输入元素中按下Delete键，如果是则不执行删除操作
        const activeElement = document.activeElement;
        const isInputElement = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true' ||
          activeElement.closest('.ant-input') ||
          activeElement.closest('.ant-select') ||
          activeElement.closest('.ant-slider')
        );
        
        if (isInputElement) {
          console.log('⚠️ [DELETE] 在输入元素中按下Delete键，跳过删除操作');
          return;
        }
        
        // 删除选中的墙体、地面或CNC机台
        if (selectedWallsRef.current.length > 0) {
          setWalls(prev => prev.filter(wall => !selectedWallsRef.current.includes(wall.id)));
          setSelectedWalls([]);
          message.success(`已删除 ${selectedWallsRef.current.length} 个墙体`);
        } else if (selectedFloorAreasRef.current.length > 0) {
          setFloorAreas(prev => prev.filter(floor => !selectedFloorAreasRef.current.includes(floor.id)));
          setSelectedFloorAreas([]);
          message.success(`已删除 ${selectedFloorAreasRef.current.length} 个地面区域`);
        } else if (selectedCNCMachinesRef.current.length > 0) {
          console.log('🗑️ [DELETE-REF] 尝试删除CNC机台 (通过Ref)');
          console.log('🗑️ [DELETE-REF] 选中的机台ID:', selectedCNCMachinesRef.current);
          console.log('🗑️ [DELETE-REF] 属性面板是否打开:', showCNCPropertiesPanel);
          console.log('🗑️ [DELETE-REF] 当前编辑的机台ID:', cncPropertiesFormData?.cncId);
          
          // 🛡️ 增强保护机制：检查多种情况
          const shouldBlockDeletion = (
            // 情况1：属性面板正在打开且正在编辑选中的机台
            (showCNCPropertiesPanel && cncPropertiesFormData?.cncId && selectedCNCMachinesRef.current.includes(cncPropertiesFormData.cncId)) ||
            // 情况2：刚刚关闭属性面板，但表单数据仍然存在（可能正在应用更改）
            (!showCNCPropertiesPanel && cncPropertiesFormData?.cncId && selectedCNCMachinesRef.current.includes(cncPropertiesFormData.cncId))
          );
          
          if (shouldBlockDeletion) {
            console.log('⚠️ [DELETE-REF] 阻止删除：CNC机台正在编辑或刚刚编辑完成');
            message.warning('CNC机台正在编辑或刚刚编辑完成，请稍后再试');
            return;
          }
          
          // 🛡️ 额外保护：检查CNC机台列表是否为空
          if (cncMachines.length === 0) {
            console.error('❌ [DELETE-REF] CNC机台列表为空，无法执行删除操作');
            message.error('CNC机台数据异常，无法执行删除操作');
            return;
          }
          
          setCncMachines(prev => {
            const filteredMachines = prev.filter(machine => !selectedCNCMachinesRef.current.includes(machine.id));
            console.log('🗑️ [DELETE-REF] 删除前机台数量:', prev.length);
            console.log('🗑️ [DELETE-REF] 删除后机台数量:', filteredMachines.length);
            return filteredMachines;
          });
          setSelectedCNCMachines([]);
          message.success(`已删除 ${selectedCNCMachinesRef.current.length} 个CNC机台`);
        }
      } else if (e.ctrlKey && e.key === 'a') {
        // Ctrl+A 全选所有墙体
        e.preventDefault();
        const allWallIds = wallsRef.current.map(wall => wall.id);
        setSelectedWalls(allWallIds);
        setWalls(prevWalls => 
          prevWalls.map(wall => ({ ...wall, selected: true }))
        );
        message.info(`已选中 ${allWallIds.length} 个墙体`);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // 方向键调整选中端点位置或CNC机台位置
        console.log('🔍 键盘移动 - 方向键触发:', {
          key: e.key,
          selectedEndpointRef: selectedEndpointRef.current,
          selectedEndpoint: selectedEndpoint,
          selectedCNCMachines: selectedCNCMachines,
          shiftKey: e.shiftKey,
          wallsCount: wallsRef.current.length
        });
        
        // 优先处理CNC机台移动
        if (selectedCNCMachinesRef.current.length > 0) {
          e.preventDefault();
          const moveDistance = e.shiftKey ? 10 : 1; // Shift键加速移动
          let deltaX = 0;
          let deltaY = 0;
          
          switch (e.key) {
            case 'ArrowUp':
              deltaY = -moveDistance;
              break;
            case 'ArrowDown':
              deltaY = moveDistance;
              break;
            case 'ArrowLeft':
              deltaX = -moveDistance;
              break;
            case 'ArrowRight':
              deltaX = moveDistance;
              break;
          }
          
          console.log('🎯 键盘移动CNC机台 - 计算移动量:', {
            deltaX,
            deltaY,
            moveDistance,
            selectedCNCMachines: selectedCNCMachinesRef.current
          });
          
          // 更新选中的CNC机台位置
          setCncMachines(prev => 
            prev.map(machine => {
              if (selectedCNCMachinesRef.current.includes(machine.id)) {
                return {
                  ...machine,
                  x: machine.x + deltaX,
                  y: machine.y + deltaY
                };
              }
              return machine;
            })
          );
        } else if (selectedEndpointRef.current) {
          e.preventDefault();
          const moveDistance = e.shiftKey ? 10 : 1; // Shift键加速移动
          let deltaX = 0;
          let deltaY = 0;
          
          switch (e.key) {
            case 'ArrowUp':
              deltaY = -moveDistance;
              break;
            case 'ArrowDown':
              deltaY = moveDistance;
              break;
            case 'ArrowLeft':
              deltaX = -moveDistance;
              break;
            case 'ArrowRight':
              deltaX = moveDistance;
              break;
          }
          
          console.log('🎯 键盘移动端点 - 计算移动量:', {
            deltaX,
            deltaY,
            moveDistance,
            selectedEndpoint: selectedEndpointRef.current
          });
          
          // 更新端点位置
          const selectedWall = wallsRef.current.find(wall => wall.id === selectedEndpointRef.current!.wallId);
          if (selectedWall) {
            const pointIndex = selectedEndpointRef.current!.pointIndex;
            const oldPoint = selectedWall.points[pointIndex];
            const newPoint = {
              x: oldPoint.x + deltaX,
              y: oldPoint.y + deltaY
            };
            
            // 检查是否为共享端点
            const pointId = selectedWall.pointIds?.[pointIndex];
            
            if (pointId && sharedPointsRef.current?.has(pointId)) {
              // 如果是共享端点，使用updateSharedPoint函数来同时更新所有连接的墙体
              console.log('🔗 键盘移动端点 - 检测到共享端点，使用updateSharedPoint:', {
                pointId,
                oldPoint,
                newPoint,
                deltaX,
                deltaY
              });
              
              updateSharedPoint(pointId, newPoint.x, newPoint.y);
            } else {
              // 如果不是共享端点，只更新当前墙体
              console.log('📍 键盘移动端点 - 普通端点，只更新当前墙体:', {
                wallId: selectedWall.id,
                pointIndex,
                oldPoint,
                newPoint,
                deltaX,
                deltaY
              });
              
              setWalls(prev => {
                return prev.map(wall => {
                  if (wall.id === selectedEndpointRef.current!.wallId) {
                    const newPoints = [...wall.points];
                    newPoints[selectedEndpointRef.current!.pointIndex] = newPoint;
                    return { ...wall, points: newPoints };
                  }
                  return wall;
                });
              });
            }
          }
        } else if (selectedFloorEndpoint) {
          // 处理地面端点移动
          e.preventDefault();
          const moveDistance = e.shiftKey ? 10 : 1; // Shift键加速移动
          let deltaX = 0;
          let deltaY = 0;
          
          switch (e.key) {
            case 'ArrowUp':
              deltaY = -moveDistance;
              break;
            case 'ArrowDown':
              deltaY = moveDistance;
              break;
            case 'ArrowLeft':
              deltaX = -moveDistance;
              break;
            case 'ArrowRight':
              deltaX = moveDistance;
              break;
          }
          
          console.log('🎯 键盘移动地面端点 - 计算移动量:', {
            deltaX,
            deltaY,
            moveDistance,
            selectedFloorEndpoint
          });
          
          // 更新地面端点位置
          setFloorAreas(prev => 
            prev.map(floor => {
              if (floor.id === selectedFloorEndpoint.floorId) {
                const newPoints = [...floor.points];
                const pointIndex = selectedFloorEndpoint.pointIndex;
                newPoints[pointIndex] = {
                  x: newPoints[pointIndex].x + deltaX,
                  y: newPoints[pointIndex].y + deltaY
                };
                return { ...floor, points: newPoints };
              }
              return floor;
            })
          );
          
          // 注意：selectedFloorEndpoint 只包含 floorId 和 pointIndex，不需要更新坐标
          // 坐标已经在上面的 setFloorAreas 中更新了
        } else {
          console.log('⚠️ 键盘移动 - 没有选中的端点或CNC机台');
        }
      }
    };

    // 处理空格键释放事件
    const handleKeyUpEvent = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        // 空格键释放时恢复选择模式
        if (isSpacePressed) {
          setIsSpacePressed(false);
          setCanvasOperationMode('select');
          
          // 恢复默认光标
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'default';
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDownEvent);
    document.addEventListener('keyup', handleKeyUpEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent);
      document.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, [
    isSpacePressed, 
    setCanvasOperationMode,
    isDrawingFloor,
    currentFloorPoints,
    completeFloorDrawing,
    cancelFloorDrawing,
    selectedFloorEndpoint
  ]); // 添加地面绘制相关依赖项



  // 共享端点管理函数
  const createSharedPoint = useCallback((x: number, y: number): string => {
    const pointId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sharedPoint: SharedPoint = {
      id: pointId,
      x,
      y,
      connectedWalls: []
    };
    
    setSharedPoints(prev => new Map(prev).set(pointId, sharedPoint));
    return pointId;
  }, []);

  const findNearbySharedPoint = useCallback((x: number, y: number, threshold: number = 5): SharedPoint | null => {
    const currentSharedPoints = sharedPointsRef.current;
    for (const [, point] of currentSharedPoints) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance <= threshold) {
        return point;
      }
    }
    return null;
  }, []);

  const updateSharedPoint = useCallback((pointId: string, x: number, y: number) => {
    // 使用 ref 获取最新的共享端点信息
    const currentPoint = sharedPointsRef.current?.get(pointId);
    
    if (currentPoint) {
      console.log(`🔄 开始更新共享端点: ${pointId}, 新位置: (${x}, ${y})`);
      
      // 先更新共享端点位置
      setSharedPoints(prev => {
        const newMap = new Map(prev);
        newMap.set(pointId, { ...currentPoint, x, y });
        return newMap;
      });
      
      // 然后更新所有连接到此共享端点的墙体
      setWalls(prevWalls => {
        const updatedWalls = prevWalls.map(wall => {
          const connection = currentPoint.connectedWalls.find(conn => conn.wallId === wall.id);
          if (connection) {
            const newPoints = [...wall.points];
            const oldPoint = newPoints[connection.pointIndex];
            newPoints[connection.pointIndex] = { x, y };
            
            console.log(`📍 更新墙体 ${wall.id} 的端点 ${connection.pointIndex}: (${oldPoint.x}, ${oldPoint.y}) -> (${x}, ${y})`);
            
            // 确保 pointIds 数组与 points 数组保持一致
            const newPointIds = wall.pointIds ? [...wall.pointIds] : new Array(wall.points.length).fill(null);
            // 确保 pointIds 数组长度与 points 数组一致
            while (newPointIds.length < newPoints.length) {
              newPointIds.push(null);
            }
            // 保持共享端点的关联关系
            newPointIds[connection.pointIndex] = pointId;
            
            return { ...wall, points: newPoints, pointIds: newPointIds };
          }
          return wall;
        });
        
        console.log(`✅ 共享端点更新完成，影响了 ${currentPoint.connectedWalls.length} 个墙体`);
        return updatedWalls;
      });
      
      // 强制触发3D重新渲染 - 使用setTimeout确保状态更新完成后再次触发
      setTimeout(() => {
        console.log(`🎯 强制触发3D重新渲染 - 端点: ${pointId}`);
        setWalls(prevWalls => {
          // 创建新数组引用强制重新渲染，但保持内容不变
          return [...prevWalls];
        });
      }, 10); // 稍微延迟确保状态更新完成
    }
  }, []);

  const addWallToSharedPoint = useCallback((pointId: string, wallId: string, pointIndex: number) => {
    setSharedPoints(prev => {
      const newMap = new Map(prev);
      const point = newMap.get(pointId);
      if (point) {
        const updatedConnections = [...point.connectedWalls];
        // 检查是否已存在相同的连接
        const existingIndex = updatedConnections.findIndex(
          conn => conn.wallId === wallId && conn.pointIndex === pointIndex
        );
        if (existingIndex === -1) {
          updatedConnections.push({ wallId, pointIndex });
          newMap.set(pointId, { ...point, connectedWalls: updatedConnections });
        }
      }
      return newMap;
    });
  }, []);

  const removeWallFromSharedPoint = useCallback((pointId: string, wallId: string, pointIndex: number) => {
    setSharedPoints(prev => {
      const newMap = new Map(prev);
      const point = newMap.get(pointId);
      if (point) {
        const updatedConnections = point.connectedWalls.filter(
          conn => !(conn.wallId === wallId && conn.pointIndex === pointIndex)
        );
        
        if (updatedConnections.length === 0) {
          // 如果没有墙体连接到此端点，删除共享端点
          newMap.delete(pointId);
        } else {
          newMap.set(pointId, { ...point, connectedWalls: updatedConnections });
        }
      }
      return newMap;
    });
  }, []);

  // CNC机台控制函数
  const handleCNCMachineMove = useCallback((machineId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const moveDistance = 10; // 每次移动的距离（像素）
    
    setCncMachines(prev => prev.map(machine => {
      if (machine.id === machineId) {
        let newX = machine.x;
        let newY = machine.y;
        
        switch (direction) {
          case 'up':
            newY -= moveDistance;
            break;
          case 'down':
            newY += moveDistance;
            break;
          case 'left':
            newX -= moveDistance;
            break;
          case 'right':
            newX += moveDistance;
            break;
        }
        
        return { ...machine, x: newX, y: newY };
      }
      return machine;
    }));
  }, []);



  // CNC机台对齐功能
  const handleCNCMachineAlign = useCallback((alignType: 'left' | 'right' | 'top' | 'bottom' | 'horizontal' | 'vertical') => {
    if (selectedCNCMachines.length < 2) {
      message.warning('请选择至少2个CNC机台进行对齐操作');
      return;
    }

    const selectedMachines = cncMachines.filter(machine => selectedCNCMachines.includes(machine.id));
    
    setCncMachines(prev => prev.map(machine => {
      if (!selectedCNCMachines.includes(machine.id)) {
        return machine;
      }

      let newX = machine.x;
      let newY = machine.y;

      switch (alignType) {
        case 'left': {
          // 左对齐：所有机台的x坐标对齐到最左边的机台
          const minX = Math.min(...selectedMachines.map(m => m.x));
          newX = minX;
          break;
        }
        case 'right': {
          // 右对齐：所有机台的x坐标对齐到最右边的机台
          const maxX = Math.max(...selectedMachines.map(m => m.x));
          newX = maxX;
          break;
        }
        case 'top': {
          // 上对齐：所有机台的y坐标对齐到最上边的机台
          const minY = Math.min(...selectedMachines.map(m => m.y));
          newY = minY;
          break;
        }
        case 'bottom': {
          // 下对齐：所有机台的y坐标对齐到最下边的机台
          const maxY = Math.max(...selectedMachines.map(m => m.y));
          newY = maxY;
          break;
        }
        case 'horizontal': {
          // 横向平均分布：保持y坐标不变，x坐标平均分布
          const sortedByX = [...selectedMachines].sort((a, b) => a.x - b.x);
          const minX = sortedByX[0].x;
          const maxX = sortedByX[sortedByX.length - 1].x;
          const currentIndex = sortedByX.findIndex(m => m.id === machine.id);
          
          if (sortedByX.length > 1) {
            const spacing = (maxX - minX) / (sortedByX.length - 1);
            newX = minX + currentIndex * spacing;
          }
          break;
        }
        case 'vertical': {
          // 纵向平均分布：保持x坐标不变，y坐标平均分布
          const sortedByY = [...selectedMachines].sort((a, b) => a.y - b.y);
          const minY = sortedByY[0].y;
          const maxY = sortedByY[sortedByY.length - 1].y;
          const currentIndex = sortedByY.findIndex(m => m.id === machine.id);
          
          if (sortedByY.length > 1) {
            const spacing = (maxY - minY) / (sortedByY.length - 1);
            newY = minY + currentIndex * spacing;
          }
          break;
        }
      }

      return { ...machine, x: newX, y: newY };
    }));

    const alignTypeNames = {
      'left': '左对齐',
      'right': '右对齐', 
      'top': '上对齐',
      'bottom': '下对齐',
      'horizontal': '横向平均分布',
      'vertical': '纵向平均分布'
    };
    
    message.success(`已完成${selectedCNCMachines.length}个CNC机台的${alignTypeNames[alignType]}操作`);
  }, [selectedCNCMachines, cncMachines]);

  // 画布事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    const point = screenToCanvas(e.clientX, e.clientY);
    
    // 在顶视图模式下检查是否点击了CNC机台的控制按钮
    if (viewMode === 'top') {
      // 首先检查是否点击了选中CNC机台的控制按钮
      for (const machine of cncMachines) {
        const isSelected = selectedCNCMachines.includes(machine.id);
        if (!isSelected) continue;
        
        // 圆形按钮参数（与绘制时保持一致）
        const buttonRadius = 12;
        const buttonDistance = 45;
        
        // 圆形按钮点击检测函数
        const isPointInCircle = (px: number, py: number, cx: number, cy: number, radius: number): boolean => {
          const dx = px - cx;
          const dy = py - cy;
          return Math.sqrt(dx * dx + dy * dy) <= radius;
        };
        
        // 计算机台在画布上的位置（与绘制时保持一致）
        const canvasX = machine.x;
        const canvasY = machine.y;
        
        // 检查移动控制按钮（圆形检测）
        const upButtonX = canvasX;
        const upButtonY = canvasY - buttonDistance;
        if (isPointInCircle(point.x, point.y, upButtonX, upButtonY, buttonRadius)) {
          handleCNCMachineMove(machine.id, 'up');
          return;
        }
        
        const downButtonX = canvasX;
        const downButtonY = canvasY + buttonDistance;
        if (isPointInCircle(point.x, point.y, downButtonX, downButtonY, buttonRadius)) {
          handleCNCMachineMove(machine.id, 'down');
          return;
        }
        
        const leftButtonX = canvasX - buttonDistance;
        const leftButtonY = canvasY;
        if (isPointInCircle(point.x, point.y, leftButtonX, leftButtonY, buttonRadius)) {
          handleCNCMachineMove(machine.id, 'left');
          return;
        }
        
        const rightButtonX = canvasX + buttonDistance;
        const rightButtonY = canvasY;
        if (isPointInCircle(point.x, point.y, rightButtonX, rightButtonY, buttonRadius)) {
          handleCNCMachineMove(machine.id, 'right');
          return;
        }
        

      }
      
      // 然后检查是否点击了CNC机台本身
      const clickedCNCMachine = cncMachines.find(machine => {
        // 计算机台在画布上的位置（与绘制时保持一致）
        const canvasX = machine.x;
        const canvasY = machine.y;
        
        // 使用机台的实际尺寸，如果没有设置则使用默认值，并确保最小点击区域
        const minClickSize = 8; // 最小点击区域
        const machineWidth = Math.max((machine.width3D || machine.width || 5) * 10, minClickSize);
        const machineHeight = Math.max((machine.height3D || machine.height || 5) * 10, minClickSize);
        return point.x >= canvasX - machineWidth / 2 && 
               point.x <= canvasX + machineWidth / 2 &&
               point.y >= canvasY - machineHeight / 2 && 
               point.y <= canvasY + machineHeight / 2;
      });
      
      if (clickedCNCMachine) {
        // 处理CNC机台的选中逻辑
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd + 点击：多选模式
          setSelectedCNCMachines(prev => {
            if (prev.includes(clickedCNCMachine.id)) {
              return prev.filter(id => id !== clickedCNCMachine.id);
            } else {
              return [...prev, clickedCNCMachine.id];
            }
          });
          
          // 清除地面端点选择状态
          setSelectedFloorEndpoint(null);
          setIsDraggingFloorEndpoint(false);
          setSelectedFloorAreas([]);
          
          // 清除墙体端点选择状态
          setSelectedEndpoint(null);
          setIsDraggingEndpoint(false);
          setHoveredEndpoint(null);
        } else {
          // 普通点击：单选模式
          setSelectedCNCMachines([clickedCNCMachine.id]);
          
          // 清除地面端点选择状态
          setSelectedFloorEndpoint(null);
          setIsDraggingFloorEndpoint(false);
          setSelectedFloorAreas([]);
          
          // 清除墙体端点选择状态
          setSelectedEndpoint(null);
          setIsDraggingEndpoint(false);
          setHoveredEndpoint(null);
          
          // 开始拖拽移动
          setIsDraggingCNCMachine(true);
          setDraggedCNCMachineId(clickedCNCMachine.id);
          setDragStartPosition({ x: point.x, y: point.y });
        }
        return; // 阻止其他事件处理
      } else {
        // 点击空白区域，清除CNC机台选中状态
        if (!e.ctrlKey && !e.metaKey) {
          setSelectedCNCMachines([]);
        }
      }
      
      // 注释掉地面检测逻辑，让它在handleSelectionStart中处理
      // 这样可以确保墙体检测优先于地面检测
    }

    // 检查是否点击了编辑模式下的控制点或手柄
    if (bezierEditMode.isEditing && bezierEditMode.wallId) {
      const wall = walls.find(w => w.id === bezierEditMode.wallId);
      if (wall) {
        const controlRadius = 8 / scale; // 控制点点击半径
        
        if (wall.type === 'bezier' && wall.points.length >= 4) {
          // 贝塞尔曲线：检查控制点（新格式：points[1]和points[2]是控制点）
          // 检查控制点1 (points[1])
          const controlPoint1 = wall.points[1];
          if (controlPoint1) {
            const dist1 = Math.sqrt(
              Math.pow(point.x - controlPoint1.x, 2) + 
              Math.pow(point.y - controlPoint1.y, 2)
            );
            if (dist1 < controlRadius) {
              setBezierEditMode(prev => ({
                ...prev,
                isDraggingControl: true,
                activeControlPoint: 1
              }));
              return;
            }
          }
          
          // 检查控制点2 (points[2])
          const controlPoint2 = wall.points[2];
          if (controlPoint2) {
            const dist2 = Math.sqrt(
              Math.pow(point.x - controlPoint2.x, 2) + 
              Math.pow(point.y - controlPoint2.y, 2)
            );
            if (dist2 < controlRadius) {
              setBezierEditMode(prev => ({
                ...prev,
                isDraggingControl: true,
                activeControlPoint: 2
              }));
              return;
            }
          }
        }
      }
    }
    
    if (activeTool && activeTool.type === 'wall') {
      // 墙体绘制模式
      handleWallDrawing(e);
    } else if (activeTool && activeTool.type === 'floor') {
      // 地面绘制模式
      handleFloorDrawing(e);
    } else if (activeTool && activeTool.type === 'select') {
      // 选择工具模式
      handleSelectionStart(e);
    } else if (canvasOperationMode === 'drag') {
      // 画布拖动模式 - 使用改进的拖动逻辑
      handleCanvasDragStart(e);
    } else {
      // 普通拖拽模式（保持原有逻辑）
      setIsDragging(true);
      setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    }
  };

  // 改进的画布拖动开始处理函数（参考地图编辑器实现）
  const handleCanvasDragStart = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    // 只在拖动模式下或者没有激活工具时允许拖动
    if (canvasOperationMode !== 'drag' && activeTool) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDragging) {
      // 开始拖动
      setIsDragging(true);
      const startX = event.clientX;
      const startY = event.clientY;
      const startOffset = { x: offsetX, y: offsetY };
      
      // 设置拖动光标
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = 'grabbing';
      }
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // 设置拖动灵敏度为1:1
        const sensitivity = 1.0;
        
        setOffsetX(startOffset.x + deltaX * sensitivity);
        setOffsetY(startOffset.y + deltaY * sensitivity);
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        
        // 恢复光标样式
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.style.cursor = canvasOperationMode === 'drag' ? 'grab' : 'default';
        }
        
        // 确保画布保持焦点
        if (canvas) {
          canvas.focus();
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };// 处理画布双击事件
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const activeTool = getActiveTool();
    const point = screenToCanvas(e.clientX, e.clientY);
    
    // 如果在连续连线模式下，双击结束连线
    if (continuousConnecting && activeTool?.type === 'wall' && activeTool?.subType === 'line') {
      setContinuousConnecting(false);
      continuousConnectingRef.current = false;
      setIsConnecting(false);
      isConnectingRef.current = false;
      setConnectingStartPoint(null);
      setLastConnectedPoint(null);
      setMousePosition(null);
      mousePositionRef.current = null;
      
      // 完成当前墙体
      if (currentWall && currentWall.points.length >= 2) {
        finishCurrentWall();
      }
      return;
    }
    
    // 检查是否双击了CNC机台，打开属性面板
    const clickedCNC = cncMachines.find(cnc => {
      // 检查点击是否在CNC机台范围内（考虑机台尺寸）
      const halfWidth = (cnc.width || 2.0) * 20; // 转换为像素，假设1米=20像素
      const halfHeight = (cnc.height || 1.5) * 20;
      return Math.abs(point.x - cnc.x) <= halfWidth && Math.abs(point.y - cnc.y) <= halfHeight;
    });
    
    if (clickedCNC) {
      // 打开CNC机台属性面板
      openCNCPropertiesPanel(clickedCNC.id);
      message.info(`打开 ${clickedCNC.name} 属性面板`);
      return;
    }
    
    // 检查是否双击了贝塞尔曲线，进入编辑模式
    if (activeTool?.type === 'select') {
      const clickedWall = walls.find(wall => {
        if (wall.type !== 'bezier' || !wall.completed) return false;
        
        // 检查是否点击了贝塞尔曲线
        const distance = getDistanceToWall(point, wall);
        return distance <= 10; // 10像素的点击容差
      });
      
      if (clickedWall) {
        // 进入贝塞尔曲线编辑模式
        setBezierEditMode({
          isEditing: true,
          wallId: clickedWall.id,
          isDraggingControl: false,
          activeControlPoint: null
        });
        
        // 清除其他选择状态
        setSelectedWalls([]);
        setSelectedSegments([]);
        
        message.info('进入贝塞尔曲线编辑模式，拖拽控制点调整曲线形状');
      }
    }
  };

  // 处理拖拽放置事件
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // 检查CNC机台是否与现有机台重叠
  const checkCNCCollision = (x: number, y: number, width: number, height: number, excludeId?: string): boolean => {
    return cncMachines.some(machine => {
      if (excludeId && machine.id === excludeId) return false;
      
      // 检查矩形重叠
      const left1 = x - width / 2;
      const right1 = x + width / 2;
      const top1 = y - height / 2;
      const bottom1 = y + height / 2;
      
      const left2 = machine.x - machine.width / 2;
      const right2 = machine.x + machine.width / 2;
      const top2 = machine.y - machine.height / 2;
      const bottom2 = machine.y + machine.height / 2;
      
      return !(right1 <= left2 || left1 >= right2 || bottom1 <= top2 || top1 >= bottom2);
    });
  };

  // 寻找合适的放置位置，避免重叠
  const findValidPosition = (initialX: number, initialY: number, width: number, height: number): { x: number, y: number } => {
    const minSpacing = 80; // 最小间距（像素）
    const maxAttempts = 50; // 最大尝试次数
    
    // 首先检查初始位置是否可用
    if (!checkCNCCollision(initialX, initialY, width, height)) {
      return { x: initialX, y: initialY };
    }
    
    // 如果初始位置有冲突，尝试在周围寻找合适位置
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const radius = minSpacing * attempt;
      const angleStep = Math.PI / 4; // 45度步长
      
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        const x = initialX + Math.cos(angle) * radius;
        const y = initialY + Math.sin(angle) * radius;
        
        // 确保位置在画布范围内
        if (x >= width / 2 && x <= 800 - width / 2 && 
            y >= height / 2 && y <= 600 - height / 2) {
          if (!checkCNCCollision(x, y, width, height)) {
            return { x, y };
          }
        }
      }
    }
    
    // 如果找不到合适位置，返回初始位置（用户可以手动调整）
    return { x: initialX, y: initialY };
  };

  // 生成下一个可用的CNC机台名称
  const generateNextCNCName = (): string => {
    const existingNames = cncMachines.map(machine => machine.name);
    let counter = 1;
    
    while (true) {
      const newName = `CNC机台${counter.toString().padStart(3, '0')}`;
      if (!existingNames.includes(newName)) {
        return newName;
      }
      counter++;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    try {
      const modelData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (modelData.type === 'cnc') {
        const point = screenToCanvas(e.clientX, e.clientY);
        
        // 机台尺寸
        const machineWidth = 50;
        const machineHeight = 50;
        
        // 寻找合适的放置位置
        const validPosition = findValidPosition(point.x, point.y, machineWidth, machineHeight);
        
        // 生成唯一的CNC机台名称
        const cncName = generateNextCNCName();
        
        // 创建新的CNC机台
        const newCNCMachine: CNCMachine = {
          id: `cnc_${Date.now()}`,
          x: validPosition.x,
          y: validPosition.y,
          width: machineWidth,
          height: machineHeight,
          name: cncName,
          type: 'cnc',
          color: '#1890ff',
          selected: false,
          // 3D参数默认值 - 确保与间距比例协调，避免重叠
          width3D: 1,    // 3D宽度（X轴，单位：m），配合4米间距绝对避免重叠
          depth3D: 1,    // 3D深度（Z轴，单位：m），配合4米间距绝对避免重叠
          height3D: 1,   // 3D高度（Y轴，单位：m），配合4米间距绝对避免重叠
          // GLB模型相关字段初始化
          currentModel: 'default',  // 默认使用预设模型
          modelFile: null,          // 初始无自定义模型文件
          modelUrl: undefined,      // 初始无模型URL
          modelFileName: undefined  // 初始无模型文件名
        };
        
        // 保存当前状态到撤销栈
        saveStateToUndoStack();
        
        setCncMachines(prev => [...prev, newCNCMachine]);
        
        // 如果位置被调整，提示用户
        if (validPosition.x !== point.x || validPosition.y !== point.y) {
          message.success(`已添加CNC机台: ${cncName}（位置已自动调整以避免重叠）`);
        } else {
          message.success(`已添加CNC机台: ${cncName}`);
        }
      }
    } catch (error) {
      console.error('拖拽放置失败:', error);
    }
    
    // 重置拖拽状态
    setDraggedCNCModel(null);
  };

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    const point = screenToCanvas(e.clientX, e.clientY);
    const canvas = canvasRef.current;
    
    // 贝塞尔曲线控制点拖拽（绘制模式）
    if (bezierDrawingState.isDraggingControl && bezierDrawingState.activeControlPoint) {
      setBezierDrawingState(prev => ({
        ...prev,
        [bezierDrawingState.activeControlPoint!]: point
      }));
      return;
    }

    // 编辑模式下的控制点拖拽
    if (bezierEditMode.isDraggingControl && bezierEditMode.activeControlPoint && bezierEditMode.wallId) {
      const wallIndex = walls.findIndex(w => w.id === bezierEditMode.wallId);
      if (wallIndex !== -1) {
        const updatedWalls = [...walls];
        const wall = updatedWalls[wallIndex];
        
        if (wall.type === 'bezier' && wall.points.length >= 4) {
          // 贝塞尔曲线：更新控制点（新格式：points[1]和points[2]是控制点）
          const controlPointIndex = bezierEditMode.activeControlPoint === 1 ? 1 : 2;
          updatedWalls[wallIndex].points[controlPointIndex] = point;
        }
        
        setWalls(updatedWalls);
      }
      return;
    }
    
    // 检查是否悬停在贝塞尔曲线编辑模式的控制点上
    if (bezierEditMode.isEditing && bezierEditMode.wallId && canvas) {
      const wall = walls.find(w => w.id === bezierEditMode.wallId);
      if (wall && wall.type === 'bezier' && wall.points.length >= 4) {
        let isHoveringControlPoint = false;
        
        // 检查两个控制点（新格式：points[1]和points[2]是控制点）
        for (let i = 1; i <= 2; i++) {
          const controlPoint = wall.points[i];
          const distance = Math.sqrt(
            Math.pow(point.x - controlPoint.x, 2) + Math.pow(point.y - controlPoint.y, 2)
          );
          
          if (distance <= 8) { // 控制点半径为8
            isHoveringControlPoint = true;
            break;
          }
        }
        
        // 设置光标样式
        canvas.style.cursor = isHoveringControlPoint ? 'pointer' : 'default';
      }
    } else if (canvas && !isDragging && !isDraggingEndpoint) {
      // 根据画布操作模式设置光标样式
      if (canvasOperationMode === 'drag') {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'default';
      }
    }
    
    if (isDragging) {
      // 在拖动时设置抓取光标
      if (canvas) {
        canvas.style.cursor = 'grabbing';
      }
      setOffsetX(e.clientX - dragStart.x);
      setOffsetY(e.clientY - dragStart.y);
    } else if (isDraggingCNCMachine && draggedCNCMachineId && dragStartPosition) {
      // CNC机台拖拽移动
      const deltaX = point.x - dragStartPosition.x;
      const deltaY = point.y - dragStartPosition.y;
      
      setCncMachines(prev => prev.map(machine => {
        if (machine.id === draggedCNCMachineId) {
          return {
            ...machine,
            x: machine.x + deltaX,
            y: machine.y + deltaY
          };
        }
        return machine;
      }));
      
      // 更新拖拽起始位置
      setDragStartPosition(point);
    } else if (isDraggingEndpoint && selectedEndpoint) {
      // 拖拽端点 - 支持共享端点
      // 首先检查是否有共享端点与当前拖拽的端点位置匹配
      let foundSharedPointId: string | null = null;
      
      // 遍历所有共享端点，查找与当前端点关联的共享点
      for (const [pointId, sharedPoint] of sharedPointsRef.current?.entries() || []) {
        const connection = sharedPoint.connectedWalls.find(
          conn => conn.wallId === selectedEndpoint.wallId && conn.pointIndex === selectedEndpoint.pointIndex
        );
        if (connection) {
          foundSharedPointId = pointId;
          break;
        }
      }
      
      if (foundSharedPointId) {
        // 如果是共享端点，更新共享端点位置，这会自动同步所有相关墙体
        updateSharedPoint(foundSharedPointId, point.x, point.y);
      } else {
        // 如果不是共享端点，只更新当前墙体
        setWalls(prev => prev.map(wall => {
          if (wall.id === selectedEndpoint.wallId) {
            const newPoints = [...wall.points];
            newPoints[selectedEndpoint.pointIndex] = point;
            
            // 同步更新pointIds数组，确保与points数组保持一致
            const newPointIds = wall.pointIds ? [...wall.pointIds] : new Array(newPoints.length).fill(null);
            // 确保pointIds数组长度与points数组一致
            while (newPointIds.length < newPoints.length) {
              newPointIds.push(null);
            }
            
            return { ...wall, points: newPoints, pointIds: newPointIds };
          }
          return wall;
        }));
      }
    } else if (isDraggingFloorEndpoint && selectedFloorEndpoint) {
      // 拖拽地面端点
      setFloorAreas(prev => prev.map(floor => {
        if (floor.id === selectedFloorEndpoint.floorId) {
          const newPoints = [...floor.points];
          newPoints[selectedFloorEndpoint.pointIndex] = point;
          return { ...floor, points: newPoints };
        }
        return floor;
      }));
    } else {
      // 框选更新逻辑已移至全局事件监听器中处理
      // 检测端点悬停
      let foundHoveredEndpoint = null;
      for (const wall of walls) {
        const hoveredEndpoint = checkEndpointHover(point, wall);
        if (hoveredEndpoint) {
          foundHoveredEndpoint = hoveredEndpoint;
          break;
        }
      }
      setHoveredEndpoint(foundHoveredEndpoint);
      
      // 检测地面端点悬停
      let foundHoveredFloorEndpoint = null;
      for (const floor of floorAreas) {
        const hoveredFloorEndpoint = checkFloorEndpointHover(point, floor);
        if (hoveredFloorEndpoint) {
          foundHoveredFloorEndpoint = hoveredFloorEndpoint;
          break;
        }
      }
      setHoveredFloorEndpoint(foundHoveredFloorEndpoint);
      
      // 只在实际绘制状态下查找附近端点
      // 使用ref值获取最新状态，避免状态更新时序问题
      const currentIsConnecting = isConnectingRef.current;
      const currentContinuousConnecting = continuousConnectingRef.current;
      

      
      if (activeTool && activeTool.type === 'wall' && (isDrawingWall || currentIsConnecting || currentContinuousConnecting)) {
        const nearby = findNearbyEndpoints(point, walls);
        setNearbyEndpoints(nearby);
        console.log('🔍 设置附近端点:', { nearbyLength: nearby.length });
      } else {
        setNearbyEndpoints([]);
      }
    }
    
    // 地面绘制预览 - 当有地面绘制点时显示虚线跟随
    if (activeTool && activeTool.type === 'floor' && isDrawingFloor && currentFloorPoints.length > 0) {
      setFloorPreviewMousePos(point);
    } else {
      setFloorPreviewMousePos(null);
    }
    
    // 地图编辑器风格的连线预览 - 使用优化的鼠标位置更新
    if (activeTool && activeTool.type === 'wall' && (isConnecting || continuousConnecting)) {
      updateMousePositionOptimized(point.x, point.y);
    } else if (activeTool && activeTool.type === 'wall' && isDrawingWall) {
      // 保持原有的绘制预览
      setMousePosition(point);
    } else {
      setMousePosition(null);
      // 清除连线预览
      if (mousePositionRef.current) {
        mousePositionRef.current = null;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // 重置光标状态
    const canvas = canvasRef.current;
    if (canvas) {
      if (canvasOperationMode === 'drag') {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'default';
      }
    }
    
    // 结束贝塞尔曲线控制点拖拽
    if (bezierDrawingState.isDraggingControl) {
      setBezierDrawingState(prev => ({
        ...prev,
        isDraggingControl: false,
        activeControlPoint: null
      }));
    }

    // 结束贝塞尔曲线编辑模式下的控制点拖拽
    if (bezierEditMode.isDraggingControl) {
      setBezierEditMode(prev => ({
        ...prev,
        isDraggingControl: false,
        activeControlPoint: null
      }));
    }
    
    // 结束端点拖拽
    if (isDraggingEndpoint) {
      setIsDraggingEndpoint(false);
      // 保持端点选中状态，不清除 selectedEndpoint，以支持键盘移动功能
      console.log('🔚 结束端点拖拽，保持选中状态');
    }
    
    // 结束地面端点拖拽
    if (isDraggingFloorEndpoint) {
      setIsDraggingFloorEndpoint(false);
      // 保持地面端点选中状态，以支持键盘移动功能
      console.log('🔚 结束地面端点拖拽，保持选中状态');
    }
    
    // 结束CNC机台拖拽
    if (isDraggingCNCMachine) {
      setIsDraggingCNCMachine(false);
      setDraggedCNCMachineId(null);
      setDragStartPosition(null);
      console.log('🔚 结束CNC机台拖拽');
    }
    
    // 结束拖动画布
    if (isDragging) {
      setIsDragging(false);
      setDragStart({ x: 0, y: 0 });
      console.log('🔚 结束拖动画布');
      
      // 恢复画布光标样式
      const canvas = canvasRef.current;
      if (canvas) {
        if (canvasOperationMode === 'drag') {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    }

    // 框选结束逻辑已移至全局事件监听器中处理
  };

  // 获取框选区域内的墙体
  // 检测线段与矩形是否相交的工具函数
  const lineIntersectsRect = (x1: number, y1: number, x2: number, y2: number, rectX1: number, rectY1: number, rectX2: number, rectY2: number): boolean => {
    // 检查线段端点是否在矩形内
    const pointInRect = (x: number, y: number) => {
      return x >= rectX1 && x <= rectX2 && y >= rectY1 && y <= rectY2;
    };
    
    if (pointInRect(x1, y1) || pointInRect(x2, y2)) {
      return true;
    }
    
    // 检查线段是否与矩形的四条边相交
    const lineIntersectsLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean => {
      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 1e-10) return false; // 平行线
      
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
      
      return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    };
    
    // 检查与矩形四条边的相交
    return lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY1) || // 上边
           lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY1, rectX2, rectY2) || // 右边
           lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY2, rectX1, rectY2) || // 下边
           lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY2, rectX1, rectY1);   // 左边
  };

  const getWallsInSelection = (start: WallPoint, end: WallPoint): string[] => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    return walls.filter(wall => {
      // 对于直线墙体，检查线段是否与框选矩形相交
      if (wall.type === 'line' && wall.points.length >= 2) {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i];
          const p2 = wall.points[i + 1];
          
          // 使用线段与矩形相交算法
          if (lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, minX, minY, maxX, maxY)) {
            return true;
          }
        }
      }
      
      // 对于贝塞尔曲线墙体，检查控制点或端点是否在选择区域内
      // 这里简化处理，检查所有点是否在选择区域内
      return wall.points.some(point => 
        point.x >= minX && point.x <= maxX && 
        point.y >= minY && point.y <= maxY
      );
    }).map(wall => wall.id);
  };

  // 获取框选区域内的CNC机台
  const getCNCMachinesInSelection = (start: WallPoint, end: WallPoint): string[] => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    return cncMachines.filter(machine => {
      // 使用机台的实际尺寸，如果没有设置则使用默认值，并确保最小选择区域
        const minSelectSize = 8; // 最小选择区域
        const machineWidth = Math.max(machine.width3D || machine.width || 30, minSelectSize);
        const machineHeight = Math.max(machine.height3D || machine.height || 30, minSelectSize);
      
      // 检查CNC机台的矩形区域是否与框选矩形相交
      const machineMinX = machine.x - machineWidth / 2;
      const machineMaxX = machine.x + machineWidth / 2;
      const machineMinY = machine.y - machineHeight / 2;
      const machineMaxY = machine.y + machineHeight / 2;
      
      // 矩形相交检测：两个矩形相交当且仅当它们在x轴和y轴上都有重叠
      const xOverlap = machineMaxX >= minX && machineMinX <= maxX;
      const yOverlap = machineMaxY >= minY && machineMinY <= maxY;
      
      return xOverlap && yOverlap;
    }).map(machine => machine.id);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(3, prev * delta)));
    
    // 确保画布在缩放后保持焦点
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  };

  // 墙体绘制处理
  const handleWallDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    if (!activeTool || activeTool.type !== 'wall') return;

    const point = screenToCanvas(e.clientX, e.clientY);

    if (activeTool.subType === 'line') {
      handleLineWallDrawing(point);
    } else if (activeTool.subType === 'bezier') {
      handleBezierWallDrawing(point);
    }
  };

  // 直线墙体绘制（采用地图编辑器的连线逻辑，支持共享端点）
  const handleLineWallDrawing = (point: WallPoint) => {
    // 检查是否点击了附近的端点
    const clickRadius = 15 / scale; // 点击半径，考虑缩放
    const nearbyEndpoint = nearbyEndpoints.find(endpoint => {
      const distance = Math.sqrt(
        Math.pow(endpoint.point.x - point.x, 2) + 
        Math.pow(endpoint.point.y - point.y, 2)
      );
      return distance < clickRadius;
    });

    if (!isConnecting && !continuousConnecting) {
      // 开始连线模式
      setIsConnecting(true);
      
      let startPoint = point;
      // 如果点击了附近的端点，从该端点开始绘制
      if (nearbyEndpoint) {
        startPoint = nearbyEndpoint.point;
        message.info('从现有端点开始绘制直线');
      } else {
        message.info('点击第二个点完成直线绘制');
      }
      
      setConnectingStartPoint(startPoint);
      // 清除之前的鼠标位置，确保虚线渲染状态正确
      setMousePosition(null);
      mousePositionRef.current = null;
      
    } else if (continuousConnecting || (isConnecting && connectingStartPoint)) {
      // 连续连线模式或完成当前连线
      let startPoint = lastConnectedPoint || connectingStartPoint;
      
      if (startPoint && (startPoint.x !== point.x || startPoint.y !== point.y)) {
        let endPoint = point;
        
        // 如果点击了附近的端点，连接到该端点
        if (nearbyEndpoint) {
          endPoint = nearbyEndpoint.point;
          message.success('直线已连接到现有端点');
        } else {
          message.success('直线绘制完成');
        }
        
        // 创建新的墙体ID
        const newWallId = `wall-${Date.now()}`;
        
        // 处理共享端点逻辑 - 修复阈值不一致问题和位置精确匹配
        const processSharedPoint = (point: WallPoint, wallId: string, pointIndex: number): { pointId: string | null, actualPoint: WallPoint } => {
          // 统一使用15像素作为共享端点检测阈值
          const sharedPointThreshold = 15;
          
          // 首先检查是否已存在共享端点
          const existingSharedPoint = findNearbySharedPoint(point.x, point.y, sharedPointThreshold);
          if (existingSharedPoint) {
            addWallToSharedPoint(existingSharedPoint.id, wallId, pointIndex);
            // 返回共享端点的精确位置
            return { pointId: existingSharedPoint.id, actualPoint: { x: existingSharedPoint.x, y: existingSharedPoint.y } };
          }
          
          // 实时查找附近的墙体端点（不依赖nearbyEndpoints状态）
          const nearbyWallEndpoints = findNearbyEndpoints(point, walls, sharedPointThreshold).filter(ep => 
            ep.wallId !== wallId
          );
          const nearbyWallEndpoint = nearbyWallEndpoints.length > 0 ? nearbyWallEndpoints[0] : null;
          
          if (nearbyWallEndpoint) {
            // 创建共享端点并连接现有墙体和新墙体
            // 使用现有端点的精确位置作为共享端点位置
            const sharedPointId = createSharedPoint(nearbyWallEndpoint.point.x, nearbyWallEndpoint.point.y);
            addWallToSharedPoint(sharedPointId, nearbyWallEndpoint.wallId, nearbyWallEndpoint.pointIndex);
            addWallToSharedPoint(sharedPointId, wallId, pointIndex);
            // 返回共享端点的精确位置
            return { pointId: sharedPointId, actualPoint: { x: nearbyWallEndpoint.point.x, y: nearbyWallEndpoint.point.y } };
          }
          
          // 没有找到共享端点，返回原始位置
          return { pointId: null, actualPoint: point };
        };
        
        const startPointResult = processSharedPoint(startPoint, newWallId, 0);
        const endPointResult = processSharedPoint(endPoint, newWallId, 1);
        
        // 使用精确的端点位置创建墙体
        const actualStartPoint = startPointResult.actualPoint;
        const actualEndPoint = endPointResult.actualPoint;
        
        // 创建新的墙体
        const newWall: Wall = {
          id: newWallId,
          type: 'line',
          points: [actualStartPoint, actualEndPoint],
          pointIds: [startPointResult.pointId, endPointResult.pointId], // 保持与points数组一一对应，允许null值
          thickness: wallStyle.thickness,
          color: wallStyle.color,
          completed: true
        };
        
        // 添加到墙体列表
        setWalls(prev => [...prev, newWall]);
        
        // 更新最后连接的点，为下一次连线做准备 - 使用精确的端点位置
        setLastConnectedPoint(actualEndPoint);
        // 启用连续连线模式
        setContinuousConnecting(true);
        continuousConnectingRef.current = true;
        
      } else {
        // 起始点和结束点相同，不创建连线
        if (startPoint && startPoint.x === point.x && startPoint.y === point.y) {
          message.warning('不能在同一个点上创建墙体！');
        }
      }
    }
  };

  // 贝塞尔曲线墙体绘制 - 连续多点绘制模式
  const handleBezierWallDrawing = (point: WallPoint) => {
    
    if (continuousConnecting && lastConnectedPoint) {
      // 连续绘制模式：使用上一个终点作为起点，当前点作为终点
      const startPoint = lastConnectedPoint;
      const endPoint = point;
      
      // 计算默认控制点位置
      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      );
      const controlOffset = distance * 0.3;
      
      // 计算垂直于连线的方向向量
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        // 归一化方向向量
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        
        // 计算垂直向量（顺时针旋转90度）
        const perpDx = normalizedDy;
        const perpDy = -normalizedDx;
        
        // 默认控制点位置
        const defaultControlPoint1: WallPoint = {
          x: startPoint.x + normalizedDx * controlOffset + perpDx * controlOffset * 0.5,
          y: startPoint.y + normalizedDy * controlOffset + perpDy * controlOffset * 0.5
        };
        
        const defaultControlPoint2: WallPoint = {
          x: endPoint.x - normalizedDx * controlOffset + perpDx * controlOffset * 0.5,
          y: endPoint.y - normalizedDy * controlOffset + perpDy * controlOffset * 0.5
        };
        
        // 立即完成贝塞尔曲线绘制，并继续连续绘制模式
        finishBezierCurveWithPoints(startPoint, endPoint, defaultControlPoint1, defaultControlPoint2, true);
        message.info('已绘制曲线段，继续点击下一个点或按ESC结束');
      }
    } else {
      // 开始新的连续绘制序列
      setLastConnectedPoint(point);
      setContinuousConnecting(true);
      continuousConnectingRef.current = true;
      message.info('已设置起点，继续点击下一个点绘制曲线');
    }
  };

  // 完成贝塞尔曲线绘制
  // 使用指定点完成贝塞尔曲线绘制（新函数，支持两点绘制模式）
  const finishBezierCurveWithPoints = (
    startPoint: WallPoint, 
    endPoint: WallPoint, 
    controlPoint1: WallPoint, 
    controlPoint2: WallPoint,
    shiftKey: boolean = false
  ) => {
    // 创建新的贝塞尔曲线墙体
    const newWallId = `wall-${Date.now()}`;
    
    // 处理共享端点逻辑
    const processSharedPoint = (point: WallPoint, wallId: string, pointIndex: number): { pointId: string | null, actualPoint: WallPoint } => {
      const sharedPointThreshold = 15;
      
      const existingSharedPoint = findNearbySharedPoint(point.x, point.y, sharedPointThreshold);
      if (existingSharedPoint) {
        addWallToSharedPoint(existingSharedPoint.id, wallId, pointIndex);
        return { pointId: existingSharedPoint.id, actualPoint: { x: existingSharedPoint.x, y: existingSharedPoint.y } };
      }
      
      const nearbyWallEndpoints = findNearbyEndpoints(point, walls, sharedPointThreshold).filter(ep => 
        ep.wallId !== wallId
      );
      const nearbyWallEndpoint = nearbyWallEndpoints.length > 0 ? nearbyWallEndpoints[0] : null;
      
      if (nearbyWallEndpoint) {
        const sharedPointId = createSharedPoint(nearbyWallEndpoint.point.x, nearbyWallEndpoint.point.y);
        addWallToSharedPoint(sharedPointId, nearbyWallEndpoint.wallId, nearbyWallEndpoint.pointIndex);
        addWallToSharedPoint(sharedPointId, wallId, pointIndex);
        return { pointId: sharedPointId, actualPoint: { x: nearbyWallEndpoint.point.x, y: nearbyWallEndpoint.point.y } };
      }
      
      return { pointId: null, actualPoint: point };
    };

    const startPointResult = processSharedPoint(startPoint, newWallId, 0);
    const endPointResult = processSharedPoint(endPoint, newWallId, 3);

    // 创建贝塞尔曲线墙体（使用4个点的格式：起点、控制点1、控制点2、终点）
    const newWall: Wall = {
      id: newWallId,
      type: 'bezier',
      points: [startPointResult.actualPoint, controlPoint1, controlPoint2, endPointResult.actualPoint],
      pointIds: [startPointResult.pointId, null, null, endPointResult.pointId], // 只有起点和终点可能有共享端点
      thickness: wallStyle.thickness,
      color: wallStyle.color,
      completed: true
    };

    setWalls(prev => [...prev, newWall]);
    
    if (shiftKey) {
      // 连续绘制模式：启用连续连线模式，将当前终点作为下一条曲线的起点
      setContinuousConnecting(true);
      continuousConnectingRef.current = true;
      setLastConnectedPoint(endPoint);
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: false,
        lastEndPoint: null
      });
      message.success('贝塞尔曲线绘制完成！继续点击绘制下一条曲线，按ESC键退出连续绘制');
    } else {
      // 单次绘制模式：完全重置状态
      setBezierDrawingState({
        phase: 'idle',
        startPoint: null,
        endPoint: null,
        controlPoint1: null,
        controlPoint2: null,
        isDraggingControl: false,
        activeControlPoint: null,
        continuousMode: false,
        lastEndPoint: null
      });
      message.success('贝塞尔曲线绘制完成！');
    }
  };



  // 地面绘制处理函数
  const handleFloorDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const activeTool = getActiveTool();
    if (!activeTool || activeTool.type !== 'floor') return;

    const point = screenToCanvas(e.clientX, e.clientY);

    // 添加点到当前绘制的地面区域
    setCurrentFloorPoints(prev => [...prev, point]);

    // 显示顶点
    setShowFloorVertices(true);

    // 设置定时器隐藏顶点
    setTimeout(() => {
      setShowFloorVertices(false);
    }, 1500); // 1.5秒后隐藏顶点

    // 如果是第一个点，显示提示信息
    if (currentFloorPoints.length === 0) {
      message.info('继续点击添加地面区域的边界点，至少需要3个点');
    } else if (currentFloorPoints.length === 1) {
      message.info('继续点击添加第三个点，或ESC键完成绘制');
    } else {
      message.info(`已添加${currentFloorPoints.length + 1}个点，ESC键完成绘制或继续添加点`);
    }
  };

  // 右键菜单处理函数
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // 阻止默认右键菜单

    // 右键菜单功能已移除，地面绘制现在使用ESC键完成
    // 可以在这里添加其他右键菜单功能
  };

  // 选择工具相关函数
  const handleSelectionStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🎯 handleSelectionStart 被调用！');
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    const point = { x, y };
    
    console.log('🎯 点击事件开始:', { 
      screenX: e.clientX, 
      screenY: e.clientY, 
      rectLeft: rect.left, 
      rectTop: rect.top,
      canvasX: e.clientX - rect.left,
      canvasY: e.clientY - rect.top,
      worldX: x, 
      worldY: y, 
      scale, 
      offsetX, 
      offsetY 
    });

    // 获取当前激活的工具
    const activeTool = getActiveTool();
    const isSelectTool = activeTool?.type === 'select';
    
    console.log('🎯 点击检测:', { x, y, isSelectTool, activeTool: activeTool?.type });

    // 检查是否点击了墙体端点 - 端点选择优先级最高
    const endpointHit = checkEndpointClick(point, walls);
    console.log('端点检测:', { endpointHit });
    if (endpointHit) {
      console.log('端点命中:', endpointHit);
      setSelectedEndpoint(endpointHit);
      selectedEndpointRef.current = endpointHit;
      setIsDraggingEndpoint(true);
      // 清除其他选择状态
      setSelectedWalls([]);
      setSelectedSegments([]);
      setSelectedFloorAreas([]);
      setSelectedFloorEndpoint(null);
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      return;
    }

    // 检查是否点击了地面端点 - 地面端点选择优先级次高
    const floorEndpointHit = checkFloorEndpointClick(point, floorAreas);
    console.log('地面端点检测:', { floorEndpointHit });
    if (floorEndpointHit && isSelectTool) {
      console.log('地面端点命中:', floorEndpointHit);
      setSelectedFloorEndpoint(floorEndpointHit);
      setIsDraggingFloorEndpoint(true);
      // 清除其他选择状态
      setSelectedWalls([]);
      setSelectedSegments([]);
      setSelectedFloorAreas([]);
      setSelectedEndpoint(null);
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      return;
    }

    // 检查是否点击了线段
    const segmentHit = checkSegmentHit(x, y);
    console.log('线段检测:', { segmentHit });

    // 检查是否点击了墙体
    const wallHit = checkWallHit(x, y);
    console.log('墙体检测:', { wallHit, isSelectTool });
    
    // 处理墙体点击 - 只在选择工具模式下响应
    if (wallHit && isSelectTool) {
      const currentTime = Date.now();
      const clickedWall = walls.find(wall => wall.id === wallHit);
      
      console.log('墙体点击处理:', { 
        wallHit, 
        clickedWall: clickedWall ? {
          id: clickedWall.id,
          type: clickedWall.type,
          points: clickedWall.points,
          selected: clickedWall.selected
        } : null, 
        isSelectTool 
      });
      
      // 单击线段的选择逻辑 - 参考地图管理的实现
      if (clickedWall && clickedWall.completed) {
        console.log('点击了已完成的墙体:', {
          wallId: wallHit,
          wallType: clickedWall.type,
          currentBezierEditMode: bezierEditMode,
          isSelectTool,
          isDoubleClick: currentTime - lastClickTime < 300 && lastClickedWall === wallHit
        });
        
        // 检查是否为双击
        const isDoubleClick = currentTime - lastClickTime < 300 && lastClickedWall === wallHit;
        
        if (isDoubleClick) {
          // 双击打开属性面板
          console.log('双击打开属性面板:', wallHit);
          openPropertiesPanel(wallHit);
          setLastClickTime(0);
          setLastClickedWall(null);
          // 清空地面选择状态
          setSelectedFloorAreas([]);
          return;
        } else {
          // 单击选择墙体逻辑
          console.log('单击选择墙体:', wallHit);
          
          // 如果当前在编辑模式且点击的是其他墙体，退出编辑模式
          if (bezierEditMode.isEditing && bezierEditMode.wallId !== wallHit) {
            setBezierEditMode({
              isEditing: false,
              wallId: null,
              isDraggingControl: false,
              activeControlPoint: null
            });
            console.log('退出贝塞尔编辑模式');
          }
          
          // 实现单选逻辑：只选择当前点击的墙体
          setSelectedWalls(prev => {
            const isAlreadySelected = prev.includes(wallHit);
            if (isAlreadySelected) {
              // 如果已选中，取消选择
              console.log('取消选择墙体:', wallHit);
              return [];
            } else {
              // 单选：只选择当前点击的墙体
              console.log('选择墙体:', wallHit);
              return [wallHit];
            }
          });
          
          // 清除其他选择状态（包括地面选择）
          setSelectedSegments([]);
          setSelectedEndpoint(null);
          setSelectedFloorAreas([]);
          
          // 记录点击时间和墙体ID用于双击检测
          setLastClickTime(currentTime);
          setLastClickedWall(wallHit);
          return;
        }
      }
      
      // 记录点击时间和墙体ID
      setLastClickTime(currentTime);
      setLastClickedWall(wallHit);
      // 清空地面选择状态
      setSelectedFloorAreas([]);
      return;
    }

    // 如果没有墙体被点击，但有线段被检测到，则选择线段（只在选择工具模式下）
    if (segmentHit && isSelectTool) {
      console.log('备用线段选择逻辑:', segmentHit);
      // 单选线段逻辑
      setSelectedSegments(prev => {
        const existingIndex = prev.findIndex(
          seg => seg.wallId === segmentHit.wallId && seg.segmentIndex === segmentHit.segmentIndex
        );
        
        if (existingIndex >= 0) {
          // 如果点击的是已选中的线段，取消选择
          return [];
        } else {
          // 单选：只选择当前点击的线段
          return [segmentHit];
        }
      });
      
      // 清空其他选择状态
      setSelectedWalls([]);
      setSelectedFloorAreas([]);
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      return;
    }

    // 检查地面点击
    const floorHit = checkFloorHit(x, y);
    console.log('🔍 地面检测结果:', {
      floorHit: floorHit,
      点击坐标: { x, y },
      地面数量: floorAreas.length,
      地面ID: floorHit || '无',
      isSelectTool: isSelectTool,
      地面检测条件: floorHit && isSelectTool
    });
    
    if (floorHit && isSelectTool) {
      const hitFloor = floorAreas.find(floor => floor.id === floorHit);
      console.log('✅ 进入地面点击处理逻辑:', {
        floorHit: floorHit,
        地面名称: hitFloor?.name || '未知',
        地面坐标数量: hitFloor?.points?.length || 0,
        isSelectTool: isSelectTool
      });
      // 单选地面逻辑
      setSelectedFloorAreas(prev => {
        const existingIndex = prev.indexOf(floorHit);
        
        if (existingIndex >= 0) {
          // 如果点击的是已选中的地面，取消选择
          return [];
        } else {
          // 单选：只选择当前点击的地面
          return [floorHit];
        }
      });
      
      // 清空其他选择状态
      setSelectedWalls([]);
      setSelectedSegments([]);
      setSelectedEndpoint(null);
      setBezierEditMode({
        isEditing: false,
        wallId: null,
        isDraggingControl: false,
        activeControlPoint: null
      });
      return;
    }

    // 点击空白区域 - 清除所有选择状态
    setSelectedWalls([]);
    setSelectedSegments([]);
    setSelectedEndpoint(null);
    setIsDraggingEndpoint(false); // 清除墙体端点拖拽状态
    setHoveredEndpoint(null); // 清除墙体端点悬停状态
    setSelectedFloorAreas([]);
    setSelectedFloorEndpoint(null); // 清除地面端点选择
    setIsDraggingFloorEndpoint(false); // 清除地面端点拖拽状态
    setBezierEditMode({
      isEditing: false,
      wallId: null,
      isDraggingControl: false,
      activeControlPoint: null
    });
    
    // 开始框选
    setIsSelecting(true);
    setSelectionStart({ x: point.x, y: point.y });
    setSelectionEnd({ x: point.x, y: point.y });
    selectionStartRef.current = { x: point.x, y: point.y }; // 保存到ref中
    
    // 添加全局鼠标事件监听器，确保鼠标移出画布时框选仍能正常工作
    const handleGlobalMouseMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const screenX = event.clientX;
      const screenY = event.clientY;
      
      // 将屏幕坐标转换为画布坐标
      const canvasPoint = screenToCanvas(screenX, screenY);
      setSelectionEnd({ x: canvasPoint.x, y: canvasPoint.y });
    };
    
    const handleGlobalMouseUp = (event: MouseEvent) => {
      // 移除全局事件监听器
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      
      // 使用ref获取框选开始坐标，使用当前鼠标位置作为结束坐标
      const currentSelectionStart = selectionStartRef.current;
      const currentSelectionEnd = screenToCanvas(event.clientX, event.clientY);
      
      if (currentSelectionStart && currentSelectionEnd) {
        // 框选墙体（在所有视图模式下都可以框选墙体）
        const selectedWallIds = getWallsInSelection(currentSelectionStart, currentSelectionEnd);
        setSelectedWalls(selectedWallIds);
        console.log('🎯 框选墙体:', selectedWallIds);
        
        // 在顶视图模式下，同时框选CNC机台
        if (viewMode === 'top') {
          const selectedCNCMachineIds = getCNCMachinesInSelection(currentSelectionStart, currentSelectionEnd);
          setSelectedCNCMachines(selectedCNCMachineIds);
          console.log('🎯 框选CNC机台:', selectedCNCMachineIds);
        }
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      selectionStartRef.current = null;
    };
    
    // 添加全局事件监听器
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };



  // 检查墙体点击
  const checkWallHit = (x: number, y: number): string | null => {
    const hitThreshold = 15 / scale; // 墙体点击阈值，增加阈值使墙体更容易被选中
    const clickPoint = { x, y };
    
    console.log('🔍 checkWallHit 开始检测:', { 
      clickX: x, 
      clickY: y, 
      hitThreshold, 
      scale,
      thresholdInPixels: 10,
      wallsCount: walls.length 
    });
    
    for (const wall of walls) {
      console.log('🔎 检查墙体:', { 
        wallId: wall.id, 
        type: wall.type, 
        pointsLength: wall.points.length,
        completed: wall.completed,
        points: wall.points
      });
      
      // 只检查已完成的墙体
      if (!wall.completed) {
        console.log('⏭️ 跳过未完成的墙体:', wall.id);
        continue;
      }
      
      if (wall.type === 'line' && wall.points.length >= 2) {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i];
          const p2 = wall.points[i + 1];
          
          // 计算点到线段的距离
          const distance = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
          console.log('📏 直线墙体距离检测:', { 
            wallId: wall.id, 
            segmentIndex: i,
            p1: { x: p1.x, y: p1.y },
            p2: { x: p2.x, y: p2.y },
            clickPoint: { x, y },
            distance, 
            hitThreshold,
            isHit: distance <= hitThreshold
          });
          if (distance <= hitThreshold) {
            console.log('✅ 直线墙体命中:', wall.id);
            return wall.id;
          }
        }
      } else if (wall.type === 'bezier' && wall.points.length >= 4) {
        console.log('贝塞尔曲线检测:', { wallId: wall.id, points: wall.points });
        // 使用现有的getDistanceToWall函数计算点到贝塞尔曲线的距离
        const distance = getDistanceToWall(clickPoint, wall);
        console.log('贝塞尔曲线距离检测:', { wallId: wall.id, distance, hitThreshold });
        if (distance <= hitThreshold) {
          console.log('贝塞尔曲线命中:', wall.id);
          return wall.id;
        }
      }
    }
    console.log('没有墙体命中');
    return null;
  };

  // 检查线段点击 - 返回具体的线段信息（只处理直线墙体）
  const checkSegmentHit = (x: number, y: number): {wallId: string, segmentIndex: number} | null => {
    const hitThreshold = 15 / scale; // 线段点击阈值，与墙体检测阈值保持一致
    
    for (const wall of walls) {
      // 只处理直线墙体，贝塞尔曲线由 checkWallHit 函数专门处理
      if (wall.type === 'line' && wall.points.length >= 2) {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i];
          const p2 = wall.points[i + 1];
          
          // 计算点到线段的距离
          const distance = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
          if (distance <= hitThreshold) {
            return { wallId: wall.id, segmentIndex: i };
          }
        }
      }
      // 移除贝塞尔曲线检测逻辑，让 checkWallHit 函数专门处理贝塞尔曲线
    }
    return null;
  };

  // 检查地面点击 - 使用射线投射算法判断点是否在多边形内
  const checkFloorHit = (x: number, y: number): string | null => {
    for (const floor of floorAreas) {
      if (!floor.visible || !floor.completed || floor.points.length < 3) {
        continue;
      }
      
      // 使用射线投射算法判断点是否在多边形内
      let inside = false;
      const points = floor.points;
      
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      
      if (inside) {
        return floor.id;
      }
    }
    return null;
  };

  // 计算点到墙体的距离
  const getDistanceToWall = (point: WallPoint, wall: Wall): number => {
    if (wall.type === 'line') {
      // 直线墙体：计算点到线段的距离
      if (wall.points.length >= 2) {
        const p1 = wall.points[0];
        const p2 = wall.points[1];
        return pointToLineDistance(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
      }
    } else if (wall.type === 'bezier' && wall.points.length >= 4) {
      // 贝塞尔曲线墙体：采样多个点计算最小距离
      // 新格式：points数组包含 [起点, 控制点1, 控制点2, 终点]
      const p0 = wall.points[0]; // 起点
      const p1 = wall.points[1]; // 控制点1
      const p2 = wall.points[2]; // 控制点2
      const p3 = wall.points[3]; // 终点
      
      let minDistance = Infinity;
      const samples = 20; // 采样点数量
      
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        // 三次贝塞尔曲线公式
        const x = Math.pow(1 - t, 3) * p0.x + 
                  3 * Math.pow(1 - t, 2) * t * p1.x + 
                  3 * (1 - t) * Math.pow(t, 2) * p2.x + 
                  Math.pow(t, 3) * p3.x;
        const y = Math.pow(1 - t, 3) * p0.y + 
                  3 * Math.pow(1 - t, 2) * t * p1.y + 
                  3 * (1 - t) * Math.pow(t, 2) * p2.y + 
                  Math.pow(t, 3) * p3.y;
        
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        minDistance = Math.min(minDistance, distance);
      }
      
      return minDistance;
    }
    
    return Infinity;
  };

  // 计算点到线段的距离
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    
    if (param < 0) {
      return Math.sqrt(A * A + B * B);
    } else if (param > 1) {
      const E = px - x2;
      const F = py - y2;
      return Math.sqrt(E * E + F * F);
    } else {
      const projX = x1 + param * C;
      const projY = y1 + param * D;
      const G = px - projX;
      const H = py - projY;
      return Math.sqrt(G * G + H * H);
    }
  };

  // 打开属性面板
  const openPropertiesPanel = (wallId: string) => {
    const wall = walls.find(w => w.id === wallId);
    if (wall) {
      const formData = {
        wallId: wall.id,
        thickness: wall.thickness || 0.2,
        width: wall.width || 1.0,
        height: wall.height || 3.0,
        color: wall.color || '#000000'
      };
      setPropertiesFormData(formData);
      propertiesForm.setFieldsValue(formData);
      setShowPropertiesPanel(true);
    }
  };

  // 关闭属性面板
  const closePropertiesPanel = () => {
    setShowPropertiesPanel(false);
    setPropertiesFormData(null);
    propertiesForm.resetFields();
  };

  // 更新墙体属性
  const updateWallProperties = (values: any) => {
    if (!propertiesFormData) return;
    
    setWalls(prevWalls => 
      prevWalls.map(wall => 
        wall.id === propertiesFormData.wallId 
          ? {
              ...wall,
              thickness: values.thickness,
              width: values.width,
              height: values.height,
              color: values.color
            }
          : wall
      )
    );
    
    message.success('墙体属性更新成功');
    closePropertiesPanel();
  };

  // 实时更新地面属性
  const updateFloorPropertiesRealtime = (newProps: Partial<typeof selectedFloor3DProps>) => {
    if (floorAreas.length > 0) {
      setFloorAreas(prevFloors => 
        prevFloors.map(floor => ({
          ...floor,
          ...newProps
        }))
      );
    }
  };

  // 实时更新墙体属性
  const updateWallPropertiesRealtime = (newProps: Partial<typeof selectedWall3DProps>) => {
    if (!selectedWallId) return;

    setWalls(prevWalls => 
      prevWalls.map(wall => {
        if (wall.id === selectedWallId) {
          return {
            ...wall,
            width: newProps.width !== undefined ? newProps.width : wall.width,
            thickness: newProps.thickness !== undefined ? newProps.thickness * 100 : wall.thickness, // 转换为像素
            height: newProps.height !== undefined ? newProps.height * 100 : wall.height, // 转换为像素
            color: newProps.color !== undefined ? newProps.color : wall.color
          };
        }
        return wall;
      })
    );
  };



  // 重置地面属性
  const resetFloorProperties = () => {
    const resetProps = {
      thickness: 0.2,
      color: '#8B4513',
      opacity: 0.8
    };
    setSelectedFloor3DProps(resetProps);
    // 实时更新地面属性
    updateFloorPropertiesRealtime(resetProps);
    message.info('地面属性已重置');
  };

  // 打开CNC机台属性面板
  const openCNCPropertiesPanel = (cncId: string) => {
    console.log('🔧 [DEBUG] openCNCPropertiesPanel - 开始打开CNC属性面板, cncId:', cncId);
    
    const cnc = cncMachines.find(c => c.id === cncId);
    console.log('🔧 [DEBUG] openCNCPropertiesPanel - 找到的CNC机台数据:', cnc);
    
    if (cnc) {
      console.log('🎯 [模型] openCNCPropertiesPanel - CNC机台GLB模型字段:', {
        currentModel: cnc.currentModel,
        modelFile: cnc.modelFile,
        modelUrl: cnc.modelUrl,
        modelFileName: cnc.modelFileName
      });
      
      // 为自定义GLB模型重新生成有效的URL
      let modelUrl = cnc.modelUrl;
      if (cnc.currentModel === 'custom' && cnc.modelFile) {
        // 释放旧的URL（如果存在）
        if (cnc.modelUrl && cnc.modelUrl.startsWith('blob:')) {
          URL.revokeObjectURL(cnc.modelUrl);
        }
        // 为模型文件创建新的有效URL
        modelUrl = URL.createObjectURL(cnc.modelFile);
        console.log('🔧 [DEBUG] openCNCPropertiesPanel - 为GLB模型重新生成URL:', modelUrl);
      }

      const formData = {
        cncId: cnc.id,
        name: cnc.name || 'CNC机台-001',
        // 注意：表单中的width/height字段对应3D尺寸，需要从width3D/height3D获取
        width: cnc.width3D || 3.0,    // 表单的width字段显示width3D值
        height: cnc.height3D || 2.5,  // 表单的height字段显示height3D值
        depth3D: cnc.depth3D || 2.0,

        color: cnc.color || '#4A90E2',
        opacity: cnc.opacity || 1.0,
        scale: cnc.scale || 1.0,
        rotationX: cnc.rotation?.x || 0,
        rotationY: cnc.rotation?.y || 0,
        rotationZ: cnc.rotation?.z || 0,
        // 模型相关字段 - 使用重新生成的URL
        currentModel: cnc.currentModel || 'default',
        modelFile: cnc.modelFile || null,
        modelUrl: modelUrl,
        modelFileName: cnc.modelFileName || undefined
      };
      
      console.log('🔧 [DEBUG] openCNCPropertiesPanel - 构建的表单数据:', formData);
      console.log('🎯 [模型] openCNCPropertiesPanel - 表单数据中的GLB模型字段:', {
        currentModel: formData.currentModel,
        modelFile: formData.modelFile,
        modelUrl: formData.modelUrl,
        modelFileName: formData.modelFileName
      });
      
      // 如果重新生成了URL，同时更新CNC机台数据中的URL，确保数据一致性
      if (formData.currentModel === 'custom' && cnc.modelFile && formData.modelUrl !== cnc.modelUrl) {
        const updatedCncMachines = cncMachines.map(machine => 
          machine.id === cncId 
            ? { ...machine, modelUrl: formData.modelUrl }
            : machine
        );
        setCncMachines(updatedCncMachines);
        console.log('🔧 [DEBUG] openCNCPropertiesPanel - 已更新CNC机台数据中的URL');
      }
      
      setCncPropertiesFormData(formData);
      cncPropertiesForm.setFieldsValue(formData);
      setShowCNCPropertiesPanel(true);
      
      console.log('🔧 [DEBUG] openCNCPropertiesPanel - 属性面板已打开，3D预览将由useEffect处理');
    } else {
      console.error('❌ [DEBUG] openCNCPropertiesPanel - 未找到CNC机台, cncId:', cncId);
    }
  };

  // 关闭CNC机台属性面板
  const closeCNCPropertiesPanel = () => {
    console.log('🔧 [DEBUG] closeCNCPropertiesPanel 开始执行');
    console.log('🔧 [DEBUG] 关闭前 - CNC机台总数:', cncMachines.length);
    console.log('🔧 [DEBUG] 关闭前 - 选中的CNC机台:', selectedCNCMachines);
    console.log('🔧 [DEBUG] 关闭前 - 表单数据:', cncPropertiesFormData);
    
    setShowCNCPropertiesPanel(false);
    setCncPropertiesFormData(null);
    cncPropertiesForm.resetFields();
    
    // 清理选中的CNC机台状态，避免状态不一致导致的显示问题
    setSelectedCNCMachines([]);
    
    // 清理3D预览场景
    if (cncPreviewRendererRef.current) {
      cncPreviewRendererRef.current.dispose();
      cncPreviewRendererRef.current = null;
    }
    if (cncPreviewControlsRef.current) {
      cncPreviewControlsRef.current.dispose();
      cncPreviewControlsRef.current = null;
    }
    cncPreviewSceneRef.current = null;
    cncPreviewCameraRef.current = null;
    cncPreviewMeshRef.current = null;
    
    console.log('🔧 [DEBUG] closeCNCPropertiesPanel 执行完成');
    console.log('🔧 [DEBUG] 关闭后 - CNC机台总数:', cncMachines.length);
    
    // 强制重新绘制画布
    setTimeout(() => {
      console.log('🔧 [DEBUG] 延迟重绘画布');
      drawCanvas();
    }, 100);
  };

  // 处理模型文件导入
  const handleModelFileImport = async (file: File) => {
    if (!cncPropertiesFormData) return;

    try {
      setIsImportingModel(true);
      setModelImportProgress(0);

      // 模拟文件处理进度
      const progressInterval = setInterval(() => {
        setModelImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 创建文件URL用于预览
      const fileUrl = URL.createObjectURL(file);
      
      console.log('🎯 [模型] GLB模型导入 - 文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl
      });
      
      // 更新表单数据 - 注意：不保存File对象，只保存文件信息
      const updatedFormData = {
        ...cncPropertiesFormData,
        currentModel: 'custom',
        modelFile: null, // 不保存File对象，避免序列化问题
        modelUrl: fileUrl,
        modelFileName: file.name
      };
      
      setCncPropertiesFormData(updatedFormData);
      
      // 同步更新表单字段值
      if (cncPropertiesForm) {
        cncPropertiesForm.setFieldsValue({
          currentModel: 'custom',
          modelFile: null, // 不保存File对象
          modelUrl: fileUrl,
          modelFileName: file.name
        });
      }
      
      console.log('🎯 [模型] GLB模型导入 - 更新后的表单数据:', updatedFormData);
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setModelImportProgress(100);
      message.success(`模型文件 "${file.name}" 导入成功！`);
      
      // 更新3D预览
      updateCNCPreview(updatedFormData);
      
    } catch (error) {
      console.error('模型文件导入失败:', error);
      message.error('模型文件导入失败，请检查文件格式');
    } finally {
      setIsImportingModel(false);
      setTimeout(() => setModelImportProgress(0), 1000);
    }
  };

  // 处理预设模型切换
  const handlePresetModelChange = (presetId: string) => {
    if (!cncPropertiesFormData) return;

    const preset = availablePresetModels.find(p => p.id === presetId);
    if (!preset) return;

    const updatedFormData = {
      ...cncPropertiesFormData,
      currentModel: presetId,
      modelFile: null,
      modelUrl: preset.url || undefined,
      modelFileName: undefined
    };
    
    setCncPropertiesFormData(updatedFormData);
    
    // 同步更新表单字段值
    if (cncPropertiesForm) {
      cncPropertiesForm.setFieldsValue({
        currentModel: presetId,
        modelFile: null,
        modelUrl: preset.url || undefined,
        modelFileName: undefined
      });
    }
    
    message.success(`已切换到 "${preset.name}" 模型`);
    
    // 更新3D预览
    updateCNCPreview(updatedFormData);
  };

  // 更新CNC 3D预览
  const updateCNCPreview = (formData: typeof cncPropertiesFormData) => {
    console.log('🔄 updateCNCPreview 被调用，参数:', {
      formData: formData ? {
        currentModel: formData.currentModel,
        modelUrl: formData.modelUrl,
        modelFile: formData.modelFile?.name
      } : null,
      hasScene: !!cncPreviewSceneRef.current,
      hasRenderer: !!cncPreviewRendererRef.current
    });
    
    if (!formData || !cncPreviewSceneRef.current || !cncPreviewRendererRef.current) {
      console.warn('⚠️ updateCNCPreview 提前返回，缺少必要条件');
      return;
    }

    // 移除现有的机台模型
    if (cncPreviewMeshRef.current) {
      cncPreviewSceneRef.current.remove(cncPreviewMeshRef.current);
      cncPreviewMeshRef.current = null;
    }

    // 处理自定义GLB模型
    if (formData.currentModel === 'custom' && formData.modelUrl) {
      console.log('🎯 [模型] 开始加载自定义GLB模型:', {
        modelUrl: formData.modelUrl,
        modelFileName: formData.modelFileName,
        modelFileExists: !!formData.modelFile
      });
      
      // 严格的文件大小验证
      if (formData.modelFile) {
        const fileSizeMB = formData.modelFile.size / (1024 * 1024);
        console.log('📊 [模型] GLB文件大小:', fileSizeMB.toFixed(2) + 'MB');
        
        // 大幅降低文件大小限制到10MB，避免WebAssembly内存溢出
        if (fileSizeMB > 10) {
          console.error('❌ [模型] GLB文件过大:', fileSizeMB.toFixed(2) + 'MB');
          message.error(`GLB文件过大 (${fileSizeMB.toFixed(1)}MB)，为避免内存溢出，请使用小于10MB的文件`);
          createDefaultPreviewMesh(formData);
          return;
        }
        
        // 中等文件警告
        if (fileSizeMB > 5) {
          message.warning(`GLB文件较大 (${fileSizeMB.toFixed(1)}MB)，加载可能需要较长时间`);
        }
      }
      
      const loader = new GLTFLoader();
      
      // 🔧 启用DRACOLoader但采用保守的内存管理策略
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/'); // 使用本地Draco解码器文件
      dracoLoader.setWorkerLimit(1); // 限制为1个工作线程以减少内存占用
      loader.setDRACOLoader(dracoLoader);
      
      console.log('⚠️ [模型] 使用本地DRACOLoader（保守内存管理：1个工作线程）');
      
      // 添加超时处理
      const loadingTimeout = setTimeout(() => {
        console.error('❌ [模型] GLB加载超时');
        message.error('GLB模型加载超时，请尝试使用更小的文件');
        createDefaultPreviewMesh(formData);
      }, 30000); // 30秒超时
      
      loader.load(
        formData.modelUrl,
        (gltf) => {
          clearTimeout(loadingTimeout);
          
          const model = gltf.scene;
          
          // 设置模型属性
          model.position.set(0, 0, 0);
          model.scale.setScalar(formData.scale);
          model.rotation.set(
            (formData.rotationX * Math.PI) / 180,
            (formData.rotationY * Math.PI) / 180,
            (formData.rotationZ * Math.PI) / 180
          );

          // 遍历模型中的所有网格，设置基本属性
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // 只设置透明度，保留原始颜色
              if (child.material) {
                if (Array.isArray(child.material)) {
                   child.material.forEach((mat) => {
                     if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshLambertMaterial) {
                       // 保留原始颜色，只设置透明度
                       mat.transparent = formData.opacity < 1;
                       mat.opacity = formData.opacity;
                     }
                   });
                 } else if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshLambertMaterial) {
                   // 保留原始颜色，只设置透明度
                   child.material.transparent = formData.opacity < 1;
                   child.material.opacity = formData.opacity;
                 }
              }
            }
          });

          // 添加到场景
          if (cncPreviewSceneRef.current) {
            cncPreviewSceneRef.current.add(model);
            cncPreviewMeshRef.current = model as any; // GLB模型是Group类型，需要类型转换
            
            // 渲染场景
            if (cncPreviewControlsRef.current) {
              cncPreviewControlsRef.current.update();
            }
            cncPreviewRendererRef.current?.render(cncPreviewSceneRef.current, cncPreviewCameraRef.current!);
            
            console.log('✅ [模型] GLB模型已成功加载并渲染到预览场景:', {
              modelFileName: formData.modelFileName,
              modelPosition: model.position,
              modelScale: model.scale,
              modelRotation: model.rotation
            });
            
            // 清理DRACOLoader资源
            dracoLoader.dispose();
          }
        },
        (progress) => {
          const percentage = (progress.loaded / progress.total * 100).toFixed(1);
          console.log('📈 [模型] GLB模型加载进度:', percentage + '%');
        },
        (error: unknown) => {
          clearTimeout(loadingTimeout);
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          console.error('❌ [GLB_LOAD] GLB模型加载失败:', {
            error: error,
            errorMessage: errorMessage,
            modelUrl: formData.modelUrl,
            modelFileName: formData.modelFileName
          });
          
          // 清理DRACOLoader资源
          dracoLoader.dispose();
          
          // 检查是否是Draco解码器相关错误，尝试降级处理
          if (errorMessage && (errorMessage.includes('draco') || errorMessage.includes('WebAssembly') || errorMessage.includes('decoder'))) {
            console.warn('⚠️ [GLB_LOAD] Draco解码器错误，尝试不使用Draco重新加载...');
            message.warning('Draco解码器加载失败，正在尝试标准GLB加载...');
            
            // 降级：不使用DRACOLoader重新尝试加载
            const fallbackLoader = new GLTFLoader();
            const fallbackTimeout = setTimeout(() => {
              console.error('❌ [模型] GLB降级加载也超时');
              message.error('GLB模型加载失败，请检查文件格式');
              createDefaultPreviewMesh(formData);
            }, 20000); // 20秒超时
            
            fallbackLoader.load(
               formData.modelUrl!,
              (gltf) => {
                clearTimeout(fallbackTimeout);
                console.log('✅ [GLB_LOAD] 降级加载成功（未使用Draco压缩）');
                message.success('GLB模型加载成功（标准模式）');
                
                const model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.setScalar(formData.scale);
                model.rotation.set(
                  (formData.rotationX * Math.PI) / 180,
                  (formData.rotationY * Math.PI) / 180,
                  (formData.rotationZ * Math.PI) / 180
                );

                model.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                      if (Array.isArray(child.material)) {
                         child.material.forEach((mat) => {
                           if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshLambertMaterial) {
                             mat.transparent = formData.opacity < 1;
                             mat.opacity = formData.opacity;
                           }
                         });
                       } else if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshLambertMaterial) {
                         child.material.transparent = formData.opacity < 1;
                         child.material.opacity = formData.opacity;
                       }
                    }
                  }
                });

                if (cncPreviewSceneRef.current) {
                  cncPreviewSceneRef.current.add(model);
                  cncPreviewMeshRef.current = model as any;
                  
                  if (cncPreviewControlsRef.current) {
                    cncPreviewControlsRef.current.update();
                  }
                  cncPreviewRendererRef.current?.render(cncPreviewSceneRef.current, cncPreviewCameraRef.current!);
                }
              },
              undefined,
              (fallbackError) => {
                clearTimeout(fallbackTimeout);
                console.error('❌ [GLB_LOAD] 降级加载也失败:', fallbackError);
                message.error('GLB模型加载失败，请检查文件格式和完整性');
                createDefaultPreviewMesh(formData);
              }
            );
            return;
          }
          
          // 其他类型的错误处理
          if (errorMessage && errorMessage.includes('memory')) {
            message.error('GLB模型文件过大导致内存不足，请使用更小的文件或简化模型');
          } else if (errorMessage && errorMessage.includes('network')) {
            message.error('网络连接问题，请检查网络状态后重试');
          } else {
            message.error('GLB模型加载失败，请检查文件格式和网络连接');
          }
          
          // 加载失败时使用默认几何体
          createDefaultPreviewMesh(formData);
        }
      );
      return;
    }

    // 处理预设模型（非custom类型）
    if (formData.currentModel !== 'custom') {
      createDefaultPreviewMesh(formData);
    }
  };

  // 创建默认预览网格
  const createDefaultPreviewMesh = (formData: typeof cncPropertiesFormData) => {
    if (!cncPreviewSceneRef.current || !formData) return;

    // 根据当前模型类型创建新的几何体
    let geometry: THREE.BufferGeometry;
    
    switch (formData.currentModel) {
      default:
        // 默认正方体
        geometry = new THREE.BoxGeometry(formData.width, formData.height, formData.depth3D);
    }

    // 创建材质
    const material = new THREE.MeshLambertMaterial({
      color: formData.color,
      transparent: true,
      opacity: formData.opacity
    });

    // 创建网格
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, formData.height / 2, 0);
    mesh.scale.setScalar(formData.scale);
    mesh.rotation.set(
      (formData.rotationX * Math.PI) / 180,
      (formData.rotationY * Math.PI) / 180,
      (formData.rotationZ * Math.PI) / 180
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // 添加到场景
    cncPreviewSceneRef.current.add(mesh);
    cncPreviewMeshRef.current = mesh;

    // 渲染场景
    if (cncPreviewControlsRef.current) {
      cncPreviewControlsRef.current.update();
    }
    if (cncPreviewRendererRef.current && cncPreviewCameraRef.current) {
      cncPreviewRendererRef.current.render(cncPreviewSceneRef.current, cncPreviewCameraRef.current);
    }
  };

  // 初始化CNC机台3D预览场景
  const initCNCPreviewScene = () => {
    const container = document.getElementById('cnc-preview-container');
    if (!container) return;

    // 清理现有场景
    if (cncPreviewRendererRef.current) {
      cncPreviewRendererRef.current.dispose();
    }

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    cncPreviewSceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cncPreviewCameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    cncPreviewRendererRef.current = renderer;

    // 清空容器并添加渲染器
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    cncPreviewControlsRef.current = controls;

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 创建默认CNC机台几何体（正方体）
    updateCNCPreviewMesh();

    // 渲染循环
    const animate = () => {
      requestAnimationFrame(animate);
      if (controls) controls.update();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (container && camera && renderer) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // 更新CNC机台3D预览网格
  const updateCNCPreviewMesh = () => {
    console.log('🔄 [CNC_MESH] ========== updateCNCPreviewMesh 开始执行 ==========');
    console.log('📊 [CNC_MESH] 当前 cncPropertiesFormData:', cncPropertiesFormData);
    
    const scene = cncPreviewSceneRef.current;
    console.log('🎬 [CNC_MESH] 场景对象:', scene ? '存在' : '不存在');
    console.log('📝 [CNC_MESH] 表单数据:', cncPropertiesFormData ? '存在' : '不存在');
    
    if (!scene || !cncPropertiesFormData) {
      console.log('❌ [CNC_MESH] 场景或表单数据不存在，退出函数');
      return;
    }

    // 移除现有网格
    console.log('🗑️ [CNC_MESH] 检查现有网格:', cncPreviewMeshRef.current ? '存在，准备删除' : '不存在');
    if (cncPreviewMeshRef.current) {
      console.log('🔥 [CNC_MESH] 正在删除现有网格...');
      scene.remove(cncPreviewMeshRef.current);
      cncPreviewMeshRef.current.geometry.dispose();
      if (Array.isArray(cncPreviewMeshRef.current.material)) {
        cncPreviewMeshRef.current.material.forEach(material => material.dispose());
      } else {
        cncPreviewMeshRef.current.material.dispose();
      }
      console.log('✅ [CNC_MESH] 现有网格已删除');
    }

    // 创建新的几何体
    console.log('🔧 [CNC_MESH] 开始创建新几何体');
    console.log('📏 [CNC_MESH] 几何体尺寸参数:', {
      width: cncPropertiesFormData.width || 3.0,
      depth3D: cncPropertiesFormData.depth3D || 2.0,
      height: cncPropertiesFormData.height || 2.5
    });
    
    const geometry = new THREE.BoxGeometry(
      cncPropertiesFormData.width || 3.0,
      cncPropertiesFormData.depth3D || 2.0,
      cncPropertiesFormData.height || 2.5
    );
    console.log('✅ [CNC_MESH] 几何体创建完成');

    // 创建材质
    console.log('🎨 [CNC_MESH] 开始创建材质');
    console.log('🎨 [CNC_MESH] 材质参数:', {
      color: cncPropertiesFormData.color || '#4A90E2',
      opacity: cncPropertiesFormData.opacity || 1.0
    });
    
    const material = new THREE.MeshLambertMaterial({
      color: cncPropertiesFormData.color || '#4A90E2',
      transparent: true,
      opacity: cncPropertiesFormData.opacity || 1.0
    });
    console.log('✅ [CNC_MESH] 材质创建完成');

    // 创建网格
    console.log('🔗 [CNC_MESH] 开始创建网格');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    console.log('✅ [CNC_MESH] 网格创建完成');

    // 应用旋转
    console.log('🔄 [CNC_MESH] 应用旋转参数:', {
      rotationX: cncPropertiesFormData.rotationX || 0,
      rotationY: cncPropertiesFormData.rotationY || 0,
      rotationZ: cncPropertiesFormData.rotationZ || 0
    });
    mesh.rotation.x = (cncPropertiesFormData.rotationX || 0) * Math.PI / 180;
    mesh.rotation.y = (cncPropertiesFormData.rotationY || 0) * Math.PI / 180;
    mesh.rotation.z = (cncPropertiesFormData.rotationZ || 0) * Math.PI / 180;

    // 应用整体缩放参数（等比例缩放）
    const scale = cncPropertiesFormData.scale || 1.0;
    console.log('📐 [CNC_MESH] 应用整体缩放参数:', scale);
    mesh.scale.set(scale, scale, scale);

    console.log('🌟 [CNC_MESH] 将网格添加到场景');
    scene.add(mesh);
    cncPreviewMeshRef.current = mesh;
    console.log('✅ [CNC_MESH] updateCNCPreviewMesh 函数执行完成');
  };

  // 更新CNC机台属性
  const updateCNCProperties = (values: any) => {
    console.log('🚀 [DEBUG] ========== updateCNCProperties 函数开始执行 ==========');
    console.log('📝 [DEBUG] 接收到的表单值:', values);
    console.log('🔍 [DEBUG] 表单值类型检查:', typeof values);
    console.log('📊 [DEBUG] 表单值是否为空:', values === null || values === undefined);
    
    if (!cncPropertiesFormData) {
      console.error('❌ [DEBUG] cncPropertiesFormData 为空，函数提前返回');
      return;
    }
    
    console.log('✅ [DEBUG] cncPropertiesFormData 存在:', cncPropertiesFormData);
    console.log('🎯 [DEBUG] 当前选中的CNC ID:', cncPropertiesFormData.cncId);
    console.log('📊 [DEBUG] 当前CNC机台列表长度:', cncMachines.length);
    console.log('🔍 [DEBUG] 当前CNC机台列表:', cncMachines.map(cnc => ({ id: cnc.id, name: cnc.name })));
    
    // 🛡️ 保护机制：检查CNC机台列表是否为空
    if (cncMachines.length === 0) {
      console.error('❌ [PROTECTION] CNC机台列表为空，无法执行更新操作');
      console.error('❌ [PROTECTION] 这可能是由于意外的状态清空导致的');
      
      // 尝试从撤销栈中恢复数据
      if (undoStack.length > 0) {
        const lastState = undoStack[undoStack.length - 1];
        if (lastState.cncMachines && lastState.cncMachines.length > 0) {
          console.log('🔄 [PROTECTION] 尝试从撤销栈恢复CNC机台数据');
          console.log('🔄 [PROTECTION] 恢复的CNC机台数量:', lastState.cncMachines.length);
          setCncMachines(lastState.cncMachines);
          message.warning('检测到CNC机台数据异常，已自动恢复');
          return;
        }
      }
      
      message.error('CNC机台数据丢失，无法执行更新操作');
      return;
    }
    
    // 查找当前CNC机台
    const currentCNC = cncMachines.find(cnc => cnc.id === cncPropertiesFormData.cncId);
    console.log('🔍 [DEBUG] 更新前的CNC机台数据:', currentCNC);
    
    // 空值检查和默认值处理
    const safeValues = {
      name: values.name || currentCNC?.name || 'CNC机台',
      width: (values.width !== null && values.width !== undefined && values.width > 0) ? values.width : (currentCNC?.width3D || 3.0),
      height: (values.height !== null && values.height !== undefined && values.height > 0) ? values.height : (currentCNC?.height3D || 2.5),
      depth3D: (values.depth3D !== null && values.depth3D !== undefined && values.depth3D > 0) ? values.depth3D : (currentCNC?.depth3D || 2.0),
      color: values.color || currentCNC?.color || '#4A90E2',
      opacity: (values.opacity !== null && values.opacity !== undefined && values.opacity >= 0 && values.opacity <= 1) ? values.opacity : (currentCNC?.opacity || 1.0),
      scale: (values.scale !== null && values.scale !== undefined && values.scale > 0) ? values.scale : (currentCNC?.scale || 1.0),

      rotationX: (values.rotationX !== null && values.rotationX !== undefined) ? values.rotationX : (currentCNC?.rotation?.x || 0),
      rotationY: (values.rotationY !== null && values.rotationY !== undefined) ? values.rotationY : (currentCNC?.rotation?.y || 0),
      rotationZ: (values.rotationZ !== null && values.rotationZ !== undefined) ? values.rotationZ : (currentCNC?.rotation?.z || 0),

      // GLB模型相关字段 - 优先使用表单数据，然后是当前CNC数据
      currentModel: values.currentModel || cncPropertiesFormData?.currentModel || currentCNC?.currentModel || 'default',
      modelFile: values.modelFile || cncPropertiesFormData?.modelFile || currentCNC?.modelFile || null,
      modelUrl: values.modelUrl || cncPropertiesFormData?.modelUrl || currentCNC?.modelUrl || null,
      modelFileName: values.modelFileName || cncPropertiesFormData?.modelFileName || currentCNC?.modelFileName || null,
      modelFileBase64: values.modelFileBase64 || cncPropertiesFormData?.modelFileBase64 || currentCNC?.modelFileBase64 || null
    };
    
    console.log('🎯 [模型] updateCNCProperties - GLB模型字段处理:', {
      'values.currentModel': values.currentModel,
      'cncPropertiesFormData.currentModel': cncPropertiesFormData?.currentModel,
      'currentCNC.currentModel': currentCNC?.currentModel,
      'final.currentModel': safeValues.currentModel,
      'values.modelUrl': values.modelUrl,
      'cncPropertiesFormData.modelUrl': cncPropertiesFormData?.modelUrl,
      'currentCNC.modelUrl': currentCNC?.modelUrl,
      'final.modelUrl': safeValues.modelUrl,
      'values.modelFileName': values.modelFileName,
      'cncPropertiesFormData.modelFileName': cncPropertiesFormData?.modelFileName,
      'currentCNC.modelFileName': currentCNC?.modelFileName,
      'final.modelFileName': safeValues.modelFileName
    });
    
    console.log('🛡️ [DEBUG] 处理后的安全值:', safeValues);
    console.log('🔄 [DEBUG] 准备调用 setCncMachines 更新状态');
    console.log('📋 [DEBUG] 更新前的CNC机台列表:', cncMachines);
    
    setCncMachines(prevCncs => {
      console.log('🔄 [DEBUG] setCncMachines 回调函数开始执行');
      console.log('📋 [DEBUG] prevCncs 参数:', prevCncs);
      console.log('📊 [DEBUG] prevCncs 长度:', prevCncs.length);
      
      const updatedCncs = prevCncs.map(cnc => {
        if (cnc.id === cncPropertiesFormData.cncId) {
          console.log('🎯 [DEBUG] 找到要更新的CNC机台:', cnc);
          const updatedCnc = {
            ...cnc,
            name: safeValues.name, // 使用安全值更新name属性
            // 同步更新2D显示属性（像素）和3D属性（米）
            width: safeValues.width * 10,     // 3D宽度转换为2D显示宽度（1米=10像素）
            height: safeValues.height * 10,   // 3D高度转换为2D显示高度（1米=10像素）
            width3D: safeValues.width,        // 表单的width映射到width3D
            height3D: safeValues.height,      // 表单的height映射到height3D
            depth3D: safeValues.depth3D,
            color: safeValues.color,
            opacity: safeValues.opacity,
            scale: safeValues.scale,

            rotation: {
              x: safeValues.rotationX,
              y: safeValues.rotationY,
              z: safeValues.rotationZ
            },

            // 保存GLB模型信息
            currentModel: safeValues.currentModel,
            modelFile: safeValues.modelFile,
            modelUrl: safeValues.modelUrl,
            modelFileName: safeValues.modelFileName
          };
          console.log('✨ [DEBUG] 生成的更新后CNC数据:', updatedCnc);
          return updatedCnc;
        } else {
          return cnc;
        }
      });
      
      const updatedCNC = updatedCncs.find(cnc => cnc.id === cncPropertiesFormData.cncId);
      console.log('✅ [DEBUG] 最终更新后的CNC机台数据:', updatedCNC);
      console.log('📊 [DEBUG] 最终更新后的所有CNC机台数量:', updatedCncs.length);
      console.log('📋 [DEBUG] 最终更新后的所有CNC机台列表:', updatedCncs.map(cnc => ({ id: cnc.id, name: cnc.name })));
      console.log('🔄 [DEBUG] setCncMachines 回调函数即将返回新状态');
      
      // 同步更新3D视图中的CNC机台
      if (threeDEditorRef.current && threeDEditorRef.current.updateCNCMachines) {
        console.log('🔄 [DEBUG] 调用3D编辑器的updateCNCMachines方法同步更新3D视图');
        threeDEditorRef.current.updateCNCMachines(updatedCncs);
      }
      
      return updatedCncs;
    });
    
    console.log('💾 [DEBUG] setCncMachines 调用完成');
    
    message.success('CNC机台属性更新成功');
    console.log('✅ [DEBUG] 成功消息已显示');
    console.log('🚪 [DEBUG] 即将关闭属性面板');
    console.log('🏁 [DEBUG] ========== updateCNCProperties 函数执行完成 ==========');
    closeCNCPropertiesPanel();
  };

  // 删除选中的墙体
  const deleteSelectedWalls = () => {
    if (selectedWalls.length === 0) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedWalls.length} 个墙体吗？`,
      onOk: () => {
        // 保存当前状态到撤销栈
        saveStateToUndoStack();
        
        // 在删除墙体前，先清理相关的共享端点
        setWalls(prevWalls => {
          const wallsToDelete = prevWalls.filter(wall => selectedWalls.includes(wall.id));
          
          // 清理每个要删除的墙体的共享端点
          wallsToDelete.forEach(wall => {
            if (wall.pointIds) {
              wall.pointIds.forEach((pointId, index) => {
                if (pointId) {
                  removeWallFromSharedPoint(pointId, wall.id, index);
                }
              });
            }
          });
          
          // 返回过滤后的墙体数组
          return prevWalls.filter(wall => !selectedWalls.includes(wall.id));
        });
        
        setSelectedWalls([]);
        message.success(`已删除 ${selectedWalls.length} 个墙体`);
      }
    });
  };



  // 过滤产品模型
  const getFilteredModels = () => {
    return mockProductModels.filter(model =>
      model.name.toLowerCase().includes(modelSearchText.toLowerCase())
    );
  };

  // 楼层切换
  const switchFloor = (floorId: string) => {
    setCurrentFloor(floorId);
    const scene = floorScenes.find(s => s.id === floorId);
    if (scene) {
      message.success(`已切换到${scene.name}`);
    }
  };

  // 打开场景列表对话框
  const openSceneListModal = () => {
    setSceneListModalVisible(true);
  };

  // 打开新增场景对话框
  const openNewSceneModal = () => {
    console.log('🆕 [OPEN-NEW-SCENE] 打开新增场景对话框:', {
      currentUploadedModel: uploadedSceneModel ? {
        name: uploadedSceneModel.name,
        size: uploadedSceneModel.size
      } : null,
      callStack: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });
    setEditingScene(null);
    console.log('🔄 [OPEN-NEW-SCENE] 重置表单字段');
    sceneForm.resetFields();
    setNewSceneModalVisible(true);
  };

  // 打开编辑场景对话框
  const openEditSceneModal = (scene: FloorScene) => {
    setEditingScene(scene);
    setSelectedMapId(scene.dataSource || null);
    
    // 设置可用底图列表
    if (scene.dataSource) {
      const selectedMap = mockMapData.find(map => map.id === scene.dataSource);
      if (selectedMap && selectedMap.availableBaseMaps) {
        const baseMaps = mockBaseMapData.filter(baseMap => 
          selectedMap.availableBaseMaps!.includes(baseMap.id)
        );
        setAvailableBaseMaps(baseMaps);
      }
    }
    
    // 设置initializeDevicesValue状态
    const initDevices = scene.initializeDevices ?? true;
    setInitializeDevicesValue(initDevices);
    
    sceneForm.setFieldsValue({
      name: scene.name,
      floor: scene.floor,
      dataSource: scene.dataSource,
      baseMap: scene.baseMap,
      initializeDevices: initDevices,
      increaseUpdate: scene.increaseUpdate ?? false // 默认为false
    });
    setNewSceneModalVisible(true);
  };

  // 保存场景
  const saveScene = async () => {
    try {
      console.log('🚀 [SAVE-SCENE] 开始保存场景，当前状态:', {
        newSceneModalVisible,
        editingScene: editingScene ? { id: editingScene.id, name: editingScene.name } : null,
        uploadedSceneModel: uploadedSceneModel ? {
          name: uploadedSceneModel.name,
          size: uploadedSceneModel.size
        } : null,
        callStack: new Error().stack?.split('\n').slice(1, 5).join('\n')
      });
      
      const values = await sceneForm.validateFields();
      
      if (editingScene) {
        // 编辑现有场景
        setFloorScenes(prev => prev.map(scene => 
          scene.id === editingScene.id 
            ? { ...scene, ...values }
            : scene
        ));
        message.success('场景编辑成功');
      } else {
        // 新增场景
        const newScene: FloorScene = {
          id: `floor-${Date.now()}`,
          ...values
        };
        setFloorScenes(prev => [...prev, newScene]);
        message.success('场景新增成功');
      }
      
      // 只有在新增/编辑场景Modal打开时才清理相关状态
      // 这样可以避免在CNC模型配置等其他场景中误清理uploadedSceneModel状态
      if (newSceneModalVisible) {
        console.log('🧹 [SAVE-SCENE] 新增场景模式，开始清理状态');
        setNewSceneModalVisible(false);
        setEditingScene(null);
        setSelectedMapId(null); // 重置地图选择状态
        setAvailableBaseMaps([]); // 重置可用底图列表
        setInitializeDevicesValue(true); // 重置初始化设备状态
        
        // 🔧 修复：不要清理uploadedSceneModel状态，因为它可能正在被CNC模型配置使用
        // 只有在真正需要清理时（比如Modal取消或文件删除）才清理
        console.log('✅ [SAVE-SCENE] 保持uploadedSceneModel状态，避免影响CNC模型配置');
        // setUploadedSceneModel(null); // 注释掉这行，避免误清理
        
        sceneForm.resetFields();
      } else {
        console.log('⚠️ [SAVE-SCENE] 非新增场景模式，保持uploadedSceneModel状态');
      }
    } catch (error) {
      console.error('保存场景失败:', error);
    }
  };

  // 删除场景
  const deleteScene = (sceneId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个场景吗？',
      onOk: () => {
        setFloorScenes(prev => prev.filter(scene => scene.id !== sceneId));
        if (currentFloor === sceneId && floorScenes.length > 1) {
          const remainingScenes = floorScenes.filter(scene => scene.id !== sceneId);
          setCurrentFloor(remainingScenes[0]?.id || '');
        }
        message.success('场景删除成功');
      }
    });
  };

  // 处理地图选择变化
  const handleMapChange = (mapId: string) => {
    setSelectedMapId(mapId);
    sceneForm.setFieldValue('baseMap', undefined); // 清空表单中的底图字段
    
    // 根据选择的地图更新可用底图列表
    const selectedMap = mockMapData.find(map => map.id === mapId);
    if (selectedMap && selectedMap.availableBaseMaps) {
      const baseMaps = mockBaseMapData.filter(baseMap => 
        selectedMap.availableBaseMaps!.includes(baseMap.id)
      );
      setAvailableBaseMaps(baseMaps);
    } else {
      setAvailableBaseMaps([]);
    }
  };

  // 处理底图选择变化
  const handleBaseMapChange = () => {
    // 底图选择逻辑已移除
  };

  // 处理是否初始化地图关联设备变化
  const handleInitializeDevicesChange = (value: boolean) => {
    setInitializeDevicesValue(value);
  };

  // 端点相关辅助函数
  // 计算线段端点位置


  // 检测点击是否在端点上
  const checkEndpointClick = useCallback((mousePoint: WallPoint, wallList: Wall[]): { wallId: string; pointIndex: number } | null => {
    const endpointRadius = 8 / scale; // 端点点击半径，考虑缩放
    
    for (const wall of wallList) {
      for (let i = 0; i < wall.points.length; i++) {
        const point = wall.points[i];
        const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
        if (distance <= endpointRadius) {
          return { wallId: wall.id, pointIndex: i };
        }
      }
    }
    return null;
  }, [scale]);

  // 检测鼠标是否悬停在端点上
  const checkEndpointHover = useCallback((mousePoint: WallPoint, wall: Wall): { wallId: string; pointIndex: number } | null => {
    const hoverRadius = 12 / scale; // 悬停检测半径，比点击半径稍大
    
    for (let i = 0; i < wall.points.length; i++) {
      const point = wall.points[i];
      const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
      if (distance <= hoverRadius) {
        return { wallId: wall.id, pointIndex: i };
      }
    }
    return null;
  }, [scale]);

  // 查找附近的端点（用于绘制模式）
  const findNearbyEndpoints = useCallback((mousePoint: WallPoint, wallList: Wall[], radius: number = 15): Array<{ wallId: string; pointIndex: number; point: WallPoint }> => {
    const nearby: Array<{ wallId: string; pointIndex: number; point: WallPoint }> = [];
    const searchRadius = radius / scale; // 考虑缩放
    
    for (const wall of wallList) {
      for (let i = 0; i < wall.points.length; i++) {
        const point = wall.points[i];
        const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
        if (distance <= searchRadius) {
          nearby.push({ wallId: wall.id, pointIndex: i, point });
        }
      }
    }
    
    // 按距离排序，最近的在前
    return nearby.sort((a, b) => {
      const distA = Math.sqrt((mousePoint.x - a.point.x) ** 2 + (mousePoint.y - a.point.y) ** 2);
      const distB = Math.sqrt((mousePoint.x - b.point.x) ** 2 + (mousePoint.y - b.point.y) ** 2);
      return distA - distB;
    });
  }, [scale]);

  // 检测点击是否在地面端点上
  const checkFloorEndpointClick = useCallback((mousePoint: WallPoint, floorAreaList: FloorArea[]): { floorId: string; pointIndex: number } | null => {
    const endpointRadius = 8 / scale; // 端点点击半径，考虑缩放
    
    for (const floor of floorAreaList) {
      if (!floor.completed) continue; // 只检测已完成的地面
      
      for (let i = 0; i < floor.points.length; i++) {
        const point = floor.points[i];
        const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
        if (distance <= endpointRadius) {
          return { floorId: floor.id, pointIndex: i };
        }
      }
    }
    return null;
  }, [scale]);

  // 检测鼠标是否悬停在地面端点上
  const checkFloorEndpointHover = useCallback((mousePoint: WallPoint, floor: FloorArea): { floorId: string; pointIndex: number } | null => {
    const hoverRadius = 12 / scale; // 悬停检测半径，比点击半径稍大
    
    if (!floor.completed) return null; // 只检测已完成的地面
    
    for (let i = 0; i < floor.points.length; i++) {
      const point = floor.points[i];
      const distance = Math.sqrt((mousePoint.x - point.x) ** 2 + (mousePoint.y - point.y) ** 2);
      if (distance <= hoverRadius) {
        return { floorId: floor.id, pointIndex: i };
      }
    }
    return null;
  }, [scale]);

  // 画布绘制
  // 画布绘制函数
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 获取画布的CSS显示尺寸
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 如果尺寸为0，说明DOM还没有完全渲染，延迟执行
    if (displayWidth === 0 || displayHeight === 0) {
      setTimeout(() => drawCanvas(), 10);
      return;
    }

    // 设置画布尺寸
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格（仅在顶视图模式下显示）
    if (viewMode === 'top') {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 绘制网格线
      const gridSize = 20;
      ctx.strokeStyle = '#cccccc'; // 使用更明显的灰色
      ctx.lineWidth = Math.max(1 / scale, 0.5); // 确保最小线宽

      // 计算当前视口在世界坐标系中的范围
      const viewLeft = -offsetX / scale;
      const viewTop = -offsetY / scale;
      const viewRight = (displayWidth - offsetX) / scale;
      const viewBottom = (displayHeight - offsetY) / scale;

      // 计算网格线的起始和结束位置，确保覆盖整个视口
      const startX = Math.floor(viewLeft / gridSize) * gridSize;
      const endX = Math.ceil(viewRight / gridSize) * gridSize;
      const startY = Math.floor(viewTop / gridSize) * gridSize;
      const endY = Math.ceil(viewBottom / gridSize) * gridSize;

      // 绘制垂直网格线
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }

      // 绘制水平网格线
       for (let y = startY; y <= endY; y += gridSize) {
         ctx.beginPath();
         ctx.moveTo(startX, y);
         ctx.lineTo(endX, y);
         ctx.stroke();
       }

      // 绘制世界坐标原点标记
      const originSize = 20 / scale; // 原点标记大小，根据缩放调整
      const axisLength = 40 / scale; // 坐标轴长度
      
      // 绘制坐标轴
      ctx.lineWidth = 3 / scale;
      
      // X轴 (红色)
      ctx.strokeStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(axisLength, 0);
      ctx.stroke();
      
      // Y轴 (绿色)
      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, axisLength);
      ctx.stroke();
      
      // 绘制原点圆圈
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.arc(0, 0, originSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // 绘制原点标签
      ctx.fillStyle = '#000000';
      ctx.font = `${12 / scale}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('(0,0)', originSize / 2 + 5 / scale, -5 / scale);
       
       ctx.restore();
     }

    // 绘制已完成的地面（仅在顶视图模式下显示）- 先绘制地面，确保墙体在地面之上
    if (viewMode === 'top' && floorAreas.length > 0) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      floorAreas.forEach((floor: FloorArea) => {
        if (floor.points.length >= 3) {
          const isSelected = floor.selected || selectedFloorAreas.includes(floor.id);
          
          // 绘制地面填充
          ctx.fillStyle = isSelected 
            ? 'rgba(24, 144, 255, 0.3)' // 选中时蓝色半透明填充
            : 'rgba(200, 200, 200, 0.3)'; // 默认浅灰色半透明填充
          ctx.beginPath();
          ctx.moveTo(floor.points[0].x, floor.points[0].y);
          for (let i = 1; i < floor.points.length; i++) {
            ctx.lineTo(floor.points[i].x, floor.points[i].y);
          }
          ctx.closePath();
          ctx.fill();

          // 绘制地面边框
          ctx.strokeStyle = isSelected 
            ? '#1890ff' // 选中时蓝色边框
            : '#666666'; // 默认深灰色边框
          ctx.lineWidth = isSelected 
            ? 3 / scale // 选中时更粗的边框
            : 2 / scale; // 默认边框宽度
          ctx.setLineDash([]);
          ctx.stroke();

          // 绘制地面顶点
          floor.points.forEach((point: WallPoint, pointIndex: number) => {
            // 检查是否是选中的端点
            const isSelectedEndpoint = selectedFloorEndpoint && 
              selectedFloorEndpoint.floorId === floor.id && 
              selectedFloorEndpoint.pointIndex === pointIndex;
            
            // 检查是否是悬停的端点
            const isHoveredEndpoint = hoveredFloorEndpoint && 
              hoveredFloorEndpoint.floorId === floor.id && 
              hoveredFloorEndpoint.pointIndex === pointIndex;
            
            // 设置端点样式
            if (isSelectedEndpoint) {
              ctx.fillStyle = '#ff4d4f'; // 选中端点红色
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
            } else if (isHoveredEndpoint) {
              ctx.fillStyle = '#52c41a'; // 悬停端点绿色
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1 / scale;
            } else if (isSelected) {
              ctx.fillStyle = '#1890ff'; // 选中地面时蓝色顶点
              ctx.strokeStyle = 'transparent';
            } else {
              ctx.fillStyle = '#666666'; // 默认深灰色顶点
              ctx.strokeStyle = 'transparent';
            }
            
            // 绘制端点
            ctx.beginPath();
            const radius = isSelectedEndpoint ? 6 / scale : 
                          isHoveredEndpoint ? 5 / scale :
                          isSelected ? 4 / scale : 3 / scale;
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制端点边框（仅在选中或悬停时）
            if (isSelectedEndpoint || isHoveredEndpoint) {
              ctx.stroke();
            }
          });
        }
      });

      ctx.restore();
    }

    // 绘制正在绘制的地面
    if (currentFloorPoints.length > 0) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 绘制预览填充（如果有3个或以上的点）
      if (currentFloorPoints.length >= 3) {
        ctx.fillStyle = 'rgba(24, 144, 255, 0.1)'; // 蓝色半透明填充
        ctx.beginPath();
        ctx.moveTo(currentFloorPoints[0].x, currentFloorPoints[0].y);
        for (let i = 1; i < currentFloorPoints.length; i++) {
          ctx.lineTo(currentFloorPoints[i].x, currentFloorPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }

      // 绘制地面区域预览填充（当有2个或更多点时）
      if (floorPreviewMousePos && currentFloorPoints.length >= 2) {
        // 创建包含鼠标位置的预览点数组
        const previewPoints = [...currentFloorPoints, floorPreviewMousePos];
        
        // 绘制预览区域填充
        ctx.fillStyle = 'rgba(24, 144, 255, 0.15)'; // 更浅的蓝色半透明填充
        ctx.beginPath();
        ctx.moveTo(previewPoints[0].x, previewPoints[0].y);
        for (let i = 1; i < previewPoints.length; i++) {
          ctx.lineTo(previewPoints[i].x, previewPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // 绘制预览区域边框
        ctx.strokeStyle = 'rgba(24, 144, 255, 0.4)'; // 半透明蓝色边框
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]); // 虚线边框
        ctx.stroke();
        ctx.setLineDash([]); // 重置为实线
      }

      // 绘制地面预览虚线（从最后一个点到鼠标位置）
      if (floorPreviewMousePos && currentFloorPoints.length > 0) {
        const lastPoint = currentFloorPoints[currentFloorPoints.length - 1];
        
        ctx.strokeStyle = '#1890ff'; // 蓝色虚线
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([8 / scale, 4 / scale]); // 虚线样式
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(floorPreviewMousePos.x, floorPreviewMousePos.y);
        ctx.stroke();
        
        // 如果有3个或以上的点，还要绘制从鼠标位置到起点的虚线
        if (currentFloorPoints.length >= 3) {
          const firstPoint = currentFloorPoints[0];
          ctx.beginPath();
          ctx.moveTo(floorPreviewMousePos.x, floorPreviewMousePos.y);
          ctx.lineTo(firstPoint.x, firstPoint.y);
          ctx.stroke();
        }
        
        ctx.setLineDash([]); // 重置为实线
      }

      // 绘制已放置的地面点
      currentFloorPoints.forEach((point: WallPoint, index: number) => {
        ctx.fillStyle = '#1890ff'; // 蓝色点
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 为起点添加特殊标记
        if (index === 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        }
      });

      ctx.restore();
    }

    // 绘制已完成的墙体（仅在顶视图模式下显示）- 墙体在地面之上
    if (viewMode === 'top') {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      walls.forEach(wall => {
        if (wall.points.length >= 2) {
          ctx.strokeStyle = wall.color;
          ctx.lineWidth = wall.thickness / scale;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

        if (wall.type === 'line') {
          // 检查直线墙体是否有任何线段被选中
          const hasSelectedSegment = selectedSegments.some(
            seg => seg.wallId === wall.id
          );
          
          // 绘制直线墙体 - 逐段绘制以支持线段高亮
          for (let i = 0; i < wall.points.length - 1; i++) {
            const p1 = wall.points[i];
            const p2 = wall.points[i + 1];
            
            // 检查当前线段是否被选中
            const isSegmentSelected = selectedSegments.some(
              seg => seg.wallId === wall.id && seg.segmentIndex === i
            );
            
            // 设置线段样式
            if (isSegmentSelected) {
              ctx.strokeStyle = '#1890ff'; // 选中线段用蓝色高亮，与贝塞尔曲线保持一致
              ctx.lineWidth = (wall.thickness + 2) / scale; // 选中线段稍微加粗
            } else {
              ctx.strokeStyle = wall.color;
              ctx.lineWidth = wall.thickness / scale;
            }
            
            // 绘制线段
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          
          // 为选中的直线墙体绘制端点（与贝塞尔曲线保持一致的逻辑）
          if (hasSelectedSegment) {
            ctx.save();
            
            // 绘制起点和终点
            const startPoint = wall.points[0];
            const endPoint = wall.points[wall.points.length - 1];
            
            if (startPoint && endPoint) {
              // 绘制起点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与贝塞尔曲线一致
              ctx.beginPath();
              ctx.arc(startPoint.x, startPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
              
              // 绘制终点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与贝塞尔曲线一致
              ctx.beginPath();
              ctx.arc(endPoint.x, endPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
            }
            
            ctx.restore();
          }
        } else if (wall.type === 'bezier' && wall.points.length >= 4) {
          // 检查贝塞尔曲线是否被选中
          const isBezierSelected = selectedSegments.some(
            seg => seg.wallId === wall.id && seg.segmentIndex === 0
          );
          
          // 设置贝塞尔曲线样式
          if (isBezierSelected) {
            ctx.strokeStyle = '#1890ff'; // 选中曲线用蓝色高亮，与直线保持一致
            ctx.lineWidth = (wall.thickness + 2) / scale; // 选中曲线稍微加粗
          } else {
            ctx.strokeStyle = wall.color;
            ctx.lineWidth = wall.thickness / scale;
          }
          
          // 绘制贝塞尔曲线墙体
          ctx.beginPath();
          ctx.moveTo(wall.points[0].x, wall.points[0].y);
          
          // 每4个点为一组绘制贝塞尔曲线
          for (let i = 0; i < wall.points.length - 3; i += 4) {
            const p0 = wall.points[i];     // 起点
            const p1 = wall.points[i + 1]; // 控制点1
            const p2 = wall.points[i + 2]; // 控制点2
            const p3 = wall.points[i + 3]; // 终点
            
            if (p0 && p1 && p2 && p3) {
              ctx.bezierCurveTo(
                p1.x, p1.y,
                p2.x, p2.y,
                p3.x, p3.y
              );
              
              // 如果还有更多点，移动到下一段的起点
              if (i + 4 < wall.points.length) {
                ctx.moveTo(p3.x, p3.y);
              }
            }
          }
          ctx.stroke();
          
          // 为选中的贝塞尔曲线绘制端点
          if (isBezierSelected) {
            ctx.save();
            
            // 绘制起点和终点
            const startPoint = wall.points[0];
            const endPoint = wall.points[wall.points.length - 1];
            
            if (startPoint && endPoint) {
              // 绘制起点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与直线段一致
              ctx.beginPath();
              ctx.arc(startPoint.x, startPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
              
              // 绘制终点
              ctx.fillStyle = '#1890ff'; // 蓝色端点，与直线段一致
              ctx.beginPath();
              ctx.arc(endPoint.x, endPoint.y, 6 / scale, 0, Math.PI * 2);
              ctx.fill();
              
              // 添加白色边框
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2 / scale;
              ctx.stroke();
            }
            
            ctx.restore();
          }
        }

        // 注意：端点绘制逻辑已移到墙体循环外部，避免共享端点重复绘制
      }
    });

    // 统一绘制所有端点（避免共享端点重复绘制）
    const renderedPoints = new Set<string>(); // 记录已绘制的端点位置
    
    // 首先收集所有需要绘制的端点信息
    const endpointsToRender: Array<{
      point: WallPoint;
      wallId: string;
      pointIndex: number;
      sharedPoint?: SharedPoint;
      isSelected: boolean;
      isHovered: boolean;
      isNearby: boolean;
    }> = [];
    
    walls.forEach((wall) => {
      if (!wall.completed) return;
      
      wall.points.forEach((point, index) => {
        // 检查是否为共享端点
        let sharedPoint: SharedPoint | undefined;
        for (const sp of sharedPoints.values()) {
          const distance = Math.sqrt(
            Math.pow(sp.x - point.x, 2) + 
            Math.pow(sp.y - point.y, 2)
          );
          if (distance < 15) {
            sharedPoint = sp;
            break;
          }
        }
        
        // 检查端点状态
        const isSelected = selectedEndpoint?.wallId === wall.id && selectedEndpoint?.pointIndex === index;
        const isHovered = hoveredEndpoint?.wallId === wall.id && hoveredEndpoint?.pointIndex === index;
        const isNearby = isDrawingWall && nearbyEndpoints.some(ep => ep.wallId === wall.id && ep.pointIndex === index);
        
        endpointsToRender.push({
          point,
          wallId: wall.id,
          pointIndex: index,
          sharedPoint,
          isSelected,
          isHovered,
          isNearby
        });
      });
    });
    
    // 绘制端点，确保共享端点只绘制一次
    endpointsToRender.forEach((endpoint) => {
      const { point, wallId, sharedPoint, isSelected, isHovered, isNearby } = endpoint;
      
      // 生成端点位置的唯一标识
      const pointKey = sharedPoint ? `shared_${sharedPoint.id}` : `${point.x.toFixed(1)}_${point.y.toFixed(1)}`;
      
      // 如果已经绘制过这个位置的端点，跳过
      if (renderedPoints.has(pointKey)) {
        return;
      }
      renderedPoints.add(pointKey);
      
      // 获取墙体信息用于显示判断
      const wall = walls.find(w => w.id === wallId);
      if (!wall) return;
      
      // 只在需要显示端点时绘制
      // 修复：确保在非绘制状态下，选中墙体或选中端点时显示端点
      const isEndpointSelected = selectedEndpoint?.wallId === wall.id && selectedEndpoint?.pointIndex === endpoint.pointIndex;
      const shouldShowEndpoint = isDrawingWall ? 
        (nearbyEndpoints.length > 0) : // 绘制模式：只显示附近端点
        (wall.completed && (wall.selected || isEndpointSelected)); // 非绘制模式：选中墙体或选中端点时显示
      
      // 调试日志：端点显示条件
        if (wall.id === walls[0]?.id && endpoint.pointIndex === 0) { // 只为第一个墙体的第一个端点记录日志
          console.log('🔵 端点显示状态:', {
            shouldShowEndpoint: shouldShowEndpoint,
            wallCompleted: wall.completed,
            wallSelected: wall.selected,
            isEndpointSelected: isEndpointSelected,
            isDrawingWall: isDrawingWall,
            wallId: wall.id
          });
        }
      
      if (shouldShowEndpoint) {
        // 设置端点样式
        let pointColor = '#1890ff';
        let pointRadius = 4 / scale;
        let lineWidth = 1 / scale;
        
        if (isSelected) {
          pointColor = '#ff4d4f'; // 选中状态：红色
          pointRadius = 6 / scale;
          lineWidth = 2 / scale;
        } else if (isHovered) {
          pointColor = '#1890ff'; // 悬停状态：蓝色
          pointRadius = 5 / scale;
          lineWidth = 1 / scale;
        } else if (isNearby) {
          pointColor = '#52c41a'; // 附近端点：绿色
          pointRadius = 5 / scale;
          lineWidth = 1 / scale;
        } else if (sharedPoint && sharedPoint.connectedWalls.length > 1) {
          pointColor = '#722ed1'; // 共享端点：紫色
          pointRadius = 6 / scale;
          lineWidth = 2 / scale;
        } else {
          pointColor = wall.color; // 默认状态
          lineWidth = 0;
        }
        
        // 绘制端点
        ctx.save();
        ctx.fillStyle = pointColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制端点边框
        if (isSelected || isHovered || isNearby || (sharedPoint && sharedPoint.connectedWalls.length > 1)) {
          ctx.stroke();
        }
        
        ctx.restore();
      }
    });

    // 绘制当前正在绘制的墙体
    if (currentWall && currentWall.points.length > 0) {
      ctx.strokeStyle = currentWall.color;
      ctx.lineWidth = currentWall.thickness / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([5 / scale, 5 / scale]); // 虚线表示正在绘制

      if (currentWall.type === 'line') {
        ctx.beginPath();
        
        if (currentWall.points.length >= 2) {
          // 绘制已有的直线段
          ctx.moveTo(currentWall.points[0].x, currentWall.points[0].y);
          for (let i = 1; i < currentWall.points.length; i++) {
            ctx.lineTo(currentWall.points[i].x, currentWall.points[i].y);
          }
        }
        
        // 绘制预览线（从最后一个点到鼠标位置）
        if (currentWall.points.length >= 1 && mousePosition) {
          const lastPoint = currentWall.points[currentWall.points.length - 1];
          if (currentWall.points.length === 1) {
            // 如果只有一个点，从该点开始绘制到鼠标位置
            ctx.moveTo(lastPoint.x, lastPoint.y);
          }
          ctx.lineTo(mousePosition.x, mousePosition.y);
        }
        
        ctx.stroke();
      } else if (currentWall.type === 'bezier' && currentWall.points.length >= 4) {
        // 绘制贝塞尔曲线墙体
        ctx.beginPath();
        let startPoint = currentWall.points[0];
        ctx.moveTo(startPoint.x, startPoint.y);
        
        // 每4个点为一组绘制贝塞尔曲线
        for (let i = 0; i < currentWall.points.length - 3; i += 4) {
          const p0 = currentWall.points[i];     // 起点
          const p1 = currentWall.points[i + 1]; // 控制点1
          const p2 = currentWall.points[i + 2]; // 控制点2
          const p3 = currentWall.points[i + 3]; // 终点
          
          if (p0 && p1 && p2 && p3) {
            ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            
            // 如果还有更多点，移动到下一段的起点
            if (i + 4 < currentWall.points.length) {
              ctx.moveTo(p3.x, p3.y);
            }
          }
        }
        ctx.stroke();
        
        // 绘制未完成的贝塞尔曲线段的辅助线
        const remainingPoints = currentWall.points.length % 4;
        if (remainingPoints > 0) {
          const lastCompleteIndex = Math.floor(currentWall.points.length / 4) * 4;
          ctx.setLineDash([2 / scale, 2 / scale]); // 更细的虚线
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // 红色半透明
          
          ctx.beginPath();
          for (let i = lastCompleteIndex; i < currentWall.points.length - 1; i++) {
            const p1 = currentWall.points[i];
            const p2 = currentWall.points[i + 1];
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
          ctx.stroke();
        }
      }

      // 绘制当前墙体的端点
      ctx.setLineDash([]); // 重置虚线
      ctx.fillStyle = currentWall.color;
      currentWall.points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 为贝塞尔曲线的控制点添加不同的标记
        if (currentWall.type === 'bezier') {
          const pointType = index % 4;
          if (pointType === 1 || pointType === 2) {
            // 控制点用方形标记
            ctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; // 橙色
            ctx.fillRect(point.x - 2 / scale, point.y - 2 / scale, 4 / scale, 4 / scale);
            ctx.fillStyle = currentWall.color; // 恢复原色
          }
        }
      });
    }

    // 地图编辑器风格的虚线预览 - 连线模式下的实时预览线
    if ((isConnecting || continuousConnecting) && mousePositionRef.current) {
      const startPoint = lastConnectedPoint || connectingStartPoint;
      
      if (startPoint) {
        ctx.save();
        ctx.strokeStyle = '#1890ff'; // 蓝色虚线
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([8 / scale, 4 / scale]); // 虚线样式
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(mousePositionRef.current.x, mousePositionRef.current.y);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // 绘制选中墙体的高亮效果
    walls.forEach(wall => {
      if (wall.selected || selectedWalls.includes(wall.id)) {
        ctx.save();
        ctx.strokeStyle = '#1890ff'; // 蓝色高亮
        ctx.lineWidth = 4 / scale; // 更粗的线条
        ctx.setLineDash([]);
        
        if (wall.type === 'line') {
          // 绘制直线墙体高亮
          ctx.beginPath();
          wall.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        } else if (wall.type === 'bezier') {
          // 绘制贝塞尔曲线墙体高亮
          ctx.beginPath();
          let startPoint = wall.points[0];
          ctx.moveTo(startPoint.x, startPoint.y);
          
          for (let i = 0; i < wall.points.length - 3; i += 4) {
            const p0 = wall.points[i];
            const p1 = wall.points[i + 1];
            const p2 = wall.points[i + 2];
            const p3 = wall.points[i + 3];
            
            if (p0 && p1 && p2 && p3) {
              ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
              if (i + 4 < wall.points.length) {
                ctx.moveTo(p3.x, p3.y);
              }
            }
          }
          ctx.stroke();
        }
        
        // 绘制选中墙体的端点
        wall.points.forEach((point, index) => {
          // 检查是否是端点（直线墙体的首尾点，或贝塞尔曲线的关键点）
          const isEndpoint = wall.type === 'line' ? 
            (index === 0 || index === wall.points.length - 1) :
            (index % 4 === 0 || index % 4 === 3);
          
          if (isEndpoint) {
            ctx.fillStyle = '#1890ff';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6 / scale, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加白色边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
          }
        });
        
        // 在编辑模式下显示调整手柄
        if (bezierEditMode.isEditing && bezierEditMode.wallId === wall.id) {
          
          // 调试日志：贝塞尔曲线控制手柄显示条件
          console.log('🟡 控制手柄显示判断:', {
            wallId: wall.id,
            wallType: wall.type,
            bezierEditModeIsEditing: bezierEditMode.isEditing,
            bezierEditModeWallId: bezierEditMode.wallId,
            bezierEditModeActiveControlPoint: bezierEditMode.activeControlPoint,
            bezierEditModeIsDraggingControl: bezierEditMode.isDraggingControl,
            wallPointsLength: wall.points?.length,
            shouldShowControls: true
          });
          
          if (wall.type === 'bezier' && wall.points && wall.points.length >= 4) {
            // 贝塞尔曲线：绘制控制点和控制线（新格式：points包含[起点, 控制点1, 控制点2, 终点]）
            const p0 = wall.points[0]; // 起点
            const p1 = wall.points[1]; // 第一个控制点
            const p2 = wall.points[2]; // 第二个控制点
            const p3 = wall.points[3]; // 终点
            
            // 绘制控制线
            ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([4 / scale, 4 / scale]);
            
            // 起点到第一个控制点的线
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            
            // 终点到第二个控制点的线
            ctx.beginPath();
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            
            // 恢复实线
            ctx.setLineDash([]);
            
            // 绘制控制点
            const controlPointIndex1 = 0;
            const controlPointIndex2 = 1;
            
            // 第一个控制点
            const isActive1 = bezierEditMode.activeControlPoint === controlPointIndex1;
            const radius1 = isActive1 ? 7 / scale : 5 / scale;
            
            // 绘制阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(p1.x + 1 / scale, p1.y + 1 / scale, radius1, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制控制点主体
            ctx.fillStyle = isActive1 ? '#1890ff' : '#faad14';
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, radius1, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制白色边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
            
            // 第二个控制点
            const isActive2 = bezierEditMode.activeControlPoint === controlPointIndex2;
            const radius2 = isActive2 ? 7 / scale : 5 / scale;
            
            // 绘制阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(p2.x + 1 / scale, p2.y + 1 / scale, radius2, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制控制点主体
            ctx.fillStyle = isActive2 ? '#1890ff' : '#faad14';
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, radius2, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制白色边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
          }
        }
        
        ctx.restore();
      }
    });

    ctx.restore();
  }

    // 绘制框选区域
    if (isSelecting && selectionStart && selectionEnd) {
      ctx.save();
      
      // 应用画布变换矩阵，确保框选矩形与其他元素在同一坐标系中
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      ctx.strokeStyle = '#1890ff';
      ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
      ctx.lineWidth = 1 / scale; // 根据缩放调整线宽，保持视觉一致性
      ctx.setLineDash([5 / scale, 5 / scale]); // 根据缩放调整虚线间距
      
      // 计算矩形的左上角坐标和宽高，支持任意方向拖动
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);
      const width = maxX - minX;
      const height = maxY - minY;
      
      // 绘制框选矩形
      ctx.fillRect(minX, minY, width, height);
      ctx.strokeRect(minX, minY, width, height);
      
      ctx.restore();
    }

    ctx.restore();

    // 绘制新的贝塞尔曲线绘制状态
    if (bezierDrawingState.phase !== 'idle') {
      ctx.save();
      
      // 绘制起点
      if (bezierDrawingState.startPoint) {
        ctx.fillStyle = '#52c41a'; // 绿色起点
        ctx.beginPath();
        ctx.arc(bezierDrawingState.startPoint.x, bezierDrawingState.startPoint.y, 6 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加白色边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
      
      // 绘制终点
      if (bezierDrawingState.endPoint) {
        ctx.fillStyle = '#f5222d'; // 红色终点
        ctx.beginPath();
        ctx.arc(bezierDrawingState.endPoint.x, bezierDrawingState.endPoint.y, 6 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加白色边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }
      
      // 绘制控制点
      if (bezierDrawingState.controlPoint1) {
        ctx.fillStyle = bezierDrawingState.activeControlPoint === 1 ? '#1890ff' : '#faad14'; // 蓝色（激活）或橙色（普通）
        ctx.beginPath();
        ctx.arc(bezierDrawingState.controlPoint1.x, bezierDrawingState.controlPoint1.y, 5 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制控制线
        if (bezierDrawingState.startPoint) {
          ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
          ctx.lineWidth = 1 / scale;
          ctx.setLineDash([4 / scale, 4 / scale]);
          ctx.beginPath();
          ctx.moveTo(bezierDrawingState.startPoint.x, bezierDrawingState.startPoint.y);
          ctx.lineTo(bezierDrawingState.controlPoint1.x, bezierDrawingState.controlPoint1.y);
          ctx.stroke();
        }
      }
      
      if (bezierDrawingState.controlPoint2) {
        ctx.fillStyle = bezierDrawingState.activeControlPoint === 2 ? '#1890ff' : '#faad14'; // 蓝色（激活）或橙色（普通）
        ctx.beginPath();
        ctx.arc(bezierDrawingState.controlPoint2.x, bezierDrawingState.controlPoint2.y, 5 / scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制控制线
        if (bezierDrawingState.endPoint) {
          ctx.strokeStyle = 'rgba(250, 173, 20, 0.6)';
          ctx.lineWidth = 1 / scale;
          ctx.setLineDash([4 / scale, 4 / scale]);
          ctx.beginPath();
          ctx.moveTo(bezierDrawingState.endPoint.x, bezierDrawingState.endPoint.y);
          ctx.lineTo(bezierDrawingState.controlPoint2.x, bezierDrawingState.controlPoint2.y);
          ctx.stroke();
        }
      }
      
      // 绘制预览贝塞尔曲线
      if (bezierDrawingState.startPoint && bezierDrawingState.endPoint && 
          bezierDrawingState.controlPoint1 && bezierDrawingState.controlPoint2) {
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 3 / scale;
        ctx.setLineDash([8 / scale, 4 / scale]);
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(bezierDrawingState.startPoint.x, bezierDrawingState.startPoint.y);
        ctx.bezierCurveTo(
          bezierDrawingState.controlPoint1.x, bezierDrawingState.controlPoint1.y,
          bezierDrawingState.controlPoint2.x, bezierDrawingState.controlPoint2.y,
          bezierDrawingState.endPoint.x, bezierDrawingState.endPoint.y
        );
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // 绘制CNC机台（仅在顶视图模式下显示）
    if (viewMode === 'top') {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 绘制多选CNC机台的虚线矩形框（在绘制机台之前）
      if (selectedCNCMachines.length >= 2) {
        const selectedMachines = cncMachines.filter(machine => selectedCNCMachines.includes(machine.id));
        if (selectedMachines.length >= 2) {
          const selectionPadding = 8; // 选中框的外边距
          
          // 计算所有选中机台的边界框，使用每个机台的实际尺寸
          const minX = Math.min(...selectedMachines.map(m => {
            const machineWidth = m.width || 30;
            return m.x - machineWidth / 2 - selectionPadding;
          }));
          const maxX = Math.max(...selectedMachines.map(m => {
            const machineWidth = m.width || 30;
            return m.x + machineWidth / 2 + selectionPadding;
          }));
          const minY = Math.min(...selectedMachines.map(m => {
            const machineHeight = m.height || 30;
            return m.y - machineHeight / 2 - selectionPadding;
          }));
          const maxY = Math.max(...selectedMachines.map(m => {
            const machineHeight = m.height || 30;
            return m.y + machineHeight / 2 + selectionPadding;
          }));
          
          // 添加额外的边距让框选框更明显
          const extraPadding = 10;
          const boundingBoxX = minX - extraPadding;
          const boundingBoxY = minY - extraPadding;
          const boundingBoxWidth = maxX - minX + extraPadding * 2;
          const boundingBoxHeight = maxY - minY + extraPadding * 2;
          
          // 绘制虚线矩形框
          ctx.strokeStyle = '#1890ff'; // 蓝色虚线框
          ctx.lineWidth = 2 / scale;
          ctx.setLineDash([8 / scale, 4 / scale]); // 虚线样式
          
          ctx.strokeRect(
            boundingBoxX,
            boundingBoxY,
            boundingBoxWidth,
            boundingBoxHeight
          );
          
          // 绘制半透明背景
          ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
          ctx.fillRect(
            boundingBoxX,
            boundingBoxY,
            boundingBoxWidth,
            boundingBoxHeight
          );
          
          ctx.setLineDash([]); // 重置虚线
        }
      }

      console.log('🎨 [DEBUG] ========== 开始绘制CNC机台 ==========');
      console.log('📊 [DEBUG] CNC机台总数量:', cncMachines.length);
      console.log('📋 [DEBUG] CNC机台列表概览:', cncMachines.map(m => ({ 
        id: m.id, 
        name: m.name, 
        width3D: m.width3D, 
        height3D: m.height3D,
        depth3D: m.depth3D 
      })));
      
      cncMachines.forEach((machine, index) => {
        ctx.save();
        
        console.log(`🔍 [DEBUG] 绘制第${index + 1}个CNC机台:`, {
          id: machine.id,
          name: machine.name,
          position: { x: machine.x, y: machine.y },
          dimensions2D: { width: machine.width, height: machine.height },
          dimensions3D: { width3D: machine.width3D, height3D: machine.height3D, depth3D: machine.depth3D },
          color: machine.color,
          // 关键模型状态信息
          currentModel: machine.currentModel,
          modelUrl: machine.modelUrl,
          modelFileName: machine.modelFileName,
          hasModelFile: !!machine.modelFile,
          modelUrlValid: machine.modelUrl && machine.modelUrl.startsWith('blob:')
        });
        
        // 特别关注自定义模型的机台
        if (machine.currentModel === 'custom') {
          console.log(`🎯 [DEBUG] 发现自定义模型的CNC机台:`, {
            id: machine.id,
            name: machine.name,
            modelUrl: machine.modelUrl,
            modelFileName: machine.modelFileName,
            hasModelFile: !!machine.modelFile,
            modelUrlValid: machine.modelUrl && machine.modelUrl.startsWith('blob:')
          });
        }
        
        // 设置CNC机台的样式
        const isSelected = selectedCNCMachines.includes(machine.id);
        // 使用机台的实际尺寸，如果没有设置则使用默认值30
        // 设置最小显示尺寸，确保设备在画布上始终可见
        const minDisplaySize = 8; // 最小显示尺寸（像素）
        
        // 修复：统一使用3D尺寸（米）并转换为像素，与透视图保持一致
        // 使用与透视图相同的缩放比例：1米 = 10像素
        const meterToPixelRatio = 10;
        const rawWidthMeters = machine.width3D || 5; // 默认5米
        const rawHeightMeters = machine.height3D || 5; // 默认5米
        const machineWidth = Math.max(rawWidthMeters * meterToPixelRatio, minDisplaySize);
        const machineHeight = Math.max(rawHeightMeters * meterToPixelRatio, minDisplaySize);
        
        console.log('📏 [DEBUG] 尺寸计算详情:', {
          原始3D宽度: machine.width3D,
          原始2D宽度: machine.width,
          原始3D高度: machine.height3D,
          原始2D高度: machine.height,
          计算原始宽度米: rawWidthMeters,
          计算原始高度米: rawHeightMeters,
          米到像素比例: meterToPixelRatio,
          最终绘制宽度: machineWidth,
          最终绘制高度: machineHeight,
          最小显示尺寸: minDisplaySize
        });
        
        // 绘制CNC机台
        ctx.fillStyle = isSelected ? '#faad14' : machine.color;
        ctx.strokeStyle = isSelected ? '#d48806' : '#333333';
        ctx.lineWidth = 2 / scale;
        
        // 绘制矩形（支持不同的宽高）
        // 修正坐标映射：与3D视图保持一致的坐标转换
        // 3D转换：x3D = machine.x / 100 * 5, z3D = machine.y / 100 * 5
        // 2D和3D现在使用统一的坐标系统，移除Z轴镜像
        const canvasX = machine.x;
        const canvasY = machine.y;
        
        ctx.fillRect(
          canvasX - machineWidth / 2,
          canvasY - machineHeight / 2,
          machineWidth,
          machineHeight
        );
        ctx.strokeRect(
          canvasX - machineWidth / 2,
          canvasY - machineHeight / 2,
          machineWidth,
          machineHeight
        );
        
        // 绘制选中状态的虚线框和控制按钮（仅在单选时显示）
        if (isSelected && selectedCNCMachines.length === 1) {
          const selectionPadding = 8 / scale; // 选中框的外边距，考虑缩放
          ctx.strokeStyle = '#1890ff'; // 蓝色虚线框
          ctx.lineWidth = 2 / scale;
          ctx.setLineDash([6 / scale, 4 / scale]); // 虚线样式
          
          ctx.strokeRect(
            canvasX - machineWidth / 2 - selectionPadding,
            canvasY - machineHeight / 2 - selectionPadding,
            machineWidth + selectionPadding * 2,
            machineHeight + selectionPadding * 2
          );
          
          ctx.setLineDash([]); // 重置虚线
          
          // 绘制控制按钮 - 参考地图编辑器的圆形按钮设计
          const buttonRadius = 12; // 控制按钮半径
          const buttonDistance = 45; // 控制按钮距离机台中心的距离
          
          // 绘制圆形移动按钮的通用函数
          const drawCircleButton = (x: number, y: number, direction: 'up' | 'down' | 'left' | 'right') => {
            // 绘制按钮背景圆形
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#d9d9d9';
            ctx.lineWidth = 1 / scale;
            ctx.beginPath();
            ctx.arc(x, y, buttonRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // 添加阴影效果
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 4 / scale;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2 / scale;
            ctx.beginPath();
            ctx.arc(x, y, buttonRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // 重置阴影
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 绘制箭头图标
            ctx.fillStyle = '#1890ff';
            ctx.strokeStyle = '#1890ff';
            ctx.lineWidth = 2 / scale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            const arrowSize = 4;
            ctx.beginPath();
            
            switch (direction) {
              case 'up':
                // 上箭头
                ctx.moveTo(x, y - arrowSize);
                ctx.lineTo(x - arrowSize, y + arrowSize);
                ctx.moveTo(x, y - arrowSize);
                ctx.lineTo(x + arrowSize, y + arrowSize);
                break;
              case 'down':
                // 下箭头
                ctx.moveTo(x, y + arrowSize);
                ctx.lineTo(x - arrowSize, y - arrowSize);
                ctx.moveTo(x, y + arrowSize);
                ctx.lineTo(x + arrowSize, y - arrowSize);
                break;
              case 'left':
                // 左箭头
                ctx.moveTo(x - arrowSize, y);
                ctx.lineTo(x + arrowSize, y - arrowSize);
                ctx.moveTo(x - arrowSize, y);
                ctx.lineTo(x + arrowSize, y + arrowSize);
                break;
              case 'right':
                // 右箭头
                ctx.moveTo(x + arrowSize, y);
                ctx.lineTo(x - arrowSize, y - arrowSize);
                ctx.moveTo(x + arrowSize, y);
                ctx.lineTo(x - arrowSize, y + arrowSize);
                break;
            }
            ctx.stroke();
          };
          
          // 绘制四个方向的移动按钮
          drawCircleButton(canvasX, canvasY - buttonDistance, 'up');     // 上移按钮
          drawCircleButton(canvasX, canvasY + buttonDistance, 'down');   // 下移按钮
          drawCircleButton(canvasX - buttonDistance, canvasY, 'left');   // 左移按钮
          drawCircleButton(canvasX + buttonDistance, canvasY, 'right');  // 右移按钮
          

        }
        
        // 绘制机台名称
        ctx.fillStyle = '#000000';
        ctx.font = `${10 / scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          machine.name,
          machine.x,
          machine.y + machineHeight / 2 + 15 / scale
        );
        
        ctx.restore();
      });

      ctx.restore();
    }

    // 绘制3D模型的顶视图
    console.log('🔍 [CANVAS] 检查3D模型顶视图渲染条件:', {
      viewMode,
      hasModelTopViewData: !!modelTopViewData,
      dataLength: modelTopViewData?.length || 0,
      modelTopViewData: modelTopViewData
    });
    
    if (viewMode === 'top' && modelTopViewData && modelTopViewData.length > 0) {
      console.log('✅ [CANVAS] 开始绘制3D模型顶视图，数据点数量:', modelTopViewData.length);
      ctx.save();
      
      // 设置3D模型顶视图的样式
      ctx.strokeStyle = '#ff6b35'; // 橙色线条
      ctx.lineWidth = 2 / scale;
      ctx.fillStyle = 'rgba(255, 107, 53, 0.1)'; // 半透明橙色填充
      
      // 开始绘制路径
      ctx.beginPath();
      
      // 将第一个点移动到起始位置
      const firstPoint = modelTopViewData[0];
      const firstX = (firstPoint.x - offsetX) * scale;
      const firstY = (firstPoint.y - offsetY) * scale;
      ctx.moveTo(firstX, firstY);
      
      // 连接所有点形成轮廓
      for (let i = 1; i < modelTopViewData.length; i++) {
        const point = modelTopViewData[i];
        const x = (point.x - offsetX) * scale;
        const y = (point.y - offsetY) * scale;
        ctx.lineTo(x, y);
      }
      
      // 闭合路径
      ctx.closePath();
      
      // 填充和描边
      ctx.fill();
      ctx.stroke();
      
      // 绘制顶视图的顶点
      ctx.fillStyle = '#ff6b35';
      modelTopViewData.forEach(point => {
        const x = (point.x - offsetX) * scale;
        const y = (point.y - offsetY) * scale;
        
        ctx.beginPath();
        ctx.arc(x, y, 3 / scale, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      ctx.restore();
    }

  }, [scale, offsetX, offsetY, walls, currentWall, selectedWalls, selectedSegments, isSelecting, selectionStart, selectionEnd, bezierDrawingState, cncMachines, selectedCNCMachines, viewMode, floorAreas, selectedFloorAreas, currentFloorPoints, isDrawingFloor, showFloorVertices, floorPreviewMousePos, modelTopViewData]);

  // 画布初始化和重绘
  useEffect(() => {
    drawCanvas();
  }, [scale, offsetX, offsetY, walls, currentWall, mousePosition, selectedWalls, selectedSegments, isSelecting, selectionStart, selectionEnd, bezierDrawingState, drawCanvas, viewMode, cncMachines, selectedCNCMachines, forceRedraw, floorAreas, selectedFloorAreas, currentFloorPoints, isDrawingFloor, showFloorVertices, floorPreviewMousePos]);

  // 监听窗口大小变化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      drawCanvas();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#f5f5f5',
      overflow: 'hidden',
      zIndex: 1
    }}>
      {/* 顶视图画布 */}
          {viewMode === 'top' && (
        <canvas
          ref={canvasRef}
          tabIndex={0}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundColor: '#f5f5f5',
            display: 'block',
            zIndex: 5,
            outline: 'none' // 移除焦点时的默认边框
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
          onWheel={handleWheel}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onContextMenu={handleContextMenu}
        />
      )}

      {/* 透视图编辑器 */}
          {viewMode === 'perspective' && (
        <ThreeDEditor
          ref={threeDEditorRef}
          walls={walls}
          cncMachines={cncMachines}
          floorAreas={floorAreas}
          selectedWall3DProps={selectedWall3DProps}
          selectedFloor3DProps={selectedFloor3DProps}
          sceneModel={uploadedSceneModel ? {
            file: uploadedSceneModel,
            name: uploadedSceneModel.name,
            size: uploadedSceneModel.size,
            type: uploadedSceneModel.type,
            previewUrl: URL.createObjectURL(uploadedSceneModel)
          } : undefined}
          onWallSelect={handleWallSelect}
          onCNCMachineSelect={(cncId) => {
            setCncMachines(prev => prev.map(cnc => ({
              ...cnc,
              selected: cnc.id === cncId
            })));
            openCNCPropertiesPanel(cncId);
          }}
          onModelLoaded={(topViewData) => {
            console.log('🎯 [EDITOR] 接收到3D模型顶视图数据:', topViewData);
            setModelTopViewData(topViewData);
            console.log('📝 [EDITOR] modelTopViewData状态已更新，数据点数量:', topViewData?.length || 0);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: '0', // 透视图模式下始终从左侧0位置开始
            right: '0', // 透视图模式下不为右侧面板预留空间
            width: '100%', // 透视图模式下始终占满全宽
            height: '100%',
            zIndex: 5
          }}
        />
      )}

      {/* 透视图模式下的悬浮墙体属性设置面板 */}
      {viewMode === 'perspective' && showWallPropertiesPanel && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '280px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 15,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <SettingOutlined style={{ color: '#1890ff' }} />
            墙体属性设置
          </div>

          {/* 墙体尺寸设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px',
              color: '#374151'
            }}>
              尺寸设置
            </div>
            
            {/* 宽度滑块 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>宽度 (X轴)</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedWall3DProps.width.toFixed(1)}m
                </span>
              </div>
              <Slider
                 min={0.1}
                 max={10}
                 step={0.1}
                 value={selectedWall3DProps.width}
                 onChange={(value) => {
                   const newWidth = value || 0.1;
                   setSelectedWall3DProps(prev => ({ ...prev, width: newWidth }));
                   updateWallPropertiesRealtime({ width: newWidth });
                 }}
                 tooltip={{ formatter: (value) => `${value}m` }}
               />
            </div>

            {/* 厚度滑块 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>厚度 (Y轴)</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedWall3DProps.thickness.toFixed(2)}m
                </span>
              </div>
              <Slider
                 min={0.05}
                 max={1}
                 step={0.01}
                 value={selectedWall3DProps.thickness}
                 onChange={(value) => {
                   const newThickness = value || 0.05;
                   setSelectedWall3DProps(prev => ({ ...prev, thickness: newThickness }));
                   updateWallPropertiesRealtime({ thickness: newThickness });
                 }}
                 tooltip={{ formatter: (value) => `${value}m` }}
               />
            </div>

            {/* 高度滑块 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>高度 (Z轴)</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedWall3DProps.height.toFixed(1)}m
                </span>
              </div>
              <Slider
                 min={0.5}
                 max={8}
                 step={0.1}
                 value={selectedWall3DProps.height}
                 onChange={(value) => {
                   const newHeight = value || 0.5;
                   setSelectedWall3DProps(prev => ({ ...prev, height: newHeight }));
                   updateWallPropertiesRealtime({ height: newHeight });
                 }}
                 tooltip={{ formatter: (value) => `${value}m` }}
               />
            </div>
          </div>

          {/* 外观设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px',
              color: '#374151'
            }}>
              外观设置
            </div>
            
            {/* 颜色选择器 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                墙体颜色
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#1f2937', '#ffffff'].map(color => (
                  <div
                    key={color}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: selectedWall3DProps.color === color ? '3px solid #1890ff' : '2px solid #e5e7eb',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                      boxShadow: color === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : 'none'
                    }}
                    onClick={() => {
                      setSelectedWall3DProps(prev => ({ ...prev, color }));
                      updateWallPropertiesRealtime({ color });
                    }}
                  />
                ))}
              </div>
              <ColorPicker
                value={selectedWall3DProps.color}
                onChange={(color) => setSelectedWall3DProps(prev => ({ ...prev, color: color.toHexString() }))}
                showText
                size="small"
                style={{ width: '100%' }}
              />
            </div>

            {/* 透明度滑块 */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>透明度</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {Math.round(selectedWall3DProps.opacity * 100)}%
                </span>
              </div>
              <Slider
                 min={0.1}
                 max={1}
                 step={0.05}
                 value={selectedWall3DProps.opacity}
                 onChange={(value) => {
                   const newOpacity = value || 0.1;
                   setSelectedWall3DProps(prev => ({ ...prev, opacity: newOpacity }));
                   updateWallPropertiesRealtime({ opacity: newOpacity });
                 }}
                 tooltip={{ formatter: (value) => `${Math.round((value || 0) * 100)}%` }}
               />
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px'
          }}>
            <Button 
              size="small"
              style={{ width: '100%' }}
              onClick={resetWall3DSettings}
            >
              重置属性
            </Button>
          </div>
        </div>
      )}

      {/* 透视图模式下的悬浮地面属性设置面板 */}
      {viewMode === 'perspective' && showFloorPropertiesPanel && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '280px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 15,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BorderInnerOutlined style={{ color: '#1890ff' }} />
            地面属性设置
            <span style={{
              fontSize: '12px',
              background: '#1890ff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 500
            }}>
              {floorAreas.length}
            </span>
          </div>

          {/* 地面尺寸设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px',
              color: '#374151'
            }}>
              尺寸设置
            </div>
            
            {/* 厚度滑块 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>厚度 (Z轴)</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedFloor3DProps.thickness.toFixed(2)}m
                </span>
              </div>
              <Slider
                 min={0.01}
                 max={0.5}
                 step={0.01}
                 value={selectedFloor3DProps.thickness}
                 onChange={(value) => {
                   const newThickness = value || 0.01;
                   setSelectedFloor3DProps(prev => ({ ...prev, thickness: newThickness }));
                   updateFloorPropertiesRealtime({ thickness: newThickness });
                 }}
                 tooltip={{ formatter: (value) => `${value}m` }}
               />
            </div>
          </div>

          {/* 外观设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px',
              color: '#374151'
            }}>
              外观设置
            </div>
            
            {/* 颜色选择器 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                地面颜色
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {['#f0f0f0', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#1f2937', '#ffffff'].map(color => (
                  <div
                    key={color}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: selectedFloor3DProps.color === color ? '3px solid #1890ff' : '2px solid #e5e7eb',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                      boxShadow: color === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : 'none'
                    }}
                    onClick={() => {
                      setSelectedFloor3DProps(prev => ({ ...prev, color }));
                      updateFloorPropertiesRealtime({ color });
                    }}
                  />
                ))}
              </div>
              <ColorPicker
                value={selectedFloor3DProps.color}
                onChange={(color) => {
                  const newColor = color.toHexString();
                  setSelectedFloor3DProps(prev => ({ ...prev, color: newColor }));
                  updateFloorPropertiesRealtime({ color: newColor });
                }}
                showText
                size="small"
                style={{ width: '100%' }}
              />
            </div>

            {/* 透明度滑块 */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>透明度</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {Math.round(selectedFloor3DProps.opacity * 100)}%
                </span>
              </div>
              <Slider
                 min={0.1}
                 max={1}
                 step={0.05}
                 value={selectedFloor3DProps.opacity}
                 onChange={(value) => {
                   const newOpacity = value || 0.1;
                   setSelectedFloor3DProps(prev => ({ ...prev, opacity: newOpacity }));
                   updateFloorPropertiesRealtime({ opacity: newOpacity });
                 }}
                 tooltip={{ formatter: (value) => `${Math.round((value || 0) * 100)}%` }}
               />
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px'
          }}>
            <Button 
              size="small"
              style={{ width: '100%' }}
              onClick={resetFloorProperties}
            >
              重置属性
            </Button>
          </div>
        </div>
      )}

      {/* 透视图模式下的悬浮设备属性设置面板 */}
      {viewMode === 'perspective' && showDevicePropertiesPanel && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '280px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 15,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <SettingOutlined style={{ color: '#1890ff' }} />
            设备属性设置
            <span style={{
              fontSize: '12px',
              background: '#1890ff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 500
            }}>
              光源
            </span>
          </div>

          {/* 环境光设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#374151'
                }}>
                  环境光设置
                </span>
                <ColorPicker
                  value={lightingSettings.ambientLight.color}
                  onChange={(color) => {
                    const newColor = color.toHexString();
                    setLightingSettings(prev => ({
                      ...prev,
                      ambientLight: { ...prev.ambientLight, color: newColor }
                    }));
                    // 更新Three.js中的环境光颜色
                    const scene = threeDEditorRef.current?.getScene();
                    if (scene) {
                      const ambientLight = scene.children.find((child: any) => child.type === 'AmbientLight');
                      if (ambientLight) {
                        (ambientLight as THREE.AmbientLight).color.setHex(parseInt(newColor.replace('#', ''), 16));
                      }
                    }
                  }}
                  size="small"
                  trigger="hover"
                />
              </div>

            </div>
            
            {/* 环境光强度 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>强度</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {lightingSettings.ambientLight.intensity.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0.1}
                max={2.0}
                step={0.1}
                value={lightingSettings.ambientLight.intensity}
                onChange={(value) => {
                  const newIntensity = value || 0.1;
                  setLightingSettings(prev => ({
                    ...prev,
                    ambientLight: { ...prev.ambientLight, intensity: newIntensity }
                  }));
                  // 更新Three.js中的环境光
                  const scene = threeDEditorRef.current?.getScene();
                  if (scene) {
                    const ambientLight = scene.children.find((child: any) => child.type === 'AmbientLight');
                    if (ambientLight) {
                      (ambientLight as THREE.AmbientLight).intensity = newIntensity;
                    }
                  }
                }}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </div>
          </div>

          {/* 主方向光设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#374151'
                }}>
                  主方向光设置
                </span>
                <ColorPicker
                  value={lightingSettings.directionalLight.color}
                  onChange={(color) => {
                    const newColor = color.toHexString();
                    setLightingSettings(prev => ({
                      ...prev,
                      directionalLight: { ...prev.directionalLight, color: newColor }
                    }));
                    // 更新Three.js中的主方向光颜色
                    const scene = threeDEditorRef.current?.getScene();
                    if (scene) {
                      const mainLight = scene.children.find((child: any) => 
                        child.type === 'DirectionalLight' && child.name === 'mainDirectionalLight'
                      );
                      if (mainLight) {
                        (mainLight as THREE.DirectionalLight).color.setHex(parseInt(newColor.replace('#', ''), 16));
                      }
                    }
                  }}
                  size="small"
                  trigger="hover"
                />
              </div>

            </div>
            
            {/* 主方向光强度 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>强度</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {lightingSettings.directionalLight.intensity.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0.1}
                max={3.0}
                step={0.1}
                value={lightingSettings.directionalLight.intensity}
                 onChange={(value) => {
                   const newIntensity = value || 0.1;
                   setLightingSettings(prev => ({
                     ...prev,
                     directionalLight: { ...prev.directionalLight, intensity: newIntensity }
                   }));
                   // 更新Three.js中的主方向光
                   const scene = threeDEditorRef.current?.getScene();
                   if (scene) {
                     const mainLight = scene.children.find((child: any) => 
                       child.type === 'DirectionalLight' && child.name === 'mainDirectionalLight'
                     );
                     if (mainLight) {
                       (mainLight as THREE.DirectionalLight).intensity = newIntensity;
                     }
                   }
                }}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </div>
          </div>

          {/* 填充光设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#374151'
                }}>
                  填充光设置
                </span>
                <ColorPicker
                  value={lightingSettings.fillLight.color}
                  onChange={(color) => {
                    const newColor = color.toHexString();
                    setLightingSettings(prev => ({
                      ...prev,
                      fillLight: { ...prev.fillLight, color: newColor }
                    }));
                    // 更新Three.js中的填充光颜色
                    const scene = threeDEditorRef.current?.getScene();
                    if (scene) {
                      const fillLight = scene.children.find((child: any) => 
                        child.type === 'DirectionalLight' && child.name === 'fillDirectionalLight'
                      );
                      if (fillLight) {
                        (fillLight as THREE.DirectionalLight).color.setHex(parseInt(newColor.replace('#', ''), 16));
                      }
                    }
                  }}
                  size="small"
                  trigger="hover"
                />
              </div>

            </div>
            
            {/* 填充光强度 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>强度</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {lightingSettings.fillLight.intensity.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0.1}
                max={2.0}
                step={0.1}
                value={lightingSettings.fillLight.intensity}
                onChange={(value) => {
                  const newIntensity = value || 0.1;
                  setLightingSettings(prev => ({
                    ...prev,
                    fillLight: { ...prev.fillLight, intensity: newIntensity }
                  }));
                  // 更新Three.js中的填充光
                  const scene = threeDEditorRef.current?.getScene();
                  if (scene) {
                    const fillLight = scene.children.find((child: any) => 
                      child.type === 'DirectionalLight' && child.name === 'fillDirectionalLight'
                    );
                    if (fillLight) {
                      (fillLight as THREE.DirectionalLight).intensity = newIntensity;
                    }
                  }
                }}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </div>
          </div>

          {/* 点光源设置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#374151'
                }}>
                  点光源设置
                </span>
                <ColorPicker
                  value={lightingSettings.pointLight1.color}
                  onChange={(color) => {
                    const newColor = color.toHexString();
                    setLightingSettings(prev => ({
                      ...prev,
                      pointLight1: { ...prev.pointLight1, color: newColor },
                      pointLight2: { ...prev.pointLight2, color: newColor },
                      pointLight3: { ...prev.pointLight3, color: newColor }
                    }));
                    // 更新Three.js中的所有点光源颜色
                    const scene = threeDEditorRef.current?.getScene();
                    if (scene) {
                      scene.children.forEach(child => {
                        if (child.type === 'PointLight') {
                          (child as THREE.PointLight).color.setHex(parseInt(newColor.replace('#', ''), 16));
                        }
                      });
                    }
                  }}
                  size="small"
                />
              </div>

            </div>
            
            {/* 点光源强度 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>强度</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {lightingSettings.pointLight1.intensity.toFixed(2)}
                </span>
              </div>
              <Slider
                min={0.1}
                max={3.0}
                step={0.1}
                value={lightingSettings.pointLight1.intensity}
                onChange={(value) => {
                  const newIntensity = value || 0.1;
                  setLightingSettings(prev => ({
                    ...prev,
                    pointLight1: { ...prev.pointLight1, intensity: newIntensity },
                    pointLight2: { ...prev.pointLight2, intensity: newIntensity },
                    pointLight3: { ...prev.pointLight3, intensity: newIntensity }
                  }));
                  // 更新Three.js中的所有点光源
                  const scene = threeDEditorRef.current?.getScene();
                  if (scene) {
                    scene.children.forEach((child: any) => {
                      if (child.type === 'PointLight') {
                        (child as THREE.PointLight).intensity = newIntensity;
                      }
                    });
                  }
                }}
                tooltip={{ formatter: (value) => `${value}` }}
              />
            </div>

            {/* 点光源距离 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>照射距离</span>
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#1890ff',
                  background: '#f0f9ff',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {lightingSettings.pointLight1.distance.toFixed(0)}m
                </span>
              </div>
              <Slider
                min={10}
                max={100}
                step={5}
                value={lightingSettings.pointLight1.distance}
                onChange={(value) => {
                  const newDistance = value || 10;
                  setLightingSettings(prev => ({
                    ...prev,
                    pointLight1: { ...prev.pointLight1, distance: newDistance },
                    pointLight2: { ...prev.pointLight2, distance: newDistance },
                    pointLight3: { ...prev.pointLight3, distance: newDistance }
                  }));
                  // 更新Three.js中的所有点光源距离
                  const scene = threeDEditorRef.current?.getScene();
                  if (scene) {
                    scene.children.forEach((child: any) => {
                      if (child.type === 'PointLight') {
                        (child as THREE.PointLight).distance = newDistance;
                      }
                    });
                  }
                }}
                tooltip={{ formatter: (value) => `${value}m` }}
              />
            </div>

            {/* 重置按钮 */}
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '16px', 
              borderTop: '1px solid #f0f0f0',
              textAlign: 'center'
            }}>
              <Button 
                size="small"
                onClick={resetDeviceSettings}
                style={{ width: '100%' }}
              >
                重置属性
              </Button>
            </div>
          </div>


        </div>
      )}

      {/* 中间悬浮控制栏 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: leftPanelVisible && rightPanelVisible ? 'calc(240px + (100vw - 480px) / 2)' :
              leftPanelVisible ? 'calc(240px + (100vw - 240px) / 2)' :
              rightPanelVisible ? 'calc((100vw - 240px) / 2)' : '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px'
      }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            size="small"
            type="text"
            onClick={handleBack}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            返回
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            size="small"
            type="text"
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            刷新
          </Button>
          <Button 
            icon={<HomeOutlined />} 
            size="small"
            type="text"
            onClick={resetView}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            重置视图
          </Button>
          <Button 
            icon={<VerticalAlignTopOutlined />}
            size="small"
            type="text"
            onClick={handleTopView}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            顶视图
          </Button>
          <Button 
            icon={<BorderOutlined />}
            size="small"
            type="text"
            onClick={handleFrontView}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            透视图
          </Button>
          {viewMode === 'top' && (
            <Button 
              icon={allPanelsVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              size="small"
              type="text"
              onClick={toggleAllPanels}
              style={{
                color: '#666',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              {allPanelsVisible ? '隐藏全部' : '显示全部'}
            </Button>
          )}
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            size="small"
            type="text"
            onClick={toggleFullscreen}
            style={{
              color: '#666',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
          {/* 地面属性和墙体属性按钮只在透视图模式下显示 */}
          {viewMode === 'perspective' && (
            <>
              <Button
                icon={<BorderInnerOutlined />}
                size="small"
                type="text"
                onClick={() => {
                  setShowFloorPropertiesPanel(!showFloorPropertiesPanel);
                  if (!showFloorPropertiesPanel) {
                    setShowWallPropertiesPanel(false);
                    setShowDevicePropertiesPanel(false);
                  }
                }}
                style={{
                  color: showFloorPropertiesPanel ? '#1890ff' : '#666',
                  backgroundColor: showFloorPropertiesPanel ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                地面属性
              </Button>
              <Button
                icon={<BuildOutlined />}
                size="small"
                type="text"
                onClick={() => {
                  setShowWallPropertiesPanel(!showWallPropertiesPanel);
                  if (!showWallPropertiesPanel) {
                    setShowFloorPropertiesPanel(false);
                    setShowDevicePropertiesPanel(false);
                  }
                }}
                style={{
                  color: showWallPropertiesPanel ? '#1890ff' : '#666',
                  backgroundColor: showWallPropertiesPanel ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                墙体属性
              </Button>
              <Button
                icon={<ToolOutlined />}
                size="small"
                type="text"
                onClick={() => {
                  setShowDevicePropertiesPanel(!showDevicePropertiesPanel);
                  if (!showDevicePropertiesPanel) {
                    setShowFloorPropertiesPanel(false);
                    setShowWallPropertiesPanel(false);
                  }
                }}
                style={{
                  color: showDevicePropertiesPanel ? '#1890ff' : '#666',
                  backgroundColor: showDevicePropertiesPanel ? 'rgba(24, 144, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                设备属性
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 左侧产品模型管理面板 */}
      {leftPanelVisible && viewMode === 'top' && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          bottom: '0',
          width: '240px',
          height: '100%',
          background: '#ffffff',
          borderRight: '1px solid #e8e8e8',
          zIndex: 5,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            background: 'rgba(24, 144, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <Space>
                <AppstoreOutlined style={{ color: '#1890ff' }} />
                <Text style={{ fontWeight: 'bold', color: '#1890ff' }}>产品模型管理</Text>
              </Space>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleLeftPanel}
              />
            </div>
            <Input.Search
               placeholder="搜索产品模型..."
               value={modelSearchText}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelSearchText(e.target.value)}
               size="small"
               allowClear
               style={{ width: '100%' }}
             />
          </div>
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 65px)',
            overflow: 'auto'
          }}>
            <List
              dataSource={getFilteredModels()}
              renderItem={(model: ProductModel) => (
                <List.Item
                  style={{
                    padding: '12px',
                    cursor: model.type === 'cnc' ? 'grab' : 'pointer',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                  draggable={model.type === 'cnc'}
                  onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                    if (model.type === 'cnc') {
                      setDraggedCNCModel(model);
                      e.dataTransfer.setData('text/plain', JSON.stringify(model));
                      e.dataTransfer.effectAllowed = 'copy';
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedCNCModel(null);
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1890ff'
                      }}>
                        {model.icon}
                      </div>
                    }
                    title={
                      <Text style={{ fontSize: '13px', fontWeight: 500 }}>
                        {model.name}
                      </Text>
                    }
                    description={
                      <Text style={{ fontSize: '11px', color: '#666' }}>
                        {model.description}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      )}

      {/* 楼层切换和设置按钮组 */}
      {leftPanelVisible && viewMode === 'top' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '260px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* 楼层切换按钮 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '8px 10px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
          }}>
            <Space direction="vertical" size={6} style={{ alignItems: 'center' }}>
              <Text style={{ 
                fontSize: '11px', 
                color: '#666', 
                fontWeight: 600,
                textAlign: 'center',
                display: 'block'
              }}>
                楼层
              </Text>
              <Space direction="vertical" size={4}>
                {floorScenes.map((scene) => (
                  <Button
                    key={scene.id}
                    type={currentFloor === scene.id ? 'primary' : 'default'}
                    size="small"
                    style={{
                      width: '36px',
                      height: '24px',
                      fontSize: '11px',
                      fontWeight: currentFloor === scene.id ? 600 : 500,
                      borderRadius: '8px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: currentFloor === scene.id ? 'none' : '1px solid #e8e8e8',
                      boxShadow: currentFloor === scene.id ? '0 1px 6px rgba(24, 144, 255, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0',
                    }}
                    onClick={() => switchFloor(scene.id)}
                    onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                      if (currentFloor !== scene.id) {
                        e.currentTarget.style.transform = 'scale(1.05) translateX(1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                      if (currentFloor !== scene.id) {
                        e.currentTarget.style.transform = 'scale(1) translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {scene.name}
                  </Button>
                ))}
              </Space>
            </Space>
          </div>

          {/* 设置按钮 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
          }}>
            <Button
              type="default"
              icon={<SettingOutlined />}
              size="small"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '24px',
                width: '36px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => openSceneListModal()}
               onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                 e.currentTarget.style.transform = 'scale(1.05) translateX(1px)';
                 e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                 e.currentTarget.style.borderColor = '#1890ff';
               }}
               onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                 e.currentTarget.style.transform = 'scale(1) translateX(0)';
                 e.currentTarget.style.boxShadow = 'none';
                 e.currentTarget.style.borderColor = '#e8e8e8';
               }}
            />
          </div>
        </div>
      )}

      {/* CNC机台对齐工具栏 - 仅在多选时显示 */}
      {rightPanelVisible && viewMode === 'top' && selectedCNCMachines.length >= 2 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '320px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>


          {/* 对齐按钮组 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {/* 左对齐 */}
            <Button
              type="default"
              icon={<AlignLeftOutlined />}
              size="small"
              title="左对齐"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleCNCMachineAlign('left')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 右对齐 */}
            <Button
              type="default"
              icon={<AlignRightOutlined />}
              size="small"
              title="右对齐"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleCNCMachineAlign('right')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 上对齐 */}
            <Button
              type="default"
              icon={<VerticalAlignTopOutlined />}
              size="small"
              title="上对齐"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleCNCMachineAlign('top')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 下对齐 */}
            <Button
              type="default"
              icon={<VerticalAlignBottomOutlined />}
              size="small"
              title="下对齐"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleCNCMachineAlign('bottom')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 横向平均分布 */}
            <Button
              type="default"
              icon={<AlignCenterOutlined />}
              size="small"
              title="横向平均分布"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleCNCMachineAlign('horizontal')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 纵向平均分布 */}
            <Button
              type="default"
              icon={<VerticalAlignMiddleOutlined />}
              size="small"
              title="纵向平均分布"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => handleCNCMachineAlign('vertical')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />
          </div>
        </div>
      )}

      {/* 画布操作工具栏 - 位于画布右侧中间位置 */}
      {viewMode === 'top' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: rightPanelVisible ? '260px' : '20px', // 根据右侧面板状态调整位置
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* 画布操作工具组 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {/* 拖动画布工具 */}
            <Button
              type={canvasOperationMode === 'drag' ? 'primary' : 'default'}
              icon={<DragOutlined />}
              size="small"
              title="拖动画布"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: canvasOperationMode === 'drag' ? 'none' : '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: canvasOperationMode === 'drag' ? '0 1px 6px rgba(24, 144, 255, 0.3)' : 'none',
              }}
              onClick={handleCanvasDrag}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                if (canvasOperationMode !== 'drag') {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                  e.currentTarget.style.borderColor = '#1890ff';
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                if (canvasOperationMode !== 'drag') {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                }
              }}
            />

            {/* 放大工具 */}
            <Button
              type="default"
              icon={<ZoomInOutlined />}
              size="small"
              title="放大画布"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={handleZoomIn}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 缩小工具 */}
            <Button
              type="default"
              icon={<ZoomOutOutlined />}
              size="small"
              title="缩小画布"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={handleZoomOut}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            />

            {/* 撤销工具 */}
            <Button
              type="default"
              icon={<UndoOutlined />}
              size="small"
              title="撤销"
              disabled={undoStack.length === 0}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: undoStack.length === 0 ? 0.5 : 1,
              }}
              onClick={handleUndo}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                if (undoStack.length > 0) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                  e.currentTarget.style.borderColor = '#1890ff';
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                if (undoStack.length > 0) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                }
              }}
            />

            {/* 重做工具 */}
            <Button
              type="default"
              icon={<RedoOutlined />}
              size="small"
              title="重做"
              disabled={redoStack.length === 0}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid #e8e8e8',
                height: '28px',
                width: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: redoStack.length === 0 ? 0.5 : 1,
              }}
              onClick={handleRedo}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                if (redoStack.length > 0) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                  e.currentTarget.style.borderColor = '#1890ff';
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                if (redoStack.length > 0) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 右侧绘图工具面板 */}
      {rightPanelVisible && viewMode === 'top' && (
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          bottom: '0',
          width: '240px',
          height: '100%',
          background: '#ffffff',
          borderLeft: '1px solid #e8e8e8',
          zIndex: 5,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            background: 'rgba(24, 144, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <Space>
                <ToolOutlined style={{ color: '#1890ff' }} />
                <Text style={{ fontWeight: 'bold', color: '#1890ff' }}>绘图工具</Text>
              </Space>
              <Button 
                icon={<EyeInvisibleOutlined />} 
                size="small" 
                type="text"
                onClick={toggleRightPanel}
              />
            </div>
          </div>
          <div style={{ 
            padding: '12px',
            height: 'calc(100% - 65px)',
            overflow: 'auto'
          }}>
            {drawingTools.map((tool) => (
              <Card
                key={tool.id}
                size="small"
                style={{
                  marginBottom: '12px',
                  cursor: 'pointer',
                  border: tool.active ? '2px solid #1890ff' : '1px solid #e8e8e8',
                  backgroundColor: tool.active ? 'rgba(24, 144, 255, 0.05)' : '#ffffff'
                }}
                onClick={() => selectDrawingTool(tool.id)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: tool.active ? '#1890ff' : 'rgba(24, 144, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tool.active ? '#ffffff' : '#1890ff'
                  }}>
                    {tool.icon}
                  </div>
                  <div>
                    <Text style={{ 
                      fontSize: '13px', 
                      fontWeight: 500,
                      color: tool.active ? '#1890ff' : '#333'
                    }}>
                      {tool.name}
                    </Text>
                    <div>
                      <Text style={{ fontSize: '11px', color: '#666' }}>
                        {tool.description}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {/* 墙体样式配置区域 */}
            {getActiveTool()?.type === 'wall' && (
              <>
                <Divider style={{ margin: '16px 0 12px 0' }}>
                  <Text style={{ fontSize: '12px', color: '#666' }}>墙体样式</Text>
                </Divider>
                
                <Card size="small" style={{ marginBottom: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                      厚度 (px)
                    </Text>
                    <Input
                      type="number"
                      size="small"
                      value={wallStyle.thickness}
                      min={1}
                      max={50}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWallStyle(prev => ({
                       ...prev,
                       thickness: parseInt(e.target.value) || 1
                     }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div>
                    <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
                      颜色
                    </Text>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['#333333', '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'].map(color => (
                        <div
                          key={color}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: wallStyle.color === color ? '2px solid #1890ff' : '1px solid #e8e8e8',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => setWallStyle(prev => ({
                            ...prev,
                            color: color
                          }))}
                        />
                      ))}
                    </div>
                    <Input
                      size="small"
                      value={wallStyle.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWallStyle(prev => ({
                       ...prev,
                       color: e.target.value
                     }))}
                      style={{ width: '100%', marginTop: '6px' }}
                      placeholder="自定义颜色 (#hex)"
                    />
                  </div>
                </Card>
                
                {/* 墙体操作按钮 */}
                 <Card size="small" style={{ marginBottom: '12px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>


                   </div>
                 </Card>
                 

              </>
            )}
          </div>
        </div>
      )}

      {/* 场景列表对话框 */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>场景管理</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={openNewSceneModal}
              style={{
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                fontSize: '12px'
              }}
            >
              新增场景
            </Button>
          </div>
        }
        open={sceneListModalVisible}
        onCancel={() => setSceneListModalVisible(false)}
        footer={null}
        width={600}
      >
        {/* 场景列表 */}
        <div>
          <List
            dataSource={floorScenes}
            renderItem={(scene: FloorScene) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditSceneModal(scene)}
                  >
                    编辑
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteScene(scene.id)}
                    disabled={floorScenes.length <= 1}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={scene.name}
                  description={
                    scene.dataSource 
                      ? mockMapData.find(map => map.id === scene.dataSource)?.name || `${scene.floor}楼`
                      : `${scene.floor}楼`
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>

      {/* 新增/编辑场景对话框 */}
      <Modal
        title={editingScene ? '编辑场景' : '新增场景'}
        open={newSceneModalVisible}
        onOk={saveScene}
        onCancel={() => {
          console.log('❌ [MODAL-CANCEL] 取消新增/编辑场景，开始清理状态:', {
            newSceneModalVisible,
            uploadedSceneModel: uploadedSceneModel ? {
              name: uploadedSceneModel.name,
              size: uploadedSceneModel.size
            } : null,
            callStack: new Error().stack?.split('\n').slice(1, 5).join('\n')
          });
          setNewSceneModalVisible(false);
          setEditingScene(null);
          setSelectedMapId(null);
          setAvailableBaseMaps([]);
          setInitializeDevicesValue(true); // 重置初始化设备状态
          console.log('🗑️ [MODAL-CANCEL] 清理uploadedSceneModel状态');
          setUploadedSceneModel(null); // 重置上传的3D模型状态
          sceneForm.resetFields();
        }}
        width={500}
      >
        <Form
          form={sceneForm}
          layout="vertical"
          initialValues={{
            floor: floorScenes.length + 1
          }}
        >
          <Form.Item
            label="场景名称"
            name="name"
            rules={[{ required: true, message: '请输入场景名称' }]}
          >
            <Input placeholder="例如：1楼、2楼、3楼" />
          </Form.Item>
          
          <Form.Item
            label="楼层编号"
            name="floor"
            rules={[{ required: true, message: '请输入楼层编号' }]}
          >
            <Input type="number" placeholder="请输入楼层编号" />
          </Form.Item>
          
          <Form.Item
            label="场景基础数据源"
            name="dataSource"
            rules={[{ required: true, message: '请选择场景基础数据源' }]}
          >
            <Select 
               placeholder="请选择地图数据源"
               onChange={handleMapChange}
             >
              {mockMapData.map(map => (
                <Option key={map.id} value={map.id}>
                  {map.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="底图选择"
            name="baseMap"
            rules={[{ required: true, message: '请选择底图' }]}
          >
            <Select 
               placeholder="请先选择地图数据源"
               disabled={!selectedMapId || availableBaseMaps.length === 0}
               onChange={handleBaseMapChange}
             >
              {availableBaseMaps.map(baseMap => (
                <Option key={baseMap.id} value={baseMap.id}>
                  {baseMap.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="是否初始化地图关联设备"
            name="initializeDevices"
            rules={[{ required: true, message: '请选择是否初始化地图关联设备' }]}
            initialValue={true}
          >
            <Select 
              placeholder="请选择是否初始化设备"
              onChange={handleInitializeDevicesChange}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          
          {initializeDevicesValue === false && (
            <Form.Item
              label="是否增量更新"
              name="increaseUpdate"
              rules={[{ required: true, message: '请选择是否增量更新' }]}
              initialValue={false}
            >
              <Select placeholder="请选择是否增量更新">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
          )}
          
          <Form.Item
            label="导入3D场景模型"
            name="sceneModel"
            tooltip="支持GLB、GLTF格式的3D模型文件，用于增强场景的三维展示效果"
          >
            <div>
              <Upload
                accept=".glb,.gltf"
                fileList={uploadedSceneModel ? [{
                  uid: uploadedSceneModel.name,
                  name: uploadedSceneModel.name,
                  status: 'done',
                  size: uploadedSceneModel.size,
                  type: uploadedSceneModel.type
                }] : []}
                beforeUpload={(file) => {
                  const isValidFormat = file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf');
                  if (!isValidFormat) {
                    message.error('只支持GLB或GLTF格式的3D模型文件！');
                    return false;
                  }
                  const isLt50M = file.size / 1024 / 1024 < 50;
                  if (!isLt50M) {
                    message.error('文件大小不能超过50MB！');
                    return false;
                  }
                  
                  // 保存文件到状态
                  setUploadedSceneModel(file);
                  
                  // 创建预览URL并更新表单
                  const url = URL.createObjectURL(file);
                  sceneForm.setFieldsValue({
                    sceneModel: {
                      file: file,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      url: url
                    }
                  });
                  
                  message.success('3D模型文件上传成功！');
                  return false; // 阻止自动上传
                }}
                onRemove={(file) => {
                  console.log('🗑️ [UPLOAD] onRemove回调被触发:', {
                    fileName: file?.name || 'unknown',
                    fileSize: file?.size || 0,
                    currentUploadedModel: uploadedSceneModel?.name || 'null',
                    newSceneModalVisible,
                    stackTrace: new Error().stack
                  });
                  
                  // 只有在Modal打开且用户主动点击删除按钮时才清理状态
                  // 避免在表单重置或Modal关闭时被意外触发
                  if (newSceneModalVisible && uploadedSceneModel && file && file.name === uploadedSceneModel.name) {
                    console.log('✅ [UPLOAD] 确认删除文件:', file.name);
                    setUploadedSceneModel(null);
                    sceneForm.setFieldsValue({ sceneModel: null });
                    message.info('已移除3D模型文件');
                  } else {
                    console.log('⚠️ [UPLOAD] 跳过删除操作 - Modal未打开或文件不匹配或状态异常');
                  }
                }}
                showUploadList={{
                  showPreviewIcon: true,
                  showRemoveIcon: true,
                  showDownloadIcon: false,
                }}
                maxCount={1}
              >
                <Button icon={<PlusOutlined />} style={{ width: '100%' }}>
                  选择3D模型文件
                </Button>
              </Upload>
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                支持格式：GLB、GLTF | 文件大小：≤50MB
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 墙体属性设置面板 */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>墙体属性设置</span>
          </div>
        }
        open={showPropertiesPanel}
        onCancel={closePropertiesPanel}
        footer={[
          <Button key="cancel" onClick={closePropertiesPanel}>
            取消
          </Button>,
          <Button 
            key="delete" 
            danger 
            onClick={() => {
              deleteSelectedWalls();
              closePropertiesPanel();
            }}
          >
            删除墙体
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => {
              propertiesForm.submit();
            }}
          >
            应用更改
          </Button>,
        ]}
        width={500}
      >
        <Form
           form={propertiesForm}
           layout="vertical"
           onFinish={(values: any) => {
             updateWallProperties(values);
             closePropertiesPanel();
           }}
         >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="宽度 (X轴)"
                name="width"
                rules={[{ required: true, message: '请输入宽度' }]}
              >
                <Input 
                  type="number" 
                  placeholder="单位：米" 
                  min={0.1}
                  step={0.1}
                  suffix="m"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="厚度 (Y轴)"
                name="thickness"
                rules={[{ required: true, message: '请输入厚度' }]}
              >
                <Input 
                  type="number" 
                  placeholder="单位：米" 
                  min={0.01}
                  step={0.01}
                  suffix="m"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="高度 (Z轴)"
            name="height"
            rules={[{ required: true, message: '请输入高度' }]}
          >
            <Input 
              type="number" 
              placeholder="单位：米" 
              min={0.1}
              step={0.1}
              suffix="m"
            />
          </Form.Item>
          
          <Form.Item
            label="墙体颜色"
            name="color"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#333333', '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'].map(color => (
                  <div
                    key={color}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: propertiesFormData?.color === color ? '3px solid #1890ff' : '2px solid #e8e8e8',
                       boxSizing: 'border-box',
                       transition: 'all 0.2s ease'
                     }}
                     onClick={() => {
                       setPropertiesFormData(prev => prev ? { ...prev, color } : null);
                       propertiesForm.setFieldsValue({ color });
                     }}
                  />
                ))}
              </div>
              <Input
                 placeholder="自定义颜色 (#hex)"
                 value={propertiesFormData?.color || ''}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                   const color = e.target.value;
                   setPropertiesFormData(prev => prev ? { ...prev, color } : null);
                   propertiesForm.setFieldsValue({ color });
                 }}
               />
            </div>
          </Form.Item>
          
          <Form.Item
            label="墙体类型"
            name="type"
          >
            <Select placeholder="选择墙体类型">
              <Option value="line">直线墙体</Option>
              <Option value="bezier">曲线墙体</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* CNC机台属性设置面板 */}
      <Modal
        title="CNC机台属性设置"
        open={showCNCPropertiesPanel}
        onOk={() => {
          console.log('🚀 [DEBUG] Modal确认按钮被点击');
          console.log('📋 [DEBUG] 当前表单数据状态:', cncPropertiesFormData);
          console.log('🎯 [DEBUG] 当前选中CNC ID:', cncPropertiesFormData?.cncId);
          console.log('📊 [DEBUG] 当前CNC机台列表长度:', cncMachines.length);
          
          cncPropertiesForm.validateFields().then((values: any) => {
            console.log('✅ [DEBUG] Modal表单验证通过');
            console.log('📝 [DEBUG] 验证后的表单值:', values);
            console.log('🔍 [DEBUG] 表单值详细检查:', {
              width: { value: values.width, type: typeof values.width },
              height: { value: values.height, type: typeof values.height },
              depth3D: { value: values.depth3D, type: typeof values.depth3D },
              name: { value: values.name, type: typeof values.name },
              color: { value: values.color, type: typeof values.color },
              currentModel: { value: values.currentModel, type: typeof values.currentModel },
              modelFile: { value: values.modelFile, type: typeof values.modelFile },
              modelUrl: { value: values.modelUrl, type: typeof values.modelUrl },
              modelFileName: { value: values.modelFileName, type: typeof values.modelFileName }
            });
            
            console.log('🔧 [DEBUG] 准备调用updateCNCProperties函数');
            updateCNCProperties(values);
            
            console.log('🚪 [DEBUG] 准备关闭面板');
            closeCNCPropertiesPanel();
          }).catch((error: any) => {
            console.error('❌ [DEBUG] Modal表单验证失败:', error);
            console.error('🔍 [DEBUG] 验证错误详情:', JSON.stringify(error, null, 2));
          });
        }}
        onCancel={closeCNCPropertiesPanel}
        okText="应用更改"
        cancelText="取消"
        width={1200}
        style={{ top: 20 }}
        footer={[
          <Button key="cancel" onClick={closeCNCPropertiesPanel}>
            取消
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              console.log('🎯 [DEBUG] 应用更改按钮被点击');
              console.log('📋 [DEBUG] 当前表单数据状态:', cncPropertiesFormData);
              console.log('🎯 [DEBUG] 当前选中CNC ID:', cncPropertiesFormData?.cncId);
              console.log('📊 [DEBUG] 当前CNC机台列表长度:', cncMachines.length);
              
              cncPropertiesForm.validateFields().then((values: any) => {
                console.log('✅ [DEBUG] 应用按钮 - 表单验证通过');
                console.log('📝 [DEBUG] 应用按钮 - 验证后的表单值:', values);
                console.log('🔍 [DEBUG] 应用按钮 - 表单值详细检查:', {
                  width: { value: values.width, type: typeof values.width },
                  height: { value: values.height, type: typeof values.height },
                  depth3D: { value: values.depth3D, type: typeof values.depth3D },
                  name: { value: values.name, type: typeof values.name },
                  color: { value: values.color, type: typeof values.color }
                });
                
                console.log('🔧 [DEBUG] 应用按钮 - 准备调用updateCNCProperties函数');
                updateCNCProperties(values);
                
                console.log('🚪 [DEBUG] 应用按钮 - 准备关闭面板');
                closeCNCPropertiesPanel();
              }).catch((error: any) => {
                console.error('❌ [DEBUG] 应用按钮 - 表单验证失败:', error);
                console.error('🔍 [DEBUG] 应用按钮 - 验证错误详情:', JSON.stringify(error, null, 2));
              });
            }}
          >
            应用更改
          </Button>
        ]}
      >
        <Row gutter={24} style={{ minHeight: '700px' }}>
          <Col span={14}>
            <Form
              form={cncPropertiesForm}
              layout="vertical"
              initialValues={cncPropertiesFormData}
              onValuesChange={(changedValues: any, allValues: any) => {
                // 输入验证：只有当数值字段为有效值时才更新状态
                const isValidUpdate = Object.keys(changedValues).every(key => {
                  const value = changedValues[key];
                  
                  // 对于透明度，允许0-1范围内的值
                  if (key === 'opacity') {
                    return value !== null && value !== undefined && !isNaN(value) && value >= 0 && value <= 1;
                  }
                  
                  // 对于旋转角度，允许任何数值（包括负值）
                  if (['rotationX', 'rotationY', 'rotationZ'].includes(key)) {
                    return value !== null && value !== undefined && !isNaN(value);
                  }
                  
                  // 对于尺寸和其他正数字段，必须大于0
                  if (['width', 'height', 'depth3D', 'scale'].includes(key)) {
                    return value !== null && value !== undefined && !isNaN(value) && value > 0;
                  }
                  
                  // 对于其他字段（如name、color），直接允许
                  return true;
                });
                
                // 只有当所有变更值都有效时才更新状态
                if (isValidUpdate) {
                  let updatedValues = { ...allValues };
                  
                  // 🎯 整体缩放同步逻辑：当scale改变时，同步更新宽度、高度、深度
                  if (changedValues.scale !== undefined && cncPropertiesFormData) {
                    const newScale = changedValues.scale;
                    const baseWidth = 3.0;   // 基础宽度
                    const baseHeight = 2.5;  // 基础高度
                    const baseDepth = 2.0;   // 基础深度
                    
                    // 计算缩放后的尺寸
                    const scaledWidth = baseWidth * newScale;
                    const scaledHeight = baseHeight * newScale;
                    const scaledDepth = baseDepth * newScale;
                    
                    // 更新表单字段值
                    updatedValues = {
                      ...updatedValues,
                      width: scaledWidth,
                      height: scaledHeight,
                      depth3D: scaledDepth
                    };
                    
                    // 同步更新表单显示
                    cncPropertiesForm.setFieldsValue({
                      width: scaledWidth,
                      height: scaledHeight,
                      depth3D: scaledDepth
                    });
                    
                    console.log('🎯 [SCALE_SYNC] 整体缩放同步更新:', {
                      scale: newScale,
                      width: scaledWidth,
                      height: scaledHeight,
                      depth3D: scaledDepth
                    });
                  }
                  
                  // 🔄 反向同步逻辑：当宽度、高度、深度改变时，计算并更新整体缩放值
                  else if ((changedValues.width !== undefined || changedValues.height !== undefined || changedValues.depth3D !== undefined) && cncPropertiesFormData) {
                    const baseWidth = 3.0;   // 基础宽度
                    const baseHeight = 2.5;  // 基础高度
                    const baseDepth = 2.0;   // 基础深度
                    
                    // 获取当前尺寸值
                    const currentWidth = changedValues.width !== undefined ? changedValues.width : (updatedValues.width || cncPropertiesFormData.width || baseWidth);
                    const currentHeight = changedValues.height !== undefined ? changedValues.height : (updatedValues.height || cncPropertiesFormData.height || baseHeight);
                    const currentDepth = changedValues.depth3D !== undefined ? changedValues.depth3D : (updatedValues.depth3D || cncPropertiesFormData.depth3D || baseDepth);
                    
                    // 计算平均缩放比例（基于三个维度的平均值）
                    const scaleFromWidth = currentWidth / baseWidth;
                    const scaleFromHeight = currentHeight / baseHeight;
                    const scaleFromDepth = currentDepth / baseDepth;
                    const averageScale = (scaleFromWidth + scaleFromHeight + scaleFromDepth) / 3;
                    
                    // 四舍五入到一位小数
                    const newScale = Math.round(averageScale * 10) / 10;
                    
                    // 更新整体缩放值
                    updatedValues = {
                      ...updatedValues,
                      scale: newScale
                    };
                    
                    // 同步更新表单显示
                    cncPropertiesForm.setFieldsValue({
                      scale: newScale
                    });
                    
                    console.log('🔄 [REVERSE_SYNC] 反向同步更新整体缩放:', {
                      changedField: Object.keys(changedValues)[0],
                      currentDimensions: { width: currentWidth, height: currentHeight, depth3D: currentDepth },
                      scaleCalculation: { scaleFromWidth, scaleFromHeight, scaleFromDepth },
                      newScale: newScale
                    });
                  }
                  
                  const newData = cncPropertiesFormData ? { ...cncPropertiesFormData, ...updatedValues } : null;
                  debouncedUpdateCncFormData(newData);
                }
              }}
            >
              {/* 基础信息区域 */}
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ToolOutlined style={{ color: '#1890ff' }} />
                    <span>基础信息</span>
                  </div>
                }
                style={{ marginBottom: '16px' }}
                size="small"
              >
                <Form.Item
                  label="机台名称"
                  name="name"
                  rules={[{ required: true, message: '请输入机台名称' }]}
                  style={{ marginBottom: '16px' }}
                >
                  <Input placeholder="请输入CNC机台名称" />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="宽度 (X轴)"
                      name="width"
                      rules={[{ required: true, message: '请输入宽度' }]}
                    >
                      <InputNumber 
                        placeholder="单位：米" 
                        min={0.01}
                        step={0.01}
                        addonAfter="m"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="高度 (Y轴)"
                      name="height"
                      rules={[{ required: true, message: '请输入高度' }]}
                    >
                      <InputNumber 
                        placeholder="单位：米" 
                        min={0.01}
                        step={0.01}
                        addonAfter="m"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="深度 (Z轴)"
                      name="depth3D"
                      rules={[{ required: true, message: '请输入深度' }]}
                    >
                      <InputNumber 
                        placeholder="单位：米" 
                        min={0.01}
                        step={0.01}
                        addonAfter="m"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  label="机台颜色"
                  name="color"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#666666'].map(color => (
                        <div
                          key={color}
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: color,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: cncPropertiesFormData?.color === color ? '3px solid #1890ff' : '2px solid #e8e8e8',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setCncPropertiesFormData((prev: any) => prev ? { ...prev, color } : null);
                            cncPropertiesForm.setFieldsValue({ color });
                          }}
                        />
                      ))}
                    </div>
                    <Input
                      placeholder="自定义颜色 (#hex)"
                      value={cncPropertiesFormData?.color || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const color = e.target.value;
                        setCncPropertiesFormData((prev: any) => prev ? { ...prev, color } : null);
                        cncPropertiesForm.setFieldsValue({ color });
                      }}
                    />
                  </div>
                </Form.Item>

                {/* 隐藏的GLB模型字段 - 确保模型信息能够被表单验证和提交 */}
                <Form.Item name="currentModel" style={{ display: 'none' }}>
                  <Input />
                </Form.Item>
                <Form.Item name="modelFile" style={{ display: 'none' }}>
                  <Input />
                </Form.Item>
                <Form.Item name="modelUrl" style={{ display: 'none' }}>
                  <Input />
                </Form.Item>
                <Form.Item name="modelFileName" style={{ display: 'none' }}>
                  <Input />
                </Form.Item>
              </Card>

              {/* 3D渲染参数和旋转控制区域 */}
              <Row gutter={16}>
                <Col span={8}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BgColorsOutlined style={{ color: '#52c41a' }} />
                        <span>渲染参数</span>
                      </div>
                    }
                    style={{ height: '320px' }}
                    size="small"
                  >
                    <div style={{ padding: '8px 0', height: '100%' }}>
                      <Row gutter={16} style={{ height: '100%' }}>
                        <Col span={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ 
                            textAlign: 'center', 
                            marginBottom: '16px',
                            fontWeight: 'bold',
                            color: '#1890ff'
                          }}>
                            透明度
                          </div>
                          <Form.Item
                            name="opacity"
                            style={{ marginBottom: '0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                          >
                            <Slider
                              vertical
                              min={0}
                              max={1}
                              step={0.1}
                              style={{ height: '200px' }}
                              marks={{
                                0: '0%',
                                0.5: '50%',
                                1: '100%'
                              }}
                              tooltip={{
                                formatter: (value) => `${Math.round((value || 0) * 100)}%`
                              }}
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col span={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ 
                            textAlign: 'center', 
                            marginBottom: '16px',
                            fontWeight: 'bold',
                            color: '#1890ff'
                          }}>
                            整体缩放
                          </div>
                          <Form.Item
                            name="scale"
                            style={{ marginBottom: '8px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                          >
                            <Slider
                              vertical
                              min={0.1}
                              max={3.0}
                              step={0.1}
                              style={{ height: '200px' }}
                              marks={{
                                0.5: '0.5x',
                                1: '1x',
                                1.5: '1.5x',
                                2: '2x',
                                2.5: '2.5x'
                              }}
                              tooltip={{
                                formatter: (value) => `${value}x`
                              }}
                            />
                          </Form.Item>

                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
                
                <Col span={16}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ReloadOutlined style={{ color: '#fa8c16' }} />
                        <span>旋转控制</span>
                      </div>
                    }
                    style={{ height: '320px' }}
                    size="small"
                    extra={
                      <Button 
                        type="primary"
                        size="small" 
                        ghost
                        onClick={() => {
                          const resetValues = { rotationX: 0, rotationY: 0, rotationZ: 0 };
                          cncPropertiesForm.setFieldsValue(resetValues);
                          setCncPropertiesFormData((prev: any) => prev ? { ...prev, ...resetValues } : null);
                        }}
                      >
                        重置旋转
                      </Button>
                    }
                  >
                    <div style={{ padding: '8px 0' }}>
                      <Row gutter={[16, 0]}>
                        <Col span={8}>
                          <Form.Item
                            label={
                              <div style={{ textAlign: 'center', fontWeight: 500, color: '#1890ff', marginBottom: '8px' }}>
                                X轴旋转
                              </div>
                            }
                            name="rotationX"
                            style={{ marginBottom: '24px' }}
                          >
                            <Slider
                              vertical
                              min={-180}
                              max={180}
                              step={15}
                              marks={{
                                '-180': '-180°',
                                0: '0°',
                                180: '180°'
                              }}
                              tooltip={{
                                formatter: (value) => `${value}°`
                              }}
                              style={{ height: '180px' }}
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col span={8}>
                          <Form.Item
                            label={
                              <div style={{ textAlign: 'center', fontWeight: 500, color: '#52c41a', marginBottom: '8px' }}>
                                Y轴旋转
                              </div>
                            }
                            name="rotationY"
                            style={{ marginBottom: '24px' }}
                          >
                            <Slider
                              vertical
                              min={-180}
                              max={180}
                              step={15}
                              marks={{
                                '-180': '-180°',
                                0: '0°',
                                180: '180°'
                              }}
                              tooltip={{
                                formatter: (value) => `${value}°`
                              }}
                              style={{ height: '180px' }}
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col span={8}>
                          <Form.Item
                            label={
                              <div style={{ textAlign: 'center', fontWeight: 500, color: '#fa8c16', marginBottom: '8px' }}>
                                Z轴旋转
                              </div>
                            }
                            name="rotationZ"
                            style={{ marginBottom: '24px' }}
                          >
                            <Slider
                              vertical
                              min={-180}
                              max={180}
                              step={15}
                              marks={{
                                '-180': '-180°',
                                0: '0°',
                                180: '180°'
                              }}
                              tooltip={{
                                formatter: (value) => `${value}°`
                              }}
                              style={{ height: '180px' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Form>
          </Col>
          
          <Col span={10}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '700px' }}>
              {/* 3D实时预览区域 */}
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EyeOutlined style={{ color: '#722ed1' }} />
                    <span>3D实时预览</span>
                  </div>
                }
                style={{ flex: 1 }}
                bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)' }}
              >
                <div 
                  id="cnc-preview-container"
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px dashed #d9d9d9',
                    borderRadius: '8px',
                    position: 'relative'
                  }}
                >
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <ToolOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#722ed1' }} />
                    <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>3D实时预览</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      实时显示机台3D效果
                    </div>
                    <div style={{ fontSize: '11px', color: '#ccc', marginTop: '12px' }}>
                      调整左侧参数查看实时变化
                    </div>
                  </div>
                </div>
              </Card>

              {/* 模型替换区域 */}
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AppstoreOutlined style={{ color: '#fa8c16' }} />
                      <span>模型替换</span>
                    </div>
                    {/* 预设模型选择 - 移动到标题右侧 */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {availablePresetModels.map((preset) => (
                        <Button
                          key={preset.id}
                          size="small"
                          type={cncPropertiesFormData?.currentModel === preset.id ? 'primary' : 'default'}
                          style={{ 
                            fontSize: '10px', 
                            height: '24px'
                          }}
                          onClick={() => handlePresetModelChange(preset.id)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                }
                style={{ height: '200px' }}
                bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                  {/* 当前模型信息 */}
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>当前模型</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                      {(() => {
                        const currentModel = cncPropertiesFormData?.currentModel;
                        if (currentModel === 'custom') {
                          // 自定义模型：优先显示文件名
                          return cncPropertiesFormData?.modelFileName || 
                                 cncPropertiesFormData?.modelFile?.name || 
                                 '自定义模型';
                        } else if (currentModel && currentModel !== 'default') {
                          // 预设模型：查找对应的模型名称
                          const presetModel = availablePresetModels.find(p => p.id === currentModel);
                          return presetModel?.name || '未知预设模型';
                        } else {
                          // 默认模型
                          return '默认正方体模型';
                        }
                      })()}
                    </div>
                  </div>

                  {/* 模型导入按钮 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button 
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ width: '100%' }}
                      loading={isImportingModel}
                      onClick={() => {
                        // 创建文件输入元素
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.obj,.fbx,.gltf,.glb,.dae,.3ds,.ply,.stl';
                        input.multiple = false;
                        
                        input.onchange = (e: Event) => {
                          const target = e.target as HTMLInputElement;
                          const file = target.files?.[0];
                          if (file) {
                            handleModelFileImport(file);
                          }
                        };
                        
                        input.click();
                      }}
                    >
                      {isImportingModel ? '导入中...' : '导入3D模型'}
                    </Button>
                    
                    {/* 导入进度条 */}
                    {isImportingModel && modelImportProgress > 0 && (
                      <div style={{ width: '100%' }}>
                        <Progress 
                          percent={modelImportProgress} 
                          size="small" 
                          status={modelImportProgress === 100 ? 'success' : 'active'}
                          showInfo={false}
                        />
                      </div>
                    )}
                    
                    <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
                      支持格式: OBJ, FBX, GLTF, GLB, DAE, 3DS, PLY, STL
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default DigitalTwinEditor;