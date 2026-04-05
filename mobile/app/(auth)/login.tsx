import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Image, ScrollView } from "react-native";
import { useAuth } from "@/components/auth";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="flex-1 px-6 justify-center min-h-full">
        <View className="items-center mb-8 mt-20">
          <View className="w-24 h-24 rounded-3xl overflow-hidden bg-white flex items-center justify-center p-2 mb-4 shadow-lg">
            <Image source={require('../../assets/images/logo.jpg')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
          </View>
          <Text className="text-3xl font-bold text-white tracking-tight">Expense Tracker</Text>
          <Text className="mt-2 text-white/70 text-center">Sign in to continue</Text>
        </View>

      <View className="mt-8 gap-4">
        <View>
          <Text className="text-xs text-white/70">Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            placeholder="me@example.com"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        <View>
          <Text className="text-xs text-white/70">Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        {error ? (
          <View className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <Text className="text-red-200 text-sm">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          className="rounded-xl bg-white px-4 py-3 items-center"
        >
          <Text className="text-black font-medium">
            {loading ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
      </View>
      </View>
    </ScrollView>
  );
}

