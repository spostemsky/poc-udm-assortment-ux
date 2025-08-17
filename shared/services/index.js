/**
 * Services Loader - Carga automática de todos los Data Services
 * Maneja la inicialización de servicios de datos
 */
class ServicesLoader {
    constructor() {
        this.loaded = false;
        this.services = {};
        this.filesToLoad = [
            '../shared/services/facturas-service.js',
            '../shared/services/ordenes-service.js',
            '../shared/services/ofertas-service.js',
            '../shared/services/equivalencias-service.js'
        ];
    }

    /**
     * Carga todos los servicios
     * @returns {Promise<boolean>} True si se cargaron correctamente
     */
    async loadAll() {
        try {
            console.log('🔄 Iniciando carga de Data Services...');
            
            // Cargar todos los archivos de servicios
            await this.loadScripts(this.filesToLoad);
            
            // Esperar a que los servicios estén disponibles
            await this.waitForServices();
            
            // Registrar servicios
            this.registerServices();
            
            this.loaded = true;
            console.log('✅ Data Services cargados correctamente');
            
            return true;
        } catch (error) {
            console.error('❌ Error cargando Data Services:', error);
            return false;
        }
    }

    /**
     * Carga múltiples scripts en paralelo
     * @param {Array} scriptPaths - Rutas de los scripts a cargar
     * @returns {Promise} Promise que se resuelve cuando todos los scripts están cargados
     */
    async loadScripts(scriptPaths) {
        const promises = scriptPaths.map(path => this.loadScript(path));
        await Promise.all(promises);
    }

    /**
     * Carga un script individual
     * @param {string} src - Ruta del script
     * @returns {Promise} Promise que se resuelve cuando el script está cargado
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Error cargando ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Espera a que todos los servicios estén disponibles
     * @returns {Promise} Promise que se resuelve cuando los servicios están listos
     */
    async waitForServices() {
        const maxAttempts = 50;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (this.areServicesReady()) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        throw new Error('Timeout esperando a que los servicios estén listos');
    }

    /**
     * Verifica si todos los servicios están listos
     * @returns {boolean} True si todos los servicios están disponibles
     */
    areServicesReady() {
        return window.facturasService && 
               window.ordenesService && 
               window.ofertasService && 
               window.equivalenciasService;
    }

    /**
     * Registra los servicios en el objeto global
     */
    registerServices() {
        this.services = {
            facturas: window.facturasService,
            ordenes: window.ordenesService,
            ofertas: window.ofertasService,
            equivalencias: window.equivalenciasService
        };

        // También hacer disponible como window.services
        window.services = this.services;
        
        console.log('📋 Servicios registrados:', Object.keys(this.services));
    }

    /**
     * Obtiene un servicio específico
     * @param {string} serviceName - Nombre del servicio
     * @returns {Object|null} Servicio o null si no existe
     */
    getService(serviceName) {
        return this.services[serviceName] || null;
    }

    /**
     * Verifica si los servicios están cargados
     * @returns {boolean} True si están cargados
     */
    isLoaded() {
        return this.loaded;
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.servicesLoader = new ServicesLoader();
    await window.servicesLoader.loadAll();
});

// También exportar para uso manual si es necesario
window.ServicesLoader = ServicesLoader;
