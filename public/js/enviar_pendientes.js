let isProcessing = false;

async function cargarDocumentos() {
    try {
        const response = await fetch('/obtener_pendientes');
        const data = await response.json();

        const selectContainer = document.getElementById('selectContainer');
        const select = document.getElementById('documentoSelect');
        const message = document.getElementById('message');
        const enviarButton = document.getElementById('enviarButton');

        // Limpiar las opciones existentes en el combo, excepto la opción por defecto
        select.innerHTML = '<option value="">Seleccione un documento...</option>';

        if (data.error) {
            // Mostrar mensaje de error si no hay documentos y ocultar el combo y el botón de enviar
            message.textContent = data.error;
            selectContainer.style.display = 'none';
            enviarButton.style.display = 'none';
        } else {
            // Ocultar el mensaje de error y mostrar el combo
            message.textContent = ''; // Limpiar cualquier mensaje de error
            selectContainer.style.display = 'block';

            // Añadir las opciones de documentos al combo
            data.documentos.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc;
                option.textContent = doc;
                select.appendChild(option);
            });

            // Mostrar el botón enviar deshabilitado hasta que se seleccione un documento
            enviarButton.style.display = 'block';
            enviarButton.disabled = true;
        }
    } catch (error) {
        document.getElementById('message').textContent = "Error al cargar los documentos.";
        console.error("Error al cargar documentos:", error);
    }
}

function toggleEnviarButton() {
    const select = document.getElementById('documentoSelect');
    const enviarButton = document.getElementById('enviarButton');
    // Habilitar el botón solo si hay un documento seleccionado
    enviarButton.disabled = (select.value === "");
}

async function enviarDocumento() {
    if (isProcessing) return;  // Evitar doble clic
    isProcessing = true;
    document.getElementById('enviarButton').disabled = true;

    const documento = document.getElementById('documentoSelect').value;

    try {
        const response = await fetch('/enviar_pendientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento })
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message || "Documento enviado correctamente.");

            // Remover el documento del combo ya que fue enviado correctamente
            const select = document.getElementById('documentoSelect');
            select.remove(select.selectedIndex);

            toggleEnviarButton();

            // Si ya no hay opciones en el combo, mostrar el mensaje de "No existen documentos..."
            if (select.options.length === 1) { // Solo la opción "Seleccione un documento..."
                document.getElementById('message').textContent = "No existen documentos disponibles para sincronizar.";
                document.getElementById('selectContainer').style.display = 'none';
                document.getElementById('enviarButton').style.display = 'none';
            }
        } else {
            const errorData = await response.json().catch(() => null);
            alert(errorData?.error || "No se pudo enviar el documento al servidor externo. Intente nuevamente.");
            console.error("Error del servidor:", response.status, errorData);
            cargarDocumentos();
        }
    } catch (error) {
        alert("El servidor no está disponible. Verifique la conexión o si el servicio está activo.");
        console.error("Error de red capturado en el catch:", error);
    } finally {
        isProcessing = false;
        document.getElementById('enviarButton').disabled = false;
    }
}

// Cargar los documentos pendientes al cargar la página
document.addEventListener('DOMContentLoaded', cargarDocumentos);