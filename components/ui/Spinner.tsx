import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Image } from 'expo-image';

export function Spinner({ className }: { className?: string }) {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        
        animation.start();

        return () => animation.stop();
    }, [rotateAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View className={className}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Image
                    source={require('@/assets/images/spinner.png')}
                    style={{ width: 64, height: 64 }}
                    contentFit="contain"
                />
            </Animated.View>
        </View>
    );
}
