import React, { useState, useMemo } from "react";
import { FaChevronLeft, FaChevronRight, FaEye, FaTrashAlt } from "react-icons/fa";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import PaymentDetailsModal from "./PaymentsDetailsModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { config } from "../../config/config";

dayjs.extend(isBetween);

const PaymentTable = ({ payments }) => {
    // Estados locales
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: "fechaTransaccion",
        direction: "ascending",
    });
    const [error, setError] = useState(null);
    const [debtTypes, setDebtTypes] = useState([]);
    const [selectedDebtType, setSelectedDebtType] = useState("");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Extraer tipos únicos de deuda
    useMemo(() => {
        const tiposUnicos = [...new Set(payments.map((pago) => pago.deuda?.tipoDeuda))]
            .filter(Boolean);
        setDebtTypes(tiposUnicos);
    }, [payments]);

    // Funciones para manejo de modales
    const handleViewDetails = (payment) => setSelectedPayment(payment);
    const closeDetails = () => setSelectedPayment(null);
    const handleDelete = (payment) => setPaymentToDelete(payment);
    const closeDeleteModal = () => setPaymentToDelete(null);

    // Función para formatear montos
    const formatAmount = (amount) =>
        amount.toLocaleString("es-CL", { style: "currency", currency: "CLP" });

    // Filtrar pagos
    const filteredPayments = useMemo(() => {
        return payments.filter((payment) => {
            const fechaTransaccion = payment.fechaTransaccion
                ? dayjs(payment.fechaTransaccion).format("DD/MM/YYYY")
                : "";
            const montoFormatted = payment.monto ? formatAmount(payment.monto) : "0";
            const tipoDeuda = payment.deuda?.tipoDeuda || "";
            const obsDeuda = payment.deuda?.observaciones || "";
            const obsPago = payment.observaciones || "";

            const matchesSearchTerm =
                !searchTerm ||
                fechaTransaccion.includes(searchTerm) ||
                montoFormatted.includes(searchTerm) ||
                tipoDeuda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obsDeuda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obsPago.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDebtType = !selectedDebtType || tipoDeuda === selectedDebtType;

            const matchesDateRange = (() => {
                if (dateRange.start && dateRange.end && payment.fechaTransaccion) {
                    const fecha = dayjs(payment.fechaTransaccion);
                    const inicio = dayjs(dateRange.start);
                    const fin = dayjs(dateRange.end);
                    return fecha.isBetween(inicio, fin, null, "[]");
                }
                return true;
            })();

            return matchesSearchTerm && matchesDebtType && matchesDateRange;
        });
    }, [payments, searchTerm, selectedDebtType, dateRange]);

    // Ordenamiento
    const sortedPayments = useMemo(() => {
        const sorted = [...filteredPayments];
        if (sortConfig) {
            sorted.sort((a, b) => {
                let aKey, bKey;
                switch (sortConfig.key) {
                    case "fechaTransaccion":
                        aKey = a.fechaTransaccion ? dayjs(a.fechaTransaccion).valueOf() : 0;
                        bKey = b.fechaTransaccion ? dayjs(b.fechaTransaccion).valueOf() : 0;
                        break;
                    case "monto":
                        aKey = a.monto || 0;
                        bKey = b.monto || 0;
                        break;
                    case "tipoDeuda":
                        aKey = a.deuda?.tipoDeuda || "";
                        bKey = b.deuda?.tipoDeuda || "";
                        break;
                    case "observacionesDeuda":
                        aKey = a.deuda?.observaciones || "";
                        bKey = b.deuda?.observaciones || "";
                        break;
                    case "observaciones":
                        aKey = a.observaciones || "";
                        bKey = b.observaciones || "";
                        break;
                    default:
                        aKey = a[sortConfig.key];
                        bKey = b[sortConfig.key];
                }
                if (aKey < bKey) return sortConfig.direction === "ascending" ? -1 : 1;
                if (aKey > bKey) return sortConfig.direction === "ascending" ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filteredPayments, sortConfig]);

    // Paginación
    const paginatedPayments = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedPayments.slice(start, start + itemsPerPage);
    }, [sortedPayments, currentPage]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;

    // Manejo de cambio de página
    const handlePageChange = (newPage) => {
        if (newPage < 1) newPage = 1;
        else if (newPage > totalPages) newPage = totalPages;
        setCurrentPage(newPage);
    };

    // Manejo de filtros de fechas
    const handleStartDateChange = (e) => {
        setDateRange((prev) => ({ ...prev, start: e.target.value }));
    };

    const handleEndDateChange = (e) => {
        setDateRange((prev) => ({ ...prev, end: e.target.value }));
    };

    // Cambio de ordenamiento
    const requestSort = (key) => {
        let direction = "ascending";
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="bg-white dark:bg-darkCard text-gray-800 dark:text-darkText shadow-md dark:shadow-dark rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">
                Gestión de Pagos
            </h2>

            {/* Barra de búsqueda y filtros */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <input
                    type="text"
                    placeholder="Buscar por fecha, monto, tipo u observaciones"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-md w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Buscar pagos"
                />

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Filtro por tipo de deuda */}
                    <div className="flex items-center">
                        <label htmlFor="debtType" className="mr-2 text-sm dark:text-gray-400">
                            Tipo de Deuda:
                        </label>
                        <select
                            id="debtType"
                            value={selectedDebtType}
                            onChange={(e) => setSelectedDebtType(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos</option>
                            {debtTypes.map((tipo, index) => (
                                <option key={index} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por rango de fechas */}
                    <div className="flex items-center">
                        <label className="mr-2 text-sm dark:text-gray-400">
                            Fecha Transacción:
                        </label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={handleStartDateChange}
                            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-2"
                            aria-label="Fecha inicio"
                        />
                        <span className="mx-2 text-gray-500 dark:text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={handleEndDateChange}
                            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Fecha fin"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de pagos */}
            <div className="overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Pagos
                </h3>
                {error ? (
                    <div className="text-center py-10">
                        <span className="text-red-500">{error}</span>
                    </div>
                ) : (
                    <table className="min-w-full table-auto text-gray-700 dark:text-gray-300 rounded-lg">
                        <thead className="bg-indigo-500 dark:bg-gray-800 text-white">
                        <tr>
                            <th
                                className="p-4 text-center cursor-pointer select-none"
                                onClick={() => requestSort("fechaTransaccion")}
                                aria-sort={sortConfig.key === "fechaTransaccion" ? sortConfig.direction : "none"}
                            >
                                Fecha {sortConfig.key === "fechaTransaccion" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                            </th>
                            <th
                                className="p-4 text-center cursor-pointer select-none"
                                onClick={() => requestSort("monto")}
                                aria-sort={sortConfig.key === "monto" ? sortConfig.direction : "none"}
                            >
                                Monto {sortConfig.key === "monto" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                            </th>
                            <th
                                className="p-4 text-center cursor-pointer select-none"
                                onClick={() => requestSort("tipoDeuda")}
                                aria-sort={sortConfig.key === "tipoDeuda" ? sortConfig.direction : "none"}
                            >
                                Tipo de Deuda {sortConfig.key === "tipoDeuda" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                            </th>
                            <th
                                className="p-4 text-center cursor-pointer select-none"
                                onClick={() => requestSort("observacionesDeuda")}
                                aria-sort={sortConfig.key === "observacionesDeuda" ? sortConfig.direction : "none"}
                            >
                                Observaciones de Deuda {sortConfig.key === "observacionesDeuda" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                            </th>
                            <th className="p-4 text-center">Método</th>
                            <th
                                className="p-4 text-center cursor-pointer select-none"
                                onClick={() => requestSort("observaciones")}
                                aria-sort={sortConfig.key === "observaciones" ? sortConfig.direction : "none"}
                            >
                                Observaciones del Pago {sortConfig.key === "observaciones" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                            </th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron pagos.
                                </td>
                            </tr>
                        ) : (
                            paginatedPayments.map((payment, index) => (
                                <tr
                                    key={payment.pagoId}
                                    className={`border-b dark:border-gray-600 ${
                                        index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : ""
                                    } hover:bg-indigo-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out`}
                                >
                                    <td className="p-4 text-center">
                                        {payment.fechaTransaccion
                                            ? dayjs(payment.fechaTransaccion).format("DD/MM/YYYY")
                                            : "Sin fecha"}
                                    </td>
                                    <td className="p-4 text-center">
                                        {payment.monto ? formatAmount(payment.monto) : "0"}
                                    </td>
                                    <td className="p-4 text-center">{payment.deuda?.tipoDeuda || "N/A"}</td>
                                    <td className="p-4 text-center">{payment.deuda?.observaciones || "N/A"}</td>
                                    <td className="p-4 text-center">{payment.metodoPago || "N/A"}</td>
                                    <td className="p-4 text-center">{payment.observaciones || "Sin observaciones"}</td>
                                    <td className="p-4 text-center flex justify-center gap-4">
                                        <button
                                            onClick={() => handleViewDetails(payment)}
                                            className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                            aria-label={`Ver detalles del pago ${payment.pagoId}`}
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(payment)}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                            aria-label={`Eliminar pago ${payment.pagoId}`}
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-6">
                <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50"
                    aria-label="Página anterior"
                >
                    <FaChevronLeft className="text-gray-500 dark:text-gray-300" />
                </button>
                <span className="text-sm dark:text-gray-400">
          Página {currentPage} de {totalPages}
        </span>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full disabled:opacity-50"
                    aria-label="Página siguiente"
                >
                    <FaChevronRight className="text-gray-500 dark:text-gray-300" />
                </button>
            </div>

            {/* Modal para ver detalles */}
            {selectedPayment && (
                <PaymentDetailsModal payment={selectedPayment} onClose={closeDetails} />
            )}

            {/* Modal de confirmación de eliminación */}
            {paymentToDelete && (
                <DeleteConfirmationModal
                    onConfirm={async () => {
                        try {
                            const response = await fetch(
                                `${config.apiUrl}/api/pagos/cancelar/${paymentToDelete.pagoId}`,
                                { method: "DELETE" }
                            );
                            if (!response.ok) {
                                throw new Error("Error al eliminar el pago.");
                            }
                            closeDeleteModal();
                        } catch (err) {
                            console.error("Error al eliminar el pago:", err);
                            setError("Error al eliminar el pago.");
                        }
                    }}
                    onCancel={closeDeleteModal}
                    message={`¿Estás seguro de eliminar el pago de ${formatAmount(
                        paymentToDelete.monto
                    )}?`}
                />
            )}
        </div>
    );
};

export default PaymentTable;
