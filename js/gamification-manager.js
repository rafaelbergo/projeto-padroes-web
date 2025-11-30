/**
 * GAMIFICATION MANAGER
 * Gerencia pontos, badges, milestones, desafios diários e ranking
 * Sistema completo de gamificação com localStorage persistente
 */

class GamificationManager {
    constructor() {
        // Definições de badges
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
            { threshold: 100, message: 'Você atingiu 100 pontos!' },
            { threshold: 250, message: 'Você atingiu 250 pontos!' },
            { threshold: 500, message: 'Você atingiu 500 pontos!' },
            { threshold: 750, message: 'Você atingiu 750 pontos!' },
            { threshold: 1000, message: 'Você atingiu 1000 pontos!' }
        ];

        // Estado inicial
        this.state = {
            points: 0,
            badges: [],
            milestones: [],
            pagesVisited: [],
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

        // Event target para comunicação
        this.eventTarget = new EventTarget();

        // Carrega estado do localStorage
        this.loadState();
        
        // Inicializa dados de teste (mock ranking)
        this.mockUsers = [
            { name: 'Você', points: this.state.points },
            { name: 'João', points: Math.floor(Math.random() * 800) + 100 },
            { name: 'Maria', points: Math.floor(Math.random() * 800) + 100 },
            { name: 'Pedro', points: Math.floor(Math.random() * 800) + 100 },
            { name: 'Ana', points: Math.floor(Math.random() * 800) + 100 }
        ];

        // Reset do desafio diário se necessário
        this.checkDailyReset();
    }

    /**
     * Carrega estado do localStorage
     */
    loadState() {
        const saved = localStorage.getItem('gamification-state');
        if (saved) {
            this.state = JSON.parse(saved);
        } else {
            this.saveState();
        }
    }

    /**
     * Salva estado no localStorage
     */
    saveState() {
        localStorage.setItem('gamification-state', JSON.stringify(this.state));
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
     * Adiciona pontos ao usuário
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

        // Incrementa desafio diário
        this.state.dailyChallenge.pagesVisitedToday++;

        this.saveState();

        // Emite evento
        const event = new CustomEvent('pointsEarned', {
            detail: {
                pointsEarned: finalPoints,
                totalPoints: this.state.points,
                type: type,
                multiplier: this.state.multiplier
            }
        });
        this.eventTarget.dispatchEvent(event);

        return {
            pointsEarned: finalPoints,
            totalPoints: this.state.points,
            type: type
        };
    }

    /**
     * Verifica e desbloqueia badges
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
     * Verifica e atinge milestones
     */
    checkMilestones(previousPoints) {
        this.milestoneDefinitions.forEach(milestone => {
            if (previousPoints < milestone.threshold && 
                this.state.points >= milestone.threshold &&
                !this.state.milestones.includes(milestone.threshold)) {
                
                this.state.milestones.push(milestone.threshold);

                const event = new CustomEvent('milestoneReached', {
                    detail: {
                        milestone: milestone,
                        totalPoints: this.state.points
                    }
                });
                this.eventTarget.dispatchEvent(event);
            }
        });
    }

    /**
     * Desbloqueia um badge
     */
    unlockBadge(badgeId) {
        if (!this.state.badges.includes(badgeId)) {
            this.state.badges.push(badgeId);
            this.saveState();

            const badge = this.badgeDefinitions.find(b => b.id === badgeId);
            
            // Bônus de pontos
            const bonusPoints = 50;
            this.state.points += bonusPoints;

            const event = new CustomEvent('badgeUnlocked', {
                detail: {
                    badge: badge,
                    bonusPoints: bonusPoints,
                    totalPoints: this.state.points
                }
            });
            this.eventTarget.dispatchEvent(event);

            return badge;
        }
        return null;
    }

    /**
     * Registra visita a página
     */
    visitPage(pageName) {
        if (!this.state.pagesVisited.includes(pageName)) {
            this.state.pagesVisited.push(pageName);
            this.addPoints(25, 'page_visit');
        }
    }

    /**
     * Completa o quiz
     */
    completeQuiz(score) {
        const points = Math.floor(score / 2); // Score % / 2 = pontos
        this.addPoints(points, 'quiz');

        if (score === 100 && !this.state.badges.includes('quiz_master')) {
            this.unlockBadge('quiz_master');
        }

        if (!this.state.badges.includes('master') && score >= 50) {
            this.unlockBadge('master');
        }

        return points;
    }

    /**
     * Completa desafio diário
     */
    completeChallenge() {
        if (this.state.dailyChallenge.canClaim) {
            this.state.dailyChallenge.completed = true;
            this.addPoints(100, 'daily_challenge');
            this.state.multiplier = Math.min(this.state.multiplier + 0.1, 2.0);
            this.saveState();
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
    }

    /**
     * Obtém desafio diário
     */
    getDailyChallenge() {
        const challenge = this.state.dailyChallenge;
        return {
            ...challenge,
            description: `Visite ${challenge.requiredPages} páginas diferentes hoje!`,
            progress: challenge.pagesVisitedToday,
            canClaim: challenge.pagesVisitedToday >= challenge.requiredPages && !challenge.completed,
            progressPercent: (challenge.pagesVisitedToday / challenge.requiredPages) * 100
        };
    }

    /**
     * Obtém pontos totais
     */
    getPoints() {
        return this.state.points;
    }

    /**
     * Obtém badges desbloqueados
     */
    getUnlockedBadges() {
        return this.state.badges;
    }

    /**
     * Obtém estado completo
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
     * Obtém ranking simulado
     */
    getRanking() {
        this.mockUsers[0].points = this.state.points;
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

    /**
     * Reset completo (para testes)
     */
    resetAll() {
        this.state = {
            points: 0,
            badges: [],
            milestones: [],
            pagesVisited: [],
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
        this.saveState();
    }
}

// Instância global
const gamificationManager = new GamificationManager();