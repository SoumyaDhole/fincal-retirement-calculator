export default function Home() {
  return (
    <main className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">
        Retirement Planning Calculator
      </h1>

      <div className="grid gap-4 max-w-xl">

        <input placeholder="Current Age" className="p-2 border rounded" />
        <input placeholder="Retirement Age" className="p-2 border rounded" />
        <input placeholder="Current Annual Expenses" className="p-2 border rounded" />
        <input placeholder="Expected Inflation (%)" className="p-2 border rounded" />
        <input placeholder="Pre-Retirement Return (%)" className="p-2 border rounded" />
        <input placeholder="Post-Retirement Return (%)" className="p-2 border rounded" />

        <button className="bg-blue-600 text-white p-2 rounded">
          Calculate
        </button>

      </div>
    </main>
  );
}