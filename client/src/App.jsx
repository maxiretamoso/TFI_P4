import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  NavLink,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import MisIncidencias from "./pages/MisIncidencias.jsx";
import MisAsignadas from "./pages/MisAsignadas.jsx";
import Catalogos from "./pages/Catalogos.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Reportes from "./pages/Reportes.jsx";
import logo from "./img/logo-muni.png";
import "./App.css";

// Sin sesión no entra ninguna ruta protegida: redirige al login
function Protegida() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Barra de menú + saludo + salir. El contenido va en el Outlet
function ConMenu() {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navegar = () => setMenuAbierto(false);

  return (
    <>
      <nav
        id="menu-principal"
        className={"menu-principal" + (menuAbierto ? " abierto" : "")}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") setMenuAbierto(false);
        }}
      >
        <button
          type="button"
          className="boton-hamburguesa"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label="Abrir o cerrar el menú"
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
        >
          ☰
        </button>

        <NavLink to="/" onClick={navegar}>
          Mis incidencias
        </NavLink>
        {usuario.rol >= 2 && (
          <NavLink to="/asignadas" onClick={navegar}>
            Mis asignadas
          </NavLink>
        )}
        <NavLink to="/catalogos" onClick={navegar}>
          Catálogos
        </NavLink>
        <NavLink to="/usuarios" onClick={navegar}>
          Usuarios
        </NavLink>
        {usuario.rol >= 3 && (
          <NavLink to="/dashboard" onClick={navegar}>
            Dashboard
          </NavLink>
        )}
        {usuario.rol >= 3 && (
          <NavLink to="/reportes" onClick={navegar}>
            Reportes
          </NavLink>
        )}

        <span className="menu-saludo">
          Hola, {usuario.nombres} {usuario.apellidos} (rol {usuario.rol})
        </span>
        <button type="button" onClick={cerrarSesion}>
          Salir
        </button>
      </nav>

      <main id="contenido-principal">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="container-princ">
          <div className="titulo-container">
            <img
              className="logo-municipalidad"
              src={logo}
              alt="Logo Municipalidad de Concordia"
            />
            <h1>Sistema de Incidencias</h1>
          </div>

          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<Protegida />}>
              <Route element={<ConMenu />}>
                <Route path="/" element={<MisIncidencias />} />
                <Route path="/asignadas" element={<MisAsignadas />} />
                <Route path="/catalogos" element={<Catalogos />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/reportes" element={<Reportes />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
