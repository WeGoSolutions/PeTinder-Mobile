import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { CustomHeader } from "../components/CustomHeader";
import { UserInfo } from "../components/config/UserInfo";
import { ContentTabs } from "../components/config/ContentTabs";
import { ContaTab } from "../components/config/ContaTab";
import Modal from "../components/Modal";
import api from "../api";
import { getAuthUserId } from "../storage/authSession";
import { EditProfileTab } from "../components/config/EditProfileTab";

// const userId = getAuthUserId();



const formatCPF = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCEP = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
};

const formatDateForView = (isoDate) => {
  if (!isoDate) return "";

  const value = String(isoDate);
  if (value.includes("-")) {
    const [year, month, day] = value.split("-");
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  }

  return value;
};

const normalizeImageUri = (imageValue) => {
  if (!imageValue) return null;

  if (
    imageValue.startsWith("http://") ||
    imageValue.startsWith("https://") ||
    imageValue.startsWith("data:image")
  ) {
    return imageValue;
  }

  return `data:image/jpeg;base64,${imageValue}`;
};

const ConfigScreen = ({ navigation }) => {
  const route = useRoute();
  const title = route.params?.title || "Configurações";
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userFetchError, setUserFetchError] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadUserProfile = async () => {
      try {
        setIsLoadingUser(true);
        setUserFetchError("");

        const id = await getAuthUserId(); // ✅ correto

        if (!id) {
          if (isMounted) {
            setUserFetchError("Usuário não encontrado na sessão.");
          }
          return;
        }

        if (isMounted) {
          setUserId(id); // ✅ salva corretamente
        }

        const response = await api.get(`/users/${id}`);

        if (isMounted) {
          setUserProfile(response.data || null);
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg =
            error?.response?.data?.message ||
            error?.message ||
            "Não foi possível carregar os dados da conta.";
          setUserFetchError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

     if (!isEditing) {
    loadUserProfile();
  }

    return () => {
      isMounted = false;
    };
  }, [isEditing]);

  // 🔥 dados crus (sem máscara)
  const personalDataRaw = useMemo(() => ({
    email: userProfile?.email || "",
    cpf: userProfile?.cpf || "",
    dataNasc: formatDateForView(userProfile?.dataNascimento),
  }), [userProfile]);

  const addressDataRaw = useMemo(() => ({
    cep: userProfile?.cep || "",
    rua: userProfile?.rua || "",
    numero: userProfile?.numero || "",
    complemento: userProfile?.complemento || "",
    cidade: userProfile?.cidade || "",
    uf: userProfile?.uf || "",
  }), [userProfile]);

  // ✅ dados formatados (APENAS PARA EXIBIÇÃO)
  const personalData = useMemo(() => ({
    ...personalDataRaw,
    cpf: formatCPF(personalDataRaw.cpf),
  }), [personalDataRaw]);

  const addressData = useMemo(() => ({
    ...addressDataRaw,
    cep: formatCEP(addressDataRaw.cep),
  }), [addressDataRaw]);

  const tabs = [
    {
      label: "Conta",
      content: isLoadingUser ? (
        <View>
          <Text style={styles.tabTitle}>Carregando dados da conta...</Text>
        </View>
      ) : userFetchError ? (
        <View>
          <Text style={styles.errorText}>{userFetchError}</Text>
        </View>
      ) : (
        <ContaTab personalData={personalData} addressData={addressData} />
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigation.navigate("Home");
  };

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  return (
    <View style={styles.root}>
      <CustomHeader onBack={() => navigation.goBack()} title={title} />

      {!isKeyboardVisible && (
        <UserInfo
          nome={userProfile?.nome || "Usuário"}
          userImageURL={normalizeImageUri(userProfile?.imagemUrl)}
          isEditing={isEditing}
          onEditProfilePress={() => setIsEditing(true)}
        />
      )}

      {!isEditing ? (
        <ContentTabs
          tabs={tabs}
          activeTab={activeTab.label}
          onTabPress={(label) =>
            setActiveTab(tabs.find((tab) => tab.label === label) || tabs[0])
          }
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.editingTabsContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          enabled={true}
        >
          <View style={styles.editingTabsRow}>
            <View style={styles.editingTabItem}>
              <Text style={styles.editingTabText}>
                Editando informações
              </Text>

              <LinearGradient
                colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 2,
                  width: "100%",
                  marginTop: 14,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>

          <View style={styles.editingContentContainer}>
            <EditProfileTab
              personalData={personalDataRaw}   // 👈 sem máscara aqui
              addressData={addressDataRaw}     // 👈 sem máscara aqui
              isEditing={isEditing}
              onCancel={() => setIsEditing(false)}
              onSave={async () => {
                setIsEditing(false);
                await loadUserProfile(); // 🔥 recarrega dados atualizados
                console.log("Salvar dados:", newPersonalData, newAddressData);
              }}
              userId={userId}
              nomeUser={userProfile?.nome || "Sem nome"}
              navigation={navigation}
            />
          </View>
        </KeyboardAvoidingView>
      )}

      {!isEditing && (
        <View style={styles.exitButtonContainer}>
          <Pressable
            onPress={() => setShowExitModal(true)}
            style={styles.exitButton}
          >
            <Text style={styles.exitButtonText}>Sair da conta</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Sair da Conta"
        showCloseButton
      >
        <Text style={styles.modalText}>
          Tem certeza que deseja sair da sua conta?
        </Text>

        <Pressable onPress={handleExitConfirm}>
          <LinearGradient
            colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalConfirm}
          >
            <Text style={styles.modalConfirmText}>Sim, sair</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => setShowExitModal(false)}>
          <View style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tabTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#FF6B6B",
  },
  exitButtonContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  exitButton: {
    backgroundColor: "rgba(255, 72, 72, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  exitButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FF3B3B",
  },
  editingTabsContainer: {
    width: "100%",
    flex: 1,
    flexDirection: "column",
  },
  editingTabsRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  editingTabItem: {
    alignItems: "flex-start",
    paddingBottom: 8,
  },
  editingTabText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  editingContentContainer: {
    marginTop: 12,
    backgroundColor: "#2A2A2A",
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#CFCFCF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalConfirm: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#1A1A1A",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  modalCancel: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3A3A3A",
  },
  modalCancelText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
});

export default ConfigScreen;