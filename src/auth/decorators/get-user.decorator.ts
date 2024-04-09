import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    let result = {};

    if (data)
      if (typeof data === 'object' && data.length > 0) {
        data.forEach((key: any) => {
          result[key] = user[key];
        });
      } else result = user[data];
    else result = user;

    if (!user)
      throw new InternalServerErrorException('User not found (request)');

    return result;
  },
);
