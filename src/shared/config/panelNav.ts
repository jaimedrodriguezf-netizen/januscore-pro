export type NavItem = {
  label: string;
  href: string;
  icon: string; // We will use SVG strings or predefined icon names
};

export const panelNavConfig: NavItem[] = [
  {
    label: "Dashboard",
    href: "/panel",
    icon: "dashboard",
  },
  {
    label: "Proyectos",
    href: "/panel/proyectos",
    icon: "projects",
  },
  {
    label: "Usuarios",
    href: "/panel/usuarios",
    icon: "users",
  },
  {
    label: "Mi Portafolio",
    href: "/panel/cv",
    icon: "cv",
  },
  {
    label: "Ajustes",
    href: "/panel/ajustes",
    icon: "settings",
  },
];
