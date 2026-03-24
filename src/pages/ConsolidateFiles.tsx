import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, FileText, Download, CheckSquare, Square, Filter, Layers, Calendar, GraduationCap, ChevronDown, ChevronUp, Eye, X, ExternalLink } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { api } from '../services/api';
import { Area, FileUploadMetadata } from '../types/area';
import { sortAreasByNumber } from '../utils/sorting';

interface FlatFile {
  areaName: string;
  criteriaCode: string;
  criteriaDesc: string;
  subcriteriaCode?: string;
  subcriteriaDesc?: string;
  upload: FileUploadMetadata;
  fileUrl: string;
}

function getFileUrl(upload: FileUploadMetadata): string | null {
  const fileData = Array.isArray(upload.fileUpload) ? upload.fileUpload[0] : upload.fileUpload;
  const url = (fileData as any)?.url || (fileData as any)?.data?.attributes?.url || (Array.isArray((fileData as any)?.data) ? (fileData as any)?.data[0]?.attributes?.url : undefined);
  if (!url) return null;
  return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:1337'}${url}`;
}

function PdfViewerModal({ url, fileName, onClose }: { url: string; fileName: string; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      try {
        // If already a blob URL, use directly
        if (url.startsWith('blob:')) {
          setBlobUrl(url);
          setLoading(false);
          return;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const blob = await response.blob();
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
          setBlobUrl(googleViewerUrl);
          setLoading(false);
        }
      }
    };
    loadPdf();
    return () => {
      cancelled = true;
      // Only revoke if we created the objectUrl (not for passed-in blob URLs)
      if (objectUrl && !url.startsWith('blob:')) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 truncate">{fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-indigo-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </a>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-zinc-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading PDF...</p>
            </div>
          ) : (
            <iframe src={blobUrl || url} className="w-full h-full border-0" title={`PDF Viewer - ${fileName}`} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConsolidateFiles() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [viewingPdf, setViewingPdf] = useState<{ url: string; fileName: string } | null>(null);
  const [consolidatedBlobUrl, setConsolidatedBlobUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [areasData, programsResult, yearsResult] = await Promise.all([
        api.getAreas(token),
        api.getAcademicPrograms().catch(() => []),
        api.getAcademicYears(token).catch(() => []),
      ]);
      setAreas(areasData);
      setPrograms(programsResult);
      setYears(yearsResult);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter areas by selected program and year (now at area level)
  const filteredAreas = areas.filter(area => {
    if (selectedProgram && String(area.academic_program?.id) !== selectedProgram) return false;
    if (selectedYear && String(area.academic_year?.id) !== selectedYear) return false;
    return true;
  }).sort(sortAreasByNumber);

  // Flatten all files from filtered areas
  const flatFiles: FlatFile[] = [];
  filteredAreas.forEach(area => {
    area.areaCriteria?.forEach(criteria => {
      criteria.criteriaUploads?.forEach(upload => {
        const url = getFileUrl(upload);
        if (url) {
          flatFiles.push({
            areaName: area.area,
            criteriaCode: criteria.code,
            criteriaDesc: criteria.desc,
            upload,
            fileUrl: url,
          });
        }
      });
      criteria.subcriteria?.forEach(sub => {
        sub.subCriteriaUploads?.forEach(upload => {
          const url = getFileUrl(upload);
          if (url) {
            flatFiles.push({
              areaName: area.area,
              criteriaCode: criteria.code,
              criteriaDesc: criteria.desc,
              subcriteriaCode: sub.code,
              subcriteriaDesc: sub.desc,
              upload,
              fileUrl: url,
            });
          }
        });
      });
    });
  });

  // Group files by area
  const filesByArea: Record<string, FlatFile[]> = {};
  flatFiles.forEach(f => {
    if (!filesByArea[f.areaName]) filesByArea[f.areaName] = [];
    filesByArea[f.areaName].push(f);
  });

  const fileKey = (f: FlatFile) => `${f.areaName}|${f.criteriaCode}|${f.subcriteriaCode || ''}|${f.upload.id}`;

  const toggleFile = (key: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleArea = (areaName: string) => {
    const areaFiles = filesByArea[areaName] || [];
    const areaKeys = areaFiles.map(fileKey);
    const allSelected = areaKeys.every(k => selectedFiles.has(k));
    setSelectedFiles(prev => {
      const next = new Set(prev);
      areaKeys.forEach(k => { if (allSelected) next.delete(k); else next.add(k); });
      return next;
    });
  };

  const selectAll = () => {
    const allKeys = flatFiles.map(fileKey);
    const allSelected = allKeys.length > 0 && allKeys.every(k => selectedFiles.has(k));
    if (allSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allKeys));
    }
  };

  const toggleAreaExpand = (areaName: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaName)) next.delete(areaName);
      else next.add(areaName);
      return next;
    });
  };

  const buildMergedPdf = async () => {
    const selected = flatFiles.filter(f => selectedFiles.has(fileKey(f)));
    if (selected.length < 2) {
      alert('Please select at least 2 PDF files to consolidate.');
      return null;
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of selected) {
      const response = await fetch(file.fileUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${file.upload.fileName}`);
      const pdfBytes = await response.arrayBuffer();

      try {
        const sourcePdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      } catch (pdfErr) {
        throw new Error(`Failed to process "${file.upload.fileName}". It may be corrupted or not a valid PDF.`);
      }
    }

    const mergedBytes = await mergedPdf.save();
    return new Blob([mergedBytes], { type: 'application/pdf' });
  };

  const getConsolidatedFileName = () => {
    const programLabel = programs.find(p => String(p.id) === selectedProgram)?.programCode || 'ALL';
    const yearLabel = years.find(y => String(y.id) === selectedYear)?.schoolyear || 'ALL';
    return `Consolidated_${programLabel}_${yearLabel}.pdf`;
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const blob = await buildMergedPdf();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getConsolidatedFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to merge PDFs');
    } finally {
      setMerging(false);
    }
  };

  const handlePreviewConsolidated = async () => {
    setMerging(true);
    try {
      const blob = await buildMergedPdf();
      if (!blob) return;

      // Clean up previous blob URL
      if (consolidatedBlobUrl) URL.revokeObjectURL(consolidatedBlobUrl);
      const url = URL.createObjectURL(blob);
      setConsolidatedBlobUrl(url);
      setViewingPdf({ url, fileName: getConsolidatedFileName() });
    } catch (err: any) {
      alert(err.message || 'Failed to merge PDFs');
    } finally {
      setMerging(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Reviewed': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50 border border-rose-100 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-rose-900">Failed to load data</h3>
        <p className="text-rose-600/80">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all">
          Retry
        </button>
      </div>
    );
  }

  const allKeys = flatFiles.map(fileKey);
  const allSelected = allKeys.length > 0 && allKeys.every(k => selectedFiles.has(k));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {viewingPdf && (
        <PdfViewerModal
          url={viewingPdf.url}
          fileName={viewingPdf.fileName}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Consolidate Files</h1>
            <p className="text-zinc-500 text-sm">Select and merge PDF files into a single document.</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-indigo-600 rounded-xl hover:bg-zinc-50 transition-all shadow-sm">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <GraduationCap className="w-3.5 h-3.5" /> Academic Program
            </label>
            <select
              value={selectedProgram}
              onChange={e => { setSelectedProgram(e.target.value); setSelectedFiles(new Set()); }}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.programCode || p.attributes?.programCode}{p.programDesc ? ` - ${p.programDesc}` : p.attributes?.programDesc ? ` - ${p.attributes.programDesc}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" /> Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setSelectedFiles(new Set()); }}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">All Years</option>
              {years.map(y => (
                <option key={y.id} value={String(y.id)}>
                  {y.schoolyear || y.attributes?.schoolyear}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-indigo-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all"
          >
            {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-zinc-400 font-medium">
            {selectedFiles.size} of {flatFiles.length} file{flatFiles.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviewConsolidated}
            disabled={selectedFiles.size < 2 || merging}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleMerge}
            disabled={selectedFiles.size < 2 || merging}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
          >
            {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {merging ? 'Merging...' : 'Consolidate & Download'}
          </button>
        </div>
      </div>

      {/* File List */}
      {flatFiles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 border-dashed">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No uploaded files found for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filesByArea).map(([areaName, files]) => {
            const areaKeys = files.map(fileKey);
            const allAreaSelected = areaKeys.every(k => selectedFiles.has(k));
            const someAreaSelected = areaKeys.some(k => selectedFiles.has(k));
            const isExpanded = expandedAreas.has(areaName);

            return (
              <div key={areaName} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                {/* Area Header */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-50">
                  <button
                    onClick={() => toggleArea(areaName)}
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                      allAreaSelected ? 'bg-indigo-600 border-indigo-600 text-white' : someAreaSelected ? 'bg-indigo-100 border-indigo-400 text-indigo-600' : 'border-zinc-300 text-transparent hover:border-indigo-400'
                    }`}
                  >
                    {(allAreaSelected || someAreaSelected) && <CheckSquare className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => toggleAreaExpand(areaName)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-zinc-900 truncate">{areaName}</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>

                {/* File Rows */}
                {isExpanded && (
                  <div className="divide-y divide-zinc-50">
                    {files.map(f => {
                      const key = fileKey(f);
                      const isSelected = selectedFiles.has(key);
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 px-4 py-3 transition-all hover:bg-zinc-50 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                        >
                          <button
                            onClick={() => toggleFile(key)}
                            className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-300 text-transparent hover:border-indigo-400'
                            }`}
                          >
                            {isSelected && <CheckSquare className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => toggleFile(key)}
                            className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0"
                          >
                            <FileText className="w-4 h-4 text-zinc-400" />
                          </button>
                          <button
                            onClick={() => toggleFile(key)}
                            className="flex-1 min-w-0 overflow-hidden text-left"
                          >
                            <p className="text-sm font-bold text-zinc-900 truncate">{f.upload.fileName}</p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {f.criteriaCode}{f.subcriteriaCode ? ` > ${f.subcriteriaCode}` : ''}
                              {f.upload.uploader ? ` • By ${f.upload.uploader.username}` : ''}
                            </p>
                          </button>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${getStatusColor(f.upload.fileStatus)}`}>
                            {f.upload.fileStatus}
                          </span>
                          <button
                            onClick={() => setViewingPdf({ url: f.fileUrl, fileName: f.upload.fileName })}
                            className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shrink-0"
                            title="View PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
