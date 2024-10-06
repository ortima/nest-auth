import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthMethod } from '@prisma/__generated__';
import { hash } from 'argon2';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findById(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id },
			include: { accounts: true }
		});

		if (!user) {
			throw new NotFoundException(`User not found!`);
		}

		return user;
	}

	public async findByEmail(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: { email },
			include: { accounts: true }
		});

		return user;
	}

	public async create({
		email,
		password,
		displayName,
		picture,
		method,
		isVerified
	}: {
		email: string;
		password: string;
		displayName: string;
		picture: string;
		method: AuthMethod;
		isVerified: boolean;
	}) {
		return this.prismaService.user.create({
			data: {
				email,
				password: password ? await hash(password) : '',
				displayName,
				picture,
				method,
				isVerified
			},
			include: {
				accounts: true
			}
		});
	}
}
