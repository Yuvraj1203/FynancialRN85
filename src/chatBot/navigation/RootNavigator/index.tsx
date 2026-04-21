import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DrawerParamList } from '../../common/models/types/root-drawer-param-list';
import { RootStackParamList } from '../../common/models/types/root-stack-param-list';
import { CustomTheme } from '../../common/themes/CustomTheme';
import ListOfChatsDrawer from '../../components/ListOfChatsDrawer';
import { AgentsProvider } from '../../contexts/AgentsProvider';
import { ApiProvider } from '../../contexts/ApiProvider';
import { AskChatProvider } from '../../contexts/AskChatProvider';
import { AuthProvider } from '../../contexts/AuthProvider';
import { SnackbarProvider } from '../../contexts/SnackbarProvider';
import ChatScreen from '../../screens/ChatScreen';

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const StackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={'Chat'} component={ChatScreen} />
  </Stack.Navigator>
);

const ChatBotRootNavigator: React.FC = () => {
  const handleDrawerContent = () => <ListOfChatsDrawer />;

  return (
    <GestureHandlerRootView style={styles.gestureHandlerRootView}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={CustomTheme}>
            <SnackbarProvider>
              <AuthProvider>
                <ApiProvider>
                  <AgentsProvider>
                    <AskChatProvider>
                      <StackNavigator />
                    </AskChatProvider>
                  </AgentsProvider>
                </ApiProvider>
              </AuthProvider>
            </SnackbarProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureHandlerRootView: { flex: 1 },
});

export default ChatBotRootNavigator;
