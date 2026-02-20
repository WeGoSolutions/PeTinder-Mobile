import React from "react";
import { View, StyleSheet, Pressable, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const UserInfo = ({ nome, userImageURL }) => {
  return (
    <View style={styles.container}>
      <Image
        source={
          userImageURL
            ? { uri: userImageURL }
            : require("../../assets/generic-user-icon.png")
        }
        style={{ width: 150, height: 150, borderRadius: 100 }}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>Olá, {nome}</Text>
        <Pressable
          onPress={() => console.log("Edit Profile")}
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
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

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
