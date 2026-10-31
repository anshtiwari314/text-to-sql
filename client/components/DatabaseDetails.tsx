import { DatabaseConnection } from "../types";

interface DatabaseDetailsProps {
  db: DatabaseConnection;
  onBack: () => void;
}

export default function DatabaseDetails({ db, onBack }: DatabaseDetailsProps) {
  return (
    <div className="p-10 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <button onClick={onBack} className="text-sm text-gray-500 mb-6 hover:text-gray-900">← Back to Databases</button>
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{db.name}</h1>
          <p className="text-gray-500 mt-1">{db.engine} hosted on {db.host}</p>
        </div>
        <button className="text-red-600 bg-red-50 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 transition-colors">
          Disconnect
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Connection Name</label>
              <input type="text" defaultValue={db.name} className="w-full border p-2 rounded-md mt-1" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium text-gray-800 text-sm">Read-Only Mode</p>
                <p className="text-xs text-gray-500">Prevent the AI from executing INSERT/UPDATE.</p>
              </div>
              <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${db.readOnly ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${db.readOnly ? "translate-x-6" : ""}`}></div>
              </div>
            </div>
            <button className="w-full bg-gray-900 text-white py-2 rounded-md mt-4 hover:bg-gray-800 transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Database Schema</h3>
          <div className="bg-gray-50 border rounded-lg h-64 overflow-y-auto p-4 text-sm font-mono">
            <div className="font-bold text-gray-800">public.users</div>
            <div className="pl-4 text-gray-600">- id (uuid)</div>
            <div className="pl-4 text-gray-600">- email (varchar)</div>
            
            <div className="font-bold text-gray-800 mt-4">public.orders</div>
            <div className="pl-4 text-gray-600">- id (uuid)</div>
            <div className="pl-4 text-gray-600">- amount (decimal)</div>
          </div>
        </div>
      </div>
    </div>
  );
}