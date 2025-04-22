const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// Directorios principales
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const zipFile = path.join(rootDir, 'genboleta-dist.zip');
const serviceDir = path.join(rootDir, 'services', 'ProductUpdateService');
const distServiceDir = path.join(distDir, 'services', 'ProductUpdateService');

async function createDistribution() {
    try {
        console.log('Creando distribución completa de GenBoleta...');
        
        // Limpiar y crear directorio dist
        await fs.emptyDir(distDir);
        
        // Archivos y carpetas principales a incluir
        const include = [
            'public',
            'views',
            'routes',
            'controllers',
            'services',
            'utils',
            'config',
            'app.js',
            'server.js',
            'tray.js',
            'package.json'
        ];
        
        // Copiar archivos principales
        for (const item of include) {
            const source = path.join(rootDir, item);
            const dest = path.join(distDir, item);
            
            if (await fs.pathExists(source)) {
                await fs.copy(source, dest);
                console.log(`Copiado: ${item}`);
            }
        }
        
        // Crear directorios necesarios
        const additionalDirs = [
            'logs',
            'output/boleta',
            'output/json/pendiente',
            'output/json/enviado',
            'data'
        ];
        
        for (const dir of additionalDirs) {
            await fs.ensureDir(path.join(distDir, dir));
        }
        
        
        // Crear config.override.json de ejemplo
        const configOverride = {
            "VALIDAR_PRODUCTOS": true,
            "NUMERO_TIENDA": 42,
            "LOG_LEVEL": "debug"
        };
        
        await fs.writeJson(
            path.join(distDir, 'config/config.override.json'),
            configOverride,
            { spaces: 2 }
        );

        // Preparar el servicio de actualización de productos
        await fs.ensureDir(distServiceDir);
        
        // Archivos del servicio a copiar
        const serviceFiles = [
            'config.js',
            'dbConnection.js',
            'excelManager.js',
            'index.js',
            'install-service.js',
            'logger.js',
            'package.json',
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
            }
        }
        
        // Crear scripts necesarios
        
        // 1. Script de PowerShell para lanzar sin consola
        const powershellScript = `
# PowerShell script para iniciar Node.js sin mostrar consola
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = "node"
$serverPath = Join-Path $scriptPath "server.js"

# Iniciar Node.js en segundo plano sin ventana
Start-Process $nodePath -ArgumentList $serverPath -WindowStyle Hidden
`;
        await fs.writeFile(path.join(distDir, 'launcher.ps1'), powershellScript);
        
        // 2. VBS Launcher
        const vbsLauncher = `
Set objShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
strCommand = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File " & Chr(34) & strPath & "\\launcher.ps1" & Chr(34)
objShell.Run strCommand, 0, False
`;
        await fs.writeFile(path.join(distDir, 'GenBoleta.vbs'), vbsLauncher);
        
        // 3. Script de instalación unificado
        const installBat = `@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo                 INSTALADOR DE GENBOLETA
echo             Sistema de Generacion de Boletas
echo ================================================================

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js no esta instalado
    echo Por favor, instale Node.js desde https://nodejs.org
    pause
    exit /b 1
)

cd %~dp0

echo.
echo [1/5] Limpiando instalacion anterior...
echo ----------------------------------------------------------------
if exist "node_modules" rd /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"
if exist "services\\ProductUpdateService\\node_modules" rd /s /q "services\\ProductUpdateService\\node_modules"
if exist "services\\ProductUpdateService\\package-lock.json" del /f /q "services\\ProductUpdateService\\package-lock.json"
if exist "services\\ProductUpdateService\\daemon" rd /s /q "services\\ProductUpdateService\\daemon"

echo.
echo [2/5] Instalando dependencias...
echo ----------------------------------------------------------------
call npm install --production --no-package-lock
if %ERRORLEVEL% NEQ 0 (
    echo Error: No se pudieron instalar las dependencias principales
    pause
    exit /b 1
)

echo.
echo [3/5] Configurando servicio de actualizacion...
echo ----------------------------------------------------------------
cd services\\ProductUpdateService

echo Instalando dependencias del servicio...
call npm install --production --no-package-lock
if %ERRORLEVEL% NEQ 0 (
    echo Error: No se pudieron instalar las dependencias del servicio
    cd ..\\..
    pause
    exit /b 1
)

echo.
echo [4/5] Instalando el servicio en Windows...
call node install-service.js
if %ERRORLEVEL% NEQ 0 (
    echo Error: No se pudo instalar el servicio
    cd ..\\..
    pause
    exit /b 1
)

cd ..\\..

echo.
echo [5/5] Configuracion del sistema...
echo ----------------------------------------------------------------
:INPUT_STORE
set /p STORE_NUMBER="Ingrese el numero de tienda (1-100): "

:: Validar que sea un número entre 1 y 100
set /a "num=%STORE_NUMBER%" 2>nul
if "%num%"=="" (
    echo Error: Debe ingresar un numero valido
    goto INPUT_STORE
)
if %num% LSS 1 (
    echo Error: El numero debe ser mayor o igual a 1
    goto INPUT_STORE
)
if %num% GTR 100 (
    echo Error: El numero debe ser menor o igual a 100
    goto INPUT_STORE
)

echo.
echo Creando archivo de configuracion...

:: Crear el archivo config.override.json
(
echo {
echo   "VALIDAR_PRODUCTOS": true,
echo   "SOAP_WSDL_URL": "http://bes-cert.bestechnology.cl/wsfactlocal/dtelocal.asmx?wsdl",
echo   "RUT_EMISOR": "76958630-K",
echo   "RAZON_SOCIAL": "ALLNUTRITION",
echo   "DIR_ORIGEN": "Av. Del Valle 577",
echo   "CMNA_ORIGEN": "Huechuraba",
echo   "CDAD_ORIGEN": "Santiago",
echo   "NUMERO_TIENDA": %STORE_NUMBER%,
echo   "ENDPOINT_URL": "http://127.0.0.1:5000/api/transform",
echo   "AUTH_TOKEN": "YhvsZK3b2yLxER92HyqplE76Lb3y1XV9v4ZGgK3HVcY",
echo   "LOG_LEVEL": "normal"
echo }
) > config.override.json

echo.
echo ================================================================
echo                   INSTALACION COMPLETADA
echo ================================================================
echo.
echo El sistema ha sido instalado correctamente:
echo  - La aplicacion principal esta lista para usar
echo  - El servicio de actualizacion esta instalado y configurado
echo  - Numero de tienda configurado: %STORE_NUMBER%
echo.
echo Para iniciar la aplicacion:
echo  1. Ejecute GenBoleta.vbs
echo  2. El servicio de actualizacion se ejecutara automaticamente
echo.
echo Para verificar el servicio:
echo  1. Abra el Administrador de servicios de Windows
echo  2. Busque "ActualizadorProductosGenBoleta"
echo  3. El servicio deberia estar en estado "En ejecucion"
echo.
echo Si necesita reinstalar el servicio:
echo  1. Vaya a la carpeta services\\ProductUpdateService
echo  2. Ejecute instalar-servicio.bat
echo.
pause`;

        await fs.writeFile(path.join(distDir, 'instalar.bat'), installBat);
        
        // 4. Script para modo consola
        const consoleBat = `@echo off
echo Iniciando GeneraBoleta (modo consola)...
cd %~dp0
node server.js
pause
`;
        await fs.writeFile(path.join(distDir, 'iniciar-consola.bat'), consoleBat);

        // Crear README unificado
        const readmeContent = `
GENERADOR DE BOLETAS ELECTRÓNICAS
=================================

INSTALACIÓN COMPLETA:
------------------
1. Extraiga todo el contenido del ZIP en una carpeta
2. Ejecute 'instalar.bat' y siga las instrucciones
3. Una vez finalizada la instalación, use 'GenBoleta.vbs' para iniciar

COMPONENTES INSTALADOS:
--------------------
1. Aplicación Principal:
   - Genera y envía boletas electrónicas
   - Interfaz web accesible en http://localhost:3000
   - Se ejecuta como aplicación de bandeja del sistema

2. Servicio de Actualización:
   - Actualiza automáticamente el catálogo de productos
   - Se ejecuta como servicio de Windows
   - Actualiza 'data/productos.xlsx' dos veces al día

ARCHIVOS IMPORTANTES:
------------------
- GenBoleta.vbs: Inicia la aplicación (sin consola)
- iniciar-consola.bat: Inicia en modo debug (con consola)
- instalar.bat: Script de instalación completa
- config/config.override.json: Configuración personalizada
- data/productos.xlsx: Catálogo de productos
- services/ProductUpdateService/config.js: Configuración del servicio

SOLUCIÓN DE PROBLEMAS:
-------------------
1. Si la aplicación no inicia:
   - Revise que Node.js esté instalado (v16 o superior)
   - Ejecute iniciar-consola.bat para ver errores
   - Verifique los logs en la carpeta 'logs'

2. Si los productos no se actualizan:
   - Verifique el servicio en el Administrador de Servicios
   - Revise la configuración en services/ProductUpdateService/config.js
   - Consulte los logs del servicio

SOPORTE:
-------
Para soporte técnico, contacte al administrador del sistema.
`;
        await fs.writeFile(path.join(distDir, 'README.txt'), readmeContent);

        // Crear acceso directo
        const createShortcutVbs = `
Set objWS = WScript.CreateObject("WScript.Shell")
strDesktop = objWS.SpecialFolders("Desktop")
strAppPath = WScript.ScriptFullName
strParentFolder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(strAppPath)
strAppPath = strParentFolder & "\\GenBoleta.vbs"

Set objShortcut = objWS.CreateShortcut(strDesktop & "\\GeneraBoleta.lnk")
objShortcut.TargetPath = strAppPath
objShortcut.WorkingDirectory = strParentFolder
objShortcut.Description = "Generador de Boletas"
objShortcut.IconLocation = strParentFolder & "\\public\\images\\All.ico, 0"
objShortcut.Save
`;
        await fs.writeFile(path.join(distDir, 'crear_acceso_directo.vbs'), createShortcutVbs);

        // Crear archivo ZIP
        console.log('Creando archivo ZIP de distribución...');
        const output = fs.createWriteStream(zipFile);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            console.log(`\nDistribución completada:`);
            console.log(`- ZIP creado: ${zipFile}`);
            console.log(`- Tamaño: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        });
        
        archive.pipe(output);
        archive.directory(distDir, false);
        await archive.finalize();
        
    } catch (error) {
        console.error('Error al crear la distribución:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createDistribution();
}

module.exports = createDistribution;