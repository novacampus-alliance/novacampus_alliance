import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST', 'mailhog'),
          port: config.get<number>('MAIL_PORT', 1025),
          secure: false,
          ...(config.get('MAIL_USER')
            ? { auth: { user: config.get('MAIL_USER'), pass: config.get('MAIL_PASS') } }
            : {}),
        },
        defaults: {
          from: config.get<string>('MAIL_FROM', '"NovaCampus" <no-reply@novacampus.fr>'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
