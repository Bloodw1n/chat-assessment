const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  return isSameDay ? timeFormatter.format(date) : dateFormatter.format(date)
}
