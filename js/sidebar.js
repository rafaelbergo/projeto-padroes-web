/**
 * SIDEBAR MODULAR - Reutilizável em qualquer página
 * Gerencia gamificação, pontos, badges e desafios
 */

class SidebarManager {
    constructor() {
        this.gamification = new GamificationManager();
        this.celebration = new CelebrationAnimation('celebration-overlay');
        this.analytics = new AnalyticsTracker();
        this.initSidebar();
    }

    /**
     * Inicializa o sidebar injetando HTML e inicializando eventos
     */
    initSidebar() {
        // Insere o HTML do sidebar no documento
        this.insertSidebarHTML();
        
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupSidebarLogic());
        } else {
            this.setupSidebarLogic();
        }
    }

    /**
     * Injeta o HTML do sidebar na página
     */
    insertSidebarHTML() {
        const sidebarHTML = `
            <!-- SIDEBAR DE GAMIFICAÇÃO -->
            <aside class="sidebar" id="gamification-sidebar" role="complementary" aria-label="Gamificação e Progresso">
                <!-- HEADER DO SIDEBAR -->
                <div class="sidebar-header">
                    <button class="sidebar-toggle" id="sidebar-toggle" aria-expanded="true" aria-controls="sidebar-content">
                        <span class="hamburger">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                    <h2 class="sidebar-title">🎮 Progresso</h2>
                </div>

                <!-- CONTEÚDO DO SIDEBAR -->
                <div class="sidebar-content" id="sidebar-content">
                    <!-- PONTOS -->
                    <div class="sidebar-section">
                        <h3 class="section-title">⭐ Pontos</h3>
                        <div class="points-stat">
                            <div class="points-value" id="points-display">0</div>
                            <div class="points-label">Total Ganhos</div>
                        </div>
                    </div>

                    <!-- PROGRESSO -->
                    <div class="sidebar-section">
                        <h3 class="section-title">📈 Progresso</h3>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                            </div>
                            <div class="progress-text">
                                <span id="progress-percentage">0</span>% Completo
                            </div>
                        </div>
                    </div>

                    <!-- BADGES -->
                    <div class="sidebar-section">
                        <h3 class="section-title">🏅 Badges (<span id="badge-count">0</span>/7)</h3>
                        <div class="badges-grid" id="badges-container">
                            <!-- Badges injetados dinamicamente -->
                        </div>
                    </div>

                    <!-- DESAFIO DIÁRIO -->
                    <div class="sidebar-section">
                        <h3 class="section-title">🎯 Desafio Diário</h3>
                        <div class="challenge-box" id="challenge-box">
                            <div class="challenge-description" id="challenge-description">
                                Descrição do desafio...
                            </div>
                            <div class="challenge-progress">
                                <span id="challenge-progress">0</span>/3 páginas visitadas
                            </div>
                            <button class="challenge-button" id="claim-reward-btn" disabled>
                                Reclamar Recompensa
                            </button>
                        </div>
                    </div>

                    <!-- RANKING -->
                    <div class="sidebar-section">
                        <h3 class="section-title">🏆 Ranking</h3>
                        <div class="ranking-stats" id="ranking-stats">
                            <!-- Ranking injetado dinamicamente -->
                        </div>
                    </div>

                    <!-- DASHBOARD -->
                    <div class="sidebar-section">
                        <button class="dashboard-button" id="open-dashboard-btn">
                            📊 Ver Dashboard
                        </button>
                    </div>
                </div>
            </aside>

            <!-- CELEBRATION OVERLAY (mesmo da página anterior) -->
            <div id="celebration-overlay" aria-live="polite" aria-atomic="true">
                <div class="celebration-message" role="status"></div>
                <div class="points-display" role="status"></div>
                <div class="particles-container"></div>
            </div>
        `;

        // Injeta no início do body
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    /**
     * Configura a lógica do sidebar (eventos, atualização de UI)
     */
    setupSidebarLogic() {
        // Toggle do sidebar em mobile
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebarContent = document.getElementById('sidebar-content');
        
        toggleBtn.addEventListener('click', () => {
            sidebarContent.classList.toggle('collapsed');
            toggleBtn.setAttribute('aria-expanded', 
                sidebarContent.classList.contains('collapsed') ? 'false' : 'true');
        });

        // Renderiza badges
        this.renderBadges();

        // Atualiza UI inicial
        this.updateUI();

        // Renderiza ranking
        this.renderRanking();

        // Setup desafio diário
        this.setupDailyChallenge();

        // Event listeners para pontos/badges
        this.gamification.eventTarget.addEventListener('pointsEarned', (e) => {
            this.onPointsEarned(e.detail);
        });

        this.gamification.eventTarget.addEventListener('badgeUnlocked', (e) => {
            this.onBadgeUnlocked(e.detail);
        });

        this.gamification.eventTarget.addEventListener('milestoneReached', (e) => {
            this.onMilestoneReached(e.detail);
        });

        // Dashboard
        document.getElementById('open-dashboard-btn').addEventListener('click', 
            () => this.showDashboard());
    }

    /**
     * Renderiza os badges no sidebar
     */
    renderBadges() {
        const badgesContainer = document.getElementById('badges-container');
        badgesContainer.innerHTML = '';

        const badgeDefinitions = [
            { id: 'visitor', name: 'Visitante', icon: '👋', requirement: '1 página' },
            { id: 'explorer', name: 'Explorador', icon: '🔍', requirement: '3 páginas' },
            { id: 'master', name: 'Mestre', icon: '🎓', requirement: 'Quiz completo' },
            { id: 'specialist', name: 'Especialista', icon: '🔬', requirement: '150 pontos' },
            { id: 'guru', name: 'Guru', icon: '🧠', requirement: '300 pontos' },
            { id: 'defender', name: 'Defensor', icon: '🛡️', requirement: '500 pontos' },
            { id: 'quiz_master', name: 'Mestre do Quiz', icon: '🏆', requirement: 'Quiz 100%' }
        ];

        const unlockedBadges = this.gamification.getUnlockedBadges();

        badgeDefinitions.forEach(badge => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const badgeEl = document.createElement('div');
            badgeEl.className = `badge ${isUnlocked ? 'unlocked' : 'locked'}`;
            badgeEl.title = `${badge.name} - ${badge.requirement}`;
            badgeEl.innerHTML = `
                <span class="badge-icon">${badge.icon}</span>
                <div class="badge-tooltip">
                    <strong>${badge.name}</strong>
                    <p>${badge.requirement}</p>
                </div>
            `;
            badgesContainer.appendChild(badgeEl);
        });
    }

    /**
     * Renderiza o ranking no sidebar
     */
    renderRanking() {
        const rankingStats = document.getElementById('ranking-stats');
        const currentPoints = this.gamification.getPoints();
        const ranking = this.gamification.getRanking();

        const userRank = ranking.findIndex(user => user.name === 'Você') + 1;

        rankingStats.innerHTML = `
            <div class="ranking-item your-rank">
                <span class="rank-position">#${userRank}</span>
                <span class="rank-name">Você</span>
                <span class="rank-points">${currentPoints}</span>
            </div>
            ${ranking.slice(0, 2).map((user, idx) => {
                if (user.name === 'Você') return '';
                return `
                    <div class="ranking-item">
                        <span class="rank-position">#${idx + 1}</span>
                        <span class="rank-name">${user.name}</span>
                        <span class="rank-points">${user.points}</span>
                    </div>
                `;
            }).join('')}
        `;
    }

    /**
     * Configura o desafio diário
     */
    setupDailyChallenge() {
        const dailyChallenge = this.gamification.getDailyChallenge();
        const claimBtn = document.getElementById('claim-reward-btn');

        this.updateChallengeUI(dailyChallenge);

        claimBtn.addEventListener('click', () => {
            this.gamification.completeChallenge();
            this.celebration.show('🎉 Desafio Concluído!', 100, 'milestone');
            claimBtn.disabled = true;
            setTimeout(() => this.gamification.resetDailyChallenge(), 100);
        });
    }

    /**
     * Atualiza UI do desafio diário
     */
    updateChallengeUI(challenge) {
        const progressEl = document.getElementById('challenge-progress');
        const descriptionEl = document.getElementById('challenge-description');
        const claimBtn = document.getElementById('claim-reward-btn');

        descriptionEl.textContent = challenge.description;
        progressEl.textContent = challenge.pagesVisitedToday;
        claimBtn.disabled = !challenge.canClaim;

        if (challenge.canClaim) {
            claimBtn.classList.add('pulse-animation');
        }
    }

    /**
     * Manipulador: Pontos ganhos
     */
    onPointsEarned(detail) {
        const { points, type } = detail;
        
        // Celebração
        this.celebration.show('✨ Pontos Ganhos!', points, 'points');
        
        // Analytics
        this.analytics.track('points_earned', { points, type });
        
        // Atualiza UI
        this.updateUI();
    }

    /**
     * Manipulador: Badge desbloqueado
     */
    onBadgeUnlocked(detail) {
        const { badge, totalPoints } = detail;
        
        // Celebração especial
        this.celebration.show(`🏅 Badge: ${badge.name}!`, 50, 'badge');
        
        // Analytics
        this.analytics.track('badge_unlocked', { badgeId: badge.id });
        
        // Atualiza badges visualmente
        this.renderBadges();
        this.updateUI();
    }

    /**
     * Manipulador: Milestone alcançado
     */
    onMilestoneReached(detail) {
        const { milestone } = detail;
        
        // Celebração épica
        this.celebration.show(`🎆 Milestone: ${milestone.message}!`, milestone.points, 'milestone');
        
        // Analytics
        this.analytics.track('milestone_reached', { threshold: milestone.threshold });
    }

    /**
     * Atualiza toda a UI do sidebar
     */
    updateUI() {
        // Pontos
        const points = this.gamification.getPoints();
        document.getElementById('points-display').textContent = points;

        // Badges
        const badges = this.gamification.getUnlockedBadges();
        document.getElementById('badge-count').textContent = badges.length;

        // Progresso
        const progress = Math.round((badges.length / 7) * 100);
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-percentage').textContent = progress;

        // Desafio
        const dailyChallenge = this.gamification.getDailyChallenge();
        this.updateChallengeUI(dailyChallenge);

        // Ranking
        this.renderRanking();
    }

    /**
     * Mostra dashboard completo
     */
    showDashboard() {
        // Implementação do dashboard (pode ser modal ou página)
        const metrics = this.analytics.getMetrics();
        console.table(metrics);
        alert(`Dashboard aberto!\n\nPontos: ${metrics.totalPoints}\nBadges: ${metrics.badgesUnlocked}\nTempo: ${metrics.sessionDuration}s`);
    }
}

// Inicializa sidebar automaticamente quando a página carrega
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SidebarManager();
    });
} else {
    new SidebarManager();
}