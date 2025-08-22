import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/models/users.model';
import { UserSession } from 'src/models/user_sessions.model';
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
  UploadMediaDto,
} from './dto/user.dto';
import { securePassword } from 'src/utils/secure_password.util';
import { userToken } from 'src/utils/token.util';
import { BucketUtil } from 'src/utils/bucket.util';
import Stripe from 'stripe';

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
    private readonly configService: ConfigService,
    private readonly bucketUtil: BucketUtil
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

  async findGuestUser(dto: FindGuestUserDto) {
    const { device_token } = dto;

    const data = await this.guestModel.findOne({
      device_token: device_token,
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

    if (is_social_login == true) {
      insert_data.is_social_login = is_social_login;
      insert_data.social_id = social_id;
      insert_data.social_platform = social_platform;
    }

    if (password) {
      const hashedPassword = securePassword(password);
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

    const session = await this.userSessionModel.create({
      user_id: create_user._id,
      user_type: 'user',
      device_token: device_token,
      auth_token: token,
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
      device_token: session.device_token,
      device_type: session.device_type,
      user_profile: null,
    };

    return res_data;
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
      if (thumbnail !== undefined && album_type == 'video') {
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
}
