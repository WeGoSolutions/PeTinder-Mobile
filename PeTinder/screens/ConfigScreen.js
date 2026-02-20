import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomHeader } from '../components/CustomHeader';
import { UserInfo } from '../components/config/UserInfo';
import { ContentTabs } from '../components/config/ContentTabs';
import { ContaTab } from '../components/config/ContaTab';
import Modal from '../components/Modal';

const ConfigScreen = ({ navigation }) => {
  const route = useRoute();
  const title = route.params?.title || 'Configurações';
  const tabs = [
    {
      label: "Conta",
      content: (
        <ContaTab
          personalData={{
            email: "sabrina@gmail.com",
            cpf: "***.222.333-**",
            dataNasc: "11/05/1999",
          }}
          addressData={{
            cep: "08290-001",
            rua: "R. Victorio Santim",
            numero: "2776",
            complemento: "Apartamento 8A",
            cidade: "Sao Paulo",
            uf: "SP",
          }}
        />
      ),
    },
    {
      label: "Configurações",
      content: (
        <View>
          <Text style={styles.tabTitle}>Configurações</Text>
        </View>
      ),
    },
    {
      label: "Ajuda",
      content: (
        <View>
          <Text style={styles.tabTitle}>Ajuda</Text>
        </View>
      ),
    },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleExitConfirm = () => {
    setShowExitModal(false);
    navigation.navigate('Home');
  };

  return (
    <View style={styles.root}>
      <CustomHeader onBack={() => navigation.goBack()} title={title} />
      <UserInfo nome={"Sabrina Carpenter"} userImageURL={"https://www.famousbirthdays.com/faces/carpenter-sabrina-image.jpg"} />
      <ContentTabs
        tabs={tabs}
        activeTab={activeTab.label}
        onTabPress={(label) =>
          setActiveTab(tabs.find((tab) => tab.label === label) || tabs[0])
        }
      />
      <View style={styles.exitButtonContainer}>
        <Pressable onPress={() => setShowExitModal(true)} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>Sair da conta</Text>
        </Pressable>
      </View>
      <Modal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Sair da Conta"
        showCloseButton
      >
        <Text style={styles.modalText}>
          Tem certeza que deseja sair da sua conta?
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.modalConfirmPressable,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleExitConfirm}
        >
          <LinearGradient
            colors={["#E8A0BF", "#F8C8DC", "#FDE4E9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalConfirm}
          >
            <Text style={styles.modalConfirmText}>Sim, sair</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            pressed && styles.buttonPressed,
          ]}
          onPress={() => setShowExitModal(false)}
        >
          <View style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  tabTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  exitButtonContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: 'rgba(255, 72, 72, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 15,
  },
  exitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FF3B3B',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#CFCFCF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalConfirmPressable: {
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  modalConfirm: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  modalCancel: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3A3A3A',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
});

export default ConfigScreen;
