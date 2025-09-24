import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface ThreeSceneRef {
  resetView: () => void;
  setTopView: () => void;
  setFrontView: () => void;
  setFloorView: (floor: number) => void;
  setAllFloorsView: () => void;
  testRobotMovement: () => void;
}

const ThreeScene = forwardRef<ThreeSceneRef>((_props, ref) => {
  // 开发模式标志
  const isDev = import.meta.env.DEV;
  
  if (isDev) console.log('[ThreeScene] 组件开始渲染');
  const mountRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);
  const spanningElevatorRef = useRef<THREE.Mesh | null>(null);
  const elevatorEdgesRef = useRef<THREE.LineSegments | null>(null);
  const startPathMovementRef = useRef<(() => void) | null>(null);
  
  // 初始相机位置 - 适合全部楼层视图
  const initialCameraPosition = { x: 0, y: 67.5, z: 100 }; // 调整为全部楼层视图的相机位置
  const initialCameraTarget = { x: 0, y: 27.5, z: 0 }; // 目标点设为二楼中心位置

  useEffect(() => {
    if (isDev) console.log('[ThreeScene] useEffect 开始执行');
    if (!mountRef.current) return;

    const mountNode = mountRef.current;
    
    // 声明自动测试定时器变量
    let autoTestTimer: ReturnType<typeof setTimeout>;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // 设置为透明背景

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      mountNode.clientWidth / mountNode.clientHeight,
      0.1,
      1000
    );
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);
    camera.lookAt(initialCameraTarget.x, initialCameraTarget.y, initialCameraTarget.z);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x04031C, 1); // 设置深紫色背景
    mountNode.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(initialCameraTarget.x, initialCameraTarget.y, initialCameraTarget.z);
    controlsRef.current = controls;

    // Coordinate axes helper - 坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(20); // 坐标轴长度为20
    scene.add(axesHelper);

    // 创建坐标轴标签
    const createAxisLabel = (text: string, position: THREE.Vector3, color: string) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      
      context.fillStyle = color;
      context.font = 'Bold 32px Arial';
      context.textAlign = 'center';
      context.fillText(text, 32, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(4, 4, 1);
      
      return sprite;
    };

    // 添加X、Y、Z轴标签 (符合右手坐标系：X向右，Y向上，Z向前)
    const xLabel = createAxisLabel('X', new THREE.Vector3(22, 0, 0), '#ff0000'); // 红色X轴 - 水平向右
    const yLabel = createAxisLabel('Y', new THREE.Vector3(0, 22, 0), '#00ff00'); // 绿色Y轴 - 垂直向上（高度）
    const zLabel = createAxisLabel('Z', new THREE.Vector3(0, 0, 22), '#0000ff'); // 蓝色Z轴 - 深度向前
    
    scene.add(xLabel);
    scene.add(yLabel);
    scene.add(zLabel);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // CNC Machine representation
    const createCNCMachine = (position: THREE.Vector3, floorGroup: THREE.Group) => {
      const geometry = new THREE.BoxGeometry(5, 5, 5);
      const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.copy(position);
      cube.castShadow = true;
      cube.receiveShadow = true;
      floorGroup.add(cube);
      return cube;
    };

    // CRM Mobile Robot representation - 立体圆角矩形
    const createCRMRobot = (position: THREE.Vector3, floorGroup: THREE.Group, direction: number = 0) => {
      // 创建机器人主体组
      const robotGroup = new THREE.Group();
      robotGroup.position.copy(position);
      robotGroup.rotation.y = direction; // 设置机器人朝向
      
      // 创建圆角矩形几何体（使用BoxGeometry作为基础）
      const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 5); // 宽3，高1.5，长5
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00cc88, // 青绿色，与其他设备区分
        metalness: 0.2,
        roughness: 0.3,
        transparent: true,
        opacity: 0.9
      });
      const robotBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
      robotBody.position.set(0, 0.75, 0); // 机器人主体高度
      robotBody.castShadow = true;
      robotBody.receiveShadow = true;
      robotGroup.add(robotBody);

      // 添加机器人主体的描边效果
      const bodyEdgesGeometry = new THREE.EdgesGeometry(bodyGeometry);
      const bodyEdgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff99, // 亮青绿色描边
        linewidth: 2
      });
      const bodyEdges = new THREE.LineSegments(bodyEdgesGeometry, bodyEdgesMaterial);
      bodyEdges.position.set(0, 0.75, 0);
      robotGroup.add(bodyEdges);

      // 创建车头方向指示器（简洁的前端面板）
      const frontPanelGeometry = new THREE.BoxGeometry(2.8, 1.3, 0.2); // 稍小的前面板
      const frontPanelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0099ff, // 蓝色前面板，表示车头方向
        metalness: 0.4,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95
      });
      const frontPanel = new THREE.Mesh(frontPanelGeometry, frontPanelMaterial);
      frontPanel.position.set(0, 0.75, 2.4); // 位于机器人前方
      frontPanel.castShadow = true;
      frontPanel.receiveShadow = true;
      robotGroup.add(frontPanel);

      // 添加前面板的发光边框效果
      const frontPanelEdgesGeometry = new THREE.EdgesGeometry(frontPanelGeometry);
      const frontPanelEdgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ddff, // 亮蓝色边框
        linewidth: 3
      });
      const frontPanelEdges = new THREE.LineSegments(frontPanelEdgesGeometry, frontPanelEdgesMaterial);
      frontPanelEdges.position.set(0, 0.75, 2.4);
      robotGroup.add(frontPanelEdges);

      // 添加车轮（4个小圆柱体）
      const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
      const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, // 深灰色车轮
        metalness: 0.8,
        roughness: 0.2
      });
      
      // 四个车轮位置
      const wheelPositions = [
        { x: -1.2, z: 1.8 },  // 左前轮
        { x: 1.2, z: 1.8 },   // 右前轮
        { x: -1.2, z: -1.8 }, // 左后轮
        { x: 1.2, z: -1.8 }   // 右后轮
      ];
      
      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, 0.3, pos.z);
        wheel.rotation.z = Math.PI / 2; // 旋转车轮使其水平
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        robotGroup.add(wheel);
      });

      // 添加CRM标识标签
      const createCRMLabel = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 120;
        canvas.height = 60;
        
        // 清除画布
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        context.fillStyle = 'rgba(0, 204, 136, 0.9)'; // 与机器人主体颜色一致
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制边框
        context.strokeStyle = '#00ff99';
        context.lineWidth = 2;
        context.strokeRect(0, 0, canvas.width, canvas.height);
        
        // 绘制文字
        context.fillStyle = '#ffffff';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('CRM', canvas.width / 2, canvas.height / 2);
        
        // 创建纹理和Sprite
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.01,
          depthTest: false,
          depthWrite: false
        });
        
        const labelSprite = new THREE.Sprite(spriteMaterial);
        labelSprite.position.set(0, 3, 0); // 在机器人上方
        labelSprite.scale.set(2, 1, 1);
        labelSprite.name = 'crmLabel';
        labelSprite.renderOrder = 1000;
        
        return labelSprite;
      };

      // 添加标签到机器人组
      const label = createCRMLabel();
      robotGroup.add(label);

      // 设置机器人组名称
      robotGroup.name = 'crmRobot';
      
      // 将机器人组添加到楼层组
      floorGroup.add(robotGroup);
      
      return robotGroup;
    };

    // Elevator representation - 电梯长方体
    const createElevator = (position: THREE.Vector3, height: number, floorGroup: THREE.Group) => {
      const geometry = new THREE.BoxGeometry(6, height, 4); // 长方体：宽6，高度可变，深4
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff6b35, // 橙红色，与蓝色设备区分
        metalness: 0.3,
        roughness: 0.4,
        transparent: true, // 启用透明度
        opacity: 0.7 // 设置透明度为70%
      });
      const elevator = new THREE.Mesh(geometry, material);
      elevator.position.copy(position);
      elevator.castShadow = true;
      elevator.receiveShadow = true;
      floorGroup.add(elevator);

      // 为电梯添加描边效果
      const elevatorEdgesGeometry = new THREE.EdgesGeometry(geometry);
      const elevatorEdgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff8c00, // 亮橙色描边
        linewidth: 2 // 线条宽度
      });
      const elevatorEdges = new THREE.LineSegments(elevatorEdgesGeometry, elevatorEdgesMaterial);
      elevatorEdges.position.copy(position); // 与电梯位置保持一致
      floorGroup.add(elevatorEdges);

      return elevator;
    };

    // 楼层配置
    const spacing = 8; // 设备间距
    const startX = -20; // 起始X坐标
    const floorHeight = 25; // 楼层高度间距
    
    // 创建楼层组
    const floor1Group = new THREE.Group();
    const floor2Group = new THREE.Group();
    const floor3Group = new THREE.Group();
    
    floor1Group.name = 'floor1';
    floor2Group.name = 'floor2';
    floor3Group.name = 'floor3';
    
    scene.add(floor1Group);
    scene.add(floor2Group);
    scene.add(floor3Group);
    
    floorGroupsRef.current = [floor1Group, floor2Group, floor3Group];
    
    // 初始状态显示全部楼层
    floor1Group.visible = true;
    floor2Group.visible = true;
    floor3Group.visible = true;
    
    // 一楼场景 (Y = 2.5)
    const floor1Y = 2.5;
    const floor1Rows = [
      { z: 25, label: '1-1', color: '#ff4444' },
      { z: 0, label: '1-2', color: '#44ff44' },
      { z: -25, label: '1-3', color: '#4444ff' },
      { z: -50, label: '1-4', color: '#ffff44' }
    ];
    
    // 创建一楼设备
    floor1Rows.forEach(row => {
      for (let col = 0; col < 6; col++) {
        const x = startX + col * spacing;
        createCNCMachine(new THREE.Vector3(x, floor1Y, row.z), floor1Group);
      }
    });

    // 创建一楼电梯 - 位于场景右侧，Y轴向上移动7.5个单位
     createElevator(new THREE.Vector3(60, floor1Y + 7.5, 0), 20, floor1Group);

    // 创建一楼CRM移动机器人 - 停靠在电梯停靠点，车头朝向电梯
    const crmRobot = createCRMRobot(
      new THREE.Vector3(45, 0, 10), // 电梯停靠点位置，Y=0贴地面
      floor1Group,
      Math.PI / 2 // 车头朝向电梯方向（向右转90度）
    );

    // CRM机器人移动系统
    interface PathSegment {
      id: string;
      startPoint: THREE.Vector3;
      endPoint: THREE.Vector3;
      line: THREE.Line;
      isOccupied: boolean;
      originalColor: number;
    }

    interface StationNode {
      id: string;
      position: THREE.Vector3;
      label: string;
      connections: string[]; // 连接的路径段ID
    }

    // 路径段数据存储
    const pathSegments: PathSegment[] = [];
    const stationNodes: StationNode[] = [];
    let pathSegmentIdCounter = 0;

    // 创建路径段的辅助函数
    const createPathSegment = (startPoint: THREE.Vector3, endPoint: THREE.Vector3, line: THREE.Line): PathSegment => {
      const segment: PathSegment = {
        id: `path_${pathSegmentIdCounter++}`,
        startPoint: startPoint.clone(),
        endPoint: endPoint.clone(),
        line: line,
        isOccupied: false,
        originalColor: 0x00ff88 // 绿色
      };
      pathSegments.push(segment);
      return segment;
    };

    // 创建站点节点的辅助函数
    const createStationNode = (id: string, position: THREE.Vector3, label: string): StationNode => {
      const node: StationNode = {
        id,
        position: position.clone(),
        label,
        connections: []
      };
      stationNodes.push(node);
      return node;
    };

    // 初始化站点和路径数据
    const initializePathNetwork = () => {
      const equipmentCols = [-20, -12, -4, 4, 12, 20];
      const equipmentRows = [25, 0, -25, -50];
      const rowLabels = ['1-1', '1-2', '1-3', '1-4'];
      const nodeY = 0.1;

      // 创建所有站点节点（排除特定站点）
      const excludedStations = ['1-3-6F']; // 需要排除的站点
      
      equipmentRows.forEach((z, rowIndex) => {
        equipmentCols.forEach((x, colIndex) => {
          const rowLabel = rowLabels[rowIndex];
          const colLabel = (colIndex + 1).toString();
          
          // 前侧站点 - 为所有行创建前侧站点（排除指定站点）
          const frontId = `${rowLabel}-${colLabel}F`;
          if (!excludedStations.includes(frontId)) {
            createStationNode(frontId, new THREE.Vector3(x, nodeY, z + 5), frontId);
          }
          
          // 后侧站点 - 为所有行创建后侧站点
          const backId = `${rowLabel}-${colLabel}B`;
          createStationNode(backId, new THREE.Vector3(x, nodeY, z - 5), backId);
        });
      });

      // 创建特殊站点
      createStationNode('elevator_station', new THREE.Vector3(45, nodeY, 0), '电梯站点');
      createStationNode('elevator_stop', new THREE.Vector3(45, nodeY, 10), '电梯停靠点');
      createStationNode('elevator_bottom', new THREE.Vector3(45, nodeY, -10), '电梯下方停靠点');
      createStationNode('transfer_1', new THREE.Vector3(20, nodeY, 12.5), '中转站点');
      createStationNode('transfer_2', new THREE.Vector3(20, nodeY, -37.5), '中转站点2');
      createStationNode('elevator_inside', new THREE.Vector3(60, nodeY, 0), '电梯内站点');
      
      if (isDev) console.log('路径网络初始化完成，创建了', stationNodes.length, '个站点节点');
      if (isDev) console.log('站点节点列表:', stationNodes.map(node => node.id));
    };

    // 初始化路径网络 - 创建站点节点
    initializePathNetwork();

    // 路径占用管理
    const occupyPath = (pathId: string) => {
      const segment = pathSegments.find(p => p.id === pathId);
      if (segment && !segment.isOccupied) {
        segment.isOccupied = true;
        // 将路径颜色变为红色
        (segment.line.material as THREE.LineBasicMaterial).color.setHex(0xff0000);
        return true;
      }
      return false;
    };

    const releasePath = (pathId: string) => {
      const segment = pathSegments.find(p => p.id === pathId);
      if (segment && segment.isOccupied) {
        segment.isOccupied = false;
        // 恢复原始颜色
        (segment.line.material as THREE.LineBasicMaterial).color.setHex(segment.originalColor);
        return true;
      }
      return false;
    };





    // 构建站点连接关系
     const buildStationConnections = () => {
       stationNodes.forEach(station => {
         station.connections = [];
         pathSegments.forEach(segment => {
           const threshold = 0.1;
           if (segment.startPoint.distanceTo(station.position) < threshold) {
             // 找到以此站点为起点的路径段
             const connectedStation = stationNodes.find(s => 
               segment.endPoint.distanceTo(s.position) < threshold
             );
             if (connectedStation) {
               station.connections.push(segment.id);
             }
           } else if (segment.endPoint.distanceTo(station.position) < threshold) {
             // 找到以此站点为终点的路径段
             const connectedStation = stationNodes.find(s => 
               segment.startPoint.distanceTo(s.position) < threshold
             );
             if (connectedStation) {
               station.connections.push(segment.id);
             }
           }
         });
       });
     };





    // CRM机器人移动状态 - 参考视图场控页面的机器人状态管理
    interface RobotMovementState {
      isMoving: boolean;
      status: 'running' | 'waiting' | 'idle'; // 添加状态管理
      currentStation: string;
      targetStation: string | null;
      currentPath: StationNode[];
      currentPathIndex: number;
      occupiedPaths: string[];
      animationProgress: number;
      pathIndex: number; // 当前在路径序列中的索引
      targetPointId: string | null; // 目标路径点ID
      pathResources: string[]; // 当前占用的路径资源ID列表
      speed: number; // 移动速度
    }

    // 定义固定的路径序列 - 参考视图场控页面的路径序列设计
    const pathSequence = [
      { pointId: 'elevator_stop', nextLineId: 'path_0' },
      { pointId: 'transfer_1', nextLineId: 'path_1' },
      { pointId: '1-2-1F', nextLineId: 'path_2' },
      { pointId: '1-2-2F', nextLineId: 'path_3' },
      { pointId: '1-2-3F', nextLineId: 'path_4' },
      { pointId: '1-2-4F', nextLineId: 'path_5' },
      { pointId: '1-2-5F', nextLineId: 'path_6' },
      { pointId: '1-2-6F', nextLineId: 'path_7' },
      { pointId: 'transfer_2', nextLineId: 'path_8' },
      { pointId: '1-4-6B', nextLineId: 'path_9' },
      { pointId: '1-4-5B', nextLineId: 'path_10' },
      { pointId: '1-4-4B', nextLineId: 'path_11' },
      { pointId: '1-4-3B', nextLineId: 'path_12' },
      { pointId: '1-4-2B', nextLineId: 'path_13' },
      { pointId: '1-4-1B', nextLineId: 'path_14' },
      { pointId: 'elevator_bottom', nextLineId: 'path_15' }
    ];

    const robotState: RobotMovementState = {
      isMoving: false,
      status: 'idle',
      currentStation: 'elevator_stop',
      targetStation: null,
      currentPath: [],
      currentPathIndex: 0,
      occupiedPaths: [],
      animationProgress: 0,
      pathIndex: 0, // 从路径序列的第一个点开始
      targetPointId: pathSequence.length > 0 ? pathSequence[1].pointId : null,
      pathResources: [],
      speed: 0.012 // MCR机器人的移动速度
    };

    // 申请路径资源 - 参考视图场控页面的路径资源申请逻辑
    const requestPathResources = (robotId: string, currentIndex: number): string[] => {
      if (isDev) console.log('申请路径资源 - robotId:', robotId, 'currentIndex:', currentIndex);
      if (isDev) console.log('pathSegments数组状态:', {
        length: pathSegments.length,
        ids: pathSegments.map(p => p.id),
        occupied: pathSegments.map(p => ({ id: p.id, isOccupied: p.isOccupied }))
      });
      
      if (pathSequence.length === 0) {
        if (isDev) console.log('路径序列为空，无法申请资源');
        return [];
      }
      
      // 获取当前和下一条路径的ID
      const currentPathId = pathSequence[currentIndex].nextLineId;
      const nextIndex = (currentIndex + 1) % pathSequence.length;
      const nextPathId = pathSequence[nextIndex].nextLineId;
      
      if (isDev) console.log('尝试申请路径资源:', { currentPathId, nextPathId, currentIndex, nextIndex });
      
      // 检查路径是否已被占用
      const isPathOccupied = (pathId: string) => {
        const segment = pathSegments.find(p => p.id === pathId);
        const occupied = segment ? segment.isOccupied : false;
        if (isDev) console.log('检查路径占用状态:', pathId, '是否找到路径段:', !!segment, '是否被占用:', occupied);
        return occupied;
      };
      
      // 如果路径已被占用，返回空数组表示申请失败
      if (isPathOccupied(currentPathId) || isPathOccupied(nextPathId)) {
        if (isDev) console.warn(`路径资源申请失败：${currentPathId} 或 ${nextPathId} 已被占用`);
        return [];
      }
      
      // 申请成功，占用路径并返回路径ID数组
      occupyPath(currentPathId);
      occupyPath(nextPathId);
      
      if (isDev) console.log(`路径资源申请成功：${currentPathId}, ${nextPathId}`);
      return [currentPathId, nextPathId];
    };



    // 机器人移动动画 - 参考视图场控页面的移动逻辑
    const animateRobotMovement = () => {
      if (robotState.status !== 'running' || pathSequence.length === 0) return;

      if (isDev) console.log('[机器人移动] 当前状态:', {
        status: robotState.status,
        pathIndex: robotState.pathIndex,
        targetPointId: robotState.targetPointId,
        stationNodesCount: stationNodes.length,
        pathSequenceLength: pathSequence.length
      });

      // 获取当前路径点和目标路径点
      const currentPathPoint = pathSequence[robotState.pathIndex];
      if (isDev) console.log('[机器人移动] 当前路径点:', currentPathPoint);
      
      const currentPoint = stationNodes.find(node => node.id === currentPathPoint.pointId);
      const targetPoint = stationNodes.find(node => node.id === robotState.targetPointId);
      
      if (isDev) console.log('[机器人移动] 查找站点结果:', {
        currentPointId: currentPathPoint.pointId,
        targetPointId: robotState.targetPointId,
        currentPointFound: !!currentPoint,
        targetPointFound: !!targetPoint,
        availableStationIds: stationNodes.map(n => n.id)
      });
      
      if (!currentPoint || !targetPoint) {
          if (isDev) {
            console.error('无法找到当前站点或目标站点');
            console.error('当前站点ID:', currentPathPoint.pointId, '找到:', !!currentPoint);
            console.error('目标站点ID:', robotState.targetPointId, '找到:', !!targetPoint);
          }
          return;
      }

      // 检查是否有路径资源
      if (robotState.pathResources.length < 2) {
        // 申请路径资源
        const resources = requestPathResources('crm_robot', robotState.pathIndex);
        
        // 如果申请失败，机器人进入等待状态
        if (resources.length === 0) {
          robotState.status = 'waiting';
          if (isDev) console.log('CRM机器人进入等待状态，路径资源不可用');
          return;
        }
        
        // 更新机器人占用的路径资源
        robotState.pathResources = resources;
        robotState.status = 'running';
      }

      // 更新进度
      robotState.animationProgress += robotState.speed;

      // 如果到达目标点，更新到下一个目标
      if (robotState.animationProgress >= 1.0) {
        // 释放已走完的路径
        if (robotState.pathResources.length > 0) {
          const pathToRelease = robotState.pathResources.shift();
          if (pathToRelease) {
            releasePath(pathToRelease);
            if (isDev) console.log(`释放已走完的路径：${pathToRelease}`);
          }
        }
        
        // 申请下一条路径资源（当前位置+2的路径）
        const nextPathIndex = (robotState.pathIndex + 2) % pathSequence.length;
        const nextPathId = pathSequence[nextPathIndex].nextLineId;
        
        // 检查下一条路径是否已被占用
        const segment = pathSegments.find(p => p.id === nextPathId);
        const isNextPathOccupied = segment ? segment.isOccupied : false;
        
        // 如果下一条路径未被占用，则申请并继续移动
        if (!isNextPathOccupied) {
          // 申请新路径资源
          if (occupyPath(nextPathId)) {
            robotState.pathResources.push(nextPathId);
            if (isDev) console.log(`申请新路径资源：${nextPathId}`);
          }
          
          // 更新路径索引和目标点
          robotState.animationProgress = 0;
          robotState.pathIndex = (robotState.pathIndex + 1) % pathSequence.length;
          robotState.targetPointId = pathSequence[(robotState.pathIndex + 1) % pathSequence.length].pointId;
          
          if (isDev) console.log(`CRM机器人移动到下一个目标：${robotState.targetPointId}`);
        } else {
          // 如果下一条路径被占用，机器人停在当前位置等待
          robotState.status = 'waiting';
          robotState.animationProgress = 1.0; // 保持在当前位置
          if (isDev) console.log('CRM机器人等待下一条路径可用');
          return;
        }
      }

      // 计算当前位置
      const startPos = currentPoint.position;
      const endPos = targetPoint.position;
      const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, robotState.animationProgress);
      
      // 更新机器人位置
      if (crmRobot) {
        crmRobot.position.copy(currentPos);
        
        // 计算朝向，使用原始进度避免朝向抖动
        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        if (direction.length() > 0) {
          const angle = Math.atan2(direction.x, direction.z);
          crmRobot.rotation.y = angle;
        }
      }
    };

    // 处理等待状态的机器人 - 参考视图场控页面的等待逻辑
    const handleWaitingRobot = () => {
      if (robotState.status !== 'waiting') return;

      // 尝试重新申请路径资源
      const resources = requestPathResources('crm_robot', robotState.pathIndex);
      
      // 如果申请成功，恢复运行状态
      if (resources.length > 0) {
        robotState.pathResources = resources;
        robotState.status = 'running';
        if (isDev) console.log('CRM机器人恢复运行状态');
      }
    };

    // 开始路径移动 - 替换原来的随机移动
    const startPathMovement = () => {
      if (robotState.status === 'running') {
        if (isDev) console.log('CRM机器人已在运行状态，跳过启动');
        return;
      }

      if (isDev) console.log('CRM机器人开始沿路径移动');
      if (isDev) console.log('当前路径序列长度:', pathSequence.length);
      if (isDev) console.log('当前站点节点数量:', stationNodes.length);
      if (isDev) console.log('当前路径段数量:', pathSegments.length);
      if (isDev) console.log('机器人初始状态:', robotState);

      // 申请初始路径资源
      const initialResources = requestPathResources('crm_robot', robotState.pathIndex);
      
      if (initialResources.length > 0) {
        robotState.pathResources = initialResources;
        robotState.status = 'running';
        robotState.animationProgress = 0;
        if (isDev) console.log('CRM机器人开始移动，初始路径资源申请成功，资源:', initialResources);
      } else {
        robotState.status = 'waiting';
        if (isDev) console.log('CRM机器人等待初始路径资源，当前路径索引:', robotState.pathIndex);
      }
    };

    // 将函数赋值给ref以便在useImperativeHandle中使用
    startPathMovementRef.current = startPathMovement;

    // 自动测试机器人移动（延迟3秒以确保所有初始化完成）
    autoTestTimer = setTimeout(() => {
      if (isDev) console.log('[自动测试] 3秒后自动触发机器人移动测试');
      if (isDev) console.log('[自动测试] 当前站点节点数量:', stationNodes.length);
      if (isDev) console.log('[自动测试] 当前路径段数量:', pathSegments.length);
      if (isDev) console.log('[自动测试] pathSequence长度:', pathSequence.length);
      if (startPathMovementRef.current) {
        startPathMovementRef.current();
      }
    }, 3000);

    // 创建一楼拓扑路径站点
    const createTopologyNode = (position: THREE.Vector3, group: THREE.Group) => {
      const geometry = new THREE.CircleGeometry(0.8, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const node = new THREE.Mesh(geometry, material);
      node.position.copy(position);
      node.rotation.x = -Math.PI / 2; // 旋转到水平面
      node.name = 'topologyNode';
      group.add(node);
      
      return node;
    };



    // 创建拓扑连接线的函数
    const createTopologyLine = (startPoint: THREE.Vector3, endPoint: THREE.Vector3, group: THREE.Group) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff88, // 绿色连接线
        linewidth: 3,    // 线条宽度
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(geometry, material);
      line.name = 'topologyConnection';
      group.add(line);
      
      // 将路径段注册到移动系统中
      createPathSegment(startPoint, endPoint, line);
      
      return line;
    };

    // 创建一楼拓扑路径网格
    const createFloor1TopologyGrid = () => {
      // 设备位置计算：startX = -20, spacing = 8, 6台设备
      // 设备X坐标：-20, -12, -4, 4, 12, 20
      // 设备Z坐标：25, 0, -25, -50
      
      const nodeY = 0.1; // 站点Y坐标，贴近地面
      const equipmentRows = [25, 0, -25, -50]; // 设备行的Z坐标
      const equipmentCols = [-20, -12, -4, 4, 12, 20]; // 设备列的X坐标
      
      // 为每台设备创建站点，根据需求选择性创建前后站点
      equipmentRows.forEach((z) => {
        equipmentCols.forEach((x) => {
          
          // 设备前侧的站点 (Z坐标加上5个单位，距离更远，Y坐标贴地面)
          // 1-1行(Z=25)和1-3行(Z=-25)不创建前面的站点
          if (z !== 25 && z !== -25) {
            createTopologyNode(new THREE.Vector3(x, 0.1, z + 5), floor1Group);
          }
          
          // 设备后侧的站点 (Z坐标减去5个单位，距离更远，Y坐标贴地面)
          // 1-2行(Z=0)和1-4行(Z=-50)不创建后面的站点
          if (z !== 0 && z !== -50) {
            createTopologyNode(new THREE.Vector3(x, 0.1, z - 5), floor1Group);
          }
        });
      });
      
      // 添加电梯内外站点连线
      const elevatorOutsidePoint = new THREE.Vector3(45, nodeY, 0); // 电梯左侧站点
      const elevatorInsidePoint = new THREE.Vector3(60, nodeY, 0);  // 电梯内站点
      createTopologyLine(elevatorOutsidePoint, elevatorInsidePoint, floor1Group);
      
      // 根据pathSequence创建路径段连接线
      if (isDev) console.log('[路径段创建] 开始根据pathSequence创建路径段连接线');
      for (let i = 0; i < pathSequence.length - 1; i++) {
        const currentPoint = pathSequence[i];
        const nextPoint = pathSequence[i + 1];
        
        // 查找对应的站点节点
        const currentStation = stationNodes.find(node => node.id === currentPoint.pointId);
        const nextStation = stationNodes.find(node => node.id === nextPoint.pointId);
        
        if (currentStation && nextStation) {
          if (isDev) console.log(`[路径段创建] 创建连接线: ${currentPoint.pointId} -> ${nextPoint.pointId}`);
          createTopologyLine(currentStation.position, nextStation.position, floor1Group);
        } else {
          if (isDev) console.warn(`[路径段创建] 无法找到站点: ${currentPoint.pointId}(${!!currentStation}) -> ${nextPoint.pointId}(${!!nextStation})`);
        }
      }
      
      if (isDev) console.log('[路径段创建] 完成，总共创建了', pathSegments.length, '个路径段');
      if (isDev) console.log('[路径段创建] 路径段列表:', pathSegments.map(p => p.id));
    };

    createFloor1TopologyGrid();

    // 创建1楼电梯左侧站点
    createTopologyNode(new THREE.Vector3(45, 0.1, 0), floor1Group);

    // 创建电梯点上方的停靠点
    createTopologyNode(new THREE.Vector3(45, 0.1, 10), floor1Group);

    // 创建电梯点下方的停靠点
    createTopologyNode(new THREE.Vector3(45, 0.1, -10), floor1Group);

    // 创建1-6-B和1-2-6F连线中间的站点
    createTopologyNode(new THREE.Vector3(20, 0.1, 12.5), floor1Group);

    // 创建1-3-6B和1-4-6F连线中间的站点
    createTopologyNode(new THREE.Vector3(20, 0.1, -37.5), floor1Group);

    // 创建1楼电梯内部站点
    createTopologyNode(new THREE.Vector3(60, 0.1, 0), floor1Group);

    // 创建拓扑路径连接线，连接各行之间的站点
    const createTopologyConnections = () => {
      const equipmentCols = [-20, -12, -4, 4, 12, 20]; // 设备列的X坐标
      const nodeY = 0.1; // 站点的Y坐标（贴地面）

      // 1. 在1-1行站点之间添加拓扑路径连接（相邻站点连接）
      // 1-1行站点位置: Z=20 (25-5)
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, 20); // 当前1-1行站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, 20); // 下一个1-1行站点
        createTopologyLine(point1, point2, floor1Group);
      }

      // 2. 创建(1-1)和(1-2)站点间的拓扑路径
      // (1-1)行站点位置: Z=20 (25-5)
      // (1-2)行前站点位置: Z=5 (0+5)
      for (let i = 0; i < equipmentCols.length; i++) {
        const point1_1 = new THREE.Vector3(equipmentCols[i], nodeY, 20); // 1-1行站点
        const point1_2_front = new THREE.Vector3(equipmentCols[i], nodeY, 5); // 1-2行前站点
        createTopologyLine(point1_1, point1_2_front, floor1Group);
      }

      // 3. 在1-3行站点之间添加拓扑路径连接（相邻站点连接）
      // 1-3行站点位置: Z=-30 (-25-5)
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, -30); // 当前1-3行站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, -30); // 下一个1-3行站点
        createTopologyLine(point1, point2, floor1Group);
      }

      // 4. 创建(1-3)和(1-4)站点间的拓扑路径
      // (1-3)行站点位置: Z=-30 (-25-5)
      // (1-4)行前站点位置: Z=-45 (-50+5)
      for (let i = 0; i < equipmentCols.length; i++) {
        const point1_3 = new THREE.Vector3(equipmentCols[i], nodeY, -30); // 1-3行站点
        const point1_4_front = new THREE.Vector3(equipmentCols[i], nodeY, -45); // 1-4行前站点
        createTopologyLine(point1_3, point1_4_front, floor1Group);
      }

      // 5. 在1-4行站点之间添加拓扑路径连接（相邻站点连接）
      // 1-4行前站点位置: Z=-45 (-50+5)
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, -45); // 当前1-4行前站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, -45); // 下一个1-4行前站点
        createTopologyLine(point1, point2, floor1Group);
      }

      // 6. 创建电梯站点间的拓扑路径（仅保留基本电梯连接）
      const elevatorStationPoint = new THREE.Vector3(45, nodeY, 0); // 电梯站点
      const elevatorStopPoint = new THREE.Vector3(45, nodeY, 10); // 电梯停靠点
      const elevatorBottomPoint = new THREE.Vector3(45, nodeY, -10); // 电梯下方停靠点

      // 电梯站点与停靠点连线
      createTopologyLine(elevatorStationPoint, elevatorStopPoint, floor1Group);
      createTopologyLine(elevatorStationPoint, elevatorBottomPoint, floor1Group);

      // 注意：已移除所有中转站点连线和指定站点的连线
    };



    // 创建拓扑连接线
    createTopologyConnections();
    
    // 建立站点连接关系
    buildStationConnections();
    
    // 二楼场景 (Y = 27.5)
    const floor2Y = floor1Y + floorHeight;
    const floor2Rows = [
      { z: 25, label: '2-1', color: '#ff8844' },
      { z: 0, label: '2-2', color: '#88ff44' },
      { z: -25, label: '2-3', color: '#4488ff' },
      { z: -50, label: '2-4', color: '#ff88ff' }
    ];
    
    // 创建二楼设备
    floor2Rows.forEach(row => {
      for (let col = 0; col < 6; col++) {
        const x = startX + col * spacing;
        createCNCMachine(new THREE.Vector3(x, floor2Y, row.z), floor2Group);
      }
    });

    // 创建二楼电梯 - 位于场景右侧，Y轴向上移动7.5个单位
     createElevator(new THREE.Vector3(60, floor2Y + 7.5, 0), 20, floor2Group);
    
    // 三楼场景 (Y = 52.5)
    const floor3Y = floor2Y + floorHeight;
    const floor3Rows = [
      { z: 25, label: '3-1', color: '#ffaa44' },
      { z: 0, label: '3-2', color: '#aaff44' },
      { z: -25, label: '3-3', color: '#44aaff' },
      { z: -50, label: '3-4', color: '#aa44ff' }
    ];
    
    // 创建三楼设备
    floor3Rows.forEach(row => {
      for (let col = 0; col < 6; col++) {
        const x = startX + col * spacing;
        createCNCMachine(new THREE.Vector3(x, floor3Y, row.z), floor3Group);
      }
    });

    // 创建三楼电梯 - 位于场景右侧，Y轴向上移动7.5个单位
     createElevator(new THREE.Vector3(60, floor3Y + 7.5, 0), 20, floor3Group);

    // 为每个楼层创建地面
    const createFloorPlane = (y: number, floorGroup: THREE.Group) => {
      const planeGeometry = new THREE.PlaneGeometry(150, 150);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        side: THREE.DoubleSide,
        transparent: true,  // 启用透明度
        opacity: 0.6,       // 设置透明度为60%
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = y;
      plane.receiveShadow = true;
      floorGroup.add(plane);
      return plane;
    };
    
    // 创建各楼层地面
    createFloorPlane(0, floor1Group);
    createFloorPlane(floor2Y - 2.5, floor2Group);
    createFloorPlane(floor3Y - 2.5, floor3Group);

    // 创建贯穿所有楼层的电梯 - 只在全部楼层视图中显示
     // 一楼地面在Y=0，电梯底部从地面开始（Y=0）
     const elevatorBottomY = 7.5; // 电梯底部位置，向上移动7.5个单位
     const elevatorTopY = floor3Y + 22.5; // 电梯顶部位置，在三楼上方22.5个单位（原15+7.5）
    const spanningElevatorHeight = elevatorTopY - elevatorBottomY; // 电梯总高度
    const spanningElevatorY = elevatorBottomY + (spanningElevatorHeight / 2); // 电梯中心位置
    const spanningElevatorGeometry = new THREE.BoxGeometry(6, spanningElevatorHeight, 4);
    const spanningElevatorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6b35, // 与单层电梯相同的橙红色
      metalness: 0.3,
      roughness: 0.4,
      transparent: true, // 启用透明度
      opacity: 0.7 // 设置透明度为70%
    });
    const spanningElevator = new THREE.Mesh(spanningElevatorGeometry, spanningElevatorMaterial);
    spanningElevator.position.set(60, spanningElevatorY, 0); // 与单层电梯相同的X、Z位置
    spanningElevator.castShadow = true;
    spanningElevator.receiveShadow = true;
    spanningElevator.visible = true; // 初始状态可见（全部楼层视图）
    scene.add(spanningElevator);

    // 为电梯添加描边效果
    const elevatorEdgesGeometry = new THREE.EdgesGeometry(spanningElevatorGeometry);
    const elevatorEdgesMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff8c00, // 亮橙色描边
      linewidth: 2 // 线条宽度
    });
    const elevatorEdges = new THREE.LineSegments(elevatorEdgesGeometry, elevatorEdgesMaterial);
    elevatorEdges.position.copy(spanningElevator.position); // 与电梯位置保持一致
    elevatorEdges.visible = true; // 初始状态可见，与电梯同步（全部楼层视图）
    scene.add(elevatorEdges);
    
    // 保存贯穿电梯和描边的引用
    spanningElevatorRef.current = spanningElevator;
    elevatorEdgesRef.current = elevatorEdges;

    // 初始化时隐藏各楼层的单层电梯（因为显示全部楼层视图）
    floorGroupsRef.current.forEach(group => {
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh && 
            child.geometry instanceof THREE.BoxGeometry &&
            child.position.x === 60 && child.position.z === 0) {
          child.visible = false;
        }
      });
    });

    // 创建行标签函数
    const createRowLabel = (text: string, position: THREE.Vector3, floorGroup: THREE.Group, color: string = '#ffffff') => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 128;
      
      // 绘制背景圆形
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.beginPath();
      context.arc(64, 64, 50, 0, 2 * Math.PI);
      context.fill();
      
      // 绘制文字
      context.fillStyle = color;
      context.font = 'bold 48px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(8, 8, 1); // 调整标签大小
      floorGroup.add(sprite);
      return sprite;
    };

    // 为每个楼层的每行添加地面标签
    // 一楼标签 - 悬浮在地面上方
    floor1Rows.forEach(row => {
      createRowLabel(row.label, new THREE.Vector3(-25, 2.0, row.z), floor1Group, row.color);
    });
    
    // 二楼标签 - 悬浮在二楼地面上方
    floor2Rows.forEach(row => {
      createRowLabel(row.label, new THREE.Vector3(-25, (floor2Y - 2.5) + 2.0, row.z), floor2Group, row.color);
    });
    
    // 三楼标签 - 悬浮在三楼地面上方
    floor3Rows.forEach(row => {
      createRowLabel(row.label, new THREE.Vector3(-25, (floor3Y - 2.5) + 2.0, row.z), floor3Group, row.color);
    });
    
    // 创建楼层标识
    createRowLabel('1F', new THREE.Vector3(-35, floor1Y + 10, 0), floor1Group, '#ffffff');
    createRowLabel('2F', new THREE.Vector3(-35, floor2Y + 10, 0), floor2Group, '#ffffff');
    createRowLabel('3F', new THREE.Vector3(-35, floor3Y + 10, 0), floor3Group, '#ffffff');

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      
      // 更新机器人移动动画
      animateRobotMovement();
      
      // 处理等待状态的机器人
      handleWaitingRobot();
      
      renderer.render(scene, camera);
    };
    animate();

    // 启动机器人移动系统（延迟3秒后开始）
    setTimeout(() => {
      startPathMovement();
    }, 3000);

    // Handle resize
    const handleResize = () => {
      if (mountNode) {
        const { clientWidth, clientHeight } = mountNode;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (autoTestTimer) {
        clearTimeout(autoTestTimer);
      }
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 重置视图到初始位置
  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      // 重置相机位置
      cameraRef.current.position.set(
        initialCameraPosition.x,
        initialCameraPosition.y,
        initialCameraPosition.z
      );
      
      // 重置控制器目标
      controlsRef.current.target.set(
        initialCameraTarget.x,
        initialCameraTarget.y,
        initialCameraTarget.z
      );
      
      // 更新控制器
      controlsRef.current.update();
    }
  };

  // 切换到顶视图
  const setTopView = () => {
    if (cameraRef.current && controlsRef.current) {
      // 设置相机到正上方位置
      cameraRef.current.position.set(0, 100, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // 切换到正视图（前视图）
  const setFrontView = () => {
    if (cameraRef.current && controlsRef.current) {
      // 设置相机到正前方位置
      cameraRef.current.position.set(0, 25, 100);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // 切换到指定楼层视图
  const setFloorView = (floor: number) => {
    if (cameraRef.current && controlsRef.current) {
      const floorHeight = 25;
      const baseY = 2.5;
      const targetY = baseY + (floor - 1) * floorHeight;
      
      // 隐藏所有楼层
      floorGroupsRef.current.forEach(group => {
        group.visible = false;
      });
      
      // 显示指定楼层
      if (floor >= 1 && floor <= 3) {
        const targetGroup = floorGroupsRef.current[floor - 1];
        targetGroup.visible = true;
        
        // 显示该楼层的单层电梯
        targetGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh && 
              child.geometry instanceof THREE.BoxGeometry &&
              child.position.x === 60 && child.position.z === 0) {
            child.visible = true;
          }
        });
      }
      
      // 隐藏贯穿电梯和描边
      if (spanningElevatorRef.current) {
        spanningElevatorRef.current.visible = false;
      }
      if (elevatorEdgesRef.current) {
        elevatorEdgesRef.current.visible = false;
      }
      
      // 设置相机位置，稍微偏上一些以便观察楼层
      cameraRef.current.position.set(0, targetY + 15, 80);
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  };

  // 显示全部楼层视图
  const setAllFloorsView = () => {
    if (cameraRef.current && controlsRef.current) {
      // 显示所有楼层
      floorGroupsRef.current.forEach(group => {
        group.visible = true;
        
        // 隐藏每个楼层组中的单层电梯
        group.children.forEach(child => {
          if (child instanceof THREE.Mesh && 
              child.geometry instanceof THREE.BoxGeometry &&
              child.position.x === 60 && child.position.z === 0) {
            child.visible = false;
          }
        });
      });
      
      // 显示贯穿电梯和描边
      if (spanningElevatorRef.current) {
        spanningElevatorRef.current.visible = true;
      }
      if (elevatorEdgesRef.current) {
        elevatorEdgesRef.current.visible = true;
      }
      
      // 设置相机位置，从较高的位置俯视所有楼层
      // 中间楼层的高度作为目标点
      const middleFloorY = 2.5 + (2 - 1) * 25; // 二楼的高度
      cameraRef.current.position.set(0, middleFloorY + 40, 100);
      controlsRef.current.target.set(0, middleFloorY, 0);
      controlsRef.current.update();
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetView,
    setTopView,
    setFrontView,
    setFloorView,
    setAllFloorsView,
    testRobotMovement: () => {
      if (isDev) console.log('手动触发机器人移动测试');
      if (startPathMovementRef.current) {
        startPathMovementRef.current();
      }
    }
  }), []);



  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D场景容器 */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
});

ThreeScene.displayName = 'ThreeScene';

export default ThreeScene;