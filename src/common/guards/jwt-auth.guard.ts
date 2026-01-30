import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // Para rotas públicas, tentar validar o token se presente
      // Isso permite que admin veja conteúdo não publicado mesmo em rotas públicas
      const result = super.canActivate(context);
      
      // Se for Promise, tratar erro silenciosamente
      if (result instanceof Promise) {
        return result.catch(() => {
          // Se falhar, permitir acesso sem autenticação (rota pública)
          return true;
        });
      }
      
      // Se não for Promise, retornar o resultado direto
      return result;
    }
    return super.canActivate(context);
  }
}

