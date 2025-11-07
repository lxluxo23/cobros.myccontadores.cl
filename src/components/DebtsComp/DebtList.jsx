import React from "react";
import { FaEye, FaTrash, FaEdit, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import dayjs from "dayjs";
import Spinner from "./Spinner";

const DebtList = ({
                      debts,
                      currentPage,
                      onPageChange,
                      handleViewDetails,
                      handleDeleteDebt,
                      handleEditDebt,
                  }) => {
    const itemsPerPage = 10;
    const paginatedData = (data, currentPage) =>
        data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl =">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
                Deudas Normales
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto rounded-lg">
                    <thead className="bg-indigo-500 dark:bg-gray-700 text-white">
                    <tr>
                        <th className="py-3 px-6 text-center">Tipo de Deuda</th>
                        <th className="py-3 px-6 text-center">Monto Total</th>
                        <th className="py-3 px-6 text-center">Monto Restante</th>
                        <th className="py-3 px-6 text-center">Estado</th>
                        <th className="py-3 px-6 text-center">Fecha Inicio</th>
                        <th className="py-3 px-6 text-center">Fecha Vencimiento</th>
                        <th className="py-3 px-6 text-center">Observaciones</th>
                        <th className="py-3 px-6 text-center">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {debts.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="py-4 px-6 text-center text-gray-500 dark:text-gray-300">
                                <h4>No hay deudas disponibles</h4>
                            </td>
                        </tr>
                    ) : (
                        paginatedData(debts, currentPage).map((debt) => (
                            <tr
                                key={debt.deudaId}
                                className="border-b dark:border-gray-700 hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors duration-200"
                            >
                                <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                    {debt.tipoDeuda}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                    {debt.montoTotal
                                        ? `$${Number(debt.montoTotal).toLocaleString("es-CL")}`
                                        : "N/A"}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                    {debt.montoRestante
                                        ? `$${Number(debt.montoRestante).toLocaleString("es-CL")}`
                                        : "N/A"}
                                </td>
                                <td className="py-4 px-6 text-center">
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                            debt.estadoDeuda === "Pagado"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                        }`}
                    >
                      {debt.estadoDeuda || "Desconocido"}
                    </span>
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                    {debt.fechaInicio
                                        ? dayjs(debt.fechaInicio).format("DD/MM/YYYY")
                                        : "Sin fecha"}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                    {debt.fechaVencimiento
                                        ? dayjs(debt.fechaVencimiento).format("DD/MM/YYYY")
                                        : "Sin fecha"}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700 dark:text-gray-300">
                                    {debt.observaciones || "Sin observaciones"}
                                </td>
                                <td className="py-4 px-6 text-center space-x-2">
                                    <button
                                        onClick={() => handleViewDetails(debt)}
                                        title="Ver Detalles"
                                        className="text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-100 transition-colors"
                                    >
                                        <FaEye size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleEditDebt(debt)}
                                        title="Editar Deuda"
                                        className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100 transition-colors"
                                    >
                                        <FaEdit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDebt(debt)}
                                        title="Eliminar Deuda"
                                        className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 transition-colors"
                                    >
                                        <FaTrash size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))
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
    Página {currentPage} de {itemsPerPage}
  </span>
                <button
                    disabled={currentPage === itemsPerPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    title="Página siguiente"
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                    <FaChevronRight className="text-gray-500 dark:text-gray-300" />
                </button>
            </div>

        </div>
    );
};

export default DebtList;
