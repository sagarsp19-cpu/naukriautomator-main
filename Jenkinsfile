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

        stage('OWASP Dependency-Check') {
            steps {
                script {
                    def dependencyCheckHome = tool 'OWASP-Dependency-Check'

                    bat """
                        "${dependencyCheckHome}\\bin\\dependency-check.bat" ^
                        --project "NaukriAutomator" ^
                        --scan "${WORKSPACE}\\backend" ^
                        --format "HTML" ^
                        --out "${WORKSPACE}\\dependency-check-report"
                    """
                }
            }
        }

        stage('Archive Backend') {
            steps {
                archiveArtifacts artifacts: 'backend/target/*.jar',
                    fingerprint: true

                archiveArtifacts artifacts: 'dependency-check-report/dependency-check-report.html',
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
