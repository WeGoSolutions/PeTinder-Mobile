import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const BOXES = 6;

const CodeInput = ({ value = '', onChangeCode }) => {
  const inputs = useRef([]);
  const codeArr = value.padEnd(BOXES).split('').slice(0, BOXES);

  const handleChange = (text, idx) => {
    // Se colar vários dígitos, distribui
    if (text.length > 1) {
      const cleanText = text.replace(/[^0-9]/g, '').slice(0, BOXES);
      onChangeCode(cleanText);
      // Foca no último dígito colado
      const next = Math.min(cleanText.length, BOXES - 1);
      setTimeout(() => inputs.current[next]?.focus(), 10);
      return;
    }

    // Se digitou algo válido
    if (text) {
      const cleanText = text.replace(/[^0-9]/g, '');
      if (!cleanText) return;

      let newArr = codeArr.slice();
      newArr[idx] = cleanText;
      onChangeCode(newArr.join('').replace(/ /g, ''));

      // Move para o próximo campo se digitou
      if (idx < BOXES - 1) {
        setTimeout(() => inputs.current[idx + 1]?.focus(), 10);
      }
    } else {
      // Se apagou (text vazio)
      let newArr = codeArr.slice();
      newArr[idx] = '';
      onChangeCode(newArr.join('').replace(/ /g, ''));

      // Retorna para o campo anterior se tiver
      if (idx > 0) {
        setTimeout(() => inputs.current[idx - 1]?.focus(), 10);
      }
    }
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
          selectionColor="rgba(248, 200, 220, 0.3)"
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
    width: 42,
    height: 56,
    borderWidth: 2,
    borderColor: '#F8C8DC',
    borderRadius: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 28,
    color: '#fff',
    backgroundColor: 'transparent',
    marginHorizontal: 2,
    fontFamily: 'Poppins_600SemiBold',
    paddingVertical: 0,
    lineHeight: 56,
  },
});

export default CodeInput;
