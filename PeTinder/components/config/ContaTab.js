import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Input from "../Input";

const labelMap = {
  nome: "Nome",
  email: "Email",
  cpf: "CPF",
  dataNasc: "Data de Nascimento",
  complemento: "Complemento",
  rua: "Rua",
  numero: "Numero",
  cidade: "Cidade",
  estado: "Estado",
  uf: "UF",
  cep: "CEP",
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parts = String(value).split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => Number(part));
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const renderPersonalFields = (data) => {
  if (!data || Object.keys(data).length === 0) {
    return <Text style={styles.placeholder}>Sem informacoes</Text>;
  }

  return Object.entries(data).map(([key, value]) => (
    <View key={key} style={styles.fieldRow}>
      {key === "dataNasc" ? (
        <Input
          label={labelMap.dataNasc}
          variant="date"
          dateValue={parseDateValue(value)}
          readOnly
        />
      ) : (
        <>
          <Text style={styles.fieldLabel}>{labelMap[key] || key}</Text>
          <Text style={styles.fieldValue}>{String(value)}</Text>
        </>
      )}
      {key !== "dataNasc" && <View style={styles.fieldDivider} />}
    </View>
  ));
};

const renderAddressFields = (data) => {
  if (!data || Object.keys(data).length === 0) {
    return <Text style={styles.placeholder}>Sem informacoes</Text>;
  }

  return (
    <View style={styles.addressContainer}>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{labelMap.cep}</Text>
        <Text style={styles.fieldValue}>{String(data.cep || "")}</Text>
        <View style={styles.fieldDivider} />
      </View>

      <View style={styles.addressRow}>
        <View style={styles.addressCol}>
          <Text style={styles.fieldLabel}>{labelMap.rua}</Text>
          <Text style={styles.fieldValue}>{String(data.rua || "")}</Text>
          <View style={styles.fieldDivider} />
        </View>
        <View style={styles.addressCol}>
          <Text style={styles.fieldLabel}>{labelMap.numero}</Text>
          <Text style={styles.fieldValue}>{String(data.numero || "")}</Text>
          <View style={styles.fieldDivider} />
        </View>
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{labelMap.complemento}</Text>
        <Text style={styles.fieldValue}>{String(data.complemento || "")}</Text>
        <View style={styles.fieldDivider} />
      </View>

      <View style={styles.addressRow}>
        <View style={styles.addressCol}>
          <Text style={styles.fieldLabel}>{labelMap.cidade}</Text>
          <Text style={styles.fieldValue}>{String(data.cidade || "")}</Text>
          <View style={styles.fieldDivider} />
        </View>
        <View style={styles.addressCol}>
          <Text style={styles.fieldLabel}>{labelMap.uf}</Text>
          <Text style={styles.fieldValue}>{String(data.uf || "")}</Text>
          <View style={styles.fieldDivider} />
        </View>
      </View>
    </View>
  );
};

export const ContaTab = ({ personalData, addressData }) => {
  const tabs = ["Informações Pessoais", "Endereço"];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <View key={tab} style={styles.tabItem}>
            <Pressable
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.tabPressable,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
            {activeTab === tab && (
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
      <View style={styles.contentContainer}>
        {activeTab === tabs[0]
          ? renderPersonalFields(personalData)
          : renderAddressFields(addressData)}
      </View>
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
    marginTop: 5,
    width: "100%",
    height: "85%",
    justifyContent: "center",
    gap: 15,
  },
  addressContainer: {
    gap: 12,
  },
  addressRow: {
    flexDirection: "row",
    gap: 20,
  },
  addressCol: {
    flex: 1,
  },
  fieldRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#CFCFCF",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  fieldDivider: {
    height: 1,
    backgroundColor: "#E8A0BF",
    marginTop: 8,
    opacity: 0.8,
  },
  placeholder: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});
