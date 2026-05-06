// import 'whatwg-fetch';
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  require('react-native-reanimated/mock'),
);

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

//if issue place this code: for this error :- //!Cannot read property 'call' of undefined
// jest.mock('react-native-reanimated', () => {
//   const Reanimated = require('react-native-reanimated/mock');

//   Reanimated.default.call = () => {};

//   return Reanimated;
// });
