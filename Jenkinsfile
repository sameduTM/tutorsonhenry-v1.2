pipeline {
    agent any
    options {
        skipStagesAfterUnstable()
    }
    stages {
        stage('Build') {
            steps {
                sh 'ssh -q kenwanyama@173.212.221.240'
                sh 'sleep 5'
                echo 'Building...'
            }
        }
        stage('Test'){
            steps {
                sh 'ls -al'
                sh 'cd tutorsonhenry-v1.2'
                sh 'git pull'
                echo 'Testing...'
            }
        }
        stage('Deploy') {
            steps {
                sh 'sleep 2'
                sh 'pm2 reload'
                sh 'Deployed' //
            }
        }
    }
}