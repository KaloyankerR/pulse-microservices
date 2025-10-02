# Jenkins Pipeline Troubleshooting Guide

## 🚨 Issue: "No steps in the pipeline"

If you're not seeing any stages in your Jenkins pipeline, here are the most common causes and solutions:

---

## 🔍 **Step 1: Check Your Pipeline Configuration**

### In Jenkins UI:
1. Go to your job → **"Configure"**
2. Scroll down to **"Pipeline"** section
3. Check the **"Definition"** dropdown:

#### ✅ **Correct Setup - Option A (Pipeline Script):**
- **Definition**: `Pipeline script`
- **Script**: Copy the content from `jenkins/simple-test-pipeline.groovy`

#### ✅ **Correct Setup - Option B (Pipeline from SCM):**
- **Definition**: `Pipeline script from SCM`
- **SCM**: `Git`
- **Script Path**: `user-service/Jenkinsfile`

---

## 🔍 **Step 2: Test with Simple Pipeline First**

1. **Create a new job** called `test-pipeline`
2. **Pipeline type**: Pipeline
3. **Definition**: Pipeline script
4. **Copy this simple script**:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Hello') {
            steps {
                echo 'Hello World!'
                sh 'pwd'
            }
        }
    }
}
```

5. **Save** and **Build Now**
6. **Check Console Output** - you should see "Hello World!"

---

## 🔍 **Step 3: Check Workspace Setup**

### For Local Development:

1. **Check if workspace exists**:
   ```bash
   docker exec -it pulse-jenkins ls -la /var/jenkins_home/workspace/
   ```

2. **Copy your user-service to workspace**:
   ```bash
   docker exec -it pulse-jenkins mkdir -p /var/jenkins_home/workspace/your-job-name
   docker cp user-service pulse-jenkins:/var/jenkins_home/workspace/your-job-name/
   ```

3. **Verify files are there**:
   ```bash
   docker exec -it pulse-jenkins ls -la /var/jenkins_home/workspace/your-job-name/user-service/
   ```

---

## 🔍 **Step 4: Common Issues & Solutions**

### Issue 1: Empty Pipeline Definition
**Symptom**: No stages appear
**Solution**: Make sure you've copied the pipeline script correctly

### Issue 2: Wrong Agent Configuration
**Symptom**: Pipeline fails to start
**Solution**: Use `agent any` for testing, then switch to Docker later

### Issue 3: Workspace Not Found
**Symptom**: "No such file or directory"
**Solution**: Copy your code to Jenkins workspace or use proper SCM

### Issue 4: Syntax Errors
**Symptom**: Pipeline fails with syntax errors
**Solution**: Use the simple test pipeline first to verify setup

---

## 🔧 **Quick Fix Steps**

### **Method 1: Simple Test Pipeline**
1. Create new job: `test-pipeline`
2. Pipeline type: Pipeline
3. Definition: Pipeline script
4. Script: Copy from `jenkins/simple-test-pipeline.groovy`
5. Save and Build Now

### **Method 2: Copy Files to Workspace**
```bash
# Copy your user-service to Jenkins
docker exec -it pulse-jenkins mkdir -p /var/jenkins_home/workspace/user-service-test
docker cp user-service pulse-jenkins:/var/jenkins_home/workspace/user-service-test/

# Create the job in Jenkins UI
# Use Pipeline script with content from user-service/Jenkinsfile.local
```

### **Method 3: Use Docker Volume Mounting**
Add this to your `docker-compose.yml` under Jenkins service:
```yaml
volumes:
  - ./user-service:/var/jenkins_home/workspace/user-service:ro
```

---

## 🎯 **Recommended Setup for Testing**

### **Step 1: Create Test Job**
1. **New Item** → `user-service-test`
2. **Pipeline** type
3. **Pipeline script** (not from SCM)
4. **Copy this script**:

```groovy
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }
    
    stages {
        stage('Check Workspace') {
            steps {
                sh 'pwd && ls -la'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci --silent'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
    }
}
```

### **Step 2: Set Custom Workspace**
1. Go to **"Build Environment"** section
2. Check **"Use custom workspace"**
3. Enter: `/var/jenkins_home/workspace/user-service`

### **Step 3: Copy Your Code**
```bash
docker cp user-service pulse-jenkins:/var/jenkins_home/workspace/user-service/
```

---

## 🔍 **Debugging Commands**

### Check Jenkins Status:
```bash
make jenkins-logs
```

### Access Jenkins Container:
```bash
docker exec -it pulse-jenkins /bin/bash
```

### Check Workspace:
```bash
docker exec -it pulse-jenkins ls -la /var/jenkins_home/workspace/
```

### Copy Files:
```bash
docker cp user-service pulse-jenkins:/var/jenkins_home/workspace/user-service/
```

---

## 📞 **Still Having Issues?**

1. **Check Jenkins Console Output** for your job
2. **Verify Jenkins is running**: http://localhost:8090
3. **Try the simple test pipeline** first
4. **Check file permissions** in workspace
5. **Review Jenkins logs**: `make jenkins-logs`

---

## 🎯 **Next Steps After Pipeline Works**

Once you see stages running:
1. **Add more complex stages** gradually
2. **Test with your actual user-service code**
3. **Add reporting and notifications**
4. **Configure GitHub integration** if needed

