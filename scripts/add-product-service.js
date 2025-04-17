const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Directorios principales
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const serviceDir = path.join(rootDir, 'services', 'ProductUpdateService');
const distServiceDir = path.join(distDir, 'services', 'ProductUpdateService');

async function addProductService() {
    try {
        console.log('Añadiendo Servicio de Actualización de Productos a la distribución...');
        
        // Verificar que el directorio dist existe
        if (!await fs.pathExists(distDir)) {
            console.error('Error: El directorio dist no existe. Por favor, ejecuta primero create-exe.js');
            return;
        }
        
        // Crear directorio de servicios en dist si no existe
        await fs.ensureDir(distServiceDir);
        
        // Archivos a incluir del servicio
        const serviceFiles = [
            'config.js',
            'dbConnection.js',
            'excelManager.js',
            'index.js',
            'install-service.js',
            'logger.js',
            'package.json',
            'README.md',
            'scheduler.js',
            'service.js',
            'test-connection.js',
            'uninstall-service.js'
        ];
        
        // Copiar archivos del servicio
        for (const file of serviceFiles) {
            const source = path.join(serviceDir, file);
            const dest = path.join(distServiceDir, file);
            
            if (await fs.pathExists(source)) {
                await fs.copy(source, dest);
                console.log(`Copiado: services/ProductUpdateService/${file}`);
            } else {
                console.warn(`Advertencia: No se encontró ${file} en el servicio`);
            }
        }
        
        // Asegurar que existe el directorio de logs para el servicio
        await fs.ensureDir(path.join(distServiceDir, 'logs'));
        
        // Crear batch para instalar el servicio
        const installBat = `@echo off
echo Instalando Servicio de Actualizacion de Productos...
cd %~dp0
npm install
node install-service.js
echo.
echo Para verificar que el servicio esta instalado, revisa el Administrador de Servicios de Windows.
pause
`;
        await fs.writeFile(path.join(distServiceDir, 'instalar-servicio.bat'), installBat);
        
        // Crear batch para desinstalar el servicio
        const uninstallBat = `@echo off
echo Desinstalando Servicio de Actualizacion de Productos...
cd %~dp0
node uninstall-service.js
echo.
echo Servicio desinstalado.
pause
`;
        await fs.writeFile(path.join(distServiceDir, 'desinstalar-servicio.bat'), uninstallBat);
        
        // Crear batch para prueba rápida
        const testBat = `@echo off
echo Probando conexion y actualizacion de productos...
cd %~dp0
node test-connection.js
echo.
pause
`;
        await fs.writeFile(path.join(distServiceDir, 'probar-servicio.bat'), testBat);
        
        // Añadir información sobre el servicio al README principal
        const mainReadmePath = path.join(distDir, 'README.txt');
        if (await fs.pathExists(mainReadmePath)) {
            let readmeContent = await fs.readFile(mainReadmePath, 'utf8');
            const serviceInfo = `
SERVICIO DE ACTUALIZACIÓN DE PRODUCTOS:
-------------------------------------
Este servicio actualiza automáticamente el archivo Excel de productos desde SQL Server.

Para configurar el servicio:
1. Configure las credenciales y opciones en 'services/ProductUpdateService/config.js'
2. Ejecute 'services/ProductUpdateService/probar-servicio.bat' para verificar la conexión
3. Ejecute 'services/ProductUpdateService/instalar-servicio.bat' para instalarlo como servicio Windows

El servicio actualizará automáticamente 'data/productos.xlsx' dos veces al día.
`;
            readmeContent += serviceInfo;
            await fs.writeFile(mainReadmePath, readmeContent);
            console.log('Actualizado README.txt con información del servicio');
        }
        
        // Modificar el archivo bat de instalar para incluir la opción de instalar el servicio
        const mainInstallerPath = path.join(distDir, 'instalar.bat');
        if (await fs.pathExists(mainInstallerPath)) {
            let installerContent = await fs.readFile(mainInstallerPath, 'utf8');
            installerContent += `
echo.
echo ¿Desea instalar también el Servicio de Actualización de Productos? (S/N)
set /p INSTALAR_SERVICIO=Respuesta: 
if /i "%INSTALAR_SERVICIO%"=="S" (
    echo.
    echo Instalando el Servicio de Actualización de Productos...
    cd services\\ProductUpdateService
    call npm install
    node install-service.js
    cd ..\\..\\ 
    echo Servicio instalado correctamente.
)
`;
            await fs.writeFile(mainInstallerPath, installerContent);
            console.log('Actualizado instalar.bat para incluir opción de instalar el servicio');
        }
        
        console.log('Integración del Servicio de Actualización de Productos completada con éxito!');
        
    } catch (error) {
        console.error('Error al añadir servicio de actualización de productos:', error);
    }
}

// Si se ejecuta directamente este script
if (require.main === module) {
    addProductService();
}

// Exportar función para usarla desde create-exe.js
module.exports = addProductService;