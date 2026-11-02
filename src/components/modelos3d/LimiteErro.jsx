import { Component } from 'react';

/** Falha ao baixar o motor ou ao desenhar: mostra `reserva` (ou nada) e avisa `aoFalhar`. */
export class LimiteErro extends Component {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidCatch() {
    this.props.aoFalhar?.();
  }

  render() {
    return this.state.falhou ? (this.props.reserva ?? null) : this.props.children;
  }
}
