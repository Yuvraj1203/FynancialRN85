import CustomTabItem from '@/components/molecules/customTabItem/customTabItem';
import { BottomTabModel } from '@/services/models';
import { userStore } from '@/store';
import { CustomTheme, useTheme } from '@/theme/themeProvider/paperTheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, View } from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

function AppBottomTabBar({
  bottomTabs,
  ...props
}: { bottomTabs: BottomTabModel[] } & BottomTabBarProps) {
  const theme = useTheme(); // access theme

  const safeAreaInsets = useSafeAreaInsets();

  const styles = makeStyles(theme, safeAreaInsets); // access StylesSheet with theme implemented

  const { t } = useTranslation(); // translation

  const userData = userStore(); // user store

  const [tabList, setTabList] = useState<BottomTabModel[]>(bottomTabs); // drawer list

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (userData.userDetails) {
      setTabList(bottomTabs);
    }
  }, [userData.userDetails, bottomTabs]);

  const currentRoute = props.state.routes[props.state.index];
  if (keyboardVisible && currentRoute?.name === 'ChatBotRoutes') return null;

  return (
    <View style={styles.container}>
      {tabList.map((tabItem, index) => {
        const isFocused = props.state.index === index;
        const route = props.state.routes.find(
          item => item.name === tabItem.name,
        );

        const iconStyle =
          tabItem.name === 'ChatBotRoutes' ? { width: 35, height: 35 } : {};

        const onPress = () => {
          const event = props.navigation.emit({
            type: 'tabPress',
            target: route?.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            if (route?.name) {
              props.navigation.navigate(route?.name, route?.params || {});
            }
          }
        };

        const onLongPress = () => {
          props.navigation.emit({
            type: 'tabLongPress',
            target: route?.key,
          });
        };
        return (
          <CustomTabItem
            key={tabItem.title}
            title={tabItem.title}
            icon={tabItem.image}
            imageType={tabItem.imageType}
            IsColorNoChange={tabItem.name === 'ChatBotRoutes' ? true : false}
            badgeCount={tabItem.badgeCount}
            selected={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            style={tabItem.name === 'ChatBotRoutes' ? { marginBottom: 5 } : {}}
            imageStyle={iconStyle} // Pass the iconStyle
            {...props}
          />
        );
      })}
    </View>
  );
}

const makeStyles = (theme: CustomTheme, safeAreaInsets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingBottom: safeAreaInsets.bottom,
    },
  });

export default AppBottomTabBar;
