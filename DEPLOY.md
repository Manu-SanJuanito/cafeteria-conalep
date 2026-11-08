# Cómo publicar la Cafetería CONALEP en internet

Esta guía asume que ya tienes cuenta en GitHub, [Railway](https://railway.app) y
[Vercel](https://vercel.com) (los tres tienen plan gratis suficiente para este proyecto).

## 1. Sube el proyecto a GitHub

1. Crea un repositorio nuevo (puede ser privado) en GitHub.
2. Desde la carpeta `App_Conalep` (la que contiene `backend_app` y `frontend_app`):
   ```bash
   git init
   git add .
   git commit -m "Primera versión para producción"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

## 2. Backend en Railway

1. En Railway: **New Project → Deploy from GitHub repo** → elige tu repo.
2. En **Settings → Root Directory**, pon `backend_app` (porque tu backend no está en la raíz del repo).
3. Railway detecta `requirements.txt` y el `Procfile` solo — no tienes que configurar comandos de build.
4. **Add → Database → PostgreSQL** dentro del mismo proyecto. Railway crea la variable `DATABASE_URL` automáticamente, no la tienes que escribir tú.
5. En **Variables**, agrega (usa `.env.example` del backend como referencia):
   - `SECRET_KEY` → genera una nueva con:
     ```bash
     python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
     ```
   - `DEBUG` → `False`
   - `ALLOWED_HOSTS` → el dominio que te asigne Railway (ej. `tu-app.up.railway.app`)
   - `CORS_ALLOWED_ORIGINS` → lo llenas hasta el paso 3, cuando ya tengas la URL de Vercel
6. Despliega. El `Procfile` ya corre las migraciones automáticamente en cada deploy (`release: python manage.py migrate`).
7. Crea tu superusuario de administrador desde la terminal de Railway (pestaña *Shell* del servicio):
   ```bash
   python manage.py createsuperuser
   ```

## 3. Frontend en Vercel

1. En Vercel: **Add New → Project** → importa el mismo repo de GitHub.
2. En **Root Directory**, elige `frontend_app/frontend-pos`.
3. Framework Preset: Vite (Vercel lo detecta solo).
4. En **Environment Variables**, agrega:
   - `VITE_API_URL` → `https://TU-DOMINIO-DE-RAILWAY/api`
5. Deploy. Vercel te da una URL como `https://tu-cafeteria.vercel.app`.

## 4. Conecta ambos

Regresa a Railway y actualiza la variable `CORS_ALLOWED_ORIGINS` con la URL real que te dio Vercel
(ej. `https://tu-cafeteria.vercel.app`), sin barra al final. Railway redeploya solo al guardar la variable.

## 5. Prueba todo

Desde tu celular, con datos móviles (no WiFi de la escuela, para confirmar que de verdad es público),
entra a tu link de Vercel, haz un pedido de prueba, y revisa que llegue al panel de cocina.

## Notas

- Tu `db.sqlite3` local **no se sube** a producción — Railway usa PostgreSQL, así que empiezas con
  catálogo vacío ahí. Vuelve a dar de alta tus categorías/productos/lotes desde el admin de Django
  o desde la pantalla "Nuevo Producto".
- Cada vez que yo te dé cambios nuevos: `git add . && git commit -m "..." && git push`, y tanto
  Railway como Vercel se actualizan solos.
