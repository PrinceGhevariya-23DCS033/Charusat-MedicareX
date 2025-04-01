import { useState } from 'react';

function CounselorDashboard() {
  const [departments] = useState([
    { id: 1, name: "Cardiology", doctors: 5, patients: 50 },
    { id: 2, name: "Neurology", doctors: 3, patients: 30 }
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Counselor/HOD Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Department Overview</h3>
          <div className="space-y-4">
            {departments.map(dept => (
              <div key={dept.id} className="p-4 bg-[var(--accent)] rounded-lg">
                <p className="font-semibold">{dept.name}</p>
                <p>Doctors: {dept.doctors}</p>
                <p>Patients: {dept.patients}</p>
                <div className="mt-2">
                  <button className="btn btn-primary">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Department Management</h3>
          <form className="space-y-4">
            <div>
              <label className="block mb-2">Department Name</label>
              <input type="text" className="input w-full" />
            </div>
            <div>
              <label className="block mb-2">Head Doctor</label>
              <select className="input w-full">
                <option>Dr. Smith</option>
                <option>Dr. Johnson</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full">Add Department</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CounselorDashboard;