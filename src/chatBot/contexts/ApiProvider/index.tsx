import React, {
  Context,
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
} from 'react';
import {URL} from 'react-native-url-polyfill';

import {FYNANCIAL_AUTHENTICATE_URI} from '../../common/consts/urls';
import {EHttpMethods} from '../../common/models/enums/http-methods';
import {isHtml} from '../../utils/isHtml';
import {IAuthContext, useAuth} from '../AuthProvider';

export interface IApiClientOptions<TBody = unknown> {
  method: EHttpMethods;
  headers?: Record<string, string>;
  body?: TBody;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
}

export interface IApiContext {
  apiClient: <TResponse = void | null, TBody = unknown>(
    baseUrl: string,
    options: IApiClientOptions<TBody>,
  ) => Promise<TResponse>;
}

const ApiContext: Context<IApiContext | undefined> = createContext<
  IApiContext | undefined
>(undefined);

export const ApiProvider: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const {refreshAuth, accessToken}: IAuthContext = useAuth();

  const apiClient = useCallback(
    async <TResponse = void | null, TBody = unknown>(
      baseUrl: string,
      options: IApiClientOptions<TBody>,
    ): Promise<TResponse> => {
      try {
        let url: string = baseUrl;
        const {
          method,
          headers = {},
          body,
          pathParams,
          queryParams,
        }: IApiClientOptions<TBody> = options;

        if (pathParams) {
          Object.keys(pathParams).forEach((key: string) => {
            const value: string | number = pathParams[key];
            url = url.replace(`:${key}`, encodeURIComponent(value.toString()));
          });
        }

        if (queryParams) {
          const urlObj = new URL(url);

          Object.keys(queryParams).forEach((key: string) => {
            const value: string | number = queryParams[key];
            urlObj.searchParams.set(key, value.toString());
          });

          url = urlObj.toString();
        }

        const defaultHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...headers,
        };

        let response: Response = await fetch(url, {
          method,
          headers: defaultHeaders,
          ...(body && {
            body: body instanceof FormData ? body : JSON.stringify(body),
          }),
        });

        if (response.status === 401 && url !== FYNANCIAL_AUTHENTICATE_URI) {
          console.log('Token expired, refreshing authentication...');
          const newToken: string | null = await refreshAuth();

          if (!newToken) {
            throw new Error('Failed to refresh authentication');
          }
          defaultHeaders.Authorization = `Bearer ${newToken}`;

          response = await fetch(url, {
            method,
            headers: defaultHeaders,
            ...(body && {body: JSON.stringify(body)}),
          });
        }

        if (!response.ok) {
          let errorText: string = await response.text();
          if (isHtml(errorText) || !errorText) errorText = 'Unexpected error';
          throw new Error(errorText);
        }

        const contentType: string | null = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return (await response.json?.()) as TResponse;
        }

        return null as TResponse;
      } catch (error) {
        console.log(`API Request Failed: ${error}`);

        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(String(error));
        }
      }
    },
    [],
  );

  return (
    <ApiContext.Provider value={{apiClient}}>{children}</ApiContext.Provider>
  );
};

export const useApi = (): IApiContext => {
  const context: IApiContext | undefined = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
