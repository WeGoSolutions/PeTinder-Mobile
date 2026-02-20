import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { CustomHeader } from '../components/CustomHeader';

const ChatScreen = ({ navigation }) => {
  const route = useRoute();
  const title = route.params?.title || 'Chat';

  return (
    <View style={styles.root}>
      <CustomHeader onBack={() => navigation.goBack()} title={title} />
      <Text style={styles.text}>ChatScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});

export default ChatScreen;
