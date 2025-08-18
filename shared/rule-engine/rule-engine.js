/**
 * 🎯 RULE ENGINE - Archivo Principal de Importación
 * 
 * Este archivo importa automáticamente todos los componentes del Business Rules Engine:
 * - Reglas por categoría (business, ux, ui, validation)
 * - Query Engine (evaluador de condiciones)
 * - Action Executor (ejecutor de acciones)
 * - Business Rules Engine (motor principal)
 * 
 * Solo necesitas cargar este archivo en HTML:
 * <script src="rule-engine.js"></script>
 * 
 * Los demás archivos se cargan automáticamente.
 */

// =============================================================================
// 📂 CONFIGURACIÓN DE ARCHIVOS A IMPORTAR
// =============================================================================

// Detectar automáticamente la ruta base según dónde se ejecuta
const BASE_PATH = (() => {
    const currentScript = document.currentScript;
    if (currentScript) {
        const scriptPath = currentScript.src;
        if (scriptPath.includes('/formulario/')) {
            return '../shared';
        }
    }
    // Default para archivos en la raíz del proyecto
    return 'shared';
})();

console.log(`🎯 Rule Engine detectó BASE_PATH: ${BASE_PATH}`);

const RULE_ENGINE_FILES = {
    // Reglas por categoría (rutas relativas al HTML que carga este archivo)
    rules: [
        `${BASE_PATH}/rule-engine/rules/business-rules.js`,
        `${BASE_PATH}/rule-engine/rules/ux-rules.js`, 
        `${BASE_PATH}/rule-engine/rules/ui-rules.js`,
        `${BASE_PATH}/rule-engine/rules/validation-rules.js`
    ],
    
    // Componentes del motor GENÉRICO (rutas relativas al HTML que carga este archivo)
    engine: [
        `${BASE_PATH}/rule-engine/generic-query-engine.js`,
        `${BASE_PATH}/rule-engine/action-executor.js`,
        `${BASE_PATH}/rule-engine/engine.js`
    ],
    
    // Componentes opcionales (rutas relativas al HTML que carga este archivo)
    components: [
        `${BASE_PATH}/rule-engine/components/rules-manager/rules-state-manager.js`,
        `${BASE_PATH}/rule-engine/components/rules-manager/rules-manager.js`
    ]
};

// =============================================================================
// 🔧 SISTEMA DE CARGA DINÁMICA DE SCRIPTS
// =============================================================================

/**
 * Cargar un script dinámicamente
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Verificar si el script ya está cargado
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            console.log(`📄 Script ya cargado: ${src}`);
            resolve(src);
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`✅ Script cargado: ${src}`);
            resolve(src);
        };
        script.onerror = () => {
            console.error(`❌ Error cargando script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
    });
}

/**
 * Cargar múltiples scripts en paralelo
 */
async function loadScripts(scripts) {
    console.log(`📦 Cargando ${scripts.length} scripts en paralelo...`);
    
    const loadPromises = scripts.map(script => loadScript(script));
    
    try {
        const results = await Promise.all(loadPromises);
        console.log(`✅ Todos los scripts cargados correctamente: ${results.length} archivos`);
        return true;
    } catch (error) {
        console.error('❌ Error cargando scripts:', error);
        return false;
    }
}

/**
 * Cargar múltiples scripts secuencialmente (si se necesita orden específico)
 */
async function loadScriptsSequential(scripts) {
    console.log(`📦 Cargando ${scripts.length} scripts secuencialmente...`);
    
    for (const script of scripts) {
        try {
            await loadScript(script);
        } catch (error) {
            console.error(`❌ Error cargando ${script}:`, error);
            return false;
        }
    }
    
    console.log(`✅ Todos los scripts cargados secuencialmente: ${scripts.length} archivos`);
    return true;
}

// =============================================================================
// 🚀 INICIALIZACIÓN AUTOMÁTICA DEL RULE ENGINE
// =============================================================================

/**
 * Inicializar todo el sistema de reglas
 */
async function initializeRuleEngine() {
    console.log('🎯 Inicializando Rule Engine - Sistema de Importación Automática');
    
    try {
        // Paso 1: Cargar todas las reglas por categoría (en paralelo)
        console.log('📋 Paso 1: Cargando reglas por categoría...');
        const rulesLoaded = await loadScripts(RULE_ENGINE_FILES.rules);
        
        if (!rulesLoaded) {
            throw new Error('Error cargando archivos de reglas');
        }

        // Las reglas ya están registradas, no necesitamos delay

        // Paso 2: Cargar componentes del motor (en paralelo para mejor rendimiento)
        console.log('🔧 Paso 2: Cargando componentes del motor...');
        const engineLoaded = await loadScripts(RULE_ENGINE_FILES.engine);
        
        if (!engineLoaded) {
            throw new Error('Error cargando componentes del motor');
        }

        // Paso 2.5: Cargar componentes opcionales (en paralelo)
        if (RULE_ENGINE_FILES.components && RULE_ENGINE_FILES.components.length > 0) {
            console.log('🎛️ Paso 2.5: Cargando componentes opcionales...');
            const componentsLoaded = await loadScripts(RULE_ENGINE_FILES.components);
            
            if (componentsLoaded) {
                console.log('✅ Componentes opcionales cargados correctamente');
            } else {
                console.warn('⚠️ Error cargando componentes opcionales - continuando sin ellos');
            }
        }

        // Paso 3: Crear motor genérico básico
        console.log('🚀 Paso 3: Creando Business Rules Engine genérico...');
        
        // Verificar componentes mínimos requeridos
        if (!window.BusinessRulesEngine) {
            throw new Error('BusinessRulesEngine no disponible');
        }
        
        if (!window.ActionExecutor) {
            throw new Error('ActionExecutor no disponible');
        }
        
        if (!window.BUSINESS_RULES_CATEGORY) {
            throw new Error('Reglas de negocio no disponibles');
        }
        
        // Crear motor básico sin dependencias del proyecto
        const actionExecutor = new ActionExecutor();
        const engine = new BusinessRulesEngine(null, actionExecutor, null, null);
        
        // Inicializar
        const success = await engine.initialize();
        if (!success) {
            throw new Error('Error inicializando BusinessRulesEngine');
        }
        
        // Exponer globalmente
        window.businessRulesEngine = engine;
        window.actionExecutor = actionExecutor;
        
        console.log('✅ Motor genérico inicializado correctamente');

        // Éxito total
        console.log('🎉 Rule Engine inicializado correctamente');
        console.log('📊 Categorías disponibles:', Object.keys(window.BUSINESS_RULES_CATEGORY));
        
        if (window.businessRulesEngine && window.businessRulesEngine.getRulesInfo) {
            const rulesInfo = window.businessRulesEngine.getRulesInfo();
            console.log('📋 Reglas activas:', rulesInfo.activeRules);
        }
        
        return true;

    } catch (error) {
        console.error('💥 Error inicializando Rule Engine:', error);
        return false;
    }
}

// =============================================================================
// 🌐 CONFIGURACIÓN GLOBAL Y AUTO-INICIALIZACIÓN
// =============================================================================

/**
 * Configuración global del sistema
 */
window.RULE_ENGINE = {
    version: "4.0",
    description: "Rule Engine - Sistema de Importación Automática",
    architecture: "Archivo principal que importa componentes modulares",
    
    files: RULE_ENGINE_FILES,
    
    // Estado de inicialización
    initialized: false,
    
    /**
     * Reinicializar el sistema (útil para desarrollo)
     */
    async reinitialize() {
        console.log('🔄 Reinicializando Rule Engine...');
        this.initialized = false;
        return await initializeRuleEngine();
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const success = await initializeRuleEngine();
        window.RULE_ENGINE.initialized = success;
    });
} else {
    // DOM ya está listo, inicializar inmediatamente
    initializeRuleEngine().then(success => {
        window.RULE_ENGINE.initialized = success;
    });
}

console.log('🎯 Rule Engine v4.0 - Sistema de Importación Automática cargado');
