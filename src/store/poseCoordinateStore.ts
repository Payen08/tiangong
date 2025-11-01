import { create } from 'zustand';

// 位姿管理数据接口
export interface PoseManagementItem {
  id: string;
  name: string;
  description: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  orientationX: number;
  orientationY: number;
  orientationZ: number;
  orientationW: number;
  frameId: string;
  timestamp: string;
  status: 'active' | 'inactive';
  createdBy: string;
  lastModified: string;
}

// 坐标系管理数据接口
export interface CoordinateSystemItem {
  id: string;
  name: string;
  description: string;
  frameId: string;
  parentFrame: string;
  translationX: number;
  translationY: number;
  translationZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationW: number;
  isStatic: boolean;
  publishRate: number;
  status: 'active' | 'inactive';
  createdBy: string;
  lastModified: string;
}

// Store接口
interface PoseCoordinateStore {
  // 位姿数据
  poseData: PoseManagementItem[];
  setPoseData: (data: PoseManagementItem[]) => void;
  addPose: (pose: PoseManagementItem) => void;
  updatePose: (id: string, pose: Partial<PoseManagementItem>) => void;
  deletePose: (id: string) => void;
  
  // 坐标系数据
  coordinateData: CoordinateSystemItem[];
  setCoordinateData: (data: CoordinateSystemItem[]) => void;
  addCoordinate: (coordinate: CoordinateSystemItem) => void;
  updateCoordinate: (id: string, coordinate: Partial<CoordinateSystemItem>) => void;
  deleteCoordinate: (id: string) => void;
  
  // 初始化数据
  initializeData: () => void;
}

// 初始化位姿数据
const initialPoseData: PoseManagementItem[] = [
  {
    id: 'pose_001',
    name: '充电桩位姿',
    description: '机器人充电桩的标准位姿',
    positionX: 10.5,
    positionY: 5.2,
    positionZ: 0.0,
    orientationX: 0.0,
    orientationY: 0.0,
    orientationZ: 0.707,
    orientationW: 0.707,
    frameId: 'map',
    timestamp: '2024-01-20 14:30:25',
    status: 'active',
    createdBy: '系统管理员',
    lastModified: '2024-01-20 14:30:25'
  },
  {
    id: 'pose_002',
    name: '工作站位姿',
    description: '机器人工作站的标准位姿',
    positionX: 15.8,
    positionY: 8.6,
    positionZ: 0.0,
    orientationX: 0.0,
    orientationY: 0.0,
    orientationZ: 0.0,
    orientationW: 1.0,
    frameId: 'map',
    timestamp: '2024-01-20 10:15:30',
    status: 'active',
    createdBy: '操作员',
    lastModified: '2024-01-20 12:45:10'
  },
  {
    id: 'pose_003',
    name: '待机位姿',
    description: '机器人待机时的标准位姿',
    positionX: 0.0,
    positionY: 0.0,
    positionZ: 0.0,
    orientationX: 0.0,
    orientationY: 0.0,
    orientationZ: 0.0,
    orientationW: 1.0,
    frameId: 'base_link',
    timestamp: '2024-01-19 16:20:15',
    status: 'inactive',
    createdBy: '系统管理员',
    lastModified: '2024-01-19 16:20:15'
  }
];

// 初始化坐标系数据
const initialCoordinateData: CoordinateSystemItem[] = [
  {
    id: 'coord_001',
    name: '地图坐标系',
    description: '全局地图坐标系',
    frameId: 'map',
    parentFrame: 'world',
    translationX: 0.0,
    translationY: 0.0,
    translationZ: 0.0,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.0,
    rotationW: 1.0,
    isStatic: true,
    publishRate: 10,
    status: 'active',
    createdBy: '系统管理员',
    lastModified: '2024-01-20 14:30:25'
  },
  {
    id: 'coord_002',
    name: '机器人基座坐标系',
    description: '机器人基座的本地坐标系',
    frameId: 'base_link',
    parentFrame: 'map',
    translationX: 10.5,
    translationY: 5.2,
    translationZ: 0.0,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.707,
    rotationW: 0.707,
    isStatic: false,
    publishRate: 50,
    status: 'active',
    createdBy: '系统管理员',
    lastModified: '2024-01-20 14:30:25'
  },
  {
    id: 'coord_003',
    name: '激光雷达坐标系',
    description: '激光雷达传感器坐标系',
    frameId: 'laser_link',
    parentFrame: 'base_link',
    translationX: 0.2,
    translationY: 0.0,
    translationZ: 0.3,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.0,
    rotationW: 1.0,
    isStatic: true,
    publishRate: 30,
    status: 'active',
    createdBy: '技术员',
    lastModified: '2024-01-19 10:15:30'
  },
  {
    id: 'coord_004',
    name: '摄像头坐标系',
    description: '前置摄像头坐标系',
    frameId: 'camera_link',
    parentFrame: 'base_link',
    translationX: 0.3,
    translationY: 0.0,
    translationZ: 0.5,
    rotationX: 0.0,
    rotationY: 0.0,
    rotationZ: 0.0,
    rotationW: 1.0,
    isStatic: true,
    publishRate: 20,
    status: 'inactive',
    createdBy: '技术员',
    lastModified: '2024-01-18 15:45:20'
  }
];

// 创建Zustand store
export const usePoseCoordinateStore = create<PoseCoordinateStore>((set, get) => ({
  // 位姿数据状态
  poseData: [],
  setPoseData: (data) => set({ poseData: data }),
  addPose: (pose) => set((state: PoseCoordinateStore) => ({ 
    poseData: [...state.poseData, pose] 
  })),
  updatePose: (id, updatedPose) => set((state: PoseCoordinateStore) => ({
    poseData: state.poseData.map((pose: PoseManagementItem) => 
      pose.id === id ? { ...pose, ...updatedPose } : pose
    )
  })),
  deletePose: (id) => set((state: PoseCoordinateStore) => ({
    poseData: state.poseData.filter((pose: PoseManagementItem) => pose.id !== id)
  })),
  
  // 坐标系数据状态
  coordinateData: [],
  setCoordinateData: (data) => set({ coordinateData: data }),
  addCoordinate: (coordinate) => set((state: PoseCoordinateStore) => ({ 
    coordinateData: [...state.coordinateData, coordinate] 
  })),
  updateCoordinate: (id, updatedCoordinate) => set((state: PoseCoordinateStore) => ({
    coordinateData: state.coordinateData.map((coord: CoordinateSystemItem) => 
      coord.id === id ? { ...coord, ...updatedCoordinate } : coord
    )
  })),
  deleteCoordinate: (id) => set((state: PoseCoordinateStore) => ({
    coordinateData: state.coordinateData.filter((coord: CoordinateSystemItem) => coord.id !== id)
  })),
  
  // 初始化数据
  initializeData: (poses?: PoseManagementItem[], coordinates?: CoordinateSystemItem[]) => set({
    poseData: poses || initialPoseData,
    coordinateData: coordinates || initialCoordinateData
  })
}));