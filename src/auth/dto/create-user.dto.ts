import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email (unique)',
    nullable: false,
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    nullable: false,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password must have an Uppercase, lowercase letter and a number',
  })
  password: string;

  @ApiProperty({
    description: 'User full name',
    nullable: false,
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  fullName: string;
}
