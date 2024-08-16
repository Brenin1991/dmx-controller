module.exports = (ws) => {
    ws.on('message', (message) => {
      console.log(`Mensagem recebida: ${message}`);
      // Aqui você pode enviar os comandos para o QLC+
    });
  
    ws.on('close', () => {
      console.log('Conexão WebSocket fechada');
    });
  
    ws.on('error', (error) => {
      console.error(`Erro WebSocket: ${error}`);
    });
  };
  