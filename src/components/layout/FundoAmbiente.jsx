/** Fundo ambiente do protótipo: malha de pontos + dois halos radiais. */
export function FundoAmbiente() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-top" />
      <div className="ambient-bottom" />
    </div>
  );
}
