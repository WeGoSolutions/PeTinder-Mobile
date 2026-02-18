import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const BOXES = 6;

const CodeInput = ({ value = '', onChangeCode }) => {
  const inputs = useRef([]);
  const codeArr = value.padEnd(BOXES).split('').slice(0, BOXES);

  const handleChange = (text, idx) => {
    // Se colar vários dígitos, distribui
    if (text.length > 1) {
      const newCode = text.slice(0, BOXES);
      onChangeCode(newCode);
      // Foca no último dígito colado
      const next = Math.min(newCode.length, BOXES - 1);
      setTimeout(() => inputs.current[next]?.focus(), 10);
      return;
    }
    // Atualiza apenas o dígito atual
    let newArr = codeArr.slice();
    newArr[idx] = text.replace(/[^0-9]/g, '');
    // Move para o próximo campo se digitou
    if (text && idx < BOXES - 1) {
      setTimeout(() => inputs.current[idx + 1]?.focus(), 10);
    }
    onChangeCode(newArr.join('').replace(/ /g, ''));
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !codeArr[idx] && idx > 0) {
      setTimeout(() => inputs.current[idx - 1]?.focus(), 10);
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: BOXES }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={el => (inputs.current[idx] = el)}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={1}
          value={codeArr[idx] && codeArr[idx] !== ' ' ? codeArr[idx] : ''}
          onChangeText={text => handleChange(text, idx)}
          onKeyPress={e => handleKeyPress(e, idx)}
          autoFocus={idx === 0}
          returnKeyType="next"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 5,
  },
  input: {
    width: 44,
    height: 56,
    borderWidth: 2,
    borderColor: '#F8C8DC',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 28,
    color: '#fff',
    backgroundColor: 'transparent',
    marginHorizontal: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default CodeInput;
