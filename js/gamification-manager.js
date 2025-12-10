/**
 * GAMIFICATION MANAGER - Versão Corrigida e Integrada
 * Gerencia pontos, badges, milestones, desafios diários e ranking
 * Agora sincroniza com userProgress do app.js e emite eventos padronizados
 * Single source of truth: 'gamification-state' no localStorage
 */

class GamificationManager {
    constructor() {
        // ✅ CORREÇÃO: Mapeamento de badges entre app.js e manager
        this.badgeMapping = {
            'home-visit': 'visitor',
            'dopamine-explorer': 'explorer',
            'mechanisms-master': 'master',
            'tools-expert': 'specialist',
            'gamification-guru': 'guru',
            'awareness-advocate': 'defender',
            'quiz-master': 'quiz_master'
        };

        // Definições de badges (IDs padronizados)
        this.badgeDefinitions = [
            { id: 'visitor', name: 'Visitante', icon: '👋', requirement: 'Visitar 1ª página' },
            { id: 'explorer', name: 'Explorador', icon: '🔍', requirement: 'Visitar 3 páginas' },
            { id: 'master', name: 'Mestre', icon: '🎓', requirement: 'Completar quiz' },
            { id: 'specialist', name: 'Especialista', icon: '🔬', requirement: 'Ganhar 150 pontos' },
            { id: 'guru', name: 'Guru', icon: '🧠', requirement: 'Ganhar 300 pontos' },
            { id: 'defender', name: 'Defensor', icon: '🛡️', requirement: 'Ganhar 500 pontos' },
            { id: 'quiz_master', name: 'Mestre do Quiz', icon: '🏆', requirement: 'Acertar 100% quiz' }
        ];

        // Definições de milestones
        this.milestoneDefinitions = [
            { threshold: 100, message: 'Você atingiu 100 pontos!', bonusPoints: 50 },
            { threshold: 250, message: 'Você atingiu 250 pontos!', bonusPoints: 75 },
            { threshold: 500, message: 'Você atingiu 500 pontos!', bonusPoints: 100 },
            { threshold: 750, message: 'Você atingiu 750 pontos!', bonusPoints: 125 },
            { threshold: 1000, message: 'Você atingiu 1000 pontos!', bonusPoints: 150 }
        ];

        // Estado inicial (compatível com userProgress do app.js)
        this.state = {
            points: 0,
            badges: [], // Array de IDs (ex: ['visitor'])
            milestones: [],
            pagesVisited: [], // Array de nomes de páginas (ex: ['home', 'dopamine'])
            quizCompleted: false,
            quizScore: 0,
            dailyChallenge: {
                pagesVisitedToday: 0,
                requiredPages: 3,
                completed: false,
                lastReset: new Date().toDateString()
            },
            multiplier: 1.0,
            sessionStartTime: Date.now(),
            totalSessions: 0
        };

        // Event target para comunicação (event-driven)
        this.eventTarget = new EventTarget();

        this._migrateFromUserProgress();
        this.loadState();

        this._initializeMockRanking();

        // Reset do desafio diário se necessário
        this.checkDailyReset();
    }

    /**
     * Executa uma vez para unificar storage
     */
    _migrateFromUserProgress() {
        try {
            const oldProgress = localStorage.getItem('userProgress');
            if (oldProgress && !localStorage.getItem('gamification-state')) {
                const oldData = JSON.parse(oldProgress);
                console.log('🔄 Migrando dados de userProgress para gamification-state');

                // Mapeia pontos
                this.state.points = oldData.points || 0;

                // Mapeia badges (app.js usa chaves como 'home-visit', manager usa IDs)
                if (oldData.badges && Array.isArray(oldData.badges)) {
                    oldData.badges.forEach(oldBadgeKey => {
                        const mappedId = this.badgeMapping[oldBadgeKey] || oldBadgeKey;
                        if (mappedId && !this.state.badges.includes(mappedId)) {
                            this.state.badges.push(mappedId);
                        }
                    });
                }

                // Mapeia páginas visitadas (app.js usa objeto, manager usa array)
                if (oldData.visitedPages && typeof oldData.visitedPages === 'object') {
                    this.state.pagesVisited = Object.keys(oldData.visitedPages).filter(key => oldData.visitedPages[key]);
                }

                // Quiz
                this.state.quizCompleted = oldData.quizCompleted || false;
                this.state.quizScore = oldData.quizScore || 0;

                // Salva no novo formato
                localStorage.setItem('gamification-state', JSON.stringify(this.state));

                // Remove antigo (opcional, para limpeza)
                // localStorage.removeItem('userProgress');

                console.log('✅ Migração concluída. Use gamificationManager.getState() no app.js daqui em diante.');
            }
        } catch (error) {
            console.warn('Falha na migração:', error);
        }
    }

    _initializeMockRanking() {
        let mockUsers = localStorage.getItem('mock-ranking');
        if (!mockUsers) {
            mockUsers = [
                { name: 'Você', points: this.state.points },
                { name: 'João', points: Math.floor(Math.random() * 800) + 100 },
                { name: 'Maria', points: Math.floor(Math.random() * 800) + 100 },
                { name: 'Pedro', points: Math.floor(Math.random() * 800) + 100 },
                { name: 'Ana', points: Math.floor(Math.random() * 800) + 100 }
            ];
            localStorage.setItem('mock-ranking', JSON.stringify(mockUsers));
        } else {
            mockUsers = JSON.parse(mockUsers);
            // Atualiza pontos do usuário atual
            const you = mockUsers.find(u => u.name === 'Você');
            if (you) you.points = this.state.points;
        }
        this.mockUsers = mockUsers;
    }

    /**
     * Carrega estado do localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('gamification-state');
            if (saved) {
                const parsedState = JSON.parse(saved);

                // Mescla com estado atual (evita sobrescrita de campos novos)
                this.state = { ...this.state, ...parsedState };

                // Garante que arrays e objetos essenciais estejam inicializados
                if (!Array.isArray(this.state.badges)) this.state.badges = [];
                if (!Array.isArray(this.state.milestones)) this.state.milestones = [];
                if (!Array.isArray(this.state.pagesVisited)) this.state.pagesVisited = [];
                if (typeof this.state.dailyChallenge !== 'object' || this.state.dailyChallenge === null) {
                    this.state.dailyChallenge = {
                        pagesVisitedToday: 0,
                        requiredPages: 3,
                        completed: false,
                        lastReset: new Date().toDateString()
                    };
                }

                console.log('Estado carregado:', this.state.points, 'pontos');
            } else {
                this.saveState();
            }
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
            this.saveState(); // Recria estado válido
        }
    }

    /**
     * Salva estado no localStorage e sincroniza com userProgress (compatibilidade)
     */
    saveState() {
        try {
            localStorage.setItem('gamification-state', JSON.stringify(this.state));

            const userProgress = {
                points: this.state.points,
                visitedPages: {}, // Reconstrói objeto de páginas visitadas
                badges: this.state.badges.map(id => {
                    // Inverte mapeamento para chaves do app.js
                    const reverseKey = Object.keys(this.badgeMapping).find(key => this.badgeMapping[key] === id);
                    return reverseKey || id;
                }),
                quizCompleted: this.state.quizCompleted,
                quizScore: this.state.quizScore
            };
            // Reconstrói visitedPages como objeto { pageId: true }
            this.state.pagesVisited.forEach(page => {
                userProgress.visitedPages[page] = true;
            });
            localStorage.setItem('userProgress', JSON.stringify(userProgress));

            // Atualiza mock ranking
            this.mockUsers[0].points = this.state.points;
            localStorage.setItem('mock-ranking', JSON.stringify(this.mockUsers));

            console.log('Estado salvo:', this.state.points, 'pontos');
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }
    }

    /**
     * @param {object} externalState - Estado de userProgress ou similar
     */
    setState(externalState) {
        if (externalState) {
            this.state.points = externalState.points || 0;
            // Mapeia badges se necessário
            if (externalState.badges) {
                this.state.badges = externalState.badges
                    .map(oldKey => this.badgeMapping[oldKey] || oldKey)
                    .filter(id => id); // Remove inválidos
            }
            if (externalState.visitedPages) {
                this.state.pagesVisited = Object.keys(externalState.visitedPages).filter(key => externalState.visitedPages[key]);
            }
            if (externalState.quizCompleted !== undefined) this.state.quizCompleted = externalState.quizCompleted;
            if (externalState.quizScore !== undefined) this.state.quizScore = externalState.quizScore;

            this.saveState();
            console.log('Estado externo definido:', this.state.points, 'pontos');
        }
    }

    /**
     * Verifica se deve resetar desafio diário
     */
    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.state.dailyChallenge.lastReset !== today) {
            this.resetDailyChallenge();
        }
    }

    /**
     * Adiciona pontos ao usuário (padronizado para eventos)
     * @param {number} points - Quantidade de pontos a adicionar
     * @param {string} type - Tipo de ação que gerou os pontos
     * @returns {object} Detalhes do evento
     */
    addPoints(points, type = 'general') {
        const finalPoints = Math.floor(points * this.state.multiplier);
        const previousPoints = this.state.points;

        this.state.points += finalPoints;

        // Verifica badges e milestones
        this.checkBadges();
        this.checkMilestones(previousPoints);

        // Incrementa desafio diário (se for visita de página ou similar)
        if (type === 'page_visit' || type === 'interaction') {
            this.state.dailyChallenge.pagesVisitedToday++;
        }

        this.saveState();

        const event = new CustomEvent('pointsEarned', {
            detail: {
                points: finalPoints, // Renomeado de pointsEarned para points
                type: type,
                totalPoints: this.state.points
            }
        });
        this.eventTarget.dispatchEvent(event);

        console.log(`+${finalPoints} pontos (${type}). Total: ${this.state.points}`);
        return {
            points: finalPoints,
            totalPoints: this.state.points,
            type: type
        };
    }

    /**
     * Verifica e desbloqueia badges (atualizado com quiz)
     */
    checkBadges() {
        const pagesCount = this.state.pagesVisited.length;
        const points = this.state.points;

        // Visitor - primeira página
        if (pagesCount >= 1 && !this.state.badges.includes('visitor')) {
            this.unlockBadge('visitor');
        }

        // Explorer - 3 páginas
        if (pagesCount >= 3 && !this.state.badges.includes('explorer')) {
            this.unlockBadge('explorer');
        }

        // Specialist - 150 pontos
        if (points >= 150 && !this.state.badges.includes('specialist')) {
            this.unlockBadge('specialist');
        }

        // Guru - 300 pontos
        if (points >= 300 && !this.state.badges.includes('guru')) {
            this.unlockBadge('guru');
        }

        // Defender - 500 pontos
        if (points >= 500 && !this.state.badges.includes('defender')) {
            this.unlockBadge('defender');
        }
    }

    /**
     * Verifica e atinge milestones (com bônus de pontos)
     */
    checkMilestones(previousPoints) {
        this.milestoneDefinitions.forEach(milestone => {
            if (previousPoints < milestone.threshold &&
                this.state.points >= milestone.threshold &&
                !this.state.milestones.includes(milestone.threshold)) {

                this.state.milestones.push(milestone.threshold);

                this.state.points += milestone.bonusPoints;

                const event = new CustomEvent('milestoneReached', {
                    detail: {
                        milestone: milestone,
                        points: milestone.bonusPoints, // Para celebração
                        totalPoints: this.state.points
                    }
                });
                this.eventTarget.dispatchEvent(event);

                console.log(`Milestone: ${milestone.message} (+${milestone.bonusPoints} bônus)`);
            }
        });
        this.saveState(); // Salva após bônus
    }

    /**
     * Desbloqueia um badge (padronizado)
     * @param {string} badgeId - ID do badge
     * @returns {object|null} Badge desbloqueado ou null
     */
    unlockBadge(badgeId) {
        if (!this.state.badges.includes(badgeId)) {
            this.state.badges.push(badgeId);
            this.saveState();

            const badge = this.badgeDefinitions.find(b => b.id === badgeId);
            if (!badge) return null;

            // Bônus de pontos
            const bonusPoints = 50;
            this.state.points += bonusPoints;

            const event = new CustomEvent('badgeUnlocked', {
                detail: {
                    badge: badge,
                    points: bonusPoints,
                    totalPoints: this.state.points
                }
            });
            this.eventTarget.dispatchEvent(event);

            console.log(`Badge desbloqueado: ${badge.name} (+${bonusPoints} pontos)`);
            return badge;
        }
        return null;
    }

    /**
     * Registra visita a página (emite evento automaticamente)
     * @param {string} pageName - Nome da página
     */
    visitPage(pageName) {
        if (!this.state.pagesVisited.includes(pageName)) {
            this.state.pagesVisited.push(pageName);

            this.addPoints(25, 'page_visit');
            this.saveState();
            console.log(`Página visitada: ${pageName}`);
        } else {
            console.log(`Página já visitada: ${pageName}`);
        }
    }

    /**
     * @param {number} score - Score em % (0-100)
     * @returns {number} Pontos ganhos
     */
    completeQuiz(score) {
        this.state.quizScore = score;
        this.state.quizCompleted = true;

        const points = Math.floor(score / 2); // Ex: 100% = 50 pontos
        this.addPoints(points, 'quiz');

        // Verifica badges de quiz
        if (score === 100 && !this.state.badges.includes('quiz_master')) {
            this.unlockBadge('quiz_master');
        }
        if (score >= 50 && !this.state.badges.includes('master')) {
            this.unlockBadge('master');
        }

        const event = new CustomEvent('quizCompleted', {
            detail: {
                score: score,
                points: points,
                totalPoints: this.state.points
            }
        });
        //this.eventTarget.dispatchEvent(event);
        this.eventTarget.dispatchEvent(new CustomEvent('quizCompleted', {
            detail: { score, points, message: `Quiz: ${score}% de acerto!` }
        }));

        this.saveState();
        return points;
    }

    /**
     * Completa desafio diário (emite evento)
     * @returns {boolean} Sucesso
     */
    completeChallenge() {
        const challenge = this.getDailyChallenge();
        if (challenge.canClaim) {
            this.state.dailyChallenge.completed = true;
            this.addPoints(100, 'daily_challenge');
            this.state.multiplier = Math.min(this.state.multiplier + 0.1, 2.0);

            // ✅ CORREÇÃO: Emite evento específico
            const event = new CustomEvent('dailyChallengeCompleted', {
                detail: {
                    points: 100,
                    totalPoints: this.state.points
                }
            });
            this.eventTarget.dispatchEvent(event);

            this.saveState();
            this.resetDailyChallenge();
            console.log('Desafio diário completado!');
            return true;
        }
        return false;
    }

    /**
     * Reseta desafio diário
     */
    resetDailyChallenge() {
        this.state.dailyChallenge = {
            pagesVisitedToday: 0,
            requiredPages: 3,
            completed: false,
            lastReset: new Date().toDateString()
        };
        this.state.multiplier = Math.max(this.state.multiplier - 0.1, 1.0);
        this.saveState();
        console.log('Desafio diário resetado');
    }

    /**
     * Obtém desafio diário (compatível com app.js)
     */
    getDailyChallenge() {
        const challenge = this.state.dailyChallenge;
        const canClaim = challenge.pagesVisitedToday >= challenge.requiredPages && !challenge.completed;
        return {
            ...challenge,
            description: `Visite ${challenge.requiredPages} páginas diferentes hoje!`,
            progress: challenge.pagesVisitedToday,
            canClaim: canClaim,
            progressPercent: Math.min(100, (challenge.pagesVisitedToday / challenge.requiredPages) * 100)
        };
    }

    /**
     * Obtém pontos totais
     */
    getPoints() {
        return this.state.points;
    }

    /**
     * Obtém badges desbloqueados (com nomes para UI)
     */
    getUnlockedBadges() {
        return this.state.badges.map(id => {
            const def = this.badgeDefinitions.find(b => b.id === id);
            return def ? { id, ...def } : null;
        }).filter(Boolean);
    }

    /**
     * Obtém estado completo (para app.js)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Obtém progresso em %
     */
    getProgress() {
        return Math.round((this.state.badges.length / this.badgeDefinitions.length) * 100);
    }

    /**
     * Obtém ranking simulado (sincronizado)
     */
    getRanking() {
        // Atualiza usuário atual
        const youIndex = this.mockUsers.findIndex(u => u.name === 'Você');
        if (youIndex !== -1) {
            this.mockUsers[youIndex].points = this.state.points;
        }
        return this.mockUsers.sort((a, b) => b.points - a.points);
    }

    /**
     * Obtém todas as definições de badges
     */
    getBadgeDefinitions() {
        return this.badgeDefinitions;
    }

    /**
     * Obtém definição de milestone
     */
    getMilestoneDefinitions() {
        return this.milestoneDefinitions;
    }

    init() {
        this.loadState();
        this.checkDailyReset();
        this._migrateFromUserProgress(); // Garante migração
        console.log('GamificationManager inicializado');
    }

    /**
     * Reset completo (para testes)
     */
    resetAll() {
        this.state = {
            points: 0,
            badges: [],
            milestones: [],
            pagesVisited: [],
            quizCompleted: false,
            quizScore: 0,
            dailyChallenge: {
                pagesVisitedToday: 0,
                requiredPages: 3,
                completed: false,
                lastReset: new Date().toDateString()
            },
            multiplier: 1.0,
            sessionStartTime: Date.now(),
            totalSessions: 0
        };
        localStorage.removeItem('gamification-state');
        localStorage.removeItem('userProgress'); // Limpa antigo também
        localStorage.removeItem('mock-ranking');
        this.saveState(); // Recria
        console.log('Tudo resetado');
    }
}