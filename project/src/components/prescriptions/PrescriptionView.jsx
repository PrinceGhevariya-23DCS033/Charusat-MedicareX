import { format } from 'date-fns';
import React from 'react';
import { FaPrint } from 'react-icons/fa';

const PrescriptionView = ({ prescription }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Medical Prescription</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px double #000;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              margin: 0;
              color: #1a365d;
              font-weight: bold;
            }
            .header p {
              font-size: 16px;
              margin: 5px 0 0;
              color: #4a5568;
            }
            .prescription-content {
              margin-bottom: 40px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #2d3748;
              margin-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 5px;
            }
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-group {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #4a5568;
            }
            .diagnosis-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 15px;
              margin-bottom: 30px;
            }
            .medications {
              margin-bottom: 30px;
            }
            .medication {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              background-color: #fff;
            }
            .medication h4 {
              color: #2d3748;
              margin: 0 0 10px 0;
              font-size: 16px;
            }
            .medication-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .medication-item {
              margin-bottom: 5px;
            }
            .medication-label {
              font-weight: bold;
              color: #4a5568;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 14px;
              color: #718096;
              border-top: 2px solid #e2e8f0;
              padding-top: 20px;
            }
            .doctor-signature {
              margin-top: 30px;
              text-align: right;
            }
            .doctor-name {
              font-weight: bold;
              color: #2d3748;
            }
            .doctor-title {
              color: #4a5568;
              font-size: 14px;
            }
            .prescription-date {
              text-align: right;
              margin-bottom: 20px;
              color: #4a5568;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
              .medication {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Prescription</h1>
            <p>${format(new Date(prescription.date), 'MMMM d, yyyy')}</p>
          </div>

          <div class="prescription-content">
            <div class="prescription-date">
              Date: ${format(new Date(prescription.date), 'MMMM d, yyyy')}
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="patient-info">
                <div class="info-group">
                  <span class="info-label">Name:</span> ${prescription.patient?.name || prescription.patientName || 'Not Available'}
                </div>
                <div class="info-group">
                  <span class="info-label">ID:</span> ${prescription.patient?._id || 'Not Available'}
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Diagnosis</div>
              <div class="diagnosis-box">
                ${prescription.diagnosis}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Medications</div>
              <div class="medications">
                ${prescription.medications.map((med, index) => `
                  <div class="medication">
                    <h4>Medication ${index + 1}</h4>
                    <div class="medication-grid">
                      <div class="medication-item">
                        <span class="medication-label">Name:</span> ${med.name}
                      </div>
                      <div class="medication-item">
                        <span class="medication-label">Dosage:</span> ${med.dosage}
                      </div>
                      <div class="medication-item">
                        <span class="medication-label">Frequency:</span> ${med.frequency}
                      </div>
                      <div class="medication-item">
                        <span class="medication-label">Duration:</span> ${med.duration}
                      </div>
                      ${med.instructions ? `
                        <div class="medication-item" style="grid-column: 1 / -1;">
                          <span class="medication-label">Instructions:</span> ${med.instructions}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            ${prescription.notes ? `
              <div class="section">
                <div class="section-title">Additional Notes</div>
                <div class="notes">
                  ${prescription.notes}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="doctor-signature">
              <div class="doctor-name">Dr. ${prescription.doctor?.name || 'Unknown Doctor'}</div>
              <div class="doctor-title">${prescription.doctor?.department || 'Medical Department'}</div>
            </div>
            <p>This is a computer-generated prescription. No signature is required.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FaPrint />
          <span>Print Prescription</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Patient Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {prescription.patient?.name || prescription.patientName || 'Not Available'}</p>
            <p><span className="font-medium">ID:</span> {prescription.patient?._id || 'Not Available'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Doctor Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> Dr. {prescription.doctor?.name || 'Unknown Doctor'}</p>
            <p><span className="font-medium">Department:</span> {prescription.doctor?.department || 'Not Available'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Diagnosis</h3>
        <p className="text-gray-600">{prescription.diagnosis}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Medications</h3>
        <div className="space-y-4">
          {prescription.medications.map((medication, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">Medication {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><span className="font-medium">Name:</span> {medication.name}</p>
                <p><span className="font-medium">Dosage:</span> {medication.dosage}</p>
                <p><span className="font-medium">Frequency:</span> {medication.frequency}</p>
                <p><span className="font-medium">Duration:</span> {medication.duration}</p>
                {medication.instructions && (
                  <p className="md:col-span-2">
                    <span className="font-medium">Instructions:</span> {medication.instructions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {prescription.notes && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Additional Notes</h3>
          <p className="text-gray-600">{prescription.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Prescribed on {format(new Date(prescription.date), 'MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-600">
              Status: <span className={`px-2 py-1 rounded-full text-xs ${
                prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>{prescription.status}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView; 