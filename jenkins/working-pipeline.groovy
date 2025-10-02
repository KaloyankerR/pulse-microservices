pipeline {
    agent any
    
    stages {
        stage('Check Workspace') {
            steps {
                echo 'Checking workspace...'
                sh 'pwd'
                sh 'ls -la'
            }
        }
        
        stage('Check User Service') {
            steps {
                echo 'Looking for user-service...'
                script {
                    if (fileExists('user-service/package.json')) {
                        echo '✅ Found user-service with package.json!'
                        dir('user-service') {
                            sh 'pwd'
                            sh 'ls -la'
                            sh 'cat package.json | head -10'
                        }
                    } else {
                        echo '❌ user-service not found'
                        sh 'find . -name "package.json" -type f 2>/dev/null || echo "No package.json found"'
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            when {
                expression { fileExists('user-service/package.json') }
            }
            steps {
                echo 'Installing dependencies...'
                dir('user-service') {
                    sh 'npm ci --silent'
                }
            }
        }
        
        stage('Run Tests') {
            when {
                expression { fileExists('user-service/package.json') }
            }
            steps {
                echo 'Running tests...'
                dir('user-service') {
                    sh 'npm test'
                }
            }
        }
        
        stage('Run Coverage') {
            when {
                expression { fileExists('user-service/package.json') }
            }
            steps {
                echo 'Running test coverage...'
                dir('user-service') {
                    sh 'npm run test:coverage'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline execution completed!'
        }
        success {
            echo '✅ Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}

