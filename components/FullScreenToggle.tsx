import React, { useState, useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function FullScreenToggle() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (Platform.OS !== 'web' || isFullScreen) {
    return null;
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <View className="absolute top-4 right-4 z-[100]">
      <Pressable
        onPress={toggleFullScreen}
        className="bg-neutral-700/50 p-2 rounded-full active:bg-neutral-600 border border-white/20"
      >
        <Ionicons
          name={isFullScreen ? 'contract-outline' : 'expand-outline'}
          size={24}
          color="white"
        />
      </Pressable>
    </View>
  );
}
