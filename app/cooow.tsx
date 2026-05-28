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

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('open');
    const router = useRouter();
    const [isPaused, setIsPaused] = useState<boolean>(true);
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [currentDirection, setCurrentDirection] = useState<Direction | undefined>(undefined);
    const [hasPowerup, setHasPowerup] = useState<boolean>(false);
    const [isDead, setIsDead] = useState<boolean>(false);
    const [isGameEnded, setIsGameEnded] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | undefined>(undefined);

    const connect = useCallback(() => {
        if (!props.peerRef?.current || !props.hostIdRef.current || !props.usernameRef.current) {
            return;
        }

        const conn = props.peerRef.current.connect(`COWCH-${props.hostIdRef.current}`);

        conn.on('open', function () {
            console.log('host connection opened (reconnected)');

            props.connRef.current = conn;
            conn.on('data', props.onDataRef.current);

            conn.send({
                type: 'connect',
                payload: {username: props.usernameRef.current},
            })

            setConnStatus('open');
        });

        conn.on('error', (error: string) => {
            console.log('host connection error', error);
        });

        conn.on('disconnected', () => {
            console.log('host disconnected');
            setConnStatus('reconnecting');
        });

        conn.on('close', () => {
            console.log('host closed');
            setConnStatus('reconnecting');
        });

    }, [props.connRef, props.hostIdRef, props.onDataRef, props.peerRef, props.usernameRef]);

    useEffect(() => {
        let timeout: any;
        if (connStatus === 'reconnecting') {
            timeout = setTimeout(() => {
                connect();
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [connStatus, connect]);

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

        const handleClose = () => {
            setConnStatus('reconnecting');
        };

        props.connRef.current.on('close', handleClose);
        props.connRef.current.on('disconnected', handleClose);

        return () => {
            if (props.connRef.current) {
                props.connRef.current.off('close', handleClose);
                props.connRef.current.off('disconnected', handleClose);
            }
        }
    }, [props.connRef]);

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
        <View className="bg-white flex-1 relative">
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

            {isDead && !isGameEnded && (
                <View className="absolute inset-0 bg-red-500/80 z-50 justify-center items-center p-4">
                    <Text className="text-white font-bold text-6xl mb-4 text-center">YOU DIED</Text>
                    <Text className="text-white text-xl text-center">Wait for the next round...</Text>
                </View>
            )}

            {isGameEnded && (
                <View className="absolute inset-0 bg-blue-600/90 z-50 justify-center items-center p-6">
                    <Text className="text-white font-bold text-6xl mb-2 text-center">GAME OVER</Text>
                    <Text className="text-white text-center font-bold text-3xl mb-4">
                        {winner === props.usernameRef.current ? 'YOU WON 🏆' : `WINNER: ${winner}`}
                    </Text>
                    <Text className="text-white text-center text-lg mb-8">The game has ended. Ready for another round?</Text>
                    <Button onPress={requestPauseOrStart} className="w-full max-w-xs">
                        Play Again
                    </Button>
                </View>
            )}

            {connStatus === 'reconnecting' && (
                <View className="absolute inset-0 bg-orange-500/90 z-[60] justify-center items-center p-6">
                    <Text className="text-white font-bold text-6xl mb-2 text-center">CONNECTION LOST</Text>
                    <Text className="text-white text-center text-lg mb-8">Trying to reconnect...</Text>
                </View>
            )}

        </View>
    );
}
