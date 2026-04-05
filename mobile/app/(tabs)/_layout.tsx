import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { Image, View, Text } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#000", borderTopColor: "rgba(255,255,255,0.12)" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 32, height: 32, backgroundColor: 'white', borderRadius: 10, padding: 2 }}>
                <Image source={require('../../assets/images/logo.jpg')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Expense Tracker</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color }) => <TabBarIcon name="credit-card" color={color} />,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 32, height: 32, backgroundColor: 'white', borderRadius: 10, padding: 2 }}>
                <Image source={require('../../assets/images/logo.jpg')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Expenses</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 32, height: 32, backgroundColor: 'white', borderRadius: 10, padding: 2 }}>
                <Image source={require('../../assets/images/logo.jpg')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Analytics</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 32, height: 32, backgroundColor: 'white', borderRadius: 10, padding: 2 }}>
                <Image source={require('../../assets/images/logo.jpg')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Settings</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
