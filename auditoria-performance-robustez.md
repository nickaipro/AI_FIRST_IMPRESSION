# Auditoría de performance y robustez — AI First Impression

Alcance: `src/lib/{openrouter,analyzer,firecrawl,cache,scoring,rubric,validation,mock}.ts`, `src/app/api/analyze/route.ts`, frontend (`page.tsx`, `AnalysisForm.tsx`, `AnalysisReport.tsx`, `PDFReport.tsx`), `next.config.js`, `package.json`. No se modificó código; solo lectura y análisis estático.

---

## 1. Tabla de hallazgos

| # | Parte | Problema (archivo:línea) | Impacto | Esfuerzo | Fix concreto |
|---|-------|---------------------------|---------|----------|---------------|
| 1 | Rendimiento | `AnalysisReport.tsx:6-7` — `@react-pdf/renderer` y `PDFReport` se importan de forma estática. `page.tsx:5` importa `AnalysisReport` estáticamente, así que la librería (~2.9MB en disco, cientos de KB de JS) se incluye en el **First Load JS** aunque el 90%+ de las visitas nunca descarga el PDF. | Alto | Bajo | Usar `next/dynamic(() => import("./PDFReport"), { ssr: false })` para `PDFReport`, y mover `import { pdf } from "@react-pdf/renderer"` a un `await import("@react-pdf/renderer")` dentro de `downloadPDF()`. Cero cambio de comportamiento, solo carga bajo demanda. |
| 2 | Rendimiento / Robustez | `openrouter.ts:403-420` — el `fetch` a OpenRouter no tiene `AbortController`/timeout. `openrouter.ts:449-480` encadena hasta **3 llamadas secuenciales** (vision → texto → `openrouter/auto`) sin presupuesto de tiempo. Con `maxDuration=60` (`route.ts:8`), el peor caso puede colgarse hasta que Vercel mate la función con un timeout crudo (no el mensaje claro que sí existe para otros errores). | Alto | Medio | Añadir `AbortController` con ~15-20s por intento y limitar el número de fallbacks reales según presupuesto restante (p. ej. no intentar el 3er modelo si ya pasaron 40s). Lanzar error controlado antes de que Vercel corte. |
| 3 | Rendimiento / Costo | `firecrawl.ts` no redimensiona ni comprime el screenshot antes de enviarlo a `openrouter.ts:390` (`image_url.url: websiteData.screenshot`). Una imagen grande = más tokens de visión = más lento y más caro; probablemente el mayor costo individual de cada análisis. | Alto | Medio | Insertar un paso de resize/compresión (p. ej. `sharp`) acotando el lado mayor a ~1280-1568px y calidad JPEG ~75-80 antes de construir `userMessage`. |
| 4 | Rendimiento | `firecrawl.ts:20` — se pide `formats: ["markdown", "html", "screenshot", "links"]`. El campo `links` se guarda en `importantLinks` (`firecrawl.ts:149`, `analyzer.ts:28`) pero **nunca se usa** en el prompt (`openrouter.ts`) ni en la UI (`AnalysisReport.tsx`, `PDFReport.tsx`). Se paga latencia/payload de Firecrawl por nada. | Medio | Bajo | Quitar `"links"` de `formats` (o consumir `importantLinks` si en el futuro aporta valor). |
| 5 | Rendimiento | `firecrawl.ts:18-25` — el timeout de 30s es un `Promise.race`, no un abort real: si gana el timeout, la llamada a Firecrawl sigue viva del lado del servidor (gasta cuota/cómputo de Firecrawl igual). No es grave porque Vercel congela la función al responder, pero no es un timeout real. | Bajo | Medio | Si el SDK de Firecrawl expone `AbortSignal`, pasarlo; si no, aceptar la limitación y documentarla. |
| 6 | Robustez / Anti-alucinación | `analyzer.ts:64-73` — el guard de "contenido basura" solo detecta patrones de *cookie/JS wall* (regex fijas). No cubre paredes de captcha, páginas "Access Denied", 404 genéricos u otros bloqueos que sí superan los 300 caracteres y sí pasarían al modelo como contenido válido. | Medio | Bajo | Añadir patrones adicionales (`captcha`, `access denied`, `403 forbidden`, `page not found`, `verifying you are human`, etc.) y/o comparar el `title` contra una lista de páginas de error comunes. |
| 7 | Robustez / Anti-alucinación | `openrouter.ts:7,21` — `visionModel` viene de `process.env.OPENROUTER_VISION_MODEL` sin validar que sea realmente un modelo con visión. Si se configura mal, el screenshot se envía (`useVision=true`) a un modelo solo-texto **de forma silenciosa** → alucinación visual. | Medio | Bajo | Mantener una allow-list de modelos con visión conocidos (o al menos loguear/alertar si el modelo configurado no está en la lista) antes de adjuntar la imagen. |
| 8 | Robustez | `route.ts:37-65` — el chequeo de rate limit va dentro del mismo `try` general pero sin su propio `try/catch` (a diferencia de `cache.ts`, que sí degrada con gracia). Si Upstash falla a mitad de esta llamada, el usuario recibe "Error en el análisis" genérico en vez de que el sistema falle abierto (permita el análisis) como ya hace el resto de la app con Redis. | Medio | Bajo | Envolver `ratelimit.limit(ip)` en su propio try/catch; en caso de error, loguear y continuar sin bloquear (fail-open), igual que `cache.ts`. |
| 9 | Robustez | `openrouter.ts:422-426` — errores de OpenRouter (429, 402 sin crédito, 401 key inválida) se propagan como texto crudo de la API (`OpenRouter API error (429): {...}`) hasta el usuario final vía `route.ts:113-121`. Funciona (no cuelga, no 500 crudo) pero el mensaje no es amigable ni está traducido. | Bajo | Bajo | Mapear códigos conocidos (401/402/429) a mensajes en español claros antes de lanzar el error. |
| 10 | Rendimiento (percibida) | `AnalysisForm.tsx:47-58` — un solo `fetch` esperado de punta a punta; el usuario solo ve un spinner genérico "Analizando primera impresión..." durante los 30-60s reales. | Medio | Medio | No es urgente, pero conviene evaluar streaming de progreso por etapas ("Extrayendo contenido…" → "Analizando con IA…") vía SSE o polling, dado que la naturaleza secuencial (Firecrawl → OpenRouter) no se puede paralelizar. |
| 11 | Eficiencia | `cache.ts:23-27` — la cache key es `url\|targetAudience\|pageGoal`, no incluye versión del prompt/modelo. Si se cambia el prompt (como el fix de alucinación ya hecho), resultados viejos de hasta 24h pueden seguir sirviéndose sin reflejar la mejora. | Bajo | Bajo | Añadir un `PROMPT_VERSION` constante al hash de la key; incrementarla en cada cambio de prompt/lógica de scoring. |
| 12 | Limpieza | `analyzer.ts:45` — comentario "Ya no hay fallback a Playwright" es solo un comentario; **no hay dependencia de Playwright/Puppeteer en `package.json` ni en el código** (verificado). No hay código muerto real aquí. | — | — | Ninguno necesario. Correcto tal como está. |

---

## 2. Lo que ya está bien (no tocar)

- **El bug de "Ninguno"/"Ninguna" está genuinamente resuelto.** `openrouter.ts:215-228`: cuando `visibleButtons`, `callsToAction`, `trustSignals` o `contactInfo` vienen vacíos, el prompt dice explícitamente *"No extraídos estructuralmente — evalúa este elemento a partir del contenido y, sobre todo, del screenshot"*, no afirma su ausencia. Los defaults en `validateAndCalibrateResponse` (`openrouter.ts:552-558`) también caen a arrays/strings vacíos, nunca a literales tipo "Ninguno". Confirmado por grep en todo `src/`: cero ocurrencias de esas cadenas.
- **El screenshot nunca llega a un modelo solo-texto de forma silenciosa.** La imagen solo se adjunta cuando `useVision && websiteData.screenshot` (`openrouter.ts:378`), y cada fallback que cambia a modelo de texto también pone `useVision=false` explícitamente (`openrouter.ts:459,473`). Consistente en todos los caminos.
- **El guard de contenido mínimo ya distingue "poco texto + screenshot válido" de "sin nada".** `analyzer.ts:83-91` deja pasar el análisis visual aunque el texto sea corto, siempre que haya screenshot. Correcto.
- **La regla anti-alucinación central está presente y no se contradice** con los datos de entrada (`openrouter.ts:188-206`): pide citar evidencia, prohíbe afirmar ausencias no confirmadas, y el contenido que sí se inyecta es honesto sobre sus propias limitaciones.
- **El screenshot ya se pide en modo viewport, no full-page** (`formats: [...,"screenshot",...]`, no `"screenshot@fullPage"`), y no hay `waitFor` excesivo configurado — ya es la opción más liviana disponible en Firecrawl.
- **La extracción de sitio no tiene reintentos ni llamadas redundantes a Firecrawl** (una sola llamada por análisis, `analyzer.ts:37-46`).
- **El caché y el rate limiting degradan con gracia si Upstash no está configurado** (`cache.ts`, `route.ts:14-28`) — retornan `null`/deshabilitan sin romper el flujo, salvo el matiz del hallazgo #8.
- **No hay dependencias muertas de Playwright/Puppeteer.**
- **`runtime='nodejs'` es la elección correcta** (Firecrawl SDK, `crypto`, `@react-pdf/renderer` no son compatibles con Edge).

---

## 3. Los 3 cambios de mayor impacto en velocidad/costo (en orden)

1. **Lazy-load de `@react-pdf/renderer`/`PDFReport`** (hallazgo #1). Esfuerzo de minutos, reduce el First Load JS de la página principal para el 100% de las visitas, sin tocar la lógica de análisis.
2. **Timeout explícito + presupuesto de tiempo en las llamadas a OpenRouter** (hallazgo #2). Es lo más cercano a un bloqueador real: sin esto, un modelo lento o `openrouter/auto` indeciso puede consumir los 60s de `maxDuration` y terminar en un timeout crudo de Vercel en vez del mensaje de error claro que el resto de la app sí entrega.
3. **Redimensionar/comprimir el screenshot antes de mandarlo al modelo multimodal** (hallazgo #3). Es probablemente el mayor costo variable por análisis (tokens de visión) y afecta directamente la latencia de la llamada más lenta del pipeline.

(Hallazgo #4 — quitar `formats: ["links"]` — es trivial y vale hacerlo en el mismo PR que el #3, aunque su impacto individual es menor.)

---

## 4. Veredicto

**No hay un bloqueador que impida un lanzamiento controlado/soft-launch.** La parte más delicada del pedido — que la alucinación no reaparezca — está sólida: el fix viejo se sostiene en todos los caminos revisados (prompt, fallbacks, defaults), y no encontré ninguna vía por la que el screenshot llegue a un modelo solo-texto sin que el código lo sepa.

Si hay algo que sí clasificaría como "arreglar antes de tráfico real" (no antes de un soft-launch con pocos usuarios) es el **hallazgo #2**: la falta de timeout en las llamadas a OpenRouter combinada con hasta 3 intentos secuenciales dentro de una función con `maxDuration=60`. Hoy, en el peor caso (modelo lento + reintentos), el usuario no ve el mensaje de error claro que la app sí sabe dar — ve un timeout crudo de la plataforma. Es un riesgo de cola larga (tail latency), no algo que ocurra en cada request, pero con volumen se va a manifestar.

Todo lo demás (bundle del PDF, tamaño del screenshot, formato `links` sin usar, cobertura del guard anti-basura, mensajes de error de OpenRouter) son optimizaciones de costo/UX genuinas pero no bloqueantes — se pueden priorizar por impacto/esfuerzo según la tabla de arriba sin urgencia de "antes de abrir la puerta".
