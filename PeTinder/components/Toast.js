import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, StyleSheet, Text, View } from "react-native";

const Toast = ({ visible, type = "success", message = "" }) => {
  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateY.setValue(-30);
      opacity.setValue(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 280,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 220,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -30,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, opacity, translateY]);

  if (!shouldRender || message.length === 0) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <Modal transparent visible={shouldRender} animationType="none" statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View
          style={[
            styles.container,
            isSuccess ? styles.successBorder : styles.errorBorder,
            { transform: [{ translateY }], opacity },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Image
              source={
                isSuccess
                  ? require("../assets/toast-success.png")
                  : require("../assets/toast-error.png")
              }
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 70,
      maxWidth: "88%",
      alignSelf: "center",
    backgroundColor: "#1A1A1A",
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  successBorder: {
    borderColor: "#2ED573",
  },
  errorBorder: {
    borderColor: "#FF4757",
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 30,
    height: 30,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
});

export default Toast;
