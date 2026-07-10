import "./MinhasReservas.css";
import ReservationCard from "../../../components/ReservationCard/ReservationCard";
import reservas from "../../../data/reservasConsumidor";

function MinhasReservas() {
  return (
    <main className="minhas-reservas">
      <h1>Minhas Reservas</h1>
      <p>Acompanhe suas reservas e retiradas.</p>

      {reservas.map((reserva) => (
        <ReservationCard
          key={reserva.id}
          {...reserva}
        />
      ))}
    </main>
  );
}

export default MinhasReservas;