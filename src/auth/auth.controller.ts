import {
  Controller,
  Post,
  Body,
  Get,
  /* UseGuards,
  Req,
  SetMetadata, */
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
// import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
/* import { GetRawHeaders } from 'src/common/decorators/get-rawheaders.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces'; */
import { Auth } from './decorators';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiResponse({
    status: 201,
    description: 'User has been created.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('signin')
  @ApiResponse({
    status: 201,
    description: 'User logged in.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Access denied.' })
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @ApiResponse({
    status: 201,
    description: 'User status checked.',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Auth()
  @ApiBearerAuth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }
}
