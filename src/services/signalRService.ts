// services/signalRService.ts
import {
  GetNotificationListModel,
  GetTenantIdByNameModel,
  GetUserDetailForProfileModel,
  SignalRMessageModel,
  SignalRMessageReadModel,
} from '@/services/models';
import {
  badgesStore,
  templateStore,
  tenantDetailStore,
  userStore,
} from '@/store';
import useSignalRStore from '@/store/signalRStore/signalRStore';
import { getAccessTokenFromKeychain } from '@/utils/keychainUtils';
import Log from '@/utils/logger';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { ApiConstants } from './apiConstants';
import { HttpMethodApi, makeRequest } from './apiInstance';

class SignalRService {
  private connection: HubConnection | null = null;
  private isConnecting = false;

  async start() {
    if (this.isConnecting) return;

    if (this.connection) {
      const state = this.connection.state;
      if (state !== 'Disconnected') {
        Log('SignalRService: already started or reconnecting');
        return;
      }
    }

    const user = userStore.getState().userDetails;
    const tenantDetail = tenantDetailStore.getState().tenantDetails;

    if (!user || !tenantDetail) {
      Log('SignalRService: missing user , not starting');
      return;
    }

    this.isConnecting = true;

    try {
      const accessToken = await getAccessTokenFromKeychain();

      if (accessToken) {
        this.handleStart(accessToken.accessToken, tenantDetail, user);
      } else {
        Log('SignalRService handleStart: missing user or token, not starting');
      }
    } catch (err) {
      Log('❌ SignalR connection error: ' + err);
      this.connection = null;
      useSignalRStore.getState().setIsConnected(false);
    } finally {
      this.isConnecting = false;
    }
  }

  private async handleStart(
    token?: string,
    tenantDetail?: GetTenantIdByNameModel,
    user?: GetUserDetailForProfileModel,
  ) {
    if (!token || !user || !tenantDetail) {
      Log('SignalRService handleStart: missing user or token, not starting');
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${tenantDetail.tenantURL}signalr-chat`, {
        accessTokenFactory: () => token,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.registerHandlers(token);

    await this.connection.start();
    useSignalRStore.getState().setIsConnected(true);
    Log('✅ SignalR connected');
  }

  private registerHandlers(token?: string) {
    if (!this.connection) return;

    const store = useSignalRStore.getState();
    const setBadges = badgesStore.getState().setBadges;

    this.connection.on('ReceiveNotification', (data: SignalRMessageModel) => {
      Log('📩 ReceiveNotification => ' + JSON.stringify(data));
      store.setMessageList(data);
    });

    this.connection.on('makeUserLogOut', (data: SignalRMessageModel) => {
      Log('📩 makeUserLogOut => ' + JSON.stringify(data));
      store.setUserLogOut(data);
    });

    this.connection.on(
      'changeStatusChatMessage',
      (data: SignalRMessageModel) => {
        Log('🔄 changeStatusChatMessage => ' + JSON.stringify(data));
        store.setUserWithUpdatedStatus(data);
      },
    );

    this.connection.on('deleteGroup', (data: SignalRMessageModel) => {
      Log('🔄 deleteGroup => ' + JSON.stringify(data));
      store.setDeletedGroup(data);
    });

    this.connection.on('updateNotificationThreadCount', value => {
      Log('🔔 updateNotificationThreadCount => ' + JSON.stringify(value));
      setBadges(prev => ({ ...prev, messageCount: value }));
    });

    this.connection.on('getNotificationEvent', value => {
      Log('🔔 getNotificationEvent => ' + JSON.stringify(value));

      // Extract the notificationName from the received value

      const notificationName = value?.[0]?.notification?.notificationName;

      Log('notificationName : : ' + notificationName);

      store.setNotificationType('');

      setTimeout(() => {
        store.setNotificationType(notificationName);
      }, 0);

      try {
        makeRequest<GetNotificationListModel>({
          endpoint: ApiConstants.GetUserNotifications,
          method: HttpMethodApi.Get,
          data: {},
        }).then(data => {
          setBadges(prev => ({
            ...prev,
            notificationCount:
              data.result?.unseenCount == 0 ? 0 : data.result?.unseenCount,
          }));
        });
      } catch (e) {
        Log('GetUserNotifications error=>' + e);
      }

      if (
        !userStore.getState().userDetails?.isAdvisor &&
        templateStore.getState().selectedTemplate
      ) {
        try {
          makeRequest<boolean>({
            endpoint: ApiConstants.GetFeedHasNewInfo,
            method: HttpMethodApi.Get,
            data: {
              Id: templateStore.getState().selectedTemplate?.groupID,
            },
          }).then(data => {
            setBadges(prev => ({
              ...prev,
              hasNewFeed: data.result,
            }));
          });
        } catch (e) {
          Log('GetFeedHasNewInfo error=>' + e);
        }
      }
    });

    this.connection.on('updateNotificationBellCount', value => {
      Log('🔔 updateNotificationBellCount => ' + JSON.stringify(value));
      setBadges(prev => ({ ...prev, notificationCount: 0 }));
    });

    this.connection.on('getUnreadCount', (data: SignalRMessageReadModel) => {
      Log('📩 getUnreadCount => ' + JSON.stringify(data));
      store.setMessageRead(data);
    });

    this.connection.onclose(() => {
      Log('⚠️ SignalR connection closed');
      this.connection = null;
      useSignalRStore.getState().setIsConnected(false);

      // Auto-reconnect only if logged in
      const stillLoggedIn = !!userStore.getState().userDetails && !!token;
      if (stillLoggedIn) {
        Log('♻️ Restarting SignalR after close...');
        setTimeout(() => this.start(), 1000);
      }
    });
  }

  async stop() {
    if (this.connection) {
      // 🔴 Remove handlers before stopping
      this.connection.off('ReceiveNotification');
      this.connection.off('makeUserLogOut');
      this.connection.off('changeStatusChatMessage');
      this.connection.off('updateNotificationThreadCount');
      this.connection.off('getNotificationEvent');
      this.connection.off('updateNotificationBellCount');
      this.connection.off('getUnreadCount');

      await this.connection.stop();
      this.connection = null;
      useSignalRStore.getState().setIsConnected(false);
      Log('🛑 SignalR stopped');
    }
  }
}

export default new SignalRService();
