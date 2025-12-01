import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailController } from './email.controller';

describe('EmailController', () => {
  let controller: EmailController;
  let queueMock: { add: jest.Mock };

  beforeEach(async () => {
    queueMock = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: getQueueToken('email'),
          useValue: queueMock,
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add email job to queue', async () => {
    const dto: SendEmailDto = {
      to: 'test@cin.ufpe.br',
      subject: 'Test',
      body: 'Body',
    };

    await controller.sendEmail(dto);

    expect(queueMock.add).toHaveBeenCalledWith('send', dto);
  });
});
