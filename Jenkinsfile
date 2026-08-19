pipeline {
    agent any

    tools {
        jdk 'JDK21'
        maven 'Maven3.9'
        nodejs 'Node20'
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
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('sonarqube-connection') {
                        bat """
                            "${scannerHome}\\bin\\sonar-scanner.bat" ^
                            -Dsonar.projectKey=naukriautomator ^
                            -Dsonar.projectName=naukriautomator ^
                            -Dsonar.sources=backend/src/main,frontend/src ^
                            -Dsonar.java.binaries=backend/target/classes
                        """
                    }
                }
            }
        }

        stage('Archive Backend') {
            steps {
                archiveArtifacts artifacts: 'backend/target/*.jar',
                    fingerprint: true
            }
        }

        stage('Docker Build') {
            steps {
                bat '''
                    docker build -t naukriautomator-backend:%BUILD_NUMBER% ./backend
                    docker build -t naukriautomator-frontend:%BUILD_NUMBER% ./frontend
                '''
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
