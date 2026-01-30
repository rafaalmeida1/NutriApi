import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ebook } from './entities/ebook.entity';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import { UploadService } from '../upload/upload.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class EbooksService {
  constructor(
    @InjectRepository(Ebook)
    private ebooksRepository: Repository<Ebook>,
    private uploadService: UploadService,
    private usersService: UsersService,
  ) {}

  async create(createEbookDto: CreateEbookDto): Promise<Ebook> {
    try {
      const ebook = this.ebooksRepository.create({
        title: createEbookDto.title,
        description: createEbookDto.description || null,
        coverUrl: createEbookDto.coverUrl || null,
        pdfUrl: createEbookDto.pdfUrl || null,
        published: createEbookDto.published ?? false, // Usar o valor do DTO ou false por padrão
        visibleToAll: createEbookDto.visibleToAll ?? true, // Por padrão, visível para todos
      });

      // Se não for visível para todos, associar aos pacientes específicos
      if (!ebook.visibleToAll && createEbookDto.visibleToUserIds?.length) {
        const users = await this.usersService.findByIds(createEbookDto.visibleToUserIds);
        ebook.visibleToUsers = users;
      }

      const savedEbook = await this.ebooksRepository.save(ebook);
      
      // Carregar relacionamentos para retornar completo
      const ebookWithRelations = await this.ebooksRepository.findOne({
        where: { id: savedEbook.id },
        relations: ['visibleToUsers'],
      });
      
      console.log(`✅ E-book criado: ${savedEbook.id} - ${savedEbook.title}`);
      return ebookWithRelations || savedEbook;
    } catch (error: any) {
      console.error('Erro ao criar e-book:', error);
      throw error;
    }
  }

  async findAll(publishedOnly: boolean = false, userId?: string, isAdmin: boolean = false): Promise<Ebook[]> {
    // Se for admin, retornar TODOS os e-books (incluindo não publicados e específicos)
    if (isAdmin) {
      return this.ebooksRepository.find({
        relations: ['visibleToUsers'],
        order: { createdAt: 'DESC' },
      });
    }

    // Para não-admin: apenas e-books publicados
    const query = this.ebooksRepository
      .createQueryBuilder('ebook')
      .leftJoinAndSelect('ebook.visibleToUsers', 'user')
      .where('ebook.published = :published', { published: true });

    // Se tiver userId (paciente autenticado), filtrar por visibilidade
    if (userId) {
      // Mostrar e-books que são:
      // 1. Visíveis para todos (visibleToAll = true) OU
      // 2. O usuário está na lista de visibleToUsers
      // Usar subquery com IN para verificar se o usuário está na tabela de relacionamento
      query.andWhere(
        '(ebook.visibleToAll = :visibleToAll OR :userId IN (SELECT eu.user_id FROM ebook_users eu WHERE eu.ebook_id = ebook.id))',
        { visibleToAll: true, userId }
      );
    } else {
      // Se não tiver userId (não autenticado), mostrar apenas os visíveis para todos
      query.andWhere('ebook.visibleToAll = :visibleToAll', { visibleToAll: true });
    }

    const ebooks = await query.orderBy('ebook.createdAt', 'DESC').getMany();
    
    // Log para debug
    console.log(`📚 E-books encontrados: ${ebooks.length} (publishedOnly: ${publishedOnly}, userId: ${userId || 'none'}, isAdmin: ${isAdmin})`);
    if (ebooks.length > 0) {
      console.log(`   E-books: ${ebooks.map(e => `${e.title} (published: ${e.published}, visibleToAll: ${e.visibleToAll}, users: ${e.visibleToUsers?.length || 0})`).join(', ')}`);
    } else {
      // Log adicional para debug quando não encontra nada
      const allEbooks = await this.ebooksRepository.find({ relations: ['visibleToUsers'] });
      console.log(`   ⚠️  Total de e-books no banco: ${allEbooks.length}`);
      allEbooks.forEach(e => {
        console.log(`      - ${e.title}: published=${e.published}, visibleToAll=${e.visibleToAll}, users=${e.visibleToUsers?.map(u => u.id).join(',') || 'none'}`);
      });
    }
    
    return ebooks;
  }

  async findOne(id: string, publishedOnly: boolean = false, userId?: string, isAdmin: boolean = false): Promise<Ebook> {
    // Se for admin, retornar QUALQUER e-book (sem verificação de permissão)
    if (isAdmin) {
      const ebook = await this.ebooksRepository.findOne({
        where: { id },
        relations: ['visibleToUsers'],
      });
      if (!ebook) {
        throw new NotFoundException('E-book não encontrado');
      }
      console.log(`✅ Admin acessando e-book: ${ebook.id} - ${ebook.title} (published: ${ebook.published})`);
      return ebook;
    }

    // Para não-admin: apenas e-books publicados
    const query = this.ebooksRepository
      .createQueryBuilder('ebook')
      .leftJoinAndSelect('ebook.visibleToUsers', 'user')
      .where('ebook.id = :id', { id })
      .andWhere('ebook.published = :published', { published: true });

    // Se tiver userId (paciente autenticado), verificar se tem acesso
    if (userId) {
      // Verificar se o e-book é:
      // 1. Visível para todos (visibleToAll = true) OU
      // 2. O usuário está na lista de visibleToUsers
      query.andWhere(
        '(ebook.visibleToAll = :visibleToAll OR :userId IN (SELECT eu.user_id FROM ebook_users eu WHERE eu.ebook_id = ebook.id))',
        { visibleToAll: true, userId }
      );
    } else {
      // Se não tiver userId (não autenticado), mostrar apenas os visíveis para todos
      query.andWhere('ebook.visibleToAll = :visibleToAll', { visibleToAll: true });
    }

    const ebook = await query.getOne();

    if (!ebook) {
      throw new NotFoundException('E-book não encontrado ou você não tem permissão para visualizá-lo');
    }

    return ebook;
  }

  async update(id: string, updateEbookDto: UpdateEbookDto): Promise<Ebook> {
    // Admin sempre pode atualizar qualquer e-book (sem verificação de permissão)
    const ebook = await this.findOne(id, false, undefined, true);
    
    // Se estiver atualizando URLs, deletar arquivos antigos se foram substituídos
    if (updateEbookDto.coverUrl && updateEbookDto.coverUrl !== ebook.coverUrl && ebook.coverUrl) {
      await this.uploadService.deleteFile(ebook.coverUrl);
    }
    if (updateEbookDto.pdfUrl && updateEbookDto.pdfUrl !== ebook.pdfUrl && ebook.pdfUrl) {
      await this.uploadService.deleteFile(ebook.pdfUrl);
    }
    if (updateEbookDto.bannerUrl && updateEbookDto.bannerUrl !== ebook.bannerUrl && ebook.bannerUrl) {
      await this.uploadService.deleteFile(ebook.bannerUrl);
    }
    
    // Atualizar visibilidade
    if (updateEbookDto.visibleToAll !== undefined) {
      ebook.visibleToAll = updateEbookDto.visibleToAll;
    }

    // Atualizar lista de usuários se fornecido
    if (updateEbookDto.visibleToUserIds !== undefined) {
      if (updateEbookDto.visibleToUserIds.length > 0) {
        const users = await this.usersService.findByIds(updateEbookDto.visibleToUserIds);
        ebook.visibleToUsers = users;
        ebook.visibleToAll = false;
      } else {
        ebook.visibleToUsers = [];
        ebook.visibleToAll = true;
      }
    }

    Object.assign(ebook, {
      title: updateEbookDto.title ?? ebook.title,
      description: updateEbookDto.description ?? ebook.description,
      coverUrl: updateEbookDto.coverUrl ?? ebook.coverUrl,
      pdfUrl: updateEbookDto.pdfUrl ?? ebook.pdfUrl,
      bannerUrl: updateEbookDto.bannerUrl ?? ebook.bannerUrl,
      published: updateEbookDto.published ?? ebook.published,
    });
    
    const saved = await this.ebooksRepository.save(ebook);
    
    // Carregar relacionamentos
    return this.ebooksRepository.findOne({
      where: { id: saved.id },
      relations: ['visibleToUsers'],
    }) || saved;
  }

  async remove(id: string): Promise<void> {
    const ebook = await this.findOne(id);
    
    // Deletar arquivos associados
    if (ebook.coverUrl) {
      await this.uploadService.deleteFile(ebook.coverUrl);
    }
    if (ebook.pdfUrl) {
      await this.uploadService.deleteFile(ebook.pdfUrl);
    }
    if (ebook.bannerUrl) {
      await this.uploadService.deleteFile(ebook.bannerUrl);
    }
    
    await this.ebooksRepository.remove(ebook);
    console.log(`✅ E-book deletado: ${id}`);
  }

  async getSignedPdfUrl(id: string, userId?: string, isAdmin: boolean = false): Promise<string> {
    // Admin pode acessar qualquer PDF, pacientes apenas os que têm permissão
    const ebook = await this.findOne(id, !isAdmin, userId, isAdmin);
    
    if (!ebook.pdfUrl) {
      throw new NotFoundException('PDF não encontrado para este e-book');
    }

    // Retornar URL direta (já está salva no formato correto)
    console.log(`📄 Retornando URL do PDF: ${ebook.pdfUrl}`);
    return ebook.pdfUrl;
  }
}
