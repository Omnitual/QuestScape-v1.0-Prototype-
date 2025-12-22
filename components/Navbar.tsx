import React from 'react';
import { Home, Book, Settings } from 'lucide-react';

interface NavbarProps {
    currentView: 'HOME' | 'JOURNAL' | 'SETTINGS';
    setView: (view: 'HOME' | 'JOURNAL' | 'SETTINGS') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 z-50">
            <div className="max-w-7xl mx-auto flex justify-around items-center h-16">
                <button
                    onClick={() => setView('HOME')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors h-full justify-center ${currentView === 'HOME' ? 'text-indigo-400 bg-gray-900/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/20'}`}
                >
                    <Home size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                </button>

                <button
                    onClick={() => setView('JOURNAL')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors h-full justify-center border-l border-gray-800 ${currentView === 'JOURNAL' ? 'text-indigo-400 bg-gray-900/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/20'}`}
                >
                    <Book size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Quest Log</span>
                </button>

                <button
                    onClick={() => setView('SETTINGS')}
                    className={`flex-1 flex flex-col items-center gap-1 transition-colors h-full justify-center border-l border-gray-800 ${currentView === 'SETTINGS' ? 'text-indigo-400 bg-gray-900/50' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/20'}`}
                >
                    <Settings size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">System</span>
                </button>
            </div>
        </div>
    );
};

export default Navbar;