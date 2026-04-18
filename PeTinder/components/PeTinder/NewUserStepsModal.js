import React, { useState } from "react";
import { Alert, Text, StyleSheet, View, Pressable, ScrollView, Keyboard, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Modal from "../Modal";
import Button from "../Button";
import ImageInput from "../ImageInput";
import api from "../../api";
import { getAuthUserId } from "../../storage/authSession";
import Input from "../Input";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const stripNonDigits = (value) => String(value || "").replace(/\D/g, "");

const dataUrlToBase64 = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const marker = "base64,";
  const markerIndex = value.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return value.slice(markerIndex + marker.length);
};

const maskCpf = (value) => {
  const digits = stripNonDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const maskCep = (value) => {
  const digits = stripNonDigits(value).slice(0, 8);

  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const NewUserStepsModal = ({ visible, step, onNext, onBack, onFinish }) => {
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [profileImageBase64, setProfileImageBase64] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingOptionalData, setIsSubmittingOptionalData] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cidade, setCidade] = useState("");
  const [selectedUf, setSelectedUf] = useState("");
  const [showUfDropdown, setShowUfDropdown] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [lastCepLookup, setLastCepLookup] = useState("");
  const isStepOne = step === 1;
  const preventClose = () => { };
  const nome = "Usuário";

  const extractBase64FromAsset = async (pickedAsset) => {
    if (pickedAsset?.base64) {
      return pickedAsset.base64;
    }

    const fromDataUrl = dataUrlToBase64(pickedAsset?.uri);

    if (fromDataUrl) {
      return fromDataUrl;
    }

    if (Platform.OS !== "web" || !pickedAsset?.uri) {
      return null;
    }

    try {
      const response = await fetch(pickedAsset.uri);
      const blob = await response.blob();

      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          const result = typeof reader.result === "string" ? reader.result : "";
          resolve(dataUrlToBase64(result));
        };

        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });

      return base64;
    } catch {
      return null;
    }
  };

  const handleCameraPick = async () => {
    if (Platform.OS === "web") {
      await handleGalleryPick();
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const pickedAsset = result.assets[0];

    if (!pickedAsset?.uri) {
      return;
    }

    const base64 = await extractBase64FromAsset(pickedAsset);

    setProfileImageUri(pickedAsset.uri);
    setProfileImageBase64(base64);
  };

  const handleGalleryPick = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const pickedAsset = result.assets[0];

    if (!pickedAsset?.uri) {
      return;
    }

    const base64 = await extractBase64FromAsset(pickedAsset);

    setProfileImageUri(pickedAsset.uri);
    setProfileImageBase64(base64);
  };

  const handleImageInputPress = () => {
    if (Platform.OS === "web") {
      handleGalleryPick();
      return;
    }

    Alert.alert("Foto de perfil", "Escolha uma opção", [
      {
        text: "Tirar foto",
        onPress: handleCameraPick,
      },
      {
        text: "Escolher da galeria",
        onPress: handleGalleryPick,
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  };

  const handleUfDropdownPress = () => {
    Keyboard.dismiss();
    setShowUfDropdown((prev) => !prev);
  };

  const fetchAddressByCep = async (cepDigits) => {
    if (cepDigits.length !== 8 || cepDigits === lastCepLookup) {
      return;
    }

    try {
      setIsFetchingCep(true);
      setLastCepLookup(cepDigits);

      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (data?.erro) {
        return;
      }

      setRua(data?.logradouro || "");
      setCidade(data?.localidade || "");

      if (data?.uf && UF_OPTIONS.includes(data.uf)) {
        setSelectedUf(data.uf);
      }
    } catch {
      // Falha no ViaCEP não deve bloquear o fluxo do usuário.
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleCpfChange = (text) => {
    setCpf(maskCpf(text));
  };

  const handleCepChange = (text) => {
    const maskedCep = maskCep(text);
    const cepDigits = stripNonDigits(maskedCep);

    setCep(maskedCep);

    if (cepDigits.length === 8) {
      fetchAddressByCep(cepDigits);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImageUri) {
      return;
    }

    if (!profileImageBase64) {
      throw new Error("Não foi possível converter a imagem para base64.");
    }

    const userId = await getAuthUserId();

    if (!userId) {
      throw new Error("Usuário não encontrado na sessão.");
    }

    await api.post(`/users/${userId}/imagem`, {
      imagemUsuario: profileImageBase64,
    });
  };

  const handleNextStep = async () => {
    if (isUploadingImage) {
      return;
    }

    if (!profileImageUri) {
      onNext?.();
      return;
    }

    try {
      setIsUploadingImage(true);
      await uploadProfileImage();
      onNext?.();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Não foi possível enviar a imagem agora.";

      Alert.alert("Erro ao enviar imagem", errorMsg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFinishStep = async () => {
    if (isSubmittingOptionalData) {
      return;
    }

    const userId = await getAuthUserId();

    if (!userId) {
      Alert.alert("Erro", "Usuário não encontrado na sessão.");
      return;
    }

    const parsedNumber = Number.parseInt(numero, 10);

    const payload = {
      cpf: stripNonDigits(cpf),
      cep: stripNonDigits(cep),
      rua: rua.trim(),
      numero: Number.isNaN(parsedNumber) ? null : parsedNumber,
      complemento: complemento.trim(),
      cidade: cidade.trim(),
      uf: selectedUf || null,
    };

    try {
      setIsSubmittingOptionalData(true);
      await api.put(`/users/${userId}/optional`, payload);
      await api.patch(`/users/${userId}/user-novo`);
      onFinish?.();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Não foi possível finalizar seu cadastro agora.";
      Alert.alert("Erro ao finalizar", errorMsg);
    } finally {
      setIsSubmittingOptionalData(false);
    }
  };

  const handleSkipStepTwo = async () => {
    if (isSubmittingOptionalData) {
      return;
    }

    const userId = await getAuthUserId();

    if (!userId) {
      Alert.alert("Erro", "Usuário não encontrado na sessão.");
      return;
    }

    try {
      setIsSubmittingOptionalData(true);
      await api.patch(`/users/${userId}/user-novo`);
      onFinish?.();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Não foi possível finalizar agora.";
      Alert.alert("Erro", errorMsg);
    } finally {
      setIsSubmittingOptionalData(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={preventClose}
      title={"Complete seu perfil"}
      showBackButton={!isStepOne}
      onBack={onBack}
      modalContainerStyle={!isStepOne ? styles.stepTwoModalContainer : undefined}
    >
      {isStepOne ? (
        <>
          <Text style={styles.text}>
            Olá! {nome}, escolha a sua foto de perfil
          </Text>
          <View style={styles.userImageContainer}>
            <ImageInput
              value={profileImageUri}
              onPress={handleImageInputPress}
              size={180}
            />
          </View>
          <View style={styles.buttonsContainer}>
            <Button
              variant="primary"
              onPress={handleNextStep}
              isLoading={isUploadingImage}
              disabled={isUploadingImage}
            >
              Próximo
            </Button>
            <Button
              variant="forgotPassword"
              onPress={onNext}
              style={styles.button}
              disabled={isUploadingImage}
            >
              Fazer depois
            </Button>
          </View>
        </>
      ) : (
        <>
          <View style={styles.formContainer}>
            <Input
              label="CPF"
              value={cpf}
              onChangeText={handleCpfChange}
              keyboardType="numeric"
              maxLength={14}
            />

            <Input
              label="CEP"
              value={cep}
              onChangeText={handleCepChange}
              keyboardType="numeric"
              maxLength={9}
            />

            <Input label="Rua" value={rua} onChangeText={setRua} />

            <View style={styles.addressRow}>
              <View style={styles.addressCol}>
                <Input
                  label="Complemento"
                  value={complemento}
                  onChangeText={setComplemento}
                />
              </View>
              <View style={styles.addressCol}>
                <Input
                  label="Número"
                  value={numero}
                  onChangeText={setNumero}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.addressRow}>
              <View style={styles.addressCol}>
                <Input label="Cidade" value={cidade} onChangeText={setCidade} />
              </View>
              <View style={styles.addressCol}>
                <View style={styles.ufFieldContainer}>
                  <Pressable
                    onPress={handleUfDropdownPress}
                    style={({ pressed }) => [
                      styles.ufSelector,
                      pressed && styles.ufSelectorPressed,
                      isFetchingCep && styles.ufSelectorDisabled,
                    ]}
                    disabled={isFetchingCep}
                  >
                    <Text style={styles.ufSelectorText}>
                      {selectedUf || "UF"}
                    </Text>
                    <Text style={styles.ufChevron}>{showUfDropdown ? "▲" : "▼"}</Text>
                  </Pressable>
                  {showUfDropdown && (
                    <View style={styles.ufDropdown}>
                      <ScrollView
                        style={styles.ufDropdownScroll}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                      >
                        {UF_OPTIONS.map((uf) => (
                          <Pressable
                            key={uf}
                            onPress={() => {
                              setSelectedUf(uf);
                              setShowUfDropdown(false);
                            }}
                            style={({ pressed }) => [
                              styles.ufOption,
                              selectedUf === uf && styles.ufOptionSelected,
                              pressed && styles.ufOptionPressed,
                            ]}
                          >
                            <Text style={styles.ufOptionText}>{uf}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
          <View style={styles.buttonsContainer}>
            <Button
              variant="primary"
              onPress={handleFinishStep}
              isLoading={isSubmittingOptionalData}
              disabled={isSubmittingOptionalData}
            >
              Finalizar
            </Button>
            <Button
              variant="forgotPassword"
              onPress={handleSkipStepTwo}
              style={styles.button}
              disabled={isSubmittingOptionalData}
            >
              Fazer depois
            </Button>
          </View>
        </>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
  },

  userImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  buttonsContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
  },

  button: {
    marginTop: 4,
  },

  formContainer: {
    width: "100%",
    marginBottom: 16,
  },
  stepTwoModalContainer: {
    maxHeight: "91%",
  },

  addressRow: {
    flexDirection: "row",
    gap: 12,
  },
  addressCol: {
    flex: 1,
  },
  ufFieldContainer: {
    paddingTop: 18,
    marginBottom: 20,
    position: "relative",
    zIndex: 20,
    elevation: 20,
  },
  ufLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  ufSelector: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFC0D9",
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ufSelectorPressed: {
    opacity: 0.85,
  },
  ufSelectorDisabled: {
    opacity: 0.65,
  },
  ufSelectorText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#FFFFFF",
  },
  ufChevron: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  ufDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#242424",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    marginTop: 8,
    maxHeight: 180,
    overflow: "hidden",
    zIndex: 999,
    elevation: 999,
  },
  ufDropdownScroll: {
    width: "100%",
  },
  ufOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ufOptionSelected: {
    backgroundColor: "#E8A0BF33",
  },
  ufOptionPressed: {
    opacity: 0.8,
  },
  ufOptionText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#FFFFFF",
  },
});

export default NewUserStepsModal;
