import {SubNavigator} from '@/utils/navigationUtils';
import {BottomTabStackParamList} from '../bottomTabStackParamList/bottomTabStackParamList';

export type DrawerStackParamList = {
  BottomBarRoutes: SubNavigator<BottomTabStackParamList>; // Bottom tab stack
};
