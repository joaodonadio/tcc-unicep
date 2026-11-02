import { useTraducao } from '../../hooks/useTraducao.js';

/**
 * Título de notícia nas duas línguas: tradução automática em destaque e o
 * original menor embaixo. Sem tradução (carregando, falha ou já em português),
 * só o original. Usa apenas <span>: pode ficar dentro de um <a>.
 */

const IDIOMAS = { en: 'inglês', es: 'espanhol', fr: 'francês', de: 'alemão', it: 'italiano' };

export function Manchete({ titulo }) {
  const { data } = useTraducao(titulo);
  const original = String(titulo ?? '');
  const traduzida =
    data?.pt && data.idioma && !String(data.idioma).startsWith('pt') && data.pt.trim() !== original.trim();

  if (!traduzida) {
    return (
      <span className="manchete">
        <span className="manchete-texto">{original}</span>
      </span>
    );
  }
  return (
    <span className="manchete">
      <span className="manchete-texto" lang="pt-BR">{data.pt}</span>
      <span className="manchete-original">
        <span className="manchete-rotulo">original em {IDIOMAS[data.idioma] ?? 'outro idioma'} · tradução automática</span>{' '}
        <span lang={data.idioma}>{original}</span>
      </span>
    </span>
  );
}
