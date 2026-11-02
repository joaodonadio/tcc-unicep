import '@testing-library/jest-dom/vitest';

// jsdom não implementa canvas 2D; o ECharts mede texto com ele. Sem contexto, ele usa uma estimativa e não polui o log.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}
