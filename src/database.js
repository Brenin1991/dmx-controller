const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crie o banco de dados (ou abra se já existir)
const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Crie a tabela `audio` se não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS audio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      intensity INTEGER DEFAULT 0,  -- Canal 1
      effect INTEGER DEFAULT 0,     -- Canal 2
      r INTEGER DEFAULT 0,          -- Canal 3 (RGB)
      g INTEGER DEFAULT 0,          -- Canal 4 (RGB)
      b INTEGER DEFAULT 0           -- Canal 5 (RGB)
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err.message);
    } else {
      console.log('Tabela `audio` criada ou já existente.');
    }
  });
});

module.exports = db;
