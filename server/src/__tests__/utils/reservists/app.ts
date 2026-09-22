import request from 'supertest';
import { initializeApp } from '../../../app.js';

// The real application: real router -> controller -> service -> repository -> database.
const app = initializeApp();

export const api = (): ReturnType<typeof request> => request(app);
