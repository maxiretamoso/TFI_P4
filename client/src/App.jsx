import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Login from "./pantallas/Login.jsx";
import Categorias from "./pantallas/Categorias.jsx";
import logo from "./img/logo-muni.png";

// Pantalla principal cuando hay sesión (B04 agrega acá las categorías)
function Principal() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <section className="principal-container">
      <p>
        Hola, {usuario.nombres} {usuario.apellidos} (rol {usuario.rol})
      </p>
      <button type="button" onClick={cerrarSesion}>
        Salir
      </button>

      <Categorias />
    </section>
  );
}

// Decide qué se ve: sin sesión -> Login, con sesión -> Principal
function Pantallas() {
  const { usuario } = useAuth();

  return (
    <div className="container-princ">
      <div className="titulo-container">
        <img
          className="logo-municipalidad"
          src={logo}
          alt="Logo Municipalidad de Concordia"
        />
        <h1>Sistema de Incidencias</h1>
      </div>

      {!usuario && <Login />}
      {usuario && <Principal />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Pantallas />
    </AuthProvider>
  );
}
