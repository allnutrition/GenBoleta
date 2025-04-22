@echo off
echo ================================================
echo Instalando Servicio de Actualizacion de Productos
echo ================================================
cd %~dp0

echo Limpiando instalacion anterior...
if exist "node_modules" rd /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"

echo.
echo Instalando dependencias del servicio...
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo Error: No se pudieron instalar las dependencias
    pause
    exit /b 1
)

echo.
echo Verificando instalacion de node-windows...
call npm list node-windows || (
    echo Instalando node-windows explicitamente...
    call npm install node-windows
)

echo.
echo Instalando el servicio en Windows...
call node install-service.js
if %ERRORLEVEL% NEQ 0 (
    echo Error: No se pudo instalar el servicio
    pause
    exit /b 1
)

echo.
echo ================================================
echo Servicio instalado correctamente!
echo Para verificar, revise el Administrador de 
echo Servicios de Windows
echo ================================================
pause