import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/cliente.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "./Login.css";

function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [error, setError] = useState("");

  async function manejarEnvio(evento) {
    // El form HTML recarga la página por defecto; acá no queremos eso
    evento.preventDefault();
    setError("");

    // Validación en el navegador: evita un viaje al servidor sin necesidad
    if (!usuario.trim() || !contrasenia.trim()) {
      setError("Completá usuario y contraseña");
      return;
    }

    try {
      const datos = await api.post("/auth/login", { usuario, contrasenia });
      iniciarSesion(datos);
      // replace: que el login no quede en el historial (atrás no vuelve al form)
      navegar("/", { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={manejarEnvio}>
        <label htmlFor="usuario">Usuario:</label>
        <input
          type="text"
          id="usuario"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          placeholder="usuario@correo.com"
          autoFocus
        />

        <label htmlFor="contrasenia">Contraseña:</label>
        <input
          type="password"
          id="contrasenia"
          value={contrasenia}
          onChange={(evento) => setContrasenia(evento.target.value)}
          placeholder="Contraseña"
        />

        <button type="submit">Ingresar</button>
      </form>

      {error && <p className="login-error">{error}</p>}
    </div>
  );
}

export default Login;
