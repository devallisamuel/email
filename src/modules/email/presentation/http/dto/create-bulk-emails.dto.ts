import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEmailDto } from './create-email.dto';

export class CreateBulkEmailsDto {
  @ApiProperty({
    type: () => CreateEmailDto,
    isArray: true,
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateEmailDto)
  emails!: CreateEmailDto[];
}
