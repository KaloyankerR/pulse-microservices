# Jenkins CI/CD Setup Guide for User Service

## 🚀 Quick Start

### 1. Start Jenkins
```bash
make jenkins-up
```

### 2. Access Jenkins
- **URL**: http://localhost:8090
- **Username**: admin
- **Password**: admin

---

## 📋 Jenkins Job Configuration Options

You have two main options for connecting Jenkins to your user-service:

### Option A: Local File System Job (Recommended for Development)
This option works directly with your local files without needing GitHub.

### Option B: GitHub Integration (Recommended for Production)
This option connects to a GitHub repository for automated builds on code changes.

---

## 🔧 Option A: Local File System Configuration

### Step 1: Create a New Job
1. Click **"New Item"** on the Jenkins dashboard
2. Enter job name: `user-service-pipeline`
3. Select **"Pipeline"** job type
4. Click **"OK"**

### Step 2: Configure the Pipeline
1. Scroll down to **"Pipeline"** section
2. In **"Definition"** dropdown, select **"Pipeline script from SCM"**
3. In **"SCM"** dropdown, select **"Git"**
4. Configure Git settings:
   - **Repository URL**: Leave empty or use `file:///var/jenkins_home/workspace/user-service`
   - **Branch Specifier**: `*/main`
   - **Script Path**: `user-service/Jenkinsfile`

### Step 3: Alternative - Direct Script Configuration
If you prefer to use the Jenkinsfile directly without SCM:

1. In **"Definition"** dropdown, select **"Pipeline script"**
2. Copy and paste the contents of `user-service/Jenkinsfile`
3. Modify the `checkout scm` step to:
   ```groovy
   stage('Checkout') {
       steps {
           echo 'Using local workspace...'
           dir('user-service') {
               // Jenkins will use the workspace directory
           }
       }
   }
   ```

### Step 4: Configure Workspace Path
1. Go to **"Advanced"** section
2. Set **"Use custom workspace"** and enter: `/var/jenkins_home/workspace/user-service`
3. This will mount your local user-service directory

### Step 5: Save and Run
1. Click **"Save"**
2. Click **"Build Now"** to test the pipeline

---

## 🌐 Option B: GitHub Integration

### Prerequisites
- GitHub repository with your code
- Jenkins GitHub plugin (already installed)

### Step 1: Create GitHub Credentials
1. Go to **"Manage Jenkins"** → **"Manage Credentials"**
2. Click **"System"** → **"Global credentials"**
3. Click **"Add Credentials"**
4. Configure:
   - **Kind**: Username with password
   - **Username**: Your GitHub username
   - **Password**: Your GitHub personal access token
   - **ID**: `github-credentials`
   - **Description**: GitHub credentials for user-service

### Step 2: Create GitHub Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click **"Generate new token"**
3. Select scopes: `repo`, `admin:repo_hook`
4. Copy the token and use it as password in Jenkins credentials

### Step 3: Create Pipeline Job
1. Click **"New Item"** on Jenkins dashboard
2. Enter job name: `user-service-github-pipeline`
3. Select **"Pipeline"** job type
4. Click **"OK"**

### Step 4: Configure GitHub Pipeline
1. In **"Pipeline"** section:
   - **Definition**: "Pipeline script from SCM"
   - **SCM**: "Git"
   - **Repository URL**: `https://github.com/yourusername/your-repo.git`
   - **Credentials**: Select the GitHub credentials you created
   - **Branch Specifier**: `*/main`
   - **Script Path**: `user-service/Jenkinsfile`

### Step 5: Configure Webhooks (Optional)
1. In your GitHub repository, go to Settings → Webhooks
2. Click **"Add webhook"**
3. Configure:
   - **Payload URL**: `http://your-jenkins-url:8090/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select "Just the push event"
   - **Active**: Checked

---

## 🔧 Advanced Configuration

### Environment Variables Setup
The Jenkinsfile uses these environment variables. You can override them in Jenkins:

1. Go to your job → **"Configure"**
2. Scroll to **"Build Environment"**
3. Check **"Use secret text(s) or file(s)"**
4. Add bindings for sensitive data:
   - **Variable**: `SONAR_TOKEN`
   - **Credentials**: Create SonarQube token credential

### SonarQube Integration
1. Go to **"Manage Jenkins"** → **"Configure System"**
2. Find **"SonarQube servers"** section
3. Add server:
   - **Name**: `SonarQube`
   - **Server URL**: `http://sonarqube:9000`
   - **Token**: Create SonarQube token credential

### Docker Integration
The Jenkins container already has Docker access. The pipeline can:
- Build Docker images
- Push to registries
- Run containers for testing

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Workspace not found"
**Solution**: 
- Ensure the workspace directory exists
- Check file permissions
- Use absolute paths in Jenkinsfile

#### 2. "Git repository not found"
**Solution**:
- Verify repository URL
- Check credentials
- Ensure repository is public or credentials have access

#### 3. "Node.js not found"
**Solution**:
- The Jenkinsfile uses `node:18-alpine` Docker image
- Node.js is available in the container
- Check if Docker is running

#### 4. "SonarQube connection failed"
**Solution**:
- Ensure SonarQube is running: `docker-compose ps`
- Check SonarQube URL in Jenkins configuration
- Verify network connectivity

#### 5. "Test failures"
**Solution**:
- Check if user-service dependencies are installed
- Verify database connection
- Review test logs in Jenkins console

### Debugging Steps

1. **Check Jenkins Logs**:
   ```bash
   make jenkins-logs
   ```

2. **Access Jenkins Container**:
   ```bash
   docker exec -it pulse-jenkins /bin/bash
   ```

3. **Check Pipeline Console Output**:
   - Go to your job → Build number → Console Output
   - Review detailed execution logs

4. **Verify Service Dependencies**:
   ```bash
   docker-compose ps
   ```

---

## 📊 Pipeline Stages Explained

The Jenkinsfile includes these stages:

1. **Checkout**: Gets source code
2. **Install Dependencies**: Runs `npm ci`
3. **Lint**: ESLint code quality checks
4. **Build**: Generates Prisma client and seeds database
5. **Test**: Runs Jest unit tests
6. **Test Coverage**: Generates coverage reports
7. **SonarQube Analysis**: Code quality analysis
8. **Quality Gate**: Validates SonarQube results
9. **Build Docker Image**: Creates production image
10. **Security Scan**: npm audit security check

---

## 🎯 Next Steps

1. **Choose your configuration option** (Local or GitHub)
2. **Follow the setup steps** above
3. **Run your first pipeline** to test the setup
4. **Review the reports** generated (coverage, tests, etc.)
5. **Customize the pipeline** as needed for your workflow

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Jenkins console output
3. Check Docker container logs
4. Verify all services are running: `docker-compose ps`

For more detailed information, see: `jenkins/README.md`

