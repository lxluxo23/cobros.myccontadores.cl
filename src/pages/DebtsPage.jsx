import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DebtTable from "../components/DebtsComp/DebtTable";
import Modal from "../components/DebtsComp/Modal";
import AddAccountingHonorary from "../components/DebtsComp/AddAccountingHonorary";
import { useCliente } from "../components/context/ClienteContext";
import { FaPlus } from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";
import { AddDebtForm } from "../components/DebtsComp/AddDebtForm";
import { EditDebtForm } from "../components/DebtsComp/EditDebtForm";
import { config } from "../config/config";

const DebtsPage = () => {
    const { clienteId } = useCliente();
    const [debts, setDebts] = useState([]);
    const [honorariosContables, setHonorariosContables] = useState([]);
    const [isHonoraryModalOpen, setIsHonoraryModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [totalDeudas, setTotalDeudas] = useState(null);

    // Estados para editar deuda
    const [debtToEdit, setDebtToEdit] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchTotalDeudas = async () => {
        if (!clienteId) return;
        try {
            const response = await fetch(`${config.apiUrl}/api/deudas/usuario/${clienteId}/total`);
            if (!response.ok) throw new Error("Error al obtener el total de deudas");
            const total = await response.json();
            setTotalDeudas(total);
        } catch (error) {
            console.error("Error al obtener total de deudas:", error);
        }
    };

    const fetchDebts = async () => {
        if (!clienteId) return;
        try {
            const response = await fetch(`${config.apiUrl}/api/deudas/usuario/${clienteId}`);
            if (!response.ok) throw new Error("Error al cargar deudas");
            const data = await response.json();
            setDebts(data);
        } catch (error) {
            setError("Error al cargar deudas. Inténtalo más tarde.");
        }
    };

    const fetchHonorarios = async () => {
        if (!clienteId) return;
        try {
            const response = await fetch(`${config.apiUrl}/api/honorarios/cliente/${clienteId}`);
            if (!response.ok) throw new Error("Error al cargar honorarios contables");
            const data = await response.json();
            setHonorariosContables(data);
        } catch (error) {
            console.error("Error al recargar honorarios contables:", error);
        }
    };

    useEffect(() => {
        if (!clienteId) {
            navigate("/");
            return;
        }
        fetchDebts();
        fetchHonorarios();
        fetchTotalDeudas();
    }, [clienteId, navigate]);

    const filtrarPorFechas = async () => {
        if (!fechaInicio || !fechaFin) {
            setError("Debes seleccionar ambas fechas para filtrar.");
            return;
        }
        try {
            const response = await fetch(`${config.apiUrl}/api/deudas/filtro-fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            if (!response.ok) throw new Error("Error al filtrar deudas por fecha");
            const data = await response.json();
            setDebts(data);
            setError(null);
        } catch (error) {
            setError("No se pudo filtrar las deudas. Inténtalo de nuevo.");
        }
    };

    const mostrarPendientes = async () => {
        try {
            const response = await fetch(`${config.apiUrl}/api/deudas/usuario/${clienteId}/pendientes`);
            if (!response.ok) throw new Error("Error al cargar deudas pendientes");
            const data = await response.json();
            setDebts(data);
            setError(null);
        } catch (error) {
            setError("No se pudo cargar las deudas pendientes. Inténtalo de nuevo.");
        }
    };

    const handleAddHonorary = async (clienteId, payload) => {
        try {
            const response = await fetch(`${config.apiUrl}/api/honorarios/${clienteId}`, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) throw new Error("Error al agregar honorario contable");
            await fetchHonorarios();
            setIsHonoraryModalOpen(false);
            setError(null);
        } catch (error) {
            setError("No se pudo agregar el honorario contable. Inténtalo de nuevo.");
        }
    };

    const handleAddDebt = async (debtData) => {
        try {
            const response = await fetch(`${config.apiUrl}/api/deudas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...debtData,
                    cliente: { clienteId: clienteId },
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error del servidor:", errorData);
                throw new Error(errorData.error || "Error al agregar la deuda");
            }
            const newDebt = await response.json();
            setDebts((prev) => [...prev, newDebt]);
            setIsDebtModalOpen(false);
            setError(null);
            fetchTotalDeudas();
        } catch (error) {
            setError(error.message || "No se pudo agregar la deuda. Inténtalo de nuevo.");
        }
    };

    // Función para iniciar el proceso de edición
    const handleEditDebt = (debt) => {
        console.log("Editar deuda:", debt);
        setDebtToEdit(debt);
        setIsEditModalOpen(true);
    };

    // Función para actualizar la deuda en el servidor
    const handleUpdateDebt = async (deudaId, updatedData) => {
        try {
            const response = await fetch(`${config.apiUrl}/api/deudas/${deudaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (!response.ok) throw new Error("Error al actualizar la deuda");
            const updatedDebt = await response.json();
            setDebts((prev) =>
                prev.map((debt) => (debt.deudaId === deudaId ? updatedDebt : debt))
            );
            setIsEditModalOpen(false);
            setDebtToEdit(null);
            fetchTotalDeudas();
        } catch (error) {
            setError(error.message || "No se pudo actualizar la deuda.");
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            {/* Agregamos un margen inferior extra (mb-24) para que los botones flotantes no tapen la paginación */}
            <div className="flex-1 p-6 space-y-6 mb-24">
                {/* Tarjeta Superior: Total y Filtros */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                            {totalDeudas !== null
                                ? `Total de Deudas: $${Number(totalDeudas).toLocaleString("es-CL")}`
                                : "Cargando Total..."}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Aquí puedes filtrar tus deudas por rango de fecha o ver solamente las pendientes.
                        </p>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">
                            Filtrar por Rango de Fechas:
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4">
                            <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-300 text-sm mb-1">Fecha Inicio</span>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="border p-2 rounded w-full sm:w-auto dark:bg-gray-700 dark:text-white"
                                    placeholder="YYYY-MM-DD"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-300 text-sm mb-1">Fecha Fin</span>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="border p-2 rounded w-full sm:w-auto dark:bg-gray-700 dark:text-white"
                                    placeholder="YYYY-MM-DD"
                                />
                            </div>
                            <div className="flex space-x-2 mt-4 sm:mt-0">
                                <button
                                    onClick={filtrarPorFechas}
                                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
                                    title="Filtrar las deudas por el rango de fechas seleccionado"
                                >
                                    Filtrar
                                </button>
                                <button
                                    onClick={mostrarPendientes}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                                    title="Mostrar solo las deudas pendientes"
                                >
                                    Ver Pendientes
                                </button>
                                <button
                                    onClick={fetchDebts}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                                    title="Mostrar todas las deudas sin filtros"
                                >
                                    Ver Todas
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </div>
                </div>

                {/* Tabla de Deudas y Honorarios */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow space-y-6">
                    <DebtTable
                        debts={debts}
                        honorariosContables={honorariosContables}
                        clienteId={clienteId}
                        handleEditDebt={handleEditDebt}
                    />
                </div>
            </div>

            {/* Botones flotantes a la derecha; se han reposicionado a bottom-24 para que no tapen la paginación */}
            <div className="fixed bottom-24 right-4 flex flex-col space-y-4 z-50">
                <button
                    onClick={() => setIsDebtModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
                    title="Agregar una nueva deuda"
                >
                    <FaPlus />
                    <span>Añadir Deuda</span>
                </button>
                <button
                    onClick={() => setIsHonoraryModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
                    title="Agregar un nuevo honorario contable"
                >
                    <FaPlus />
                    <span>Agregar Honorario Contable</span>
                </button>
            </div>

            <ThemeToggle />

            {/* Modales */}
            <Modal isOpen={isHonoraryModalOpen} onClose={() => setIsHonoraryModalOpen(false)}>
                <AddAccountingHonorary
                    onSubmit={handleAddHonorary}
                    clienteId={clienteId}
                    onClose={() => setIsHonoraryModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)}>
                <AddDebtForm
                    onSubmit={handleAddDebt}
                    onClose={() => setIsDebtModalOpen(false)}
                />
            </Modal>

            {/* Modal para editar deuda */}
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setDebtToEdit(null); }}>
                {debtToEdit && (
                    <EditDebtForm
                        debt={debtToEdit}
                        onSubmit={handleUpdateDebt}
                        onClose={() => { setIsEditModalOpen(false); setDebtToEdit(null); }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default DebtsPage;