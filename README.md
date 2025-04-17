# GenBoleta

Sistema para generar boletas electrónicas sin necesidad de conexión a Internet continua en tiendas. Permite la emisión de documentos tributarios electrónicos (DTE) mediante servicios SOAP y mantiene una base de datos de productos actualizada.

## Descripción General

GenBoleta es una aplicación de punto de venta que permite:

1. Generar boletas electrónicas (DTE Tipo 39) utilizando servicios SOAP
2. Funcionar sin conexión continua a internet
3. Gestionar catálogo de productos desde archivo Excel
4. Enviar documentos cuando se restituye la conexión
5. Visualizar e imprimir boletas en formato PDF

## Características Principales

- **Generación de Boletas**: Solicita folios y genera boletas electrónicas mediante servicios SOAP
- **Modo Sin Internet**: Almacena transacciones pendientes para envío futuro
- **Interfaz Web**: Acceso mediante navegador en `http://localhost:1000`
- **Bandeja de Sistema**: Se ejecuta minimizado en la bandeja del sistema de Windows
- **Portable**: Sistema de distribución para facilitar la instalación en tiendas

## Requisitos del Sistema

- Node.js 16 o superior
- Windows 7/10/11
- Permisos de administrador (para instalar servicios y crear directorios)
- Conexión a internet (intermitente)

## Instalación

### Instalación Normal

1. Asegúrate de tener Node.js instalado (https://nodejs.org)
2. Ejecuta `npm install` en la raíz del proyecto para instalar dependencias
3. Para iniciar: `npm start`

### Instalación Portable (para tiendas)

1. Ejecuta `npm run create-exe` para crear una distribución portable
2. Copia la carpeta `dist` o el archivo ZIP generado a la tienda
3. En la tienda, ejecuta `instalar.bat` como administrador
4. Para iniciar, ejecuta `GenBoleta.vbs`

## Configuración

La configuración se realiza mediante el archivo `config/config.override.json` con los siguientes parámetros principales:

```json
{
  "VALIDAR_PRODUCTOS": true,
  "NUMERO_TIENDA": 42,
  "LOG_LEVEL": "debug"
}
```

Parámetros disponibles:
- `VALIDAR_PRODUCTOS`: Verifica productos contra el catálogo (true/false)
- `NUMERO_TIENDA`: Identificador único de la tienda
- `LOG_LEVEL`: Nivel de detalle en logs (debug, info, warn, error)
- `RUT_EMISOR`: RUT de la empresa emisora
- `RUT_ENVIA`: RUT autorizado para enviar
- `RAZON_SOCIAL`: Nombre de la empresa
- `SOAP_WSDL_URL`: URL del servicio SOAP para DTE

## Estructura de Directorios

- `/config`: Archivos de configuración
- `/controllers`: Controladores para rutas HTTP
- `/data`: Catálogo de productos (productos.xlsx)
- `/logs`: Archivos de registro
- `/output`: Boletas generadas y JSON pendientes/enviados
- `/public`: Archivos estáticos (CSS, JS, imágenes)
- `/routes`: Definición de rutas de la API
- `/scripts`: Scripts de construcción y distribución
- `/services`: Servicios funcionales
- `/utils`: Utilidades comunes
- `/views`: Plantillas de interfaz

## Servicios Disponibles

### Servicio de Actualización de Productos

Este servicio actualiza automáticamente el archivo Excel de productos (`data/productos.xlsx`) con datos obtenidos desde SQL Server. El servicio se ejecuta como un proceso en segundo plano de Windows, actualizando los datos dos veces al día.

#### Características:
- Actualización automática del catálogo de productos desde SQL Server
- Ejecución programada dos veces al día (8:00 AM y 3:00 PM por defecto)
- Registro de fecha y hora de última actualización
- Sistema de logs para seguimiento de operaciones

#### Instalación del servicio:

1. Abrir una terminal como administrador
2. Navegar al directorio del servicio:
   ```
   cd services\ProductUpdateService
   ```
3. Instalar dependencias:
   ```
   npm install
   ```
4. Instalar el servicio de Windows:
   ```
   npm run install-service
   ```

#### Prueba del servicio:

Para probar el servicio sin instalarlo como servicio de Windows:
```
cd services\ProductUpdateService
npm run test
```

Este comando ejecutará una actualización inmediata del archivo Excel.

## Distribución y Creación de Portable

El proyecto incluye scripts para generar versiones portables:

1. Para crear la distribución: `npm run create-exe`
2. Para añadir solo el servicio a una distribución existente: `npm run add-product-service`

La distribución portable incluye:
- Aplicación principal GenBoleta
- Servicio de actualización de productos
- Scripts de instalación y configuración
- Documentación básica

## Desarrollo

Para contribuir al desarrollo:

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Modo desarrollo: `npm run dev`
4. La aplicación estará disponible en `http://localhost:1000`

## Solución de Problemas

1. Para problemas de conexión, revisa los logs en:
   - `/logs/app.log` (logs de la aplicación principal)
   - `/services/ProductUpdateService/logs` (logs del servicio de actualización)

2. Para problemas con el servicio, puedes:
   - Ejecutar una prueba manual: `npm run test` en la carpeta del servicio
   - Desinstalar y reinstalar el servicio
   - Verificar que SQL Server es accesible con las credenciales proporcionadas

## Soporte

Para soporte contacte al administrador del sistema.