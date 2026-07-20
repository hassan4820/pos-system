// resources/js/Components/Sidebar.jsx
import { Link } from '@inertiajs/react';

export default function Sidebar() {
    return (
        <div className="w-64 h-screen bg-gray-800 text-white fixed p-5">
            <h2 className="text-2xl font-bold mb-10">POS Manager</h2>
            <nav className="space-y-4">
                <Link href="/pos" className="block p-2 hover:bg-gray-700">POS Terminal</Link>
                <Link href="/purchase" className="block p-2 hover:bg-gray-700">Inventory Purchase</Link>
                <Link href="/reports" className="block p-2 hover:bg-gray-700">Reports & Profit</Link>
            </nav>
        </div>
    );
}