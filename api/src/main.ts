import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/** Origines Capacitor / Ionic (WebView mobile). */
const CAPACITOR_CORS_ORIGINS = [
  'capacitor://localhost',
  'one-more://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
];

/** Origines web en dev local (Vite, etc.). */
const DEV_WEB_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => {
      let v = s.trim().replace(/\/+$/, '');
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      return v.trim();
    })
    .filter(Boolean);
}

/** Liste d’origines autorisées (ex. `https://onemore.dokploy.moneyes.app`). Si vide, l’Origin de la requête est renvoyée (pratique en dev). */
function buildCorsOriginOption():
  | boolean
  | string[]
  | ((
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void) {
  const fromEnv = parseCorsOrigins(process.env.CORS_ORIGINS);
  const isDev = process.env.NODE_ENV !== 'production';
  const allowed =
    fromEnv.length > 0
      ? [
          ...new Set([
            ...fromEnv,
            ...CAPACITOR_CORS_ORIGINS,
            ...(isDev ? DEV_WEB_CORS_ORIGINS : []),
          ]),
        ]
      : fromEnv;

  if (allowed.length === 0) {
    return true;
  }
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const normalized = origin.replace(/\/+$/, '');
    callback(null, allowed.includes(normalized));
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: buildCorsOriginOption(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-Admin-Api-Key',
      'X-Event-Admin-Password',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
