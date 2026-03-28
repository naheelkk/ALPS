
import { format, formatDistanceToNow } from 'date-fns'

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy')
}

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatPercentage = (value) => {
  return `${Math.round(value * 100)}%`
}

export const formatScore = (correct, total) => {
  return `${correct}/${total} (${Math.round((correct / total) * 100)}%)`
}