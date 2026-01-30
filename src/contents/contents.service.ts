import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private contentsRepository: Repository<Content>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const content = this.contentsRepository.create(createContentDto);
    return this.contentsRepository.save(content);
  }

  async findAll(type?: ContentType, publishedOnly: boolean = false): Promise<Content[]> {
    const query = this.contentsRepository.createQueryBuilder('content');

    if (type) {
      query.where('content.type = :type', { type });
    }

    if (publishedOnly) {
      query.andWhere('content.published = :published', { published: true });
    }

    return query.orderBy('content.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, publishedOnly: boolean = false): Promise<Content> {
    const query = this.contentsRepository.createQueryBuilder('content')
      .where('content.id = :id', { id });

    if (publishedOnly) {
      query.andWhere('content.published = :published', { published: true });
    }

    const content = await query.getOne();

    if (!content) {
      throw new NotFoundException('Conteúdo não encontrado');
    }

    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(id);
    Object.assign(content, updateContentDto);
    return this.contentsRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentsRepository.remove(content);
  }
}

