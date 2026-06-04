import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getPasswordRequirements } from "../../utils/validation";

// Checklist dinâmico dos requisitos da senha. Cada item se "completa" (vira um
// check verde) na medida em que o usuário digita. Mantém o mesmo tamanho/fonte
// dos textos de ajuda existentes para não alterar o visual da tela.
const PasswordRequirements = ({ value }) => {
  const requirements = getPasswordRequirements(value);

  return (
    <View style={styles.container}>
      {requirements.map((requirement) => (
        <View key={requirement.key} style={styles.row}>
          <MaterialIcons
            name={requirement.met ? "check-circle" : "radio-button-unchecked"}
            size={14}
            color={requirement.met ? "#7BD88F" : "#888888"}
            style={styles.icon}
          />
          <Text
            style={[styles.label, requirement.met && styles.labelMet]}
          >
            {requirement.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#AAAAAA",
    flexShrink: 1,
  },
  labelMet: {
    color: "#7BD88F",
  },
});

export default PasswordRequirements;
