const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: 'HcKizlB1FhjG5yyPJroGlpCWsxAFVxLX',
    socket: {
        host: 'redis-14573.c278.us-east-1-4.ec2.cloud.redislabs.com',
        port: 14573
    }
});

redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

// Connect immediately
(async () => {
    await redisClient.connect();
    console.log("Connected to Redis");
})();

module.exports = redisClient;
