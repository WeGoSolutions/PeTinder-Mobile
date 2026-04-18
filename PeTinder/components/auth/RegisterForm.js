import React, { useRef } from "react";
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
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  if (registerStep === 1) {
    return (
      <>
        <Input
          label={registerErrors.fullName || "Nome Completo"}
          labelColor={registerErrors.fullName ? "#FF6B6B" : undefined}
          value={fullName}
          onChangeText={onFullNameChange}
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailInputRef.current?.focus()}
          error={!!registerErrors.fullName}
        />
        <Input
          ref={emailInputRef}
          label={registerErrors.email || "Email"}
          labelColor={registerErrors.email ? "#FF6B6B" : undefined}
          value={registerEmail}
          onChangeText={onRegisterEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          error={!!registerErrors.email}
        />
        <Input
          ref={passwordInputRef}
          label={registerErrors.password || "Senha"}
          labelColor={registerErrors.password ? "#FF6B6B" : undefined}
          value={registerPassword}
          onChangeText={onRegisterPasswordChange}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
          error={!!registerErrors.password}
        />
        <Input
          ref={confirmPasswordInputRef}
          label={registerErrors.confirmPassword || "Confirmar Senha"}
          labelColor={registerErrors.confirmPassword ? "#FF6B6B" : undefined}
          value={confirmRegisterPassword}
          onChangeText={onConfirmRegisterPasswordChange}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onRegisterNext}
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
