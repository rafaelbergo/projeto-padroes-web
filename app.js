// Variáveis Globais e Funções de Utilidade
const pages = document.querySelectorAll('.page-content');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger-menu');
const mainNavMenu = document.getElementById('main-nav-menu');

let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {
    points: 0,
    visitedPages: {},
    badges: [],
    quizCompleted: false,
    quizScore: 0
};

const QUIZ_ANSWERS = {
    q1: 'c',
    q2: 'c',
    q3: 'b'
};

const BADGES_DEFINITIONS = {
    'home-visit': { name: 'Visitante (Home)', points: 50 },
    'dopamine-explorer': { name: 'Explorador Dopamina', points: 100 },
    'mechanisms-master': { name: 'Mestre dos Mecanismos', points: 150 },
    'tools-expert': { name: 'Especialista em Ferramentas', points: 150 },
    'gamification-guru': { name: 'Guru da Gamificação', points: 100 },
    'awareness-advocate': { name: 'Defensor da Conscientização', points: 200 },
    'quiz-master': { name: 'Mestre do Quiz', points: 250 }
};

const RANKING_SIZE = 5; // Número de usuários no ranking simulado

function detectPageId() {
  const meta = document.querySelector('meta[name="page-id"]')?.content?.trim();
  if (meta) return meta;

  const sectionId = document.querySelector('.page-content')?.id?.trim();
  if (sectionId) return sectionId;

  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const name = file.replace(/\.html?$/, '');
  return name === 'index' ? 'home' : name;
}

function setProgress(id, pctNumber) {
  const bar = document.getElementById(id);
  if (bar) {
    const pct = Math.max(0, Math.min(100, Math.round(pctNumber)));
    bar.style.width = pct + '%';
    bar.textContent = pct + '%';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger-menu');
  const mainNavMenu = document.getElementById('main-nav-menu');
  hamburger?.addEventListener('click', () => mainNavMenu?.classList.toggle('active'));

  // Detecta a página atual para pontuar no ranking
  const currentPageId = detectPageId();
  updateGamification(currentPageId);
});

// Funções de Gamificação (Pontos, Badges, Ranking)
function saveProgress() {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}

function loadProgress() {
    const storedProgress = localStorage.getItem('userProgress');
    if (storedProgress) {
        userProgress = JSON.parse(storedProgress);
    }
}

function updateGamification(pageId) {
    console.log('updateGamification chamado', { pageId, visitedPages: userProgress.visitedPages });

    let badgeKey = '';
    if (pageId === 'home') badgeKey = 'home-visit';
    else if (pageId === 'dopaminergic-system') badgeKey = 'dopamine-explorer';
    else if (pageId === 'psychological-mechanisms') badgeKey = 'mechanisms-master';
    else if (pageId === 'stimulation-tools') badgeKey = 'tools-expert';
    else if (pageId === 'gamification') badgeKey = 'gamification-guru';
    else if (pageId === 'awareness') badgeKey = 'awareness-advocate';

    // Usa apenas localStorage: verifica se já visitou (persistente)
    if (!userProgress.visitedPages[pageId]) {
        console.log('Salvando visita de página (localStorage):', pageId); // log quando salva a visita
        userProgress.visitedPages[pageId] = true;

        const pointsEarned = 25; // Pontos por visitar uma nova página (persistente)
        userProgress.points += pointsEarned;
        console.log(`Ganhou ${pointsEarned} pontos por visitar ${pageId}! Total agora: ${userProgress.points}`);

        // Concede badge (apenas se ainda não possuir)
        if (badgeKey && BADGES_DEFINITIONS[badgeKey] && !userProgress.badges.includes(badgeKey)) {
            userProgress.badges.push(badgeKey);
            userProgress.points += BADGES_DEFINITIONS[badgeKey].points; // Pontos extras pelo badge
            console.log('Badge concedido', badgeKey, BADGES_DEFINITIONS[badgeKey]);
            alert(`Parabéns! Você desbloqueou o badge "${BADGES_DEFINITIONS[badgeKey].name}" e ganhou ${BADGES_DEFINITIONS[badgeKey].points} pontos!`);
        }

        saveProgress(); // salva pontos e badges no localStorage
        renderGamificationStatus();
    } else {
        console.log('Página já visitada (localStorage), não concede pontos:', pageId);
        renderGamificationStatus();
    }

    if (pageId === 'ranking') {
        console.log('updateGamification detectou pageId === ranking');
        renderRanking();
        const rankingUserPoints = document.getElementById('ranking-user-points');
        if (rankingUserPoints) {
            rankingUserPoints.textContent = `${userProgress.points} Pontos`;
            console.log('ranking-user-points atualizado', userProgress.points);
        } else {
            console.warn('Elemento #ranking-user-points não encontrado');
        }
    }
}

function renderGamificationStatus() {
    // pontos
    const pointsEl = document.getElementById('user-points');
    if (pointsEl) pointsEl.textContent = userProgress.points;

    // progresso por badges (se existir)
    const totalBadges = Object.keys(BADGES_DEFINITIONS).length;
    const unlockedBadgesCount = userProgress.badges.length;
    const progressPercentage = (unlockedBadgesCount / totalBadges) * 100;

    setProgress('knowledge-progress', progressPercentage);

    // badges (se existir)
    const badgesContainer = document.getElementById('user-badges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        for (const key in BADGES_DEFINITIONS) {
            const badgeElement = document.createElement('span');
            badgeElement.classList.add('badge');
            badgeElement.textContent = BADGES_DEFINITIONS[key].name;
            if (userProgress.badges.includes(key)) {
                badgeElement.classList.add('unlocked');
            }
            badgesContainer.appendChild(badgeElement);
        }
    }

    // ranking (se existir)
    const rankingList = document.getElementById('ranking-list');
    if (rankingList) renderRanking();
}

function generateRandomRanking() {
    let ranking = [];
    const existingRankings = JSON.parse(localStorage.getItem('globalRanking')) || [];

    // Adiciona o usuário atual ao ranking (se ainda não estiver lá ou para atualizar pontos)
    let currentUserInRanking = existingRankings.find(u => u.id === 'current-user');
    if (currentUserInRanking) {
        currentUserInRanking.points = userProgress.points;
    } else {
        currentUserInRanking = { id: 'current-user', name: 'Você', points: userProgress.points };
        existingRankings.push(currentUserInRanking);
    }

    // Garante que temos pelo menos RANKING_SIZE + 1 usuários (incluindo o atual)
    // Cria usuários simulados se não houver o suficiente
    while (existingRankings.length < RANKING_SIZE) {
        const randomName = `Explorador ${Math.floor(Math.random() * 1000)}`;
        const randomPoints = Math.floor(Math.random() * 1000) + 100; // Pontos aleatórios
        existingRankings.push({ id: `sim-${Math.random()}`, name: randomName, points: randomPoints });
    }

    // Remove o usuário atual do ranking temporariamente para gerar outros e depois adicioná-lo de volta
    ranking = existingRankings.filter(u => u.id !== 'current-user');

    // Garante que o ranking simulado não tem pontos acima do usuário atual de forma absurda
    // Se o usuário atual tem poucos pontos, os simulados serão menores ou próximos
    if (userProgress.points < 300) { // Se o usuário tem poucos pontos
        ranking = ranking.map(user => {
            if (user.id !== 'current-user') {
                user.points = Math.floor(Math.random() * (userProgress.points + 100)); // Simula pontos próximos
            }

            return user;
        });
    }

    // Adiciona usuários simulados para preencher o ranking se necessário
    for (let i = ranking.length; i < RANKING_SIZE; i++) {
        const randomName = `Explorador ${Math.floor(Math.random() * 1000)}`;

        // Garante que os pontos simulados são realistas em relação ao usuário
        const randomPoints = Math.max(50, userProgress.points + (Math.random() * 200 - 100)); // +/- 100 do usuário
        ranking.push({ id: `sim-${i}`, name: randomName, points: Math.round(randomPoints) });
    }

    // Adiciona o usuário atual de volta
    ranking.push(currentUserInRanking);

    // Ordena o ranking
    ranking.sort((a, b) => b.points - a.points);

    // Limita ao tamanho do ranking definido
    ranking = ranking.slice(0, RANKING_SIZE);

    localStorage.setItem('globalRanking', JSON.stringify(ranking));
    return ranking;
}

function renderRanking() {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';

    const globalRanking = generateRandomRanking();
    globalRanking.forEach((user, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${index + 1}. ${user.name}</span>
            <span>${user.points} Pontos</span>
        `;

        rankingList.appendChild(listItem);
    });
}

// Funções de Interatividade (Dopamina, Simulador, Ferramentas, Quiz)
// Animação de Dopamina
function triggerDopamineAnimation() {
    const animationContainer = document.getElementById('dopamine-animation');
    const numMolecules = 10;

    for (let i = 0; i < numMolecules; i++) {
        const molecule = document.createElement('div');
        molecule.classList.add('dopamine-molecule');

        // Posição inicial aleatória dentro do container
        molecule.style.left = `${Math.random() * 100}%`;
        molecule.style.bottom = '0';

        // Atraso para criar um efeito cascata
        molecule.style.animationDelay = `${i * 0.1}s`;
        animationContainer.appendChild(molecule);

        // Remove a molécula após a animação para não acumular no DOM
        molecule.addEventListener('animationend', () => {
            molecule.remove();
        });
    }
}

// Simulador de Mecanismos Psicológicos
function setupPsychologicalSimulator() {
    const options = document.querySelectorAll('#simulator-options .simulator-option');
    const output = document.getElementById('simulator-output');

    options.forEach(option => {
        option.addEventListener('click', function() {
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            const mechanism = this.dataset.mechanism;
            let message = '';

            switch (mechanism) {
                case 'fomo':
                    message = "<strong>FOMO em ação:</strong> A notificação aciona o medo de perder uma interação social. Você sente a necessidade de verificar, temendo ficar de fora do que seus amigos estão fazendo. Isso leva à abertura do aplicativo.";
                    break;
                case 'variable-rewards':
                    message = "<strong>Recompensas Variáveis em ação:</strong> Você continua rolando, na expectativa de encontrar algo interessante. A imprevisibilidade de quando (e se) um conteúdo atraente aparecerá mantém você preso ao ciclo de busca, tornando difícil parar.";
                    break;
                case 'social-proof':
                    message = "<strong>Prova Social em ação:</strong> O alto número de visualizações sugere que o artigo é valioso ou importante. Você é influenciado a lê-lo, presumindo que, se tantas pessoas gostaram, você também deveria, validando o conteúdo e a plataforma.";
                    break;
                default:
                    message = "Mecanismo não reconhecido.";
            }
            output.innerHTML = message;
        });
    });
}

// Demonstração de Ferramentas de Estimulação
function showNotificationDemo() {
    const notification = document.getElementById('notification-demo');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000); // Notificação some após 3 segundos
}

let infiniteScrollItemCount = 5;

function setupInfiniteScrollDemo() {
    const scrollArea = document.getElementById('infinite-scroll-demo');
    scrollArea.addEventListener('scroll', () => {

        if (scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 10) {
            // Quase no fim da rolagem, carrega mais itens
            loadMoreInfiniteScrollItems();
        }
    });
}

function loadMoreInfiniteScrollItems() {
    const scrollArea = document.getElementById('infinite-scroll-demo');
    // Impede carregamento excessivo
}