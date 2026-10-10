function Cargando({ texto = "Cargando..." }) {
  return (
    <p className="cargando" role="status" aria-live="polite">
      <span className="cargando-bola" aria-hidden="true" />
      {texto}
    </p>
  );
}

export default Cargando;
