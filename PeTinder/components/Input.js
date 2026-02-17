import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Animated } from 'react-native';

const FloatingLabelInput = ({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute',
    left: 0,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#FFFFFF', '#FFFFFF'],
    }),
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#FFC0D9',
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  inputError: {
    borderBottomColor: '#FF6B6B',
  },
});

export default FloatingLabelInput;
