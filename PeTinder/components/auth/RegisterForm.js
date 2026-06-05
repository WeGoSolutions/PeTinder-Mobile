import React, { useRef } from "react";
import Input from "../Input";
import Button from "../Button";
import Checkbox from "../Checkbox";
import PasswordRequirements from "./PasswordRequirements";
import {
  HELPER_TEXT,
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateBirthDate,
} from "../../utils/validation";

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
  onFullNameBlur,
  onRegisterEmailBlur,
  onRegisterPasswordBlur,
  onConfirmRegisterPasswordBlur,
  onRegisterNext,
  onCreateAccount,
}) => {
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Validade calculada a cada caractere digitado, para que os requisitos se
  // "completem" em tempo real (check verde) sem depender do blur/submit.
  const isFullNameValid = fullName.trim().length > 0 && validateFullName(fullName) === "";
  const isEmailValid = registerEmail.trim().length > 0 && validateEmail(registerEmail) === "";
  const isPasswordValid = registerPassword.length > 0 && validatePassword(registerPassword) === "";
  const isConfirmPasswordValid =
    confirmRegisterPassword.length > 0 &&
    validateConfirmPassword(registerPassword, confirmRegisterPassword) === "";
  const isBirthDateValid = !!birthDate && validateBirthDate(birthDate) === "";

  if (registerStep === 1) {
    return (
      <>
        <Input
          label="Nome Completo"
          value={fullName}
          onChangeText={onFullNameChange}
          onBlur={onFullNameBlur}
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailInputRef.current?.focus()}
          error={!!registerErrors.fullName}
          errorText={registerErrors.fullName}
          helperText={HELPER_TEXT.fullName}
          valid={isFullNameValid}
        />
        <Input
          ref={emailInputRef}
          label="Email"
          value={registerEmail}
          onChangeText={onRegisterEmailChange}
          onBlur={onRegisterEmailBlur}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          error={!!registerErrors.email}
          errorText={registerErrors.email}
          helperText={HELPER_TEXT.email}
          valid={isEmailValid}
        />
        <Input
          ref={passwordInputRef}
          label="Senha"
          value={registerPassword}
          onChangeText={onRegisterPasswordChange}
          onBlur={onRegisterPasswordBlur}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
          error={!!registerErrors.password}
          errorText={registerErrors.password}
          helperText={HELPER_TEXT.password}
          valid={isPasswordValid}
          helperContent={
            registerPassword.length > 0 ? (
              <PasswordRequirements value={registerPassword} />
            ) : null
          }
        />
        <Input
          ref={confirmPasswordInputRef}
          label="Confirmar Senha"
          value={confirmRegisterPassword}
          onChangeText={onConfirmRegisterPasswordChange}
          onBlur={onConfirmRegisterPasswordBlur}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onRegisterNext}
          error={!!registerErrors.confirmPassword}
          errorText={registerErrors.confirmPassword}
          helperText={HELPER_TEXT.confirmPassword}
          valid={isConfirmPasswordValid}
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
        label="Data de Nascimento"
        dateValue={birthDate}
        onDateChange={onBirthDateChange}
        error={!!registerErrors.birthDate}
        errorText={registerErrors.birthDate}
        helperText={HELPER_TEXT.birthDate}
        valid={isBirthDateValid}
      />
      <Checkbox
        checked={acceptedTerms}
        onChange={onAcceptedTermsChange}
        error={!!registerErrors.terms}
        errorText={registerErrors.terms}
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
