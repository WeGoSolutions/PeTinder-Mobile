import React, { useState, useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import emailjs from "@emailjs/react-native";

import Modal from "../Modal";
import Input from "../Input";
import Button from "../Button";
import CodeInput from "../CodeInput";
import Toast from "../Toast";

import api from "../../api";

const serviceID = "service_p8ca819";
const templateID = "template_ca2wbbt";
const publicKey = "ZFhuj9hPgAyFDUkpy";

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
  onPasswordChange,

  onGoToCodeStep,
  onValidateCode,
}) => {
  const [emailError, setEmailError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const [generatedCode, setGeneratedCode] = useState("");
  const [isValid, setIsValid] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  function gerarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function validateEmail() {
    if (!email?.trim()) {
      setEmailError("O e-mail é obrigatório.");
      return false;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email)) {
      setEmailError("Digite um e-mail válido.");
      return false;
    }

    setEmailError("");
    return true;
  }

  function validatePasswords() {
    if (!password?.trim()) {
      setPasswordError("Informe a nova senha.");
      return false;
    }

    if (!confirmPassword?.trim()) {
      setPasswordError("Confirme a nova senha.");
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return false;
    }

    setPasswordError("");
    return true;
  }

  async function validarEmailNoBackend(emailUsuario) {
    try {
      const response = await api.get(
        `/users/${encodeURIComponent(emailUsuario)}/validar-email`
      );

      return !!response.data;
    } catch (error) {
      return false;
    }
  }

  async function changePassword(novaSenha, emailUsuario) {
    try {
      await api.patch(`/users/${emailUsuario}/senha`, {
        senhaAtual: "",
        novaSenha: novaSenha,
      });

      return {
        success: true,
        message: "Senha atualizada com sucesso!",
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao atualizar a senha.",
      };
    }
  }

  async function handleSendCode() {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);

    if (!validateEmail()) {
      setIsButtonDisabled(false);
      return;
    }

    try {
      setIsSendingCode(true);

      const emailExiste = await validarEmailNoBackend(email);

      if (!emailExiste) {
        setEmailError("Este e-mail não está cadastrado.");
        setIsButtonDisabled(false);
        return;
      }

      const codigo = gerarCodigo();

      const templateParams = {
        to_email: email,
        digito1: codigo[0],
        digito2: codigo[1],
        digito3: codigo[2],
        digito4: codigo[3],
        digito5: codigo[4],
        digito6: codigo[5],
        codigo: codigo,
      };

      setGeneratedCode(codigo);
      setIsValid(true);

      setTimeout(() => {
        setIsValid(false);
      }, 2 * 60 * 1000);

      await emailjs.send(serviceID, templateID, templateParams, {
        publicKey: publicKey,
      });

      onGoToCodeStep?.(codigo);
    } catch (error) {
      setToast({
        visible: true,
        type: "error",
        message: error?.message || "Não foi possível enviar o código.",
      });

      setIsButtonDisabled(false);
    } finally {
      setIsSendingCode(false);
    }
  }

  function handleValidateCode() {
    onValidateCode?.(code, generatedCode, isValid);
  }

  async function handleResetPassword() {
    if (!validatePasswords()) return;

    const response = await changePassword(password, email);

    if (response.success) {
      setToast({
        visible: true,
        type: "success",
        message: response.message,
      });

      setTimeout(() => {
        onClose?.();
      }, 2000);
    } else {
      setToast({
        visible: true,
        type: "error",
        message: response.message,
      });
    }
  }

  useEffect(() => {
    if (visible) {
      setEmailError("");
      setPasswordError("");
      setConfirmPassword("");
      setGeneratedCode("");
      setIsValid(false);
      setIsButtonDisabled(false);
      setIsSendingCode(false);
    }
  }, [visible]);

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title="Esqueci minha senha"
        showCloseButton={step === 1}
        showBackButton={step === 2 || step === 3}
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
              onChangeText={(text) => {
                onEmailChange(text);
                setEmailError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {!!emailError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}

            <Button
              variant="primary"
              onPress={handleSendCode}
              isLoading={isSendingCode}
              disabled={isButtonDisabled}
            >
              Enviar Código
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <Text style={styles.inserirCodigoText}>
              Insira o código enviado para seu e-mail.
            </Text>

            <CodeInput value={code} onChangeCode={onCodeChange} />

            <Button
              variant="primary"
              onPress={handleValidateCode}
              isLoading={isCodeLoading}
              style={{ marginTop: 16 }}
            >
              Enviar
            </Button>
          </>
        ) : (
          <>
            <Text style={styles.newPasswordText}>
              Crie uma nova senha para sua conta.
            </Text>

            <Input
              label="Nova Senha"
              value={password}
              onChangeText={(text) => {
                onPasswordChange(text);
                setPasswordError("");
              }}
              secureTextEntry
            />

            <Input
              label="Confirmar Senha"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setPasswordError("");
              }}
              secureTextEntry
            />

            {!!passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <Button
              variant="primary"
              onPress={handleResetPassword}
              isLoading={isResetLoading}
              disabled={isResetLoading}
            >
              Alterar Senha
            </Button>
          </>
        )}
      </Modal>

      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
      />
    </>
  );
};

const styles = StyleSheet.create({
  forgotPasswordText: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 10,
  },

  newPasswordText: {
    fontSize: 14,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },

  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    marginBottom: 10,
  },

  inserirCodigoText: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default ForgotPasswordModal;