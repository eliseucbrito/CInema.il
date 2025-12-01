import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, Post } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('email')
export class EmailController {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  @Post('send')
  async sendEmail(@Body() dto: SendEmailDto) {
    await this.emailQueue.add('send', dto);
    return { message: 'Email queued successfully' };
  }
}
