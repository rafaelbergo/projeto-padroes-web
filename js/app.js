// Variáveis Globais e Funções de Utilidade
const pages = document.querySelectorAll('.page-content');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger-menu');
const mainNavMenu = document.getElementById('main-nav-menu');

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

const RANKING_SIZE = 5; // Número de usuários no ranking simulado (manager usa isso)

let celebration = null;

let gamificationManager = null;

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

    gamificationManager = new GamificationManager();
    window.gamificationManager = gamificationManager; // Acessível em funções
    
    const sidebarManager = new SidebarManager(); // Assumido de sidebar.js
    
    celebration = new CelebrationAnimation('celebration-overlay');
    window.celebration = celebration; // Acessível globalmente

    celebration.setConfig({
        enableSound: window.innerWidth > 768, // Som só em desktop
        enableVibration: 'vibrate' in navigator // Vibração só se suportado
    });

    gamificationManager.init(); // Carrega, migra e reseta diário

    const currentPageId = detectPageId();
    if (gamificationManager && currentPageId) {
        gamificationManager.visitPage(currentPageId);
        updateGamification(currentPageId);
    }
    const eventTarget = gamificationManager.eventTarget;

    // Evento: Pontos ganhos
    eventTarget.addEventListener('pointsEarned', (event) => {
        const { points, type = 'page_visit' } = event.detail;
        if (celebration) {
            celebration.show('✨ Pontos Ganhos!', points, 'points');
        }
        console.log(`Celebração ativada: +${points} pontos (tipo: ${type})`);
        updateAllUI();
    });

    eventTarget.addEventListener('badgeUnlocked', (event) => {
        const { badge, points = 50 } = event.detail;
        if (celebration) {
            celebration.show(`🏅 Badge: ${badge.name}!`, points, 'badge');
        }
        updateAllUI();
    });

    eventTarget.addEventListener('milestoneReached', (event) => {
        const { milestone, points = 100 } = event.detail;
        if (celebration) {
            celebration.show(`🎆 Milestone: ${milestone.message}!`, points, 'milestone');
        }
        updateAllUI();
    });

    eventTarget.addEventListener('quizCompleted', (event) => {
        const { score, points = 75 } = event.detail;
        const type = score === 100 ? 'milestone' : 'stars';
        if (celebration) {
            celebration.show(`⭐ Quiz Finalizado! (${score}%)`, points, type);
        }
        updateAllUI();
    });

    // Infinte scroll videos
    
    const scrollArea = document.getElementById('infinite-scroll-demo');
    if (scrollArea) {
        let page = 1;
        let loading = false;
        let videoIndex = 0;
        let videos = [];

        const PEXELS_API_KEY = 'v0G6YJko3qag5Fqu3fVd3qIIf74cMXhX7UETcKlqZNye29zsJZdiQZ0y';
        const PEXELS_API_URL = 'https://api.pexels.com/videos/search?query=ai&per_page=5&page=';

        async function fetchVideos() {
            loading = true;
            const response = await fetch(PEXELS_API_URL + page, {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });
            const data = await response.json();
            videos = videos.concat(data.videos);
            page++;
            loading = false;
            appendVideos(3); // Adiciona 3 vídeos por vez
        }

        function appendVideos(count) {
            for (let i = 0; i < count; i++) {
                if (videoIndex >= videos.length) {
                    fetchVideos();
                    return;
                }
                const video = videos[videoIndex];
                const videoUrl = video.video_files.find(f => f.quality === 'sd' && f.width <= 640)?.link || video.video_files[0].link;
                const newItem = document.createElement('div');
                newItem.className = 'infinite-scroll-item';
                newItem.innerHTML = `
                    <video width="100%" height="500" controls poster="${video.image}">
                        <source src="${videoUrl}" type="video/mp4">
                        Seu navegador não suporta vídeo.
                    </video>
                    <div style="font-size:0.9em;color:#555;">${video.user.name}</div>
                `;
                scrollArea.appendChild(newItem);
                videoIndex++;
            }
        }

        // Inicializa com alguns vídeos
        fetchVideos();

        scrollArea.addEventListener('scroll', function () {
            if (loading) return;
            if (scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 20) {
                appendVideos(2);
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'complete-action-btn' && gamificationManager) {
            gamificationManager.addPoints(25, 'action_complete');
        }
        updateAllUI();
    });

      const quizSubmitBtn = document.getElementById('quiz-submit') || document.querySelector('.btn-primary');
    if (quizSubmitBtn) {
        // Adiciona listener se não tiver onclick (evita dupes)
        if (!quizSubmitBtn.hasAttribute('onclick')) {
            quizSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Previne qualquer form submit
                submitQuiz();
            });
            console.log('✅ Listener para quiz-submit adicionado (sem onclick duplicado)');
        } else {
            console.log('✅ Botão quiz usa onclick="submitQuiz()" - listener não adicionado para evitar dupes');
        }
    } else {
        console.warn('Botão de quiz (#quiz-submit ou .btn-primary) não encontrado - adicione id ou classe');
    }

    console.log('🎮 App inicializado: Gamificação + Celebrações integradas!');
    console.log('✅ gamificationManager disponível:', gamificationManager);
    console.log('✅ celebration global disponível:', celebration);
    
    updateAllUI();
    setupPsychologicalSimulator();
});



function updateAllUI() {
    if (gamificationManager) {
        renderGamificationStatus(); // Atualiza app's UI (pontos, progresso, badges)
        
        if (sidebarManager && typeof sidebarManager.updateUI === 'function') {
            sidebarManager.updateUI();
        } else if (window.sidebarManager && typeof window.sidebarManager.updateUI === 'function') {
            window.sidebarManager.updateUI();
        }
        
        console.log('✅ UI atualizada globalmente'); // Debug
    } else {
        console.warn('updateAllUI: gamificationManager não disponível');
    }
}


// Função de Gamificação Principal: Usa manager
function updateGamification(pageId) {
    if (!gamificationManager) {
        console.warn('gamificationManager não disponível - carregue primeiro');
        return;
    }

    console.log('updateGamification chamado para:', pageId);

    gamificationManager.visitPage(pageId); // Automático: +25 pontos, badge se novo, evento pointsEarned

    // Para ranking: Renderiza se for página de ranking
    if (pageId === 'ranking') {
        console.log('updateGamification detectou pageId === ranking');
        renderRanking(); // Agora usa manager.getRanking()
        const rankingUserPoints = document.getElementById('ranking-user-points');
        if (rankingUserPoints) {
            rankingUserPoints.textContent = `${gamificationManager.getPoints()} Pontos`;
            console.log('ranking-user-points atualizado');
        } else {
            console.warn('Elemento #ranking-user-points não encontrado');
        }
    }
    //celebration.show('Teste Manual!', 100, 'emojis');
    renderGamificationStatus(); // Atualiza UI com manager
}

function renderGamificationStatus() {
    if (!gamificationManager) return;

    const state = gamificationManager.getState();

    // Pontos
    const pointsEl = document.getElementById('user-points');
    if (pointsEl) pointsEl.textContent = state.points;

    // Progresso por badges
    const totalBadges = gamificationManager.getBadgeDefinitions().length;
    const unlockedBadgesCount = state.badges.length;
    const progressPercentage = (unlockedBadgesCount / totalBadges) * 100;

    setProgress('knowledge-progress', progressPercentage);

    // Badges (usa unlocked badges do manager)
    const badgesContainer = document.getElementById('user-badges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        const unlockedBadges = gamificationManager.getUnlockedBadges(); // Array com {id, name, icon}
        unlockedBadges.forEach(badge => {
            const badgeElement = document.createElement('span');
            badgeElement.classList.add('badge', 'unlocked');
            badgeElement.textContent = badge.name;
            badgeElement.title = badge.requirement; // Tooltip
            badgesContainer.appendChild(badgeElement);
        });
        
        // Mostra totais se quiser
        badgesContainer.insertAdjacentHTML('beforeend', 
            `<span>Total: ${unlockedBadgesCount}/${totalBadges}</span>`);
    }

    // Ranking (se existir) - chama renderRanking()
    const rankingList = document.getElementById('ranking-list');
    if (rankingList) renderRanking();
}

function renderRanking() {
    if (!gamificationManager) return;

    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;

    rankingList.innerHTML = '';

    const globalRanking = gamificationManager.getRanking(); // Usa manager (sincronizado)
    globalRanking.slice(0, RANKING_SIZE).forEach((user, index) => { // Limita a RANKING_SIZE
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${index + 1}. ${user.name}</span>
            <span>${user.points} Pontos</span>
        `;
        // Destaque para "Você"
        if (user.name === 'Você') {
            listItem.classList.add('current-user');
        }
        rankingList.appendChild(listItem);
    });
}

// Funções de Interatividade (Dopamina, Simulador, Ferramentas, Quiz)
// Animação de Dopamina
function triggerDopamineAnimation() {
    const animationContainer = document.getElementById('dopamine-animation');
    if (!animationContainer) return;

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

    if (gamificationManager) {
        gamificationManager.addPoints(10, 'interaction'); // Emite pointsEarned automaticamente
    }
}

// Simulador de Mecanismos Psicológicos
function setupPsychologicalSimulator() {
    console.log('Configurando Simulador de Mecanismos Psicológicos');
    const options = document.querySelectorAll('#simulator-options .simulator-option');
    const output = document.getElementById('simulator-output');

    options.forEach(option => {
        option.addEventListener('click', function () {
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

            if (gamificationManager) {
                gamificationManager.addPoints(15, 'simulator_use'); // Emite pointsEarned
            }
        });
    });
}

// Demonstração de Ferramentas de Estimulação
function showNotificationDemo() {
    const notification = document.getElementById('notification-demo');
    if (!notification) return;

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000); // Notificação some após 3 segundos

    if (gamificationManager) {
        gamificationManager.addPoints(20, 'demo_view');
    }
}


function submitQuiz(e) {
    e?.preventDefault(); // Previne submit se chamado de form/button

    console.log('Quiz submit chamado - validando respostas...');

    // Coleta respostas selecionadas (name="q1", q2, q3 do seu HTML)
    const userAnswers = {};
    let totalQuestions = 0;
    let correctAnswers = 0;

    ['q1', 'q2', 'q3'].forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        if (selected) {
            userAnswers[q] = selected.value;
            totalQuestions++;
            if (selected.value === QUIZ_ANSWERS[q]) {
                correctAnswers++;
            }
        }
    });

    console.log('Respostas do usuário:', userAnswers);
    console.log('Respostas corretas esperadas:', QUIZ_ANSWERS);

    if (totalQuestions < 3) {
        const feedbackEl = document.getElementById('quiz-feedback');
        if (feedbackEl) {
            feedbackEl.innerHTML = '<p style="color: red;">Por favor, responda todas as 3 perguntas antes de enviar!</p>';
            feedbackEl.style.display = 'block';
        } else {
            alert('Por favor, responda todas as 3 perguntas antes de enviar!');
        }
        return; // Quiz incompleto
    }

    // Calcula score percentual (arredondado para inteiro)
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    console.log(`Score calculado: ${correctAnswers}/${totalQuestions} acertos = ${score}%`);

    // ✅ Integração: Chama manager com score real (emite quizCompleted, verifica badges)
    if (gamificationManager) {
        const pointsAwarded = gamificationManager.completeQuiz(score); // Retorna points, triggera evento
        console.log(`Quiz completado - score ${score}% enviado ao manager, +${pointsAwarded} pontos`);
    }

    // ✅ Atualiza UI do quiz: Mostra resultado em #quiz-feedback (seu ID)
    const quizFeedbackEl = document.getElementById('quiz-feedback');
    if (quizFeedbackEl) {
        let feedback = '';
        let color = '';
        if (score === 100) {
            feedback = 'Perfeito! Você é um Mestre do Quiz! 🏆 Todas as respostas corretas.';
            color = 'green';
        } else if (score >= 70) {
            feedback = 'Ótimo trabalho! Continue estudando os mecanismos de vício digital.';
            color = 'blue';
        } else if (score >= 50) {
            feedback = 'Bom esforço! Revise os conceitos de conscientização e dark patterns.';
            color = 'orange';
        } else {
            feedback = 'Tente novamente! O conhecimento sobre hábitos digitais é essencial para o equilíbrio.';
            color = 'red';
        }
        quizFeedbackEl.innerHTML = `
            <h3 style="color: ${color};">Seu Score: ${score}% (${correctAnswers}/${totalQuestions} corretas)</h3>
            <p>${feedback}</p>
        `;
        quizFeedbackEl.style.display = 'block';
        console.log('Resultado exibido em #quiz-feedback');
    } else {
        console.warn('#quiz-feedback não encontrado - adicione no HTML para feedback visual');
        alert(`Quiz concluído! Score: ${score}% (${correctAnswers}/${totalQuestions} corretas)\n${feedback}`);
    }

    // Limpa seleções para novo quiz
    document.querySelectorAll('input[name="q1"], input[name="q2"], input[name="q3"]').forEach(radio => radio.checked = false);

    // Atualiza UI global (pontos, badges, sidebar, etc.)
    renderGamificationStatus();
    updateAllUI();

    console.log('Quiz validado e UI atualizada com sucesso');
}

/**
 * ✅ Função auxiliar para resetar quiz (chamada do botão "Tentar Novamente")
 */
function resetQuiz() {
    const quizFeedbackEl = document.getElementById('quiz-feedback');
    if (quizFeedbackEl) {
        quizFeedbackEl.style.display = 'none';
        quizFeedbackEl.innerHTML = ''; // Limpa conteúdo
    }
    // Limpa todas as radios
    document.querySelectorAll('input[name="q1"], input[name="q2"], input[name="q3"]').forEach(radio => radio.checked = false);
    console.log('Quiz resetado - pronto para nova tentativa');
}