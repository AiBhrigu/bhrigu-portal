export function validateReadingContract(data) {
  if (!data) return false
  if (typeof data !== "object") return false
  if (!data.core) return false
  if (typeof data.core !== "object") return false
  return true
}
