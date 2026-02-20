import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const ContentTabs = ({ tabs = [], activeTab, onTabPress }) => {
  const resolvedTabs = tabs.map((tab) =>
    typeof tab === "string" ? { label: tab, content: null } : tab
  );
  const active = resolvedTabs.find((tab) => tab.label === activeTab) || null;

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {resolvedTabs.map((tab) => (
          <View key={tab.label} style={styles.tabItem}>
            <Pressable
              onPress={() => onTabPress(tab.label)}
              style={({ pressed }) => [
                styles.tabPressable,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.label && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
            {activeTab === tab.label && (
              <LinearGradient
                colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeUnderline}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.contentContainer}>{active?.content}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: "flex-start",
  },
  tabPressable: {
    paddingBottom: 8,
  },
  tabPressed: {
    opacity: 0.8,
  },
  activeUnderline: {
    height: 2,
    width: "100%",
    borderRadius: 999,
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#CFCFCF",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    marginTop: 12,
    backgroundColor: "#2A2A2A",
    height: 350,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
