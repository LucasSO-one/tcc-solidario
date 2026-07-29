import "./ReservationCard.css";

function ReservationCard({
  nome,
  estabelecimento,
  horario,
  status,
  imagem
}) {
  return (
    <div className="reservation-card">
      <img src={imagem} alt={nome} />

      <div className="reservation-info">
        <h3>{nome}</h3>
        <p>{estabelecimento}</p>
        <small>Retirada: {horario}</small>
      </div>

      <span className={`status ${status.toLowerCase()}`}>
        {status}
      </span>
    </div>
  );
}

export default ReservationCard;