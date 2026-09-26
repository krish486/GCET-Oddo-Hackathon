const http = require('node:http');
const { createApp } = require('./src/app');
const { verifyMailer } = require('./src/utils/mailer');

const port = Number(process.env.PORT || 4000);

async function startServer() {
    try {
        await verifyMailer();

        const server = http.createServer(createApp());

        server.listen(port, () => {
            console.log(
                `StockSense API is running at http://localhost:${port}`,
            );
        });
    } catch (error) {
        console.error('Email service configuration failed.');
        console.error(error.message);
        process.exit(1);
    }
}

startServer();