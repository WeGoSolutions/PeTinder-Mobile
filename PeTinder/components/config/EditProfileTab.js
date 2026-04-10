import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
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
  uf: "UF",
  cep: "CEP",
};

const formatCPF = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCEP = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parts = String(value).split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const EditProfileTab = ({
  personalData,
  addressData,
  onSave,
  onCancel,
  readOnlyFields = [],
  isEditing = false,
}) => {
  const [editedPersonalData, setEditedPersonalData] = useState(personalData || {});
  const [editedAddressData, setEditedAddressData] = useState(addressData || {});
  const [errors, setErrors] = useState({});
  const lastCepLookup = useRef("");

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

  const fetchAddressByCep = async (cepDigits) => {
    if (cepDigits.length !== 8 || cepDigits === lastCepLookup.current) {
      return;
    }

    try {
      lastCepLookup.current = cepDigits;

      const response = await fetch(
        `https://viacep.com.br/ws/${cepDigits}/json/`
      );
      const result = await response.json();

      if (result?.erro) return;

      if (result?.logradouro)
        handleAddressChange("rua", result.logradouro);

      if (result?.localidade)
        handleAddressChange("cidade", result.localidade);

      if (result?.uf)
        handleAddressChange("uf", result.uf);

    } catch (error) {
      console.log("Erro ao buscar CEP:", error);
    }
  };

  const handleCepChange = (text) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    handleAddressChange("cep", digits);

    if (digits.length === 8) {
      fetchAddressByCep(digits);
    }
  };

  const validateFields = () => {
    const newErrors = {};

    const email = String(editedPersonalData.email || "").trim();
    const cpf = String(editedPersonalData.cpf || "");

    const cep = String(editedAddressData.cep || "");
    const rua = String(editedAddressData.rua || "").trim();
    const numero = String(editedAddressData.numero || "").trim();
    const cidade = String(editedAddressData.cidade || "").trim();
    const uf = String(editedAddressData.uf || "").trim();

    if (!email) newErrors.email = "Email obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Email inválido";

    if (!cpf || cpf.length !== 11)
      newErrors.cpf = "CPF inválido";

    if (!cep || cep.length !== 8)
      newErrors.cep = "CEP inválido";

    if (!rua) newErrors.rua = "Rua obrigatória";
    if (!numero) newErrors.numero = "Número obrigatório";
    if (!cidade) newErrors.cidade = "Cidade obrigatória";
    if (!uf || uf.length !== 2)
      newErrors.uf = "UF inválida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados pessoais</Text>

        {Object.entries(editedPersonalData).map(([key, value]) => (
          <View key={key} style={styles.fieldRow}>
            {key === "dataNasc" ? (
              <Input
                label={labelMap.dataNasc}
                variant="date"
                dateValue={parseDateValue(value)}
                onDateChange={(date) =>
                  handlePersonalChange(key, date)
                }
                disabled={true}
                forceActiveStyle={true}
                error={!!errors[key]}
              />
            ) : (
              <Input
                label={labelMap[key] || key}
                value={
                  key === "cpf"
                    ? formatCPF(value)
                    : String(value || "")
                }
                onChangeText={(text) => {
                  if (key === "cpf") {
                    const digits = text.replace(/\D/g, "").slice(0, 11);
                    handlePersonalChange(key, digits);
                  } else {
                    handlePersonalChange(key, text);
                  }
                }}
                keyboardType={key === "cpf" ? "numeric" : "default"}
                disabled={
                  key === "cpf"
                    ? !!editedPersonalData.cpf
                    : false
                }
                readOnly={
                  key !== "cpf" && isEditing && readOnlyFields.includes(key)
                }
                error={!!errors[key]}

              />
            )}

            {errors[key] && (
              <Text style={styles.errorText}>{errors[key]}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereço</Text>

        <View style={styles.fieldRow}>
          <Input
            label="CEP"
            value={formatCEP(editedAddressData.cep || "")}
            onChangeText={handleCepChange}
            keyboardType="numeric"
            error={!!errors.cep}
          />
          {errors.cep && (
            <Text style={styles.errorText}>{errors.cep}</Text>
          )}
        </View>

        {["rua", "numero", "complemento", "cidade", "uf"].map((key) => (
          <View key={key} style={styles.fieldRow}>
            <Input
              label={labelMap[key]}
              value={String(editedAddressData[key] || "")}
              onChangeText={(text) =>
                handleAddressChange(key, text)
              }
              error={!!errors[key]}
            />
            {errors[key] && (
              <Text style={styles.errorText}>{errors[key]}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.editingButtonContainer}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (validateFields()) {
              onSave(editedPersonalData, editedAddressData);
            }
          }}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Salvar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%", flex: 1 },
  scrollContent: { paddingBottom: 20 },
  section: { marginBottom: 15 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  fieldRow: { marginBottom: 10 },
  editingButtonContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 72, 72, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FF3B3B",
  },
  saveButton: {
    backgroundColor: "#E8A0BF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#000000",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: -6,
    marginBottom: 8,
  },
});