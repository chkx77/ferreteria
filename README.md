# Ferretería PRO

Aplicación web de gestión de inventario, ventas, compras y proveedores. Incluye gráficos, importación/exportación XLSX y comprobantes imprimibles. No integra facturación fiscal.

## Tecnologías
React 18, JavaScript, Vite, Firebase Authentication y Firestore, Chart.js, react-chartjs-2 y XLSX.

## Estado
Actualización con acceso por usuario habilitado, validación de stock y transacciones. La activación en una instalación existente requiere aplicar las reglas y habilitar cuentas. No es un sistema multiempresa: las cuentas habilitadas comparten el mismo comercio.

## Instalación
Requiere Node.js 22 y npm.

```sh
npm install
npm test
npm run dev
npm run build
```

## Configurar Firebase
1. Crear un proyecto de demostración y activar Firestore y Authentication con email/contraseña.
2. Copiar la configuración web en la pantalla de configuración de la aplicación. No ingresar claves de servicio del servidor.
3. Crear las cuentas desde la consola de Authentication.
4. En Firestore crear un documento `access/{UID}` por cuenta autorizada, con `enabled: true`. La aplicación no permite que un usuario se autorice a sí mismo.
5. Publicar las reglas de `firestore.rules`, luego ingresar con una cuenta habilitada.

## Diseño
`src/components`: pantallas y componentes compartidos. `src/hooks/useFirestore.js`: acceso a datos. `src/lib`: Firebase, cálculos, formato e impresión.

Las ventas leen existencias y guardan venta y stock en una transacción. El identificador de venta evita registrar dos veces el mismo comprobante. La recepción de compras verifica el estado pendiente y actualiza stock junto con la orden.

## Límites y próximos pasos
- El filtro por sucursal no equivale a permisos separados ni inventarios separados.
- Los miembros habilitados son operadores de confianza del comercio y pueden editar datos. Para controles estrictos de negocio, mover ventas al servidor.
- Revisar la paginación: algunas consultas están limitadas a 200 registros.
- Agregar auditoría y probar impresión, lectores y XLSX con dispositivos reales.
- Antes de reemplazar reglas de una base existente, respaldarla y verificar cuentas e importaciones.

## Soporte
`permission-denied`: revisar Authentication, UID, documento access y reglas. Un fallo de red no significa que el usuario esté habilitado. Si una venta falla, consultar el historial antes de repetirla.

## Presentación profesional
Proyecto personal o académico de Matías Romero. El código y la documentación describen su alcance; no se atribuyen clientes, métricas ni experiencia de producción no verificados.

## Comprobaciones
El workflow de GitHub Actions instala dependencias y compila el proyecto. El resultado del workflow, y no la existencia de este apartado, determina si la verificación pasó.

## Datos para demostraciones
Usar datos ficticios. No subir bases de datos, contraseñas, claves de servicio ni exportaciones con datos personales.
