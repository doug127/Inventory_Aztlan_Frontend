export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-[var(--color-surface)] rounded p-4 w-96 relative'>
        <button className='absolute top-2 right-2' onClick={onClose}>
          ✖️
        </button>
        {children}
      </div>
    </div>
  )
}
