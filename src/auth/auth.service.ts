import { ConflictException, Injectable } from '@nestjs/common';
import { $Enums, User } from '@prisma/__generated__';

import { RegisterDto } from '@/auth/dto/register.dto';
import { UserService } from '@/user/user.service';

import AuthMethod = $Enums.AuthMethod;

@Injectable()
export class AuthService {
	public constructor(private readonly userService: UserService) {}

	public async register(dto: RegisterDto) {
		const isExists = await this.userService.findByEmail(dto.email);

		if (isExists) {
			throw new ConflictException('User with this email already exists');
		}

		const newUser = await this.userService.create({
			email: dto.email,
			password: dto.password,
			displayName: dto.name,
			picture: '',
			method: AuthMethod.CREDENTIALS,
			isVerified: false
		});

		return this.saveSession(newUser);
	}

	public async saveSession(user: User) {
		console.log('Session saved', user);
	}
}
