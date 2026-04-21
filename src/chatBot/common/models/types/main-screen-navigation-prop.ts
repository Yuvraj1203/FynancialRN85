import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './root-stack-param-list';

export type MainScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Chat'
>;
