import Foundation
import RealityKit
// Object Capture: a folder of photos → a textured mesh (USDZ). Usage: ocap <photos dir> <out.usdz> [preview|reduced|medium|full|raw]
let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: ocap <photos dir> <out.usdz> [detail]"); exit(2) }
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
let detailName = args.count > 3 ? args[3] : "medium"
var config = PhotogrammetrySession.Configuration()
config.sampleOrdering = .sequential
config.featureSensitivity = .high
config.isObjectMaskingEnabled = true
if detailName == "custom" { config.customDetailSpecification.maximumPolygonCount = 150_000; config.customDetailSpecification.maximumTextureDimension = .fourK; config.customDetailSpecification.outputTextureMaps = [.diffuseColor, .normal] }
let detail: PhotogrammetrySession.Request.Detail = detailName == "preview" ? .preview : detailName == "reduced" ? .reduced : detailName == "full" ? .full : detailName == "raw" ? .raw : detailName == "custom" ? .custom : .medium
do {
  let session = try PhotogrammetrySession(input: input, configuration: config)
  let task = Task {
    for try await out in session.outputs {
      switch out {
      case .requestProgress(_, let f): if Int(f * 100) % 10 == 0 { print(String(format: "progress %.0f%%", f * 100)); fflush(stdout) }
      case .requestComplete(_, let r): if case .modelFile(let url) = r { print("DONE \(url.path)") }
      case .requestError(_, let e): print("ERROR \(e)"); exit(1)
      case .processingComplete: print("COMPLETE"); exit(0)
      case .inputComplete: print("input read")
      case .invalidSample(let id, let reason): print("skip sample \(id): \(reason)")
      case .skippedSample(let id): print("skipped \(id)")
      case .automaticDownsampling: print("downsampling")
      case .processingCancelled: print("cancelled"); exit(1)
      default: break
      }
    }
  }
  try session.process(requests: [.modelFile(url: output, detail: detail)])
  _ = await task.value
} catch { print("FAILED \(error)"); exit(1) }
