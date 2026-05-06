# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn start                # Start Metro bundler
yarn android              # Run on Android (active arch only)
yarn ios                  # Run on iOS

# Build
yarn release              # Android release build
yarn release-ios          # iOS release build
yarn android:build        # Build Android APK (release)

# Cache/clean issues
yarn android:cache        # Clean cache + reinstall deps + clean Android build
yarn ios:cache            # Clean cache + reinstall deps + clean iOS build
yarn android:clean        # Gradle clean
yarn ios:clean            # Pod install

# Testing & linting
yarn test                 # Run all Jest tests
yarn lint                 # Run ESLint

# Tenant management
yarn update-tenant        # Regenerate tenantInfo.ts for a different tenant
```

To run a single test file:
```bash
yarn test path/to/file.test.tsx
```

## Architecture

### Multi-Tenant Setup
The app is a white-label financial advisory platform. Tenant configuration lives in `src/tenantInfo.ts` (auto-generated — never edit directly). Use `yarn update-tenant` to switch tenants. Tenant config includes API URL, Auth0/Okta credentials, Sentry DSN, app name, bundle ID, etc.

### State Management: Zustand + MMKV
All global state is in `src/store/` (14 stores). Stores use Zustand with the `persist` middleware backed by MMKV (`react-native-mmkv`) for high-performance local storage. The `zustandStorage` adapter is defined in `App.tsx` and passed to all persistent stores. Each store has a `clearAll()` action used on logout.

### Data Fetching: TanStack Query + ky
API calls go through `src/services/apiInstance.ts`, which configures a `ky` HTTP client with base URL from `TenantInfo.ApiUrl`. Auth tokens (Auth0 or Okta depending on tenant) are injected via request hooks. The client handles token refresh and supports both JSON and FormData. TanStack Query wraps the ky calls for caching/refetching.

### Navigation: React Navigation v7
Navigation is structured as: Root Stack → Drawer → Bottom Tab Navigator → Screen stacks. The bottom tabs are dynamic based on user role:
- **Contact users:** Dashboard, Feed, Resources, Message, Account
- **Advisors:** Contacts, Schedule, Message, Profile

Route definitions are in `src/navigators/routes.tsx`. Navigation types are defined in `src/navigators/types/`.

### Component Architecture
Components follow atomic design: `src/components/atoms/` → `molecules/` → `template/`. Screen components live in `src/screens/`. The `@/` path alias resolves to `./src/` (configured in `babel.config.js` and `tsconfig.json`).

### Real-time: SignalR
`src/services/signalRService.ts` manages a persistent SignalR WebSocket connection for live notifications and badge updates. The connection is started from `src/store/appStartStore` and syncs data into Zustand stores.

### Authentication
Supports both Auth0 and Okta (tenant-dependent). Tokens are stored in the OS keychain via `react-native-keychain`. Biometric authentication is handled in `src/utils/biometricUtils.ts` and `src/store/biometricStore`.

### Push Notifications
Firebase Messaging (`@react-native-firebase/messaging`) + Notifee for display. Notification handling utilities are in `src/utils/notificationUtils.ts`. The app registers a headless check task in `index.js` for background notification processing.

### Internationalization
i18next with English (`en.json`) and Hindi (`hi.json`) base translations. Tenant-specific overrides in `src/translations/tenantTranslations/`. Active language is stored in `src/store/languageStore` (persisted).

### Monitoring
- **Sentry** (`src/DatadogWrapper.tsx` and `metro.config.js` for source maps): Error tracking, disabled in dev
- **Datadog**: APM and navigation tracking via `DatadogWrapper`; excluded for demo/QA tenants

## Key Conventions

- **Path alias:** Use `@/` imports (e.g., `@/store/userStore`) instead of relative paths
- **Forms:** react-hook-form + zod for validation
- **Dates:** dayjs
- **Lists:** `@shopify/flash-list` for performance-critical lists
- **Formatting:** Single quotes, no trailing commas, 80-char line width (see `.prettierrc.js`)
- **ESLint:** Airbnb + TypeScript rules (see `.eslintrc.js`)
