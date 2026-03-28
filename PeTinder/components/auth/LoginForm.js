import React from "react";
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
  return (
    <>
      {errorMessage ? <Text style={styles.errorLabel}>{errorMessage}</Text> : null}
      <Input
        label="Email"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      <Input
        label="Senha"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry
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
