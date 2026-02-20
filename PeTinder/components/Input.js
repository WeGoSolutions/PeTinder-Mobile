import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
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

const Input = ({
  label,
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
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const isDate = variant === 'date';
  const isReadOnly = readOnly || disabled;
  const displayValue = isDate ? formatDate(dateValue) : value;
  const animatedValue = useRef(new Animated.Value(displayValue ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || displayValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, displayValue]);

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
            <View style={[styles.input, styles.dateInput, error && styles.inputError]}>
              <Text style={[styles.dateText, !displayValue && styles.datePlaceholder]}>
                {displayValue || placeholder || 'Selecione uma data'}
              </Text>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color="#FFFFFF"
                style={[styles.dateIcon, isReadOnly && styles.dateIconDisabled]}
              />
            </View>
          </Pressable>
          {showPicker && !isReadOnly && (
            <DateTimePicker
              value={dateValue instanceof Date ? dateValue : dateValue ? new Date(dateValue) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (event?.type === 'dismissed') {
                  setIsFocused(false);
                  setShowPicker(false);
                  return;
                }
                setShowPicker(Platform.OS === 'ios');
                const nextDate = selectedDate || dateValue || new Date();
                onDateChange?.(nextDate);
                setIsFocused(false);
                if (Platform.OS !== 'ios') {
                  setShowPicker(false);
                }
              }}
            />
          )}
        </>
      ) : (
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!isReadOnly}
        />
      )}
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
    color: '#FFFFFF',
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
});

export default Input;
