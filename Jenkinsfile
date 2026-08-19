pipeline {
    agent any

    tools {
        jdk 'JDK21'
        maven 'Maven3.9'
        nodejs 'Node20'
        sonarQube 'SonarScanner'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'mvn clean package -Dmaven.test.skip=true'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm install --legacy-peer-deps'
                    bat 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-connection') {
                    bat '''
                        sonar-scanner ^
                        -Dsonar.projectKey=naukriautomator ^
                        -Dsonar.projectName=naukriautomator ^
                        -Dsonar.sources=backend/src/main,frontend/src ^
                        -Dsonar.java.binaries=backend/target/classes
                    '''
                }
            }
        }

        stage('Archive Backend') {
            steps {
                archiveArtifacts artifacts: 'backend/target/*.jar',
                    fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully.'
        }

        failure {
            echo 'Build failed.'
        }
    }
}
