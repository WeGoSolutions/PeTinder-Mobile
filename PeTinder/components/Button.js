import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Button = ({ 
  variant = 'primary', 
  onPress, 
  disabled = false, 
  isLoading = false,
  children,
  style 
}) => {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    disabled && styles.disabledButton,
    style
  ];

  const textStyles = [
    styles.buttonText,
    styles[`${variant}ButtonText`]
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#1A1A1A' : '#FFFFFF'} />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#E8A0BF',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E8A0BF',
  },
  forgotPasswordButton: {
    backgroundColor: 'transparent',
    marginTop: 8,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  primaryButtonText: {
    color: '#1A1A1A',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  forgotPasswordButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default Button;
