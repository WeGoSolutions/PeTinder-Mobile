import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, Pressable, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const months = [
    'Janeiro',
    'Fevereiro',
    'Marco',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
};

const Input = forwardRef(({
  label,
  labelColor,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  errorText,
  helperText,
  helperContent,
  valid,
  variant,
  dateValue,
  onDateChange,
  placeholder,
  readOnly,
  disabled,
  forceActiveStyle,
  returnKeyType,
  onSubmitEditing,
  onBlur,
  blurOnSubmit,
  autoCorrect,
  autoComplete,
  textContentType,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const isPassword = !!secureTextEntry;
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const innerRef = useRef(null);
  const isDate = variant === 'date';
  const isReadOnly = readOnly || disabled;
  const isDisabled = disabled;
  const displayValue = isDate ? formatDate(dateValue) : value;
  const animatedValue = useRef(new Animated.Value(isDate || displayValue ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDate || isFocused || displayValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isDate, isFocused, displayValue]);

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

  // --- Campo de senha: olho para revelar/ocultar ---
  // Usamos o secureTextEntry NATIVO (em vez de mascarar manualmente o valor):
  // mascarar um TextInput controlado conflita com a região de composição do
  // teclado Android e duplica caracteres (ex.: "Gu" + "i" virava "GuGui"). O
  // valor real flui direto pelo onChangeText, sem transformação. O olho apenas
  // liga/desliga o secureTextEntry. No iOS, o secureTextEntry já revela o último
  // caractere por um instante nativamente.

  // Mescla a ref encaminhada (usada pelo pai para focar o próximo campo) com uma
  // ref interna, para conseguirmos refocar ao tocar no olho.
  const setInputRef = (node) => {
    innerRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const togglePasswordReveal = () => {
    setIsPasswordRevealed((prev) => !prev);
    // Mantém o foco/teclado ao tocar no olho.
    requestAnimationFrame(() => innerRef.current?.focus());
  };

  return (
    <View style={styles.container}>
      <Animated.Text
        pointerEvents="none"
        style={[styles.label, labelStyle, labelColor ? { color: labelColor } : null]}
      >
        {label}
      </Animated.Text>
      {isDate ? (
        <>
          <Pressable
            onPress={() => {
              if (isReadOnly) return;
              setIsFocused(true);
              setShowPicker(true);
            }}
            style={({ pressed }) => [
              styles.datePressable,
              !isReadOnly && pressed && styles.datePressed,
            ]}
          >
            <View style={[styles.input, styles.dateInput, error && styles.inputError, !error && valid && styles.dateInputValid, isDisabled && styles.dateInputDisabled]}>
              <Text
                style={[
                  styles.dateText,
                  !displayValue && styles.datePlaceholder,
                  isReadOnly && !forceActiveStyle && styles.dateTextDisabled
                ]}
              >
                {displayValue || placeholder || 'Selecione uma data'}
              </Text>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color="#FFFFFF"
                style={[styles.dateIcon, isDisabled && styles.dateIconDisabled]}
              />
            </View>
          </Pressable>
          {showPicker && !isReadOnly && (
            <>
              {Platform.OS === 'ios' && (
                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPicker(false);
                      setIsFocused(false);
                    }}
                  >
                    <Text style={styles.pickerConfirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={dateValue instanceof Date ? dateValue : dateValue ? new Date(dateValue) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                textColor="#FFFFFF"
                themeVariant="dark"
                accentColor="#FFC0D9"
                onChange={(event, selectedDate) => {
                  if (event?.type === 'dismissed') {
                    setIsFocused(false);
                    setShowPicker(false);
                    return;
                  }
                  setShowPicker(Platform.OS === 'ios');
                  const nextDate = selectedDate || dateValue || new Date();
                  onDateChange?.(nextDate);
                  if (Platform.OS !== 'ios') {
                    setIsFocused(false);
                    setShowPicker(false);
                  }
                }}
              />
            </>
          )}
        </>
      ) : (
        <View
          style={[
            styles.inputRow,
            error && styles.inputRowError,
            !error && valid && styles.inputRowValid,
            isDisabled && styles.inputRowDisabled,
          ]}
        >
          <TextInput
            ref={setInputRef}
            style={[styles.inputControl, isDisabled && styles.inputControlDisabled]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            secureTextEntry={isPassword && !isPasswordRevealed}
            keyboardType={keyboardType}
            autoCapitalize={isPassword ? 'none' : autoCapitalize}
            autoCorrect={isPassword ? false : autoCorrect}
            spellCheck={isPassword ? false : undefined}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            autoComplete={autoComplete}
            textContentType={textContentType}
            editable={!isReadOnly && !isDisabled}
          />
          {!error && valid ? (
            <MaterialIcons
              name="check-circle"
              size={18}
              color="#7BD88F"
              style={styles.validIcon}
            />
          ) : null}
          {isPassword ? (
            <Pressable
              onPress={togglePasswordReveal}
              hitSlop={10}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={isPasswordRevealed ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <MaterialIcons
                name={isPasswordRevealed ? 'visibility' : 'visibility-off'}
                size={20}
                color="#FFC0D9"
              />
            </Pressable>
          ) : null}
        </View>
      )}
      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperContent ? (
        helperContent
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFC0D9',
  },
  inputControl: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  inputControlDisabled: {
    color: '#AAAAAA',
  },
  inputRowError: {
    borderBottomColor: '#FF6B6B',
  },
  inputRowValid: {
    borderBottomColor: '#7BD88F',
  },
  inputRowDisabled: {
    borderBottomColor: '#666666',
  },
  validIcon: {
    marginLeft: 8,
  },
  eyeButton: {
    marginLeft: 8,
    padding: 2,
  },
  inputError: {
    borderBottomColor: '#FF6B6B',
  },
  dateInputValid: {
    borderBottomColor: '#7BD88F',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#FF6B6B',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#AAAAAA',
  },
  inputDisabled: {
    borderBottomColor: '#666666',
    color: '#AAAAAA',
  },
  datePressable: {
    borderRadius: 4,
  },
  datePressed: {
    opacity: 0.85,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    // color: '#FFFFFF', quando era ativa
    color: '#AAAAAA'
  },
  datePlaceholder: {
    color: '#CFCFCF',
  },
  dateIcon: {
    marginLeft: 8,
    opacity: 0.9,
  },
  dateIconDisabled: {
    opacity: 0.6,
  },
  dateInputDisabled: {
    borderBottomColor: '#666666',
  },
  pickerActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pickerConfirmText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFC0D9',
  },
  dateTextDisabled: {
    color: '#ffffff',
    fontFamily: "Poppins_600SemiBold",
  },
});

export default Input;