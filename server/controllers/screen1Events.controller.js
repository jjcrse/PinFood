// Controlador para la ruta /api/screen1
export const getScreen1Events = (req, res) => {
  try {
    // Ejemplo de datos simulados
    const eventos = [
      { id: 1, nombre: "Evento A", fecha: "2025-10-20" },
      { id: 2, nombre: "Evento B", fecha: "2025-10-22" },
    ];

    res.status(200).json({
      success: true,
      data: eventos,
    });
  } catch (error) {
    console.error("Error obteniendo eventos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};
