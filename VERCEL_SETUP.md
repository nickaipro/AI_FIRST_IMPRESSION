# 🚀 Guía de Despliegue en Vercel

## ✅ Pasos para configurar las variables de entorno en Vercel

### Opción 1: Importar desde archivo (Recomendado)

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **Environment Variables**
3. Haz clic en el botón **"Add Environment Variables"**
4. Selecciona **"Import from .env"**
5. Copia y pega el contenido de `.env.vercel` (que está en tu máquina local, NO se sube a GitHub)
6. Asegúrate de seleccionar **Production**, **Preview** y **Development**
7. Haz clic en **"Save"**

### Opción 2: Agregar manualmente

Si prefieres agregar las variables una por una:

```
OPENROUTER_API_KEY = [tu_api_key_de_openrouter]
OPENROUTER_MODEL = openai/gpt-4o-mini
FIRECRAWL_API_KEY = [tu_api_key_de_firecrawl]
```

**⚠️ Importante:**
- Las API keys reales están en tu archivo local `.env.vercel` (NO se sube a GitHub)
- Marca las 3 opciones: Production, Preview, Development
- Después de agregar las variables, **redeploy** tu aplicación para que tomen efecto

---

## 🔄 Redeployar después de configurar variables

Vercel re-desplegará automáticamente al hacer push, pero si ya hiciste push antes de configurar las variables:

1. Ve a tu proyecto en Vercel
2. Ve a la pestaña **Deployments**
3. Encuentra el último deployment exitoso
4. Haz clic en los tres puntos **"..."** a la derecha
5. Selecciona **"Redeploy"**
6. Confirma con **"Redeploy"**

---

## 📋 Verificar que funciona

Una vez desplegado:

1. Abre tu sitio en Vercel: `https://tu-dominio.vercel.app`
2. Prueba el formulario con una URL real
3. Si hay errores, ve a **Vercel Dashboard → Deployments → [Tu deployment] → Runtime Logs**
4. Deberías ver logs como:
   ```
   ✓ API key presente: true
   ✓ Calling OpenRouter with model: openai/gpt-4o-mini
   ✓ HTTP-Referer: https://tu-dominio.vercel.app
   ```

---

## 🐛 Troubleshooting

### Error: "Falta OPENROUTER_API_KEY en el entorno"
**Solución:** Ve a Settings → Environment Variables y agrega la API key

### Error: "OpenRouter API error (401)"
**Solución:** Verifica que la API key sea correcta y tenga saldo

### Error: "No se pudo extraer el contenido del sitio web"
**Solución:** Verifica que FIRECRAWL_API_KEY esté configurada correctamente

### Los cambios no se reflejan
**Solución:** Haz un redeploy manual desde el Dashboard de Vercel

---

## 📝 Archivo de referencia

El archivo `.env.vercel` contiene las API keys reales y está en tu máquina local.

**⚠️ NUNCA subas `.env.vercel` a GitHub** - ya está protegido en `.gitignore`
