pipeline {
    agent any

    tools {
        jdk 'JDK21'
        maven 'Maven3.9'
        nodejs 'Node20'
    }

    environment {
        DOCKER_HOME = 'C:\\Program Files\\Docker\\Docker\\resources\\bin'
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

        stage('Verify Docker') {
            steps {
                bat """
                    echo ==============================
                    echo Checking Docker Installation
                    echo ==============================

                    "${DOCKER_HOME}\\docker.exe" --version

                    echo.
                    echo ==============================
                    echo Checking Docker Engine
                    echo ==============================

                    "${DOCKER_HOME}\\docker.exe" info
                """
            }
        }

        stage('Docker Build') {
            steps {
                bat """
                    echo ==============================
                    echo Building Backend Docker Image
                    echo ==============================

                    "${DOCKER_HOME}\\docker.exe" build ^
                    -t naukriautomator-backend:%BUILD_NUMBER% ^
                    ./backend

                    echo.
                    echo ==============================
                    echo Building Frontend Docker Image
                    echo ==============================

                    "${DOCKER_HOME}\\docker.exe" build ^
                    -t naukriautomator-frontend:%BUILD_NUMBER% ^
                    ./frontend

                    echo.
                    echo ==============================
                    echo Docker Images Created
                    echo ==============================

                    "${DOCKER_HOME}\\docker.exe" images
                """
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'CI/CD pipeline failed.'
        }
    }
}
