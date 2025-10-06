const amqp = require('amqplib');
const logger = require('../utils/logger');

class RabbitMQConfig {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect(retries = 5, delay = 2000) {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Attempting to connect to RabbitMQ (attempt ${attempt}/${retries})`);
        
        this.connection = await amqp.connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();
        this.isConnected = true;
        
        logger.info('Connected to RabbitMQ successfully');

        // Handle connection events
        this.connection.on('error', (error) => {
          logger.error('RabbitMQ connection error:', error);
          this.isConnected = false;
        });

        this.connection.on('close', () => {
          logger.warn('RabbitMQ connection closed');
          this.isConnected = false;
        });

        return { connection: this.connection, channel: this.channel };
      } catch (error) {
        logger.warn(`Failed to connect to RabbitMQ (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt === retries) {
          logger.error('Failed to connect to RabbitMQ after all retries');
          this.isConnected = false;
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
      throw error;
    }
  }

  getChannel() {
    if (!this.channel || !this.isConnected) {
      throw new Error('RabbitMQ channel not available');
    }
    return this.channel;
  }

  async healthCheck() {
    try {
      if (!this.isConnected || !this.channel) {
        return {
          status: 'unhealthy',
          message: 'RabbitMQ not connected',
          timestamp: new Date().toISOString(),
        };
      }

      // Check if channel is open
      if (this.channel.connection.stream.destroyed) {
        return {
          status: 'unhealthy',
          message: 'RabbitMQ channel closed',
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        status: 'healthy',
        message: 'RabbitMQ connection is active',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('RabbitMQ health check failed:', error);
      return {
        status: 'unhealthy',
        message: 'RabbitMQ health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Consumer setup
  async setupConsumer(queueName, exchangeName, routingKey, handler) {
    try {
      const channel = this.getChannel();

      // Assert exchange
      await channel.assertExchange(exchangeName, 'topic', { durable: true });

      // Assert queue
      await channel.assertQueue(queueName, { durable: true });

      // Bind queue to exchange
      await channel.bindQueue(queueName, exchangeName, routingKey);

      // Setup consumer
      await channel.consume(queueName, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            logger.info(`Received message: ${routingKey}`, { content });
            
            await handler(content);
            
            channel.ack(msg);
          } catch (error) {
            logger.error(`Error processing message: ${routingKey}`, error);
            // Reject message and don't requeue
            channel.nack(msg, false, false);
          }
        }
      });

      logger.info(`Consumer setup complete for queue: ${queueName}, routing key: ${routingKey}`);
    } catch (error) {
      logger.error(`Failed to setup consumer for ${queueName}:`, error);
      throw error;
    }
  }

  // Publisher
  async publish(exchangeName, routingKey, message) {
    try {
      const channel = this.getChannel();
      
      // Assert exchange
      await channel.assertExchange(exchangeName, 'topic', { durable: true });

      // Publish message
      const published = channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (published) {
        logger.info(`Message published: ${routingKey}`, { message });
      } else {
        logger.warn(`Failed to publish message: ${routingKey}`);
      }

      return published;
    } catch (error) {
      logger.error(`Failed to publish message: ${routingKey}`, error);
      throw error;
    }
  }
}

module.exports = new RabbitMQConfig();
