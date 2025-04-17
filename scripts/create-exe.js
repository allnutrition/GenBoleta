const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');
const addProductService = require('./add-product-service');

// Directorios principales
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const zipFile = path.join(rootDir, 'genboleta-dist.zip');

async function createDistribution() {
    try {
        console.log('Creando distribución de GenBoleta...');
        
        // Limpiar y crear directorio dist
        await fs.emptyDir(distDir);
        
        // Archivos y carpetas a incluir
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
        
        // Copiar archivos necesarios
        for (const item of include) {
            const source = path.join(rootDir, item);
            const dest = path.join(distDir, item);
            
            if (await fs.pathExists(source)) {
                await fs.copy(source, dest);
                console.log(`Copiado: ${item}`);
            }
        }
        
        // Crear directorios adicionales
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
        
        // Copiar productos.xlsx
        try {
            await fs.copy(
                path.join(rootDir, 'data/productos.xlsx'),
                path.join(distDir, 'data/productos.xlsx')
            );
        } catch (err) {
            console.warn('Advertencia: No se pudo copiar productos.xlsx');
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
        
        // Crear PowerShell launcher
        const powershellScript = `
# PowerShell script para iniciar Node.js sin mostrar consola
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = "node"
$serverPath = Join-Path $scriptPath "server.js"

# Iniciar Node.js en segundo plano sin ventana
Start-Process $nodePath -ArgumentList $serverPath -WindowStyle Hidden
`;
        
        await fs.writeFile(path.join(distDir, 'launcher.ps1'), powershellScript);
        
        // Crear script VBS para lanzar PowerShell sin consola
        const vbsLauncher = `
Set objShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
strCommand = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File " & Chr(34) & strPath & "\\launcher.ps1" & Chr(34)
objShell.Run strCommand, 0, False
`;
        
        await fs.writeFile(path.join(distDir, 'GenBoleta.vbs'), vbsLauncher);
        
        // Crear archivo instalar.bat
        const instalarBat = `@echo off
echo Instalando dependencias de GeneraBoleta...
cd %~dp0
npm install --production
echo.
echo Instalacion completada!
echo Para iniciar, ejecute GenBoleta.vbs
pause
`;
        
        await fs.writeFile(path.join(distDir, 'instalar.bat'), instalarBat);
        
        // Crear iniciar-consola.bat (para debugging)
        const iniciarConsolaBat = `@echo off
echo Iniciando GeneraBoleta (modo consola)...
cd %~dp0
node server.js
pause
`;
        
        await fs.writeFile(path.join(distDir, 'iniciar-consola.bat'), iniciarConsolaBat);
        
        // Crear README.txt
        const readmeContent = `
GENERADOR DE BOLETAS ELECTRÓNICAS
=================================

INSTRUCCIONES DE INSTALACIÓN:
---------------------------
1. Asegúrate de tener Node.js 16 o superior instalado (https://nodejs.org)
2. Ejecuta el archivo 'instalar.bat' para instalar las dependencias
3. Ejecuta el archivo 'GenBoleta.vbs' para iniciar la aplicación sin consola

CONFIGURACIÓN:
------------
- Para personalizar la configuración, edita el archivo 'config/config.override.json'
- Los datos de productos se encuentran en 'data/productos.xlsx'
- Las boletas generadas se guardan en 'output/boleta'

SOPORTE:
-------
Para soporte contacte al administrador del sistema.
`;
        
        await fs.writeFile(path.join(distDir, 'README.txt'), readmeContent);
        
        // Crear acceso directo para el escritorio
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
        
        // Añadir el servicio de actualización de productos
        await addProductService();
        
        // Crear zip de distribución
        console.log('Creando archivo ZIP...');
        const output = fs.createWriteStream(zipFile);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            console.log(`Archivo ZIP creado: ${zipFile} (${archive.pointer()} bytes)`);
            console.log('Distribución completada con éxito!');
        });
        
        archive.pipe(output);
        archive.directory(distDir, false);
        await archive.finalize();
        
    } catch (error) {
        console.error('Error al crear distribución:', error);
    }
}

createDistribution();