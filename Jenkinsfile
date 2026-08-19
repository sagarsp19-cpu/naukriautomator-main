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
                    echo Checking Docker...

                    "${DOCKER_HOME}\\docker.exe" --version

                    "${DOCKER_HOME}\\docker.exe" info
                """
            }
        }

        stage('Docker Build') {
            steps {
                bat """
                    echo Building Backend Docker Image...

                    "${DOCKER_HOME}\\docker.exe" build ^
                    -t naukriautomator-backend:%BUILD_NUMBER% ^
                    ./backend

                    echo Building Frontend Docker Image...

                    "${DOCKER_HOME}\\docker.exe" build ^
                    -t naukriautomator-frontend:%BUILD_NUMBER% ^
                    ./frontend

                    echo Docker Images Created:

                    "${DOCKER_HOME}\\docker.exe" images
                """
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    bat """
                        echo Logging into Docker Hub...

                        echo %DOCKER_PASSWORD% | "${DOCKER_HOME}\\docker.exe" login -u "%DOCKER_USERNAME%" --password-stdin

                        echo Tagging Backend...

                        "${DOCKER_HOME}\\docker.exe" tag ^
                        naukriautomator-backend:%BUILD_NUMBER% ^
                        %DOCKER_USERNAME%/naukriautomator-backend:%BUILD_NUMBER%

                        echo Tagging Frontend...

                        "${DOCKER_HOME}\\docker.exe" tag ^
                        naukriautomator-frontend:%BUILD_NUMBER% ^
                        %DOCKER_USERNAME%/naukriautomator-frontend:%BUILD_NUMBER%

                        echo Pushing Backend...

                        "${DOCKER_HOME}\\docker.exe" push ^
                        %DOCKER_USERNAME%/naukriautomator-backend:%BUILD_NUMBER%

                        echo Pushing Frontend...

                        "${DOCKER_HOME}\\docker.exe" push ^
                        %DOCKER_USERNAME%/naukriautomator-frontend:%BUILD_NUMBER%

                        echo Docker Hub Push Completed Successfully.
                    """
                }
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
