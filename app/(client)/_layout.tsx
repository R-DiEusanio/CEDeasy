import { Tabs } from 'expo-router'
import { Clock, CheckCircle } from 'lucide-react-native'

const PRIMARY = '#7c3aed'
const MUTED = '#94a3b8'

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: { borderTopColor: '#e2e8f0' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Da approvare',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="approved"
        options={{
          title: 'Approvati',
          tabBarIcon: ({ color, size }) => <CheckCircle color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
