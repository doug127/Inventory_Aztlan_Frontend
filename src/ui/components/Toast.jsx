export default function Toast({ message, type = 'info' }) {
  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <div className={`fixed top-4 right-4 p-3 text-white rounded ${colors[type]}`}>
      {message}
    </div>
  )
}