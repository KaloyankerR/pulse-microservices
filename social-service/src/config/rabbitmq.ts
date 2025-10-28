import amqp, { Connection, Channel } from 'amqplib';
import logger from '../utils/logger';
import { BaseEvent } from '../types';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<{ connection: Connection; channel: Channel } | null> => {
  try {
    if (!process.env.RABBITMQ_URL) {
      logger.warn('RabbitMQ URL not configured, event publishing will be disabled');
      return null;
    }

    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    connection = conn as unknown as Connection;
    const ch = await conn.createChannel();
    channel = ch;

    // Declare exchanges
    await ch.assertExchange('pulse.events', 'topic', { durable: true });

    logger.info('RabbitMQ Connected');

    // Handle connection errors
    conn.on('error', (err) => {
      logger.error('RabbitMQ Connection Error:', err);
    });

    conn.on('close', () => {
      logger.warn('RabbitMQ Connection Closed');
    });

    return { connection: conn as unknown as Connection, channel: ch };
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    return null;
  }
};

export const publishEvent = async (eventType: string, data: Record<string, unknown>): Promise<boolean> => {
  try {
    logger.info('Attempting to publish event', { eventType, data });
    
    if (!channel) {
      logger.warn('RabbitMQ channel not available, skipping event publish', { eventType });
      return false;
    }

    const message: BaseEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      service: 'social-service',
    };

    logger.info('Publishing message to RabbitMQ', { 
      exchange: 'pulse.events', 
      routingKey: eventType, 
      message: message 
    });

    const result = channel.publish(
      'pulse.events',
      eventType,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    if (result) {
      logger.info(`Event published successfully: ${eventType}`, { data });
    } else {
      logger.warn(`Event publish failed (channel full): ${eventType}`, { data });
    }
    
    return result;
  } catch (error) {
    logger.error('Failed to publish event:', error);
    return false;
  }
};

export const consumeEvents = async (
  eventTypes: string[],
  handler: (event: BaseEvent) => Promise<void>
): Promise<void> => {
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
          const event = JSON.parse(msg.content.toString()) as BaseEvent;
          await handler(event);
          channel!.ack(msg);
        } catch (error) {
          logger.error('Error processing event:', error);
          channel!.nack(msg, false, false); // Don't requeue
        }
      }
    });

    logger.info('Started consuming events:', eventTypes);
  } catch (error) {
    logger.error('Failed to consume events:', error);
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await (connection as unknown as { close(): Promise<void> }).close();
      connection = null;
    }
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
};

