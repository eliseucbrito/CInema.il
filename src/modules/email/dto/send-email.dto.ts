import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsOptional()
  @IsEmail()
  @Matches(/@cin\.ufpe\.br$/, {
    message: 'Sender must be a @cin.ufpe.br email address',
  })
  from?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}
