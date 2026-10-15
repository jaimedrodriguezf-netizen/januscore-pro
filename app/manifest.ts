import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JanusCore Technologies — AI Engineering & B2B Software',
    short_name: 'JanusCore',
    description:
      'Estudio de ingeniería de inteligencia artificial, automatización de procesos operativos y catálogo de software B2B listo para producción.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
