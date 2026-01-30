import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OptionalAuthInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Se já tem user, não fazer nada
    if (request.user) {
      return next.handle();
    }

    // Tentar extrair token do header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'default-secret',
        });
        
        const user = await this.usersService.findById(payload.sub);
        if (user) {
          // Popular req.user mesmo em rotas públicas
          request.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
          console.log(`🔐 Usuário autenticado via interceptor: ${user.email} (${user.role}) - ID: ${user.id}`);
        }
      } catch (error) {
        // Token inválido ou expirado, ignorar
        // Rota pública, então não é erro
        console.log(`⚠️  Token inválido ou expirado em rota pública: ${error.message}`);
      }
    }

    return next.handle();
  }
}

