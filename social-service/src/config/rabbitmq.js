const amqp = require('amqplib');
const logger = require('../utils/logger');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    if (!process.env.RABBITMQ_URL) {
      logger.warn('RabbitMQ URL not configured, event publishing will be disabled');
      return null;
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange('pulse.events', 'topic', { durable: true });

    logger.info('RabbitMQ Connected');

    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('RabbitMQ Connection Error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ Connection Closed');
    });

    return { connection, channel };
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    return null;
  }
};

const publishEvent = async (eventType, data) => {
  try {
    if (!channel) {
      logger.debug('RabbitMQ channel not available, skipping event publish');
      return false;
    }

    const message = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      service: 'social-service',
    };

    channel.publish(
      'pulse.events',
      eventType,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Event published: ${eventType}`, { data });
    return true;
  } catch (error) {
    logger.error('Failed to publish event:', error);
    return false;
  }
};

const consumeEvents = async (eventTypes, handler) => {
  try {
    if (!channel) {
      logger.debug('RabbitMQ channel not available, skipping event consumption');
      return;
    }

    const queue = 'social-service.events';
    await channel.assertQueue(queue, { durable: true });

    // Bind queue to event types
    for (const eventType of eventTypes) {
      await channel.bindQueue(queue, 'pulse.events', eventType);
    }

    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handler(event);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing event:', error);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });

    logger.info('Started consuming events:', eventTypes);
  } catch (error) {
    logger.error('Failed to consume events:', error);
  }
};

const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
};

module.exports = {
  connectRabbitMQ,
  publishEvent,
  consumeEvents,
  closeRabbitMQ,
};

