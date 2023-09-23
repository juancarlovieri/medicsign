'use strict';

const WebSocket = require(`ws`);
const queryString = require(`querystring`);
const { logger } = require(`./logger`);

module.exports = async function (expressServer) {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: '/ws',
  });

  expressServer.on('upgrade', (request, socket, head) => {
    try {
      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocketServer.emit('connection', websocket, request);
        logger.info(`WS handshake successful.`);
      });
    } catch (error) {
      logger.error(`WS handshake failed.`, { error });
    }
  });

  websocketServer.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      const [_path, params] = connectionRequest?.url?.split('?');
      const connectionParams = queryString.parse(params);

      websocketConnection.on('message', (message) => {
        logger.info(`WS message received.`);
        try {
          const parsedMessage = JSON.parse(message);
        } catch (error) {
          logger.error(`WS message failed.`, { error });
        }
      });
    }
  );

  return websocketServer;
};
