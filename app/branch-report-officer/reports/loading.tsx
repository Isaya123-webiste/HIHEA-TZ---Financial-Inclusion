export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4"
          style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
        ></div>
        <p className="mt-2 text-gray-600">Loading reports...</p>
      </div>
    </div>
  )
}
