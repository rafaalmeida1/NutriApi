import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3055/auth/google/callback';

    // OAuth2Strategy requer clientID válido, então vamos usar um valor padrão se não estiver configurado
    // Isso permite que a aplicação inicie, mas o Google OAuth não funcionará até ser configurado
    if (!clientID || !clientSecret) {
      console.warn('⚠️  Google OAuth não configurado. GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são necessários.');
      console.warn('⚠️  A autenticação via Google não estará disponível até que as credenciais sejam configuradas.');
    }

    super({
      clientID: clientID || 'placeholder-client-id',
      clientSecret: clientSecret || 'placeholder-client-secret',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    const user = await this.usersService.createOrUpdateFromGoogle(
      email,
      id,
      displayName,
    );

    done(null, user);
  }
}

