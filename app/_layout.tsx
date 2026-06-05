import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {createContext, useRef, useState} from "react";
import Peer, {registerWebRTCGlobals} from "@/utils/peer-util";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {DataConnection} from "peerjs";
import {useFonts} from "expo-font";

registerWebRTCGlobals();

export const ScreenPropsContext = createContext<Record<any, any>>({});

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const peerRef = useRef<typeof Peer>(null);
    const heartbeatRef = useRef(null);
    const connRef = useRef<DataConnection>(null);
    const [hostId, setHostId] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [breed, setBreed] = useState<string>('');
    const hasConnectedRef = useRef<boolean>(false);

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
                    breed,
                    setBreed,
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
