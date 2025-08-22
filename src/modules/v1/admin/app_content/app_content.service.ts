import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppContent } from 'src/models/app_contents.model';
import {
  AddContentDto,
  EditContentDto,
  DeleteContentDto,
  FindContentByTypeDto,
  FindContentDto,
} from './dto/app_content.dto';

@Injectable()
export class AppContentService {
  constructor(
    @InjectModel(AppContent.name) private appContentModel: Model<AppContent>
  ) {}

  async findContent(dto: FindContentDto) {
    const { content_id } = dto;

    const data = await this.appContentModel.findOne({
      _id: content_id,
      is_deleted: false,
    });

    return data;
  }

  async findContentByType(dto: FindContentByTypeDto) {
    const { content_type } = dto;

    const data = await this.appContentModel.findOne({
      content_type: content_type,
      is_deleted: false,
    });

    return data;
  }

  async addContent(dto: AddContentDto) {
    const { content_type, content } = dto;

    const insert_data = {
      content_type,
      content,
    };

    const create_content = await this.appContentModel.create(insert_data);

    return create_content;
  }

  async editContent(dto: EditContentDto) {
    const { content_id, content } = dto;

    const update_data = {
      content,
    };

    await this.appContentModel.findByIdAndUpdate(
      {
        _id: content_id,
      },
      {
        $set: update_data,
      }
    );

    const find_updated_content = await this.findContent({ content_id });

    return find_updated_content;
  }

  async deleteContent(dto: DeleteContentDto) {
    const { content_id } = dto;

    const update_data = {
      is_deleted: true,
    };

    await this.appContentModel.findByIdAndUpdate(
      {
        _id: content_id,
      },
      {
        $set: update_data,
      }
    );

    const find_updated_content = await this.findContent({ content_id });

    return find_updated_content;
  }

  async getContent() {
    const data = await this.appContentModel.find({
      is_deleted: false,
    });

    return data;
  }
}
