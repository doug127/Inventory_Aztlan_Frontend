export const MessageError = ({ message }) => {
  if (!message) return null
  return (

    <p className='text-xs text-destructive'>
      {message}
    </p>
  )
}