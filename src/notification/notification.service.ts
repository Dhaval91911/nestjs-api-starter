import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Types } from 'mongoose';

interface NotifyBase {
  noti_title: string;
  noti_msg: string;
  noti_for: string;
  review_id?: Types.ObjectId;
  id: Types.ObjectId;
  chat_room_id?: string;
  sender_id?: string;
  noti_image?: string;
  sound_name?: string;
  details?: unknown;
  device_token?: string[];
}

@Injectable()
export class NotificationService {
  private projectId = process.env.PROJECT_ID!;

  constructor() {
    const saPath = join(process.cwd(), process.env.FIREBASE_SA_PATH!);
    const serviceAccount: admin.ServiceAccount = JSON.parse(
      readFileSync(saPath, 'utf8')
    ) as unknown as admin.ServiceAccount;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    this.serviceAccount = serviceAccount;
  }

  private serviceAccount: admin.ServiceAccount;

  private async getAccessToken(): Promise<string> {
    const jwtClient = new google.auth.JWT({
      email: this.serviceAccount.clientEmail!,
      key: this.serviceAccount.privateKey!,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const { access_token } = await jwtClient.authorize();
    return access_token as string;
  }

  async subscribeToTopic(deviceTokens: string[], topic: string) {
    try {
      const res = await admin.messaging().subscribeToTopic(deviceTokens, topic);
      return { success: true, count: res.successCount };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async unsubscribeFromTopic(deviceTokens: string[], topic: string) {
    try {
      const res = await admin
        .messaging()
        .unsubscribeFromTopic(deviceTokens, topic);
      return { success: true, count: res.successCount };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  async singleNotificationSend(
    deviceToken: string,
    payload: NotifyBase
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    const {
      noti_title,
      noti_msg,
      noti_for,
      id,
      noti_image,
      details,
      sound_name,
    } = payload;

    const messageBody: Record<string, unknown> = {
      title: noti_title,
      body: noti_msg,
      noti_for: noti_for,
      id: id,
      sound: sound_name + '.caf',
    };

    if (details != undefined) {
      messageBody.details = details;
    }

    const noti_payload: Record<string, unknown> = {
      title: noti_title,
      body: noti_msg,
      // sound: sound_name + '.caf',
    };

    if (noti_image != undefined) {
      noti_payload.image = noti_image;
    }

    const message: Record<string, unknown> = {
      message: {
        token: deviceToken,
        notification: noti_payload,
        data: messageBody,
      },
    };

    try {
      await axios.post(
        'https://fcm.googleapis.com/v1/projects/' +
          this.projectId +
          '/messages:send',
        message,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      console.error('Error sending notification:', error);
    }
  }

  async multiNotificationSend(
    deviceTokenData: string[],
    payload: NotifyBase & { chat_room_id?: string; sender_id?: string }
  ): Promise<void> {
    const {
      noti_title,
      noti_msg,
      noti_for,
      id,
      noti_image,
      chat_room_id,
      sender_id,
      sound_name,
    } = payload;

    const accessToken = await this.getAccessToken();

    const topic =
      Math.floor(1000 + Math.random() * 8999) + '_' + Date.now().toString();

    if (Array.isArray(deviceTokenData) && deviceTokenData.length > 0) {
      const subscribeResult = await this.subscribeToTopic(
        deviceTokenData,
        topic
      );
      if (!subscribeResult.success) {
        console.error('Subscription failed:', subscribeResult.error);
        return;
      }

      const messageBody: Record<string, unknown> = {
        title: noti_title,
        body: noti_msg,
        noti_for: noti_for,
        id: id,
        chat_room_id: chat_room_id ? chat_room_id : null,
        sender_id: sender_id ? sender_id : null,
        // sound: sound_name + '.caf',
      };

      const noti_payload: Record<string, unknown> = {
        title: noti_title,
        body: noti_msg,
        image: noti_image,
        // sound: sound_name ? sound_name + '.caf' : 'default',
      };

      const message: Record<string, unknown> = {
        message: {
          topic: topic,
          notification: noti_payload,
          data: messageBody,
          android: {
            notification: {
              sound:
                sound_name && sound_name.toLowerCase() == 'none'
                  ? ''
                  : sound_name
                    ? `${sound_name}.wav`
                    : 'default',
              channel_id:
                sound_name && sound_name.toLowerCase() == 'none'
                  ? 'none'
                  : sound_name
                    ? `${sound_name}`
                    : 'default',
              // channel_id: sound_name ? `${sound_name}` : 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound:
                  sound_name && sound_name.toLowerCase() == 'none'
                    ? ''
                    : sound_name
                      ? `${sound_name}.caf`
                      : 'default',
                // sound: sound_name ? `${sound_name}.caf` : 'default',
              },
            },
          },
        },
      };

      try {
        await axios.post(
          `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
          message,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Notification sent to topic:', topic);
      } catch (error: any) {
        console.error(
          'Error sending notification to topic',
          axios.isAxiosError(error) && error.response
            ? error.response.data
            : (error as Error).message
        );
      }

      const unsubscribeResult = await this.unsubscribeFromTopic(
        deviceTokenData,
        topic
      );
      if (!unsubscribeResult.success) {
        console.error('Unsubscription failed:', unsubscribeResult.error);
        return;
      }

      console.log('Notification sent and tokens unsubscribed');
    }
  }
}
