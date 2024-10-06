import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import RedisStore from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import IORedis from 'ioredis';

import { parseBoolean } from '@/libs/common/utils/parse-boolean.utils';

import { AppModule } from './app.module';
import { ms, StringValue } from './libs/common/utils/ms.util';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	logger.log('Application created.');

	const config = app.get(ConfigService);
	const redis = new IORedis({
		host: config.getOrThrow<string>('REDIS_HOST'),
		port: config.getOrThrow<number>('REDIS_PORT'),
		password: config.getOrThrow<string>('REDIS_PASSWORD')
	});

	logger.log('Redis is ready');

	app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	);

	app.use(
		session({
			secret: config.getOrThrow<string>('SESSION_SECRET'),
			name: config.getOrThrow<string>('SESSION_NAME'),
			resave: true,
			saveUninitialized: false,
			cookie: {
				domain: config.getOrThrow<string>('SESSION_DOMAIN'),
				maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
				httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
				secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
				sameSite: 'lax'
			},
			store: new RedisStore({
				client: redis,
				prefix: config.getOrThrow<string>('SESSION_FOLDER')
			})
		})
	);

	logger.log('Session middleware configured.');

	app.enableCors({
		origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
		credentials: true,
		exposedHeaders: ['set-cookie']
	});
	logger.log('CORS enabled.');

	const port = config.getOrThrow<number>('APPLICATION_PORT');
	await app.listen(port);
	logger.log(`Application listening on port ${port}`);
}
bootstrap();
