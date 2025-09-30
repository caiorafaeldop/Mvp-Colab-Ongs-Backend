const mongoose = require('mongoose');
require('dotenv').config();

// Flag para evitar múltiplas conexões
let isConnected = false;
let isConnecting = false;

const connectDB = async () => {
  // Se já está conectado, não conectar novamente
  if (isConnected || mongoose.connection.readyState === 1) {
    console.log('[DB] MongoDB já conectado, reutilizando conexão');
    return mongoose.connection;
  }

  // Se já está tentando conectar, aguardar
  if (isConnecting) {
    console.log('[DB] Conexão já em andamento, aguardando...');
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (isConnected || mongoose.connection.readyState === 1) {
          clearInterval(checkConnection);
          resolve(mongoose.connection);
        }
      }, 100);
    });
  }

  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    isConnected = true;
    isConnecting = false;
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);

    // Configurar event listeners apenas uma vez
    if (!mongoose.connection.listeners('error').length) {
      mongoose.connection.on('error', (err) => {
        console.error(`[DB] MongoDB connection error: ${err}`);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.info('[DB] MongoDB reconnected');
        isConnected = true;
      });

      // Configurar graceful shutdown apenas uma vez
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('[DB] MongoDB connection closed through app termination');
          process.exit(0);
        } catch (err) {
          console.error('[DB] Error during MongoDB shutdown:', err);
          process.exit(1);
        }
      });
    }

    return conn;
  } catch (error) {
    console.error(`[DB] Error: ${error.message}`);
    isConnecting = false;
    isConnected = false;
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
