import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Camera, Map, Settings, Home, Navigation } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              style={StyleSheet.absoluteFill}
              tint="light"
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, styles.androidTabBackground]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="object-detection"
        options={{
          title: 'Detect',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: 'Navigate',
          tabBarIcon: ({ color, size }) => (
            <Navigation size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
    paddingBottom: 20,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  androidTabBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
