const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: Object.keys(rooms).length });
});

// In-memory room state keyed by 4-character uppercase code
const rooms = {};

const ROLE_DEFINITIONS = {
  Mafia: {
    title: 'Mafia',
    cardRank: 'J',
    cardLabel: 'Jack',
    suit: '♠',
    description: 'Eliminate Townspeople each night and blend in during daytime discussions.'
  },
  Angel: {
    title: 'Angel',
    cardRank: 'A',
    cardLabel: 'Ace',
    suit: '♥',
    description: 'Choose one player each night to protect from elimination by the Mafia.'
  },
  Sheriff: {
    title: 'Sheriff',
    cardRank: 'K',
    cardLabel: 'King',
    suit: '♦',
    description: 'Investigate one player each night to learn whether they belong to the Mafia.'
  },
  Townsperson: {
    title: 'Townsperson',
    cardRank: '10',
    cardLabel: 'Plain',
    suit: '♣',
    description: 'Observe, deduce, and vote during the day to find and put the Mafia on trial.'
  }
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[code]);
  return code;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build public room state WITHOUT leaking roles or secret votes
function getPublicRoomState(room) {
  const livingPlayers = room.players.filter(p => p.alive);
  let submittedVotesCount = 0;
  for (const p of livingPlayers) {
    if (room.votes[p.id] && room.votes[p.id].length === 2) {
      submittedVotesCount++;
    }
  }

  return {
    code: room.code,
    phase: room.phase, // 'lobby' | 'voting' | 'results'
    rolesDealt: room.rolesDealt,
    roleConfig: room.roleConfig,
    players: room.players.map((p, idx) => ({
      id: p.id,
      seatNumber: idx + 1,
      name: p.name,
      alive: p.alive,
      connected: p.connected,
      hasVoted: Boolean(room.votes[p.id] && room.votes[p.id].length === 2)
    })),
    votingProgress: {
      submitted: submittedVotesCount,
      totalLiving: livingPlayers.length
    },
    nomineesResult: room.nomineesResult // null or { nominees: [...], text: "On Trial: ...", breakdown: [...] }
  };
}

function broadcastRoomState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const publicState = getPublicRoomState(room);
  io.to(roomCode).emit('room:state', publicState);
}

function computeAndBroadcastTally(room) {
  const tallyMap = {};
  room.players.forEach(p => {
    if (p.alive) {
      tallyMap[p.id] = { id: p.id, name: p.name, votes: 0 };
    }
  });

  // Only count votes from living players
  const livingIds = new Set(room.players.filter(p => p.alive).map(p => p.id));
  for (const [voterId, targets] of Object.entries(room.votes)) {
    if (!livingIds.has(voterId) || !Array.isArray(targets)) continue;
    // Ensure distinct valid targets
    const uniqueTargets = [...new Set(targets)].slice(0, 2);
    for (const targetId of uniqueTargets) {
      if (tallyMap[targetId]) {
        tallyMap[targetId].votes += 1;
      }
    }
  }

  const sorted = Object.values(tallyMap).sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a.name.localeCompare(b.name);
  });

  // Top 2 players with the highest vote counts
  const top2 = sorted.slice(0, 2);
  let announcement = 'On Trial: None';
  if (top2.length === 2) {
    announcement = `On Trial: ${top2[0].name} and ${top2[1].name}`;
  } else if (top2.length === 1) {
    announcement = `On Trial: ${top2[0].name}`;
  }

  room.phase = 'results';
  room.nomineesResult = {
    nominees: top2,
    text: announcement,
    breakdown: sorted.filter(item => item.votes > 0)
  };

  broadcastRoomState(room.code);
  io.to(room.code).emit('voting:results', room.nomineesResult);
}

io.on('connection', (socket) => {
  // Judge creates or reconnects to a room
  socket.on('judge:create_room', (payload = {}, callback) => {
    const requestedCode = payload.roomCode ? String(payload.roomCode).trim().toUpperCase() : '';
    let room;

    if (requestedCode && rooms[requestedCode] && rooms[requestedCode].judgeToken === payload.judgeToken) {
      room = rooms[requestedCode];
      room.judgeSocketId = socket.id;
    } else {
      const code = (requestedCode && /^[A-Z0-9]{4}$/.test(requestedCode) && !rooms[requestedCode])
        ? requestedCode
        : generateRoomCode();
      const judgeToken = generateId();
      room = {
        code,
        judgeSocketId: socket.id,
        judgeToken,
        roleConfig: {
          mafia: 3,
          angel: 1,
          sheriff: 1
        },
        rolesDealt: false,
        phase: 'lobby', // 'lobby' | 'voting' | 'results'
        players: [], // { id, name, socketId, alive, connected, role }
        votes: {}, // { [playerId]: [targetId1, targetId2] }
        nomineesResult: null
      };
      rooms[code] = room;
    }

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.isJudge = true;

    if (typeof callback === 'function') {
      callback({
        ok: true,
        roomCode: room.code,
        judgeToken: room.judgeToken,
        state: getPublicRoomState(room)
      });
    }
    broadcastRoomState(room.code);
  });

  // Player joins or reconnects to a room
  socket.on('player:join_room', (payload = {}, callback) => {
    const code = String(payload.roomCode || '').trim().toUpperCase();
    const name = String(payload.name || '').trim().slice(0, 24);
    const existingPlayerId = payload.playerId ? String(payload.playerId) : null;

    if (!code || !rooms[code]) {
      return callback && callback({ ok: false, error: 'Room not found. Check the 4-character Room Code.' });
    }

    const room = rooms[code];
    let player = null;

    // Check if reconnecting by playerId
    if (existingPlayerId) {
      player = room.players.find(p => p.id === existingPlayerId);
    }

    // Or check if matching nickname is currently disconnected
    if (!player && name) {
      const disconnectedMatch = room.players.find(
        p => p.name.toLowerCase() === name.toLowerCase() && !p.connected
      );
      if (disconnectedMatch) {
        player = disconnectedMatch;
      }
    }

    if (!player) {
      if (!name) {
        return callback && callback({ ok: false, error: 'Please enter a valid nickname.' });
      }
      if (room.players.length >= 25) {
        return callback && callback({ ok: false, error: 'Room is full (maximum 25 players).' });
      }
      const duplicate = room.players.some(p => p.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        return callback && callback({ ok: false, error: 'That nickname is already taken in this room.' });
      }

      player = {
        id: generateId(),
        name,
        socketId: socket.id,
        alive: true,
        connected: true,
        role: room.rolesDealt ? ROLE_DEFINITIONS.Townsperson : null
      };
      room.players.push(player);
    } else {
      player.socketId = socket.id;
      player.connected = true;
    }

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    socket.data.isJudge = false;

    if (typeof callback === 'function') {
      callback({
        ok: true,
        roomCode: room.code,
        playerId: player.id,
        name: player.name,
        role: player.role,
        myVote: room.votes[player.id] || null,
        state: getPublicRoomState(room)
      });
    }

    // Also privately emit role if already dealt
    if (player.role) {
      socket.emit('player:role_assigned', player.role);
    }

    broadcastRoomState(room.code);
  });

  // Judge deals roles privately to all players
  socket.on('judge:deal_roles', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room || !socket.data.isJudge) {
      return callback && callback({ ok: false, error: 'Unauthorized: Judge access required.' });
    }

    const totalPlayers = room.players.length;
    if (totalPlayers < 1) {
      return callback && callback({ ok: false, error: 'Need at least 1 connected player to deal roles.' });
    }

    const mafiaCount = Math.max(0, parseInt(payload.mafia, 10) || 0);
    const angelCount = Math.max(0, parseInt(payload.angel, 10) || 0);
    const sheriffCount = Math.max(0, parseInt(payload.sheriff, 10) || 0);
    const specialCount = mafiaCount + angelCount + sheriffCount;

    if (specialCount > totalPlayers) {
      return callback && callback({
        ok: false,
        error: `Special roles (${specialCount}) exceed total connected players (${totalPlayers}).`
      });
    }

    room.roleConfig = { mafia: mafiaCount, angel: angelCount, sheriff: sheriffCount };

    const deck = [];
    for (let i = 0; i < mafiaCount; i++) deck.push(ROLE_DEFINITIONS.Mafia);
    for (let i = 0; i < angelCount; i++) deck.push(ROLE_DEFINITIONS.Angel);
    for (let i = 0; i < sheriffCount; i++) deck.push(ROLE_DEFINITIONS.Sheriff);
    while (deck.length < totalPlayers) {
      deck.push(ROLE_DEFINITIONS.Townsperson);
    }

    const shuffledDeck = shuffleArray(deck);

    room.players.forEach((player, index) => {
      player.role = shuffledDeck[index];
      if (player.socketId) {
        io.to(player.socketId).emit('player:role_assigned', player.role);
      }
    });

    room.rolesDealt = true;
    broadcastRoomState(room.code);

    if (typeof callback === 'function') {
      callback({ ok: true, message: `Dealt roles to ${totalPlayers} players.` });
    }
  });

  // Judge toggles Alive / Dead status for a player
  socket.on('judge:toggle_alive', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room || !socket.data.isJudge) {
      return callback && callback({ ok: false, error: 'Unauthorized.' });
    }

    const player = room.players.find(p => p.id === payload.playerId);
    if (!player) {
      return callback && callback({ ok: false, error: 'Player not found.' });
    }

    player.alive = !player.alive;

    // If player died during voting, remove their submitted vote and check if all remaining living players have voted
    if (!player.alive && room.votes[player.id]) {
      delete room.votes[player.id];
    }

    if (room.phase === 'voting') {
      const livingPlayers = room.players.filter(p => p.alive);
      const allVoted = livingPlayers.length >= 2 && livingPlayers.every(p => room.votes[p.id] && room.votes[p.id].length === 2);
      if (allVoted) {
        computeAndBroadcastTally(room);
        return callback && callback({ ok: true });
      }
    }

    broadcastRoomState(room.code);
    if (typeof callback === 'function') {
      callback({ ok: true, alive: player.alive });
    }
  });

  // Judge starts secret nominations
  socket.on('judge:start_nominations', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room || !socket.data.isJudge) {
      return callback && callback({ ok: false, error: 'Unauthorized.' });
    }

    const livingPlayers = room.players.filter(p => p.alive);
    if (livingPlayers.length < 2) {
      return callback && callback({
        ok: false,
        error: 'At least 2 living players are required to start nominations.'
      });
    }

    room.phase = 'voting';
    room.votes = {};
    room.nomineesResult = null;

    broadcastRoomState(room.code);
    io.to(room.code).emit('voting:started');

    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  // Player submits secret 2-player nomination vote
  socket.on('player:submit_vote', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room) {
      return callback && callback({ ok: false, error: 'Room not found.' });
    }

    if (room.phase !== 'voting') {
      return callback && callback({ ok: false, error: 'Voting is not currently active.' });
    }

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (!player) {
      return callback && callback({ ok: false, error: 'Player not recognized.' });
    }

    if (!player.alive) {
      return callback && callback({ ok: false, error: 'Dead players cannot vote.' });
    }

    if (room.votes[player.id] && room.votes[player.id].length === 2) {
      return callback && callback({ ok: false, error: 'You have already submitted your vote for this round.' });
    }

    const nominees = Array.isArray(payload.nominees) ? payload.nominees : [];
    if (nominees.length !== 2 || nominees[0] === nominees[1]) {
      return callback && callback({ ok: false, error: 'Please select exactly 2 different living players.' });
    }

    const livingIds = new Set(room.players.filter(p => p.alive).map(p => p.id));
    if (!livingIds.has(nominees[0]) || !livingIds.has(nominees[1])) {
      return callback && callback({ ok: false, error: 'Both nominees must be living players.' });
    }

    room.votes[player.id] = [nominees[0], nominees[1]];

    if (typeof callback === 'function') {
      callback({ ok: true, myVote: room.votes[player.id] });
    }

    // Check if all living players have submitted their votes
    const livingPlayers = room.players.filter(p => p.alive);
    const allVoted = livingPlayers.length > 0 && livingPlayers.every(p => room.votes[p.id] && room.votes[p.id].length === 2);

    if (allVoted) {
      computeAndBroadcastTally(room);
    } else {
      broadcastRoomState(room.code);
    }
  });

  // Judge forces tally early
  socket.on('judge:force_tally', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room || !socket.data.isJudge) {
      return callback && callback({ ok: false, error: 'Unauthorized.' });
    }

    computeAndBroadcastTally(room);
    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  // Judge resets round (clears current votes & nominee results)
  socket.on('judge:reset_round', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room || !socket.data.isJudge) {
      return callback && callback({ ok: false, error: 'Unauthorized.' });
    }

    room.phase = 'lobby';
    room.votes = {};
    room.nomineesResult = null;

    broadcastRoomState(room.code);
    io.to(room.code).emit('round:reset');

    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  // Judge removes a disconnected player if needed
  socket.on('judge:remove_player', (payload = {}, callback) => {
    const room = rooms[socket.data.roomCode];
    if (!room || !socket.data.isJudge) {
      return callback && callback({ ok: false, error: 'Unauthorized.' });
    }

    const idx = room.players.findIndex(p => p.id === payload.playerId);
    if (idx === -1) {
      return callback && callback({ ok: false, error: 'Player not found.' });
    }

    const [removed] = room.players.splice(idx, 1);
    delete room.votes[removed.id];
    if (removed.socketId) {
      io.to(removed.socketId).emit('player:removed');
    }

    broadcastRoomState(room.code);
    if (typeof callback === 'function') {
      callback({ ok: true });
    }
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];
    if (socket.data.isJudge) {
      // Judge disconnected; keep room alive for reconnect
      return;
    }

    const player = room.players.find(p => p.id === socket.data.playerId);
    if (player) {
      player.connected = false;
      broadcastRoomState(code);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Mafia Moderator & Voting server running on http://localhost:${PORT}`);
});

