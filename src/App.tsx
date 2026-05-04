import { DdSdkReactNative } from '@datadog/mobile-react-native';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { LogBox, NativeModules } from 'react-native';
import { Auth0Provider } from 'react-native-auth0';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';
import DatadogWrapper from './DatadogWrapper';
import ApplicationNavigator from './navigators/applicationNavigator';
import { languageStore } from './store';
import { TenantInfo } from './tenantInfo';
import i18n from './translations';
import { ReturnScreenDataProvider } from './utils/navigationUtils';
import { isEmpty } from './utils/utils';

export const AppVersion = '2.0.5A';

Sentry.init({
  dsn: __DEV__ ? undefined : TenantInfo.SentryDsn,
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
  normalizeDepth: 10,
  // enableLogs: true,
  // integrations: [
  //   // send console.log, console.warn, and console.error calls as logs to Sentry
  //   Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  // ],
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      customTag: NativeModules.RNDeviceInfo?.bundleId,
    };
    return event;
  },
});

export const storage = createMMKV(); /* local storage in React native 
                                    uses key value Pair(https://github.com/mrousavy/react-native-mmkv) */

/* State Management library Zustand(https://github.com/pmndrs/zustand) START */
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: name => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: name => {
    return storage.remove(name);
  },
};
/* State Management library Zustand(https://github.com/pmndrs/zustand) END */

// App Starts
function App() {
  /* Logging for debug apk START */
  if (!__DEV__) {
    console.log = () => {};
  }

  if (__DEV__) {
    LogBox.ignoreLogs([
      'Warning: Each',
      'Warning: Failed',
      'EventEmitter.removeListener',
    ]);
    LogBox.ignoreAllLogs(true);
  }
  /* Logging for debug apk END */
  DdSdkReactNative.addAttributes({
    client_id: TenantInfo.TenancyName,
    app_build_version: AppVersion,
  });

  //Log('Package Name=>' + NativeModules.RNDeviceInfo?.bundleId);
  /* Language Selection (https://react.i18next.com/) START */
  const appLanguage = languageStore(state => state.appLanguage); // get language stored in local storage

  useEffect(() => {
    i18n.changeLanguage(appLanguage); // language change on store value change.
  }, [appLanguage]);

  /* Language Selection END */

  /* React query for making api calls(https://tanstack.com/query/latest/docs/framework/react/overview) START */

  const queryClient = new QueryClient();

  /* React query for making api calls(https://tanstack.com/query/latest/docs/framework/react/overview) END */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <DatadogWrapper>
          <QueryClientProvider client={queryClient}>
            <ReturnScreenDataProvider>
              {!isEmpty(TenantInfo.Auth0Domain) ? (
                <Auth0Provider
                  domain={TenantInfo.Auth0Domain ?? ''}
                  clientId={TenantInfo.Auth0ClientId ?? ''}
                >
                  <ApplicationNavigator />
                </Auth0Provider>
              ) : (
                <ApplicationNavigator />
              )}
            </ReturnScreenDataProvider>
          </QueryClientProvider>
        </DatadogWrapper>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

//export default App;
export default Sentry.wrap(App);
