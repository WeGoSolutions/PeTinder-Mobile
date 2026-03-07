import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Animated, PanResponder, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const FOCUS_PRESS_DELAY_MS = 220;
const SWIPE_TRIGGER_DISTANCE = 90;
const SWIPE_TRIGGER_VELOCITY = 0.8;

const getImageCacheKey = (source) => {
  if (typeof source === 'number') {
    return `local-${source}`;
  }

  if (source && typeof source === 'object' && source.uri) {
    return source.uri;
  }

  return JSON.stringify(source);
};

const PetImageCarousel = ({
  images = [],
  children,
  onFocusChange,
  onSwipeRight,
  onSwipeLeft,
  onSwipeProgress,
}) => {
  const gallery = useMemo(() => (images.length ? images : []), [images]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(gallery.length > 0);
  const [containerWidth, setContainerWidth] = useState(0);
  const hasTriggeredLongPress = useRef(false);
  const isSwipeAnimatingRef = useRef(false);
  const loadedImageKeysRef = useRef(new Set());
  const shimmerTranslateX = useRef(new Animated.Value(-220)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const shimmerLoopRef = useRef(null);

  const resetSwipePosition = () => {
    swipeTranslateX.setValue(0);
    onSwipeProgress?.(0);
    isSwipeAnimatingRef.current = false;
  };

  const animateSwipeOutAndRun = (toValue, callback) => {
    isSwipeAnimatingRef.current = true;

    Animated.timing(swipeTranslateX, {
      toValue,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      callback?.();
      resetSwipePosition();
    });
  };

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isSwipeAnimatingRef.current
          && Math.abs(gestureState.dx) > 8
          && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        swipeTranslateX.setValue(gestureState.dx);
        onSwipeProgress?.(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldSwipeRight =
          gestureState.dx > SWIPE_TRIGGER_DISTANCE || gestureState.vx > SWIPE_TRIGGER_VELOCITY;
        const shouldSwipeLeft =
          gestureState.dx < -SWIPE_TRIGGER_DISTANCE || gestureState.vx < -SWIPE_TRIGGER_VELOCITY;

        if (shouldSwipeRight) {
          const target = (containerWidth || 320) + 120;
          animateSwipeOutAndRun(target, onSwipeRight);
          return;
        }

        if (shouldSwipeLeft) {
          const target = -((containerWidth || 320) + 120);
          animateSwipeOutAndRun(target, onSwipeLeft);
          return;
        }

        Animated.spring(swipeTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 24,
        }).start(() => {
          onSwipeProgress?.(0);
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 24,
        }).start(() => {
          onSwipeProgress?.(0);
        });
      },
    }),
  ).current;

  const swipeRotate = swipeTranslateX.interpolate({
    inputRange: [-(containerWidth || 320), 0, containerWidth || 320],
    outputRange: ['-9deg', '0deg', '9deg'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!gallery.length) {
      setCurrentIndex(0);
      setIsImageLoading(false);
      imageOpacity.setValue(0);
      return;
    }

    setCurrentIndex(0);
    const firstImage = gallery[0];
    const firstImageKey = getImageCacheKey(firstImage);
    const isFirstImageCached = loadedImageKeysRef.current.has(firstImageKey);

    setIsImageLoading(!isFirstImageCached);
    imageOpacity.setValue(isFirstImageCached ? 1 : 0);

    if (!isFirstImageCached && firstImage && typeof firstImage === 'object' && firstImage.uri) {
      Image.prefetch(firstImage.uri);
    }
  }, [gallery, imageOpacity]);

  useEffect(() => {
    if (!isImageLoading || !gallery.length || !containerWidth) {
      shimmerLoopRef.current?.stop?.();
      return;
    }

    const shimmerStart = -containerWidth;
    const shimmerEnd = containerWidth;
    shimmerTranslateX.setValue(shimmerStart);

    shimmerLoopRef.current = Animated.loop(
      Animated.timing(shimmerTranslateX, {
        toValue: shimmerEnd,
        duration: 950,
        useNativeDriver: true,
      }),
    );

    shimmerLoopRef.current.start();

    return () => {
      shimmerLoopRef.current?.stop?.();
    };
  }, [containerWidth, gallery.length, isImageLoading, shimmerTranslateX]);

  const goToNext = () => {
    if (!gallery.length) {
      return;
    }

    const nextIndex = currentIndex === gallery.length - 1 ? 0 : currentIndex + 1;
    const nextImage = gallery[nextIndex];
    const nextImageKey = getImageCacheKey(nextImage);
    const isNextImageCached = loadedImageKeysRef.current.has(nextImageKey);

    setCurrentIndex(nextIndex);
    setIsImageLoading(!isNextImageCached);
    imageOpacity.setValue(isNextImageCached ? 1 : 0);

    if (!isNextImageCached && nextImage && typeof nextImage === 'object' && nextImage.uri) {
      Image.prefetch(nextImage.uri);
    }
  };

  const goToPrevious = () => {
    if (!gallery.length) {
      return;
    }

    const previousIndex = currentIndex === 0 ? gallery.length - 1 : currentIndex - 1;
    const previousImage = gallery[previousIndex];
    const previousImageKey = getImageCacheKey(previousImage);
    const isPreviousImageCached = loadedImageKeysRef.current.has(previousImageKey);

    setCurrentIndex(previousIndex);
    setIsImageLoading(!isPreviousImageCached);
    imageOpacity.setValue(isPreviousImageCached ? 1 : 0);

    if (!isPreviousImageCached && previousImage && typeof previousImage === 'object' && previousImage.uri) {
      Image.prefetch(previousImage.uri);
    }
  };

  const handlePressIn = () => {
    hasTriggeredLongPress.current = false;
  };

  const handleLongPress = () => {
    hasTriggeredLongPress.current = true;
    onFocusChange?.(true);
  };

  const handlePressOut = () => {
    if (hasTriggeredLongPress.current) {
      onFocusChange?.(false);
    }
  };

  const handleNavigate = (direction) => {
    if (hasTriggeredLongPress.current || isSwipeAnimatingRef.current) {
      hasTriggeredLongPress.current = false;
      return;
    }

    if (direction === 'left') {
      goToPrevious();
      return;
    }

    goToNext();
  };

  return (
    <View style={styles.container} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.swipeableLayer,
          {
            transform: [{ translateX: swipeTranslateX }, { rotate: swipeRotate }],
          },
        ]}
      >
        {gallery.length > 0 ? (
          <Animated.Image
            source={gallery[currentIndex]}
            style={[styles.image, { opacity: imageOpacity }]}
            resizeMode="cover"
            onLoadStart={() => {
              const currentImage = gallery[currentIndex];
              const currentImageKey = getImageCacheKey(currentImage);
              const isCurrentImageCached = loadedImageKeysRef.current.has(currentImageKey);

              if (!isCurrentImageCached) {
                setIsImageLoading(true);
                imageOpacity.setValue(0);
              }
            }}
            onLoadEnd={() => {
              const currentImage = gallery[currentIndex];
              const currentImageKey = getImageCacheKey(currentImage);
              loadedImageKeysRef.current.add(currentImageKey);
              setIsImageLoading(false);
              Animated.timing(imageOpacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
              }).start();
            }}
            onError={() => {
              setIsImageLoading(false);
              imageOpacity.setValue(1);
            }}
          />
        ) : (
          <View style={styles.emptyState} />
        )}

        {isImageLoading && gallery.length > 0 && (
          <View style={styles.skeletonBase}>
            <Animated.View
              style={[
                styles.shimmerBand,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.85)']}
          style={styles.bottomFade}
        />

        <View style={styles.indicatorsRow}>
          {gallery.map((_, index) => (
            <View
              key={`indicator-${index}`}
              style={[styles.indicator, index === currentIndex && styles.indicatorActive]}
            />
          ))}
        </View>

        <View style={styles.touchLayer} pointerEvents="box-none" {...swipePanResponder.panHandlers}>
        <Pressable
          style={styles.leftTouchZone}
          onPress={() => handleNavigate('left')}
          onPressIn={handlePressIn}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={FOCUS_PRESS_DELAY_MS}
        />
        <Pressable
          style={styles.rightTouchZone}
          onPress={() => handleNavigate('right')}
          onPressIn={handlePressIn}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={FOCUS_PRESS_DELAY_MS}
        />
        </View>

        <View style={styles.overlay} pointerEvents="box-none">
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  swipeableLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2B2B2B',
  },
  skeletonBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3A3A3A',
    zIndex: 1,
    overflow: 'hidden',
  },
  shimmerBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '45%',
  },
  shimmerGradient: {
    flex: 1,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    flexDirection: 'row',
  },
  leftTouchZone: {
    flex: 1,
  },
  rightTouchZone: {
    flex: 1,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    zIndex: 1,
  },
  indicatorsRow: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 3,
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  indicatorActive: {
    backgroundColor: '#E8A0BF',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
});

export default PetImageCarousel;
