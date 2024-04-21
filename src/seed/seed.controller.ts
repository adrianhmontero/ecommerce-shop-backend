import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @ApiResponse({
    status: 201,
    description: 'SEED EXECUTED.',
  })
  // @Auth(ValidRoles.superUser)
  executeSeed() {
    return this.seedService.runSeed();
  }
}
