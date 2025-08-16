// Integración con localStorage - reemplaza Google Apps Script
let datosGlobales = null;
let datosFacturasGlobales = null;
let cargandoDatos = false;
let estadosContenedores = {}; // Para guardar estados por factura

// Funciones de compatibilidad para acceder a datos JSON del localStorage
function getDatosOrdenes() {
    const data = localStorage.getItem('poc_data_ordenes');
    return data ? JSON.parse(data) : [];
}

function getDatosFacturas() {
    const data = localStorage.getItem('poc_data_facturas');
    return data ? JSON.parse(data) : [];
}

// =============================================================================
// INTEGRACIÓN CON SISTEMA DE EVENTOS DEL DATA MANAGER
// =============================================================================

/**
 * Actualiza el dropdown de facturas automáticamente
 * Función reutilizable para eventos del Data Manager
 */
function actualizarDropdownFacturas(facturasData = null) {
    
    // Usar datos proporcionados o cargar desde localStorage
    const datosFacturas = facturasData || getDatosFacturas();
    
    if (!datosFacturas || datosFacturas.length === 0) {
        const selectFacturas = document.getElementById('invoice-select');
        if (selectFacturas) {
            selectFacturas.innerHTML = '<option value="">No hay facturas disponibles</option>';
        }
        return;
    }
    
    // Procesar external_ids únicos para el dropdown
    const facturasUnicas = [];
    const external_ids_vistos = new Set();
    
    datosFacturas.forEach(factura => {
        if (factura.external_id && !external_ids_vistos.has(factura.external_id)) {
            external_ids_vistos.add(factura.external_id);
            facturasUnicas.push({
                external_id: factura.external_id,
                sap_order_id: factura.sap_order_id,
                vendor_name: factura.vendor_name
            });
        }
    });
    
    // Ordenar facturas por external_id
    facturasUnicas.sort((a, b) => a.external_id.localeCompare(b.external_id));
    
    // Poblar el dropdown
    const selectFacturas = document.getElementById('invoice-select');
    if (!selectFacturas) {
        return;
    }
    
    // Guardar selección actual para mantenerla si existe
    const seleccionActual = selectFacturas.value;
    
    // Limpiar y repoblar
    selectFacturas.innerHTML = '';
    
    if (facturasUnicas.length > 0) {
        facturasUnicas.forEach((factura, index) => {
            const option = document.createElement('option');
            option.value = factura.external_id;
            option.textContent = `${factura.external_id} - ${factura.vendor_name}`;
            selectFacturas.appendChild(option);
        });
        
        // Restaurar selección anterior si todavía existe
        if (seleccionActual && [...selectFacturas.options].some(opt => opt.value === seleccionActual)) {
            selectFacturas.value = seleccionActual;
        } else {
            // Si no existe, seleccionar la primera
            selectFacturas.selectedIndex = 0;
        }
        
        // Mostrar indicador de sincronización
        mostrarIndicadorSincronizacion();
    } else {
        selectFacturas.innerHTML = '<option value="">No hay facturas válidas</option>';
    }
    
    // Actualizar datos globales
    datosFacturasGlobales = datosFacturas;
}

/**
 * Muestra indicador temporal de sincronización
 */
function mostrarIndicadorSincronizacion() {
    const indicator = document.getElementById('sync-status');
    if (indicator) {
        indicator.style.display = 'block';
        indicator.style.opacity = '1';
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            indicator.style.opacity = '0.5';
            setTimeout(() => {
                indicator.style.display = 'none';
                indicator.style.opacity = '1';
            }, 1000);
        }, 3000);
    }
}

/**
 * Configura los event listeners para el Data Manager
 * Se ejecuta cuando el Data Manager está disponible
 */
function configurarEventListenersDataManager() {
    if (!window.dataManager || typeof window.dataManager.on !== 'function') {
        return;
    }
    
    // Escuchar todos los eventos de facturas y actualizar dropdown
    dataManager.on('facturas:updated', function(event) {
        actualizarDropdownFacturas(event.detail.data);
    });
    
    dataManager.on('facturas:deleted', function(event) {
        // Se dispara facturas:updated después, así que no necesitamos hacer nada aquí
    });
    
    dataManager.on('facturas:cleared', function(event) {
        actualizarDropdownFacturas([]);
    });
}

/**
 * Intenta configurar los event listeners, con reintentos si el Data Manager no está listo
 */
function inicializarIntegracionDataManager() {
    // Intentar configuración inmediata
    if (window.dataManager) {
        configurarEventListenersDataManager();
        return;
    }
    
    // Escuchar mensajes cross-frame para casos donde Data Manager está en otra ventana
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'dataManagerEvent') {
            // Procesar eventos de facturas
            if (event.data.eventType.startsWith('facturas:')) {
                actualizarDropdownFacturas();
            }
        }
    });
    
    // Escuchar evento de inicialización del Data Manager
    document.addEventListener('manager:initialized', function(event) {
        configurarEventListenersDataManager();
    });
    
    // Fallback: intentar cada segundo por 10 segundos
    let intentos = 0;
    const maxIntentos = 10;
    const intervalo = setInterval(() => {
        intentos++;
        if (window.dataManager) {
            configurarEventListenersDataManager();
            clearInterval(intervalo);
        } else if (intentos >= maxIntentos) {
            clearInterval(intervalo);
        }
    }, 1000);
}



/**
 * FALLBACK: Polling de localStorage para detectar cambios
 * Como último recurso si los eventos no funcionan
 */
let lastFacturasCount = 0;
let lastFacturasHash = '';

function iniciarPollingFacturas() {
    // Obtener estado inicial
    const facturas = getDatosFacturas();
    lastFacturasCount = facturas?.length || 0;
    lastFacturasHash = JSON.stringify(facturas?.map(f => f.external_id).sort());
    
    // Polling cada 2 segundos como fallback
    setInterval(() => {
        const facturasActuales = getDatosFacturas();
        const countActual = facturasActuales?.length || 0;
        const hashActual = JSON.stringify(facturasActuales?.map(f => f.external_id).sort());
        
        // Detectar cambios
        if (countActual !== lastFacturasCount || hashActual !== lastFacturasHash) {
            actualizarDropdownFacturas(facturasActuales);
            lastFacturasCount = countActual;
            lastFacturasHash = hashActual;
        }
    }, 2000);
}

function mostrarLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
    // Ocultar todo el layout principal, no solo el main-container
    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout) {
        mainLayout.classList.add('content-hidden');
    }
}

function ocultarLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
    // Mostrar todo el layout principal
    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout) {
        mainLayout.classList.remove('content-hidden');
    }
}

function cargarDatosIniciales() {
    if (cargandoDatos) return;
    cargandoDatos = true;
    mostrarLoading();
    
    // Variables para controlar cuando ambas cargas terminan
    let datosOrdenesCompletos = false;
    let datosFacturasCompletos = false;
    
    function verificarCargaCompleta() {
        if (datosOrdenesCompletos && datosFacturasCompletos) {
            cargandoDatos = false;
            ocultarLoading();
            // Ahora que tenemos ambos datos, mostrar contenedores de la primera factura
            mostrarContenedoresPrimeraFactura();
        }
    }
    
    // Cargar datos de Ordenes desde localStorage
    try {
        const datosOrdenes = getDatosOrdenes();
        console.log('Datos de órdenes cargados desde localStorage:', datosOrdenes.length, 'registros');
        datosGlobales = datosOrdenes;
        datosOrdenesCompletos = true;
        verificarCargaCompleta();
    } catch (error) {
        console.error('Error cargando datos de órdenes desde localStorage:', error);
        datosOrdenesCompletos = true; // Marcar como completo aunque haya error
        verificarCargaCompleta();
    }
    
    // Cargar todos los datos de facturas al mismo tiempo
    cargarDatosFacturasSinMostrar(function() {
        datosFacturasCompletos = true;
        verificarCargaCompleta();
    });
}

function agregarSeccion(buttonElement) {
    // Determinar el contenedor basado en el botón que se clickeó
    const container = buttonElement ? 
        buttonElement.closest('.container').querySelector('.sections-container') :
        document.querySelector('.sections-container'); // Fallback para compatibilidad
    
    if (!container) {
        console.error('No se encontró el contenedor de secciones');
        return;
    }
    
    const template = container.querySelector('.section');
    const newSection = template.cloneNode(true);
    newSection.style.display = 'block';

    // Inicializar el dropdown personalizado de la nueva sección
    const dropdown = newSection.querySelector('.custom-dropdown');
    initializeCustomDropdown(dropdown);
    
    // Agregar event listener al dropdown personalizado
    dropdown.addEventListener('dropdown-change', function(e) {
        // Actualizar todas las opciones disponibles
        actualizarOpciones();
        // Actualizar estado del botón después de seleccionar
        actualizarEstadoBotonAgregar();
    });

    // Agregar validación al input de unidades
    const unitsInput = newSection.querySelector('.units-input');
    agregarValidacionUnidades(unitsInput);

    container.appendChild(newSection);
    
    // Actualizar solo el contenedor específico
    const containerElement = container.closest('.container');
    actualizarBotonesEliminarEnContenedor(containerElement);
    actualizarOpciones();
    actualizarEstadoBotonAgregarEnContenedor(containerElement);
    
    // Scroll automático para mostrar la nueva sección y el botón agregar
    setTimeout(() => {
        scrollToEndOfCardsContainer(buttonElement);
    }, 100);
}

// Nueva función para agregar sección a un contenedor específico
function agregarSeccionAContenedor(containerElement, skipOptionsUpdate = false, skuCoincidente = null) {
    const sectionsContainer = containerElement.querySelector('.sections-container');
    const template = sectionsContainer.querySelector('.section');
    const newSection = template.cloneNode(true);
    newSection.style.display = 'block';

    // Si hay SKU coincidente, configurar la sección como restringida
    if (skuCoincidente) {
        configurarSeccionConSkuForzado(newSection, skuCoincidente);
    } else {
        // Comportamiento normal - inicializar dropdown normalmente
        const dropdown = newSection.querySelector('.custom-dropdown');
        initializeCustomDropdown(dropdown);
        
        // Agregar event listener al dropdown personalizado
        dropdown.addEventListener('dropdown-change', function(e) {
            actualizarOpciones();
            actualizarEstadoBotonAgregarEnContenedor(containerElement);
        });
    }

    // Agregar validación al input de unidades
    const unitsInput = newSection.querySelector('.units-input');
    agregarValidacionUnidades(unitsInput);

    sectionsContainer.appendChild(newSection);
    
    // Solo actualizar botones de eliminar si no hay coincidencia exacta
    if (!skuCoincidente) {
        actualizarBotonesEliminarEnContenedor(containerElement);
    }
    
    // Solo actualizar opciones si no se está inicializando masivamente y no hay coincidencia exacta
    if (!skipOptionsUpdate && !skuCoincidente) {
        actualizarOpciones();
    }
    
    // Solo actualizar estado del botón si no hay coincidencia exacta
    if (!skuCoincidente) {
        actualizarEstadoBotonAgregarEnContenedor(containerElement);
    }
}

function scrollToEndOfCardsContainer(buttonElement) {
    // Encontrar el contenedor de cards más cercano al botón
    const addButton = buttonElement || document.querySelector('.add-button');
    if (addButton) {
        // Buscar el contenedor padre que contiene tanto las cards como el botón
        const containerWithButton = addButton.closest('.container');
        if (containerWithButton) {
            // Calcular la posición del final del contenedor
            const containerRect = containerWithButton.getBoundingClientRect();
            const containerBottom = containerRect.bottom + window.scrollY;
            
            // Scroll hasta el final del contenedor específico con margen
            window.scrollTo({ 
                top: containerBottom - window.innerHeight + 50, // 50px de margen
                behavior: 'smooth' 
            });
        }
    }
}

function eliminarSeccion(button) {
    // Función obsoleta - ahora se usa eliminarSeccionDeContenedor
    const containerElement = button.closest('.container');
    eliminarSeccionDeContenedor(button, containerElement);
}

function actualizarOpciones() {
    if (datosGlobales) {
        // Usar datos ya cargados
        procesarOpciones(datosGlobales);
    } else {
        // Si no hay datos globales, cargarlos desde localStorage
        try {
            const datos = getDatosOrdenes();
            datosGlobales = datos;
            procesarOpciones(datos);
        } catch (error) {
            console.error('Error cargando datos de órdenes:', error);
        }
    }
}

function procesarOpciones(datos) {
    // Obtener el external_id de la factura actual
    const selectFacturas = document.getElementById('invoice-select');
    const external_id_actual = selectFacturas ? selectFacturas.value : null;
    
    if (!external_id_actual) {
        console.error('No se puede determinar la factura actual');
        return;
    }
    
    // Obtener el número de orden de compra asociada a esta factura
    const numeroOrdenCompra = obtenerOrdenDeCompraDeFactura(external_id_actual);
    console.log(`Factura ${external_id_actual} está asociada a la OC ${numeroOrdenCompra}`);
    
    if (!numeroOrdenCompra) {
        console.error('No se encontró orden de compra para la factura actual');
        return;
    }
    
    // Filtrar datos de Ordenes para obtener solo los SKUs de la OC correspondiente
    const skusPermitidos = [];
    
    // Buscar la orden que coincida con el sap_order_id
    const ordenCorrespondiente = datos.find(orden => orden.sapOrderId === numeroOrdenCompra);
    
    if (ordenCorrespondiente && ordenCorrespondiente.details) {
        ordenCorrespondiente.details.forEach(detail => {
            skusPermitidos.push({
                value: detail.vendorSku,                    // vendorSku de la orden
                text: detail.vendorSku,                     // mostrar vendorSku
                description: detail.item.title,             // título del item como descripción
                unitPrice: detail.unitPrice,               // precio unitario para validaciones futuras
                materialId: detail.materialId,             // ID del material
                quantity: detail.quantity                  // cantidad de la orden
            });
        });
    }
    
    console.log(`SKUs permitidos para OC ${numeroOrdenCompra}:`, skusPermitidos);
    
    // Obtener todos los valores seleccionados actualmente de TODOS los contenedores
    const allSections = document.querySelectorAll('.container:not(.item-container-template) .sections-container .section[style*="block"]');
    const valoresSeleccionados = [];
    allSections.forEach(section => {
        const dropdown = section.querySelector('.custom-dropdown');
        const selectedValue = dropdown.getAttribute('data-value');
        if (selectedValue && selectedValue !== 'Otro') {
            valoresSeleccionados.push(selectedValue);
        }
    });
    
    // Actualizar cada dropdown en todos los contenedores
    allSections.forEach(section => {
        // *** NUEVA VALIDACIÓN: Saltar secciones con SKU forzado ***
        if (section.hasAttribute('data-sku-forzado')) {
            console.log('Saltando sección con SKU forzado:', section.getAttribute('data-sku-forzado'));
            return;
        }
        
        const dropdown = section.querySelector('.custom-dropdown');
        const valorActual = dropdown.getAttribute('data-value') || '';
        
        // Preparar opciones filtradas por OC
        const options = [];
        
        // Agregar solo los SKUs permitidos para esta OC
        skusPermitidos.forEach(sku => {
            // Solo agregar la opción si no está seleccionada en otra card o es el valor actual
            if (sku.value === valorActual || !valoresSeleccionados.includes(sku.value)) {
                options.push(sku);
            }
        });
        
        // Agregar "Otro" siempre al final (hardcodeado)
        options.push({
            value: 'Otro',
            text: 'Otro',
            description: ''
        });

        // Poblar el dropdown personalizado
        populateCustomDropdown(dropdown, options, valorActual);
        
        // Actualizar descripción si hay una opción seleccionada
        if (valorActual) {
            actualizarDescripcionProducto(dropdown);
        }
    });
}



// Función para actualizar el campo formato basado en las unidades
function actualizarFormatoSegunUnidades(unitsInput) {
    const section = unitsInput.closest('.section');
    if (!section) return;
    
    const formatInput = section.querySelector('.format-field input');
    if (!formatInput) return;
    
    const unidades = parseInt(unitsInput.value) || 1;
    
    if (unidades === 1) {
        // Si unidades = 1: Formato = "Unidad" y no editable
        formatInput.value = 'Unidad';
        formatInput.readOnly = true;
        formatInput.style.backgroundColor = '#f3f4f6';
        formatInput.style.color = '#6b7280';
        formatInput.style.cursor = 'not-allowed';
    } else {
        // Si unidades ≠ 1: Formato editable y valor por defecto "Pack"
        if (formatInput.value === 'Unidad') {
            formatInput.value = 'Pack'; // Cambiar a valor por defecto
        }
        formatInput.readOnly = false;
        formatInput.style.backgroundColor = '#ffffff';
        formatInput.style.color = '';
        formatInput.style.cursor = '';
    }
    
    console.log(`Formato actualizado para ${unidades} unidades: ${formatInput.value} (editable: ${!formatInput.readOnly})`);
}

function agregarValidacionUnidades(input) {
    const container = input.parentElement;
    const errorDiv = container.parentElement.querySelector('.field-error');

    function validarCampo() {
        const valor = input.value.trim();
        
        if (valor === '') {
            // Campo vacío - mostrar error
            errorDiv.style.display = 'block';
            input.classList.add('error');
            return false;
        } else {
            // Campo con valor - ocultar error
            errorDiv.style.display = 'none';
            input.classList.remove('error');
            
            // Validar que sea un entero positivo
            const numero = parseInt(valor);
            if (isNaN(numero) || numero < 1) {
                input.value = '1';
            }
            
            // *** NUEVA VALIDACIÓN: Actualizar formato según unidades ***
            actualizarFormatoSegunUnidades(input);
            
            return true;
        }
    }

    // Validar en tiempo real
    input.addEventListener('input', function() {
        // Permitir solo números
        let valor = this.value.replace(/[^0-9]/g, '');
        this.value = valor;
        validarCampo();
    });

    // Validar al perder foco
    input.addEventListener('blur', validarCampo);

    // Prevenir entrada de caracteres no numéricos
    input.addEventListener('keypress', function(e) {
        if (!/[0-9]/.test(e.key) && 
            !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Validación inicial
    validarCampo();
}

function actualizarBotonesEliminar() {
    // Actualizar botones en todos los contenedores
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    containers.forEach(container => {
        actualizarBotonesEliminarEnContenedor(container);
    });
}

function actualizarBotonesEliminarEnContenedor(containerElement) {
    const sections = containerElement.querySelectorAll('.sections-container .section[style*="block"]');
    
    // Primero eliminar todos los botones de cierre existentes
    sections.forEach(section => {
        const closeButton = section.querySelector('.close-button');
        if (closeButton) {
            closeButton.remove();
        }
    });
    
    // Solo agregar botones de cierre si hay más de una sección visible
    if (sections.length > 1) {
        sections.forEach(section => {
                const closeButton = document.createElement('span');
            closeButton.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            `;
                closeButton.className = 'close-button';
            closeButton.onclick = function() { eliminarSeccionDeContenedor(this, containerElement); };
                section.appendChild(closeButton);
        });
    }
}

function eliminarSeccionDeContenedor(button, containerElement) {
    button.parentElement.remove();
    actualizarBotonesEliminarEnContenedor(containerElement);
    actualizarOpciones();
    actualizarEstadoBotonAgregarEnContenedor(containerElement);
}

function manejarCambioMultipleProductos(containerElement) {
    const select = containerElement.querySelector('.multiple-products-select');
    const addButton = containerElement.querySelector('.add-button');
    const sections = containerElement.querySelectorAll('.sections-container .section[style*="block"]');
    
    if (select.value === 'no') {
        // Ocultar botón "Agregar más"
        addButton.classList.add('hidden');
        
        // Cambiar texto del label a "Unidades por formato"
        actualizarTextoUnidadesEnContenedor(containerElement, 'Unidades por formato');
        
        // Mostrar campo "Formato"
        manejarVisibilidadFormatoEnContenedor(containerElement, true);
        
        // Si hay más de una sección, eliminar las adicionales
        if (sections.length > 1) {
            // Mantener solo la primera sección
            for (let i = 1; i < sections.length; i++) {
                sections[i].remove();
            }
            // Actualizar botones y opciones después de eliminar
            actualizarBotonesEliminarEnContenedor(containerElement);
            actualizarOpciones();
        }
    } else if (select.value === 'si') {
        // Mostrar botón "Agregar más"
        addButton.classList.remove('hidden');
        
        // Cambiar texto del label a "Unidades facturadas"
        actualizarTextoUnidadesEnContenedor(containerElement, 'Unidades facturadas');
        
        // Ocultar campo "Formato"
        manejarVisibilidadFormatoEnContenedor(containerElement, false);
        
        // Actualizar estado del botón según validación
        actualizarEstadoBotonAgregarEnContenedor(containerElement);
    }
}

function inicializarEstadoInicialContenedor(containerElement) {
    const select = containerElement.querySelector('.multiple-products-select');
    const addButton = containerElement.querySelector('.add-button');
    
    // Como el valor inicial es "no", configurar estado inicial
    if (select.value === 'no') {
        addButton.classList.add('hidden');
        actualizarTextoUnidadesEnContenedor(containerElement, 'Unidades por formato');
        manejarVisibilidadFormatoEnContenedor(containerElement, true);
    }
}

function actualizarTextoUnidades(nuevoTexto) {
    // Actualizar en todos los contenedores
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    containers.forEach(container => {
        actualizarTextoUnidadesEnContenedor(container, nuevoTexto);
    });
}

function actualizarTextoUnidadesEnContenedor(containerElement, nuevoTexto) {
    // Actualizar el texto en todas las secciones existentes del contenedor
    const sections = containerElement.querySelectorAll('.sections-container .section[style*="block"]');
    sections.forEach(section => {
        // Buscar específicamente el label del campo de unidades (que está antes del units-container)
        const unitsContainer = section.querySelector('.units-container');
        if (unitsContainer) {
            const inputField = unitsContainer.closest('.input-field');
            if (inputField) {
                const label = inputField.querySelector('label');
                if (label) {
                    label.textContent = nuevoTexto;
                }
            }
        }
    });
    
    // También actualizar el template para nuevas secciones
    const template = containerElement.querySelector('.sections-container .section[style*="none"]');
    if (template) {
        const unitsContainer = template.querySelector('.units-container');
        if (unitsContainer) {
            const inputField = unitsContainer.closest('.input-field');
            if (inputField) {
                const label = inputField.querySelector('label');
                if (label) {
                    label.textContent = nuevoTexto;
                }
            }
        }
    }
}

function manejarVisibilidadFormato(mostrar) {
    // Manejar visibilidad en todos los contenedores
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    containers.forEach(container => {
        manejarVisibilidadFormatoEnContenedor(container, mostrar);
    });
}

function manejarVisibilidadFormatoEnContenedor(containerElement, mostrar) {
    // Manejar visibilidad en todas las secciones existentes del contenedor
    const sections = containerElement.querySelectorAll('.sections-container .section[style*="block"]');
    sections.forEach(section => {
        const formatField = section.querySelector('.format-field');
        if (formatField) {
            if (mostrar) {
                formatField.classList.remove('hidden');
            } else {
                formatField.classList.add('hidden');
            }
        }
    });
    
    // También actualizar el template para nuevas secciones
    const template = containerElement.querySelector('.sections-container .section[style*="none"]');
    if (template) {
        const formatField = template.querySelector('.format-field');
        if (formatField) {
            if (mostrar) {
                formatField.classList.remove('hidden');
            } else {
                formatField.classList.add('hidden');
            }
        }
    }
}

function validarProductosSeleccionados() {
    // Validar en todos los contenedores
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    let todosCompletos = true;
    
    containers.forEach(container => {
        if (!validarProductosSeleccionadosEnContenedor(container)) {
            todosCompletos = false;
        }
    });
    
    return todosCompletos;
}

function validarProductosSeleccionadosEnContenedor(containerElement) {
    const sections = containerElement.querySelectorAll('.sections-container .section[style*="block"]');
    let todosCompletos = true;
    
    sections.forEach(section => {
        const dropdown = section.querySelector('.custom-dropdown');
        const selectedValue = dropdown.getAttribute('data-value');
        if (!selectedValue || selectedValue === '') {
            todosCompletos = false;
        }
    });
    
    return todosCompletos;
}

function actualizarEstadoBotonAgregar() {
    // Actualizar estado en todos los contenedores
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    containers.forEach(container => {
        actualizarEstadoBotonAgregarEnContenedor(container);
    });
}

function actualizarEstadoBotonAgregarEnContenedor(containerElement) {
    const addButton = containerElement.querySelector('.add-button');
    const select = containerElement.querySelector('.multiple-products-select');
    
    // Solo validar si el dropdown está en "SI"
    if (select.value === 'si') {
        const todosCompletos = validarProductosSeleccionadosEnContenedor(containerElement);
        
        if (todosCompletos) {
            addButton.classList.remove('disabled');
        } else {
            addButton.classList.add('disabled');
        }
    }
}

function actualizarDescripcionProducto(dropdownElement) {
    const section = dropdownElement.closest('.section');
    const descriptionDiv = section.querySelector('.product-description');
    const selectedValue = dropdownElement.getAttribute('data-value');
    
    if (selectedValue && selectedValue !== '') {
        const selectedOption = dropdownElement.querySelector(`[data-value="${selectedValue}"]`);
        if (selectedOption) {
            const descripcion = selectedOption.getAttribute('data-description') || '';
            descriptionDiv.textContent = descripcion;
        } else {
            descriptionDiv.textContent = '';
        }
    } else {
        descriptionDiv.textContent = '';
    }
}

function initializeCustomDropdown(dropdownElement) {
    // Evitar inicializar múltiples veces
    if (dropdownElement.hasAttribute('data-initialized')) {
        return;
    }
    dropdownElement.setAttribute('data-initialized', 'true');
    
    const selectedDiv = dropdownElement.querySelector('.custom-dropdown-selected');
    const optionsDiv = dropdownElement.querySelector('.custom-dropdown-options');
    const arrow = dropdownElement.querySelector('.custom-dropdown-arrow');
    
    // Toggle dropdown
    selectedDiv.addEventListener('click', function() {
        const isOpen = optionsDiv.classList.contains('open');
        
        // Close all other dropdowns and clean up parent classes
        document.querySelectorAll('.custom-dropdown-options.open').forEach(dropdown => {
            dropdown.classList.remove('open');
            dropdown.parentElement.querySelector('.custom-dropdown-selected').classList.remove('open');
            dropdown.parentElement.querySelector('.custom-dropdown-arrow').classList.remove('open');
            dropdown.parentElement.classList.remove('dropdown-open');
            
            // Remove parent classes
            const section = dropdown.parentElement.closest('.section');
            const container = dropdown.parentElement.closest('.container');
            const collapsibleContent = dropdown.parentElement.closest('.collapsible-content');
            
            if (section) section.classList.remove('dropdown-parent-open');
            if (container) container.classList.remove('dropdown-parent-open');
            if (collapsibleContent) collapsibleContent.classList.remove('dropdown-parent-open');
        });
        
        if (!isOpen) {
            optionsDiv.classList.add('open');
            selectedDiv.classList.add('open');
            arrow.classList.add('open');
            dropdownElement.classList.add('dropdown-open');
            
            // Add parent classes to allow overflow
            const section = dropdownElement.closest('.section');
            const container = dropdownElement.closest('.container');
            const collapsibleContent = dropdownElement.closest('.collapsible-content');
            
            if (section) section.classList.add('dropdown-parent-open');
            if (container) container.classList.add('dropdown-parent-open');
            if (collapsibleContent) collapsibleContent.classList.add('dropdown-parent-open');
        } else {
            dropdownElement.classList.remove('dropdown-open');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownElement.contains(e.target)) {
            optionsDiv.classList.remove('open');
            selectedDiv.classList.remove('open');
            arrow.classList.remove('open');
            dropdownElement.classList.remove('dropdown-open');
            
            // Remove parent classes
            const section = dropdownElement.closest('.section');
            const container = dropdownElement.closest('.container');
            const collapsibleContent = dropdownElement.closest('.collapsible-content');
            
            if (section) section.classList.remove('dropdown-parent-open');
            if (container) container.classList.remove('dropdown-parent-open');
            if (collapsibleContent) collapsibleContent.classList.remove('dropdown-parent-open');
        }
    });
}

function populateCustomDropdown(dropdownElement, options, selectedValue = '') {
    const optionsDiv = dropdownElement.querySelector('.custom-dropdown-options');
    const selectedDiv = dropdownElement.querySelector('.custom-dropdown-selected');
    let placeholderSpan = selectedDiv.querySelector('.custom-dropdown-placeholder');
    
    // Si no existe el span, buscarlo por la clase o crear uno nuevo
    if (!placeholderSpan) {
        placeholderSpan = selectedDiv.querySelector('span:not(.custom-dropdown-arrow)');
        if (!placeholderSpan) {
            placeholderSpan = document.createElement('span');
            placeholderSpan.className = 'custom-dropdown-placeholder';
            selectedDiv.insertBefore(placeholderSpan, selectedDiv.querySelector('.custom-dropdown-arrow'));
        }
    }
    
    // Update display based on selected value
    if (!selectedValue || selectedValue === '') {
        placeholderSpan.textContent = 'Seleccione un SKU';
        placeholderSpan.className = 'custom-dropdown-placeholder';
    } else {
        const selectedOption = options.find(opt => opt.value === selectedValue);
        if (selectedOption) {
            placeholderSpan.textContent = selectedOption.text;
            placeholderSpan.className = '';
        }
    }
    
    // Clear existing options
    optionsDiv.innerHTML = '';
    
    // Add options
    options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-dropdown-option';
        optionDiv.setAttribute('data-value', option.value);
        optionDiv.setAttribute('data-description', option.description || '');
        
        if (option.value === selectedValue) {
            optionDiv.classList.add('selected');
        }
        
        optionDiv.innerHTML = `
            <div class="custom-dropdown-option-text">${option.text}</div>
            ${option.description ? `<div class="custom-dropdown-option-desc">${option.description}</div>` : ''}
        `;
        
        optionDiv.addEventListener('click', function() {
            // Update selected value
            dropdownElement.setAttribute('data-value', option.value);
            
            // Update display
            if (option.value === '') {
                placeholderSpan.textContent = 'Seleccione un SKU';
                placeholderSpan.className = 'custom-dropdown-placeholder';
            } else {
                placeholderSpan.textContent = option.text;
                placeholderSpan.className = '';
            }
            
            // Update selected state
            optionsDiv.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            optionDiv.classList.add('selected');
            
            // Close dropdown
            optionsDiv.classList.remove('open');
            selectedDiv.classList.remove('open');
            dropdownElement.querySelector('.custom-dropdown-arrow').classList.remove('open');
            dropdownElement.classList.remove('dropdown-open');
            
            // Remove parent classes
            const section = dropdownElement.closest('.section');
            const container = dropdownElement.closest('.container');
            const collapsibleContent = dropdownElement.closest('.collapsible-content');
            
            if (section) section.classList.remove('dropdown-parent-open');
            if (container) container.classList.remove('dropdown-parent-open');
            if (collapsibleContent) collapsibleContent.classList.remove('dropdown-parent-open');
            
            // Update description
            actualizarDescripcionProducto(dropdownElement);
            
            // Trigger change event for existing functionality
            const changeEvent = new CustomEvent('dropdown-change', {
                detail: { value: option.value, dropdown: dropdownElement }
            });
            dropdownElement.dispatchEvent(changeEvent);
        });
        
        optionsDiv.appendChild(optionDiv);
    });
}

// Función inicializarEstadoInicial() eliminada - ahora se maneja por contenedor individual

function toggleCollapse(iconElement) {
    // Encontrar el contenedor específico
    const container = iconElement.closest('.container');
    const collapseIcon = container.querySelector('.collapse-icon');
    const collapsibleContent = container.querySelector('.collapsible-content');
    
    // Toggle de las clases
    collapseIcon.classList.toggle('collapsed');
    collapsibleContent.classList.toggle('collapsed');
}

function cargarFacturasDisponibles() {
    console.log('Iniciando carga de facturas...');
    cargarDatosFacturasSinMostrar();
}

function cargarDatosFacturasSinMostrar(callback) {
    console.log('Cargando todos los datos de facturas...');
    
    try {
        // Cargar todos los datos de facturas desde localStorage
        const datosFacturas = getDatosFacturas();
        console.log('Datos completos de facturas recibidos:', datosFacturas.length, 'registros');
        
        // Guardar todos los datos globalmente
        datosFacturasGlobales = datosFacturas;
        
        // Procesar external_ids únicos para el dropdown
        const facturasUnicas = [];
        const external_ids_vistos = new Set();
        
        datosFacturas.forEach(factura => {
            if (factura.external_id && !external_ids_vistos.has(factura.external_id)) {
                external_ids_vistos.add(factura.external_id);
                facturasUnicas.push({
                    external_id: factura.external_id,
                    sap_order_id: factura.sap_order_id,
                    vendor_name: factura.vendor_name
                });
            }
        });
        
        // Ordenar facturas por external_id
        facturasUnicas.sort((a, b) => a.external_id.localeCompare(b.external_id));
        
        // Poblar el dropdown
        const selectFacturas = document.getElementById('invoice-select');
        selectFacturas.innerHTML = '';
        
        if (facturasUnicas.length > 0) {
            facturasUnicas.forEach((factura, index) => {
                const option = document.createElement('option');
                option.value = factura.external_id;
                option.textContent = `${factura.external_id} - ${factura.vendor_name}`;
                
                // Seleccionar automáticamente la primera factura
                if (index === 0) {
                    option.selected = true;
                }
                
                selectFacturas.appendChild(option);
                console.log(`Agregada factura: ${factura.external_id}`);
            });
            console.log('Facturas cargadas correctamente');
        } else {
            console.log('No se encontraron facturas disponibles');
        }
        
        // Ejecutar callback si se proporciona
        if (callback) callback();
    } catch (error) {
        console.error('Error cargando datos de facturas desde localStorage:', error);
        // Ejecutar callback incluso en caso de error
        if (callback) callback();
    }
}

// Función para obtener el número de orden de compra de una factura (usando external_id)
function obtenerOrdenDeCompraDeFactura(external_id) {
    if (!datosFacturasGlobales) {
        console.error('Datos de facturas no están cargados');
        return null;
    }
    
    // Buscar la factura por external_id para obtener el sap_order_id
    const factura = datosFacturasGlobales.find(f => f.external_id === external_id);
    if (factura) {
        return factura.sap_order_id;
    }
    
    return null;
}

// Función para obtener los ítems de una factura específica (usando external_id)
function obtenerItemsDeFactura(external_id) {
    if (!datosFacturasGlobales) {
        console.error('Datos de facturas no están cargados');
        return [];
    }
    
    // Buscar la factura por external_id
    const factura = datosFacturasGlobales.find(f => f.external_id === external_id);
    if (!factura) {
        console.error(`No se encontró factura con external_id: ${external_id}`);
        return [];
    }
    
    const itemsFactura = [];
    
    // Procesar todos los detalles de la factura
    if (factura.details && Array.isArray(factura.details)) {
        factura.details.forEach((detail, index) => {
            itemsFactura.push({
                external_id: factura.external_id,
                identificadorItem: detail.vendor_sku,    // vendor_sku del detalle
                cantidad: detail.quantity,              // cantidad del detalle
                precioUnitario: detail.unit_amount,     // precio unitario del detalle
                descripcion: detail.description,        // descripción del detalle
                sap_order_id: factura.sap_order_id,     // sap_order_id de la factura
                // Campos adicionales para validaciones futuras
                ean: detail.ean,
                detailId: detail.id
            });
        });
    }
    
    console.log(`Ítems encontrados para factura ${external_id}:`, itemsFactura);
    return itemsFactura;
}

// Función para guardar el estado actual de todos los contenedores
function guardarEstadosContenedores(numeroFactura) {
    console.log(`Guardando estados para factura ${numeroFactura}`);
    
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    const estados = [];
    
    containers.forEach((container, index) => {
        const itemId = container.querySelector('.item-title').textContent.split('#')[1];
        const collapseIcon = container.querySelector('.collapse-icon');
        const collapsibleContent = container.querySelector('.collapsible-content');
        const multipleProductsSelect = container.querySelector('.multiple-products-select');
        
        // Guardar estado del contenedor
        const estadoContenedor = {
            itemId: itemId,
            collapsed: collapsibleContent.classList.contains('collapsed'),
            multipleProductsValue: multipleProductsSelect.value,
            sections: []
        };
        
        // Guardar estado de cada sección
        const sections = container.querySelectorAll('.sections-container .section[style*="block"]');
        sections.forEach(section => {
            const dropdown = section.querySelector('.custom-dropdown');
            const unitsInput = section.querySelector('.units-input');
            const formatInput = section.querySelector('.format-field input');
            
            estadoContenedor.sections.push({
                selectedSKU: dropdown.getAttribute('data-value') || '',
                unitsValue: unitsInput.value || '1',
                formatValue: formatInput ? formatInput.value || 'Pack' : 'Pack'
            });
        });
        
        estados.push(estadoContenedor);
    });
    
    estadosContenedores[numeroFactura] = estados;
    console.log(`Estados guardados para factura ${numeroFactura}:`, estados);
}

// Función para verificar si un vendor_sku de factura coincide exactamente con algún vendorSku de la orden
function verificarCoincidenciaExacta(vendorSkuFactura, numeroOrdenCompra) {
    if (!datosGlobales || !vendorSkuFactura || !numeroOrdenCompra) {
        return null;
    }
    
    // Buscar la orden correspondiente
    const ordenCorrespondiente = datosGlobales.find(orden => orden.sapOrderId === numeroOrdenCompra);
    
    if (!ordenCorrespondiente || !ordenCorrespondiente.details) {
        return null;
    }
    
    // Buscar coincidencia exacta en los detalles de la orden
    const coincidencia = ordenCorrespondiente.details.find(detail => 
        detail.vendorSku === vendorSkuFactura
    );
    
    if (coincidencia) {
        return {
            value: coincidencia.vendorSku,
            text: coincidencia.vendorSku,
            description: coincidencia.item.title,
            unitPrice: coincidencia.unitPrice,
            materialId: coincidencia.materialId,
            quantity: coincidencia.quantity,
            esCoincidenciaExacta: true
        };
    }
    
    return null;
}

// Función para aplicar restricciones cuando hay coincidencia exacta
function aplicarRestriccionesCoincidenciaExacta(container, skuCoincidente) {
    console.log('Aplicando restricciones por coincidencia exacta:', skuCoincidente.value);
    
    // 1. Ocultar el dropdown "¿Necesitas agregar más de un producto a este SKU?"
    const horizontalDropdown = container.querySelector('.horizontal-dropdown');
    if (horizontalDropdown) {
        horizontalDropdown.style.display = 'none';
    }
    
    // 2. Ocultar el botón "Agregar otro producto"
    const addButton = container.querySelector('.add-button');
    if (addButton) {
        addButton.style.display = 'none';
    }
    
    // 3. Marcar el contenedor como restringido para referencia futura
    container.setAttribute('data-coincidencia-exacta', 'true');
    container.setAttribute('data-sku-forzado', skuCoincidente.value);
}

// Función para configurar una sección con SKU pre-seleccionado y restringido
function configurarSeccionConSkuForzado(section, skuCoincidente) {
    const dropdown = section.querySelector('.custom-dropdown');
    if (!dropdown) return;
    
    // Pre-seleccionar el SKU coincidente
    dropdown.setAttribute('data-value', skuCoincidente.value);
    
    // Actualizar la visualización del dropdown
    const placeholderSpan = dropdown.querySelector('.custom-dropdown-selected span:not(.custom-dropdown-arrow)');
    if (placeholderSpan) {
        placeholderSpan.textContent = skuCoincidente.text;
        placeholderSpan.className = '';
    }
    
    // Actualizar descripción
    const descriptionDiv = section.querySelector('.product-description');
    if (descriptionDiv) {
        descriptionDiv.textContent = skuCoincidente.description;
    }
    
    // Deshabilitar el dropdown (visual y funcionalmente)
    const selectedDiv = dropdown.querySelector('.custom-dropdown-selected');
    if (selectedDiv) {
        selectedDiv.style.cursor = 'not-allowed';
        selectedDiv.style.backgroundColor = '#f3f4f6';
        selectedDiv.style.color = '#6b7280';
    }
    
    // Remover event listeners del dropdown para deshabilitarlo
    const newDropdown = dropdown.cloneNode(true);
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
    
    // Marcar la sección como restringida
    section.setAttribute('data-sku-forzado', skuCoincidente.value);
    
    console.log('Sección configurada con SKU forzado:', skuCoincidente.value);
}

// Función para crear contenedores por cada ítem de la factura
function crearContenedoresPorItem(itemsFactura) {
    console.log('Creando contenedores para ítems:', itemsFactura);
    
    const containersWrapper = document.getElementById('containers-wrapper');
    const template = containersWrapper.querySelector('.item-container-template');
    
    // Limpiar contenedores existentes (excepto el template)
    const existingContainers = containersWrapper.querySelectorAll('.container:not(.item-container-template)');
    existingContainers.forEach(container => container.remove());
    
    // Crear un contenedor por cada ítem
    itemsFactura.forEach((item, index) => {
        const newContainer = template.cloneNode(true);
        newContainer.classList.remove('item-container-template');
        newContainer.style.display = 'block';
        
        // Actualizar título y descripción
        const titleElement = newContainer.querySelector('.item-title');
        const descriptionElement = newContainer.querySelector('.item-description');
        
        titleElement.textContent = `SKU en la factura: #${item.identificadorItem}`;
        descriptionElement.textContent = item.descripcion || 'Sin descripción disponible';
        
        // Asignar IDs únicos para evitar conflictos
        const containerId = `item-container-${index}`;
        newContainer.id = containerId;
        
        // Actualizar IDs de elementos internos para que sean únicos
        const multipleProductsSelect = newContainer.querySelector('.multiple-products-select');
        const sectionsContainer = newContainer.querySelector('.sections-container');
        const addButton = newContainer.querySelector('.add-button');
        
        multipleProductsSelect.id = `multiple-products-select-${index}`;
        sectionsContainer.id = `sections-container-${index}`;
        
        // Inicializar el contenedor
        inicializarContenedor(newContainer, index, item.identificadorItem);
        
        // Agregar al wrapper
        containersWrapper.appendChild(newContainer);
        
        console.log(`Contenedor creado para ítem: ${item.identificadorItem}`);
    });
    
    console.log(`Se crearon ${itemsFactura.length} contenedores`);
}

// Función para restaurar el estado de los contenedores
function restaurarEstadosContenedores(numeroFactura) {
    console.log(`Restaurando estados para factura ${numeroFactura}`);
    
    const estadosGuardados = estadosContenedores[numeroFactura];
    if (!estadosGuardados) {
        console.log(`No hay estados guardados para factura ${numeroFactura}`);
        return;
    }
    
    const containers = document.querySelectorAll('.container:not(.item-container-template)');
    
    containers.forEach((container, index) => {
        const itemId = container.querySelector('.item-title').textContent.split('#')[1];
        const estadoContenedor = estadosGuardados.find(estado => estado.itemId === itemId);
        
        if (estadoContenedor) {
            console.log(`Restaurando estado para ${itemId}:`, estadoContenedor);
            
            // Restaurar estado de colapso
            const collapseIcon = container.querySelector('.collapse-icon');
            const collapsibleContent = container.querySelector('.collapsible-content');
            const multipleProductsSelect = container.querySelector('.multiple-products-select');
            
            if (estadoContenedor.collapsed) {
                collapseIcon.classList.add('collapsed');
                collapsibleContent.classList.add('collapsed');
            } else {
                collapseIcon.classList.remove('collapsed');
                collapsibleContent.classList.remove('collapsed');
            }
            
            // Restaurar valor del dropdown múltiple
            multipleProductsSelect.value = estadoContenedor.multipleProductsValue;
            
            // Restaurar secciones
            const sectionsContainer = container.querySelector('.sections-container');
            const existingSections = sectionsContainer.querySelectorAll('.section[style*="block"]');
            
            // Eliminar secciones existentes
            existingSections.forEach(section => section.remove());
            
            // *** VERIFICAR COINCIDENCIA EXACTA ANTES DE RESTAURAR ***
            const numeroOrdenCompra = obtenerOrdenDeCompraDeFactura(numeroFactura);
            const skuCoincidente = verificarCoincidenciaExacta(itemId, numeroOrdenCompra);
            
            if (skuCoincidente) {
                console.log(`Re-aplicando restricciones por coincidencia exacta para ${itemId}:`, skuCoincidente);
                
                // Re-aplicar restricciones al contenedor
                aplicarRestriccionesCoincidenciaExacta(container, skuCoincidente);
                
                // Recrear secciones con SKU forzado
                estadoContenedor.sections.forEach((sectionState, sectionIndex) => {
                    agregarSeccionAContenedor(container, true, skuCoincidente); // Pasar SKU coincidente
                    
                    const newSection = sectionsContainer.querySelector('.section[style*="block"]:last-child');
                    const unitsInput = newSection.querySelector('.units-input');
                    const formatInput = newSection.querySelector('.format-field input');
                    
                    // Solo restaurar valores de unidades y formato (el SKU ya está forzado)
                    unitsInput.value = sectionState.unitsValue;
                    if (formatInput) formatInput.value = sectionState.formatValue;
                    
                    // *** APLICAR VALIDACIÓN DE FORMATO ***
                    actualizarFormatoSegunUnidades(unitsInput);
                });
            } else {
                // Comportamiento normal - no hay coincidencia exacta
                estadoContenedor.sections.forEach((sectionState, sectionIndex) => {
                    agregarSeccionAContenedor(container, true); // Skip options update durante restauración
                    
                    const newSection = sectionsContainer.querySelector('.section[style*="block"]:last-child');
                    const dropdown = newSection.querySelector('.custom-dropdown');
                    const unitsInput = newSection.querySelector('.units-input');
                    const formatInput = newSection.querySelector('.format-field input');
                    
                    // Restaurar valores
                    if (sectionState.selectedSKU) {
                        dropdown.setAttribute('data-value', sectionState.selectedSKU);
                        const placeholderSpan = dropdown.querySelector('.custom-dropdown-selected span:not(.custom-dropdown-arrow)');
                        if (placeholderSpan) {
                            placeholderSpan.textContent = sectionState.selectedSKU;
                            placeholderSpan.className = '';
                        }
                        actualizarDescripcionProducto(dropdown);
                    }
                    
                    unitsInput.value = sectionState.unitsValue;
                    if (formatInput) formatInput.value = sectionState.formatValue;
                    
                    // *** APLICAR VALIDACIÓN DE FORMATO ***
                    actualizarFormatoSegunUnidades(unitsInput);
                });
            }
            
            // Aplicar comportamiento del dropdown múltiple solo si no hay coincidencia exacta
            if (!skuCoincidente) {
                manejarCambioMultipleProductos(container);
            }
        }
    });
    
    // Las opciones se actualizarán desde manejarCambioFactura después de esta función
}

// Función para inicializar un contenedor individual
function inicializarContenedor(container, index, itemId) {
    const multipleProductsSelect = container.querySelector('.multiple-products-select');
    const addButton = container.querySelector('.add-button');
    const collapseIcon = container.querySelector('.collapse-icon');
    const collapsibleContent = container.querySelector('.collapsible-content');
    
    // Configurar estado inicial
    addButton.classList.add('hidden'); // Inicialmente oculto (valor "no")
    
    // Colapsar todos los contenedores excepto el primero (index 0) - solo si no hay estados guardados
    const numeroFacturaActual = document.getElementById('invoice-select').value;
    const hayEstadosGuardados = estadosContenedores[numeroFacturaActual];
    
    if (!hayEstadosGuardados && index > 0) {
        collapseIcon.classList.add('collapsed');
        collapsibleContent.classList.add('collapsed');
    }
    
    // *** NUEVA VALIDACIÓN: Verificar coincidencia exacta ***
    const numeroOrdenCompra = obtenerOrdenDeCompraDeFactura(numeroFacturaActual);
    const skuCoincidente = verificarCoincidenciaExacta(itemId, numeroOrdenCompra);
    
    if (skuCoincidente) {
        console.log(`Coincidencia exacta encontrada para ${itemId}:`, skuCoincidente);
        
        // Aplicar restricciones al contenedor
        aplicarRestriccionesCoincidenciaExacta(container, skuCoincidente);
        
        // Agregar sección con SKU pre-seleccionado y restringido
        if (!hayEstadosGuardados) {
            agregarSeccionAContenedor(container, true, skuCoincidente); // Pasar el SKU coincidente
        }
    } else {
        // Comportamiento normal - no hay coincidencia exacta
        
        // Agregar event listener para cambios en el dropdown múltiple
        multipleProductsSelect.addEventListener('change', function() {
            manejarCambioMultipleProductos(container);
        });
        
        // Agregar primera sección automáticamente (solo si no hay estados guardados)
        if (!hayEstadosGuardados) {
            agregarSeccionAContenedor(container, true); // Skip options update durante inicialización
            
            // Inicializar estado inicial
            setTimeout(() => {
                inicializarEstadoInicialContenedor(container);
            }, 100);
        }
    }
}

// Función para mostrar contenedores de la primera factura al cargar
function mostrarContenedoresPrimeraFactura() {
    const selectFacturas = document.getElementById('invoice-select');
    if (selectFacturas && selectFacturas.options.length > 0) {
        // Obtener la primera factura (ya está seleccionada por defecto)
        const numeroFacturaSeleccionada = selectFacturas.value;
        console.log('Mostrando contenedores para la primera factura:', numeroFacturaSeleccionada);
        
        // Establecer factura actual
        facturaActual = numeroFacturaSeleccionada;
        
        // Obtener los ítems de la primera factura
        const itemsFactura = obtenerItemsDeFactura(numeroFacturaSeleccionada);
        
        // Crear contenedores por cada ítem
        crearContenedoresPorItem(itemsFactura);
        
        // Actualizar opciones después de crear todos los contenedores
        setTimeout(() => {
            actualizarOpciones();
        }, 300);
    }
}

// Variable para rastrear la factura actual
let facturaActual = null;

// Función para manejar el cambio de factura seleccionada
function manejarCambioFactura() {
    const selectFacturas = document.getElementById('invoice-select');
    const numeroFacturaSeleccionada = selectFacturas.value;
    
    console.log('Factura seleccionada:', numeroFacturaSeleccionada);
    
    // Guardar estados de la factura anterior si existe
    if (facturaActual && facturaActual !== numeroFacturaSeleccionada) {
        guardarEstadosContenedores(facturaActual);
    }
    
    // Actualizar factura actual
    facturaActual = numeroFacturaSeleccionada;
    
    // Obtener los ítems de la factura seleccionada
    const itemsFactura = obtenerItemsDeFactura(numeroFacturaSeleccionada);
    
    // Crear contenedores por cada ítem
    crearContenedoresPorItem(itemsFactura);
    
    // Restaurar estados si existen, luego actualizar opciones
    setTimeout(() => {
        restaurarEstadosContenedores(numeroFacturaSeleccionada);
        // Actualizar opciones después de que todo esté inicializado
        setTimeout(() => {
            actualizarOpciones();
        }, 100);
    }, 200);
}

document.addEventListener('DOMContentLoaded', function() {
    // Iniciar la carga de datos al cargar la página (ahora incluye facturas)
    cargarDatosIniciales();
    
    // Agregar event listener para cambios en el selector de facturas
    const selectFacturas = document.getElementById('invoice-select');
    if (selectFacturas) {
        selectFacturas.addEventListener('change', manejarCambioFactura);
    }
    
    // 🔔 NUEVA INTEGRACIÓN: Configurar event listeners del Data Manager
    inicializarIntegracionDataManager();
    
    // 🧪 PRUEBA DIRECTA: Polling de localStorage para detectar cambios
    iniciarPollingFacturas();
});
