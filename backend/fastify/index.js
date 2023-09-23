const Fastify = require(`fastify`);
const mongoose = require(`mongoose`);
const {logger} = require(`./middleware/logger`);
const router = require(`./router`);
const fastifySession = require('@fastify/session');
const fastifyCookie = require('@fastify/cookie');
const {auth} = require(`./middleware/auth`);
const cors = require(`@fastify/cors`);
const MongoStore = require('connect-mongo');

const env = process.env;

const fastify = Fastify({
  logger: true
});

const secret =
  env.ACCESS_TOKEN_SECRET || crypto.randomBytes(128).toString(`base64`);

fastify.register(cors, {
  origin: (origin, callback) => {
    callback(null, true);
    // `http://localhost:${env.FRONTEND_PORT}`
  },
  methods: ['GET', 'PUT', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  credentials: true,
  maxAge: 600,
  exposedHeaders: ['*', 'Authorization'],
});
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  secret, 
  store: MongoStore.create({
    mongoUrl: env.mongodb,
    ttl: 7 * 24 * 60 * 60,
    autoRemove: `native`,
  }),
});
fastify.addHook(`onRequest`, auth);

fastify.register(router);

async function run() {
  try {
    await mongoose.connect(env.mongodb);
    logger.info(`Connected to Atlas`);

    await fastify.listen(env.BACKEND_PORT, `0.0.0.0`);
    logger.info(`Server started, listening to ${env.BACKEND_PORT}`);
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`, {error});
    process.exit(1);
  }
}

run();