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
type GameNotification = { type: 'paused' } | { type: 'resumed' } | { type: 'started' } | { type: 'changed_direction', payload: Direction } | { type: 'powerup_stored' } | { type: 'powerup_used' } | { type: 'died' } | { type: 'game_over', payload: { winner: string } };

export default function CooowScreen() {
    const props = useContext(ScreenPropsContext);
    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('initial');
    const router = useRouter();
    const [isPaused, setIsPaused] = useState<boolean>(true);
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [currentDirection, setCurrentDirection] = useState<Direction | undefined>(undefined);
    const [hasPowerup, setHasPowerup] = useState<boolean>(false);
    const [isDead, setIsDead] = useState<boolean>(false);
    const [isGameEnded, setIsGameEnded] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!props.connRef.current) {
            return;
        }

        props.onDataCallbackRef.current = (data: unknown) => {
            const action = data as GameNotification;

            console.log('action', action);

            if (action.type === 'paused') {
                setIsPaused(true);
            }
            if (action.type === 'resumed') {
                setIsPaused(false);
            }
            if (action.type === 'started') {
                setHasStarted(true);
                setIsPaused(false);
                setIsGameEnded(false);
                setIsDead(false);
                setWinner(undefined);
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
            if (action.type === 'game_over') {
                setIsGameEnded(true);
                setWinner(action.payload.winner);
            }
        };

        props.connRef.current.on('close', () => {
            setConnStatus('reconnecting');
            router.navigate('/');
        })


    }, []);

    const requestPauseOrStart = useCallback(() => {
        if (!props.connRef.current) {
            return;
        }

        if (isGameEnded) {
            props.connRef.current.send({
                type: 'start_game',
            })
            return;
        }

        props.connRef.current.send({
            type: hasStarted ? 'pause' : 'start_game',
        })
    }, [hasStarted, props.connRef, isGameEnded])

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
                        <Button onPress={requestPauseOrStart} disabled={!props.connRef.current || (isDead && !isGameEnded)}>
                            {isGameEnded ? 'Play Again' : (!hasStarted ? 'Start Game' : (isPaused ? 'Resume' : 'Pause'))}
                        </Button>
                    </View>

                    {isDead && (
                        <View className="bg-red-500 p-2 rounded-lg items-center">
                            <Text className="text-white font-bold text-lg">YOU DIED</Text>
                        </View>
                    )}

                    {isGameEnded && (
                        <View className="bg-blue-500 p-4 rounded-lg items-center shadow-lg">
                            <Text className="text-white font-bold text-2xl mb-2">GAME OVER</Text>
                            <Text className="text-white text-center font-bold text-xl mb-1">
                                {winner === props.usernameRef.current ? 'YOU WON 🏆' : `WINNER: ${winner}`}
                            </Text>
                            <Text className="text-white text-center">The game has ended. Ready for another round?</Text>
                        </View>
                    )}

                    <View className="gap-2 grow flex-1">
                        <Button onPress={usePowerup} disabled={!props.connRef.current || isPaused || !hasPowerup || isDead || isGameEnded} className="grow">
                            Use
                        </Button>
                        <Button onPress={drop} disabled={!props.connRef.current || isPaused || !hasPowerup || isDead || isGameEnded} className="grow">
                            Drop Trap
                        </Button>
                    </View>
                </View>

                <SwipeArea onSwipe={move} disabled={isPaused || isDead || isGameEnded} isDead={isDead || isGameEnded}/>
            </View>

        </View>
    );
}
