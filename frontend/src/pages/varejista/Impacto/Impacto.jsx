import { useEffect, useState } from 'react';
import { HandHeart, Leaf, PackageCheck, Users } from 'lucide-react';
import { obterImpacto } from '../../../service/impacto';
import { mensagemErro } from '../../../utils/mensagemErro';
import GraficoEvolucao from '../../../components/impacto/GraficoEvolucao';
import IndicadoresImpacto from '../../../components/impacto/IndicadoresImpacto';
import Alert from '../../../components/ui/Alert';
import '../../../components/Fluxos/Fluxos.scss';

export default function Impacto() {
  const [impacto, setImpacto] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    obterImpacto().then(setImpacto).catch(e => setErro(mensagemErro(e, 'Não foi possível carregar o relatório de impacto.')));
  }, []);

  const i = impacto?.indicadores ?? {};
  return <div className="fluxo">
    <header><span className="eyebrow">Impacto</span><h1>Relatório de impacto</h1>
      <p>O quanto o seu estabelecimento já evitou de desperdício. Contamos apenas retiradas confirmadas com código.</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}
    <IndicadoresImpacto carregando={!impacto && !erro} itens={[
      { valor: i.alimentosSalvos, rotulo: 'Unidades salvas do desperdício', descricao: 'Vendidas com desconto ou doadas', icone: Leaf },
      { valor: i.unidadesDoadas, rotulo: 'Unidades doadas', descricao: 'Entregues gratuitamente a ONGs', icone: HandHeart },
      { valor: i.doacoesRealizadas, rotulo: 'Doações realizadas', descricao: 'Lotes retirados por ONGs', icone: PackageCheck },
      { valor: i.ongsAtendidas, rotulo: 'ONGs atendidas', descricao: 'Organizações diferentes beneficiadas', icone: Users },
    ]} />
    {impacto && <GraficoEvolucao titulo="Evolução nos últimos 6 meses" descricao="Unidades retiradas por mês, por destino."
      dados={impacto.evolucao} series={[
        { chave: 'doadas', rotulo: 'Doadas', classe: 'doadas' },
        { chave: 'vendidas', rotulo: 'Vendidas', classe: 'vendidas' },
      ]} />}
    <p className="fluxo-nota">Os valores somam a quantidade de cada lote retirado. A plataforma ainda não registra o peso dos alimentos.</p>
  </div>;
}
