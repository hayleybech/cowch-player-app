import React from 'react';
import {View, Text, useWindowDimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import classNames from "classnames";

export type Direction = 'up' | 'down' | 'right' | 'left';

interface SwipeAreaProps {
    onSwipe: (direction: Direction) => void;
    disabled?: boolean;
    isDead?: boolean;
}

export const SwipeArea: React.FC<SwipeAreaProps> = ({onSwipe, disabled, isDead}) => {
    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const swipeGesture = Gesture.Pan()
        .onEnd((event) => {
            if (disabled) return;

            const {translationX, translationY} = event;
            const threshold = 30;

            if (Math.abs(translationX) > Math.abs(translationY)) {
                if (translationX > threshold) {
                    onSwipe('right');
                } else if (translationX < -threshold) {
                    onSwipe('left');
                }
            } else {
                if (translationY > threshold) {
                    onSwipe('down');
                } else if (translationY < -threshold) {
                    onSwipe('up');
                }
            }
        }).runOnJS(true);

    return (
        <GestureDetector gesture={swipeGesture}>
            <View
                className={classNames('p-4',
                    isLandscape ? 'h-full w-1/2' : 'w-full h-1/2',
                )}>
                <View
                    className={classNames("h-full w-full border-2 border-dashed border-neutral-400 rounded-3xl flex items-center justify-center bg-neutral-600 relative",
                        isDead && "bg-red-50 border-red-200")}>
                    {!isDead ? (
                        <>
                            <MaterialCommunityIcons name="chevron-up" size={32} color="#d4d4d4" className="absolute top-4"/>
                            <MaterialCommunityIcons name="chevron-down" size={32} color="#d4d4d4"
                                                    className="absolute bottom-4"/>
                            <MaterialCommunityIcons name="chevron-left" size={32} color="#d4d4d4"
                                                    className="absolute left-4"/>
                            <MaterialCommunityIcons name="chevron-right" size={32} color="#d4d4d4"
                                                    className="absolute right-4"/>
                            <Text className="text-neutral-400 font-bold text-lg">Swipe to Move</Text>
                        </>
                    ) : (
                        <Text className="text-red-400 font-bold text-lg text-center px-4">You are dead!{"\n"}Wait for the next round.</Text>
                    )}
                </View>
            </View>
        </GestureDetector>
    );
};
