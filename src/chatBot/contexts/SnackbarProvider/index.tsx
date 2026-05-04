import React, {
  Context,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { MD3Theme, Snackbar, useTheme } from 'react-native-paper';

import { ESnackbarTypes } from '../../common/models/enums/snackbar-types';

export interface ISnackbarContext {
  showSnackbar: (message: string, type: ESnackbarTypes) => void;
  hideSnackbar: () => void;
  visible: boolean;
  message: string;
}

const SnackbarContext: Context<ISnackbarContext | undefined> = createContext<
  ISnackbarContext | undefined
>(undefined);

export const SnackbarProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const theme: MD3Theme = useTheme();
  const styles = useStyles(theme);
  const [visible, setVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [type, setType] = React.useState<ESnackbarTypes | null>();

  const showSnackbar = useCallback(
    (msg: string, msgType: ESnackbarTypes) => {
      setMessage(msg);
      setType(msgType || null);
      setVisible(true);
    },
    [setMessage, setType, setVisible],
  );

  const hideSnackbar = useCallback(() => {
    setVisible(false);
    setMessage('');
  }, [setVisible, setMessage]);

  return (
    <SnackbarContext.Provider
      value={{ showSnackbar, hideSnackbar, visible, message }}
    >
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={[
          styles.snackbar,
          type === ESnackbarTypes.Success
            ? styles.successSnackbar
            : styles.errorSnackbar,
        ]}
        onIconPress={hideSnackbar}
        theme={{
          colors: {
            inverseOnSurface:
              type === ESnackbarTypes.Success
                ? theme.colors.onBackground
                : theme.colors.background,
          },
        }}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

const useStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    snackbar: {
      bottom:
        Dimensions.get('screen').height *
        (Platform.OS === 'android' ? 0.78 : 0.74),
      borderRadius: theme.roundness,
      margin: 'auto',
      width: '80%',
    },
    successSnackbar: {
      backgroundColor: theme.colors.primary,
    },
    errorSnackbar: {
      backgroundColor: theme.colors.error,
    },
  });

export const useSnackbar = (): ISnackbarContext => {
  const context: ISnackbarContext | undefined = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within an SnackbarProvider');
  }
  return context;
};
