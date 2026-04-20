import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from './root-stack-param-list';

export type MainScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Chat'
>;
