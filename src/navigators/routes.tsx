import { ImageType } from '@/components/atoms/customImage/customImage';
import {
  AccountDetails,
  ActionItemList,
  AddActionItem,
  AddScheduleActionItem,
  AddScheduleEvent,
  AddScheduleMessage,
  AddScheduleReminder,
  Agreement,
  AuthScreen,
  Chat,
  ChatBotScreen,
  ChatGroupMember,
  ChatImageUpload,
  Community,
  ContactListing,
  ContactUs,
  CreateLicenseCertificate,
  CreatePost,
  CustomNotification,
  Dashboard,
  EventViewAll,
  Faq,
  Feed,
  GroupMembers,
  HelpCenter,
  HistoryScreen,
  HtmlRenderScreen,
  Login,
  MemberProfile,
  Message,
  MyAccounts,
  MyReferrals,
  MyTeams,
  Notifications,
  PasswordSetup,
  Profile,
  ProfileEdit,
  ReferFriend,
  ResourceCategory,
  ResourceSubCategory,
  ScheduleActionItemDetail,
  ScheduleDirectMessageDetail,
  ScheduledPostDetail,
  ScheduleEventDetail,
  ScheduleGroupMessageDetail,
  ScheduleReminderDetail,
  SessionOutScreen,
  SettingSetup,
  SettingsScreen,
  Splash,
  Support,
  TimeZone,
  UploadSecureFiles,
} from '@/screens';
import AddSchedulePost from '@/screens/addSchedulePost/addSchedulePost';
import BookmarkCollectionScreen from '@/screens/bookmarkCollection/bookmarkCollection';
import ContactVault from '@/screens/contactVault/contactVault';
import TypographyScreen from '@/screens/typography/typography';
import Vault from '@/screens/vault/vault';
import { BottomTabModel, UserRoleEnum } from '@/services/models';
import { badgesStore, userStore } from '@/store';
import { TenantInfo } from '@/tenantInfo';
import { Images } from '@/theme/assets/images';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import AppBottomTabBar from './appBottomTabBar';
import AppDrawer from './appDrawer';
import {
  BottomTabStackParamList,
  ChatBotStackParamList,
  DrawerStackParamList,
  RootStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>(); // Root stack of application
const DrawerStack = createDrawerNavigator<DrawerStackParamList>(); // side drawer stack
const BottomTabStack = createBottomTabNavigator<BottomTabStackParamList>(); // bottom tab stack which is present in drawer stack
const ChatBotStack = createNativeStackNavigator<ChatBotStackParamList>();

// Root Navigator
export function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <RootStack.Screen name="Splash" component={Splash} />
      <RootStack.Screen name="Login" component={Login} />
      <RootStack.Screen name="ReferFriend" component={ReferFriend} />
      <RootStack.Screen name="MyReferrals" component={MyReferrals} />
      <RootStack.Screen name="MyTeams" component={MyTeams} />
      <RootStack.Screen name="Community" component={Community} />

      <RootStack.Screen name="ActionItemList" component={ActionItemList} />
      <RootStack.Screen name="DrawerRoutes" component={DrawerNavigator} />
      <RootStack.Screen name="CreatePost" component={CreatePost} />
      <RootStack.Screen name="ContactUs" component={ContactUs} />
      <RootStack.Screen name="AddScheduleEvent" component={AddScheduleEvent} />
      <RootStack.Screen name="AddSchedulePost" component={AddSchedulePost} />

      <RootStack.Screen
        name="CreateLicenseCertificate"
        component={CreateLicenseCertificate}
      />

      <RootStack.Screen
        name="AddScheduleReminder"
        component={AddScheduleReminder}
      />
      <RootStack.Screen name="SettingSetup" component={SettingSetup} />
      <RootStack.Screen name="TimeZone" component={TimeZone} />

      <RootStack.Screen name="GroupMembers" component={GroupMembers} />
      <RootStack.Screen name="MemberProfile" component={MemberProfile} />
      <RootStack.Screen name="Agreement" component={Agreement} />
      <RootStack.Screen name="Faq" component={Faq} />
      <RootStack.Screen name="Support" component={Support} />
      <RootStack.Screen name="HelpCenter" component={HelpCenter} />
      <RootStack.Screen name="Chat" component={Chat} />
      <RootStack.Screen name="HtmlRenderScreen" component={HtmlRenderScreen} />
      <RootStack.Screen name="TypographyScreen" component={TypographyScreen} />
      <RootStack.Screen
        name="AddScheduleMessage"
        component={AddScheduleMessage}
      />

      <RootStack.Screen
        name="ScheduledPostDetail"
        component={ScheduledPostDetail}
      />
      <RootStack.Screen
        name="ScheduleEventDetail"
        component={ScheduleEventDetail}
      />
      <RootStack.Screen
        name="ScheduleReminderDetail"
        component={ScheduleReminderDetail}
      />

      <RootStack.Screen
        name="ScheduleActionItemDetail"
        component={ScheduleActionItemDetail}
      />

      <RootStack.Screen
        name="ScheduleDirectMessageDetail"
        component={ScheduleDirectMessageDetail}
      />
      <RootStack.Screen
        name="ScheduleGroupMessageDetail"
        component={ScheduleGroupMessageDetail}
      />

      <RootStack.Screen
        name="ResourceSubCategory"
        component={ResourceSubCategory}
      />
      <RootStack.Screen name="ChatGroupMember" component={ChatGroupMember} />
      <RootStack.Screen name="EventViewAll" component={EventViewAll} />
      <RootStack.Screen name="Profile" component={Profile} />
      <RootStack.Screen name="ProfileEdit" component={ProfileEdit} />
      <RootStack.Screen name="Vault" component={Vault} />
      <RootStack.Screen name="AddActionItem" component={AddActionItem} />

      <RootStack.Screen
        name="AddScheduleActionItem"
        component={AddScheduleActionItem}
      />
      <RootStack.Screen name="Notifications" component={Notifications} />
      <RootStack.Screen
        name="CustomNotification"
        component={CustomNotification}
      />
      <RootStack.Screen name="ContactFeed" component={Feed} />
      <RootStack.Screen name="ContactVault" component={ContactVault} />
      <RootStack.Screen
        name="UploadSecureFiles"
        component={UploadSecureFiles}
      />
      <RootStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <RootStack.Screen name="SessionOutScreen" component={SessionOutScreen} />
      <RootStack.Screen name="ChatImageUpload" component={ChatImageUpload} />
      <RootStack.Screen name="PasswordSetup" component={PasswordSetup} />
      <RootStack.Screen name="MyAccounts" component={MyAccounts} />
      <RootStack.Screen name="AccountDetails" component={AccountDetails} />
      <RootStack.Screen
        name="BookmarkCollection"
        component={BookmarkCollectionScreen}
      />
    </RootStack.Navigator>
  );
}

// Drawer Navigator
export function DrawerNavigator() {
  return (
    <DrawerStack.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={props => <AppDrawer {...props} />}
      initialRouteName="BottomBarRoutes"
    >
      <DrawerStack.Screen
        name="BottomBarRoutes"
        component={BottomTabNavigator}
      />
    </DrawerStack.Navigator>
  );
}

const getScreenComponent = (screenName: string) => {
  const screenMap: { [key: string]: React.ComponentType<any> } = {
    ContactListing: ContactListing,
    Dashboard: Dashboard,
    Feed: Feed,
    Resources: ResourceCategory,
    Message: Message,
    AdvisorProfile: Profile,
    ContactProfile: Profile,
    EventViewAll: EventViewAll,
    //ChatBot: ChatBotRootNavigator,
    ChatBotRoutes: ChatBotNavigator,
  };

  return screenMap[screenName] || Dashboard; // Default to Dashboard if not found
};

// Bottom Tab Navigator
export function BottomTabNavigator() {
  const userDetails = userStore();

  const badges = badgesStore(state => state.badges);

  var contactScreens: BottomTabModel[] = [
    {
      name: 'Dashboard',
      title: t('Home'),
      image: Images.home,
      imageType: ImageType.svg,
    },
    {
      name: 'Feed',
      title: t('Feed'),
      image: Images.myGroup,
      imageType: ImageType.svg,
      badgeCount: badges?.hasNewFeed ? -1 : undefined,
    },
    {
      name: 'Resources',
      title: t('Resources'),
      image: Images.portal,
      imageType: ImageType.svg,
    },
    {
      name: 'Message',
      title: t('Message'),
      image: Images.faq,
      imageType: ImageType.svg,
      badgeCount: badges?.messageCount,
    },
    {
      name: 'ContactProfile',
      title: t('Account'),
      image: Images.aboutMe,
      imageType: ImageType.svg,
    },
  ];

  var advisorScreens: BottomTabModel[] = [
    {
      name: 'ContactListing',
      title: t('Contacts'),
      image: Images.refer,
      imageType: ImageType.svg,
    },
    {
      name: 'EventViewAll',
      title: t('Schedule'),
      image: Images.myGroup,
      imageType: ImageType.svg,
    },
    ...(TenantInfo.TenancyName === 'newhorizonsdemo' ||
    TenantInfo.TenancyName === 'developers'
      ? [
          {
            name: 'ChatBotRoutes',
            title: t('Fyn'),
            image: Images.fynAIicon,
          } as BottomTabModel,
        ]
      : []),
    {
      name: 'Message',
      title: t('Message'),
      image: Images.faq,
      imageType: ImageType.svg,
      badgeCount: badges?.messageCount,
    },
    {
      name: 'AdvisorProfile',
      title: t('Profile'),
      image: Images.aboutMe,
      imageType: ImageType.svg,
    },
  ];

  var contentEditorScreens: BottomTabModel[] = [
    {
      name: 'EventViewAll',
      title: t('Schedule'),
      image: Images.myGroup,
      imageType: ImageType.svg,
    },
    {
      name: 'AdvisorProfile',
      title: t('Profile'),
      image: Images.aboutMe,
      imageType: ImageType.svg,
    },
  ];

  const [tabList, setTabList] = useState<BottomTabModel[]>(
    userDetails && userDetails?.userDetails?.isAdvisor
      ? userDetails.userDetails.role == UserRoleEnum.ContentEditor
        ? contentEditorScreens
        : advisorScreens
      : contactScreens,
  );

  useEffect(() => {
    if (userDetails.userDetails) {
      setTabList(
        userDetails && userDetails?.userDetails?.isAdvisor
          ? userDetails.userDetails.role == UserRoleEnum.ContentEditor
            ? contentEditorScreens
            : advisorScreens
          : contactScreens,
      );
    }
  }, [userDetails, badges]);

  return (
    <BottomTabStack.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <AppBottomTabBar bottomTabs={tabList} {...props} />}
      initialRouteName={
        userDetails && userDetails.userDetails?.isAdvisor
          ? userDetails.userDetails.role == UserRoleEnum.ContentEditor
            ? 'EventViewAll'
            : 'ContactListing'
          : 'Dashboard'
      }
    >
      {tabList.map(screen => (
        <BottomTabStack.Screen
          key={screen.name}
          name={screen.name}
          component={getScreenComponent(screen.name)}
        />
      ))}
    </BottomTabStack.Navigator>
  );
}

export function ChatBotNavigator() {
  return (
    <ChatBotStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="AuthScreen"
    >
      <ChatBotStack.Screen name="AuthScreen" component={AuthScreen} />
      <ChatBotStack.Screen name="ChatBotScreen" component={ChatBotScreen} />
      <ChatBotStack.Screen name="HistoryScreen" component={HistoryScreen} />
    </ChatBotStack.Navigator>
  );
}
