/**
 * 🏭 BUSINESS RULES CONFIGURATOR
 * Configurador específico del proyecto que inicializa el BusinessRulesEngine
 * con los adaptadores y configuraciones necesarias
 * 
 * 📁 UBICACIÓN: shared/adapters/ (específico del proyecto)
 * 🎯 PROPÓSITO: Conectar motor genérico con configuración específica
 * 
 * ✅ RESPONSABILIDADES:
 * - Crear y configurar QueryEngineAdapter del proyecto
 * - Crear y configurar ActionExecutor (si necesita personalización)
 * - Inicializar BusinessRulesEngine con dependencias correctas
 * - Proporcionar API simple para el proyecto
 */
class BusinessRulesConfigurator {
    constructor() {
        this.queryAdapter = null;
        this.actionExecutor = null;
        this.engine = null;
        this.initialized = false;
    }

    /**
     * 🚀 Crear y configurar el motor de reglas completo
     * @returns {BusinessRulesEngine} Motor configurado y listo para usar
     */
    async createConfiguredEngine() {
        console.log('🏭 Configurando Business Rules Engine para este proyecto...');

        try {
            // 🔌 PASO 1: Crear QueryEngine Adapter específico del proyecto
            this.queryAdapter = new ProjectQueryEngineAdapter();
            await this.queryAdapter.initialize();

            // 🔌 PASO 2: Crear ActionExecutor (usar el genérico por ahora)
            this.actionExecutor = new ActionExecutor();

            // 🚀 PASO 3: Crear BusinessRulesEngine con dependencias inyectadas
            this.engine = new BusinessRulesEngine(this.queryAdapter, this.actionExecutor);

            // 🎯 PASO 4: Inicializar el motor
            const success = await this.engine.initialize();
            
            if (!success) {
                throw new Error('Error inicializando BusinessRulesEngine');
            }

            this.initialized = true;
            console.log('✅ Business Rules Engine configurado correctamente para el proyecto');
            
            return this.engine;

        } catch (error) {
            console.error('💥 Error configurando Business Rules Engine:', error);
            throw error;
        }
    }

    /**
     * 🔍 Obtener información de configuración
     */
    getConfigInfo() {
        if (!this.initialized) {
            return { status: 'not_initialized' };
        }

        return {
            status: 'initialized',
            queryEngine: this.queryAdapter?.constructor.name,
            actionExecutor: this.actionExecutor?.constructor.name,
            rulesCount: this.engine?.rules?.size || 0,
            engineInfo: this.engine?.getRulesInfo()
        };
    }

    /**
     * 🔄 Reinicializar configuración (útil para desarrollo)
     */
    async reinitialize() {
        console.log('🔄 Reinicializando configuración...');
        this.initialized = false;
        return await this.createConfiguredEngine();
    }
}

/**
 * 🌐 INSTANCIA GLOBAL DEL CONFIGURADOR
 * Para facilitar el acceso desde cualquier parte del proyecto
 */
window.businessRulesConfigurator = new BusinessRulesConfigurator();

/**
 * 🚀 FUNCIÓN DE INICIALIZACIÓN GLOBAL
 * API simple para inicializar el sistema completo
 */
window.initializeBusinessRules = async function() {
    console.log('🎯 Inicializando sistema de reglas de negocio...');
    
    try {
        const engine = await window.businessRulesConfigurator.createConfiguredEngine();
        
        // ✅ EXPONER ENGINE GLOBALMENTE (compatibilidad con código existente)
        window.businessRulesEngine = engine;
        window.queryEngine = engine.queryEngine;
        window.actionExecutor = engine.actionExecutor;
        
        console.log('🎉 Sistema de reglas de negocio listo');
        console.log('📊 Configuración:', window.businessRulesConfigurator.getConfigInfo());
        
        return true;
        
    } catch (error) {
        console.error('💥 Error inicializando sistema de reglas:', error);
        return false;
    }
};

// 🌐 EXPORTAR PARA USO GLOBAL
if (typeof window !== 'undefined') {
    window.BusinessRulesConfigurator = BusinessRulesConfigurator;
}
