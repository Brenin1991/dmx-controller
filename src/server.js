const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('ws'); // Importa o Server do ws
const db = require('./database'); // Certifique-se de que isso está correto

const app = express();
const port = 3000;

const fs = require('fs'); // Adicione esta linha

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin.html as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Configuração do upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Rota para adicionar áudios
app.post('/upload', upload.single('audioFile'), (req, res) => {
  const { audioName, intensity, effect, color } = req.body;
  const audioPath = `/uploads/${req.file.filename}`;

  // Separar a cor em valores RGB
  const colorHex = color || '#000000';
  const r = parseInt(colorHex.substring(1, 3), 16);
  const g = parseInt(colorHex.substring(3, 5), 16);
  const b = parseInt(colorHex.substring(5, 7), 16);

  // Inserir os dados no banco de dados
  db.run('INSERT INTO audio (name, path, intensity, effect, r, g, b) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [audioName, audioPath, intensity, effect, r, g, b], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'Áudio adicionado com sucesso!' });
  });
});

// Rota para obter todos os áudios no formato desejado
app.get('/api/audios', (req, res) => {
  db.all('SELECT name, path FROM audio', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Construa o objeto JSON com base nos resultados da consulta
    const audioJson = {};
    rows.forEach(row => {
      const key = row.name;
      const value = `http://localhost:3000${row.path}`; // Altere se necessário
      audioJson[key] = value;
    });

    // Envie o JSON como resposta
    res.json(audioJson);
  });
});

// Rota para obter áudios (sem formatação especial)
app.get('/audios', (req, res) => {
  db.all('SELECT * FROM audio', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Rota para deletar um áudio
app.delete('/delete/:name', (req, res) => {
  const audioName = req.params.name;
  
  // Primeiro, obter o caminho do arquivo no banco de dados
  db.get('SELECT path FROM audio WHERE name = ?', [audioName], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Áudio não encontrado' });
    }

    // Deletar o arquivo do sistema
    const filePath = path.join(__dirname, '../public', row.path);
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar o arquivo' });
      }

      // Deletar o registro do banco de dados
      db.run('DELETE FROM audio WHERE name = ?', [audioName], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Áudio deletado com sucesso' });
      });
    });
  });
});

// Rota para receber dados do Voiceflow e enviar para clientes WebSocket
app.post('/voiceflow', (req, res) => {
    const { audioName } = req.body;
    // Verifica se o audioName foi fornecido
    if (!audioName) {
      return res.status(400).json({ error: 'O nome do áudio é obrigatório.' });
    }
  
    // Buscar informações do áudio no banco de dados
    db.get('SELECT * FROM audio WHERE name = ?', [audioName], (err, row) => {
      if (err) {
        console.error('Erro ao buscar áudio:', err.message);
        return res.status(500).json({ error: err.message });
      }
  
      if (row) {
        // Informações do áudio
        const audioInfo = {
          name: row.name,
          path: `http://localhost:3000${row.path}`, // Altere se necessário
          intensity: row.intensity,
          effect: row.effect,
          color: `rgb(${row.r}, ${row.g}, ${row.b})`
        };
  
        // Enviar informações para todos os clientes WebSocket conectados
        console.log(`Número de clientes conectados: ${wss.clients.size}`); // Adicione isso
        wss.clients.forEach(client => {
          console.log(`Cliente estado: ${client.readyState}`); // Adicione isso
          //if (client.readyState === Server.OPEN) { // Use Server.OPEN aqui
            console.log("enviando msg");
            client.send(JSON.stringify(audioInfo));
            
         // }
        });
  
        // Responder à solicitação do Voiceflow
        res.status(200).json({ message: 'Informações do áudio enviadas aos clientes.' });
      } else {
        res.status(404).json({ error: 'Áudio não encontrado' });
      }
    });
  });

// Servidor WebSocket
const wss = new Server({ port: 3300 });
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});

