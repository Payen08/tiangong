import React, { useState } from 'react';
import { Card, Button } from 'antd';

const AddCrossMapConnection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Card title="简化版本测试">
        <p>当前步骤: {currentStep}</p>
        <Button onClick={() => setCurrentStep(prev => prev + 1)}>
          下一步
        </Button>
      </Card>
    </div>
  );
};

export default AddCrossMapConnection;