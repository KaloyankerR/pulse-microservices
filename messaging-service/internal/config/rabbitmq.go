package config

import (
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

type RabbitMQ struct {
	Conn    *amqp.Connection
	Channel *amqp.Channel
}

func ConnectRabbitMQ(cfg *Config, logger *zap.Logger) (*RabbitMQ, error) {
	conn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}

	// Declare exchange for messaging events
	err = ch.ExchangeDeclare(
		"messaging_events", // name
		"topic",            // type
		true,               // durable
		false,              // auto-deleted
		false,              // internal
		false,              // no-wait
		nil,                // arguments
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, err
	}

	logger.Info("RabbitMQ connected successfully")

	return &RabbitMQ{
		Conn:    conn,
		Channel: ch,
	}, nil
}

func (r *RabbitMQ) Close() error {
	if r.Channel != nil {
		r.Channel.Close()
	}
	if r.Conn != nil {
		return r.Conn.Close()
	}
	return nil
}
