/**
 * CELEBRATION ANIMATION SYSTEM
 * Sistema modular de animações de celebração com suporte a múltiplos tipos
 * Compatível com Chrome, Firefox, Safari, Edge
 */

class CelebrationAnimation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.animationDuration = 3000; // 3 segundos
        this.animationTimeout = null;

        // Validação
        if (!this.container) {
            console.error(`Container ${containerId} não encontrado`);
            return;
        }

        // Configurações padrão
        this.config = {
            enableSound: true,
            enableVibration: true,
            enableParticles: true
        };

        this.init();
    }

    /**
     * Inicializa a instância
     */
    init() {
        this.messageEl = this.container.querySelector('.celebration-message');
        this.pointsEl = this.container.querySelector('.points-display');
        this.particlesContainer = this.container.querySelector('.particles-container');

        if (!this.messageEl || !this.pointsEl || !this.particlesContainer) {
            console.warn('Elementos de celebração não encontrados');
        }
    }

    /**
     * Exibe a animação de celebração
     * @param {string} message - Mensagem principal
     * @param {number} points - Pontos ganhos
     * @param {string} type - Tipo de celebração
     */
    show(message, points, type = 'points') {
        if (!this.container) return;

        // Limpa animação anterior
        this._cancel();

        // Define configurações baseadas no tipo
        const config = this._getConfigByType(type);

        // Mostra container
        this.container.classList.add('active');

        // Anima mensagem
        this._animateMessage(message, config);

        // Anima pontos
        this._animatePoints(points, config);

        // Cria partículas
        if (config.includeParticles) {
            this._createParticles(type, config);
        }

        // Efeitos adicionais
        if (config.enableSound) this._playSound(type);
        if (config.enableVibration) this._vibrate();

        // Auto-hide após duração
        this.animationTimeout = setTimeout(() => this._hide(), config.duration);
    }

    /**
     * Obtém configuração baseada no tipo de celebração
     */
    _getConfigByType(type) {
        const configs = {
            points: {
                intensity: 'medium',
                duration: 2500,
                particleCount: 80,
                particleType: 'confetti',
                color: '#FFD700',
                includeParticles: true,
                enableSound: true,
                enableVibration: true
            },
            badge: {
                intensity: 'high',
                duration: 3500,
                particleCount: 150,
                particleType: 'confetti-varied',
                color: '#FF1493',
                includeParticles: true,
                enableSound: true,
                enableVibration: true
            },
            milestone: {
                intensity: 'high',
                duration: 4000,
                particleCount: 200,
                particleType: 'confetti-complete',
                color: '#FF69B4',
                includeParticles: true,
                enableSound: true,
                enableVibration: true
            },
            confetti: {
                intensity: 'high',
                duration: 3000,
                particleCount: 150,
                particleType: 'confetti',
                color: 'rainbow',
                includeParticles: true,
                enableSound: true,
                enableVibration: true
            },
            stars: {
                intensity: 'medium',
                duration: 2500,
                particleCount: 100,
                particleType: 'stars',
                color: '#FFD700',
                includeParticles: true,
                enableSound: true,
                enableVibration: true
            },
            emojis: {
                intensity: 'medium',
                duration: 3000,
                particleCount: 60,
                particleType: 'emojis',
                color: 'mixed',
                includeParticles: true,
                enableSound: true,
                enableVibration: true
            }
        };

        return configs[type] || configs.points;
    }

    /**
     * Anima a mensagem de celebração
     */
    _animateMessage(message, config) {
        if (!this.messageEl) return;

        this.messageEl.textContent = message;
        this.messageEl.classList.remove('show');

        // Força reflow para reiniciar animação
        void this.messageEl.offsetWidth;

        this.messageEl.classList.add('show');
        this.messageEl.style.animation = `messageEnter 0.6s ease-out`;
    }

    /**
     * Anima a contagem de pontos
     */
    _animatePoints(targetPoints, config) {
        if (!this.pointsEl) return;

        this.pointsEl.textContent = '0';
        this.pointsEl.classList.remove('show');

        // Força reflow
        void this.pointsEl.offsetWidth;

        this.pointsEl.classList.add('show');
        this.pointsEl.style.animation = `pointsEnter 0.6s ease-out`;

        // Anima contagem com requestAnimationFrame
        const startTime = performance.now();
        const duration = 1500;

        const updatePoints = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentPoints = Math.floor(progress * targetPoints);

            this.pointsEl.textContent = `+${currentPoints}`;

            if (progress < 1) {
                requestAnimationFrame(updatePoints);
            } else {
                this.pointsEl.textContent = `+${targetPoints}`;
            }
        };

        requestAnimationFrame(updatePoints);
    }

    /**
     * Cria partículas animadas
     */
    _createParticles(type, config) {
        if (!this.particlesContainer) return;

        const count = this._getParticleCount(config.intensity);

        for (let i = 0; i < count; i++) {
            const particle = this._createParticle(type, config);
            this.particlesContainer.appendChild(particle);
        }
    }

    /**
     * Cria uma partícula individual
     */
    _createParticle(type, config) {
        const particle = document.createElement('div');
        particle.classList.add('particle', `particle-${type}`);

        // Posição aleatória
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight;

        // Distância e ângulo
        const angle = Math.random() * Math.PI * 2;
        const velocity = 3 + Math.random() * 6;
        const endX = startX + Math.cos(angle) * velocity * 100;
        const endY = startY - Math.random() * (window.innerHeight * 0.7);

        // Rotação
        const rotation = Math.random() * 360;

        // Estilização
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.setProperty('--end-x', `${endX - startX}px`);
        particle.style.setProperty('--end-y', `${endY - startY}px`);
        particle.style.setProperty('--rotation', `${rotation}deg`);

        // Conteúdo baseado no tipo
        if (type === 'emojis') {
            const emojis = ['🎉', '🎊', '🎈', '🎁', '⭐', '🌟'];
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.fontSize = `${14 + Math.random() * 16}px`;
        } else if (type === 'stars') {
            particle.textContent = '⭐';
            particle.style.fontSize = `${12 + Math.random() * 12}px`;
        } else {
            particle.style.width = `${4 + Math.random() * 8}px`;
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = this._getParticleColor(config, type);
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0px';
        }

        // Animação
        const duration = 2 + Math.random() * 1;
        particle.style.setProperty('--duration', `${duration}s`);
        particle.style.animation = `particleFall ${duration}s ease-out forwards`;

        return particle;
    }

    /**
     * Obtém cor da partícula
     */
    _getParticleColor(config, type) {
        if (config.color === 'rainbow') {
            const colors = ['#FF1493', '#FFD700', '#00CED1', '#32CD32', '#FF69B4', '#87CEEB'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else if (config.color === 'mixed') {
            const colors = ['#FFD700', '#FF1493', '#00CED1', '#32CD32'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
        return config.color;
    }

    /**
     * Obtém contagem de partículas baseada na intensidade
     */
    _getParticleCount(intensity) {
        const counts = {
            low: 30,
            medium: 80,
            high: 150
        };
        return counts[intensity] || 80;
    }

    /**
     * Reproduz som de celebração
     */
    _playSound(type) {
        if (!this.config.enableSound) return;

        try {
            // Simula sons usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;

            const sounds = {
                points: { freq: 800, duration: 0.1 },
                badge: { freq: 1200, duration: 0.2 },
                milestone: { freq: 600, duration: 0.3 },
                confetti: { freq: 1000, duration: 0.15 },
                stars: { freq: 1100, duration: 0.15 },
                emojis: { freq: 900, duration: 0.1 }
            };

            const sound = sounds[type] || sounds.points;
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.frequency.value = sound.freq;
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + sound.duration);

            oscillator.start(now);
            oscillator.stop(now + sound.duration);
        } catch (e) {
            // Fallback silencioso se Web Audio não estiver disponível
        }
    }

    /**
     * Simula vibração do dispositivo
     */
    _vibrate() {
        if (!this.config.enableVibration) return;

        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    }

    /**
     * Oculta a animação
     */
    _hide() {
        if (!this.container) return;

        this.container.classList.remove('active');
        this._cleanupParticles();
    }

    /**
     * Limpa partículas do DOM
     */
    _cleanupParticles() {
        if (!this.particlesContainer) return;

        while (this.particlesContainer.firstChild) {
            this.particlesContainer.removeChild(this.particlesContainer.firstChild);
        }
    }

    /**
     * Cancela animação em andamento
     */
    _cancel() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
        this._hide();
    }

    /**
     * Configura opções globalmente
     */
    setConfig(options) {
        this.config = { ...this.config, ...options };
    }

    /**
     * Obtém configuração atual
     */
    getConfig() {
        return { ...this.config };
    }
}

// Instância global (será criada quando o container existir)
let celebrationAnimation = null;