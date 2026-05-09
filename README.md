# Módulos Prefabricados San José S.L.

Aplicación web comercial para captar solicitudes de presupuesto de casetas y módulos prefabricados a medida con panel sándwich.

## Funcionalidades principales

- Landing comercial orientada a SEO local para Sevilla y Andalucía.
- Calculadora de precio orientativo.
- Configurador visual 2D del módulo.
- Descarga de plano y presupuesto orientativo en PDF.
- Captación de leads en Supabase.
- Newsletter opcional.
- Panel privado para gestionar solicitudes.
- Mensaje preparado para WhatsApp.

## Precio orientativo configurado

- Modelo de referencia: **6 x 2,40 m = 4.750 € sin IVA**.
- Para otras medidas se usa un cálculo orientativo de **330 €/m²**.
- El precio base incluye:
  - 1 puerta.
  - 1 ventana 80x80.
  - instalación eléctrica básica.
  - 1 enchufe.
  - 1 punto de luz.
  - cuadro eléctrico.
- Extras configurados:
  - enchufe adicional: 50 €.
  - puerta adicional: 120 €.
  - ventana 80x80 extra: 200 €.
  - ventana grande: 250 €.
  - aire acondicionado: 600 €.
  - baño completo: 1.500 €.
  - habitación interior: 300 €.

> Los precios son orientativos. El presupuesto final debe confirmarse tras revisar medidas finales, extras, transporte, montaje y viabilidad técnica.

## Variables de entorno obligatorias

La aplicación necesita Supabase para guardar solicitudes y acceder al panel privado. Configura estas variables en Vercel y en local:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

No hay claves fallback dentro del código. Si estas variables no están configuradas, el guardado de solicitudes y el panel no funcionarán correctamente.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

## Compilar para producción

```bash
npm run build
```

## Supabase

1. Copia `.env.example` como `.env` si trabajas en local.
2. Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Ejecuta `supabase/schema.sql` en Supabase > SQL Editor.
4. Crea un usuario administrador en Supabase Auth.
5. Revisa las políticas RLS antes de publicar definitivamente.

## Acceso al panel privado

El acceso público al panel está oculto en la navegación. Para entrar al panel utiliza una URL interna:

```text
https://TU-DOMINIO.com/?admin=1
```

También funciona:

```text
https://TU-DOMINIO.com/#admin
```

Después será necesario iniciar sesión con el usuario administrador de Supabase Auth.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Añade las variables de entorno de Supabase.
3. Comprueba que el dominio definitivo apunta a la web.
4. Ejecuta un despliegue nuevo.
5. Revisa que `/robots.txt` y `/sitemap.xml` cargan correctamente.

## Seguridad básica añadida

El archivo `vercel.json` añade cabeceras básicas:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- caché larga para imágenes y assets

## Si `npm install` falla en Windows

```powershell
npm config set registry https://registry.npmjs.org/
npm config delete proxy
npm config delete https-proxy
npm cache clean --force
npm install --no-audit --no-fund
npm run dev
```
