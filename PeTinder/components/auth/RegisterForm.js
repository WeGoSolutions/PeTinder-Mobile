import React from "react";
import Input from "../Input";
import Button from "../Button";
import Checkbox from "../Checkbox";

const RegisterForm = ({
  registerStep,
  registerErrors,
  fullName,
  registerEmail,
  registerPassword,
  confirmRegisterPassword,
  birthDate,
  acceptedTerms,
  isCreateAccountLoading,
  onFullNameChange,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onConfirmRegisterPasswordChange,
  onBirthDateChange,
  onAcceptedTermsChange,
  onRegisterNext,
  onCreateAccount,
}) => {
  if (registerStep === 1) {
    return (
      <>
        <Input
          label={registerErrors.fullName || "Nome Completo"}
          labelColor={registerErrors.fullName ? "#FF6B6B" : undefined}
          value={fullName}
          onChangeText={onFullNameChange}
          error={!!registerErrors.fullName}
        />
        <Input
          label={registerErrors.email || "Email"}
          labelColor={registerErrors.email ? "#FF6B6B" : undefined}
          value={registerEmail}
          onChangeText={onRegisterEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!registerErrors.email}
        />
        <Input
          label={registerErrors.password || "Senha"}
          labelColor={registerErrors.password ? "#FF6B6B" : undefined}
          value={registerPassword}
          onChangeText={onRegisterPasswordChange}
          secureTextEntry
          error={!!registerErrors.password}
        />
        <Input
          label={registerErrors.confirmPassword || "Confirmar Senha"}
          labelColor={registerErrors.confirmPassword ? "#FF6B6B" : undefined}
          value={confirmRegisterPassword}
          onChangeText={onConfirmRegisterPasswordChange}
          secureTextEntry
          error={!!registerErrors.confirmPassword}
        />
        <Button variant="secondary" onPress={onRegisterNext}>
          Próximo
        </Button>
      </>
    );
  }

  return (
    <>
      <Input
        variant="date"
        label={registerErrors.birthDate || "Data de Nascimento"}
        labelColor={registerErrors.birthDate ? "#FF6B6B" : undefined}
        dateValue={birthDate}
        onDateChange={onBirthDateChange}
        error={!!registerErrors.birthDate}
      />
      <Checkbox
        checked={acceptedTerms}
        onChange={onAcceptedTermsChange}
        error={!!registerErrors.terms}
        label="Li e aceito os Termos de condição."
      />
      <Button
        variant="primary"
        onPress={onCreateAccount}
        isLoading={isCreateAccountLoading}
      >
        Criar Conta
      </Button>
    </>
  );
};

export default RegisterForm;
