import {Pressable, Text, View, useWindowDimensions} from 'react-native';
import "@/assets/css/global.css"

import {useCallback, useEffect, useReducer, useState} from "react";
import {Button} from "@/components/ui/Button";
import * as Haptics from 'expo-haptics';
import {Direction, SwipeArea} from "@/components/SwipeArea";
import {usePeer} from "@/hooks/use-peer";

import {useRouter} from "expo-router";

export type CowBreed = 'holstein-friesian' | 'angus' | 'hereford' | 'highland';
type ConnectionStatus = 'initial' | 'open' | 'closed' | 'reconnecting';
type GameNotification = { type: 'paused' } | { type: 'resumed' } | { type: 'started' } | { type: 'powerup_stored' } | {
    type: 'powerup_used'
} | { type: 'died' } | {
    type: 'game_over',
    payload: { winner: string }
};

interface GameState {
    isPaused: boolean;
    hasStarted: boolean;
    hasPowerup: boolean;
    isDead: boolean;
    isGameEnded: boolean;
    winner: string | undefined;
}

const initialGameState: GameState = {
    isPaused: true,
    hasStarted: false,
    hasPowerup: false,
    isDead: false,
    isGameEnded: false,
    winner: undefined,
};

type GameAction =
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'START_GAME' }
    | { type: 'POWERUP_STORED' }
    | { type: 'POWERUP_USED' }
    | { type: 'DIED' }
    | { type: 'GAME_OVER', payload: { winner: string } };

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'PAUSE':
            return {...state, isPaused: true};
        case 'RESUME':
            return {...state, isPaused: false};
        case 'START_GAME':
            return {
                ...state,
                hasStarted: true,
                isPaused: false,
                isGameEnded: false,
                isDead: false,
                winner: undefined,
            };
        case 'POWERUP_STORED':
            return {...state, hasPowerup: true};
        case 'POWERUP_USED':
            return {...state, hasPowerup: false};
        case 'DIED':
            return {...state, isDead: true};
        case 'GAME_OVER':
            return {
                ...state,
                isGameEnded: true,
                winner: action.payload.winner,
            };
        default:
            return state;
    }
}

export default function CooowScreen() {
    const {props, sendData, connectToHost, setOnDataReceived} = usePeer();
    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;

    const [connStatus, setConnStatus] = useState<ConnectionStatus>('open');
    const router = useRouter();
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    const {isPaused, hasStarted, hasPowerup, isDead, isGameEnded, winner} = gameState;

    const connect = useCallback(() => {
        if (!props.hostId || !props.username) {
            return;
        }

        const conn = connectToHost(props.hostId, props.username);
        if (conn) {
            conn.on('open', () => setConnStatus('open'));
            conn.on('disconnected', () => setConnStatus('reconnecting'));
            conn.on('close', () => setConnStatus('reconnecting'));
        }

    }, [connectToHost, props.hostId, props.username]);

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
        setOnDataReceived((data: unknown) => {
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

        const handleClose = () => {
            setConnStatus('reconnecting');
        };

        props.connRef.current?.on('close', handleClose);
        props.connRef.current?.on('disconnected', handleClose);

        return () => {
            if (props.connRef.current) {
                props.connRef.current.off('close', handleClose);
                props.connRef.current.off('disconnected', handleClose);
            }
        }
    }, [props.connRef, setOnDataReceived]);

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
    }, [sendData]);

    const usePowerup = useCallback(() => {
        sendData({
            type: 'use_powerup',
        });
        dispatch({type: 'POWERUP_USED'});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [sendData]);

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
                            <Pressable onPress={() => router.replace('/')}>
                                <Text className="text-white text-4xl italic font-pixel-chip text-shadow">cowch</Text>
                            </Pressable>
                            <Text
                                className="font-pixel-chip text-shadow text-white text-lg">{props.username}</Text>
                        </View>
                        <Button onPress={requestPauseOrStart}
                                disabled={!props.connRef.current || (isDead && !isGameEnded)}>
                            {isGameEnded ? 'Play Again' : (!hasStarted ? 'Start Game' : (isPaused ? 'Resume' : 'Pause'))}
                        </Button>
                    </View>

                    {!isLandscape && (
                        <View className="flex items-center">
                            <Text className="text-blue-600 text-xl font-pixel-chip text-shadow">Best played in landscape
                                🔄</Text>
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

                <SwipeArea onSwipe={move} disabled={isPaused || isDead || isGameEnded} isDead={isDead || isGameEnded}/>
            </View>

            {isDead && !isGameEnded && <YouDiedOverlay/>}

            {isGameEnded &&
                <GameEndedOverlay winner={winner} props={props} onPress={requestPauseOrStart}/>
            }

            {connStatus === 'reconnecting' && <ReconnectingOverlay/>}

        </View>
    );
}

function ReconnectingOverlay() {
    return <View className="absolute inset-0 bg-orange-500/90 z-[60] justify-center items-center p-6">
        <Text className="text-white font-pixel-chip text-shadow text-6xl mb-2 text-center">CONNECTION LOST</Text>
        <Text className="text-white text-center text-lg mb-8 font-pixel-chip text-shadow">Trying to reconnect...</Text>
    </View>;
}

function GameEndedOverlay(props: { winner: string | undefined, props: Record<any, any>, onPress: () => void }) {
    return <View className="absolute inset-0 bg-blue-600/90 z-50 justify-center items-center p-6">
        <Text className="text-white font-pixel-chip text-shadow text-6xl mb-2 text-center">GAME OVER</Text>
        <Text className="text-white text-center font-pixel-chip text-shadow text-3xl mb-4">
            {props.winner === props.props.username ? "YOU WON 🏆" : `WINNER: ${props.winner}`}
        </Text>
        <Text className="text-white text-center text-lg mb-8 font-pixel-chip text-shadow">The game has ended. Ready for
            another round?</Text>
        <Button onPress={props.onPress} className="w-full max-w-xs">
            Play Again
        </Button>
    </View>;
}

function YouDiedOverlay() {
    return <View className="absolute inset-0 bg-red-500/80 z-50 justify-center items-center p-4">
        <Text className="text-white font-pixel-chip text-shadow text-6xl mb-4 text-center">YOU DIED</Text>
        <Text className="text-white text-xl text-center font-pixel-chip text-shadow">Wait for the next round...</Text>
    </View>;
}