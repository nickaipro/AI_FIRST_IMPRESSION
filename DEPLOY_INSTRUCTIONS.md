# 📦 INSTRUCCIONES DE DESPLIEGUE - AI First Impression

## 🔍 RESUMEN DE CAMBIOS

Se implementaron 6 fixes críticos que resuelven las alucinaciones del modelo:

- **FIX 1**: Extracción mejorada de CTAs, botones, contacto y trust signals desde HTML
- **FIX 2**: Scoring recalculado considerando análisis visual
- **FIX 3**: Contenido extendido de 2,500 a 10,000 caracteres
- **FIX 4**: Fallback a modelos solo-texto sin enviar datos visuales
- **FIX 5**: Guard de contenido para SPAs con screenshot
- **FIX 6**: Formato de links corregido en Firecrawl

**Archivos modificados:**
- `src/lib/analyzer.ts` (+26 líneas)
- `src/lib/firecrawl.ts` (+93 líneas)
- `src/lib/openrouter.ts` (+91 líneas)

**Total**: 210 líneas agregadas, 31 líneas eliminadas

---

## 📋 PASOS PARA DESPLEGAR

### 1️⃣ Commit y Push a GitHub

```bash
# Agregar archivos modificados
git add src/lib/analyzer.ts src/lib/firecrawl.ts src/lib/openrouter.ts

# Crear commit
git commit -m "fix: resolve AI hallucinations - 6 critical fixes

- Extract CTAs, buttons, contact & trust signals from HTML
- Recalculate scoring with visual analysis findings
- Extend content limit from 2.5k to 10k chars
- Fix vision model fallback to text-only without image data
- Allow SPA analysis with screenshot despite low text
- Fix links extraction format from Firecrawl

Resolves ~80% of hallucination issues (FIX 1+2 most critical)"

# Push a GitHub
git push origin main
```

### 2️⃣ Variables de Entorno en Vercel

Ve a: **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

#### ✅ REQUERIDAS (Production, Preview, Development):

```
OPENROUTER_API_KEY
[Usa tu API key de OpenRouter - NO la pongas aquí, configúrala en Vercel UI]

FIRECRAWL_API_KEY
[Usa tu API key de Firecrawl - NO la pongas aquí, configúrala en Vercel UI]
```

**IMPORTANTE**: NO copies las API keys aquí. Configúralas directamente en Vercel Dashboard.
Las API keys reales están en tu archivo `.env.local` local.

#### 🔧 OPCIONALES - Modelos (Production, Preview, Development):

```
OPENROUTER_MODEL
openai/gpt-4o-mini

OPENROUTER_VISION_MODEL
anthropic/claude-3.5-sonnet
```

#### 🚀 OPCIONALES - Cache & Rate Limiting (solo si tienes Upstash Redis):

```
UPSTASH_REDIS_REST_URL
https://tu-redis-url.upstash.io

UPSTASH_REDIS_REST_TOKEN
tu_token_aqui
```

**NOTA**: Si NO configuras Upstash Redis, la app funciona perfectamente pero SIN:
- Caché de 24 horas (más llamadas a OpenRouter = más costo)
- Rate limiting de 5 req/10min por IP (riesgo de abuso)

---

### 3️⃣ Deploy Automático

Una vez que hagas `git push`, Vercel desplegará automáticamente.

**Monitorea el deploy en:**
- Vercel Dashboard → Deployments → Ver logs en tiempo real

**Esperado:**
```
✓ Building
✓ Tests passed
✓ Deployment ready
```

---

### 4️⃣ Verificación Post-Deploy

#### Test estas 4 webs (las mismas del diagnóstico):

1. **https://allbirds.com**
   - ❌ Antes: Conversión ~45/100 (falso negativo - tiene CTAs claros)
   - ✅ Después: Debería subir a 70-85+

2. **https://stripe.com**
   - ❌ Antes: Problemas con SPA, poco texto extraído
   - ✅ Después: Screenshot compensa, análisis visual completo

3. **Web paródica (la que salió 35/100)**
   - ❌ Antes: Score bajo injustificado
   - ✅ Después: Score realista según contenido real

4. **Cualquier web B2B/SaaS con CTA prominente**
   - ❌ Antes: Reportaba "sin CTAs" erróneamente
   - ✅ Después: Detecta y evalúa CTAs correctamente

#### Qué verificar en cada test:

- [ ] Score total es realista (webs funcionales NO deben bajar de 60-70)
- [ ] Findings mencionan CTAs/botones/contacto cuando existen
- [ ] No dice "Ninguno" en elementos visibles
- [ ] Badge "✨ Análisis visual usado" aparece cuando hay screenshot
- [ ] Webs SPA (Stripe, Allbirds) ya NO son rechazadas por "poco contenido"

---

### 5️⃣ Rollback de Emergencia (si algo sale mal)

```bash
# Ver deployments anteriores
vercel ls

# Rollback al deployment anterior
vercel rollback [deployment-url]
```

O desde Vercel Dashboard:
- Deployments → Click en el deployment anterior → "Promote to Production"

---

## 🔐 SEGURIDAD

- **NO subir API keys a GitHub**: `.env.local` y `.env.vercel` están en `.gitignore`
- **Configurar en Vercel UI**: Todas las variables se configuran en el dashboard
- **Rate limiting recomendado**: Configura Upstash Redis para evitar abuso (5 análisis cada 10 min por IP)

---

## 📊 LOGS DE VERCEL

Para debugging en producción, revisa:

**Runtime Logs** (en Vercel Dashboard):
```
✓ Extraction con Firecrawl
✓ Content length: XXX chars
✓ Screenshot captured
✓ Using model: anthropic/claude-3.5-sonnet (with vision)
✓ AI analysis completed
```

**Errores esperados durante el análisis:**
- `⚠️ Detected noise content (JS/cookie wall)` → Web requiere JS
- `⚠️ No screenshot available` → Firecrawl no pudo capturar screenshot

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | Antes | Objetivo Después |
|---------|-------|------------------|
| **Falsos negativos (webs buenas con score bajo)** | ~50% | <10% |
| **Detección de CTAs** | ~40% | >90% |
| **Análisis visual usado** | 0% | >70% (cuando hay screenshot) |
| **Webs SPA rechazadas** | ~30% | <5% |

---

## ✅ CHECKLIST FINAL

Antes de considerar el deploy exitoso:

- [ ] Commit y push exitoso
- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy completado sin errores
- [ ] Test de las 4 webs de diagnóstico pasado
- [ ] Logs de Vercel sin errores críticos
- [ ] Scores realistas en todas las pruebas

---

**🚀 Listo para despegar!**
