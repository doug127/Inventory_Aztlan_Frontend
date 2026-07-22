

export const Search = ({
    value,
    onChange,
    placeholder = "Buscar producto...",
}) => {


    return (
        <>
            <input
            type='text'
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className='w-full px-3 py-1.5 pl-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:bg-white transition-all duration-200 placeholder:text-gray-400'
            />
            <svg
            className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
            </svg>
        </>
    )
}