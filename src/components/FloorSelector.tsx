import React from 'react';
import { Select, message } from 'antd';
import { ThreeSceneRef } from './ThreeScene';

const { Option } = Select;

// 楼层数据接口
interface FloorOption {
  id: string;
  name: string;
  level: number;
}

// 组件属性接口
interface FloorSelectorProps {
  selectedFloor: string | null;
  onFloorChange: (floorId: string) => void;
  threeSceneRef: React.RefObject<ThreeSceneRef>;
  floors?: FloorOption[];
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  placeholder?: string;
}

// 默认楼层数据
const defaultFloors: FloorOption[] = [
  { id: 'all', name: '全部楼层', level: 0 }, // 新增全部楼层选项
  { id: 'floor1', name: '一楼地图', level: 1 },
  { id: 'floor2', name: '二楼地图', level: 2 },
  { id: 'floor3', name: '三楼地图', level: 3 },
];

const FloorSelector: React.FC<FloorSelectorProps> = ({
  selectedFloor,
  onFloorChange,
  threeSceneRef,
  floors = defaultFloors,
  style = {},
  size = 'small',
  disabled = false,
  placeholder = '选择楼层'
}) => {
  
  // 处理楼层切换
  const handleFloorChange = (floorId: string) => {
    const floor = floors.find(f => f.id === floorId);
    if (floor && threeSceneRef.current) {
      if (floor.id === 'all') {
        // 显示全部楼层
        threeSceneRef.current.setAllFloorsView();
        message.success('已切换到全部楼层视图');
      } else {
        // 显示单个楼层
        threeSceneRef.current.setFloorView(floor.level);
        message.success(`已切换到${floor.name}视图`);
      }
      
      // 调用父组件的回调函数
      onFloorChange(floorId);
    }
  };

  // 默认样式
  const defaultStyle: React.CSSProperties = {
    width: 120,
    color: 'rgba(255, 255, 255, 0.7)',
    ...style
  };

  // 下拉菜单样式 - 与深色主题保持一致
  const popupStyles: React.CSSProperties = {
    backgroundColor: 'rgba(4, 3, 28, 0.95)', // 深色背景，与主界面一致
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)', // 添加边框
    borderRadius: '6px' // 圆角
  };

  return (
    <Select
      size={size}
      value={selectedFloor}
      onChange={handleFloorChange}
      style={defaultStyle}
      styles={{ popup: { root: popupStyles } }}
      disabled={disabled}
      placeholder={placeholder}
      classNames={{ popup: { root: "floor-selector-dropdown" } }}
    >
      {floors.map(floor => (
        <Option key={floor.id} value={floor.id}>
          {floor.name}
        </Option>
      ))}
    </Select>
  );
};

export default FloorSelector;
export type { FloorSelectorProps, FloorOption };