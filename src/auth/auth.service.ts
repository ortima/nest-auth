import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { $Enums, User } from '@prisma/__generated__';
import { verify } from 'argon2';
import { Request, Response } from 'express';

import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { UserService } from '@/user/user.service';

import AuthMethod = $Enums.AuthMethod;

@Injectable()
export class AuthService {
	public constructor(
		private readonly userService: UserService,
		private readonly configService: ConfigService
	) {}

	public async register(req: Request, dto: RegisterDto) {
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

		return this.saveSession(req, newUser);
	}

	public async login(req: Request, dto: LoginDto) {
		const user = await this.userService.findByEmail(dto.email);

		if (!user || !user.password) {
			throw new NotFoundException(
				`User not found! Please try to check your data`
			);
		}

		const isValidPassword = await verify(user.password, dto.password);

		if (!isValidPassword) {
			throw new UnauthorizedException(
				'Incorrect password! Please try it again'
			);
		}

		return this.saveSession(req, user);
	}

	public async logout(req: Request, res: Response): Promise<void> {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							`Unfortunately session isn't closed`
						)
					);
				}

				res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));

				resolve();
			});
		});
	}

	public async saveSession(req: Request, user: User) {
		return new Promise(async (resolve, reject) => {
			req.session.userId = user.id;

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException('Could not save session')
					);
				}

				resolve({ user });
			});
		});
	}
}
