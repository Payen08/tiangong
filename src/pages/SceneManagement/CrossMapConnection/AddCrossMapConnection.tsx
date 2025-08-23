import React, { useState } from 'react';
import { Card, Button } from 'antd';

interface AddCrossMapConnectionProps {
  visible?: boolean;
  onClose?: () => void;
  onSave?: (connectionData: any) => void;
  onConnectionCreated?: (connectionData: any) => void;
  editingConnection?: any;
  editData?: any;
}

const AddCrossMapConnection: React.FC<AddCrossMapConnectionProps> = ({ 
  visible = false,
  onClose, 
  onSave,
  onConnectionCreated, 
  editingConnection,
  editData 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Card title="简化版本测试">
        <p>当前步骤: {currentStep}</p>
        <Button onClick={() => setCurrentStep(prev => prev + 1)}>
          下一步
        </Button>
        {onClose && (
          <Button onClick={onClose} style={{ marginLeft: 8 }}>
            关闭
          </Button>
        )}
      </Card>
    </div>
  );
};

export default AddCrossMapConnection;