import Skeleton from '../ui/Skeleton';
import './Impacto.scss';

// Números de impacto em destaque (Fraunces). itens: [{ valor, rotulo, descricao?, icone }]
export default function IndicadoresImpacto({ itens, carregando }) {
  return <div className="indicadores">
    {itens.map(({ valor, rotulo, descricao, icone: Icone }) => (
      <article className="indicador" key={rotulo}>
        {Icone && <span className="indicador__icone" aria-hidden="true"><Icone /></span>}
        {carregando ? <Skeleton variant="title" width="40%" />
          : <p className="indicador__valor">{Number(valor ?? 0).toLocaleString('pt-BR')}</p>}
        <p className="indicador__rotulo">{rotulo}</p>
        {descricao && <p className="indicador__descricao">{descricao}</p>}
      </article>
    ))}
  </div>;
}
