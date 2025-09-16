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
}

const ThreeScene = forwardRef<ThreeSceneRef, ThreeSceneProps>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
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
    const createCNCMachine = (position: THREE.Vector3) => {
      const geometry = new THREE.BoxGeometry(5, 5, 5);
      const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.copy(position);
      cube.castShadow = true;
      cube.receiveShadow = true;
      scene.add(cube);
      return cube;
    };

    // 原有5个CNC设备重新排列成一行，并增加第6个设备
    const originalRowY = 2.5; // 原有设备行高度（正方体中心点，确保底部在地面之上）
    const spacing = 8; // 正方体间距
    const originalStartX = -20; // 原有设备行起始X坐标（移动到原点附近）
    const originalRowZ = 25; // 原有设备行的Z坐标位置（向前移动）
    
    // 创建原有设备行（6个CNC设备）
    for (let col = 0; col < 6; col++) {
      const x = originalStartX + col * spacing;
      createCNCMachine(new THREE.Vector3(x, originalRowY, originalRowZ));
    }

    // 一层楼层 - 新增一行6列的正方体（与原有设备一一对应）
    const floorLevel1Y = 2.5; // 一层楼层高度（正方体中心点，确保底部在地面之上）
    const newRowStartX = -20; // 新行起始X坐标（与原有行对齐，移动到原点附近）
    const newRowZ = 0; // 新行的Z坐标位置（向前移动）
    
    // 创建新增一行6列的正方体
    for (let col = 0; col < 6; col++) {
      const x = newRowStartX + col * spacing;
      createCNCMachine(new THREE.Vector3(x, floorLevel1Y, newRowZ));
    }

    // 再增加两行正方体，每行6个
    // 第三行
    const thirdRowStartX = -20; // 移动到原点附近
    const thirdRowZ = -10; // 靠近第二行（向前移动）
    const thirdRowY = 2.5; // 确保正方体底部在地面之上
    
    for (let col = 0; col < 6; col++) {
      const x = thirdRowStartX + col * spacing;
      createCNCMachine(new THREE.Vector3(x, thirdRowY, thirdRowZ));
    }

    // 第四行
    const fourthRowStartX = -20; // 移动到原点附近
    const fourthRowZ = -35; // 与第3行保持25单位间距（向Z轴负方向移动）
    const fourthRowY = 2.5; // 确保正方体底部在地面之上
    
    for (let col = 0; col < 6; col++) {
      const x = fourthRowStartX + col * spacing;
      createCNCMachine(new THREE.Vector3(x, fourthRowY, fourthRowZ));
    }

    // Ground plane - 扩大地面尺寸以容纳所有正方体
    const planeGeometry = new THREE.PlaneGeometry(150, 150);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // 创建行标签函数
    const createRowLabel = (text: string, position: THREE.Vector3, color: string = '#ffffff') => {
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
      scene.add(sprite);
      return sprite;
    };

    // 为每行添加地面标签（位于行的首端）
    // 第1行标签（Z=25）
    createRowLabel('1', new THREE.Vector3(-25, 0.1, originalRowZ), '#ff4444');
    
    // 第2行标签（Z=0）
    createRowLabel('2', new THREE.Vector3(-25, 0.1, newRowZ), '#44ff44');
    
    // 第3行标签（Z=-25）
    createRowLabel('3', new THREE.Vector3(-25, 0.1, thirdRowZ), '#4444ff');
    
    // 第4行标签（Z=-50）
    createRowLabel('4', new THREE.Vector3(-25, 0.1, fourthRowZ), '#ffff44');

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

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    resetView,
    setTopView,
    setFrontView
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