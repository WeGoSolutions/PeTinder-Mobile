import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export const CustomHeader = ({
  onBack,
  title = '',
  onTitlePress,
  onRightPress,
  rightIconName = 'more-vert',
  isRightLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const isTitlePressable = typeof onTitlePress === 'function';
  const isRightPressable = typeof onRightPress === 'function';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="chevron-left" size={28} color="#1A1A1A" />
      </TouchableOpacity>
      <View style={styles.titleWrapper}>
        <TouchableOpacity
          onPress={onTitlePress}
          disabled={!isTitlePressable}
          activeOpacity={isTitlePressable ? 0.7 : 1}
          hitSlop={8}
          style={styles.titlePressableArea}
        >
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={onRightPress}
        disabled={!isRightPressable || isRightLoading}
        style={styles.rightButton}
      >
        {isRightLoading ? (
          <ActivityIndicator size="small" color="#1A1A1A" />
        ) : isRightPressable ? (
          <MaterialIcons name={rightIconName} size={24} color="#1A1A1A" />
        ) : (
          <View style={styles.spacer} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePressableArea: {
    maxWidth: '100%',
    paddingHorizontal: 6,
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 24,
    height: 24,
  },
});
