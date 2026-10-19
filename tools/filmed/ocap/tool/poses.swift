import Foundation
import RealityKit
// Object Capture: photos → camera poses (JSON) + the model, from the same session so they share one coordinate frame.
// Usage: poses <photos dir> <out dir>
let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: poses <photos dir> <out dir>"); exit(2) }
let input = URL(fileURLWithPath: args[1]), outDir = URL(fileURLWithPath: args[2])
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
var config = PhotogrammetrySession.Configuration(); config.sampleOrdering = .sequential; config.featureSensitivity = .high; config.isObjectMaskingEnabled = true
do {
  let session = try PhotogrammetrySession(input: input, configuration: config)
  let task = Task {
    for try await out in session.outputs {
      switch out {
      case .requestComplete(_, let r):
        switch r {
        case .poses(let poses):
          var rows: [[String: Any]] = []
          let mirror = Mirror(reflecting: poses); print("POSES-TYPE \(type(of: poses)) children: \(mirror.children.map { $0.label ?? "?" })")
          for child in mirror.children {
            if let dict = child.value as? [Int: PhotogrammetrySession.Pose] {
              for (id, pose) in dict { let m = pose.transform.matrix; var cols: [[Float]] = []; for c in 0..<4 { let v = m[c]; cols.append([v.x, v.y, v.z, v.w]) }; rows.append(["id": id, "columns": cols]) }
            } else { print("child \(child.label ?? "?") type \(type(of: child.value))") }
          }
          let data = try JSONSerialization.data(withJSONObject: ["poses": rows], options: [.prettyPrinted])
          try data.write(to: outDir.appendingPathComponent("poses.json")); print("POSES \(rows.count)")
        case .bounds(let b): print("BOUNDS min \(b.min) max \(b.max)"); let bd = try JSONSerialization.data(withJSONObject: ["min": [b.min.x, b.min.y, b.min.z], "max": [b.max.x, b.max.y, b.max.z]]); try bd.write(to: outDir.appendingPathComponent("bounds.json"))
        case .modelFile(let url): print("MODEL \(url.path)")
        default: break
        }
      case .requestError(_, let e): print("ERROR \(e)"); exit(1)
      case .processingComplete: print("COMPLETE"); exit(0)
      default: break
      }
    }
  }
  try session.process(requests: [.poses, .bounds, .modelFile(url: outDir.appendingPathComponent("model.usdz"), detail: .medium)])
  _ = await task.value
} catch { print("FAILED \(error)"); exit(1) }
