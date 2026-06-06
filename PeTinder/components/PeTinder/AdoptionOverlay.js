import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Image, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Microinteração de confirmação de adoção.
 *
 * Reaproveita a imagem do botão de adotar (cachorro na caixa) num selo circular
 * verde que dá um bounce, pulsa, solta coraçõezinhos e sobe sumindo — passando a
 * sensação de "pet adotado, indo para um novo lar". Tudo transparente (sem fundo
 * de tela / sem retângulo) e com useNativeDriver (60fps).
 *
 * Uso (imperativo, reutilizável em qualquer tela):
 *   const ref = useRef(null);
 *   <AdoptionOverlay ref={ref} />
 *   ref.current.play(() => { ...ação após a animação... });
 *
 * Para trocar o asset no futuro, basta mudar o require() de ADOPT_ICON.
 */
const ADOPT_ICON = require('../../assets/adopt-icon.png');

const BADGE_SIZE = 132;
const BADGE_GREEN = '#4FB06A';
const RING_GREEN = '#A9E8B6';
const CHECK_GREEN = '#2E9E4F';

const FloatingHeart = ({ progress, offsetX, color, size, riseTo }) => {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, riseTo],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, offsetX],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.18, 0.7, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.3, 1, 0.75],
  });

  return (
    <Animated.View
      style={[
        styles.heart,
        { opacity, transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    >
      <Ionicons name="heart" size={size} color={color} />
    </Animated.View>
  );
};

const AdoptionOverlay = forwardRef((props, ref) => {
  const [playing, setPlaying] = useState(false);

  const containerOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.3)).current;
  const badgeTranslateY = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const heartsProgress = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    play(onDone) {
      // Reseta tudo para um disparo limpo (reutilizável várias vezes).
      containerOpacity.setValue(0);
      badgeScale.setValue(0.3);
      badgeTranslateY.setValue(0);
      ringScale.setValue(0.4);
      ringOpacity.setValue(0);
      checkScale.setValue(0);
      heartsProgress.setValue(0);
      setPlaying(true);

      // Efeitos paralelos independentes (não atrasam a finalização):
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.9,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0.55, duration: 120, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(heartsProgress, {
          toValue: 1,
          duration: 950,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Sequência principal (controla o fim da animação):
      Animated.sequence([
        Animated.parallel([
          Animated.timing(containerOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.spring(badgeScale, { toValue: 1, friction: 5.5, tension: 95, useNativeDriver: true }),
        ]),
        Animated.spring(checkScale, { toValue: 1, friction: 4.5, tension: 130, useNativeDriver: true }),
        Animated.delay(160),
        Animated.parallel([
          Animated.timing(badgeTranslateY, {
            toValue: -52,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(containerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => {
        setPlaying(false);
        if (finished && typeof onDone === 'function') {
          onDone();
        }
      });
    },
  }));

  return (
    <Animated.View
      style={[styles.overlay, { opacity: containerOpacity }]}
      // Bloqueia toques no card SÓ enquanto anima (transparente, sem visual), para
      // o usuário não disparar outra ação no meio da confirmação.
      pointerEvents={playing ? 'auto' : 'none'}
    >
      <Animated.View
        style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
      />

      <FloatingHeart progress={heartsProgress} offsetX={-58} riseTo={-104} color="#FF7DAA" size={22} />
      <FloatingHeart progress={heartsProgress} offsetX={56} riseTo={-92} color="#FFB3CF" size={18} />
      <FloatingHeart progress={heartsProgress} offsetX={6} riseTo={-120} color="#8FE0A0" size={15} />

      <Animated.View
        style={[
          styles.badge,
          { transform: [{ scale: badgeScale }, { translateY: badgeTranslateY }] },
        ]}
      >
        <Image source={ADOPT_ICON} style={styles.icon} resizeMode="contain" />

        <Animated.View style={[styles.checkBadge, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

AdoptionOverlay.displayName = 'AdoptionOverlay';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  ring: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 3,
    borderColor: RING_GREEN,
  },
  heart: {
    position: 'absolute',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: BADGE_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BADGE_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  icon: {
    width: 74,
    height: 74,
    tintColor: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CHECK_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});

export default AdoptionOverlay;
