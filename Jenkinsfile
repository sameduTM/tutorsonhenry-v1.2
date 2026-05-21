pipeline {
    agent any
    options {
        skipStagesAfterUnstable()
    }
    stages {
        stage('Build') {
            steps {
                sh 'ssh kenwanyama@173.212.221.240'
                sh 'cd tutorsonhenry-v1.2'
                sh 'git pull'
                echo 'Building...'
            }
        }
        stage('Test'){
            steps {
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                sh 'pm2 reload'
                sh 'Deployed' //
            }
        }
    }
}