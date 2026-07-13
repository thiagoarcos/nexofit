# NEXO FIT — deploy en GitHub Pages

App de hábitos, gimnasio y dieta lista para publicar en GitHub Pages e instalar como PWA en tu iPhone.

## 🔒 Protección con PIN

La app arranca con una pantalla de bloqueo de 4 dígitos:

- **Primera vez que la abrís**: te pide crear un PIN de 4 dígitos (y repetirlo para confirmar).
- **Cada sesión nueva**: te pide el PIN para entrar. Una vez desbloqueada, queda así hasta que cierres la pestaña o mates la PWA.
- **Cambiar/quitar el PIN**: en la pestaña Más → sección Seguridad.
- **Si olvidás el PIN**: después de 3 intentos fallidos aparece un botón para restablecer la app (borra todos los datos y arranca de cero).

El PIN se guarda **hasheado con SHA-256** en el `localStorage` de tu iPhone (no en texto plano). Aunque alguien tenga tu link de GitHub Pages, no puede entrar sin el PIN.

## Nota sobre privacidad

- El **repositorio** puede ser privado (nadie ve el código). ✅
- La **página publicada** en GitHub Pages es **pública** en el plan gratis: cualquiera con el link la puede abrir. Sin embargo, tus datos personales NO viajan al link — se guardan en el `localStorage` de tu iPhone. Otra persona que entrara vería la app vacía como recién instalada.
- Si querés privacidad real del link, hay que agregar una pantalla de PIN al inicio de la app (avisame y lo sumamos).

## Requisitos

- **Node.js 18+**: https://nodejs.org (elegí LTS).
- **Git**: https://git-scm.com.
- **Cuenta de GitHub**: https://github.com (gratis).

Verificá en la terminal:
```bash
node -v
npm -v
git --version
```

## Paso 1: crear el repositorio en GitHub

1. Entrá a https://github.com y hacé login.
2. Arriba a la derecha: **+** → **New repository**.
3. Nombre del repo: `nexofit` (importante que coincida con el `base` del `vite.config.js`).
4. Marcá **Private**.
5. **NO** tildes "Add a README", "Add .gitignore" ni "Choose a license".
6. Clic en **Create repository**.

## Paso 2: probar la app localmente primero

Parado dentro de la carpeta `nexofit-pwa-gh`:

```bash
npm install
npm run dev
```

Abrí el link que sale (`http://localhost:5173/nexofit/`) y verificá que anda. Ctrl+C para cerrar.

## Paso 3: subir el código a GitHub

Seguí ejecutando en la misma carpeta:

```bash
git init
git add .
git commit -m "primera version de nexofit"
git branch -M main
git remote add origin https://github.com/TUUSUARIO/nexofit.git
git push -u origin main
```

Reemplazá `TUUSUARIO` por tu usuario real de GitHub. La primera vez te va a abrir una ventana para loguearte.

## Paso 4: activar GitHub Pages

1. Andá al repo en GitHub (`https://github.com/TUUSUARIO/nexofit`).
2. Tab **Settings** (arriba a la derecha).
3. Menú lateral izquierdo: **Pages**.
4. En **Source**, elegí **GitHub Actions**.
5. Listo, no hay que apretar nada más.

## Paso 5: esperar el primer deploy

1. Volvé a la tab **Actions** del repo (arriba, al lado de "Settings").
2. Vas a ver un workflow corriendo llamado "Deploy PWA to GitHub Pages".
3. Tarda 1–2 minutos. Cuando se pone en verde, tu app ya está publicada.
4. El link va a ser: **`https://TUUSUARIO.github.io/nexofit/`**

## Paso 6: instalar en tu iPhone

1. Abrí el link en **Safari** (obligatorio, no Chrome).
2. Botón **Compartir** (cuadradito con flecha para arriba).
3. Bajá y tocá **Agregar a inicio**.
4. Nombre "NEXO FIT" → **Agregar**.

Aparece el ícono verde en tu home. Se abre en pantalla completa, sin barra de Safari.

## Cómo actualizar la app

Cada vez que cambies algo del código:

```bash
git add .
git commit -m "descripción del cambio"
git push
```

GitHub Actions detecta el push, compila y publica sola. En 1–2 minutos ya está online. En tu iPhone se actualiza sola la próxima vez que abras la app.

## Si el repo no se llama "nexofit"

Editá `vite.config.js` línea 6:
```js
const BASE = "/tu-nombre-de-repo/";
```
Poné el mismo nombre que le diste al repositorio, con `/` al principio y al final.

## Problemas comunes

**"La app se ve toda blanca / no carga en el celular"**
- El `base` del `vite.config.js` no coincide con el nombre del repo. Corregilo y volvé a hacer `git push`.

**"El workflow falla en GitHub Actions"**
- Andá a la tab Actions, clic en el workflow rojo, mirá qué línea falló.
- Suele ser `npm install` por versión de Node vieja: subí la versión en `deploy.yml` (línea `node-version: 20`).

**"Instalé la PWA pero no se actualiza"**
- En Safari: Ajustes → Safari → Borrar historial y datos. Volvé a abrir el link e instalar.

**"Los recordatorios no me llegan si la app está cerrada"**
- Limitación de iOS con PWAs. Cargalos también en la app Recordatorios de tu iPhone.

## Estructura

```
nexofit-pwa-gh/
├── package.json
├── vite.config.js            base configurada para /nexofit/
├── index.html
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml        deploy automático en cada push
├── public/                   íconos
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx
    └── App.jsx               toda la app
```
