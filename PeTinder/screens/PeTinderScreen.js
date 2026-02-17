import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PeTinderScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>PeTinder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});

export default PeTinderScreen;
