export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
          Internal Server Error
        </h2>
        <p className="text-muted mb-8">
          Something went wrong on our end. Please try again later.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
