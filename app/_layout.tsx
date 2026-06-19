import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {createContext, useEffect, useReducer, useRef, useState} from "react";
import Peer, {registerWebRTCGlobals} from "@/utils/peer-util";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {DataConnection} from "peerjs";
import {useFonts} from "expo-font";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {gameReducer, initialGameState} from "@/constants/game-state";

registerWebRTCGlobals();

export const ScreenPropsContext = createContext<Record<any, any>>({});

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const peerRef = useRef<typeof Peer>(null);
    const heartbeatRef = useRef(null);
    const connRef = useRef<DataConnection>(null);
    const [hostId, setHostId] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [playerUuid, setPlayerUuid] = useState<string | null>(null);
    const [availableBreeds, setAvailableBreeds] = useState<string[]>([]);
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    const hasConnectedRef = useRef<boolean>(false);

    useEffect(() => {
        const loadUuid = async () => {
            try {
                const storedUuid = await AsyncStorage.getItem('playerUuid');
                if (storedUuid) {
                    setPlayerUuid(storedUuid);
                }
            } catch (e) {
                console.error('Failed to load player uuid from storage', e);
            }
        };
        loadUuid();
    }, []);

    useFonts({
        'Pixel Chip XL': require('../assets/fonts/pixel_chip_xl_v1.0.0.ttf'),
    })

    const onDataCallbackRef = useRef<(data: unknown) => void>((data) => console.error('Data callback is missing.'));
    const onDataRef = useRef<(data: unknown) => void>((data) => onDataCallbackRef.current(data));

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <ScreenPropsContext.Provider value={{
                    peerRef,
                    heartbeatRef,
                    connRef,
                    onDataRef,
                    onDataCallbackRef,
                    hostId,
                    setHostId,
                    username,
                    setUsername,
                    playerUuid,
                    setPlayerUuid,
                    availableBreeds,
                    setAvailableBreeds,
                    gameState,
                    dispatch,
                    hasConnectedRef,
                }}>
                    <Stack>
                        <Stack.Screen name="index" options={{title: 'Lobby', headerShown: false}}/>
                        <Stack.Screen name="breed-selection" options={{title: 'Breed Selection', headerShown: false}}/>
                        <Stack.Screen name="cooow" options={{title: 'Cooow', headerShown: false,}}/>
                    </Stack>
                    <StatusBar style="auto"/>
                </ScreenPropsContext.Provider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
