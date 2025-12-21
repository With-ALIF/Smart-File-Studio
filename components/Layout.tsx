export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-sky-900">
      <main className="flex-grow w-full">
        {children}
      </main>
    </div>
  );
};
