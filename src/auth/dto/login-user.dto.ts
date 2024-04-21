import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'User email',
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
}
