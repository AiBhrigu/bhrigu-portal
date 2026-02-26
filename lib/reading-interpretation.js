import { validateReadingContract } from "./contracts/reading-contract"

export function interpretReading(data) {
  if (!validateReadingContract(data)) {
    return { status: "invalid" }
  }

  const meta = data.meta_metrics || {}

  return {
    ...data,
    meta_metrics: meta
  }
}
