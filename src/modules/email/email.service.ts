import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { TemplatesService } from '../templates/templates.service';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly templatesService: TemplatesService,
  ) {}

  async sendEmail(dto: SendEmailDto): Promise<void> {
    let html = dto.body;

    if (dto.template) {
      const template = await this.templatesService.findTemplateByNameAndService(
        dto.template,
        dto.service || 'default', // Assuming a default service if not provided
      );

      if (!template) {
        throw new Error(`Template ${dto.template} not found`);
      }

      const compile = Handlebars.compile(template.content);
      html = compile(dto.context);
    }

    await this.mailerService.sendMail({
      to: dto.to,
      from: dto.from,
      subject: dto.subject,
      html: html,
    });
  }
}
