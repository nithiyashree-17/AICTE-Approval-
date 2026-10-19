'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Upload,
  FolderPlus,
  Download,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { useDemo } from '@/features/context/DemoContext';
import { DocumentRecord, DocumentCategory, DocumentFormat } from '@/lib/types';

export default function DocumentsPage() {
  const { documents, addDocument } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [institutionFilter, setInstitutionFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadInst, setUploadInst] = useState('Sunrise Institute of Technology');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Application');
  const [uploadFormat, setUploadFormat] = useState<DocumentFormat>('pdf');
  const [uploadSize, setUploadSize] = useState('2.4 MB');

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.institution.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'All' || doc.category === categoryFilter;

      const matchesInstitution =
        institutionFilter === 'All' || doc.institution === institutionFilter;

      return matchesSearch && matchesCategory && matchesInstitution;
    });
  }, [documents, searchQuery, categoryFilter, institutionFilter]);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDocIds([]);
      setSelectAll(false);
    } else {
      setSelectedDocIds(filteredDocs.map((d) => d.id));
      setSelectAll(true);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) return;
    addDocument({
      name: uploadName.endsWith(`.${uploadFormat}`) ? uploadName : `${uploadName}.${uploadFormat}`,
      institution: uploadInst,
      category: uploadCategory,
      format: uploadFormat,
      size: uploadSize,
    });
    setUploadName('');
    setShowUploadModal(false);
  };

  const getFormatIcon = (format: DocumentFormat) => {
    switch (format) {
      case 'xlsx':
        return <FileSpreadsheet className="w-8 h-8 text-[#059669]" />;
      case 'zip':
        return <FileArchive className="w-8 h-8 text-[#8C653B]" />;
      case 'docx':
        return <FileText className="w-8 h-8 text-[#2563EB]" />;
      default:
        return <File className="w-8 h-8 text-[#DC2626]" />;
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    const dummyBlob = new Blob([`Demonstration statutory document archive for ${doc.name}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(dummyBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#8C653B]">
            REPOSITORY
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1816] mt-1">
            Document Repository
          </h1>
          <p className="text-xs text-[#736B5E] mt-1">
            Central storage for all approval-related documents across 1,248 filings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('Folder creation action staged for statutory bucket.')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1A1816] bg-white border border-[#EAE6DF] rounded-lg hover:bg-[#FAF8F5] transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#8C653B]" />
            NEW FOLDER
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1A1816] rounded-lg hover:bg-[#2d2821] shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            UPLOAD DOCUMENT
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 card-shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8274]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name or institution"
              className="pl-8 pr-4 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg w-full text-[#1A1816] placeholder-[#8C8274] focus:outline-none focus:border-[#8C653B]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-[#1A1816]"
          >
            <option value="All">All Categories</option>
            <option value="Application">Application</option>
            <option value="Compliance Report">Compliance Report</option>
            <option value="Audit Report">Audit Report</option>
            <option value="Certificate">Certificate</option>
          </select>

          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-[#1A1816]"
          >
            <option value="All">All institutions</option>
            {Array.from(new Set(documents.map((d) => d.institution))).map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          <span className="text-xs text-[#8C8274] px-2.5 py-1.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg">
            Last 30 days
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#EAE6DF] rounded-lg overflow-hidden p-0.5 bg-[#FAF8F5]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-white shadow-xs text-[#1A1816]'
                  : 'text-[#8C8274] hover:text-[#1A1816]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-white shadow-xs text-[#1A1816]'
                  : 'text-[#8C8274] hover:text-[#1A1816]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Select All Row */}
      <div className="flex items-center gap-2 text-xs text-[#736B5E] px-1">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-1.5 hover:text-[#1A1816]"
        >
          {selectAll ? (
            <CheckSquare className="w-3.5 h-3.5 text-[#1A1816]" />
          ) : (
            <Square className="w-3.5 h-3.5 text-[#8C8274]" />
          )}
          <span>Select All</span>
        </button>
        {selectedDocIds.length > 0 && (
          <span className="text-[11px] text-[#8C653B] font-semibold">
            ({selectedDocIds.length} selected)
          </span>
        )}
      </div>

      {/* Document Grid Cards matching Screenshot 5 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                className={`bg-white border rounded-xl p-4 card-shadow flex flex-col justify-between transition-all group ${
                  isSelected ? 'border-[#1A1816] ring-1 ring-[#1A1816]' : 'border-[#EAE6DF]'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#8C8274] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE6DF]">
                      {doc.format.toUpperCase()}
                    </span>
                    <button
                      onClick={() => toggleSelectDoc(doc.id)}
                      className="text-[#8C8274] hover:text-[#1A1816]"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#1A1816]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Centered Document Icon */}
                  <div className="py-6 flex items-center justify-center">
                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] group-hover:scale-105 transition-transform">
                      {getFormatIcon(doc.format)}
                    </div>
                  </div>

                  {/* Document Name & Institution */}
                  <div className="space-y-1">
                    <h4
                      title={doc.name}
                      className="text-xs font-bold text-[#1A1816] truncate"
                    >
                      {doc.name}
                    </h4>
                    <p className="text-[11px] text-[#736B5E] truncate">
                      {doc.institution}
                    </p>
                  </div>

                  {/* Category Tag & Size */}
                  <div className="flex items-center justify-between text-[10px] pt-3 text-[#8C8274]">
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] text-[#736B5E] font-medium">
                      {doc.category}
                    </span>
                    <span>{doc.size}</span>
                  </div>
                </div>

                {/* Bottom Row: Date & Download Button */}
                <div className="pt-3 mt-3 border-t border-[#F2ECE2] flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#8C8274]">
                    {doc.date}
                  </span>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#8C653B] hover:text-[#1A1816] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    DOWNLOAD
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-[#EAE6DF] rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF] text-[#8C8274] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#1A1816] flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-[#FAF8F5] border border-[#EAE6DF] px-1 py-0.5 rounded">
                      {doc.format}
                    </span>
                    {doc.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#5C5449]">{doc.institution}</td>
                  <td className="py-3.5 px-4 text-[#736B5E]">{doc.category}</td>
                  <td className="py-3.5 px-4 text-[#8C8274] font-mono">{doc.size}</td>
                  <td className="py-3.5 px-4 text-[#8C8274] font-mono">{doc.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="text-xs font-bold text-[#8C653B] hover:text-[#1A1816]"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 bg-white border border-[#EAE6DF] rounded-xl card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#736B5E]">
        <span>Showing 1-8 of 1,248 documents</span>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
            &lt; PREVIOUS
          </button>
          <button className="px-2.5 py-1 rounded bg-[#1A1816] text-white font-bold">
            1
          </button>
          <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
            2
          </button>
          <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
            3
          </button>
          <span className="px-1 text-[#8C8274]">...</span>
          <button className="px-2.5 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
            156
          </button>
          <button className="px-3 py-1 rounded border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5]">
            NEXT &gt;
          </button>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-lg w-full p-6 shadow-dropdown space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
              <h3 className="font-serif font-bold text-lg text-[#1A1816]">
                Upload Statutory Compliance Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#8C8274] hover:text-[#1A1816]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#8C8274]">
                  Document File Name
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Land_Affidavit_2026"
                  className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#8C8274]">
                  Target Institution
                </label>
                <select
                  value={uploadInst}
                  onChange={(e) => setUploadInst(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg bg-white"
                >
                  <option value="Sunrise Institute of Technology">
                    Sunrise Institute of Technology
                  </option>
                  <option value="Greenfield College of Engineering">
                    Greenfield College of Engineering
                  </option>
                  <option value="St. Xavier's Technical Campus">
                    St. Xavier's Technical Campus
                  </option>
                  <option value="National Institute of Skill Development">
                    National Institute of Skill Development
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#8C8274]">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg bg-white"
                  >
                    <option value="Application">Application</option>
                    <option value="Compliance Report">Compliance Report</option>
                    <option value="Audit Report">Audit Report</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#8C8274]">
                    Format
                  </label>
                  <select
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value as any)}
                    className="w-full mt-1 p-2 text-xs border border-[#EAE6DF] rounded-lg bg-white"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="zip">Archive (.zip)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-xs text-[#736B5E]">
                Files are cryptographically checksummed and stored in S3-compatible secure vaults.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1A1816] text-white font-bold text-xs rounded-lg hover:bg-[#333] transition-colors"
              >
                Upload &amp; Store Document
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
