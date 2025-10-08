import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {createContext, useRef} from "react";
import Peer, {DataConnection} from "peerjs";

export const unstable_settings = {
    anchor: '(tabs)',
};
export const ScreenPropsContext = createContext<Record<any, any>>({});

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const peerRef = useRef<Peer>(null);
    const connRef = useRef<DataConnection>(null);

    const onDataCallbackRef = useRef<(data: unknown) => void>((data) => console.error('Data callback is missing.'));
    const onDataRef = useRef<(data: unknown) => void>((data) => onDataCallbackRef.current(data));

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ScreenPropsContext.Provider value={{
                peerRef,
                connRef,
                onDataRef,
                onDataCallbackRef,
            }}>
                <Stack>
                    <Stack.Screen name="index" options={{title: 'Lobby', headerShown: false}}/>
                    <Stack.Screen name="cooow" options={{title: 'Cooow', headerShown: false,}}/>
                    <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                    <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
                </Stack>
                <StatusBar style="auto"/>
            </ScreenPropsContext.Provider>
        </ThemeProvider>
    );
}
