import ResourceTable from '../components/ResourceTable';

export default function Leads() {
  return (
    <ResourceTable
      resource="leads"
      title="Leads"
      enableImportExport
      columns={[
        { key: 'full_name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'company_name', label: 'Company' },
        { key: 'status', label: 'Status' },
        { key: 'source', label: 'Source' },
      ]}
      formFields={[
        { key: 'full_name', label: 'Full Name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'company_name', label: 'Company' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'],
        },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
