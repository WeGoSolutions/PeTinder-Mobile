import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
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

const renderPersonalFields = (data, onChange, readOnlyFields = [], isEditing = false) => {
  if (!data || Object.keys(data).length === 0) {
    return <Text style={styles.placeholder}>Sem informações</Text>;
  }

  return Object.entries(data).map(([key, value]) => (
    <View key={key} style={styles.fieldRow}>
      {key === "dataNasc" ? (
        <Input
          label={labelMap.dataNasc}
          variant="date"
          dateValue={parseDateValue(value)}
          onDateChange={(date) => onChange(key, date)}
          readOnly={isEditing && readOnlyFields.includes(key)}
        />
      ) : (
        <Input
          label={labelMap[key] || key}
          value={String(value)}
          onChangeText={(text) => onChange(key, text)}
          readOnly={isEditing && readOnlyFields.includes(key)}
        />
      )}
    </View>
  ));
};

const renderAddressFields = (data, onChange, readOnlyFields = [], isEditing = false) => {
  if (!data || Object.keys(data).length === 0) {
    return <Text style={styles.placeholder}>Sem informações</Text>;
  }

  return (
    <View style={styles.addressContainer}>
      <View style={styles.fieldRow}>
        <Input
          label={labelMap.cep}
          value={String(data.cep || "")}
          onChangeText={(text) => onChange("cep", text)}
          readOnly={isEditing && readOnlyFields.includes("cep")}
        />
      </View>

      <View style={styles.addressRow}>
        <View style={styles.addressCol}>
          <Input
            label={labelMap.rua}
            value={String(data.rua || "")}
            onChangeText={(text) => onChange("rua", text)}
            readOnly={isEditing && readOnlyFields.includes("rua")}
          />
        </View>
        <View style={styles.addressCol}>
          <Input
            label={labelMap.numero}
            value={String(data.numero || "")}
            onChangeText={(text) => onChange("numero", text)}
            readOnly={isEditing && readOnlyFields.includes("numero")}
          />
        </View>
      </View>

      <View style={styles.fieldRow}>
        <Input
          label={labelMap.complemento}
          value={String(data.complemento || "")}
          onChangeText={(text) => onChange("complemento", text)}
          readOnly={isEditing && readOnlyFields.includes("complemento")}
        />
      </View>

      <View style={styles.addressRow}>
        <View style={styles.addressCol}>
          <Input
            label={labelMap.cidade}
            value={String(data.cidade || "")}
            onChangeText={(text) => onChange("cidade", text)}
            readOnly={isEditing && readOnlyFields.includes("cidade")}
          />
        </View>
        <View style={styles.addressCol}>
          <Input
            label={labelMap.uf}
            value={String(data.uf || "")}
            onChangeText={(text) => onChange("uf", text)}
            readOnly={isEditing && readOnlyFields.includes("uf")}
          />
        </View>
      </View>
    </View>
  );
};

export const EditProfileTab = ({ personalData, addressData, onSave, readOnlyFields = [], isEditing = false }) => {
  const [editedPersonalData, setEditedPersonalData] = useState(personalData || {});
  const [editedAddressData, setEditedAddressData] = useState(addressData || {});

  useEffect(() => {
    setEditedPersonalData(personalData || {});
  }, [personalData]);

  useEffect(() => {
    setEditedAddressData(addressData || {});
  }, [addressData]);

  const handlePersonalChange = (key, value) => {
    setEditedPersonalData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddressChange = (key, value) => {
    setEditedAddressData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados pessoais</Text>
        {renderPersonalFields(editedPersonalData, handlePersonalChange, readOnlyFields, isEditing)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>
        {renderAddressFields(editedAddressData, handleAddressChange, readOnlyFields, isEditing)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    marginBottom: 15,
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
  placeholder: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});