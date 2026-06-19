import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from "@/components/ui/Button";
import {Image} from "expo-image";

export function ReconnectingOverlay() {
    return (
        <View className="absolute inset-0 bg-orange-500/90 z-[60] justify-center items-center p-6">
            <Text className="text-white font-pixel-chip text-shadow text-6xl mb-2 text-center">RECONNECTING</Text>
            <Text className="text-white text-center text-lg mb-8 font-pixel-chip text-shadow">Trying to reconnect...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
}

export function ConnectingOverlay() {
    return (
        <View className="absolute inset-0 bg-orange-500/90 z-50 justify-center items-center p-6">
            <Text className="text-white font-pixel-chip text-shadow text-6xl mb-2 text-center">CONNECTING</Text>
            <Text className="text-white text-center text-lg mb-8 font-pixel-chip text-shadow">Trying to connect...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
}

export function GameEndedOverlay(props: { winner: string | undefined, username: string, onPress: () => void }) {
    return (
        <View className="absolute inset-0 bg-blue-600/90 z-50 justify-center items-center p-6">

            {props.winner === props.username ? (
                <View className="flex flex-row items-center gap-2 mb-4">
                    <Image
                        source={require('@/assets/images/trophy16x.png')}
                        className="aspect-[1/1] h-16 shrink"
                        style={{ width: 64, height: 64 }}
                    />
                    <Text className="text-white font-pixel-chip text-shadow text-6xl">YOU WON</Text>
                </View>
                ) : (
                    <>
                        <Text className="text-white font-pixel-chip text-shadow text-6xl mb-2 text-center">GAME OVER</Text>

                        <View className="flex flex-row items-center gap-2 mb-4">
                            <Image
                                source={require('@/assets/images/trophy16x.png')}
                                className="aspect-[1/1] h-8 shrink"
                                style={{ width: 32, height: 32 }}
                            />
                            <Text className="text-white text-center font-pixel-chip text-shadow text-3xl">
                                WINNER: {props.winner}
                            </Text>
                        </View>
                    </>
                )}

            <Text className="text-white text-center text-lg mb-8 font-pixel-chip text-shadow">
                The game has ended. Ready for another round?
            </Text>
            <Button onPress={props.onPress} className="w-full max-w-xs">
                Play Again
            </Button>
        </View>
    );
}

export function YouDiedOverlay() {
    return (
        <View className="absolute inset-0 bg-red-500/80 z-50 justify-center items-center p-4">
            <View className="flex flex-row items-center gap-2 mb-4">
                <Image
                    source={require('@/assets/images/skull16x.png')}
                    className="aspect-[1/1] h-16 shrink"
                    style={{ width: 64, height: 64 }}
                />
                <Text className="text-white font-pixel-chip text-shadow text-6xl">YOU DIED</Text>
            </View>
            <Text className="text-white text-xl text-center font-pixel-chip text-shadow">Wait for the next round...</Text>
        </View>
    );
}
