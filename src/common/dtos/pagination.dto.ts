import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    default: 10,
    description: 'As many rows as you need to get.',
    required: false,
  })
  @IsOptional()
  @IsPositive()
  // Transformar: El type lo que hace es indicar que este parámetro va a ser devuelto como número.
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    default: 0,
    description: 'As many rows as you need to skip.',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
