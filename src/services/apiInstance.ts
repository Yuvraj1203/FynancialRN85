import { biometricStore, tenantDetailStore, userStore } from '@/store';
import { TenantInfo } from '@/tenantInfo';
import i18n from '@/translations';
import {
  getAccessTokenFromKeychain,
  saveAccessTokenInKeychain,
} from '@/utils/keychainUtils';
import Log from '@/utils/logger';
import {
  internetReachable,
  isEmpty,
  prettifyAndPrintJSON,
  triggerSentry,
} from '@/utils/utils';
import ky from 'ky';
import Auth0, { Credentials } from 'react-native-auth0';
import { createAbortController } from './apiCancellation';
import { ApiConstants } from './apiConstants';
import { AuthenticateViaAuth0Model, BaseModel, LoginWith } from './models';

// Base Url
// const baseUrl = 'https://aa.fyntst.com/api'; // Test
// const baseUrl = 'https://a.fynuat.com/api'; // Uat
//const baseUrl = 'https://service.fynancial.com/api'; // Live
const baseUrl = TenantInfo.ApiUrl; // Uat

/* Ky to make API Call (https://github.com/sindresorhus/ky) START */
export const apiInstance = ky.extend({
  prefix: baseUrl,
  headers: {
    Accept: 'application/json',
  },
  throwHttpErrors: false,
  timeout: 5 * 60 * 1000,
});
/* Ky to make API Call (https://github.com/sindresorhus/ky) END */

function trimDataValues(
  data: Record<string, any> | FormData,
): Record<string, any> | FormData {
  if (data instanceof FormData) {
    return data; // Return FormData as is, since it is not a plain object
  }

  const trimmedData: Record<string, any> = {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
      trimmedData[key] = data[key].trim(); // Trim string values
    } else if (Array.isArray(data[key])) {
      // Handle arrays
      trimmedData[key] = data[key].map(item => {
        if (typeof item === 'object' && item !== null) {
          // Recursively trim objects within the array
          return trimDataValues(item);
        }
        return item; // Keep non-object items as they are
      });
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      trimmedData[key] = trimDataValues(data[key]); // Recursively trim nested objects
    } else if (data[key] !== undefined) {
      trimmedData[key] = data[key]; // Preserve non-string values
    }
  }
  return trimmedData;
}

// Request Types
export enum HttpMethodApi {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Patch = 'patch',
  Delete = 'delete',
}

// Request options to make api calls
interface RequestOptions {
  appendPostParamsToApiUrl?: boolean;
  customBaseUrl?: string;
  endpoint: string;
  method: HttpMethodApi;
  data?: Record<string, any> | FormData | string;
  headers?: Record<string, string>;
  refreshToken?: boolean;
  byPassRefresh?: boolean;
  cancelable?: boolean;
}

// api call without base model
export async function makeRequestWithoutBaseModel<T>(
  props: RequestOptions,
): Promise<T> {
  return makeRequestInternal<T>({
    ...props, // Spread other properties from props
    withoutBaseModel: true, // Explicitly set withoutBaseModel for this case
  });
}

// API call with base model
export async function makeRequest<T>(
  props: RequestOptions,
): Promise<BaseModel<T>> {
  return makeRequestInternal<BaseModel<T>>({
    ...props, // Spread other properties from props
    withoutBaseModel: false, // Explicitly set withoutBaseModel for this case
  });
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)} s`;
  } else {
    return `${(ms / 60000).toFixed(2)} min`;
  }
}

// Internal function to handle the request
async function makeRequestInternal<T>({
  appendPostParamsToApiUrl = false,
  customBaseUrl,
  endpoint,
  method,
  data,
  headers,
  withoutBaseModel = false,
  refreshToken = false,
  byPassRefresh = false,
  cancelable = true,
}: RequestOptions & {
  withoutBaseModel: boolean;
}): Promise<T> {
  const internetAvailable = await internetReachable();
  if (!internetAvailable) {
    throw new Error(i18n.t('InternetNotAvailable'));
  }

  const tenantDetails = tenantDetailStore.getState().tenantDetails;

  let controller: AbortController | undefined;
  if (cancelable) {
    controller = createAbortController(); // ✅ track only cancelable requests
  }
  const options: Record<string, any> = {
    method,
    ...(controller ? { signal: controller.signal } : {}),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Abp.TenantId': tenantDetails
        ? tenantDetails.tenantId
        : TenantInfo.TenantId,
      ...headers,
    },
  };

  if (!headers?.Authorization) {
    try {
      const accessToken = await getAccessTokenFromKeychain();

      if (accessToken) {
        options.headers.Authorization = `Bearer ${accessToken.accessToken}`;
      }
    } catch (e) {
      Log('keychain token error=>' + e);
    }
  }

  // Determine the base URL
  const apiBaseUrl = customBaseUrl
    ? customBaseUrl
    : tenantDetails
    ? `${tenantDetails?.tenantURL}`
    : baseUrl;

  // Create API instance with the selected base URL
  const apiCallInstance = apiInstance.extend({
    prefix: apiBaseUrl,
    hooks: {
      afterResponse: [
        async ({ request, options, response }) => {
          const result = await response.text();

          if (
            (response.status === 401 ||
              response.status === 403 ||
              response.status === 500) &&
            byPassRefresh
          ) {
            triggerSentry({
              title: 'ApiInstance from (line 214)',
              data: { request, options, response },
            });
            try {
              const res: BaseModel<T> = JSON.parse(result);

              return new Response(JSON.stringify({ ...res, success: true }), {
                status: 200,
              });
            } catch (error) {
              Log('Error parsing response JSON in Api Instance: ' + error);
              return new Response(result, { status: 200 });
            }
          }
        },
      ],
    },
  });

  if (data) {
    if (typeof data === 'string') {
      options.body = data;
    } else {
      const trimmedData = trimDataValues(
        data as Record<string, any> | FormData,
      );

      if (
        method === HttpMethodApi.Get ||
        method === HttpMethodApi.Delete ||
        method === HttpMethodApi.Put
      ) {
        options.searchParams = trimmedData;
      } else if (trimmedData instanceof FormData && !appendPostParamsToApiUrl) {
        options.body = trimmedData;
      } else if (method === HttpMethodApi.Post && appendPostParamsToApiUrl) {
        options.searchParams = trimmedData;
      } else {
        options.json = trimmedData;
      }
    }
  }

  // Adjust headers for multipart data
  if (data instanceof FormData) {
    options.headers['Content-Type'] = 'multipart/form-data';
    prettifyAndPrintJSON(
      `🔹Request Params Form Data :: ${apiBaseUrl}${endpoint}`,
      JSON.stringify(data),
    );
  } else {
    prettifyAndPrintJSON(
      `🔹Request Params :: {${method.toUpperCase()}} ${apiBaseUrl}${endpoint}`,
      JSON.stringify(data),
    );
  }

  // Logging Headers
  Log('🔒Request Headers::=>\n' + JSON.stringify(options.headers));
  const startTime = Date.now();
  try {
    const response = await apiCallInstance(endpoint, options);
    const endTime = Date.now() - startTime;

    if (__DEV__) {
      try {
        if (response) {
          prettifyAndPrintJSON(
            `✅{${method.toUpperCase()}} {${
              response.status
            }} Response {${formatResponseTime(endTime)}}:: ${response.url}`,
            await response.clone().text(), // Clone the response to read its body without consuming it
          );
        } else {
          Log(`Empty response from api :: ${endpoint}`);
        }
      } catch (e) {
        Log('Error in logging response =>' + e);
      }
    }

    if (response.ok) {
      if (withoutBaseModel) {
        return response.json<T>(); // Return T when `withoutBaseModel` is true
      } else {
        const result = await response.json<BaseModel<T>>();
        if (result.success) {
          return result as T; // Return BaseModel<T> when `withoutBaseModel` is false
        } else {
          throw new Error(
            !isEmpty(result.error?.message)
              ? result.error?.message
              : i18n.t('SomeErrorOccured'),
          );
        }
      }
    } else {
      return await handleResponseError(response, {
        customBaseUrl,
        endpoint,
        method,
        data,
        headers,
        withoutBaseModel,
        refreshToken,
      });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      Log(`🚨Request aborted: ${endpoint}`);
      throw new Error('');
    }
    Log('❌Request failed:' + error);

    throw new Error(i18n.t('SomeErrorOccured'));
  }
}
// Helper function to handle error response and retry logic
async function handleResponseError<T>(
  response: Response,
  requestOptions: RequestOptions & {
    withoutBaseModel: boolean;
  },
): Promise<T> {
  let errorMessage = i18n.t('SomeErrorOccured');

  switch (response.status) {
    case 400:
      errorMessage = i18n.t('SomeErrorOccured');
      break;
    case 401:
    case 403:
      errorMessage = i18n.t('Error401');
      const { setSessionOutPopup } = biometricStore.getState();

      if (!requestOptions.refreshToken) {
        const tokenRefreshed =
          userStore.getState().userDetails?.loginWith == LoginWith.auth0 ||
          userStore.getState().userDetails?.loginWith == LoginWith.oktaWithAuth0
            ? await getAuthenticationCredentials()
            : await regenerateAuthTokenApi(); // Call the general refresh token API
        if (tokenRefreshed) {
          // Retry the request with the refreshed token
          return makeRequestInternal<T>({
            ...requestOptions,
            headers: undefined,
          });
        } else {
          triggerSentry({
            title: 'ApiInstance from 401 and 403 (line 343)',
            data: requestOptions,
          });
          setSessionOutPopup(true); // show user session out screen
        }
      } else {
        triggerSentry({
          title: 'ApiInstance from 401 and 403 second else (line 351)',
          data: requestOptions,
        });
        setSessionOutPopup(true); // show user session out screen when refresh Token api returns 401 error
      }
      break;
    case 404:
      errorMessage = i18n.t('SomeErrorOccured');
      break;
    case 500:
      triggerSentry({
        title: 'ApiInstance from 500 (line 362)',
        data: { requestOptions, response },
      });
      errorMessage = i18n.t('SomeErrorOccured');
      break;
    default:
      errorMessage = i18n.t('SomeErrorOccured');
  }

  throw new Error(errorMessage);
}

// Token regeneration function
const regenerateAuthTokenApi = async (): Promise<boolean> => {
  const accessToken = await getAccessTokenFromKeychain();

  try {
    return await makeRequest<AuthenticateViaAuth0Model>({
      endpoint: ApiConstants.RefreshToken,
      method: HttpMethodApi.Post,
      data: {
        refreshToken: accessToken?.refreshToken,
      },
      refreshToken: true,
    })
      .then(async response => {
        if (response.result?.accessToken) {
          // Update user details with the new token

          const cred: Credentials = {
            accessToken: response.result?.accessToken,
            idToken: '',
            refreshToken: accessToken?.refreshToken,
            tokenType: 'Bearer',
            expiresAt: response.result?.expireInSeconds ?? 1234,
          };
          await saveAccessTokenInKeychain(JSON.stringify(cred));

          return true; // Token regeneration successful
        } else {
          Log('Token regeneration failed: No access token received');
          return false; // Token refresh failed
        }
      })
      .catch(error => {
        Log('Token regeneration error: ' + error);
        return false; // Token regeneration failed
      });
  } catch (error) {
    Log('refresh token API error=>' + error);
    return false; // Token regeneration failed
  }
};

const getAuthenticationCredentials = async () => {
  const internetAvailable = await internetReachable();
  if (!internetAvailable) {
    Log('ApiInstance=>' + i18n.t('InternetNotAvailable'));
    return false;
  } else {
    const auth0 = new Auth0({
      domain: TenantInfo.Auth0Domain,
      clientId: TenantInfo.Auth0ClientId,
    });

    if (
      userStore.getState().userDetails?.loginWith == LoginWith.auth0 ||
      userStore.getState().userDetails?.loginWith == LoginWith.oktaWithAuth0
    ) {
      //await getAuth0Token()
      return await auth0.credentialsManager
        .getCredentials()
        .then(async credentials => {
          //comparing access token
          Log('auth0 Token Refreshed=>' + JSON.stringify(credentials));
          if (credentials) {
            await saveAccessTokenInKeychain(JSON.stringify(credentials));

            return true;
          } else {
            return false;
          }
        })
        .catch(error => {
          Log('refresh auth0 Token Error=>' + JSON.stringify(error));
          return false;
        });
    } else {
      return true;
    }
  }
};
