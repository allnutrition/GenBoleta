# Servicio de Actualización de Productos

Este servicio se encarga de actualizar automáticamente el archivo Excel de productos (`productos.xlsx`) desde una base de datos SQL Server. El servicio está diseñado para ejecutarse como un servicio de Windows en segundo plano y actualizará el archivo dos veces al día.

## Estructura del archivo Excel

El archivo generado contiene dos hojas:
- **Productos**: Contiene los datos de productos con las columnas ALU, Descripcion, CodigoBarra y Precio
- **UltimaAct**: Registra la fecha y hora de la última actualización

## Requisitos previos

- Node.js (versión 12 o superior)
- NPM (incluido con Node.js)
- Permisos de administrador para instalar servicios de Windows

## Instalación

1. Abrir una terminal como administrador
2. Navegar al directorio del servicio:
   ```
   cd c:\Users\Usuario\Downloads\Desarrollos\GenBoleta\services\ProductUpdateService
   ```
3. Instalar las dependencias:
   ```
   npm install
   ```
4. Instalar el servicio de Windows:
   ```
   npm run install-service
   ```

## Uso

### Probar el servicio (ejecución manual)

Para realizar una actualización inmediata del archivo Excel sin instalar el servicio:

```
npm run test
```

### Administrar el servicio de Windows

Una vez instalado como servicio de Windows, puedes administrarlo desde el Administrador de servicios de Windows o usando los siguientes comandos:

- Para desinstalar el servicio:
  ```
  npm run uninstall-service
  ```

## Configuración

La configuración del servicio se encuentra en el archivo `config.js`. Puedes modificar:

- Credenciales de la base de datos
- Consulta SQL
- Ruta del archivo Excel
- Horarios de actualización (formato cron)
- Configuración de logs

## Logs

Los logs del servicio se almacenan en la carpeta `logs` dentro del directorio del servicio, lo que permite realizar seguimiento de las actualizaciones y posibles errores.