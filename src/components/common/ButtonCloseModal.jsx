
export const ButtonCloseModal = ({ 
    className = '',
    onClick,
    ...props 
}) => {
    

    return (
        <button
            type='button'
            onClick={onClick}
            className='cursor-pointer w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors'
            aria-label='Cerrar modal'
        >
            <svg
            className='w-5 h-5'
            aria-hidden='true'
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            fill='none'
            viewBox='0 0 24 24'
            >
            <path
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18 17.94 6M18 18 6.06 6'
            />
            </svg>
        </button>
    )
}