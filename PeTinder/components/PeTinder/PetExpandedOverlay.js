import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from "react-native";

const PetDescriptionSection = ({ description }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Descrição</Text>
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>{description}</Text>
      </View>
    </View>
  );
};

const PetHealthSection = ({ features }) => {
  return (
    <View style={styles.healthContainer}>
      {features.map((feature, index) => (
        <View key={`${feature}-${index}`} style={styles.healthRow}>
          <View
            style={[
              styles.healthIconDot,
              index === 0 ? styles.healthIconRed : styles.healthIconGreen,
            ]}
          />
          <Text style={styles.healthText}>{feature}</Text>
        </View>
      ))}
    </View>
  );
};

const PetExpandedOverlay = ({
  visible,
  pet,
  liked,
  likesCount,
  onToggleLike,
  onClose,
}) => {
  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const animationValue = useRef(new Animated.Value(0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const skipNextCloseAnimation = useRef(false);
  const visibleRef = useRef(visible);
  const onCloseRef = useRef(onClose);
  const sexSymbol = pet.sex === "M" ? "♂" : "♀";
  const tags = Array.isArray(pet.tags) ? pet.tags : [];

  const description = useMemo(
    () =>
      pet.description ||
      "Pet muito companheiro, carinhoso e cheio de energia para explorar e brincar com você.",
    [pet.description],
  );
  const features = useMemo(
    () => pet.features || ["Vacinado", "Castrado"],
    [pet.features],
  );

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible && skipNextCloseAnimation.current) {
      skipNextCloseAnimation.current = false;
      animationValue.setValue(0);
      dragTranslateY.setValue(0);
      return;
    }

    Animated.timing(animationValue, {
      toValue: visible ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (!visible) {
      dragTranslateY.setValue(0);
    }
  }, [animationValue, dragTranslateY, visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          visibleRef.current &&
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        dragTranslateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose = gestureState.dy > 90 || gestureState.vy > 1.05;

        if (shouldClose) {
          skipNextCloseAnimation.current = true;
          Animated.timing(dragTranslateY, {
            toValue: SCREEN_HEIGHT,
            duration: 170,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current?.();
          });
          return;
        }

        Animated.spring(dragTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 24,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 24,
        }).start();
      },
    }),
  ).current;

  const panelBaseTranslateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [280, 0],
  });

  const animatedPanelStyle = {
    opacity: animationValue,
    transform: [
      {
        translateY: Animated.add(panelBaseTranslateY, dragTranslateY),
      },
    ],
  };

  const animatedBackdropStyle = {
    opacity: animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.45],
    }),
  };

  return (
    <View style={styles.overlayRoot} pointerEvents={visible ? "auto" : "none"}>
      <Pressable style={styles.backdropPressable} onPress={onClose}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
      </Pressable>

      <Animated.View
        style={[styles.panel, animatedPanelStyle]}
        {...panResponder.panHandlers}
      >
        <View style={styles.separatorContainer}>
          <View style={styles.separator} />
        </View>
        <View style={styles.headerRow}>
          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.sexSymbol}>{sexSymbol}</Text>
              <Text style={styles.name}>{pet.name}</Text>
              <Text style={styles.age}>{pet.age}</Text>
            </View>

            <View style={styles.tagsGrid}>
              {tags.map((tag) => (
                <View
                  key={tag.label}
                  style={[styles.tag, { backgroundColor: tag.color }]}
                >
                  <Text style={styles.tagText}>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionsRight}>
            <View style={styles.likesBubble}>
              <Pressable
                onPress={onToggleLike}
                hitSlop={8}
                style={styles.likePressable}
              >
                <Image
                  source={
                    liked
                      ? require("../../assets/liked-icon.png")
                      : require("../../assets/like-icon.png")
                  }
                  style={styles.likeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.likesCount}>{likesCount}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.expandButton} onPress={onClose}>
              <Image
                source={require("../../assets/up-icon.png")}
                style={styles.expandIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

        <PetDescriptionSection description={description} />
        <PetHealthSection features={features} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    minHeight: 600,
    backgroundColor: "#202020",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 95,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  separatorContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 5,
    marginTop: 3,
  },
  separator: {
    justifyContent: "center",
    alignItems: "center",
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#323232",
    marginBottom: 12,
  },
  mainInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  sexSymbol: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Poppins_600SemiBold",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 38,
    fontFamily: "Poppins_700Bold",
  },
  age: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  tagText: {
    color: "#F4F4F4",
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textShadowColor: '#111',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0.5,
  },
  actionsRight: {
    alignItems: "center",
    gap: 8,
  },
  likesBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  likeIcon: {
    width: 40,
    height: 40,
  },
  likePressable: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },
  likesCount: {
    ...StyleSheet.absoluteFillObject,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 42,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    includeFontPadding: false,
  },
  expandButton: {
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: "#202020",
    borderWidth: 1.5,
    borderColor: "#323232",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIcon: {
    width: 26,
    transform: [{ rotate: "180deg" }],
  },
  sectionContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 34,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  descriptionBox: {
    backgroundColor: "#2D2D2D",
    marginHorizontal: -10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  descriptionText: {
    color: "#DDDDDD",
    fontSize: 14,
    lineHeight: 24,
    fontFamily: "Poppins_400Regular",
  },
  healthContainer: {
    marginTop: 12,
    gap: 12,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthIconDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 8,
  },
  healthIconRed: {
    backgroundColor: "#E45C62",
  },
  healthIconGreen: {
    backgroundColor: "#7CD66D",
  },
  healthText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
  },
});

export default PetExpandedOverlay;
