export const RUBRIC_DIMENSIONS = {
  clarity: {
    label: "Claridad del mensaje",
    maxPoints: 25,
    description: "Qué tan rápido y fácilmente el visitante entiende qué ofrece la página"
  },
  trust: {
    label: "Confianza y credibilidad",
    maxPoints: 20,
    description: "Señales que hacen que el visitante confíe en la marca o empresa"
  },
  conversion: {
    label: "Conversión y CTA",
    maxPoints: 20,
    description: "Claridad del siguiente paso y facilidad para convertir"
  },
  ux: {
    label: "UX, jerarquía y accesibilidad",
    maxPoints: 15,
    description: "Usabilidad, escaneabilidad y experiencia de usuario"
  },
  nicheFit: {
    label: "Ajuste al público objetivo y nicho",
    maxPoints: 10,
    description: "Qué tan bien la página se adapta a su nicho y audiencia"
  },
  copyNavigation: {
    label: "Copywriting y navegación",
    maxPoints: 10,
    description: "Calidad del texto y facilidad de navegación"
  }
} as const;

export type DimensionKey = keyof typeof RUBRIC_DIMENSIONS;

export const CRITERIA = {
  // Claridad (C01-C06)
  C01: "Claridad de la propuesta de valor",
  C02: "Tiempo estimado para entender qué ofrece",
  C03: "Claridad del público objetivo",
  C04: "Coherencia entre hero, producto y objetivo",
  C05: "Claridad del beneficio principal",
  C06: "Diferencia entre características y beneficios",
  
  // Confianza (C07-C12)
  C07: "Presencia de prueba social",
  C08: "Testimonios, reseñas o casos",
  C09: "Logos de clientes, aliados o certificaciones",
  C10: "Información de contacto visible",
  C11: "Reducción de riesgo percibido",
  C12: "Profesionalismo general percibido",
  
  // Conversión (C13-C18)
  C13: "Claridad del CTA principal",
  C14: "Visibilidad del CTA principal",
  C15: "Facilidad para saber qué hacer después",
  C16: "Fricción del formulario o proceso",
  C17: "Claridad de precios o proceso comercial",
  C18: "Motivación para actuar",
  
  // UX (C19-C25)
  C19: "Jerarquía visual",
  C20: "Escaneabilidad",
  C21: "Organización de secciones",
  C22: "Legibilidad",
  C23: "Adaptación móvil",
  C24: "Accesibilidad básica",
  C25: "Velocidad percibida",
  
  // Nicho (C26-C29)
  C26: "Adecuación al público objetivo",
  C27: "Prototipicidad del nicho",
  C28: "Nivel correcto de detalle",
  C29: "Manejo de objeciones del cliente ideal",
  
  // Copy y Navegación (C30-C34)
  C30: "Calidad del copywriting",
  C31: "Uso de lenguaje específico",
  C32: "Navegación clara",
  C33: "Facilidad para encontrar información clave",
  C34: "Ausencia de texto innecesariamente denso"
} as const;

export type Severity = "critical" | "high" | "medium" | "low" | "optional";

export const SEVERITY_DEFINITIONS = {
  critical: {
    label: "Crítico",
    color: "red",
    description: "Bloquea comprensión, confianza o acción"
  },
  high: {
    label: "Alto",
    color: "orange",
    description: "Reduce conversión de forma significativa"
  },
  medium: {
    label: "Medio",
    color: "yellow",
    description: "Aumenta carga cognitiva pero no bloquea"
  },
  low: {
    label: "Bajo",
    color: "blue",
    description: "Microfricciones o detalles mejorables"
  },
  optional: {
    label: "Opcional",
    color: "gray",
    description: "Optimización avanzada, no problema"
  }
} as const;

export type PageType =
  | "saas"
  | "ecommerce"
  | "product_page"
  | "professional_service"
  | "agency"
  | "restaurant_local"
  | "health_clinic"
  | "legal"
  | "education"
  | "portfolio"
  | "b2b_startup"
  | "marketplace"
  | "blog_authority"
  | "ngo"
  | "event"
  | "mobile_app"
  | "industrial_b2b"
  | "luxury_premium"
  | "unknown";

export const PAGE_TYPE_RULES: Record<PageType, {
  priorities: string[];
  allowances: string[];
  criticalIf: string[];
}> = {
  saas: {
    priorities: ["Propuesta de valor clara", "Prueba visual del producto", "CTA demo/prueba", "Logos o casos", "Claridad de precios"],
    allowances: ["Páginas largas si educan bien"],
    criticalIf: ["No se entiende qué hace el producto", "No hay forma de probarlo o comprarlo"]
  },
  ecommerce: {
    priorities: ["Producto visible", "Precio claro", "Envío y devolución", "Métodos de pago", "Reseñas", "Compra fácil"],
    allowances: [],
    criticalIf: ["Costos ocultos", "Falta de confianza total", "CTA de compra invisible", "Proceso de compra confuso"]
  },
  product_page: {
    priorities: ["Producto claro", "Beneficios", "Precio", "Compra o contacto visible"],
    allowances: ["Diseño simple si comunica bien"],
    criticalIf: ["No se ve el producto", "No hay precio o forma de comprar"]
  },
  professional_service: {
    priorities: ["Credenciales", "Contacto", "Problema que resuelve", "Experiencia", "Fotos reales"],
    allowances: ["Diseño sobrio", "Texto educativo bien estructurado"],
    criticalIf: ["No se sabe quién ofrece el servicio", "No hay forma de contactar"]
  },
  agency: {
    priorities: ["Especialización", "Portfolio", "Casos", "Proceso", "Contacto"],
    allowances: ["Diseño creativo que pueda ser poco convencional"],
    criticalIf: ["No se entiende qué tipo de agencia es"]
  },
  restaurant_local: {
    priorities: ["Dirección", "Horario", "Teléfono", "Menú", "Reserva/pedido", "Móvil"],
    allowances: ["Falta de textos largos", "Diseño simple"],
    criticalIf: ["No hay dirección", "No hay forma de contacto o reserva"]
  },
  health_clinic: {
    priorities: ["Credenciales", "Servicios", "Ubicación", "Contacto", "Fotos reales", "Confianza"],
    allowances: ["Diseño conservador"],
    criticalIf: ["Falta de credenciales", "No hay contacto claro"]
  },
  legal: {
    priorities: ["Especialización", "Experiencia", "Credenciales", "Contacto", "Confianza"],
    allowances: ["Mucho texto legal", "Diseño formal"],
    criticalIf: ["No se sabe en qué se especializa", "Falta de credenciales"]
  },
  education: {
    priorities: ["Autoridad del instructor", "Resultado esperado", "Temario", "Precio", "Testimonios"],
    allowances: ["Páginas largas educativas"],
    criticalIf: ["No se sabe qué se aprende", "No hay instructor visible"]
  },
  portfolio: {
    priorities: ["Trabajo visible", "Especialización", "Contacto"],
    allowances: ["Diseño minimalista", "Poco texto"],
    criticalIf: ["No se ve el trabajo"]
  },
  b2b_startup: {
    priorities: ["Propuesta de valor B2B", "Problema que resuelve", "Casos de uso", "Demo o contacto"],
    allowances: ["Texto técnico si está organizado"],
    criticalIf: ["No se entiende qué problema resuelve para empresas"]
  },
  marketplace: {
    priorities: ["Qué se ofrece", "Cómo funciona", "Confianza", "Registro o búsqueda"],
    allowances: ["Interfaces complejas si están bien organizadas"],
    criticalIf: ["No se entiende qué tipo de marketplace es"]
  },
  blog_authority: {
    priorities: ["Autoridad", "Navegación", "Contenido visible", "Suscripción"],
    allowances: ["Mucho texto si está bien estructurado"],
    criticalIf: ["No se sabe de qué trata el blog"]
  },
  ngo: {
    priorities: ["Misión clara", "Impacto", "Transparencia", "Donación o apoyo"],
    allowances: ["Diseño institucional"],
    criticalIf: ["No se entiende la causa"]
  },
  event: {
    priorities: ["Qué es el evento", "Fecha y lugar", "Registro o compra de tickets"],
    allowances: ["Diseño llamativo"],
    criticalIf: ["No hay fecha", "No hay forma de registrarse"]
  },
  mobile_app: {
    priorities: ["Qué hace la app", "Beneficio principal", "Descarga", "Screenshots"],
    allowances: ["Diseño móvil-primero"],
    criticalIf: ["No se entiende qué hace la app", "No hay forma de descargarla"]
  },
  industrial_b2b: {
    priorities: ["Especificaciones", "Documentación", "Contacto comercial", "Profundidad técnica"],
    allowances: ["Alta densidad de texto técnico organizado", "Diseño sobrio"],
    criticalIf: ["Falta de especificaciones", "No hay contacto comercial"]
  },
  luxury_premium: {
    priorities: ["Estética", "Fotografía", "Exclusividad", "Confianza sutil"],
    allowances: ["Poco texto si la propuesta se entiende"],
    criticalIf: ["Diseño barato que rompe la percepción de lujo"]
  },
  unknown: {
    priorities: ["Claridad general", "CTA visible", "Contacto"],
    allowances: [],
    criticalIf: ["No se entiende qué ofrece"]
  }
};

export function getGradeTier(score: number): string {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Muy buena";
  if (score >= 70) return "Buena";
  if (score >= 60) return "Aceptable";
  if (score >= 50) return "Débil";
  if (score >= 30) return "Mala";
  return "Crítica";
}

export function getGradeTierColor(score: number): string {
  if (score >= 90) return "emerald";
  if (score >= 80) return "green";
  if (score >= 70) return "blue";
  if (score >= 60) return "yellow";
  if (score >= 50) return "orange";
  if (score >= 30) return "red";
  return "rose";
}

export function getGradeTierDescription(score: number): string {
  if (score >= 90) return "Muy clara, confiable y bien optimizada";
  if (score >= 80) return "Cumple su objetivo con mejoras menores";
  if (score >= 70) return "Funciona bien con oportunidades claras";
  if (score >= 60) return "Se entiende pero hay fricción o confianza débil";
  if (score >= 50) return "Problemas importantes de claridad o conversión";
  if (score >= 30) return "El visitante probablemente no entiende o no confía";
  return "Página rota, ilegible o confusa";
}
