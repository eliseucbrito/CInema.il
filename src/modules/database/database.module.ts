import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { Template } from '../templates/entities/template.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'mail_db',
      entities: [Service, Template],
      synchronize: true, // Don't use in production
    }),
  ],
})
export class DatabaseModule {}
