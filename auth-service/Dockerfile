FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy Maven files
COPY pom.xml .

# Download dependencies
RUN apt-get update && apt-get install -y maven
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/auth-service-1.0.0.jar"]
