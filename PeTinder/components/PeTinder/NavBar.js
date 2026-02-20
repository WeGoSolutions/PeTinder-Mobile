import React from "react";
import { View, StyleSheet, Pressable, Text, Image } from "react-native";
import { LogoWithText } from "../Logo";

export const NavBar = ({ navigation }) => {
  const toConfig = () => {
    navigation.navigate("Config", { title: "Configurações" });
  };

  const toChat = () => {
    navigation.navigate("Chat", { title: "Chat" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <LogoWithText fontSize={20} iconSize={30} style={styles.logo} />
      </View>
      <View style={styles.buttonsContainer}>
        <Pressable onPress={() => console.log("Profile")}>
          <Image
            source={require("../../assets/profile-icon.png")}
            style={styles.image}
          />
        </Pressable>
        <Pressable onPress={toChat}>
          <Image
            source={require("../../assets/chat-icon.png")}
            style={styles.image}
          />
        </Pressable>
        <Pressable onPress={toConfig}>
          <Image
            source={require("../../assets/config-icon.png")}
            style={styles.image}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 114,
    width: "100%",
    backgroundColor: "#FFFFFF",
    // position: "absolute",
    top: 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    marginLeft: 20,
    top: 30,
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 15,
    top: 30,
    justifyContent: "flex-end",
    alignItems: "center",
    marginRight: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  image: {
    width: 30,
    height: 30,
  },
});
