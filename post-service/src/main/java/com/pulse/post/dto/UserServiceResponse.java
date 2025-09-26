package com.pulse.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * User Service Response Wrapper
 * 
 * Represents the standard response format from the User Service.
 * 
 * @author Pulse Team
 * @version 1.0.0
 */
public class UserServiceResponse {

    @JsonProperty("success")
    private Boolean success;

    @JsonProperty("data")
    private UserResponseData data;

    @JsonProperty("meta")
    private ResponseMeta meta;

    // Constructors
    public UserServiceResponse() {}

    // Getters and Setters
    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public UserResponseData getData() {
        return data;
    }

    public void setData(UserResponseData data) {
        this.data = data;
    }

    public ResponseMeta getMeta() {
        return meta;
    }

    public void setMeta(ResponseMeta meta) {
        this.meta = meta;
    }

    /**
     * User Response Data
     */
    public static class UserResponseData {
        @JsonProperty("user")
        private UserDto user;

        public UserDto getUser() {
            return user;
        }

        public void setUser(UserDto user) {
            this.user = user;
        }
    }

    /**
     * Response Metadata
     */
    public static class ResponseMeta {
        @JsonProperty("timestamp")
        private String timestamp;

        @JsonProperty("version")
        private String version;

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }
    }
}
