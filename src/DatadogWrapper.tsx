import {
  BatchSize,
  DatadogProvider,
  DatadogProviderConfiguration,
  SdkVerbosity,
  UploadFrequency,
} from '@datadog/mobile-react-native';
import { TenantInfo } from './tenantInfo';

const config = new DatadogProviderConfiguration(
  TenantInfo.ApiUrl.includes('sanctuary')
    ? 'pub3a2612b18345af2ab53612783c9eddb6'
    : 'pubd0934edd37e660408f785e28ec1eb791',
  TenantInfo.ApiUrl.includes('sanctuary') ? 'sanctuary-prd' : 'fyn-prd',
  TenantInfo.ApiUrl.includes('sanctuary')
    ? '0752e75e-1432-41d8-b574-40b5e1a8661d'
    : '582ca7bb-17b6-4c14-9e63-234fe3cdd521',
  true, // track User interactions (e.g.: Tap on buttons. You can use 'accessibilityLabel' element property to give tap action the name, otherwise element type will be reported)
  true, // track XHR Resources
  true, // track Errors
);

config.site = 'US1';
// Optional: Enable JavaScript long task collection
config.longTaskThresholdMs = 100;
// Optional: enable or disable native crash reports
config.nativeCrashReportEnabled = true;
// Optional: sample RUM sessions (here, 100% of session will be sent to Datadog. Default = 100%. Only tracked sessions send RUM events.)
config.sessionSamplingRate = 100;

if (__DEV__) {
  // Optional: Send data more frequently
  config.uploadFrequency = UploadFrequency.FREQUENT;
  // Optional: Send smaller batches of data
  config.batchSize = BatchSize.SMALL;
  // Optional: Enable debug logging
  config.verbosity = SdkVerbosity.DEBUG;
}

type Props = {
  children: React.ReactNode;
};

const DatadogWrapper = (props: Props) => {
  const DATADOG_DISABLED_TENANTS = [
    'newhorizonsdemo',
    'developers',
    'dktest2',
    'Finology',
    'onsite',
    'Gks',
    'migrationlegacy',
    'newexperience',
    'Superman',
    'qa',
    'salesforce',
  ];

  const enabled =
    !__DEV__ &&
    !DATADOG_DISABLED_TENANTS.includes(
      TenantInfo?.TenancyName?.toLowerCase() ?? '',
    );

  if (!enabled) {
    return <>{props.children}</>;
  }

  return (
    <DatadogProvider configuration={config}>{props.children}</DatadogProvider>
  );
};

export default DatadogWrapper;
