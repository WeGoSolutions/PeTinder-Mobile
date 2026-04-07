import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
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

const formatCPF = (value) => {
  const digits = String(value).replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCEP = (value) => {
  const digits = String(value).replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
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

  return Object.entries(data).map(([key, value]) => {
    if (key === "dataNasc") {
      return (
        <View key={key} style={styles.fieldRow}>
          <Input
            label={labelMap.dataNasc}
            variant="date"
            dateValue={parseDateValue(value)}
            onDateChange={(date) => onChange(key, date)}
            readOnly={isEditing && readOnlyFields.includes(key)}
          />
        </View>
      );
    }

    if (key === "cpf") {
      return (
        <View key={key} style={styles.fieldRow}>
          <Input
            label={labelMap.cpf}
            value={formatCPF(value)}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 11);
              onChange(key, digits);
            }}
            keyboardType="numeric"
            readOnly={isEditing && readOnlyFields.includes(key)}
          />
        </View>
      );
    }

    return (
      <View key={key} style={styles.fieldRow}>
        <Input
          label={labelMap[key] || key}
          value={String(value)}
          onChangeText={(text) => onChange(key, text)}
          readOnly={isEditing && readOnlyFields.includes(key)}
        />
      </View>
    );
  });
};

const AddressFields = ({ data, onChange, readOnlyFields = [], isEditing = false }) => {
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const lastCepLookup = useRef("");

  const fetchAddressByCep = async (cepDigits) => {
    if (cepDigits.length !== 8 || cepDigits === lastCepLookup.current) {
      return;
    }

    try {
      setIsFetchingCep(true);
      lastCepLookup.current = cepDigits;

      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const result = await response.json();

      if (result?.erro) {
        return;
      }

      if (result?.logradouro) onChange("rua", result.logradouro);
      if (result?.localidade) onChange("cidade", result.localidade);
      if (result?.uf) onChange("uf", result.uf);
      if (result?.bairro) onChange("bairro", result.bairro);
    } catch {
      // Falha no ViaCEP não deve bloquear o fluxo do usuário.
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleCepChange = (text) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    onChange("cep", digits);

    if (digits.length === 8) {
      fetchAddressByCep(digits);
    }
  };

  if (!data || Object.keys(data).length === 0) {
    return <Text style={styles.placeholder}>Sem informações</Text>;
  }

  return (
    <View style={styles.addressContainer}>
      <View style={styles.fieldRow}>
        <View style={styles.cepRow}>
          <View style={styles.cepInput}>
            <Input
              label={labelMap.cep}
              value={formatCEP(data.cep || "")}
              onChangeText={handleCepChange}
              keyboardType="numeric"
              readOnly={isEditing && readOnlyFields.includes("cep")}
            />
          </View>
          {isFetchingCep && (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={styles.cepSpinner}
            />
          )}
        </View>
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
        <AddressFields
          data={editedAddressData}
          onChange={handleAddressChange}
          readOnlyFields={readOnlyFields}
          isEditing={isEditing}
        />
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
  cepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cepInput: {
    flex: 1,
  },
  cepSpinner: {
    marginTop: 6,
  },
  placeholder: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});