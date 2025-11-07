import React, { useMemo } from 'react';

// Componente para el botón de navegación (Anterior/Siguiente)
const PageButton = React.memo(function PageButton({ ariaLabel, src, altText, onClick, disabled }) {
    return (
        <button
            aria-label={ariaLabel}
            className={`focus:outline-none flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-75'}`}
            onClick={onClick}
            disabled={disabled}
        >
            <img
                loading="lazy"
                src={src}
                alt={altText}
                className="object-contain w-3 h-3 fill-indigo-500"
            />
        </button>
    );
});

// Componente para los números de página
const PageNumber = React.memo(function PageNumber({ number, isActive, onClick }) {
    return (
        <button
            onClick={() => onClick(number)}
            className={`flex items-center justify-center w-6 h-6 rounded-full shadow-sm 
                ${isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}
                hover:bg-indigo-400 hover:text-white transition-colors`}
            aria-current={isActive ? "page" : undefined}
        >
            {number}
        </button>
    );
});

function Pagination({ currentPage, totalPages, totalElements, onPrevious, onNext, onPageClick }) {
    // Usamos useMemo para calcular la lista de números de página solo cuando sea necesario
    const pageNumbers = useMemo(() => {
        const pageNumbersList = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbersList.push(
                    <PageNumber
                        key={i}
                        number={i}
                        isActive={i === currentPage}
                        onClick={onPageClick}
                    />
                );
            }
        } else {
            // Mostrar las primeras 2 páginas
            pageNumbersList.push(
                <PageNumber key={1} number={1} isActive={1 === currentPage} onClick={onPageClick} />,
                <PageNumber key={2} number={2} isActive={2 === currentPage} onClick={onPageClick} />
            );

            if (currentPage > 4) {
                pageNumbersList.push(<span key="start-ellipsis" className="px-2">...</span>);
            }

            const startPage = Math.max(3, currentPage - 1);
            const endPage = Math.min(totalPages - 2, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbersList.push(
                    <PageNumber key={i} number={i} isActive={i === currentPage} onClick={onPageClick} />
                );
            }

            if (currentPage < totalPages - 3) {
                pageNumbersList.push(<span key="end-ellipsis" className="px-2">...</span>);
            }

            pageNumbersList.push(
                <PageNumber key={totalPages - 1} number={totalPages - 1} isActive={(totalPages - 1) === currentPage} onClick={onPageClick} />,
                <PageNumber key={totalPages} number={totalPages} isActive={totalPages === currentPage} onClick={onPageClick} />
            );
        }

        return pageNumbersList;
    }, [currentPage, totalPages, onPageClick]);

    if (totalPages === 0) {
        return null; // No mostrar paginación si no hay páginas
    }

    return (
        <nav
            className="flex gap-4 items-center justify-center mt-12 ml-3 max-w-full text-sm tracking-tight whitespace-nowrap text-zinc-700 max-md:mt-10"
            aria-label="Pagination"
            style={{ fontFamily: 'Work Sans, sans-serif', letterSpacing: '-2%' }}
        >
            {/* Indicador de página actual con total de elementos */}
            <div className="text-center font-medium">
                Página {currentPage} de {totalPages}
                {totalElements > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                        ({totalElements} clientes totales)
                    </span>
                )}
            </div>

            {/* Botones de navegación y números de página */}
            <div className="flex gap-4 items-center">
                <PageButton
                    ariaLabel="Previous page"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/6597016ce74407965e5942192543dc190a31a922d35fd2c6fdbe7a605429c402?apiKey=c8e063ba4e294c0496fff8126c800e5e&"
                    altText="Previous page icon"
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                />

                {pageNumbers}

                <PageButton
                    ariaLabel="Next page"
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/dd79cff359ae0550422ce2addded51890df055927929c99a9887902f8948ecd9?apiKey=c8e063ba4e294c0496fff8126c800e5e&"
                    altText="Next page icon"
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                />
            </div>
        </nav>
    );
}

export default React.memo(Pagination);