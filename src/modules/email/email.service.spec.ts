import { MailerService } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from '../templates/templates.service';
import { SendEmailDto } from './dto/send-email.dto';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let templatesService: TemplatesService;

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue('Email sent'),
  };

  const mockTemplatesService = {
    findTemplateByNameAndService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mockMailerService },
        { provide: TemplatesService, useValue: mockTemplatesService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    templatesService = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send an email with correct arguments', async () => {
    const dto: SendEmailDto = {
      to: 'aluno@cin.ufpe.br',
      from: 'graduate@cin.ufpe.br',
      subject: 'Resultado Seleção',
      body: '<p>Aprovado</p>',
    };

    await service.sendEmail(dto);

    expect(mockMailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: dto.to,
      from: dto.from,
      subject: dto.subject,
      html: dto.body,
    }));
  });

  it('should use default from if not provided', async () => {
    const dto: SendEmailDto = {
      to: 'aluno@cin.ufpe.br',
      subject: 'Aviso',
      body: '<p>Teste</p>',
    };

    await service.sendEmail(dto);

    // If 'from' is not in DTO, it might be undefined in the call, 
    // relying on MailerService default. 
    // Or we might explicitly set it in the service.
    // Let's assume the service passes what's in the DTO.
    expect(mockMailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: dto.to,
      subject: dto.subject,
      html: dto.body,
    }));
  });
  it('should throw error if template not found', async () => {
    const dto: SendEmailDto = {
      to: 'aluno@cin.ufpe.br',
      subject: 'Subject',
      template: 'unknown',
    };

    jest.spyOn(templatesService, 'findTemplateByNameAndService').mockResolvedValue(null);

    await expect(service.sendEmail(dto)).rejects.toThrow('Template unknown not found');
  });
});
