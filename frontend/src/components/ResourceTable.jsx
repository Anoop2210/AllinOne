import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';

/**
 * Generic CRUD table for tenant-scoped resources (leads/contacts/deals).
 *
 * @param resource - API path segment, e.g. 'leads'
 * @param columns - [{ key, label }]
 * @param formFields - [{ key, label, type }] used for the add/edit modal
 * @param enableImportExport - shows CSV Import/Export buttons (currently only used for leads)
 */
export default function ResourceTable({ resource, columns, formFields, title, enableImportExport = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${resource}`, { params: { q: search, page, limit: 20 } });
      setRows(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load ${resource}`);
    } finally {
      setLoading(false);
    }
  }, [resource, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm(row);
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.patch(`/${resource}/${editing.id}`, form);
      } else {
        await api.post(`/${resource}`, form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/${resource}/${id}`);
    fetchData();
  }

  async function handleExport() {
    try {
      const res = await api.get(`/${resource}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resource}-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export. Please try again.');
    }
  }

  function handleImportClick() {
    setImportSummary(null);
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportSummary(null);
    try {
      const text = await file.text();
      const res = await api.post(`/${resource}/import`, { csv: text });
      setImportSummary(res.data.data);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="resource-page">
      <div className="resource-header">
        <h2>{title}</h2>
        <div className="resource-actions">
          <input
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          {enableImportExport && (
            <>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
              <button className="secondary-btn" onClick={handleImportClick} disabled={importing}>
                {importing ? 'Importing…' : 'Import CSV'}
              </button>
              <button className="secondary-btn" onClick={handleExport}>
                Export CSV
              </button>
            </>
          )}
          <button className="primary-btn" onClick={openCreate}>
            + Add {title.slice(0, -1)}
          </button>
        </div>
      </div>

      {importSummary && (
        <div className="hint-text" style={{ marginBottom: 16 }}>
          Import complete — {importSummary.created} created, {importSummary.skipped} skipped.
          {importSummary.errors.length > 0 && (
            <details style={{ marginTop: 6 }}>
              <summary>View {importSummary.errors.length} issue(s)</summary>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {importSummary.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1}>Loading...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1}>No records found.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{row[c.key]}</td>
                ))}
                <td className="row-actions">
                  <button onClick={() => openEdit(row)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(row.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editing ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}</h3>
            {formFields.map((f) => (
              <div key={f.key} className="form-row">
                <label>{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}