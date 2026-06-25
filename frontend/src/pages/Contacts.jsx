import ResourceTable from '../components/ResourceTable';

export default function Contacts() {
  return (
    <ResourceTable
      resource="contacts"
      title="Contacts"
      columns={[
        { key: 'full_name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'company_name', label: 'Company' },
        { key: 'job_title', label: 'Job Title' },
      ]}
      formFields={[
        { key: 'full_name', label: 'Full Name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'company_name', label: 'Company' },
        { key: 'job_title', label: 'Job Title' },
        { key: 'address', label: 'Address' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
