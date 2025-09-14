// 行为树数据类型定义
export interface BehaviorTreeRecord {
  id: string;
  treeName: string;
  treeKey: string;
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
const initialData: BehaviorTreeRecord[] = [
  {
    id: '1',
    treeName: '订单处理行为树',
    treeKey: 'order_process_tree',
    status: 'enabled',
    remark: '处理客户订单的行为树',
    updateTime: '2024-01-15 10:30:00',
    updatedBy: '张三',
    canvasData: {
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '订单行为开始'
        },
        {
          id: 'task-1',
          type: 'task',
          position: { x: 300, y: 100 },
          label: '任务',
          customName: '订单验证行为'
        }
      ],
      connections: [
        {
          id: 'conn-1',
          source: 'start-1',
          target: 'task-1'
        }
      ],
      subCanvases: []
    }
  },
  {
    id: '2',
    treeName: '库存管理行为树',
    treeKey: 'inventory_management_tree',
    status: 'disabled',
    remark: '管理仓库库存的行为树',
    updateTime: '2024-01-14 14:20:00',
    updatedBy: '李四',
    canvasData: {
      nodes: [
        {
          id: 'start-2',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '库存检查行为开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  },
  {
    id: '3',
    treeName: '退货处理行为树',
    treeKey: 'return_process_tree',
    status: 'obsolete',
    remark: '处理客户退货的行为树',
    updateTime: '2024-01-13 09:15:00',
    updatedBy: '王五',
    canvasData: {
      nodes: [
        {
          id: 'start-3',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '退货行为开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  },
  {
    id: '4',
    treeName: '采购管理行为树',
    treeKey: 'procurement_process_tree',
    status: 'enabled',
    remark: '管理采购流程的行为树',
    updateTime: '2024-01-12 16:45:00',
    updatedBy: '赵六',
    canvasData: {
      nodes: [
        {
          id: 'start-4',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '采购行为开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  }
];

// 共享的行为树数据源
export let behaviorTreeData: BehaviorTreeRecord[] = [...initialData];

// 更新行为树数据的函数
export const updateBehaviorTreeData = (newData: BehaviorTreeRecord[]) => {
  behaviorTreeData.length = 0;
  behaviorTreeData.push(...newData);
};

// 添加单个行为树的函数
export const addBehaviorTree = (newTree: BehaviorTreeRecord) => {
  
  behaviorTreeData.unshift(newTree);
  

};

// 更新单个行为树的函数
export const updateBehaviorTree = (id: string, updatedTree: Partial<BehaviorTreeRecord>) => {
  const index = behaviorTreeData.findIndex(item => item.id === id);
  if (index !== -1) {
    behaviorTreeData[index] = { ...behaviorTreeData[index], ...updatedTree };
  }
};

// 删除行为树的函数
export const deleteBehaviorTree = (id: string) => {
  const index = behaviorTreeData.findIndex(item => item.id === id);
  if (index !== -1) {
    behaviorTreeData.splice(index, 1);
  }
};