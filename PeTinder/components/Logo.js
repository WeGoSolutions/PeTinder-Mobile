import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export const Logo = () => {
    return (
        <View style={styles.container}>
            <Image 
                source={require('../assets/Logo.png')} 
                style={styles.image} 
            />
        </View>
    );
}

export const LogoWithText = () => {
    return (
        <View style={styles.container}>
            <Image 
                source={require('../assets/Logo.png')} 
                style={styles.image} 
            />
            <Text style={styles.text}>
                PeTinder
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 45,
        height: 46,
        marginRight: 8,
    },
    text: {
        fontSize: 28,
        fontFamily: 'Poppins_700Bold',
        color: '#1A1A1A',
    },
});