export type CVProfileType = 'ti-soporte' | 'fullstack' | 'ai-engineer' | 'data-automation' | 'kam' | 'integral';

export interface Experience {
  company: string;
  period: string;
  title: string;
  description: string[];
}

export interface Project {
  name: string;
  role: string;
  description: string;
  impact: string;
  stack: string;
  link: string;
}

export interface Education {
  title: string;
  school: string;
  date: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Reference {
  name: string;
  role: string;
  phone: string;
}

export interface JobApplication {
  company: string;
  role: string;
  dateApplied: string;
  link?: string;
  emailTo?: string;
  emailSubject: string;
  emailBody: string;
  recommendedCourses?: {
    topic: string;
    link: string;
  }[];
}

export interface CVProfile {
  id: CVProfileType;
  name: string;
  title: string;
  specialty: string;
  summary: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: string[];
  languages?: Language[];
  references: Reference[];
  applications?: JobApplication[];
}

// Información Base compartida
export const baseInfo = {
  name: "Jaime Daniel Rodríguez Fajardo",
  contact: {
    email: "jaimedrodriguezf@gmail.com",
    phone: "(+593) 0983144424",
    location: "Quito, Ecuador",
  },
  links: {
    linkedin: "https://www.linkedin.com/in/jaime-rodriguez-981463262/",
    github: "https://github.com/jaimedrodriguezf-netizen",
    web: "https://januscore.pro"
  },
  education: [
    {
      title: "Ingeniería en Telecomunicaciones",
      school: "Universidad Politécnica Salesiana",
      date: "Feb 2015 - Feb 2021"
    }
  ],
  certifications: [
    "Cisco: CCNA Routing and Switching",
    "Cisco: Cybersecurity Operations",
    "Elements of AI (University of Helsinki)",
    "Certificación en Telecomunicaciones"
  ],
  languages: [
    { name: "Español", level: "Nativo" },
    { name: "Inglés", level: "Intermedio" }
  ],
  references: [
    {
      name: "Mgs. Geovanny Bermúdez",
      role: "Contador General - GM Bruño",
      phone: "0989612590"
    },
    {
      name: "Ing. Ayde Merino",
      role: "Gerente General - WillSeb",
      phone: "0998722324"
    },
    {
      name: "Econ. Nataly Utreras",
      role: "Economista",
      phone: "0993693004"
    }
  ]
};

export const baseSkills = [
  "JavaScript / TypeScript",
  "SQL (PostgreSQL)",
  "IA Aplicada a Procesos",
  "Arquitectura Cloud (AWS / Supabase)"
];

const baseProjects: Project[] = [
  {
    name: "JanusCore Pro",
    role: "Desarrollador Fullstack / Creador",
    description: "Plataforma web con diseño premium, performance optimizado (SSR) y autenticación segura.",
    impact: "Arquitectura moderna de frontend y pruebas end-to-end automatizadas.",
    stack: "Astro 6, React 19, Tailwind CSS 4, Drizzle ORM, GSAP, Playwright",
    link: "https://januscore.pro"
  },
  {
    name: "DentiApp Online",
    role: "Desarrollador Fullstack / Creador",
    description: "SaaS clínico con gestión de citas, historias clínicas y generación de reportes PDF.",
    impact: "Arquitectura escalable Server-Side Rendering con autenticación robusta.",
    stack: "Next.js 16, React 19, Supabase, DaisyUI, Framer Motion, Vitest",
    link: "https://dentiapp.online"
  },
  {
    name: "iapi.shop",
    role: "Desarrollador Fullstack / Creador",
    description: "Plataforma e-commerce con gestión de estado global y componentes accesibles de alto rendimiento.",
    impact: "Sistema robusto de manejo de datos, caché distribuido y pruebas E2E.",
    stack: "Next.js 16, React 19, Supabase, Tailwind, Shadcn, Zustand, Upstash Redis",
    link: "https://iapi.shop"
  }
];

export const cvProfiles: Record<CVProfileType, CVProfile> = {
  "ai-engineer": {
    id: "ai-engineer",
    name: baseInfo.name,
    title: "Ingeniero de IA / IA Aplicada",
    specialty: "RAG, Agentes MCP, Automatización Inteligente",
    summary: "Ingeniero Especializado en IA Generativa y Agentes (MCP). Mi enfoque es diseñar, implementar y medir sistemas de IA que resuelvan problemas operativos reales, integrando Modelos de Lenguaje (LLMs) con datos corporativos para reducir la fricción en la toma de decisiones.",
    skills: [...baseSkills, "RAG Architecture", "MCP Agents", "Python", "LLM Orchestration", "Prompt Engineering"],
    experience: [
      {
        company: "IMPORTADORA GM BRUÑO S.A. (www.gmbruno.com)",
        period: "Ago. 2022 - Actualidad",
        title: "Soporte Técnico y Sistemas",
        description: [
          "Diseño web y desarrollo de un cotizador interactivo para brindar servicio a más de 18.000 clientes.",
          "Desarrollé sistemas administrativos, control de asistencias e inventarios en JavaScript para 18 sucursales.",
          "Brindé soporte técnico continuo, integrando herramientas modernas (RAG/Agentes) para optimizar mis propios procesos."
        ]
      },
      {
        company: "STELASUR S.A.",
        period: "2017 - 2021",
        title: "Técnico de Sistemas",
        description: [
          "Diseño e implementación de un sistema de turnos por WhatsApp utilizando Python para 4 sucursales.",
          "Soporte de hardware y conectividad en terreno."
        ]
      }
    ],
    projects: baseProjects,
    education: baseInfo.education,
    certifications: baseInfo.certifications,
    languages: baseInfo.languages,
    references: baseInfo.references
  },
  "fullstack": {
    id: "fullstack",
    name: baseInfo.name,
    title: "Desarrollador Fullstack",
    specialty: "React, Next.js, Astro, TypeScript, AWS",
    summary: "Desarrollador Fullstack con capacidad comprobada para construir productos SaaS de extremo a extremo. Combino tecnologías modernas (React/Next.js/Astro) con bases de datos robustas (AWS/Cloud) y automatización con IA para entregar interfaces claras y de alto impacto.",
    skills: [...baseSkills, "React / Next.js", "Astro", "Tailwind CSS", "Testing (Vitest/Playwright)", "Arquitectura SaaS"],
    experience: [
      {
        company: "IMPORTADORA GM BRUÑO S.A. (www.gmbruno.com)",
        period: "Ago. 2022 - Actualidad",
        title: "Soporte Técnico y Sistemas",
        description: [
          "Diseño web y creación de un cotizador interactivo de alto impacto para dar servicio a más de 18.000 clientes.",
          "Desarrollo de sistemas administrativos integrales, control de asistencias e inventario en JavaScript para la gestión de 18 sucursales.",
          "Soporte técnico continuo a toda la infraestructura tecnológica comercial."
        ]
      },
      {
        company: "STELASUR S.A.",
        period: "2017 - 2021",
        title: "Técnico de Sistemas",
        description: [
          "Diseño e implementación de un sistema de turnos por WhatsApp utilizando Python.",
          "Servicio técnico integral de equipos y sistemas."
        ]
      }
    ],
    projects: baseProjects,
    education: baseInfo.education,
    certifications: baseInfo.certifications,
    languages: baseInfo.languages,
    references: baseInfo.references
  },
  "ti-soporte": {
    id: "ti-soporte",
    name: baseInfo.name,
    title: "Ingeniero de Soporte TI",
    specialty: "Infraestructura, Diagnóstico Asistido, Redes",
    summary: "Profesional de TI con experiencia en soporte multi-sede, resolución de incidencias complejas y administración de infraestructura. Utilizo automatización e IA para mejorar la documentación de tickets, checklists y respuestas estandarizadas.",
    skills: [...baseSkills, "Windows / Linux", "Redes LAN / CCNA", "Soporte Remoto (AnyDesk)", "Troubleshooting Hardware"],
    experience: [
      {
        company: "IMPORTADORA GM BRUÑO S.A. (www.gmbruno.com)",
        period: "Ago. 2022 - Actualidad",
        title: "Soporte Técnico y Sistemas",
        description: [
          "Soporte técnico integral para 18 sucursales, garantizando la continuidad operativa y gestión de equipos.",
          "Desarrollo e implementación de un sistema administrativo de asistencias e inventario utilizando JavaScript.",
          "Diseño de un cotizador interactivo en la web para 18.000 clientes."
        ]
      },
      {
        company: "STELASUR S.A.",
        period: "2017 - 2021",
        title: "Técnico de Sistemas",
        description: [
          "Servicio técnico integral de hardware y software.",
          "Diseño e implementación de un sistema de turnos por WhatsApp utilizando Python para 4 sucursales."
        ]
      }
    ],
    projects: baseProjects,
    education: baseInfo.education,
    certifications: baseInfo.certifications,
    languages: baseInfo.languages,
    references: baseInfo.references
  },
  "data-automation": {
    id: "data-automation",
    name: baseInfo.name,
    title: "Ingeniero de Datos y Automatización",
    specialty: "SQL, Dashboards, KPIs, Procesos Operativos",
    summary: "Ingeniero enfocado en transformar datos crudos en visibilidad gerencial. Experto en modelar procesos operativos complejos (inventarios, logística) en bases de datos y dashboards, automatizando tareas repetitivas para reducir la fricción humana.",
    skills: [...baseSkills, "Dashboards / BI", "Análisis de Inventarios", "Automatización Documental", "Python"],
    experience: [
      {
        company: "IMPORTADORA GM BRUÑO S.A. (www.gmbruno.com)",
        period: "Ago. 2022 - Actualidad",
        title: "Soporte Técnico y Sistemas",
        description: [
          "Desarrollo de sistemas administrativos y de control de asistencias en JavaScript para 18 sucursales.",
          "Modelado de datos para inventario y creación de un cotizador interactivo web (18.000 clientes).",
          "Resolución de incidencias técnicas en infraestructura local y remota."
        ]
      },
      {
        company: "STELASUR S.A.",
        period: "2017 - 2021",
        title: "Técnico de Sistemas",
        description: [
          "Construcción de una herramienta automatizada (sistema de turnos por WhatsApp en Python) y soporte informático."
        ]
      }
    ],
    projects: baseProjects,
    education: baseInfo.education,
    certifications: baseInfo.certifications,
    languages: baseInfo.languages,
    references: baseInfo.references,
    applications: [
      {
        company: "FARMACID (PHARMABRAND S.A.)",
        role: "ANALISTA DE SISTEMAS",
        dateApplied: "2026-06-24",
        link: "LinkedIn",
        emailTo: "seleccion@pharmabrand.com.ec",
        emailSubject: "ANALISTA DE SISTEMAS - Jaime Rodríguez (Perfil Senior de Datos y Automatización)",
        emailBody: "Estimado equipo de Selección de FARMACID,\n\nMe dirijo a ustedes para postularme a la vacante de ANALISTA DE SISTEMAS. Soy Ingeniero con más de 3 años de experiencia liderando la automatización de datos, integración de APIs y proyectos de Inteligencia de Negocios (BI) para operaciones a nivel nacional (actualmente gestionando la estructura de sistemas para 18 sucursales en Importadora GM Bruño).\n\nMi perfil encaja de forma directa con sus requerimientos:\n- Sólidos conocimientos en SQL, lógica de programación y desarrollo de Dashboards.\n- Especialidad en aplicar Inteligencia Artificial (IA Generativa y Agentes) directamente a los procesos para automatización de tareas y mejora continua.\n- Experiencia analizando procesos y levantando soluciones eficientes.\n\nSi bien mi inmersión técnica específica en JD Edwards EnterpriseOne ha iniciado recientemente a través del Oracle Help Center, mi profundo dominio estructural de flujos ERP me permite absorber y optimizar cualquier plataforma empresarial rápidamente.\n\nAdjunto mi Hoja de Vida. Estaré encantado de conversar sobre cómo puedo aportar valor inmediato a su operación.\n\nAtentamente,\nJaime Rodríguez F.\njaimedrodriguezf@gmail.com | (+593) 0983144424\nhttps://januscore.pro",
        recommendedCourses: [
          { topic: "JD Edwards EnterpriseOne (Oracle Help Center)", link: "https://docs.oracle.com/en/applications/jd-edwards/index.html" },
          { topic: "JD Edwards UX One & Orchestrator (Oracle MyLearn)", link: "https://mylearn.oracle.com/" }
        ]
      }
    ]
  },
  "kam": {
    id: "kam",
    name: baseInfo.name,
    title: "Consultor Técnico / KAM",
    specialty: "Venta Consultiva, ROI Tecnológico, Automatización",
    summary: "Consultor técnico capaz de traducir necesidades operativas y de negocio en soluciones tecnológicas rentables. Utilizo la tecnología y la IA como diferenciador comercial para demostrar ahorro de tiempo, escalabilidad y control operativo.",
    skills: [...baseSkills, "Venta Consultiva", "Traducción Técnico-Negocio", "Gestión de Proyectos", "Análisis de ROI", "Comunicación Ejecutiva"],
    experience: [
      {
        company: "IMPORTADORA GM BRUÑO S.A. (www.gmbruno.com)",
        period: "Ago. 2022 - Actualidad",
        title: "Soporte Técnico y Sistemas",
        description: [
          "Desarrollo de un cotizador web interactivo que facilitó la gestión comercial a más de 18.000 clientes.",
          "Implementación de un sistema administrativo integral de asistencias e inventario en JavaScript.",
          "Soporte tecnológico directo y atención a requerimientos de las 18 sucursales."
        ]
      },
      {
        company: "STELASUR S.A.",
        period: "2017 - 2021",
        title: "Técnico de Sistemas",
        description: [
          "Implementación de un sistema de turnos por WhatsApp en Python, mejorando la atención en 4 sucursales."
        ]
      }
    ],
    projects: baseProjects,
    education: baseInfo.education,
    certifications: baseInfo.certifications,
    languages: baseInfo.languages,
    references: baseInfo.references
  },
  "integral": {
    id: "integral",
    name: baseInfo.name,
    title: "Ingeniero Integral (Tecnología y Operaciones)",
    specialty: "Electrónica, Redes, Software, IA Transversal",
    summary: "Perfil multidisciplinario capaz de conectar hardware, soporte, redes, datos, software e IA. Entiendo los problemas desde la operación real (piso) y los transformo en soluciones digitales conectadas y funcionales.",
    skills: [...baseSkills, "Electrónica / Hardware", "Redes / Infraestructura", "Solución de Problemas Complejos"],
    experience: [
      {
        company: "IMPORTADORA GM BRUÑO S.A. (www.gmbruno.com)",
        period: "Ago. 2022 - Actualidad",
        title: "Soporte Técnico y Sistemas",
        description: [
          "Diseño web y despliegue de un cotizador interactivo para más de 18.000 clientes comerciales.",
          "Desarrollo de un sistema administrativo de asistencias e inventarios en JavaScript.",
          "Soporte técnico integral a la infraestructura comercial (18 sucursales)."
        ]
      },
      {
        company: "STELASUR S.A.",
        period: "2017 - 2021",
        title: "Técnico de Sistemas",
        description: [
          "Soporte de hardware y conectividad en terreno.",
          "Desarrollo de un sistema de turnos automatizado vía WhatsApp en Python."
        ]
      }
    ],
    projects: baseProjects,
    education: baseInfo.education,
    certifications: baseInfo.certifications,
    languages: baseInfo.languages,
    references: baseInfo.references
  }
};
