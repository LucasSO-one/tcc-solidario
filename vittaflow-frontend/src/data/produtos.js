import pao from "../assets/images/pao.png";
import arroz from "../assets/images/arroz.png";
import maca from "../assets/images/maca.png";

const produtos = [

    {

        id:1,

        nome:"Pão Francês",

        categoria:"Padaria",

        estabelecimento:"Padaria Central",

        quantidade:"80 unidades",

        validade:"Vence hoje às 23:59",

        imagem:pao

    },

    {

        id:2,

        nome:"Arroz Branco",

        categoria:"Grãos",

        estabelecimento:"Mercado Popular",

        quantidade:"50 unidades",

        validade:"Vence hoje às 20:00",

        imagem:arroz

    },

    {

        id:3,

        nome:"Maçã Verde",

        categoria:"Hortifruti",

        estabelecimento:"Feira Central",

        quantidade:"35 unidades",

        validade:"Vence amanhã às 10:00",

        imagem:maca

    }

];

export default produtos;