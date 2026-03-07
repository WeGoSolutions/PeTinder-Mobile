import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const SWIPE_EFFECT_DISTANCE = 140;
const SWIPE_BUTTON_SCALE_BOOST = 0.14;

const PetActionButtons = ({ onGreenPress, onRedPress, expanded = false, swipeOffsetX = 0 }) => {
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth);
  const transition = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, transition]);

  const expandedButtonWidth = Math.max(containerWidth / 2, 75);

  const containerAnimatedStyle = {
    bottom: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
    }),
  };

  const buttonSizeAnimatedStyle = {
    width: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [75, expandedButtonWidth],
    }),
    marginHorizontal: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [9, 0],
    }),
    borderRadius: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [999, 0],
    }),
  };

  const greenAnimatedStyle = {
    borderTopLeftRadius: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [999, 12],
    }),
  };

  const redAnimatedStyle = {
    borderTopRightRadius: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [999, 12],
    }),
  };

  const swipeIntensity = Math.min(Math.abs(swipeOffsetX) / SWIPE_EFFECT_DISTANCE, 1);
  const redScale = swipeOffsetX > 0 ? 1 + swipeIntensity * SWIPE_BUTTON_SCALE_BOOST : 1;
  const greenScale = swipeOffsetX < 0 ? 1 + swipeIntensity * SWIPE_BUTTON_SCALE_BOOST : 1;

  const greenSwipeScaleStyle = {
    transform: [{ scale: greenScale }],
  };

  const redSwipeScaleStyle = {
    transform: [{ scale: redScale }],
  };

  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
      pointerEvents="box-none"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.buttonBase,
          styles.greenButton,
          buttonSizeAnimatedStyle,
          greenAnimatedStyle,
          greenSwipeScaleStyle,
        ]}
      >
        <Pressable style={styles.buttonPressable} onPress={onGreenPress}>
          <Image source={require('../../assets/adopt-icon.png')} style={styles.greenIcon} resizeMode="contain" />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonBase,
          styles.redButton,
          buttonSizeAnimatedStyle,
          redAnimatedStyle,
          redSwipeScaleStyle,
        ]}
      >
        <Pressable style={styles.buttonPressable} onPress={onRedPress}>
          <Image source={require('../../assets/pass-icon.png')} style={styles.redIcon} resizeMode="contain" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 8,
  },
  buttonBase: {
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenButton: {
    backgroundColor: '#C4F0B2',
  },
  redButton: {
    backgroundColor: '#E44B55',
  },
  greenIcon: {
    width: 28,
    height: 28,
  },
  redIcon: {
    width: 20,
    height: 20,
  },
});

export default PetActionButtons;
