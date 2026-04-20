import React, {useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {useAppNavigation} from '@/utils/navigationUtils';
import {useBackPressHandler} from '@/utils/utils';
import ChatHistory from '../../components/ChatHistory';
import ChatScreenFooter from '../../components/ChatScreenFooter';
import ChatScreenHeader from '../../components/ChatScreenHeader';

const ChatScreenView: React.FC = () => {
  const theme = useTheme(); // theme
  const navigation = useAppNavigation();

  const styles = makeStyles(theme); // styling
  const [openHistory, setOpenHistory] = useState(false);

  useBackPressHandler(() => handleBackPress());
  //backpress callback
  const handleBackPress = () => {
    console.log('in handleBackPress');
    navigation.goBack();
    navigation.goBack();

    return true;
  };
  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{flex: 1}}>
          <View style={{flex: 1}}>
            <ChatScreenHeader
              openHistory={openHistory}
              setOpenHistory={setOpenHistory}
            />
            <View style={{flex: 1}}>
              <ChatHistory
                openHistory={openHistory}
                setOpenHistory={setOpenHistory}
              />
            </View>

            <ChatScreenFooter />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'android' ? 20 : 10,
    },
  });

export default ChatScreenView;
