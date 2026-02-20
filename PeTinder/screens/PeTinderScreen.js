import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavBar } from '../components/PeTinder/NavBar';

const PeTinderScreen = ({ navigation }) => {


  return (
    <View style={styles.root}>
      <NavBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    // justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});

export default PeTinderScreen;
