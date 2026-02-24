import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const Checkbox = ({ checked, onChange, label, error }) => {
  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.row}
        onPress={() => onChange?.(!checked)}
        hitSlop={8}
      >
        <View style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}>
          {checked ? <MaterialIcons name="check" size={14} color="#1A1A1A" /> : null}
        </View>
        <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#E8A0BF",
    borderRadius: 5,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  boxChecked: {
    backgroundColor: "#E8A0BF",
  },
  boxError: {
    borderColor: "#FF6B6B",
  },
  label: {
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    flexShrink: 1,
  },
  labelError: {
    color: "#FF6B6B",
  },
});

export default Checkbox;
