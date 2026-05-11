import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from CargoGo minimal setup!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
