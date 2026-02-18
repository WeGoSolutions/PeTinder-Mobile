import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomSheet = ({ children, title, showBackButton = false, onBack }) => {
  return (
    <View style={styles.actionSheetContainer}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  actionSheetContainer: {
    zIndex: 10,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    width: '100%',
    overflow: 'hidden',
    // Removido position: absolute para permitir que suba com o teclado
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

export default BottomSheet;
