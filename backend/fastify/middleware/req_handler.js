const { logger } = require(`../middleware/logger`);

async function success(res, data, signature) {
  await res.send({
    success: true,
    data,
    signature,
  });
  logger.info(`Success response.`, { res, data });
}

async function error(res, error) {
  await res.send({
    success: false,
    error,
  });
  logger.info(`Error response.`, { res, error });
}

async function sendStatus(res, status, msg) {
  await res.status(status).send(msg);
  logger.info(`${status} status sent.`, { res, status, msg });
}

module.exports = { success, error, sendStatus };
