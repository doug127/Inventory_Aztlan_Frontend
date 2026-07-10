

export const NavigationButtons = ({ currentPage, totalPages, setPage, from, to, total, visiblePages, meta }) => {
    return (
        <nav
          className='basis-[15%] shrink-0 flex items-center flex-column flex-wrap md:flex-row justify-between px-6 py-4 border-t border-gray-100'
          aria-label='Table navigation'
        >
          <span className='text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full md:inline md:w-auto'>
            Productos{' '}
            <span className='font-semibold text-gray-900'>
              {from}-{to}
            </span>
            {' '}de{' '}
            <span className='font-semibold text-gray-900'>
              {total}
            </span>
          </span>

          <ul className='flex -space-x-px text-sm'>
            <li>
              <button
                type='button'
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className='flex cursor-pointer items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 font-medium rounded-l-lg text-sm px-3 h-9 focus:outline-none transition-colors duration-200'
              >
                Anterior
              </button>
            </li>

            {visiblePages.map((item, index) => {
              const previous = visiblePages[index - 1]
              const showGap = previous && item - previous > 1

              return (
                <li key={item} className='flex'>
                  {showGap && (
                    <span className='flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 font-medium text-sm w-9 h-9'>
                      ...
                    </span>
                  )}
                  <button
                    type='button'
                    aria-current={item === currentPage ? 'page' : undefined}
                    onClick={() => setPage(item)}
                    className={`flex cursor-pointer items-center justify-center box-border border border-gray-200 font-medium text-sm w-9 h-9 focus:outline-none transition-colors duration-200 ${
                      item === currentPage
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item}
                  </button>
                </li>
              )
            })}

            <li>
              <button
                type='button'
                disabled={!meta.hasNextPage}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className='flex cursor-pointer items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 font-medium rounded-r-lg text-sm px-3 h-9 focus:outline-none transition-colors duration-200'
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>
    )
}