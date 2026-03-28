import React from "react";
import { Text, StyleSheet } from "react-native";
import Modal from "../Modal";
import Input from "../Input";
import Button from "../Button";
import CodeInput from "../CodeInput";

const ForgotPasswordModal = ({
  visible,
  step,
  email,
  code,
  password,
  isCodeLoading,
  isResetLoading,
  onClose,
  onBack,
  onEmailChange,
  onCodeChange,
  onGoToCodeStep,
  onValidateCode,
  onPasswordChange,
  onResetPassword,
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={"Esqueci minha senha"}
      showCloseButton={step === 1}
      showBackButton={step === 2}
      onBack={onBack}
    >
      {step === 1 ? (
        <>
          <Text style={styles.forgotPasswordText}>
            Informe seu e-mail para enviarmos o código de redefinição de senha.
          </Text>
          <Input
            label="Email"
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button variant="primary" onPress={onGoToCodeStep}>
            Enviar Código
          </Button>
        </>
      ) : step === 2 ? (
        <>
          <CodeInput value={code} onChangeCode={onCodeChange} />
          <Button
            variant="primary"
            onPress={onValidateCode}
            isLoading={isCodeLoading}
            style={{ marginTop: 16 }}
          >
            Enviar
          </Button>
        </>
      ) : (
        <>
          <Text style={styles.newPasswordText}>Crie uma nova senha para sua conta.</Text>
          <Input
            label="Nova Senha"
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry
          />
          <Input
            label="Confirmar Senha"
            value={""}
            onChangeText={() => {}}
            secureTextEntry
          />
          <Button
            variant="primary"
            style={{ marginTop: 8, marginBottom: 0 }}
            onPress={onResetPassword}
            isLoading={isResetLoading}
            disabled={isResetLoading}
          >
            Alterar Senha
          </Button>
        </>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  newPasswordText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default ForgotPasswordModal;
