import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Invite, InviteStatus } from './entities/invite.entity';
import { createSMTPTransporter, SMTP_FROM_EMAIL, SMTP_FROM_NAME } from '../config/ses.config';

@Injectable()
export class InvitesService {
  private transporter;

  constructor(
    @InjectRepository(Invite)
    private invitesRepository: Repository<Invite>,
  ) {
    this.transporter = createSMTPTransporter();
  }

  async create(email: string, name: string, customMessage?: string): Promise<Invite> {
    // Verificar se já existe convite pendente
    const existingInvite = await this.invitesRepository.findOne({
      where: { email, status: InviteStatus.PENDING },
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      throw new BadRequestException('Já existe um convite pendente para este email');
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    const invite = this.invitesRepository.create({
      email,
      name,
      token,
      expiresAt,
      status: InviteStatus.PENDING,
    });

    const savedInvite = await this.invitesRepository.save(invite);

    // Enviar email (não bloqueia se falhar)
    this.sendInviteEmail(savedInvite, customMessage).catch((error) => {
      // Erro já é logado no método sendInviteEmail
      // Não lançar para não quebrar o fluxo
    });

    return savedInvite;
  }

  async findAll(status?: InviteStatus): Promise<Invite[]> {
    if (status) {
      return this.invitesRepository.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });
    }
    return this.invitesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invite> {
    const invite = await this.invitesRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }
    return invite;
  }

  async findByToken(token: string): Promise<Invite> {
    const invite = await this.invitesRepository.findOne({ where: { token } });
    if (!invite) {
      throw new NotFoundException('Token inválido');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Convite já foi utilizado ou cancelado');
    }

    if (invite.expiresAt < new Date()) {
      invite.status = InviteStatus.EXPIRED;
      await this.invitesRepository.save(invite);
      throw new BadRequestException('Convite expirado');
    }

    return invite;
  }

  async acceptInvite(token: string): Promise<void> {
    const invite = await this.findByToken(token);
    invite.status = InviteStatus.ACCEPTED;
    await this.invitesRepository.save(invite);
  }

  async remove(id: string): Promise<void> {
    const invite = await this.findOne(id);
    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Não é possível cancelar um convite já aceito');
    }
    await this.invitesRepository.delete(id);
  }

  async resend(id: string): Promise<Invite> {
    const invite = await this.findOne(id);
    
    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Apenas convites pendentes podem ser reenviados');
    }

    // Atualizar data de expiração
    invite.expiresAt = new Date();
    invite.expiresAt.setDate(invite.expiresAt.getDate() + 7);
    await this.invitesRepository.save(invite);

    // Reenviar email (sem mensagem personalizada no resend)
    await this.sendInviteEmail(invite);

    return invite;
  }

  private async sendInviteEmail(invite: Invite, customMessage?: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite/${invite.token}`;

    const messageContent = customMessage 
      ? `<p style="margin: 20px 0; color: #232f3e;">${customMessage.replace(/\n/g, '<br>')}</p>` 
      : '<p style="margin: 20px 0; color: #232f3e;">Você foi convidado(a) para acessar o portal Nutri Thata.</p>';

    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #232f3e;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .header {
              background-color: #ffffff;
              padding: 30px 40px 20px;
              border-bottom: 1px solid #e5e5e5;
            }
            .logo {
              font-size: 24px;
              font-weight: 600;
              color: #232f3e;
              letter-spacing: -0.5px;
            }
            .content {
              padding: 40px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 16px;
              color: #232f3e;
              margin-bottom: 20px;
            }
            .message {
              font-size: 15px;
              color: #232f3e;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background-color: #232f3e;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
              font-size: 15px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }
            .button:hover {
              background-color: #131921;
            }
            .link-text {
              font-size: 13px;
              color: #666666;
              margin-top: 25px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
              word-break: break-all;
            }
            .link-text a {
              color: #0066c0;
              text-decoration: none;
            }
            .link-text a:hover {
              text-decoration: underline;
            }
            .footer {
              margin-top: 40px;
              padding-top: 25px;
              border-top: 1px solid #e5e5e5;
              font-size: 12px;
              color: #666666;
              line-height: 1.6;
            }
            .footer p {
              margin: 8px 0;
            }
            .divider {
              height: 1px;
              background-color: #e5e5e5;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">Nutri Thata</div>
            </div>
            <div class="content">
              <div class="greeting">
                Olá <strong>${invite.name}</strong>,
              </div>
              <div class="message">
                ${messageContent}
              </div>
              <div class="button-container">
                <a href="${inviteUrl}" class="button">Aceitar Convite</a>
              </div>
              <div class="link-text">
                Ou copie e cole este link no seu navegador:<br>
                <a href="${inviteUrl}">${inviteUrl}</a>
              </div>
              <div class="divider"></div>
              <div class="footer">
                <p><strong>Importante:</strong> Este link expira em 7 dias.</p>
                <p>Se você não solicitou este convite, pode ignorar este email com segurança.</p>
                <p style="margin-top: 20px; color: #999999;">
                  © ${new Date().getFullYear()} Nutri Thata. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      // Verificar se as credenciais SMTP estão configuradas
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn('⚠️  SMTP não configurado. Email não enviado para:', invite.email);
        console.warn('   Configure SMTP_USER e SMTP_PASSWORD no .env para enviar emails');
        return;
      }

      await this.transporter.sendMail({
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: invite.email,
        subject: 'Convite para Nutri Thata',
        html: emailBody,
      });
      
      console.log(`✅ Email de convite enviado para: ${invite.email}`);
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error.message);
      console.error('   Código:', error.code);
      console.error('   Response:', error.response);
      
      // Se for erro de autenticação, dar mensagem mais clara
      if (error.code === 'EAUTH') {
        console.error('   ⚠️  Credenciais SMTP inválidas. Verifique SMTP_USER e SMTP_PASSWORD no .env');
      }
      
      // Não lançar erro para não quebrar o fluxo de criação do convite
      // O convite é criado mesmo se o email falhar
    }
  }
}
