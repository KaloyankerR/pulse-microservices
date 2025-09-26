#!/bin/bash

# Pulse Microservices Local Development Stop Script
# This script stops all locally running services

echo "🛑 Stopping Pulse Microservices (Local Development)..."

# Function to stop service
stop_service() {
    local service_name="$1"
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "   Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                echo "   Force stopping $service_name..."
                kill -9 "$pid"
            fi
            
            echo "   ✅ $service_name stopped"
        else
            echo "   ⚠️  $service_name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "   ⚠️  No PID file found for $service_name"
    fi
}

# Stop services
stop_service "user-service"
stop_service "post-service"

echo ""
echo "🎉 All local services have been stopped!"
echo ""
echo "💡 To start services again, run: ./start-local-services.sh"
