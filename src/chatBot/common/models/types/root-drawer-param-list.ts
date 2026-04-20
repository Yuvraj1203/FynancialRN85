import { NavigatorScreenParams } from '@react-navigation/native';

import { RootStackParamList } from './root-stack-param-list';

export type DrawerParamList = {
  Main: NavigatorScreenParams<RootStackParamList>;
};
