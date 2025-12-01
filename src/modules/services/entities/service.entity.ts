import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Template } from '../../templates/entities/template.entity';

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  apiKey: string;

  @OneToMany(() => Template, (template) => template.service)
  templates: Template[];
}
