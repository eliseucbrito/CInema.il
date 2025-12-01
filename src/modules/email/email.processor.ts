import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailService } from './email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendEmailDto, any, string>): Promise<any> {
    this.logger.debug(`Processing email job ${job.id} to ${job.data.to}`);
    try {
      await this.emailService.sendEmail(job.data);
      this.logger.debug(`Email sent to ${job.data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.to}`, error.stack);
      throw error;
    }
  }
}
