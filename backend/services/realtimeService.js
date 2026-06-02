/**
 * Service realtime : enveloppe socket.io.
 * Authentification JWT du handshake. Rooms par utilisateur et par municipalité.
 */

const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { User } = require('../models');
const logger = require('../utils/logger');

function userRoom(userId) { return `user:${userId}`; }
function municipalityRoom(municipalityId, scope = 'all') {
  return scope === 'all' ? `municipality:${municipalityId}` : `municipality:${municipalityId}:${scope}`;
}

function init(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Token manquant'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'municipality_id', 'role', 'is_active']
      });
      if (!user || !user.is_active) return next(new Error('Utilisateur invalide'));

      socket.data.user = {
        id: user.id,
        municipalityId: user.municipality_id,
        role: user.role
      };
      next();
    } catch (err) {
      next(new Error('Auth échouée'));
    }
  });

  io.on('connection', (socket) => {
    const { id, municipalityId, role } = socket.data.user;
    socket.join(userRoom(id));
    if (municipalityId) {
      socket.join(municipalityRoom(municipalityId, 'all'));
      if (['admin', 'super_admin'].includes(role)) {
        socket.join(municipalityRoom(municipalityId, 'admin'));
      }
      if (role === 'agent') {
        socket.join(municipalityRoom(municipalityId, 'agent'));
      }
    }
    logger.info(`🔌 Socket connecté user=${id} role=${role}`);

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket déconnecté user=${id}`);
    });
  });

  return {
    io,
    emitToUser(userId, event, payload) {
      io.to(userRoom(userId)).emit(event, payload);
    },
    emitToMunicipality(municipalityId, event, payload, scope = 'admin') {
      io.to(municipalityRoom(municipalityId, scope)).emit(event, payload);
    }
  };
}

module.exports = { init };
