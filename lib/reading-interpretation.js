import { validateReadingContract } from "./contracts/reading-contract"

export function interpretReading(data) {
  if (!validateReadingContract(data)) {
    return {
      status: "invalid",
      message: "Reading data contract invalid"
    }
  }

  const core = data.core || {}

  return {
    status: "ok",
    summary: "Interpretation stable",
    metricsCount: Object.keys(core).length
  }
}
