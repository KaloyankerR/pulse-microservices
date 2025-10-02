pipeline {
    agent any
    
    stages {
        stage('Hello') {
            steps {
                echo 'Hello World!'
                sh 'pwd'
                sh 'ls -la'
            }
        }
        
        stage('Check Node.js') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }
        
        stage('Test User Service') {
            steps {
                script {
                    if (fileExists('user-service/package.json')) {
                        echo 'Found user-service directory!'
                        dir('user-service') {
                            sh 'pwd'
                            sh 'ls -la'
                        }
                    } else {
                        echo 'user-service directory not found'
                        sh 'find . -name "package.json" -type f'
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed!'
        }
    }
}

