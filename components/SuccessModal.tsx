import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, RotateCcw, X } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReset: () => void;
    title?: string;
    message?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
    isOpen, 
    onClose, 
    onReset,
    title = "Process Complete!",
    message = "Your file has been processed and is downloading."
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-scale-in">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 animate-success-pop">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 mb-6 text-sm">{message}</p>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => { onReset(); onClose(); }}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-200"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Process Another</span>
                        </button>
                        <Link 
                            to="/"
                            className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center transition-colors border border-slate-200 block"
                        >
                            Back to Tools
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};