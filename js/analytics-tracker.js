/**
 * ANALYTICS TRACKER
 * Rastreia eventos de gamificação, pontos, badges e interações
 * Fornece dashboard com métricas em tempo real
 */

class AnalyticsTracker {
    constructor() {
        this.events = [];
        this.sessionStartTime = Date.now();
        this.sessionId = this._generateSessionId();
        this.totalTimeKey = 'totalAppTime';

        // Carrega eventos salvos
        this.loadEvents();

        // Salva tempo total ao sair da página
        window.addEventListener('beforeunload', () => this.saveSessionTime());
    }

    saveSessionTime() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000); // segundos
        const prevTotal = parseInt(localStorage.getItem(this.totalTimeKey) || '0', 10);
        localStorage.setItem(this.totalTimeKey, prevTotal + sessionDuration);
    }

    saveSessionTime() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000); // segundos
        const prevTotal = parseInt(localStorage.getItem(this.totalTimeKey) || '0', 10);
        localStorage.setItem(this.totalTimeKey, prevTotal + sessionDuration);
    }
    /**
     * Gera ID único de sessão
     */
    _generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Registra um evento
     * @param {string} eventName - Nome do evento
     * @param {object} metadata - Dados adicionais
     */
    track(eventName, metadata = {}) {
        const event = {
            id: this._generateEventId(),
            name: eventName,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            metadata: metadata,
            userAgent: navigator.userAgent
        };

        this.events.push(event);
        this.saveEvents();

        // Log em desenvolvimento
        // if (process.env.NODE_ENV !== 'production') { // Descomentar em ambiente de desenvolvimento
        //     console.log(`[ANALYTICS] ${eventName}`, metadata);
        // }

        return event.id;
    }

    /**
     * Gera ID único para evento
     */
    _generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Salva eventos no localStorage
     */
    saveEvents() {
        try {
            const limit = 1000; // Máximo de eventos para evitar sobrecarga
            const eventsToSave = this.events.slice(-limit); // Mantém apenas os últimos 'limit' eventos
            localStorage.setItem('analytics-events', JSON.stringify(eventsToSave));
        } catch (e) {
            console.warn('Falha ao salvar eventos de analytics', e);
        }
    }

    /**
     * Carrega eventos do localStorage
     */
    loadEvents() {
        try {
            const saved = localStorage.getItem('analytics-events');
            this.events = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Falha ao carregar eventos de analytics', e);
            this.events = [];
        }
    }

    /**
     * Obtém métricas de desempenho
     */
    getMetrics() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);

        const pointsEvents = this.events.filter(e => e.name === 'points_earned');
        const badgeEvents = this.events.filter(e => e.name === 'badge_unlocked');
        const milestoneEvents = this.events.filter(e => e.name === 'milestone_reached');
        const pageVisitEvents = this.events.filter(e => e.name === 'page_visit');

        let totalPoints = 0;
        pointsEvents.forEach(e => {
            totalPoints += e.metadata.pointsEarned || 0; // Usar pointsEarned do metadata
        });

        // Calcula evento mais frequente
        const eventCounts = {};
        this.events.forEach(e => {
            eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
        });

        const mostCelebrated = Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));
        
        const totalAppTime = parseInt(localStorage.getItem(this.totalTimeKey) || '0', 10);

        return {
            sessionDuration: sessionDuration,
            totalPoints: totalPoints,
            totalEvents: this.events.length,
            badgesUnlocked: badgeEvents.length,
            milestonesAchieved: milestoneEvents.length,
            pagesVisited: pageVisitEvents.length,
            pointsEarnedEvents: pointsEvents.length,
            mostCelebrated: mostCelebrated,
            averagePointsPerEvent: pointsEvents.length > 0 ? Math.round(totalPoints / pointsEvents.length) : 0,
            totalAppTime
        };
    }

    /**
     * Obtém eventos de um tipo específico
     */
    getEventsByType(eventName, limit = 10) {
        return this.events
            .filter(e => e.name === eventName)
            .slice(-limit)
            .reverse();
    }

    /**
     * Obtém timeline de eventos
     */
    getTimeline(limit = 50) {
        return this.events
            .slice(-limit)
            .reverse()
            .map(e => ({
                name: e.name,
                timestamp: new Date(e.timestamp).toLocaleTimeString(),
                metadata: e.metadata
            }));
    }

    /**
     * Exporta dados para JSON
     */
    exportJSON() {
        const metrics = this.getMetrics();
        const data = {
            sessionId: this.sessionId,
            exportDate: new Date().toISOString(),
            metrics: metrics,
            events: this.events
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Exporta dados para CSV
     */
    exportCSV() {
        const headers = ['Event Name', 'Timestamp', 'Session Duration (s)', 'Metadata'];
        const rows = this.events.map(e => [
            e.name,
            new Date(e.timestamp).toLocaleString(),
            Math.floor((e.timestamp - this.sessionStartTime) / 1000),
            JSON.stringify(e.metadata)
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')) // Escapa aspas duplas
        ].join('\n');

        return csv;
    }

    /**
     * Limpa eventos (resetar analytics)
     */
    clearEvents() {
        this.events = [];
        this.sessionStartTime = Date.now();
        this.sessionId = this._generateSessionId();
        localStorage.removeItem('analytics-events');
    }

    /**
     * Obtém estatísticas por tipo de evento
     */
    getStatisticsByEventType() {
        const stats = {};

        this.events.forEach(e => {
            if (!stats[e.name]) {
                stats[e.name] = {
                    count: 0,
                    lastOccurrence: null,
                    data: []
                };
            }
            stats[e.name].count++;
            stats[e.name].lastOccurrence = new Date(e.timestamp);
            stats[e.name].data.push(e.metadata);
        });

        return stats;
    }

    /**
     * Calcula duração média entre eventos
     */
    getAverageEventInterval() {
        if (this.events.length < 2) return 0;

        let totalInterval = 0;
        for (let i = 1; i < this.events.length; i++) {
            totalInterval += this.events[i].timestamp - this.events[i - 1].timestamp;
        }

        return Math.floor(totalInterval / (this.events.length - 1));
    }

    /**
     * Gera relatório completo
     */
    generateReport() {
        const metrics = this.getMetrics();
        const statsByType = this.getStatisticsByEventType();

        const report = {
            title: 'Relatório de Analytics',
            generatedAt: new Date().toLocaleString(),
            sessionDuration: `${metrics.sessionDuration}s`,
            summary: {
                totalEvents: metrics.totalEvents,
                totalPoints: metrics.totalPoints,
                badgesUnlocked: metrics.badgesUnlocked,
                milestonesAchieved: metrics.milestonesAchieved
            },
            eventBreakdown: statsByType,
            topEvents: metrics.mostCelebrated,
            performance: {
                averageEventInterval: `${this.getAverageEventInterval()}ms`,
                averagePointsPerEvent: metrics.averagePointsPerEvent
            }
        };

        return report;
    }

    /**
     * Cria dashboard em HTML (simplificado para demonstração)
     */
    createDashboardHTML() {
        const metrics = this.getMetrics();
        const timeline = this.getTimeline(5);

        return `
            <h2>📊 Dashboard de Analytics</h2>
            <div class="dashboard-grid">
                <div class="metric-card">
                    <span class="metric-value">${metrics.sessionDuration || 0}s</span>
                    <span class="metric-label">Duração da Sessão</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${metrics.totalAppTime !== undefined ? metrics.totalAppTime : 0}s</span>
                    <span class="metric-label">Tempo Total no App</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${metrics.totalPoints || 0}</span>
                    <span class="metric-label">Pontos Ganhos</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${metrics.badgesUnlocked || 0}</span>
                    <span class="metric-label">Badges Desbloqueados</span>
                </div>
                <div class="metric-card">
                    <span class="metric-value">${metrics.milestonesAchieved || 0}</span>
                    <span class="metric-label">Milestones Alcançados</span>
                </div>
            </div>
            <h3>⏱️ Últimos Eventos</h3>
            <ul class="timeline-list">
                ${timeline.map(e => `
                    <li>
                        <strong>${e.name}</strong> - ${e.timestamp}
                        <pre style="display:inline;">${JSON.stringify(e.metadata)}</pre>
                    </li>
                `).join('')}
            </ul>
        `;
    }
}

// Instância global
const analyticsTracker = new AnalyticsTracker();