const maxRows = 5;
let validarProductos = true;
let isGenerating = false; // Bandera para controlar el estado de generación

async function obtenerConfiguracion() {
    try {
        const response = await fetch('/obtener_configuracion');
        const data = await response.json();
        validarProductos = data.VALIDAR_PRODUCTOS;

        document.querySelectorAll('.alu, .descripcion').forEach(field => {
            field.readOnly = validarProductos;
        });

        document.getElementById('rutEmpresa').textContent = data.RUT_EMISOR || "";
        document.getElementById('razonSocial').textContent = data.RAZON_SOCIAL || "";
        document.getElementById('numeroTienda').textContent = data.NUMERO_TIENDA || "";
        document.getElementById('direccionTienda').textContent = data.DIR_ORIGEN || "";

        console.log("Datos de configuración recibidos:", data);
    } catch (error) {
        console.error("Error al obtener configuración:", error);
    }
}

obtenerConfiguracion();

function showAlert(message) {
    alert(message);
}

function addRow() {
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    const rowCount = table.rows.length;
    if (rowCount < maxRows) {
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td><input type="text" class="codigo" oninput="fetchData(this)"></td>
            <td><input type="text" class="alu" ${validarProductos ? 'readonly' : ''}></td>
            <td><input type="text" class="descripcion" ${validarProductos ? 'readonly' : ''}></td>
            <td><input type="text" class="precio" oninput="calculateTotal()"></td>
            <td><input type="number" class="cantidad" min="1" value="1" oninput="calculateTotal()" onkeydown="return event.keyCode !== 190 && event.keyCode !== 188"></td>
            <td class="action-buttons">
                <button class="add-button" onclick="addRow()">+</button>
                <button class="delete-button" onclick="removeRow(this)">Eliminar</button>
            </td>
        `;
    } else {
        showAlert("Máximo 5 productos.");
    }
}

function removeRow(button) {
    const row = button.closest("tr");
    row.remove();
    calculateTotal();
}

function calculateTotal() {
    const rows = document.querySelectorAll("#productTable tbody tr");
    let total = 0;

    rows.forEach(row => {
        const precio = parseFloat(row.querySelector(".precio").value) || 0;
        const cantidad = parseInt(row.querySelector(".cantidad").value) || 1;
        total += precio * cantidad;
    });

    document.getElementById("totalAmount").textContent = total.toFixed(0);
}

async function fetchData(input) {
    if (!validarProductos) return;
    
    const row = input.closest("tr");
    const codigo = input.value;
    if (!codigo) {
        row.querySelector('.alu').value = '';
        row.querySelector('.descripcion').value = '';
        row.querySelector('.precio').value = '';
        return;
    }
    try {
        const response = await fetch('/consultar_codigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo })
        });
        const data = await response.json();
        if (data.alu && data.precio && data.descripcion) {
            row.querySelector('.alu').value = data.alu;
            row.querySelector('.descripcion').value = data.descripcion;
            row.querySelector('.precio').value = data.precio;
            calculateTotal();
        } else {
            showAlert(data.error || 'Error al obtener datos.');
        }
    } catch (error) {
        showAlert('Error en la conexión al servidor.');
    }
}

async function generarBoleta() {
    if (isGenerating) return; // Prevenir doble solicitud

    isGenerating = true; // Marcar como en proceso
    document.querySelector(".generate-button").disabled = true; // Desactivar botón

    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    const productos = [];

    for (const row of table.rows) {
        const alu = row.querySelector('.alu')?.value || '';
        const codigo = row.querySelector('.codigo')?.value || '';
        const descripcion = row.querySelector('.descripcion')?.value || '';
        const precio = row.querySelector('.precio')?.value || '';
        const cantidad = row.querySelector('.cantidad')?.value || '';

        if (precio && cantidad) {
            productos.push({ 
                alu, 
                codigo, 
                descripcion, 
                precio: parseFloat(precio) || 0, 
                cantidad: parseInt(cantidad) || 1 
            });
        } else {
            showAlert('Por favor, complete todos los campos para cada producto.');
            isGenerating = false; // Reiniciar en caso de error
            document.querySelector(".generate-button").disabled = false; // Reactivar botón
            return;
        }
    }

    if (productos.length === 0) {
        showAlert('Por favor, ingrese al menos un producto válido.');
        isGenerating = false;
        document.querySelector(".generate-button").disabled = false;
        return;
    }

    try {
        const response = await fetch('/generar_boleta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productos })
        });
        const data = await response.json();
        showAlert(data.message || data.error || 'Error al generar la boleta.');

        if (data.pdf_url) {
            const printFrame = document.getElementById('printFrame');
            printFrame.src = data.pdf_url;
            printFrame.onload = () => {
                printFrame.contentWindow.print();
            };
        }

        // Limpiar filas y restablecer total
        table.innerHTML = `
            <tr>
                <td><input type="text" class="codigo" oninput="fetchData(this)"></td>
                <td><input type="text" class="alu" ${validarProductos ? 'readonly' : ''}></td>
                <td><input type="text" class="descripcion" ${validarProductos ? 'readonly' : ''}></td>
                <td><input type="text" class="precio" oninput="calculateTotal()"></td>
                <td><input type="number" class="cantidad" min="1" value="1" oninput="calculateTotal()" onkeydown="return event.keyCode !== 190 && event.keyCode !== 188"></td>
                <td class="action-buttons">
                    <button class="add-button" onclick="addRow()">+</button>
                    <button class="delete-button" onclick="removeRow(this)">Eliminar</button>
                </td>
            </tr>
        `;

        document.getElementById("totalAmount").textContent = "0";
    } catch (error) {
        showAlert('Error en la conexión al servidor.');
    } finally {
        isGenerating = false; // Restablecer bandera
        document.querySelector(".generate-button").disabled = false; // Reactivar botón
    }
}