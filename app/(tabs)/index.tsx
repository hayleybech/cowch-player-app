import {Platform, ScrollView, Text, View} from 'react-native';
import "@/assets/css/global.css"

import { Image } from 'expo-image';
import Coffee from "@/components/coffee";

export default function HomeScreen() {
  return (
    <ScrollView className="bg-white">
      <View className="px-4 py-8 flex gap-8">
        <Image source={require('@/assets/images/cowch-logo.png')} className="h-[49px] w-[200px]" />

        <View>
          <Text className="font-bold text-lg">Scan QR Code</Text>
          <Text>
            Edit <Text>app/(tabs)/index.tsx</Text> to see changes.
            Press{' '}
            <Text>
              {Platform.select({
                ios: 'cmd + d',
                android: 'cmd + m',
                web: 'F12',
              })}
            </Text>{' '}
            to open developer tools.
          </Text>
        </View>

        <Coffee />
      </View>

    </ScrollView>
  );
}
