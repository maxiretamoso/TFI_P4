const formularioCategoria = document.getElementById('form-categoria');
const nombreCategoria = document.getElementById('nombre-categoria');
const tablaCategorias = document.getElementById('tabla-categorias');

const respuesta = await fetch('http://localhost:3000/api/v1/categorias');

const categorias = await respuesta.json();

console.log(categorias);

categorias.forEach((categoria) => {
    const fila = document.createElement('tr');

    const celdaId = document.createElement('td');
    celdaId.textContent = categoria.id_categoria;
    fila.appendChild(celdaId);

    const celdaDescripcion = document.createElement('td');
    celdaDescripcion.textContent = categoria.descripcion;
    fila.appendChild(celdaDescripcion);

    const celdaAcciones = document.createElement('td');

    const botonEditar = document.createElement('button');
    botonEditar.type = 'button';
    botonEditar.textContent = 'Editar';
    botonEditar.className = 'boton-editar';

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.className = 'boton-eliminar';

    celdaAcciones.appendChild(botonEditar);
    celdaAcciones.appendChild(botonEliminar);

    fila.appendChild(celdaAcciones);

    tablaCategorias.appendChild(fila);
});

formularioCategoria.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const descripcion = nombreCategoria.value;
});
