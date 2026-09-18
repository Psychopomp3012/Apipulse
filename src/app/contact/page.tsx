import { Mail, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in touch</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">Have questions about our APIs, pricing, or need a custom enterprise plan? We'd love to hear from you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="glass p-8 rounded-3xl flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Email Us</h3>
          <p className="text-gray-500 mb-4">For general inquiries and support.</p>
          <a href="mailto:support@apipulse.com" className="text-primary font-medium hover:underline">support@apipulse.com</a>
        </div>

        <div className="glass p-8 rounded-3xl flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer">
          <div className="h-16 w-16 bg-[#1DA1F2]/10 rounded-2xl flex items-center justify-center mb-6">
            <MessageCircle className="h-8 w-8 text-[#1DA1F2]" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Social / X</h3>
          <p className="text-gray-500 mb-4">Follow us for updates and API statuses.</p>
          <a href="https://twitter.com/apipulse" className="text-[#1DA1F2] font-medium hover:underline">@apipulse</a>
        </div>
      </div>
    </div>
  );
}
