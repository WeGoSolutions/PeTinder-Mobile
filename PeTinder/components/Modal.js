import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ModalSheet = ({ children, visible = true, onClose, title, showCloseButton = false, showBackButton = false, onBack }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      style={styles.modal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              {showBackButton && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {title && <Text style={styles.title}>{title}</Text>}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
    zIndex: 10,
    width: '90%',
    minWidth: 380,
    alignItems: 'stretch',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 20,
    padding: 10,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default ModalSheet;
