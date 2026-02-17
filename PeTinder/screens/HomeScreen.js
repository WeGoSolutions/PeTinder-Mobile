import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ActionSheet from "../components/ActionSheet";
import { LogoWithText } from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import PeTinderScreen from "./PeTinderScreen";

const HomeScreen = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPasswordSteps, setResetPasswordSteps] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [errorMessage, setErrorMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const openMissPasswordReset = () => {
    // Lógica para abrir a tela de recuperação de senha
    console.log("Abrir tela de recuperação de senha");
    setShowForgotPassword(true);
    setResetPasswordSteps(1);
    setEmail("");
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

    // Simula um request de 3 segundos
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
    }, 3000);
  };

  const handleTransition = (toLogin) => {
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

    setTimeout(() => setShowLogin(toLogin), 150);
  };

  // Renderiza o PeTinder quando logado
  if (isLoggedIn) {
    return <PeTinderScreen />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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


        {/* ActionSheet sempre renderizada no fundo */}
        <ActionSheet
          isModal={false}
          title={showLogin ? "Entrar" : "Bem vindo ao PeTinder"}
          showBackButton={showLogin}
          onBack={() => handleTransition(false)}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {!showLogin ? (
              <>
                <Button variant="primary">Criar Conta</Button>

                <Text style={styles.divider}>ou</Text>

                <Button
                  variant="secondary"
                  onPress={() => handleTransition(true)}
                >
                  Entrar
                </Button>
              </>
            ) : (
              <>
                {errorMessage && (
                  <Text style={styles.errorLabel}>{errorMessage}</Text>
                )}

                <Input
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: false });
                    setErrorMessage("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />

                <Input
                  label="Senha"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors({ ...errors, password: false });
                    setErrorMessage("");
                  }}
                  secureTextEntry
                  error={errors.password}
                />

                <Button
                  variant="primary"
                  onPress={handleLogin}
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  Entrar
                </Button>

                <Button
                  variant="forgotPassword"
                  onPress={openMissPasswordReset}
                >
                  Esqueceu a senha?
                </Button>
              </>
            )}
          </Animated.View>
        </ActionSheet>

        {/* Modal flutuante, só ele sobe com o teclado */}
        {showForgotPassword && (
          <ActionSheet
            isModal={true}
            onClose={() => setShowForgotPassword(false)}
            title={"Esqueci minha senha"}
            showCloseButton={true}
          >
            <Text style={styles.forgotPasswordText}>
              Informe seu e-mail para enviarmos o código de redefinição de
              senha.
            </Text>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              variant="primary"
              onPress={() => console.log("Enviar email de recuperação")}
            >
              Enviar Código
            </Button>
          </ActionSheet>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
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
  errorLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FF6B6B",
    marginBottom: 20,
    textAlign: "center",
  },

  forgotPasswordText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    marginBottom: 10,
  },
});

export default HomeScreen;
