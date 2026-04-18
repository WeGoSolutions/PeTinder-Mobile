import React, { useRef } from "react";
import { Text, StyleSheet } from "react-native";
import Input from "../Input";
import Button from "../Button";

const LoginForm = ({
  errorMessage,
  email,
  password,
  errors,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onForgotPassword,
}) => {
  const passwordInputRef = useRef(null);

  return (
    <>
      {errorMessage ? <Text style={styles.errorLabel}>{errorMessage}</Text> : null}
      <Input
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        error={errors.email}
      />
      <Input
        ref={passwordInputRef}
        label="Senha"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onLogin}
        error={errors.password}
      />
      <Button
        variant="primary"
        onPress={onLogin}
        disabled={isLoading}
        isLoading={isLoading}
      >
        Entrar
      </Button>
      <Button variant="forgotPassword" onPress={onForgotPassword}>
        Esqueceu a senha?
      </Button>
    </>
  );
};

const styles = StyleSheet.create({
  errorLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FF6B6B",
    marginBottom: 20,
    textAlign: "center",
  },
});

export default LoginForm;
