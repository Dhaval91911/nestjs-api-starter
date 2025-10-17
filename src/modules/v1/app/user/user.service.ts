import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/models/users.model';
import {
  UserSession,
  UserSessionDocument,
} from 'src/models/user_sessions.model';
import { UserAlbum } from 'src/models/user_albums.model';
import { EmailVerification } from 'src/models/email_verifications.model';
import { Guest } from 'src/models/guests.model';
import {
  FindGuestUserDto,
  FindDeviceTokenDto,
  CheckEmailAddressDto,
  CheckMobileNumberDto,
  GuestSessionDto,
  SignUpDto,
  SignInUserDto,
  LogoutDto,
  SendOtpForgotPasswordUserDto,
  VerifyOtpUserDto,
  ResetPasswordUserDto,
  findVerifyEmailAddressDto,
  EditProfileDto,
  UploadMediaDto,
  RemoveMediaDto,
  ChangePasswordUserDto,
} from './dto/user.dto';
import {
  securePassword,
  comparePassword,
} from 'src/utils/secure_password.util';
import { userToken, generateRefreshToken } from 'src/utils/token.util';
import { BucketUtil } from 'src/utils/bucket.util';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Notification } from 'src/models/notifications.model';
import { NotificationService } from './../../../../notification/notification.service';
import Stripe from 'stripe';
import { sendOtpForgotPasswordUser } from 'src/utils/mailer.util';

interface GuestInsertData {
  device_token?: string;
  device_type: 'web' | 'android' | 'ios';
  address?: string;
  location?: unknown;
}

interface UserInsertData {
  full_name: string;
  email_address: string;
  country_code?: string;
  country_string_code?: string;
  mobile_number?: number;
  address?: string;
  is_social_login?: boolean;
  social_id?: string;
  social_platform?: string;
  password?: string;
  location?: unknown;
  customer_id?: string;
}
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private stripe: Stripe;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSession>,
    @InjectModel(EmailVerification.name)
    private emailVerificationModel: Model<EmailVerification>,
    @InjectModel(Guest.name) private guestModel: Model<Guest>,
    @InjectModel(UserAlbum.name) private userAlbumModel: Model<UserAlbum>,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private readonly configService: ConfigService,
    private readonly bucketUtil: BucketUtil,
    private readonly notificationService: NotificationService
  ) {
    {
      const stripeSecretKey =
        this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not defined');
      }
      this.stripe = new Stripe(stripeSecretKey, {
        // Set a valid API version to satisfy typing and eslint
        apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
      });
    }
  }

  async createPresignedUpload(contentType: string, folder = 'user_media') {
    const bucket = process.env.BUCKET_NAME as string;
    const key = `${process.env.BUCKET_ENV}${folder}/${Math.floor(1000 + Math.random() * 8000)}_${Date.now()}`;
    const client = new S3Client({});
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
      ServerSideEncryption: 'AES256',
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const url = (await getSignedUrl(client, command, {
      expiresIn: 900,
    })) as string;
    return { url, key };
  }

  async resetPassword(dto: ResetPasswordUserDto) {
    const { email_address, mobile_number, new_password } = dto;

    if (!email_address && !mobile_number) {
      throw new Error('INVALID_REQUEST');
    }

    let find_user: UserDocument | null = null;
    let notFoundError = '';

    if (email_address) {
      find_user = await this.userModel.findOne({
        email_address: email_address,
        user_type: 'user',
        is_deleted: false,
      });
      notFoundError = 'NO_ACCOUNT_EMAIL';
    } else if (mobile_number) {
      find_user = await this.userModel.findOne({
        mobile_number: mobile_number,
        user_type: 'user',
        is_deleted: false,
      });
      notFoundError = 'NO_ACCOUNT_MOBILE';
    }

    if (!find_user) {
      throw new Error(notFoundError);
    }

    const hashedPassword = await securePassword(new_password);

    await this.userModel.updateOne(
      { _id: find_user._id },
      { password: hashedPassword }
    );

    return true;
  }

  async userUpdatedData(user: { _id: Types.ObjectId }) {
    const { _id } = user;

    const find_user = await this.userModel.findOne({ _id, is_deleted: false });
    if (!find_user) {
      throw new Error('USER_NOT_FOUND');
    }

    const latestAlbum = await this.userAlbumModel.find({
      user_id: _id,
      album_type: 'image',
    });

    const user_profile = latestAlbum[0]?.album_path
      ? process.env.BUCKET_URL! + latestAlbum[0].album_path
      : null;

    const album_id =
      (latestAlbum && (latestAlbum[0]?._id as unknown as string)) || null;

    const rawObj = find_user.toObject() as unknown as Record<
      string,
      unknown
    > & {
      password?: unknown;
    };
    delete rawObj.password;

    const res_data: Record<string, unknown> = {
      ...rawObj,
      user_profile,
      album_id,
    };

    return res_data;
  }

  async editProfile(dto: EditProfileDto, user: { _id: Types.ObjectId }) {
    const { _id: user_id } = user;
    const find_user = await this.userModel.findOne({
      _id: user_id,
      is_deleted: false,
    });
    if (!find_user) {
      throw new Error('USER_NOT_FOUND');
    }

    const {
      full_name,
      mobile_number,
      country_code,
      country_string_code,
      location,
      address,
    } = dto;

    const update_data: Record<string, unknown> = {};
    if (typeof full_name === 'string') update_data.full_name = full_name;
    if (typeof country_code === 'string')
      update_data.country_code = country_code;
    if (typeof country_string_code === 'string')
      update_data.country_string_code = country_string_code;
    if (typeof address === 'string') update_data.address = address;

    if (typeof mobile_number === 'number') {
      const exists = await this.userModel.findOne({
        _id: { $ne: user_id },
        mobile_number: mobile_number,
        is_deleted: false,
      });
      if (exists) {
        throw new Error('MOBILE_EXISTS');
      }
      update_data.mobile_number = mobile_number;
    }

    if (typeof location === 'string') {
      try {
        const parsed = JSON.parse(location) as unknown;
        update_data.location = parsed;
      } catch {
        throw new Error('INVALID_LOCATION');
      }
    }

    if (Object.keys(update_data).length > 0) {
      await this.userModel.updateOne({ _id: user_id }, { $set: update_data });
    }

    // Return the latest user data with profile info
    return this.userUpdatedData(user);
  }

  async findGuestUser(dto: FindGuestUserDto) {
    const { device_token } = dto;

    const data = await this.guestModel.findOne({
      device_token: device_token,
    });

    return data;
  }

  async findVerifyEmailAddress(dto: findVerifyEmailAddressDto) {
    const { email_address } = dto;

    const data = await this.emailVerificationModel.findOne({
      email_address: email_address,
      is_email_verified: true,
      is_deleted: false,
    });

    return data;
  }

  async guestSession(dto: GuestSessionDto) {
    const { device_token, device_type, location, address } = dto;

    const find_guest_user = await this.findGuestUser({ device_token });

    if (find_guest_user) {
      await this.guestModel.deleteMany({ device_token: device_token });
    }

    const insert_data: GuestInsertData = {
      device_token: device_token,
      device_type: device_type,
      address: address,
    };

    if (location) {
      const location_json_parse: Record<string, unknown> = JSON.parse(
        location
      ) as unknown as Record<string, unknown>;
      insert_data.location = location_json_parse;
    }

    const guest = await this.guestModel.create(insert_data);

    return guest;
  }

  async checkEmailAddress(dto: CheckEmailAddressDto) {
    const { email_address } = dto;

    const data = await this.userModel.findOne({
      email_address: email_address,
      is_deleted: false,
    });

    return data;
  }

  async checkMobileNumber(dto: CheckMobileNumberDto) {
    const { mobile_number } = dto;

    const data = await this.userModel.findOne({
      mobile_number: mobile_number,
      is_deleted: false,
    });

    return data;
  }

  async findDeviceToken(dto: FindDeviceTokenDto) {
    const { user_id } = dto;
    const device_token = await this.userSessionModel
      .find({
        user_id: user_id,
        device_token: { $ne: null },
      })
      .distinct('device_token');

    return device_token;
  }

  async signUp(dto: SignUpDto) {
    const {
      full_name,
      email_address,
      country_code,
      country_string_code,
      mobile_number,
      is_social_login,
      social_id,
      social_platform,
      device_token,
      device_type,
      password,
      location,
      address,
    } = dto;

    const insert_data: UserInsertData = {
      full_name: full_name,
      email_address: email_address,
      country_code: country_code,
      country_string_code: country_string_code,
      mobile_number: mobile_number,
      address: address,
    };

    if (is_social_login === true) {
      insert_data.is_social_login = is_social_login;
      insert_data.social_id = social_id;
      insert_data.social_platform = social_platform;
    }

    if (password) {
      const hashedPassword = await securePassword(password);
      insert_data.password = hashedPassword;
    }

    if (location) {
      const location_json_parse: Record<string, unknown> = JSON.parse(
        location
      ) as unknown as Record<string, unknown>;
      insert_data.location = location_json_parse;
    }

    await this.emailVerificationModel.create({
      email_address: email_address,
      is_email_verified: true,
    });

    const customer = await this.stripe.customers.create({
      name: full_name,
      email: email_address,
    });

    if (customer) {
      insert_data.customer_id = customer.id;
    }

    const create_user = await this.userModel.create(insert_data);

    const token = userToken(create_user._id);

    const { refreshToken, refreshTokenHash, expiresAt } =
      await generateRefreshToken();

    const session = await this.userSessionModel.create({
      user_id: create_user._id,
      user_type: 'user',
      device_token: device_token,
      auth_token: token,
      refresh_token_hash: refreshTokenHash,
      refresh_token_expires_at: expiresAt,
      device_type: device_type,
      is_login: true,
      is_active: true,
    });

    await this.guestModel.deleteMany({
      device_token: device_token,
      device_type: device_type,
    });

    const res_data = {
      ...create_user.toObject(),
      token: token,
      refresh_token: refreshToken,
      device_token: session.device_token,
      device_type: session.device_type,
      user_profile: null,
    };

    return res_data;
  }

  async signIn(dto: SignInUserDto): Promise<Record<string, unknown>> {
    const {
      email_address,
      full_name,
      device_type,
      device_token,
      password,
      is_social_login,
      social_id,
      social_platform,
      location,
      address,
    } = dto;

    if (is_social_login === true) {
      let find_user: UserDocument | null = null;

      if (email_address) {
        find_user = await this.userModel.findOne({
          email_address: email_address,
          is_social_login: true,
          is_deleted: false,
        });
      } else {
        find_user = await this.userModel.findOne({
          is_social_login: true,
          social_id: social_id,
          is_deleted: false,
        });
      }

      if (find_user) {
        if (
          find_user.social_platform !== null &&
          social_platform &&
          find_user.social_platform !== social_platform
        ) {
          throw new Error(`PLATFORM_MISMATCH:${find_user.social_platform}`);
        }
        if (find_user.is_blocked_by_admin === true) {
          throw new Error('USER_BLOCKED');
        }

        const token = userToken(find_user._id as Types.ObjectId);
        const { refreshToken, refreshTokenHash, expiresAt } =
          await generateRefreshToken();

        const session = await this.userSessionModel.create({
          user_id: find_user._id,
          user_type: 'user',
          device_token: device_token,
          auth_token: token,
          refresh_token_hash: refreshTokenHash,
          refresh_token_expires_at: expiresAt,
          device_type: device_type,
          is_login: true,
          is_active: true,
        });

        await this.guestModel.deleteMany({
          device_token: device_token,
          device_type: device_type,
        });

        const user_album = await this.userAlbumModel.find({
          user_id: find_user._id,
          album_type: 'image',
        });

        const user_profile = user_album?.[0]?.album_path
          ? process.env.BUCKET_URL! + user_album[0].album_path
          : null;

        const rawObj = find_user.toObject() as unknown as Record<
          string,
          unknown
        > & {
          password?: unknown;
        };
        delete rawObj.password;

        const res_data: Record<string, unknown> = {
          ...rawObj,
          token: token,
          refresh_token: refreshToken,
          device_token: session.device_token,
          device_type: session.device_type,
          user_profile: user_profile,
        };

        return res_data;
      } else {
        if (email_address) {
          const find_existing_user = await this.userModel.findOne({
            email_address: email_address,
            is_social_login: true,
            is_blocked_by_admin: true,
            is_deleted: false,
          });

          if (find_existing_user) {
            throw new Error('USER_BLOCKED');
          }
        }

        const insert_data: UserInsertData = {
          email_address: email_address as string,
          full_name: full_name as string,
          is_social_login: true,
          social_id,
          social_platform,
          address,
        };

        if (location) {
          const location_json_parse = JSON.parse(location) as unknown as Record<
            string,
            unknown
          >;
          insert_data.location = location_json_parse;
        }

        await this.emailVerificationModel.create({
          email_address: email_address as string,
          is_email_verified: true,
        });

        const customer = await this.stripe.customers.create({
          name: full_name as string,
          email: email_address as string,
        });

        if (customer) {
          insert_data.customer_id = customer.id;
        }

        const create_user = await this.userModel.create(insert_data);

        const token = userToken(create_user._id as unknown as Types.ObjectId);
        const { refreshToken, refreshTokenHash, expiresAt } =
          await generateRefreshToken();

        const session = await this.userSessionModel.create({
          user_id: create_user._id,
          user_type: 'user',
          device_token: device_token as string,
          auth_token: token,
          refresh_token_hash: refreshTokenHash,
          refresh_token_expires_at: expiresAt,
          device_type: device_type,
          is_login: true,
          is_active: true,
        });

        await this.guestModel.deleteMany({
          device_token: device_token,
          device_type: device_type,
        });

        const user_album = await this.userAlbumModel.find({
          user_id: create_user._id,
          album_type: 'image',
        });

        const user_profile = user_album?.[0]?.album_path
          ? process.env.BUCKET_URL! + user_album[0].album_path
          : null;

        const rawObj = create_user.toObject() as unknown as Record<
          string,
          unknown
        > & {
          password?: unknown;
        };
        delete rawObj.password;

        const res_data: Record<string, unknown> = {
          ...rawObj,
          token: token,
          refresh_token: refreshToken,
          device_token: session.device_token,
          device_type: session.device_type,
          user_profile: user_profile,
        };

        return res_data;
      }
    } else {
      const find_user = await this.userModel.findOne({
        email_address: email_address,
        is_deleted: false,
      });

      if (!find_user) {
        throw new Error('NO_ACCOUNT');
      }

      if (find_user.is_social_login === true) {
        const platform = find_user.social_platform || 'social';
        throw new Error(`PLATFORM_MISMATCH:${platform}`);
      }

      if (!password) {
        throw new Error('PASSWORD_REQUIRED');
      }

      const password_verify = await comparePassword(
        password,
        (find_user.password as string) || ''
      );

      if (!password_verify) {
        throw new Error('INCORRECT_PASSWORD');
      }

      if (find_user.is_blocked_by_admin === true) {
        throw new Error('USER_BLOCKED');
      }

      const token = userToken(find_user._id as unknown as Types.ObjectId);
      const { refreshToken, refreshTokenHash, expiresAt } =
        await generateRefreshToken();

      await this.userSessionModel.create({
        user_id: find_user._id,
        user_type: 'user',
        device_token: device_token as string,
        auth_token: token,
        refresh_token_hash: refreshTokenHash,
        refresh_token_expires_at: expiresAt,
        device_type: device_type,
        is_login: true,
        is_active: true,
      });

      await this.guestModel.deleteMany({
        device_token: device_token,
        device_type: device_type,
      });

      const user_album = await this.userAlbumModel.find({
        user_id: find_user._id,
        album_type: 'image',
      });

      const user_profile = user_album?.[0]?.album_path
        ? process.env.BUCKET_URL! + user_album[0].album_path
        : null;

      const rawObj = find_user.toObject() as unknown as Record<
        string,
        unknown
      > & {
        password?: unknown;
      };
      delete rawObj.password;

      const res_data: Record<string, unknown> = {
        ...rawObj,
        token: token,
        refresh_token: refreshToken,
        device_token: device_token,
        device_type: device_type,
        user_profile: user_profile,
      };

      return res_data;
    }
  }

  async rotateRefreshToken(refreshToken: string, device_token: string) {
    const sessions: UserSessionDocument[] = await this.userSessionModel.find({
      device_token,
      is_active: true,
    });
    let matchedSession: UserSessionDocument | null = null;
    for (const sess of sessions) {
      if (!sess.refresh_token_hash) continue;
      const match = await comparePassword(
        refreshToken,
        sess.refresh_token_hash
      );
      const notExpired =
        !sess.refresh_token_expires_at ||
        sess.refresh_token_expires_at > new Date();
      if (match && notExpired) {
        matchedSession = sess;
        break;
      }
    }
    if (!matchedSession) {
      // Reuse detection: if a token is presented that does not match any active session on this device,
      // revoke all sessions for safety.
      await this.userSessionModel.updateMany(
        { device_token },
        { $set: { is_active: false } }
      );
      throw new Error('REFRESH_REUSED_OR_INVALID');
    }
    const newAccess = userToken(
      matchedSession.user_id as unknown as Types.ObjectId
    );
    const {
      refreshToken: newRefresh,
      refreshTokenHash,
      expiresAt,
    } = await generateRefreshToken();
    await this.userSessionModel.updateOne(
      { _id: matchedSession._id },
      {
        $set: {
          auth_token: newAccess,
          refresh_token_hash: refreshTokenHash,
          refresh_token_expires_at: expiresAt,
        },
      }
    );
    return { token: newAccess, refresh_token: newRefresh };
  }

  async logoutAll(user: { _id: Types.ObjectId }): Promise<void> {
    await this.userSessionModel.updateMany(
      { user_id: user._id },
      { $set: { is_active: false } }
    );
  }

  async sendOtpForgotPassword(dto: SendOtpForgotPasswordUserDto) {
    const { email_address } = dto;

    const find_user = await this.userModel.findOne({
      email_address: email_address,
      user_type: 'user',
      is_deleted: false,
    });

    if (!find_user) {
      throw new Error('NO_ACCOUNT');
    }

    if (find_user.is_social_login === true) {
      const platform = find_user.social_platform || 'social';
      throw new Error(`PLATFORM_MISMATCH:${platform}`);
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    await this.emailVerificationModel.updateOne(
      {
        email_address: email_address,
        is_email_verified: true,
        is_deleted: false,
      },
      {
        $set: { otp },
      }
    );

    await sendOtpForgotPasswordUser({
      fullName: find_user.full_name ?? null,
      emailAddress: find_user.email_address,
      otp,
    });

    return otp;
  }

  async verifyOtp(dto: VerifyOtpUserDto) {
    const { email_address, otp } = dto;

    const find_user = await this.emailVerificationModel.findOne({
      email_address: email_address,
      is_email_verified: true,
      is_deleted: false,
    });

    if (find_user?.otp !== null && find_user?.otp === otp) {
      const update_data = { otp: null } as { otp: number | null };

      await this.emailVerificationModel.updateOne(
        {
          email_address: email_address,
          is_email_verified: true,
          is_deleted: false,
        },
        {
          $set: update_data,
        }
      );

      return true;
    } else {
      return false;
    }
  }

  async logout(dto: LogoutDto, user: { _id: Types.ObjectId }) {
    const { device_token } = dto;
    const { _id } = user;

    const find_user = await this.userModel.findOne({ _id, is_deleted: false });
    if (!find_user) {
      throw new Error('USER_NOT_FOUND');
    }

    await this.userSessionModel.updateMany(
      { user_id: _id, device_token: device_token },
      { is_active: false },
      { upsert: true }
    );

    return true;
  }

  async uploadMedia(
    dto: UploadMediaDto,
    files: { [fieldname: string]: Express.Multer.File[] },
    user: { _id: Types.ObjectId }
  ): Promise<UserAlbum> {
    const { _id } = user;
    const { album_type } = dto;
    const albumArr = files.album;
    const thumbnailArr = files.thumbnail;
    if (!albumArr || albumArr.length === 0) {
      throw new Error('Album file is required');
    }

    const find_old_user_album = await this.userAlbumModel.findOne({
      user_id: _id,
      album_type: 'image',
    });

    if (find_old_user_album) {
      await this.bucketUtil.removeMediaFromS3Bucket(
        find_old_user_album.album_path!
      );
      await this.userAlbumModel.deleteOne({ _id: find_old_user_album._id });
    }

    const album = albumArr[0] as Express.Multer.File;
    const thumbnail =
      thumbnailArr && thumbnailArr.length > 0 ? thumbnailArr[0] : undefined;

    const folder_name = 'user_media';
    const content_type = album.mimetype;

    const res_upload_file = await this.bucketUtil.uploadMediaIntoS3Bucket(
      album,
      folder_name,
      content_type
    );

    if (res_upload_file.status) {
      if (thumbnail !== undefined && album_type === 'video') {
        const folder_name_thumbnail = 'video_thumbnail';
        const content_type_thumbnail = thumbnail.mimetype;

        const res_upload_thumbnail_file =
          await this.bucketUtil.uploadMediaIntoS3Bucket(
            thumbnail,
            folder_name_thumbnail,
            content_type_thumbnail
          );

        if (res_upload_thumbnail_file.status) {
          const user_image_path = `${folder_name}/` + res_upload_file.file_name;
          const thumbnail_image_path =
            `${folder_name_thumbnail}/` + res_upload_thumbnail_file.file_name;

          const fileData = {
            user_id: _id,
            album_type: album_type,
            album_thumbnail: thumbnail_image_path,
            album: user_image_path,
          };

          const add_albums = await this.userAlbumModel.create(fileData);

          add_albums.album_path =
            process.env.BUCKET_URL! + add_albums.album_path!;
          add_albums.album_thumbnail =
            process.env.BUCKET_URL! + add_albums.album_thumbnail!;

          return add_albums;
        }
      } else {
        const user_image_path = `${folder_name}/` + res_upload_file.file_name;

        const fileData = {
          user_id: _id,
          album_type: album_type,
          album_thumbnail: null,
          album_path: user_image_path,
        };

        const add_albums = await this.userAlbumModel.create(fileData);

        add_albums.album_path =
          process.env.BUCKET_URL! + add_albums.album_path!;

        return add_albums;
      }
    }
    throw new Error('Failed to upload media');
  }

  async removeMedia(
    dto: RemoveMediaDto,
    user: { _id: Types.ObjectId }
  ): Promise<void> {
    const { album_id } = dto;
    const { _id: user_id } = user;

    const userAlbum = await this.userAlbumModel.findOne({
      _id: album_id,
      user_id: user_id,
    });

    if (!userAlbum) {
      throw new Error('ALBUM_NOT_FOUND');
    }

    const res_remove_file = await this.bucketUtil.removeMediaFromS3Bucket(
      userAlbum.album_path!
    );

    if (userAlbum.album_type === 'video' && userAlbum.album_thumbnail) {
      await this.bucketUtil.removeMediaFromS3Bucket(userAlbum.album_thumbnail);
    }

    if (res_remove_file.status) {
      await this.userAlbumModel.deleteOne({
        _id: album_id,
      });
    } else {
      throw new Error('FAILED_TO_REMOVE_USER_MEDIA');
    }
  }

  async changePassword(
    dto: ChangePasswordUserDto,
    user: { _id: Types.ObjectId }
  ): Promise<void> {
    const { old_password, new_password } = dto;
    const { _id: user_id } = user;

    const find_user = await this.userModel.findOne({
      _id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (find_user.is_social_login === true) {
      throw new Error(
        `SOCIAL_LOGIN_PASSWORD_CHANGE:${find_user.social_platform}`
      );
    }

    const password_verify = await comparePassword(
      old_password,
      find_user.password!
    );

    if (!password_verify) {
      throw new Error('OLD_PASSWORD_INCORRECT');
    }

    const hashedPassword = await securePassword(new_password);

    if (find_user.password === hashedPassword) {
      throw new Error('PASSWORD_SIMILAR');
    }

    await this.userModel.findByIdAndUpdate(user_id, {
      password: hashedPassword,
    });
  }

  async sendNotifications(user: { _id: Types.ObjectId }): Promise<void> {
    const { _id: user_id } = user;

    console.log({ user_id });

    const find_user = await this.userModel.findOne({
      _id: user_id,
      is_deleted: false,
    });

    if (!find_user) {
      throw new Error('USER_NOT_FOUND');
    }

    const device_tokens = await this.userSessionModel.find({
      user_id: user_id,
      is_active: true,
    });

    if (device_tokens.length > 0) {
      const device_tokens_array = device_tokens.map(
        (token) => token.device_token
      );

      const user_album_data = await this.userAlbumModel.find({
        user_id: user_id,
        album_type: 'image',
      });

      const noti_msg = `This is a test notification`;
      const noti_title = 'Test Notification';
      const noti_for = 'test';
      const noti_image = `${process.env.BUCKET_URL}${user_album_data[0]?.album_path}`;

      if (device_tokens_array.length > 0) {
        await this.notificationService.multiNotificationSend(
          device_tokens_array,
          {
            noti_msg,
            noti_title,
            noti_for,
            noti_image,
            id: user_id,
          }
        );

        await this.userModel.updateOne(
          {
            _id: user_id,
            is_deleted: false,
          },
          {
            $inc: {
              notification_badge: 1,
            },
          }
        );
      }
    }
  }

  async deleteAccount(user: { _id: Types.ObjectId }): Promise<void> {
    const { _id: user_id } = user;

    const find_user = await this.userModel.findOne({
      _id: user_id,
      is_deleted: false,
    });
    if (!find_user) {
      throw new Error('USER_NOT_FOUND');
    }

    await this.userModel.updateOne(
      { _id: user_id },
      { $set: { is_deleted: true } },
      { new: true }
    );

    return;
  }
}
