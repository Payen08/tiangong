// 业务流程数据类型定义
export interface BusinessProcessRecord {
  id: string;
  businessName: string;
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
const initialData: BusinessProcessRecord[] = [
  {
    id: '1',
    businessName: '订单处理流程',
    identifier: 'order_process',
    status: 'enabled',
    remark: '处理客户订单的标准流程',
    updateTime: '2024-01-15 10:30:00',
    updatedBy: '张三',
    canvasData: {
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '订单开始'
        },
        {
          id: 'task-1',
          type: 'task',
          position: { x: 300, y: 100 },
          label: '任务',
          customName: '订单验证'
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
    businessName: '库存管理流程',
    identifier: 'inventory_management',
    status: 'disabled',
    remark: '管理仓库库存的业务流程',
    updateTime: '2024-01-14 14:20:00',
    updatedBy: '李四',
    canvasData: {
      nodes: [
        {
          id: 'start-2',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '库存检查开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  },
  {
    id: '3',
    businessName: '退货处理流程',
    identifier: 'return_process',
    status: 'obsolete',
    remark: '处理客户退货的流程',
    updateTime: '2024-01-13 09:15:00',
    updatedBy: '王五',
    canvasData: {
      nodes: [
        {
          id: 'start-3',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '退货开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  },
  {
    id: '4',
    businessName: '采购管理流程',
    identifier: 'procurement_process',
    status: 'enabled',
    remark: '管理采购流程的业务流程',
    updateTime: '2024-01-12 16:45:00',
    updatedBy: '赵六',
    canvasData: {
      nodes: [
        {
          id: 'start-4',
          type: 'start',
          position: { x: 100, y: 100 },
          label: '开始',
          customName: '采购开始'
        }
      ],
      connections: [],
      subCanvases: []
    }
  }
];

// 共享的业务流程数据源
export let businessProcessData: BusinessProcessRecord[] = [...initialData];

// 更新业务流程数据的函数
export const updateBusinessProcessData = (newData: BusinessProcessRecord[]) => {
  businessProcessData.length = 0;
  businessProcessData.push(...newData);
};

// 添加单个业务流程的函数
export const addBusinessProcess = (newProcess: BusinessProcessRecord) => {
  console.log('🚀 [DEBUG] addBusinessProcess函数被调用了！', newProcess);
  businessProcessData.unshift(newProcess);
  
  // 添加日志：记录新增业务流程后的数据状态
  console.log('🎯 [业务流程创建] 新增业务流程成功:', {
    新增流程: {
      名称: newProcess.businessName,
      标识符: newProcess.identifier,
      状态: newProcess.status,
      更新时间: newProcess.updateTime,
      更新人: newProcess.updatedBy
    },
    当前业务流程总数: businessProcessData.length,
    完整业务流程列表: businessProcessData.map(item => ({
      ID: item.id,
      名称: item.businessName,
      标识符: item.identifier,
      状态: item.status,
      更新时间: item.updateTime,
      更新人: item.updatedBy
    }))
  });
};

// 更新单个业务流程的函数
export const updateBusinessProcess = (id: string, updatedProcess: Partial<BusinessProcessRecord>) => {
  const index = businessProcessData.findIndex(item => item.id === id);
  if (index !== -1) {
    businessProcessData[index] = { ...businessProcessData[index], ...updatedProcess };
  }
};

// 删除业务流程的函数
export const deleteBusinessProcess = (id: string) => {
  const index = businessProcessData.findIndex(item => item.id === id);
  if (index !== -1) {
    businessProcessData.splice(index, 1);
  }
};