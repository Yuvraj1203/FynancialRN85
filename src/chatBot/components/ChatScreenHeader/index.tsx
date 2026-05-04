import { DrawerActions, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { CustomText, Tap } from '@/components/atoms';
import CustomImage, {
  ImageType,
} from '@/components/atoms/customImage/customImage';
import {
  TextEllipsis,
  TextVariants,
} from '@/components/atoms/customText/customText';
import { Images } from '@/theme/assets/images';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { useTranslation } from 'react-i18next';
import { MainScreenNavigationProp } from '../../common/models/types/main-screen-navigation-prop';
import { IAgentsContext, useAgents } from '../../contexts/AgentsProvider';
import {
  IChatState,
  useChatStore,
} from '../../storage/zustandStorage/useChatStore';
import AgentsDropdown from '../AgentsDropdown';

const SUB_HEADER_HEIGHT = 45;
type Props = {
  setOpenHistory: (value: boolean) => void;
  openHistory: boolean;
};
const ChatScreenHeader: React.FC<Props> = props => {
  const { t } = useTranslation();

  const [menuVisible, setMenuVisible] = useState(false); // to show menu if right icons are more than 2
  const theme = useTheme(); // theme
  const [agentMenuVisible, setAgentMenuVisible] = useState(false);

  // Control agent dropdown visibility
  const [agentDropdownVisible, setAgentDropdownVisible] = useState(false);
  const styles = makeStyles(theme); // styling
  const { setSelectedChat, setSelectedAgent, syncChatMessages, selectedAgent } =
    useChatStore((state: IChatState) => ({
      setSelectedChat: state.setSelectedChat,
      setSelectedAgent: state.setSelectedAgent,
      syncChatMessages: state.syncChatMessages,
      selectedAgent: state.selectedAgent,
    }));
  const navigation: MainScreenNavigationProp =
    useNavigation<MainScreenNavigationProp>();

  const { listOfAgentsQuery }: IAgentsContext = useAgents();
  const getSelectedAgentName = (): string | undefined => {
    if (!listOfAgentsQuery.data) return undefined;
    const agent = listOfAgentsQuery.data.find(a => a.id === selectedAgent);
    return agent?.name;
  };
  const handleCreateNewChat = () => {
    setSelectedChat(null);
    setSelectedAgent(listOfAgentsQuery.data?.[0]?.id || null);
    syncChatMessages([]);
    navigation.navigate('Chat');
  };

  const handleOpenDrawer = () =>
    navigation.dispatch(DrawerActions.openDrawer());

  const handleLeave = () => {
    navigation.goBack();
    navigation.goBack();
    setMenuVisible(false);
  };
  // When user clicks "Select Agent" in menu:
  const onSelectAgent = () => {
    closeMenu();
    setAgentDropdownVisible(true);
  };
  // Your existing menu options, with onSelectAgent wired up
  const menuOptions = [
    { name: 'Select Agent', onPress: onSelectAgent },
    // add more menu items if needed
  ];

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const closeMenu = () => setMenuVisible(false);
  const anchor = (
    <Tap onPress={() => setAgentMenuVisible(true)} style={styles.rightIcon}>
      <CustomText>{/* or CustomImage icon here */} </CustomText>
    </Tap>
  );
  // This Tap *is* the anchor for the dropdown.
  const titleAnchor = (
    <Tap onPress={() => setAgentDropdownVisible(true)} style={{ flex: 1 }}>
      <CustomText
        ellipsis={TextEllipsis.tail}
        maxLines={1}
        variant={TextVariants.titleLarge}
        style={styles.title}
      >
        {getSelectedAgentName() ?? 'Hey Fyn!'}
      </CustomText>
    </Tap>
  );
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {/* <IconButton
        icon={'menu'}
        iconColor={theme.colors.onBackground}
        size={30}
        onPress={handleOpenDrawer}
        style={styles.iconButton}
      /> */}
        <Tap
          onPress={() => {
            Keyboard.dismiss();
            navigation.dispatch(DrawerActions.openDrawer()); // open drawer
          }}
        >
          <CustomImage
            source={Images.drawer}
            type={ImageType.svg}
            color={theme.colors.onSurfaceVariant}
            style={styles.headerIcon}
          />
        </Tap>
        <View style={styles.containerTitle}>
          <AgentsDropdown
            visible={agentDropdownVisible}
            onDismiss={() => setAgentDropdownVisible(false)}
            anchor={titleAnchor}
          />
          <View style={{ transform: [{ rotate: '270deg' }] }}>
            <CustomImage
              source={Images.back}
              type={ImageType.svg}
              color={theme.colors.primary}
              style={styles.menuItemIcon}
            />
          </View>
        </View>

        {/* <AgentsDropdown /> */}
        {/* <IconButton
        icon={'chat-plus-outline'}
        iconColor={theme.colors.onBackground}
        size={26}
        onPress={handleCreateNewChat}
        style={styles.iconButton}
      /> */}
        <Tap onPress={handleCreateNewChat}>
          <CustomImage
            source={Images.createChat}
            type={ImageType.svg}
            color={theme.colors.onSurfaceVariant}
            style={styles.createChatIcon}
          />
        </Tap>

        <Tap
          onPress={() => {
            props.setOpenHistory(!props.openHistory);
          }}
        >
          <CustomImage
            source={Images.history}
            type={ImageType.svg}
            color={theme.colors.onSurfaceVariant}
            style={styles.historyicon}
          />
        </Tap>
        {/* <View>
          <View>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <Tap onPress={toggleMenu} style={styles.rightIcon}>
                  <CustomImage
                    source={Images.options}
                    type={ImageType.svg}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.headerIcon}
                  />
                </Tap>
              }
              style={styles.menuList}
              contentStyle={styles.menuBG}>
              {menuOptions.map((opt, i) => (
                <Menu.Item
                  key={i}
                  onPress={() => {
                    opt.onPress();
                    closeMenu();
                  }}
                  leadingIcon={() => (
                    <View style={{transform: [{rotate: '270deg'}]}}>
                      <CustomImage
                        source={Images.back}
                        type={ImageType.svg}
                        color={theme.colors.primary}
                        style={styles.menuItemIcon}
                      />
                    </View>
                  )}
                  title={opt.name}
                  titleStyle={styles.menuItemText}
                  contentStyle={styles.menuItemContent}
                />
              ))}
            </Menu>
          </View>
          
          <AgentsDropdown
            visible={agentDropdownVisible}
            onDismiss={() => setAgentDropdownVisible(false)}
            anchor={anchor} // You can also create a transparent anchor View or reuse the icon
          /> 

         
        </View> */}

        {/* <CustomButton
        icon={{source: Images.logout, type: ImageType.svg}}
        mode={ButtonVariants.contained}
        style={{
          borderColor: theme.colors.error,
          paddingHorizontal: 0,
          padding: 0,
        }}
        onPress={handleLeave}>
        {'Leave Chat'}
      </CustomButton> */}
      </View>
    </View>
  );
};

const makeStyles = (theme: CustomTheme) =>
  StyleSheet.create({
    container: {
      height: SUB_HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    containerTitle: {
      height: SUB_HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    rightIcon: {
      paddingHorizontal: 10,
    },
    historyicon: {
      height: 25,
      width: 25,
      marginRight: 10,
    },
    title: {
      flex: 1,
      flexShrink: 1,
      fontSize: 17,
      textAlignVertical: 'center',
      textAlign: 'center',
      lineHeight: 40,
      height: 40,
    },
    leftContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      paddingHorizontal: 0,
      marginHorizontal: 0,
    },
    addGroupHeaderBtn: {
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5,
      borderWidth: 0.8,
      marginRight: 20,
      padding: 0,
      paddingHorizontal: 10,
    },
    createNewChaticon: {
      height: 25,
      width: 25,
    },
    iconContainer: {
      marginHorizontal: 5,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      height: 50,
      width: 50,
      borderRadius: theme.roundness,
    },
    headerIcon: {
      height: 25,
      width: 25,
      marginLeft: 5,
    },
    headerIconBack: {
      height: 25,
      width: 25,

      marginLeft: 7,
    },
    createChatIcon: {
      height: 35,
      width: 35,
      marginRight: 8,
      marginBottom: 8,
    },
    menuList: {
      // shifts the menu so it appears nicely under your options icon:
      marginTop: 65,
    },
    menuBG: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.onSurfaceVariant,
      borderWidth: 0.5,
      borderRadius: theme.roundness,
      elevation: 4,
      shadowColor: theme.colors.onBackground,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 0,
    },
    menuItemIcon: {
      width: 18,
      height: 18,
    },

    menuItemText: {
      fontSize: 15,
      color: theme.colors.onSurface,
    },
  });

export default ChatScreenHeader;
