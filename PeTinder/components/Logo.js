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

export const LogoWithText = ({ fontSize = 28, iconSize = 45 }) => {
    return (
        <View style={styles.container}>
            <Image 
                source={require('../assets/Logo.png')} 
                style={[styles.image, { width: iconSize, height: iconSize }]}
            />
            <Text style={[styles.text, { fontSize }]}>
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
        marginRight: 8,
    },
    text: {
        fontFamily: 'Poppins_700Bold',
        color: '#1A1A1A',
    },
});