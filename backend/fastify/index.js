const Fastify = require(`fastify`);
const mongoose = require(`mongoose`);
const {logger} = require(`./middleware/logger`);
const router = require(`./router`);

const env = process.env;

const fastify = Fastify({
  logger: true
});

fastify.register(router);

async function run() {
  try {
    await mongoose.connect(env.mongodb);
    logger.info(`Connected to Atlas`);

    await fastify.listen(env.BACKEND_PORT);
    logger.info(`Server started, listening to ${env.BACKEND_PORT}`);
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`, {error});
    process.exit(1);
  }
}

run();