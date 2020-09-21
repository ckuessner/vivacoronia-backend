import { router } from './routes';
import bodyParser from 'body-parser';
import express from 'express';

const app = express();
export default app;

// Load Middlewares
app.use(bodyParser.json({ limit: '512kb' }));

// Routes
app.use('/', router);
