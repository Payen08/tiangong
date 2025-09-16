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
}

const ThreeScene = forwardRef<ThreeSceneRef, ThreeSceneProps>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorGroupsRef = useRef<THREE.Group[]>([]);
  
  // 初始相机位置
  const initialCameraPosition = { x: 50, y: 50, z: 50 };
  const initialCameraTarget = { x: 0, y: 0, z: 0 };

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
    
    // 初始状态只显示一楼
    floor1Group.visible = true;
    floor2Group.visible = false;
    floor3Group.visible = false;
    
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

    // 为每个楼层创建地面
    const createFloorPlane = (y: number, floorGroup: THREE.Group) => {
      const planeGeometry = new THREE.PlaneGeometry(150, 150);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        side: THREE.DoubleSide,
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
    // 一楼标签 - 贴近地面
    floor1Rows.forEach(row => {
      createRowLabel(row.label, new THREE.Vector3(-25, 0.1, row.z), floor1Group, row.color);
    });
    
    // 二楼标签 - 贴近二楼地面
    floor2Rows.forEach(row => {
      createRowLabel(row.label, new THREE.Vector3(-25, (floor2Y - 2.5) + 0.1, row.z), floor2Group, row.color);
    });
    
    // 三楼标签 - 贴近三楼地面
    floor3Rows.forEach(row => {
      createRowLabel(row.label, new THREE.Vector3(-25, (floor3Y - 2.5) + 0.1, row.z), floor3Group, row.color);
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
        floorGroupsRef.current[floor - 1].visible = true;
      }
      
      // 设置相机位置，稍微偏上一些以便观察楼层
      cameraRef.current.position.set(0, targetY + 15, 80);
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetView,
    setTopView,
    setFrontView,
    setFloorView
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