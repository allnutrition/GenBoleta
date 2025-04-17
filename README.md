# GenBoleta
 Genera boletas sin internet en las tiendas
12334

## Servicios Disponibles

### Servicio de Actualización de Productos

Este servicio actualiza automáticamente el archivo Excel de productos (`data/productos.xlsx`) con datos obtenidos desde SQL Server. El servicio se ejecuta como un proceso en segundo plano de Windows, actualizando los datos dos veces al día (8:00 AM y 3:00 PM por defecto).

#### Características:
- Actualización automática del catálogo de productos desde SQL Server
- Ejecución programada dos veces al día
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

Este comando ejecutará una actualización inmediata del archivo Excel que podrás revisar en `data/productos.xlsx`.

Para ver más detalles sobre este servicio, consulta la documentación en `services/ProductUpdateService/README.md`.