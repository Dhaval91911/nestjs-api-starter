import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
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
  pet_id?: Types.ObjectId;
}

interface ServiceAccountJson {
  project_id: string;
  client_email: string;
  private_key: string;
}

@Injectable()
export class NotificationService {
  private projectId: string;
  private readonly logger = new Logger(NotificationService.name);

  constructor() {
    // Prefer ENV-based credentials to avoid bundling serviceAccount.json
    let sa: ServiceAccountJson | null = null;

    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      sa = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines ("\n") so that multiline keys work from .env files
        // private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        private_key: process.env.FIREBASE_PRIVATE_KEY,
      };
    } else {
      throw new Error(
        'Firebase credentials not provided. Set FIREBASE_* env vars or FIREBASE_SA_PATH'
      );
    }
    // At this point `sa` is guaranteed to be non-null
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key,
        }),
      });
    }
    this.saJson = sa;
    this.projectId = process.env.PROJECT_ID || sa.project_id;
  }

  private saJson: ServiceAccountJson;

  private async getAccessToken(): Promise<string> {
    const jwtClient = new google.auth.JWT({
      email: this.saJson.client_email,
      key: this.saJson.private_key,
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

    if (details !== undefined) {
      messageBody.details = details;
    }

    const noti_payload: Record<string, unknown> = {
      title: noti_title,
      body: noti_msg,
      // sound: sound_name + '.caf',
    };

    if (noti_image !== undefined) {
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
      this.logger.error(
        `Error sending notification: ${
          axios.isAxiosError(error) && error.response
            ? JSON.stringify(error.response.data)
            : (error as Error).message
        }`
      );
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
        this.logger.error(`Subscription failed: ${subscribeResult.error}`);
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
                sound_name && sound_name.toLowerCase() === 'none'
                  ? ''
                  : sound_name
                    ? `${sound_name}.wav`
                    : 'default',
              channel_id:
                sound_name && sound_name.toLowerCase() === 'none'
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
                  sound_name && sound_name.toLowerCase() === 'none'
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

        this.logger.log(`Notification sent to topic: ${topic}`);
      } catch (error: any) {
        this.logger.error(
          `Error sending notification to topic: ${
            axios.isAxiosError(error) && error.response
              ? JSON.stringify(error.response.data)
              : (error as Error).message
          }`
        );
      }

      const unsubscribeResult = await this.unsubscribeFromTopic(
        deviceTokenData,
        topic
      );
      if (!unsubscribeResult.success) {
        this.logger.error(`Unsubscription failed: ${unsubscribeResult.error}`);
        return;
      }

      this.logger.log('Notification sent and tokens unsubscribed');
    }
  }
}
