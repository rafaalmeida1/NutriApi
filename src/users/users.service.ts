import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async createAdmin(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    return this.usersRepository.save(user);
  }

  async createOrUpdateFromGoogle(
    email: string,
    googleId: string,
    name?: string,
  ): Promise<User> {
    let user = await this.findByGoogleId(googleId);
    
    if (!user) {
      // Verificar se existe usuário com este email (pode ser admin criado via script)
      user = await this.findByEmail(email);
      if (user) {
        // Linkar Google ID ao usuário existente (pode ser admin ou paciente)
        user.googleId = googleId;
      } else {
        // Criar novo paciente
        user = this.usersRepository.create({
          email,
          googleId,
          role: UserRole.PATIENT,
        });
      }
    }
    
    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findPatients(): Promise<User[]> {
    return this.usersRepository.find({ where: { role: UserRole.PATIENT } });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.usersRepository.find({ where: { id: In(ids) } });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}

