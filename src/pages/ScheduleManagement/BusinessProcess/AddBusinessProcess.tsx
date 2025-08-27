import React from 'react';
import { Drawer } from 'antd';

interface AddBusinessProcessProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

const AddBusinessProcess: React.FC<AddBusinessProcessProps> = ({ 
  visible,
  onClose, 
  onSave, 
  editData 
}) => {
  return (
    <Drawer
      title={editData ? '编辑业务流程' : '新增业务流程'}
      open={visible}
      onClose={onClose}
      width="100vw"
      height="100vh"
      placement="right"
      destroyOnClose
    >
      <div>测试内容</div>
    </Drawer>
  );
};

export default AddBusinessProcess;