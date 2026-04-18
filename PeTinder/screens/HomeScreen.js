import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../api";
import ActionSheet from "../components/ActionSheet";
import Modal from "../components/Modal";
import { LogoWithText } from "../components/Logo";
import Button from "../components/Button";
import Toast from "../components/Toast";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import { saveAuthSession } from "../storage/authSession";

const HomeScreen = ({ navigation }) => {
  const USE_BACKEND =
    (process.env.EXPO_PUBLIC_USE_BACKEND || "true").toLowerCase() === "true";
  const REQUEST_TIMEOUT_MS = 10000;

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPasswordSteps, setResetPasswordSteps] = useState(0);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState("");
  const [registerStep, setRegisterStep] = useState(1);
  const [birthDate, setBirthDate] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showImportantModal, setShowImportantModal] = useState(false);
  const [isCreateAccountLoading, setIsCreateAccountLoading] = useState(false);
  const [canAcknowledgeImportant, setCanAcknowledgeImportant] = useState(false);
  const [registerErrors, setRegisterErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    terms: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });
  const acknowledgeTimerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (acknowledgeTimerRef.current) {
        clearTimeout(acknowledgeTimerRef.current);
      }
    };
  }, []);

  const openMissPasswordReset = () => {
    // Lógica para abrir a tela de recuperação de senha
    console.log("Abrir tela de recuperação de senha");
    setShowForgotPassword(true);
    setResetPasswordSteps(1);
  };

  const validateEmailCode = () => {
    setIsCodeLoading(true);
    setTimeout(() => {
      setIsCodeLoading(false);
      setCode("");
      setResetPasswordSteps(3);
    }, 3000);
  };

  const [isResetLoading, setIsResetLoading] = useState(false);
  const handleResetPassword = () => {
    setIsResetLoading(true);
    setTimeout(() => {
      setIsResetLoading(false);
      setShowForgotPassword(false);
      setResetPasswordSteps(0);
      setToast({
        visible: true,
        type: "error",
        message: "Não foi possivel alterar sua senha",
      });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2500);
    }, 3000);
  };

  const handleLogin = async () => {
    const newErrors = { email: false, password: false };
    let message = "";

    if (!email && !password) {
      newErrors.email = true;
      newErrors.password = true;
      message = "Email e senha são obrigatórios";
    } else if (!email) {
      newErrors.email = true;
      message = "Email é obrigatório";
    } else if (!password) {
      newErrors.password = true;
      message = "Senha é obrigatória";
    }

    setErrors(newErrors);
    setErrorMessage(message);

    if (!email || !password) {
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setErrorMessage("");

    if (!USE_BACKEND) {
      setTimeout(() => {
        saveAuthSession({
          id: "mock-user-id",
          token: "mock-token",
          email,
          nome: "Usuario Mock",
          userNovo: false,
        }).catch((err) => {
          console.error("Erro ao salvar sessao mock:", err);
        });
        setIsLoading(false);
        setEmail("");
        setPassword("");
        setErrors({ email: false, password: false });
        navigation.replace("PeTinder", { userNovo: false });
      }, 400);
      return;
    }

    api
      .post("/users/login", {
        email,
        senha: password,
      }, {
        timeout: REQUEST_TIMEOUT_MS,
      })
      .then((response) => {
        console.log("Login sucesso:", response.data);
        const isNewUser = Boolean(response?.data?.userNovo);
        saveAuthSession({
          id: response?.data?.id,
          token: response?.data?.token,
          nome: response?.data?.nome,
          userNovo: isNewUser,
        }).catch((err) => {
          console.error("Erro ao salvar sessao:", err);
        });
        setIsLoading(false);
        setEmail("");
        setPassword("");
        setErrors({ email: false, password: false });
        navigation.replace("PeTinder", { userNovo: isNewUser });
      })
      .catch((error) => {
        console.error("Erro no login:", error.response?.data || error.message);
        setIsLoading(false);
        const errorMsg =
          error.code === "ECONNABORTED"
            ? "Tempo de resposta esgotado. Verifique o backend e tente novamente."
            : error.response?.data?.message ||
            "Erro ao fazer login. Verifique sua conexão e tente novamente.";
        setErrorMessage(errorMsg);
      });
  };

  const handleBackStepResetPassword = () => {
    setResetPasswordSteps((prev) => Math.max(prev - 1, 0));
    setCode("");
  };

  const handleTransition = (toMode) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setShowLogin(toMode === "login");
      setShowRegister(toMode === "register");
      if (toMode !== "register") {
        setRegisterStep(1);
      }
    }, 150);
  };

  const handleBackFromAuth = () => {
    if (showRegister && registerStep === 2) {
      setRegisterStep(1);
      return;
    }

    if (isKeyboardVisible) {
      Keyboard.dismiss();
      setTimeout(() => {
        handleTransition("welcome");
      }, 120);
      return;
    }

    handleTransition("welcome");
  };

  const handleRegisterNext = () => {
    const nextErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
      terms: "",
    };

    const trimmedName = fullName.trim();
    const trimmedEmail = registerEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedName) {
      nextErrors.fullName = "Digite o nome completo";
    }

    if (!trimmedEmail || !isValidEmail) {
      nextErrors.email = "Email inválido";
    }

    if (!registerPassword || registerPassword.length < 8) {
      nextErrors.password = "A senha deve ter no mínimo 8 caracteres";
    }

    if (!confirmRegisterPassword || confirmRegisterPassword !== registerPassword) {
      nextErrors.confirmPassword = "As senhas não coincidem";
    }

    setRegisterErrors(nextErrors);

    if (
      nextErrors.fullName ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      return;
    }

    setRegisterStep(2);
  };

  const handleCreateAccount = () => {
    const nextErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
      terms: "",
    };

    if (!birthDate) {
      nextErrors.birthDate = "Selecione a data de nascimento";
    } else if (!isBirthDateInPast(birthDate)) {
      nextErrors.birthDate = "A data de nascimento deve ser no passado";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Você precisa aceitar os Termos de condição.";
    }

    setRegisterErrors((prev) => ({ ...prev, ...nextErrors }));

    if (nextErrors.birthDate || nextErrors.terms) {
      return;
    }

    if (acknowledgeTimerRef.current) {
      clearTimeout(acknowledgeTimerRef.current);
    }

    setCanAcknowledgeImportant(false);
    setIsCreateAccountLoading(true);
    setShowImportantModal(true);

    acknowledgeTimerRef.current = setTimeout(() => {
      setCanAcknowledgeImportant(true);
    }, 5000);
  };

  const formatBirthDateForApi = (dateValue) => {
    if (!dateValue) {
      return null;
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const isBirthDateInPast = (dateValue) => {
    if (!dateValue) {
      return false;
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    return parsedDate < today;
  };

  const handleAcknowledgeImportant = () => {
    if (!canAcknowledgeImportant) {
      return;
    }

    if (acknowledgeTimerRef.current) {
      clearTimeout(acknowledgeTimerRef.current);
      acknowledgeTimerRef.current = null;
    }


    setShowImportantModal(false);
    setCanAcknowledgeImportant(false);
    setIsCreateAccountLoading(false);

    const dataNascFormatted = formatBirthDateForApi(birthDate);

    const payload = {
      nome: fullName,
      email: registerEmail,
      senha: registerPassword,
      dataNascimento: dataNascFormatted,
      dataNasc: dataNascFormatted,
      cpf: null,
      cep: null,
      rua: null,
      numero: null,
      complemento: null,
      cidade: null,
      uf: null,
    };

    const finalizeRegisterSuccess = () => {
      setFullName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmRegisterPassword("");
      setBirthDate(null);
      setAcceptedTerms(false);
      setRegisterStep(1);
      handleTransition("login");
      setToast({
        visible: true,
        type: "success",
        message: "Conta criada",
      });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2500);
    };

    if (!USE_BACKEND) {
      finalizeRegisterSuccess();
      return;
    }
    api
      .post("/users", payload, {
        timeout: REQUEST_TIMEOUT_MS,
      })
      .then((response) => {
        console.log("Cadastro sucesso:", response.data);
        setEmail(registerEmail);
        setPassword("");
        finalizeRegisterSuccess();
      })
      .catch((error) => {
        console.error("Erro no cadastro:", error.response?.data || error.message);
        setToast({
          visible: true,
          type: "error",
          message:
            error.code === "ECONNABORTED"
              ? "Tempo de resposta esgotado. Verifique o backend e tente novamente."
              : error.response?.data?.message ||
              "Erro ao criar conta. Verifique sua conexão e tente novamente.",
        });
        setTimeout(() => {
          setToast((prev) => ({ ...prev, visible: false }));
        }, 2500);

        setShowImportantModal(false);
        setIsCreateAccountLoading(false);
        setCanAcknowledgeImportant(false);
      });
  };

  const renderAuthContent = () => {
    if (!showLogin && !showRegister) {
      return (
        <>
          <Button variant="primary" onPress={() => handleTransition("register")}>
            Criar Conta
          </Button>
          <Text style={styles.divider}>ou</Text>
          <Button variant="secondary" onPress={() => handleTransition("login")}>
            Entrar
          </Button>
        </>
      );
    }

    if (showLogin) {
      return (
        <LoginForm
          errorMessage={errorMessage}
          email={email}
          password={password}
          errors={errors}
          isLoading={isLoading}
          onEmailChange={(text) => {
            setEmail(text);
            setErrors({ ...errors, email: false });
            setErrorMessage("");
          }}
          onPasswordChange={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: false });
            setErrorMessage("");
          }}
          onLogin={handleLogin}
          onForgotPassword={openMissPasswordReset}
        />
      );
    }

    return (
      <RegisterForm
        registerStep={registerStep}
        registerErrors={registerErrors}
        fullName={fullName}
        registerEmail={registerEmail}
        registerPassword={registerPassword}
        confirmRegisterPassword={confirmRegisterPassword}
        birthDate={birthDate}
        acceptedTerms={acceptedTerms}
        isCreateAccountLoading={isCreateAccountLoading}
        onFullNameChange={(text) => {
          setFullName(text);
          if (registerErrors.fullName) {
            setRegisterErrors((prev) => ({ ...prev, fullName: "" }));
          }
        }}
        onRegisterEmailChange={(text) => {
          setRegisterEmail(text);
          if (registerErrors.email) {
            setRegisterErrors((prev) => ({ ...prev, email: "" }));
          }
        }}
        onRegisterPasswordChange={(text) => {
          setRegisterPassword(text);
          if (registerErrors.password || registerErrors.confirmPassword) {
            setRegisterErrors((prev) => ({
              ...prev,
              password: "",
              confirmPassword: "",
            }));
          }
        }}
        onConfirmRegisterPasswordChange={(text) => {
          setConfirmRegisterPassword(text);
          if (registerErrors.confirmPassword) {
            setRegisterErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }
        }}
        onBirthDateChange={(date) => {
          setBirthDate(date);
          if (registerErrors.birthDate) {
            setRegisterErrors((prev) => ({ ...prev, birthDate: "" }));
          }
        }}
        onAcceptedTermsChange={(value) => {
          setAcceptedTerms(value);
          if (registerErrors.terms) {
            setRegisterErrors((prev) => ({ ...prev, terms: "" }));
          }
        }}
        onRegisterNext={handleRegisterNext}
        onCreateAccount={handleCreateAccount}
      />
    );
  };

  const actionSheet = (
    <ActionSheet
      title={showRegister ? "Criar Conta" : showLogin ? "Entrar" : "Bem vindo ao PeTinder"}
      showBackButton={showLogin || showRegister}
      onBack={handleBackFromAuth}
    >
      <Animated.View style={{ opacity: fadeAnim }}>{renderAuthContent()}</Animated.View>
    </ActionSheet>
  );

  return (
    <View style={styles.root}>
      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
      />
      <View style={styles.container}>
        <LinearGradient
          colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LogoWithText />
            </View>
            <Text style={styles.subtitle}>
              Seu melhor amigo a um 'swipe' de distância!
            </Text>
          </View>
        </LinearGradient>

        <Image
          source={require("../assets/cachorro.png")}
          style={styles.dogImage}
          resizeMode="contain"
        />

        {/* ActionSheet sempre renderizada. Sobe com o teclado só se não houver modal */}
        {showForgotPassword ? (
          actionSheet
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "position"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
            style={{ width: "100%" }}
          >
            {actionSheet}
          </KeyboardAvoidingView>
        )}

        {/* Modal flutuante, só ele sobe com o teclado */}
        {showForgotPassword && (
          <ForgotPasswordModal
            visible={showForgotPassword}
            step={resetPasswordSteps}
            email={email}
            code={code}
            password={password}
            isCodeLoading={isCodeLoading}
            isResetLoading={isResetLoading}
            onClose={() => {
              setShowForgotPassword(false);
              setResetPasswordSteps(1);
            }}
            onBack={handleBackStepResetPassword}
            onEmailChange={setEmail}
            onCodeChange={setCode}
            onGoToCodeStep={() => setResetPasswordSteps(2)}
            onValidateCode={validateEmailCode}
            onPasswordChange={setPassword}
            onResetPassword={handleResetPassword}
          />
        )}

        {showImportantModal && (
          <Modal
            visible={showImportantModal}
            onClose={() => { }}
            title={"Importante"}
          >
            <Text style={styles.importantText}>
              O abandono, a negligência, a falta de alimentação, a soltura irresponsável e o tratamento inadequado de animais são formas de maus-tratos.
            </Text>
            <Text style={styles.importantText}>
              Essas práticas são sujeitas a penalidades, conforme:
            </Text>
            <Text style={styles.importantBullet}>
              • Artigo 32 da Lei Federal nº 9.605/1998 (Lei de Crimes Ambientais)
            </Text>
            <Text style={styles.importantBullet}>
              • Lei Municipal nº 13.131/2001 (Lei de Posse Responsável)
            </Text>
            <Text style={styles.importantTextLast}>
              Sempre que tiver dúvidas, procure orientação com profissionais qualificados e evite informações de fontes não especializadas.
            </Text>
            <Button
              variant="primary"
              onPress={handleAcknowledgeImportant}
              disabled={!canAcknowledgeImportant}
            >
              Estou Ciente
            </Button>
          </Modal>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    overflow: "visible",
    position: "relative",
  },
  gradient: {
    flex: 1,
    zIndex: 0,
    paddingTop: 50,
  },
  header: {
    marginTop: 50,
    paddingHorizontal: 20,
    zIndex: 1,
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  logoIcon: {
    width: 35,
    height: 35,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  dogImage: {
    position: "absolute",
    top: 200,
    left: -280,
    right: -30,
    width: "250%",
    height: "70%",
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    marginBottom: 30,
  },
  divider: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
  },
  importantText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    textAlign: "justify",
    marginBottom: 8,
    lineHeight: 22,
  },
  importantBullet: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    marginBottom: 6,
    lineHeight: 22,
  },
  importantTextLast: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    textAlign: "justify",
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 22,
  },
});

export default HomeScreen;
