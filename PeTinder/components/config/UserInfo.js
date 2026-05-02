import React from "react";
import { View, StyleSheet, Pressable, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UserInfo = ({
  nome,
  userImageURL,
  onEditProfilePress,
  isEditing,
  onReloadUser,
  onImageSelected,
  localImageUri,
  onSaveImagePress,
}) => {

  const handleImagePress = () => {
    Alert.alert("Foto de perfil", "Escolha uma opção", [
      { text: "Tirar foto", onPress: handleCameraPick },
      { text: "Escolher da galeria", onPress: handleGalleryPick },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleCameraPick = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
      base64: true,
    });

    if (!result.canceled && result.assets?.length) {
      onImageSelected?.(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const handleGalleryPick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
      base64: true,
    });

    if (!result.canceled && result.assets?.length) {
      onImageSelected?.(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const imageSource = localImageUri
    ? { uri: localImageUri }
    : userImageURL
    ? { uri: userImageURL }
    : require("../../assets/generic-user-icon.png");

  return (
    <View style={styles.container}>
      <Pressable onPress={isEditing ? handleImagePress : null} disabled={!isEditing}>
        <View style={styles.imageWrapper}>
          <Image
            source={imageSource}
            style={{ width: 150, height: 150, borderRadius: 100 }}
          />
          {isEditing && (
            <View style={styles.imageMask}>
              <Ionicons style={styles.imageMaskText} name="camera" size={30} color="#000" />
              <Text style={styles.imageMaskLabel}>Editar</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>Olá, {nome}</Text>

        {/* ✅ BOTÃO UNIFICADO */}
        <Pressable
          onPress={isEditing ? onSaveImagePress : onEditProfilePress}
          style={({ pressed }) => [
            styles.editButtonPressable,
            pressed && styles.editButtonPressed,
          ]}
        >
          <LinearGradient
            colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? "Salvar Foto" : "Editar Perfil"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

export { UserInfo };

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#323232",
    padding: 10,
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    height: 180,
    flexDirection: "row",
  },
  imageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 100,
    overflow: "hidden",
    position: "relative",
  },
  imageMask: {
    position: "absolute",
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageMaskText: {
    fontSize: 25,
  },
  imageMaskLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  name: {
    maxWidth: 200,
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },
  infoContainer: {
    marginLeft: 20,
    justifyContent: "center",
  },
  editButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
    width: 150,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonPressable: {
    borderRadius: 50,
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    color: "#1A1A1A",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
});