import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { RegisterDto } from '@/auth/dto/register.dto';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
	public constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatus.OK)
	public async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}
}
