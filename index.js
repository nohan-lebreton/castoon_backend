const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL Pool
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false,
    },
  });

// Test de connexion à PostgreSQL
pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('Connection error', err.stack));

// Routes
app.get('/', (req, res) => {
  res.send('Bienvenue sur CastoonAPI');
});

// API pour les abonnés
app.get('/subscribers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscribers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API pour les enfants d’un abonné
app.get('/subscribers/:subscriberId/children', async (req, res) => {
  const { subscriberId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM children WHERE subscriber_id = $1', [subscriberId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API pour ajouter un enfant
app.post('/children', async (req, res) => {
  const { subscriber_id, first_name, age } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO children (subscriber_id, first_name, age) VALUES ($1, $2, $3) RETURNING *',
      [subscriber_id, first_name, age]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API pour associer une thématique à un enfant
app.post('/children/:childId/thematics', async (req, res) => {
  const { childId } = req.params;
  const { thematic_id, is_liked } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO children_thematics (child_id, thematic_id, is_liked) VALUES ($1, $2, $3) RETURNING *',
      [childId, thematic_id, is_liked || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
