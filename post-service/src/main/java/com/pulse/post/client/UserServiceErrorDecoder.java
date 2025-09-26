package com.pulse.post.client;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * User Service Error Decoder
 * 
 * Handles HTTP errors from the User Service and converts them to appropriate
 * Spring exceptions with proper error messages.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class UserServiceErrorDecoder implements ErrorDecoder {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceErrorDecoder.class);
    private final ErrorDecoder defaultErrorDecoder = new Default();

    @Override
    public Exception decode(String methodKey, Response response) {
        logger.error("User Service error: {} - {}", response.status(), response.reason());

        switch (response.status()) {
            case 400:
                return new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid request to User Service: " + response.reason());
            case 401:
                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, 
                    "Unauthorized access to User Service");
            case 403:
                return new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Forbidden access to User Service");
            case 404:
                return new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "User not found in User Service");
            case 429:
                return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, 
                    "Rate limit exceeded for User Service");
            case 500:
                return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "User Service internal error");
            case 502:
                return new ResponseStatusException(HttpStatus.BAD_GATEWAY, 
                    "User Service unavailable");
            case 503:
                return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                    "User Service temporarily unavailable");
            default:
                return defaultErrorDecoder.decode(methodKey, response);
        }
    }
}
