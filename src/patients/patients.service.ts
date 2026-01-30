import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(private usersService: UsersService) {}

  async findAll(): Promise<User[]> {
    return this.usersService.findPatients();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Paciente não encontrado');
    }
    if (user.role !== UserRole.PATIENT) {
      throw new NotFoundException('Usuário não é um paciente');
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersService.remove(user.id);
  }
}

