// 动作序列数据类型定义
export interface ActionSequenceRecord {
  id: string;
  sequenceName: string;
  identifier: string;
  status: 'enabled' | 'disabled' | 'obsolete';
  remark: string;
  updateTime: string;
  updatedBy: string;
  canvasData?: {
    nodes: any[];
    connections: any[];
    subCanvases: any[];
  };
}

// 初始数据
const initialData: ActionSequenceRecord[] = [
  {
    id: '1',
    sequenceName: '机器人移动序列',
    identifier: 'robot_move_sequence',
    status: 'enabled',
    remark: '机器人基础移动动作序列',
    updateTime: '2024-01-15 10:30:00',
    updatedBy: '张三',
    canvasData: {
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '移动开始'
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 300, y: 100 },
          label: '动作',
          customName: '前进动作'
        }
      ],
      connections: [
        {
          id: 'conn-1',
          source: 'start-1',
          target: 'action-1'
        }
      ],
      subCanvases: []
    }
  },
  {
    id: '2',
    sequenceName: '抓取动作序列',
    identifier: 'grab_action_sequence',
    status: 'disabled',
    remark: '机械臂抓取物品的动作序列',
    updateTime: '2024-01-14 14:20:00',
    updatedBy: '李四',
    canvasData: {
      nodes: [
        {
          id: 'start-2',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '抓取开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  },
  {
    id: '3',
    sequenceName: '充电动作序列',
    identifier: 'charging_sequence',
    status: 'obsolete',
    remark: '自动充电的动作序列',
    updateTime: '2024-01-13 09:15:00',
    updatedBy: '王五',
    canvasData: {
      nodes: [
        {
          id: 'start-3',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '充电开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  },
  {
    id: '4',
    sequenceName: '巡检动作序列',
    identifier: 'patrol_sequence',
    status: 'enabled',
    remark: '自动巡检的动作序列',
    updateTime: '2024-01-12 16:45:00',
    updatedBy: '赵六',
    canvasData: {
      nodes: [
        {
          id: 'start-4',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '巡检开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  }
];

// 导出数据
export let actionSequenceData: ActionSequenceRecord[] = [...initialData];

// 更新数据的函数
export const updateActionSequenceData = (newData: ActionSequenceRecord[]) => {
  actionSequenceData = newData;
};

// 添加动作序列
export const addActionSequence = (newSequence: ActionSequenceRecord) => {
  // 检查标识符是否已存在
  const existingSequence = actionSequenceData.find(seq => seq.identifier === newSequence.identifier);
  if (existingSequence) {
    throw new Error('动作序列标识符已存在');
  }
  
  // 生成新的ID
  const maxId = Math.max(...actionSequenceData.map(seq => parseInt(seq.id)), 0);
  const newId = (maxId + 1).toString();
  
  const sequenceWithId = {
    ...newSequence,
    id: newId,
    updateTime: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
  
  actionSequenceData.push(sequenceWithId);
  return sequenceWithId;
};

// 更新动作序列
export const updateActionSequence = (id: string, updatedSequence: Partial<ActionSequenceRecord>) => {
  const index = actionSequenceData.findIndex(seq => seq.id === id);
  if (index !== -1) {
    actionSequenceData[index] = { ...actionSequenceData[index], ...updatedSequence };
  }
};

// 删除动作序列
export const deleteActionSequence = (id: string) => {
  const index = actionSequenceData.findIndex(seq => seq.id === id);
  if (index !== -1) {
    actionSequenceData.splice(index, 1);
  }
};