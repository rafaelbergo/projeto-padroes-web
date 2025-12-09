/**
 * SIDEBAR MODULAR - Versão FINAL Corrigida (UI Atualiza Sempre)
 * Fixes: HTML válido, listeners global, mapeamento sem conflito, re-render completo, logs debug
 */

class SidebarManager {
    constructor() {
        this.gamification = window.gamificationManager || new GamificationManager();
        window.gamificationManager = this.gamification;

        this.celebration = new CelebrationAnimation('celebration-overlay');
        this.analytics = new AnalyticsTracker();

        console.log('🔍 SidebarManager: Iniciando...');

        window.sidebarManager = this;

        if (this._sidebarExists()) {
            console.log('✅ Sidebar hardcoded detectado - configurando');
            this.useExistingSidebar();
        } else {
            console.log('⚠️ Injetando sidebar novo');
            this.injectSidebarHTML();
        }

        this.setupOverlay();
        this.setupSidebarLogic();

        // Inicial UI
        this.updateUI();
    }

    _sidebarExists() {
        return document.querySelector('.sidebar') || document.getElementById('gamification-sidebar');
    }

    useExistingSidebar() {
        const existingSidebar = document.querySelector('.sidebar');
        if (existingSidebar) {
            existingSidebar.id = 'gamification-sidebar';
            existingSidebar.classList.add('gamification-enabled');
            existingSidebar.setAttribute('data-gamification', 'sidebar');

            // Mapeamento com data-attributes (sem alterar IDs)
            const pointsEl = document.querySelector('.gamification-stats strong, [id*="points"]');
            if (pointsEl && !pointsEl.getAttribute('data-gamification')) {
                pointsEl.setAttribute('data-gamification', 'points');
            }

            const progressFill = document.querySelector('[id*="progress"], .progress-fill, .progress-bar');
            if (progressFill && !progressFill.getAttribute('data-gamification')) {
                progressFill.setAttribute('data-gamification', 'progress');
            }

            const badgesContainer = document.querySelector('[id*="badges"], .badges-list, #unlocked-badges-list');
            if (badgesContainer && !badgesContainer.getAttribute('data-gamification')) {
                badgesContainer.setAttribute('data-gamification', 'badges');
                badgesContainer.innerHTML = '';
                console.log('Lista de badges hardcoded limpa para gerenciamento JS');
            }

            const challengeBtn = document.querySelector('[id*="challenge-btn"], .daily-challenge button');
            if (challengeBtn && !challengeBtn.getAttribute('data-gamification')) {
                challengeBtn.setAttribute('data-gamification', 'challenge');
            }

            const rankingContainer = document.querySelector('[id*="ranking"], .ranking-stats');
            if (rankingContainer && !rankingContainer.getAttribute('data-gamification')) {
                rankingContainer.setAttribute('data-gamification', 'ranking');
                rankingContainer.innerHTML = ''; // Limpa para re-render
            }

            console.log('✅ Elementos mapeados e limpos');

            // Inicial renders
            this.renderBadges();
            this.renderRanking();
            this.setupDailyChallenge();
        }
    }

    injectSidebarHTML() {
        const sidebarHTML = `
            <aside class="sidebar gamification-sidebar" id="gamification-sidebar" data-gamification="sidebar" role="complementary" aria-label="Gamificação e Progresso">
                <div class="sidebar-header">
                    <button class="sidebar-toggle" id="sidebar-toggle" aria-expanded="true" aria-controls="sidebar-content">
                        <span class="hamburger">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                    <h3 class="sidebar-title">🎮 Progresso</h3>
                </div>

                <div class="sidebar-content" id="sidebar-content">
                    <div class="sidebar-section">
                        <h4 class="section-title">⭐ Pontos</h4>
                        <div class="gamification-stats">
                            <div class="points-stat">
                                <div class="points-value" id="points-display" data-gamification="points">0</div>
                                <div class="points-label">Total Ganhos</div>
                            </div>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <h4 class="section-title">📈 Progresso Geral</h4>
                        <div class="progress-bar-container">
                            <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                <div class="progress-fill" id="progress-fill" data-gamification="progress" style="width: 0%"></div>
                            </div>
                            <div class="progress-text">
                                <span id="progress-percentage">0</span>% Completo
                            </div>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <h4 class="section-title">🏅 Badges (<span id="badge-count" data-gamification="badge-count">0</span>)</h4>
                        <ul class="badges-list" id="unlocked-badges-list" data-gamification="badges">
                            <!-- Sempre vazio - JS gerencia -->
                        </ul>
                    </div>

                    <div class="sidebar-section daily-challenge">
                        <h4 class="section-title">🎯 Desafio Diário</h4>
                        <div class="challenge-box" id="challenge-box">
                            <p id="challenge-description" data-gamification="challenge-desc">Visite 3 páginas para ganhar 50 pontos bônus!</p>
                            <div class="challenge-progress">
                                <span id="challenge-progress" data-gamification="challenge-progress">0</span>/3 páginas visitadas
                            </div>
                            <button class="challenge-button" id="claim-reward-btn" data-gamification="challenge" disabled>
                                Reclamar Recompensa
                            </button>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <h4 class="section-title">🏆 Ranking</h4>
                        <div class="ranking-stats" id="ranking-stats" data-gamification="ranking">
                            <!-- JS preenche -->
                        </div>
                    </div>

                    <div class="sidebar-section controls">
                        <h4>Configurações & Ferramentas</h4>
                        <div class="toggle-switch">
                            <label for="sound-toggle">Som de Celebração</label>
                            <label class="switch">
                                <input type="checkbox" id="sound-toggle" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="toggle-switch">
                            <label for="vibration-toggle">Vibração (Celular)</label>
                            <label class="switch">
                                <input type="checkbox" id="vibration-toggle" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <button id="show-analytics-btn">Ver Dashboard de Analytics</button>
                        <button id="reset-game-btn" style="background-color: #dc3545;">Reiniciar Jogo</button>
                    </div>
                </div>
            </aside>
        `;

        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', sidebarHTML);
            console.log('✅ Sidebar injetado');
        } else {
            document.body.insertAdjacentHTML('beforeend', sidebarHTML);
        }
    }

    setupOverlay() {
        const existingOverlay = document.getElementById('celebration-overlay');
        if (!existingOverlay) {
            const overlayHTML = `
                <div id="celebration-overlay" aria-live="polite" aria-atomic="true">
                    <div class="celebration-message" role="status"></div>
                    <div class="points-display" role="status"></div>
                    <div class="particles-container"></div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', overlayHTML);
            console.log('✅ Overlay injetado');
        } else {
            console.log('✅ Overlay existente usado');
        }
    }

    setupSidebarLogic() {
        const sidebar = document.getElementById('gamification-sidebar') || document.querySelector('.sidebar');
        if (!sidebar) {
            console.error('❌ Sidebar não encontrado');
            return;
        }

        // Toggle (se elementos existirem)
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebarContent = document.getElementById('sidebar-content');
        if (toggleBtn && sidebarContent) {
            toggleBtn.addEventListener('click', () => {
                sidebarContent.classList.toggle('collapsed');
                toggleBtn.setAttribute('aria-expanded', sidebarContent.classList.contains('collapsed') ? 'false' : 'true');
            });
            console.log('✅ Toggle configurado');
        }

        const globalEventTarget = window.gamificationManager?.eventTarget || this.gamification.eventTarget;
        if (globalEventTarget && !this._listenersAttached) {
            this._listenersAttached = true;

            globalEventTarget.addEventListener('pointsEarned', (e) => {
                console.log('Sidebar: pointsEarned recebido:', e.detail); // Debug
                this.onPointsEarned(e.detail);
            });

            globalEventTarget.addEventListener('badgeUnlocked', (e) => {
                console.log('Sidebar: badgeUnlocked recebido:', e.detail); // Debug
                this.onBadgeUnlocked(e.detail);
            });

            globalEventTarget.addEventListener('milestoneReached', (e) => {
                console.log('Sidebar: milestoneReached recebido:', e.detail); // Debug
                this.onMilestoneReached(e.detail);
            });

            globalEventTarget.addEventListener('quizCompleted', (e) => {
                console.log('Sidebar: quizCompleted recebido:', e.detail); // Debug
                this.onQuizCompleted(e.detail);
            });

            console.log('✅ Listeners anexados ao GLOBAL eventTarget');
        }

        // Inicial renders
        this.renderBadges();
        this.renderRanking();
        this.setupDailyChallenge();
        this.setupControls();

        // Buttons
        const dashboardBtn = document.getElementById('show-analytics-btn');
        if (dashboardBtn) {
            dashboardBtn.replaceWith(dashboardBtn.cloneNode(true)); // Remove listeners antigos
            const newDashboardBtn = document.getElementById('show-analytics-btn');
            newDashboardBtn.addEventListener('click', () => this.showDashboard());
        }
            

        const resetBtn = document.getElementById('reset-game-btn');
        if (resetBtn) {
            resetBtn.replaceWith(resetBtn.cloneNode(true)); // Remove listeners antigos
            const newResetBtn = document.getElementById('reset-game-btn');
            newResetBtn.addEventListener('click', () => {
                if (confirm('Reiniciar todo progresso?')) {
                    this.gamification.resetAll();
                    this.updateUI();
                }
            });
        }

        console.log('✅ SetupSidebarLogic concluído');
    }

    setupControls() {
        const soundToggle = document.getElementById('sound-toggle');
        const vibrationToggle = document.getElementById('vibration-toggle');

        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.celebration.setConfig({ enableSound: e.target.checked });
            });
        }

        if (vibrationToggle) {
            vibrationToggle.addEventListener('change', (e) => {
                this.celebration.setConfig({ enableVibration: e.target.checked });
            });
        }
    }

    renderBadges() {
        const badgesContainer = document.querySelector('[data-gamification="badges"], #badges-container, #unlocked-badges-list, .badges-list');
        if (!badgesContainer) {
            console.warn('Container badges não encontrado');
            return;
        }

        badgesContainer.innerHTML = '';
        console.log('Container badges limpo - preparando re-render');

        const badgeDefinitions = this.gamification.getBadgeDefinitions(); // Todos badges
        const unlockedIds = this.gamification.getUnlockedBadges().map(b => b.id); // IDs unlocked

        badgeDefinitions.forEach(badge => {
            const isUnlocked = unlockedIds.includes(badge.id);
            let badgeEl = badgesContainer.querySelector(`[data-badge-id="${badge.id}"]`);
            if (!badgeEl) {
                badgeEl = document.createElement(badgesContainer.tagName === 'UL' ? 'li' : 'div');
                badgesContainer.appendChild(badgeEl);
            }
            
            badgeEl.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            badgeEl.setAttribute('data-badge-id', badge.id); // Único ID
            badgeEl.title = `${badge.name}: ${badge.requirement}`;
            
            // Conteúdo: Icon + nome curto; locked mostra 🔒
            const icon = isUnlocked ? badge.icon : '🔒';
            const nameClass = isUnlocked ? 'badge-name' : 'badge-name locked-name';
            badgeEl.innerHTML = `
                <span class="badge-icon">${icon}</span>
                <span class="${nameClass}">${isUnlocked ? badge.name : badge.name}</span>
                <div class="badge-tooltip">
                    <strong>${badge.name}</strong>
                    <p>${badge.requirement}</p>
                    ${isUnlocked ? '<span>✅ Desbloqueado!</span>' : '<span>🔒 Bloqueado</span>'}
                </div>
            `;
            
            console.log(`Badge "${badge.name}" renderizado: ${isUnlocked ? 'unlocked' : 'locked'}`);
        });

        // Badge count
        const badgeCountEl = document.querySelector('[data-gamification="badge-count"], #badge-count');
        if (badgeCountEl) {
            badgeCountEl.textContent = `${unlockedIds.length}/${badgeDefinitions.length}`;
        }

        console.log(`✅ Badges re-render: ${unlockedIds.length} unlocked de ${badgeDefinitions.length} totais (sem dupes)`);
        badgesContainer.offsetHeight; // Reflow
    }

    renderRanking() {
        const rankingContainer = document.querySelector('[data-gamification="ranking"], #ranking-stats, .ranking-stats');
        if (!rankingContainer) {
            console.warn('Container de ranking não encontrado');
            return;
        }

        rankingContainer.innerHTML = ''; // Sempre limpa para re-render

        const ranking = this.gamification.getRanking();
        const userRank = ranking.findIndex(user => user.name === 'Você') + 1;
        const currentPoints = this.gamification.getPoints();

        // Seu estilo: divs
        const yourRankDiv = document.createElement('div');
        yourRankDiv.className = 'ranking-item your-rank';
        yourRankDiv.innerHTML = `
            <span class="rank-position">#${userRank}</span>
            <span class="rank-name">Você</span>
            <span class="rank-points">${currentPoints}</span>
        `;
        rankingContainer.appendChild(yourRankDiv);

        ranking.slice(0, 4).filter(user => user.name !== 'Você').forEach((user, idx) => {
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `
                <span class="rank-position">#${idx + 2}</span>
                <span class="rank-name">${user.name}</span>
                <span class="rank-points">${user.points}</span>
            `;
            rankingContainer.appendChild(div);
        });

        console.log('Ranking re-renderizado');
        rankingContainer.offsetHeight; // Reflow
    }

    setupDailyChallenge() {
        const dailyChallenge = this.gamification.getDailyChallenge();
        const claimBtn = document.querySelector('[data-gamification="challenge"], #claim-reward-btn, #complete-daily-challenge-btn');
        if (!claimBtn) {
            console.warn('Botão de desafio não encontrado');
            return;
        }

        this.updateChallengeUI(dailyChallenge);
        claimBtn.addEventListener('click', () => {
            if (this.gamification.completeChallenge()) {
                this.celebration.show('🎉 Desafio Concluído!', 100, 'milestone');
                claimBtn.disabled = true;
                claimBtn.textContent = 'Completado!';
                claimBtn.classList.remove('pulse-animation');
                setTimeout(() => this.updateUI(), 500);
            }
        });

        console.log('Desafio configurado');
    }

    updateChallengeUI(challenge) {
        const descriptionEl = document.querySelector('[data-gamification="challenge-desc"], #challenge-description');
        const progressEl = document.querySelector('[data-gamification="challenge-progress"], #challenge-progress');
        const claimBtn = document.querySelector('[data-gamification="challenge"], #claim-reward-btn');

        if (descriptionEl) descriptionEl.textContent = challenge.description;
        if (progressEl) progressEl.textContent = challenge.progress;
        if (claimBtn) {
            claimBtn.disabled = !challenge.canClaim;
            claimBtn.textContent = challenge.canClaim ? 'Reclamar Recompensa (50 pts)' : 'Não Elegível';
            if (challenge.canClaim) {
                claimBtn.classList.add('pulse-animation');
            } else {
                claimBtn.classList.remove('pulse-animation');
            }
        }
    }

    onQuizCompleted(detail) {
        this.celebration.show(`⭐ Quiz: ${detail.score}%`, detail.points, 'stars');
        this.analytics.track('quiz_completed', { score: detail.score });
        this.updateUI();
    }

    onPointsEarned(detail) {
        console.log('Sidebar onPointsEarned: +', detail.points, 'tipo:', detail.type); // Debug
        this.celebration.show('✨ Pontos Ganhos!', detail.points, 'points');
        this.analytics.track('points_earned', detail);
        this.updateUI();
    }

    onBadgeUnlocked(detail) {
        console.log('Sidebar onBadgeUnlocked:', detail.badge.name); // Debug
        this.celebration.show(`🏅 ${detail.badge.name}!`, 50, 'badge');
        this.analytics.track('badge_unlocked', { badgeId: detail.badge.id });
        this.renderBadges(); // Re-render badges
        this.updateUI();
    }

    onMilestoneReached(detail) {
        console.log('Sidebar onMilestoneReached:', detail.milestone.message); // Debug
        this.celebration.show(`🎆 ${detail.milestone.message}!`, detail.milestone.bonusPoints, 'milestone');
        this.analytics.track('milestone_reached', { threshold: detail.milestone.threshold });
        this.updateUI();
    }

    updateUI() {
        const state = this.gamification.getState();
        console.log('Sidebar updateUI chamada - Estado:', state.points, 'pontos, badges:', state.badges.length); // Debug

        // Pontos (selectores múltiplos)
        const pointsEl = document.querySelector('[data-gamification="points"], #points-display, #current-points, .points-value, .gamification-stats strong');
        if (pointsEl) {
            const oldValue = pointsEl.textContent;
            pointsEl.textContent = state.points;
            pointsEl.offsetHeight; // Reflow
            console.log('Pontos atualizado: ', oldValue, '→', state.points, '(elemento:', pointsEl.id || pointsEl.className, ')');
        } else {
            console.warn('Elemento de pontos não encontrado');
        }

        // Multiplicador
        const multiplierEl = document.querySelector('#current-multiplier, [data-gamification="multiplier"]');
        if (multiplierEl) {
            multiplierEl.textContent = `x${state.multiplier || 1}`;
            console.log('Multiplicador atualizado');
        }

        // Badge count
        const badgeCountEl = document.querySelector('[data-gamification="badge-count"], #badge-count');
        if (badgeCountEl) {
            badgeCountEl.textContent = `${state.badges.length}/7`;
            console.log('Badge count atualizado:', state.badges.length);
        }

        // Progresso
        const progress = this.gamification.getProgress();
        const progressFill = document.querySelector('[data-gamification="progress"], #progress-fill, #overall-progress-bar, .progress-fill');
        if (progressFill) {
            const oldWidth = progressFill.style.width;
            progressFill.style.width = `${progress}%`;
            progressFill.setAttribute('aria-valuenow', progress);
            progressFill.offsetHeight;
            console.log('Progresso atualizado: ', oldWidth, '→', progress, '%');
        }

        const progressText = document.querySelector('#progress-percentage, [data-gamification="progress-text"]');
        if (progressText) {
            progressText.textContent = progress;
        }

        // Desafio
        const dailyChallenge = this.gamification.getDailyChallenge();
        this.updateChallengeUI(dailyChallenge);

        this.renderBadges();
        this.renderRanking();

        // Próximo info
        this.updateNextInfo();

        console.log('✅ Sidebar updateUI concluída - todos elementos processados');
    }

    updateNextInfo() {
        const nextBadgeEl = document.getElementById('next-badge-info');
        const nextMilestoneEl = document.getElementById('next-milestone-info');

        if (nextBadgeEl) {
            const unlocked = this.gamification.getUnlockedBadges();
            const nextBadge = this.gamification.getBadgeDefinitions().find(b => !unlocked.some(u => u.id === b.id));
            nextBadgeEl.textContent = nextBadge ? nextBadge.requirement : 'Todos desbloqueados!';
        }

        if (nextMilestoneEl) {
            const points = this.gamification.getPoints();
            const nextMilestone = this.gamification.getMilestoneDefinitions().find(m => points < m.threshold && !this.gamification.getState().milestones.includes(m.threshold));
            nextMilestoneEl.textContent = nextMilestone ? nextMilestone.message : 'Todos atingidos!';
        }
    }
/*
    showDashboard() {
        const state = this.gamification.getState();
        const metrics = this.analytics.getMetrics();
        const dashboardInfo = `📊 DASHBOARD\nPontos: ${state.points}\nBadges: ${state.badges.length}/7\nPáginas: ${state.pagesVisited.length}\nMultiplicador: x${state.multiplier}\nDesafio: ${state.dailyChallenge.completed ? 'Completado' : `${state.dailyChallenge.pagesVisitedToday}/3`}\n\n📈 ANALYTICS\nSessões: ${metrics.totalSessions || 0}\nTempo: ${metrics.sessionDuration || 0}s\nEventos: ${metrics.totalEvents || 0}`;
        alert(dashboardInfo);
        console.table({ ...state, ...metrics });
    }*/

    showDashboard() {
        const dashboardModal = document.getElementById('analytics-dashboard-modal');
        const dashboardContent = document.getElementById('analytics-dashboard-content');
        if (dashboardModal && dashboardContent) {
            dashboardContent.innerHTML = `
                <button id="close-analytics-dashboard" style="position:absolute; top:10px; right:10px;">Fechar</button>
                ${this.analytics.createDashboardHTML()}
            `;
            dashboardModal.style.display = 'flex';

            // Fechar ao clicar no botão
            document.getElementById('close-analytics-dashboard').onclick = () => {
                dashboardModal.style.display = 'none';
            };
        } else {
            // Fallback para alert se container não existir
            const metrics = this.analytics.getMetrics();
            alert(JSON.stringify(metrics, null, 2));
        }
    }    

}

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SidebarManager());
} else {
    new SidebarManager();
}