/**
 * 🏭 BUSINESS RULES CONFIGURATOR - NUEVA ARQUITECTURA
 * Configurador específico del proyecto que inicializa el ProjectRulesEngine
 * con todos los componentes necesarios integrados
 * 
 * 📁 UBICACIÓN: shared/adapters/ (específico del proyecto)
 * 🎯 PROPÓSITO: Conectar motor genérico con configuración específica
 * 
 * ✅ NUEVA ARQUITECTURA:
 * - ProjectRulesEngine (extiende BusinessRulesEngine)
 * - RulesStateManager integrado
 * - RulesProvider con overrides
 * - QueryEngineAdapter del proyecto
 * - ActionExecutor genérico
 */
class BusinessRulesConfigurator {
    constructor() {
        this.queryAdapter = null;
        this.actionExecutor = null;
        this.stateManager = null;
        this.rulesProvider = null;
        this.engine = null;
        this.initialized = false;
        
        console.log('🏭 BusinessRulesConfigurator (NUEVA ARQUITECTURA) creado');
    }

    /**
     * 🚀 Crear y configurar el motor de reglas completo con nueva arquitectura
     * @returns {ProjectRulesEngine} Motor configurado y listo para usar
     */
    async createConfiguredEngine() {
        console.log('🏭 Configurando Project Rules Engine (NUEVA ARQUITECTURA)...');

        try {
            // 🔌 PASO 1: Crear QueryEngine Adapter específico del proyecto
            console.log('🔌 Paso 1: Inicializando QueryEngine Adapter...');
            this.queryAdapter = new ProjectQueryEngineAdapter();
            await this.queryAdapter.initialize();

            // ⚡ PASO 2: Crear ActionExecutor (genérico)
            console.log('⚡ Paso 2: Inicializando ActionExecutor...');
            this.actionExecutor = new ActionExecutor();

            // 💾 PASO 3: Crear RulesStateManager para integración con Rules Manager
            console.log('💾 Paso 3: Inicializando RulesStateManager...');
            this.stateManager = new RulesStateManager({
                storageKey: 'business_rules_overrides'
            });

            // 📋 PASO 4: Crear RulesProvider con StateManager integrado
            console.log('📋 Paso 4: Inicializando RulesProvider...');
            this.rulesProvider = new RulesProvider(this.stateManager);
            await this.rulesProvider.initialize();

            // 🎯 PASO 5: Crear ProjectRulesEngine con todas las dependencias
            console.log('🎯 Paso 5: Creando ProjectRulesEngine...');
            this.engine = new ProjectRulesEngine(
                this.queryAdapter,    // QueryEngine específico del proyecto
                this.actionExecutor,  // ActionExecutor genérico
                this.stateManager,    // StateManager para overrides
                this.rulesProvider    // Provider que integra todo
            );

            // 🚀 PASO 6: Inicializar el motor
            console.log('🚀 Paso 6: Inicializando ProjectRulesEngine...');
            const success = await this.engine.initialize();
            
            if (!success) {
                throw new Error('Error inicializando ProjectRulesEngine');
            }

            // 🔄 PASO 7: Inicializar StateManager con reglas cargadas
            console.log('🔄 Paso 7: Inicializando StateManager con reglas...');
            this.stateManager.initialize();

            this.initialized = true;
            console.log('✅ Project Rules Engine configurado correctamente (NUEVA ARQUITECTURA)');
            
            // Mostrar estadísticas
            const stats = this.getDetailedStats();
            console.log('📊 Estadísticas detalladas:', stats);
            
            return this.engine;

        } catch (error) {
            console.error('💥 Error configurando Project Rules Engine:', error);
            throw error;
        }
    }

    /**
     * 🔍 Obtener información de configuración (extendida)
     */
    getConfigInfo() {
        if (!this.initialized) {
            return { status: 'not_initialized' };
        }

        return {
            status: 'initialized',
            architecture: 'ProjectRulesEngine + StateManager + RulesProvider',
            queryEngine: this.queryAdapter?.constructor.name,
            actionExecutor: this.actionExecutor?.constructor.name,
            stateManager: this.stateManager?.constructor.name,
            rulesProvider: this.rulesProvider?.constructor.name,
            engine: this.engine?.constructor.name,
            rulesCount: this.engine?.rules?.size || 0,
            engineInfo: this.engine?.getProjectInfo ? this.engine.getProjectInfo() : this.engine?.getRulesInfo()
        };
    }

    /**
     * 📊 Obtener estadísticas detalladas
     */
    getDetailedStats() {
        if (!this.initialized) {
            return { status: 'not_initialized' };
        }

        const engineInfo = this.engine?.getRulesInfo() || {};
        const providerStats = this.rulesProvider?.getStats() || {};
        
        return {
            engine: engineInfo,
            provider: providerStats,
            stateManager: {
                hasOverrides: this.stateManager ? Object.keys(this.stateManager.getOverrides().rules || {}).length > 0 : false,
                storageKey: this.stateManager?.storageKey || 'unknown'
            },
            integration: {
                rulesManagerCompatible: true,
                stateSync: !!this.stateManager,
                overridesSupported: !!this.rulesProvider
            }
        };
    }

    /**
     * 🔄 Reinicializar configuración (útil para desarrollo)
     */
    async reinitialize() {
        console.log('🔄 Reinicializando configuración (NUEVA ARQUITECTURA)...');
        this.initialized = false;
        
        // Limpiar referencias
        this.engine = null;
        this.stateManager = null;
        this.rulesProvider = null;
        
        return await this.createConfiguredEngine();
    }

    /**
     * 🔄 Sincronizar con cambios del Rules Manager
     */
    async syncWithRulesManager() {
        if (!this.initialized || !this.engine) {
            console.warn('⚠️ Configurador no inicializado');
            return;
        }

        console.log('🔄 Sincronizando con Rules Manager...');
        
        try {
            // Recargar provider (lee nuevos overrides de localStorage)
            if (this.rulesProvider) {
                await this.rulesProvider.reload();
            }
            
            // Sincronizar engine (recarga reglas con nuevos estados)
            if (this.engine.syncAndReapply) {
                await this.engine.syncAndReapply();
            } else {
                await this.engine.syncWithStateManager();
            }
            
            console.log('✅ Sincronización completada');
            
        } catch (error) {
            console.error('💥 Error sincronizando:', error);
        }
    }
}

/**
 * 🌐 INSTANCIA GLOBAL DEL CONFIGURADOR
 * Para facilitar el acceso desde cualquier parte del proyecto
 */
window.businessRulesConfigurator = new BusinessRulesConfigurator();

/**
 * 🚀 FUNCIÓN DE INICIALIZACIÓN GLOBAL (ACTUALIZADA)
 * API simple para inicializar el sistema completo con nueva arquitectura
 */
window.initializeBusinessRules = async function() {
    console.log('🎯 Inicializando sistema de reglas de negocio (NUEVA ARQUITECTURA)...');
    
    try {
        const engine = await window.businessRulesConfigurator.createConfiguredEngine();
        
        // ✅ EXPONER ENGINE GLOBALMENTE (compatibilidad con código existente)
        window.businessRulesEngine = engine;
        window.queryEngine = engine.queryEngine;
        window.actionExecutor = engine.actionExecutor;
        
        // 🆕 EXPONER NUEVOS COMPONENTES
        window.stateManager = engine.stateManager;
        window.rulesProvider = engine.rulesProvider;
        
        console.log('🎉 Sistema de reglas de negocio listo (NUEVA ARQUITECTURA)');
        console.log('📊 Configuración:', window.businessRulesConfigurator.getConfigInfo());
        
        return true;
        
    } catch (error) {
        console.error('💥 Error inicializando sistema de reglas:', error);
        return false;
    }
};

/**
 * 🔄 FUNCIÓN PARA SINCRONIZAR CON RULES MANAGER
 * Llamar cuando el Rules Manager modifique estados
 */
window.syncBusinessRulesWithManager = async function() {
    if (window.businessRulesConfigurator) {
        await window.businessRulesConfigurator.syncWithRulesManager();
    }
};

// 🌐 EXPORTAR PARA USO GLOBAL
if (typeof window !== 'undefined') {
    window.BusinessRulesConfigurator = BusinessRulesConfigurator;
}