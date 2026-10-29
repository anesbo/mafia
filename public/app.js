/* ==========================================================================
   Mafia Moderator & Secret Voting — Frontend Client
   ========================================================================== */
(function () {
  const socket = io();

  // Application State
  const appState = {
    mode: null, // 'judge' | 'player' | null
    roomCode: null,
    judgeToken: null,
    playerId: null,
    playerName: null,
    myRole: null,
    myVote: null,
    room: null
  };

  // DOM References
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIconEl = document.getElementById('theme-icon');
  const navRoomPill = document.getElementById('nav-room-pill');
  const btnLeaveRoom = document.getElementById('btn-leave-room');
  const toastEl = document.getElementById('toast');

  // Trial Banner
  const trialBanner = document.getElementById('trial-banner');
  const trialAnnouncementText = document.getElementById('trial-announcement-text');
  const trialBreakdown = document.getElementById('trial-breakdown');

  // Views
  const viewLanding = document.getElementById('view-landing');
  const viewJudge = document.getElementById('view-judge');
  const viewPlayer = document.getElementById('view-player');

  // Landing Forms
  const formJoinPlayer = document.getElementById('form-join-player');
  const inputRoomCode = document.getElementById('input-room-code');
  const inputPlayerName = document.getElementById('input-player-name');
  const formCreateJudge = document.getElementById('form-create-judge');
  const inputCustomCode = document.getElementById('input-custom-code');

  // Judge Elements
  const judgeRoomCode = document.getElementById('judge-room-code');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const judgeVoteCounter = document.getElementById('judge-vote-counter');
  const judgePhaseBadge = document.getElementById('judge-phase-badge');
  const btnStartNominations = document.getElementById('btn-start-nominations');
  const btnForceTally = document.getElementById('btn-force-tally');
  const btnResetRound = document.getElementById('btn-reset-round');

  const roleCountMafia = document.getElementById('role-count-mafia');
  const roleCountAngel = document.getElementById('role-count-angel');
  const roleCountSheriff = document.getElementById('role-count-sheriff');
  const roleCountTown = document.getElementById('role-count-town');
  const roleTotalPlayers = document.getElementById('role-total-players');
  const rolesDealtIndicator = document.getElementById('roles-dealt-indicator');
  const btnDealRoles = document.getElementById('btn-deal-roles');

  const judgeRosterSummary = document.getElementById('judge-roster-summary');
  const judgeRosterList = document.getElementById('judge-roster-list');

  // Player Elements
  const playerDisplayName = document.getElementById('player-display-name');
  const playerStatusBadge = document.getElementById('player-status-badge');
  const roleFlipCard = document.getElementById('role-flip-card');
  const cardFrontSub = document.getElementById('card-front-sub');
  const roleRankTl = document.getElementById('role-rank-tl');
  const roleSuitTl = document.getElementById('role-suit-tl');
  const roleRankBr = document.getElementById('role-rank-br');
  const roleSuitBr = document.getElementById('role-suit-br');
  const roleCardLabel = document.getElementById('role-card-label');
  const roleTitle = document.getElementById('role-title');
  const roleDescription = document.getElementById('role-description');

  const playerVotingSection = document.getElementById('player-voting-section');
  const playerVoteProgress = document.getElementById('player-vote-progress');
  const votingInstructions = document.getElementById('voting-instructions');
  const formSubmitVote = document.getElementById('form-submit-vote');
  const selectNominee1 = document.getElementById('select-nominee-1');
  const selectNominee2 = document.getElementById('select-nominee-2');
  const btnSubmitVote = document.getElementById('btn-submit-vote');
  const voteSubmittedNotice = document.getElementById('vote-submitted-notice');

  const playerTableCount = document.getElementById('player-table-count');
  const playerRosterChips = document.getElementById('player-roster-chips');

  /* ==========================================================================
     1. Theme Management (Light / Dark Mode with localStorage)
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('mafia_theme') || 'light';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('mafia_theme', theme);
    themeIconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  initTheme();

  /* ==========================================================================
     2. Toast Helper & View Navigation
     ========================================================================== */
  let toastTimeout = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 3200);
  }

  function switchView(viewName) {
    viewLanding.classList.add('hidden');
    viewJudge.classList.add('hidden');
    viewPlayer.classList.add('hidden');

    if (viewName === 'judge') {
      viewJudge.classList.remove('hidden');
      navRoomPill.textContent = `ROOM ${appState.roomCode} · #13`;
      navRoomPill.classList.remove('hidden');
      btnLeaveRoom.classList.remove('hidden');
    } else if (viewName === 'player') {
      viewPlayer.classList.remove('hidden');
      navRoomPill.textContent = `ROOM ${appState.roomCode}`;
      navRoomPill.classList.remove('hidden');
      btnLeaveRoom.classList.remove('hidden');
    } else {
      viewLanding.classList.remove('hidden');
      navRoomPill.classList.add('hidden');
      btnLeaveRoom.classList.add('hidden');
      trialBanner.classList.add('hidden');
    }
  }

  function saveSession() {
    const data = {
      mode: appState.mode,
      roomCode: appState.roomCode,
      judgeToken: appState.judgeToken,
      playerId: appState.playerId,
      playerName: appState.playerName
    };
    sessionStorage.setItem('mafia_session', JSON.stringify(data));
  }

  function clearSession() {
    sessionStorage.removeItem('mafia_session');
    appState.mode = null;
    appState.roomCode = null;
    appState.judgeToken = null;
    appState.playerId = null;
    appState.playerName = null;
    appState.myRole = null;
    appState.myVote = null;
    appState.room = null;
    roleFlipCard.classList.remove('is-flipped');
    switchView('landing');
  }

  btnLeaveRoom.addEventListener('click', () => {
    clearSession();
    window.location.reload();
  });

  /* ==========================================================================
     3. Judge (#13) Actions & Rendering
     ========================================================================== */
  formCreateJudge.addEventListener('submit', (e) => {
    e.preventDefault();
    const customCode = inputCustomCode.value.trim().toUpperCase();
    socket.emit('judge:create_room', { roomCode: customCode }, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Could not create room.');
      }
      appState.mode = 'judge';
      appState.roomCode = res.roomCode;
      appState.judgeToken = res.judgeToken;
      appState.room = res.state;
      saveSession();
      switchView('judge');
      renderRoomState();
      showToast(`Room ${res.roomCode} ready!`);
    });
  });

  btnCopyCode.addEventListener('click', () => {
    if (!appState.roomCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(appState.roomCode).then(() => {
        showToast(`Copied code ${appState.roomCode}`);
      });
    } else {
      showToast(`Room Code: ${appState.roomCode}`);
    }
  });

  function updateTownspeoplePreview() {
    const total = appState.room ? appState.room.players.length : 0;
    const m = Math.max(0, parseInt(roleCountMafia.value, 10) || 0);
    const a = Math.max(0, parseInt(roleCountAngel.value, 10) || 0);
    const s = Math.max(0, parseInt(roleCountSheriff.value, 10) || 0);
    const town = Math.max(0, total - (m + a + s));
    roleCountTown.textContent = town;
    roleTotalPlayers.textContent = total;
  }

  [roleCountMafia, roleCountAngel, roleCountSheriff].forEach((input) => {
    input.addEventListener('input', updateTownspeoplePreview);
  });

  btnDealRoles.addEventListener('click', () => {
    const mafia = parseInt(roleCountMafia.value, 10) || 0;
    const angel = parseInt(roleCountAngel.value, 10) || 0;
    const sheriff = parseInt(roleCountSheriff.value, 10) || 0;

    socket.emit('judge:deal_roles', { mafia, angel, sheriff }, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to deal roles.');
      }
      showToast(res.message || 'Roles dealt privately to all players!');
    });
  });

  btnStartNominations.addEventListener('click', () => {
    socket.emit('judge:start_nominations', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Cannot start nominations.');
      }
      showToast('Secret nomination voting started!');
    });
  });

  btnForceTally.addEventListener('click', () => {
    socket.emit('judge:force_tally', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to force tally.');
      }
      showToast('Nominations tallied!');
    });
  });

  btnResetRound.addEventListener('click', () => {
    socket.emit('judge:reset_round', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to reset round.');
      }
      showToast('Round votes & results cleared.');
    });
  });

  function renderJudgeView(room) {
    judgeRoomCode.textContent = room.code;
    judgeVoteCounter.textContent = `${room.votingProgress.submitted}/${room.votingProgress.totalLiving} voted`;
    judgePhaseBadge.textContent = room.phase.toUpperCase();

    if (room.rolesDealt) {
      rolesDealtIndicator.textContent = 'Roles Dealt ✓';
      rolesDealtIndicator.classList.add('dealt');
    } else {
      rolesDealtIndicator.textContent = 'Not Dealt';
      rolesDealtIndicator.classList.remove('dealt');
    }

    updateTownspeoplePreview();

    const connectedCount = room.players.filter((p) => p.connected).length;
    const aliveCount = room.players.filter((p) => p.alive).length;
    judgeRosterSummary.textContent = `${connectedCount}/${room.players.length} Online · ${aliveCount} Alive`;

    if (room.players.length === 0) {
      judgeRosterList.innerHTML = `<div class="empty-state">Waiting for players to join with code <strong>${room.code}</strong>...</div>`;
      return;
    }

    judgeRosterList.innerHTML = '';
    room.players.forEach((p) => {
      const row = document.createElement('div');
      row.className = `roster-row ${p.alive ? '' : 'is-dead'}`;

      const info = document.createElement('div');
      info.className = 'roster-player-info';

      const dot = document.createElement('span');
      dot.className = `conn-dot ${p.connected ? 'online' : 'offline'}`;
      dot.title = p.connected ? 'Connected' : 'Disconnected';

      const seat = document.createElement('span');
      seat.className = 'seat-num';
      seat.textContent = `#${p.seatNumber}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'roster-name';
      nameSpan.textContent = p.name;

      info.appendChild(dot);
      info.appendChild(seat);
      info.appendChild(nameSpan);

      const actions = document.createElement('div');
      actions.className = 'roster-actions';

      if (room.phase === 'voting' && p.alive) {
        const voteBadge = document.createElement('span');
        voteBadge.className = `vote-check ${p.hasVoted ? 'done' : ''}`;
        voteBadge.textContent = p.hasVoted ? 'Voted' : 'Pending';
        actions.appendChild(voteBadge);
      }

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = `btn-status-toggle ${p.alive ? 'alive' : 'dead'}`;
      toggleBtn.textContent = p.alive ? 'ALIVE' : 'DEAD';
      toggleBtn.title = 'Click to toggle Alive / Dead';
      toggleBtn.addEventListener('click', () => {
        socket.emit('judge:toggle_alive', { playerId: p.id });
      });

      actions.appendChild(toggleBtn);
      row.appendChild(info);
      row.appendChild(actions);
      judgeRosterList.appendChild(row);
    });
  }

  /* ==========================================================================
     4. Player Actions, 3D Card Flip & Secret Nominations
     ========================================================================== */
  formJoinPlayer.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomCode = inputRoomCode.value.trim().toUpperCase();
    const name = inputPlayerName.value.trim();
    if (!roomCode || !name) return;

    socket.emit('player:join_room', { roomCode, name }, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Unable to join room.');
      }
      appState.mode = 'player';
      appState.roomCode = res.roomCode;
      appState.playerId = res.playerId;
      appState.playerName = res.name;
      appState.myRole = res.role || null;
      appState.myVote = res.myVote || null;
      appState.room = res.state;
      saveSession();
      switchView('player');
      renderPlayerRoleCard();
      renderRoomState();
      showToast(`Joined Room ${res.roomCode} as ${res.name}`);
    });
  });

  // Tap to flip secret role card (and keyboard Enter/Space support)
  roleFlipCard.addEventListener('click', () => {
    roleFlipCard.classList.toggle('is-flipped');
  });

  roleFlipCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      roleFlipCard.classList.toggle('is-flipped');
    }
  });

  function renderPlayerRoleCard() {
    const role = appState.myRole;
    if (!role) {
      cardFrontSub.textContent = 'Waiting for Judge (#13) to deal roles...';
      roleRankTl.textContent = '?';
      roleSuitTl.textContent = '♠';
      roleRankBr.textContent = '?';
      roleSuitBr.textContent = '♠';
      roleCardLabel.textContent = 'UNASSIGNED';
      roleTitle.textContent = 'No Role Yet';
      roleDescription.textContent = 'Wait for the Judge to deal roles. Once dealt, tap this card to privately inspect your role.';
      return;
    }

    cardFrontSub.textContent = 'Role dealt! Tap to privately reveal';
    roleRankTl.textContent = role.cardRank;
    roleSuitTl.textContent = role.suit;
    roleRankBr.textContent = role.cardRank;
    roleSuitBr.textContent = role.suit;
    roleCardLabel.textContent = `CARD: ${role.cardLabel.toUpperCase()}`;
    roleTitle.textContent = role.title;
    roleDescription.textContent = role.description;
  }

  // Prevent selecting the exact same player in both dropdowns
  function syncNomineeDropdowns() {
    const val1 = selectNominee1.value;
    const val2 = selectNominee2.value;

    Array.from(selectNominee1.options).forEach((opt) => {
      if (!opt.value) return;
      opt.disabled = opt.value === val2;
    });

    Array.from(selectNominee2.options).forEach((opt) => {
      if (!opt.value) return;
      opt.disabled = opt.value === val1;
    });
  }

  selectNominee1.addEventListener('change', syncNomineeDropdowns);
  selectNominee2.addEventListener('change', syncNomineeDropdowns);

  formSubmitVote.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom1 = selectNominee1.value;
    const nom2 = selectNominee2.value;

    if (!nom1 || !nom2 || nom1 === nom2) {
      return showToast('Please select 2 different living players.');
    }

    socket.emit('player:submit_vote', { nominees: [nom1, nom2] }, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Could not submit vote.');
      }
      appState.myVote = res.myVote;
      renderRoomState();
      showToast('Secret nomination submitted!');
    });
  });

  function populateNomineeOptions(livingPlayers, preserveValues) {
    const prev1 = preserveValues ? selectNominee1.value : '';
    const prev2 = preserveValues ? selectNominee2.value : '';

    selectNominee1.innerHTML = '<option value="">Select 1st living player...</option>';
    selectNominee2.innerHTML = '<option value="">Select 2nd living player...</option>';

    livingPlayers.forEach((p) => {
      const opt1 = document.createElement('option');
      opt1.value = p.id;
      opt1.textContent = `#${p.seatNumber} ${p.name}`;
      selectNominee1.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = p.id;
      opt2.textContent = `#${p.seatNumber} ${p.name}`;
      selectNominee2.appendChild(opt2);
    });

    if (prev1 && livingPlayers.some((p) => p.id === prev1)) {
      selectNominee1.value = prev1;
    }
    if (prev2 && livingPlayers.some((p) => p.id === prev2)) {
      selectNominee2.value = prev2;
    }

    if (appState.myVote && appState.myVote.length === 2) {
      selectNominee1.value = appState.myVote[0];
      selectNominee2.value = appState.myVote[1];
    }

    syncNomineeDropdowns();
  }

  function renderPlayerView(room) {
    const me = room.players.find((p) => p.id === appState.playerId);
    if (!me) return;

    playerDisplayName.textContent = `#${me.seatNumber} ${me.name}`;
    if (me.alive) {
      playerStatusBadge.textContent = 'ALIVE';
      playerStatusBadge.className = 'status-badge status-alive';
    } else {
      playerStatusBadge.textContent = 'DEAD';
      playerStatusBadge.className = 'status-badge status-dead';
    }

    // Secret Nomination Section visibility & state
    if (room.phase === 'voting') {
      playerVotingSection.classList.remove('hidden');
      playerVoteProgress.textContent = `${room.votingProgress.submitted}/${room.votingProgress.totalLiving} voted`;

      const livingPlayers = room.players.filter((p) => p.alive);
      populateNomineeOptions(livingPlayers, true);

      const hasVoted = me.hasVoted || Boolean(appState.myVote && appState.myVote.length === 2);

      if (!me.alive) {
        votingInstructions.textContent = 'You have been eliminated. Dead players cannot vote in nominations.';
        selectNominee1.disabled = true;
        selectNominee2.disabled = true;
        btnSubmitVote.disabled = true;
        btnSubmitVote.textContent = 'Eliminated (Cannot Vote)';
        voteSubmittedNotice.classList.add('hidden');
      } else if (hasVoted) {
        votingInstructions.innerHTML = 'Privately select <strong>2 different living players</strong> to nominate for trial.';
        selectNominee1.disabled = true;
        selectNominee2.disabled = true;
        btnSubmitVote.disabled = true;
        btnSubmitVote.textContent = 'Vote Submitted';
        voteSubmittedNotice.classList.remove('hidden');
      } else {
        votingInstructions.innerHTML = 'Privately select <strong>2 different living players</strong> to nominate for trial.';
        selectNominee1.disabled = false;
        selectNominee2.disabled = false;
        btnSubmitVote.disabled = false;
        btnSubmitVote.textContent = 'Submit Vote';
        voteSubmittedNotice.classList.add('hidden');
      }
    } else {
      playerVotingSection.classList.add('hidden');
    }

    // Table Roster Chips
    const aliveCount = room.players.filter((p) => p.alive).length;
    playerTableCount.textContent = `${aliveCount}/${room.players.length} Alive`;
    playerRosterChips.innerHTML = '';

    room.players.forEach((p) => {
      const chip = document.createElement('span');
      chip.className = `player-chip ${p.alive ? '' : 'dead'}`;
      chip.textContent = `#${p.seatNumber} ${p.name}`;
      playerRosterChips.appendChild(chip);
    });
  }

  /* ==========================================================================
     5. Shared Room State & Trial Results Banner
     ========================================================================== */
  function renderTrialBanner(room) {
    if (room && room.nomineesResult && room.nomineesResult.text) {
      trialBanner.classList.remove('hidden');
      trialAnnouncementText.textContent = room.nomineesResult.text;

      if (Array.isArray(room.nomineesResult.breakdown) && room.nomineesResult.breakdown.length > 0) {
        const topSummary = room.nomineesResult.breakdown
          .slice(0, 5)
          .map((item) => `${item.name} (${item.votes})`)
          .join(' · ');
        trialBreakdown.textContent = `Tally: ${topSummary}`;
      } else {
        trialBreakdown.textContent = 'No votes were cast.';
      }
    } else {
      trialBanner.classList.add('hidden');
    }
  }

  function renderRoomState() {
    const room = appState.room;
    if (!room) return;

    renderTrialBanner(room);

    if (appState.mode === 'judge') {
      renderJudgeView(room);
    } else if (appState.mode === 'player') {
      renderPlayerView(room);
    }
  }

  /* ==========================================================================
     6. Socket.io Event Listeners & Session Auto-Reconnect
     ========================================================================== */
  socket.on('room:state', (publicState) => {
    appState.room = publicState;
    if (publicState.phase !== 'voting') {
      appState.myVote = null;
    }
    renderRoomState();
  });

  socket.on('player:role_assigned', (role) => {
    appState.myRole = role;
    // Automatically hide the card first so role isn't accidentally flashed if open
    roleFlipCard.classList.remove('is-flipped');
    renderPlayerRoleCard();
    showToast('New secret role dealt! Tap your card to reveal.');
  });

  socket.on('voting:started', () => {
    appState.myVote = null;
    selectNominee1.value = '';
    selectNominee2.value = '';
    renderRoomState();
    if (appState.mode === 'player') {
      showToast('Secret Trial Nominations have started!');
    }
  });

  socket.on('voting:results', (result) => {
    if (result && result.text) {
      showToast(result.text);
    }
  });

  socket.on('round:reset', () => {
    appState.myVote = null;
    selectNominee1.value = '';
    selectNominee2.value = '';
    renderRoomState();
  });

  socket.on('connect', () => {
    const raw = sessionStorage.getItem('mafia_session');
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      if (saved.mode === 'judge' && saved.roomCode && saved.judgeToken) {
        socket.emit(
          'judge:create_room',
          { roomCode: saved.roomCode, judgeToken: saved.judgeToken },
          (res) => {
            if (res && res.ok) {
              appState.mode = 'judge';
              appState.roomCode = res.roomCode;
              appState.judgeToken = res.judgeToken;
              appState.room = res.state;
              switchView('judge');
              renderRoomState();
            } else {
              clearSession();
            }
          }
        );
      } else if (saved.mode === 'player' && saved.roomCode && saved.playerId) {
        socket.emit(
          'player:join_room',
          { roomCode: saved.roomCode, playerId: saved.playerId, name: saved.playerName },
          (res) => {
            if (res && res.ok) {
              appState.mode = 'player';
              appState.roomCode = res.roomCode;
              appState.playerId = res.playerId;
              appState.playerName = res.name;
              appState.myRole = res.role || appState.myRole;
              appState.myVote = res.myVote || null;
              appState.room = res.state;
              switchView('player');
              renderPlayerRoleCard();
              renderRoomState();
            } else {
              clearSession();
            }
          }
        );
      }
    } catch (_) {
      clearSession();
    }
  });
})();

