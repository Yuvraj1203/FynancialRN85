import React from 'react';
import {StyleSheet} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

import {CustomButton} from '@/components/atoms';
import {ButtonVariants} from '@/components/atoms/customButton/customButton';
import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {IBotSuggestion} from '../../common/models/interfaces/bot-suggestion';

interface IDefaultPromptPanelProps {
  botSuggestion?: IBotSuggestion[] | [];
  handleAskChat: (promptText?: string) => void;
}

const DefaultPromptPanel: React.FC<IDefaultPromptPanelProps> = ({
  botSuggestion,
  handleAskChat,
}: IDefaultPromptPanelProps) => {
  const theme = useTheme(); // theme

  const styles = makeStyles(theme); // styling
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {botSuggestion?.map((bot: IBotSuggestion) => (
        <CustomButton
          key={bot.id}
          mode={ButtonVariants.outlined}
          onPress={() => handleAskChat(bot.greeting)}>
          {bot.greeting}
        </CustomButton>
      ))}
    </ScrollView>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 10,
    },
    promptButton: {
      borderRadius: 10,
    },
  });

export default DefaultPromptPanel;
