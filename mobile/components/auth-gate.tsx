import { Redirect, useSegments } from "expo-router";
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "./auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, token } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator />
        <Text className="mt-3 text-white/70">Loading…</Text>
      </View>
    );
  }

  if (!token) {
    const inAuthGroup = segments[0] === "(auth)";
    if (inAuthGroup) return <>{children}</>;
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}

