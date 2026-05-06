# ✅ VERSIÓN SOLUCIONADA: plano 2D técnico + newsletter

Esta carpeta contiene cambios visibles para comprobar que estás ejecutando la versión correcta:

- En la portada aparece una sección naranja con el texto **“Nuevo configurador disponible”**.
- Al entrar al configurador aparece un aviso con **“Versión solucionada”**.
- En el paso 4, el plano permite seleccionar elementos, moverlos, rotarlos, duplicarlos y eliminar extras.
- En el último paso aparece **“Descargar plano + presupuesto”**.
- Ese botón abre el modal **“Recibe tu plano y presupuesto orientativo”** con privacidad obligatoria y newsletter opcional.

Ejecuta `supabase/schema.sql` en Supabase antes de probar el guardado real de leads.

# Calculadora de Casetas Prefabricadas - Fase 5

Aplicación web para Módulos Prefabricados San José S.L. con configurador visual 2D tipo plano técnico sencillo.

## Novedades de esta fase

- Eliminada la horquilla de precios.
- Precio principal único: **precio estimado sin IVA**.
- Modelo de referencia real: **6 x 2,40 m = 4.750 € sin IVA**.
- Para otras medidas se usa cálculo orientativo de **330 €/m²**.
- El precio base incluye:
  - 1 puerta.
  - 1 ventana 80x80.
  - instalación eléctrica básica.
  - 1 enchufe.
  - 1 punto de luz.
  - cuadro eléctrico.
- Extras reales:
  - enchufe adicional: 50 €.
  - puerta adicional: 120 €.
  - ventana 80x80 extra: 200 €.
  - ventana grande: 250 €.
  - aire acondicionado: 600 €.
  - baño completo: 1.500 €.
  - habitación interior: 300 €.
- Plano 2D más técnico, estilo AutoCAD sencillo.
- Elementos movibles y con rotación 0º, 90º, 180º y 270º.
- Distribución guardada en `layout_json`.
- Panel privado actualizado.
- PDF actualizado sin horquilla de precios.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

## Supabase

1. Copia `.env.example` como `.env`.
2. Añade tus claves:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

3. Ejecuta `supabase/schema.sql` en Supabase > SQL Editor.
4. Crea un usuario administrador en Supabase Auth.

## Si npm install falla en Windows

Ejecuta:

```powershell
npm config set registry https://registry.npmjs.org/
npm config delete proxy
npm config delete https-proxy
npm cache clean --force
npm install --no-audit --no-fund
npm run dev
```
