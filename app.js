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

// Funções de Gerenciamento de Páginas e Navegação
function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);

    if (targetPage) {
        targetPage.classList.add('active');
        updateNavLinkState(pageId);
        mainNavMenu.classList.remove('active'); // Fecha o menu hambúrguer
        updateGamification(pageId); // Atualiza gamificação ao visitar página
        window.scrollTo(0, 0); // Rola para o topo da página
    }
}

function updateNavLinkState(activePageId) {
    navLinks.forEach(link => {
        link.classList.remove('active');

        if (link.getAttribute('href') === '#' + activePageId) {
            link.classList.add('active');
        }
    });
}
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
    const pageName = pageId.replace('-', '-'); // Ex: 'home-page' -> 'home-visit'
    let badgeKey = '';

    if (pageId === 'home') badgeKey = 'home-visit';
    else if (pageId === 'dopaminergic-system') badgeKey = 'dopamine-explorer';
    else if (pageId === 'psychological-mechanisms') badgeKey = 'mechanisms-master';
    else if (pageId === 'stimulation-tools') badgeKey = 'tools-expert';
    else if (pageId === 'gamification') badgeKey = 'gamification-guru';
    else if (pageId === 'awareness') badgeKey = 'awareness-advocate';
    // 'quiz-master' badge is awarded after quiz completion

    if (!userProgress.visitedPages[pageId]) {
        userProgress.visitedPages[pageId] = true;
        const pointsEarned = 25; // Pontos por visitar uma nova página
        userProgress.points += pointsEarned;
        console.log(`Ganhou ${pointsEarned} pontos por visitar ${pageId}! Total: ${userProgress.points}`);

        if (badgeKey && BADGES_DEFINITIONS[badgeKey] && !userProgress.badges.includes(badgeKey)) {
            userProgress.badges.push(badgeKey);
            userProgress.points += BADGES_DEFINITIONS[badgeKey].points; // Pontos extras pelo badge
            alert(`Parabéns! Você desbloqueou o badge "${BADGES_DEFINITIONS[badgeKey].name}" e ganhou ${BADGES_DEFINITIONS[badgeKey].points} pontos!`);
        }
    
        saveProgress();
        renderGamificationStatus();
    }
}

function renderGamificationStatus() {
    document.getElementById('user-points').textContent = userProgress.points;

    // Atualiza barra de progresso (ex: baseada nos badges desbloqueados)
    const totalBadges = Object.keys(BADGES_DEFINITIONS).length;
    const unlockedBadgesCount = userProgress.badges.length;
    
    let progressPercentage = (unlockedBadgesCount / totalBadges) * 100;
    progressPercentage = Math.min(progressPercentage, 100); // Garante que não excede 100%

    const progressBar = document.getElementById('knowledge-progress');
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `${Math.round(progressPercentage)}%`;

    // Renderiza badges
    const badgesContainer = document.getElementById('user-badges');
    badgesContainer.innerHTML = ''; // Limpa antes de renderizar

    for (const key in BADGES_DEFINITIONS) {
        const badgeElement = document.createElement('span');
        badgeElement.classList.add('badge');
        badgeElement.textContent = BADGES_DEFINITIONS[key].name;

        if (userProgress.badges.includes(key)) {
            badgeElement.classList.add('unlocked');
        }
        badgesContainer.appendChild(badgeElement);
    }
    renderRanking();
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