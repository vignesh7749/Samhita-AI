import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Building2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { DataQualityReport, ImportJobItem } from '../types';

interface ImportDataPageProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (tab: string) => void;
}

export const ImportDataPage: React.FC<ImportDataPageProps> = ({ onShowToast, onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cpseCode, setCpseCode] = useState('ONGC');
  const [validating, setValidating] = useState(false);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Section 6: Previous Import Jobs Tracking
  const [jobs, setJobs] = useState<ImportJobItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { num: 1, name: 'File Validation', desc: 'Encoding & format check' },
    { num: 2, name: 'Column Detection', desc: 'Mapping description & attributes' },
    { num: 3, name: 'Data Normalization', desc: 'Expanding domain acronyms' },
    { num: 4, name: 'AI Matching', desc: 'Harmonizing with master catalog' },
    { num: 5, name: 'Review Results', desc: 'Final audit & database commit' }
  ];

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await api.getImportJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load import jobs', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      onShowToast('Invalid File Type', 'Please upload a CSV or XLSX spreadsheet.', 'error');
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
    setActiveStep(0);
    setQualityReport(null);

    // Section 5: Run Pre-flight Data Quality Inspection
    setValidating(true);
    try {
      const report = await api.validateImportFile(file);
      setQualityReport(report);
      if (report.can_import) {
        onShowToast('File Pre-flight Passed', `${report.valid_rows} valid records detected ready for ingestion.`, 'info');
      } else {
        onShowToast('Validation Alert', 'Data quality issues detected. Review report before proceeding.', 'error');
      }
    } catch (err: any) {
      onShowToast('Validation Error', err.message || 'Unable to inspect file.', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setActiveStep(1);

    // Simulated visual step progression
    setTimeout(() => setActiveStep(2), 350);
    setTimeout(() => setActiveStep(3), 700);
    setTimeout(() => setActiveStep(4), 1100);

    try {
      const data = await api.executeImportUpload(selectedFile, cpseCode);
      setTimeout(() => {
        setActiveStep(5);
        setImportResult(data);
        setUploading(false);
        onShowToast(
          'Batch Import Successful',
          `Standardized ${data.matched_records || data.successful_records} records for ${data.cpse}!`,
          'success'
        );
        fetchJobs(); // Refresh job history
      }, 1500);
    } catch (err: any) {
      setUploading(false);
      onShowToast('Import Failed', err.message, 'error');
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'material_code,description,cpse,category,uom,manufacturer,part_number\n' +
      'DEMO-BOLT-101,HEX BOLT M10 X 50 SS,ONGC,Fasteners,NOS,Unbrako,UB-M1050\n' +
      'DEMO-BRG-202,BEARING BALL 6205 2RS,BHEL,Bearings,NOS,SKF,6205-2RS\n' +
      'DEMO-VLV-303,GATE VLV 2" CL150 WCB FLANGED,NTPC,Valves,NOS,Audco,GV-150-2\n' +
      'DEMO-MTR-404,IND MTR 15HP 415V 1440RPM TEFC,SAIL,Electric Motors,NOS,Siemens,1LE0\n' +
      'DEMO-CBL-505,CBL 4C X 16 SQMM AL ARMOURED 1.1KV,IOCL,Cables,MTR,Polycab,4C16-AL';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SAMHITA_Demo_Material_Catalog.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Intelligent Data Ingestion &amp; Quality Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stage 4 automated CSV/XLSX column mapping, data quality pre-flight inspection, and job tracking.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {/* Target CPSE Selector Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block mb-0.5">
            Target CPSE Enterprise Source
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Source organization for the uploaded procurement records
          </p>
        </div>

        <select
          value={cpseCode}
          onChange={(e) => setCpseCode(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 sm:w-64"
        >
          <option value="ONGC">ONGC — Oil and Natural Gas Corporation</option>
          <option value="BHEL">BHEL — Bharat Heavy Electricals Limited</option>
          <option value="NTPC">NTPC — National Thermal Power Corporation</option>
          <option value="SAIL">SAIL — Steel Authority of India Limited</option>
          <option value="IOCL">IOCL — Indian Oil Corporation Limited</option>
        </select>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          dragOver
            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
            : selectedFile
            ? 'border-emerald-300 bg-emerald-50/20 dark:border-emerald-800 dark:bg-emerald-950/20'
            : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-850'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.xlsx,.xls"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {selectedFile ? (
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-1">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-400 mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>
          )}

          {selectedFile ? (
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedFile.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click or drag to replace
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                Drag and drop your CSV or Excel file here
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                or <span className="text-blue-700 dark:text-blue-400 font-semibold underline">browse files</span> from your computer
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Supported formats: CSV, XLSX &bull; Auto-detects columns: Description, Code, Category, UOM
          </div>
        </div>
      </div>

      {/* SECTION 5: DATA QUALITY REPORT CARD */}
      {validating && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Executing automated column detection &amp; pre-flight data quality inspection...</span>
        </div>
      )}

      {qualityReport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Section 5 — Pre-Flight Data Quality Report
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pre-ingestion validation for {selectedFile?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {qualityReport.can_import ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validation Passed</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Action Required</span>
                </span>
              )}
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Total Rows</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{qualityReport.total_rows}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider block">Valid Rows</span>
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">{qualityReport.valid_rows}</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Invalid Rows</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{qualityReport.invalid_rows}</span>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider block">Duplicates</span>
              <span className="text-base font-bold text-amber-800 dark:text-amber-300">{qualityReport.duplicate_rows}</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Missing Desc</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{qualityReport.missing_descriptions}</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Missing Codes</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{qualityReport.missing_codes}</span>
            </div>
          </div>

          {/* Detected Columns Mapping Badges */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
              Automated Column Detection (Section 4):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(qualityReport.detected_columns).map(([standardField, mappedCol]) => (
                <div key={standardField} className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 block font-mono text-[10px] uppercase">{standardField}</span>
                  <span className={`font-semibold mt-0.5 block truncate ${mappedCol ? 'text-slate-900 dark:text-slate-100' : 'text-amber-600 dark:text-amber-400 italic'}`}>
                    {mappedCol ? `"${mappedCol}"` : 'Not detected'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Issues Alert List if any */}
          {qualityReport.potential_issues && qualityReport.potential_issues.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Detected Data Quality Anomalies ({qualityReport.potential_issues.length})</span>
              </div>
              <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 text-[11px] space-y-0.5">
                {qualityReport.potential_issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ingest Execution Button */}
          {qualityReport.can_import && !uploading && !importResult && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleStartImport}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm &amp; Execute Harmonization Ingestion</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5-Step Pipeline Progress Indicator */}
      {(uploading || importResult) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Harmonization Ingestion Pipeline Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            {steps.map((st) => {
              const isDone = activeStep > st.num || (importResult && activeStep >= st.num);
              const isCurrent = activeStep === st.num && uploading;

              return (
                <div
                  key={st.num}
                  className={`p-3 rounded border transition ${
                    isDone
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : isCurrent
                      ? 'border-blue-400 bg-blue-50/50 text-blue-900 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                      : 'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                        {st.num}
                      </span>
                    )}
                    <span className="font-bold text-xs">Step {st.num}</span>
                  </div>
                  <div className="font-semibold">{st.name}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{st.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import Results Summary & Preview Table */}
      {importResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bulk Harmonization Completed Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {importResult.file_name} processed for {importResult.cpse}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('materials')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded transition"
            >
              <span>View in Master Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Total Ingested</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{importResult.total_records}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">NLP Normalized</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{importResult.normalized_records}</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-100 dark:border-emerald-900/60">
              <span className="text-emerald-700 dark:text-emerald-400 block">AI Standardized</span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{importResult.matched_records || importResult.successful_records}</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-100 dark:border-blue-900/60">
              <span className="text-blue-700 dark:text-blue-400 block">Harmonization Rate</span>
              <span className="text-lg font-bold text-blue-800 dark:text-blue-300">{importResult.standardization_rate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: IMPORT JOB TRACKING TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Section 6 — Ingestion Job Tracking &amp; History
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Audit record of all batch catalog imports across CPSE organizations
            </p>
          </div>

          <button
            onClick={fetchJobs}
            disabled={loadingJobs}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
          >
            <RefreshCw className={`w-3 h-3 ${loadingJobs ? 'animate-spin' : ''}`} />
            <span>Refresh Jobs</span>
          </button>
        </div>

        {loadingJobs ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">Loading import job records...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">No import jobs recorded yet.</div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2.5">Job ID</th>
                  <th className="p-2.5">File Name</th>
                  <th className="p-2.5">CPSE</th>
                  <th className="p-2.5">Uploaded By</th>
                  <th className="p-2.5 text-center">Total Rows</th>
                  <th className="p-2.5 text-center">Matched</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400 font-semibold">#{j.id}</td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-200">{j.file_name}</td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{j.cpse_code}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{j.uploaded_by}</td>
                    <td className="p-2.5 text-center text-slate-800 dark:text-slate-200">{j.total_records}</td>
                    <td className="p-2.5 text-center text-emerald-700 dark:text-emerald-400 font-semibold">{j.matched_records || j.successful_records}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        j.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : j.status === 'completed_with_issues'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {j.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(j.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
