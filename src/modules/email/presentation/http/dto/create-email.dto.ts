import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEmailDto {
  @ApiProperty({ example: 'recipient@example.com' })
  @IsEmail()
  recipient!: string;

  @ApiProperty({ example: 'Welcome to the service.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(998)
  subject!: string;

  @ApiProperty({ example: 'Hello from the email service.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  body!: string;
}
