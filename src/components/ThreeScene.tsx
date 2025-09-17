import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeSceneProps {
  // This component will fetch and manage its own state for now.
}

export interface ThreeSceneRef {
  resetView: () => void;
  setTopView: () => void;
  setFrontView: () => void;
  setFloorView: (floor: number) => void;
  setAllFloorsView: () => void;
}

const ThreeScene = forwardRef<ThreeSceneRef, ThreeSceneProps>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);
  const spanningElevatorRef = useRef<THREE.Mesh | null>(null);
  const elevatorEdgesRef = useRef<THREE.LineSegments | null>(null);
  
  // 初始相机位置 - 适合全部楼层视图
  const initialCameraPosition = { x: 0, y: 67.5, z: 100 }; // 调整为全部楼层视图的相机位置
  const initialCameraTarget = { x: 0, y: 27.5, z: 0 }; // 目标点设为二楼中心位置

  useEffect(() => {
    if (!mountRef.current) return;

    const mountNode = mountRef.current;

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
    const rowSpacing = 25; // 行间距
    
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

    // 创建一楼拓扑路径站点
    const createTopologyNode = (position: THREE.Vector3, group: THREE.Group, label?: string) => {
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
      
      // 如果提供了标签，创建文字标签
      if (label) {
        createStationLabel(position, label, group);
      }
      
      return node;
    };

    // 创建站点序号标签
    const createStationLabel = (position: THREE.Vector3, text: string, group: THREE.Group) => {
      // 创建canvas用于绘制文字
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 160;
      canvas.height = 80;
      
      // 清除画布
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制阴影背景
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      context.fillRect(4, 4, canvas.width - 4, canvas.height - 4);
      
      // 绘制主背景（圆角矩形）
      const radius = 8;
      context.fillStyle = 'rgba(255, 255, 255, 0.95)';
      context.beginPath();
      context.roundRect(0, 0, canvas.width - 4, canvas.height - 4, radius);
      context.fill();
      
      // 绘制边框
      context.strokeStyle = '#2196F3';
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(0, 0, canvas.width - 4, canvas.height - 4, radius);
      context.stroke();
      
      // 绘制文字
      context.fillStyle = '#1976D2';
      context.font = 'bold 20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, (canvas.width - 4) / 2, (canvas.height - 4) / 2);
      
      // 创建纹理和Sprite材质
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthTest: false, // 确保标签始终可见
        depthWrite: false
      });
      
      // 创建Sprite（自动面向相机）
      const labelSprite = new THREE.Sprite(spriteMaterial);
      
      // 设置标签位置（在站点上方）
      labelSprite.position.set(position.x, position.y + 2.5, position.z);
      labelSprite.scale.set(3, 1.5, 1); // 调整缩放比例，使标签更清晰
      labelSprite.name = 'stationLabel';
      labelSprite.renderOrder = 1000; // 确保标签在最前面渲染
      
      group.add(labelSprite);
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
      const rowLabels = ['1-1', '1-2', '1-3', '1-4']; // 行标签
      
      // 为每台设备创建站点，根据需求选择性创建前后站点
      equipmentRows.forEach((z, rowIndex) => {
        equipmentCols.forEach((x, colIndex) => {
          const rowLabel = rowLabels[rowIndex];
          const colLabel = (colIndex + 1).toString(); // 列编号从1开始
          
          // 设备前侧的站点 (Z坐标加上5个单位，距离更远，Y坐标贴地面)
          // 1-1行(Z=25)和1-3行(Z=-25)不创建前面的站点
          if (z !== 25 && z !== -25) {
            const frontLabel = `${rowLabel}-${colLabel}F`; // F表示前侧站点
            createTopologyNode(new THREE.Vector3(x, 0.1, z + 5), floor1Group, frontLabel);
          }
          
          // 设备后侧的站点 (Z坐标减去5个单位，距离更远，Y坐标贴地面)
          // 1-2行(Z=0)和1-4行(Z=-50)不创建后面的站点
          if (z !== 0 && z !== -50) {
            const backLabel = `${rowLabel}-${colLabel}B`; // B表示后侧站点
            createTopologyNode(new THREE.Vector3(x, 0.1, z - 5), floor1Group, backLabel);
          }
        });
      });
      
      // 添加电梯内外站点连线
      const elevatorOutsidePoint = new THREE.Vector3(45, nodeY, 0); // 电梯左侧站点
      const elevatorInsidePoint = new THREE.Vector3(60, nodeY, 0);  // 电梯内站点
      createTopologyLine(elevatorOutsidePoint, elevatorInsidePoint, floor1Group);
    };

    createFloor1TopologyGrid();

    // 创建1楼电梯左侧站点
    createTopologyNode(new THREE.Vector3(45, 0.1, 0), floor1Group, '电梯站点');

    // 创建电梯点上方的停靠点
    createTopologyNode(new THREE.Vector3(45, 0.1, 10), floor1Group, '电梯停靠点');

    // 创建电梯点下方的停靠点
    createTopologyNode(new THREE.Vector3(45, 0.1, -10), floor1Group, '电梯下方停靠点');

    // 创建1-6-B和1-2-6F连线中间的站点
    createTopologyNode(new THREE.Vector3(20, 0.1, 12.5), floor1Group, '中转站点');

    // 创建1-3-6B和1-4-6F连线中间的站点
    createTopologyNode(new THREE.Vector3(20, 0.1, -37.5), floor1Group, '中转站点2');

    // 创建1楼电梯内部站点
    createTopologyNode(new THREE.Vector3(60, 0.1, 0), floor1Group, '电梯内站点');

    // 创建拓扑路径连接线，连接各行之间的站点
    const createTopologyConnections = () => {
      const equipmentCols = [-20, -12, -4, 4, 12, 20]; // 设备列的X坐标
      const nodeY = 0.1; // 站点的Y坐标（贴地面）
      
      // 添加1-1行站点间的连线（相邻站点连接）
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, 25 - 5); // 当前1-1行站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, 25 - 5); // 下一个1-1行站点
        createTopologyLine(point1, point2, floor1Group);
      }
      
      // 添加1-2行站点间的连线（相邻站点连接）
      // 1-2行前站点间的连线
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, 0 + 5); // 当前1-2行前站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, 0 + 5); // 下一个1-2行前站点
        createTopologyLine(point1, point2, floor1Group);
      }
      // 1-2行后站点间的连线
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, 0 - 5); // 当前1-2行后站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, 0 - 5); // 下一个1-2行后站点
        createTopologyLine(point1, point2, floor1Group);
      }
      
      // 添加1-3行站点间的连线（相邻站点连接）
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, -25 - 5); // 当前1-3行站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, -25 - 5); // 下一个1-3行站点
        createTopologyLine(point1, point2, floor1Group);
      }
      
      // 添加1-4行站点间的连线（相邻站点连接）
      for (let i = 0; i < equipmentCols.length - 1; i++) {
        const point1 = new THREE.Vector3(equipmentCols[i], nodeY, -50 + 5); // 当前1-4行站点
        const point2 = new THREE.Vector3(equipmentCols[i + 1], nodeY, -50 + 5); // 下一个1-4行站点
        createTopologyLine(point1, point2, floor1Group);
      }
      
      // 实现1-1行所有站点对1-2行的1对N连线
      equipmentCols.forEach(x1_1 => {
        const point1_1_back = new THREE.Vector3(x1_1, nodeY, 25 - 5); // 1-1行站点 (Z=20)
        
        // 每个1-1行站点连接到1-2行所有前站点
        equipmentCols.forEach(x1_2 => {
          const point1_2_front = new THREE.Vector3(x1_2, nodeY, 0 + 5); // 1-2行前站点 (Z=5)
          
          // 特殊处理：1-6-B到1-2-6F通过中转站点连接
          if (x1_1 === 20 && x1_2 === 20) {
            // 1-6-B到中转站点
            const middlePoint = new THREE.Vector3(20, nodeY, 12.5);
            createTopologyLine(point1_1_back, middlePoint, floor1Group);
            // 中转站点到1-2-6F
            createTopologyLine(middlePoint, point1_2_front, floor1Group);
          } else {
            // 其他连线保持原有逻辑
            createTopologyLine(point1_1_back, point1_2_front, floor1Group);
          }
        });
      });
      
      // 实现1-3行所有站点对1-4行的1对N连线
      equipmentCols.forEach(x1_3 => {
        const point1_3_back = new THREE.Vector3(x1_3, nodeY, -25 - 5); // 1-3行后站点 (Z=-30)
        
        // 每个1-3行站点连接到1-4行所有前站点
        equipmentCols.forEach(x1_4 => {
          const point1_4_front = new THREE.Vector3(x1_4, nodeY, -50 + 5); // 1-4行前站点 (Z=-45)
          
          // 特殊处理：当x1_3和x1_4都为20时（对应1-3-6B和1-4-6F站点），通过中转站点连接
          if (x1_3 === 20 && x1_4 === 20) {
            // 1-3-6B到中转站点2
            createTopologyLine(point1_3_back, new THREE.Vector3(20, nodeY, -37.5), floor1Group);
            // 中转站点2到1-4-6F
            createTopologyLine(new THREE.Vector3(20, nodeY, -37.5), point1_4_front, floor1Group);
          } else {
            // 其他情况保持原有的直接连线
            createTopologyLine(point1_3_back, point1_4_front, floor1Group);
          }
        });
      });

      // 添加电梯点与中转点的连线
      const elevatorStationPoint = new THREE.Vector3(45, nodeY, 0); // 电梯站点
      const elevatorStopPoint = new THREE.Vector3(45, nodeY, 10); // 电梯停靠点
      const elevatorBottomStopPoint = new THREE.Vector3(45, nodeY, -10); // 电梯下方停靠点
      const transferPoint1 = new THREE.Vector3(20, nodeY, 12.5); // 中转站点
      const transferPoint2 = new THREE.Vector3(20, nodeY, -37.5); // 中转站点2

      // 电梯站点与电梯停靠点连线
      createTopologyLine(elevatorStationPoint, elevatorStopPoint, floor1Group);

      // 电梯站点与电梯下方停靠点连线
      createTopologyLine(elevatorStationPoint, elevatorBottomStopPoint, floor1Group);

      // 电梯停靠点与中转站点连线
      createTopologyLine(elevatorStopPoint, transferPoint1, floor1Group);

      // 电梯下方停靠点与中转站点2连线
      createTopologyLine(elevatorBottomStopPoint, transferPoint2, floor1Group);
    };



    // 创建拓扑连接线
    createTopologyConnections();
    
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
      renderer.render(scene, camera);
    };
    animate();

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
    setAllFloorsView
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