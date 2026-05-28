import {Pressable, Text, View, useWindowDimensions} from 'react-native';
import "@/assets/css/global.css"

import {Image} from 'expo-image';
import {useCallback, useContext, useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import {ScreenPropsContext} from "@/app/_layout";
import * as Haptics from 'expo-haptics';
import {Direction, SwipeArea} from "@/components/SwipeArea";

import {useRouter} from "expo-router";

export type CowBreed = 'holstein-friesian' | 'angus' | 'hereford' | 'highland';
type ConnectionStatus = 'initial' | 'open' | 'closed' | 'reconnecting';
type GameNotification = { type: 'paused' } | { type: 'resumed' } | { type: 'changed_direction', payload: Direction } | { type: 'powerup_stored' } | { type: 'powerup_used' } | { type: 'died' };

export default function CooowScreen() {
    const props = useContext(ScreenPropsContext);
    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('initial');
    const router = useRouter();
    const [isPaused, setIsPaused] = useState<boolean>(true);
    const [currentDirection, setCurrentDirection] = useState<Direction | undefined>(undefined);
    const [hasPowerup, setHasPowerup] = useState<boolean>(false);
    const [isDead, setIsDead] = useState<boolean>(false);

    useEffect(() => {
        if (!props.connRef.current) {
            return;
        }

        props.onDataCallbackRef.current = (data: unknown) => {
            const action = data as GameNotification;

            if (action.type === 'paused') {
                setIsPaused(true);
            }
            if (action.type === 'resumed') {
                setIsPaused(false);
            }
            if (action.type === 'changed_direction') {
                setCurrentDirection(action.payload);
            }
            if (action.type === 'powerup_stored') {
                setHasPowerup(true);
            }
            if (action.type === 'powerup_used') {
                setHasPowerup(false);
            }
            if (action.type === 'died') {
                setIsDead(true);
            }
        };

        props.connRef.current.on('close', () => {
            setConnStatus('reconnecting');
            router.navigate('/');
        })


    }, []);

    const requestPause = useCallback(() => {
        if (!props.connRef.current) {
            return;
        }

        props.connRef.current.send({
            type: 'pause',
        })
    }, [])

    const drop = useCallback(() => {
        if (!props.connRef.current) {
            return;
        }

        props.connRef.current.send({
            type: 'drop_powerup',
        });
        setHasPowerup(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [props.connRef]);

    const usePowerup = useCallback(() => {
        if (!props.connRef.current) {
            return;
        }

        props.connRef.current.send({
            type: 'use_powerup',
        });
        setHasPowerup(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [props.connRef]);

    const move = useCallback((direction: Direction) => {
        if (!props.connRef.current) {
            return;
        }

        props.connRef.current.send({
            type: 'move',
            payload: direction,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [props.connRef]);

    return (
        <View className="bg-white flex-1">
            <View className={`flex-1 justify-between ${isLandscape ? 'flex-row items-stretch gap-4' : 'flex-col'}`}>
                <View className={`gap-8 p-4 grow ${isLandscape ? 'flex-1' : ''}`}>

                    <View className="flex-row items-center gap-2 justify-between">
                        <View>
                            <Pressable onPress={() => router.replace('/')}>
                                <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]"/>
                            </Pressable>
                            <Text className="font-bold">{props.usernameRef.current}</Text>
                            {!isLandscape && (
                                <Text className="text-neutral-400 text-sm italic">Best played in landscape 🔄</Text>
                            )}
                        </View>
                        <Button onPress={requestPause} disabled={!props.connRef.current || isDead}>
                            {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                    </View>

                    {isDead && (
                        <View className="bg-red-500 p-2 rounded-lg items-center">
                            <Text className="text-white font-bold text-lg">YOU DIED</Text>
                        </View>
                    )}

                    <View className="gap-2 grow flex-1">
                        <Button onPress={usePowerup} disabled={!props.connRef.current || isPaused || !hasPowerup || isDead} className="grow">
                            Use
                        </Button>
                        <Button onPress={drop} disabled={!props.connRef.current || isPaused || !hasPowerup || isDead} className="grow">
                            Drop Trap
                        </Button>
                    </View>
                </View>

                <SwipeArea onSwipe={move} disabled={isPaused || isDead} isDead={isDead}/>
            </View>

        </View>
    );
}
