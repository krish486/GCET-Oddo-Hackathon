const http = require('node:http');
const { createApp } = require('./app');
const port = Number(process.env.PORT || 4000);
const server = http.createServer(createApp());
server.listen(port, () => console.log(`StockSense API is running at http://localhost:${port}`));
