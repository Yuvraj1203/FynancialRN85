1. node update above >= 22.11.0
2. yarn update as per node => "zsh: command not found: yarn"
3.

compatibility issues

1. React-Native-Firebase !==> Flipper & Fabric. //we cant use both together compatibility issue

IF WONT RUN FIX THIS

1. copy pasted the tsconfig.json
2. COPY PASTE -> react-native.config.js

bhai how can i make the files for firebase with "FynancialRN85" this name, now i want package name and bundle id to be ---> "com.fynancialrn85"

if somehow i get into the

<!-- important thing before -->

remove src folder from .gitignore

<!-- breaking changes  -->

    <!-- 0.82 -->
        1. Old native libraries
        2. Unmaintained packages
        3. Custom native code

    <!-- 0.84 -->
        1. react-native-url-polyfill - i guess no need as URL gets many things

    <!-- 0.85 -->
        1. use "useNativeDriver: true" in every animation api

<!-- code update -->

1. absoluteFillObject - > absoluteFill
2. @react-navigation/stack to @react-navigation/native-stack
   Old (stack) New (native-stack):
   a. createStackNavigator createNativeStackNavigator
   b. StackNavigationProp NativeStackNavigationProp
   c. StackScreenProps NativeStackScreenProps

<!-- after everything must run  -->

1. npx pod-install ios
2. cd android && ./gradlew clean
3. cd ios && pod install
