package com.pulse.auth.controller;

import com.pulse.auth.dto.AuthRequest;
import com.pulse.auth.dto.AuthResponse;
import com.pulse.auth.dto.RegisterRequest;
import com.pulse.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication and registration endpoints")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Create a new user account with username, email, and password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse response = authService.register(registerRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Login with username and password to receive JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            AuthResponse response = authService.login(authRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the auth service is running")
    @ApiResponse(responseCode = "200", description = "Service is healthy")
    public ResponseEntity<?> health() {
        Map<String, Object> healthInfo = new HashMap<>();
        healthInfo.put("service", "Auth Service");
        healthInfo.put("status", "UP");
        healthInfo.put("database", "PostgreSQL (pulse_auth)");
        healthInfo.put("message", "Authentication service is running with dedicated database");
        healthInfo.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(healthInfo);
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Retrieve all registered users from the database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - requires authentication")
    })
    public ResponseEntity<List<com.pulse.auth.entity.User>> getAllUsers() {
        List<com.pulse.auth.entity.User> users = authService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}
