export default function Loading() {
        return (
                <div className="min-h-screen bg-[var(--background)]">
                        <div className="h-14 border-b border-gray-200 bg-white" />
                        <main className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                                <div className="mb-8 space-y-4">
                                        <div className="h-8 w-48 bg-gray-200 rounded" />
                                        <div className="h-4 w-72 bg-gray-100 rounded" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {Array.from({ length: 15 }).map((_, i) => (
                                                <div key={i} className="aspect-square bg-gray-100 rounded-xl" />
                                        ))}
                                </div>
                        </main>
                </div>
        );
}
