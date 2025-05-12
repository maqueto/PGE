/**
 * =========================================================================
 * JavaScript para o Sistema Global de Combate à Fome (SGCF) - Versão Complexa
 * =========================================================================
 *
 * Este script adiciona interatividade, manipulação dinâmica de conteúdo,
 * simulação de chamadas API, inicialização de componentes (mapa/gráficos simulados),
 * validação de formulários e atualizações de acessibilidade.
 * Organizado em módulos/objetos para melhor estrutura.
 */

(function SGCF_App(window, document, undefined) {
  'use strict'; // Habilita modo estrito para melhor qualidade de código

  // --- 0. Configuração e Estado Global (Simulado) ---
  const config = {
    apiBaseUrl: '/api/sgcf/v1', // URL base da API (fictícia)
    mapProvider: 'SimulatedMapProvider', // Ex: 'Leaflet', 'MapboxGL'
    chartProvider: 'SimulatedChartProvider', // Ex: 'Chart.js', 'D3'
    debounceDelay: 300, // Delay para debounce (ms)
    throttleInterval: 500, // Intervalo para throttle (ms)
    themeLocalStorageKey: 'sgcf_theme',
    mapDefaults: {
      center: [0, 0], // Lat, Lng
      zoom: 2,
      minZoom: 1,
      maxZoom: 18,
      criticalColor: '#dc3545',
      highColor: '#fd7e14',
      mediumColor: '#ffc107',
      lowColor: '#28a745',
    },
    alertFadeInDelayIncrement: 150, // Atraso incremental para fade-in de alertas (ms)
  };

  let appState = {
    currentTheme: localStorage.getItem(config.themeLocalStorageKey) || 'light',
    isMenuOpen: false,
    currentFilters: {
      dashboardDate: new Date().toISOString().split('T')[0],
      projectRegion: 'all',
      projectType: 'all',
      // ... outros filtros
    },
    mapInstance: null,
    charts: {}, // Armazenar instâncias de gráficos simulados
    activeActionTab: 'tab-donate',
    // ... mais estados conforme necessário
  };

  // --- 1. Módulo de Utilitários ---
  const Utils = {
    /**
     * Debounce: Atrasa a execução de uma função até que um certo tempo tenha passado sem ela ser chamada.
     * @param {Function} func Função a ser executada.
     * @param {number} delay Tempo de espera em ms.
     * @returns {Function} Função com debounce aplicado.
     */
    debounce: (func, delay = config.debounceDelay) => {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
        }, delay);
      };
    },

    /**
     * Throttle: Garante que uma função não seja executada mais de uma vez em um intervalo de tempo.
     * @param {Function} func Função a ser executada.
     * @param {number} limit Intervalo mínimo em ms.
     * @returns {Function} Função com throttle aplicado.
     */
    throttle: (func, limit = config.throttleInterval) => {
      let inThrottle;
      let lastResult;
      return function(...args) {
        if (!inThrottle) {
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
          lastResult = func.apply(this, args);
        }
        return lastResult;
      };
    },

    /**
     * Simula uma chamada de API com fetch (ou retorna dados mockados).
     * @param {string} endpoint Caminho da API (ex: '/dashboard').
     * @param {object} options Opções do Fetch (method, headers, body).
     * @returns {Promise<object>} Promessa com os dados da resposta.
     */
    fetchData: async (endpoint, options = {}) => {
      const url = `${config.apiBaseUrl}${endpoint}`;
      console.log(`[API Call] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');

      // --- SIMULAÇÃO DE API ---
      // Em um app real, usaríamos fetch() aqui.
      // Vamos simular uma resposta com um pequeno delay.
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200)); // Delay aleatório

      // Mock de dados baseado no endpoint
      if (endpoint.startsWith('/dashboard')) {
        return Promise.resolve({
          success: true,
          data: {
            globalHungerIndex: 18.2 + (Math.random() - 0.5), // Adiciona variação
            peopleAffected: 811 + Math.floor(Math.random() * 10 - 5),
            fundingGap: 7.3 + (Math.random() - 0.5),
            fundingProgress: 65 + Math.floor(Math.random() * 10 - 5),
            activeProjects: 1245 + Math.floor(Math.random() * 20 - 10),
            lastUpdated: new Date().toISOString(),
            mapData: [ // Dados simulados para o mapa
              { id: 'AFR-SAH', lat: 15, lng: 0, value: 38.5, label: 'Sahel', severity: 'critical' },
              { id: 'ASIA-SE', lat: 10, lng: 110, value: 15.1, label: 'Sudeste Asiático', severity: 'moderate' },
              { id: 'LATAM-CA', lat: 15, lng: -90, value: 22.0, label: 'América Central', severity: 'high' },
              { id: 'MENA', lat: 25, lng: 30, value: 28.9, label: 'Oriente Médio/N. África', severity: 'high' },
              // ... mais pontos
            ],
             alerts: [ // Alertas simulados
                { id: 'ALERT001', region: 'Sahel', level: 'critical', message: 'Seca severa impacta colheitas. Necessidade imediata de ajuda.', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
                { id: 'ALERT002', region: 'Iêmen', level: 'high', message: 'Acesso humanitário restrito. Voluntários de logística necessários.', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
                { id: 'ALERT003', region: 'Chifre da África', level: 'critical', message: 'Surto de Gafanhotos. Risco iminente.', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
                { id: 'ALERT004', region: 'América Central', level: 'medium', message: 'Impacto pós-furacão. Necessidade de sementes.', timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
             ]
          }
        });
      } else if (endpoint.startsWith('/projects')) {
        // Simula filtro
         const allProjects = [
             { id: 'PROJAFR05', title: 'Controle de Gafanhotos no Chifre da África', region: 'AFR-SAH', type: 'agriculture_support', description: 'Apoio a comunidades locais com monitoramento...', fundingProgress: 75, fundingGoal: 500000, image: '/assets/images/project-locust.jpg' },
             { id: 'PROJLATAM02', title: 'Alimentação Escolar na América Central', region: 'LATAM-CA', type: 'school_feeding', description: 'Garantir refeições nutritivas diárias...', fundingProgress: 90, fundingGoal: 300000, image: '/assets/images/project-school-meal.jpg' },
             { id: 'PROJASIA01', title: 'Sementes Resilientes no Sudeste Asiático', region: 'ASIA-SE', type: 'agriculture_support', description: 'Distribuição de sementes adaptadas...', fundingProgress: 60, fundingGoal: 400000, image: '/assets/images/project-seeds.jpg' }, // Imagem fictícia
             { id: 'PROJMENA03', title: 'Ajuda Emergencial no Iêmen', region: 'MENA', type: 'emergency_relief', description: 'Kits de alimentos e higiene para famílias deslocadas.', fundingProgress: 85, fundingGoal: 1000000, image: '/assets/images/project-emergency.jpg' }, // Imagem fictícia
         ];
         // Aplica filtros (simplificado)
         const regionFilter = options.params?.region || 'all';
         const typeFilter = options.params?.type || 'all';
         const filteredProjects = allProjects.filter(p =>
             (regionFilter === 'all' || p.region === regionFilter) &&
             (typeFilter === 'all' || p.type === typeFilter)
         );
         return Promise.resolve({ success: true, data: filteredProjects });

      } else if (endpoint.startsWith('/process-donation') || endpoint.startsWith('/process-volunteer') || endpoint.startsWith('/subscribe-newsletter')) {
        // Simula sucesso no envio de formulário
        console.log(`[API Simulation] Form submitted to ${endpoint}:`, options.body ? JSON.parse(options.body) : {});
        return Promise.resolve({ success: true, message: 'Dados recebidos com sucesso!' });
      }
      // --- FIM DA SIMULAÇÃO ---

      // Em caso de endpoint não simulado ou erro real:
      console.error(`[API Simulation] Endpoint ${endpoint} not mocked or fetch error.`);
      return Promise.reject(new Error(`Falha ao buscar dados de ${endpoint}`));
    },

    /**
     * Formata uma data/timestamp para exibição amigável.
     * @param {string | Date | number} dateInput Data a formatar.
     * @param {object} options Opções para Intl.DateTimeFormat.
     * @returns {string} Data formatada.
     */
    formatDate: (dateInput, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
      try {
        const date = new Date(dateInput);
        // Detecta se é um timestamp recente para formatação relativa (ex: 'Ontem', '2 dias atrás')
        const now = new Date();
        const diffSeconds = (now.getTime() - date.getTime()) / 1000;
        const diffDays = diffSeconds / (60 * 60 * 24);

        if (diffDays < 1 && date.getDate() === now.getDate()) return 'Hoje';
        if (diffDays < 2 && date.getDate() === now.getDate() - 1) return 'Ontem';
        if (diffDays < 7) return `${Math.floor(diffDays)} dias atrás`;

        return new Intl.DateTimeFormat('pt-BR', options).format(date);
      } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        return String(dateInput); // Retorna original em caso de erro
      }
    },

    /**
     * Formata um número para exibição amigável.
     * @param {number} num Número a formatar.
     * @param {object} options Opções para Intl.NumberFormat.
     * @returns {string} Número formatado.
     */
    formatNumber: (num, options = { style: 'decimal', maximumFractionDigits: 1 }) => {
       try {
           return new Intl.NumberFormat('pt-BR', options).format(num);
       } catch (e) {
           console.error("Error formatting number:", num, e);
           return String(num);
       }
    },

    /**
     * Gera um ID único simples (não UUID V4 real).
     * @returns {string} ID pseudo-único.
     */
    generateId: (prefix = 'id-') => {
        return prefix + Math.random().toString(36).substring(2, 9);
    }
  };

  // --- 2. Módulo de Utilitários DOM ---
  const DOM = {
    /**
     * Atalho para document.querySelector.
     * @param {string} selector Seletor CSS.
     * @param {Element} parent Elemento pai (opcional, default: document).
     * @returns {Element | null} Elemento encontrado ou null.
     */
    qs: (selector, parent = document) => parent.querySelector(selector),

    /**
     * Atalho para document.querySelectorAll.
     * @param {string} selector Seletor CSS.
     * @param {Element} parent Elemento pai (opcional, default: document).
     * @returns {NodeListOf<Element>} Lista de nós encontrada.
     */
    qsa: (selector, parent = document) => parent.querySelectorAll(selector),

    /**
     * Cria um novo elemento HTML com opções.
     * @param {string} tag Tag HTML (ex: 'div').
     * @param {object} options Opções: { textContent, className, id, attributes: {src: url}, children: [el1, el2] }.
     * @returns {Element} O elemento criado.
     */
    createEl: (tag, options = {}) => {
      const el = document.createElement(tag);
      if (options.textContent) el.textContent = options.textContent;
      if (options.className) el.className = options.className;
      if (options.id) el.id = options.id;
      if (options.attributes) {
        for (const key in options.attributes) {
          el.setAttribute(key, options.attributes[key]);
        }
      }
      if (options.children) {
        options.children.forEach(child => el.appendChild(child));
      }
      return el;
    },

    /**
     * Delegação de eventos: Anexa um listener a um elemento pai para capturar eventos de seletores filhos.
     * @param {Element} target Elemento pai onde anexar o listener.
     * @param {string} selector Seletor CSS para os elementos filhos.
     * @param {string} eventType Tipo de evento (ex: 'click').
     * @param {Function} handler Função a ser executada quando o evento ocorrer no seletor.
     */
    delegate: (target, selector, eventType, handler) => {
      target.addEventListener(eventType, (event) => {
        const targetElement = event.target.closest(selector);
        if (targetElement && target.contains(targetElement)) {
          handler.call(targetElement, event); // `this` dentro do handler será o elemento que corresponde ao seletor
        }
      });
    },

    /**
     * Mostra um elemento (removendo 'hidden' e/ou adicionando classe).
     * @param {Element | string} elementOrSelector Elemento ou seletor.
     * @param {string} displayStyle Valor para 'display' (opcional, default: 'block').
     */
    show: (elementOrSelector, displayStyle = 'block') => {
        const element = typeof elementOrSelector === 'string' ? DOM.qs(elementOrSelector) : elementOrSelector;
        if (element) {
            element.hidden = false;
            element.style.display = displayStyle; // Garante visibilidade
             // Força reflow para transição funcionar se display era none
             // void element.offsetWidth;
             element.classList.add('is-visible');
             element.classList.remove('is-hidden');
             // Pode precisar de ajuste dependendo da implementação de fade (CSS)
        }
    },

     /**
     * Esconde um elemento (adicionando 'hidden' e/ou removendo classe).
     * @param {Element | string} elementOrSelector Elemento ou seletor.
     */
    hide: (elementOrSelector) => {
         const element = typeof elementOrSelector === 'string' ? DOM.qs(elementOrSelector) : elementOrSelector;
         if (element) {
             element.classList.add('is-hidden');
             element.classList.remove('is-visible');
             // Adiciona hidden=true após a transição (se houver)
             // Para simplificar, vamos adicionar imediatamente
             element.hidden = true;
             element.style.display = 'none'; // Garante que está escondido
         }
    }
  };

  // --- 3. Módulo de Componentes UI Genéricos ---
  const UI = {
    /** Inicializa o menu mobile (toggle). */
    initMobileMenu: () => {
      const menuToggle = DOM.qs('.menu-toggle');
      const primaryMenu = DOM.qs('#primary-menu');

      if (!menuToggle || !primaryMenu) return;

      menuToggle.addEventListener('click', () => {
        appState.isMenuOpen = !appState.isMenuOpen;
        menuToggle.setAttribute('aria-expanded', appState.isMenuOpen);
        primaryMenu.classList.toggle('is-open', appState.isMenuOpen); // Usar classe para controlar visibilidade via CSS
        // Alternativamente, manipular 'display' diretamente (menos ideal com transições)
        // primaryMenu.style.display = appState.isMenuOpen ? 'block' : 'none';
      });

      // Fecha o menu se clicar fora (opcional)
      document.addEventListener('click', (event) => {
          if (appState.isMenuOpen && !primaryMenu.contains(event.target) && !menuToggle.contains(event.target)) {
              appState.isMenuOpen = false;
              menuToggle.setAttribute('aria-expanded', 'false');
              primaryMenu.classList.remove('is-open');
          }
      });
    },

    /** Inicializa dropdowns genéricos (navegação, usuário, idioma). */
    initDropdowns: (containerSelector) => {
      DOM.qsa(containerSelector).forEach(container => {
        const toggle = container.querySelector('[aria-haspopup="true"]');
        const menu = container.querySelector('ul'); // Assume que o menu é um UL

        if (!toggle || !menu) return;

        // Fecha dropdowns abertos se clicar fora
        const closeDropdown = () => {
            toggle.setAttribute('aria-expanded', 'false');
            menu.classList.remove('is-open'); // Usar classe para controlar via CSS
            // menu.style.opacity = '0'; menu.style.visibility = 'hidden'; // Controle direto
        };

        toggle.addEventListener('click', (event) => {
          event.stopPropagation(); // Impede que o clique feche imediatamente
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          closeAllDropdowns(container); // Fecha outros dropdowns
          toggle.setAttribute('aria-expanded', !isExpanded);
          menu.classList.toggle('is-open', !isExpanded);
          // menu.style.opacity = !isExpanded ? '1' : '0';
          // menu.style.visibility = !isExpanded ? 'visible' : 'hidden';
        });

        // Fecha com tecla ESC
        container.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDropdown();
                toggle.focus(); // Devolve o foco ao botão
            }
        });

        // Navegação por teclado dentro do dropdown (simplificado)
        const menuItems = DOM.qsa('a', menu);
        menuItems.forEach((item, index) => {
            item.addEventListener('keydown', (event) => {
                 if (event.key === 'ArrowDown' && index < menuItems.length - 1) {
                     event.preventDefault();
                     menuItems[index + 1].focus();
                 } else if (event.key === 'ArrowUp' && index > 0) {
                     event.preventDefault();
                     menuItems[index - 1].focus();
                 } else if (event.key === 'Home') {
                     event.preventDefault();
                     menuItems[0].focus();
                 } else if (event.key === 'End') {
                      event.preventDefault();
                      menuItems[menuItems.length - 1].focus();
                 } else if (event.key === 'Tab' && !event.shiftKey && index === menuItems.length - 1) {
                     closeDropdown(); // Fecha ao dar Tab no último item
                 } else if (event.key === 'Tab' && event.shiftKey && index === 0) {
                      closeDropdown(); // Fecha ao dar Shift+Tab no primeiro item
                 }
            });
        });
      });

       // Função auxiliar para fechar todos os dropdowns, exceto o atual
       const closeAllDropdowns = (currentContainer = null) => {
           DOM.qsa(containerSelector).forEach(container => {
               if (container !== currentContainer) {
                   const toggle = container.querySelector('[aria-haspopup="true"]');
                   const menu = container.querySelector('ul');
                   if (toggle && menu) {
                       toggle.setAttribute('aria-expanded', 'false');
                       menu.classList.remove('is-open');
                   }
               }
           });
       };

       // Fecha dropdowns se clicar fora de qualquer um deles
       document.addEventListener('click', () => {
            closeAllDropdowns();
       });
    },

    /** Inicializa sistema de abas (Action Center). */
    initTabs: (containerSelector) => {
      const tabContainer = DOM.qs(containerSelector);
      if (!tabContainer) return;

      const tabList = DOM.qs('[role="tablist"]', tabContainer);
      const tabs = DOM.qsa('[role="tab"]', tabList);
      const panels = DOM.qsa('[role="tabpanel"]', tabContainer);
      const activeLine = DOM.qs('.action-tabs::after'); // Linha móvel

      if (!tabs.length || !panels.length) return;

      // Função para ativar uma aba e seu painel
      const activateTab = (tabToActivate) => {
        tabs.forEach(tab => {
          const isSelected = tab === tabToActivate;
          tab.setAttribute('aria-selected', isSelected);
          tab.setAttribute('tabindex', isSelected ? '0' : '-1'); // Apenas a aba ativa é focável diretamente
        });

        panels.forEach(panel => {
          const controlledBy = panel.getAttribute('aria-labelledby');
          const shouldBeVisible = controlledBy === tabToActivate.id;
          panel.hidden = !shouldBeVisible;
          panel.setAttribute('tabindex', shouldBeVisible ? '0' : '-1');
          // Adiciona/remove classes para transição CSS (se houver)
          panel.classList.toggle('is-visible', shouldBeVisible);
          panel.classList.toggle('is-hidden', !shouldBeVisible);
        });

        // Atualiza a linha móvel (se existir)
        if (activeLine) {
            const tabRect = tabToActivate.getBoundingClientRect();
            const listRect = tabList.getBoundingClientRect();
            activeLine.style.width = `${tabRect.width}px`;
            activeLine.style.left = `${tabRect.left - listRect.left}px`;
        }

        appState.activeActionTab = tabToActivate.id; // Atualiza estado
      };

      // Adiciona listeners aos botões das abas
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          activateTab(tab);
        });

        // Navegação por teclado (Setas Esquerda/Direita)
        tab.addEventListener('keydown', (event) => {
          let currentTabIndex = Array.from(tabs).indexOf(event.currentTarget);
          let nextTabIndex = -1;

          if (event.key === 'ArrowRight') {
            nextTabIndex = (currentTabIndex + 1) % tabs.length;
          } else if (event.key === 'ArrowLeft') {
            nextTabIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
          } else if (event.key === 'Home') {
            nextTabIndex = 0;
          } else if (event.key === 'End') {
            nextTabIndex = tabs.length - 1;
          }

          if (nextTabIndex !== -1) {
            event.preventDefault(); // Impede scroll da página
            tabs[nextTabIndex].focus(); // Move o foco
            activateTab(tabs[nextTabIndex]); // Ativa a nova aba
          }
        });
      });

      // Ativa a primeira aba por padrão (ou a marcada como aria-selected="true" no HTML)
      const initiallySelected = DOM.qs('[role="tab"][aria-selected="true"]', tabList) || tabs[0];
      activateTab(initiallySelected);

       // Reajusta a linha ao redimensionar a janela
       if (activeLine) {
           window.addEventListener('resize', Utils.debounce(() => {
               const currentlySelected = DOM.qs('[role="tab"][aria-selected="true"]', tabList);
               if (currentlySelected) {
                    const tabRect = currentlySelected.getBoundingClientRect();
                    const listRect = tabList.getBoundingClientRect();
                    activeLine.style.width = `${tabRect.width}px`;
                    activeLine.style.left = `${tabRect.left - listRect.left}px`;
               }
           }));
       }
    },

    /**
     * Mostra um indicador de carregamento em um elemento.
     * @param {Element | string} elementOrSelector Elemento ou seletor onde mostrar o loading.
     */
    showLoading: (elementOrSelector) => {
      const element = typeof elementOrSelector === 'string' ? DOM.qs(elementOrSelector) : elementOrSelector;
      if (element) {
        // Remove loading anterior se houver
        const existingLoader = DOM.qs('.sgcf-loader', element);
        if(existingLoader) existingLoader.remove();

        const loader = DOM.createEl('div', {
          className: 'sgcf-loader',
          attributes: { 'aria-hidden': 'true' }, // Puramente visual
          innerHTML: '<div class="spinner"></div><span>Carregando...</span>' // Spinner CSS simples
        });
        // Adiciona estilos inline básicos para o loader (idealmente via CSS)
        loader.style.position = 'absolute';
        loader.style.inset = '0';
        loader.style.display = 'flex';
        loader.style.flexDirection = 'column';
        loader.style.justifyContent = 'center';
        loader.style.alignItems = 'center';
        loader.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loader.style.zIndex = '10';
        loader.querySelector('.spinner').style.cssText = `
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px; height: 36px; border-radius: 50%;
            border-left-color: var(--color-primary, #005a9c);
            animation: spin 1s ease infinite;`; // Reusa animação spin do CSS
        loader.querySelector('span').style.marginTop = 'var(--spacing-sm)';
        loader.querySelector('span').style.color = 'var(--color-text-base)';

        element.style.position = element.style.position || 'relative'; // Garante que o pai seja relativo
        element.appendChild(loader);
      }
    },

    /**
     * Esconde o indicador de carregamento de um elemento.
     * @param {Element | string} elementOrSelector Elemento ou seletor.
     */
    hideLoading: (elementOrSelector) => {
      const element = typeof elementOrSelector === 'string' ? DOM.qs(elementOrSelector) : elementOrSelector;
      const loader = DOM.qs('.sgcf-loader', element);
      if (loader) {
        loader.remove();
      }
    },

    /**
     * Exibe uma mensagem de erro para o usuário.
     * @param {string} message Mensagem de erro.
     * @param {Element | string} containerOrSelector Onde exibir a mensagem.
     * @param {boolean} isCritical Se o erro é crítico (para estilo).
     */
    displayFeedback: (message, containerOrSelector, type = 'error') => {
      const container = typeof containerOrSelector === 'string' ? DOM.qs(containerOrSelector) : containerOrSelector;
      if (!container) {
          console.error(`Feedback Container not found for message: ${message}`);
          alert(`${type === 'error' ? 'Erro' : 'Info'}: ${message}`); // Fallback
          return;
      }

      // Remove feedback anterior
      const existingFeedback = DOM.qs('.sgcf-feedback', container);
      if (existingFeedback) existingFeedback.remove();

      const feedbackId = Utils.generateId('feedback-');
      const feedbackEl = DOM.createEl('div', {
        id: feedbackId,
        className: `sgcf-feedback feedback-${type}`, // Classes para estilização CSS
        textContent: message,
        attributes: {
          role: type === 'error' ? 'alert' : 'status', // Papel ARIA
          'aria-live': type === 'error' ? 'assertive' : 'polite', // Anuncia imediatamente (erro) ou não (status)
        }
      });

      // Estilos básicos inline (idealmente via CSS)
      feedbackEl.style.padding = 'var(--spacing-md)';
      feedbackEl.style.margin = 'var(--spacing-md) 0';
      feedbackEl.style.borderRadius = 'var(--border-radius-md)';
      feedbackEl.style.border = '1px solid';
      if (type === 'error') {
          feedbackEl.style.backgroundColor = 'var(--color-secondary-light)';
          feedbackEl.style.borderColor = 'var(--color-secondary)';
          feedbackEl.style.color = 'var(--color-secondary-dark)';
      } else if (type === 'success') {
           feedbackEl.style.backgroundColor = 'var(--color-accent-light)';
           feedbackEl.style.borderColor = 'var(--color-accent)';
           feedbackEl.style.color = 'var(--color-accent-dark)';
      } else { // 'info' or other
           feedbackEl.style.backgroundColor = 'var(--color-info-light)';
           feedbackEl.style.borderColor = 'var(--color-info)';
           feedbackEl.style.color = 'var(--color-info-dark)';
      }

      container.prepend(feedbackEl); // Adiciona no início do container

      // Remove a mensagem após algum tempo (opcional)
       setTimeout(() => {
           feedbackEl.remove();
       }, type === 'error' ? 10000 : 5000); // Erros ficam mais tempo
    },

    /**
     * Atualiza uma região ARIA live para leitores de tela.
     * (Útil para anunciar atualizações de conteúdo dinâmico).
     * Cria a região se não existir.
     */
    updateLiveRegion: (message, politeness = 'polite') => {
      let liveRegion = DOM.qs('#sgcf-live-region');
      if (!liveRegion) {
        liveRegion = DOM.createEl('div', {
          id: 'sgcf-live-region',
          className: 'visually-hidden', // Esconde visualmente
          attributes: {
            'aria-live': politeness,
            'aria-atomic': 'true' // Anuncia toda a região
          }
        });
        document.body.appendChild(liveRegion);
      }
      liveRegion.textContent = message;
       // Limpa após um tempo para não acumular mensagens antigas
       setTimeout(() => { liveRegion.textContent = ''; }, 1000);
    },
  };

  // --- 4. Módulo de Serviço API (Simulado) ---
  const ApiService = {
    /** Busca dados do dashboard. */
    getDashboardData: async (params = {}) => {
      try {
          const query = new URLSearchParams(params).toString();
          const response = await Utils.fetchData(`/dashboard?${query}`);
          if (response.success) return response.data;
          throw new Error(response.message || 'Falha ao buscar dados do dashboard.');
      } catch (error) {
          console.error("Dashboard API Error:", error);
          throw error; // Re-throw para tratamento no chamador
      }
    },

     /** Busca lista de projetos com filtros. */
    getProjects: async (filters = {}) => {
      try {
          const response = await Utils.fetchData('/projects', { params: filters });
          if (response.success) return response.data;
          throw new Error(response.message || 'Falha ao buscar projetos.');
      } catch (error) {
           console.error("Projects API Error:", error);
           throw error;
      }
    },

    /** Envia dados do formulário de doação. */
    submitDonation: async (formData) => {
         try {
             const response = await Utils.fetchData('/process-donation', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(formData)
             });
             if (response.success) return response;
             throw new Error(response.message || 'Falha ao processar doação.');
         } catch (error) {
             console.error("Donation API Error:", error);
             throw error;
         }
    },

     /** Envia dados do formulário de voluntário. */
     submitVolunteerForm: async (formData) => {
         try {
             const response = await Utils.fetchData('/process-volunteer', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(formData)
             });
             if (response.success) return response;
             throw new Error(response.message || 'Falha ao enviar inscrição.');
         } catch (error) {
             console.error("Volunteer API Error:", error);
             throw error;
         }
     },

     /** Envia email para newsletter. */
     submitNewsletter: async (email) => {
         try {
             const response = await Utils.fetchData('/subscribe-newsletter', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email })
             });
             if (response.success) return response;
             throw new Error(response.message || 'Falha ao inscrever na newsletter.');
         } catch (error) {
              console.error("Newsletter API Error:", error);
              throw error;
         }
     }
     // ... outras chamadas API simuladas
  };

  // --- 5. Módulo Mapa Interativo (Simulado) ---
  class InteractiveMap {
    constructor(containerId, options = {}) {
      this.container = DOM.qs(`#${containerId}`);
      if (!this.container) {
        throw new Error(`Map container #${containerId} not found.`);
      }
      this.options = { ...config.mapDefaults, ...options };
      this.markers = []; // Armazenar referências aos marcadores (simulados)
      this.mapInstance = null; // Referência à instância real do mapa (ex: Leaflet)

      console.log(`[${config.mapProvider}] Initializing map in #${containerId}`, this.options);
      this.container.innerHTML = `<p>Simulação do Mapa (${config.mapProvider}) - Carregando...</p>`;
      // Simula inicialização assíncrona
      setTimeout(() => this._finishInitialization(), 500);
    }

    _finishInitialization() {
       console.log(`[${config.mapProvider}] Map initialized.`);
       this.container.innerHTML = `<p style="margin:0; color: #999; font-size: 0.9em;">[${config.mapProvider} Simulador] Mapa pronto. Centro: ${this.options.center}, Zoom: ${this.options.zoom}</p>`;
       this.container.style.border = `2px solid ${config.mapDefaults.lowColor}`; // Indica sucesso
       this.container.style.background = '#f0f0f0';
       // Em um app real: this.mapInstance = L.map(this.container, this.options); L.tileLayer(...).addTo(this.mapInstance);
    }

    renderMarkers(data = []) {
       console.log(`[${config.mapProvider}] Rendering ${data.length} markers...`, data);
       // Limpa marcadores anteriores (simulado)
       this.markers = [];
       this.container.innerHTML += `<ul style="font-size: 0.8em; margin-top: 5px; max-height: 100px; overflow-y: auto; list-style:none; padding-left: 5px;">`;
       data.forEach(point => {
           const markerId = Utils.generateId('marker-');
           this.markers.push({ id: markerId, data: point });
           // Em um app real: marker = L.marker([point.lat, point.lng]).addTo(this.mapInstance); marker.bindPopup(point.label); this.markers.push(marker);
           this.container.innerHTML += `<li style="color: ${this._getSeverityColor(point.severity)};">📍 ${point.label} (${point.severity})</li>`;
       });
        this.container.innerHTML += `</ul>`;
       console.log(`[${config.mapProvider}] ${this.markers.length} markers rendered (simulated).`);
    }

    updateLayer(layerName) {
      console.log(`[${config.mapProvider}] Updating layer to: ${layerName}`);
      this.container.innerHTML += `<p style="font-size: 0.8em; color: blue; margin-top: 5px;">Camada '${layerName}' ativada (simulado).</p>`;
      // Em um app real: removeria/adicionaria layers (L.tileLayer, L.geoJSON, etc.)
    }

    showLoading() {
      console.log(`[${config.mapProvider}] Showing loading state.`);
      this.container.style.opacity = '0.5';
      // Em um app real: poderia adicionar um spinner sobre o mapa.
    }

    hideLoading() {
       console.log(`[${config.mapProvider}] Hiding loading state.`);
       this.container.style.opacity = '1';
    }

    _getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return this.options.criticalColor;
            case 'high': return this.options.highColor;
            case 'moderate': return this.options.mediumColor;
            case 'low': return this.options.lowColor;
            default: return '#666';
        }
    }
    // ... outros métodos do mapa (panTo, setZoom, etc.)
  }

  // --- 6. Módulo Gráfico (Simulado) ---
  class DataChart {
    constructor(canvasId, type, data, options = {}) {
      this.canvas = DOM.qs(`#${canvasId}`);
      if (!this.canvas) {
        throw new Error(`Chart canvas #${canvasId} not found.`);
      }
      this.type = type;
      this.data = data;
      this.options = options;
      this.chartInstance = null; // Referência à instância real (ex: Chart.js)

      console.log(`[${config.chartProvider}] Initializing chart #${canvasId}`, { type, data, options });
      this.canvas.innerHTML = `<p>Simulação de Gráfico (${config.chartProvider})</p><p>Tipo: ${type}</p>`;
      this.canvas.style.border = '1px dashed grey';
      this.canvas.style.padding = '10px';
      this.updateData(data); // Render inicial (simulado)
       // Em um app real: this.chartInstance = new Chart(this.canvas.getContext('2d'), { type, data, options });
    }

    updateData(newData) {
      console.log(`[${config.chartProvider}] Updating chart #${this.canvas.id} data...`, newData);
      this.data = newData;
      // Simula a atualização visualizando os dados
      this.canvas.innerHTML = `<p>Simulação de Gráfico (${config.chartProvider})</p><p>Tipo: ${this.type}</p><pre style="font-size:0.8em; max-height: 80px; overflow: auto;">${JSON.stringify(newData, null, 2)}</pre>`;
      // Em um app real: this.chartInstance.data = newData; this.chartInstance.update();
    }

    destroy() {
        console.log(`[${config.chartProvider}] Destroying chart #${this.canvas.id}`);
         // Em um app real: if(this.chartInstance) this.chartInstance.destroy();
         this.canvas.innerHTML = ''; // Limpa o placeholder
    }
    // ... outros métodos (addDataset, etc.)
  }

  // --- 7. Módulo de Manipulação de Formulários ---
  const FormHandler = {
    /** Inicializa o formulário de doação com suas complexidades. */
    initDonationForm: () => {
      const form = DOM.qs('#donation-form');
      if (!form) return;

      const donationTypeRadios = DOM.qsa('input[name="donation_type"]', form);
      const moneyFields = DOM.qs('#money-donation-fields', form);
      const goodsFields = DOM.qs('#goods-donation-fields', form);
      const amountInput = DOM.qs('#donation-amount', form);
      const presetAmountButtons = DOM.qsa('.preset-amounts button', form);
      const paymentMethodRadios = DOM.qsa('input[name="payment_method"]', form);
      const pixDetails = DOM.qs('#pix-details', form);
      const copyPixButton = DOM.qs('.copy-pix-key', pixDetails); // Seleciona o botão dentro de pix-details

      // 1. Alterna campos visíveis baseado no tipo de doação
      const toggleDonationFields = (selectedValue) => {
        DOM.hide(moneyFields);
        DOM.hide(goodsFields);
        // Esconde campos relacionados a pagamento se não for doação monetária
        const paymentGroup = DOM.qs('.payment-methods', form);
        if (paymentGroup) DOM.hide(paymentGroup);
        if (pixDetails) DOM.hide(pixDetails);


        if (selectedValue === 'money') {
            DOM.show(moneyFields);
            if (paymentGroup) DOM.show(paymentGroup); // Mostra métodos de pagamento
            // Verifica se PIX está selecionado para mostrar detalhes
             const pixRadio = DOM.qs('input[name="payment_method"][value="pix"]:checked', form);
             if (pixRadio && pixDetails) {
                DOM.show(pixDetails);
             }
        } else if (selectedValue === 'goods') {
          DOM.show(goodsFields);
        } else if (selectedValue === 'time') {
          // Poderia redirecionar para a aba de voluntariado ou mostrar mensagem
          const volunteerTabButton = DOM.qs('#tab-volunteer');
          if (volunteerTabButton) volunteerTabButton.click(); // Simula clique na aba
        }
      };

      donationTypeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
          toggleDonationFields(event.target.value);
        });
      });
      // Chama na inicialização para garantir estado correto
      const initialDonationType = DOM.qs('input[name="donation_type"]:checked', form)?.value;
      if(initialDonationType) toggleDonationFields(initialDonationType);

      // 2. Botões de valor pré-definido
      presetAmountButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (amountInput) {
            amountInput.value = button.dataset.amount;
            // Remove classe 'active' de outros botões e adiciona a este
            presetAmountButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
          }
        });
      });
      // Remove classe 'active' dos botões se o valor for digitado manualmente
      if(amountInput) {
          amountInput.addEventListener('input', () => {
              presetAmountButtons.forEach(btn => btn.classList.remove('active'));
          });
      }

      // 3. Alterna detalhes do PIX
      paymentMethodRadios.forEach(radio => {
          radio.addEventListener('change', (event) => {
              if(pixDetails) {
                  if(event.target.value === 'pix' && event.target.checked) {
                      DOM.show(pixDetails);
                  } else {
                      DOM.hide(pixDetails);
                  }
              }
          });
      });
      // Garante estado inicial correto do PIX
      const initialPayment = DOM.qs('input[name="payment_method"]:checked', form)?.value;
      if(pixDetails && initialPayment !== 'pix') DOM.hide(pixDetails);


      // 4. Copiar chave PIX
      if (copyPixButton) {
          copyPixButton.addEventListener('click', async (event) => {
              const keyElement = event.target.previousElementSibling; // Pega o <code>
              const key = keyElement?.textContent;
              if (key && navigator.clipboard) {
                  try {
                      await navigator.clipboard.writeText(key);
                      event.target.textContent = 'Copiado!';
                      setTimeout(() => { event.target.textContent = 'Copiar'; }, 2000);
                  } catch (err) {
                      console.error('Falha ao copiar chave PIX:', err);
                      event.target.textContent = 'Erro';
                       setTimeout(() => { event.target.textContent = 'Copiar'; }, 2000);
                  }
              } else {
                  console.warn('Clipboard API não disponível ou chave não encontrada.');
              }
          });
      } else if (pixDetails) {
           console.warn("Botão de copiar PIX não encontrado dentro de #pix-details.");
      }

      // 5. Submissão do formulário com validação e feedback
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede submissão padrão
        const feedbackContainer = form.querySelector('.form-actions') || form; // Onde mostrar feedback

        // Remove feedback antigo
        DOM.qs('.sgcf-feedback', feedbackContainer)?.remove();

        // Validação HTML5
        if (!form.checkValidity()) {
          form.reportValidity(); // Mostra balões de erro nativos
          UI.displayFeedback('Por favor, corrija os erros no formulário.', feedbackContainer, 'error');
          return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processando...';
        UI.showLoading(submitButton); // Mostra loading no botão

        try {
          const formData = FormHandler.serializeForm(form);
          const response = await ApiService.submitDonation(formData);
          UI.displayFeedback(response.message || 'Doação processada com sucesso!', feedbackContainer, 'success');
          form.reset(); // Limpa o formulário
          // Redefine estado inicial dos campos condicionais e botões
          if(initialDonationType) toggleDonationFields(initialDonationType);
           presetAmountButtons.forEach(btn => btn.classList.remove('active'));
           if(pixDetails && initialPayment !== 'pix') DOM.hide(pixDetails);

        } catch (error) {
          UI.displayFeedback(`Erro ao processar doação: ${error.message}`, feedbackContainer, 'error');
        } finally {
          UI.hideLoading(submitButton);
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      });
    },

    /** Inicializa formulário de voluntariado. */
    initVolunteerForm: () => {
         const form = DOM.qs('#volunteer-form');
         if (!form) return;

         form.addEventListener('submit', async (event) => {
             event.preventDefault();
             const feedbackContainer = form.querySelector('.form-actions') || form;
             DOM.qs('.sgcf-feedback', feedbackContainer)?.remove();

             if (!form.checkValidity()) {
                 form.reportValidity();
                 UI.displayFeedback('Por favor, preencha os campos obrigatórios.', feedbackContainer, 'error');
                 return;
             }

             const submitButton = form.querySelector('button[type="submit"]');
             const originalButtonText = submitButton.textContent;
             submitButton.disabled = true;
             submitButton.textContent = 'Enviando...';
             UI.showLoading(submitButton);

             try {
                 const formData = FormHandler.serializeForm(form);
                 // Trata checkboxes de skills
                 formData.skills = Array.from(DOM.qsa('input[name="skills[]"]:checked', form)).map(cb => cb.value);

                 const response = await ApiService.submitVolunteerForm(formData);
                 UI.displayFeedback(response.message || 'Inscrição enviada com sucesso! Entraremos em contato.', feedbackContainer, 'success');
                 form.reset();
             } catch (error) {
                 UI.displayFeedback(`Erro ao enviar inscrição: ${error.message}`, feedbackContainer, 'error');
             } finally {
                 UI.hideLoading(submitButton);
                 submitButton.disabled = false;
                 submitButton.textContent = originalButtonText;
             }
         });
    },

     /** Inicializa formulário de newsletter no rodapé. */
    initNewsletterForm: () => {
         const form = DOM.qs('#newsletter-form-footer');
         if (!form) return;

         form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const emailInput = DOM.qs('#footer-newsletter-email', form);
            const email = emailInput.value;
            const feedbackContainer = form; // Mostra feedback perto do form
            DOM.qs('.sgcf-feedback', feedbackContainer)?.remove();

            if (!email || !emailInput.checkValidity()) {
                 emailInput.reportValidity();
                 UI.displayFeedback('Por favor, insira um email válido.', feedbackContainer, 'error');
                 return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            UI.showLoading(submitButton);

            try {
                 const response = await ApiService.submitNewsletter(email);
                 UI.displayFeedback(response.message || 'Inscrição realizada com sucesso!', feedbackContainer, 'success');
                 form.reset();
            } catch (error) {
                 UI.displayFeedback(`Erro na inscrição: ${error.message}`, feedbackContainer, 'error');
            } finally {
                 UI.hideLoading(submitButton);
                 submitButton.disabled = false;
                 submitButton.textContent = originalButtonText;
            }
         });
    },

    /**
     * Serializa os dados de um formulário em um objeto chave/valor.
     * @param {HTMLFormElement} form O formulário a ser serializado.
     * @returns {object} Objeto com os dados do formulário.
     */
    serializeForm: (form) => {
      const formData = new FormData(form);
      const data = {};
      // FormData.entries() não lida bem com múltiplos valores para a mesma chave (checkboxes)
      // Iteramos sobre os elementos para tratar isso.
       Array.from(form.elements).forEach(element => {
           if (element.name && !element.disabled && ['checkbox', 'radio'].includes(element.type)) {
               // Lida com checkboxes e radios (apenas selecionados)
               if(element.checked) {
                   if(data[element.name]) { // Já existe? Transforma em array
                       if(!Array.isArray(data[element.name])) {
                           data[element.name] = [data[element.name]];
                       }
                       data[element.name].push(element.value);
                   } else {
                       // Se o nome termina com [], trata como array mesmo se for o primeiro
                       if (element.name.endsWith('[]')) {
                           data[element.name] = [element.value];
                       } else {
                            data[element.name] = element.value;
                       }
                   }
               } else if (element.type === 'checkbox' && !data[element.name]) {
                    // Garante que checkboxes desmarcados com nome de array existam como array vazio
                   if (element.name.endsWith('[]')) {
                        data[element.name] = data[element.name] || [];
                   }
               }
           } else if (element.name && !element.disabled && element.type !== 'file' && element.type !== 'reset' && element.type !== 'submit' && element.type !== 'button') {
               // Outros tipos de input
               data[element.name] = element.value;
           }
       });
       return data;
    },
  };

  // --- 8. Módulos de Lógica Específica das Páginas ---

  /** Lógica específica do Dashboard. */
  const DashboardPage = {
    selectors: {
      section: '#dashboard',
      dateFilter: '#dashboard-date-filter',
      refreshButton: '[data-action="refresh-dashboard"]',
      mapContainer: '#interactive-map-container',
      mapLayerButtons: '#widget-map .widget-controls button',
      statsContainer: '#widget-stats .key-stats-list',
      alertsContainer: '#widget-alerts .alert-list',
      hungerMeter: '#hunger-meter',
      fundingProgress: '#funding-progress',
      statValueSpans: '#widget-stats .stat-value', // Seletor mais específico
      statTrendSpans: '#widget-stats .stat-trend', // Seletor mais específico
    },
    mapInstance: null,

    init: () => {
      console.log("Initializing Dashboard Page...");
      const section = DOM.qs(DashboardPage.selectors.section);
      if (!section) return; // Sai se a seção não existir

      // Inicializa Mapa (Simulado)
      try {
          DashboardPage.mapInstance = new InteractiveMap('interactive-map-container');
          appState.mapInstance = DashboardPage.mapInstance; // Guarda referência global se necessário
      } catch(error) {
           console.error("Failed to initialize map:", error);
           UI.displayFeedback('Erro ao inicializar o mapa.', DOM.qs(DashboardPage.selectors.mapContainer), 'error');
      }


      // Adiciona Listeners
      const dateFilter = DOM.qs(DashboardPage.selectors.dateFilter);
      const refreshButton = DOM.qs(DashboardPage.selectors.refreshButton);
      if (dateFilter) dateFilter.addEventListener('change', DashboardPage.handleDateFilterChange);
      if (refreshButton) refreshButton.addEventListener('click', DashboardPage.handleRefreshClick); // Delegado globalmente também

      DOM.delegate(section, DashboardPage.selectors.mapLayerButtons, 'click', DashboardPage.handleMapLayerClick);

      // Carrega dados iniciais
      DashboardPage.loadData();
    },

    loadData: async () => {
      console.log("Dashboard: Loading data...");
      const section = DOM.qs(DashboardPage.selectors.section);
      UI.showLoading(section);
      if (DashboardPage.mapInstance) DashboardPage.mapInstance.showLoading();
      UI.updateLiveRegion('Atualizando dados do painel...', 'polite');

      try {
        const data = await ApiService.getDashboardData({ date: appState.currentFilters.dashboardDate });
        DashboardPage.updateStats(data);
        DashboardPage.updateAlerts(data.alerts);
        if (DashboardPage.mapInstance) DashboardPage.mapInstance.renderMarkers(data.mapData);
        UI.updateLiveRegion('Dados do painel atualizados.', 'polite');
      } catch (error) {
        console.error("Dashboard: Failed to load data", error);
        UI.displayFeedback(`Erro ao carregar dados do painel: ${error.message}`, section, 'error');
        UI.updateLiveRegion('Falha ao atualizar dados do painel.', 'assertive');
      } finally {
        UI.hideLoading(section);
         if (DashboardPage.mapInstance) DashboardPage.mapInstance.hideLoading();
      }
    },

    updateStats: (data) => {
       console.log("Dashboard: Updating stats...", data);
       const statsContainer = DOM.qs(DashboardPage.selectors.statsContainer);
       if (!statsContainer || !data) return;

       // Atualiza valores específicos
       const updateStat = (statId, value, trend = null) => {
           const container = DOM.qs(`.stat-item[data-stat-id="${statId}"]`, statsContainer);
           if (!container) return;
           const valueEl = DOM.qs('.stat-value', container);
           const trendEl = DOM.qs('.stat-trend', container);
           if (valueEl) valueEl.textContent = value;
           if (trendEl && trend) {
                trendEl.textContent = ` (${trend.label})`; // Trend label
                trendEl.dataset.trend = trend.direction; // Atualiza atributo para CSS
           }
       };

        // Formata valores antes de exibir
        updateStat('global-hunger-index', Utils.formatNumber(data.globalHungerIndex), { label: 'Estável', direction: 'stable' }); // Trend simulado
        updateStat('people-affected', `${Utils.formatNumber(data.peopleAffected)} Milhões`, { label: 'Aumento', direction: 'up' }); // Trend simulado
        updateStat('funding-gap', `$${Utils.formatNumber(data.fundingGap)} Bilhões`);
        updateStat('active-projects', Utils.formatNumber(data.activeProjects, {maximumFractionDigits: 0}));

        // Atualiza elementos <meter> e <progress>
        const meter = DOM.qs(DashboardPage.selectors.hungerMeter);
        const progress = DOM.qs(DashboardPage.selectors.fundingProgress);
        if (meter) {
            meter.value = data.globalHungerIndex;
            // Atualiza title para tooltip
            meter.title = `Nível: ${data.globalHungerIndex > 35 ? 'Crítico' : data.globalHungerIndex > 10 ? 'Moderado' : 'Baixo'} (${Utils.formatNumber(data.globalHungerIndex)})`;
        }
        if (progress) {
            progress.value = data.fundingProgress;
             progress.title = `${Utils.formatNumber(data.fundingProgress, {maximumFractionDigits: 0})}% da meta atingida`;
            // Atualiza label visualmente escondida para acessibilidade
            const progressLabel = DOM.qs('label[for="funding-progress"]');
            if(progressLabel) progressLabel.textContent = `Progresso da meta de financiamento: ${progress.title}`;
        }
    },

    updateAlerts: (alerts = []) => {
       console.log("Dashboard: Updating alerts...", alerts);
       const container = DOM.qs(DashboardPage.selectors.alertsContainer);
       if (!container) return;

       container.innerHTML = ''; // Limpa alertas antigos
       if (!alerts || alerts.length === 0) {
           container.innerHTML = '<li>Nenhum alerta urgente no momento.</li>';
           return;
       }

       alerts.forEach((alert, index) => {
           const alertEl = DOM.createEl('li', {
               className: `alert-item ${alert.level}`, // Usa nível para classe CSS
               attributes: { 'data-alert-id': alert.id },
               // Cria HTML interno de forma segura (sem innerHTML direto com dados externos)
               children: [
                   DOM.createEl('strong', { className: 'alert-region', textContent: `${alert.region}: ` }),
                   document.createTextNode(alert.message + ' '), // Nó de texto para a mensagem
                   DOM.createEl('time', {
                       textContent: `(${Utils.formatDate(alert.timestamp)})`, // Formata data relativa
                       attributes: { datetime: alert.timestamp }
                   })
               ]
           });
           // Aplica delay de animação CSS
           alertEl.style.animationDelay = `${index * config.alertFadeInDelayIncrement}ms`;
           container.appendChild(alertEl);
       });

        // Atualiza badge de contagem de alertas (exemplo)
        const criticalCount = alerts.filter(a => a.level === 'critical').length;
        const alertBadge = DOM.qs('#widget-alerts .badge');
        if (alertBadge) {
            alertBadge.textContent = `${criticalCount} Críticos`;
            alertBadge.title = `${criticalCount} alertas críticos`;
            alertBadge.style.display = criticalCount > 0 ? 'inline-block' : 'none';
        }
    },

    handleDateFilterChange: (event) => {
      appState.currentFilters.dashboardDate = event.target.value;
      console.log("Dashboard: Date filter changed", appState.currentFilters.dashboardDate);
      DashboardPage.loadData(); // Recarrega dados com nova data
    },

    handleRefreshClick: () => {
      console.log("Dashboard: Refresh button clicked");
      // Limpa filtro de data para pegar dados mais recentes (ou mantém, dependendo da lógica desejada)
      // appState.currentFilters.dashboardDate = new Date().toISOString().split('T')[0];
      // const dateFilter = DOM.qs(DashboardPage.selectors.dateFilter);
      // if (dateFilter) dateFilter.value = appState.currentFilters.dashboardDate;
      DashboardPage.loadData();
    },

    handleMapLayerClick: (event) => {
      const button = event.currentTarget; // O botão que foi clicado (devido à delegação)
      const layerName = button.dataset.mapLayer;
      if (layerName && DashboardPage.mapInstance) {
        console.log(`Dashboard: Map layer button clicked - ${layerName}`);
        DashboardPage.mapInstance.updateLayer(layerName);

        // Atualiza estado visual dos botões (exemplo)
        DOM.qsa(DashboardPage.selectors.mapLayerButtons).forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      }
    },
  };

   /** Lógica específica do Centro de Ação (Abas, Projetos). */
   const ActionCenterPage = {
        selectors: {
            section: '#action-center',
            projectList: '.project-list',
            projectCard: '.project-card',
            regionFilter: '#project-filter-region',
            typeFilter: '#project-filter-type',
        },

        init: () => {
            console.log("Initializing Action Center Page...");
             const section = DOM.qs(ActionCenterPage.selectors.section);
             if (!section) return;

             // Listeners para filtros de projeto
             const regionFilter = DOM.qs(ActionCenterPage.selectors.regionFilter);
             const typeFilter = DOM.qs(ActionCenterPage.selectors.typeFilter);

             if (regionFilter) regionFilter.addEventListener('change', ActionCenterPage.handleProjectFilterChange);
             if (typeFilter) typeFilter.addEventListener('change', ActionCenterPage.handleProjectFilterChange);

             // Carrega projetos iniciais (ou eles podem estar no HTML estático)
              // ActionCenterPage.loadProjects(); // Descomente se carregar dinamicamente
        },

        handleProjectFilterChange: () => {
            const regionFilter = DOM.qs(ActionCenterPage.selectors.regionFilter);
            const typeFilter = DOM.qs(ActionCenterPage.selectors.typeFilter);
            appState.currentFilters.projectRegion = regionFilter ? regionFilter.value : 'all';
            appState.currentFilters.projectType = typeFilter ? typeFilter.value : 'all';
            console.log("Action Center: Project filters changed", appState.currentFilters);
            ActionCenterPage.loadProjects(); // Recarrega projetos com novos filtros
        },

        loadProjects: async () => {
            console.log("Action Center: Loading projects...");
            const projectListContainer = DOM.qs(ActionCenterPage.selectors.projectList);
            if (!projectListContainer) return;

            UI.showLoading(projectListContainer);
            UI.updateLiveRegion('Atualizando lista de projetos...', 'polite');

            try {
                const projects = await ApiService.getProjects(appState.currentFilters);
                ActionCenterPage.renderProjects(projects);
                UI.updateLiveRegion(`${projects.length} projetos encontrados.`, 'polite');
            } catch (error) {
                console.error("Action Center: Failed to load projects", error);
                UI.displayFeedback(`Erro ao carregar projetos: ${error.message}`, projectListContainer, 'error');
                UI.updateLiveRegion('Falha ao atualizar lista de projetos.', 'assertive');
            } finally {
                UI.hideLoading(projectListContainer);
            }
        },

        renderProjects: (projects = []) => {
            console.log("Action Center: Rendering projects...", projects);
            const container = DOM.qs(ActionCenterPage.selectors.projectList);
            if (!container) return;

            container.innerHTML = ''; // Limpa lista antiga
            if (!projects || projects.length === 0) {
                container.innerHTML = '<p>Nenhum projeto encontrado com os filtros selecionados.</p>';
                return;
            }

            projects.forEach(project => {
                // Cria o HTML do card do projeto dinamicamente
                const card = DOM.createEl('article', {
                    className: 'project-card',
                    attributes: {
                        'data-project-id': project.id,
                        'data-region': project.region,
                        'data-type': project.type,
                    },
                    children: [
                        DOM.createEl('figure', { className: 'project-image', children: [
                            DOM.createEl('img', { attributes: { src: project.image || '/assets/images/project-placeholder.jpg', alt: project.title } })
                        ]}),
                        DOM.createEl('div', { className: 'project-content', children: [
                            DOM.createEl('header', { className: 'project-header', children: [
                                DOM.createEl('h4', { className: 'project-title', textContent: project.title }),
                                DOM.createEl('span', { className: 'project-region-tag', textContent: project.region }), // Idealmente mapear ID para nome
                                DOM.createEl('span', { className: 'project-type-tag', textContent: project.type }) // Idealmente mapear ID para nome
                            ]}),
                             DOM.createEl('p', { className: 'project-description', textContent: project.description }),
                             DOM.createEl('div', { className: 'project-progress', children: [
                                 DOM.createEl('label', { textContent: 'Progresso da Meta:', attributes: { for: `proj-${project.id}-progress`} }),
                                 DOM.createEl('progress', { id: `proj-${project.id}-progress`, attributes: { max: '100', value: project.fundingProgress, title: `${project.fundingProgress}%` } }),
                                 DOM.createEl('span', { textContent: `(${project.fundingProgress}% de ${Utils.formatNumber(project.fundingGoal || 0, {style: 'currency', currency: 'BRL'})})`}) // Simula moeda
                             ]}),
                             DOM.createEl('footer', { className: 'project-actions', children: [
                                 DOM.createEl('a', { href: `#donate?designation=${project.id}`, className: 'btn btn-primary btn-sm', textContent: 'Apoiar Projeto' }),
                                 DOM.createEl('a', { href: `#project-details?id=${project.id}`, className: 'btn btn-secondary btn-sm', textContent: 'Ver Detalhes' })
                             ]})
                        ]})
                    ]
                });
                container.appendChild(card);
            });
        }
   };

   // ... Módulos para Data Hub, etc. poderiam ser adicionados aqui de forma similar

  // --- 9. Inicialização Geral do App ---
  function initializeApp() {
    console.log(`%c SGCF App Initializing... (Time: ${new Date().toLocaleTimeString()})`, 'color: blue; font-weight: bold;');

    // Aplica tema inicial
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${appState.currentTheme}`);
    setupThemeToggle(); // Configura o botão de toggle (se existir)

    // Inicializa componentes UI genéricos
    UI.initMobileMenu();
    UI.initDropdowns('.main-navigation .has-submenu, .user-menu-container, .language-switcher');
    UI.initTabs('.action-tabs-container');

    // Inicializa manipuladores de formulário
    FormHandler.initDonationForm();
    FormHandler.initVolunteerForm();
    FormHandler.initNewsletterForm();

    // Inicializa lógica específica das páginas (verificar se a seção existe primeiro)
    if (DOM.qs(DashboardPage.selectors.section)) DashboardPage.init();
    if (DOM.qs(ActionCenterPage.selectors.section)) ActionCenterPage.init();
     // if (DOM.qs('#data-hub')) DataHubPage.init(); // Exemplo

    // Outras inicializações
    updateGenerationTime();
    setupGlobalEventDelegation();

    console.log(`%c SGCF App Initialized Successfully. Theme: ${appState.currentTheme}`, 'color: green; font-weight: bold;');
  }

  // --- 10. Manipuladores de Eventos Globais (Delegação) ---
  function setupGlobalEventDelegation() {
      // Exemplo: Delegação para botões com data-action
       DOM.delegate(document.body, '[data-action]', 'click', (event) => {
           const target = event.currentTarget; // O elemento que correspondeu a '[data-action]'
           const action = target.dataset.action;
           console.log(`[Action Delegate] Clicked: ${action}`, target);

           switch(action) {
                case 'refresh-dashboard':
                    // Já tratado no listener específico do botão, mas poderia ser centralizado aqui
                    if (DashboardPage.handleRefreshClick) DashboardPage.handleRefreshClick();
                    break;
                case 'copy-pix-key':
                    // O listener específico no botão já faz isso, mas poderia ser delegado
                    // copyPixKey(target); // Chamar função específica
                    break;
                case 'request-api-key':
                     alert('Simulação: Formulário para solicitar chave de API seria exibido aqui.');
                     break;
                case 'export-chart':
                    const chartId = target.dataset.chartId;
                    alert(`Simulação: Exportando gráfico com ID: ${chartId}`);
                    break;
                case 'toggle-theme':
                    toggleTheme();
                    break;
                 // Adicionar mais ações conforme necessário
                 default:
                    console.warn(`[Action Delegate] Unhandled action: ${action}`);
           }
       });

       // Delegação para links de ancora internos suaves (se não usar scroll-behavior: smooth)
       // DOM.delegate(document.body, 'a[href^="#"]', 'click', handleSmoothScroll);
  }

    // Função para scroll suave (alternativa ao CSS scroll-behavior)
    // function handleSmoothScroll(event) {
    //     const href = event.currentTarget.getAttribute('href');
    //     const targetElement = href === '#' ? document.body : DOM.qs(href);
    //     if (targetElement) {
    //         event.preventDefault();
    //         targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //         // Opcional: Atualizar URL hash sem saltar
    //         // history.pushState(null, null, href);
    //     }
    // }

  // --- 11. Funções Específicas Diversas ---

   /** Copia a chave PIX para a área de transferência. */
   async function copyPixKey(button) {
       const keyElement = button.previousElementSibling; // Assume <code> antes do <button>
       const key = keyElement?.textContent;
       if (key && navigator.clipboard) {
           try {
               await navigator.clipboard.writeText(key);
               const originalText = button.textContent;
               button.textContent = 'Copiado!';
               button.disabled = true; // Desabilita temporariamente
               setTimeout(() => {
                   button.textContent = originalText;
                   button.disabled = false;
                }, 2500);
           } catch (err) {
               console.error('Falha ao copiar chave PIX:', err);
               UI.displayFeedback('Erro ao copiar chave.', button.parentElement, 'error');
           }
       } else {
           console.warn('Clipboard API não disponível ou elemento da chave não encontrado.');
            UI.displayFeedback('Não foi possível copiar.', button.parentElement, 'error');
       }
   }

   /** Atualiza o tempo de geração da página no rodapé. */
   function updateGenerationTime() {
       const timeElement = DOM.qs('#generation-time');
       if (timeElement) {
           timeElement.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
       }
   }

   /** Configura o botão de toggle de tema (exemplo de funcionalidade extra). */
   function setupThemeToggle() {
        // Se não houver botão, podemos detectar preferência do sistema
        // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        // if (prefersDark.matches && !localStorage.getItem(config.themeLocalStorageKey)) {
        //     appState.currentTheme = 'dark';
        //     document.body.classList.replace('theme-light', 'theme-dark');
        // }
        // // Listener para mudanças na preferência do sistema
        // prefersDark.addEventListener('change', (e) => {
        //      if (!localStorage.getItem(config.themeLocalStorageKey)) { // Só muda se não houver preferência salva
        //          appState.currentTheme = e.matches ? 'dark' : 'light';
        //          document.body.classList.toggle('theme-dark', e.matches);
        //          document.body.classList.toggle('theme-light', !e.matches);
        //          console.log(`System theme changed to ${appState.currentTheme}`);
        //      }
        // });

       // Se houver um botão de toggle explícito
        const themeToggleButton = DOM.qs('[data-action="toggle-theme"]');
        if(themeToggleButton) {
            // Atualiza o ícone/texto inicial do botão
            updateThemeToggleButton(themeToggleButton);
        } // O toggle em si é feito pelo event delegate em setupGlobalEventDelegation
   }

   /** Alterna entre tema claro e escuro. */
   function toggleTheme() {
       appState.currentTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
       document.body.classList.remove('theme-light', 'theme-dark');
       document.body.classList.add(`theme-${appState.currentTheme}`);
       localStorage.setItem(config.themeLocalStorageKey, appState.currentTheme); // Salva preferência
       console.log(`Theme toggled to: ${appState.currentTheme}`);
       // Atualiza o botão de toggle (se existir)
        const themeToggleButton = DOM.qs('[data-action="toggle-theme"]');
        if(themeToggleButton) updateThemeToggleButton(themeToggleButton);
        UI.updateLiveRegion(`Tema alterado para ${appState.currentTheme === 'dark' ? 'escuro' : 'claro'}.`);
   }

   /** Atualiza a aparência do botão de toggle de tema. */
   function updateThemeToggleButton(button) {
       if (appState.currentTheme === 'dark') {
           button.innerHTML = '☀️ <span class="visually-hidden">Mudar para Tema Claro</span>'; // Ícone de sol
           button.setAttribute('aria-label', 'Mudar para Tema Claro');
       } else {
           button.innerHTML = '🌙 <span class="visually-hidden">Mudar para Tema Escuro</span>'; // Ícone de lua
            button.setAttribute('aria-label', 'Mudar para Tema Escuro');
       }
   }


  // --- 12. Ponto de Entrada: Executa a inicialização quando o DOM estiver pronto ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp(); // Caso o script seja carregado com defer/async e o DOM já esteja pronto
  }

})(window, document); // Passa referências globais para o IIFE
