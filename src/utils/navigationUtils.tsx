import {
  BottomTabStackParamList,
  ChatBotStackParamList,
  DrawerStackParamList,
  RootStackParamList,
} from '@/navigators/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ParamListBase,
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Log from './logger';

export type SubNavigator<T extends ParamListBase> = {
  screen: keyof T;
  params?: T[keyof T];
};

// global hook to navigate to any screen
export const useAppNavigation: () => NativeStackNavigationProp<RootStackParamList> =
  useNavigation;

// Add all param lists for useRoute to work Properly
export type AllStackParamList = RootStackParamList &
  DrawerStackParamList &
  BottomTabStackParamList &
  ChatBotStackParamList;

// global hook to access param of any screen
export const useAppRoute = <T extends keyof AllStackParamList>(
  screenName: T,
) => {
  return useRoute<RouteProp<AllStackParamList, T>>();
};

export const handleGoBack = async (
  navigation: NativeStackNavigationProp<RootStackParamList>,
) => {
  if (navigation.canGoBack()) {
    navigation.goBack(); // navigate back
  }
};

export const useTabPress = (callback: () => void) => {
  const navigation =
    useNavigation<BottomTabNavigationProp<BottomTabStackParamList>>();
  const route = useRoute<RouteProp<any>>();
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', e => {
      if (isFocused) {
        callback();
      }
    });

    return unsubscribe;
  }, [navigation, route, isFocused, callback]);
};

type CallbackType = (data?: any) => void;

type CallbackContextType = {
  receiveDataBack: <T extends keyof AllStackParamList>(
    key: T,
    callback: CallbackType,
  ) => void;
  sendDataBack: <T extends keyof AllStackParamList>(key: T, data?: any) => void;
};

const CallbackContext = createContext<CallbackContextType | undefined>(
  undefined,
);

export const useReturnDataContext = (): CallbackContextType => {
  const context = useContext(CallbackContext);
  if (!context) {
    throw new Error(
      'useCallbackContext must be used within a CallbackProvider',
    );
  }
  return context;
};

type CallbackProviderProps = {
  children: ReactNode;
};

export const ReturnScreenDataProvider: React.FC<CallbackProviderProps> = ({
  children,
}) => {
  const callbackMapRef = useRef<Map<string, CallbackType>>(new Map());

  const receiveDataBack = useCallback(
    <T extends keyof AllStackParamList>(key: T, callback: CallbackType) => {
      callbackMapRef.current.set(key as string, callback);
    },
    [],
  );

  const sendDataBack = useCallback(
    <T extends keyof AllStackParamList>(key: T, data?: any) => {
      Log(`Data received for ${key.toString()}: ${JSON.stringify(data)}`);
      const callback = callbackMapRef.current.get(key as string);
      if (callback) {
        callback(data);
      }
    },
    [],
  );

  return (
    <CallbackContext.Provider value={{ receiveDataBack, sendDataBack }}>
      {children}
    </CallbackContext.Provider>
  );
};

type NestedRoute = {
  screen: keyof AllStackParamList;
  data?: Record<string, any>;
  params?: NestedRoute;
};

function buildNestedStateAllLevels(routeConfig: NestedRoute): any {
  // If there is no nested "params", this is the final (leaf) route
  if (!routeConfig.params) {
    return {
      name: routeConfig.screen,
      // If there's a `data` object, attach it under { data: ... }
      params: routeConfig.data ? routeConfig.data : undefined,
    };
  }

  // Otherwise, we have a nested route, so build it recursively
  return {
    name: routeConfig.screen,
    // Attach `data` at this level (if present)
    params: routeConfig.data ? routeConfig.data : undefined,
    state: {
      index: 0,
      routes: [
        // Recursively build the child's state
        buildNestedStateAllLevels(routeConfig.params),
      ],
    },
  };
}

export function parseRouteToDynamicReset(
  baseRoute: NestedRoute,
  topRoute?: NestedRoute,
) {
  const baseState = buildNestedStateAllLevels(baseRoute);

  // If there is no additional top route, return just the base state
  if (!topRoute) {
    return {
      index: 0,
      routes: [baseState],
    };
  }

  return {
    index: 1, // Ensures PostDetail is on top
    routes: [
      baseState, // Base navigation structure (CommunityTab inside BottomBarRoutes)
      buildNestedStateAllLevels(topRoute), // Push PostDetail on top
    ],
  };
}

type AppStateCallback = (state: AppStateStatus) => void;

export function useAppState(onChange: AppStateCallback) {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleChange = (nextAppState: AppStateStatus) => {
      if (appState.current !== nextAppState) {
        appState.current = nextAppState;
        onChange(nextAppState);
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);

    return () => subscription.remove();
  }, [onChange]);
}
