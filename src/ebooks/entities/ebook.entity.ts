import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ebooks')
export class Ebook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl?: string;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl?: string;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl?: string;

  @Column({ default: false })
  published: boolean;

  @Column({ default: true, name: 'visible_to_all' })
  visibleToAll: boolean; // Se true, visível para todos os pacientes

  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'ebook_users',
    joinColumn: { name: 'ebook_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  visibleToUsers?: User[]; // Lista de pacientes específicos que podem ver

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
