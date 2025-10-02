# Jenkins Docker container with Node.js and Docker support
FROM jenkins/jenkins:lts

# Switch to root to install packages
USER root

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install additional tools
RUN npm install -g \
    jest \
    sonarqube-scanner \
    eslint \
    prettier

# Create jenkins home directory with proper permissions
RUN mkdir -p /var/jenkins_home/secrets \
    && chown -R jenkins:jenkins /var/jenkins_home

# Switch back to jenkins user
USER jenkins

# Install Jenkins plugins
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    nodejs \
    junit \
    htmlpublisher \
    cobertura \
    sonar \
    build-timeout \
    credentials-binding \
    timestamper \
    ws-cleanup \
    ant \
    pipeline-utility-steps \
    docker-workflow \
    docker-plugin

# Set Jenkins environment variables
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
ENV JENKINS_OPTS="--httpPort=8080"

# Expose Jenkins port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/login || exit 1

# Copy Jenkins configuration
COPY jenkins.yaml /usr/share/jenkins/ref/jenkins.yaml
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

# Set initial admin password
RUN echo "admin" > /var/jenkins_home/secrets/initialAdminPassword

# Start Jenkins
ENTRYPOINT ["/usr/local/bin/jenkins.sh"]
