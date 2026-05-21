pipeline {
    agent any
    options {
        skipStagesAfterUnstable()
    }
    stages {
        stage('Build') {
            steps {
                sh 'ssh kenwanyama@173.212.221.240'
                sh 'sleep 5'
                echo 'Building...'
            }
        }
        stage('Test'){
            steps {
                sh 'ls -al'
                sh 'git pull'
                echo 'Testing...'
                sh 'sleep 2'
                sh 'pm2 reload'
            }
        }
        stage('Deploy') {
            steps {
                sh 'Deployed' //
            }
        }
    }
}