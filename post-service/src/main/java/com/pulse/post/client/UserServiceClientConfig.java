package com.pulse.post.client;

import feign.Logger;
import feign.Request;
import feign.Retryer;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * User Service Client Configuration
 * 
 * Configures Feign client settings for User Service integration including
 * timeouts, retries, logging, and error handling.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
@Configuration
public class UserServiceClientConfig {

    /**
     * Configure request options with timeouts
     */
    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(
            5000, // connect timeout in milliseconds
            10000, // read timeout in milliseconds
            true // follow redirects
        );
    }

    /**
     * Configure retry behavior
     */
    @Bean
    public Retryer retryer() {
        return new Retryer.Default(
            1000, // initial interval
            3000, // max interval
            3 // max attempts
        );
    }

    /**
     * Configure logging level
     */
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }

    /**
     * Configure error decoder for handling HTTP errors
     */
    @Bean
    public ErrorDecoder errorDecoder() {
        return new UserServiceErrorDecoder();
    }
}
