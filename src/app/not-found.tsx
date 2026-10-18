import Link from 'next/link';
import { Footer } from '../components/Layout';

export default function NotFound() {
    return (
        <>
            <div className="max-w-5xl mx-auto px-4 pt-20 pb-10">
                <div className="bg-white rounded-2xl p-10 shadow text-center space-y-4">
                    <p className="text-6xl font-extrabold text-slate-200">404</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                        Page not found
                    </h1>
                    <p className="text-sm text-slate-500">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    <Link
                        href="/"
                        className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
            <Footer />
        </>
    );
}