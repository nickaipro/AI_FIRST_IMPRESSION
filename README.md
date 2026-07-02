# AI First Impression

Aplicación web profesional que analiza sitios web desde la perspectiva de tu público objetivo en los primeros segundos.

## ¿Qué hace?

AI First Impression te ayuda a entender cómo los visitantes perciben tu sitio web en esos primeros momentos críticos. Proporciona:

- **First Impression Score** (0-100)
- **Tiempo de comprensión** - Cuánto tarda en entenderse qué haces
- **Problemas de claridad** - Qué genera confusión
- **Señales de confianza** - Qué construye credibilidad
- **Oportunidades de conversión** - Dónde pierdes clientes potenciales
- **Feedback por perfiles** - Cómo diferentes visitantes perciben tu sitio
- **Acciones prioritarias** - Clasificadas por impacto y dificultad
- **Reescritura del hero** - Recomendaciones concretas de copywriting

## Características

✅ **UI Profesional** - Diseño moderno con identidad morada
✅ **Análisis robusto** - Extracción con Firecrawl + Playwright como respaldo
✅ **IA flexible** - Funciona con cualquier modelo de OpenRouter
✅ **Validación de seguridad** - Bloquea URLs locales y privadas
✅ **Modo mock** - Prueba sin API keys
✅ **TypeScript** - Código type-safe
✅ **Responsive** - Funciona en móvil y desktop
✅ **Manejo de errores** - Mensajes claros y amigables

## Sistema de Evaluación Profesional

AI First Impression usa una **rúbrica estructurada de 100 puntos** dividida en 6 dimensiones:

### Dimensiones de Evaluación (100 puntos total)

- **Claridad del mensaje** (25 pts): Qué tan rápido se entiende qué ofrece la página
- **Confianza y credibilidad** (20 pts): Señales que hacen que el visitante confíe
- **Conversión y CTA** (20 pts): Claridad del siguiente paso y facilidad para convertir
- **UX, jerarquía y accesibilidad** (15 pts): Usabilidad y experiencia de usuario
- **Ajuste al nicho** (10 pts): Adaptación al público objetivo
- **Copywriting y navegación** (10 pts): Calidad del texto y facilidad de navegación

### Principios de Calibración

La herramienta evalúa **función antes que estética**:

1. Una página clara, funcional y con CTA visible puede sacar 75-85 aunque el diseño sea básico
2. Una página bonita pero confusa puede sacar menos de 50
3. No se penaliza por diseño simple si la comunicación es clara
4. Las mejoras opcionales (videos, animaciones) no restan puntos
5. Se adapta al tipo de página (SaaS, e-commerce, servicios, etc.)

### Rangos de Calificación

- **90-100**: Excelente - Muy clara, confiable y bien optimizada
- **80-89**: Muy buena - Cumple su objetivo con mejoras menores
- **70-79**: Buena - Funciona bien con oportunidades claras
- **60-69**: Aceptable - Se entiende pero hay fricción
- **50-59**: Débil - Problemas importantes de claridad o conversión
- **30-49**: Mala - El visitante probablemente no entiende o no confía
- **0-29**: Crítica - Página rota, ilegible o confusa

### Severidad de Problemas

- **Critical**: Bloquea comprensión, confianza o acción
- **High**: Reduce conversión significativamente
- **Medium**: Aumenta carga cognitiva
- **Low**: Microfricciones mejorables
- **Optional**: Optimizaciones avanzadas, no problemas

### Adaptación por Nicho

El sistema detecta el tipo de página y adapta la evaluación:

- **SaaS**: Prioriza propuesta de valor, demo visible, logos
- **E-commerce**: Prioriza producto, precio, confianza, compra fácil
- **Servicios profesionales**: Prioriza credenciales, contacto, problema resuelto
- **Restaurante/Local**: Prioriza ubicación, horario, contacto, menú
- **Educación**: Prioriza autoridad, resultado, temario
- **B2B Industrial**: Permite alta densidad técnica si está organizada
- **Lujo/Premium**: Permite poco texto si la propuesta se entiende

## Instalación

### 1. Instala las dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Instala los navegadores de Playwright

\`\`\`bash
npx playwright install chromium
\`\`\`

### 3. Configura las variables de entorno

Crea un archivo \`.env.local\` en la raíz del proyecto:

\`\`\`env
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_MODEL=openai/gpt-4o-mini
FIRECRAWL_API_KEY=tu_firecrawl_api_key_aqui
\`\`\`

## Obtener API Keys

### OpenRouter (Requerido para análisis con IA)

1. Ve a [https://openrouter.ai/](https://openrouter.ai/)
2. Regístrate
3. Ve a la sección de Keys
4. Crea una nueva API key
5. Agrega créditos a tu cuenta
6. Copia la key a \`.env.local\`

**Modelos recomendados:**
- \`openai/gpt-4o-mini\` - Rápido y económico (por defecto)
- \`openai/gpt-4o\` - Mayor calidad
- \`anthropic/claude-3-5-sonnet\` - Excelente para análisis
- \`openrouter/auto\` - Selección automática

### Firecrawl (Recomendado para mejor extracción)

1. Ve a [https://firecrawl.dev/](https://firecrawl.dev/)
2. Regístrate
3. Obtén tu API key del dashboard
4. Copia la key a \`.env.local\`

**Nota:** Firecrawl tiene un tier gratuito. Si no está configurado, la app usará Playwright automáticamente.

## Uso

### Modo desarrollo

\`\`\`bash
npm run dev
\`\`\`

La app estará disponible en [http://localhost:3000](http://localhost:3000)

### Compilar para producción

\`\`\`bash
npm run build
npm start
\`\`\`

## Cómo usar la aplicación

1. Abre la app en tu navegador
2. Ingresa la URL del sitio web que quieres analizar
3. Describe tu público objetivo (ej: "dueños de pequeñas empresas")
4. Opcionalmente, especifica el objetivo de la página (ej: "agendar una demo")
5. Haz clic en "Analizar mi web"
6. Espera 20-40 segundos por el análisis
7. Revisa el informe completo
8. Copia el informe o analiza otro sitio

## Modo Mock

Si no tienes una API key de OpenRouter, la app funcionará en **modo mock**:

✅ La UI completa es funcional
✅ La extracción del sitio web funciona (con Playwright)
✅ Se genera un informe de ejemplo realista
⚠️ No hay análisis real con IA

Esto es perfecto para:
- Probar la interfaz
- Demostrar el concepto
- Desarrollo sin gastar créditos de API

## Solución de problemas

### Error: "404 No endpoints found for [modelo]"

**Problema:** El modelo configurado no está disponible en OpenRouter o no tienes acceso.

**Solución:**
1. Cambia \`OPENROUTER_MODEL\` en \`.env.local\` a \`openai/gpt-4o-mini\`
2. Verifica que tengas créditos en tu cuenta de OpenRouter
3. Reinicia el servidor de desarrollo

### "Failed to extract website data"

**Causas posibles:**
- El sitio web bloquea acceso automatizado
- La URL es inválida o inaccesible
- Timeout (el sitio es muy lento)

**Soluciones:**
- Prueba con otro sitio web
- Verifica que la URL sea accesible en tu navegador
- Asegúrate de usar \`https://\` no solo \`www.\`

### "OPENROUTER_API_KEY not configured"

**Solución:** Agrega tu API key de OpenRouter a \`.env.local\`

O usa el modo mock (no se requiere API key)

### El sitio se ve sin estilos

**Problema:** Tailwind CSS no está cargando correctamente.

**Solución:**
1. Verifica que \`postcss.config.mjs\` esté configurado correctamente
2. Ejecuta \`npm run build\` para verificar errores
3. Reinicia el servidor de desarrollo

### Errores de TypeScript

\`\`\`bash
npm run build
\`\`\`

Esto mostrará cualquier error de TypeScript que necesite corrección.

## Estructura del proyecto

\`\`\`
ai-impression/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts    # API endpoint
│   │   ├── globals.css              # Estilos globales
│   │   ├── layout.tsx               # Layout raíz
│   │   └── page.tsx                 # Página principal
│   ├── components/
│   │   ├── AnalysisForm.tsx         # Formulario de entrada
│   │   └── AnalysisReport.tsx       # Visualización de resultados
│   ├── lib/
│   │   ├── analyzer.ts              # Orquestación principal
│   │   ├── firecrawl.ts             # Servicio Firecrawl
│   │   ├── mock.ts                  # Generador de datos mock
│   │   ├── openrouter.ts            # Servicio OpenRouter
│   │   ├── playwright.ts            # Servicio Playwright
│   │   └── validation.ts            # Validación de URLs
│   └── types/
│       └── index.ts                 # Tipos TypeScript
├── .env.local                        # Tus API keys (no en git)
├── .env.example                      # Plantilla
├── package.json
└── README.md
\`\`\`

## Características de seguridad

✅ Validación de URLs (solo http/https)
✅ Bloqueo de localhost y rangos de IP privadas
✅ Timeouts para prevenir peticiones colgadas
✅ Variables de entorno nunca expuestas al frontend
✅ Sin ejecución de código externo

## Cómo funciona

### 1. Extracción del sitio web

La app intenta dos métodos:

**Primario: Firecrawl**
- Extracción de markdown limpio
- Metadatos estructurados
- Rápido y confiable

**Respaldo: Playwright**
- Automatización de navegador
- Extrae texto visible, botones, encabezados
- Toma screenshot (para futuro análisis multimodal)
- Funciona incluso si Firecrawl falla

### 2. Análisis con IA

Envía los datos extraídos a OpenRouter con un prompt estructurado que analiza:
- Claridad y mensajería
- Confianza y credibilidad
- Oportunidades de conversión
- Ajuste al público objetivo
- UX y copywriting

### 3. Generación del informe

Devuelve un informe JSON completo con:
- Score cuantitativo
- Insights cualitativos
- Recomendaciones accionables
- Próximos pasos priorizados

## Stack tecnológico

- **Framework:** Next.js 16 con App Router
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Web Scraping:** Firecrawl + Playwright
- **IA:** OpenRouter (soporta múltiples modelos)
- **Validación:** Zod

## Rendimiento

- **Tiempo promedio de análisis:** 20-40 segundos
- **Límite de timeout:** 60 segundos
- **Costo por análisis:** ~$0.01-0.03 (depende del modelo)

## Costos estimados

Por análisis:
- OpenRouter (gpt-4o-mini): ~$0.01
- Firecrawl: ~$0.001
- **Total: ~$0.01 por análisis**

Mensual (1000 análisis):
- Costos de API: ~$10-15
- Hosting en Vercel: Tier gratuito suficiente
- **Total: ~$10-15/mes**

## Lo que falta para producción

Esta es una app local MVP. Para hacerla lista para producción necesitarías:

- [ ] Autenticación de usuarios
- [ ] Base de datos para almacenar análisis
- [ ] Rate limiting
- [ ] Integración de pagos
- [ ] Características de compartir informes
- [ ] Exportar a PDF
- [ ] Comparaciones históricas
- [ ] Análisis multi-página
- [ ] Análisis de competidores
- [ ] Sugerencias de test A/B
- [ ] Benchmarks de industria

## Licencia

ISC

## Soporte

Para problemas o preguntas, verifica:
1. Este README
2. \`.env.example\` para la plantilla de configuración
3. Logs de consola para mensajes de error

---

Hecho con ❤️ para mejores primeras impresiones
