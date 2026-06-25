import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// On web, manually inject @font-face CSS rules for icon fonts.
// Expo's built-in font loading uses paths with '@' characters
// that Firebase Hosting cannot serve properly (URL encodes them).
// Our deploy script copies the fonts to /fonts/ and we reference
// them from there instead.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const fontNames = [
    'Ionicons',
    'MaterialCommunityIcons',
    'MaterialIcons',
    'FontAwesome',
    'FontAwesome5_Brands',
    'FontAwesome5_Regular',
    'FontAwesome5_Solid',
    'Feather',
    'AntDesign',
    'Entypo',
    'EvilIcons',
    'Foundation',
    'Octicons',
    'SimpleLineIcons',
  ];

  const fontFaceRules = fontNames
    .map((name) => `@font-face { font-family: '${name}'; src: url('/fonts/${name}.ttf') format('truetype'); }`)
    .join('\n');

  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(fontFaceRules));
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
