@echo off
echo Reiniciando Servicio de Actualizacion de Productos...
cd %~dp0

:: Desinstalar el servicio actual
echo Deteniendo y desinstalando servicio actual...
node uninstall-service.js
timeout /t 5

:: Limpiar instalación anterior
if exist "node_modules" rd /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"
if exist "daemon" rd /s /q "daemon"

:: Reinstalar dependencias y servicio
echo Instalando dependencias...
call npm install --production --no-package-lock

echo Instalando y arrancando el servicio...
node install-service.js

echo.
echo Reinicio completado. Verifique el estado del servicio en el
echo Administrador de servicios de Windows.
pause