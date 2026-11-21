import { StyleSheet } from 'react-native';
import { tokens } from '@fade/design-tokens';

const RADIUS = tokens.radius;

export const feedbackStyles = StyleSheet.create({
  photo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.input.value,
    marginRight: 8,
  },
});
