import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/MyCcontadoresComp/SidebarMyC";
import FilterSection from "../components/MyCcontadoresComp/FilterSection";
import TableHeader from "../components/MyCcontadoresComp/TableHeader";
import ClientRow from "../components/MyCcontadoresComp/ClientRow";
import Pagination from "../components/MyCcontadoresComp/Pagination";
import EditClientForm from "../components/MyCcontadoresComp/EditClientForm";
import FloatingExcelButton from "../components/MyCcontadoresComp/FloatingExcelButton";
import MonthYearModal from "../components/MyCcontadoresComp/MonthYearModal";
import { config } from "../config/config";

function MyContadores() {
    // Estados principales
    const [clients, setClients] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const clientsPerPage = 10;

    // Fetch de clientes al montar el componente
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${config.apiUrl}/api/clientes`);
                // Ordenar inicialmente de forma ascendente
                const sortedClients = response.data.sort((a, b) =>
                    a.nombre.localeCompare(b.nombre)
                );
                setClients(sortedClients);
            } catch (error) {
                console.error("Error al cargar los clientes:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    // Filtrado de clientes según la búsqueda
    const filteredClients = useMemo(() => {
        return clients.filter((client) =>
            client.nombre.toLowerCase().includes(searchName.toLowerCase())
        );
    }, [clients, searchName]);

    // Lógica de paginación: total de páginas y clientes actuales
    const totalPages = useMemo(
        () => Math.ceil(filteredClients.length / clientsPerPage),
        [filteredClients.length, clientsPerPage]
    );

    const currentClients = useMemo(() => {
        const lastIndex = currentPage * clientsPerPage;
        const firstIndex = lastIndex - clientsPerPage;
        return filteredClients.slice(firstIndex, lastIndex);
    }, [filteredClients, currentPage, clientsPerPage]);

    // Handlers de paginación
    const handlePreviousPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const handlePageClick = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
    }, []);

    // Handlers para editar y eliminar clientes
    const handleEditClick = useCallback((client) => {
        setEditingClient(client);
    }, []);

    const handleSaveClient = useCallback((updatedClient) => {
        setClients((prevClients) =>
            prevClients.map((client) =>
                client.clienteId === updatedClient.clienteId ? updatedClient : client
            )
        );
        setEditingClient(null);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingClient(null);
    }, []);

    const handleDeleteClient = useCallback((deletedClientId) => {
        setClients((prevClients) =>
            prevClients.filter((client) => client.clienteId !== deletedClientId)
        );
    }, []);

    // Handler para cambiar el orden de clasificación
    const handleSortChange = useCallback(
        (newSortOrder) => {
            setSortOrder(newSortOrder);
            const sortedClients = [...clients].sort((a, b) => {
                return newSortOrder === "asc"
                    ? a.nombre.localeCompare(b.nombre)
                    : b.nombre.localeCompare(a.nombre);
            });
            setClients(sortedClients);
        },
        [clients]
    );

    // Handlers para el modal de Excel
    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const handleDownloadExcel = useCallback(
        async (month, year) => {
            setIsDownloading(true);
            try {
                const response = await fetch(
                    `${config.apiUrl}/api/clientes/exportar/excel?mes=${month}&anio=${year}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type":
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error("No se pudo descargar el archivo Excel.");
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `clientes_saldo_pendiente_${month}_${year}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                alert("Descarga de Excel completada exitosamente.");
            } catch (err) {
                console.error("Error al descargar el archivo Excel:", err);
                alert("Hubo un error al descargar el archivo Excel. Por favor, intenta nuevamente.");
            } finally {
                setIsDownloading(false);
                handleCloseModal();
            }
        },
        [handleCloseModal]
    );

    if (loading) {
        return <p className="text-center mt-6 text-lg">Cargando clientes...</p>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Contenido Principal */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Filtros y búsqueda */}
                    <FilterSection
                        onAddClient={(clientData) =>
                            setClients((prev) => [...prev, clientData])
                        }
                        onSearchNameChange={setSearchName}
                    />

                    {/* Tabla de clientes */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <TableHeader sortOrder={sortOrder} onSortChange={handleSortChange} />
                        {currentClients.length > 0 ? (
                            <div>
                                {currentClients.map((client) => (
                                    <ClientRow
                                        key={client.clienteId}
                                        client={client}
                                        onDelete={handleDeleteClient}
                                        onEdit={handleEditClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-6">
                                No se encontraron clientes.
                            </p>
                        )}
                    </div>

                    {/* Controles de paginación */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPrevious={handlePreviousPage}
                        onNext={handleNextPage}
                        onPageClick={handlePageClick}
                    />

                    {/* Modal para edición */}
                    {editingClient && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <EditClientForm
                                client={editingClient}
                                onSave={handleSaveClient}
                                onCancel={handleCancelEdit}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Modal para selección de mes y año */}
            <MonthYearModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleDownloadExcel}
            />

            {/* Botón Flotante para Abrir el Modal */}
            <FloatingExcelButton onClick={handleOpenModal} disabled={isDownloading} />
        </div>
    );
}

export default MyContadores;
