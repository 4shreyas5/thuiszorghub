export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-blue-600">ThuisZorgHub</h1>
        <p className="text-xl text-gray-600 max-w-2xl">Smart Software for Modern Homecare</p>
        <div className="mt-8 space-y-2 text-sm text-gray-600">
          <p>✓ Foundation setup completed</p>
          <p>✓ Next.js 15 + React 19 configured</p>
          <p>✓ TypeScript enabled</p>
          <p>✓ Tailwind CSS configured</p>
          <p>✓ next-intl ready (EN/NL)</p>
          <p>✓ Folder structure created</p>
          <p>✓ ESLint + Prettier configured</p>
          <p>✓ Husky + lint-staged installed</p>
        </div>
        <div className="mt-12 text-sm text-gray-600">
          <p>Awaiting approval to begin Sprint 01 development</p>
        </div>
      </div>
    </main>
  );
}
