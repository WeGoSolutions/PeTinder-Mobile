import React from 'react';
import { Pressable, StyleSheet, Image, View } from 'react-native';

const DEFAULT_IMAGE = require('../assets/generic-user-icon.png');

const ImageInput = ({
  value,
  onPress,
  size = 220,
  disabled = false,
  defaultSource = DEFAULT_IMAGE,
  style,
  imageStyle,
}) => {
  const hasValue = Boolean(value);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: pressed && !disabled ? 0.88 : 1,
        },
        style,
      ]}
    >
      {hasValue ? (
        <Image
          source={{ uri: value }}
          style={[
            styles.selectedImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Image
            source={defaultSource}
            style={[
              styles.defaultIcon,
              {
                width: size * 0.9,
                height: size * 0.9,
              },
            ]}
            resizeMode="contain"
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#000000',
    borderStyle: 'dashed',
    backgroundColor: '#CE9AB2',
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImage: {
    backgroundColor: '#CE9AB2',
  },
});

export default ImageInput;
