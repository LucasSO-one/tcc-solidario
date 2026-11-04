import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Leaf, Store, ShoppingBasket, HeartHandshake, MapPin, Sprout, Home as HomeIcon, Route, Users, Check } from 'lucide-react';
import Logo from '../../components/Logo/Logo';
import Rodape from '../../components/Rodape/Rodape';
import partilha from '../../assets/harmony-produce2.png';
import alimentos from '../../assets/harmony-produce.png';
import maca from '../../assets/maca.jpg';
import pao from '../../assets/pao.jpg';
import './Home.scss';

const participantes = [
  { Icone: ShoppingBasket, nome: 'Sou consumidor', titulo: 'Para quem quer aproveitar', texto: 'Encontre alimentos na vitrine e reserve para retirar no comércio.' },
  { Icone: Store, nome: 'Tenho um comércio', titulo: 'Para quem tem um comércio', texto: 'Dê um destino aos excedentes: anuncie seus lotes para venda ou doação.' },
  { Icone: HeartHandshake, nome: 'Represento uma ONG', titulo: 'Para quem transforma vidas', texto: 'Encontre doações e organize a retirada para suas ações sociais.' },
];

const passos = [
  { imagem: alimentos, titulo: 'Crie sua conta', texto: 'Escolha seu perfil e faça parte dessa conexão.' },
  { imagem: maca, titulo: 'Encontre e reserve', texto: 'Consumidores conhecem os destaques em Ofertas e reservam na Vitrine. ONGs acessam as doações.' },
  { imagem: pao, titulo: 'Retire e aproveite', texto: 'Vá ao estabelecimento no prazo da reserva e apresente seu código de retirada.' },
];

export default function Home() {
  return (
    <div className="home">
      <a className="home__pular" href="#conteudo">Ir para o conteúdo</a>
      <div className="home__moldura">
        <header className="home__header">
          <Link to="/" aria-label="VittaFlow: início"><Logo /></Link>
          <nav aria-label="Navegação principal">
            <a className="home__pill home__pill--atual" href="#conteudo"><HomeIcon size={17} aria-hidden="true" />Início</a>
            <a className="home__pill" href="#como-funciona"><Route size={17} aria-hidden="true" />Como funciona</a>
            <a className="home__pill" href="#para-quem"><Users size={17} aria-hidden="true" />Para quem</a>
          </nav>
          <Link to="/login" className="home__entrar">Entrar <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </header>

        <main id="conteudo">
          <div className="home__contexto"><span><Leaf size={15} aria-hidden="true" /> Conheça a VittaFlow</span><span>Alimentos conectam pessoas.</span></div>
          <div className="home__grade">
            <div className="home__principal">
              <section className="home__hero" aria-labelledby="home-titulo">
                <div className="home__foto">
                  <img src={partilha} alt="Pessoas compartilhando uma cesta com pão e verduras" fetchPriority="high" />
                  <span className="home__foto-legenda"><Sprout size={16} aria-hidden="true" /> Cada alimento conta.</span>
                </div>
                <div className="home__intro">
                  <span className="eyebrow">Um novo destino, um novo começo</span>
                  <h1 id="home-titulo">Alimento bom<br />merece <em>um novo destino.</em></h1>
                  <div className="home__tags"><span><Store size={13} aria-hidden="true" /> Venda</span><span><HeartHandshake size={13} aria-hidden="true" /> Doação</span><span><MapPin size={13} aria-hidden="true" /> Retirada local</span></div>
                  <p>Aproximamos comércios, consumidores e organizações sociais para que os alimentos excedentes encontrem quem pode aproveitá-los.</p>
                  <p className="home__proposito">Menos desperdício. Mais possibilidades à mesa.</p>
                  <div className="home__acoes"><Link to="/register" className="btn btn--primary">Quero participar <ArrowRight aria-hidden="true" /></Link><a href="#como-funciona">Conheça a iniciativa <ArrowUpRight size={16} aria-hidden="true" /></a></div>
                </div>
              </section>

              <section id="como-funciona" className="home__como" aria-labelledby="como-titulo">
                <div className="home__secao-topo"><h2 id="como-titulo"><Route size={23} aria-hidden="true" /> Do encontro à retirada</h2><span>É assim que acontece</span></div>
                <ol className="home__passos">{passos.map(({ imagem, titulo, texto }, index) => (
                  <li key={titulo}>
                    <div className="home__passo-foto"><img src={imagem} alt="" loading="lazy" /><span>0{index + 1}</span></div>
                    <h3>{titulo}</h3><p>{texto}</p>
                  </li>
                ))}</ol>
                <div className="home__lembrete"><Check size={17} aria-hidden="true" /><p>Nas vendas, o pagamento é feito diretamente ao varejista, no momento combinado.</p></div>
              </section>
            </div>

            <aside id="para-quem" className="home__participantes" aria-labelledby="participantes-titulo">
              <div className="home__lateral-topo"><span className="home__rede"><Users size={20} aria-hidden="true" /></span><span className="eyebrow">Cada pessoa tem seu papel</span><h2 id="participantes-titulo">Uma rede.<br /> Muitos destinos.</h2><p>Encontre seu lugar por aqui.</p></div>
              <div className="home__cards">{participantes.map(({ Icone, nome, titulo, texto }) => (
                <article className="home__card" key={nome}>
                  <span className="home__icone"><Icone size={20} aria-hidden="true" /></span>
                  <h3>{titulo}</h3><p>{texto}</p><Link to="/register">{nome}<ArrowUpRight size={15} aria-hidden="true" /></Link>
                </article>
              ))}</div>
              <p className="home__aprovacao">Comércios e ONGs precisam de aprovação do cadastro para operar.</p>
            </aside>
          </div>
          <div className="home__faixa"><Leaf size={20} aria-hidden="true" /><p>O que sobra em um lugar pode fazer a diferença em outro.</p><span>Esse é o nosso propósito.</span></div>
        </main>
        <Rodape />
      </div>
    </div>
  );
}
