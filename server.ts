import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  initDatabase,
  getAllHospitals,
  getHospitalById,
  insertHospital,
  deleteHospital,
  updateHospitalBeds,
  updateHospitalBlood,
  getAllRequests,
  insertEmergencyRequest,
  updateRequestSla,
  executeRawSql,
  resetDatabaseToDefault,
  getUserLoginLogs,
  insertUserLoginLog,
  getAllPatientRecords,
  getPatientRecordById,
  insertPatientRecord,
  updatePatientConfirmation,
  dischargePatientRecord,
} from './src/db/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize SQLite SQL Database
  try {
    await initDatabase();
    console.log('✓ BedLink SQLite Database successfully initialized and ready.');
  } catch (err) {
    console.error('Failed to initialize SQL database:', err);
  }

  // -------------------------------------------------------------
  // REST API: Hospitals & Bed Inventory
  // -------------------------------------------------------------

  // Get all hospitals
  app.get('/api/hospitals', (req: Request, res: Response) => {
    try {
      const hospitals = getAllHospitals();
      res.json(hospitals);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch hospitals' });
    }
  });

  // Get single hospital by ID
  app.get('/api/hospitals/:id', (req: Request, res: Response) => {
    try {
      const hosp = getHospitalById(req.params.id);
      if (!hosp) return res.status(404).json({ error: 'Hospital not found' });
      res.json(hosp);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Administrator: Add new hospital into SQL database
  app.post('/api/hospitals', (req: Request, res: Response) => {
    try {
      const {
        name,
        station,
        stationDistanceKm,
        area,
        address,
        phone,
        isFamous,
        beds,
        bloodBank,
      } = req.body;

      if (!name || !station) {
        return res.status(400).json({ error: 'Hospital name and railway station are required' });
      }

      const newHosp = insertHospital({
        name,
        station,
        stationDistanceKm: Number(stationDistanceKm) || 1.0,
        stationDistanceText: `${stationDistanceKm || 1.0} km from ${station} Station`,
        area: area || `${station} East`,
        address: address || `${area || station}, Mumbai`,
        phone: phone || '+91 22 2800 0000',
        isFamous: Boolean(isFamous),
        beds,
        bloodBank,
      });

      console.log(`[SQL Admin] Added new hospital to database: ${newHosp.name} (${newHosp.id})`);
      res.status(201).json(newHosp);
    } catch (err: any) {
      console.error('Error inserting hospital:', err);
      res.status(500).json({ error: err.message || 'Failed to insert hospital' });
    }
  });

  // Administrator: Delete hospital from SQL database
  app.delete('/api/hospitals/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const success = deleteHospital(id);
      console.log(`[SQL Admin] Deleted hospital from database: ${id}`);
      res.json({ success, message: `Hospital ${id} removed successfully from database` });
    } catch (err: any) {
      console.error('Error deleting hospital:', err);
      res.status(500).json({ error: err.message || 'Failed to delete hospital' });
    }
  });

  // Nurse Station: 10-Second Bed Count Quick Update
  app.patch('/api/hospitals/:id/beds', (req: Request, res: Response) => {
    try {
      const { bedType, delta } = req.body;
      if (!bedType || typeof delta !== 'number') {
        return res.status(400).json({ error: 'bedType and numeric delta required' });
      }
      const updated = updateHospitalBeds(req.params.id, bedType, delta);
      if (!updated) return res.status(404).json({ error: 'Hospital or bed type not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Nurse Station: Blood Bank inventory delta
  app.patch('/api/hospitals/:id/blood', (req: Request, res: Response) => {
    try {
      const { bloodGroup, delta } = req.body;
      if (!bloodGroup || typeof delta !== 'number') {
        return res.status(400).json({ error: 'bloodGroup and numeric delta required' });
      }
      const updated = updateHospitalBlood(req.params.id, bloodGroup, delta);
      if (!updated) return res.status(404).json({ error: 'Hospital not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // REST API: Emergency Requests & 2-Minute SLA Workflow
  // -------------------------------------------------------------

  // Get all active emergency requests
  app.get('/api/requests', (req: Request, res: Response) => {
    try {
      const requests = getAllRequests();
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create new emergency bed hold request
  app.post('/api/requests', (req: Request, res: Response) => {
    try {
      const reqData = req.body;
      if (!reqData.patientName || !reqData.hospitalId) {
        return res.status(400).json({ error: 'patientName and hospitalId are required' });
      }

      const saved = insertEmergencyRequest({
        ...reqData,
        id: reqData.id || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: reqData.createdAt || 'Just now',
        updatedAt: 'Just now',
        timeline: reqData.timeline || [
          {
            time: 'Just now',
            title: 'Bed Hold Initiated',
            description: `Emergency hold placed at ${reqData.hospitalName}.`,
            role: 'Intake System',
          },
        ],
      });

      console.log(`[SQL Emergency] New request recorded: ${saved.id} for ${saved.patientName}`);
      res.status(201).json(saved);
    } catch (err: any) {
      console.error('Error recording emergency request:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update SLA decision (Accept & Hold, Reject & Auto-Reroute)
  app.patch('/api/requests/:id/sla', (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'status is required' });
      const ok = updateRequestSla(req.params.id, status);
      res.json({ success: ok, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // REST API: User Login & Session Activity Logs
  // -------------------------------------------------------------

  // Get user login audit logs (who logged in, role, hospital, timestamp)
  app.get('/api/user-logs', (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = getUserLoginLogs(limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Record user login into SQL database
  app.post('/api/user-logs', (req: Request, res: Response) => {
    try {
      const { userName, phone, role, hospitalId, hospitalName, station, status } = req.body;
      if (!userName || !role) {
        return res.status(400).json({ error: 'userName and role are required' });
      }
      const savedLog = insertUserLoginLog({
        userName,
        phone,
        role,
        hospitalId,
        hospitalName,
        station,
        status: status || 'active',
      });
      console.log(`[SQL Auth Audit] Logged user session: ${savedLog.userName} (${savedLog.role})`);
      res.status(201).json(savedLog);
    } catch (err: any) {
      console.error('Error logging user session:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // REST API: Patient Admissions, Confirmation & Discharge Registry
  // -------------------------------------------------------------

  // Get all patient lifecycle records
  app.get('/api/patient-records', (req: Request, res: Response) => {
    try {
      const patients = getAllPatientRecords();
      res.json(patients);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single patient record
  app.get('/api/patient-records/:id', (req: Request, res: Response) => {
    try {
      const pat = getPatientRecordById(req.params.id);
      if (!pat) return res.status(404).json({ error: 'Patient record not found' });
      res.json(pat);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create new patient record (when registered/logged in or emergency admission)
  app.post('/api/patient-records', (req: Request, res: Response) => {
    try {
      const patData = req.body;
      if (!patData.patientName || !patData.contactPhone) {
        return res.status(400).json({ error: 'patientName and contactPhone are required' });
      }
      const saved = insertPatientRecord(patData);
      console.log(`[SQL Patient Registry] Registered patient: ${saved.patientName} (${saved.id})`);
      res.status(201).json(saved);
    } catch (err: any) {
      console.error('Error inserting patient record:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update hospital confirmation (when hospital confirms bed hold & admission)
  app.patch('/api/patient-records/:id/confirm', (req: Request, res: Response) => {
    try {
      const { hospitalId, hospitalName, bedType, bedNumber } = req.body;
      if (!hospitalId || !hospitalName) {
        return res.status(400).json({ error: 'hospitalId and hospitalName are required' });
      }
      const updated = updatePatientConfirmation(
        req.params.id,
        hospitalId,
        hospitalName,
        bedType || 'trauma',
        bedNumber
      );
      if (!updated) return res.status(404).json({ error: 'Patient record not found' });
      console.log(`[SQL Patient Registry] Patient ${updated.patientName} confirmed at ${hospitalName} (${bedNumber})`);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Discharge patient from hospital (when patient discharges)
  app.patch('/api/patient-records/:id/discharge', (req: Request, res: Response) => {
    try {
      const { dischargeTime, dischargeSummary, attendingDoctor } = req.body;
      const updated = dischargePatientRecord(
        req.params.id,
        dischargeTime,
        dischargeSummary,
        attendingDoctor
      );
      if (!updated) return res.status(404).json({ error: 'Patient record not found' });
      console.log(`[SQL Patient Registry] Patient ${updated.patientName} DISCHARGED from hospital`);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // REST API: Administrator Metrics & SQL Console
  // -------------------------------------------------------------

  // Administrator stats
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    try {
      const hospitals = getAllHospitals();
      const requests = getAllRequests();
      const userLogs = getUserLoginLogs();
      const patients = getAllPatientRecords();

      let totalIcu = 0;
      let availIcu = 0;
      let totalTrauma = 0;
      let availTrauma = 0;
      let totalBloodUnits = 0;

      for (const h of hospitals) {
        totalIcu += h.beds.icuTotal;
        availIcu += h.beds.icuAvailable;
        totalTrauma += h.beds.traumaTotal;
        availTrauma += h.beds.traumaAvailable;
        Object.values(h.bloodBank).forEach((u) => {
          totalBloodUnits += u;
        });
      }

      const activePatients = patients.filter(
        (p) => p.admissionStatus === 'confirmed_admitted' || p.admissionStatus === 'under_treatment'
      ).length;
      const dischargedPatients = patients.filter((p) => p.admissionStatus === 'discharged').length;

      const dbPath = path.resolve(__dirname, 'bedlink.sqlite');
      let dbSizeKb = 0;
      if (fs.existsSync(dbPath)) {
        dbSizeKb = Math.round(fs.statSync(dbPath).size / 1024);
      }

      res.json({
        totalHospitals: hospitals.length,
        totalRequests: requests.length,
        totalUserLogs: userLogs.length,
        totalPatients: patients.length,
        activePatients,
        dischargedPatients,
        icu: { total: totalIcu, available: availIcu },
        trauma: { total: totalTrauma, available: availTrauma },
        totalBloodUnits,
        dbEngine: 'SQLite (sql.js / WebAssembly on Node.js)',
        dbFileSizeKb: dbSizeKb,
        schemaFile: 'src/db/schema.sql',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Administrator: Run custom SQL Query / Table Explorer
  app.post('/api/admin/sql', (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'SQL query string required' });
      }
      const execution = executeRawSql(query);
      res.json(execution);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Administrator: Reset database to initial seed
  app.post('/api/admin/reset', (req: Request, res: Response) => {
    try {
      resetDatabaseToDefault();
      console.log('[SQL Admin] Reset database to default seed state');
      res.json({ success: true, message: 'Database reset to default schema and seed records' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'BedLink Emergency Backend API',
      database: 'SQLite',
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite Middlewares in Dev / Static in Prod)
  // -------------------------------------------------------------
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`BedLink Full-Stack Server listening on port ${port}`);
  });
}

startServer();
