import React, { useEffect, useState } from 'react';
import NewUserStepsModal from './NewUserStepsModal';

const NewUserOnboardingGate = ({ navigation, route }) => {
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserStep, setNewUserStep] = useState(1);

  useEffect(() => {
    if (route?.params?.userNovo) {
      setShowNewUserModal(true);
      setNewUserStep(1);
      navigation.setParams({ userNovo: false });
    }
  }, [navigation, route?.params?.userNovo]);

  const handleNextNewUserStep = () => {
    setNewUserStep(2);
  };

  const handleBackNewUserStep = () => {
    setNewUserStep(1);
  };

  const handleFinishNewUserFlow = () => {
    setShowNewUserModal(false);
    setNewUserStep(1);
  };

  return (
    <NewUserStepsModal
      visible={showNewUserModal}
      step={newUserStep}
      onNext={handleNextNewUserStep}
      onBack={handleBackNewUserStep}
      onFinish={handleFinishNewUserFlow}
    />
  );
};

export default NewUserOnboardingGate;
