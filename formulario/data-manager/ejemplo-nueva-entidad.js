// =============================================================================
// EJEMPLO: CÓMO AGREGAR UNA NUEVA ENTIDAD AL DATA MANAGER
// =============================================================================

/*
Este archivo muestra cómo sería el entity-config.js si quisiéramos agregar 
una nueva entidad "productos" al sistema existente.

Para usarlo:
1. Copia el contenido de la configuración de 'productos' 
2. Pégalo en entity-config.js dentro del objeto 'entities'
3. Recarga la página
4. ¡La nueva entidad aparecerá automáticamente!
*/

// Ejemplo de configuración extendida
const ENTITY_CONFIG_EXTENDED = {
    settings: {
        storagePrefix: 'poc_data_'
    },
    
    entities: {
        // ... facturas y ordenes existentes ...
        
        // NUEVA ENTIDAD: Productos
        productos: {
            displayName: "Productos",
            displayNameSingular: "Producto",
            icon: "🛍️",
            
            fields: [
                { 
                    key: "codigo", 
                    label: "Código", 
                    type: "text", 
                    required: true
                },
                { 
                    key: "nombre", 
                    label: "Nombre", 
                    type: "text", 
                    required: true
                },
                { 
                    key: "precio", 
                    label: "Precio", 
                    type: "currency"
                },
                { 
                    key: "stock", 
                    label: "Stock", 
                    type: "number"
                },
                { 
                    key: "categoria", 
                    label: "Categoría", 
                    type: "text"
                },
                { 
                    key: "activo", 
                    label: "Activo", 
                    type: "boolean"
                },
                { 
                    key: "fechaCreacion", 
                    label: "Fecha Creación", 
                    type: "date"
                },
                { 
                    key: "tags", 
                    label: "Etiquetas", 
                    type: "array", 
                    display: "count"
                }
            ],
            
            template: {
                codigo: "",
                nombre: "",
                precio: 0,
                stock: 0,
                categoria: "",
                activo: true,
                fechaCreacion: new Date().toISOString().split('T')[0],
                tags: [],
                descripcion: "",
                proveedor: "",
                ubicacion: ""
            },
            
            config: {
                validateOnSave: true,
                autoGenerateId: false,
                confirmDelete: true
            }
        },
        
        // OTRA NUEVA ENTIDAD: Clientes
        clientes: {
            displayName: "Clientes",
            displayNameSingular: "Cliente",
            icon: "👥",
            
            fields: [
                { 
                    key: "email", 
                    label: "Email", 
                    type: "text", 
                    required: true
                },
                { 
                    key: "nombre", 
                    label: "Nombre Completo", 
                    type: "text", 
                    required: true
                },
                { 
                    key: "telefono", 
                    label: "Teléfono", 
                    type: "text"
                },
                { 
                    key: "fechaRegistro", 
                    label: "Fecha Registro", 
                    type: "date"
                },
                { 
                    key: "activo", 
                    label: "Activo", 
                    type: "boolean"
                },
                { 
                    key: "pedidos", 
                    label: "Pedidos", 
                    type: "array", 
                    display: "count"
                }
            ],
            
            template: {
                email: "",
                nombre: "",
                telefono: "",
                fechaRegistro: new Date().toISOString().split('T')[0],
                activo: true,
                pedidos: [],
                direccion: "",
                ciudad: "",
                codigoPostal: "",
                notas: ""
            },
            
            config: {
                validateOnSave: true,
                autoGenerateId: false,
                confirmDelete: true
            }
        }
    }
};

// Datos de ejemplo para productos
const EJEMPLO_PRODUCTOS = [
    {
        codigo: "PROD-001",
        nombre: "Laptop Gaming",
        precio: 1299.99,
        stock: 15,
        categoria: "Electrónicos",
        activo: true,
        fechaCreacion: "2024-01-15",
        tags: ["gaming", "laptop", "alta-gama"],
        descripcion: "Laptop gaming de alta performance",
        proveedor: "TechCorp",
        ubicacion: "Almacén A"
    },
    {
        codigo: "PROD-002",
        nombre: "Mouse Inalámbrico",
        precio: 29.99,
        stock: 50,
        categoria: "Accesorios",
        activo: true,
        fechaCreacion: "2024-01-16",
        tags: ["mouse", "inalambrico", "oficina"],
        descripcion: "Mouse inalámbrico ergonómico",
        proveedor: "AccessCorp",
        ubicacion: "Almacén B"
    }
];

// Datos de ejemplo para clientes
const EJEMPLO_CLIENTES = [
    {
        email: "juan.perez@email.com",
        nombre: "Juan Pérez García",
        telefono: "+34 600 123 456",
        fechaRegistro: "2024-01-10",
        activo: true,
        pedidos: ["ORD-001", "ORD-003"],
        direccion: "Calle Mayor 123",
        ciudad: "Madrid",
        codigoPostal: "28001",
        notas: "Cliente VIP"
    },
    {
        email: "maria.gonzalez@email.com", 
        nombre: "María González López",
        telefono: "+34 600 789 012",
        fechaRegistro: "2024-01-12",
        activo: true,
        pedidos: ["ORD-002"],
        direccion: "Avenida de la Paz 45",
        ciudad: "Barcelona",
        codigoPostal: "08001",
        notas: "Prefiere envío express"
    }
];

console.log('📋 Ejemplos de nuevas entidades cargados');
console.log('🛍️ Productos de ejemplo:', EJEMPLO_PRODUCTOS);
console.log('👥 Clientes de ejemplo:', EJEMPLO_CLIENTES);
