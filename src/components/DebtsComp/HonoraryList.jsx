import React, { useState, useMemo } from "react";
import {
    FaEye,
    FaTrash,
    FaPencilAlt,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import dayjs from "dayjs";
import Modal from "./Modal";
import { config } from "../../config/config";

const HonoraryList = ({
                          honorariosContables,
                          currentPage,
                          onPageChange,
                          handleViewHonorarioDetails,
                          handleDeleteHonorario,
                          handleEditHonorario,
                          fetchHonorarios,
                          openPaymentModal,
                      }) => {
    const itemsPerPage = 12;

    // Estados para modales y edición
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [honorarioToDelete, setHonorarioToDelete] = useState(null);
    const [showEditHonorarioModal, setShowEditHonorarioModal] = useState(false);
    const [nuevoMontoMensual, setNuevoMontoMensual] = useState(0);
    const [selectedHonorario, setSelectedHonorario] = useState(null);
    const [selectedMes, setSelectedMes] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedHonorarioDetails, setSelectedHonorarioDetails] = useState(null);

    // Aplanar la estructura: cada fila corresponde a un mes de honorario
    const flatRows = useMemo(() => {
        let rows = [];
        honorariosContables.forEach((honorario) => {
            honorario.meses.forEach((mes) => {
                rows.push({
                    honorarioId: honorario.honorarioId,
                    anio: honorario.anio,
                    mes: mes.mes, // número de mes (1-12)
                    montoMensual: mes.montoMensual,
                    montoPagado: mes.montoPagado,
                    estado: mes.estado,
                });
            });
        });
        // Ordenar por año descendente y mes ascendente
        rows.sort((a, b) => {
            if (a.anio !== b.anio) return b.anio - a.anio;
            return a.mes - b.mes;
        });
        return rows;
    }, [honorariosContables]);

    // Paginación sobre el array aplanado
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return flatRows.slice(start, start + itemsPerPage);
    }, [flatRows, currentPage]);

    const totalPages = Math.ceil(flatRows.length / itemsPerPage) || 1;

    // Funciones para botones de acciones
    const handleDeleteHonorarioClick = (honorario) => {
        setHonorarioToDelete(honorario);
        setShowDeleteConfirmation(true);
    };

    const confirmDeleteHonorario = async () => {
        try {
            const response = await fetch(
                `${config.apiUrl}/api/honorarios/${honorarioToDelete.honorarioId}`,
                { method: "DELETE" }
            );
            if (!response.ok) throw new Error("Error al eliminar el honorario.");
            alert("Honorario eliminado con éxito.");
            setShowDeleteConfirmation(false);
            setHonorarioToDelete(null);
            fetchHonorarios();
        } catch (err) {
            console.error("Error al eliminar el honorario:", err);
            alert("No se pudo eliminar el honorario.");
            setShowDeleteConfirmation(false);
        }
    };

    const handleEditHonorarioClick = (honorarioId, mes, montoActual) => {
        setSelectedHonorario(honorarioId);
        setSelectedMes(mes);
        setNuevoMontoMensual(montoActual);
        setShowEditHonorarioModal(true);
    };

    const handleSubmitEdit = async () => {
        if (nuevoMontoMensual <= 0) {
            alert("Por favor, ingresa un monto válido.");
            return;
        }
        try {
            const response = await fetch(
                `${config.apiUrl}/api/honorarios/${selectedHonorario}/mes/${selectedMes}?nuevoMontoMensual=${nuevoMontoMensual}`,
                { method: "PUT" }
            );
            if (!response.ok) throw new Error("Error al editar el honorario.");
            alert("Honorario actualizado con éxito.");
            setShowEditHonorarioModal(false);
            fetchHonorarios();
        } catch (err) {
            console.error("Error al editar el honorario:", err);
            alert("No se pudo editar el honorario.");
            setShowEditHonorarioModal(false);
        }
    };

    const handleViewDetailsClick = async (honorarioId) => {
        try {
            const response = await fetch(`${config.apiUrl}/api/honorarios/${honorarioId}/detalle`);
            if (!response.ok) throw new Error("Error al cargar los detalles del honorario.");
            const data = await response.json();
            setSelectedHonorarioDetails(data);
        } catch (err) {
            console.error("Error al cargar los detalles:", err);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 text-center">
                Honorarios Contables
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                    <thead className="bg-indigo-500 dark:bg-gray-700 text-white">
                    <tr>
                        <th className="py-3 px-6 text-center">Monto Mensual</th>
                        <th className="py-3 px-6 text-center">Monto Pagado</th>
                        <th className="py-3 px-6 text-center">Monto Restante</th>
                        <th className="py-3 px-6 text-center">Estado</th>
                        <th className="py-3 px-6 text-center">Mes</th>
                        <th className="py-3 px-6 text-center">Año</th>
                        <th className="py-3 px-6 text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedRows.length === 0 ? (
                        <tr>
                            <td
                                colSpan="7"
                                className="py-4 px-6 text-center text-gray-500 dark:text-gray-300"
                            >
                                <h4>No hay honorarios disponibles</h4>
                                <p>Revisa más tarde o agrega nuevos honorarios.</p>
                            </td>
                        </tr>
                    ) : (
                        // Al renderizar, si el año cambia, insertar una fila de grupo
                        paginatedRows.map((row, index) => {
                            const showYearHeader =
                                index === 0 ||
                                row.anio !== paginatedRows[index - 1].anio;
                            return (
                                <React.Fragment key={`${row.honorarioId}-${row.mes}`}>
                                    {showYearHeader && (
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <td colSpan="7" className="py-2 px-4 text-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                {row.anio}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-b dark:border-gray-600 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors duration-200">
                                        <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                            ${Number(row.montoMensual).toLocaleString("es-CL")}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                            {row.montoPagado
                                                ? `$${Number(row.montoPagado).toLocaleString("es-CL")}`
                                                : "$0"}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                            ${(
                                            Number(row.montoMensual) - Number(row.montoPagado || 0)
                                        ).toLocaleString("es-CL")}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                row.estado === "Pagado"
                                    ? "bg-green-500 text-white"
                                    : "bg-yellow-500 text-white"
                            }`}
                        >
                          {row.estado}
                        </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                            {dayjs().month(row.mes - 1).format("MMMM")}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                            {row.anio}
                                        </td>
                                        <td className="py-4 px-6 text-center flex justify-center gap-2">
                                            <button
                                                onClick={() => handleViewDetailsClick(row.honorarioId)}
                                                title="Ver Detalles"
                                                className="text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-100 transition-colors"
                                            >
                                                <FaEye size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHonorario(row)}
                                                title="Eliminar Honorario"
                                                className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 transition-colors"
                                            >
                                                <FaTrash size={20} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleEditHonorarioClick(row.honorarioId, row.mes, row.montoMensual)
                                                }
                                                title="Editar Honorario"
                                                className="text-yellow-500 dark:text-yellow-300 hover:text-yellow-700 dark:hover:text-yellow-100 transition-colors"
                                            >
                                                <FaPencilAlt size={20} />
                                            </button>
                                            <button
                                                onClick={() => openPaymentModal(row.honorarioId, row.mes)}
                                                title="Registrar Pago"
                                                className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100 transition-colors"
                                            >
                                                <FaPlus size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-center items-center mt-6 space-x-4">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    title="Página anterior"
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                    <FaChevronLeft className="text-gray-500 dark:text-gray-300" />
                </button>
                <span className="text-sm dark:text-gray-400">
    Página {currentPage} de {totalPages}
  </span>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    title="Página siguiente"
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                    <FaChevronRight className="text-gray-500 dark:text-gray-300" />
                </button>
            </div>

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirmation && (
                <Modal isOpen={showDeleteConfirmation} onClose={() => setShowDeleteConfirmation(false)}>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 text-center">¿Estás seguro de que deseas eliminar este honorario?</h3>
                        <div className="flex justify-around">
                            <button
                                onClick={confirmDeleteHonorario}
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="bg-gray-300 text-black py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Edición */}
            {showEditHonorarioModal && (
                <Modal isOpen={showEditHonorarioModal} onClose={() => setShowEditHonorarioModal(false)}>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 text-center">Editar Honorario - Mes {selectedMes}</h3>
                        <input
                            type="number"
                            value={nuevoMontoMensual}
                            onChange={(e) => setNuevoMontoMensual(e.target.value)}
                            placeholder="Nuevo monto mensual"
                            className="w-full p-3 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSubmitEdit}
                            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default HonoraryList;
