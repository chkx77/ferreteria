# Ferretería PRO

Sistema de gestión para ferretería — React + Vite + Firebase Firestore.

## Stack
- React 18 + Vite
- Firebase Firestore (base de datos)
- Chart.js (dashboard)
- XLSX (exportación Excel)
- Sin backend propio — todo corre en el browser

## Módulos
- **Dashboard** — ventas del mes, gráfico 14 días, top productos, alertas de stock
- **Nueva Factura** — scanner de código de barras, selector manual, descuento, IVA 21%, impresión
- **Historial** — facturas con filtro, vista detalle, impresión, export Excel
- **Inventario** — ABM completo, margen por producto, export Excel
- **Compras** — órdenes a proveedores, recepción actualiza stock automáticamente
- **Proveedores** — ABM con condición de pago y contacto

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 — configurá Firebase desde la pantalla "Firebase Config".

## Deploy en Vercel

1. Subí esta carpeta a un repositorio GitHub
2. En vercel.com → New Project → importá el repo
3. Vercel detecta Vite automáticamente → Deploy

## Firebase

1. Creá un proyecto en console.firebase.google.com
2. Activá Firestore Database
3. Configurá las reglas (modo desarrollo):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Desde la app, en **Firebase Config**, pegá las credenciales de tu proyecto

## Scanner de código de barras

Los lectores USB/Bluetooth envían el código seguido de Enter.
El sistema los detecta automáticamente en la pantalla de ventas.
También podés escribir el código manualmente en el campo de scanner.

Para que funcione, los productos deben tener el campo **Código** cargado en Inventario.

## Estructura

```
src/
  components/
    App.jsx          — router principal
    Sidebar.jsx
    Dashboard.jsx
    Ventas.jsx       — facturación + scanner
    Historial.jsx
    Inventario.jsx
    Compras.jsx
    Proveedores.jsx
    Config.jsx
    UI.jsx           — componentes reutilizables
  hooks/
    useFirestore.js  — todas las operaciones de DB
    useToast.jsx     — sistema de notificaciones
  lib/
    firebase.js      — inicialización
    utils.js         — formateo, constantes
    print.js         — impresión de facturas
  index.css          — estilos globales
  main.jsx
```
