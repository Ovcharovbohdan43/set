import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import postgres from '@fastify/postgres';
import rateLimit from '@fastify/rate-limit';

type SyncDelta = {
  entity: string;
  version: string;
  checksum: string;
  payload: unknown;
};

const PORT = Number(process.env.SYNC_PORT || 4100);
const JWT_SECRET = process.env.SYNC_JWT_SECRET || 'local-dev-secret';
const DATABASE_URL = process.env.SYNC_DATABASE_URL;

const app = Fastify({
  logger: true
});

await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
await app.register(jwt, { secret: JWT_SECRET });

if (DATABASE_URL) {
  await app.register(postgres, { connectionString: DATABASE_URL });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    deltas?: SyncDelta[];
  }
}

app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

let deltaStore: SyncDelta[] = [];

app.post('/sync/upload', { preHandler: [app.authenticate] }, async (request, reply) => {
  const body = request.body as { cursor?: string; deltas?: SyncDelta[]; signature?: string };
  const deltas = body.deltas ?? [];
  deltaStore = deltas;

  if (DATABASE_URL) {
    await request.server.pg.query(
      'insert into sync_delta (cursor, payload, checksum) values ($1, $2, $3)',
      [body.cursor ?? 'na', JSON.stringify(deltas), body.signature ?? 'none']
    );
  }

  reply.send({
    nextCursor: new Date().toISOString(),
    stored: deltas.length,
    echoSignature: body.signature
  });
});

app.get('/sync/download', { preHandler: [app.authenticate] }, async (request, reply) => {
  reply.send({
    nextCursor: new Date().toISOString(),
    deltas: deltaStore,
    conflicts: []
  });
});

app.get('/health', async () => ({ status: 'ok', mode: DATABASE_URL ? 'postgres' : 'memory' }));

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Sync gateway listening at ${address}`);
});
