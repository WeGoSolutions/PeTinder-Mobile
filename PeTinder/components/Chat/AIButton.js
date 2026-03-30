import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const PHRASES = [
  'Cuidados para meu pet',
  'Qual ração comprar?',
  'Onde vacinar meu pet?',
];

const TYPING_MS = 60;
const DELETING_MS = 40;
const HOLD_FULL_TEXT_MS = 1500;

const AIButton = ({ onPress }) => {
  const { width: screenWidth } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const gradientTrackWidth = screenWidth * 3;
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [slideAnim]);
  
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
  });

  const currentPhrase = useMemo(() => PHRASES[phraseIndex] || '', [phraseIndex]);
  const animatedText = useMemo(() => currentPhrase.slice(0, charIndex), [currentPhrase, charIndex]);

  useEffect(() => {
    let timeoutId;

    if (!isDeleting && charIndex < currentPhrase.length) {
      timeoutId = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, TYPING_MS);
    } else if (!isDeleting && charIndex === currentPhrase.length) {
      timeoutId = setTimeout(() => {
        setIsDeleting(true);
      }, HOLD_FULL_TEXT_MS);
    } else if (isDeleting && charIndex > 0) {
      timeoutId = setTimeout(() => {
        setCharIndex((prev) => prev - 1);
      }, DELETING_MS);
    } else {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [charIndex, currentPhrase.length, isDeleting]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animatedGradientLayer,
          {
            width: gradientTrackWidth,
            left: -screenWidth,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            '#80465D',
            '#A35E79',
            '#FFC0D9',
            '#ECA7C5',
            '#80465D',
            '#A35E79',
            '#FFC0D9',
            '#ECA7C5',
            '#80465D',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientFill}
        />
      </Animated.View>

      <Pressable
        style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
        onPress={onPress || (() => console.log('AI Button Pressed'))}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="paw" size={28} color="#B36A8B" />
        </View>
        <Text style={styles.buttonText} numberOfLines={1}>
          {animatedText}
          <Text style={styles.cursor}>|</Text>
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 75,
    justifyContent: 'center',
    backgroundColor: '#FFC0D9',
    shadowColor: '#FFC0D9',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  animatedGradientLayer: {
    position: 'absolute',
    height: 96,
    top: -9,
  },
  gradientFill: {
    flex: 1,
  },
  pressable: {
    margin: 5,
    borderRadius: 19,
    backgroundColor: '#ECECEE',
    height: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressablePressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8E5EE',
  },
  buttonText: {
    color: '#242424',
    fontFamily: 'Poppins_500Medium',
    fontSize: 17,
    marginLeft: 12,
    flexShrink: 1,
  },
  cursor: {
    color: '#80465D',
  },
});

export default AIButton;
