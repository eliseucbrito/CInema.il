import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  async findTemplateByNameAndService(
    templateName: string,
    serviceName: string,
  ): Promise<Template | null> {
    return this.templatesRepository.findOne({
      where: {
        name: templateName,
        service: {
          name: serviceName,
        },
      },
      relations: ['service'],
    });
  }

  async create(template: Partial<Template>): Promise<Template> {
    const newTemplate = this.templatesRepository.create(template);
    return this.templatesRepository.save(newTemplate);
  }
}
