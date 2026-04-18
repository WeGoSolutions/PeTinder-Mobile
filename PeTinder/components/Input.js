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
  variant,
  dateValue,
  onDateChange,
  placeholder,
  readOnly,
  disabled,
  forceActiveStyle,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  autoCorrect,
  autoComplete,
  textContentType,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
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
            <View style={[styles.input, styles.dateInput, error && styles.inputError, isDisabled && styles.dateInputDisabled]}>
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
        <TextInput
          ref={ref}
          style={[styles.input, error && styles.inputError, isDisabled && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          textContentType={textContentType}
          editable={!isReadOnly && !isDisabled}
        />
      )}
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
  inputError: {
    borderBottomColor: '#FF6B6B',
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