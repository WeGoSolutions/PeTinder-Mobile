ConfigScreen;

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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

const formatDateForView = (isoDate) => {
  if (!isoDate) {
    return "";
  }

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
  if (!imageValue) {
    return null;
  }

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

  useEffect(() => {
    let isMounted = true;

    const loadUserProfile = async () => {
      try {
        setIsLoadingUser(true);
        setUserFetchError("");

        const userId = await getAuthUserId();

        if (!userId) {
          if (isMounted) {
            setUserFetchError("Usuário não encontrado na sessão.");
          }
          return;
        }

        const response = await api.get(`/users/${userId}`);

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

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const personalData = {
    email: userProfile?.email || "",
    cpf: userProfile?.cpf || "",
    dataNasc: formatDateForView(userProfile?.dataNascimento),
  };

  const addressData = {
    cep: userProfile?.cep || "",
    rua: userProfile?.rua || "",
    numero: userProfile?.numero || "",
    complemento: userProfile?.complemento || "",
    cidade: userProfile?.cidade || "",
    uf: userProfile?.uf || "",
  };

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
    {
      label: "Configurações",
      content: (
        <View>
          <Text style={styles.tabTitle}>Configurações</Text>
        </View>
      ),
    },
    {
      label: "Ajuda",
      content: (
        <View>
          <Text style={styles.tabTitle}>Ajuda</Text>
        </View>
      ),
    },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigation.navigate("Home");
  };

  return (
    <View style={styles.root}>
      <CustomHeader onBack={() => navigation.goBack()} title={title} />
      <UserInfo
        nome={userProfile?.nome || "Usuário"}
        userImageURL={normalizeImageUri(userProfile?.imagemUrl)}
        isEditing={isEditing}
        onEditProfilePress={() => {
          setIsEditing(true);
        }}
      />
      {!isEditing ? (
        <ContentTabs
          tabs={tabs}
          activeTab={activeTab.label}
          onTabPress={(label) =>
            setActiveTab(tabs.find((tab) => tab.label === label) || tabs[0])
          }
        />
      ) : (
        <View style={styles.editingTabsContainer}>
          <View style={styles.editingTabsRow}>
            <View style={styles.editingTabItem}>
              <Text style={styles.editingTabText}>Editando informações</Text>
            </View>
          </View>
          <View style={styles.editingContentContainer}>
            <EditProfileTab
              personalData={personalData}
              addressData={addressData}
              onSave={(newPersonalData, newAddressData) => {
                console.log("Salvar dados:", newPersonalData, newAddressData);
                setIsEditing(false);
              }}
              isEditing={isEditing}
            />
          </View>
        </View>
      )}
      <View style={styles.exitButtonContainer}>
        {!isEditing ? (
          <Pressable
            onPress={() => setShowExitModal(true)}
            style={styles.exitButton}
          >
            <Text style={styles.exitButtonText}>Sair da conta</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => setIsEditing(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                console.log("Salvar dados");
                setIsEditing(false);
              }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </Pressable>
          </>
        )}
      </View>
      <Modal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Sair da Conta"
        showCloseButton
      >
        <Text style={styles.modalText}>
          Tem certeza que deseja sair da sua conta?
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.modalConfirmPressable,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleExitConfirm}
        >
          <LinearGradient
            colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalConfirm}
          >
            <Text style={styles.modalConfirmText}>Sim, sair</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          style={({ pressed }) => [pressed && styles.buttonPressed]}
          onPress={() => setShowExitModal(false)}
        >
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
  },
  text: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
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
  cancelButton: {
    backgroundColor: "rgba(255, 72, 72, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FF3B3B",
  },
  saveButton: {
    backgroundColor: "rgba(76, 175, 80, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#57d437",
  },
  modalText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#CFCFCF",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalConfirmPressable: {
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.85,
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
  editingTabsContainer: {
    width: "100%",
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
    height: 350,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export default ConfigScreen;
