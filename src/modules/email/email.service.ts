import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(dto: SendEmailDto): Promise<void> {
    await this.mailerService.sendMail({
      to: dto.to,
      from: dto.from, // If undefined, MailerService uses default
      subject: dto.subject,
      html: dto.body,
    });
  }
}
