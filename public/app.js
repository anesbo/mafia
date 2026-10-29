/* ==========================================================================
   Mafia Moderator & Secret Voting — Frontend Client (EN / FR / AR)
   ========================================================================== */
(function () {
  const socket = io();

  /* ==========================================================================
     0. Internationalization (English, French, Arabic)
     ========================================================================== */
  const I18N = {
    en: {
      brandTitle: 'MAFIA',
      leaveBtn: 'Leave',
      trialBadge: 'TRIAL NOMINATION RESULT',
      heroTitle: 'Mafia Digital Assistant',
      heroSubtitle: 'Minimalist secret role dealing & trial nomination tallying for in-person games (5–25 players).',
      playerBadge: 'PLAYER (#1–#12+)',
      joinTableHeading: 'Join a Table',
      roomCodeLabel: 'Room Code',
      roomCodePlaceholder: 'e.g. K7X2',
      nicknameLabel: 'Your Nickname',
      nicknamePlaceholder: 'Enter your name',
      joinGameBtn: 'Join Game',
      moderatorBadge: 'MODERATOR (#13)',
      judgeConsoleHeading: 'Judge Console',
      judgeConsoleDesc: 'Host a new game room to deal secret roles, manage player status, and trigger secret trial nominations.',
      customCodeLabel: 'Custom 4-Char Code',
      optionalLabel: '(optional)',
      customCodePlaceholder: 'Auto-generate',
      createRoomBtn: 'Create Room as Judge (#13)',
      roomCodeMeta: 'ROOM CODE',
      copyBtn: 'Copy',
      liveVoteTallyMeta: 'LIVE VOTE TALLY',
      roundControlsHeading: 'Round & Voting Controls',
      roundControlsDesc: 'Trigger secret 2-person nominations for all living players or force tally early.',
      startNominationsBtn: 'Start Secret Nominations',
      forceTallyBtn: 'Force Tally Nominations',
      resetRoundBtn: 'Reset Round',
      newGameBtn: 'New Game (Keep Players)',
      endGameBtn: 'End Game',
      roleSetupHeading: 'Role Setup & Dealing',
      roleSetupDesc: 'Remaining connected players automatically become Townspeople.',
      roleInputMafia: 'Mafia (Jack)',
      roleInputAngel: 'Angel (Ace)',
      roleInputSheriff: 'Sheriff (King)',
      townspeopleAutoLabel: 'Townspeople (auto):',
      totalPlayersLabel: 'Total Players:',
      dealRolesBtn: 'Deal Roles',
      playerRosterHeading: 'Player Roster',
      playerMeta: 'PLAYER',
      secretIdentityMeta: 'SECRET IDENTITY CARD',
      tapToFlipHint: 'Tap card to reveal / hide',
      secretRoleFrontTitle: 'SECRET ROLE',
      secretNominationsHeading: 'Secret Trial Nominations',
      firstNomineeLabel: 'First Nominee',
      secondNomineeLabel: 'Second Nominee',
      voteSubmittedNotice: '✓ Your secret nomination has been locked in. Waiting for remaining players...',
      tablePlayersHeading: 'Table Players',

      // Dynamic strings
      roomPillJudge: (code) => `ROOM ${code} · #13`,
      roomPillPlayer: (code) => `ROOM ${code}`,
      votedCounter: (sub, tot) => `${sub}/${tot} voted`,
      phase_lobby: 'LOBBY',
      phase_voting: 'VOTING',
      phase_results: 'RESULTS',
      rolesDealtYes: 'Roles Dealt ✓',
      rolesDealtNo: 'Not Dealt',
      rosterSummary: (conn, tot, alive) => `${conn}/${tot} Online · ${alive} Alive`,
      tableAliveSummary: (alive, tot) => `${alive}/${tot} Alive`,
      waitingForPlayers: (code) => `Waiting for players to join with code <strong>${code}</strong>...`,
      connected: 'Connected',
      disconnected: 'Disconnected',
      votedTag: 'Voted',
      pendingTag: 'Pending',
      aliveStatus: 'ALIVE',
      deadStatus: 'DEAD',
      toggleAliveTitle: 'Click to toggle Alive / Dead',

      waitingJudgeDeal: 'Waiting for Judge (#13) to deal roles...',
      roleDealtTapReveal: 'Role dealt! Tap to privately reveal',
      unassignedLabel: 'UNASSIGNED',
      noRoleYetTitle: 'No Role Yet',
      noRoleYetDesc: 'Wait for the Judge to deal roles. Once dealt, tap this card to privately inspect your role.',
      cardPrefix: (label) => `CARD: ${label.toUpperCase()}`,

      select1stPlaceholder: 'Select 1st living player...',
      select2ndPlaceholder: 'Select 2nd living player...',
      votingInstrDefault: 'Privately select <strong>2 different living players</strong> to nominate for trial.',
      votingInstrDead: 'You have been eliminated. Dead players cannot vote in nominations.',
      btnEliminated: 'Eliminated (Cannot Vote)',
      btnVoteSubmitted: 'Vote Submitted',
      btnSubmitVote: 'Submit Vote',

      onTrialTwo: (p1, p2) => `On Trial: ${p1} and ${p2}`,
      onTrialOne: (p1) => `On Trial: ${p1}`,
      onTrialNone: 'On Trial: None',
      tallyPrefix: (summary) => `Tally: ${summary}`,
      noVotesCast: 'No votes were cast.',

      toastRoomReady: (code) => `Room ${code} ready!`,
      toastCopiedCode: (code) => `Copied code ${code}`,
      toastRolesDealt: 'Roles dealt privately to all players!',
      toastNominationsStarted: 'Secret nomination voting started!',
      toastNominationsTallied: 'Nominations tallied!',
      toastRoundReset: 'Round votes & results cleared.',
      toastJoinedAs: (code, name) => `Joined Room ${code} as ${name}`,
      toastSelect2Diff: 'Please select 2 different living players.',
      toastVoteSubmitted: 'Secret nomination submitted!',
      toastNewRoleDealt: 'New secret role dealt! Tap your card to reveal.',
      toastNewGameStarted: 'New game ready! All players revived & roles cleared.',
      toastGameEnded: 'The Judge (#13) has ended the game.',
      confirmEndGame: 'Are you sure you want to end the game and close this room for all players?',

      roles: {
        Mafia: {
          title: 'Mafia',
          cardLabel: 'Jack',
          description: 'Eliminate Townspeople each night and blend in during daytime discussions.'
        },
        Angel: {
          title: 'Angel',
          cardLabel: 'Ace',
          description: 'Choose one player each night to protect from elimination by the Mafia.'
        },
        Sheriff: {
          title: 'Sheriff',
          cardLabel: 'King',
          description: 'Investigate one player each night to learn whether they belong to the Mafia.'
        },
        Townsperson: {
          title: 'Townsperson',
          cardLabel: 'Plain',
          description: 'Observe, deduce, and vote during the day to find and put the Mafia on trial.'
        }
      }
    },

    fr: {
      brandTitle: 'MAFIA',
      leaveBtn: 'Quitter',
      trialBadge: 'RÉSULTAT DES NOMINATIONS',
      heroTitle: 'Assistant Numérique Mafia',
      heroSubtitle: 'Distribution secrète des rôles et décompte des votes de nomination pour parties en présentiel (5–25 joueurs).',
      playerBadge: 'JOUEUR (#1–#12+)',
      joinTableHeading: 'Rejoindre une Table',
      roomCodeLabel: 'Code de la Salle',
      roomCodePlaceholder: 'ex. K7X2',
      nicknameLabel: 'Votre Pseudo',
      nicknamePlaceholder: 'Entrez votre nom',
      joinGameBtn: 'Rejoindre la Partie',
      moderatorBadge: 'MODÉRATEUR (#13)',
      judgeConsoleHeading: 'Console du Juge',
      judgeConsoleDesc: 'Créez une salle pour distribuer les rôles secrets, gérer le statut des joueurs et lancer les votes.',
      customCodeLabel: 'Code à 4 caractères',
      optionalLabel: '(optionnel)',
      customCodePlaceholder: 'Auto-générer',
      createRoomBtn: 'Créer une Salle comme Juge (#13)',
      roomCodeMeta: 'CODE SALLE',
      copyBtn: 'Copier',
      liveVoteTallyMeta: 'VOTES EN DIRECT',
      roundControlsHeading: 'Contrôles de Manche & Vote',
      roundControlsDesc: 'Lancez les nominations secrètes (2 choix) pour les joueurs en vie ou forcez le décompte.',
      startNominationsBtn: 'Lancer les Nominations Secrètes',
      forceTallyBtn: 'Forcer le Décompte',
      resetRoundBtn: 'Réinitialiser la Manche',
      newGameBtn: 'Nouvelle Partie (Garder Joueurs)',
      endGameBtn: 'Terminer la Partie',
      roleSetupHeading: 'Configuration & Distribution des Rôles',
      roleSetupDesc: 'Les autres joueurs connectés deviennent automatiquement des Villageois.',
      roleInputMafia: 'Mafia (Valet)',
      roleInputAngel: 'Ange (As)',
      roleInputSheriff: 'Shérif (Roi)',
      townspeopleAutoLabel: 'Villageois (auto) :',
      totalPlayersLabel: 'Total Joueurs :',
      dealRolesBtn: 'Distribuer les Rôles',
      playerRosterHeading: 'Liste des Joueurs',
      playerMeta: 'JOUEUR',
      secretIdentityMeta: 'CARTE D’IDENTITÉ SECRÈTE',
      tapToFlipHint: 'Touchez la carte pour révéler / masquer',
      secretRoleFrontTitle: 'RÔLE SECRET',
      secretNominationsHeading: 'Nominations Secrètes au Procès',
      firstNomineeLabel: 'Premier Nominé',
      secondNomineeLabel: 'Deuxième Nominé',
      voteSubmittedNotice: '✓ Votre nomination secrète est enregistrée. En attente des autres joueurs...',
      tablePlayersHeading: 'Joueurs à la Table',

      roomPillJudge: (code) => `SALLE ${code} · #13`,
      roomPillPlayer: (code) => `SALLE ${code}`,
      votedCounter: (sub, tot) => `${sub}/${tot} ont voté`,
      phase_lobby: 'SALON',
      phase_voting: 'VOTE',
      phase_results: 'RÉSULTATS',
      rolesDealtYes: 'Rôles Distribués ✓',
      rolesDealtNo: 'Non Distribués',
      rosterSummary: (conn, tot, alive) => `${conn}/${tot} En ligne · ${alive} En vie`,
      tableAliveSummary: (alive, tot) => `${alive}/${tot} En vie`,
      waitingForPlayers: (code) => `En attente de joueurs avec le code <strong>${code}</strong>...`,
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      votedTag: 'A voté',
      pendingTag: 'En attente',
      aliveStatus: 'EN VIE',
      deadStatus: 'MORT',
      toggleAliveTitle: 'Cliquer pour basculer En vie / Mort',

      waitingJudgeDeal: 'En attente de la distribution par le Juge (#13)...',
      roleDealtTapReveal: 'Rôle attribué ! Touchez pour révéler en privé',
      unassignedLabel: 'NON ATTRIBUÉ',
      noRoleYetTitle: 'Aucun Rôle',
      noRoleYetDesc: 'Attendez que le Juge distribue les rôles. Touchez ensuite cette carte pour découvrir votre rôle.',
      cardPrefix: (label) => `CARTE : ${label.toUpperCase()}`,

      select1stPlaceholder: 'Choisir le 1er joueur en vie...',
      select2ndPlaceholder: 'Choisir le 2e joueur en vie...',
      votingInstrDefault: 'Sélectionnez en privé <strong>2 joueurs en vie différents</strong> à nominer pour le procès.',
      votingInstrDead: 'Vous avez été éliminé. Les joueurs morts ne peuvent pas voter.',
      btnEliminated: 'Éliminé (Vote impossible)',
      btnVoteSubmitted: 'Vote Envoyé',
      btnSubmitVote: 'Envoyer le Vote',

      onTrialTwo: (p1, p2) => `En Procès : ${p1} et ${p2}`,
      onTrialOne: (p1) => `En Procès : ${p1}`,
      onTrialNone: 'En Procès : Aucun',
      tallyPrefix: (summary) => `Décompte : ${summary}`,
      noVotesCast: 'Aucun vote enregistré.',

      toastRoomReady: (code) => `Salle ${code} prête !`,
      toastCopiedCode: (code) => `Code ${code} copié`,
      toastRolesDealt: 'Rôles distribués en privé à tous les joueurs !',
      toastNominationsStarted: 'Les nominations secrètes ont commencé !',
      toastNominationsTallied: 'Votes décomptés !',
      toastRoundReset: 'Votes et résultats de la manche réinitialisés.',
      toastJoinedAs: (code, name) => `Salle ${code} rejointe en tant que ${name}`,
      toastSelect2Diff: 'Veuillez sélectionner 2 joueurs en vie différents.',
      toastVoteSubmitted: 'Nomination secrète envoyée !',
      toastNewRoleDealt: 'Nouveau rôle secret reçu ! Touchez votre carte.',
      toastNewGameStarted: 'Nouvelle partie prête ! Joueurs réanimés et rôles effacés.',
      toastGameEnded: 'Le Juge (#13) a mis fin à la partie.',
      confirmEndGame: 'Voulez-vous vraiment terminer la partie et fermer la salle pour tous les joueurs ?',

      roles: {
        Mafia: {
          title: 'Mafia',
          cardLabel: 'Valet',
          description: 'Éliminez les Villageois chaque nuit et fondez-vous dans la masse pendant la journée.'
        },
        Angel: {
          title: 'Ange',
          cardLabel: 'As',
          description: 'Choisissez un joueur chaque nuit pour le protéger de la Mafia.'
        },
        Sheriff: {
          title: 'Shérif',
          cardLabel: 'Roi',
          description: 'Enquêtez sur un joueur chaque nuit pour savoir s’il appartient à la Mafia.'
        },
        Townsperson: {
          title: 'Villageois',
          cardLabel: 'Simple',
          description: 'Observez, déduisez et votez le jour pour démasquer et juger la Mafia.'
        }
      }
    },

    ar: {
      brandTitle: 'مافيا',
      leaveBtn: 'مغادرة',
      trialBadge: 'نتيجة ترشيحات المحاكمة',
      heroTitle: 'المساعد الرقمي للعبة مافيا',
      heroSubtitle: 'توزيع سري للأدوار وفرز تلقائي لترشيحات المحاكمة للألعاب الواقعية (5–25 لاعباً).',
      playerBadge: 'لاعب (#1–#12+)',
      joinTableHeading: 'انضم إلى طاولة اللعب',
      roomCodeLabel: 'رمز الغرفة',
      roomCodePlaceholder: 'مثال: K7X2',
      nicknameLabel: 'الاسم المستعار',
      nicknamePlaceholder: 'أدخل اسمك',
      joinGameBtn: 'انضمام للعبة',
      moderatorBadge: 'القاضي / الحكم (#13)',
      judgeConsoleHeading: 'لوحة تحكم القاضي',
      judgeConsoleDesc: 'أنشئ غرفة جديدة لتوزيع الأدوار السرية، إدارة حالة اللاعبين، وبدء التصويت السري للمحاكمة.',
      customCodeLabel: 'رمز مخصص من 4 أحرف',
      optionalLabel: '(اختياري)',
      customCodePlaceholder: 'توليد تلقائي',
      createRoomBtn: 'إنشاء غرفة كقاضٍ (#13)',
      roomCodeMeta: 'رمز الغرفة',
      copyBtn: 'نسخ',
      liveVoteTallyMeta: 'عداد الأصوات المباشر',
      roundControlsHeading: 'التحكم بالجولة والتصويت',
      roundControlsDesc: 'ابدأ الترشيح السري (اختيار اسمين) لجميع اللاعبين الأحياء أو قم بفرز الأصوات مبكراً.',
      startNominationsBtn: 'بدء الترشيح السري',
      forceTallyBtn: 'فرز الأصوات الآن',
      resetRoundBtn: 'إعادة ضبط الجولة',
      newGameBtn: 'لعبة جديدة (نفس اللاعبين)',
      endGameBtn: 'إنهاء اللعبة',
      roleSetupHeading: 'إعداد وتوزيع الأدوار',
      roleSetupDesc: 'بقية اللاعبين المتصلين يصبحون تلقائياً من المواطنين (Townspeople).',
      roleInputMafia: 'مافيا (ولد / Jack)',
      roleInputAngel: 'ملاك (آص / Ace)',
      roleInputSheriff: 'شريف (شايب / King)',
      townspeopleAutoLabel: 'المواطنون (تلقائي):',
      totalPlayersLabel: 'إجمالي اللاعبين:',
      dealRolesBtn: 'توزيع الأدوار',
      playerRosterHeading: 'قائمة اللاعبين',
      playerMeta: 'اللاعب',
      secretIdentityMeta: 'بطاقة الهوية السرية',
      tapToFlipHint: 'اضغط على البطاقة لإظهار / إخفاء الدور',
      secretRoleFrontTitle: 'دور سري',
      secretNominationsHeading: 'ترشيحات المحاكمة السرية',
      firstNomineeLabel: 'المرشح الأول',
      secondNomineeLabel: 'المرشح الثاني',
      voteSubmittedNotice: '✓ تم تسجيل ترشيحك السري. بانتظار تصويت بقية اللاعبين...',
      tablePlayersHeading: 'لاعبو الطاولة',

      roomPillJudge: (code) => `غرفة ${code} · #13`,
      roomPillPlayer: (code) => `غرفة ${code}`,
      votedCounter: (sub, tot) => `${sub}/${tot} صوّتوا`,
      phase_lobby: 'الانتظار',
      phase_voting: 'تصويت',
      phase_results: 'النتائج',
      rolesDealtYes: 'تم توزيع الأدوار ✓',
      rolesDealtNo: 'لم يتم التوزيع',
      rosterSummary: (conn, tot, alive) => `${conn}/${tot} متصل · ${alive} حي`,
      tableAliveSummary: (alive, tot) => `${alive}/${tot} أحياء`,
      waitingForPlayers: (code) => `بانتظار انضمام اللاعبين عبر الرمز <strong>${code}</strong>...`,
      connected: 'متصل',
      disconnected: 'غير متصل',
      votedTag: 'صوّت',
      pendingTag: 'بانتظار',
      aliveStatus: 'حي',
      deadStatus: 'ميت',
      toggleAliveTitle: 'اضغط للتبديل بين حي / ميت',

      waitingJudgeDeal: 'بانتظار قيام القاضي (#13) بتوزيع الأدوار...',
      roleDealtTapReveal: 'تم توزيع الدور! اضغط لكشف دورك بسرية',
      unassignedLabel: 'غير محدد',
      noRoleYetTitle: 'لا يوجد دور بعد',
      noRoleYetDesc: 'انتظر حتى يقوم القاضي بتوزيع الأدوار، ثم اضغط على البطاقة لمعرفة دورك بسرية.',
      cardPrefix: (label) => `البطاقة: ${label}`,

      select1stPlaceholder: 'اختر اللاعب الحي الأول...',
      select2ndPlaceholder: 'اختر اللاعب الحي الثاني...',
      votingInstrDefault: 'اختر بسرية <strong>لاعبين حيين مختلفين</strong> لترشيحهما للمحاكمة.',
      votingInstrDead: 'لقد تم إقصاؤك. لا يمكن للاعبين الأموات التصويت.',
      btnEliminated: 'مُقصى (لا يمكن التصويت)',
      btnVoteSubmitted: 'تم إرسال الصوت',
      btnSubmitVote: 'إرسال التصويت',

      onTrialTwo: (p1, p2) => `في المحاكمة: ${p1} و ${p2}`,
      onTrialOne: (p1) => `في المحاكمة: ${p1}`,
      onTrialNone: 'في المحاكمة: لا أحد',
      tallyPrefix: (summary) => `الأصوات: ${summary}`,
      noVotesCast: 'لم يتم الإدلاء بأي أصوات.',

      toastRoomReady: (code) => `الغرفة ${code} جاهزة!`,
      toastCopiedCode: (code) => `تم نسخ الرمز ${code}`,
      toastRolesDealt: 'تم توزيع الأدوار بسرية لجميع اللاعبين!',
      toastNominationsStarted: 'بدأ التصويت السري للترشيحات!',
      toastNominationsTallied: 'تم فرز الترشيحات!',
      toastRoundReset: 'تمت إعادة ضبط أصوات ونتائج الجولة.',
      toastJoinedAs: (code, name) => `انضممت للغرفة ${code} باسم ${name}`,
      toastSelect2Diff: 'يرجى اختيار لاعبين حيين مختلفين.',
      toastVoteSubmitted: 'تم إرسال ترشيحك السري!',
      toastNewRoleDealt: 'تم توزيع دور سري جديد! اضغط على بطاقتك لكشفه.',
      toastNewGameStarted: 'بدأت لعبة جديدة! تمت إعادة جميع اللاعبين ومسح الأدوار.',
      toastGameEnded: 'قام القاضي (#13) بإنهاء اللعبة.',
      confirmEndGame: 'هل أنت متأكد أنك تريد إنهاء اللعبة وإغلاق الغرفة لجميع اللاعبين؟',

      roles: {
        Mafia: {
          title: 'مافيا (Mafia)',
          cardLabel: 'ولد (Jack)',
          description: 'تخلص من المواطنين كل ليلة وتظاهر بالبراءة خلال نقاشات النهار.'
        },
        Angel: {
          title: 'ملاك (Angel)',
          cardLabel: 'آص (Ace)',
          description: 'اختر لاعباً واحداً كل ليلة لحمايته من اغتيال المافيا.'
        },
        Sheriff: {
          title: 'شريف (Sheriff)',
          cardLabel: 'شايب (King)',
          description: 'تحقق من هوية لاعب واحد كل ليلة لمعرفة ما إذا كان من المافيا.'
        },
        Townsperson: {
          title: 'مواطن (Townsperson)',
          cardLabel: 'بطاقة عادية',
          description: 'راقب، استنتج، وصوّت خلال النهار لكشف أعضاء المافيا وتقديمهم للمحاكمة.'
        }
      }
    }
  };

  // Application State
  const appState = {
    lang: 'en',
    mode: null, // 'judge' | 'player' | null
    roomCode: null,
    judgeToken: null,
    playerId: null,
    playerName: null,
    myRole: null,
    myVote: null,
    room: null
  };

  function dict() {
    return I18N[appState.lang] || I18N.en;
  }

  // DOM References
  const htmlEl = document.documentElement;
  const langSelect = document.getElementById('lang-select');
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
  const btnNewGame = document.getElementById('btn-new-game');
  const btnEndGame = document.getElementById('btn-end-game');

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
     1. Theme & Language Management (localStorage)
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

  function initLanguage() {
    const savedLang = localStorage.getItem('mafia_lang') || 'en';
    setLanguage(I18N[savedLang] ? savedLang : 'en');
  }

  function setLanguage(lang) {
    appState.lang = I18N[lang] ? lang : 'en';
    localStorage.setItem('mafia_lang', appState.lang);
    langSelect.value = appState.lang;
    htmlEl.setAttribute('lang', appState.lang);
    htmlEl.setAttribute('dir', appState.lang === 'ar' ? 'rtl' : 'ltr');

    const d = dict();
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (d[key]) {
        el.textContent = d[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (d[key]) {
        el.setAttribute('placeholder', d[key]);
      }
    });

    if (appState.mode === 'judge' && appState.roomCode) {
      navRoomPill.textContent = d.roomPillJudge(appState.roomCode);
    } else if (appState.mode === 'player' && appState.roomCode) {
      navRoomPill.textContent = d.roomPillPlayer(appState.roomCode);
    }

    renderPlayerRoleCard();
    renderRoomState();
  }

  langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  initTheme();
  initLanguage();

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
    const d = dict();
    viewLanding.classList.add('hidden');
    viewJudge.classList.add('hidden');
    viewPlayer.classList.add('hidden');

    if (viewName === 'judge') {
      viewJudge.classList.remove('hidden');
      navRoomPill.textContent = d.roomPillJudge(appState.roomCode);
      navRoomPill.classList.remove('hidden');
      btnLeaveRoom.classList.remove('hidden');
    } else if (viewName === 'player') {
      viewPlayer.classList.remove('hidden');
      navRoomPill.textContent = d.roomPillPlayer(appState.roomCode);
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
      showToast(dict().toastRoomReady(res.roomCode));
    });
  });

  btnCopyCode.addEventListener('click', () => {
    if (!appState.roomCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(appState.roomCode).then(() => {
        showToast(dict().toastCopiedCode(appState.roomCode));
      });
    } else {
      showToast(dict().toastCopiedCode(appState.roomCode));
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
      showToast(dict().toastRolesDealt);
    });
  });

  btnStartNominations.addEventListener('click', () => {
    socket.emit('judge:start_nominations', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Cannot start nominations.');
      }
      showToast(dict().toastNominationsStarted);
    });
  });

  btnForceTally.addEventListener('click', () => {
    socket.emit('judge:force_tally', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to force tally.');
      }
      showToast(dict().toastNominationsTallied);
    });
  });

  btnResetRound.addEventListener('click', () => {
    socket.emit('judge:reset_round', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to reset round.');
      }
      showToast(dict().toastRoundReset);
    });
  });

  btnNewGame.addEventListener('click', () => {
    socket.emit('judge:new_game', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to start new game.');
      }
      showToast(dict().toastNewGameStarted);
    });
  });

  btnEndGame.addEventListener('click', () => {
    if (!window.confirm(dict().confirmEndGame)) return;
    socket.emit('judge:end_game', {}, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Failed to end game.');
      }
      clearSession();
      showToast(dict().toastGameEnded);
    });
  });

  function renderJudgeView(room) {
    const d = dict();
    judgeRoomCode.textContent = room.code;
    judgeVoteCounter.textContent = d.votedCounter(room.votingProgress.submitted, room.votingProgress.totalLiving);
    judgePhaseBadge.textContent = d[`phase_${room.phase}`] || room.phase.toUpperCase();

    if (room.rolesDealt) {
      rolesDealtIndicator.textContent = d.rolesDealtYes;
      rolesDealtIndicator.classList.add('dealt');
    } else {
      rolesDealtIndicator.textContent = d.rolesDealtNo;
      rolesDealtIndicator.classList.remove('dealt');
    }

    updateTownspeoplePreview();

    const connectedCount = room.players.filter((p) => p.connected).length;
    const aliveCount = room.players.filter((p) => p.alive).length;
    judgeRosterSummary.textContent = d.rosterSummary(connectedCount, room.players.length, aliveCount);

    if (room.players.length === 0) {
      judgeRosterList.innerHTML = `<div class="empty-state">${d.waitingForPlayers(room.code)}</div>`;
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
      dot.title = p.connected ? d.connected : d.disconnected;

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
        voteBadge.textContent = p.hasVoted ? d.votedTag : d.pendingTag;
        actions.appendChild(voteBadge);
      }

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = `btn-status-toggle ${p.alive ? 'alive' : 'dead'}`;
      toggleBtn.textContent = p.alive ? d.aliveStatus : d.deadStatus;
      toggleBtn.title = d.toggleAliveTitle;
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
      showToast(dict().toastJoinedAs(res.roomCode, res.name));
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
    const d = dict();
    const role = appState.myRole;
    if (!role) {
      cardFrontSub.textContent = d.waitingJudgeDeal;
      roleRankTl.textContent = '?';
      roleSuitTl.textContent = '♠';
      roleRankBr.textContent = '?';
      roleSuitBr.textContent = '♠';
      roleCardLabel.textContent = d.unassignedLabel;
      roleTitle.textContent = d.noRoleYetTitle;
      roleDescription.textContent = d.noRoleYetDesc;
      return;
    }

    const localizedRole = (d.roles && d.roles[role.title]) || role;
    cardFrontSub.textContent = d.roleDealtTapReveal;
    roleRankTl.textContent = role.cardRank;
    roleSuitTl.textContent = role.suit;
    roleRankBr.textContent = role.cardRank;
    roleSuitBr.textContent = role.suit;
    roleCardLabel.textContent = d.cardPrefix(localizedRole.cardLabel);
    roleTitle.textContent = localizedRole.title;
    roleDescription.textContent = localizedRole.description;
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
      return showToast(dict().toastSelect2Diff);
    }

    socket.emit('player:submit_vote', { nominees: [nom1, nom2] }, (res) => {
      if (!res || !res.ok) {
        return showToast((res && res.error) || 'Could not submit vote.');
      }
      appState.myVote = res.myVote;
      renderRoomState();
      showToast(dict().toastVoteSubmitted);
    });
  });

  function populateNomineeOptions(livingPlayers, preserveValues) {
    const d = dict();
    const prev1 = preserveValues ? selectNominee1.value : '';
    const prev2 = preserveValues ? selectNominee2.value : '';

    selectNominee1.innerHTML = `<option value="">${d.select1stPlaceholder}</option>`;
    selectNominee2.innerHTML = `<option value="">${d.select2ndPlaceholder}</option>`;

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
    const d = dict();
    const me = room.players.find((p) => p.id === appState.playerId);
    if (!me) return;

    playerDisplayName.textContent = `#${me.seatNumber} ${me.name}`;
    if (me.alive) {
      playerStatusBadge.textContent = d.aliveStatus;
      playerStatusBadge.className = 'status-badge status-alive';
    } else {
      playerStatusBadge.textContent = d.deadStatus;
      playerStatusBadge.className = 'status-badge status-dead';
    }

    // Secret Nomination Section visibility & state
    if (room.phase === 'voting') {
      playerVotingSection.classList.remove('hidden');
      playerVoteProgress.textContent = d.votedCounter(room.votingProgress.submitted, room.votingProgress.totalLiving);

      const livingPlayers = room.players.filter((p) => p.alive);
      populateNomineeOptions(livingPlayers, true);

      const hasVoted = me.hasVoted || Boolean(appState.myVote && appState.myVote.length === 2);

      if (!me.alive) {
        votingInstructions.textContent = d.votingInstrDead;
        selectNominee1.disabled = true;
        selectNominee2.disabled = true;
        btnSubmitVote.disabled = true;
        btnSubmitVote.textContent = d.btnEliminated;
        voteSubmittedNotice.classList.add('hidden');
      } else if (hasVoted) {
        votingInstructions.innerHTML = d.votingInstrDefault;
        selectNominee1.disabled = true;
        selectNominee2.disabled = true;
        btnSubmitVote.disabled = true;
        btnSubmitVote.textContent = d.btnVoteSubmitted;
        voteSubmittedNotice.classList.remove('hidden');
      } else {
        votingInstructions.innerHTML = d.votingInstrDefault;
        selectNominee1.disabled = false;
        selectNominee2.disabled = false;
        btnSubmitVote.disabled = false;
        btnSubmitVote.textContent = d.btnSubmitVote;
        voteSubmittedNotice.classList.add('hidden');
      }
    } else {
      playerVotingSection.classList.add('hidden');
    }

    // Table Roster Chips
    const aliveCount = room.players.filter((p) => p.alive).length;
    playerTableCount.textContent = d.tableAliveSummary(aliveCount, room.players.length);
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
  function formatTrialAnnouncement(nomineesResult) {
    const d = dict();
    if (!nomineesResult) return '';
    const noms = nomineesResult.nominees || [];
    if (noms.length === 2) {
      return d.onTrialTwo(noms[0].name, noms[1].name);
    }
    if (noms.length === 1) {
      return d.onTrialOne(noms[0].name);
    }
    return d.onTrialNone;
  }

  function renderTrialBanner(room) {
    const d = dict();
    if (room && room.nomineesResult && room.nomineesResult.text) {
      trialBanner.classList.remove('hidden');
      trialAnnouncementText.textContent = formatTrialAnnouncement(room.nomineesResult);

      if (Array.isArray(room.nomineesResult.breakdown) && room.nomineesResult.breakdown.length > 0) {
        const topSummary = room.nomineesResult.breakdown
          .slice(0, 5)
          .map((item) => `${item.name} (${item.votes})`)
          .join(' · ');
        trialBreakdown.textContent = d.tallyPrefix(topSummary);
      } else {
        trialBreakdown.textContent = d.noVotesCast;
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
    if (role) {
      showToast(dict().toastNewRoleDealt);
    }
  });

  socket.on('voting:started', () => {
    appState.myVote = null;
    selectNominee1.value = '';
    selectNominee2.value = '';
    renderRoomState();
    if (appState.mode === 'player') {
      showToast(dict().toastNominationsStarted);
    }
  });

  socket.on('voting:results', (result) => {
    if (result) {
      showToast(formatTrialAnnouncement(result));
    }
  });

  socket.on('round:reset', () => {
    appState.myVote = null;
    selectNominee1.value = '';
    selectNominee2.value = '';
    renderRoomState();
  });

  socket.on('game:reset', () => {
    appState.myRole = null;
    appState.myVote = null;
    roleFlipCard.classList.remove('is-flipped');
    selectNominee1.value = '';
    selectNominee2.value = '';
    renderPlayerRoleCard();
    renderRoomState();
    if (appState.mode === 'player') {
      showToast(dict().toastNewGameStarted);
    }
  });

  socket.on('game:ended', () => {
    clearSession();
    showToast(dict().toastGameEnded);
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
