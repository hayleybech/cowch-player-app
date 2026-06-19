import {Pressable, Text, View, useWindowDimensions} from 'react-native';
import "@/assets/css/global.css"
import {Image} from 'expo-image';

import {useCallback, useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";
import * as Haptics from 'expo-haptics';
import {Direction, SwipeArea} from "@/components/SwipeArea";
import {usePeer} from "@/hooks/use-peer";
import {BREED_DATA} from "@/constants/breeds";
import {useRouter} from "expo-router";
import {ConnectingOverlay, GameEndedOverlay, ReconnectingOverlay, YouDiedOverlay} from "@/components/Overlays";

type GameNotification = { type: 'paused' } | { type: 'resumed' } | { type: 'started' } | { type: 'powerup_stored' } | {
    type: 'powerup_used'
} | { type: 'died' } | {
    type: 'game_over',
    payload: { winner: string }
};

export default function CooowScreen() {
    const {props, sendData, connectToHost, setOnDataReceived, clearSession} = usePeer();
    const {gameState, dispatch} = props;
    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const router = useRouter();
    const {isPaused, hasStarted, hasPowerup, isDead, isGameEnded, winner} = gameState;

    const handleClearSession = useCallback(() => {
        clearSession();
        router.replace('/');
    }, [clearSession, router]);

    useEffect(() => {
        setOnDataReceived((data: any) => {
            if (data?.type === 'connected') {
                if (!data.payload?.selectedBreed) {
                    router.navigate('/breed-selection');
                }
            }

            const action = data as GameNotification;

            console.log('action', action);

            if (action.type === 'paused') {
                dispatch({type: 'PAUSE'});
            }
            if (action.type === 'resumed') {
                dispatch({type: 'RESUME'});
            }
            if (action.type === 'started') {
                dispatch({type: 'START_GAME'});
            }
            if (action.type === 'powerup_stored') {
                dispatch({type: 'POWERUP_STORED'});
            }
            if (action.type === 'powerup_used') {
                dispatch({type: 'POWERUP_USED'});
            }
            if (action.type === 'died') {
                dispatch({type: 'DIED'});
            }
            if (action.type === 'game_over') {
                dispatch({type: 'GAME_OVER', payload: action.payload});
            }
        });
    }, [dispatch, setOnDataReceived]);

    const requestPauseOrStart = useCallback(() => {
        if (isGameEnded) {
            sendData({
                type: 'start_game',
            })
            return;
        }

        sendData({
            type: hasStarted ? 'pause' : 'start_game',
        })
    }, [hasStarted, isGameEnded, sendData])

    const drop = useCallback(() => {
        sendData({
            type: 'drop_powerup',
        });
        dispatch({type: 'POWERUP_USED'});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [dispatch, sendData]);

    const usePowerup = useCallback(() => {
        sendData({
            type: 'use_powerup',
        });
        dispatch({type: 'POWERUP_USED'});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [dispatch, sendData]);

    const move = useCallback((direction: Direction) => {
        sendData({
            type: 'move',
            payload: direction,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [sendData]);

    return (
        <View className="bg-neutral-800 flex-1 relative">
            <View className={`flex-1 justify-between ${isLandscape ? 'flex-row items-stretch gap-4' : 'flex-col'}`}>
                <View className={`gap-8 p-4 grow ${isLandscape ? 'flex-1' : ''}`}>

                    <View className="flex-row items-center gap-2 justify-between">
                        <View>
                            <Pressable onPress={handleClearSession}>
                                <Text className="text-white text-4xl italic font-pixel-chip text-shadow">cowch</Text>
                            </Pressable>
                        </View>
                        <View className="flex-row items-center justify-start gap-1">
                            {gameState.selectedBreed && (
                                <View>
                                    <Image
                                        source={BREED_DATA.find(b => b.id === gameState.selectedBreed)?.img}
                                        className="aspect-[2/1] h-8 shrink"
                                        style={{ width: 64, height: 32 }}
                                    />
                                </View>
                            )}
                            <View>
                                <Text className="font-pixel-chip text-shadow text-white text-lg">
                                    {props.username}
                                </Text>
                            </View>
                        </View>
                        <Button onPress={requestPauseOrStart}
                                disabled={!props.connRef.current || (hasStarted && !isGameEnded && isDead)}>
                            {isGameEnded ? 'Restart' : (!hasStarted ? 'Start' : (isPaused ? 'Resume' : 'Pause'))}
                        </Button>
                    </View>

                    {!isLandscape && (
                        <View className="flex items-center justify-center flex-row gap-4 p-2 border-2 border-blue-500">
                            <View className="bg-white p-1 ">
                                <Image
                                    source={require('@/assets/images/landscape.png')}
                                    className="aspect-[1/1] h-8 shrink"
                                    style={{ width: 32, height: 32 }}
                                />
                            </View>
                            <Text className="text-blue-500 text-xl font-pixel-chip text-shadow">Best played in landscape</Text>

                        </View>
                    )}

                    <View className="gap-2 grow flex-1">
                        <Button
                            onPress={usePowerup}
                            disabled={!props.connRef.current || isPaused || !hasPowerup || isDead || isGameEnded}
                            className="grow"
                            textSize="text-2xl"
                        >
                            Use
                        </Button>
                        <Button
                            onPress={drop}
                            disabled={!props.connRef.current || isPaused || !hasPowerup || isDead || isGameEnded}
                            className="grow"
                            textSize="text-2xl"
                        >
                            Drop Trap
                        </Button>
                    </View>
                </View>

                <SwipeArea onSwipe={move} disabled={isPaused || (isDead && hasStarted) || isGameEnded} isDead={hasStarted && !isGameEnded && isDead}/>
            </View>

            {isDead && hasStarted && !isGameEnded &&
                <YouDiedOverlay/>
            }

            {isGameEnded &&
                <GameEndedOverlay winner={winner} username={props.username} onPress={requestPauseOrStart}/>
            }

            {gameState.isConnecting && (props.hasConnectedRef.current ? <ReconnectingOverlay/> : <ConnectingOverlay/>)}

        </View>
    );
}
