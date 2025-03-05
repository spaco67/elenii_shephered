import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  StyleSheet, 
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AccessibleTouchableProps extends TouchableOpacityProps {
  feedbackType?: 'light' | 'medium' | 'heavy';
  isVibrationEnabled?: boolean;
}

const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  children,
  feedbackType = 'light',
  isVibrationEnabled = true,
  onPress,
  style,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (Platform.OS !== 'web' && isVibrationEnabled) {
      switch (feedbackType) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }
    
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.touchable, style]}
      onPress={handlePress}
      accessible={true}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    minHeight: 44, // Minimum touch target size for accessibility
    justifyContent: 'center',
  },
});

export default AccessibleTouchable;