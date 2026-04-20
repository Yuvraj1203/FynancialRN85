import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {ActivityIndicator, Menu} from 'react-native-paper';

import {CustomTheme, useTheme} from '@/theme/themeProvider/paperTheme';
import {IAgentInfo} from '../../common/models/interfaces/agent-info';
import {IAgentsContext, useAgents} from '../../contexts/AgentsProvider';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';

export type AgentsDropdownProps = {
  visible: boolean;
  onDismiss: () => void;
  anchor: React.ReactElement;
};

const AgentsDropdown: React.FC<AgentsDropdownProps> = ({
  visible,
  onDismiss,
  anchor,
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const {selectedAgent, setSelectedAgent} = useChatStore(
    (state: IChatState) => ({
      selectedAgent: state.selectedAgent,
      setSelectedAgent: state.setSelectedAgent,
    }),
  );

  const {listOfAgentsQuery}: IAgentsContext = useAgents();

  const handleAgentSelect = (agent: IAgentInfo) => {
    setSelectedAgent(agent.id);
    onDismiss();
  };

  // Same label logic for button anchor
  const getAgentName = (): string => {
    if (selectedAgent) {
      return (
        listOfAgentsQuery.data?.find(
          (agent: IAgentInfo) => agent.id === selectedAgent,
        )?.name ?? 'Select Agent'
      );
    }
    return listOfAgentsQuery?.data?.[0]?.name ?? 'Select Agent';
  };

  return (
    <Menu
      visible={visible}
      onDismiss={onDismiss}
      anchor={anchor}
      anchorPosition="bottom"
      style={styles.menu}
      contentStyle={styles.menuContent}>
      {(listOfAgentsQuery.isFetching || listOfAgentsQuery.isLoading) &&
      !listOfAgentsQuery.data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={listOfAgentsQuery.data}
          keyExtractor={(agent: IAgentInfo) => agent.id.toString()}
          style={styles.scrollableMenu}
          renderItem={({item: agent}) => (
            <Menu.Item
              key={agent.id}
              onPress={() => handleAgentSelect(agent)}
              title={agent.name}
              style={styles.menuItem}
              titleStyle={styles.menuItemText}
            />
          )}
        />
      )}
    </Menu>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    menu: {
      position: 'absolute',
      right: '3%',
      left: '28%',
      marginTop: 5,
    },
    scrollableMenu: {
      maxHeight: 190,
    },
    menuContent: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.onSurfaceVariant,
      borderWidth: 0.5,
      borderRadius: 10,
      elevation: 4,
      shadowColor: theme.colors.onBackground,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    menuItem: {
      height: 40,
    },
    menuItemText: {
      color: theme.colors.onBackground,
      fontSize: 14,
      fontWeight: '500',
      paddingVertical: 8,
    },
    button: {
      borderWidth: 0.6,
      borderRadius: 6,
      width: 160,
      alignItems: 'center',
      height: 37,
      justifyContent: 'center',
      marginTop: 1,
      marginRight: 7,
      padding: 0,
      paddingHorizontal: 0,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default AgentsDropdown;
