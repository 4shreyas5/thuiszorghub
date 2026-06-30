export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-white border-t-blue-200 rounded-full animate-spin mb-4" />
        <p className="text-white text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}
