import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from "@/components/ui/Button";

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
            <Text className="text-white font-pixel-chip text-shadow text-6xl mb-2 text-center">GAME OVER</Text>
            <Text className="text-white text-center font-pixel-chip text-shadow text-3xl mb-4">
                {props.winner === props.username ? "YOU WON 🏆" : `WINNER: ${props.winner}`}
            </Text>
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
            <Text className="text-white font-pixel-chip text-shadow text-6xl mb-4 text-center">YOU DIED</Text>
            <Text className="text-white text-xl text-center font-pixel-chip text-shadow">Wait for the next round...</Text>
        </View>
    );
}
