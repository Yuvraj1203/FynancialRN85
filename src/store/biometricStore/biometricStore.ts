import { zustandStorage } from '@/App';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Added by @Tarun 05-02-2025 -> Biometric state type to manage biometric status (FYN-4204)
 *
 * @property {boolean} [biometricEnabled] - Indicates whether the user has allowed biometric authentication.
 * @property {function} setBiometricEnabled - Function to set the biometric authentication status.
 * @property {boolean} [biometricEnabled] - Indicates whether the user has successfully completed biometric authentication.
 * @property {function} setBiometricCompleted - Function to set the biometric completion status.
 * @property {function} clearAll - Function to clear all biometric-related states.
 */
export enum AskFrom {
  login = 'login',
  splash = 'splash',
}

export enum UserBiometricOption {
  enabled = 'enabled',
  disabled = 'disabled',
}

type BiometricState = {
  biometricCompleted?: boolean;
  setBiometricCompleted: (value: boolean) => void;
  biometricLoading?: boolean;
  setBiometricLoading: (value: boolean) => void;
  showBiometricPopup?: boolean;
  setShowBiometricPopup: (value?: boolean) => void;
  showBiometricBgPopup?: boolean;
  setShowBiometricBgPopup: (value?: boolean) => void;
  sessionOutPopup?: boolean;
  setSessionOutPopup: (value?: boolean) => void;
  apiLoading?: boolean;
  setApiLoading: (value?: boolean) => void;
  authenticated?: boolean;
  setAuthenticated: (value?: boolean) => void;
  pseudoLogout?: boolean;
  setPseudoLogout: (value?: boolean) => void;
  authenticatedFromSplash?: boolean;
  setAuthenticatedFromSplash: (value?: boolean) => void;
  fromSplashWithFaceIdEnabled?: boolean;
  setFromSplashWithFaceIdEnabled: (value?: boolean) => void;
  userBiometricEnabled?: UserBiometricOption;
  setUserBiometricEnabled: (value?: UserBiometricOption) => void;
  clearAll: () => void;
};

/**
 * Added by @Tarun 05-02-2025 -> biometric store to save user biometric status (FYN-4204)
 */
const useBiometricStore = create<BiometricState>()(
  persist(
    (set, get) => ({
      // Getter Setter
      biometricCompleted: undefined, // default value
      setBiometricCompleted: (value: boolean) => {
        set({ biometricCompleted: undefined }); // set value
        setTimeout(() => set({ biometricCompleted: value }), 0);
      },
      biometricLoading: undefined, // default value
      setBiometricLoading: (value: boolean) => {
        set({ biometricLoading: undefined }); // set value
        setTimeout(() => set({ biometricLoading: value }), 0);
      },
      showBiometricPopup: undefined, // default value
      setShowBiometricPopup: (value?: boolean) => {
        set({ showBiometricPopup: undefined }); // set value
        setTimeout(() => set({ showBiometricPopup: value }), 0);
      },
      showBiometricBgPopup: undefined, // default value
      setShowBiometricBgPopup: (value?: boolean) => {
        set({ showBiometricBgPopup: undefined }); // set value
        setTimeout(() => set({ showBiometricBgPopup: value }), 0);
      },
      sessionOutPopup: undefined, // default value
      setSessionOutPopup: (value?: boolean) => {
        set({ sessionOutPopup: undefined }); // set value
        setTimeout(() => set({ sessionOutPopup: value }), 0);
      },
      apiLoading: undefined, // default value
      setApiLoading: (value?: boolean) => {
        set({ apiLoading: undefined }); // set value
        setTimeout(() => set({ apiLoading: value }), 0);
      },
      authenticated: undefined, // default value
      setAuthenticated: (value?: boolean) => {
        set({ authenticated: undefined }); // set value
        setTimeout(() => set({ authenticated: value }), 0);
      },
      pseudoLogout: undefined, // default value
      setPseudoLogout: (value?: boolean) => {
        set({ pseudoLogout: undefined }); // set value
        setTimeout(() => set({ pseudoLogout: value }), 0);
      },
      authenticatedFromSplash: undefined, // default value
      setAuthenticatedFromSplash: (value?: boolean) => {
        set({ authenticatedFromSplash: undefined }); // set value
        setTimeout(() => set({ authenticatedFromSplash: value }), 0);
      },
      userBiometricEnabled: undefined, // default value
      setUserBiometricEnabled: (value?: UserBiometricOption) => {
        set({ userBiometricEnabled: undefined }); // set value
        setTimeout(() => set({ userBiometricEnabled: value }), 0);
      },
      fromSplashWithFaceIdEnabled: undefined, // default value
      setFromSplashWithFaceIdEnabled: (value?: boolean) => {
        set({ fromSplashWithFaceIdEnabled: undefined }); // set value
        setTimeout(() => set({ fromSplashWithFaceIdEnabled: value }), 0);
      },
      clearAll() {
        set({
          biometricCompleted: undefined,
          biometricLoading: undefined,
          showBiometricPopup: undefined,
          showBiometricBgPopup: undefined,
          sessionOutPopup: undefined,
          apiLoading: undefined,
          authenticated: undefined,
          pseudoLogout: undefined,
          authenticatedFromSplash: undefined,
          userBiometricEnabled: undefined,
          fromSplashWithFaceIdEnabled: undefined,
        });
      },
    }),
    {
      name: 'biometricStorage', // unique name for every store
      storage: createJSONStorage(() => zustandStorage), // local storage
      partialize: state =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              key !== 'biometricLoading' &&
              key !== 'biometricCompleted' &&
              key !== 'biometricLoading' &&
              key !== 'showBiometricPopup' &&
              key !== 'showBiometricBgPopup' &&
              key !== 'sessionOutPopup' &&
              key !== 'apiLoading' &&
              key !== 'authenticated' &&
              key !== 'pseudoLogout' &&
              key !== 'authenticatedFromSplash' &&
              key !== 'fromSplashWithFaceIdEnabled',
          ),
        ),
    },
  ),
);
/* zustand store creation END */

export default useBiometricStore;
