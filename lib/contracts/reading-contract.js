export function validateReadingContract(data) {
  if (!data) return false
  if (typeof data !== "object") return false
  if (!data.core) return false

  if (data.meta_metrics && typeof data.meta_metrics !== "object") {
    return false
  }

  return true
}
