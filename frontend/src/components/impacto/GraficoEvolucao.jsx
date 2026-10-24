import { useEffect, useRef, useState } from 'react';
import './Impacto.scss';

const ALTURA = 240;
const MARGEM = { topo: 16, direita: 8, base: 28, esquerda: 40 };
const LARGURA_BARRA = 24; // nunca mais grossa que isso: o resto da faixa é respiro
const VAO = 2;            // espaço entre barras vizinhas
const RAIO = 4;           // topo arredondado, base reta

const nomeMes = mes => {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
};
const nomeMesCompleto = mes => {
  const [ano, m] = mes.split('-').map(Number);
  const texto = new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto[0].toUpperCase() + texto.slice(1); // "Outubro de 2026"
};

// Teto "redondo" do eixo e 4 divisões: 0 / 25 / 50 / 75 / 100
function escalaY(maximo) {
  if (maximo <= 0) return { teto: 4, passos: [0, 1, 2, 3, 4] };
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map(f => f * potencia).find(p => p >= bruto);
  return { teto: passo * 4, passos: [0, 1, 2, 3, 4].map(i => i * passo) };
}

// Coluna com topo arredondado (4px) e base reta no eixo
function caminhoBarra(x, y, largura, altura) {
  if (altura <= 0) return '';
  const r = Math.min(RAIO, altura, largura / 2);
  return `M${x},${y + altura} V${y + r} Q${x},${y} ${x + r},${y} H${x + largura - r} Q${x + largura},${y} ${x + largura},${y + r} V${y + altura} Z`;
}

/**
 * Evolução mensal em colunas agrupadas.
 * series: [{ chave: 'doadas', rotulo: 'Doadas', classe: 'doadas' }]
 */
export default function GraficoEvolucao({ titulo, descricao, dados, series, unidade = 'unidades' }) {
  const caixaRef = useRef(null);
  const [largura, setLargura] = useState(640);
  const [ativo, setAtivo] = useState(null);
  const [verTabela, setVerTabela] = useState(false);

  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(caixaRef.current);
    return () => observador.disconnect();
  }, []);

  const maximo = Math.max(0, ...dados.flatMap(d => series.map(s => d[s.chave])));
  const { teto, passos } = escalaY(maximo);
  const areaL = Math.max(0, largura - MARGEM.esquerda - MARGEM.direita);
  const areaA = ALTURA - MARGEM.topo - MARGEM.base;
  const faixa = areaL / dados.length;
  const barra = Math.min(LARGURA_BARRA, (faixa * 0.7 - VAO * (series.length - 1)) / series.length);
  const grupo = barra * series.length + VAO * (series.length - 1);
  const y = valor => MARGEM.topo + areaA - (valor / teto) * areaA;
  const total = d => series.reduce((soma, s) => soma + d[s.chave], 0);
  const vazio = maximo === 0;

  return <figure className="grafico">
    <figcaption className="grafico__cabecalho">
      <div>
        <h3 className="grafico__titulo">{titulo}</h3>
        {descricao && <p className="grafico__descricao">{descricao}</p>}
      </div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setVerTabela(v => !v)} aria-pressed={verTabela}>
        {verTabela ? 'Ver gráfico' : 'Ver como tabela'}
      </button>
    </figcaption>

    {series.length > 1 && <ul className="grafico__legenda">
      {series.map(s => <li key={s.chave}><span className={`grafico__chave grafico__cor--${s.classe}`} aria-hidden="true" />{s.rotulo}</li>)}
    </ul>}

    <div ref={caixaRef} className="grafico__area" hidden={verTabela}>
      {vazio && <p className="grafico__vazio">Ainda não há retiradas concluídas nos últimos meses. Os números aparecem aqui assim que a primeira for confirmada.</p>}
      <svg width={largura} height={ALTURA} role="img" aria-label={`${titulo}. Use "Ver como tabela" para ler os valores.`}>
        {passos.map(p => <g key={p} className="grafico__grade">
          <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(p)} y2={y(p)} />
          <text x={MARGEM.esquerda - 8} y={y(p)} dy="0.32em" textAnchor="end">{p.toLocaleString('pt-BR')}</text>
        </g>)}
        {dados.map((d, i) => {
          const x0 = MARGEM.esquerda + faixa * i;
          const xGrupo = x0 + (faixa - grupo) / 2;
          return <g key={d.mes} className={`grafico__faixa${ativo === i ? ' grafico__faixa--ativa' : ''}`}
            tabIndex={vazio ? -1 : 0} role="img"
            aria-label={`${nomeMesCompleto(d.mes)}: ${series.map(s => `${d[s.chave]} ${unidade} ${s.rotulo.toLowerCase()}`).join(', ')}`}
            onPointerEnter={() => setAtivo(i)} onPointerLeave={() => setAtivo(null)}
            onFocus={() => setAtivo(i)} onBlur={() => setAtivo(null)}>
            {/* alvo de hover: a faixa inteira do mês, maior que as barras */}
            <rect className="grafico__alvo" x={x0} y={MARGEM.topo} width={faixa} height={areaA} />
            {series.map((s, j) => {
              const valor = d[s.chave];
              return <path key={s.chave} className={`grafico__barra grafico__cor--${s.classe}`}
                d={caminhoBarra(xGrupo + j * (barra + VAO), y(valor), barra, MARGEM.topo + areaA - y(valor))} />;
            })}
            <text className="grafico__mes" x={x0 + faixa / 2} y={ALTURA - 8} textAnchor="middle">{nomeMes(d.mes)}</text>
          </g>;
        })}
        <line className="grafico__base" x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={MARGEM.topo + areaA} y2={MARGEM.topo + areaA} />
      </svg>

      {ativo !== null && !vazio && (() => {
        const d = dados[ativo];
        const centro = MARGEM.esquerda + faixa * ativo + faixa / 2;
        const ladoDireito = centro > largura / 2;
        return <div className="grafico__tooltip" role="presentation"
          style={ladoDireito ? { right: largura - centro + 12 } : { left: centro + 12 }}>
          <p className="grafico__tooltip-mes">{nomeMesCompleto(d.mes)}</p>
          {series.map(s => <p key={s.chave}><span className={`grafico__traco grafico__cor--${s.classe}`} aria-hidden="true" />
            <strong>{d[s.chave].toLocaleString('pt-BR')}</strong> {s.rotulo.toLowerCase()}</p>)}
          {series.length > 1 && <p className="grafico__tooltip-total">Total: {total(d).toLocaleString('pt-BR')} {unidade}</p>}
        </div>;
      })()}
    </div>

    {verTabela && <div className="table-wrapper">
      <table className="data-table">
        <caption className="sr-only">{titulo}</caption>
        <thead><tr><th>Mês</th>{series.map(s => <th key={s.chave}>{s.rotulo}</th>)}{series.length > 1 && <th>Total</th>}</tr></thead>
        <tbody>{dados.map(d => <tr key={d.mes}><td>{nomeMesCompleto(d.mes)}</td>
          {series.map(s => <td key={s.chave}>{d[s.chave].toLocaleString('pt-BR')}</td>)}
          {series.length > 1 && <td>{total(d).toLocaleString('pt-BR')}</td>}</tr>)}</tbody>
      </table>
    </div>}
  </figure>;
}
