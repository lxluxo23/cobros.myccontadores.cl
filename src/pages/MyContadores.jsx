import React, { useState, useEffect, useCallback, useRef } from "react";
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

// Hook para debouncing - evita llamadas excesivas al backend
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        console.log(`[Debounce] Iniciando timer para: "${value}"`);
        const handler = setTimeout(() => {
            setDebouncedValue(value);
            console.log(`[Debounce] Valor aplicado: "${value}"`);
        }, delay);

        return () => {
            console.log(`[Debounce] Timer cancelado para: "${value}"`);
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

function MyContadores() {
    // Estados principales
    const [clients, setClients] = useState([]);
    const [searchName, setSearchName] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Estados para paginación del BACKEND (0-indexed)
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const clientsPerPage = 10;

    // Debounce para búsqueda (espera 500ms después de que el usuario deje de escribir)
    const debouncedSearchName = useDebounce(searchName, 500);

    // Caché simple para evitar requests duplicados
    const cacheRef = useRef(new Map());

    // Función para generar clave única de caché
    const getCacheKey = useCallback((page, search, sort) => {
        return `p${page}-s${search}-o${sort}`;
    }, []);

    // FUNCIÓN PRINCIPAL: Fetch de clientes con paginación del backend
    const fetchClients = useCallback(async (page = 0, search = "", sort = "asc") => {
        const cacheKey = getCacheKey(page, search, sort);

        // Verificar si ya está en caché
        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey);
            console.log(`[Cache HIT] ✓ Datos cargados desde caché: ${cacheKey}`);
            setClients(cached.content);
            setTotalPages(cached.totalPages);
            setTotalElements(cached.totalElements);
            return;
        }

        console.log(`[Cache MISS] ✗ Solicitando al servidor: página=${page}, búsqueda="${search}", orden=${sort}`);
        setLoading(true);

        try {
            const response = await axios.get(`${config.apiUrl}/api/clientes`, {
                params: {
                    page,
                    size: clientsPerPage,
                    search: search || undefined,
                    sortBy: "nombre",
                    sortDir: sort
                }
            });

            console.log(`[Fetch] ✓ Respuesta recibida:`, response.data);

            // Manejar tanto respuestas paginadas (Page<>) como arrays simples
            const data = response.data;
            const content = data.content || data;
            const pages = data.totalPages || Math.ceil((data.length || 0) / clientsPerPage);
            const elements = data.totalElements || data.length || 0;

            console.log(`[Fetch] Procesado: ${content.length} clientes, ${pages} páginas totales`);

            setClients(content);
            setTotalPages(pages);
            setTotalElements(elements);

            // Guardar en caché (máximo 20 entradas para no consumir mucha memoria)
            if (cacheRef.current.size >= 20) {
                const oldestKey = cacheRef.current.keys().next().value;
                cacheRef.current.delete(oldestKey);
                console.log(`[Cache] Eliminada entrada antigua: ${oldestKey}`);
            }

            cacheRef.current.set(cacheKey, { content, totalPages: pages, totalElements: elements });
            console.log(`[Cache] ✓ Guardado en caché: ${cacheKey} (Total: ${cacheRef.current.size} entradas)`);

        } catch (error) {
            console.error("[Fetch] ✗ ERROR al cargar clientes:", error.response?.data || error.message);
            console.error("[Fetch] Detalles completos:", error);
            setClients([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [clientsPerPage, getCacheKey]);

    // Efecto que se ejecuta cuando cambian los filtros
    useEffect(() => {
        console.log(`[Effect] Cambio detectado - Página: ${currentPage}, Búsqueda: "${debouncedSearchName}", Orden: ${sortOrder}`);
        fetchClients(currentPage, debouncedSearchName, sortOrder);
    }, [currentPage, debouncedSearchName, sortOrder, fetchClients]);

    // Limpiar caché cuando se modifica/elimina un cliente
    const invalidateCache = useCallback(() => {
        console.log(`[Cache] Invalidando caché completo (${cacheRef.current.size} entradas)`);
        cacheRef.current.clear();
    }, []);

    // Handlers de paginación (ajustados a 0-indexed)
    const handlePreviousPage = useCallback(() => {
        setCurrentPage((prev) => {
            const newPage = Math.max(prev - 1, 0);
            console.log(`[Paginación] Anterior: ${prev} → ${newPage}`);
            return newPage;
        });
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => {
            const newPage = Math.min(prev + 1, totalPages - 1);
            console.log(`[Paginación] Siguiente: ${prev} → ${newPage}`);
            return newPage;
        });
    }, [totalPages]);

    const handlePageClick = useCallback((pageNumber) => {
        const newPage = pageNumber - 1; // Convertir de 1-indexed (UI) a 0-indexed (backend)
        console.log(`[Paginación] Click en página: ${pageNumber} (backend: ${newPage})`);
        setCurrentPage(newPage);
    }, []);

    // Handlers para editar clientes
    const handleEditClick = useCallback((client) => {
        console.log("[Edición] Abriendo editor para cliente:", client.nombre);
        setEditingClient(client);
    }, []);

    const handleSaveClient = useCallback((updatedClient) => {
        console.log("[Edición] Guardando cambios para cliente:", updatedClient.nombre);
        setClients((prevClients) =>
            prevClients.map((client) =>
                client.clienteId === updatedClient.clienteId ? updatedClient : client
            )
        );
        setEditingClient(null);
        invalidateCache(); // Invalidar caché después de editar
        fetchClients(currentPage, debouncedSearchName, sortOrder); // Recargar página actual
    }, [invalidateCache, fetchClients, currentPage, debouncedSearchName, sortOrder]);

    const handleCancelEdit = useCallback(() => {
        console.log("[Edición] Cancelando edición");
        setEditingClient(null);
    }, []);

    const handleDeleteClient = useCallback((deletedClientId) => {
        console.log("[Eliminación] Eliminando cliente ID:", deletedClientId);
        setClients((prevClients) =>
            prevClients.filter((client) => client.clienteId !== deletedClientId)
        );
        invalidateCache(); // Invalidar caché después de eliminar

        // Si eliminamos el último cliente de la página, volver a la anterior
        if (clients.length === 1 && currentPage > 0) {
            console.log("[Eliminación] Última fila de la página, retrocediendo");
            setCurrentPage(prev => prev - 1);
        } else {
            fetchClients(currentPage, debouncedSearchName, sortOrder); // Recargar página actual
        }
    }, [clients.length, currentPage, invalidateCache, fetchClients, debouncedSearchName, sortOrder]);

    // Handler para cambiar el orden de clasificación
    const handleSortChange = useCallback((newSortOrder) => {
        console.log(`[Orden] Cambiando orden: ${sortOrder} → ${newSortOrder}`);
        setSortOrder(newSortOrder);
        setCurrentPage(0); // Volver a la primera página al cambiar orden
    }, [sortOrder]);

    // Handler para agregar cliente nuevo
    const handleAddClient = useCallback((clientData) => {
        console.log("[Creación] Nuevo cliente agregado:", clientData.nombre);
        invalidateCache();
        setCurrentPage(0); // Ir a la primera página
        fetchClients(0, debouncedSearchName, sortOrder);
    }, [invalidateCache, fetchClients, debouncedSearchName, sortOrder]);

    // Handlers para el modal de Excel
    const handleOpenModal = useCallback(() => {
        console.log("[Excel] Abriendo modal de exportación");
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        console.log("[Excel] Cerrando modal de exportación");
        setIsModalOpen(false);
    }, []);

    const handleDownloadExcel = useCallback(async (month, year) => {
        console.log(`[Excel] Iniciando descarga para mes=${month}, año=${year}`);
        setIsDownloading(true);
        try {
            const response = await fetch(
                `${config.apiUrl}/api/clientes/exportar/excel?mes=${month}&anio=${year}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
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

            console.log("[Excel] ✓ Descarga completada exitosamente");
            alert("Descarga de Excel completada exitosamente.");
        } catch (err) {
            console.error("[Excel] ✗ Error al descargar:", err);
            alert(`Error al descargar el archivo: ${err.message}`);
        } finally {
            setIsDownloading(false);
            handleCloseModal();
        }
    }, [handleCloseModal]);

    if (loading && clients.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Cargando clientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    <FilterSection
                        onAddClient={handleAddClient}
                        onSearchNameChange={setSearchName}
                    />

                    <div className="bg-white rounded-lg shadow mt-6">
                        <TableHeader sortOrder={sortOrder} onSortChange={handleSortChange} />

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-indigo-500 mx-auto mb-2"></div>
                                <p className="text-gray-500">Cargando...</p>
                            </div>
                        ) : clients.length > 0 ? (
                            <div>
                                {clients.map((client) => (
                                    <ClientRow
                                        key={client.clienteId}
                                        client={client}
                                        onDelete={handleDeleteClient}
                                        onEdit={handleEditClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">
                                    {searchName
                                        ? `No se encontraron clientes que coincidan con "${searchName}"`
                                        : "No hay clientes registrados"}
                                </p>
                            </div>
                        )}
                    </div>

                    {totalPages > 0 && (
                        <Pagination
                            currentPage={currentPage + 1} // +1 para mostrar 1-indexed en UI
                            totalPages={totalPages}
                            totalElements={totalElements}
                            onPrevious={handlePreviousPage}
                            onNext={handleNextPage}
                            onPageClick={handlePageClick}
                        />
                    )}

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

            <MonthYearModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleDownloadExcel}
            />

            <FloatingExcelButton onClick={handleOpenModal} disabled={isDownloading} />
        </div>
    );
}

export default MyContadores;