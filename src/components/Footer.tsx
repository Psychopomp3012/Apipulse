export function Footer() {
  return (
    <footer className="border-t glass py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500">
          © {new Date().getFullYear()} ApiPulse. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-500 hover:text-primary">Terms</a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
