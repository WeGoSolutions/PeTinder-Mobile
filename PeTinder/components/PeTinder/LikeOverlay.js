import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Microinteração de curtida.
 *
 * Burst radial de mini-corações (estilo reação do iOS) + coração central com
 * bounce overshoot rápido. Visual rico, mas curto (~630ms) — like é eventual e
 * não pode demorar. Tudo transparente, useNativeDriver, sem retângulo.
 *
 * Uso (imperative ref — igual ao AdoptionOverlay):
 *   const ref = useRef(null);
 *   <LikeOverlay ref={ref} />
 *   ref.current.play();   // sem onDone — like não bloqueia navegação
 */

const MAIN_COLOR  = '#FF4D8D';
const BURST_COLORS = ['#FF4D8D', '#FF7DAA', '#FFB3CF', '#FF4D8D', '#FFB3CF', '#FF6EAA'];

// Ângulos dos 6 mini-corações em radianos (distribuídos em arco superior).
const BURST_ANGLES = [-100, -65, -35, 35, 65, 100].map((deg) => (deg * Math.PI) / 180);
const BURST_RADIUS = 88;
const BURST_SIZES  = [14, 18, 13, 16, 19, 12];

const LikeOverlay = forwardRef((props, ref) => {
  // Coração central
  const mainScale   = useRef(new Animated.Value(0)).current;
  const mainOpacity = useRef(new Animated.Value(0)).current;

  // Mini-corações do burst (6 animações independentes)
  const burstScales    = useRef(BURST_ANGLES.map(() => new Animated.Value(0))).current;
  const burstOpacities = useRef(BURST_ANGLES.map(() => new Animated.Value(0))).current;
  const burstTX        = useRef(BURST_ANGLES.map(() => new Animated.Value(0))).current;
  const burstTY        = useRef(BURST_ANGLES.map(() => new Animated.Value(0))).current;

  useImperativeHandle(ref, () => ({
    play() {
      // Reset
      mainScale.setValue(0);
      mainOpacity.setValue(0);
      burstScales.forEach((v)    => v.setValue(0));
      burstOpacities.forEach((v) => v.setValue(0));
      burstTX.forEach((v)        => v.setValue(0));
      burstTY.forEach((v)        => v.setValue(0));

      // ── Coração central ─────────────────────────────────────────────────
      // Um único movimento fluido: pop com easing.back (overshoot embutido)
      // e fade que começa junto com o pico — sem spring duplo, sem delay,
      // sem fase "estática". Tempo ativo total: ~380ms.
      Animated.parallel([
        // Scale: sobe rápido com overshoot (back) e desce imediatamente
        Animated.sequence([
          Animated.timing(mainScale, {
            toValue: 1.18,
            duration: 160,
            easing: Easing.out(Easing.back(2.2)),
            useNativeDriver: true,
          }),
          Animated.timing(mainScale, {
            toValue: 0.55,
            duration: 220,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Opacity: entra rápido e começa a sair aos 140ms (no pico visual)
        Animated.sequence([
          Animated.timing(mainOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.delay(60),
          Animated.timing(mainOpacity, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // ── Burst radial ─────────────────────────────────────────────────────
      // Cada mini-coração nasce no centro, voa para seu ângulo e some.
      // Encurtado para ~360ms total para não vazar além do coração central.
      BURST_ANGLES.forEach((angle, i) => {
        const tx = Math.sin(angle) * BURST_RADIUS;
        const ty = -Math.cos(Math.abs(angle)) * BURST_RADIUS * 0.85 - 10;

        Animated.sequence([
          Animated.delay(i * 12),
          Animated.parallel([
            Animated.timing(burstOpacities[i], { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(burstScales[i], {
              toValue: 1,
              duration: 50,
              easing: Easing.out(Easing.back(1.4)),
              useNativeDriver: true,
            }),
            Animated.timing(burstTX[i], {
              toValue: tx,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(burstTY[i], {
              toValue: ty,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(burstOpacities[i], {
            toValue: 0,
            duration: 130,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity: mainOpacity }]}
    >
      {/* Mini-corações do burst — posição absoluta independente do container */}
      {BURST_ANGLES.map((_, i) => (
        <Animated.View
          key={`burst-${i}`}
          style={[
            styles.burst,
            {
              opacity: burstOpacities[i],
              transform: [
                { translateX: burstTX[i] },
                { translateY: burstTY[i] },
                { scale: burstScales[i] },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={BURST_SIZES[i]} color={BURST_COLORS[i]} />
        </Animated.View>
      ))}

      {/* Coração central — monta por último (zIndex maior) */}
      <Animated.View
        style={[
          styles.mainHeart,
          { transform: [{ scale: mainScale }] },
        ]}
      >
        <Ionicons name="heart" size={148} color={MAIN_COLOR} />
      </Animated.View>
    </Animated.View>
  );
});

LikeOverlay.displayName = 'LikeOverlay';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 55, // abaixo do AdoptionOverlay (60), acima do card
  },
  mainHeart: {
    // Sombra suave para dar profundidade sem peso
    shadowColor: MAIN_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  burst: {
    position: 'absolute',
  },
});

export default LikeOverlay;
