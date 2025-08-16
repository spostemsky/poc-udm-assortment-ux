// =============================================================================
// CONFIGURACIÓN DE ENTIDADES - DATA MANAGER
// =============================================================================
// Este archivo define todas las entidades que puede manejar el Data Manager
// Para agregar nuevas entidades, simplemente agrega una nueva entrada en el objeto 'entities'

const ENTITY_CONFIG = {
    // Configuración global del Data Manager
    settings: {
        storagePrefix: 'poc_data_'
    },

    // Definición de entidades
    entities: {
        facturas: {
            // Información de display
            displayName: "Facturas",
            displayNameSingular: "Factura", 
            icon: "📄",
            
            // Configuración de campos para la tabla
            fields: [
                { 
                    key: "id", 
                    label: "Id", 
                    type: "text", 
                    required: true,
                    unique: true,
                    showColumn: false
                },
                { 
                    key: "external_id", 
                    label: "EXTERNAL ID", 
                    type: "text", 
                    required: true,
                    unique: true
                },
                { 
                    key: "sap_order_id", 
                    label: "Nro Orden", 
                    type: "number",
                    required: true,
                    unique: true
                },
                { 
                    key: "vendor_name", 
                    label: "Proveedor", 
                    type: "text"
                },
                { 
                    key: "site_id", 
                    label: "Sitio", 
                    type: "text"
                },
                { 
                    key: "details", 
                    label: "Detalles", 
                    type: "array", 
                    display: "count"
                }
            ],
            
            // Template para nuevos registros
            template: {
                external_id: "",
                sap_order_id: null,
                internal_hash: "",
                inner_id: null,
                id: "",
                order_id: "",
                vendor_name: "",
                site_id: "",
                details: []
            },

            // Configuraciones específicas de la entidad
            config: {
                validateOnSave: true,
                autoGenerateId: false,
                confirmDelete: true
            }
        },

        ordenes: {
            // Información de display
            displayName: "Órdenes",
            displayNameSingular: "Orden",
            icon: "📋",
            
            // Configuración de campos para la tabla
            fields: [
                { 
                    key: "id", 
                    label: "ID", 
                    type: "text", 
                    required: true,
                    unique: true
                },
                { 
                    key: "sapOrderId", 
                    label: "SAP Order ID", 
                    type: "number",
                    required: true,
                    unique: true
                },
                { 
                    key: "siteId", 
                    label: "Sitio", 
                    type: "text"
                },
                { 
                    key: "details", 
                    label: "Detalles", 
                    type: "array", 
                    display: "count"
                }
            ],
            
            // Template para nuevos registros
            template: {
                id: "",
                uuid: "",
                sapOrderId: null,
                siteId: "",
                details: []
            },

            // Configuraciones específicas de la entidad
            config: {
                validateOnSave: true,
                autoGenerateId: false,
                confirmDelete: true
            }
        },
        equivalencias: {
            // Información de display
            displayName: "Equivalencias",
            displayNameSingular: "Equivalencia",
            icon: "📋",
            
            // Configuración de campos para la tabla
            fields: [
                { 
                    key: "uuid", 
                    label: "UUID", 
                    type: "text", 
                    required: true,
                    unique: true
                },
                { 
                    key: "identifier", 
                    label: "Identificador", 
                    type: "text"
                },
                { 
                    key: "vendor_id", 
                    label: "Vendor ID", 
                    type: "text"
                },
                { 
                    key: "type", 
                    label: "Tipo", 
                    type: "text"
                },
                { 
                    key: "equivalences", 
                    label: "Equivalencias", 
                    type: "array", 
                    display: "count"
                }
            ],
            
            // Template para nuevos registros
            template: {
                uuid: "",
                identifier: "",
                vendor_id: "",
                type: "",
                equivalences: []
            },

            // Configuraciones específicas de la entidad
            config: {
                validateOnSave: true,
                autoGenerateId: false,
                confirmDelete: true
            }
        }
    }
};

// =============================================================================
// UTILIDADES DE CONFIGURACIÓN
// =============================================================================

/**
 * Obtiene la configuración de una entidad específica
 * @param {string} entityKey - Clave de la entidad
 * @returns {Object|null} Configuración de la entidad o null si no existe
 */
function getEntityConfig(entityKey) {
    return ENTITY_CONFIG.entities[entityKey] || null;
}

/**
 * Obtiene todas las claves de entidades disponibles
 * @returns {Array<string>} Array con las claves de todas las entidades
 */
function getEntityKeys() {
    return Object.keys(ENTITY_CONFIG.entities);
}

/**
 * Obtiene la configuración global del sistema
 * @returns {Object} Configuración global
 */
function getGlobalSettings() {
    return ENTITY_CONFIG.settings;
}

/**
 * Valida si una entidad existe en la configuración
 * @param {string} entityKey - Clave de la entidad a validar
 * @returns {boolean} True si la entidad existe, false en caso contrario
 */
function entityExists(entityKey) {
    return entityKey in ENTITY_CONFIG.entities;
}

/**
 * Obtiene los campos visibles de una entidad para la tabla
 * @param {string} entityKey - Clave de la entidad
 * @returns {Array} Array de campos configurados para mostrar en tabla
 */
function getEntityTableFields(entityKey) {
    const config = getEntityConfig(entityKey);
    return config ? config.fields : [];
}

/**
 * Obtiene el template de una entidad para crear nuevos registros
 * @param {string} entityKey - Clave de la entidad
 * @returns {Object} Template de la entidad
 */
function getEntityTemplate(entityKey) {
    const config = getEntityConfig(entityKey);
    return config ? { ...config.template } : {};
}

// =============================================================================
// EJEMPLO DE CÓMO AGREGAR UNA NUEVA ENTIDAD
// =============================================================================

/*
Para agregar una nueva entidad, simplemente agrega una entrada en ENTITY_CONFIG.entities:

productos: {
    displayName: "Productos",
    displayNameSingular: "Producto",
    icon: "🛍️",
    
    fields: [
        { key: "codigo", label: "Código", type: "text", required: true, unique: true },
        { key: "nombre", label: "Nombre", type: "text", required: true },
        { key: "precio", label: "Precio", type: "currency" },
        { key: "stock", label: "Stock", type: "number" },
        { key: "categoria", label: "Categoría", type: "text" }
    ],
    
    template: {
        codigo: "",
        nombre: "",
        precio: 0,
        stock: 0,
        categoria: "",
        activo: true
    },
    
    config: {
        validateOnSave: true,
        autoGenerateId: true,
        confirmDelete: true
    }
}

¡Y listo! El Data Manager automáticamente reconocerá y manejará la nueva entidad.
*/

// Exportar configuración para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ENTITY_CONFIG,
        getEntityConfig,
        getEntityKeys,
        getGlobalSettings,
        entityExists,
        getEntityTableFields,
        getEntityTemplate
    };
}
