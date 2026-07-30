/**
 * RF-0.4 — rodapé permanente.
 * Requisito ético/CVM: o sistema é educacional e não constitui recomendação
 * de investimento; o aviso não pode depender de rolagem nem de estado.
 */
export function Rodape() {
  return (
    <footer className="footer">
      <span className="footer-tag">PROTÓTIPO ACADÊMICO · TCC · DADOS FICTÍCIOS</span>
      <span className="footer-disclaimer">
        As análises exibidas são simuladas e não constituem recomendação de investimento.
      </span>
    </footer>
  );
}
